import { getJson, cleanQuery, apiData, getPage } from "./educationApi";
import { API_ORIGIN } from "./apiConfig";
const API_BASE_URL = API_ORIGIN;

const TOKEN_KEY = "ojt_auth_token";

/* =========================================================
   COMMON
   ========================================================= */

export class OjtEligibilityApiError extends Error {
  status: number;
  errorCode?: string;
  data?: unknown;

  constructor(
    message: string,
    status: number,
    errorCode?: string,
    data?: unknown,
  ) {
    super(message);

    this.name = "OjtEligibilityApiError";
    this.status = status;
    this.errorCode = errorCode;
    this.data = data;
  }
}

const requestJson = async <T>(
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  const token = localStorage.getItem(TOKEN_KEY);

  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  let responseData: unknown = null;

  try {
    responseData = await response.json();
  } catch {
    responseData = null;
  }

  if (!response.ok) {
    const errorBody = responseData as {
      message?: string;
      errorCode?: string;
      data?: unknown;
    } | null;

    throw new OjtEligibilityApiError(
      errorBody?.message || `Request failed with status ${response.status}.`,
      response.status,
      errorBody?.errorCode,
      errorBody?.data,
    );
  }

  return responseData as T;
};

const postJson = <T>(path: string, body: unknown) =>
  requestJson<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });

const patchJson = <T>(path: string, body: unknown) =>
  requestJson<T>(path, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

/* =========================================================
   TYPES
   ========================================================= */

export type OjtRuleSetStatus = "DRAFT" | "PUBLISHED" | string;

export type OjtDebtBasis = "FAILED_ATTEMPTS" | string;

export interface OjtRuleSet {
  id: number;

  programId: number;

  ojtSemesterId: number | null;

  version: number;

  name: string;

  minCredits: number;

  maxUnpassedCourses: number;

  debtBasis: OjtDebtBasis;

  status: OjtRuleSetStatus;

  createdBy: number | null;

  createdAt: string;

  publishedBy: number | null;

  publishedAt: string | null;

  active?: boolean;
}

/* =========================================================
   CREATE RULE SET
   ========================================================= */

export interface CreateOjtRuleSetPayload {
  programId: number;

  ojtSemesterId: number | null;

  version: number;

  name: string;

  minCredits: number;

  maxUnpassedCourses: number;

  debtBasis: OjtDebtBasis;
}

export interface OjtRuleSetMutationResponse {
  success: boolean;

  data: OjtRuleSet;
}

/* =========================================================
   SEARCH RULE SET
   ========================================================= */

export interface SearchOjtRuleSetsPayload {
  programId?: number;

  ojtSemesterId?: number;

  status?: string;

  page: number;

  limit: number;
}

export interface SearchOjtRuleSetsResponse {
  success: boolean;

  data: {
    items: OjtRuleSet[];

    total: number;

    page: number;

    limit: number;
  };
}

/* =========================================================
   UPDATE RULE SET
   ========================================================= */

export interface UpdateOjtRuleSetPayload {
  programId: number;

  ojtSemesterId: number | null;

  version: number;

  name: string;

  minCredits: number;

  maxUnpassedCourses: number;

  debtBasis: OjtDebtBasis;

  ruleSetId: number;
}

/* =========================================================
   PUBLISH RULE SET
   ========================================================= */

export interface PublishOjtRuleSetPayload {
  ruleSetId: number;
}

export interface PublishOjtRuleSetResponse {
  success: boolean;

  data?: OjtRuleSet | unknown;
}

/* =========================================================
   API METHODS
   ========================================================= */

const searchRuleSets = (payload: SearchOjtRuleSetsPayload) =>
  getJson<SearchOjtRuleSetsResponse>(
    "/ojt-rule-sets",
    cleanQuery({
      ...payload,
      ...(payload.status === "ALL" ? { status: undefined } : {}),
    }),
  );

const createRuleSet = (payload: CreateOjtRuleSetPayload) =>
  postJson<OjtRuleSetMutationResponse>("/api/ojt-rule-sets", payload);

const updateRuleSet = ({ ruleSetId, ...payload }: UpdateOjtRuleSetPayload) =>
  patchJson<OjtRuleSetMutationResponse>(
    `/api/ojt-rule-sets/${ruleSetId}`,
    payload,
  );
const publishRuleSet = ({ ruleSetId }: PublishOjtRuleSetPayload) =>
  postJson<PublishOjtRuleSetResponse>(
    `/api/ojt-rule-sets/${ruleSetId}/publish`,
    {},
  );

/* =========================================================
   EXPORT
   ========================================================= */

export type EligibilityStatus = 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'REVIEW_REQUIRED';
export interface EligibilityEvaluation {
  studentId: number;
  ojtSemesterId: number;
  status: EligibilityStatus;
  rule: OjtRuleSet | null;
  earnedCredits: number;
  missingCredits: number | null;
  unpassedCourseCount: number;
  unpassedCourses: { courseId: number; courseCode: string }[];
  excessUnpassedCourses: number | null;
  reasons: string[];
  academicIssues: string[];
}
export interface EligibilityCheck extends EligibilityEvaluation {
  studentCode?: string;
  fullName?: string;
  checkId: number;
  checkedAt: string;
  isStale?: boolean;
  confirmedAt?: string | null;
  confirmation?: { confirmedAt: string; reason: string } | null;
}
export interface StudentEligibility {
  current: EligibilityEvaluation;
  latest: EligibilityCheck | null;
  official: EligibilityCheck | null;
}
export interface EligibilityBatch {
  runId: number;
  total: number;
  eligible: number;
  notEligible: number;
  reviewRequired: number;
  items: EligibilityCheck[];
  replayed: boolean;
}
export interface AssessmentWindow {
  BlockPeriodID: number;
  OpensAt: string;
  ClosesAt: string;
  Status: 'DRAFT' | 'OPEN' | 'CLOSED';
  ResultsFinalizedAt: string | null;
}
export type EligibilityFilter = 'ALL' | EligibilityStatus;
export function filterEligibilityResults(items: EligibilityCheck[], status: EligibilityFilter, search: string) {
  const query = search.trim().toLocaleLowerCase('vi-VN');
  return items.filter(item => (status === 'ALL' || item.status === status) &&
    (!query || `${item.studentCode ?? ''} ${item.fullName ?? ''} ${item.studentId}`.toLocaleLowerCase('vi-VN').includes(query)));
}
export const eligibilityStatusLabel = (status: string) => ({
  ELIGIBLE: 'Đủ điều kiện', NOT_ELIGIBLE: 'Không đủ điều kiện', REVIEW_REQUIRED: 'Cần đối soát',
}[status] ?? status);
export const eligibilityReasonLabel = (reason: string) => ({
  OJT_RULE_NOT_PUBLISHED: 'Chưa có điều kiện OJT được áp dụng cho chương trình.',
  ACADEMIC_CREDIT_DATA_INCOMPLETE: 'Dữ liệu tín chỉ hoặc khung chương trình chưa đầy đủ.',
  STUDENT_NOT_ACTIVE: 'Sinh viên hoặc tài khoản không ở trạng thái hoạt động.',
  MIN_CREDITS_NOT_MET: 'Chưa đạt số tín chỉ yêu cầu.',
  MAX_UNPASSED_COURSES_EXCEEDED: 'Vượt số môn còn rớt cho phép.',
}[reason] ?? reason);

export const ojtEligibilityService = {
  searchRuleSets,
  createRuleSet,
  updateRuleSet,
  publishRuleSet,
  getStudentEligibility: async (studentId: number, ojtSemesterId: number, signal?: AbortSignal) =>
    apiData<StudentEligibility>(await getJson(`/students/${studentId}/eligibility`, { ojtSemesterId }, signal)),
  history: (studentId: number, ojtSemesterId: number, page = 1, signal?: AbortSignal) =>
    getPage<EligibilityCheck>(`/students/${studentId}/eligibility-checks`, { ojtSemesterId, page, limit: 10 }, signal),
  checkBatch: async (payload: { ojtSemesterId: number; programIds?: number[]; studentIds?: number[]; idempotencyKey: string }) =>
    apiData<EligibilityBatch>(await postJson('/api/eligibility-check-runs', payload)),
  assessment: async (semesterId: number, signal?: AbortSignal) =>
    apiData<AssessmentWindow>(await getJson(`/ojt-semesters/${semesterId}/assessment-window`, {}, signal)),
  saveAssessment: async (semesterId: number, payload: { blockPeriodId: number; opensAt: string; closesAt: string; reason: string }) =>
    apiData<AssessmentWindow>(await requestJson(`/api/ojt-semesters/${semesterId}/assessment-window`, { method: 'PUT', body: JSON.stringify(payload) })),
  openAssessment: async (semesterId: number, reason: string) =>
    apiData<AssessmentWindow>(await postJson(`/api/ojt-semesters/${semesterId}/assessment-window/open`, { reason, resultsFinalized: true })),
};

export default ojtEligibilityService;
