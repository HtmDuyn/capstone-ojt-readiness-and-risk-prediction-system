import type { PoolClient } from 'pg';
import { calculatedEligibilitySql } from '../eligibility/frontend-results.service';
import { officialEligibilityWithClient } from '../eligibility/eligibility.service';
import { invalid } from '../students/student.validation';
import type { Row } from './shared';

// Use the live recruitment roster first, then check historical eligibility records.
export async function studentAdmission(client: PoolClient, studentId: number, semesterId: number,
  options: { lockSource?: boolean; official?: Row | null } = {}) {
  const direct = (await client.query(`SELECT saved."Result" AS result, roster."BatchID", roster."RoundID"
    FROM "OJTRecruitmentRoster" roster JOIN "StudentOJTCalculatedResults" saved USING ("StudentID")
    WHERE roster."StudentID"=$1 AND roster."OJTSemesterID"=$2`, [studentId, semesterId])).rows[0];
  if (direct) {
    const { result } = direct;
    return {
      studentId, status: 'ELIGIBLE', isStale: false,
      earnedCredits: result.earnedCredits ?? null, missingCredits: 0,
      unpassedCourseCount: result.unpassedCourseCount ?? null,
      reasons: result.reasons ?? [], academicIssues: result.academicIssues ?? [],
      source: 'SAVED_ELIGIBILITY', handoffId: null, batchId: direct.BatchID,
      roundId: direct.RoundID as number | null, checkId: null,
      appliedCondition: result.rule?.conditionId ? { id: result.rule.conditionId, version: result.rule.version, minCredits: result.rule.minCredits, issuingDocument: result.rule.issuingDocument ?? '' } : null,
    };
  }
  const passedOjt202 = (await client.query(`SELECT EXISTS (
    SELECT 1 FROM "StudentCourseResults" grade JOIN "Courses" course USING ("CourseID")
    WHERE grade."StudentID"=$1 AND upper(btrim(course."CourseCode"))='OJT202' AND grade."Status"='PASSED'
  ) AS passed`, [studentId])).rows[0]?.passed;
  if (passedOjt202) return null;
  const handoff = (await client.query(`SELECT i."HandoffID",i."CheckID",i."CalculatedBatchID",i."Snapshot",h."CreatedAt"
    FROM ojt_history."StudentEligibilityItems" i JOIN ojt_history."EligibilityBatches" h ON h."HandoffID"=i."HandoffID"
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
    appliedCondition: saved && result?.rule?.conditionId ? { id: result.rule.conditionId, version: result.rule.version, minCredits: result.rule.minCredits, issuingDocument: result.rule.issuingDocument ?? '' } : null,
  };
}

export async function requireStudentAdmission(client: PoolClient, studentId: number, semesterId: number) {
  const result = await studentAdmission(client, studentId, semesterId, { lockSource: true });
  if (!result) throw invalid('Saved OJT eligibility is required.', 403, 'ELIGIBLE_HANDOFF_REQUIRED');
  if (result.isStale || result.status !== 'ELIGIBLE') throw invalid('A valid OJT eligibility result is required.', 409,
    result.isStale ? 'ELIGIBILITY_HANDOFF_STALE' : 'CONFIRMED_ELIGIBILITY_REQUIRED');
  return result;
}
