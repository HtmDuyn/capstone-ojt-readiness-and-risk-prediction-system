import { readTransaction } from './read.repository';
import { invalid, pagination, positiveId, requiredText, enumValue } from '../students/student.validation';
import type { Actor, Row } from '../ojt-registration/window.service';
import { calculatedEligibilitySql } from '../eligibility/frontend-results.service';

export async function eligibleStudents(params: Row, actor: Actor) {
  if (!['ADMIN', 'OJT_COORD'].includes(actor.roleCode))
    throw invalid('Only QHDN staff can view the eligible roster.', 403, 'FORBIDDEN');
  const page = pagination(params, [
    'ojtSemesterId', 'studentId', 'handoffId', 'programId', 'cohortId',
    'groupCode', 'search', 'registrationStatus',
  ]);
  const args: unknown[] = [];
  const where: string[] = [
    `s."DeletedAt" IS NULL`,
    `s."Status"='ACTIVE'`,
    `u."Status"='ACTIVE'`,
    `saved."Status"='ELIGIBLE'`,
    `latest_ojt202."Status" IS DISTINCT FROM 'PASSED'`,
    `COALESCE((((${calculatedEligibilitySql('s')}) ->> 'isStale')::boolean),true)=false`,
  ];
  const add = (column: string, value: unknown) => {
    args.push(value);
    where.push(`${column}=$${args.length}`);
  };
  for (const [key, column] of Object.entries({
    ojtSemesterId: 'target."OJTSemesterID"', studentId: 's."StudentID"',
    programId: 's."ProgramID"', cohortId: 'placement."CohortID"',
  })) if (params[key] !== undefined) add(column, positiveId(params[key], key));
  if (params.handoffId !== undefined) {
    args.push(positiveId(params.handoffId, 'handoffId'));
    where.push(`EXISTS (SELECT 1 FROM ojt_history."StudentEligibilityItems" history WHERE history."HandoffID"=$${args.length}
      AND history."StudentID"=s."StudentID" AND history."OJTSemesterID"=target."OJTSemesterID")`);
  }
  if (params.groupCode !== undefined) add('placement."GroupCode"', enumValue(params.groupCode, ['A','B','C','D'], 'groupCode'));
  const registrationStatus = `CASE WHEN r."Status"='HANDED_OFF' THEN 'LEGACY_REVIEW_REQUIRED'
    ELSE COALESCE(r."Status",'NOT_REGISTERED') END`;
  if (params.registrationStatus !== undefined) add(registrationStatus,
    enumValue(params.registrationStatus, ['NOT_REGISTERED','SUBMITTED','APPROVED','REJECTED','LEGACY_REVIEW_REQUIRED'], 'registrationStatus'));
  if (params.search !== undefined) {
    args.push('%' + requiredText(params.search, 'search', 100) + '%');
    where.push(`(s."StudentCode" ILIKE $${args.length} OR u."FullName" ILIKE $${args.length} OR u."Email" ILIKE $${args.length})`);
  }
  return readTransaction(async client => {
    const from = `FROM "Students" s
      JOIN "Users" u ON u."UserID"=s."UserID"
      JOIN "StudentOJTCalculatedResults" saved ON saved."StudentID"=s."StudentID"
      LEFT JOIN LATERAL (
        SELECT history."Status"
        FROM "StudentCourseResults" history
        JOIN "Courses" course USING ("CourseID")
        LEFT JOIN "AcademicPeriods" period ON period."AcademicPeriodID"=history."AcademicPeriodID"
        WHERE history."StudentID"=s."StudentID" AND upper(btrim(course."CourseCode"))='OJT202'
        ORDER BY history."AttemptNumber" DESC,period."StartDate" DESC NULLS LAST,history."ResultID" DESC
        LIMIT 1
      ) latest_ojt202 ON true
      LEFT JOIN "TrainingPrograms" program ON program."ProgramID"=s."ProgramID"
      LEFT JOIN "StudentAcademicPlacements" placement ON placement."StudentID"=s."StudentID"
      LEFT JOIN "Cohorts" cohort ON cohort."CohortID"=placement."CohortID"
      LEFT JOIN LATERAL (
        SELECT o."OJTSemesterID"
        FROM "RecruitmentWindows" open_window
        JOIN "OJTSemesters" o ON o."OJTSemesterID"=open_window."OJTSemesterID"
        WHERE o."Status" NOT IN ('CLOSED','ARCHIVED')
          AND open_window."Status"='OPEN' AND open_window."ResultsFinalizedAt" IS NULL
          AND COALESCE(open_window."ApplicationStartsAt",open_window."StartsAt")<=statement_timestamp()
          AND open_window."EndsAt">statement_timestamp()
          AND COALESCE(open_window."ApplicationEndsAt",open_window."EndsAt")>statement_timestamp()
          AND EXISTS (
            SELECT 1 FROM "ProgramCourses" pc
            JOIN "Courses" course USING ("CourseID")
            JOIN "TrainingPrograms" curriculum USING ("ProgramID")
            WHERE pc."ProgramID"=s."ProgramID" AND curriculum."Status"='PUBLISHED'
              AND upper(btrim(course."CourseCode"))='OJT202'
              AND pc."EntryKind"='COURSE' AND pc."RecommendedSemester"=6
          )
        ORDER BY COALESCE(open_window."ApplicationStartsAt",open_window."StartsAt"),open_window."WindowID"
        LIMIT 1
      ) open_target ON true
      LEFT JOIN "OJTSemesters" target ON target."OJTSemesterID"=COALESCE(
        open_target."OJTSemesterID",
        (SELECT default_term."OJTSemesterID" FROM "OJTSemesters" default_term
         WHERE default_term."AcademicPeriodID"=public."DefaultOJTAcademicPeriod"(s."StudentID") LIMIT 1)
      )
      LEFT JOIN LATERAL (
        SELECT registration.* FROM "OJTRegistrations" registration
        WHERE registration."StudentID"=s."StudentID" AND registration."OJTSemesterID"=target."OJTSemesterID"
        ORDER BY registration."RegistrationID" DESC LIMIT 1
      ) r ON true
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}`;
    const total = (await client.query(`SELECT count(*)::int AS total ${from}`, args)).rows[0].total;
    const items = (await client.query(`SELECT s."StudentID" AS id,s."StudentID" AS "studentId",
      s."StudentCode" AS "studentCode",u."FullName" AS "fullName",u."Email" AS email,
      s."ProgramID" AS "programId",program."ProgramName" AS "programName",
      placement."CohortID" AS "cohortId",cohort."Name" AS "cohortName",placement."GroupCode" AS "groupCode",
      target."OJTSemesterID" AS "ojtSemesterId",target."Name" AS "semesterName",
      COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'resultId',history."ResultID",'courseCode',course."CourseCode",'courseName',course."CourseName",
        'semesterTaken',history."SemesterTaken",'periodName',period."Name",'score',history."Score",
        'grade',history."Grade",'status',history."Status")
        ORDER BY history."SemesterTaken",course."CourseCode",history."AttemptNumber")
        FROM "StudentCourseResults" history
        JOIN "Courses" course USING ("CourseID")
        LEFT JOIN "AcademicPeriods" period USING ("AcademicPeriodID")
        WHERE history."StudentID"=s."StudentID"
      ),'[]'::jsonb) AS "academicHistory",
      r."RegistrationID" AS "registrationId",${registrationStatus} AS "registrationStatus"
      ${from} ORDER BY s."StudentCode",s."StudentID"
      LIMIT $${args.length + 1} OFFSET $${args.length + 2}`, [...args,page.limit,page.offset])).rows;
    return { ojtSemesterId: params.ojtSemesterId === undefined ? null : Number(params.ojtSemesterId),
      items,total,page:page.page,limit:page.limit };
  });
}
