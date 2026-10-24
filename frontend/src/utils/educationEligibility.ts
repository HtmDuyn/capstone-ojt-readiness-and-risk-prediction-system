import type { EligibilityCheck, EligibilityFilter } from '@/types/education/eligibility.types';

export function filterEligibilityResults(items: EligibilityCheck[], status: EligibilityFilter, search: string) {
  const query = search.trim().toLocaleLowerCase('vi-VN');
  return items.filter(item => (status === 'ALL' || item.status === status) &&
    (!query || `${item.studentCode ?? ''} ${item.fullName ?? ''} ${item.studentId}`.toLocaleLowerCase('vi-VN').includes(query)));
}

export const eligibilityStatusLabel = (status: string) => ({
  ELIGIBLE: 'Đủ điều kiện', NOT_ELIGIBLE: 'Không đủ điều kiện', REVIEW_REQUIRED: 'Cần đối soát',
}[status] ?? status);

export const eligibilityReasonLabel = (reason: string) => ({
  OJT_RULE_NOT_PUBLISHED: 'Chưa có điều kiện OJT được áp dụng cho chương trình.',
  ACADEMIC_CREDIT_DATA_INCOMPLETE: 'Dữ liệu tín chỉ hoặc khung chương trình chưa đầy đủ.',
  STUDENT_NOT_ACTIVE: 'Sinh viên hoặc tài khoản không ở trạng thái hoạt động.',
  MIN_CREDITS_NOT_MET: 'Chưa đạt số tín chỉ yêu cầu.',
  MAX_UNPASSED_COURSES_EXCEEDED: 'Vượt số môn còn rớt cho phép.',
}[reason] ?? reason);
