import type { PoolClient } from 'pg';
import { invalid } from '../students/student.validation';

export type Actor = { userId: number; roleCode: string };
export type Row = Record<string, any>;
export const resources = {
  companies: { table: 'Enterprises', id: 'EnterpriseID', fields: { id:'EnterpriseID', enterpriseCode:'EnterpriseCode', name:'Name', address:'Address', industry:'Industry', contactPersonName:'ContactPersonName', contactPhone:'ContactPhone', contactEmail:'ContactEmail', status:'Status', createdAt:'CreatedAt' } },
  positions: { table: 'InternshipPositions', id: 'PositionID', fields: { id:'PositionID', enterpriseId:'EnterpriseID', ojtSemesterId:'OJTSemesterID', recruitmentCode:'RecruitmentCode', title:'Title', description:'Description', requirements:'Requirements', capacity:'Capacity', status:'Status', location:'Location', workMode:'WorkMode' } },
  coordinations: { table: 'StudentEnterpriseCoordination', id: 'CoordinationID', fields: { id:'CoordinationID', applicationId:'ApplicationID', registrationId:'RegistrationID', enterpriseId:'EnterpriseID', positionId:'PositionID', ojtSemesterId:'OJTSemesterID', coordinatedBy:'CoordinatedBy', coordinatedAt:'CoordinatedAt', decision:'Decision', decisionAt:'DecisionAt', rejectReason:'RejectReason', previousCoordinationId:'PreviousCoordinationID' } },
  assignments: { table: 'InternshipAssignments', id: 'AssignmentID', fields: { id:'AssignmentID', coordinationId:'CoordinationID', studentId:'StudentID', enterpriseId:'EnterpriseID', positionId:'PositionID', academicSupervisorId:'AcademicSupervisorID', enterpriseSupervisorName:'EnterpriseSupervisorName', startDate:'StartDate', endDate:'EndDate', status:'Status' } },
  evaluations: { table: 'InternshipEvaluations', id: 'EvaluationID', fields: { id:'EvaluationID', assignmentId:'AssignmentID', evaluatedBy:'EvaluatedBy', evaluatedAt:'EvaluatedAt', completionScore:'CompletionScore', attitudeScore:'AttitudeScore', skillScore:'SkillScore', overallScore:'OverallScore', comments:'Comments', status:'Status' } },
} as const;
export type Resource = keyof typeof resources;
export function asApi(resource: Resource, row: Row): Row {
  const value: Row = {};
  for (const [key,column] of Object.entries(resources[resource].fields)) value[key] = row[column];
  if (resource === 'evaluations') for (const key of ['completionScore','attitudeScore','skillScore','overallScore']) value[key] = value[key] == null ? null : Number(value[key]);
  if (row.remainingSlots !== undefined) value.remainingSlots = row.remainingSlots;
  if (resource === 'companies') value.code = value.enterpriseCode;
  if (resource === 'positions' || resource === 'assignments') value.companyId = value.enterpriseId;
  if (resource === 'assignments' && row.OJTSemesterID !== undefined) value.ojtSemesterId = row.OJTSemesterID;
  return value;
}
export async function record(c: PoolClient, resource: Resource, id: number): Promise<Row> {
  const cfg = resources[resource];
  const row = (await c.query(`SELECT * FROM "${cfg.table}" WHERE "${cfg.id}"=$1 FOR UPDATE`,[id])).rows[0];
  if (!row) throw invalid(`${resource} record not found.`,404,'QHDN_NOT_FOUND');
  if (row.DeletedAt) throw invalid(`${resource} record not found.`,404,'QHDN_NOT_FOUND');
  return row;
}
export function requireStaff(actor: Actor) {
  if (!['ADMIN','OJT_COORD'].includes(actor.roleCode)) throw invalid('QHDN staff access required.',403,'FORBIDDEN');
}
export async function enterpriseScope(c: PoolClient, actor: Actor): Promise<number | null> {
  if (['ADMIN','OJT_COORD'].includes(actor.roleCode)) return null;
  if (actor.roleCode !== 'ENTERPRISE') throw invalid('QHDN access required.',403,'FORBIDDEN');
  const row = (await c.query('SELECT eu."EnterpriseID" FROM "EnterpriseUsers" eu JOIN "Enterprises" e ON e."EnterpriseID"=eu."EnterpriseID" WHERE eu."UserID"=$1 AND e."Status"=\'ACTIVE\' AND e."DeletedAt" IS NULL',[actor.userId])).rows[0];
  if (!row) throw invalid('An active enterprise membership is required.',403,'ENTERPRISE_SCOPE_REQUIRED');
  return row.EnterpriseID;
}
export async function assertAccess(c: PoolClient, resource: Resource, row: Row, actor: Actor) {
  const scope = await enterpriseScope(c,actor);
  if (scope === null) return;
  const enterpriseId = resource === 'evaluations'
    ? (await record(c,'assignments',row.AssignmentID)).EnterpriseID : row.EnterpriseID;
  if (enterpriseId !== scope) throw invalid('This record belongs to another enterprise.',403,'FORBIDDEN');
}
// An acceptance reserves a seat. Cancelled assignments and superseded coordinations release it.
export const reservedSeats = (alias: string) => `((SELECT count(*)::int FROM "InternshipAssignments" a
  WHERE a."PositionID"=${alias}."PositionID" AND COALESCE(UPPER(a."Status"),'') NOT IN ('CANCELLED','CANCELED'))
  + (SELECT count(*)::int FROM "StudentEnterpriseCoordination" co
  WHERE co."PositionID"=${alias}."PositionID" AND UPPER(co."Decision") IN ('ACCEPTED','ACCEPT','APPROVED')
  AND NOT EXISTS (SELECT 1 FROM "StudentEnterpriseCoordination" newer WHERE newer."PreviousCoordinationID"=co."CoordinationID")
  AND NOT EXISTS (SELECT 1 FROM "InternshipAssignments" assigned WHERE assigned."CoordinationID"=co."CoordinationID")))`;
export async function remaining(c: PoolClient, positionId: number): Promise<{ capacity: number; used: number; remainingSlots: number }> {
  const row = (await c.query(`SELECT p."Capacity" AS capacity,${reservedSeats('p')} AS used FROM "InternshipPositions" p WHERE p."PositionID"=$1`,[positionId])).rows[0];
  if (!row || !Number.isInteger(row.capacity) || row.capacity < 0) throw invalid('Position capacity must be configured.',409,'POSITION_CAPACITY_REQUIRED');
  return { ...row, remainingSlots: Math.max(0,row.capacity-row.used) };
}
export async function syncSlots(c: PoolClient, positionId: number) {
  const slots = await remaining(c,positionId);
  await c.query('UPDATE "InternshipPositions" SET "RemainingSlots"=$2 WHERE "PositionID"=$1',[positionId,slots.remainingSlots]);
  return slots;
}
export async function history(c: PoolClient, resource: Resource, id: number) {
  return (await c.query('SELECT "UserID" AS "actorId","Action" AS action,"ActionAt" AS "createdAt","Detail" AS detail FROM "AuditLogs" WHERE "EntityType"=$1 AND "EntityID"=$2 ORDER BY "LogID"',[resources[resource].table,id])).rows;
}
