import type { PoolClient } from 'pg';
import { officialEligibilityWithClient } from '../eligibility/eligibility.service';
import type { Row } from '../ojt-registration/window.service';

type Page = { page: number; limit: number; offset: number };
export type ProgressDetailPages = { history: Page; coordination: Page; assignment: Page };

// Called only after the QHDN roster has scoped a student to an actual handoff
// in the selected semester. All reads stay on the roster's read-only snapshot.
export async function attachProgressDetails(client: PoolClient, item: Row, pages: ProgressDetailPages): Promise<void> {
  item.officialEligibility = await officialEligibilityWithClient(client, item.studentId, item.ojtSemesterId, { lockSource: false });
  const handoff = (await client.query(`SELECT h."HandoffID" AS id,h."CreatedBy" AS "createdBy",h."CreatedAt" AS "createdAt",h."Reason" AS reason,
    jsonb_build_object('id',sender."UserID",'fullName',sender."FullName") AS "createdByUser",i."CheckID" AS "checkId",i."Snapshot" AS snapshot
    FROM "EligibleStudentHandoffItems" i JOIN "EligibleStudentHandoffs" h ON h."HandoffID"=i."HandoffID" AND h."OJTSemesterID"=i."OJTSemesterID"
    LEFT JOIN "Users" sender ON sender."UserID"=h."CreatedBy"
    WHERE i."HandoffID"=$1 AND i."StudentID"=$2 AND i."OJTSemesterID"=$3`, [item.handoffId, item.studentId, item.ojtSemesterId])).rows[0];
  item.handoffSnapshot = handoff?.snapshot ?? null;
  if (handoff) { const { snapshot: _snapshot, ...metadata } = handoff; item.handoff = metadata; }
  const hp = pages.history, cp = pages.coordination, ap = pages.assignment;
  item.history = []; item.historyPagination = { total: 0, page: hp.page, limit: hp.limit };
  item.coordinationHistory = []; item.coordinationPagination = { total: 0, page: cp.page, limit: cp.limit };
  item.assignments = []; item.assignmentsPagination = { total: 0, page: ap.page, limit: ap.limit };
  if (!item.registrationId) return;
  const id = item.registrationId;
  item.historyPagination.total = (await client.query('SELECT count(*)::int AS total FROM "OJTRegistrationEvents" WHERE "RegistrationID"=$1', [id])).rows[0].total;
  item.history = (await client.query(`SELECT ev."EventID" AS id,ev."Action" AS action,ev."Snapshot" AS snapshot,ev."Reason" AS reason,ev."CreatedAt" AS "createdAt",ev."CreatedBy" AS "createdBy",
    jsonb_build_object('id',u."UserID",'fullName',u."FullName") AS "createdByUser"
    FROM "OJTRegistrationEvents" ev LEFT JOIN "Users" u ON u."UserID"=ev."CreatedBy" WHERE ev."RegistrationID"=$1 ORDER BY ev."EventID" DESC LIMIT $2 OFFSET $3`, [id, hp.limit, hp.offset])).rows;
  item.coordinationPagination.total = (await client.query('SELECT count(*)::int AS total FROM "StudentEnterpriseCoordination" WHERE "RegistrationID"=$1', [id])).rows[0].total;
  item.coordinationHistory = (await client.query(`SELECT co."CoordinationID" AS id,co."RegistrationID" AS "registrationId",co."ApplicationID" AS "applicationId",co."EnterpriseID" AS "companyId",co."PositionID" AS "positionId",
    co."OJTSemesterID" AS "ojtSemesterId",co."Decision" AS decision,co."DecisionAt" AS "decisionAt",co."RejectReason" AS "rejectReason",co."CoordinatedAt" AS "coordinatedAt",co."CoordinatedBy" AS "coordinatedBy",co."PreviousCoordinationID" AS "previousCoordinationId",
    jsonb_build_object('id',u."UserID",'fullName',u."FullName") AS "coordinatedByUser",
    jsonb_build_object('id',e."EnterpriseID",'name',e."Name") AS company,jsonb_build_object('id',pos."PositionID",'code',pos."RecruitmentCode",'title',pos."Title") AS position
    FROM "StudentEnterpriseCoordination" co LEFT JOIN "Users" u ON u."UserID"=co."CoordinatedBy" LEFT JOIN "Enterprises" e ON e."EnterpriseID"=co."EnterpriseID" LEFT JOIN "InternshipPositions" pos ON pos."PositionID"=co."PositionID"
    WHERE co."RegistrationID"=$1 ORDER BY co."CoordinationID" DESC LIMIT $2 OFFSET $3`, [id, cp.limit, cp.offset])).rows;
  item.assignmentsPagination.total = (await client.query(`SELECT count(*)::int AS total FROM "InternshipAssignments" a JOIN "StudentEnterpriseCoordination" co ON co."CoordinationID"=a."CoordinationID" WHERE co."RegistrationID"=$1`, [id])).rows[0].total;
  item.assignments = (await client.query(`SELECT a."AssignmentID" AS id,a."CoordinationID" AS "coordinationId",a."StudentID" AS "studentId",a."EnterpriseID" AS "companyId",a."PositionID" AS "positionId",a."Status" AS status,
    a."StartDate" AS "startDate",a."EndDate" AS "endDate",a."EnterpriseSupervisorName" AS "enterpriseSupervisorName",a."AcademicSupervisorID" AS "academicSupervisorId",
    jsonb_build_object('id',e."EnterpriseID",'name',e."Name") AS company,jsonb_build_object('id',pos."PositionID",'code',pos."RecruitmentCode",'title',pos."Title") AS position,
    CASE WHEN u."UserID" IS NULL THEN NULL ELSE jsonb_build_object('id',u."UserID",'fullName',u."FullName",'email',u."Email",'phone',u."Phone") END AS "academicSupervisor"
    FROM "InternshipAssignments" a JOIN "StudentEnterpriseCoordination" co ON co."CoordinationID"=a."CoordinationID" LEFT JOIN "Enterprises" e ON e."EnterpriseID"=a."EnterpriseID" LEFT JOIN "InternshipPositions" pos ON pos."PositionID"=a."PositionID" LEFT JOIN "Users" u ON u."UserID"=a."AcademicSupervisorID"
    WHERE co."RegistrationID"=$1 ORDER BY a."AssignmentID" DESC LIMIT $2 OFFSET $3`, [id, ap.limit, ap.offset])).rows;
}
