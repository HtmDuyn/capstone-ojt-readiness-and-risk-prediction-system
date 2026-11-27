import { academicTransaction, audit } from '../academic/academic.repository';
import { inputObject, invalid } from '../students/student.validation';
import { windowRecord, windowApi } from './recruitment.repository';
import { extendedSchedule } from './extension-policy';
import type { PoolClient } from 'pg';
import { actualPeriod } from '../academic/workflow-policy';
import { assertNoRoundOverlap, assertRoundWithinSemester, assertRecruitmentPeriodActive } from './round-schedule.policy';

export async function requireLifecycleSchema(c:PoolClient){
 if(!(await c.query(`SELECT to_regprocedure('public."CarryForwardRecruitmentPosts"(integer)') IS NOT NULL AS ready`)).rows[0].ready)
  throw invalid('Database chưa đồng bộ schema gia hạn đợt OJT. Script chuẩn nằm tại db/backend; chạy script sẽ khởi tạo lại các bảng ứng dụng.',503,'RECRUITMENT_MIGRATION_REQUIRED');
}
export async function extendWindow(id:number,body:unknown,actor:number){
 const b=inputObject(body,['postingEndsAt','applicationEndsAt','resultsEndsAt']);
 return academicTransaction(async c=>{
  await requireLifecycleSchema(c);
  const before=await windowRecord(c,id),after=extendedSchedule(before,b);
  const period=await actualPeriod(c,before.AcademicPeriodID);
  assertRecruitmentPeriodActive(period);
  assertRoundWithinSemester(period,new Date(after.StartsAt),new Date(after.EndsAt));
  await assertNoRoundOverlap(c,before.AcademicPeriodID,before.OJTSemesterID,new Date(after.StartsAt),new Date(after.EndsAt),id);
  await c.query(`UPDATE "RecruitmentCampaigns" SET "EndsAt"=GREATEST("EndsAt",$2::timestamptz) WHERE "CampaignID"=$1`,[before.CampaignID,after.EndsAt]);
  await c.query(`UPDATE "RecruitmentWindows" SET "PostingEndsAt"=$2,"ApplicationEndsAt"=$3,"ResultsEndsAt"=$4,"EndsAt"=$4,"UpdatedBy"=$5,"UpdatedAt"=now() WHERE "WindowID"=$1`,[id,after.PostingEndsAt,after.ApplicationEndsAt,after.ResultsEndsAt,actor]);
  await c.query(`UPDATE "OJTRegistrationWindows" SET "EndsAt"=$2,"UpdatedAt"=now() WHERE "RecruitmentRoundID"=$1`,[id,after.ApplicationEndsAt]);
  await c.query(`UPDATE "RecruitmentPosts" SET "DeadlineAt"=$2,"UpdatedAt"=now() WHERE "WindowID"=$1 AND "Status"='PUBLISHED'`,[id,after.ApplicationEndsAt]);
  await audit(c,actor,'RecruitmentWindows',id,'EXTEND_PHASES',before,after,'Gia hạn giai đoạn đang mở.');
  return {...windowApi(await windowRecord(c,id)),notificationsCreated:0};
 });
}
