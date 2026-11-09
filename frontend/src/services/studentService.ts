import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

import { downloadFile } from '@/utils/downloadFile';
import type { StudentCurrentUserResponse } from '@/types/student/portal';
import type {
  AcademicSummary,
  Application,
  Assignment,
  CourseResult,
  Curriculum,
  Dashboard,
  Internships,
  OjtResult,
  Opportunities,
  Page,
  Profile,
  Registration,
  Roadmap,
  Supplementary,
  Task,
  TaskSubmission,
  Window,
  CV,
} from '@/types/student/portal';

export { API_BASE_URL };

// Keep the student's transport independent of the shared API and legacy Axios
// declarations used by the other roles. Axios normalizes headers at runtime.
type HeaderValue = string | number | boolean | null | undefined;
interface StudentHeaders {
  has(name: string): boolean;
  set(name: string, value: HeaderValue): void;
  delete(name: string): void;
}
interface StudentRequestConfig {
  method?: string;
  data?: unknown;
  params?: Record<string, unknown>;
  headers?: Record<string, HeaderValue>;
  signal?: AbortSignal;
  timeout?: number;
}
interface ErrorBody { success?: boolean; message?: string; errorCode?: string; code?: string }
interface HttpError { code?: string; response?: { status: number; data?: ErrorBody } }

export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly code?: string) {
    super(message); this.name = 'ApiError';
  }
}

export const API = axios.create({
  baseURL: API_BASE_URL,
  adapter: 'xhr',
  timeout: 60_000,
  headers: { Accept: 'application/json' },
});

API.interceptors.request.use(config => {
  const headers = config.headers as unknown as StudentHeaders;
  const token = localStorage.getItem('ojt_auth_token');
  if (config.url !== '/auth/login' && token && !headers.has('Authorization')) headers.set('Authorization', 'Bearer ' + token);
  if (config.data instanceof FormData) headers.delete('Content-Type');
  return config;
});

export function isRequestCanceled(error: unknown): boolean {
  return axios.isCancel(error) || (error instanceof DOMException && error.name === 'AbortError');
}

export async function apiRequest<T>(path: string, options: StudentRequestConfig = {}, token?: string | null): Promise<T> {
  const headers = { ...options.headers };
  if (token !== undefined) headers.Authorization = token ? 'Bearer ' + token : false;
  try {
    const response = await API.request({ ...options, url: path, headers, responseType: 'json' }) as { data: T; status: number };
    const body = response.data;
    if (!body || typeof body !== 'object') throw new ApiError('API không trả JSON. Kiểm tra cấu hình địa chỉ backend.', response.status, 'INVALID_API_RESPONSE');
    const result = body as ErrorBody;
    if (result.success === false) throw new ApiError(result.message || 'Yêu cầu API thất bại.', response.status, result.errorCode ?? result.code);
    return body;
  } catch (error) {
    if (isRequestCanceled(error) || error instanceof ApiError) throw error;
    if (!axios.isAxiosError(error)) throw error;
    const failure = error as HttpError;
    if (!failure.response) throw new ApiError(
      ['ECONNABORTED', 'ETIMEDOUT'].includes(failure.code ?? '') ? 'Yêu cầu API hết thời gian chờ. Vui lòng thử lại.' : 'Không kết nối được backend. Kiểm tra máy chủ API và VITE_API_URL.',
      0, failure.code,
    );
    const { status, data } = failure.response;
    throw new ApiError(data?.message || `Yêu cầu API thất bại (HTTP ${status}).`, status, data?.errorCode ?? data?.code);
  }
}

export const studentQuery = (
  values: Record<string, string | number | boolean | undefined | null>,
) => {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null) params.set(key, String(value));
  });
  return params.size ? '?' + params.toString() : '';
};
export async function studentGet<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await apiRequest<{ data: T }>(path, { signal });
  if (!Object.prototype.hasOwnProperty.call(response, 'data'))
    throw new ApiError('API chưa trả dữ liệu theo hợp đồng. Vui lòng kiểm tra backend.', 502, 'STUDENT_API_CONTRACT_MISMATCH');
  return response.data;
}
export async function studentPost<T>(path: string, body: unknown): Promise<T> {
  return (
    await apiRequest<{ data: T }>(path, {
      method: 'POST',
      data: body,
    })
  ).data;
}
export async function allStudentPages<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; ; page++) {
    const result = await studentGet<Page<T>>(
      path + (path.includes('?') ? '&' : '?') + new URLSearchParams({ page: String(page), limit: '100' }),
      signal,
    );
    items.push(...result.items);
    if (items.length >= result.total) return items;
    if (!result.items.length)
      throw new ApiError('API chưa trả đủ danh sách. Vui lòng tải lại.', 502, 'STUDENT_API_CONTRACT_MISMATCH');
  }
}
export async function getOwnStudent(
  signal?: AbortSignal,
  expectedUser?: { id: string; email: string },
): Promise<Profile> {
  const { user } = await apiRequest<StudentCurrentUserResponse>(
    '/auth/me',
    { signal },
  );
  if (user.roleCode !== 'STUDENT' || (expectedUser && (
    String(user.id) !== expectedUser.id ||
    user.email.toLowerCase() !== expectedUser.email.toLowerCase()
  ))) {
    throw new ApiError('Phiên đăng nhập đã thay đổi. Vui lòng đăng nhập lại.', 401, 'SESSION_IDENTITY_CHANGED');
  }
  if (user.mustChangePassword)
    throw new ApiError('Bạn cần đổi mật khẩu tạm trước khi sử dụng cổng sinh viên.', 403, 'PASSWORD_CHANGE_REQUIRED');
  let studentId = user.studentId;
  if (studentId === null)
    throw new ApiError('Tài khoản chưa được liên kết với hồ sơ sinh viên. Liên hệ Phòng Đào tạo để kiểm tra liên kết tài khoản.', 409, 'STUDENT_NOT_LINKED');
  // Older deployed /auth/me responses omit studentId. This authenticated
  // endpoint resolves the owner on the server even before an assignment exists.
  if (studentId === undefined) {
    const own = await studentGet<Pick<Internships, 'studentId'>>('/students/me/internships', signal);
    studentId = own.studentId;
  }
  if (!Number.isSafeInteger(studentId) || studentId <= 0)
    throw new ApiError('Máy chủ chưa xác định được hồ sơ sinh viên của tài khoản. Liên hệ Phòng Đào tạo để kiểm tra liên kết.', 502, 'STUDENT_API_CONTRACT_MISMATCH');
  const profile = await getStudentProfile(studentId, signal);
  if (profile.id !== studentId || profile.userId !== user.id)
    throw new ApiError('Phiên đăng nhập đã thay đổi. Vui lòng đăng nhập lại.', 401, 'SESSION_IDENTITY_CHANGED');
  return profile;
}
export const getStudentProfile = (id: number, signal?: AbortSignal) =>
  studentGet<Profile>(
    `/students/${id}` +
      studentQuery({ include: 'academicProgress,ojtRegistrations' }),
    signal,
  );
export const getStudentDashboard = (semester: number, signal?: AbortSignal) =>
  studentGet<Dashboard>(
    '/students/me/dashboard' + studentQuery({ ojtSemesterId: semester }),
    signal,
  );
export async function getAcademicSummary(
  semester: number,
  signal?: AbortSignal,
) {
  return (await getStudentDashboard(semester, signal)).academic;
}
export async function getSupplementary(
  semester: number,
  signal?: AbortSignal,
) {
  return (await getStudentDashboard(semester, signal)).academic
    .supplementaryCourses;
}
export async function getCurriculum(id: number, signal?: AbortSignal) {
  const response = await studentGet<{ curriculum: Curriculum | null }>(
    `/students/${id}` + studentQuery({ include: 'curriculum' }),
    signal,
  );
  return response.curriculum;
}
export const getRoadmap = (semester: number, signal?: AbortSignal) =>
  studentGet<Roadmap>(
    '/students/me/roadmap-recommendations' +
      studentQuery({ ojtSemesterId: semester }),
    signal,
  ).catch(error => {
    if (error instanceof ApiError && error.code === 'AI_NOT_CONFIGURED')
      throw new ApiError('Tư vấn AI chưa được cấu hình. Bạn vẫn có thể xem đối chiếu điều kiện OJT và các môn cần bổ sung.', error.status, error.code);
    throw error;
  });
export const getCourseResults = (
  id: number,
  page: number,
  signal?: AbortSignal,
) =>
  studentGet<{ courseResults: Page<CourseResult> }>(
    `/students/${id}` +
      studentQuery({
        include: 'courseResults',
        resultsPage: page,
        resultsLimit: 20,
      }),
    signal,
  ).then((profile) => profile.courseResults);
// Load every server page before filtering and paginating the transcript locally.
// A semester filter must include matching courses beyond the current API page.
export async function getAllCourseResults(id: number, signal?: AbortSignal) {
  const items: CourseResult[] = [];
  for (let page = 1; ; page++) {
    const { courseResults } = await studentGet<{ courseResults: Page<CourseResult> }>(
      `/students/${id}` + studentQuery({ include: 'courseResults', resultsPage: page, resultsLimit: 100 }), signal,
    );
    items.push(...courseResults.items);
    if (items.length >= courseResults.total) return items;
    if (!courseResults.items.length)
      throw new ApiError('API chưa trả đủ bảng điểm. Vui lòng tải lại.', 502, 'STUDENT_API_CONTRACT_MISMATCH');
  }
}
export const getRegistrationWindows = (
  semester: number,
  page: number,
  signal?: AbortSignal,
) =>
  studentGet<Page<Window>>(
    '/ojt-registration-windows' +
      studentQuery({ ojtSemesterId: semester, page, limit: 20 }),
    signal,
  );
export const getRegistrations = (
  semester: number,
  page: number,
  signal?: AbortSignal,
) =>
  studentGet<Page<Registration>>(
    '/ojt-registrations' +
      studentQuery({ ojtSemesterId: semester, page, limit: 20 }),
    signal,
  );
export const getOpportunities = (
  windowId: number,
  page: number,
  signal?: AbortSignal,
) =>
  studentGet<Opportunities>(
    '/students/me/opportunities' +
      studentQuery({ windowId, page, limit: 20 }),
    signal,
  );
export const getApplications = (
  semester: number,
  page: number,
  signal?: AbortSignal,
) =>
  studentGet<Page<Application>>(
    '/job-applications' +
      studentQuery({ ojtSemesterId: semester, page, limit: 20 }),
    signal,
  );
export const getAssignment = (semester: number, signal?: AbortSignal) =>
  studentGet<Internships>(
    '/students/me/internships' + studentQuery({ ojtSemesterId: semester }),
    signal,
  ).then((result) => result.assignment);
export const getTasks = (
  semester: number,
  page: number,
  signal?: AbortSignal,
) =>
  studentGet<Internships>(
    '/students/me/internships' +
      studentQuery({
        ojtSemesterId: semester,
        tasksPage: page,
        tasksLimit: 20,
      }),
    signal,
  ).then((result) => result.tasks);
export const getAssignedTasks = (semester: number, page: number, signal?: AbortSignal) =>
  getTasks(semester, page, signal);
export const getTaskSubmissions = (taskId: number, page: number, signal?: AbortSignal) =>
  studentGet<Page<TaskSubmission>>(`/students/me/tasks/${taskId}/submissions` + studentQuery({ page, limit: 20 }), signal);
export const submitAssignedTask = (taskId: number, content: string) =>
  studentPost<TaskSubmission & { replayed: boolean }>(`/students/me/tasks/${taskId}/submissions`, { content });
export const getOjtResults = (
  semester: number,
  page: number,
  signal?: AbortSignal,
) =>
  studentGet<Internships>(
    '/students/me/internships' +
      studentQuery({
        ojtSemesterId: semester,
        resultsPage: page,
        resultsLimit: 20,
      }),
    signal,
  ).then((result) => result.results);
export const getOjtResult = (
  id: number,
  semester: number,
  signal?: AbortSignal,
) =>
  studentGet<Internships>(
    '/students/me/internships' +
      studentQuery({ ojtSemesterId: semester, resultId: id }),
    signal,
  ).then((result) => result.result);
export const submitOjtRegistration = (
  windowId: number,
  application: { contactPhone: string; contactEmail: string; note: string },
) => studentPost<Registration>('/ojt-registrations', { windowId, application });
export const applyForPosition = (
  registrationId: number,
  postId: number,
  positionId: number,
  coverLetter: string,
) =>
  studentPost<Application>('/job-applications', {
    registrationId,
    postId,
    positionId,
    coverLetter,
  });
export async function uploadStudentCv(file: File) {
  if (!/\.pdf$/i.test(file.name) || file.size > 10 * 1024 * 1024 || !file.size)
    throw new Error('Chọn file PDF có dung lượng tối đa 10 MB.');
  const body = new FormData();
  body.append('cv', file);
  return (
    await apiRequest<{ data: CV }>('/students/me/cv', { method: 'POST', data: body })
  ).data;
}
export type StudentCertificate={name:string;url:string};
export async function downloadStudentCv(studentId: number, cv: CV) {
  await downloadFile(async () => (
    await API.get<Blob>(`/students/${studentId}/cv`, {
      params: { cvFileId: cv.id },
      responseType: 'blob',
    })
  ).data, cv.fileName);
}

export interface StudentNotification {
  id: number;
  title: string;
  content: string | null;
  sentAt: string | null;
  isRead: boolean | null;
}
export interface StudentNotificationPage {
  items: StudentNotification[];
  total: number;
  page: number;
  limit: number;
  unreadCount: number;
}
export async function getStudentNotifications(
  page = 1,
  signal?: AbortSignal,
  unread?: boolean,
) {
  const response = await apiRequest<{ data: StudentNotificationPage }>(
    '/students/me/notifications' + studentQuery({ page, limit: 20, unread }),
    { signal },
  );
  return response.data;
}
export async function markStudentNotificationRead(id: string) {
  return apiRequest<{
    data: StudentNotification & { unreadCount: number };
  }>(
    `/students/me/notifications/${encodeURIComponent(id)}`,
    { method: 'PATCH', data: { isRead: true } },
  );
}
