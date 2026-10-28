import type { PoolClient } from 'pg';
import { academicTransaction,audit } from '../academic/academic.repository';
import { invalid,inputObject,positiveId,requiredText } from '../students/student.validation';
import { fingerprint } from '../eligibility/eligibility.service';
import type { Actor,Row } from '../ojt-registration/window.service';
import { syncOfficialGrade } from './grade-sync';
const projection=(r:Row)=>({resultId:r.ResultID,assignmentId:r.AssignmentID,studentId:r.StudentID,ojtSemesterId:r.OJTSemesterID,status:r.Status,version:r.Version,officialScore:r.OfficialScore==null?null:Number(r.OfficialScore),outcome:r.Outcome,courseResultId:r.CourseResultID,confirmedAt:r.ConfirmedAt});
async function source(c:PoolClient,id:number){
 const row=(await c.query(`SELECT a."StudentID",a."EnterpriseID",a."PositionID",a."Status" AS "AssignmentStatus",co."OJTSemesterID",r."ProgramID",ev."EvaluationID",ev."Status",ev."OverallScore",ev."CompletionScore",ev."AttitudeScore",ev."SkillScore",ev."Comments",ev."EvaluatedAt",ev."EvaluatedBy"
 FROM "InternshipAssignments" a JOIN "StudentEnterpriseCoordination" co ON co."CoordinationID"=a."CoordinationID" JOIN "OJTRegistrations" r ON r."RegistrationID"=co."RegistrationID" JOIN "InternshipEvaluations" ev ON ev."AssignmentID"=a."AssignmentID" WHERE a."AssignmentID"=$1 FOR UPDATE OF a,ev`,[id])).rows[0];
 if(!row||row.Status!=='SUBMITTED'||!row.EvaluatedAt||row.OverallScore==null||!['COMPLETED','FAILED'].includes(row.AssignmentStatus))throw invalid('A completed internship with a submitted enterprise evaluation is required.',409,'OJT_RESULT_NOT_READY');
 return row;
}
async function resultEvent(c:PoolClient,r:Row,action:string,actor:number,reason:string,key?:string,hash?:string){await c.query(`INSERT INTO "OJTResultEvents" ("ResultID","Version","Action","Snapshot","Reason","CreatedBy","IdempotencyKey","RequestHash") VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,[r.ResultID,r.Version,action,JSON.stringify(projection(r)),reason,actor,key??null,hash??null]);}
async function replay(c:PoolClient,key:string,hash:string,actor:number){const r=(await c.query('SELECT * FROM "OJTResultEvents" WHERE "IdempotencyKey"=$1',[key])).rows[0];if(!r)return null;if(r.RequestHash!==hash||r.CreatedBy!==actor)throw invalid('Idempotency key belongs to another request.',409,'IDEMPOTENCY_CONFLICT');return {...r.Snapshot,replayed:true};}
export async function transferResult(body:unknown,actor:Actor){
 if(!['ADMIN','OJT_COORD'].includes(actor.roleCode))throw invalid('Only QHDN can transfer OJT results.',403,'FORBIDDEN');
 const b=inputObject(body,['assignmentId','reason','idempotencyKey','expectedVersion']),id=positiveId(b.assignmentId,'assignmentId'),reason=requiredText(b.reason,'reason',2000),key=requiredText(b.idempotencyKey,'idempotencyKey',100),expectedVersion=b.expectedVersion===undefined?undefined:positiveId(b.expectedVersion,'expectedVersion'),hash=fingerprint({action:'TRANSFER',id,reason,...(expectedVersion===undefined?{}:{expectedVersion})});
 return academicTransaction(async c=>{
  const previous=await replay(c,key,hash,actor.userId);if(previous)return previous;
  const snapshot=await source(c,id),old=(await c.query('SELECT * FROM "OJTResults" WHERE "AssignmentID"=$1 FOR UPDATE',[id])).rows[0];
  if(old){
   if(old.Status==='CONFIRMED')throw invalid('Confirmed results are immutable.',409,'OJT_RESULT_CONFIRMED');
   if(expectedVersion===undefined)throw invalid('Provide expectedVersion to resubmit the existing result.',409,'OJT_RESULT_EXISTS');
   if(old.Version!==expectedVersion)throw invalid('Result changed. Reload its current version.',409,'OJT_RESULT_VERSION_CONFLICT');
   const updated=(await c.query(`UPDATE "OJTResults" SET "Status"='PENDING_ACADEMIC_CONFIRMATION',"Version"="Version"+1,"Dossier"=$2,"SourceSnapshot"=$3,"SourceHash"=$4,"OfficialScore"=NULL,"Outcome"=NULL,"AcademicNote"=NULL,"TransferredBy"=$5,"TransferredAt"=now(),"UpdatedAt"=now() WHERE "ResultID"=$1 RETURNING *`,[old.ResultID,JSON.stringify({reason}),JSON.stringify(snapshot),fingerprint(snapshot),actor.userId])).rows[0];
   await resultEvent(c,updated,'RESUBMITTED',actor.userId,reason,key,hash);await audit(c,actor.userId,'OJTResults',old.ResultID,'RESUBMIT',projection(old),projection(updated),reason);return {...projection(updated),replayed:false};
  }
  if(expectedVersion!==undefined)throw invalid('expectedVersion applies only to an existing result.');
  const row=(await c.query(`INSERT INTO "OJTResults" ("AssignmentID","StudentID","OJTSemesterID","Dossier","SourceSnapshot","SourceHash","TransferredBy") VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,[id,snapshot.StudentID,snapshot.OJTSemesterID,JSON.stringify({reason}),JSON.stringify(snapshot),fingerprint(snapshot),actor.userId])).rows[0];
  await resultEvent(c,row,'TRANSFERRED',actor.userId,reason,key,hash);await audit(c,actor.userId,'OJTResults',row.ResultID,'TRANSFER',null,projection(row),reason);return {...projection(row),replayed:false};
 });
}
export async function confirmResult(id:number,body:unknown,actor:Actor){
 if(!['ADMIN','ACADEMIC'].includes(actor.roleCode))throw invalid('Only ACADEMIC can confirm results.',403,'FORBIDDEN');
 const b=inputObject(body,['reason','idempotencyKey']),reason=requiredText(b.reason,'reason',2000),key=requiredText(b.idempotencyKey,'idempotencyKey',100),hash=fingerprint({action:'CONFIRM',id,reason});
 return academicTransaction(async c=>{
  const previous=await replay(c,key,hash,actor.userId);if(previous)return previous;
  const r=(await c.query('SELECT * FROM "OJTResults" WHERE "ResultID"=$1 FOR UPDATE',[id])).rows[0];
  if(!r)throw invalid('OJT result not found.',404,'OJT_RESULT_NOT_FOUND');
  if(r.Status!=='PENDING_ACADEMIC_CONFIRMATION')throw invalid('Only pending results can be confirmed.',409,'OJT_RESULT_NOT_PENDING');
  const snapshot=await source(c,r.AssignmentID);
  if(fingerprint(snapshot)!==r.SourceHash)throw invalid('Evaluation changed after transfer; QHDN must resubmit the result.',409,'OJT_RESULT_SOURCE_CHANGED');
  const m=(await c.query('SELECT * FROM "ProgramOJTGradeMappings" WHERE "ProgramID"=$1 AND "OJTSemesterID"=$2 FOR UPDATE',[snapshot.ProgramID,r.OJTSemesterID])).rows[0];
  if(!m)throw invalid('Configure the OJT course and grade bands first.',409,'OJT_GRADE_MAPPING_REQUIRED');
  const score=Number(snapshot.OverallScore),band=[...m.GradeBands].sort((a,b)=>b.minimumScore-a.minimumScore).find(b=>score>=b.minimumScore);
  if(!band)throw invalid('No grade band matches this score.',409,'OJT_GRADE_MAPPING_INVALID');
  // Record the score before the linked grade so the existing DB guards can verify both sides.
  let updated=(await c.query(`UPDATE "OJTResults" SET "OfficialScore"=$2,"Outcome"=$3,"Version"="Version"+1,"UpdatedAt"=now() WHERE "ResultID"=$1 RETURNING *`,[id,score,band.outcome])).rows[0];
  await resultEvent(c,updated,'UPDATED',actor.userId,reason);
  const grade=await syncOfficialGrade(c,updated,actor.userId,reason);
  updated=(await c.query(`UPDATE "OJTResults" SET "Status"='CONFIRMED',"Version"="Version"+1,"ConfirmedBy"=$2,"ConfirmedAt"=now(),"ConfirmationReason"=$3,"CourseResultID"=$4,"GradeMappingID"=$5,"GradeMappingSnapshot"=$6,"UpdatedAt"=now() WHERE "ResultID"=$1 RETURNING *`,[id,actor.userId,reason,grade.courseResultId,grade.mappingId,JSON.stringify(grade.mappingSnapshot)])).rows[0];
  await resultEvent(c,updated,'CONFIRMED',actor.userId,reason,key,hash);await audit(c,actor.userId,'OJTResults',id,'CONFIRM',projection(r),projection(updated),reason);return {...projection(updated),replayed:false};
 });
}
