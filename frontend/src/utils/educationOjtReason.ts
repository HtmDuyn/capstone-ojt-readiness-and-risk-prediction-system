import type { LocalOjtResult } from '@/types/education/localEligibility.types';

type ReasonResult = Pick<LocalOjtResult, 'status' | 'reasons' | 'academicIssues' | 'isStale'>;
export type OjtDisplayStatus = 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'REVIEW_REQUIRED' | 'PENDING' | 'ERROR' | 'STALE' | 'INACTIVE';

export function educationOjtDisplayStatus(result?: ReasonResult, failure?: string, inactiveReason?: string): OjtDisplayStatus {
  if (failure) return 'ERROR';
  if (result?.isStale) return 'STALE';
  if (inactiveReason) return 'INACTIVE';
  return result?.status ?? 'PENDING';
}

function readableError(message: string): string {
  if (/Bảng điểm chưa tải đầy đủ|Không tải được đầy đủ bảng điểm/.test(message)) return message;
  if (/Không tải đủ dữ liệu để xét/.test(message)) return message;
  if (/[À-ỹ]/.test(message)) return message;
  return 'Không thể tải hoặc xét dữ liệu sinh viên. Vui lòng thử lại.';
}

export function educationOjtReason(result?: ReasonResult, failure?: string, inactiveReason?: string): string {
  if (failure) return readableError(failure);
  if (result?.isStale) return 'Dữ liệu học tập đã thay đổi sau lần xét gần nhất.';
  if (inactiveReason) return inactiveReason;
  if (!result) return 'Chưa thực hiện xét điều kiện OJT.';

  const details = result.status === 'REVIEW_REQUIRED'
    ? [...(result.academicIssues ?? []), ...(result.reasons ?? [])].filter(Boolean)
    : [...(result.reasons ?? []), ...(result.academicIssues ?? [])].filter(Boolean);
  if (details.length) return details.join(' ');
  if (result.status === 'ELIGIBLE') return 'Đáp ứng yêu cầu xét OJT.';
  if (result.status === 'REVIEW_REQUIRED') return 'Cần đối soát dữ liệu học tập trước khi kết luận.';
  return 'Chưa đủ điều kiện OJT; kết quả xét chưa có lý do chi tiết.';
}
