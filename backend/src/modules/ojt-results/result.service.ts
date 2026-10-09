import type { PoolClient } from 'pg';
import { academicTransaction, audit } from '../academic/academic.repository';
import { invalid, inputObject, positiveId, requiredText, optionalText, score, enumValue, pagination } from '../students/student.validation';
import { fingerprint } from '../eligibility/eligibility.service';
import { syncOfficialGrade } from './grade-sync';

type Row = Record<string, any>;
export const statuses = ['PENDING_ACADEMIC_CONFIRMATION', 'REVISION_REQUESTED', 'CONFIRMED'];
const select = `SELECT r.*, s."StudentCode", u."FullName", e."Name" AS "EnterpriseName", t."SemesterCode"
 FROM "OJTResults" r JOIN "Students" s ON s."StudentID"=r."StudentID"
 JOIN "Users" u ON u."UserID"=s."UserID" JOIN "InternshipAssignments" a ON a."AssignmentID"=r."AssignmentID"
 JOIN "Enterprises" e ON e."EnterpriseID"=a."EnterpriseID" JOIN "OJTSemesters" t ON t."OJTSemesterID"=r."OJTSemesterID"`;
export function resultApi(r: Row) {
  return { id:r.ResultID, assignmentId:r.AssignmentID, studentId:r.StudentID, studentCode:r.StudentCode,
    fullName:r.FullName, enterpriseName:r.EnterpriseName, ojtSemesterId:r.OJTSemesterID, semesterCode:r.SemesterCode,
    status:r.Status, version:r.Version, dossier:r.Dossier, source:r.SourceSnapshot,
    officialScore:r.OfficialScore == null ? null : Number(r.OfficialScore), outcome:r.Outcome,
    academicNote:r.AcademicNote, transferredBy:r.TransferredBy, transferredAt:r.TransferredAt,
    updatedAt:r.UpdatedAt, confirmedBy:r.ConfirmedBy, confirmedAt:r.ConfirmedAt, confirmationReason:r.ConfirmationReason,
    courseResultId:r.CourseResultID,gradeMappingId:r.GradeMappingID,gradeMapping:r.GradeMappingSnapshot };
}
async function record(c:PoolClient, id:number):Promise<Row> {
  const r=(await c.query(`${select} WHERE r."ResultID"=$1 FOR UPDATE OF r`,[id])).rows[0];
  if(!r) throw invalid('OJT result not found.',404,'OJT_RESULT_NOT_FOUND');
  return r;
}
function expected(r:Row, version:unknown) {
  if(r.Version!==positiveId(version,'expectedVersion')) throw invalid('The result changed. Reload it before updating.',409,'OJT_RESULT_VERSION_CONFLICT');
  if(r.Status==='CONFIRMED') throw invalid('Confirmed OJT results are immutable.',409,'OJT_RESULT_CONFIRMED');
}
function dossier(value:unknown) {
  const b=inputObject(value,['summary','documents']);
  const summary=requiredText(b.summary,'dossier.summary',5000);
  if(!Array.isArray(b.documents)||!b.documents.length||b.documents.length>20) throw invalid('dossier.documents must contain 1–20 documents.');
  const documents=b.documents.map((v,i)=>{
    const d=inputObject(v,['name','url']), name=requiredText(d.name,`documents[${i}].name`,200), url=requiredText(d.url,`documents[${i}].url`,2000);
    let parsed:URL; try { parsed=new URL(url); } catch { throw invalid('Document URL is invalid.'); }
    if(!['http:','https:'].includes(parsed.protocol)||parsed.username||parsed.password) throw invalid('Documents require HTTP(S) URLs without credentials.');
    return {name,url};
  });
  return {summary,documents};
}
async function source(c:PoolClient, assignmentId:number) {
  // Lock the mutable source rows as well as the result so a concurrent QHDN update cannot race confirmation.
  const a=(await c.query('SELECT * FROM "InternshipAssignments" WHERE "AssignmentID"=$1 FOR UPDATE',[assignmentId])).rows[0];
  if(!a) throw invalid('Internship assignment not found.',404);
  const co=(await c.query('SELECT * FROM "StudentEnterpriseCoordination" WHERE "CoordinationID"=$1 FOR UPDATE',[a.CoordinationID])).rows[0];
  const r=(await c.query('SELECT * FROM "OJTRegistrations" WHERE "RegistrationID"=$1 FOR UPDATE',[co.RegistrationID])).rows[0];
  const p=(await c.query('SELECT * FROM "InternshipPositions" WHERE "PositionID"=$1 FOR UPDATE',[a.PositionID])).rows[0];
  if(a.StudentID!==r.StudentID||a.EnterpriseID!==co.EnterpriseID||a.PositionID!==co.PositionID||
    co.OJTSemesterID!==r.OJTSemesterID||p.EnterpriseID!==a.EnterpriseID||p.OJTSemesterID!==r.OJTSemesterID)
    throw invalid('Assignment, registration and enterprise context do not match.',409,'OJT_RESULT_CONTEXT_MISMATCH');
  if(['CANCELLED','CANCELED'].includes(String(a.Status).toUpperCase())) throw invalid('Cancelled assignments cannot have official results.',409);
  const evaluation=(await c.query('SELECT * FROM "InternshipEvaluations" WHERE "AssignmentID"=$1 FOR UPDATE',[assignmentId])).rows[0];
  if(!evaluation||!evaluation.EvaluatedAt||evaluation.OverallScore==null) throw invalid('An internship evaluation with an overall score is required.',409,'OJT_EVALUATION_REQUIRED');
  for(const field of ['CompletionScore','AttitudeScore','SkillScore','OverallScore']) if(evaluation[field]!=null) score(Number(evaluation[field]),10,field);
  return { assignment:{id:a.AssignmentID,coordinationId:a.CoordinationID,registrationId:r.RegistrationID,
    studentId:a.StudentID,enterpriseId:a.EnterpriseID,positionId:a.PositionID,ojtSemesterId:r.OJTSemesterID,
    supervisor:a.EnterpriseSupervisorName,startDate:a.StartDate,endDate:a.EndDate,status:a.Status}, evaluation };
}
async function event(c:PoolClient,r:Row,actor:number,action:string,reason:string,key?:string,hash?:string) {
  await c.query(`INSERT INTO "OJTResultEvents" ("ResultID","Version","Action","Snapshot","Reason","CreatedBy","IdempotencyKey","RequestHash")
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,[r.ResultID,r.Version,action,JSON.stringify(resultApi(r)),reason,actor,key??null,hash??null]);
}
export async function transfer(body:unknown,actor:number,id?:number) {
  const b=inputObject(body,id?['expectedVersion','dossier','reason','idempotencyKey']:['assignmentId','dossier','reason','idempotencyKey']);
  const form=dossier(b.dossier),reason=requiredText(b.reason,'reason',2000),key=requiredText(b.idempotencyKey,'idempotencyKey',100);
  const assignmentId=id?null:positiveId(b.assignmentId,'assignmentId');
  if(id)positiveId(b.expectedVersion,'expectedVersion');
  const hash=fingerprint({id:id??null,assignmentId,dossier:form,reason,expectedVersion:b.expectedVersion??null});
  return academicTransaction(async c=>{
    const prior=(await c.query('SELECT * FROM "OJTResultEvents" WHERE "IdempotencyKey"=$1',[key])).rows[0];
    if(prior){if(prior.CreatedBy!==actor||prior.RequestHash!==hash)throw invalid('Idempotency key belongs to a different transfer.',409,'IDEMPOTENCY_CONFLICT');return {...prior.Snapshot,replayed:true};}
    const before=id?await record(c,id):null;
    if(before)expected(before,b.expectedVersion);
    const snapshot=await source(c,before?.AssignmentID??assignmentId!);
    if(before&&before.Status!=='REVISION_REQUESTED')throw invalid('Only results awaiting revision can be resubmitted.',409);
    if(!before&&(await c.query('SELECT 1 FROM "OJTResults" WHERE "StudentID"=$1 AND "OJTSemesterID"=$2',
      [snapshot.assignment.studentId,snapshot.assignment.ojtSemesterId])).rowCount)
      throw invalid('A result already exists for this student and OJT semester.',409,'OJT_RESULT_EXISTS');
    const values=[JSON.stringify(form),JSON.stringify(snapshot),fingerprint(snapshot),actor];
    const row=before?(await c.query(`UPDATE "OJTResults" SET "Dossier"=$1,"SourceSnapshot"=$2,"SourceHash"=$3,"TransferredBy"=$4,
      "TransferredAt"=now(),"UpdatedAt"=now(),"Version"="Version"+1,"Status"='PENDING_ACADEMIC_CONFIRMATION',
      "OfficialScore"=NULL,"Outcome"=NULL,"AcademicNote"=NULL WHERE "ResultID"=$5 RETURNING "ResultID"`,[...values,id])).rows[0]:
      (await c.query(`INSERT INTO "OJTResults" ("Dossier","SourceSnapshot","SourceHash","TransferredBy","AssignmentID","StudentID","OJTSemesterID")
        VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING "ResultID"`,[...values,assignmentId,snapshot.assignment.studentId,snapshot.assignment.ojtSemesterId])).rows[0];
    const after=await record(c,row.ResultID);await event(c,after,actor,before?'RESUBMITTED':'TRANSFERRED',reason,key,hash);
    await audit(c,actor,'OJTResults',after.ResultID,before?'RESUBMIT':'TRANSFER',before?resultApi(before):null,resultApi(after),reason);
    return {...resultApi(after),replayed:false};
  });
}
export async function details(id:number) {
  return academicTransaction(async c=>{
    const r=await record(c,id),history=(await c.query(`SELECT "EventID" AS id,"Version" AS version,"Action" AS action,"Snapshot" AS snapshot,
      "Reason" AS reason,"CreatedBy" AS "createdBy","CreatedAt" AS "createdAt" FROM "OJTResultEvents" WHERE "ResultID"=$1 ORDER BY "EventID"`,[id])).rows;
    return {...resultApi(r),history};
  });
}
export async function change(id:number,body:unknown,actor:number,action:'REVISION_REQUESTED'|'UPDATED'|'CONFIRMED') {
  const b=inputObject(body,action==='UPDATED'?['expectedVersion','officialScore','outcome','academicNote','reason']:['expectedVersion','reason']);
  positiveId(b.expectedVersion,'expectedVersion');const reason=requiredText(b.reason,'reason',2000);
  let officialScore:number|null=null,outcome:string|null=null,note:string|null=null;
  if(action==='UPDATED') {
    officialScore=score(b.officialScore,10,'officialScore');if(officialScore===null)throw invalid('officialScore is required.');
    outcome=enumValue(b.outcome,['PASSED','FAILED'],'outcome');note=optionalText(b.academicNote,'academicNote',5000);
  }
  return academicTransaction(async c=>{
    const before=await record(c,id);
    if(action==='CONFIRMED'&&before.Status==='CONFIRMED'&&before.ConfirmedBy===actor&&before.ConfirmationReason===reason&&before.Version===Number(b.expectedVersion)+1&&before.CourseResultID)return {...resultApi(before),replayed:true};
    expected(before,b.expectedVersion);
    if(before.Status!=='PENDING_ACADEMIC_CONFIRMATION')throw invalid('Wait for QHDN to resubmit the revised dossier.',409,'OJT_RESULT_REVISION_PENDING');
    if(action!=='REVISION_REQUESTED') {
      const current=await source(c,before.AssignmentID);
      if(fingerprint(current)!==before.SourceHash)throw invalid('The source evaluation or assignment changed. Request revision and QHDN resubmission.',409,'OJT_RESULT_SOURCE_CHANGED');
    }
    if(action==='CONFIRMED'&&(before.OfficialScore==null||!before.Outcome))throw invalid('Enter the official score and outcome before confirmation.',409,'OJT_OFFICIAL_RESULT_REQUIRED');
    if(action==='UPDATED') await c.query(`UPDATE "OJTResults" SET "OfficialScore"=$2,"Outcome"=$3,"AcademicNote"=$4,"Version"="Version"+1,"UpdatedAt"=now() WHERE "ResultID"=$1`,[id,officialScore,outcome,note]);
    else if(action==='REVISION_REQUESTED') await c.query(`UPDATE "OJTResults" SET "Status"='REVISION_REQUESTED',"OfficialScore"=NULL,"Outcome"=NULL,"AcademicNote"=NULL,"Version"="Version"+1,"UpdatedAt"=now() WHERE "ResultID"=$1`,[id]);
    else {
      const synced=await syncOfficialGrade(c,before,actor,reason);
      await c.query(`UPDATE "OJTResults" SET "Status"='CONFIRMED',"ConfirmedBy"=$2,"ConfirmedAt"=now(),"ConfirmationReason"=$3,"Version"="Version"+1,"UpdatedAt"=now(),"CourseResultID"=$4,"GradeMappingID"=$5,"GradeMappingSnapshot"=$6 WHERE "ResultID"=$1`,[id,actor,reason,synced.courseResultId,synced.mappingId,JSON.stringify(synced.mappingSnapshot)]);
      await c.query(`UPDATE "InternshipAssignments" SET "Status"=$2 WHERE "AssignmentID"=$1`,[before.AssignmentID,before.Outcome==='PASSED'?'COMPLETED':'FAILED']);
    }
    const after=await record(c,id);await event(c,after,actor,action,reason);
    await audit(c,actor,'OJTResults',id,action,resultApi(before),resultApi(after),reason);return resultApi(after);
  });
}
export async function list(params:Row,semesterId?:number,exportAll=false) {
  const p=pagination(params,['status','ojtSemesterId','studentId','search',...(exportAll?['format']:[])]);
  if(p.offset>2147483647)throw invalid('Pagination exceeds the allowed range.');
  const args:unknown[]=[],filters:string[]=[];
  const add=(column:string,value:unknown)=>{args.push(value);filters.push(`${column}=$${args.length}`);};
  if(params.status!==undefined)add('r."Status"',enumValue(params.status,statuses,'status'));
  if(params.studentId!==undefined)add('r."StudentID"',positiveId(params.studentId,'studentId'));
  if(params.ojtSemesterId!==undefined){const term=positiveId(params.ojtSemesterId,'ojtSemesterId');if(semesterId&&semesterId!==term)throw invalid('ojtSemesterId conflicts with the path.');semesterId=term;}
  if(semesterId)add('r."OJTSemesterID"',semesterId);
  if(params.search!==undefined){args.push('%'+requiredText(params.search,'search',100)+'%');filters.push(`(s."StudentCode" ILIKE $${args.length} OR u."FullName" ILIKE $${args.length})`);}
  if(exportAll&&(params.page!==undefined||params.limit!==undefined))throw invalid('Export does not support pagination.');
  return academicTransaction(async c=>{
    if(semesterId&&!(await c.query('SELECT 1 FROM "OJTSemesters" WHERE "OJTSemesterID"=$1',[semesterId])).rowCount)throw invalid('OJT semester not found.',404);
    const sql=`${select} ${filters.length?'WHERE '+filters.join(' AND '):''}`;
    const count=(await c.query(`SELECT count(*)::int AS total FROM (${sql}) data`,args)).rows[0].total;
    if(exportAll&&count>10000)throw invalid('Export exceeds 10000 results. Narrow the filters.',422,'OJT_EXPORT_TOO_LARGE');
    const rows=(await c.query(`${sql} ORDER BY r."ResultID" ${exportAll?'':`LIMIT $${args.length+1} OFFSET $${args.length+2}`}`,exportAll?args:[...args,p.limit,p.offset])).rows;
    return {items:rows.map(resultApi),total:count,...(exportAll?{ojtSemesterId:semesterId}:{page:p.page,limit:p.limit})};
  });
}
export function resultCsv(items:ReturnType<typeof resultApi>[]) {
  const cell=(v:unknown)=>{let s=v==null?'':String(v);if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
  const columns=['id','studentCode','fullName','semesterCode','enterpriseName','status','officialScore','outcome','confirmedAt'] as const;
  return '\uFEFF'+[columns.join(','),...items.map(r=>columns.map(k=>cell(r[k] instanceof Date?(r[k] as Date).toISOString():r[k])).join(','))].join('\r\n')+'\r\n';
}
