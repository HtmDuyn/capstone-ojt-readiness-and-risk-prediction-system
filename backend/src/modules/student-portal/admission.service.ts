import { recruitmentRosterSql } from '../eligibility/recruitment-roster.repository';
import type { PoolClient } from 'pg';
import { calculatedEligibilitySql, latestOjt202PassedSql } from '../eligibility/frontend-results.service';
import { officialEligibilityWithClient } from '../eligibility/eligibility.service';
import { invalid } from '../students/student.validation';
import type { Row } from './shared';

async function currentOpenRound(client: PoolClient, semesterId: number) {
  return (await client.query(`SELECT w."WindowID"
    FROM "RecruitmentWindows" w JOIN "OJTSemesters" term USING ("OJTSemesterID")
    WHERE w."OJTSemesterID"=$1 AND term."Status" NOT IN ('CLOSED','ARCHIVED')
      AND w."Status"='OPEN' AND w."ResultsFinalizedAt" IS NULL
      AND COALESCE(w."ApplicationStartsAt",w."StartsAt")<=clock_timestamp()
      AND w."EndsAt">clock_timestamp()
      AND COALESCE(w."ApplicationEndsAt",w."EndsAt")>clock_timestamp()
    ORDER BY COALESCE(w."ApplicationStartsAt",w."StartsAt"),w."WindowID" LIMIT 1`, [semesterId])).rows[0]?.WindowID as number | undefined;
}

// Use the live recruitment roster first, then check historical eligibility records.
export async function studentAdmission(client: PoolClient, studentId: number, semesterId: number,
  options: { lockSource?: boolean; official?: Row | null } = {}) {
  // Match QHDN's roster rule: only the latest OJT202 attempt determines whether
  // a student has already passed, regardless of older attempts.
  if ((await client.query(`SELECT ${latestOjt202PassedSql('s')} AS passed
    FROM "Students" s WHERE s."StudentID"=$1 AND s."DeletedAt" IS NULL`, [studentId])).rows[0]?.passed) return null;

  const direct = (await client.query(`SELECT ${calculatedEligibilitySql('s')} AS result, roster."BatchID", roster."RoundID"
    FROM (${recruitmentRosterSql}) roster JOIN "Students" s USING ("StudentID")
    WHERE roster."StudentID"=$1 AND roster."OJTSemesterID"=$2`, [studentId, semesterId])).rows[0];
  if (direct) {
    const { result } = direct;
    if (result?.status !== 'ELIGIBLE' || result?.isStale) return null;
    const roundId = direct.RoundID ?? await currentOpenRound(client, semesterId) ?? null;
    return {
      studentId, status: 'ELIGIBLE', isStale: false,
      earnedCredits: result.earnedCredits ?? null, missingCredits: 0,
      unpassedCourseCount: result.unpassedCourseCount ?? null,
      reasons: result.reasons ?? [], academicIssues: result.academicIssues ?? [],
      source: 'SAVED_ELIGIBILITY', handoffId: null, batchId: direct.BatchID,
      roundId, checkId: null,
      appliedCondition: result.rule?.conditionId ? { id: result.rule.conditionId, version: result.rule.version, minCredits: result.rule.minCredits, issuingDocument: result.rule.issuingDocument ?? '' } : null,
    };
  }

  // Students with a current calculated ELIGIBLE result must be able to see an
  // open campaign even before QHDN has created a roster/handoff for them.
  const calculated = (await client.query(`SELECT ${calculatedEligibilitySql('s')} AS result
    FROM "Students" s JOIN "Users" u ON u."UserID"=s."UserID"
    WHERE s."StudentID"=$1 AND s."DeletedAt" IS NULL
      AND s."Status"='ACTIVE' AND u."Status"='ACTIVE'`, [studentId])).rows[0]?.result;
  if (calculated?.status === 'ELIGIBLE' && calculated?.isStale === false) {
    const roundId = await currentOpenRound(client, semesterId) ?? null;
    return {
      studentId, status: 'ELIGIBLE', isStale: false,
      earnedCredits: calculated.earnedCredits ?? null, missingCredits: calculated.missingCredits ?? 0,
      unpassedCourseCount: calculated.unpassedCourseCount ?? null,
      reasons: calculated.reasons ?? [], academicIssues: calculated.academicIssues ?? [],
      source: roundId ? 'SAVED_ELIGIBILITY' : 'CALCULATED_ELIGIBILITY',
      handoffId: null, batchId: calculated.batchId,
      roundId, checkId: null,
      appliedCondition: calculated.rule?.conditionId ? { id: calculated.rule.conditionId, version: calculated.rule.version, minCredits: calculated.rule.minCredits, issuingDocument: calculated.rule.issuingDocument ?? '' } : null,
    };
  }
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
