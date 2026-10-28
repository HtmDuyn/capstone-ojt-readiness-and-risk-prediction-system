import { academicTransaction, audit } from '../academic/academic.repository';
import type { PoolClient } from 'pg';
import { enrichListRows } from '../../shared/list-context';
import { actualPeriod, relativeSemester, periodBounds } from '../academic/workflow-policy';
import { inputObject, invalid, positiveId, requiredText } from '../students/student.validation';
import { timestamp, ids } from '../combo-registration/combo.validation';
import { registrationScope, validateScope, semester } from '../ojt-registration/window.service';
import { fingerprint, officialEligibilityWithClient } from '../eligibility/eligibility.service';
import { summaryWithClient } from './academic.service';
import { inScope, page, type Actor, type Row } from './shared';

function staff(actor:Actor) {if(!['ADMIN','ACADEMIC'].includes(actor.roleCode))throw invalid('Academic access required.',403,'FORBIDDEN');}
export async function schedule(periodId:number,actor:Actor,body?:unknown,existingClient?:PoolClient) {
  staff(actor);return academicTransaction(async c=>{
    const period=await actualPeriod(c,periodId);if(period.Kind!=='SEMESTER')throw invalid('Advisory schedules must reference a parent semester.');
    if(body===undefined){const row=(await c.query('SELECT * FROM "OJTAdvisorySchedules" WHERE "AcademicPeriodID"=$1',[periodId])).rows[0];if(!row)throw invalid('Advisory schedule not found.',404);return (await enrichListRows(c,[{...row,academicPeriodId:row.AcademicPeriodID,ojtSemesterId:row.OJTSemesterID,updatedBy:row.UpdatedBy}]))[0];}
    const b=inputObject(body,['ojtSemesterId','sendAt','assessmentDeadline','scope','enabled','reason']);const sid=positiveId(b.ojtSemesterId,'ojtSemesterId'),sendAt=timestamp(b.sendAt,'sendAt'),deadline=timestamp(b.assessmentDeadline,'assessmentDeadline'),scope=registrationScope(b.scope),reason=requiredText(b.reason,'reason',2000);
    await semester(c,sid);await validateScope(c,scope);if(b.enabled!==undefined&&typeof b.enabled!=='boolean')throw invalid('enabled must be boolean.');
    const bounds=periodBounds(period);if(new Date(sendAt)<bounds.start||new Date(sendAt)>=bounds.end||new Date(deadline)<bounds.end||new Date(sendAt)>=new Date(deadline))throw invalid('Send time must be within the preparation semester; deadline must be after its end.');
    const row=(await c.query('INSERT INTO "OJTAdvisorySchedules" ("AcademicPeriodID","OJTSemesterID","SendAt","AssessmentDeadline","Scope","Enabled","UpdatedBy") VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT ("AcademicPeriodID") DO UPDATE SET "OJTSemesterID"=$2,"SendAt"=$3,"AssessmentDeadline"=$4,"Scope"=$5,"Enabled"=$6,"UpdatedBy"=$7,"Version"="OJTAdvisorySchedules"."Version"+1,"UpdatedAt"=now() RETURNING *',[periodId,sid,sendAt,deadline,JSON.stringify(scope),b.enabled??true,actor.userId])).rows[0];await audit(c,actor.userId,'OJTAdvisorySchedules',periodId,'CONFIGURE',null,row,reason);return row;
  },existingClient);
}
export async function createAdvisoryRun(body:unknown,actor:Actor,kind:'SUMMARY'|'ELIGIBILITY') {
  staff(actor);const b=inputObject(body,['ojtSemesterId','academicPeriodId','scope','studentIds','idempotencyKey','reason']);const sid=positiveId(b.ojtSemesterId,'ojtSemesterId'),periodId=positiveId(b.academicPeriodId,'academicPeriodId'),key=requiredText(b.idempotencyKey,'idempotencyKey',100),reason=requiredText(b.reason,'reason',2000);
  const selected=b.studentIds===undefined?null:ids(b.studentIds,'studentIds',1000);if(selected&&!selected.length)throw invalid('studentIds must not be empty.');
  const scope=b.scope===undefined?{}:registrationScope(b.scope);if(!selected&&!Object.keys(scope).length)throw invalid('Select studentIds or a scope.');const request={ojtSemesterId:sid,academicPeriodId:periodId,scope,studentIds:selected,reason},hash=fingerprint({kind,...request});
  return academicTransaction(async c=>{
    const old=(await c.query('SELECT * FROM "OJTAdvisoryRuns" WHERE "IdempotencyKey"=$1',[key])).rows[0];if(old){if(old.RequestHash!==hash||old.CreatedBy!==actor.userId)throw invalid('Idempotency conflict.',409);return {runId:old.RunID,status:old.Status,replayed:true};}
    await semester(c,sid);const period=await actualPeriod(c,periodId);if(period.Kind!=='SEMESTER')throw invalid('academicPeriodId must reference the preparation semester.');if(Object.keys(scope).length)await validateScope(c,scope);
    const students=(await c.query('SELECT s.*,p."CohortID",p."GroupCode",t."SpecializationID" FROM "Students" s JOIN "Users" u ON u."UserID"=s."UserID" LEFT JOIN "StudentAcademicPlacements" p ON p."StudentID"=s."StudentID" LEFT JOIN "TrainingPrograms" t ON t."ProgramID"=s."ProgramID" WHERE s."Status"=\'ACTIVE\' AND s."DeletedAt" IS NULL AND u."Status"=\'ACTIVE\' AND ($1::int[] IS NULL OR s."StudentID"=ANY($1)) ORDER BY s."StudentID" LIMIT 10001',[selected])).rows.filter(s=>inScope(scope,s));
    if(students.length>1000)throw invalid('Narrow advisory runs to at most 1000 students.',422);if(!students.length)throw invalid('No students match this scope.',422);if(selected&&selected.length!==students.length)throw invalid('Some selected students are outside scope/inactive.',409);
    for(const s of students)if(await relativeSemester(c,s.StudentID,periodId)!==5)throw invalid('Advisory runs must target semester 5 students.',409,'ADVISORY_SEMESTER_MISMATCH');
    const run=(await c.query('INSERT INTO "OJTAdvisoryRuns" ("Kind","IdempotencyKey","RequestHash","Request","CreatedBy") VALUES ($1,$2,$3,$4,$5) RETURNING "RunID"',[kind,key,hash,JSON.stringify(request),actor.userId])).rows[0];
    for(const s of students)await c.query('INSERT INTO "OJTAdvisoryRunItems" ("RunID","StudentID") VALUES ($1,$2)',[run.RunID,s.StudentID]);await audit(c,actor.userId,'OJTAdvisoryRuns',run.RunID,'QUEUE',null,{kind,total:students.length},reason);return {runId:run.RunID,status:'PENDING',total:students.length,replayed:false};
  });
}
export async function advisoryRuns(params:Row,actor:Actor,id?:number) {
  staff(actor);return academicTransaction(async c=>{
    const data=await page(c,`SELECT "RunID" AS id,"Kind" AS kind,"Status" AS status,"CreatedBy" AS "createdBy",
      ("Request"->>'ojtSemesterId')::int AS "ojtSemesterId",("Request"->>'academicPeriodId')::int AS "academicPeriodId",
      "Request" AS request,("Request"->>'reason') AS reason,
      (SELECT count(*)::int FROM "OJTAdvisoryRunItems" i WHERE i."RunID"="OJTAdvisoryRuns"."RunID") AS "studentCount",
      (SELECT count(*)::int FROM "OJTAdvisoryRunItems" i WHERE i."RunID"="OJTAdvisoryRuns"."RunID" AND i."Status"='COMPLETED') AS "completedCount",
      (SELECT count(*)::int FROM "OJTAdvisoryRunItems" i WHERE i."RunID"="OJTAdvisoryRuns"."RunID" AND i."Status"='FAILED') AS "failedCount",
      "CreatedAt" AS "createdAt","CompletedAt" AS "completedAt" FROM "OJTAdvisoryRuns" WHERE ($1::int IS NULL OR "RunID"=$1)`,[id??null],id?{}:params,[]);
    if(id){
      if(!data.items.length)throw invalid('Advisory run not found.',404);
      const items=await page(c,'SELECT "StudentID" AS id,"StudentID" AS "studentId","Status" AS status,"NotificationID" AS "notificationId","ErrorCode" AS "errorCode","Snapshot" AS snapshot FROM "OJTAdvisoryRunItems" WHERE "RunID"=$1',[id],params,[]);
      return {...data.items[0],...items};
    }
    return data;
  });
}
export async function processAdvisoryItem() {
  return academicTransaction(async c=>{
    const item=(await c.query('SELECT i.*,r."Kind",r."Request",r."CreatedBy" FROM "OJTAdvisoryRunItems" i JOIN "OJTAdvisoryRuns" r ON r."RunID"=i."RunID" WHERE i."Status"=\'PENDING\' ORDER BY i."RunID",i."StudentID" LIMIT 1 FOR UPDATE OF i SKIP LOCKED')).rows[0];if(!item)return false;
    await c.query('SAVEPOINT advisory_item');try{
      const s=(await c.query('SELECT s.*,u."Status" AS "AccountStatus" FROM "Students" s JOIN "Users" u ON u."UserID"=s."UserID" WHERE s."StudentID"=$1',[item.StudentID])).rows[0];if(!s||s.DeletedAt||s.Status!=='ACTIVE'||s.AccountStatus!=='ACTIVE')throw invalid('Student inactive.',409,'STUDENT_INACTIVE');
      let snapshot:Row,title:string,text:string;
      if(item.Kind==='SUMMARY'){snapshot=await summaryWithClient(c,item.StudentID,item.Request.ojtSemesterId);title='Tiến độ học tập giữa kỳ 5';text=`Tín chỉ đã đạt: ${snapshot.earnedCredits}; còn thiếu: ${snapshot.missingCredits??'chờ đối soát'}; môn nợ: ${snapshot.failedCourseCount}. Môn chưa hoàn thành: ${snapshot.outstandingCourses.map((r:Row)=>r.courseCode??r.name).join(', ')}. Đây là số liệu giữa kỳ, chưa phải quyết định chính thức.`;}
      else{const official=await officialEligibilityWithClient(c,item.StudentID,item.Request.ojtSemesterId);snapshot={official,status:!official||official.isStale?'REVIEW_REQUIRED':official.status};title='Kết quả xét điều kiện OJT';text=snapshot.status==='ELIGIBLE'?'Bạn đã được xác nhận đủ điều kiện OJT.':snapshot.status==='NOT_ELIGIBLE'?'Bạn chưa đủ điều kiện OJT. Xem chi tiết tín chỉ và môn nợ.':'Hồ sơ đang chờ đối soát, chưa có kết quả chính thức còn hiệu lực.';}
      const n=(await c.query('INSERT INTO "Notifications" ("UserID","Title","Content","Channel","RelatedEntityType","RelatedEntityID","SentAt") VALUES ($1,$2,$3,\'IN_APP\',\'OJT_ADVISORY_RUN\',$4,now()) RETURNING "NotificationID"',[s.UserID,title,text,item.RunID])).rows[0];await c.query('UPDATE "OJTAdvisoryRunItems" SET "Status"=\'COMPLETED\',"Snapshot"=$3,"NotificationID"=$4 WHERE "RunID"=$1 AND "StudentID"=$2',[item.RunID,item.StudentID,JSON.stringify(snapshot),n.NotificationID]);await c.query('RELEASE SAVEPOINT advisory_item');
    }catch(e:any){await c.query('ROLLBACK TO SAVEPOINT advisory_item');if(e.code&&!e.statusCode)throw e;await c.query('UPDATE "OJTAdvisoryRunItems" SET "Status"=\'FAILED\',"ErrorCode"=$3 WHERE "RunID"=$1 AND "StudentID"=$2',[item.RunID,item.StudentID,e.errorCode??'ADVISORY_FAILED']);}
    await c.query('UPDATE "OJTAdvisoryRuns" r SET "Status"=CASE WHEN EXISTS(SELECT 1 FROM "OJTAdvisoryRunItems" i WHERE i."RunID"=r."RunID" AND i."Status"=\'FAILED\') THEN \'COMPLETED_WITH_ERRORS\' ELSE \'COMPLETED\' END,"CompletedAt"=now() WHERE r."RunID"=$1 AND NOT EXISTS(SELECT 1 FROM "OJTAdvisoryRunItems" i WHERE i."RunID"=r."RunID" AND i."Status"=\'PENDING\')',[item.RunID]);return true;
  });
}
export async function queueDueAdvisories() {
  const schedules=await academicTransaction(c=>c.query('SELECT * FROM "OJTAdvisorySchedules" WHERE "Enabled" AND "SendAt"<=now() AND "AssessmentDeadline">now() ORDER BY "AcademicPeriodID" LIMIT 10'));
  for(const s of schedules.rows)try{await createAdvisoryRun({ojtSemesterId:s.OJTSemesterID,academicPeriodId:s.AcademicPeriodID,scope:s.Scope,idempotencyKey:`advisory-${s.AcademicPeriodID}-v${s.Version}`,reason:'Thông báo giữa kỳ theo lịch đã cấu hình'},{userId:s.UpdatedBy,roleCode:'ACADEMIC'},'SUMMARY');}catch(e:any){console.error('Invalid advisory schedule',s.AcademicPeriodID,e.errorCode??'SCHEDULE_FAILED');}
}
export function startAdvisoryWorker() {
  let busy=false,stopped=false;const tick=async()=>{if(busy||stopped)return;busy=true;try{await queueDueAdvisories();for(let i=0;i<10&&!stopped;i++)if(!await processAdvisoryItem())break;}catch(e:any){console.error('OJT advisory worker:',e.code??e.errorCode??'ADVISORY_WORKER_FAILED');}finally{busy=false;}};const timer=setInterval(()=>void tick(),5000);timer.unref();void tick();return ()=>{stopped=true;clearInterval(timer);};
}
