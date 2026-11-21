import axios, { type AxiosError } from 'axios';
import { enterpriseService, type PaginatedResponse, type RecruitmentPost, type RecruitmentWindow } from '../../services/enterpriseService';
import { loadAllPages as loadPages } from '../shared/loadAllPages';

export const recruitmentStatusLabels: Record<RecruitmentPost['status'], string> = {
  DRAFT: 'Bản nháp', PENDING_REVIEW: 'Tin cũ chưa công bố', PUBLISHED: 'Đang tuyển',
  REJECTED: 'Cần chỉnh sửa', CLOSED: 'Hết hạn',
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

export function canPublishRecruitmentPost(post: RecruitmentPost, windows: RecruitmentWindow[], now = Date.now()) {
  return !postPublishLockReason(post, windows, now);
}

export function postPublishLockReason(post: RecruitmentPost, windows: RecruitmentWindow[], now = Date.now()) {
  const editReason = postEditLockReason(post, windows, now);
  if (editReason) return editReason;
  const window = windows.find(item => item.id === post.windowId);
  if (!windowAcceptsPosts(window, now) || window?.studentRegistrationWindow
    || post.studentRegistrationWindow || post.canPublish === false || window?.canEdit === false) {
    return 'Đã hết hạn đăng tin hoặc sinh viên đang đăng ký, xét tuyển. Bạn vẫn có thể chỉnh sửa và lưu tin nháp, nhưng không thể công bố.';
  }
  return '';
}

export function canDeleteRecruitmentPost(post: RecruitmentPost, windows: RecruitmentWindow[], now = Date.now()) {
  return !postDeleteLockReason(post, windows, now);
}

export function postDeleteLockReason(post: RecruitmentPost, windows: RecruitmentWindow[], now = Date.now()) {
  if (post.status === 'DRAFT' && post.canDelete !== false) return '';
  const window = windows.find(item => item.id === post.windowId);
  if (post.status === 'PUBLISHED') {
    if (windowAcceptsPosts(window, now) && window?.canEdit !== false && !post.studentRegistrationWindow
      && !window?.studentRegistrationWindow && post.canDelete !== false) return '';
    return 'Hạn 1 đã kết thúc hoặc sinh viên đang xét tuyển. Không thể xóa tin đã công bố.';
  }
  return 'Không thể xóa tin ở trạng thái hiện tại.';
}

export function postEditLockReason(post: RecruitmentPost, windows: RecruitmentWindow[], _now = Date.now()) {
  const window = windows.find(item => item.id === post.windowId);
  if (post.status === 'PUBLISHED') return 'Chỉ được chỉnh sửa tin nháp. Tin đã công bố chỉ có thể xóa trong Hạn 1.';
  if (post.status !== 'DRAFT') return 'Chỉ tin nháp được chỉnh sửa.';
  if (!window) return 'Không tìm thấy đợt của tin nháp. Vui lòng tải lại danh sách.';
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
  return uniqueById(await loadPages(async page => {
    const response = await fetchPage(page);
    if (!response.success || !response.data || response.data.limit <= 0)
      throw new Error(`Không thể tải đầy đủ ${dataLabel}.`);
    return response.data;
  }, signal));
}

export async function loadRecruitmentOverview(publishedCount: number, signal: AbortSignal) {
  const label = 'danh sách tin tuyển dụng';
  const first = await enterpriseService.listRecruitmentPosts({ page: 1, limit: 100 }, signal);
  if (!first.success || !first.data || first.data.limit <= 0) throw new Error(`Không thể tải ${label}.`);
  const { items, total, limit } = first.data;
  const useStatusFilter = Math.max(1, Math.ceil(publishedCount / limit)) < Math.ceil(total / limit);
  const posts = total <= limit ? items : await loadAllPages(page => {
    if (page === 1 && !useStatusFilter) return Promise.resolve(first);
    return enterpriseService.listRecruitmentPosts({ page, limit, ...(useStatusFilter ? { status: 'PUBLISHED' } : {}) }, signal);
  }, signal, label);
  const now = Date.now();
  return { total, publishedPosts: posts.filter(post => post.status === 'PUBLISHED'
    && (!post.deadlineAt || Date.parse(post.deadlineAt) > now)) };
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
      RECRUITMENT_WINDOW_CLOSED: 'Đã hết hạn đăng tin. Bạn vẫn có thể chỉnh sửa và lưu bản nháp, nhưng không thể công bố.',
      RECRUITMENT_POST_LOCKED: 'Chỉ tin nháp được chỉnh sửa.',
      RECRUITMENT_POST_DELETE_DENIED: 'Chỉ được xóa tin nháp hoặc tin đã công bố còn trong Hạn 1.',
      RECRUITMENT_PHASE_CLOSED: 'Hạn 1 chưa mở hoặc đã kết thúc; sinh viên có thể đang xét tuyển. Bạn vẫn có thể chỉnh sửa và lưu tin nháp, nhưng không thể công bố.',
      CAPACITY_BELOW_ACCEPTED: 'Chỉ tiêu không được thấp hơn số sinh viên đã được nhận.',
      RECRUITMENT_PERIOD_UNAVAILABLE: 'Học kỳ của đợt đăng tin không còn khả dụng.',
      RECRUITMENT_POST_NOT_FOUND: 'Không tìm thấy tin tuyển dụng thuộc doanh nghiệp của bạn.',
      RECRUITMENT_EDIT_LOCKED_BY_OJT_REGISTRATION: 'Sinh viên đang đăng ký hoặc xét tuyển nên không thể công bố tin. Bạn vẫn có thể chỉnh sửa và lưu tin nháp.',
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
