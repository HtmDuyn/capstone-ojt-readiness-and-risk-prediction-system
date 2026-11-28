import API from './apiService';
import type { EnterpriseProfileData, EnterpriseProfileResponse } from '@/types/enterprise/enterpriseTypes';

export interface EnterpriseProfileUpdateResponse {
  success: boolean;
  data: Pick<
    EnterpriseProfileData,
    | 'id'
    | 'code'
    | 'name'
    | 'address'
    | 'industry'
    | 'contactPersonName'
    | 'contactPhone'
    | 'contactEmail'
    | 'status'
    | 'createdAt'
  > & {
    representative: {
      id: number;
      userId: number;
      username: string;
      fullName: string;
      email: string;
      phone: string | null;
      positionTitle: string | null;
    };
  };
  message?: string;
}

export interface EnterpriseProfileUpdateRequest {
  companyId: number;
  name: string;
  address: string | null;
  industry: string | null;
  contactPersonName: string;
  contactPhone: string | null;
  contactEmail: string;
  positionTitle: string | null;
}

export interface BulkTaskAssignmentResponse {
  success: boolean;
  data: {
    created: number;
    tasks: Array<{ id: number; assignmentId: number; assignedAt?: string }>;
    replayed: boolean;
  };
}

// Các kiểu dùng chung cho request/list phân trang của doanh nghiệp.
export interface PaginatedRequest {
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
  };
}

// Dữ liệu kỳ đăng ký và cửa sổ tuyển dụng do QHDN quản lý.
export interface RecruitmentWindow {
  id: number;
  academicPeriodId: number;
  ojtSemesterId: number;
  name: string;
  status: 'DRAFT' | 'OPEN' | 'CLOSED';
  startsAt: string;
  endsAt: string;
  accepting: boolean;
  canCreate?: boolean;
  canEdit?: boolean;
  postingDeadlineAt?: string;
  postingStartsAt?: string;
  postingEndsAt?: string;
  applicationStartsAt?: string;
  applicationEndsAt?: string;
  resultsStartsAt?: string;
  resultsEndsAt?: string;
  deadlineManagedBy?: 'QHDN';
  editLockCode?: string | null;
  studentRegistrationWindow?: { id: number; name: string; startsAt: string; endsAt: string } | null;
  periodCode?: string;
  periodName?: string;
  periodStatus: 'ACTIVE' | 'CLOSED';
  createdAt?: string;
  updatedAt?: string;
}

// Bài tuyển dụng và vị trí công việc doanh nghiệp được phép tạo hoặc chỉnh sửa.
export interface RecruitmentPostPosition {
  id: number;
  code: string | null;
  title: string;
  description: string;
  requirements: string;
  capacity: number;
  remainingSlots: number;
  location?: string | null;
  workMode?: string | null;
  status?: string;
}

export interface RecruitmentPost {
  id: number;
  windowId: number;
  companyId: number;
  companyName?: string;
  enterpriseId?: number;
  enterpriseName?: string;
  enterpriseCode?: string;
  periodCode?: string;
  title: string;
  content: string;
  benefits?: string | null;
  applicationInstructions?: string | null;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'CLOSED';
  deadlineAt?: string | null;
  publishedAt?: string | null;
  positions?: RecruitmentPostPosition[];
  createdAt?: string;
  updatedAt?: string;
  reviewReason?: string | null;
  reviewedAt?: string | null;
  canEdit?: boolean;
  requiresReview?: boolean;
  canDelete?: boolean;
  canPublish?: boolean;
  replayed?: boolean;
  postingDeadlineAt?: string | null;
  deadlineManagedBy?: 'QHDN';
  editLockCode?: string | null;
  studentRegistrationWindow?: RecruitmentWindow['studentRegistrationWindow'];
}

export interface EnterpriseRecruitmentPositionInput {
  id?: number;
  title: string;
  description: string;
  requirements: string;
  capacity: number;
  location: string | null;
  workMode: 'ONSITE' | 'REMOTE' | 'HYBRID' | null;
}

export interface EnterpriseRecruitmentPostInput {
  status?: 'DRAFT' | 'PUBLISHED';
  title: string;
  content: string;
  benefits: string | null;
  applicationInstructions: string | null;
  positions: EnterpriseRecruitmentPositionInput[];
}

// QHDN owns all deadlines. Enterprise requests never send deadlineAt.
export interface EnterpriseRecruitmentPostCreateInput extends EnterpriseRecruitmentPostInput {
  windowId: number;
  idempotencyKey?: string;
}

export interface EnterpriseRecruitmentPostResponse {
  success: boolean;
  data: RecruitmentPost;
}

// Hồ sơ ứng viên và dữ liệu tổng hợp cho các màn quản lý của doanh nghiệp.
export interface EnterpriseCandidateStudent {
  id: number;
  studentCode: string;
  fullName: string;
  email: string;
  phone?: string | null;
  status: string;
  programCode?: string;
  programName?: string;
  enrollmentYear?: number;
  cohortName?: string | null;
  groupCode?: string | null;
}

export interface EnterpriseCandidatePosition {
  id: number;
  code: string;
  title: string;
  description: string;
  requirements: string;
  ojtSemesterId: number;
  location?: string | null;
  workMode?: string | null;
}

export interface DashboardTaskSummary {
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
  overdue: number;
  dueSoon: number;
  attention: {id: number; name: string; fullName: string; enterpriseStatus: string; dueAt: string | null; dueDate: string}[];
}

export interface DashboardCandidate {
  id: number;
  introducedAt: string | null;
  fullName: string;
  studentCode: string;
  positionTitle: string;
}

export interface EnterpriseCandidateItem {
  id: number; // CoordinationID
  studentId: number;
  ojtSemesterId: number;
  positionId: number;
  applicationId?: number | null;
  registrationId: number;
  student: EnterpriseCandidateStudent;
  position: EnterpriseCandidatePosition;
  decision: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'SUPERSEDED';
  source?: string;
  receivedAt?: string | null;
  introducedAt: string;
  decisionAt?: string | null;
  rejectReason?: string | null;
  isLatestCoordination: boolean;
  canRespond?: boolean;
  recruitmentRound?: {
    id: number;
    name: string;
    resultsStartsAt: string | null;
    resultsEndsAt: string | null;
  } | null;
  application?: Record<string, unknown> | null;
  skills?: { name: string; level?: number | null }[];
  jobApplication?: {
    id: number;
    postId?: number;
    coverLetter?: string | null;
    appliedAt?: string | null;
    status?: string;
    certificates?: { name: string; url: string }[];
    skills?: { name: string; category?: string }[];
    cv?: { id: number; fileName: string; mimeType: string; size: number; uploadedAt?: string } | null;
  } | null;
}

export interface EnterpriseCandidatePeriod {
  academicYearId: number;
  academicYearCode: string;
  ojtSemesterId: number;
  semesterCode: string;
  semesterName: string;
  academicPeriodId: number | null;
  academicPeriodName: string | null;
  periodStatus: 'ACTIVE' | 'CLOSED';
  startDate: string | null;
  endDate: string | null;
}

// Bản ghi thực tập và task được liên kết với từng sinh viên.
export interface EnterpriseInternshipItem {
  id: number; // AssignmentID
  studentId: number;
  ojtSemesterId: number;
  periodStatus?: 'ACTIVE' | 'CLOSED';
  recruitmentRound?: {
    id: number;
    name: string;
    status: 'DRAFT' | 'OPEN' | 'CLOSED';
    periodStatus: 'ACTIVE' | 'CLOSED' | null;
  } | null;
  semester?: { id: number; code?: string; name?: string } | null;
  positionId: number;
  coordinationId: number;
  registrationId: number;
  student: EnterpriseCandidateStudent;
  position: EnterpriseCandidatePosition;
  enterpriseSupervisorName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: string;
  evaluation?: InternshipEvaluationData | null;
  template?: { id: number; name: string; version: number; criteria: Array<{ key: string; label: string; weight: number }> } | null;
  academicSupervisor?: { id: number; fullName: string; email?: string | null; phone?: string | null } | null;
  result?: Record<string, unknown> | null;
  evaluationLocked?: boolean;
  application?: Record<string, unknown> | null;
  jobApplication?: Record<string, unknown> | null;
}

export interface InternshipEvaluationData {
  id?: number;
  templateId?: number | null;
  completionScore?: number | null;
  attitudeScore?: number | null;
  skillScore?: number | null;
  overallScore?: number | null;
  comments?: string | null;
  status?: string;
  evaluatedAt?: string | null;
  scoreDetails?: Record<string, number | null> | null;
  criteria?: Array<{key:string;label:string;weight:number}> | null;
}

export interface EnterpriseInternshipEvaluationRequest {
  templateId: number;
  scoreDetails: Record<string, number | null>;
  comments: string | null;
  reason: string;
}

export interface BulkEvaluationItem {
  assignmentId: number;
  templateId: number;
  comments: string | null;
  scoreDetails: Record<string, number | null>;
}

export interface BulkEvaluationResponse {
  success: boolean;
  data: {
    items: Array<InternshipEvaluationData & { assignmentId: number; assignedAt?: string }>;
    saved: number;
    status: 'DRAFT' | 'SUBMITTED';
  };
}

export interface EnterpriseInternshipTask {
  assignedAt?: string | null;
  dueAt?: string | null;
  enterpriseStatus: 'TODO' | 'DONE' | 'OVERDUE';
  canDelete: boolean;
  id: number;
  assignmentId: number;
  studentId: number;
  name: string;
  status: string;
  dueDate?: string | null;
  companyId?: number;
  positionId?: number;
  description?: string | null;
  assignedDate?: string | null;
  ojtSemesterId?: number;
  studentCode?: string;
  fullName?: string;
  companyName?: string;
  positionTitle?: string;
  semesterCode?: string;
  periodStatus?: 'ACTIVE' | 'CLOSED';
  assignment?: {
    id: number;
    status: string;
    startDate?: string | null;
    endDate?: string | null;
  } | null;
  student?: {
    id?: number;
    code?: string;
    studentCode?: string;
    fullName?: string;
    email?: string;
    phone?: string | null;
    status?: string;
    programCode?: string;
    programName?: string;
  } | null;
  company?: {
    id: number;
    code?: string;
    name: string;
    status?: string;
    address?: string | null;
    industry?: string;
    contactEmail?: string;
    contactPhone?: string | null;
    contactPersonName?: string;
  } | null;
  position?: {
    id: number;
    code?: string;
    title: string;
    status?: string;
    capacity?: number;
    location?: string | null;
    workMode?: string | null;
    companyId?: number;
    description?: string;
    requirements?: string;
    ojtSemesterId?: number;
    remainingSlots?: number;
  } | null;
  semester?: {
    id: number;
    code?: string;
    name?: string;
    status?: string;
    startDate?: string | null;
    endDate?: string | null;
    academicYearId?: number;
    academicPeriodId?: number;
    academicPeriod?: {
      id: number;
      code?: string;
      kind?: string;
      name?: string;
      status?: string;
      startDate?: string | null;
      endDate?: string | null;
    } | null;
  } | null;
}

export interface InternshipTaskListRequest {
  assignmentId?: number;
  page?: number;
  limit?: number;
  // companyId bắt buộc với vai trò ENTERPRISE — được inject tự động từ EnterpriseContext
  companyId?: number;
}

// Tầng gọi API tập trung để các màn enterprise dùng cùng quy tắc và kiểu dữ liệu.
export type EnterpriseAcceptancePreview = {
  candidateIds: number[];
  confirmationToken: string;
  totalSelected: number;
  overCapacity: boolean;
  semesters: {
    ojtSemesterId: number;
    name: string;
    capacity: number;
    currentCount: number;
    selectedCount: number;
    afterCount: number;
    excessCount: number;
  }[];
};

export const enterpriseService = {
  getCandidateCv: async (candidateId: number, signal?: AbortSignal): Promise<Blob> =>
    (await API.get(`/enterprise/candidates/${candidateId}/cv`, { responseType: 'blob', signal })).data,
  // Xem trước sức chứa trước khi tiếp nhận nhiều ứng viên cùng lúc.
  previewAcceptance: async (candidateIds: number[]): Promise<EnterpriseAcceptancePreview> =>
    (await API.post('/enterprise/candidates/acceptance-preview', { candidateIds })).data.data,
  // Dùng confirmationToken để tránh tình trạng xác nhận tiếp nhận bị lặp.
  acceptCandidates: async (
    preview: EnterpriseAcceptancePreview,
    allowOverCapacity: boolean,
    reason: string,
  ): Promise<unknown> =>
    (await API.post('/enterprise/candidates/accept-bulk', {
      candidateIds: preview.candidateIds,
      confirmationToken: preview.confirmationToken,
      allowOverCapacity,
      reason,
    })).data.data,
  // ── Profile ──────────────────────────────────────────────────────────────
  // Gọi GET /api/enterprise/profile — không cần companyId vì backend lấy từ JWT
  getProfile: async (signal?: AbortSignal): Promise<EnterpriseProfileResponse> => {
    const response = await API.get<EnterpriseProfileResponse>('/enterprise/profile', { signal });
    return response.data;
  },

  updateEnterpriseProfile: async (
    data: EnterpriseProfileUpdateRequest
  ): Promise<EnterpriseProfileUpdateResponse> => {
    const response = await API.patch<EnterpriseProfileUpdateResponse>('/enterprise/profile', data);
    return response.data;
  },

  // ── Recruitment Windows ──────────────────────────────────────
  // API doanh nghiệp lấy quyền từ JWT, GET dùng query parameters.
  listRecruitmentWindows: async (params: PaginatedRequest = {}, signal?: AbortSignal): Promise<PaginatedResponse<RecruitmentWindow>> => {
    const response = await API.get<PaginatedResponse<RecruitmentWindow>>('/enterprise/recruitment/windows', { params, signal });
    return response.data;
  },

  // ── Recruitment Posts ─────────────────────────────────────────────────────
  listRecruitmentPosts: async (params: PaginatedRequest = {}, signal?: AbortSignal): Promise<PaginatedResponse<RecruitmentPost>> => {
    const response = await API.get<PaginatedResponse<RecruitmentPost>>('/enterprise/recruitment/posts', { params, signal });
    return response.data;
  },

  createRecruitmentPost: async (data: EnterpriseRecruitmentPostCreateInput): Promise<EnterpriseRecruitmentPostResponse> => {
    const { windowId, idempotencyKey, title, content, benefits, applicationInstructions, positions, status = 'DRAFT' } = data;
    const response = await API.post<EnterpriseRecruitmentPostResponse>('/enterprise/recruitment/posts', {
      windowId, idempotencyKey, title, content, benefits, applicationInstructions, positions, status,
    });
    return response.data;
  },

  updateRecruitmentPost: async (id: number, data: EnterpriseRecruitmentPostInput): Promise<EnterpriseRecruitmentPostResponse> => {
    // Whitelist enterprise-editable fields so deadlineAt cannot leak into PATCH.
    const { title, content, benefits, applicationInstructions, positions, status = 'DRAFT' } = data;
    const response = await API.patch<EnterpriseRecruitmentPostResponse>(`/enterprise/recruitment/posts/${id}`, {
      title, content, benefits, applicationInstructions, positions, status,
    });
    return response.data;
  },

  publishRecruitmentPost: async (id: number): Promise<EnterpriseRecruitmentPostResponse> =>
    (await API.post<EnterpriseRecruitmentPostResponse>(`/enterprise/recruitment/posts/${id}/publish`)).data,

  deleteRecruitmentPost: async (id: number): Promise<{ success: boolean; data: { id: number; deleted: boolean } }> =>
    (await API.delete(`/enterprise/recruitment/posts/${id}`)).data,

  // GET tự giới hạn theo doanh nghiệp trong token; bỏ page/limit để lấy toàn bộ danh sách.
  listCandidatePeriods: async (signal?: AbortSignal): Promise<{ success: boolean; data: { items: EnterpriseCandidatePeriod[] } }> => {
    const response = await API.get<{ success: boolean; data: { items: EnterpriseCandidatePeriod[] } }>('/enterprise/candidate-periods', {signal});
    return response.data;
  },

  dashboardTasks: async (signal: AbortSignal) => {
    const response = await API.get<{success: boolean; data: DashboardTaskSummary}>('/enterprise/dashboard/tasks', {signal});
    return response.data.data;
  },

  dashboardCandidates: async (signal: AbortSignal) => {
    const response = await API.get<{success: boolean; data: {items: DashboardCandidate[]; rejectedCount: number}}>(
      '/enterprise/dashboard/candidates', {signal},
    );
    return response.data.data;
  },

  listCandidates: async (params: PaginatedRequest = {}, signal?: AbortSignal): Promise<PaginatedResponse<EnterpriseCandidateItem>> => {
    const response = await API.get<PaginatedResponse<EnterpriseCandidateItem>>('/enterprise/candidates', {
      params,
      signal,
    });
    return response.data;
  },

  // ── Enterprise Internships ────────────────────────────────────────────────
  // GET tự giới hạn theo doanh nghiệp trong token; bỏ page/limit để lấy toàn bộ danh sách.
  listInternships: async (params: PaginatedRequest = {}, signal?: AbortSignal): Promise<PaginatedResponse<EnterpriseInternshipItem>> => {
    const response = await API.get<PaginatedResponse<EnterpriseInternshipItem>>('/enterprise/internships', {
      params,
      signal,
    });
    return response.data;
  },
  getOjtGradingCriteria: async (assignmentId:number, signal?:AbortSignal) => {
    const response=await API.get<{success:boolean;data:{id:number|null;criteria:Array<{key:string;label:string;weight:number}>;name:string;version?:number}}>(`/enterprise/internships/grading-criteria`,{params:{assignmentId},signal});
    return response.data.data;
  },

  // ── Internship Tasks ──────────────────────────────────────────────────────
  // Gọi GET /api/internship-tasks
  // companyId BẮT BUỘC với vai trò ENTERPRISE — backend dùng để kiểm tra scope
  listInternshipTasks: async (companyId: number, params: InternshipTaskListRequest = {}, signal?: AbortSignal): Promise<PaginatedResponse<EnterpriseInternshipTask>> => {
    const response = await API.get<PaginatedResponse<EnterpriseInternshipTask>>('/internship-tasks', {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 100,
        companyId,
        ...(params.assignmentId !== undefined ? { assignmentId: params.assignmentId } : {}),
      },
      signal,
    });
    return response.data;
  },

  // Chỉ xóa task chưa phát sinh hoạt động; id được truyền nguyên vẹn theo route backend.
  deleteUnusedTask: (id: string) => API.delete(`/enterprise/tasks/${id}`),

  assignTasksBulk: async (
    assignmentIds: number[],
    tasks: Array<{ name: string; description?: string; dueDate: string }>,
    idempotencyKey: string
  ): Promise<BulkTaskAssignmentResponse> => {
    const response = await API.post<BulkTaskAssignmentResponse>('/enterprise/tasks/bulk', {
      assignmentIds,
      tasks,
      idempotencyKey,
    });
    return response.data;
  },

  // ── Candidate Decision ────────────────────────────────────────────────────
  // Gọi PATCH /api/enterprise/candidates/{id}/decision
  // candidateId = CoordinationID; decision = ACCEPTED | REJECTED; reason là lý do từ chối
  decideCandidate: async (candidateId: number, decision: 'ACCEPTED' | 'REJECTED', reason: string): Promise<unknown> => {
    const response = await API.patch(`/enterprise/candidates/${candidateId}/decision`, {
      decision,
      reason,
    });
    return response.data;
  },

  // ── Internship Evaluation ─────────────────────────────────────────────────
  saveBulkEvaluations: async (
    items: BulkEvaluationItem[], status: 'DRAFT' | 'SUBMITTED', confirmed = false,
  ): Promise<BulkEvaluationResponse> => {
    const response = await API.post<BulkEvaluationResponse>('/enterprise/internships/evaluations/bulk', {
      items, status, confirmed,
      reason: status === 'DRAFT' ? 'Lưu điểm đánh giá OJT' : 'Xác nhận gửi điểm OJT hàng loạt đến QHDN',
    });
    return response.data;
  },
  // Gọi PUT /api/enterprise/internships/{id}/evaluation
  // internshipId = AssignmentID
  evaluateInternship: async (
    internshipId: number,
    evaluationData: EnterpriseInternshipEvaluationRequest
  ): Promise<unknown> => {
    const response = await API.put(`/enterprise/internships/${internshipId}/evaluation`, evaluationData);
    return response.data;
  },
};

export default enterpriseService;
