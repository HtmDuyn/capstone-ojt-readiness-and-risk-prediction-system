import axios, { type AxiosError } from 'axios';
import type { RecruitmentPost, RecruitmentWindow } from '@/services/enterpriseService';

export const recruitmentStatusLabels: Record<RecruitmentPost['status'], string> = {
  DRAFT: 'Bản nháp', PENDING_REVIEW: 'Chờ QHDN duyệt', PUBLISHED: 'Đang tuyển',
  REJECTED: 'Cần chỉnh sửa', CLOSED: 'Đã đóng', ARCHIVED: 'Đã lưu trữ',
};

export const formatRecruitmentDate = (value?: string | null) => value
  ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : 'Chưa có thời hạn';

export function windowAcceptsPosts(window?: RecruitmentWindow, now = Date.now()) {
  return !!window && window.accepting && window.status === 'OPEN'
    && new Date(window.startsAt).getTime() <= now && new Date(window.endsAt).getTime() > now;
}

export function canEditRecruitmentPost(post: RecruitmentPost, windows: RecruitmentWindow[], now = Date.now()) {
  return ['DRAFT', 'PENDING_REVIEW', 'REJECTED'].includes(post.status)
    && windowAcceptsPosts(windows.find(window => window.id === post.windowId), now);
}

export function toLocalDateTime(value: string) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function recruitmentError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const apiError = error as AxiosError<{ errorCode?: string; message?: string }>;
    const body = apiError.response?.data;
    const messages: Record<string, string> = {
      RECRUITMENT_WINDOW_CLOSED: 'Đợt đăng tin đã đóng hoặc hết hạn. Nội dung của bạn vẫn được giữ trong biểu mẫu.',
      RECRUITMENT_POST_LOCKED: 'Tin đã được công bố hoặc không còn cho phép chỉnh sửa. Vui lòng tải lại danh sách.',
      CAPACITY_BELOW_ACCEPTED: 'Chỉ tiêu không được thấp hơn số sinh viên đã được nhận.',
      RECRUITMENT_PERIOD_UNAVAILABLE: 'Học kỳ của đợt đăng tin không còn khả dụng.',
      RECRUITMENT_POST_NOT_FOUND: 'Không tìm thấy tin tuyển dụng thuộc doanh nghiệp của bạn.',
    };
    if (body?.errorCode && messages[body.errorCode]) return messages[body.errorCode];
    if (body?.message?.includes('within the academic semester')) return 'Hạn nhận hồ sơ phải sau hạn đăng tin và nằm trong học kỳ của đợt tuyển dụng.';
    if (body?.message) return body.message;
    if (!apiError.response) return 'Không kết nối được máy chủ. Vui lòng kiểm tra kết nối và thử lại.';
  }
  return error instanceof Error ? error.message : 'Không thể xử lý yêu cầu. Vui lòng thử lại.';
}
