import { pool } from '../../config/database';
import { logger } from '../../config/logger';
import { academicTransaction, audit } from '../academic/academic.repository';
import { activeStudentRegistration, recruitmentDeadline } from './enterprise-recruitment.policy';

// Operates exclusively on posts explicitly submitted through the enterprise API.
export async function advanceEnterpriseRecruitment() {
  return academicTransaction(async c => {
    const posts = (await c.query(`SELECT p."PostID",p."CreatedBy",p."WindowID" AS "PreviousWindowID",p."OJTSemesterID",
      next_window."WindowID",ap."EndDate" AS "PeriodEndDate",clock_timestamp() AS "DatabaseNow"
      FROM "RecruitmentPosts" p JOIN "RecruitmentWindows" old_window ON old_window."WindowID"=p."WindowID"
      JOIN "AcademicPeriods" ap ON ap."AcademicPeriodID"=old_window."AcademicPeriodID"
      JOIN "OJTSemesters" term ON term."OJTSemesterID"=p."OJTSemesterID" AND term."AcademicPeriodID"=ap."AcademicPeriodID"
      JOIN "Enterprises" e ON e."EnterpriseID"=p."EnterpriseID" AND e."Status"='ACTIVE' AND e."DeletedAt" IS NULL
      JOIN LATERAL (SELECT w."WindowID" FROM "RecruitmentWindows" w
        WHERE w."OJTSemesterID"=p."OJTSemesterID" AND w."AcademicPeriodID"=ap."AcademicPeriodID"
          AND w."WindowID"<>p."WindowID" AND w."Status"='OPEN'
          AND w."StartsAt">=old_window."EndsAt" AND w."StartsAt"<=clock_timestamp() AND w."EndsAt">clock_timestamp()
        ORDER BY w."StartsAt",w."WindowID" LIMIT 1) next_window ON true
      WHERE p."EnterpriseManaged" AND p."ArchivedAt" IS NULL
        AND (p."Status"='PUBLISHED' OR (p."Status"='CLOSED' AND (p."ReviewedAt" IS NULL OR p."ReviewedAt"=p."PublishedAt")))
        AND p."PublishedAt" IS NOT NULL AND old_window."EndsAt"<=clock_timestamp()
        AND ap."Kind"='SEMESTER' AND ap."Status" NOT IN ('CLOSED','ARCHIVED')
        AND (ap."EndDate"+1)::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh'>clock_timestamp()
        AND NOT EXISTS(SELECT 1 FROM "OJTRegistrationWindows" rw WHERE rw."OJTSemesterID"=p."OJTSemesterID" AND ${activeStudentRegistration('rw')})
        AND EXISTS(SELECT 1 FROM "RecruitmentPostPositions" pp JOIN "InternshipPositions" pos USING("PositionID")
          WHERE pp."PostID"=p."PostID" AND pos."DeletedAt" IS NULL AND pos."ArchivedAt" IS NULL
            AND pos."Status" IN ('OPEN','CLOSED') AND pos."Capacity">(SELECT count(*) FROM "InternshipAssignments" a
              WHERE a."PositionID"=pos."PositionID" AND COALESCE(upper(a."Status"),'ASSIGNED') NOT IN ('CANCELLED','CANCELED')))
      FOR UPDATE OF p`)).rows;
    for (const post of posts) {
      const deadline = await recruitmentDeadline(c,post,null);
      await c.query(`UPDATE "RecruitmentPosts" SET "WindowID"=$2,"DeadlineAt"=$3,"Status"='PUBLISHED',"UpdatedAt"=now() WHERE "PostID"=$1`,[post.PostID,post.WindowID,deadline]);
      await c.query(`UPDATE "InternshipPositions" pos SET "Status"='OPEN' FROM "RecruitmentPostPositions" pp
        WHERE pp."PostID"=$1 AND pp."PositionID"=pos."PositionID" AND pos."Status"='CLOSED'
          AND pos."DeletedAt" IS NULL AND pos."ArchivedAt" IS NULL`,[post.PostID]);
      await audit(c,post.CreatedBy,'RecruitmentPosts',post.PostID,'ENTERPRISE_AUTO_CONTINUE',
        {windowId:post.PreviousWindowID},{windowId:post.WindowID,deadlineAt:deadline,system:true});
    }
    return posts.length;
  });
}

export function startEnterpriseRecruitmentWorker() {
  if (!pool || process.env.ENTERPRISE_RECRUITMENT_WORKER_ENABLED === 'false') return () => {};
  let busy = false;
  const timer = setInterval(async () => {
    if (busy) return;
    busy = true;
    try { await advanceEnterpriseRecruitment(); }
    catch (error) { logger.error('Enterprise recruitment continuation failed.',error instanceof Error ? error.message : 'Unknown error'); }
    finally { busy = false; }
  },60000);
  timer.unref();
  return () => clearInterval(timer);
}
