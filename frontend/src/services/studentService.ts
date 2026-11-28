import axios from 'axios';
import { expireBearerSession } from '../utils/shared/authSession';
import { API_BASE_URL } from '@/services/apiService';
import { studentReads } from '../utils/student/studentReads';
import { initializeStudentSnapshots, studentSnapshots } from '../utils/student/studentSnapshots';
import { friendlyErrorMessage } from '@/utils/shared/friendlyError';

import { downloadFile } from '@/utils/shared/downloadFile';
import { validateTaskAttachment } from './taskSubmissionService';
import type { StudentCurrentUserResponse } from '@/types/student/portal';
import type {
  AcademicSummary,
  Application,
  Assignment,
  CourseResult,
  Curriculum,
  Dashboard,
  DashboardOverview,
  DashboardSummary,
  Internships,
  OjtResult,
  Opportunities,
  Page,
  Profile,
  StudentIdentityProfile,
  StudyPeriod,
  Registration,
  Supplementary,
  Task,
  TaskSubmission,
  Window,
  CV,
} from '@/types/student/portal';

export { API_BASE_URL };

// Keep the student's transport independent of the shared API singleton.
type HeaderValue = string | number | boolean | null | undefined;
interface StudentRequestConfig {
  method?: string;
  data?: unknown;
  params?: Record<string, unknown>;
  headers?: Record<string, HeaderValue>;
  signal?: AbortSignal;
  timeout?: number;
}
interface ErrorBody { success?: boolean; message?: string; errorCode?: string; code?: string }

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
  if(['get','head'].includes(config.method?.toLowerCase()??'get')){
    config.headers.set('Cache-Control', 'no-cache');
    config.headers.set('Pragma', 'no-cache');
  }
  const headers = config.headers;
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
    if (!body || typeof body !== 'object') throw new ApiError('Chưa thể tải dữ liệu lúc này. Vui lòng thử lại.', response.status, 'INVALID_API_RESPONSE');
    const result = body as ErrorBody;
    if (result.success === false) throw new ApiError(friendlyErrorMessage({ response: { status: response.status, data: result } }, 'Yêu cầu chưa thể hoàn thành. Vui lòng thử lại.'), response.status, result.errorCode ?? result.code);
    if (!['get', 'head'].includes(options.method?.toLowerCase() ?? 'get')) {
      studentReads.invalidate();
      studentSnapshots.invalidate();
    }
    return body;
  } catch (error) {
    if (isRequestCanceled(error) || error instanceof ApiError) throw error;
    if (!axios.isAxiosError<ErrorBody>(error)) throw error;
    const failure = error;
    if (!failure.response) throw new ApiError(friendlyErrorMessage(failure, 'Không thể kết nối lúc này. Vui lòng kiểm tra mạng và thử lại.'), 0, failure.code);
    const { status, data } = failure.response;
    if (status === 401) {
      studentSnapshots.invalidate();
      expireBearerSession(failure.config?.headers?.Authorization);
    }
    const errorCode = data?.errorCode ?? data?.code;
    throw new ApiError(friendlyErrorMessage({ response: { status, data } }, 'Chưa thể hoàn thành yêu cầu. Vui lòng thử lại.'), status, errorCode);
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
  return studentReads.read(localStorage.getItem('ojt_auth_token'), path, async sharedSignal => {
    const response = await apiRequest<{ data: T }>(path, { signal: sharedSignal });
    if (!Object.prototype.hasOwnProperty.call(response, 'data'))
      throw new ApiError('Chưa thể tải đầy đủ dữ liệu. Vui lòng thử lại sau.', 502, 'STUDENT_API_CONTRACT_MISMATCH');
    return response.data;
  }, signal);
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
      throw new ApiError('Chưa thể tải đầy đủ danh sách. Vui lòng tải lại trang.', 502, 'STUDENT_API_CONTRACT_MISMATCH');
  }
}
export async function getOwnStudent(
  signal?: AbortSignal,
  expectedUser?: { id: string; email: string },
): Promise<Profile> {
  return resolveOwnStudent(getStudentProfile, signal, expectedUser);
}
export async function getOwnStudentIdentity(
  signal?: AbortSignal,
  expectedUser?: { id: string; email: string },
  onCached?: (profile: StudentIdentityProfile) => void,
): Promise<StudentIdentityProfile> {
  const token = localStorage.getItem('ojt_auth_token');
  const ticket = studentSnapshots.scope(token);
  const restored = initializeStudentSnapshots(token);
  const profile = await resolveOwnStudent(async (id, requestSignal, user) => {
    await restored;
    requestSignal?.throwIfAborted();
    // Cached personal data opens the portal only after /auth/me verifies its owner.
    const cached = studentSnapshots.read<StudentIdentityProfile>(ticket, 'portal-profile:' + id)?.data;
    if (cached?.id === id && cached.userId === user.id && cached.email?.toLowerCase() === user.email.toLowerCase()) onCached?.(cached);
    return studentGet<StudentIdentityProfile>(
      `/students/${id}` + studentQuery({ include: 'ojtRegistrations', ojtLimit: 100 }), requestSignal,
    );
  }, signal, expectedUser);
  signal?.throwIfAborted();
  studentSnapshots.write(ticket, 'portal-profile:' + profile.id, profile);
  return profile;
}
async function resolveOwnStudent<T extends Pick<Profile, 'id' | 'userId'>>(
  loadProfile: (id: number, signal: AbortSignal | undefined, user: StudentCurrentUserResponse['user']) => Promise<T>,
  signal?: AbortSignal,
  expectedUser?: { id: string; email: string },
): Promise<T> {
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
    const own = await studentGet<Pick<Internships, 'studentId'>>('/students/me/internships?include=identity', signal);
    studentId = own.studentId;
  }
  if (!Number.isSafeInteger(studentId) || studentId <= 0)
    throw new ApiError('Chưa tìm thấy hồ sơ sinh viên liên kết với tài khoản. Vui lòng liên hệ Phòng Đào tạo để được hỗ trợ.', 502, 'STUDENT_API_CONTRACT_MISMATCH');
  const profile = await loadProfile(studentId, signal, user);
  if (profile.id !== studentId || profile.userId !== user.id)
    throw new ApiError('Phiên đăng nhập đã thay đổi. Vui lòng đăng nhập lại.', 401, 'SESSION_IDENTITY_CHANGED');
  return profile;
}
export const getStudentProfile = (id: number, signal?: AbortSignal) =>
  studentGet<Profile>(
    `/students/${id}` +
      studentQuery({ include: 'academicProgress,ojtRegistrations', ojtLimit: 100 }),
    signal,
  );
export const getStudentAcademicProgress = (id: number, signal?: AbortSignal) =>
  studentGet<Pick<Profile, 'academicProgress'>>(
    `/students/${id}` + studentQuery({ include: 'academicProgress' }), signal,
  ).then(profile => profile.academicProgress);
export interface StudyOverview {
  period: StudyPeriod;
  historical: boolean;
  cutoff: string | null;
  academic: DashboardSummary['academic'];
  assessment: RiskAssessment | null;
  courseResults: CourseResult[];
  basis: string;
  note: string;
}
export const getStudyPeriods = (signal?: AbortSignal) =>
  studentGet<{ items: StudyPeriod[]; currentAcademicPeriodId: number | null }>('/students/me/study-periods', signal);
export const getStudyOverview = (academicPeriodId: number, signal?: AbortSignal) =>
  studentGet<StudyOverview>('/students/me/study-overview' + studentQuery({ academicPeriodId }), signal);
export interface CurrentStudyOverview extends Omit<StudyOverview, 'period' | 'cutoff'> {
  period: StudyPeriod | null;
  currentSemester: number | null;
  cutoff: null;
}
export const getCurrentStudyOverview = (signal?: AbortSignal) =>
  studentGet<CurrentStudyOverview>('/students/me/study-overview?view=current', signal);
export const getStudentDashboard = (semester: number, signal?: AbortSignal) =>
  studentGet<Dashboard>(
    '/students/me/dashboard' + studentQuery({ ojtSemesterId: semester }),
    signal,
  );
export const getStudentDashboardOverview = (semester: number, signal?: AbortSignal) =>
  studentGet<DashboardOverview>('/students/me/dashboard' + studentQuery({ ojtSemesterId: semester, view: 'overview' }), signal);
export const getStudentDashboardSummary = (semester: number, signal?: AbortSignal) =>
  studentGet<DashboardSummary>('/students/me/dashboard' + studentQuery({ ojtSemesterId: semester, view: 'summary' }), signal);
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
// Keep every server page available for local filtering; publish each page as it arrives.
// A semester filter must include matching courses beyond the current API page.
export async function getAllCourseResults(id: number, signal?: AbortSignal, onPage?: (items: CourseResult[]) => void) {
  const items: CourseResult[] = [];
  for (let page = 1; ; page++) {
    const { courseResults } = await studentGet<{ courseResults: Page<CourseResult> }>(
      `/students/${id}` + studentQuery({ include: 'courseResults', resultsPage: page, resultsLimit: 100 }), signal,
    );
    items.push(...courseResults.items);
    if (items.length >= courseResults.total) return items;
    if (!courseResults.items.length)
      throw new ApiError('Chưa thể tải đầy đủ bảng điểm. Vui lòng tải lại trang.', 502, 'STUDENT_API_CONTRACT_MISMATCH');
    onPage?.([...items]);
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
  studentGet<Pick<Internships, 'assignment'>>(
    '/students/me/internships' + studentQuery({ ojtSemesterId: semester, include: 'assignment' }),
    signal,
  ).then((result) => result.assignment);
export const getTasks = (
  semester: number,
  page: number,
  signal?: AbortSignal,
) =>
  studentGet<Internships['tasks']>(
    '/students/me/tasks' + studentQuery({ ojtSemesterId: semester, page, limit: 20 }),
    signal,
  );
export const getAssignedTasks = (semester: number, page: number, signal?: AbortSignal) =>
  getTasks(semester, page, signal);
export const getTaskSubmissions = (taskId: number, page: number, signal?: AbortSignal) =>
  studentGet<Page<TaskSubmission>>(`/students/me/tasks/${taskId}/submissions` + studentQuery({ page, limit: 20 }), signal);
export const submitAssignedTask = (taskId: number, content: string, attachment?: File) => {
  if (!attachment) return studentPost<TaskSubmission & { replayed: boolean }>(`/students/me/tasks/${taskId}/submissions`, { content });
  validateTaskAttachment(attachment);
  const data = new FormData();
  data.append('content', content);
  data.append('attachment', attachment);
  return studentPost<TaskSubmission & { replayed: boolean }>(`/students/me/tasks/${taskId}/submissions`, data);
};
export const getOjtResults = (
  semester: number,
  page: number,
  signal?: AbortSignal,
) =>
  studentGet<Pick<Internships, 'results'>>(
    '/students/me/internships' +
      studentQuery({
        ojtSemesterId: semester,
        resultsPage: page,
        resultsLimit: 20,
        include: 'results',
      }),
    signal,
  ).then((result) => result.results);
export const getOjtResult = (
  id: number,
  semester: number,
  signal?: AbortSignal,
) =>
  studentGet<Pick<Internships, 'result'>>(
    '/students/me/internships' +
      studentQuery({ ojtSemesterId: semester, resultId: id, include: 'results' }),
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
  limit = 20,
) {
  return studentGet<StudentNotificationPage>(
    '/students/me/notifications' + studentQuery({ page, limit, unread }),
    signal,
  );
}
export async function markStudentNotificationRead(id: string) {
  return apiRequest<{
    data: StudentNotification & { unreadCount: number };
  }>(
    `/students/me/notifications/${encodeURIComponent(id)}`,
    { method: 'PATCH', data: { isRead: true } },
  );
}

export interface CvEntry {evidence:{page:number;quote:string}|null;[key:string]:string|number|string[]|{page:number;quote:string}|null;}
export interface CvProfile {summary:string|null;skills:CvEntry[];projects:CvEntry[];experience:CvEntry[];languages:CvEntry[];education:CvEntry[];}
export interface CvAnalysis {id:number;cvFileId:number;status:'PROCESSING'|'NEEDS_REVIEW'|'CONFIRMED'|'FAILED';revision:number;schemaVersion:string;modelVersion:string;profile:CvProfile|null;error:{code:string;message:string}|null;canRetry:boolean;}
export interface MatchingProfile {cv:{id:number}|null;status:string;analysis:CvAnalysis|null;usableForMatching:boolean;
  officialAcademic:{programCode:string|null;major:string|null;gpa:number|null;gpaScale:number|null};discrepancies:string[];message:string;}
export const cvAnalysisApi={
 get:async(signal:AbortSignal)=>(await apiRequest<{data:MatchingProfile}>('/students/me/matching-profile',{signal})).data,
 analyze:async(cvFileId:number,signal:AbortSignal)=>(await apiRequest<{data:{analysis:CvAnalysis;replayed:boolean;reviewMessage?:string|null}}>('/students/me/cv/analyses',{
  method:'POST',data:{cvFileId,consent:true},signal,timeout:90000,
 })).data,
 save:async(analysisId:number,revision:number,profile:CvProfile,confirm:boolean,signal:AbortSignal)=>(await apiRequest<{data:{analysis:CvAnalysis}}>('/students/me/matching-profile',{
  method:'PATCH',data:{analysisId,revision,profile,confirm},signal,
 })).data,
};

export interface JobMatch {
  rank:number; positionId:number; postId:number; title:string; company:{id:number;name:string};
  location:string|null; workMode:string|null; remainingSlots:number; deadlineAt:string|null;
  canApply:boolean; blockers:string[]; relevanceScore:number; matchedSkills:string[];
  requirementsNotEvidenced:string[]; reason:string; reviewNote:string;
}
export interface JobMatchingResult {
  status:'READY'|'NO_READY_POSITIONS'|'WINDOW_UNAVAILABLE'; windowId:number; cvFileId:number;
  analysisId:number; cvRevision:number; candidateCount:number; blockers:string[];
  matches:JobMatch[]; model?:string; generatedAt?:string; cached?:boolean; scoreMeaning:string;
}
export async function matchStudentJobs(windowId:number, signal:AbortSignal) {
  const response = await apiRequest<{data:JobMatchingResult}>('/students/me/job-matches',{
    method:'POST',data:{windowId,consent:true},signal,timeout:90000,
  });
  return response.data;
}

export interface RiskAssessment {
  status:'ASSESSED'|'INSUFFICIENT_DATA';
  student:{id:number;fullName:string;studentCode:string;currentSemester:number|null};
  risk:{level:'LOW'|'MEDIUM'|'HIGH'|'INSUFFICIENT_DATA';label:string;computedAt:string;
    reasons:{code:string;message:string}[];limitations:string[];
    evidence:{earnedCredits:number|null;missingCredits:number|null;failedCourseCount:number;maxUnpassedCourses?:number|null;assessmentDeadline:string|null}};
  roadmap:{status:'READY'|'NOT_AVAILABLE'|'DATA_INCOMPLETE';targetSemester:number;objective:string;message:string;actions:string[];limitations:string[];
    items:{courseId:number;courseCode:string|null;name:string|null;requirementId?:number;credits?:number|null;recommendedSemester:number;priority:number;action:string;stage:string;
      canPlan:boolean;explanation:string;isAlternative:boolean;
      dependentCourses?:{courseId:number;courseCode:string|null;name:string|null;unlocksAfterPassing:boolean;mandatory:boolean}[];
      prerequisites:{satisfied:boolean;remainingRequired:number;courses:{courseId:number;courseCode:string|null;passed:boolean}[]}[];}[]};
}
export async function getOjtRiskAssessment(signal:AbortSignal):Promise<RiskAssessment>{
  return (await apiRequest<{data:RiskAssessment}>('/students/me/ojt-risk-assessment',{signal,timeout:0})).data;
}
