import API from './api';
import { EnterpriseProfileResponse } from '@/types/enterprise/enterpriseTypes';
import { UpdateProfileRequest, UpdateProfileResponse } from './authService';

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

  updateAccountProfile: async (data: UpdateProfileRequest): Promise<UpdateProfileResponse> => {
    const response = await API.patch('/accounts/me/profile', data);
    return response.data as UpdateProfileResponse;
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

  // ── Recruitment Posts (JSON Input) ────────────────────────────────────────
  // Gọi POST /api/json/recruitment/posts/list
  // companyId bắt buộc: backend scope ENTERPRISE chỉ trả về bài đăng của doanh nghiệp mình
  listRecruitmentPosts: async (companyId: number, params: PaginatedRequest = { page: 1, limit: 20 }): Promise<PaginatedResponse<RecruitmentPost>> => {
    const response = await API.post<PaginatedResponse<RecruitmentPost>>(
      '/json/recruitment/posts/list',
      { page: params.page ?? 1, limit: params.limit ?? 20, companyId, ...params }
    );
    return response.data;
  },

  // ── Enterprise Candidates (JSON Input) ───────────────────────────────────
  // Gọi POST /api/json/enterprise/candidates/list
  // companyId BẮT BUỘC — backend trả 400 nếu thiếu với vai trò ENTERPRISE
  listCandidates: async (companyId: number, params: PaginatedRequest = { page: 1, limit: 20 }): Promise<PaginatedResponse<EnterpriseCandidateItem>> => {
    const response = await API.post<PaginatedResponse<EnterpriseCandidateItem>>(
      '/json/enterprise/candidates/list',
      { page: params.page ?? 1, limit: params.limit ?? 20, companyId, ...params }
    );
    return response.data;
  },

  // ── Enterprise Internships (JSON Input) ───────────────────────────────────
  // Gọi POST /api/json/enterprise/internships/list
  // companyId BẮT BUỘC — backend trả 400 nếu thiếu với vai trò ENTERPRISE
  listInternships: async (companyId: number, params: PaginatedRequest = { page: 1, limit: 20 }): Promise<PaginatedResponse<EnterpriseInternshipItem>> => {
    const response = await API.post<PaginatedResponse<EnterpriseInternshipItem>>(
      '/json/enterprise/internships/list',
      { page: params.page ?? 1, limit: params.limit ?? 20, companyId, ...params }
    );
    return response.data;
  },

  // ── Internship Tasks (JSON Input) ─────────────────────────────────────────
  // Gọi POST /api/json/internship-tasks/list
  // companyId BẮT BUỘC với vai trò ENTERPRISE — backend dùng để kiểm tra scope
  listInternshipTasks: async (companyId: number, params: InternshipTaskListRequest = {}): Promise<PaginatedResponse<EnterpriseInternshipTask>> => {
    const response = await API.post<PaginatedResponse<EnterpriseInternshipTask>>(
      '/json/internship-tasks/list',
      {
        page: params.page ?? 1,
        limit: params.limit ?? 100,
        companyId,
        ...(params.assignmentId !== undefined ? { assignmentId: params.assignmentId } : {}),
      }
    );
    return response.data;
  },

  // ── Candidate Decision ────────────────────────────────────────────────────
  // Gọi PATCH /api/enterprise/candidates/:id/decision (direct route, không phải JSON adapter)
  // candidateId = CoordinationID; decision = ACCEPTED | REJECTED; reason là lý do từ chối
  // LƯU Ý: API /api/json/enterprise/candidates/decision (404) đang bị lỗi — KHÔNG GỌI
  decideCandidate: async (candidateId: number, decision: 'ACCEPTED' | 'REJECTED', reason: string): Promise<unknown> => {
    // Gọi trực tiếp endpoint REST (không qua JSON adapter vì đang 404)
    const response = await API.patch(`/enterprise/candidates/${candidateId}/decision`, {
      decision,
      reason,
    });
    return response.data;
  },

  // ── Internship Evaluation ─────────────────────────────────────────────────
  // Gọi PUT /api/enterprise/internships/:id/evaluation (direct route)
  // internshipId = AssignmentID
  // LƯU Ý: API /api/json/enterprise/internships/evaluation (404) đang bị lỗi — KHÔNG GỌI
  evaluateInternship: async (internshipId: number, evaluationData: Record<string, unknown>): Promise<unknown> => {
    // Gọi trực tiếp endpoint REST (không qua JSON adapter vì đang 404)
    const response = await API.put(`/enterprise/internships/${internshipId}/evaluation`, evaluationData);
    return response.data;
  },
};

export default enterpriseService;
