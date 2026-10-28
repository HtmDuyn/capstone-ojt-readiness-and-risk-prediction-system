import type { PoolClient } from 'pg';
import { calculatedEligibilitySql } from './frontend-results.service';
import { officialEligibilityWithClient } from './eligibility.service';
import { invalid } from '../students/student.validation';

// Admission follows the evidence ACADEMIC handed off. A frontend result is
// deliberately separate from a legacy, formally confirmed EligibilityCheck.
export async function admissionEligibilityWithClient(
  c: PoolClient, studentId: number, semesterId: number, lockSource = false,
) {
  const handoff = (await c.query(`SELECT i."CheckID",i."CalculatedBatchID",i."HandoffID",h."CreatedAt"
    FROM "EligibleStudentHandoffItems" i JOIN "EligibleStudentHandoffs" h
      ON h."HandoffID"=i."HandoffID" AND h."OJTSemesterID"=i."OJTSemesterID" AND h."RecipientRole"='OJT_COORD'
    WHERE i."StudentID"=$1 AND i."OJTSemesterID"=$2 ORDER BY i."HandoffID" DESC LIMIT 1`,
  [studentId, semesterId])).rows[0];
  if (!handoff) return null;
  if (handoff.CalculatedBatchID === null) {
    const official = await officialEligibilityWithClient(c, studentId, semesterId, { lockSource });
    return official ? { ...official, source: 'OFFICIAL_CHECK', handoffId: handoff.HandoffID } : null;
  }
  if (lockSource) {
    await c.query(`SELECT s."StudentID" FROM "Students" s JOIN "Users" u USING("UserID")
      WHERE s."StudentID"=$1 FOR UPDATE OF s FOR SHARE OF u`, [studentId]);
    await c.query('SELECT "StudentID" FROM "StudentOJTCalculatedResults" WHERE "StudentID"=$1 FOR SHARE', [studentId]);
  }
  const row = (await c.query(`SELECT s."ProgramID",s."DeletedAt",s."Status",u."Status" AS "AccountStatus",
    tp."Status" AS "ProgramStatus",${calculatedEligibilitySql()} AS result
    FROM "Students" s JOIN "Users" u USING("UserID")
    LEFT JOIN "TrainingPrograms" tp ON tp."ProgramID"=s."ProgramID" WHERE s."StudentID"=$1`, [studentId])).rows[0];
  const saved = row?.result;
  const isStale = !saved || saved.isStale || saved.batchId !== handoff.CalculatedBatchID
    || row.DeletedAt !== null || row.Status !== 'ACTIVE' || row.AccountStatus !== 'ACTIVE'
    || row.ProgramStatus !== 'PUBLISHED';
  return {
    studentId, ojtSemesterId: semesterId, programId: row?.ProgramID ?? null,
    source: 'FRONTEND_HANDOFF', handoffId: handoff.HandoffID, handedOffAt: handoff.CreatedAt,
    batchId: handoff.CalculatedBatchID, checkId: null,
    status: saved?.status ?? 'REVIEW_REQUIRED', isStale: Boolean(isStale),
    earnedCredits: saved?.earnedCredits ?? null,
    missingCredits: saved?.earnedCredits == null ? null : Math.max(0, 70 - saved.earnedCredits),
    unpassedCourseCount: saved?.unpassedCourseCount ?? 0,
    reasons: saved?.reasons ?? [], academicIssues: saved?.academicIssues ?? [],
    checkedAt: saved?.checkedAt ?? null, rule: { minCredits: 70, maxUnpassedCourses: 2 },
  };
}

export async function requireAdmissionEligibility(c: PoolClient, studentId: number, semesterId: number) {
  const result = await admissionEligibilityWithClient(c, studentId, semesterId, true);
  if (!result) throw invalid('Academic handoff with valid eligibility is required.', 403, 'ELIGIBLE_HANDOFF_REQUIRED');
  if (result.isStale) throw invalid('Eligibility changed after academic handoff. Contact the academic office for review.', 409, 'ELIGIBILITY_HANDOFF_STALE');
  if (result.status !== 'ELIGIBLE') throw invalid('A current ELIGIBLE result is required.', 409, 'CONFIRMED_ELIGIBILITY_REQUIRED');
  return result;
}
