import { readTransaction } from './read.repository';
import { invalid, pagination, positiveId, requiredText, enumValue } from '../students/student.validation';
import type { Actor, Row } from '../ojt-registration/window.service';

export async function eligibleStudents(params: Row, actor: Actor) {
  if (!['ADMIN', 'OJT_COORD'].includes(actor.roleCode))
    throw invalid('Only QHDN staff can view the eligible roster.', 403, 'FORBIDDEN');
  const page = pagination(params, [
    'ojtSemesterId', 'studentId', 'handoffId', 'programId', 'cohortId',
    'groupCode', 'search', 'registrationStatus', 'rosterStatus',
  ]);
  const args: unknown[] = [];
  const where: string[] = [];
  const add = (column: string, value: unknown) => {
    args.push(value);
    where.push(`${column}=$${args.length}`);
  };
  for (const [key, column] of Object.entries({
    ojtSemesterId: 'roster."OJTSemesterID"', studentId: 's."StudentID"',
    programId: 's."ProgramID"', cohortId: 'placement."CohortID"',
  })) if (params[key] !== undefined) add(column, positiveId(params[key], key));
  if (params.handoffId !== undefined) {
    args.push(positiveId(params.handoffId, 'handoffId'));
    where.push(`EXISTS (SELECT 1 FROM ojt_history."StudentEligibilityItems" history WHERE history."HandoffID"=$${args.length}
      AND history."StudentID"=s."StudentID" AND history."OJTSemesterID"=roster."OJTSemesterID")`);
  }
  if (params.groupCode !== undefined) add('placement."GroupCode"', enumValue(params.groupCode, ['A','B','C','D'], 'groupCode'));
  if (params.rosterStatus !== undefined) {
    const status = enumValue(params.rosterStatus, ['ASSIGNED','WAITING'], 'rosterStatus');
    where.push(status === 'ASSIGNED' ? 'roster."RoundID" IS NOT NULL' : 'roster."RoundID" IS NULL');
  }
  const registrationStatus = `CASE WHEN r."Status"='HANDED_OFF' THEN 'LEGACY_REVIEW_REQUIRED'
    ELSE COALESCE(r."Status",'NOT_REGISTERED') END`;
  if (params.registrationStatus !== undefined) add(registrationStatus,
    enumValue(params.registrationStatus, ['NOT_REGISTERED','SUBMITTED','APPROVED','REJECTED','LEGACY_REVIEW_REQUIRED'], 'registrationStatus'));
  if (params.search !== undefined) {
    args.push('%' + requiredText(params.search, 'search', 100) + '%');
    where.push(`(s."StudentCode" ILIKE $${args.length} OR u."FullName" ILIKE $${args.length} OR u."Email" ILIKE $${args.length})`);
  }
  return readTransaction(async client => {
    const from = `FROM "OJTRecruitmentRoster" roster
      JOIN "Students" s USING ("StudentID") JOIN "Users" u ON u."UserID"=s."UserID"
      LEFT JOIN "TrainingPrograms" program ON program."ProgramID"=s."ProgramID"
      LEFT JOIN "StudentAcademicPlacements" placement ON placement."StudentID"=s."StudentID"
      LEFT JOIN "Cohorts" cohort ON cohort."CohortID"=placement."CohortID"
      LEFT JOIN "RecruitmentWindows" round ON round."WindowID"=roster."RoundID"
      LEFT JOIN "OJTSemesters" term ON term."OJTSemesterID"=round."OJTSemesterID"
      LEFT JOIN "OJTRegistrations" r ON r."StudentID"=s."StudentID" AND r."OJTSemesterID"=roster."OJTSemesterID"
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}`;
    const total = (await client.query(`SELECT count(*)::int AS total ${from}`, args)).rows[0].total;
    const items = (await client.query(`SELECT s."StudentID" AS id,s."StudentID" AS "studentId",
      s."StudentCode" AS "studentCode",u."FullName" AS "fullName",u."Email" AS email,
      s."ProgramID" AS "programId",program."ProgramName" AS "programName",
      placement."CohortID" AS "cohortId",cohort."Name" AS "cohortName",placement."GroupCode" AS "groupCode",
      roster."OJTSemesterID" AS "ojtSemesterId",term."Name" AS "semesterName",
      roster."RoundID" AS "roundId",roster."RoundName" AS "roundName",roster."CheckedAt" AS "checkedAt",
      CASE WHEN roster."RoundID" IS NULL THEN 'WAITING' ELSE 'ASSIGNED' END AS "rosterStatus",
      COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'resultId',history."ResultID",'courseCode',course."CourseCode",'courseName',course."CourseName",
        'semesterTaken',history."SemesterTaken",'periodName',period."Name",'score',history."Score",
        'grade',history."Grade",'status',history."Status")
        ORDER BY history."SemesterTaken",course."CourseCode",history."AttemptNumber")
        FROM "StudentCourseResults" history
        JOIN "Courses" course USING ("CourseID")
        LEFT JOIN "AcademicPeriods" period USING ("AcademicPeriodID")
        WHERE history."StudentID"=s."StudentID"
          AND NOT (upper(btrim(course."CourseCode"))='OJT202' AND history."Status"='PASSED')
      ),'[]'::jsonb) AS "academicHistory",
      r."RegistrationID" AS "registrationId",${registrationStatus} AS "registrationStatus"
      ${from} ORDER BY roster."RoundID" NULLS LAST, s."StudentCode",s."StudentID"
      LIMIT $${args.length + 1} OFFSET $${args.length + 2}`, [...args,page.limit,page.offset])).rows;
    return { ojtSemesterId: params.ojtSemesterId === undefined ? null : Number(params.ojtSemesterId),
      items,total,page:page.page,limit:page.limit };
  });
}
