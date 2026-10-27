import type { EligibilityStatus } from '@/types/education/eligibility.types';

export interface SavedOjtEligibility {
  studentId?: number;
  status: EligibilityStatus;
  earnedCredits: number | null;
  unpassedCourseCount: number;
  reasons?: string[];
  academicIssues?: string[];
  checkedAt: string;
  savedAt: string;
  savedBy?: number;
  batchId?: number;
  isStale: boolean;
  source?: 'FRONTEND';
}

export function savedOjtLabel(result: SavedOjtEligibility): 'Đủ điều kiện' | 'Chưa đủ điều kiện' | 'Cần đối soát' | 'Cần xét lại' {
  if (result.isStale) return 'Cần xét lại';
  return { ELIGIBLE: 'Đủ điều kiện', NOT_ELIGIBLE: 'Chưa đủ điều kiện', REVIEW_REQUIRED: 'Cần đối soát' }[result.status] as 'Đủ điều kiện' | 'Chưa đủ điều kiện' | 'Cần đối soát';
}
