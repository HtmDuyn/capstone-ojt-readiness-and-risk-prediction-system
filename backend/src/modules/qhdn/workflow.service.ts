import { officialEligibilityWithClient } from '../eligibility/eligibility.service';
import type { PoolClient } from 'pg';
import { applicationEvent } from '../recruitment/recruitment.service';
import { academicTransaction, audit } from '../academic/academic.repository';
import { dateInput, dateRange } from '../academic/academic.schema';
import { inputObject, positiveId, requiredText, optionalText, invalid, enumValue, score } from '../students/student.validation';
import { asApi, record, requireStaff, assertAccess, remaining, syncSlots, type Actor, type Row } from './qhdn.repository';

const accepted = (decision: unknown) => ['ACCEPTED','ACCEPT','APPROVED'].includes(String(decision).toUpperCase());
async function latest(c: PoolClient, row: Row) {
  if ((await c.query('SELECT 1 FROM "StudentEnterpriseCoordination" WHERE "RegistrationID"=$1 AND "CoordinationID">$2',[row.RegistrationID,row.CoordinationID])).rowCount) throw invalid('This coordination has been superseded.',409,'COORDINATION_SUPERSEDED');
}
async function registration(c: PoolClient, id: number) {
  const r = (await c.query('SELECT * FROM "OJTRegistrations" WHERE "RegistrationID"=$1 FOR UPDATE',[id])).rows[0];
  if (!r) throw invalid('Registration not found.',404);
  if (r.Status !== 'HANDED_OFF' || !(await c.query('SELECT 1 FROM "EligibleStudentHandoffItems" WHERE "RegistrationID"=$1',[id])).rowCount) throw invalid('Only handed-off registrations can be coordinated.',409,'HANDOFF_REQUIRED');
  const student = (await c.query('SELECT s.*,u."Status" AS "AccountStatus" FROM "Students" s JOIN "Users" u ON u."UserID"=s."UserID" WHERE s."StudentID"=$1 FOR UPDATE OF s,u',[r.StudentID])).rows[0];
  if (!student || student.DeletedAt || student.Status !== 'ACTIVE' || student.AccountStatus !== 'ACTIVE') throw invalid('An active student and account are required.',409,'STUDENT_INACTIVE');
  if(r.WindowID){const official=await officialEligibilityWithClient(c,r.StudentID,r.OJTSemesterID);if(!official||official.status!=='ELIGIBLE'||official.isStale||official.programId!==r.ProgramID)throw invalid('Handed-off eligibility requires academic reconciliation before further coordination.',409,'OFFICIAL_ELIGIBILITY_STALE');}
  return r;
}
async function openPosition(c: PoolClient, id: number, semesterId: number) {
  const p = await record(c,'positions',id), company = await record(c,'companies',p.EnterpriseID);
  if (p.OJTSemesterID !== semesterId) throw invalid('Position and registration must belong to the same semester.',409,'POSITION_SEMESTER_MISMATCH');
  if (p.Status !== 'OPEN' || company.Status !== 'ACTIVE') throw invalid('Position and enterprise must be open/active.',409,'POSITION_CLOSED');
  return p;
}
export async function coordinate(body: unknown, actor: Actor, previousId?: number) {
  requireStaff(actor);
  const b = inputObject(body,previousId === undefined ? ['registrationId','positionId','applicationId','reason'] : ['positionId','applicationId','reason']);
  const reason = requiredText(b.reason,'reason',2000);
  return academicTransaction(async c => {
    const previous = previousId === undefined ? null : await record(c,'coordinations',previousId);
    const app=b.applicationId===undefined?null:(await c.query('SELECT * FROM "JobApplications" WHERE "ApplicationID"=$1 FOR UPDATE',[positiveId(b.applicationId,'applicationId')])).rows[0];
    if(b.applicationId!==undefined&&!app)throw invalid('Application not found.',404);
    const positionId=positiveId(b.positionId??app?.PositionID,'positionId');
    const r = await registration(c,previous ? previous.RegistrationID : positiveId(b.registrationId??app?.RegistrationID,'registrationId'));
    if(app&&(app.RegistrationID!==r.RegistrationID||app.PositionID!==positionId||app.OJTSemesterID!==r.OJTSemesterID||!['SUBMITTED','REVIEWING','INTERVIEW','OFFERED'].includes(app.Status)))throw invalid('Application does not match this coordination or is no longer pending.',409,'APPLICATION_CONTEXT_MISMATCH');
    if(!app&&(await c.query('SELECT 1 FROM "JobApplications" WHERE "RegistrationID"=$1',[r.RegistrationID])).rowCount)throw invalid('Select the applicationId for this registration.',400,'APPLICATION_REQUIRED');
    if (previous) {
      await latest(c,previous);
      if ((await c.query('SELECT 1 FROM "InternshipAssignments" WHERE "CoordinationID"=$1 AND COALESCE(UPPER("Status"),\'\') NOT IN (\'CANCELLED\',\'CANCELED\')',[previousId])).rowCount) throw invalid('Cancel the existing assignment before reassigning.',409,'ASSIGNMENT_EXISTS');
      if (previous.PositionID === positionId) throw invalid('Reassignment requires a different position.');
    } else if ((await c.query('SELECT 1 FROM "StudentEnterpriseCoordination" WHERE "RegistrationID"=$1',[r.RegistrationID])).rowCount) throw invalid('Use reassign for an already coordinated registration.',409,'COORDINATION_EXISTS');
    const p = await openPosition(c,positionId,r.OJTSemesterID);
    if ((await remaining(c,positionId)).remainingSlots < 1) throw invalid('The position has no remaining seats.',409,'POSITION_FULL');
    if (previous) {
      await c.query('UPDATE "StudentEnterpriseCoordination" SET "Decision"=\'REASSIGNED\',"DecisionAt"=now() WHERE "CoordinationID"=$1',[previousId]);
      if(previous.ApplicationID){await c.query('UPDATE "JobApplications" SET "Status"=\'WITHDRAWN\',"UpdatedAt"=now() WHERE "ApplicationID"=$1',[previous.ApplicationID]);await applicationEvent(c,previous.ApplicationID,'REASSIGNED',actor.userId,{status:'WITHDRAWN',newPositionId:positionId},reason);}
      await audit(c,actor.userId,'StudentEnterpriseCoordination',previousId!,'REASSIGN',previous,{...previous,Decision:'REASSIGNED',newPositionId:positionId},reason);
    }
    const row = (await c.query('INSERT INTO "StudentEnterpriseCoordination" ("RegistrationID","EnterpriseID","PositionID","OJTSemesterID","CoordinatedBy","Decision","PreviousCoordinationID","ApplicationID") VALUES ($1,$2,$3,$4,$5,\'PENDING\',$6,$7) RETURNING *',[r.RegistrationID,p.EnterpriseID,positionId,r.OJTSemesterID,actor.userId,previousId ?? null,app?.ApplicationID??null])).rows[0];
    if (previous) await syncSlots(c,previous.PositionID);
    if(app){await c.query('UPDATE "JobApplications" SET "Status"=\'REVIEWING\',"UpdatedAt"=now() WHERE "ApplicationID"=$1',[app.ApplicationID]);await applicationEvent(c,app.ApplicationID,'COORDINATED',actor.userId,{coordinationId:row.CoordinationID,status:'REVIEWING'},reason);}
    await audit(c,actor.userId,'StudentEnterpriseCoordination',row.CoordinationID,'COORDINATE',null,row,reason);
    return asApi('coordinations',row);
  });
}
export async function decision(id: number, body: unknown, actor: Actor) {
  const b = inputObject(body,['decision','reason']), value = enumValue(b.decision,['ACCEPTED','REJECTED'],'decision');
  const reason = actor.roleCode !== 'ENTERPRISE' || value === 'REJECTED' ? requiredText(b.reason,'reason',300) : optionalText(b.reason,'reason',300);
  return academicTransaction(async c => {
    const row = await record(c,'coordinations',id); await assertAccess(c,'coordinations',row,actor); await latest(c,row);
    await registration(c,row.RegistrationID);
    if (row.Decision != null && row.Decision !== 'PENDING') throw invalid('A decision has already been recorded; use reassignment for further changes.',409,'COORDINATION_DECIDED');
    if(row.ApplicationID){const a=(await c.query('SELECT * FROM "JobApplications" WHERE "ApplicationID"=$1 FOR UPDATE',[row.ApplicationID])).rows[0];if(!a||!['SUBMITTED','REVIEWING','INTERVIEW','OFFERED'].includes(a.Status))throw invalid('Application is no longer pending.',409,'APPLICATION_NOT_PENDING');}
    if (value === 'ACCEPTED') {
      if((await c.query('SELECT 1 FROM "StudentEnterpriseCoordination" co LEFT JOIN "InternshipAssignments" a ON a."CoordinationID"=co."CoordinationID" WHERE co."RegistrationID"=$1 AND co."CoordinationID"<>$2 AND UPPER(co."Decision") IN (\'ACCEPTED\',\'ACCEPT\',\'APPROVED\') AND NOT EXISTS(SELECT 1 FROM "StudentEnterpriseCoordination" n WHERE n."PreviousCoordinationID"=co."CoordinationID") AND (a."AssignmentID" IS NULL OR COALESCE(UPPER(a."Status"),\'\') NOT IN (\'CANCELLED\',\'CANCELED\'))',[row.RegistrationID,id])).rowCount)throw invalid('This student already has an accepted coordination.',409,'STUDENT_ALREADY_ACCEPTED');
      await openPosition(c,row.PositionID,row.OJTSemesterID);
      if ((await remaining(c,row.PositionID)).remainingSlots < 1) throw invalid('The position has no remaining seats.',409,'POSITION_FULL');
    }
    const after = (await c.query('UPDATE "StudentEnterpriseCoordination" SET "Decision"=$2,"DecisionAt"=now(),"RejectReason"=$3 WHERE "CoordinationID"=$1 RETURNING *',[id,value,value === 'REJECTED' ? reason : null])).rows[0];
    await syncSlots(c,row.PositionID);
    if(row.ApplicationID){await c.query('UPDATE "JobApplications" SET "Status"=$2,"ReviewedBy"=$3,"ReviewNote"=$4,"UpdatedAt"=now() WHERE "ApplicationID"=$1',[row.ApplicationID,value,actor.userId,reason]);await applicationEvent(c,row.ApplicationID,value,actor.userId,{coordinationId:id,status:value},reason??undefined);}
    await audit(c,actor.userId,'StudentEnterpriseCoordination',id,actor.roleCode === 'ENTERPRISE' ? 'ENTERPRISE_DECISION' : 'PROXY_ENTERPRISE_DECISION',row,{...after,enteredBy:actor.userId,enteredByRole:actor.roleCode,onBehalfOfEnterprise:actor.roleCode !== 'ENTERPRISE'},reason ?? undefined);
    return asApi('coordinations',after);
  });
}
function assignmentFields(b: Row, before?: Row) {
  const values: Row = {};
  if ('academicSupervisorId' in b) values.AcademicSupervisorID = b.academicSupervisorId === null ? null : positiveId(b.academicSupervisorId,'academicSupervisorId');
  if ('enterpriseSupervisorName' in b) values.EnterpriseSupervisorName = optionalText(b.enterpriseSupervisorName,'enterpriseSupervisorName',100);
  for (const [key,col] of [['startDate','StartDate'],['endDate','EndDate']] as const) if (!before || key in b) values[col] = dateInput(b[key],key);
  const date = (value: unknown) => value instanceof Date ? value.toISOString().slice(0,10) : String(value).slice(0,10);
  const merged = {...before,...values};
  if (!merged.StartDate || !merged.EndDate) throw invalid('Assignment startDate and endDate are required.');
  dateRange(date(merged.StartDate),date(merged.EndDate),'assignment');
  return values;
}
async function academicSupervisor(c: PoolClient, id: unknown) {
  if (id != null && !(await c.query('SELECT 1 FROM "Users" u JOIN "Roles" r ON r."RoleID"=u."RoleID" WHERE u."UserID"=$1 AND u."Status"=\'ACTIVE\' AND r."RoleCode"=\'ACADEMIC\'',[id])).rowCount) throw invalid('Academic supervisor must be an active ACADEMIC user.');
}
export async function assign(body: unknown, actor: Actor) {
  requireStaff(actor);
  const b = inputObject(body,['coordinationId','registrationId','positionId','academicSupervisorId','enterpriseSupervisorName','startDate','endDate','reason']);
  const reason = optionalText(b.reason,'reason',2000), fields = assignmentFields(b);
  return academicTransaction(async c => {
    const id = b.coordinationId !== undefined ? positiveId(b.coordinationId,'coordinationId') : (await c.query('SELECT "CoordinationID" FROM "StudentEnterpriseCoordination" WHERE "RegistrationID"=$1 ORDER BY "CoordinationID" DESC LIMIT 1',[positiveId(b.registrationId,'registrationId')])).rows[0]?.CoordinationID;
    if (!id) throw invalid('An existing accepted coordination is required.',409,'ENTERPRISE_ACCEPTANCE_REQUIRED');
    const co = await record(c,'coordinations',id); await latest(c,co); const r = await registration(c,co.RegistrationID);
    if (b.registrationId !== undefined && positiveId(b.registrationId,'registrationId') !== co.RegistrationID) throw invalid('registrationId conflicts with coordinationId.');
    if (b.positionId !== undefined && positiveId(b.positionId,'positionId') !== co.PositionID) throw invalid('positionId conflicts with accepted coordination.');
    await academicSupervisor(c,fields.AcademicSupervisorID);
    if (!accepted(co.Decision)) throw invalid('Enterprise acceptance is required before assignment.',409,'ENTERPRISE_ACCEPTANCE_REQUIRED');
    if ((await c.query('SELECT 1 FROM "InternshipAssignments" a JOIN "StudentEnterpriseCoordination" co ON co."CoordinationID"=a."CoordinationID" WHERE a."CoordinationID"=$1 OR (a."StudentID"=$2 AND co."OJTSemesterID"=$3 AND COALESCE(UPPER(a."Status"),\'\') NOT IN (\'CANCELLED\',\'CANCELED\'))',[id,r.StudentID,r.OJTSemesterID])).rowCount) throw invalid('A non-cancelled assignment already exists for this student and semester, or this coordination was already assigned.',409,'ASSIGNMENT_EXISTS');
    const p = await record(c,'positions',co.PositionID), slots = await remaining(c,co.PositionID);
    if (slots.used > slots.capacity) throw invalid('Position is over capacity.',409,'POSITION_CAPACITY_CONFLICT');
    if (p.EnterpriseID !== co.EnterpriseID || p.OJTSemesterID !== r.OJTSemesterID) throw invalid('Assignment context conflicts with the position.',409);
    const company = await record(c,'companies',co.EnterpriseID);
    if (company.Status !== 'ACTIVE') throw invalid('Enterprise is inactive.',409);
    const row = (await c.query('INSERT INTO "InternshipAssignments" ("CoordinationID","StudentID","EnterpriseID","PositionID","AcademicSupervisorID","EnterpriseSupervisorName","StartDate","EndDate","Status") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,\'ASSIGNED\') RETURNING *',[id,r.StudentID,co.EnterpriseID,co.PositionID,fields.AcademicSupervisorID ?? null,fields.EnterpriseSupervisorName ?? null,fields.StartDate,fields.EndDate])).rows[0];
    await syncSlots(c,co.PositionID); await audit(c,actor.userId,'InternshipAssignments',row.AssignmentID,'ASSIGN',null,row,reason ?? undefined);
    return {...asApi('assignments',row),ojtSemesterId:co.OJTSemesterID};
  });
}
async function mutableAssignment(c: PoolClient, id: number) {
  const row = await record(c,'assignments',id);
  // Once transferred, source changes must follow the existing academic revision workflow.
  if ((await c.query('SELECT 1 FROM "OJTResults" WHERE "AssignmentID"=$1 AND "Status"<>\'REVISION_REQUESTED\'',[id])).rowCount) throw invalid('Request an academic revision before modifying a transferred assignment or evaluation.',409,'OJT_RESULT_LOCKED');
  return row;
}
export async function updateAssignment(id: number, body: unknown, actor: Actor) {
  requireStaff(actor);
  const b = inputObject(body,['positionId','academicSupervisorId','enterpriseSupervisorName','startDate','endDate','reason']), reason = requiredText(b.reason,'reason',2000);
  return academicTransaction(async c => {
    const before = await mutableAssignment(c,id);
    if (!['ASSIGNED','IN_PROGRESS','ACTIVE'].includes(before.Status)) throw invalid('Only assigned or in-progress assignments can be edited.',409);
    if (b.positionId !== undefined && positiveId(b.positionId,'positionId') !== before.PositionID) throw invalid('Cancel and reassign through an accepted coordination to change position.',409);
    const fields = assignmentFields(b,before), entries = Object.entries(fields);
    await academicSupervisor(c,fields.AcademicSupervisorID);
    if (!entries.length) throw invalid('Provide at least one assignment field.');
    const after = (await c.query(`UPDATE "InternshipAssignments" SET ${entries.map(([key],i)=>`"${key}"=$${i+2}`).join(',')} WHERE "AssignmentID"=$1 RETURNING *`,[id,...entries.map(([,v])=>v)])).rows[0];
    await audit(c,actor.userId,'InternshipAssignments',id,'UPDATE',before,after,reason); return asApi('assignments',after);
  });
}
export async function assignmentStatus(id: number, body: unknown, actor: Actor) {
  requireStaff(actor);
  const b = inputObject(body,['status','reason']), status = enumValue(b.status,['IN_PROGRESS','ACTIVE','COMPLETED','CANCELLED'],'status'), reason = requiredText(b.reason,'reason',2000);
  return academicTransaction(async c => {
    const before = await mutableAssignment(c,id);
    const transitions: Record<string,string[]> = { ASSIGNED:['IN_PROGRESS','ACTIVE','CANCELLED'],IN_PROGRESS:['COMPLETED','CANCELLED'],ACTIVE:['COMPLETED','CANCELLED'] };
    if (!transitions[before.Status]?.includes(status)) throw invalid('Invalid assignment status transition.',409,'INVALID_ASSIGNMENT_TRANSITION');
    if (status === 'COMPLETED' && !(await c.query('SELECT 1 FROM "InternshipEvaluations" WHERE "AssignmentID"=$1 AND "OverallScore" IS NOT NULL',[id])).rowCount) throw invalid('Submit an evaluation before completing the assignment.',409,'EVALUATION_REQUIRED');
    const after = (await c.query('UPDATE "InternshipAssignments" SET "Status"=$2 WHERE "AssignmentID"=$1 RETURNING *',[id,status])).rows[0];
    await record(c,'positions',before.PositionID); await syncSlots(c,before.PositionID);
    if(status==='CANCELLED'){const co=await record(c,'coordinations',before.CoordinationID);if(co.ApplicationID){await c.query('UPDATE "JobApplications" SET "Status"=\'WITHDRAWN\',"UpdatedAt"=now() WHERE "ApplicationID"=$1',[co.ApplicationID]);await applicationEvent(c,co.ApplicationID,'ASSIGNMENT_CANCELLED',actor.userId,{assignmentId:id,status:'WITHDRAWN'},reason);}}
    await audit(c,actor.userId,'InternshipAssignments',id,'CHANGE_STATUS',before,after,reason); return asApi('assignments',after);
  });
}
export async function evaluate(id: number, body: unknown, actor: Actor) {
  const b = inputObject(body,['completionScore','attitudeScore','skillScore','overallScore','comments','reason']);
  const reason = actor.roleCode === 'ENTERPRISE' ? optionalText(b.reason,'reason',2000) : requiredText(b.reason,'reason',2000);
  const fields: Row = {};
  for (const key of ['completionScore','attitudeScore','skillScore','overallScore']) {
    if (b[key] == null) throw invalid(`${key} is required.`);
    fields[key] = score(b[key],10,key);
  }
  const comments = optionalText(b.comments,'comments',10000);
  return academicTransaction(async c => {
    const a = await record(c,'assignments',id); await assertAccess(c,'assignments',a,actor);
    await mutableAssignment(c,id);
    if (!['IN_PROGRESS','ACTIVE','COMPLETED','FAILED'].includes(a.Status)) throw invalid('Evaluations require an in-progress or completed internship.',409,'ASSIGNMENT_NOT_STARTED');
    const before = (await c.query('SELECT * FROM "InternshipEvaluations" WHERE "AssignmentID"=$1 FOR UPDATE',[id])).rows[0] ?? null;
    const after = (await c.query('INSERT INTO "InternshipEvaluations" ("AssignmentID","EvaluatedBy","EvaluatedAt","CompletionScore","AttitudeScore","SkillScore","OverallScore","Comments","Status") VALUES ($1,$2,now(),$3,$4,$5,$6,$7,\'SUBMITTED\') ON CONFLICT ("AssignmentID") DO UPDATE SET "EvaluatedBy"=EXCLUDED."EvaluatedBy","EvaluatedAt"=now(),"CompletionScore"=EXCLUDED."CompletionScore","AttitudeScore"=EXCLUDED."AttitudeScore","SkillScore"=EXCLUDED."SkillScore","OverallScore"=EXCLUDED."OverallScore","Comments"=EXCLUDED."Comments","Status"=EXCLUDED."Status" RETURNING *',[id,actor.userId,fields.completionScore,fields.attitudeScore,fields.skillScore,fields.overallScore,comments])).rows[0];
    await audit(c,actor.userId,'InternshipEvaluations',after.EvaluationID,actor.roleCode === 'ENTERPRISE' ? 'ENTERPRISE_EVALUATION' : 'PROXY_ENTERPRISE_EVALUATION',before,{...after,enteredBy:actor.userId,enteredByRole:actor.roleCode,onBehalfOfEnterprise:actor.roleCode !== 'ENTERPRISE'},reason ?? undefined);
    return asApi('evaluations',after);
  });
}
