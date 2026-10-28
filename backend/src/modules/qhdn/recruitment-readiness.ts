import type { PoolClient } from 'pg';

// Recruitment is ready only after a committed enterprise import in this semester
// and publication of at least one active position with a remaining slot.
export async function hasSemesterRecruitment(client: PoolClient, semesterId: number): Promise<boolean> {
  return ((await client.query(`SELECT 1 FROM "InternshipPositions" p
    JOIN "Enterprises" e ON e."EnterpriseID"=p."EnterpriseID"
    JOIN "RecruitmentPostPositions" pp ON pp."PositionID"=p."PositionID" AND pp."EnterpriseID"=p."EnterpriseID" AND pp."OJTSemesterID"=p."OJTSemesterID"
    JOIN "RecruitmentPosts" post ON post."PostID"=pp."PostID" AND post."EnterpriseID"=p."EnterpriseID" AND post."OJTSemesterID"=p."OJTSemesterID"
    WHERE p."OJTSemesterID"=$1 AND p."Status"='OPEN' AND p."ArchivedAt" IS NULL
      AND e."Status"='ACTIVE' AND e."DeletedAt" IS NULL
      AND post."Status"='PUBLISHED' AND post."ArchivedAt" IS NULL AND post."DeadlineAt">clock_timestamp()
      AND p."Capacity">(SELECT count(*) FROM "InternshipAssignments" a WHERE a."PositionID"=p."PositionID" AND COALESCE(upper(a."Status"),'ASSIGNED') NOT IN ('CANCELLED','CANCELED'))
      AND EXISTS(SELECT 1 FROM "AccountImportBatches" b WHERE b."Kind"='ENTERPRISE' AND b."OJTSemesterID"=$1)
    LIMIT 1`, [semesterId])).rowCount ?? 0) > 0;
}
