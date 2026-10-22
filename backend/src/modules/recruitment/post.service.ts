import { enrichListRows } from '../../shared/list-context';
import { academicTransaction,audit } from '../academic/academic.repository';
import { timestamp } from '../combo-registration/combo.validation';
import { dayString } from '../academic/workflow-policy';
import { inputObject,invalid,positiveId,requiredText,pagination,enumValue } from '../students/student.validation';
import { enterpriseScope } from '../qhdn/catalog.service';
import { readTransaction } from '../qhdn/read.repository';
import { windowRecord,postSelect,postApi,postRecord,closeUnusedPositions,type Row,type Actor } from './recruitment.repository';

export async function listPosts(params:Row,actor:Actor) {
 const companyId=positiveId(params.companyId,'companyId');
 const p=pagination(params,['companyId','postId','windowId','academicPeriodId','status']),args:unknown[]=[],where:string[]=[];
 return readTransaction(async c=>{
  const own=await enterpriseScope(c,actor);
  const add=(sql:string,value:unknown)=>{args.push(value);where.push(sql.replace('?', '$'+args.length));};
  if(own!==null&&companyId!==null&&own!==companyId)throw invalid('This record belongs to another enterprise.',403,'FORBIDDEN');
  if(companyId!==null||own!==null)add('p."EnterpriseID"=?',companyId??own);
  if(params.postId!==undefined)add('p."PostID"=?',positiveId(params.postId,'postId'));
  if(params.windowId!==undefined)add('p."WindowID"=?',positiveId(params.windowId,'windowId'));
  if(params.academicPeriodId!==undefined)add('w."AcademicPeriodID"=?',positiveId(params.academicPeriodId,'academicPeriodId'));
  if(params.status!==undefined)add(`CASE WHEN p."Status"='PUBLISHED' AND p."DeadlineAt"<=clock_timestamp() THEN 'CLOSED' ELSE p."Status" END=?`,enumValue(params.status,['DRAFT','PENDING_REVIEW','PUBLISHED','REJECTED','CLOSED','ARCHIVED'],'status'));
  const sql=postSelect+(where.length?' WHERE '+where.join(' AND '):'');
  const total=(await c.query(`SELECT count(*)::int AS n FROM (${sql}) posts`,args)).rows[0].n;
  const rows=(await c.query(`${sql} ORDER BY p."PostID" DESC LIMIT $${args.length+1} OFFSET $${args.length+2}`,[...args,p.limit,p.offset])).rows;
  return {items:await enrichListRows(c,rows.map(postApi)),total,page:p.page,limit:p.limit};
 });
}
export async function reviewPost(id:number,body:unknown,actor:Actor,close=false) {
 const b=inputObject(body,close?['reason']:['decision','reason','deadlineAt']);
 const action=close?'CLOSED':enumValue(b.decision,['PUBLISH','REJECT'],'decision')==='PUBLISH'?'PUBLISHED':'REJECTED';
 const reason=requiredText(b.reason,'reason',2000),requestedDeadline=b.deadlineAt===undefined?undefined:timestamp(b.deadlineAt,'deadlineAt');
 if(action!=='PUBLISHED'&&requestedDeadline!==undefined)throw invalid('deadlineAt is only accepted when publishing.');
 return academicTransaction(async c=>{
  const before=await postRecord(c,id,actor,true),deadline=requestedDeadline??before.DeadlineAt;
  if(before.Status===action&&before.ReviewReason===reason&&before.ReviewedBy===actor.userId&&(!requestedDeadline||new Date(deadline).getTime()===new Date(before.DeadlineAt).getTime()))return {...postApi(before),replayed:true};
  if(close?!['PUBLISHED','PENDING_REVIEW'].includes(before.Status):before.Status!=='PENDING_REVIEW')throw invalid('This post cannot make the requested transition.',409,'RECRUITMENT_POST_STATE_CONFLICT');
  if(action==='PUBLISHED'){
   if(!before.WindowID)throw invalid('Reconcile the legacy post with an academic recruitment window first.',409);
   const w=await windowRecord(c,before.WindowID),end=new Date(new Date(dayString(w.PeriodEndDate)+'T00:00:00+07:00').getTime()+86400000);
   if(!deadline||new Date(deadline)<=w.DatabaseNow||new Date(deadline)>end||['CLOSED','ARCHIVED'].includes(w.PeriodStatus))throw invalid('Set a future vacancy deadline within an available academic semester.',409);
   if(!(await c.query('SELECT 1 FROM "Enterprises" WHERE "EnterpriseID"=$1 AND "Status"=\'ACTIVE\' AND "DeletedAt" IS NULL',[before.EnterpriseID])).rowCount)throw invalid('An active enterprise is required.',409);
   if(!before.positions.length||before.positions.some((p:Row)=>p.status==='ARCHIVED'))throw invalid('Valid recruitment positions are required.',409);
  }
  await c.query(`UPDATE "RecruitmentPosts" SET "Status"=$2::varchar,"ReviewedBy"=$3,"ReviewedAt"=now(),"ReviewReason"=$4,"UpdatedAt"=now(),
   "PublishedAt"=CASE WHEN $2::varchar='PUBLISHED' THEN now() ELSE "PublishedAt" END,"DeadlineAt"=$5 WHERE "PostID"=$1`,[id,action,actor.userId,reason,deadline]);
  if(action==='PUBLISHED')await c.query(`UPDATE "InternshipPositions" pos SET "Status"='OPEN' FROM "RecruitmentPostPositions" pp WHERE pp."PositionID"=pos."PositionID" AND pp."PostID"=$1 AND pos."DeletedAt" IS NULL`,[id]);
  else await closeUnusedPositions(c,id);
  const after=postApi(await postRecord(c,id,actor));await audit(c,actor.userId,'RecruitmentPosts',id,action,postApi(before),after,reason);return after;
 });
}
export async function expireRecruitment() {
 return academicTransaction(async c=>{
  await c.query(`UPDATE "RecruitmentWindows" SET "Status"='CLOSED',"UpdatedAt"=now() WHERE "Status"='OPEN' AND "EndsAt"<=clock_timestamp()`);
  const closed=await c.query(`UPDATE "RecruitmentPosts" SET "Status"='CLOSED',"UpdatedAt"=now() WHERE "Status"='PUBLISHED' AND "DeadlineAt"<=clock_timestamp()`);
  await closeUnusedPositions(c);return closed.rowCount??0;
 });
}
