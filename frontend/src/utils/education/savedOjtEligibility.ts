import type { EligibilityStatus, OjtAppliedCondition } from '@/types/education/eligibility.types';

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
  source?: 'FRONTEND' | 'BACKEND';
  rule?: OjtAppliedCondition;
}

export function savedOjtLabel(result: SavedOjtEligibility): 'Đủ điều kiện' | 'Chưa đủ điều kiện' | 'Chưa đủ dữ liệu' | 'Cần xét lại' {
  if (result.isStale) return 'Cần xét lại';
  return { ELIGIBLE: 'Đủ điều kiện', NOT_ELIGIBLE: 'Chưa đủ điều kiện', REVIEW_REQUIRED: 'Chưa đủ dữ liệu' }[result.status] as 'Đủ điều kiện' | 'Chưa đủ điều kiện' | 'Chưa đủ dữ liệu';
}

export function savedOjtProgressLabel(result?: SavedOjtEligibility): ReturnType<typeof savedOjtLabel> | 'Chưa có kết quả' {
  return result ? savedOjtLabel(result) : 'Chưa có kết quả';
}
