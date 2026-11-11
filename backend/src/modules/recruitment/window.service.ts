import { academicTransaction, audit } from '../academic/academic.repository';
import { readTransaction } from '../qhdn/read.repository';
import { ensureOjtSemesterForPeriod } from '../academic/ojt-semester-link';
import { actualPeriod, periodBounds } from '../academic/workflow-policy';
import { timestamp } from '../combo-registration/combo.validation';
import { inputObject, invalid, positiveId, requiredText, enumValue } from '../students/student.validation';
import { windowRecord, windowApi, previousRoundSelect, type Row } from './recruitment.repository';
import { extendWindow, requireLifecycleSchema } from './lifecycle.service';
import { requireRecruitmentSchema, requireThreePhaseSchema, expireRecruitmentResponses } from './round-policy';

export function validateCampaignSchedule(body:Row) {
 const start=new Date(timestamp(body.startsAt,'startsAt')),end=new Date(timestamp(body.endsAt,'endsAt'));
 if(end<=start)throw invalid('Ngày kết thúc đợt OJT phải sau ngày bắt đầu.');
 if(!Array.isArray(body.rounds)||body.rounds.length<1||body.rounds.length>30)throw invalid('Khai báo từ 1 đến 30 đợt con.');
 const rounds=body.rounds.map((value:unknown)=>{
  const keys=['postingStartsAt','postingEndsAt','applicationStartsAt','applicationEndsAt','resultsStartsAt','resultsEndsAt'];
  const r=inputObject(value,['name',...keys]);
  const times=Object.fromEntries(keys.map(key=>[key,new Date(timestamp(r[key],'round.'+key))]));
  const {postingStartsAt:ps,postingEndsAt:pe,applicationStartsAt:as,applicationEndsAt:ae,resultsStartsAt:rs,resultsEndsAt:re}=times;
  if(!(ps<pe&&pe<=as&&as<ae&&+rs===+as&&ae<re))throw invalid('Hạn đăng tin phải kết thúc trước hạn ứng tuyển. Hạn xét tuyển bắt đầu cùng hạn ứng tuyển và kết thúc sau hạn ứng tuyển.',400,'RECRUITMENT_PHASE_SCHEDULE_INVALID');
  return {name:requiredText(r.name,'round.name',150),start:ps,end:re,
   postingStartsAt:ps,postingEndsAt:pe,applicationStartsAt:as,applicationEndsAt:ae,resultsStartsAt:rs,resultsEndsAt:re};
 });
 rounds.forEach((r,i)=>{
  if(r.end<=r.start||r.start<start||r.end>end)throw invalid('Mỗi đợt con phải có thời hạn hợp lệ và nằm trong đợt OJT tổng.');
  if(i&&r.start<rounds[i-1].end)throw invalid('Các đợt con phải theo thứ tự và không trùng thời gian.',400,'RECRUITMENT_WINDOW_CONFLICT');
 });
 return {start,end,rounds};
}
export async function listWindows(params: Row) {
 const period=params.academicPeriodId===undefined?null:positiveId(params.academicPeriodId,'academicPeriodId');
 return readTransaction(async c=>{
  await requireRecruitmentSchema(c);
  const rows=(await c.query(`SELECT w.*,p."PeriodCode",p."Name" AS "PeriodName",p."Status" AS "PeriodStatus",
   p."Kind",o."AcademicPeriodID" AS "LinkedPeriodID",${previousRoundSelect},
   clock_timestamp() AS "DatabaseNow",campaign."Name" AS "CampaignName",
   (SELECT count(*)::int FROM "JobApplications" a JOIN "RecruitmentPosts" post ON post."PostID"=a."PostID"
    WHERE post."WindowID"=w."WindowID" AND a."Status" NOT IN ('ACCEPTED','REJECTED','WITHDRAWN')) AS "PendingCount"
   FROM "RecruitmentWindows" w JOIN "AcademicPeriods" p USING("AcademicPeriodID")
   JOIN "OJTSemesters" o ON o."OJTSemesterID"=w."OJTSemesterID"
   LEFT JOIN "RecruitmentCampaigns" campaign USING("CampaignID")
   WHERE ($1::int IS NULL OR w."AcademicPeriodID"=$1) ORDER BY w."StartsAt",w."WindowID"`,[period])).rows;
    const campaigns=(await c.query(`SELECT c."CampaignID" AS id,c."Name" AS name,c."StartsAt" AS "startsAt",c."EndsAt" AS "endsAt"
   FROM "RecruitmentCampaigns" c JOIN "OJTSemesters" o USING("OJTSemesterID")
   WHERE ($1::int IS NULL OR o."AcademicPeriodID"=$1) ORDER BY c."CampaignID"`,[period])).rows;
  return {campaigns,items:rows.map(w=>({...windowApi(w),campaignName:w.CampaignName,pendingCount:w.PendingCount})),total:rows.length};
 });
}
export async function saveWindow(body:unknown,actor:number,id?:number) {
 if(id&&body&&typeof body==='object'&&['postingEndsAt','applicationEndsAt','resultsEndsAt'].some(key=>key in body))return extendWindow(id,body,actor);
 const b=inputObject(body,id?['name','status','reason']:['academicPeriodId','name','startsAt','endsAt','rounds','reason','supplemental']);
 const reason=requiredText(b.reason??(id?undefined:'Tạo đợt tuyển dụng với ba hạn.'),'reason',2000);
 return academicTransaction(async c=>{
  await requireRecruitmentSchema(c);
  if(id){
   const old=await windowRecord(c,id);
   if(old.ResultsFinalizedAt)throw invalid('Đợt đã chốt tổng hợp không thể thay đổi.',409);
   const status=b.status===undefined?old.Status:enumValue(b.status,['OPEN','CLOSED'],'status');
   if(status==='OPEN'&&old.Status!=='OPEN'){
    if(old.Kind!=='SEMESTER'||old.LinkedPeriodID!==old.AcademicPeriodID||['CLOSED','ARCHIVED'].includes(old.PeriodStatus))
     throw invalid('Học kỳ hoặc liên kết kỳ OJT không còn khả dụng.',409,'RECRUITMENT_PERIOD_UNAVAILABLE');

    if(old.Status==='CLOSED'||new Date(old.EndsAt)<=old.DatabaseNow)throw invalid('Đợt đã đóng hoặc đã hết thời hạn.',409);
    if((await c.query(`SELECT 1 FROM "RecruitmentWindows" WHERE "OJTSemesterID"=$1 AND "WindowID"<>$2
      AND "StartsAt"<$3 AND ("EndsAt">clock_timestamp() OR "ResultsFinalizedAt" IS NULL)`,[old.OJTSemesterID,id,old.StartsAt])).rowCount)
     throw invalid('Đợt trước phải kết thúc và được QHDN chốt tổng hợp kết quả.',409,'PREVIOUS_ROUND_NOT_FINALIZED');
    await c.query(`UPDATE "RecruitmentWindows" SET "Status"='CLOSED' WHERE "OJTSemesterID"=$1 AND "WindowID"<>$2 AND "Status"='OPEN' AND "EndsAt"<=clock_timestamp() AND "ResultsFinalizedAt" IS NULL`,[old.OJTSemesterID,id]);
   }
   await c.query(`UPDATE "RecruitmentWindows" SET "Name"=$2,"Status"=$3,"UpdatedBy"=$4,"UpdatedAt"=now() WHERE "WindowID"=$1`,[id,b.name===undefined?old.Name:requiredText(b.name,'name',150),status,actor]);
   await c.query(`UPDATE "OJTRegistrationWindows" SET "Status"=CASE WHEN $2::text='OPEN' AND "EndsAt"<=clock_timestamp() THEN 'CLOSED' ELSE $2::text END,"UpdatedAt"=now() WHERE "RecruitmentRoundID"=$1`,[id,status]);
   if(status==='OPEN'&&old.Status!=='OPEN'&&old.PostingStartsAt){await requireLifecycleSchema(c);await c.query('SELECT public."CarryForwardRecruitmentPosts"($1)',[id]);}
   const after=await windowRecord(c,id);await audit(c,actor,'RecruitmentWindows',id,'UPDATE',old,after,reason);return windowApi(after);
  }
  const periodId=positiveId(b.academicPeriodId,'academicPeriodId'),period=await actualPeriod(c,periodId);
  if(period.Kind!=='SEMESTER'||['CLOSED','ARCHIVED'].includes(period.Status))throw invalid('Chọn học kỳ chính đang hoạt động hoặc đã lên kế hoạch.',409);
  await requireThreePhaseSchema(c);
  await requireLifecycleSchema(c);
  const schedule=validateCampaignSchedule(b);
  if(schedule.end>periodBounds(period).end)throw invalid('Thời hạn không được vượt quá ngày kết thúc học kỳ.');
  const databaseNow=(await c.query('SELECT clock_timestamp() AS now')).rows[0].now;
  if(schedule.start<=databaseNow)throw invalid('Đợt OJT phải bắt đầu trong tương lai.');
  const semesterId=await ensureOjtSemesterForPeriod(c,periodId);
  if(b.supplemental!==undefined&&typeof b.supplemental!=='boolean')throw invalid('supplemental must be boolean.');
  let campaign=(await c.query('SELECT * FROM "RecruitmentCampaigns" WHERE "OJTSemesterID"=$1 FOR UPDATE',[semesterId])).rows[0];
  let roundOffset=0;
  if(campaign){
   if(!b.supplemental)throw invalid('Kỳ OJT đã có đợt tuyển dụng; hoàn tất và chốt đợt trước rồi tạo đợt bổ sung.',409,'RECRUITMENT_CAMPAIGN_EXISTS');
   const previous=(await c.query('SELECT * FROM "RecruitmentWindows" WHERE "OJTSemesterID"=$1 ORDER BY "StartsAt"',[semesterId])).rows;
   if(previous.some(w=>!w.ResultsFinalizedAt||new Date(w.EndsAt)>databaseNow))throw invalid('Phải hoàn tất và chốt tất cả đợt trước khi tạo đợt bổ sung.',409,'PREVIOUS_ROUND_NOT_FINALIZED');
   roundOffset=Math.max(0,...previous.map(w=>Number(w.RoundNumber)||0));
   await c.query('UPDATE "RecruitmentCampaigns" SET "EndsAt"=GREATEST("EndsAt",$2::timestamptz) WHERE "CampaignID"=$1',[campaign.CampaignID,schedule.end]);
  }else{
   if(b.supplemental)throw invalid('Chưa có đợt tuyển dụng gốc để tạo đợt bổ sung.',409);
   campaign=(await c.query(`INSERT INTO "RecruitmentCampaigns" ("OJTSemesterID","Name","CreatedBy","StartsAt","EndsAt","ScheduleVersion")
    VALUES ($1,$2,$3,$4,$5,3) RETURNING *`,[semesterId,requiredText(b.name,'name',150),actor,schedule.start,schedule.end])).rows[0];
  }
  if((await c.query(`SELECT 1 FROM "RecruitmentWindows" WHERE "OJTSemesterID"=$1 AND "StartsAt"<$3 AND "EndsAt">$2`,[semesterId,schedule.start,schedule.end])).rowCount)
   throw invalid('Lịch tuyển dụng trùng với đợt đã có.',409,'RECRUITMENT_WINDOW_CONFLICT');
  const children=[];
  for(const [i,r] of schedule.rounds.entries()){
   const row=(await c.query(`INSERT INTO "RecruitmentWindows" ("AcademicPeriodID","OJTSemesterID","Name","StartsAt","EndsAt","CreatedBy","CampaignID","RoundNumber","PostingStartsAt","PostingEndsAt","ApplicationStartsAt","ApplicationEndsAt","ResultsStartsAt","ResultsEndsAt")
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING "WindowID"`,[periodId,semesterId,r.name,r.start,r.end,actor,campaign.CampaignID,roundOffset+i+1,r.postingStartsAt,r.postingEndsAt,r.applicationStartsAt,r.applicationEndsAt,r.resultsStartsAt,r.resultsEndsAt])).rows[0];
   await c.query(`INSERT INTO "OJTRegistrationWindows" ("OJTSemesterID","AcademicPeriodID","Name","Scope","StartsAt","EndsAt","CreatedBy","RecruitmentRoundID")
    VALUES ($1,$2,$3,'{}'::jsonb,$4,$5,$6,$7)`,[semesterId,periodId,r.name,r.applicationStartsAt,r.applicationEndsAt,actor,row.WindowID]);
   const after=await windowRecord(c,row.WindowID);children.push(windowApi(after));
   await audit(c,actor,'RecruitmentWindows',row.WindowID,'CREATE',null,after,reason);
  }
  await audit(c,actor,'RecruitmentCampaigns',campaign.CampaignID,'CREATE',null,{...campaign,rounds:children},reason);
  return {id:campaign.CampaignID,name:b.name,startsAt:schedule.start,endsAt:schedule.end,rounds:children};
 });
}
export async function finalizeWindow(id:number,body:unknown,actor:number){
 const reason=requiredText(inputObject(body,['reason']).reason,'reason',2000);
 return academicTransaction(async c=>{
  await requireRecruitmentSchema(c);
  const old=await windowRecord(c,id);
  if(old.ResultsFinalizedAt)return {...windowApi(old),replayed:true};
  if(old.DatabaseNow<new Date(old.EndsAt))throw invalid('Chỉ chốt tổng hợp sau khi đợt đã kết thúc.',409);
  await expireRecruitmentResponses(c);
  const summary=(await c.query(`SELECT count(*)::int AS total,
   count(*) FILTER(WHERE a."Status"='ACCEPTED')::int AS accepted,
   count(*) FILTER(WHERE a."Status"='REJECTED')::int AS rejected,
   count(*) FILTER(WHERE a."Status"='WITHDRAWN')::int AS withdrawn,
   count(*) FILTER(WHERE a."Status" NOT IN ('ACCEPTED','REJECTED','WITHDRAWN'))::int AS pending
   FROM "JobApplications" a JOIN "RecruitmentPosts" p USING("PostID") WHERE p."WindowID"=$1`,[id])).rows[0];
  await c.query(`UPDATE "RecruitmentWindows" SET "Status"='CLOSED',"ResultsFinalizedAt"=clock_timestamp(),"ResultsFinalizedBy"=$2,"ResultsSummary"=$3,"UpdatedAt"=now() WHERE "WindowID"=$1`,[id,actor,JSON.stringify(summary)]);
  await c.query(`UPDATE "OJTRegistrationWindows" SET "Status"='CLOSED',"UpdatedAt"=now() WHERE "RecruitmentRoundID"=$1`,[id]);
  const after=await windowRecord(c,id);await audit(c,actor,'RecruitmentWindows',id,'FINALIZE_RESULTS',old,after,reason);return windowApi(after);
 });
}
