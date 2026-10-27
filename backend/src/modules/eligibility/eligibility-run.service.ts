import { randomUUID } from 'node:crypto';
import { academicTransaction, audit } from '../academic/academic.repository';
import { inputObject, invalid, positiveId, requiredText } from '../students/student.validation';
import { activeRule, fingerprint, performEligibilityCheck, confirmEligibilityWithClient } from './eligibility.service';
function ids(value:unknown,name:string) {if(value===undefined)return null;if(!Array.isArray(value)||!value.length||value.length>10000)throw invalid(`${name} must contain 1 to 10000 IDs.`);const values=value.map(v=>positiveId(v,name));if(new Set(values).size!==values.length)throw invalid(`${name} contains duplicate IDs.`);return values.sort((a,b)=>a-b);}
// Use the fixed policy automatically; versioned rows retain the audit/history contract.
async function ensureFixedRule(c:import('pg').PoolClient,programId:number|null,semesterId:number,actor:number){
 if(!programId||await activeRule(c,programId,semesterId))return;
 const program=(await c.query('SELECT "Status" FROM "TrainingPrograms" WHERE "ProgramID"=$1',[programId])).rows[0];
 if(program?.Status!=='PUBLISHED')return;
 const rule=(await c.query(`INSERT INTO "OJTRuleSets" ("ProgramID","Version","Name","Status","CreatedBy","PublishedBy","PublishedAt") SELECT $1,COALESCE(max("Version"),0)+1,'Điều kiện OJT: 70 tín chỉ, tối đa 2 môn nợ','PUBLISHED',$2,$2,now() FROM "OJTRuleSets" WHERE "ProgramID"=$1 AND "OJTSemesterID" IS NULL RETURNING *`,[programId,actor])).rows[0];
 await c.query('INSERT INTO "OJTActiveRuleSets" ("ProgramID","ScopeSemesterID","RuleSetID") VALUES ($1,0,$2)',[programId,rule.RuleSetID]);
 await audit(c,actor,'OJTRuleSets',rule.RuleSetID,'PUBLISH_FIXED_POLICY',null,{minCredits:70,maxUnpassedCourses:2});
}
async function batchSummary(c:import('pg').PoolClient,runId:number,semesterId:number,replayed:boolean){
 const rows=(await c.query(`SELECT e."CheckID" AS "checkId",e."CheckedAt" AS "checkedAt",e."Result" AS result,f."ConfirmedAt" AS "confirmedAt" FROM "EligibilityChecks" e LEFT JOIN "EligibilityConfirmations" f ON f."CheckID"=e."CheckID" WHERE e."RunID"=$1 ORDER BY e."StudentID"`,[runId])).rows;
 const items=rows.map(row=>({...row.result,checkId:row.checkId,checkedAt:row.checkedAt,confirmedAt:row.confirmedAt??null}));
 return {runId,ojtSemesterId:semesterId,status:'COMPLETED',total:items.length,eligible:items.filter(item=>item.status==='ELIGIBLE').length,notEligible:items.filter(item=>item.status==='NOT_ELIGIBLE').length,reviewRequired:items.filter(item=>item.status==='REVIEW_REQUIRED').length,items,replayed};
}
export async function checkBatch(body:unknown,actorId:number) {
 const b=inputObject(body,['ojtSemesterId','programIds','cohortIds','studentIds','groupCodes','idempotencyKey','confirmResults']);
 if(b.confirmResults!==undefined&&typeof b.confirmResults!=='boolean')throw invalid('confirmResults must be a boolean.');
 const confirmResults=b.confirmResults??true;
 const semesterId=positiveId(b.ojtSemesterId,'ojtSemesterId'),key=b.idempotencyKey===undefined?randomUUID():requiredText(b.idempotencyKey,'idempotencyKey',100);
 const programIds=ids(b.programIds,'programIds'),cohortIds=ids(b.cohortIds,'cohortIds'),studentIds=ids(b.studentIds,'studentIds');
 if(!programIds&&!cohortIds&&!studentIds)throw invalid('Provide programIds, cohortIds or studentIds to delimit the batch.');
 let groupCodes:string[]|null=null;if(b.groupCodes!==undefined){if(!Array.isArray(b.groupCodes)||!b.groupCodes.length||b.groupCodes.some(v=>!['A','B','C','D'].includes(v as string))||new Set(b.groupCodes).size!==b.groupCodes.length)throw invalid('groupCodes must contain distinct A, B, C or D.');groupCodes=(b.groupCodes as string[]).sort();}
 const scope={ojtSemesterId:semesterId,programIds,cohortIds,studentIds,groupCodes,...(confirmResults?{}:{confirmResults:false})},hash=fingerprint(scope);
 return academicTransaction(async c=>{
 const existing=(await c.query('SELECT * FROM "EligibilityCheckRuns" WHERE "IdempotencyKey"=$1',[key])).rows[0];if(existing){if(existing.CreatedBy!==actorId||existing.RequestHash!==hash)throw invalid('Idempotency key belongs to a different request.',409,'IDEMPOTENCY_CONFLICT');if(existing.Status!=='COMPLETED')throw invalid('This key belongs to an unfinished legacy batch; use a new key.',409,'LEGACY_ELIGIBILITY_RUN');return batchSummary(c,existing.RunID,semesterId,true);}
 if(!(await c.query('SELECT 1 FROM "OJTSemesters" WHERE "OJTSemesterID"=$1',[semesterId])).rowCount)throw invalid('OJT semester not found.',404);
 for(const [table,col,values] of [['TrainingPrograms','ProgramID',programIds],['Cohorts','CohortID',cohortIds]] as const)if(values&&(await c.query(`SELECT 1 FROM "${table}" WHERE "${col}"=ANY($1::int[])`,[values])).rowCount!==values.length)throw invalid(`${table} scope contains missing IDs.`,404);
 const students=(await c.query(`SELECT s."StudentID",s."ProgramID" FROM "Students" s JOIN "Users" u ON u."UserID"=s."UserID" LEFT JOIN "StudentAcademicPlacements" p ON p."StudentID"=s."StudentID" WHERE s."DeletedAt" IS NULL AND s."Status"='ACTIVE' AND u."Status"='ACTIVE' AND ($1::int[] IS NULL OR s."ProgramID"=ANY($1)) AND ($2::int[] IS NULL OR p."CohortID"=ANY($2)) AND ($3::int[] IS NULL OR s."StudentID"=ANY($3)) AND ($4::text[] IS NULL OR p."GroupCode"=ANY($4)) ORDER BY s."StudentID"`,[programIds,cohortIds,studentIds,groupCodes])).rows;
 if(studentIds&&students.length!==studentIds.length)throw invalid('Explicit students must exist, be active and match every scope filter.',409,'BATCH_SCOPE_MISMATCH');if(!students.length)throw invalid('No active students match this scope.',422,'BATCH_SCOPE_EMPTY');
 if(students.length>1000)throw invalid('Limit a batch to 1000 students.',422,'BATCH_TOO_LARGE');
 for(const programId of [...new Set(students.map(student=>student.ProgramID))])await ensureFixedRule(c,programId,semesterId,actorId);
 const run=(await c.query('INSERT INTO "EligibilityCheckRuns" ("OJTSemesterID","Scope","IdempotencyKey","RequestHash","CreatedBy") VALUES ($1,$2,$3,$4,$5) RETURNING *',[semesterId,JSON.stringify(scope),key,hash,actorId])).rows[0];
 await c.query(`INSERT INTO "EligibilityRunStudents" ("RunID","StudentID","ProgramID","RuleSetID") SELECT $1,s."StudentID",s."ProgramID",rule."RuleSetID" FROM "Students" s LEFT JOIN LATERAL (SELECT a."RuleSetID" FROM "OJTActiveRuleSets" a WHERE a."ProgramID"=s."ProgramID" AND a."ScopeSemesterID" IN (0,$3) ORDER BY a."ScopeSemesterID" DESC LIMIT 1) rule ON true WHERE s."StudentID"=ANY($2::int[]) ORDER BY s."StudentID"`,[run.RunID,students.map(s=>s.StudentID),semesterId]);
 for(const student of students){
  const check=await performEligibilityCheck(c,student.StudentID,semesterId,actorId,'BATCH',run.RunID);
  if(confirmResults&&check.status!=='REVIEW_REQUIRED')await confirmEligibilityWithClient(c,check.checkId,actorId,'Xét điều kiện OJT hàng loạt: tối thiểu 70 tín chỉ, tối đa 2 môn còn nợ.');
  await c.query('UPDATE "EligibilityRunStudents" SET "Status"=\'COMPLETED\',"CheckID"=$3 WHERE "RunID"=$1 AND "StudentID"=$2',[run.RunID,student.StudentID,check.checkId]);
 }
 await c.query('UPDATE "EligibilityCheckRuns" SET "Status"=\'COMPLETED\',"CompletedAt"=now() WHERE "RunID"=$1',[run.RunID]);
 await audit(c,actorId,'EligibilityCheckRuns',run.RunID,'CHECK_AND_UPDATE',null,{scope,total:students.length});
 return batchSummary(c,run.RunID,semesterId,false);
 });
}
// Claim and finish each item in one transaction. A process crash rolls back the claim.
export async function processEligibilityRunItems(limit=10) {
 let processed=0;for(let i=0;i<limit;i++){
 const worked=await academicTransaction(async c=>{
 const item=(await c.query(`SELECT s.*,r."OJTSemesterID",r."CreatedBy" FROM "EligibilityRunStudents" s JOIN "EligibilityCheckRuns" r ON r."RunID"=s."RunID" WHERE s."Status"='PENDING' ORDER BY s."RunID",s."StudentID" LIMIT 1 FOR UPDATE OF s SKIP LOCKED`)).rows[0];if(!item)return false;
 await c.query(`UPDATE "EligibilityCheckRuns" SET "Status"='RUNNING' WHERE "RunID"=$1`,[item.RunID]);await c.query('SAVEPOINT eligibility_item');
 try {
 const student=(await c.query('SELECT "ProgramID" FROM "Students" WHERE "StudentID"=$1',[item.StudentID])).rows[0];if(!student||student.ProgramID!==item.ProgramID)throw invalid('Student curriculum changed after the batch was queued.',409,'BATCH_PROGRAM_CHANGED');
 const rule=item.RuleSetID?(await c.query('SELECT * FROM "OJTRuleSets" WHERE "RuleSetID"=$1',[item.RuleSetID])).rows[0]:null;
 const check=await performEligibilityCheck(c,item.StudentID,item.OJTSemesterID,item.CreatedBy,'BATCH',item.RunID,null,rule);
 await c.query(`UPDATE "EligibilityRunStudents" SET "Status"='COMPLETED',"CheckID"=$3 WHERE "RunID"=$1 AND "StudentID"=$2`,[item.RunID,item.StudentID,check.checkId]);await c.query('RELEASE SAVEPOINT eligibility_item');
 } catch(error:any) {
 await c.query('ROLLBACK TO SAVEPOINT eligibility_item');
 // Database failures are retried by the worker, rather than permanently failing students.
 if((error.code&&(/^(08|40|53|57|58)/.test(error.code)||['ECONNRESET','ECONNREFUSED','ETIMEDOUT','EPIPE'].includes(error.code)))||/connection terminated|connection closed/i.test(error.message??''))throw error;
 await c.query(`UPDATE "EligibilityRunStudents" SET "Status"='FAILED',"ErrorCode"=$3,"ErrorMessage"=$4 WHERE "RunID"=$1 AND "StudentID"=$2`,[item.RunID,item.StudentID,error.errorCode??'ELIGIBILITY_ITEM_FAILED',error.statusCode?error.message:'Unable to calculate this student.']);
 }
 await c.query(`UPDATE "EligibilityCheckRuns" r SET "Status"=CASE WHEN EXISTS(SELECT 1 FROM "EligibilityRunStudents" s WHERE s."RunID"=r."RunID" AND s."Status"='FAILED') THEN 'COMPLETED_WITH_ERRORS' ELSE 'COMPLETED' END,"CompletedAt"=now() WHERE r."RunID"=$1 AND NOT EXISTS(SELECT 1 FROM "EligibilityRunStudents" s WHERE s."RunID"=r."RunID" AND s."Status"='PENDING')`,[item.RunID]);return true;
 });if(!worked)break;processed++;
 }return processed;
}
