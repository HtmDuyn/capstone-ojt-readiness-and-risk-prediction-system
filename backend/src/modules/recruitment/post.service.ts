import { academicTransaction,audit } from '../academic/academic.repository';
import { timestamp } from '../combo-registration/combo.validation';
import { dayString } from '../academic/workflow-policy';
import { inputObject,invalid,positiveId,requiredText,optionalText,pagination,enumValue } from '../students/student.validation';
import { enterpriseScope } from '../qhdn/catalog.service';
import { readTransaction } from '../qhdn/read.repository';
import { fingerprint } from '../eligibility/eligibility.service';
import { windowRecord,assertOpen,postSelect,postApi,postRecord,closeUnusedPositions,type Row,type Actor } from './recruitment.repository';

export async function submitPost(body:unknown,actor:Actor) {
 const b=inputObject(body,['windowId','idempotencyKey','title','content','benefits','applicationInstructions','deadlineAt','positions']);
 const windowId=positiveId(b.windowId,'windowId'),key=requiredText(b.idempotencyKey,'idempotencyKey',100);
 const form={title:requiredText(b.title,'title',200),content:requiredText(b.content,'content',20000),
  benefits:optionalText(b.benefits,'benefits',10000),instructions:optionalText(b.applicationInstructions,'applicationInstructions',10000),
  deadline:b.deadlineAt===undefined?null:timestamp(b.deadlineAt,'deadlineAt')};
 if(!Array.isArray(b.positions)||!b.positions.length||b.positions.length>50)throw invalid('Submit 1–50 recruitment positions.');
 const positions=b.positions.map(v=>{
  const p=inputObject(v,['code','title','description','requirements','capacity']);const capacity=positiveId(p.capacity,'capacity');
  if(capacity>100000)throw invalid('capacity must not exceed 100000.');
  return {code:requiredText(p.code,'code',60).toUpperCase(),title:requiredText(p.title,'title',150),
   description:requiredText(p.description,'description',10000),requirements:requiredText(p.requirements,'requirements',10000),capacity};
 });
 if(new Set(positions.map(p=>p.code)).size!==positions.length)throw invalid('Position codes must be distinct.');
 const hash=fingerprint({windowId,form,positions});
 return academicTransaction(async c=>{
  const companyId=await enterpriseScope(c,actor);
  const prior=(await c.query('SELECT "PostID","CreatedBy","RequestHash" FROM "RecruitmentPosts" WHERE "SubmissionKey"=$1',[key])).rows[0];
  if(prior){if(prior.CreatedBy!==actor.userId||prior.RequestHash!==hash)throw invalid('Idempotency key belongs to another request.',409,'IDEMPOTENCY_CONFLICT');return {...postApi(await postRecord(c,prior.PostID,actor)),replayed:true};}
  const w=await windowRecord(c,windowId);assertOpen(w);
  const deadline=form.deadline??new Date(w.EndsAt).toISOString(),periodEnd=new Date(new Date(dayString(w.PeriodEndDate)+'T00:00:00+07:00').getTime()+86400000);
  if(new Date(deadline)<=w.DatabaseNow||new Date(deadline)>periodEnd)throw invalid('The vacancy deadline must be in the future and within the selected academic semester.');
  if((await c.query('SELECT 1 FROM "InternshipPositions" WHERE "EnterpriseID"=$1 AND "OJTSemesterID"=$2 AND "RecruitmentCode"=ANY($3::text[])',[companyId,w.OJTSemesterID,positions.map(p=>p.code)])).rowCount)throw invalid('A position code already exists for this enterprise and semester.',409,'RECRUITMENT_CODE_EXISTS');
  const post=(await c.query(`INSERT INTO "RecruitmentPosts" ("EnterpriseID","OJTSemesterID","WindowID","Title","Content","Benefits","ApplicationInstructions","DeadlineAt","Status","CreatedBy","SubmissionKey","RequestHash")
   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'PENDING_REVIEW',$9,$10,$11) RETURNING "PostID"`,[companyId,w.OJTSemesterID,windowId,form.title,form.content,form.benefits,form.instructions,deadline,actor.userId,key,hash])).rows[0];
  for(const p of positions){
   const pos=(await c.query(`INSERT INTO "InternshipPositions" ("EnterpriseID","OJTSemesterID","RecruitmentCode","Title","Description","Requirements","Capacity","RemainingSlots","Status")
    VALUES ($1,$2,$3,$4,$5,$6,$7,$7,'CLOSED') RETURNING "PositionID"`,[companyId,w.OJTSemesterID,p.code,p.title,p.description,p.requirements,p.capacity])).rows[0];
   await c.query('INSERT INTO "RecruitmentPostPositions" ("PostID","PositionID","EnterpriseID","OJTSemesterID") VALUES ($1,$2,$3,$4)',[post.PostID,pos.PositionID,companyId,w.OJTSemesterID]);
  }
  const after=postApi(await postRecord(c,post.PostID,actor));await audit(c,actor.userId,'RecruitmentPosts',post.PostID,'SUBMIT',null,after);return {...after,replayed:false};
 });
}
export async function listPosts(params:Row,actor:Actor) {
 const p=pagination(params,['windowId','academicPeriodId','status']),args:unknown[]=[],where:string[]=[];
 return readTransaction(async c=>{
  const own=await enterpriseScope(c,actor);
  const add=(sql:string,value:unknown)=>{args.push(value);where.push(sql.replace('?', '$'+args.length));};
  if(own!==null)add('p."EnterpriseID"=?',own);
  if(params.windowId!==undefined)add('p."WindowID"=?',positiveId(params.windowId,'windowId'));
  if(params.academicPeriodId!==undefined)add('w."AcademicPeriodID"=?',positiveId(params.academicPeriodId,'academicPeriodId'));
  if(params.status!==undefined)add(`CASE WHEN p."Status"='PUBLISHED' AND p."DeadlineAt"<=clock_timestamp() THEN 'CLOSED' ELSE p."Status" END=?`,enumValue(params.status,['DRAFT','PENDING_REVIEW','PUBLISHED','REJECTED','CLOSED','ARCHIVED'],'status'));
  const sql=postSelect+(where.length?' WHERE '+where.join(' AND '):'');
  const total=(await c.query(`SELECT count(*)::int AS n FROM (${sql}) posts`,args)).rows[0].n;
  const rows=(await c.query(`${sql} ORDER BY p."PostID" DESC LIMIT $${args.length+1} OFFSET $${args.length+2}`,[...args,p.limit,p.offset])).rows;
  return {items:rows.map(postApi),total,page:p.page,limit:p.limit};
 });
}
export async function postDetails(id:number,actor:Actor) {return readTransaction(async c=>postApi(await postRecord(c,id,actor)));}
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
