import { createHash } from 'node:crypto';
import { pool, query } from '../../config/database';
import { academicTransaction, audit } from '../academic/academic.repository';
import { invalid, inputObject, positiveId, requiredText, pagination, enumValue, score } from '../students/student.validation';
import { predictionFilters, predictionSelect, pageSql, type Row } from './admin.repository';

function providerUrl() {
 const raw=process.env.PREDICTION_SERVICE_URL;
 if(!raw)throw invalid('Prediction service is not configured.',503,'PREDICTION_NOT_CONFIGURED');
 let url:URL;try{url=new URL(raw);}catch{throw invalid('Invalid PREDICTION_SERVICE_URL.',503,'PREDICTION_NOT_CONFIGURED');}
 if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw invalid('Invalid prediction service URL.',503,'PREDICTION_NOT_CONFIGURED');return url;
}
export function validatePrediction(value:unknown,model:{code:string;version:string}) {
 const b=inputObject(value,['modelCode','modelVersion','readinessScore','readinessLevel','riskScore','riskLevel','factors']);
 if(b.modelCode!==model.code||b.modelVersion!==model.version)throw invalid('Provider returned a different model version.',502,'MODEL_VERSION_MISMATCH');
 const readiness=score(b.readinessScore,100,'readinessScore'),risk=score(b.riskScore,100,'riskScore');
 if(readiness===null||risk===null)throw invalid('Prediction scores are required.',502,'INVALID_MODEL_RESPONSE');
 if(!Array.isArray(b.factors)||b.factors.length>100)throw invalid('Prediction factors must be an array of at most 100 entries.',502,'INVALID_MODEL_RESPONSE');
 const factors=b.factors.map(v=>{const f=inputObject(v,['feature','impact','description']);if(typeof f.impact!=='number'||!Number.isFinite(f.impact))throw invalid('Factor impact must be finite.',502,'INVALID_MODEL_RESPONSE');return {feature:requiredText(f.feature,'feature',100),impact:f.impact,description:requiredText(f.description,'description',2000)};});
 return {readinessScore:readiness,readinessLevel:enumValue(b.readinessLevel,['LOW','MEDIUM','HIGH'],'readinessLevel'),riskScore:risk,riskLevel:enumValue(b.riskLevel,['LOW','MEDIUM','HIGH'],'riskLevel'),factors};
}
export async function createPredictionJob(body:unknown,actor:number) {
 const b=inputObject(body,['modelId','ojtSemesterId','studentIds','idempotencyKey']);
 const modelId=positiveId(b.modelId,'modelId'),semesterId=positiveId(b.ojtSemesterId,'ojtSemesterId'),key=requiredText(b.idempotencyKey,'idempotencyKey',100);
 let ids:number[]|null=null;
 if(b.studentIds!==undefined){if(!Array.isArray(b.studentIds)||!b.studentIds.length||b.studentIds.length>1000)throw invalid('studentIds must contain 1–1000 IDs.');ids=b.studentIds.map(v=>positiveId(v,'studentId')).sort((a,b)=>a-b);if(new Set(ids).size!==ids.length)throw invalid('Duplicate studentIds.');}
 const hash=createHash('sha256').update(JSON.stringify({modelId,semesterId,ids})).digest('hex');
 return academicTransaction(async c=>{
  const prior=(await c.query('SELECT * FROM "PredictionJobs" WHERE "IdempotencyKey"=$1',[key])).rows[0];
  if(prior){if(prior.RequestHash!==hash||prior.CreatedBy!==actor)throw invalid('Idempotency key belongs to another request.',409,'IDEMPOTENCY_CONFLICT');return {jobId:prior.JobID,status:prior.Status,replayed:true};}
  providerUrl();
  const model=(await c.query('SELECT * FROM "PredictionModels" WHERE "ModelID"=$1 AND "Status"=\'ACTIVE\' FOR SHARE',[modelId])).rows[0];
  if(!model)throw invalid('An active prediction model is required.',422,'MODEL_NOT_ACTIVE');
  if(!(await c.query('SELECT 1 FROM "OJTSemesters" WHERE "OJTSemesterID"=$1',[semesterId])).rowCount)throw invalid('OJT semester not found.',404);
  // Predict only for approved registrations in the selected semester.
  const roster=(await c.query(`SELECT DISTINCT s."StudentID" AS id FROM "Students" s JOIN "Users" u ON u."UserID"=s."UserID" JOIN "OJTRegistrations" r ON r."StudentID"=s."StudentID" WHERE r."OJTSemesterID"=$1 AND r."Status"='APPROVED' AND s."DeletedAt" IS NULL AND s."Status"='ACTIVE' AND u."Status"='ACTIVE' AND ($2::int[] IS NULL OR s."StudentID"=ANY($2::int[])) ORDER BY id`,[semesterId,ids])).rows;
  if(!roster.length)throw invalid('No approved active students in this semester.',422,'EMPTY_PREDICTION_SCOPE');
  if(ids&&ids.length!==roster.length)throw invalid('Every student must be active and approved in the selected semester.',422,'PREDICTION_SCOPE_MISMATCH');
  if(roster.length>10000)throw invalid('A prediction job supports at most 10000 students.',422);
  const job=(await c.query('INSERT INTO "PredictionJobs" ("ModelID","OJTSemesterID","IdempotencyKey","RequestHash","CreatedBy") VALUES ($1,$2,$3,$4,$5) RETURNING *',[modelId,semesterId,key,hash,actor])).rows[0];
  await c.query('INSERT INTO "PredictionJobItems" ("JobID","StudentID") SELECT $1,unnest($2::int[])',[job.JobID,roster.map(s=>s.id)]);
  await audit(c,actor,'PredictionJobs',job.JobID,'CREATE',null,{modelId,semesterId,total:roster.length});return {jobId:job.JobID,status:job.Status,total:roster.length,replayed:false};
 });
}
export async function predictionJob(id:number,params:Row) {
 const p=pagination(params,[]);
 const job=(await query(`WITH items AS (
  SELECT i."StudentID" AS "studentId",i."Status" AS status,i."ErrorCode" AS "errorCode",
   i."ErrorMessage" AS "errorMessage",p."PredictionID" AS "predictionId"
  FROM "PredictionJobItems" i LEFT JOIN "Predictions" p
   ON p."JobID"=i."JobID" AND p."StudentID"=i."StudentID" WHERE i."JobID"=$1
 ), counts AS (
  SELECT count(*)::int AS total,count(*) FILTER(WHERE status='COMPLETED')::int AS completed,
   count(*) FILTER(WHERE status='FAILED')::int AS failed,count(*) FILTER(WHERE status='PENDING')::int AS pending FROM items
 ), paged AS (SELECT * FROM items ORDER BY "studentId" LIMIT $2 OFFSET $3)
 SELECT j."JobID" AS id,j."ModelID" AS "modelId",j."OJTSemesterID" AS "ojtSemesterId",
  j."Status" AS status,j."CreatedAt" AS "createdAt",j."CompletedAt" AS "completedAt",counts.*,
  (SELECT COALESCE(jsonb_agg(to_jsonb(paged) ORDER BY "studentId"),'[]'::jsonb) FROM paged) AS items
 FROM "PredictionJobs" j CROSS JOIN counts WHERE j."JobID"=$1`,[id,p.limit,p.offset])).rows[0];
 if(!job)throw invalid('Prediction job not found.',404);
 return {...job,progressPercent:job.total?Math.round((job.completed+job.failed)*100/job.total):0,page:p.page,limit:p.limit};
}
export async function predictions(params:Row) {const f=predictionFilters(params);return pageSql(predictionSelect+(f.where.length?' WHERE '+f.where.join(' AND '):''),f.args,f.page);}
export async function predictionDetail(id:number) {
 const row=(await query(`SELECT d.*,p."InputSnapshot" AS "inputSnapshot" FROM (${predictionSelect}) d JOIN "Predictions" p ON p."PredictionID"=d.id WHERE d.id=$1`,[id])).rows[0];if(!row)throw invalid('Prediction not found.',404);return row;
}

// One durable job item per transaction. A crash rolls back the claim and the result.
// Row locks serialize workers for the same job without holding the academic global lock.
export async function processPredictionItem() {
 if(!pool)throw invalid('Database is not configured.',503);
 const c=await pool.connect();
 try {
  await c.query('BEGIN');
  const job=(await c.query(`SELECT j.*,m."Code",m."Version",m."Metrics",m."FeatureSchema" FROM "PredictionJobs" j JOIN "PredictionModels" m ON m."ModelID"=j."ModelID" WHERE j."Status" IN ('PENDING','RUNNING') ORDER BY j."JobID" LIMIT 1 FOR UPDATE OF j SKIP LOCKED`)).rows[0];
  if(!job){await c.query('COMMIT');return false;}
  await c.query(`UPDATE "PredictionJobs" SET "Status"='RUNNING' WHERE "JobID"=$1`,[job.JobID]);
  const item=(await c.query(`SELECT * FROM "PredictionJobItems" WHERE "JobID"=$1 AND "Status"='PENDING' ORDER BY "StudentID" LIMIT 1 FOR UPDATE`,[job.JobID])).rows[0];
  if(item){
   await c.query('SAVEPOINT prediction_item');
   try {
    const student=(await c.query(`SELECT s."StudentID" AS "studentId",s."ProgramID" AS "programId",s."EnrollmentYear" AS "enrollmentYear",s."CurrentSemester" AS "currentSemester" FROM "Students" s JOIN "Users" u ON u."UserID"=s."UserID" WHERE s."StudentID"=$1 AND s."DeletedAt" IS NULL AND s."Status"='ACTIVE' AND u."Status"='ACTIVE'`,[item.StudentID])).rows[0];
    if(!student)throw invalid('Student is no longer active.',409,'STUDENT_INACTIVE');
    const courses=(await c.query(`SELECT "CourseID" AS "courseId","Score"::float8 AS score,"GradePoints"::float8 AS "gradePoints","Status" AS status,"AttemptNumber" AS "attemptNumber","AcademicPeriodID" AS "academicPeriodId" FROM "StudentCourseResults" WHERE "StudentID"=$1 ORDER BY "CourseID","AttemptNumber"`,[item.StudentID])).rows;
    const evaluations=(await c.query(`SELECT e."OverallScore"::float8 AS "overallScore",e."CompletionScore"::float8 AS "completionScore",e."AttitudeScore"::float8 AS "attitudeScore",e."SkillScore"::float8 AS "skillScore",e."EvaluatedAt" AS "evaluatedAt" FROM "InternshipEvaluations" e JOIN "InternshipAssignments" a ON a."AssignmentID"=e."AssignmentID" WHERE a."StudentID"=$1 ORDER BY e."EvaluatedAt"`,[item.StudentID])).rows;
    const input={schemaVersion:1,student,ojtSemesterId:job.OJTSemesterID,courseResults:courses,evaluations,computedAt:new Date().toISOString()};
    const model={id:job.ModelID,code:job.Code,version:job.Version,metrics:job.Metrics,featureSchema:job.FeatureSchema};
    const response=await fetch(providerUrl(),{method:'POST',redirect:'error',headers:{'Content-Type':'application/json',...(process.env.PREDICTION_SERVICE_API_KEY?{Authorization:`Bearer ${process.env.PREDICTION_SERVICE_API_KEY}`}:{})},body:JSON.stringify({modelCode:model.code,modelVersion:model.version,input}),signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw invalid('Prediction provider request failed.',502,'PREDICTION_PROVIDER_FAILED');
    // Bound the provider response before JSON decoding.
    const reader=response.body?.getReader();if(!reader)throw invalid('Empty model response.',502,'INVALID_MODEL_RESPONSE');
    const chunks:Uint8Array[]=[];let size=0;
    for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>1024*1024){await reader.cancel();throw invalid('Model response is too large.',502,'INVALID_MODEL_RESPONSE');}chunks.push(value);}
    const result=validatePrediction(JSON.parse(Buffer.concat(chunks).toString('utf8')),model);
    const prediction=(await c.query(`INSERT INTO "Predictions" ("JobID","StudentID","ModelSnapshot","InputSnapshot","ReadinessScore","ReadinessLevel","RiskScore","RiskLevel","Factors") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING "PredictionID"`,[job.JobID,item.StudentID,JSON.stringify(model),JSON.stringify(input),result.readinessScore,result.readinessLevel,result.riskScore,result.riskLevel,JSON.stringify(result.factors)])).rows[0];
    if(result.riskLevel==='HIGH')await c.query('INSERT INTO "RiskAlerts" ("PredictionID") VALUES ($1)',[prediction.PredictionID]);
    await c.query(`UPDATE "PredictionJobItems" SET "Status"='COMPLETED' WHERE "JobID"=$1 AND "StudentID"=$2`,[job.JobID,item.StudentID]);
    await c.query('RELEASE SAVEPOINT prediction_item');
   }catch(error:any){
    await c.query('ROLLBACK TO SAVEPOINT prediction_item');
    if(error.code&&/^(08|40|53|57|58)/.test(error.code))throw error;
    await c.query(`UPDATE "PredictionJobItems" SET "Status"='FAILED',"ErrorCode"=$3,"ErrorMessage"=$4 WHERE "JobID"=$1 AND "StudentID"=$2`,[job.JobID,item.StudentID,error.errorCode??'PREDICTION_FAILED',error.statusCode?error.message:'Unable to obtain a valid prediction.']);
   }
  }
  await c.query(`UPDATE "PredictionJobs" j SET "Status"=CASE WHEN EXISTS(SELECT 1 FROM "PredictionJobItems" i WHERE i."JobID"=j."JobID" AND i."Status"='FAILED') THEN 'COMPLETED_WITH_ERRORS' ELSE 'COMPLETED' END,"CompletedAt"=now() WHERE j."JobID"=$1 AND NOT EXISTS(SELECT 1 FROM "PredictionJobItems" i WHERE i."JobID"=j."JobID" AND i."Status"='PENDING')`,[job.JobID]);
  await c.query('COMMIT');return true;
 }catch(error){await c.query('ROLLBACK');throw error;}finally{c.release();}
}
