import type { LocalOjtResult } from '@/types/education/localEligibility.types';
import type { CurrentOjtRule } from '@/services/educationService';

export function localOjtSavePayload(results: LocalOjtResult[], idempotencyKey: string, rule: CurrentOjtRule) {
  return {
    idempotencyKey,
    source: 'FRONTEND' as const,
    rule: { conditionId: rule.id, version: rule.version, minCredits: rule.minCredits, issuingDocument: rule.issuingDocument },
    results: [...results].sort((a, b) => a.studentId - b.studentId)
      .map(({ studentId, status, earnedCredits, unpassedCourseCount, reasons, academicIssues, checkedAt }) =>
        ({ studentId, status, earnedCredits, unpassedCourseCount, reasons, academicIssues, checkedAt })),
  };
}
