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

export function hasPhaseSchedule(w: Row): boolean {
 return ['PostingStartsAt','PostingEndsAt','ApplicationStartsAt','ApplicationEndsAt','ResultsStartsAt','ResultsEndsAt'].every(key=>w[key]!=null);
}
export function phaseIsOpen(w: Row, action:'POSTING'|'APPLICATION'|'RESULTS'): boolean {
 const now=new Date(w.DatabaseNow).getTime();
 if(w.Status!=='OPEN'||w.ResultsFinalizedAt)return false;
 if(['CLOSED','ARCHIVED'].includes(w.PeriodStatus))return false;
 if(w.Kind!==undefined&&(w.Kind!=='SEMESTER'||w.LinkedPeriodID!==w.AcademicPeriodID))return false;
 const [start,end]=action==='POSTING'?['PostingStartsAt','PostingEndsAt']:action==='APPLICATION'?['ApplicationStartsAt','ApplicationEndsAt']:['ResultsStartsAt','ResultsEndsAt'];
 return now>=new Date(w[start]).getTime()&&now<new Date(w[end]).getTime();
}
export async function requireThreePhaseSchema(c: PoolClient) {
 if(!(await c.query(`SELECT to_regprocedure('public."ExpireRecruitmentResponses"()') IS NOT NULL AS ready`)).rows[0].ready)
  throw invalid('Cần chạy riêng khối OJT RECRUITMENT THREE PHASES V3 trong backend/DB trước khi tạo đợt ba hạn. Không chạy toàn bộ DB vì sẽ reset dữ liệu.',503,'RECRUITMENT_MIGRATION_REQUIRED');
}
export async function expireRecruitmentResponses(c: PoolClient) {
 const ready=(await c.query(`SELECT to_regprocedure('public."ExpireRecruitmentResponses"()') IS NOT NULL AS ready`)).rows[0].ready;
 if(ready)await c.query('SELECT public."ExpireRecruitmentResponses"()');
}

export function currentRoundPhase(w: Row): string {
 if(!w.CampaignID)return 'LEGACY';
 if(w.ResultsFinalizedAt)return 'FINALIZED';
 const now=new Date(w.DatabaseNow).getTime();
 if(now>=new Date(w.EndsAt).getTime())return 'ENDED';
 if(w.Status==='CLOSED')return 'CLOSED';
 if(w.Status!=='OPEN')return 'DRAFT';
 if(hasPhaseSchedule(w)){
  if(phaseIsOpen(w,'POSTING'))return 'POSTING';
  if(phaseIsOpen(w,'APPLICATION')&&phaseIsOpen(w,'RESULTS'))return 'APPLICATION_AND_RESULTS';
  if(phaseIsOpen(w,'APPLICATION'))return 'APPLICATION';
  if(phaseIsOpen(w,'RESULTS'))return 'RESULTS';
  return now<new Date(w.StartsAt).getTime()?'SCHEDULED':'BETWEEN_PHASES';
 }
 return now<new Date(w.StartsAt).getTime()?'SCHEDULED':'OPEN';
}
export function roundActions(w: Row) {
 const now=new Date(w.DatabaseNow).getTime();
 let openBlockedReason:string|null=null;
 if(w.ResultsFinalizedAt)openBlockedReason='Đợt đã chốt tổng hợp không thể mở lại.';
 else if(w.Status==='CLOSED')openBlockedReason='Đợt đã đóng không thể mở lại.';
 else if(w.Status==='OPEN')openBlockedReason='Đợt đã được mở.';
 else if(now>=new Date(w.EndsAt).getTime())openBlockedReason='Đợt đã hết thời hạn tuyển dụng.';
 else if(w.Kind!=='SEMESTER'||w.LinkedPeriodID!==w.AcademicPeriodID||['CLOSED','ARCHIVED'].includes(w.PeriodStatus))
  openBlockedReason='Học kỳ hoặc liên kết kỳ OJT không còn khả dụng.';
 else if(w.PreviousRoundPending)openBlockedReason='Đợi đợt trước kết thúc và được chốt tổng hợp.';
 return {canOpen:openBlockedReason===null,openBlockedReason,
  canFinalize:!w.ResultsFinalizedAt&&now>=new Date(w.EndsAt).getTime()};
}
// Existing rounds without phase dates retain their original interval.
export function assertRoundPhase(w: Row, action:'POSTING'|'APPLICATION'|'RESULTS') {
 if(!w.CampaignID)return;
 if(hasPhaseSchedule(w)){
  if(!phaseIsOpen(w,action))throw invalid('Thao tác nằm ngoài hạn '+({POSTING:'doanh nghiệp đăng tin',APPLICATION:'sinh viên ứng tuyển',RESULTS:'doanh nghiệp xét tuyển, phản hồi'}[action])+'.',409,'RECRUITMENT_PHASE_CLOSED');
  return;
 }
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
