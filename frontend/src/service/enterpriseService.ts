import API from './api';
import { EnterpriseProfileResponse } from '@/types/enterprise/enterpriseTypes';
import { UpdateProfileRequest, UpdateProfileResponse } from './authService';

// ─── Shared Types ────────────────────────────────────────────
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

// ─── Recruitment Window Types ────────────────────────────────
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

// ─── Recruitment Post Types ──────────────────────────────────
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

// ─── Enterprise Candidate Types ──────────────────────────────
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

// ─── Enterprise Internship Types ─────────────────────────────
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
  student?: {
    studentCode?: string;
    fullName?: string;
  } | null;
}

// ─── Service ─────────────────────────────────────────────────
export const enterpriseService = {
  // ── Profile ──────────────────────────────────────────────
  getProfile: async (): Promise<EnterpriseProfileResponse> => {
    const response = await API.get<EnterpriseProfileResponse>('/enterprise/profile');
    return response.data;
  },

  updateAccountProfile: async (data: UpdateProfileRequest): Promise<UpdateProfileResponse> => {
    const response = await API.patch('/accounts/me/profile', data);
    return response.data as UpdateProfileResponse;
  },

  // ── Recruitment Windows (JSON Input) ─────────────────────
  listRecruitmentWindows: async (params: PaginatedRequest = { page: 1, limit: 20 }): Promise<PaginatedResponse<RecruitmentWindow>> => {
    const response = await API.post<PaginatedResponse<RecruitmentWindow>>(
      '/json/recruitment/windows/list',
      { page: params.page ?? 1, limit: params.limit ?? 20, ...params }
    );
    return response.data;
  },

  // ── Recruitment Posts (JSON Input) ───────────────────────
  listRecruitmentPosts: async (params: PaginatedRequest = { page: 1, limit: 20 }): Promise<PaginatedResponse<RecruitmentPost>> => {
    const response = await API.post<PaginatedResponse<RecruitmentPost>>(
      '/json/recruitment/posts/list',
      { page: params.page ?? 1, limit: params.limit ?? 20, ...params }
    );
    return response.data;
  },

  // ── Enterprise Candidates (JSON Input) ──────────────────
  listCandidates: async (params: PaginatedRequest = { page: 1, limit: 20 }): Promise<PaginatedResponse<EnterpriseCandidateItem>> => {
    const response = await API.post<PaginatedResponse<EnterpriseCandidateItem>>(
      '/json/enterprise/candidates/list',
      { page: params.page ?? 1, limit: params.limit ?? 20, ...params }
    );
    return response.data;
  },

  // ── Enterprise Internships (JSON Input) ─────────────────
  listInternships: async (params: PaginatedRequest = { page: 1, limit: 20 }): Promise<PaginatedResponse<EnterpriseInternshipItem>> => {
    const response = await API.post<PaginatedResponse<EnterpriseInternshipItem>>(
      '/json/enterprise/internships/list',
      { page: params.page ?? 1, limit: params.limit ?? 20, ...params }
    );
    return response.data;
  },

  listInternshipTasks: async (params: PaginatedRequest = { page: 1, limit: 100 }): Promise<PaginatedResponse<EnterpriseInternshipTask>> => {
    const response = await API.get<PaginatedResponse<EnterpriseInternshipTask>>(
      '/internship-tasks',
      { params: { page: params.page ?? 1, limit: params.limit ?? 100, ...params } }
    );
    return response.data;
  },

  // ── Candidate Decision (JSON Input) ─────────────────────
  decideCandidate: async (candidateId: number, decision: 'ACCEPTED' | 'REJECTED', reason: string): Promise<unknown> => {
    const response = await API.post('/json/enterprise/candidates/decision', {
      candidateId,
      decision,
      reason,
    });
    return response.data;
  },

  // ── Internship Evaluation (JSON Input) ──────────────────
  evaluateInternship: async (internshipId: number, evaluationData: Record<string, unknown>): Promise<unknown> => {
    const response = await API.put(`/json/enterprise/internships/evaluation`, {
      internshipId,
      ...evaluationData,
    });
    return response.data;
  },
};

export default enterpriseService;
