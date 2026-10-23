import { academicTransaction } from './academic.repository';
import { saveAssessment,changeAssessment } from './workflow-policy';
import { inputObject,positiveId,pagination,invalid } from '../students/student.validation';
import { enrichListRows } from '../../shared/list-context';
import { saveRule,publishRule } from '../eligibility/eligibility.service';
import { notifyAlerts } from '../academic-reporting/notification.service';
import { createAdvisoryRun,advisoryRuns } from '../student-portal/advisory.service';
import { semesterStudents,handoffHistory } from '../ojt-registration/handoff.service';
import { list as ojtResults } from '../ojt-results/result.service';
import type { Actor,Row } from '../student-portal/shared';

const assessment=(r:Row)=>({...r,id:r.OJTSemesterID,ojtSemesterId:r.OJTSemesterID,blockPeriodId:r.BlockPeriodID,
  assessmentAcademicPeriodId:r.AssessmentAcademicPeriodID,configuredBy:r.ConfiguredBy,resultsFinalizedBy:r.ResultsFinalizedBy,closedBy:r.ClosedBy});
export async function assessmentWindows(params:Row){
  const p=pagination(params,['ojtSemesterId']);const sid=params.ojtSemesterId===undefined?null:positiveId(params.ojtSemesterId,'ojtSemesterId');
  return academicTransaction(async c=>{
    const total=(await c.query('SELECT count(*)::int n FROM "OJTAssessmentWindows" WHERE ($1::int IS NULL OR "OJTSemesterID"=$1)',[sid])).rows[0].n;
    const rows=(await c.query('SELECT * FROM "OJTAssessmentWindows" WHERE ($1::int IS NULL OR "OJTSemesterID"=$1) ORDER BY "OJTSemesterID" DESC LIMIT $2 OFFSET $3',[sid,p.limit,p.offset])).rows;
    return {items:await enrichListRows(c,rows.map(assessment)),total,page:p.page,limit:p.limit};
  });
}
const assessmentFields=['blockPeriodId','assessmentAcademicPeriodId','requiredRelativeSemester','opensAt','closesAt','reason'];
export async function createAssessment(body:unknown,actor:Actor){
  const b=inputObject(body,['ojtSemesterId',...assessmentFields]),{ojtSemesterId,...input}=b,id=positiveId(ojtSemesterId,'ojtSemesterId');
  return academicTransaction(async c=>{
    if((await c.query('SELECT 1 FROM "OJTAssessmentWindows" WHERE "OJTSemesterID"=$1',[id])).rowCount)throw invalid('Assessment window already exists; use PATCH to update it.',409,'ASSESSMENT_ALREADY_EXISTS');
    return (await enrichListRows(c,[assessment(await saveAssessment(id,input,actor.userId,c))]))[0];
  });
}
export async function updateAssessment(body:unknown,actor:Actor){
  const b=inputObject(body,['id','status','resultsFinalized','reopen',...assessmentFields]),{id:raw,status,...input}=b,id=positiveId(raw);
  if(status!==undefined){
    if(!['OPEN','CLOSED'].includes(String(status)))throw invalid('status must be OPEN or CLOSED.');
    // Existing workflow validates allowed fields, finalization, timing, revisions and replay.
    return assessment(await changeAssessment(id,status==='OPEN'?'open':'close',input,actor.userId));
  }
  return academicTransaction(async c=>{
    const old=(await c.query('SELECT * FROM "OJTAssessmentWindows" WHERE "OJTSemesterID"=$1',[id])).rows[0];
    if(!old)throw invalid('Assessment window not found.',404);
    const defaults={blockPeriodId:old.BlockPeriodID,assessmentAcademicPeriodId:old.AssessmentAcademicPeriodID,requiredRelativeSemester:old.RequiredRelativeSemester,opensAt:new Date(old.OpensAt).toISOString(),closesAt:new Date(old.ClosesAt).toISOString()};
    return (await enrichListRows(c,[assessment(await saveAssessment(id,{...defaults,...input},actor.userId,c))]))[0];
  });
}
export async function updateRule(body:unknown,actor:Actor){
  const b=inputObject(body,['id','status','programId','ojtSemesterId','version','name','minCredits','maxUnpassedCourses','debtBasis']);
  const {id:raw,status,...fields}=b,id=positiveId(raw);
  if(status!==undefined&&status!=='PUBLISHED')throw invalid('Only status PUBLISHED is supported; published rules remain immutable.');
  if(!Object.keys(fields).length&&status===undefined)throw invalid('Provide fields to update or status PUBLISHED.');
  return academicTransaction(async c=>{
    let result:Row|undefined;
    if(Object.keys(fields).length)result=await saveRule(fields,actor.userId,id,c);
    if(status==='PUBLISHED')result=await publishRule(id,actor.userId,c);
    return (await enrichListRows(c,[result!]))[0];
  });
}
export async function semesters(params:Row,id?:number){
  const p=pagination(params,[]);
  const data=await academicTransaction(async c=>{
    const total=(await c.query('SELECT count(*)::int n FROM "OJTSemesters" WHERE ($1::int IS NULL OR "OJTSemesterID"=$1)',[id??null])).rows[0].n;
    if(id&&!total)throw invalid('OJT semester not found.',404,'OJT_SEMESTER_NOT_FOUND');
    const rows=(await c.query(`SELECT o."OJTSemesterID" AS id,o."OJTSemesterID" AS "ojtSemesterId",o."SemesterCode" AS code,o."Name" AS name,
      o."AcademicYearID" AS "academicYearId",o."AcademicPeriodID" AS "academicPeriodId",o."StartDate" AS "startDate",o."EndDate" AS "endDate",o."Status" AS status,
      (SELECT to_jsonb(w) FROM "OJTAssessmentWindows" w WHERE w."OJTSemesterID"=o."OJTSemesterID") AS "assessmentWindow",
      (SELECT count(*)::int FROM "OJTRegistrations" r WHERE r."OJTSemesterID"=o."OJTSemesterID") AS "registrationCount",
      (SELECT count(*)::int FROM "EligibleStudentHandoffItems" h WHERE h."OJTSemesterID"=o."OJTSemesterID") AS "handedOffStudentCount"
      FROM "OJTSemesters" o WHERE ($1::int IS NULL OR o."OJTSemesterID"=$1) ORDER BY o."OJTSemesterID" DESC LIMIT $2 OFFSET $3`,[id??null,id?1:p.limit,id?0:p.offset])).rows;
    return {items:await enrichListRows(c,rows),total,page:p.page,limit:p.limit};
  });
  return id?data.items[0]:data;
}
export async function semesterDossier(id:number,params:Row,actor:Actor){
  pagination(params,[]);
  const data=await semesters({},id);
  return {...data,students:await semesterStudents(id,params,actor),handoffs:await handoffHistory(id,params),results:await ojtResults(params,id)};
}
export async function createNotification(body:unknown,actor:Actor){
  if(!body||typeof body!=='object'||Array.isArray(body))throw invalid('Provide a JSON object.');
  const {type,...input}=body as Row;
  if(type==='ALERT'){const result=await notifyAlerts(input,actor.userId);return {...result,id:'ALERT-'+result.batchId,type};}
  if(type==='SUMMARY'||type==='ELIGIBILITY'){const result=await createAdvisoryRun(input,actor,type);return {...result,id:type+'-'+result.runId,type};}
  throw invalid('type must be ALERT, SUMMARY or ELIGIBILITY.');
}
export async function notifications(params:Row,actor:Actor,resourceId?:string){
  const p=pagination(params,[]);
  if(resourceId){
    const match=/^(ALERT|SUMMARY|ELIGIBILITY)-([1-9]\d*)$/.exec(resourceId);
    if(!match)throw invalid('Notification ID must be ALERT-id, SUMMARY-id or ELIGIBILITY-id.');
    const type=match[1],id=positiveId(match[2]);
    if(type!=='ALERT'){
      const data=await advisoryRuns(params,actor,id);
      if(data.kind!==type)throw invalid('Notification batch not found.',404);
      return {...data,id:resourceId,type};
    }
    return academicTransaction(async c=>{
      const row=(await c.query(`SELECT "BatchID" AS "batchId","OJTSemesterID" AS "ojtSemesterId","Request" AS request,"Channel" AS channel,"Summary" AS summary,"CreatedBy" AS "createdBy","CreatedAt" AS "createdAt"
        FROM "AcademicAlertNotificationBatches" WHERE "BatchID"=$1`,[id])).rows[0];
      if(!row)throw invalid('Notification batch not found.',404);
      const total=(await c.query('SELECT count(*)::int n FROM "AcademicAlertNotificationDeliveries" WHERE "BatchID"=$1',[id])).rows[0].n;
      const items=(await c.query(`SELECT d."StudentID" AS "studentId",d."NotificationID" AS "notificationId",d."EmailID"::text AS "emailId",d."Snapshot" AS snapshot,e."Status" AS "emailStatus"
        FROM "AcademicAlertNotificationDeliveries" d LEFT JOIN "EmailOutbox" e ON e."EmailID"=d."EmailID" WHERE d."BatchID"=$1 ORDER BY d."StudentID" LIMIT $2 OFFSET $3`,[id,p.limit,p.offset])).rows;
      return {...(await enrichListRows(c,[row]))[0],id:resourceId,type,items:await enrichListRows(c,items),total,page:p.page,limit:p.limit};
    });
  }
  return academicTransaction(async c=>{
    const sql=`SELECT 'ALERT-'||"BatchID" AS id,'ALERT' AS type,"OJTSemesterID" AS "ojtSemesterId",NULL::int AS "academicPeriodId",'QUEUED'::text AS status,"Summary" AS summary,"CreatedBy" AS "createdBy","CreatedAt" AS "createdAt" FROM "AcademicAlertNotificationBatches"
      UNION ALL SELECT "Kind"||'-'||"RunID","Kind",("Request"->>'ojtSemesterId')::int,("Request"->>'academicPeriodId')::int,"Status",NULL::jsonb,"CreatedBy","CreatedAt" FROM "OJTAdvisoryRuns"`;
    const row=(await c.query(`WITH filtered AS(${sql}),paged AS(SELECT * FROM filtered ORDER BY "createdAt" DESC,id DESC LIMIT $1 OFFSET $2)
      SELECT (SELECT count(*)::int FROM filtered) total,COALESCE(jsonb_agg(to_jsonb(paged) ORDER BY "createdAt" DESC,id DESC),'[]'::jsonb) items FROM paged`,[p.limit,p.offset])).rows[0];
    return {...row,items:await enrichListRows(c,row.items),page:p.page,limit:p.limit};
  });
}
