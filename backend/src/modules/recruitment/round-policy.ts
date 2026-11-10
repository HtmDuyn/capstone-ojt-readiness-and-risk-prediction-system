import type { PoolClient } from 'pg';
import { invalid } from '../students/student.validation';
import type { Row } from './recruitment.repository';

export async function recruitmentSchemaReady(c: PoolClient): Promise<boolean> {
  const result=await c.query(`SELECT to_regclass('public."RecruitmentCampaigns"') IS NOT NULL
    AND (SELECT count(*) FROM pg_attribute WHERE attrelid=to_regclass('public."RecruitmentWindows"')
      AND attname=ANY(ARRAY['CampaignID','RoundNumber','ResultsFinalizedAt','ResultsFinalizedBy','ResultsSummary']) AND NOT attisdropped)=5
    AND EXISTS(SELECT 1 FROM pg_attribute WHERE attrelid=to_regclass('public."OJTRegistrationWindows"') AND attname='RecruitmentRoundID' AND NOT attisdropped) AND EXISTS(SELECT 1 FROM pg_attribute WHERE attrelid=to_regclass('public."RecruitmentCampaigns"') AND attname='ScheduleVersion' AND NOT attisdropped) AS ready`);
  return result.rows[0].ready===true;
}
export async function requireRecruitmentSchema(c: PoolClient) {
  if(!await recruitmentSchemaReady(c))throw invalid('Database chưa cập nhật luồng tuyển dụng. Chạy riêng khối từ -- BEGIN OJT RECRUITMENT CAMPAIGN V2 đến -- END OJT RECRUITMENT CAMPAIGN V2 trong backend/DB trên Supabase SQL Editor, sau đó tải lại trang. Không chạy toàn bộ file DB vì sẽ reset dữ liệu.',503,'RECRUITMENT_MIGRATION_REQUIRED');
}

export function currentRoundPhase(w: Row): string {
 if(!w.CampaignID)return 'LEGACY';
 if(w.ResultsFinalizedAt)return 'FINALIZED';
 const now=new Date(w.DatabaseNow).getTime();
 if(now>=new Date(w.EndsAt).getTime())return 'ENDED';
 if(w.Status!=='OPEN')return 'DRAFT';
 return now<new Date(w.StartsAt).getTime()?'SCHEDULED':'OPEN';
}
// Compatibility names for existing callers; there are no separate phases.
export function assertRoundPhase(w: Row, action:'POSTING'|'APPLICATION'|'RESULTS') {
 if(!w.CampaignID)return;
 if(action==='RESULTS'){
  if(w.ResultsFinalizedAt||w.Status==='DRAFT'||new Date(w.DatabaseNow)<new Date(w.StartsAt))
   throw invalid('Đợt chưa mở hoặc kết quả đã được chốt.',409,'RECRUITMENT_WINDOW_CLOSED');
 }else if(currentRoundPhase(w)!=='OPEN')throw invalid('Thao tác nằm ngoài thời gian đợt tuyển dụng con.',409,'RECRUITMENT_WINDOW_CLOSED');
}
export async function assertPostPhase(c: PoolClient, postId: number, phase: 'APPLICATION' | 'RESULTS') {
  const w = (await c.query(`SELECT w.*,ap."Kind",ap."Status" AS "PeriodStatus",o."AcademicPeriodID" AS "LinkedPeriodID",
    clock_timestamp() AS "DatabaseNow" FROM "RecruitmentPosts" p
    JOIN "RecruitmentWindows" w ON w."WindowID"=p."WindowID"
    JOIN "AcademicPeriods" ap ON ap."AcademicPeriodID"=w."AcademicPeriodID"
    JOIN "OJTSemesters" o ON o."OJTSemesterID"=w."OJTSemesterID" WHERE p."PostID"=$1 FOR UPDATE OF w`, [postId])).rows[0];
  if(w?.CampaignID&&(w.Kind!=='SEMESTER'||w.LinkedPeriodID!==w.AcademicPeriodID||['CLOSED','ARCHIVED'].includes(w.PeriodStatus)))
    throw invalid('Học kỳ tuyển dụng không còn khả dụng.',409,'RECRUITMENT_PERIOD_UNAVAILABLE');
  if (w) assertRoundPhase(w, phase);
  return !!w?.CampaignID;
}
