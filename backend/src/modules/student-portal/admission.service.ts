import type { PoolClient } from 'pg';
import { calculatedEligibilitySql } from '../eligibility/frontend-results.service';
import { officialEligibilityWithClient } from '../eligibility/eligibility.service';
import { invalid } from '../students/student.validation';
import type { Row } from './shared';

// Student admission follows the same handoff sources already accepted by QHDN.
// Never manufacture an official check for a saved-calculation handoff.
export async function studentAdmission(client: PoolClient, studentId: number, semesterId: number,
  options: { lockSource?: boolean; official?: Row | null } = {}) {
  const handoff = (await client.query(`SELECT i."HandoffID",i."CheckID",i."CalculatedBatchID",i."Snapshot",h."CreatedAt"
    FROM "EligibleStudentHandoffItems" i JOIN "EligibleStudentHandoffs" h ON h."HandoffID"=i."HandoffID"
    WHERE i."StudentID"=$1 AND i."OJTSemesterID"=$2 ORDER BY i."HandoffID" DESC LIMIT 1`, [studentId, semesterId])).rows[0];
  if (!handoff) return null;
  let result: Row | null;
  let isStale: boolean;
  const saved = handoff.CalculatedBatchID != null;
  if (saved) {
    result = (await client.query(`SELECT ${calculatedEligibilitySql()} AS result FROM "Students" s
      WHERE s."StudentID"=$1 AND s."DeletedAt" IS NULL`, [studentId])).rows[0]?.result ?? null;
    isStale = !result || result.batchId !== handoff.CalculatedBatchID || result.isStale === true;
    if (isStale) result = handoff.Snapshot?.calculatedEligibility ?? result;
  } else {
    result = options.official !== undefined ? options.official : await officialEligibilityWithClient(client, studentId, semesterId,
      { lockSource: options.lockSource ?? false });
    isStale = !result || result.isStale === true;
  }
  return {
    studentId, status: result?.status ?? 'REVIEW_REQUIRED', isStale,
    earnedCredits: result?.earnedCredits ?? null,
    missingCredits: result?.missingCredits ?? (result?.earnedCredits == null ? null : Math.max(0, 70 - result.earnedCredits)),
    unpassedCourseCount: result?.unpassedCourseCount ?? null,
    reasons: result?.reasons ?? [], academicIssues: result?.academicIssues ?? [],
    source: saved ? 'FRONTEND_HANDOFF' : 'OFFICIAL_CHECK', handoffId: handoff.HandoffID,
    batchId: saved ? handoff.CalculatedBatchID : undefined, handedOffAt: handoff.CreatedAt,
    checkId: saved ? null : result?.checkId ?? null,
  };
}

export async function requireStudentAdmission(client: PoolClient, studentId: number, semesterId: number) {
  const result = await studentAdmission(client, studentId, semesterId, { lockSource: true });
  if (!result) throw invalid('Academic handoff required.', 403, 'ELIGIBLE_HANDOFF_REQUIRED');
  if (result.isStale || result.status !== 'ELIGIBLE') throw invalid('A current eligible academic handoff is required.', 409,
    result.isStale ? 'ELIGIBILITY_HANDOFF_STALE' : 'CONFIRMED_ELIGIBILITY_REQUIRED');
  return result;
}
