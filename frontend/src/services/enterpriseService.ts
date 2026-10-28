import API from './api';
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
    tasks: Array<{ id: number; assignmentId: number }>;
    replayed: boolean;
  };
}

// ─── Shared Types ────────────────────────────────────────────────────────────
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

// ─── Recruitment Window Types ────────────────────────────────────────────────
export interface RecruitmentWindow {
  id: number;
  academicPeriodId: number;
  ojtSemesterId: number;
  name: string;
  status: 'DRAFT' | 'OPEN' | 'CLOSED';
  startsAt: string;
  endsAt: string;
  periodCode?: string;
  periodName?: string;
  periodStatus?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Recruitment Post Types ──────────────────────────────────────────────────
export interface RecruitmentPostPosition {
  id: number;
  code: string;
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
  enterpriseId: number;
  enterpriseName?: string;
  enterpriseCode?: string;
  periodCode?: string;
  title: string;
  content: string;
  benefits?: string | null;
  applicationInstructions?: string | null;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'CLOSED' | 'ARCHIVED';
  deadlineAt?: string | null;
  publishedAt?: string | null;
  positions?: RecruitmentPostPosition[];
  createdAt?: string;
  updatedAt?: string;
}

// ─── Enterprise Candidate Types ──────────────────────────────────────────────
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
  className?: string;
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

export interface EnterpriseCandidateItem {
  id: number; // CoordinationID
  studentId: number;
  ojtSemesterId: number;
  positionId: number;
  applicationId?: number | null;
  registrationId: number;
  student: EnterpriseCandidateStudent;
  position: EnterpriseCandidatePosition;
  decision: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  introducedAt: string;
  decisionAt?: string | null;
  rejectReason?: string | null;
  isLatestCoordination: boolean;
  application?: Record<string, unknown> | null;
  jobApplication?: Record<string, unknown> | null;
}

// ─── Enterprise Internship Types ─────────────────────────────────────────────
export interface EnterpriseInternshipItem {
  id: number; // AssignmentID
  studentId: number;
  ojtSemesterId: number;
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
  academicSupervisor?: Record<string, unknown> | null;
  result?: Record<string, unknown> | null;
  evaluationLocked?: boolean;
  application?: Record<string, unknown> | null;
  jobApplication?: Record<string, unknown> | null;
}

export interface InternshipEvaluationData {
  id?: number;
  completionScore?: number | null;
  attitudeScore?: number | null;
  skillScore?: number | null;
  overallScore?: number | null;
  comments?: string | null;
  status?: string;
  evaluatedAt?: string | null;
}

export interface EnterpriseInternshipTask {
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

// ─── Service ─────────────────────────────────────────────────────────────────
export const enterpriseService = {
  // ── Profile ──────────────────────────────────────────────────────────────
  // Gọi GET /api/enterprise/profile — không cần companyId vì backend lấy từ JWT
  getProfile: async (): Promise<EnterpriseProfileResponse> => {
    const response = await API.get<EnterpriseProfileResponse>('/enterprise/profile');
    return response.data;
  },

  updateEnterpriseProfile: async (
    data: EnterpriseProfileUpdateRequest
  ): Promise<EnterpriseProfileUpdateResponse> => {
    const response = await API.patch<EnterpriseProfileUpdateResponse>('/enterprise/profile', data);
    return response.data;
  },

  // ── Recruitment Windows (JSON Input) ──────────────────────────────────────
  // Gọi POST /api/json/recruitment/windows/list — không cần companyId
  listRecruitmentWindows: async (params: PaginatedRequest = { page: 1, limit: 20 }): Promise<PaginatedResponse<RecruitmentWindow>> => {
    const response = await API.post<PaginatedResponse<RecruitmentWindow>>(
      '/json/recruitment/windows/list',
      { page: params.page ?? 1, limit: params.limit ?? 20, ...params }
    );
    return response.data;
  },

  // ── Recruitment Posts ─────────────────────────────────────────────────────
  // Gọi GET /api/recruitment/posts
  // companyId bắt buộc: backend scope ENTERPRISE chỉ trả về bài đăng của doanh nghiệp mình
  listRecruitmentPosts: async (companyId: number, params: PaginatedRequest = { page: 1, limit: 20 }): Promise<PaginatedResponse<RecruitmentPost>> => {
    const response = await API.get<PaginatedResponse<RecruitmentPost>>('/recruitment/posts', {
      params: { ...params, page: params.page ?? 1, limit: params.limit ?? 20, companyId },
    });
    return response.data;
  },

  // GET tự giới hạn theo doanh nghiệp trong token; bỏ page/limit để lấy toàn bộ danh sách.
  listCandidates: async (params: PaginatedRequest = {}): Promise<PaginatedResponse<EnterpriseCandidateItem>> => {
    const response = await API.get<PaginatedResponse<EnterpriseCandidateItem>>('/enterprise/candidates', {
      params,
    });
    return response.data;
  },

  // ── Enterprise Internships ────────────────────────────────────────────────
  // GET tự giới hạn theo doanh nghiệp trong token; bỏ page/limit để lấy toàn bộ danh sách.
  listInternships: async (params: PaginatedRequest = {}): Promise<PaginatedResponse<EnterpriseInternshipItem>> => {
    const response = await API.get<PaginatedResponse<EnterpriseInternshipItem>>('/enterprise/internships', {
      params,
    });
    return response.data;
  },

  // ── Internship Tasks ──────────────────────────────────────────────────────
  // Gọi GET /api/internship-tasks
  // companyId BẮT BUỘC với vai trò ENTERPRISE — backend dùng để kiểm tra scope
  listInternshipTasks: async (companyId: number, params: InternshipTaskListRequest = {}): Promise<PaginatedResponse<EnterpriseInternshipTask>> => {
    const response = await API.get<PaginatedResponse<EnterpriseInternshipTask>>('/internship-tasks', {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 100,
        companyId,
        ...(params.assignmentId !== undefined ? { assignmentId: params.assignmentId } : {}),
      },
    });
    return response.data;
  },

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
  // Gọi PUT /api/enterprise/internships/{id}/evaluation
  // internshipId = AssignmentID
  evaluateInternship: async (internshipId: number, evaluationData: Record<string, unknown>): Promise<unknown> => {
    const response = await API.put(`/enterprise/internships/${internshipId}/evaluation`, evaluationData);
    return response.data;
  },
};

export default enterpriseService;
