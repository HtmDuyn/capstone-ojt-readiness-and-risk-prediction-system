import type { PoolClient } from 'pg';
import { academicTransaction,audit } from '../academic/academic.repository';
import { actualPeriod } from '../academic/workflow-policy';
import { inputObject,invalid,requiredText } from '../students/student.validation';
import { windowRecord,windowApi } from './recruitment.repository';
import { editedSchedule,scheduleColumns,schedulePermissions } from './schedule-policy';
import { assertNoRoundOverlap, assertRoundWithinSemester, assertRecruitmentPeriodActive } from './round-schedule.policy';

export async function requireScheduleEditingSchema(c:PoolClient) {
 if(!(await c.query(`SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='RecruitmentWindows' AND column_name='OpenedAt') AS ready`)).rows[0].ready)
  throw invalid('Database chưa đồng bộ schema lịch QHDN. Script chuẩn nằm tại db/backend; chạy script sẽ khởi tạo lại các bảng ứng dụng.',503,'RECRUITMENT_MIGRATION_REQUIRED');
}

export async function editWindowSchedule(id:number,body:unknown,actor:number) {
 const b=inputObject(body,['name','reason',...Object.keys(scheduleColumns)]);
 const reason=requiredText(b.reason,'reason',2000),name=requiredText(b.name,'name',150);
 return academicTransaction(async c=>{
  await requireScheduleEditingSchema(c);
  const before=await windowRecord(c,id),after=editedSchedule(before,b);
  const period=await actualPeriod(c,before.AcademicPeriodID);
  assertRecruitmentPeriodActive(period);
  assertRoundWithinSemester(period,new Date(after.StartsAt),new Date(after.EndsAt));
  await assertNoRoundOverlap(c,before.AcademicPeriodID,before.OJTSemesterID,new Date(after.StartsAt),new Date(after.EndsAt),id);
  await c.query(`SELECT set_config('app.qhdn_schedule_edit','on',true)`);
  await c.query(`UPDATE "RecruitmentCampaigns" SET "StartsAt"=LEAST("StartsAt",$2::timestamptz),"EndsAt"=GREATEST("EndsAt",$3::timestamptz) WHERE "CampaignID"=$1`,[before.CampaignID,after.StartsAt,after.EndsAt]);
  await c.query(`UPDATE "RecruitmentWindows" SET "Name"=$2,"StartsAt"=$3,"EndsAt"=$4,
   "PostingStartsAt"=$5,"PostingEndsAt"=$6,"ApplicationStartsAt"=$7,"ApplicationEndsAt"=$8,
   "ResultsStartsAt"=$9,"ResultsEndsAt"=$10,"UpdatedBy"=$11,"UpdatedAt"=now() WHERE "WindowID"=$1`,
   [id,name,after.StartsAt,after.EndsAt,...Object.values(scheduleColumns).map(col=>after[col]),actor]);
  await c.query(`UPDATE "OJTRegistrationWindows" SET "Name"=$2,"StartsAt"=$3,"EndsAt"=$4,"UpdatedAt"=now() WHERE "RecruitmentRoundID"=$1`,[id,name,after.ApplicationStartsAt,after.ApplicationEndsAt]);
  await c.query(`UPDATE "RecruitmentPosts" SET "DeadlineAt"=$2,"UpdatedAt"=now() WHERE "WindowID"=$1 AND "Status" IN ('PUBLISHED','DRAFT','PENDING_REVIEW')`,[id,after.ApplicationEndsAt]);
  await c.query(`UPDATE "RecruitmentCampaigns" SET "StartsAt"=(SELECT min("StartsAt") FROM "RecruitmentWindows" WHERE "CampaignID"=$1),"EndsAt"=(SELECT max("EndsAt") FROM "RecruitmentWindows" WHERE "CampaignID"=$1) WHERE "CampaignID"=$1`,[before.CampaignID]);
  const updated=await windowRecord(c,id);
  await audit(c,actor,'RecruitmentWindows',id,'EDIT_SCHEDULE',before,updated,reason);
  return {...windowApi(updated),...schedulePermissions(updated)};
 });
}

export async function deleteDraftWindow(id:number,actor:number) {
 const reason='Xóa đợt tuyển dụng chưa mở.';
 return academicTransaction(async c=>{
  await requireScheduleEditingSchema(c);
  const before=await windowRecord(c,id);
  if(!schedulePermissions(before).canDelete)throw invalid('Chỉ xóa đợt chưa từng mở. Đợt đang mở hoặc đã mở không được xóa.',409,'RECRUITMENT_DELETE_LOCKED');
  const linked=(await c.query(`SELECT EXISTS(SELECT 1 FROM "RecruitmentPosts" WHERE "WindowID"=$1)
   OR EXISTS(SELECT 1 FROM "AccountImportBatches" WHERE "RecruitmentWindowID"=$1)
   OR EXISTS(SELECT 1 FROM "OJTRegistrations" r JOIN "OJTRegistrationWindows" w ON w."WindowID"=r."WindowID" WHERE w."RecruitmentRoundID"=$1) AS used`,[id])).rows[0].used;
  if(linked)throw invalid('Đợt đã có dữ liệu liên quan, không được xóa.',409,'RECRUITMENT_WINDOW_IN_USE');
  await c.query(`SELECT set_config('app.qhdn_schedule_edit','on',true)`);
  await c.query('DELETE FROM "OJTRegistrationWindows" WHERE "RecruitmentRoundID"=$1',[id]);
  await c.query('DELETE FROM "RecruitmentWindows" WHERE "WindowID"=$1',[id]);
  const remaining=(await c.query('SELECT min("StartsAt") AS start,max("EndsAt") AS "end" FROM "RecruitmentWindows" WHERE "CampaignID"=$1',[before.CampaignID])).rows[0];
  if(remaining.start)await c.query('UPDATE "RecruitmentCampaigns" SET "StartsAt"=$2,"EndsAt"=$3 WHERE "CampaignID"=$1',[before.CampaignID,remaining.start,remaining.end]);
  else await c.query('DELETE FROM "RecruitmentCampaigns" WHERE "CampaignID"=$1',[before.CampaignID]);
  await audit(c,actor,'RecruitmentWindows',id,'DELETE_DRAFT',before,null,reason);
  return {id,deleted:true};
 });
}
