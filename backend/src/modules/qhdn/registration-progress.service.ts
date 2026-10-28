import { readTransaction } from './read.repository';
import { registrationApi, registrationSelect } from '../ojt-registration/registration.service';
import { invalid, pagination, positiveId, requiredText, enumValue } from '../students/student.validation';
import type { Actor, Row } from '../ojt-registration/window.service';
import { attachProgressDetails } from './registration-progress-detail.service';

// One row per handed-off student in the selected semester, including students
// with no registration. This projection never creates registrations or decisions.
export async function registrationProgress(params: Row, actor: Actor) {
  if (actor.roleCode !== 'OJT_COORD') throw invalid('QHDN role required.', 403, 'FORBIDDEN');
  const p = pagination(params, ['registrationId', 'studentId', 'ojtSemesterId', 'academicPeriodId', 'windowId', 'status', 'programId', 'cohortId', 'groupCode', 'search', 'handoffStatus', 'coordinationStatus', 'enterpriseId', 'assignmentStatus', 'historyPage', 'historyLimit', 'coordinationPage', 'coordinationLimit', 'assignmentPage', 'assignmentLimit']);
  const semesterId = positiveId(params.ojtSemesterId, 'ojtSemesterId');
  const detail = params.studentId !== undefined || params.registrationId !== undefined;
  const detailPage = (prefix: string) => {
    if (!detail && (params[prefix + 'Page'] !== undefined || params[prefix + 'Limit'] !== undefined)) throw invalid('Select studentId or registrationId before requesting detail pagination.');
    const value = pagination({ page: params[prefix + 'Page'], limit: params[prefix + 'Limit'] }, []);
    if (value.offset > 2147483647) throw invalid('Detail pagination exceeds allowed range.');
    return value;
  };
  const detailPages = { history: detailPage('history'), coordination: detailPage('coordination'), assignment: detailPage('assignment') };
  if (p.offset > 2147483647) throw invalid('Pagination exceeds allowed range.');
  const args: unknown[] = [semesterId], filters = ['s."DeletedAt" IS NULL'];
  const add = (column: string, value: unknown) => { args.push(value); filters.push(`${column}=$${args.length}`); };
  for (const [key, column] of Object.entries({ registrationId: 'r."RegistrationID"', studentId: 's."StudentID"', academicPeriodId: 'o."AcademicPeriodID"', windowId: 'r."WindowID"', programId: 's."ProgramID"', cohortId: 'placement."CohortID"' })) {
    if (params[key] !== undefined) add(column, positiveId(params[key], key));
  }
  const registrationStatus = `CASE WHEN r."Status"='HANDED_OFF' THEN 'LEGACY_REVIEW_REQUIRED' ELSE COALESCE(r."Status",'NOT_REGISTERED') END`;
  const coordinationStatus = `CASE WHEN co."CoordinationID" IS NULL THEN 'NOT_COORDINATED' WHEN upper(co."Decision") IN ('ACCEPTED','ACCEPT','APPROVED') THEN 'ACCEPTED' WHEN upper(co."Decision") IN ('REJECTED','REJECT') THEN 'REJECTED' ELSE 'PENDING' END`;
  if (params.status !== undefined) add(registrationStatus, enumValue(params.status, ['NOT_REGISTERED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'LEGACY_REVIEW_REQUIRED'], 'status'));
  if (params.coordinationStatus !== undefined) add(coordinationStatus, enumValue(params.coordinationStatus, ['NOT_COORDINATED', 'PENDING', 'ACCEPTED', 'REJECTED'], 'coordinationStatus'));
  if (params.enterpriseId !== undefined) add('co."EnterpriseID"', positiveId(params.enterpriseId, 'enterpriseId'));
  if (params.assignmentStatus !== undefined) add(`CASE WHEN assignment."AssignmentID" IS NULL THEN 'UNASSIGNED' ELSE COALESCE(upper(assignment."Status"),'ASSIGNED') END`, enumValue(params.assignmentStatus, ['UNASSIGNED', 'ASSIGNED', 'ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'CANCELED', 'FAILED'], 'assignmentStatus'));
  if (params.groupCode !== undefined) add('placement."GroupCode"', enumValue(params.groupCode, ['A', 'B', 'C', 'D'], 'groupCode'));
  if (params.handoffStatus !== undefined && enumValue(params.handoffStatus, ['HANDED_OFF', 'NOT_HANDED_OFF'], 'handoffStatus') === 'NOT_HANDED_OFF') filters.push('false');
  if (params.search !== undefined) {
    args.push('%' + requiredText(params.search, 'search', 100) + '%');
    filters.push(`(s."StudentCode" ILIKE $${args.length} OR u."FullName" ILIKE $${args.length} OR u."Email" ILIKE $${args.length})`);
  }
  return readTransaction(async c => {
    const term = (await c.query('SELECT "OJTSemesterID" AS id,"Name" AS name,"SemesterCode" AS code,"AcademicPeriodID" AS "academicPeriodId" FROM "OJTSemesters" WHERE "OJTSemesterID"=$1', [semesterId])).rows[0];
    if (!term) throw invalid('OJT semester not found.', 404, 'OJT_SEMESTER_NOT_FOUND');
    const from = `FROM (
      SELECT DISTINCT ON (i."StudentID") i.* FROM "EligibleStudentHandoffItems" i
      JOIN "EligibleStudentHandoffs" h ON h."HandoffID"=i."HandoffID" AND h."OJTSemesterID"=i."OJTSemesterID" AND h."RecipientRole"='OJT_COORD'
      WHERE i."OJTSemesterID"=$1 ORDER BY i."StudentID",i."HandoffID" DESC
    ) handed
    JOIN "Students" s ON s."StudentID"=handed."StudentID" JOIN "Users" u ON u."UserID"=s."UserID"
    JOIN "OJTSemesters" o ON o."OJTSemesterID"=handed."OJTSemesterID"
    LEFT JOIN "StudentAcademicPlacements" placement ON placement."StudentID"=s."StudentID"
    LEFT JOIN "TrainingPrograms" program ON program."ProgramID"=s."ProgramID"
    LEFT JOIN "Cohorts" cohort ON cohort."CohortID"=placement."CohortID"
    LEFT JOIN LATERAL (${registrationSelect} WHERE r."StudentID"=handed."StudentID" AND r."OJTSemesterID"=$1) r ON true
    LEFT JOIN LATERAL (SELECT * FROM "StudentEnterpriseCoordination" co WHERE co."RegistrationID"=r."RegistrationID" ORDER BY co."CoordinationID" DESC LIMIT 1) co ON true
    LEFT JOIN "Enterprises" coordinated_company ON coordinated_company."EnterpriseID"=co."EnterpriseID"
    LEFT JOIN "InternshipPositions" coordinated_position ON coordinated_position."PositionID"=co."PositionID"
    LEFT JOIN "InternshipAssignments" assignment ON assignment."CoordinationID"=co."CoordinationID"
    WHERE ${filters.join(' AND ')}`;
    const total = (await c.query(`SELECT count(*)::int AS total ${from}`, args)).rows[0].total;
    const rows = (await c.query(`SELECT s."StudentID" AS id,s."StudentID" AS "studentId",s."StudentCode" AS "studentCode",u."FullName" AS "fullName",u."Email" AS email,u."Phone" AS phone,
      s."Status" AS "studentStatus",u."Status" AS "accountStatus",s."ProgramID" AS "programId",program."ProgramCode" AS "programCode",program."ProgramName" AS "programName",
      placement."CohortID" AS "cohortId",cohort."Name" AS "cohortName",placement."GroupCode" AS "groupCode",$1::int AS "ojtSemesterId",
      handed."HandoffID" AS "handoffId",'HANDED_OFF'::text AS "handoffStatus",${registrationStatus} AS status,${coordinationStatus} AS "coordinationStatus",
      CASE WHEN r."RegistrationID" IS NULL THEN NULL ELSE to_jsonb(r) END AS "registrationRecord",
      CASE WHEN co."CoordinationID" IS NULL THEN NULL ELSE jsonb_build_object('id',co."CoordinationID",'applicationId',co."ApplicationID",'enterpriseId',co."EnterpriseID",'positionId',co."PositionID",'decision',co."Decision",'rejectReason',co."RejectReason",'coordinatedAt',co."CoordinatedAt",
        'company',jsonb_build_object('id',coordinated_company."EnterpriseID",'name',coordinated_company."Name"),'position',jsonb_build_object('id',coordinated_position."PositionID",'code',coordinated_position."RecruitmentCode",'title',coordinated_position."Title")) END AS coordination,
      CASE WHEN assignment."AssignmentID" IS NULL THEN NULL ELSE jsonb_build_object('id',assignment."AssignmentID",'status',assignment."Status",'startDate',assignment."StartDate",'endDate',assignment."EndDate",'enterpriseSupervisorName',assignment."EnterpriseSupervisorName",
        'academicSupervisor',(SELECT jsonb_build_object('id',supervisor."UserID",'fullName',supervisor."FullName",'email',supervisor."Email",'phone',supervisor."Phone") FROM "Users" supervisor WHERE supervisor."UserID"=assignment."AcademicSupervisorID")) END AS assignment,
      COALESCE((SELECT jsonb_agg(jsonb_build_object('id',a."ApplicationID",'postId',a."PostID",'positionId',a."PositionID",'enterpriseId',pos."EnterpriseID",'status',a."Status",'appliedAt',a."AppliedAt",
        'company',jsonb_build_object('id',enterprise."EnterpriseID",'name',enterprise."Name"),'position',jsonb_build_object('id',pos."PositionID",'code',pos."RecruitmentCode",'title',pos."Title")) ORDER BY a."AppliedAt" DESC,a."ApplicationID" DESC)
        FROM "JobApplications" a JOIN "InternshipPositions" pos ON pos."PositionID"=a."PositionID" JOIN "Enterprises" enterprise ON enterprise."EnterpriseID"=pos."EnterpriseID"
        WHERE a."RegistrationID"=r."RegistrationID"),'[]'::jsonb) AS applications
      ${from} ORDER BY r."RegisteredAt" DESC NULLS LAST,s."StudentID" DESC LIMIT $${args.length + 1} OFFSET $${args.length + 2}`, [...args, p.limit, p.offset])).rows;
    const labels: Row = { NOT_REGISTERED: 'Chưa nộp hồ sơ', SUBMITTED: 'Đã nộp hồ sơ', APPROVED: 'Đã duyệt', REJECTED: 'Cần bổ sung và nộp lại', LEGACY_REVIEW_REQUIRED: 'Hồ sơ cũ cần đối soát' };
    const items = rows.map(row => {
      const { registrationRecord: record, ...item } = row;
      const registration = record ? registrationApi(record) : null;
      const activeAssignment = row.assignment && !['CANCELLED', 'CANCELED'].includes(String(row.assignment.status).toUpperCase());
      const assignmentStatus = String(row.assignment?.status ?? 'ASSIGNED').toUpperCase();
      const workflowStatus = activeAssignment ? (['COMPLETED', 'FAILED'].includes(assignmentStatus) ? assignmentStatus : ['ACTIVE', 'IN_PROGRESS'].includes(assignmentStatus) ? 'IN_PROGRESS' : 'ASSIGNED') : row.coordinationStatus === 'REJECTED' ? 'NEEDS_REASSIGNMENT'
        : row.coordinationStatus === 'ACCEPTED' ? 'ENTERPRISE_ACCEPTED' : row.coordinationStatus === 'PENDING' ? 'SENT_TO_ENTERPRISE'
        : row.status === 'APPROVED' ? 'READY_TO_COORDINATE' : row.status === 'SUBMITTED' ? 'AWAITING_REVIEW'
        : row.status === 'REJECTED' ? 'NEEDS_RESUBMISSION' : row.status === 'LEGACY_REVIEW_REQUIRED' ? 'LEGACY_REVIEW_REQUIRED' : 'NOT_SUBMITTED';
      return { ...item, registrationId: registration?.id ?? null, registrationStatus: row.status, statusLabel: labels[row.status], registration,
        registrations: registration ? [{ ...registration, registrationId: registration.id, semester: term, handoffStatus: 'HANDED_OFF' }] : [],
        cv: record?.CV ?? null, window: registration?.window ?? null, semester: term, workflowStatus,
        canSendToEnterprise: row.status === 'APPROVED' && !activeAssignment && row.coordinationStatus === 'NOT_COORDINATED' && row.applications.some((a: Row) => !['REJECTED', 'WITHDRAWN'].includes(a.status)),
        canReassign: row.status === 'APPROVED' && !activeAssignment && row.coordinationStatus === 'REJECTED' };
    });
    if (detail) for (const item of items) await attachProgressDetails(c, item, detailPages);
    return { ojtSemesterId: semesterId, semester: term, items, total, page: p.page, limit: p.limit };
  });
}
