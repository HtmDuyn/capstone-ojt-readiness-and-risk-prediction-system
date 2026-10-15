const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://capstone-ojt-readiness-and-risk.onrender.com";

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
    headers.set(
      "Authorization",
      `Bearer ${token}`,
    );
  }

  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      headers,
    },
  );

  let responseData: unknown = null;

  try {
    responseData =
      await response.json();
  } catch {
    responseData = null;
  }

  if (!response.ok) {
    const errorBody =
      responseData as
        | {
            message?: string;
            errorCode?: string;
            data?: unknown;
          }
        | null;

    throw new OjtEligibilityApiError(
      errorBody?.message ||
        `Request failed with status ${response.status}.`,
      response.status,
      errorBody?.errorCode,
      errorBody?.data,
    );
  }

  return responseData as T;
};

const postJson = <T>(
  path: string,
  body: unknown,
) =>
  requestJson<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });

const patchJson = <T>(
  path: string,
  body: unknown,
) =>
  requestJson<T>(path, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

/* =========================================================
   TYPES
   ========================================================= */

export type OjtRuleSetStatus =
  | "DRAFT"
  | "PUBLISHED"
  | string;

export type OjtDebtBasis =
  | "FAILED_ATTEMPTS"
  | string;

export interface OjtRuleSet {
  id: number;

  programId: number;

  ojtSemesterId: number;

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

  ojtSemesterId: number;

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

  ojtSemesterId: number;

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

const searchRuleSets = (
  payload: SearchOjtRuleSetsPayload,
) =>
  postJson<SearchOjtRuleSetsResponse>(
    "/api/json/ojt-rule-sets/search",
    payload,
  );

const createRuleSet = (
  payload: CreateOjtRuleSetPayload,
) =>
  postJson<OjtRuleSetMutationResponse>(
    "/api/ojt-rule-sets",
    payload,
  );

const updateRuleSet = (
  payload: UpdateOjtRuleSetPayload,
) =>
  patchJson<OjtRuleSetMutationResponse>(
    "/api/json/ojt-rule-sets",
    payload,
  );

const publishRuleSet = (
  payload: PublishOjtRuleSetPayload,
) =>
  postJson<PublishOjtRuleSetResponse>(
    "/api/json/ojt-rule-sets/publish",
    payload,
  );

/* =========================================================
   EXPORT
   ========================================================= */

export const ojtEligibilityService = {
  searchRuleSets,
  createRuleSet,
  updateRuleSet,
  publishRuleSet,
};

export default ojtEligibilityService;