import { latestEffectiveOjtCondition } from '../eligibility/ojt-policy.service';
import type { PoolClient } from 'pg';
import { readTransaction } from '../qhdn/read.repository';
import { invalid, positiveId } from '../students/student.validation';
import { loadAcademicProgress, progressFromData } from '../students/academic-progress';
import { activeRule, evaluateEligibility } from '../eligibility/eligibility.service';
import { ownStudent, type Actor, type Row } from './shared';
import { summaryWithClient } from './academic.service';
import { buildRiskAndRoadmap } from './ojt-risk.service';
import { coursePlanWithClient } from './course-plan.service';
import type { AssessmentReadContext } from './assessment-read-context';

// Show this student's study periods and any upcoming semester with a recorded OJT enrollment.
export async function studyPeriodsWithClient(c: PoolClient, student: Row) {
  const items = (await c.query(`WITH owner AS (
    SELECT placement.*,COALESCE(parent."AcademicPeriodID",current_period."AcademicPeriodID") AS current_id,
      COALESCE(parent."StartDate",current_period."StartDate") AS current_start
    FROM "Students" s LEFT JOIN "StudentAcademicPlacements" placement ON placement."StudentID"=s."StudentID"
    LEFT JOIN "AcademicPeriods" current_period ON current_period."AcademicPeriodID"=placement."CurrentAcademicPeriodID"
    LEFT JOIN "AcademicPeriods" parent ON parent."AcademicPeriodID"=current_period."ParentPeriodID"
    WHERE s."StudentID"=$1
  ), candidates AS (
    SELECT p.*,owner.current_id,ojt.enrolled AS "hasOjtEnrollment",
      COALESCE("StudentCurriculumSemester"($1,p."AcademicPeriodID"),
        (SELECT max(r."SemesterTaken") FROM "StudentCourseResults" r JOIN "AcademicPeriods" rp ON rp."AcademicPeriodID"=r."AcademicPeriodID"
          WHERE r."StudentID"=$1 AND COALESCE(rp."ParentPeriodID",rp."AcademicPeriodID")=p."AcademicPeriodID"),
        CASE WHEN p."AcademicPeriodID"=owner.current_id THEN $2::int END) AS stage
    FROM "AcademicPeriods" p CROSS JOIN owner
    CROSS JOIN LATERAL (
      SELECT EXISTS (
        SELECT 1 FROM "StudentCourseResults" r JOIN "Courses" c USING ("CourseID")
        WHERE r."StudentID"=$1 AND r."AcademicPeriodID"=p."AcademicPeriodID"
          AND r."SourceReference"='AUTO_OJT_ENROLLMENT' AND r."Status"='IN_PROGRESS'
          AND upper(c."CourseCode")='OJT202'
      ) AS enrolled
    ) ojt
    WHERE p."Kind"='SEMESTER' AND (ojt.enrolled OR (
      p."StartDate"<=(statement_timestamp() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
      AND (owner.current_start IS NULL OR p."StartDate"<=owner.current_start)))
      AND (p."AcademicPeriodID"=owner.current_id
        OR EXISTS (SELECT 1 FROM "CohortCurriculumPeriods" plan WHERE plan."CohortID"=owner."CohortID" AND plan."GroupCode"=owner."GroupCode" AND plan."AcademicPeriodID"=p."AcademicPeriodID")
        OR EXISTS (SELECT 1 FROM "StudentCourseResults" r JOIN "AcademicPeriods" rp ON rp."AcademicPeriodID"=r."AcademicPeriodID" WHERE r."StudentID"=$1 AND COALESCE(rp."ParentPeriodID",rp."AcademicPeriodID")=p."AcademicPeriodID"))
  ) SELECT "AcademicPeriodID" AS id,"PeriodCode" AS code,"Name" AS name,
    to_char("StartDate",'YYYY-MM-DD') AS "startDate",to_char("EndDate",'YYYY-MM-DD') AS "endDate",
    stage AS "curriculumSemester","hasOjtEnrollment",
    COALESCE("AcademicPeriodID"=current_id AND "EndDate">=(statement_timestamp() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date,false) AS "isCurrent"
    FROM candidates ORDER BY "StartDate" DESC,"AcademicPeriodID" DESC`, [student.StudentID, student.CurrentSemester])).rows;
  return { items, currentAcademicPeriodId: items.find(item => item.isCurrent)?.id ?? items[0]?.id ?? null };
}

export async function studyPeriods(params: Row, actor: Actor) {
  if (Object.keys(params).length) throw invalid('This endpoint does not accept query parameters.');
  return readTransaction(async c => studyPeriodsWithClient(c, await ownStudent(c, actor)));
}

// A retake does not count as a second subject in the same recorded semester.
export function inferStudySemester(attempts: Awaited<ReturnType<typeof loadAcademicProgress>>['attempts']): number | null {
  const subjectsBySemester = new Map<number, Set<number>>();
  let latest: number | null = null;
  for (const { courseId, semesterTaken, status } of attempts) {
    if (!Number.isInteger(semesterTaken) || semesterTaken < 0 || semesterTaken > 9
      || !['IN_PROGRESS', 'PASSED', 'FAILED', 'RECOGNIZED'].includes(status)) continue;
    const subjects = subjectsBySemester.get(semesterTaken) ?? new Set<number>();
    subjects.add(courseId);
    subjectsBySemester.set(semesterTaken, subjects);
    if (subjects.size >= 2 && (latest === null || semesterTaken > latest)) latest = semesterTaken;
  }
  return latest;
}

export async function studyOverview(params: Row, actor: Actor) {
  for (const key of Object.keys(params)) if (!['academicPeriodId', 'view'].includes(key)) throw invalid(`Unknown study parameter: ${key}.`);
  if (params.view !== undefined && params.view !== 'current') throw invalid('Unknown study view.');
  const live = params.view === 'current';
  if (live && params.academicPeriodId !== undefined) throw invalid('Current academic data does not accept a period filter.');
  const requested = live ? null : positiveId(params.academicPeriodId, 'academicPeriodId');
  return readTransaction(async c => {
    const student = await ownStudent(c, actor);
    const catalog = await studyPeriodsWithClient(c, student);
    const period: Row | null = catalog.items.find(item => live ? item.isCurrent : item.id === requested) ?? null;
    if (!live && !period) throw invalid('Chỉ được xem học kỳ đang học hoặc đã học của chính mình.', 404, 'STUDY_PERIOD_NOT_FOUND');
    const historical = !live && !period!.isCurrent;
    const cutoff = historical
      ? (await c.query(`SELECT to_char(LEAST(statement_timestamp() AT TIME ZONE 'Asia/Ho_Chi_Minh',($1::date+1)::timestamp-interval '1 microsecond'),'YYYY-MM-DD"T"HH24:MI:SS.US') AS cutoff`, [period!.endDate])).rows[0].cutoff as string
      : null;
    // Live reads include the latest grades, retakes and confirmed choices, with
    // no cutoff inherited from an expired academic period.
    const source = await loadAcademicProgress(c, student.StudentID, undefined, cutoff ?? undefined);
    const currentSemester = historical ? period!.curriculumSemester : inferStudySemester(source.attempts);
    const progress = progressFromData(source);
    // Resolve the single OJT target internally; it is not the student's study filter.
    const target = (await c.query(`SELECT COALESCE(
      (SELECT "OJTSemesterID" FROM "OJTRegistrations" WHERE "StudentID"=$1 ORDER BY "RegistrationID" DESC LIMIT 1),
      (SELECT o."OJTSemesterID" FROM "OJTSemesters" o
      WHERE o."AcademicPeriodID"="DefaultOJTAcademicPeriod"($1))) AS "OJTSemesterID"`, [student.StudentID])).rows[0]?.OJTSemesterID ?? null;
    const latestCondition = historical ? null : await latestEffectiveOjtCondition(c);
    const configuredRule = historical ? await activeRule(c, student.ProgramID, target ?? 0) : null;
    const rule = latestCondition ? { ...latestCondition, MaxUnpassedCourses: null } : configuredRule?.Status === 'PUBLISHED' && configuredRule.ProgramID === student.ProgramID
      && (configuredRule.OJTSemesterID === null || configuredRule.OJTSemesterID === target) ? configuredRule : null;
    const current = evaluateEligibility({ student, semester: { OJTSemesterID: target }, rule, progress, attempts: source.attempts, aliases: source.aliases });
    const reads: AssessmentReadContext = { source, studyPeriod: { curriculumSemester: currentSemester, referenceDate: cutoff ? new Date(cutoff + '+07:00') : new Date() } };
    const academic = await summaryWithClient(c, student.StudentID, target, source, { current, official: null }, reads, latestCondition ? rule : undefined);
    academic.academicWarning.computedAt = new Date().toISOString();
    // Historic terms are for transcripts and accumulated progress only.
    // Risk and the personal roadmap are evaluated only for the ongoing semester.
    let assessment: ReturnType<typeof buildRiskAndRoadmap> | null = null;
    if (!historical) {
      const canPlan = academic.earlyWarning.available && academic.academicWarning.level !== 'INSUFFICIENT_DATA';
      const plan = canPlan ? await coursePlanWithClient(c, student.StudentID, reads) : null;
      const identity = (await c.query('SELECT "FullName" FROM "Users" WHERE "UserID"=$1', [actor.userId])).rows[0];
      assessment = buildRiskAndRoadmap({ id: student.StudentID, fullName: identity.FullName, studentCode: student.StudentCode,
        currentSemester, ojtSemesterId: target, academic, academicProgress: progress }, plan);
    }
    const courseResults = source.attempts.map(item => ({ ...item, periodStartDate: item.periodStartDate instanceof Date
      ? `${item.periodStartDate.getFullYear()}-${String(item.periodStartDate.getMonth()+1).padStart(2,'0')}-${String(item.periodStartDate.getDate()).padStart(2,'0')}`
      : item.periodStartDate }));
    // The student transcript displays a weighted average of stored ten-point scores.
    const displayProgress = progressFromData({ ...source, policy: { GpaScale: 10 } }, false, false);
    return { period, currentSemester, historical, cutoff,
      academic: { ...academic, academicProgress: displayProgress, gpa: displayProgress.gpa,
        gpaScale: displayProgress.gpaScale, issues: displayProgress.issues,
        academicWarning: historical ? null : academic.academicWarning,
        earlyWarning: historical ? null : academic.earlyWarning }, assessment, courseResults,
      basis: historical ? 'STORED_GRADES_THROUGH_PERIOD_CURRENT_CURRICULUM' : 'CURRENT_STORED_ACADEMIC_DATA',
      note: historical && period?.hasOjtEnrollment
        ? 'Học kỳ này có bản ghi OJT202 đang học.'
        : historical
        ? 'Tiến độ và bảng điểm kỳ cũ được tính lại từ dữ liệu đang lưu theo khung hiện hành. Đánh giá rủi ro và lộ trình đề xuất luôn sử dụng học kỳ đang học.'
        : 'Tín chỉ, điều kiện, rủi ro và lộ trình được tính từ dữ liệu học vụ mới nhất và kỳ cao nhất có ít nhất hai môn khác nhau trong lịch sử học vụ.' };
  });
}
