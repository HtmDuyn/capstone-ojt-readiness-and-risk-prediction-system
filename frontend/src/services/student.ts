import { ApiError, apiRequest } from './api';
import { API_BASE_URL } from '@/config/api';
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
  Window,
  CV,
} from '@/types/student/portal';

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
  return (await apiRequest<{ data: T }>(path, { signal })).data;
}
export async function studentPost<T>(path: string, body: unknown): Promise<T> {
  return (
    await apiRequest<{ data: T }>(path, {
      method: 'POST',
      body: JSON.stringify(body),
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
    if (items.length >= result.total || !result.items.length) return items;
  }
}
export async function getOwnStudent(
  signal?: AbortSignal,
  expectedUser?: { id: string; email: string },
): Promise<Profile> {
  const { user } = await apiRequest<{ user: { id: number; email: string; roleCode: string | null; studentId: number | null; mustChangePassword: boolean } }>(
    '/auth/me',
    { signal },
  );
  if (user.roleCode !== 'STUDENT' || (expectedUser && (
    String(user.id) !== expectedUser.id ||
    user.email.toLowerCase() !== expectedUser.email.toLowerCase()
  ))) {
    throw new ApiError('Phiên đăng nhập đã thay đổi. Vui lòng đăng nhập lại.', 401, 'SESSION_IDENTITY_CHANGED');
  }
  if (user.studentId === undefined)
    throw new ApiError('Backend chưa trả studentId trong /auth/me. Cần cập nhật backend và kiểm tra VITE_API_URL đang trỏ đúng máy chủ.', 502, 'STUDENT_API_CONTRACT_MISMATCH');
  if (user.studentId === null)
    throw new ApiError('Tài khoản chưa được liên kết với hồ sơ sinh viên. Liên hệ Phòng Đào tạo để kiểm tra liên kết tài khoản.', 409, 'STUDENT_NOT_LINKED');
  if (user.mustChangePassword)
    throw new ApiError('Bạn cần đổi mật khẩu tạm trước khi sử dụng cổng sinh viên.', 403, 'PASSWORD_CHANGE_REQUIRED');
  return getStudentProfile(user.studentId, signal);
}
export const getStudentProfile = (id: number, signal?: AbortSignal) =>
  studentGet<Profile>(
    `/students/${id}` +
      studentQuery({ include: 'academicProgress,comboSelections,ojtRegistrations' }),
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
  );
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
    await apiRequest<{ data: CV }>('/students/me/cv', { method: 'POST', body })
  ).data;
}
export async function downloadStudentCv(studentId: number, cv: CV) {
  const token = localStorage.getItem('ojt_auth_token');
  const response = await fetch(
    API_BASE_URL +
      `/students/${studentId}/cv` +
      studentQuery({ cvFileId: cv.id }),
    { headers: token ? { Authorization: 'Bearer ' + token } : {} },
  );
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(
      body?.message || 'Không tải được CV (HTTP ' + response.status + ').',
    );
  }
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = cv.fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
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
    { method: 'PATCH', body: JSON.stringify({ isRead: true }) },
  );
}
