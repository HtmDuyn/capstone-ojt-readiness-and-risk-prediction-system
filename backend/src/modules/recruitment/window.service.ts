import { academicTransaction, audit } from '../academic/academic.repository';
import { readTransaction } from '../qhdn/read.repository';
import { ensureOjtSemesterForPeriod } from '../academic/ojt-semester-link';
import { actualPeriod } from '../academic/workflow-policy';
import { inputObject, invalid, positiveId, requiredText, enumValue } from '../students/student.validation';
import { windowRecord, windowApi, type Row } from './recruitment.repository';
import { extendWindow, requireLifecycleSchema } from './lifecycle.service';
import { requireRecruitmentSchema, requireThreePhaseSchema, expireRecruitmentResponses } from './round-policy';
import { futureScheduleMessage, scheduleColumns, scheduleDate, scheduleFieldError, schedulePermissions, validatePhaseOrder } from './schedule-policy';
import { requireScheduleEditingSchema } from './schedule.service';
import { notifyRecruitmentCreated } from './notification.service';
import { academicPeriodStatusSql } from '../academic/period-status';
import { assertNoRoundOverlap, assertRoundWithinSemester, requireMultiRoundSchema } from './round-schedule.policy';

export function validateCampaignSchedule(body:Row) {
 const start=scheduleDate(body.startsAt,'postingStartsAt'),end=scheduleDate(body.endsAt,'resultsEndsAt');
 if(end<=start)throw scheduleFieldError('resultsEndsAt','Ngày kết thúc đợt OJT phải sau ngày bắt đầu.');
 if(!Array.isArray(body.rounds)||body.rounds.length!==1)throw invalid('Mỗi lần tạo một đợt tuyển dụng với đầy đủ ba hạn.',400,'RECRUITMENT_SINGLE_ROUND_REQUIRED');
 const rounds=body.rounds.map((value:unknown)=>{
  const keys=Object.keys(scheduleColumns) as (keyof typeof scheduleColumns)[];
  const r=inputObject(value,['name',...keys]);
  const times=Object.fromEntries(keys.map(key=>[key,scheduleDate(r[key],key)])) as Record<keyof typeof scheduleColumns,Date>;
  const {postingStartsAt:ps,postingEndsAt:pe,applicationStartsAt:as,applicationEndsAt:ae,resultsStartsAt:rs,resultsEndsAt:re}=times;
  validatePhaseOrder(times);
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
   ${academicPeriodStatusSql('p')} AS "CalendarStatus",
   p."Kind",o."AcademicPeriodID" AS "LinkedPeriodID",
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
  return {campaigns,items:rows.map(w=>({...windowApi(w),...schedulePermissions(w),serverNow:w.DatabaseNow,campaignName:w.CampaignName,pendingCount:w.PendingCount})),total:rows.length};
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
   if(status==='OPEN'){
    await requireMultiRoundSchema(c);
    if(old.Kind!=='SEMESTER'||old.LinkedPeriodID!==old.AcademicPeriodID)
     throw invalid('Học kỳ hoặc liên kết kỳ OJT không còn khả dụng.',409,'RECRUITMENT_PERIOD_UNAVAILABLE');
    if(old.CalendarStatus!=='ACTIVE')
     throw invalid('Chỉ mở đợt tuyển dụng trong học kỳ đang diễn ra.',409,'RECRUITMENT_PERIOD_NOT_ACTIVE');
    const period=await actualPeriod(c,old.AcademicPeriodID);
    assertRoundWithinSemester(period,new Date(old.StartsAt),new Date(old.EndsAt));
    await assertNoRoundOverlap(c,old.AcademicPeriodID,old.OJTSemesterID,new Date(old.StartsAt),new Date(old.EndsAt),id);
   }
   if(status==='OPEN'&&old.Status!=='OPEN'){
    if(old.Status==='CLOSED'||new Date(old.EndsAt)<=old.DatabaseNow)throw invalid('Đợt đã đóng hoặc đã hết thời hạn.',409);
   }
   await c.query(`UPDATE "RecruitmentWindows" SET "Name"=$2,"Status"=$3::text,
    "OpenedAt"=CASE WHEN $3::text='OPEN' THEN COALESCE("OpenedAt",clock_timestamp()) ELSE "OpenedAt" END,
    "UpdatedBy"=$4,"UpdatedAt"=now() WHERE "WindowID"=$1`,[id,b.name===undefined?old.Name:requiredText(b.name,'name',150),status,actor]);
   await c.query(`UPDATE "OJTRegistrationWindows" SET "Status"=CASE WHEN $2::text='OPEN' AND "EndsAt"<=clock_timestamp() THEN 'CLOSED' ELSE $2::text END,"UpdatedAt"=now() WHERE "RecruitmentRoundID"=$1`,[id,status]);
   if(status==='OPEN'&&old.Status!=='OPEN'&&old.PostingStartsAt&&new Date(old.PostingStartsAt)<=old.DatabaseNow){
    await requireLifecycleSchema(c);
    await c.query('SELECT public."CarryForwardRecruitmentPosts"($1)',[id]);
   }
   const after=await windowRecord(c,id);await audit(c,actor,'RecruitmentWindows',id,'UPDATE',old,after,reason);
   return windowApi(after);
  }
  const periodId=positiveId(b.academicPeriodId,'academicPeriodId'),period=await actualPeriod(c,periodId);
  if(period.Kind!=='SEMESTER'||period.CalendarStatus!=='ACTIVE')throw invalid('Chỉ tạo đợt tuyển dụng trong học kỳ chính đang diễn ra.',409,'RECRUITMENT_PERIOD_NOT_ACTIVE');
  const semesterId=await ensureOjtSemesterForPeriod(c,periodId);
  const campaignName=requiredText(b.name,'name',150);
  if(b.supplemental!==undefined&&typeof b.supplemental!=='boolean')throw invalid('supplemental must be boolean.');
  await requireMultiRoundSchema(c);
  await requireThreePhaseSchema(c);
  await requireLifecycleSchema(c);
  const schedule=validateCampaignSchedule(b);
  if(schedule.rounds.some(r=>+r.applicationEndsAt===+r.resultsEndsAt||+r.resultsStartsAt!==+r.applicationStartsAt))await requireScheduleEditingSchema(c);
  assertRoundWithinSemester(period,schedule.start,schedule.end);
  const databaseNow=(await c.query('SELECT clock_timestamp() AS now')).rows[0].now;
  if(schedule.start<=databaseNow)throw scheduleFieldError('postingStartsAt',futureScheduleMessage(databaseNow));
  await assertNoRoundOverlap(c,periodId,semesterId,schedule.start,schedule.end);
  // Reuse the semester's campaign. The calendar lock serializes bounds updates
  // and round numbering so simultaneous requests cannot reserve the same slot.
  let campaign=(await c.query('SELECT * FROM "RecruitmentCampaigns" WHERE "OJTSemesterID"=$1 FOR UPDATE',[semesterId])).rows[0];
  if(campaign){
   await c.query(`SELECT set_config('app.qhdn_schedule_edit','on',true)`);
   campaign=(await c.query(`UPDATE "RecruitmentCampaigns" SET "StartsAt"=LEAST("StartsAt",$2::timestamptz),"EndsAt"=GREATEST("EndsAt",$3::timestamptz)
    WHERE "CampaignID"=$1 RETURNING *`,[campaign.CampaignID,schedule.start,schedule.end])).rows[0];
  }else campaign=(await c.query(`INSERT INTO "RecruitmentCampaigns" ("OJTSemesterID","Name","CreatedBy","StartsAt","EndsAt","ScheduleVersion")
    VALUES ($1,$2,$3,$4,$5,3) RETURNING *`,[semesterId,campaignName,actor,schedule.start,schedule.end])).rows[0];
  const roundNumber=Number((await c.query('SELECT COALESCE(max("RoundNumber"),0)+1 AS "nextRound" FROM "RecruitmentWindows" WHERE "CampaignID"=$1',[campaign.CampaignID])).rows[0].nextRound);
  const createdByQhdn=(await c.query(`SELECT 1 FROM "Users" u JOIN "Roles" r USING("RoleID")
   WHERE u."UserID"=$1 AND u."Status"='ACTIVE' AND r."RoleCode"='OJT_COORD'`,[actor])).rowCount;
  const children=[];
  for(const r of schedule.rounds){
   const row=(await c.query(`INSERT INTO "RecruitmentWindows" ("AcademicPeriodID","OJTSemesterID","Name","StartsAt","EndsAt","CreatedBy","CampaignID","RoundNumber","PostingStartsAt","PostingEndsAt","ApplicationStartsAt","ApplicationEndsAt","ResultsStartsAt","ResultsEndsAt")
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING "WindowID"`,[periodId,semesterId,r.name,r.start,r.end,actor,campaign.CampaignID,roundNumber,r.postingStartsAt,r.postingEndsAt,r.applicationStartsAt,r.applicationEndsAt,r.resultsStartsAt,r.resultsEndsAt])).rows[0];
   await c.query(`INSERT INTO "OJTRegistrationWindows" ("OJTSemesterID","AcademicPeriodID","Name","Scope","StartsAt","EndsAt","CreatedBy","RecruitmentRoundID")
    VALUES ($1,$2,$3,'{}'::jsonb,$4,$5,$6,$7)`,[semesterId,periodId,r.name,r.applicationStartsAt,r.applicationEndsAt,actor,row.WindowID]);
   const after=await windowRecord(c,row.WindowID);children.push(windowApi(after));
   if(createdByQhdn)await notifyRecruitmentCreated(c,after);
   await audit(c,actor,'RecruitmentWindows',row.WindowID,'CREATE',null,after,reason);
  }
  await audit(c,actor,'RecruitmentCampaigns',campaign.CampaignID,roundNumber>1?'ADD_ROUND':'CREATE',null,{...campaign,rounds:children},reason);
  return {id:campaign.CampaignID,name:campaign.Name,startsAt:campaign.StartsAt,endsAt:campaign.EndsAt,rounds:children};
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
