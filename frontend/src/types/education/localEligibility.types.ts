import type { EligibilityStatus } from './eligibility.types';

export type LocalOjtResult = {
  studentId: number; status: EligibilityStatus; earnedCredits: number | null;
  unpassedCourseCount: number; reasons: string[]; academicIssues: string[]; checkedAt: string;
  savedAt?: string; isStale?: boolean;
  policyVersion?: number;
    conditionId?: number;
    rule?: { id?: number; version: number; minCredits: number; issuingDocument?: string; thresholdId?: number };
};

