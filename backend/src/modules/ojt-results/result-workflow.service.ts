import type { PoolClient } from 'pg';
import { academicTransaction,audit } from '../academic/academic.repository';
import { invalid,inputObject,positiveId,requiredText } from '../students/student.validation';
import { fingerprint } from '../eligibility/eligibility.service';
import type { Actor,Row } from '../ojt-registration/window.service';
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
 const b=inputObject(body,['assignmentId','reason','idempotencyKey']),id=positiveId(b.assignmentId,'assignmentId'),reason=requiredText(b.reason,'reason',2000),key=requiredText(b.idempotencyKey,'idempotencyKey',100),hash=fingerprint({action:'TRANSFER',id,reason});
 return academicTransaction(async c=>{
  const previous=await replay(c,key,hash,actor.userId);if(previous)return previous;
  const snapshot=await source(c,id),old=(await c.query('SELECT * FROM "OJTResults" WHERE "AssignmentID"=$1 FOR UPDATE',[id])).rows[0];
  if(old)throw invalid('A result has already been transferred for this assignment.',409,'OJT_RESULT_EXISTS');
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
  const student=(await c.query(`SELECT s."CurrentSemester",s."ProgramID",
    "StudentCurriculumSemester"(s."StudentID",p."CurrentAcademicPeriodID") AS stage
    FROM "Students" s LEFT JOIN "StudentAcademicPlacements" p USING("StudentID")
    WHERE s."StudentID"=$1 FOR UPDATE OF s`,[r.StudentID])).rows[0];
  if(!student||student.ProgramID!==snapshot.ProgramID)throw invalid('Student curriculum changed after registration. Reconcile the OJT result first.',409,'REGISTRATION_PROGRAM_CHANGED');
  if(student.CurrentSemester<6||student.stage!==student.CurrentSemester)throw invalid('Advance the student academic placement to OJT semester 6 before recording the official grade.',409,'OJT_STUDENT_PERIOD_NOT_READY');
  const score=Number(snapshot.OverallScore),band=[...m.GradeBands].sort((a,b)=>b.minimumScore-a.minimumScore).find(b=>score>=b.minimumScore);
  if(!band)throw invalid('No grade band matches this score.',409,'OJT_GRADE_MAPPING_INVALID');
  // Record the score before the linked grade so the existing DB guards can verify both sides.
  let updated=(await c.query(`UPDATE "OJTResults" SET "OfficialScore"=$2,"Outcome"=$3,"Version"="Version"+1,"UpdatedAt"=now() WHERE "ResultID"=$1 RETURNING *`,[id,score,band.outcome])).rows[0];
  await resultEvent(c,updated,'UPDATED',actor.userId,reason);
  const existing=(await c.query('SELECT 1 FROM "StudentCourseResults" WHERE "StudentID"=$1 AND "CourseID"=$2 AND "AcademicPeriodID"=$3',[r.StudentID,m.CourseID,m.AcademicPeriodID])).rows[0];
  if(existing)throw invalid('An academic grade already exists for this OJT course and period; reconcile it first.',409,'OJT_GRADE_ALREADY_EXISTS');
  const grade=(await c.query(`INSERT INTO "StudentCourseResults" ("StudentID","CourseID","SemesterTaken","AcademicYearID","AcademicPeriodID","Score","Grade","GradePoints","Status","OJTResultID","RecordedBy")
    SELECT $1,$2,6,p."AcademicYearID",$3,$4,$5,$6,$7,$8,$9 FROM "AcademicPeriods" p WHERE p."AcademicPeriodID"=$3 RETURNING "ResultID"`,[r.StudentID,m.CourseID,m.AcademicPeriodID,score,band.grade,band.gradePoints,band.outcome,id,actor.userId])).rows[0];
  updated=(await c.query(`UPDATE "OJTResults" SET "Status"='CONFIRMED',"Version"="Version"+1,"ConfirmedBy"=$2,"ConfirmedAt"=now(),"ConfirmationReason"=$3,"CourseResultID"=$4,"GradeMappingID"=$5,"GradeMappingSnapshot"=$6,"UpdatedAt"=now() WHERE "ResultID"=$1 RETURNING *`,[id,actor.userId,reason,grade.ResultID,m.MappingID,JSON.stringify(m)])).rows[0];
  await resultEvent(c,updated,'CONFIRMED',actor.userId,reason,key,hash);await audit(c,actor.userId,'OJTResults',id,'CONFIRM',projection(r),projection(updated),reason);return {...projection(updated),replayed:false};
 });
}
