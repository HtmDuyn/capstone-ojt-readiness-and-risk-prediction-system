import type { PoolClient } from 'pg';
import { invalid } from '../students/student.validation';
import { enterpriseScope } from '../qhdn/catalog.service';
import type { Actor, Row } from '../ojt-registration/window.service';

export { type Actor, type Row };
export async function windowRecord(c: PoolClient,id: number) {
 const w=(await c.query(`SELECT w.*,p."PeriodCode",p."Name" AS "PeriodName",p."Kind",p."Status" AS "PeriodStatus",
 p."EndDate" AS "PeriodEndDate",o."AcademicPeriodID" AS "LinkedPeriodID",clock_timestamp() AS "DatabaseNow"
 FROM "RecruitmentWindows" w JOIN "AcademicPeriods" p ON p."AcademicPeriodID"=w."AcademicPeriodID"
 JOIN "OJTSemesters" o ON o."OJTSemesterID"=w."OJTSemesterID" WHERE w."WindowID"=$1 FOR UPDATE OF w`,[id])).rows[0];
 if (!w) throw invalid('Recruitment window not found.',404,'RECRUITMENT_WINDOW_NOT_FOUND');
 return w;
}
export function assertOpen(w: Row) {
 if(w.Kind!=='SEMESTER'||w.LinkedPeriodID!==w.AcademicPeriodID||['CLOSED','ARCHIVED'].includes(w.PeriodStatus))
  throw invalid('The academic semester is unavailable or its OJT link changed.',409,'RECRUITMENT_PERIOD_UNAVAILABLE');
 if(w.Status!=='OPEN'||w.DatabaseNow<new Date(w.StartsAt)||w.DatabaseNow>=new Date(w.EndsAt))
  throw invalid('Recruitment intake is closed or outside its deadline.',409,'RECRUITMENT_WINDOW_CLOSED');
}
export const windowApi=(w:Row)=>({id:w.WindowID,academicPeriodId:w.AcademicPeriodID,periodCode:w.PeriodCode,
 periodName:w.PeriodName,name:w.Name,startsAt:w.StartsAt,endsAt:w.EndsAt,status:w.Status,
 accepting:w.Status==='OPEN'&&new Date(w.StartsAt)<=new Date(w.DatabaseNow)&&new Date(w.EndsAt)>new Date(w.DatabaseNow)&&!['CLOSED','ARCHIVED'].includes(w.PeriodStatus),
 createdAt:w.CreatedAt,updatedAt:w.UpdatedAt});

export const postSelect=`SELECT p.*,w."AcademicPeriodID",ap."PeriodCode",e."Name" AS "CompanyName",
 COALESCE((SELECT jsonb_agg(jsonb_build_object('id',pos."PositionID",'code',pos."RecruitmentCode",'title',pos."Title",
 'description',pos."Description",'requirements',pos."Requirements",'capacity',pos."Capacity",'remainingSlots',pos."RemainingSlots",'status',pos."Status") ORDER BY pos."PositionID")
 FROM "RecruitmentPostPositions" pp JOIN "InternshipPositions" pos ON pos."PositionID"=pp."PositionID" WHERE pp."PostID"=p."PostID"),'[]'::jsonb) AS positions
 FROM "RecruitmentPosts" p JOIN "Enterprises" e ON e."EnterpriseID"=p."EnterpriseID"
 LEFT JOIN "RecruitmentWindows" w ON w."WindowID"=p."WindowID"
 LEFT JOIN "AcademicPeriods" ap ON ap."AcademicPeriodID"=w."AcademicPeriodID"`;
export const postApi=(p:Row)=>({id:p.PostID,windowId:p.WindowID,academicPeriodId:p.AcademicPeriodID,periodCode:p.PeriodCode,
 companyId:p.EnterpriseID,companyName:p.CompanyName,title:p.Title,content:p.Content,benefits:p.Benefits,
 applicationInstructions:p.ApplicationInstructions,status:p.Status==='PUBLISHED'&&p.DeadlineAt&&new Date(p.DeadlineAt).getTime()<=Date.now()?'CLOSED':p.Status,deadlineAt:p.DeadlineAt,publishedAt:p.PublishedAt,
 reviewReason:p.ReviewReason,reviewedAt:p.ReviewedAt,positions:p.positions,createdAt:p.CreatedAt,updatedAt:p.UpdatedAt});
export async function postRecord(c:PoolClient,id:number,actor:Actor,lock=false) {
 const companyId=await enterpriseScope(c,actor);
 const p=(await c.query(`${postSelect} WHERE p."PostID"=$1 AND ($2::int IS NULL OR p."EnterpriseID"=$2)${lock?' FOR UPDATE OF p':''}`,[id,companyId])).rows[0];
 if(!p)throw invalid('Recruitment post not found.',404,'RECRUITMENT_POST_NOT_FOUND');
 return p;
}
export async function closeUnusedPositions(c:PoolClient,postId?:number) {
 await c.query(`UPDATE "InternshipPositions" pos SET "Status"='CLOSED'
 WHERE pos."Status"='OPEN' AND EXISTS(SELECT 1 FROM "RecruitmentPostPositions" pp WHERE pp."PositionID"=pos."PositionID" AND ($1::int IS NULL OR pp."PostID"=$1))
 AND NOT EXISTS(SELECT 1 FROM "RecruitmentPostPositions" pp JOIN "RecruitmentPosts" p ON p."PostID"=pp."PostID"
 WHERE pp."PositionID"=pos."PositionID" AND p."Status"='PUBLISHED' AND (p."DeadlineAt" IS NULL OR p."DeadlineAt">clock_timestamp()))`,[postId??null]);
}
export async function assertPublishedPosition(c:PoolClient,positionId:number) {
 const blocked=await c.query(`SELECT 1 FROM "RecruitmentPostPositions" pp JOIN "RecruitmentPosts" p ON p."PostID"=pp."PostID"
 WHERE pp."PositionID"=$1 AND p."WindowID" IS NOT NULL
 AND NOT EXISTS(SELECT 1 FROM "RecruitmentPostPositions" active JOIN "RecruitmentPosts" post ON post."PostID"=active."PostID"
 WHERE active."PositionID"=$1 AND post."Status"='PUBLISHED' AND (post."DeadlineAt" IS NULL OR post."DeadlineAt">clock_timestamp())) LIMIT 1`,[positionId]);
 if(blocked.rowCount)throw invalid('The recruitment post has not been published or is closed/expired.',409,'RECRUITMENT_NOT_PUBLISHED');
}
