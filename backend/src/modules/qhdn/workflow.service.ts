import { registrationRecord, eligibleOfficial } from '../ojt-registration/registration.service';
import type { PoolClient } from 'pg';
import { assertPublishedPosition } from '../recruitment/recruitment.repository';
import { academicTransaction } from '../academic/academic.repository';
import { dateInput, dateRange } from '../academic/academic.schema';
import { invalid, inputObject, positiveId, requiredText, optionalText, enumValue, score } from '../students/student.validation';
import { fingerprint } from '../eligibility/eligibility.service';
import type { Actor, Row } from '../ojt-registration/window.service';
import { api, record, staff, assertScope, persist, occupied, refreshSlots, log } from './catalog.service';

const accepted=(value:unknown)=>['ACCEPTED','ACCEPT','APPROVED'].includes(String(value).toUpperCase());
const rejected=(value:unknown)=>['REJECTED','REJECT'].includes(String(value).toUpperCase());
async function registration(c:PoolClient,id:number){
  const r=await registrationRecord(c,id);
  if(!r)throw invalid('Registration not found.',404);
  if(!['APPROVED','HANDED_OFF'].includes(r.Status)||!(await c.query('SELECT 1 FROM "EligibleStudentHandoffItems" WHERE "StudentID"=$3 AND "OJTSemesterID"=$2 AND $1::int IS NOT NULL',[id,r.OJTSemesterID,r.StudentID])).rowCount)throw invalid('A valid handed-off registration is required.',409,'REGISTRATION_NOT_HANDED_OFF');
  await eligibleOfficial(c,r);
  return r;
}
async function latest(c:PoolClient,r:Row,coordinationId:number){
  const row=(await c.query('SELECT "CoordinationID" FROM "StudentEnterpriseCoordination" WHERE "RegistrationID"=$1 ORDER BY "CoordinationID" DESC LIMIT 1',[r.RegistrationID])).rows[0];
  if(row?.CoordinationID!==coordinationId)throw invalid('Only the latest coordination can change.',409,'COORDINATION_SUPERSEDED');
}
async function availablePosition(c:PoolClient,id:number,semesterId:number){
  await assertPublishedPosition(c,id);
  const p=await record(c,'positions',id),company=await record(c,'companies',p.EnterpriseID);
  if(p.OJTSemesterID!==semesterId)throw invalid('Position belongs to a different semester.',409,'POSITION_SEMESTER_MISMATCH');
  if(company.Status!=='ACTIVE'||p.Status!=='OPEN')throw invalid('An active company and open position are required.',409,'POSITION_NOT_OPEN');
  if(p.Capacity==null||await occupied(c,id)>=p.Capacity)throw invalid('No remaining position capacity.',409,'POSITION_FULL');
  return p;
}
async function noAssignment(c:PoolClient,r:Row){
  if((await c.query(`SELECT 1 FROM "InternshipAssignments" a JOIN "StudentEnterpriseCoordination" co ON co."CoordinationID"=a."CoordinationID" JOIN "OJTRegistrations" r ON r."RegistrationID"=co."RegistrationID" WHERE a."StudentID"=$1 AND r."OJTSemesterID"=$2 AND COALESCE(UPPER(a."Status"),'ASSIGNED') NOT IN ('CANCELLED','CANCELED') LIMIT 1`,[r.StudentID,r.OJTSemesterID])).rowCount)throw invalid('Student already has an assignment in this semester.',409,'ASSIGNMENT_EXISTS');
}
async function mutableAssignment(c:PoolClient,id:number,allowPending=false){
  if((await c.query('SELECT 1 FROM "OJTResults" WHERE "AssignmentID"=$1'+(allowPending?' AND "Status"=\'CONFIRMED\'':''),[id])).rowCount)throw invalid('Transferred results lock the assignment; confirmed results lock the evaluation.',409,'OJT_RESULT_CONFIRMED');
}
// The existing transaction helper serializes all academic/OJT writes, including idempotency checks.
async function replay(c:PoolClient,key:string,hash:string,actor:Actor){
  const prior=(await c.query(`SELECT "UserID","Detail"::jsonb AS detail FROM "AuditLogs" WHERE "EntityType"='StudentEnterpriseCoordination' AND "Detail"::jsonb->'after'->>'idempotencyKey'=$1 ORDER BY "LogID" LIMIT 1`,[key])).rows[0];
  if(!prior)return null;
  if(prior.UserID!==actor.userId||prior.detail.after.requestHash!==hash)throw invalid('Idempotency key belongs to another request.',409,'IDEMPOTENCY_CONFLICT');
  const {idempotencyKey,requestHash,actorRole,enteredOnBehalf,...out}=prior.detail.after;
  return {...out,replayed:true};
}
export async function coordinate(body:unknown,actor:Actor,previousId?:number){
  staff(actor);const b=inputObject(body,previousId?['positionId','reason','idempotencyKey']:['registrationId','positionId','applicationId','reason','idempotencyKey']);
  const positionId=positiveId(b.positionId,'positionId'),reason=requiredText(b.reason,'reason',2000),key=requiredText(b.idempotencyKey,'idempotencyKey',100);
  const registrationId=previousId?null:positiveId(b.registrationId,'registrationId');
  const applicationId=b.applicationId===undefined?null:positiveId(b.applicationId,'applicationId');
  const hash=fingerprint({previousId:previousId??null,registrationId,positionId,...(applicationId===null?{}:{applicationId}),reason});
  return academicTransaction(async c=>{
    const prior=await replay(c,key,hash,actor);if(prior)return prior;
    const previous=previousId?await record(c,'coordinations',previousId):null;
    const r=await registration(c,previous?.RegistrationID??registrationId!);
    await noAssignment(c,r);
    if(previous){await latest(c,r,previousId!);if(!rejected(previous.Decision))throw invalid('Only rejected coordinations can be reassigned.',409,'COORDINATION_NOT_REJECTED');if(previous.PositionID===positionId)throw invalid('Choose a different position for reassignment.');}
    else if((await c.query('SELECT 1 FROM "StudentEnterpriseCoordination" WHERE "RegistrationID"=$1',[r.RegistrationID])).rowCount)throw invalid('Coordination already exists. Use reassign after rejection.',409,'COORDINATION_EXISTS');
    const p=await availablePosition(c,positionId,r.OJTSemesterID);
    const application=(await c.query(`SELECT * FROM "JobApplications" WHERE "RegistrationID"=$1 AND "PositionID"=$2 AND ($3::int IS NULL OR "ApplicationID"=$3) AND "Status" NOT IN ('REJECTED','WITHDRAWN') ORDER BY "ApplicationID" DESC LIMIT 1`,[r.RegistrationID,positionId,applicationId])).rows[0];
    if(applicationId&&!application)throw invalid('Ứng tuyển không khớp hồ sơ/vị trí hoặc đã kết thúc.',409,'APPLICATION_POSITION_MISMATCH');
    if(actor.roleCode==='OJT_COORD'&&!previous&&!application)throw invalid('Sinh viên phải chọn và ứng tuyển vị trí trước khi gửi hồ sơ cho doanh nghiệp.',409,'APPLICATION_REQUIRED');
    if(!previous&&!application&&(await c.query('SELECT 1 FROM "JobApplications" WHERE "RegistrationID"=$1',[r.RegistrationID])).rowCount)throw invalid('Chọn vị trí sinh viên đã ứng tuyển.',409,'APPLICATION_POSITION_MISMATCH');
    const after=await persist(c,'coordinations',{ApplicationID:application?.ApplicationID??null,RegistrationID:r.RegistrationID,OJTSemesterID:r.OJTSemesterID,EnterpriseID:p.EnterpriseID,PositionID:positionId,CoordinatedBy:actor.userId,Decision:'PENDING',PreviousCoordinationID:previousId??null});
    await log(c,'coordinations',null,after,actor,previous?'REASSIGN':'COORDINATE',reason,{idempotencyKey:key,requestHash:hash});
    return {...api('coordinations',after),replayed:false};
  });
}
export async function decision(id:number,body:unknown,actor:Actor){
  if(actor.roleCode==='OJT_COORD')throw invalid('QHDN cannot record enterprise acceptance decisions.',403,'FORBIDDEN');
  if(!['ADMIN','ENTERPRISE'].includes(actor.roleCode))throw invalid('Enterprise or Admin required.',403,'FORBIDDEN');
  const b=inputObject(body,['decision','reason',...(actor.roleCode==='ENTERPRISE'?['startDate','endDate','enterpriseSupervisorName']:[])]),value=enumValue(b.decision,['ACCEPTED','REJECTED'],'decision'),reason=requiredText(b.reason,'reason',value==='REJECTED'?300:2000);
  if(value==='REJECTED'&&['startDate','endDate','enterpriseSupervisorName'].some(key=>key in b))throw invalid('Internship details apply only to acceptance.');
  return academicTransaction(async c=>{
    const before=await record(c,'coordinations',id);await assertScope(c,actor,before.EnterpriseID);
    if(actor.roleCode==='ENTERPRISE'&&before.Decision==='ACCEPTED'&&value==='ACCEPTED'){
      const old=(await c.query('SELECT * FROM "InternshipAssignments" WHERE "CoordinationID"=$1 FOR UPDATE',[id])).rows[0];
      if(old){const assignment=existingAcceptance(old,b);return {...api('coordinations',before),assignment,assignmentId:assignment.id,replayed:true};}
    }
    const r=await registration(c,before.RegistrationID);await latest(c,r,id);
    if(before.Decision===value&&before.RejectReason===(value==='REJECTED'?reason:null)){
      const assignment=actor.roleCode==='ENTERPRISE'&&value==='ACCEPTED'?await acceptedAssignment(c,before,r,b,actor,reason):null;
      return {...api('coordinations',before),...(assignment?{assignment,assignmentId:assignment.id}:{}),replayed:true};
    }
    if(accepted(before.Decision)||rejected(before.Decision))throw invalid('The enterprise decision is already final.',409,'DECISION_FINAL');
    if((await c.query('SELECT 1 FROM "InternshipAssignments" WHERE "CoordinationID"=$1',[id])).rowCount)throw invalid('Coordination already has an assignment.',409);
    if(value==='ACCEPTED')await availablePosition(c,before.PositionID,r.OJTSemesterID);
    const after=(await c.query('UPDATE "StudentEnterpriseCoordination" SET "Decision"=$2,"DecisionAt"=now(),"RejectReason"=$3 WHERE "CoordinationID"=$1 RETURNING *',[id,value,value==='REJECTED'?reason:null])).rows[0];
    if(before.ApplicationID)await c.query('UPDATE "JobApplications" SET "Status"=$2,"ReviewedBy"=$3,"ReviewNote"=$4 WHERE "ApplicationID"=$1',[before.ApplicationID,value,actor.userId,reason]);
    const assignment=actor.roleCode==='ENTERPRISE'&&value==='ACCEPTED'?await acceptedAssignment(c,after,r,b,actor,reason):null;
    await log(c,'coordinations',before,after,actor,'ENTERPRISE_DECISION',reason);return {...api('coordinations',after),...(assignment?{assignment,assignmentId:assignment.id}:{}),replayed:false};
  });
}
async function acceptedAssignment(c:PoolClient,co:Row,r:Row,b:Row,actor:Actor,reason:string){
  const old=(await c.query('SELECT * FROM "InternshipAssignments" WHERE "CoordinationID"=$1 FOR UPDATE',[co.CoordinationID])).rows[0];
  if(old)return existingAcceptance(old,b);
  await noAssignment(c,r);
  await availablePosition(c,co.PositionID,r.OJTSemesterID);
  const term=(await c.query('SELECT "StartDate","EndDate" FROM "OJTSemesters" WHERE "OJTSemesterID"=$1',[r.OJTSemesterID])).rows[0];
  if((b.startDate??term?.StartDate)==null||(b.endDate??term?.EndDate)==null)throw invalid('Configure semester dates or provide internship dates.',409,'INTERNSHIP_DATES_REQUIRED');
  const dates=assignmentDates(b,term);
  if(term?.StartDate&&term?.EndDate){const bounds=assignmentDates({},term);if(dates.StartDate<bounds.StartDate||dates.EndDate>bounds.EndDate)throw invalid('Internship dates must remain within the OJT semester.',409,'INTERNSHIP_DATES_OUT_OF_RANGE');}
  const row=await persist(c,'assignments',{CoordinationID:co.CoordinationID,StudentID:r.StudentID,EnterpriseID:co.EnterpriseID,PositionID:co.PositionID,EnterpriseSupervisorName:optionalText(b.enterpriseSupervisorName,'enterpriseSupervisorName',100),...dates,Status:'ACTIVE'});
  await refreshSlots(c,co.PositionID);
  await log(c,'assignments',null,row,actor,'ASSIGN_ON_ACCEPT',reason);
  return api('assignments',row);
}
function existingAcceptance(old:Row,b:Row){
  if(b.startDate!==undefined||b.endDate!==undefined){const requested=assignmentDates(b,old),existing=assignmentDates({},old);if(requested.StartDate!==existing.StartDate||requested.EndDate!==existing.EndDate)throw invalid('This acceptance already created an internship with different dates.',409,'INTERNSHIP_ALREADY_CREATED');}
  if(b.enterpriseSupervisorName!==undefined&&optionalText(b.enterpriseSupervisorName,'enterpriseSupervisorName',100)!==old.EnterpriseSupervisorName)throw invalid('This acceptance already created an internship with another supervisor.',409,'INTERNSHIP_ALREADY_CREATED');
  return api('assignments',old);
}
function assignmentDates(b:Row,before?:Row){
  const day=(v:any)=>v instanceof Date?`${v.getFullYear()}-${String(v.getMonth()+1).padStart(2,'0')}-${String(v.getDate()).padStart(2,'0')}`:v;
  const start=dateInput(b.startDate??day(before?.StartDate),'startDate'),end=dateInput(b.endDate??day(before?.EndDate),'endDate');dateRange(start,end);return {StartDate:start,EndDate:end};
}
export async function assign(body:unknown,actor:Actor){
  if(actor.roleCode==='OJT_COORD')throw invalid('QHDN cannot create internship assignments.',403,'FORBIDDEN');
  staff(actor);const b=inputObject(body,['coordinationId','enterpriseSupervisorName','startDate','endDate','reason']);
  const coordinationId=positiveId(b.coordinationId,'coordinationId'),reason=requiredText(b.reason,'reason',2000),dates=assignmentDates(b);
  return academicTransaction(async c=>{
    const co=await record(c,'coordinations',coordinationId),r=await registration(c,co.RegistrationID);await latest(c,r,coordinationId);
    if(!accepted(co.Decision))throw invalid('An accepted coordination is required.',409,'COORDINATION_NOT_ACCEPTED');
    await noAssignment(c,r);
    if((await c.query('SELECT 1 FROM "InternshipAssignments" WHERE "CoordinationID"=$1',[coordinationId])).rowCount)throw invalid('Coordination already has an assignment.',409,'ASSIGNMENT_EXISTS');
    const p=await availablePosition(c,co.PositionID,r.OJTSemesterID);
    if(p.EnterpriseID!==co.EnterpriseID)throw invalid('Coordination and position company do not match.',409);
    const after=await persist(c,'assignments',{CoordinationID:coordinationId,StudentID:r.StudentID,EnterpriseID:co.EnterpriseID,PositionID:co.PositionID,EnterpriseSupervisorName:optionalText(b.enterpriseSupervisorName,'enterpriseSupervisorName',100),...dates,Status:'ASSIGNED'});
    await refreshSlots(c,p.PositionID);await log(c,'assignments',null,after,actor,'ASSIGN',reason);return api('assignments',after);
  });
}
async function updateAssignmentFields(id:number,body:unknown,actor:Actor,client:PoolClient) {staff(actor);const b=inputObject(body,['enterpriseSupervisorName','startDate','endDate','reason']),reason=requiredText(b.reason,'reason',2000);
  if(!['enterpriseSupervisorName','startDate','endDate'].some(k=>k in b))throw invalid('Provide an editable field.');
  const c=client;
    const before=await record(c,'assignments',id);await mutableAssignment(c,id);
    if((await c.query('SELECT 1 FROM "InternshipEvaluations" WHERE "AssignmentID"=$1 AND "Status"=\'SUBMITTED\'',[id])).rowCount)throw invalid('An officially evaluated assignment cannot be edited.',409,'OJT_SCORE_FINALIZED');
    if(!['ASSIGNED','ACTIVE','IN_PROGRESS'].includes(String(before.Status).toUpperCase()))throw invalid('Only pending or active assignments can change.',409);
    const values:Row=assignmentDates(b,before);
    if('enterpriseSupervisorName' in b)values.EnterpriseSupervisorName=optionalText(b.enterpriseSupervisorName,'enterpriseSupervisorName',100);
    const after=await persist(c,'assignments',values,id);await log(c,'assignments',before,after,actor,'UPDATE_ASSIGNMENT',reason);return api('assignments',after);

}
async function assignmentStatus(id:number,body:unknown,actor:Actor,client:PoolClient) {staff(actor);const b=inputObject(body,['status','reason']),value=enumValue(b.status,['ACTIVE','COMPLETED','CANCELLED'],'status'),reason=requiredText(b.reason,'reason',2000);
  const c=client;
    const before=await record(c,'assignments',id);await mutableAssignment(c,id);
    const current=String(before.Status??'ASSIGNED').toUpperCase();
    if(current===value)return {...api('assignments',before),replayed:true};
    const transitions:Row={ASSIGNED:['ACTIVE','CANCELLED'],ACTIVE:['COMPLETED','CANCELLED'],IN_PROGRESS:['COMPLETED','CANCELLED']};
    if(!transitions[current]?.includes(value))throw invalid('Invalid assignment status transition.',409,'ASSIGNMENT_STATUS_CONFLICT');
    if(value==='COMPLETED'&&!(await c.query('SELECT 1 FROM "InternshipEvaluations" WHERE "AssignmentID"=$1 AND "OverallScore" IS NOT NULL',[id])).rowCount)throw invalid('Submit an evaluation before completing the assignment.',409,'EVALUATION_REQUIRED');
    if(value==='CANCELLED'&&(await c.query('SELECT 1 FROM "OJTResults" WHERE "AssignmentID"=$1 UNION ALL SELECT 1 FROM "InternshipEvaluations" WHERE "AssignmentID"=$1 AND "Status"=\'SUBMITTED\'',[id])).rowCount)throw invalid('Cannot cancel an assignment with an official result.',409,'ASSIGNMENT_HAS_RESULT');
    await record(c,'positions',before.PositionID);
    const after=await persist(c,'assignments',{Status:value},id);await refreshSlots(c,before.PositionID);await log(c,'assignments',before,after,actor,'ASSIGNMENT_STATUS',reason);return api('assignments',after);

}
export async function evaluate(id:number,body:unknown,actor:Actor){
  if(actor.roleCode!=='ENTERPRISE')throw invalid('Only the enterprise may submit official OJT scores.',403,'FORBIDDEN');
  const b=inputObject(body,['completionScore','attitudeScore','skillScore','overallScore','comments','reason']),reason=requiredText(b.reason,'reason',2000),values:Row={};
  for(const key of ['completionScore','attitudeScore','skillScore','overallScore']){
    const value=score(b[key],10,key);if(value===null)throw invalid(`${key} is required.`);values[key[0].toUpperCase()+key.slice(1)]=value;
  }
  values.Comments=optionalText(b.comments,'comments',5000);
  return academicTransaction(async c=>{
    const a=await record(c,'assignments',id);await assertScope(c,actor,a.EnterpriseID);await mutableAssignment(c,id,true);
    if(!['ACTIVE','IN_PROGRESS','COMPLETED'].includes(String(a.Status).toUpperCase()))throw invalid('Only active or completed internships can be evaluated.',409,'ASSIGNMENT_NOT_ACTIVE');
    const before=(await c.query('SELECT * FROM "InternshipEvaluations" WHERE "AssignmentID"=$1 FOR UPDATE',[id])).rows[0]??null;
    if(before?.Status==='SUBMITTED') {
      const closed=(await c.query(`SELECT GREATEST(a."EndDate",t."EndDate") < (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS closed
        FROM "InternshipAssignments" a JOIN "StudentEnterpriseCoordination" co ON co."CoordinationID"=a."CoordinationID"
        JOIN "OJTSemesters" t ON t."OJTSemesterID"=co."OJTSemesterID" WHERE a."AssignmentID"=$1`,[id])).rows[0];
      if(closed?.closed)throw invalid('Official scores are immutable after the OJT period ends.',409,'OJT_SCORE_FINALIZED');
    }
    values.AssignmentID=id;values.EvaluatedBy=actor.userId;values.EvaluatedAt=new Date();values.Status='SUBMITTED';
    const after=await persist(c,'evaluations',values,before?.EvaluationID);
    if(['ACTIVE','IN_PROGRESS'].includes(String(a.Status).toUpperCase())){
      const completed=await persist(c,'assignments',{Status:'COMPLETED'},id);
      await log(c,'assignments',a,completed,actor,'COMPLETE_ON_EVALUATION',reason);
    }
    await log(c,'evaluations',before,after,actor,before?'UPDATE_EVALUATION':'SUBMIT_EVALUATION',reason);return {...api('evaluations',after),assignmentStatus:'COMPLETED'};
  });
}

export async function updateAssignment(id:number,body:unknown,actor:Actor) {
 if(actor.roleCode==='OJT_COORD')throw invalid('QHDN cannot update internship assignments.',403,'FORBIDDEN');
 staff(actor);const b=inputObject(body,['enterpriseSupervisorName','startDate','endDate','status','reason']);
 const {status,...fields}=b;
 const hasFields=Object.keys(fields).some(key=>key!=='reason');
 if(!hasFields&&status===undefined)throw invalid('Provide a field or status to update.');
 return academicTransaction(async client=>{
  let result;
  if(hasFields)result=await updateAssignmentFields(id,fields,actor,client);
  if(status!==undefined)result=await assignmentStatus(id,{status,reason:b.reason},actor,client);
  return result;
 });
}
