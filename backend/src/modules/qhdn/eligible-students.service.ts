import { readTransaction } from './read.repository';
import { invalid, pagination, positiveId, requiredText, enumValue } from '../students/student.validation';
import type { Actor, Row } from '../ojt-registration/window.service';

// This is the received academic roster, independent of OJT registration.
// Eligibility belongs to the saved frontend result or confirmed check used for handoff.
export async function eligibleStudents(params: Row, actor: Actor) {
  if (!['ADMIN', 'OJT_COORD'].includes(actor.roleCode)) {
    throw invalid('Only QHDN staff can view the handed-off eligible roster.', 403, 'FORBIDDEN');
  }
  const p = pagination(params, [
    'ojtSemesterId', 'studentId', 'handoffId', 'programId', 'cohortId',
    'groupCode', 'search', 'registrationStatus',
  ]);
  const semesterId = positiveId(params.ojtSemesterId, 'ojtSemesterId');
  if (p.offset > 2147483647) throw invalid('Pagination exceeds allowed range.');
  const args: unknown[] = [semesterId];
  const where = ['s."DeletedAt" IS NULL', `(i."CalculatedBatchID" IS NOT NULL AND batch."BatchID" IS NOT NULL
    AND i."Snapshot"->'calculatedEligibility'->>'status'='ELIGIBLE'
    OR i."CalculatedBatchID" IS NULL AND e."CheckID" IS NOT NULL AND confirmed."CheckID" IS NOT NULL)`];
  const add = (column: string, value: unknown) => {
    args.push(value);
    where.push(`${column}=$${args.length}`);
  };
  for (const [key, column] of Object.entries({
    studentId: 's."StudentID"', handoffId: 'h."HandoffID"',
    programId: 's."ProgramID"', cohortId: 'placement."CohortID"',
  })) {
    if (params[key] !== undefined) add(column, positiveId(params[key], key));
  }
  if (params.groupCode !== undefined) {
    add('placement."GroupCode"', enumValue(params.groupCode, ['A', 'B', 'C', 'D'], 'groupCode'));
  }
  if (params.registrationStatus !== undefined) {
    const status = enumValue(params.registrationStatus,
      ['NOT_REGISTERED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'LEGACY_REVIEW_REQUIRED'], 'registrationStatus');
    add(`CASE WHEN r."Status"='HANDED_OFF' THEN 'LEGACY_REVIEW_REQUIRED' ELSE COALESCE(r."Status",'NOT_REGISTERED') END`, status);
  }
  if (params.search !== undefined) {
    args.push('%' + requiredText(params.search, 'search', 100) + '%');
    where.push(`(s."StudentCode" ILIKE $${args.length} OR u."FullName" ILIKE $${args.length} OR u."Email" ILIKE $${args.length})`);
  }

  return readTransaction(async c => {
    const semester = (await c.query(`SELECT "OJTSemesterID" AS id,"SemesterCode" AS code,
      "Name" AS name,"AcademicYearID" AS "academicYearId","AcademicPeriodID" AS "academicPeriodId",
      to_char("StartDate",'YYYY-MM-DD') AS "startDate",to_char("EndDate",'YYYY-MM-DD') AS "endDate","Status" AS status
      FROM "OJTSemesters" WHERE "OJTSemesterID"=$1`, [semesterId])).rows[0];
    if (!semester) throw invalid('OJT semester not found.', 404, 'OJT_SEMESTER_NOT_FOUND');

    // Rank the handoffs before optional filters so legacy duplicates cannot page
    // the same student twice or make an old handoff appear to be the latest one.
    const from = `FROM (
      SELECT DISTINCT ON (hi."StudentID") hi.* FROM "EligibleStudentHandoffItems" hi
      WHERE hi."OJTSemesterID"=$1 ORDER BY hi."StudentID",hi."HandoffID" DESC
    ) i
    JOIN "EligibleStudentHandoffs" h ON h."HandoffID"=i."HandoffID"
      AND h."OJTSemesterID"=i."OJTSemesterID" AND h."RecipientRole"='OJT_COORD'
    LEFT JOIN "EligibilityChecks" e ON e."CheckID"=i."CheckID"
      AND e."StudentID"=i."StudentID" AND e."OJTSemesterID"=i."OJTSemesterID" AND e."Status"='ELIGIBLE'
    LEFT JOIN "EligibilityConfirmations" confirmed ON confirmed."CheckID"=e."CheckID"
    LEFT JOIN "OJTEligibilityResultBatches" batch ON batch."BatchID"=i."CalculatedBatchID"
    JOIN "Students" s ON s."StudentID"=i."StudentID"
    JOIN "Users" u ON u."UserID"=s."UserID"
    LEFT JOIN "TrainingPrograms" program ON program."ProgramID"=s."ProgramID"
    LEFT JOIN "StudentAcademicPlacements" placement ON placement."StudentID"=s."StudentID"
    LEFT JOIN "Cohorts" cohort ON cohort."CohortID"=placement."CohortID"
    LEFT JOIN "Users" sender ON sender."UserID"=h."CreatedBy"
    LEFT JOIN "OJTRegistrations" r ON r."StudentID"=s."StudentID" AND r."OJTSemesterID"=$1
    WHERE ${where.join(' AND ')}`;
    const total = (await c.query(`SELECT count(*)::int AS total ${from}`, args)).rows[0].total;
    const items = (await c.query(`SELECT s."StudentID" AS id,s."StudentID" AS "studentId",
      s."StudentCode" AS "studentCode",u."FullName" AS "fullName",u."Email" AS email,u."Phone" AS phone,
      s."Status" AS "studentStatus",u."Status" AS "accountStatus",$1::int AS "ojtSemesterId",
      s."ProgramID" AS "programId",program."ProgramCode" AS "programCode",program."ProgramName" AS "programName",
      placement."CohortID" AS "cohortId",cohort."Name" AS "cohortName",placement."GroupCode" AS "groupCode",
      'HANDED_OFF'::text AS "handoffStatus",
      jsonb_build_object('id',h."HandoffID",'createdAt',h."CreatedAt",'createdBy',h."CreatedBy",
        'createdByName',sender."FullName",'reason',h."Reason") AS handoff,
      CASE WHEN i."CalculatedBatchID" IS NOT NULL THEN i."Snapshot"->'calculatedEligibility'
        || jsonb_build_object('source','FRONTEND','batchId',i."CalculatedBatchID",'validity','AT_HANDOFF')
      ELSE jsonb_build_object('checkId',e."CheckID",'status',e."Status",'checkedAt',e."CheckedAt",
        'confirmedAt',confirmed."ConfirmedAt",'confirmedBy',confirmed."ConfirmedBy",
        'ruleSetId',e."RuleSetID",'earnedCredits',e."Result"->'earnedCredits',
        'missingCredits',e."Result"->'missingCredits','unpassedCourseCount',e."Result"->'unpassedCourseCount',
        'validity','AT_HANDOFF') END AS "eligibilityAtHandoff",
      r."RegistrationID" AS "registrationId",
      CASE WHEN r."Status"='HANDED_OFF' THEN 'LEGACY_REVIEW_REQUIRED'
        ELSE COALESCE(r."Status",'NOT_REGISTERED') END AS "registrationStatus",
      CASE WHEN r."RegistrationID" IS NULL THEN NULL ELSE jsonb_build_object(
        'id',r."RegistrationID",'windowId',r."WindowID",'registeredAt',r."RegisteredAt",
        'status',CASE WHEN r."Status"='HANDED_OFF' THEN 'LEGACY_REVIEW_REQUIRED' ELSE r."Status" END) END AS registration
      ${from} ORDER BY h."CreatedAt" DESC,h."HandoffID" DESC,s."StudentID"
      LIMIT $${args.length + 1} OFFSET $${args.length + 2}`, [...args, p.limit, p.offset])).rows;
    return { ojtSemesterId: semesterId, semester, items, total, page: p.page, limit: p.limit };
  });
}
