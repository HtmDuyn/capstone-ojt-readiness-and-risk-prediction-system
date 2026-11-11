import axios, { type AxiosError } from 'axios';
import { enterpriseService, type PaginatedResponse, type RecruitmentPost, type RecruitmentWindow } from '@/services/enterpriseService';

export const recruitmentStatusLabels: Record<RecruitmentPost['status'], string> = {
  DRAFT: 'Bản nháp', PENDING_REVIEW: 'Tin cũ chưa công bố', PUBLISHED: 'Đang tuyển',
  REJECTED: 'Cần chỉnh sửa', CLOSED: 'Đã đóng', ARCHIVED: 'Đã lưu trữ',
};

const dateFormatter = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' });
export const formatRecruitmentDate = (value?: string | null) => value && Number.isFinite(Date.parse(value))
  ? dateFormatter.format(new Date(value)) : 'Chưa có thời hạn';

export function windowAcceptsPosts(window?: RecruitmentWindow, now = Date.now()) {
  return !!window && window.accepting && window.canCreate !== false && window.status === 'OPEN'
    && new Date(window.postingStartsAt ?? window.startsAt).getTime() <= now
    && new Date(window.postingDeadlineAt ?? window.endsAt).getTime() > now;
}

export function canEditRecruitmentPost(post: RecruitmentPost, windows: RecruitmentWindow[], now = Date.now()) {
  return !postEditLockReason(post, windows, now);
}

export function postEditLockReason(post: RecruitmentPost, windows: RecruitmentWindow[], now = Date.now()) {
  const window = windows.find(item => item.id === post.windowId);
  if (!['DRAFT', 'PENDING_REVIEW', 'REJECTED', 'PUBLISHED'].includes(post.status)) return 'Tin đã đóng hoặc lưu trữ.';
  if (!windowAcceptsPosts(window, now)) return 'Đợt chưa mở hoặc đã hết hạn đăng / sửa tin.';
  if (post.editLockCode === 'RECRUITMENT_EDIT_LOCKED_BY_OJT_REGISTRATION' || window?.editLockCode === 'RECRUITMENT_EDIT_LOCKED_BY_OJT_REGISTRATION') {
    const registration = post.studentRegistrationWindow ?? window?.studentRegistrationWindow;
    return `Tạm khóa chỉnh sửa khi sinh viên đang đăng ký OJT${registration?.endsAt ? `, đến ${formatRecruitmentDate(registration.endsAt)}` : ''}.`;
  }
  if (post.canEdit === false || window?.canEdit === false) return 'Hiện chưa được chỉnh sửa. Tải lại để cập nhật quyền và thời hạn.';
  return '';
}

export const uniqueById = <T extends { id: number }>(items: T[]) => [...new Map(items.map(item => [item.id, item])).values()];

export function recruitmentTotals(posts: RecruitmentPost[]) {
  const positions = uniqueById(posts.flatMap(post => post.positions ?? []));
  return { positions: positions.length, capacity: positions.reduce((sum, p) => sum + p.capacity, 0),
    remaining: positions.reduce((sum, p) => sum + p.remainingSlots, 0) };
}

export async function loadAllPages<T extends { id: number }>(
  fetchPage: (page: number) => Promise<PaginatedResponse<T>>,
  signal: AbortSignal,
  dataLabel = 'dữ liệu tuyển dụng',
) {
  if (signal.aborted) throw new DOMException('Đã hủy tải dữ liệu.', 'AbortError');
  const first = await fetchPage(1);
  if (!first.success || !first.data || first.data.limit <= 0) throw new Error(`Không thể tải ${dataLabel}.`);
  const items = [...first.data.items];
  for (let page = 2; page <= Math.ceil(first.data.total / first.data.limit); page++) {
    if (signal.aborted) throw new DOMException('Đã hủy tải dữ liệu.', 'AbortError');
    const next = await fetchPage(page);
    if (!next.success || !next.data) throw new Error(`Không thể tải đầy đủ ${dataLabel}.`);
    items.push(...next.data.items);
  }
  return uniqueById(items);
}

export async function loadRecruitmentData(signal: AbortSignal) {
  const [posts, windows] = await Promise.all([
    loadAllPages(page => enterpriseService.listRecruitmentPosts({ page, limit: 100 }, signal), signal),
    loadAllPages(page => enterpriseService.listRecruitmentWindows({ page, limit: 100 }, signal), signal),
  ]);
  return { posts, windows };
}

export function recruitmentError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const apiError = error as AxiosError<{ errorCode?: string; message?: string }>;
    const body = apiError.response?.data;
    const messages: Record<string, string> = {
      RECRUITMENT_WINDOW_CLOSED: 'Đợt đăng tin đã đóng hoặc hết hạn. Nội dung của bạn vẫn được giữ trong biểu mẫu.',
      RECRUITMENT_POST_LOCKED: 'Tin đã đóng hoặc lưu trữ nên không còn cho phép chỉnh sửa. Vui lòng tải lại danh sách.',
      CAPACITY_BELOW_ACCEPTED: 'Chỉ tiêu không được thấp hơn số sinh viên đã được nhận.',
      RECRUITMENT_PERIOD_UNAVAILABLE: 'Học kỳ của đợt đăng tin không còn khả dụng.',
      RECRUITMENT_POST_NOT_FOUND: 'Không tìm thấy tin tuyển dụng thuộc doanh nghiệp của bạn.',
      RECRUITMENT_EDIT_LOCKED_BY_OJT_REGISTRATION: 'Sinh viên đang đăng ký OJT nên tạm khóa chỉnh sửa tin. Nội dung bạn nhập vẫn được giữ lại.',
      IDEMPOTENCY_CONFLICT: 'Yêu cầu tạo tin này đã được xử lý với nội dung khác. Hãy tải lại danh sách để kiểm tra trước khi tạo thêm.',
      POSITION_SHARED: 'Vị trí đang được dùng trong tin khác nên chưa thể chỉnh sửa.',
      POSITION_ARCHIVED: 'Tin có vị trí đã lưu trữ hoặc xóa, không thể công bố.',
    };
    if (body?.errorCode && messages[body.errorCode]) return messages[body.errorCode];
    if (body?.message?.includes('within the academic semester')) return 'Thời hạn do QHDN thiết lập đang không thỏa điều kiện cập nhật của hệ thống. Vui lòng nhờ QHDN kiểm tra lại thời hạn; nội dung bạn nhập vẫn được giữ, chưa được lưu.';
    if (body?.message) return body.message;
    if (!apiError.response) return 'Không kết nối được máy chủ. Vui lòng kiểm tra kết nối và thử lại.';
  }
  return error instanceof Error ? error.message : 'Không thể xử lý yêu cầu. Vui lòng thử lại.';
}
