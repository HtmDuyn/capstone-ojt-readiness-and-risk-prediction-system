import type { LocalOjtResult } from '@/types/education/localEligibility.types';
import type { LocalOjtRule } from '@/utils/localOjtEligibility';

export function localOjtSavePayload(results: LocalOjtResult[], idempotencyKey: string, rule: LocalOjtRule) {
  return {
    idempotencyKey,
    source: 'FRONTEND' as const,
    rule: { version: rule.version, minCredits: rule.minCredits, maxUnpassedCourses: rule.maxUnpassedCourses },
    results: [...results].sort((a, b) => a.studentId - b.studentId)
      .map(({ studentId, status, earnedCredits, unpassedCourseCount, reasons, academicIssues, checkedAt }) =>
        ({ studentId, status, earnedCredits, unpassedCourseCount, reasons, academicIssues, checkedAt })),
  };
}
