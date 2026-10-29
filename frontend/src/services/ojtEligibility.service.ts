import { API_ORIGIN } from "@/config/api";
import type { AssessmentWindow, CreateOjtRuleSetPayload, EligibilityBatch, EligibilityCheck, OjtRuleSetMutationResponse, PublishOjtRuleSetPayload, PublishOjtRuleSetResponse, SearchOjtRuleSetsPayload, SearchOjtRuleSetsResponse, StudentEligibility, UpdateOjtRuleSetPayload } from '@/types/education/eligibility.types';
import { apiData, cleanQuery, getJson, getPage } from "./educationApi";
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

/* =========================================================
   CREATE RULE SET
   ========================================================= */

/* =========================================================
   SEARCH RULE SET
   ========================================================= */

/* =========================================================
   UPDATE RULE SET
   ========================================================= */

/* =========================================================
   PUBLISH RULE SET
   ========================================================= */

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
    "/api/ojt-rule-sets",
    { id: ruleSetId, ...payload },
  );
const publishRuleSet = ({ ruleSetId }: PublishOjtRuleSetPayload) =>
  patchJson<PublishOjtRuleSetResponse>(
    "/api/ojt-rule-sets",
    { id: ruleSetId, status: "PUBLISHED" },
  );

/* =========================================================
   EXPORT
   ========================================================= */

async function saveAssessmentWindow(semesterId: number, payload: { blockPeriodId: number; opensAt: string; closesAt: string; reason: string }) {
  const existing = await getPage<AssessmentWindow>("/assessment-windows", { ojtSemesterId: semesterId, page: 1, limit: 1 });
  return apiData<AssessmentWindow>(await requestJson("/api/assessment-windows", {
    method: existing.total ? "PATCH" : "POST",
    body: JSON.stringify({ ...payload, ...(existing.total ? { id: semesterId } : { ojtSemesterId: semesterId }) }),
  }));
}

export const ojtEligibilityService = {
  searchRuleSets,
  createRuleSet,
  updateRuleSet,
  publishRuleSet,
  getStudentEligibility: async (studentId: number, ojtSemesterId: number, signal?: AbortSignal) =>
    apiData<{ eligibility: StudentEligibility }>(await getJson(`/students/${studentId}`, { include: "eligibility", ojtSemesterId }, signal)).eligibility,
  history: async (studentId: number, ojtSemesterId: number, page = 1, signal?: AbortSignal) =>
    apiData<{ eligibilityChecks: import("@/types/education/api.types").Page<EligibilityCheck> }>(await getJson(`/students/${studentId}`, { include: "eligibilityChecks", ojtSemesterId, checksPage: page, checksLimit: 10 }, signal)).eligibilityChecks,
  checkBatch: async (payload: { ojtSemesterId: number; programIds?: number[]; studentIds?: number[]; idempotencyKey: string; confirmResults?: boolean }) =>
    apiData<EligibilityBatch>(await postJson('/api/eligibility-check-runs', payload)),
  assessment: async (semesterId: number, signal?: AbortSignal) =>
    (await getPage<AssessmentWindow>("/assessment-windows", { ojtSemesterId: semesterId, page: 1, limit: 1 }, signal)).items[0] ?? null,
  saveAssessment: async (semesterId: number, payload: { blockPeriodId: number; opensAt: string; closesAt: string; reason: string }) =>
    saveAssessmentWindow(semesterId, payload),
  openAssessment: async (semesterId: number, reason: string) =>
    apiData<AssessmentWindow>(await patchJson("/api/assessment-windows", { id: semesterId, status: "OPEN", reason, resultsFinalized: true })),
};

export default ojtEligibilityService;
