import { enrichListRows } from '../../shared/list-context';
import { academicTransaction,audit } from '../academic/academic.repository';
import { timestamp } from '../combo-registration/combo.validation';
import { dayString } from '../academic/workflow-policy';
import { inputObject,invalid,positiveId,requiredText,optionalText,pagination,enumValue } from '../students/student.validation';
import { enterpriseScope } from '../qhdn/catalog.service';
import { readTransaction } from '../qhdn/read.repository';
import { windowRecord,assertOpen,postSelect,postApi,postRecord,closeUnusedPositions,type Row,type Actor } from './recruitment.repository';

export async function listPosts(params:Row,actor:Actor) {
 const p=pagination(params,['postId','windowId','academicPeriodId','status']),args:unknown[]=[],where:string[]=[];
 return readTransaction(async c=>{
  const own=await enterpriseScope(c,actor);
  const add=(sql:string,value:unknown)=>{args.push(value);where.push(sql.replace('?', '$'+args.length));};
  if(own!==null)add('p."EnterpriseID"=?',own);
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
export async function updatePost(id:number,body:unknown,actor:Actor) {
 const b=inputObject(body,['title','content','benefits','applicationInstructions','deadlineAt','positions','reason']);
 const reason=requiredText(b.reason,'reason',2000);
 if(Object.keys(b).every(k=>k==='reason'))throw invalid('Provide an editable field.');
 if(b.positions!==undefined&&(!Array.isArray(b.positions)||!b.positions.length||b.positions.length>50))throw invalid('Provide 1–50 position changes.');
 for(const raw of (b.positions??[]) as unknown[]){
  const position=inputObject(raw,['positionId','code','title','description','requirements','capacity','location','workMode']);
  if(position.positionId===undefined)throw invalid('New recruitment positions must be added through the QHDN import API.',403,'IMPORT_REQUIRED');
  positiveId(position.positionId,'positionId');
 }
 return academicTransaction(async c=>{
  const before=await postRecord(c,id,actor,true);
  if(!['PENDING_REVIEW','REJECTED','PUBLISHED'].includes(before.Status)||!before.WindowID)throw invalid('Only an active intake post can be edited.',409,'RECRUITMENT_POST_STATE_CONFLICT');
  const w=await windowRecord(c,before.WindowID);
  if(actor.roleCode==='ENTERPRISE')assertOpen(w);
  if(w.Kind!=='SEMESTER'||w.LinkedPeriodID!==w.AcademicPeriodID||['CLOSED','ARCHIVED'].includes(w.PeriodStatus))throw invalid('The academic semester is unavailable.',409);
  const deadline=b.deadlineAt===undefined?before.DeadlineAt:timestamp(b.deadlineAt,'deadlineAt');
  const end=new Date(new Date(dayString(w.PeriodEndDate)+'T00:00:00+07:00').getTime()+86400000);
  if(!deadline||new Date(deadline)<=w.DatabaseNow||new Date(deadline)>end)throw invalid('Set a future deadline within the academic semester.');
  const positions=(await c.query(`SELECT pos.* FROM "InternshipPositions" pos JOIN "RecruitmentPostPositions" pp ON pp."PositionID"=pos."PositionID" WHERE pp."PostID"=$1 ORDER BY pos."PositionID" FOR UPDATE OF pos`,[id])).rows;
  const hasHistory=(await c.query(`SELECT 1 FROM "JobApplications" WHERE "PostID"=$1 UNION ALL SELECT 1 FROM "InternshipAssignments" a JOIN "RecruitmentPostPositions" pp ON pp."PositionID"=a."PositionID" WHERE pp."PostID"=$1 LIMIT 1`,[id])).rowCount;
  const values:Row={};
  for(const [key,column,max] of [['title','Title',200],['content','Content',20000],['benefits','Benefits',10000],['applicationInstructions','ApplicationInstructions',10000]] as const)if(key in b){
   values[column]=['title','content'].includes(key)?requiredText(b[key],key,max):optionalText(b[key],key,max);
   if(hasHistory&&values[column]!==before[column])throw invalid('Post content with application or internship history is immutable.',409,'RECRUITMENT_POST_HAS_HISTORY');
  }
  const seen=new Set<number>();
  for(const value of (b.positions??[]) as unknown[]){
   const p=inputObject(value,['positionId','code','title','description','requirements','capacity','location','workMode']);
   const positionId=positiveId(p.positionId,'positionId');
   if(seen.has(positionId))throw invalid('Duplicate positionId.');
   seen.add(positionId);
   const old=positions.find(row=>row.PositionID===positionId);
   if(!old||old.DeletedAt)throw invalid('Position does not belong to this recruitment post.',404,'POSITION_NOT_FOUND');
   if((await c.query('SELECT 1 FROM "RecruitmentPostPositions" WHERE "PositionID"=$1 AND "PostID"<>$2 LIMIT 1',[positionId,id])).rowCount)throw invalid('A shared legacy position must be reconciled before editing.',409);
   if(old&&Object.keys(p).every(k=>k==='positionId'))throw invalid('Provide a position field to change.');
   const next:Row={};
   for(const [key,column,max] of [['code','RecruitmentCode',60],['title','Title',150],['description','Description',10000],['requirements','Requirements',10000],['location','Location',300]] as const){
    if(key in p)next[column]=key==='location'?optionalText(p[key],key,max):requiredText(p[key],key,max);
   }
   if(next.RecruitmentCode)next.RecruitmentCode=next.RecruitmentCode.toUpperCase();
   if(p.workMode!==undefined)next.WorkMode=p.workMode===null?null:enumValue(p.workMode,['ONSITE','REMOTE','HYBRID'],'workMode');
   if(p.capacity!==undefined){next.Capacity=positiveId(p.capacity,'capacity');if(next.Capacity>100000)throw invalid('capacity must not exceed 100000.');}
   if(next.RecruitmentCode&&(await c.query('SELECT 1 FROM "InternshipPositions" WHERE "EnterpriseID"=$1 AND "OJTSemesterID"=$2 AND "RecruitmentCode"=$3 AND ($4::int IS NULL OR "PositionID"<>$4) LIMIT 1',[before.EnterpriseID,before.OJTSemesterID,next.RecruitmentCode,positionId])).rowCount)throw invalid('Position code already exists.',409,'RECRUITMENT_CODE_EXISTS');
   {
    const referenced=(await c.query(`SELECT 1 FROM "JobApplications" WHERE "PositionID"=$1 UNION ALL SELECT 1 FROM "StudentEnterpriseCoordination" WHERE "PositionID"=$1 UNION ALL SELECT 1 FROM "InternshipAssignments" WHERE "PositionID"=$1 LIMIT 1`,[positionId])).rowCount;
    if(referenced&&Object.keys(next).some(key=>key!=='Capacity'&&next[key]!==old[key]))throw invalid('A position with recruitment history only permits capacity changes.',409,'POSITION_HAS_HISTORY');
    const used=(await c.query(`SELECT count(*)::int AS n FROM "InternshipAssignments" WHERE "PositionID"=$1 AND COALESCE(UPPER("Status"),'ASSIGNED') NOT IN ('CANCELLED','CANCELED')`,[positionId])).rows[0].n;
    const capacity=next.Capacity??old.Capacity;if(capacity<used)throw invalid('Capacity cannot be below occupied slots.',409,'POSITION_CAPACITY_CONFLICT');
    next.RemainingSlots=capacity-used;
    const keys=Object.keys(next),params=Object.values(next);
    const after=(await c.query(`UPDATE "InternshipPositions" SET ${keys.map((key,i)=>`"${key}"=$${i+2}`).join(',')} WHERE "PositionID"=$1 RETURNING *`,[positionId,...params])).rows[0];
    await audit(c,actor.userId,'InternshipPositions',positionId!,'UPDATE',old,after,reason);

   }
  }
  const keys=Object.keys(values),params=Object.values(values);
  await c.query(`UPDATE "RecruitmentPosts" SET "DeadlineAt"=$2,"Status"='PENDING_REVIEW',"PublishedAt"=NULL,"ReviewedBy"=NULL,"ReviewedAt"=NULL,"ReviewReason"=NULL${keys.map((key,i)=>`,"${key}"=$${i+3}`).join('')} WHERE "PostID"=$1`,[id,deadline,...params]);
  await closeUnusedPositions(c,id);
  const after=postApi(await postRecord(c,id,actor));await audit(c,actor.userId,'RecruitmentPosts',id,'UPDATE_REQUIRES_REVIEW',postApi(before),after,reason);
  return after;
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
