import type { LocalOjtResult } from '@/types/education/localEligibility.types';

type ReasonResult = Pick<LocalOjtResult, 'status' | 'reasons' | 'academicIssues' | 'isStale'>;
export type OjtDisplayStatus = 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'REVIEW_REQUIRED' | 'PENDING' | 'ERROR' | 'STALE' | 'INACTIVE';

export function educationOjtDisplayStatus(result?: ReasonResult, failure?: string, inactiveReason?: string): OjtDisplayStatus {
  if (failure) return 'ERROR';
  if (result?.isStale && result.status !== 'ELIGIBLE') return 'STALE';
  if (inactiveReason) return 'INACTIVE';
  return result?.status ?? 'PENDING';
}

export function savedOjtDisplayStatus(result?: ReasonResult, inactiveReason?: string): OjtDisplayStatus {
  return result ? educationOjtDisplayStatus(result, undefined, inactiveReason) : 'PENDING';
}

function readableError(message: string): string {
  if (/Bảng điểm chưa tải đầy đủ|Không tải được đầy đủ bảng điểm/.test(message)) return message;
  if (/Không tải đủ dữ liệu để xét/.test(message)) return message;
  if (/[À-ỹ]/.test(message)) return message;
  return 'Không thể tải hoặc xét dữ liệu sinh viên. Vui lòng thử lại.';
}

export function educationOjtReason(result?: ReasonResult, failure?: string, inactiveReason?: string, hasPassedOjt202 = false): string {
  let message: string;
  if (failure) message = readableError(failure);
  else if (result?.isStale) message = 'Dữ liệu học tập đã thay đổi sau lần xét gần nhất.';
  else if (inactiveReason) message = inactiveReason;
  else if (!result) message = 'Chưa thực hiện xét điều kiện OJT.';
  else {
    const details = result.status === 'REVIEW_REQUIRED'
      ? [...(result.academicIssues ?? []), ...(result.reasons ?? [])].filter(Boolean)
      : [...(result.reasons ?? []), ...(result.academicIssues ?? [])].filter(Boolean);
    if (details.length) message = details.join(' ');
    else if (result.status === 'ELIGIBLE') message = 'Đáp ứng yêu cầu xét OJT.';
    else if (result.status === 'REVIEW_REQUIRED') message = 'Dữ liệu học tập chưa đầy đủ để kết luận điều kiện OJT.';
    else message = 'Chưa đủ điều kiện OJT; kết quả xét chưa có lý do chi tiết.';
  }

  if (hasPassedOjt202 && !/đã đạt môn OJT202/i.test(message)) {
    return `${message} Đã đạt môn OJT202 nên không còn thuộc danh sách cần xét đợt OJT.`;
  }
  return message;
}
