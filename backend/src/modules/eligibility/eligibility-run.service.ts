import { academicTransaction, audit } from '../academic/academic.repository';
import { inputObject, invalid, positiveId, requiredText, pagination } from '../students/student.validation';
import { fingerprint, performEligibilityCheck } from './eligibility.service';
type Row=Record<string,any>;
function ids(value:unknown,name:string) {if(value===undefined)return null;if(!Array.isArray(value)||!value.length||value.length>10000)throw invalid(`${name} must contain 1 to 10000 IDs.`);const values=value.map(v=>positiveId(v,name));if(new Set(values).size!==values.length)throw invalid(`${name} contains duplicate IDs.`);return values.sort((a,b)=>a-b);}
export async function createRun(body:unknown,actorId:number) {
 const b=inputObject(body,['ojtSemesterId','programIds','cohortIds','studentIds','groupCodes','idempotencyKey']);
 const semesterId=positiveId(b.ojtSemesterId,'ojtSemesterId'),key=requiredText(b.idempotencyKey,'idempotencyKey',100);
 const programIds=ids(b.programIds,'programIds'),cohortIds=ids(b.cohortIds,'cohortIds'),studentIds=ids(b.studentIds,'studentIds');
 if(!programIds&&!cohortIds&&!studentIds)throw invalid('Provide programIds, cohortIds or studentIds to delimit the batch.');
 let groupCodes:string[]|null=null;if(b.groupCodes!==undefined){if(!Array.isArray(b.groupCodes)||!b.groupCodes.length||b.groupCodes.some(v=>!['A','B','C','D'].includes(v as string))||new Set(b.groupCodes).size!==b.groupCodes.length)throw invalid('groupCodes must contain distinct A, B, C or D.');groupCodes=(b.groupCodes as string[]).sort();}
 const scope={ojtSemesterId:semesterId,programIds,cohortIds,studentIds,groupCodes},hash=fingerprint(scope);
 return academicTransaction(async c=>{
 const existing=(await c.query('SELECT * FROM "EligibilityCheckRuns" WHERE "IdempotencyKey"=$1',[key])).rows[0];if(existing){if(existing.CreatedBy!==actorId||existing.RequestHash!==hash)throw invalid('Idempotency key belongs to a different request.',409,'IDEMPOTENCY_CONFLICT');return {runId:existing.RunID,status:existing.Status,replayed:true};}
 if(!(await c.query('SELECT 1 FROM "OJTSemesters" WHERE "OJTSemesterID"=$1',[semesterId])).rowCount)throw invalid('OJT semester not found.',404);
 for(const [table,col,values] of [['TrainingPrograms','ProgramID',programIds],['Cohorts','CohortID',cohortIds]] as const)if(values&&(await c.query(`SELECT 1 FROM "${table}" WHERE "${col}"=ANY($1::int[])`,[values])).rowCount!==values.length)throw invalid(`${table} scope contains missing IDs.`,404);
 const students=(await c.query(`SELECT s."StudentID",s."ProgramID" FROM "Students" s JOIN "Users" u ON u."UserID"=s."UserID" LEFT JOIN "StudentAcademicPlacements" p ON p."StudentID"=s."StudentID" WHERE s."Status"='ACTIVE' AND u."Status"='ACTIVE' AND ($1::int[] IS NULL OR s."ProgramID"=ANY($1)) AND ($2::int[] IS NULL OR p."CohortID"=ANY($2)) AND ($3::int[] IS NULL OR s."StudentID"=ANY($3)) AND ($4::text[] IS NULL OR p."GroupCode"=ANY($4)) ORDER BY s."StudentID"`,[programIds,cohortIds,studentIds,groupCodes])).rows;
 if(studentIds&&students.length!==studentIds.length)throw invalid('Explicit students must exist, be active and match every scope filter.',409,'BATCH_SCOPE_MISMATCH');if(!students.length)throw invalid('No active students match this scope.',422,'BATCH_SCOPE_EMPTY');
 const run=(await c.query('INSERT INTO "EligibilityCheckRuns" ("OJTSemesterID","Scope","IdempotencyKey","RequestHash","CreatedBy") VALUES ($1,$2,$3,$4,$5) RETURNING *',[semesterId,JSON.stringify(scope),key,hash,actorId])).rows[0];
 await c.query(`INSERT INTO "EligibilityRunStudents" ("RunID","StudentID","ProgramID","RuleSetID") SELECT $1,s."StudentID",s."ProgramID",rule."RuleSetID" FROM "Students" s LEFT JOIN LATERAL (SELECT a."RuleSetID" FROM "OJTActiveRuleSets" a WHERE a."ProgramID"=s."ProgramID" AND a."ScopeSemesterID" IN (0,$3) ORDER BY a."ScopeSemesterID" DESC LIMIT 1) rule ON true WHERE s."StudentID"=ANY($2::int[]) ORDER BY s."StudentID"`,[run.RunID,students.map(s=>s.StudentID),semesterId]);
 await audit(c,actorId,'EligibilityCheckRuns',run.RunID,'CREATE',null,{scope,total:students.length});return {runId:run.RunID,status:run.Status,total:students.length,replayed:false};
 });
}
export async function runDetails(id:number,params:Row) {const p=pagination(params,[]);return academicTransaction(async c=>{const run=(await c.query('SELECT * FROM "EligibilityCheckRuns" WHERE "RunID"=$1',[id])).rows[0];if(!run)throw invalid('Eligibility run not found.',404);const counts=(await c.query(`SELECT count(*)::int AS total,count(*) FILTER(WHERE "Status"='COMPLETED')::int AS completed,count(*) FILTER(WHERE "Status"='FAILED')::int AS failed,count(*) FILTER(WHERE "Status"='PENDING')::int AS pending FROM "EligibilityRunStudents" WHERE "RunID"=$1`,[id])).rows[0];const items=(await c.query(`SELECT s."StudentID" AS "studentId",s."ProgramID" AS "programId",s."RuleSetID" AS "ruleSetId",s."Status" AS status,s."CheckID" AS "checkId",s."ErrorCode" AS "errorCode",s."ErrorMessage" AS "errorMessage",e."Result" AS result FROM "EligibilityRunStudents" s LEFT JOIN "EligibilityChecks" e ON e."CheckID"=s."CheckID" WHERE s."RunID"=$1 ORDER BY s."StudentID" LIMIT $2 OFFSET $3`,[id,p.limit,p.offset])).rows;return {runId:id,ojtSemesterId:run.OJTSemesterID,status:run.Status,scope:run.Scope,createdAt:run.CreatedAt,completedAt:run.CompletedAt,...counts,progressPercent:Math.round((counts.completed+counts.failed)/counts.total*100),page:p.page,limit:p.limit,items};});}
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
