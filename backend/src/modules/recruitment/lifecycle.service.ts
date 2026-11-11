import { academicTransaction, audit } from '../academic/academic.repository';
import { inputObject, invalid } from '../students/student.validation';
import { windowRecord, windowApi } from './recruitment.repository';
import { extendedSchedule } from './extension-policy';
import { periodBounds } from '../academic/workflow-policy';
import type { PoolClient } from 'pg';

export async function requireLifecycleSchema(c:PoolClient){
 if(!(await c.query(`SELECT to_regprocedure('public."CarryForwardRecruitmentPosts"(integer)') IS NOT NULL AS ready`)).rows[0].ready)
  throw invalid('Chạy riêng khối OJT RECRUITMENT LIFECYCLE V4 trong backend/DB để dùng gia hạn và đợt bổ sung; không chạy toàn bộ file vì sẽ reset dữ liệu.',503,'RECRUITMENT_MIGRATION_REQUIRED');
}
export async function extendWindow(id:number,body:unknown,actor:number){
 const b=inputObject(body,['postingEndsAt','applicationEndsAt','resultsEndsAt']);
 return academicTransaction(async c=>{
  await requireLifecycleSchema(c);
  const before=await windowRecord(c,id),after=extendedSchedule(before,b);
  const period=(await c.query('SELECT * FROM "AcademicPeriods" WHERE "AcademicPeriodID"=$1',[before.AcademicPeriodID])).rows[0];
  if(new Date(after.EndsAt)>periodBounds(period).end)throw invalid('Gia hạn không được vượt ngày kết thúc học kỳ.');
  if((await c.query(`SELECT 1 FROM "RecruitmentWindows" WHERE "OJTSemesterID"=$1 AND "WindowID"<>$2 AND "StartsAt"<$4 AND "EndsAt">$3`,[before.OJTSemesterID,id,before.StartsAt,after.EndsAt])).rowCount)
   throw invalid('Gia hạn trùng lịch đợt tuyển dụng khác.',409,'RECRUITMENT_WINDOW_CONFLICT');
  await c.query(`UPDATE "RecruitmentCampaigns" SET "EndsAt"=GREATEST("EndsAt",$2::timestamptz) WHERE "CampaignID"=$1`,[before.CampaignID,after.EndsAt]);
  await c.query(`UPDATE "RecruitmentWindows" SET "PostingEndsAt"=$2,"ApplicationEndsAt"=$3,"ResultsEndsAt"=$4,"EndsAt"=$4,"UpdatedBy"=$5,"UpdatedAt"=now() WHERE "WindowID"=$1`,[id,after.PostingEndsAt,after.ApplicationEndsAt,after.ResultsEndsAt,actor]);
  await c.query(`UPDATE "OJTRegistrationWindows" SET "EndsAt"=$2,"UpdatedAt"=now() WHERE "RecruitmentRoundID"=$1`,[id,after.ApplicationEndsAt]);
  await c.query(`UPDATE "RecruitmentPosts" SET "DeadlineAt"=$2,"UpdatedAt"=now() WHERE "WindowID"=$1 AND "Status"='PUBLISHED'`,[id,after.ApplicationEndsAt]);
  const title='Gia hạn đợt tuyển dụng: '+before.Name;
  const fmt=(value:unknown)=>new Date(value as string).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'});
  const content=`Hạn đăng tin: ${fmt(after.PostingEndsAt)}. Hạn ứng tuyển: ${fmt(after.ApplicationEndsAt)}. Hạn phản hồi: ${fmt(after.ResultsEndsAt)}.`;
  const notified=await c.query(`INSERT INTO "Notifications" ("UserID","Title","Content","Channel","RelatedEntityType","RelatedEntityID","SentAt")
   SELECT DISTINCT u."UserID",$2::text,$3::text,'IN_APP','RECRUITMENT_WINDOW',$1::int,now() FROM "Users" u JOIN "Roles" role USING("RoleID")
   WHERE u."Status"='ACTIVE' AND (role."RoleCode" IN ('ADMIN','OJT_COORD')
    OR EXISTS(SELECT 1 FROM "EnterpriseUsers" eu JOIN "Enterprises" e USING("EnterpriseID") WHERE eu."UserID"=u."UserID" AND e."Status"='ACTIVE' AND e."DeletedAt" IS NULL)
    OR EXISTS(SELECT 1 FROM "Students" s JOIN "EligibleStudentHandoffItems" h USING("StudentID") WHERE s."UserID"=u."UserID" AND h."OJTSemesterID"=$4))`,[id,title,content,before.OJTSemesterID]);
  await audit(c,actor,'RecruitmentWindows',id,'EXTEND_PHASES',before,after,'Gia hạn giai đoạn đang mở.');
  return {...windowApi(await windowRecord(c,id)),notificationsCreated:notified.rowCount};
 });
}
