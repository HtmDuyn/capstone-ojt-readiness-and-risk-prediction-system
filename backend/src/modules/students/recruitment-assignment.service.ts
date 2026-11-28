import { recruitmentRosterSql } from '../eligibility/recruitment-roster.repository';
import type { PoolClient } from 'pg';

// Read the same computed assignment as Academic/QHDN, even before the student applies.
export async function studentRecruitmentAssignment(c: PoolClient, studentId: number) {
  return (await c.query(`SELECT roster."OJTSemesterID" AS "ojtSemesterId",term."Name" AS "semesterName",
    roster."RoundID" AS "roundId",round."Name" AS "roundName",round."Status" AS status,
    app."WindowID" AS "registrationWindowId",app."StartsAt" AS "startsAt",app."EndsAt" AS "endsAt"
    FROM (${recruitmentRosterSql}) roster JOIN "RecruitmentWindows" round ON round."WindowID"=roster."RoundID"
    JOIN "OJTSemesters" term ON term."OJTSemesterID"=roster."OJTSemesterID"
    JOIN "OJTRegistrationWindows" app ON app."RecruitmentRoundID"=round."WindowID"
    WHERE roster."StudentID"=$1 AND round."Status"='OPEN' AND round."ResultsFinalizedAt" IS NULL
      AND app."Status"='OPEN' AND app."EndsAt">statement_timestamp()
    ORDER BY app."StartsAt",round."WindowID" LIMIT 1`, [studentId])).rows[0] ?? null;
}
