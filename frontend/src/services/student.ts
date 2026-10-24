import { ApiError, apiRequest } from './api';
import { API_BASE_URL } from '@/config/api';
import type {
  AcademicSummary,
  Application,
  Assignment,
  CourseResult,
  Curriculum,
  Dashboard,
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
      path + studentQuery({ page, limit: 100 }),
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
  const { user } = await apiRequest<{ user: { id: number; email: string; roleCode: string | null; studentId: number | null } }>(
    '/auth/me',
    { signal },
  );
  if (user.roleCode !== 'STUDENT' || (expectedUser && (
    String(user.id) !== expectedUser.id ||
    user.email.toLowerCase() !== expectedUser.email.toLowerCase()
  ))) {
    throw new ApiError('Phiên đăng nhập đã thay đổi. Vui lòng đăng nhập lại.', 401, 'SESSION_IDENTITY_CHANGED');
  }
  if (!user.studentId)
    throw new Error('Tài khoản chưa được liên kết với hồ sơ sinh viên.');
  return getStudentProfile(user.studentId, signal);
}
export const getStudentProfile = (id: number, signal?: AbortSignal) =>
  studentGet<Profile>(`/students/${id}`, signal);
export const getStudentDashboard = (semester: number, signal?: AbortSignal) =>
  studentGet<Dashboard>(
    '/student/dashboard' + studentQuery({ ojtSemesterId: semester }),
    signal,
  );
export const getAcademicSummary = (semester: number, signal?: AbortSignal) =>
  studentGet<AcademicSummary>(
    '/student/academic-summary' + studentQuery({ ojtSemesterId: semester }),
    signal,
  );
export const getSupplementary = (semester: number, signal?: AbortSignal) =>
  studentGet<Supplementary>(
    '/student/supplementary-course-options' +
      studentQuery({ ojtSemesterId: semester }),
    signal,
  );
export const getCurriculum = (signal?: AbortSignal) =>
  studentGet<Curriculum>('/student/curriculum', signal);
export const getRoadmap = (semester: number, signal?: AbortSignal) =>
  studentGet<Roadmap>(
    '/student/roadmap-recommendations' +
      studentQuery({ ojtSemesterId: semester }),
    signal,
  );
export const getCourseResults = (
  id: number,
  page: number,
  signal?: AbortSignal,
) =>
  studentGet<Page<CourseResult>>(
    `/students/${id}/course-results` + studentQuery({ page, limit: 20 }),
    signal,
  );
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
  semester: number,
  page: number,
  signal?: AbortSignal,
) =>
  studentGet<Opportunities>(
    '/students/me/opportunities' +
      studentQuery({ ojtSemesterId: semester, page, limit: 20 }),
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
  studentGet<Assignment | null>(
    '/student/assignments/current' + studentQuery({ ojtSemesterId: semester }),
    signal,
  );
export const getTasks = (
  studentId: number,
  semester: number,
  page: number,
  signal?: AbortSignal,
) =>
  studentGet<Page<Task>>(
    '/internship-tasks' +
      studentQuery({ studentId, ojtSemesterId: semester, page, limit: 20 }),
    signal,
  );
export const getOjtResults = (
  semester: number,
  page: number,
  signal?: AbortSignal,
) =>
  studentGet<Page<OjtResult>>(
    '/student/ojt-results' +
      studentQuery({ ojtSemesterId: semester, page, limit: 20 }),
    signal,
  );
export const getOjtResult = (id: number, signal?: AbortSignal) =>
  studentGet<OjtResult>(`/student/ojt-results/${id}`, signal);
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
    '/student/notifications' + studentQuery({ page, limit: 20, unread }),
    { signal },
  );
  return response.data;
}
export async function markStudentNotificationRead(id: string) {
  return apiRequest<{ data: { id: number; isRead: boolean } }>(
    `/student/notifications/${encodeURIComponent(id)}/read`,
    { method: 'PATCH' },
  );
}
