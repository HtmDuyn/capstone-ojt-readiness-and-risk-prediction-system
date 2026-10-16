const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://capstone-ojt-readiness-and-risk.onrender.com";

const TOKEN_KEY = "ojt_auth_token";

/* =========================================================
   COMMON
   ========================================================= */

interface ApiErrorResponse {
  success?: boolean;
  errorCode?: string;
  message?: string;
  data?: unknown;
}

export class OjtRegistrationWindowApiError extends Error {
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

    this.name = "OjtRegistrationWindowApiError";
    this.status = status;
    this.errorCode = errorCode;
    this.data = data;
  }
}

const getAuthToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

const requestJson = async <T>(
  path: string,
  method: "POST" | "PATCH",
  body: unknown,
): Promise<T> => {
  const token = getAuthToken();

  if (!token) {
    throw new Error(
      "Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.",
    );
  }

  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    },
  );

  const responseText =
    await response.text();

  let result: unknown = null;

  if (responseText) {
    try {
      result =
        JSON.parse(responseText);
    } catch {
      result = responseText;
    }
  }

  if (!response.ok) {
    const error =
      typeof result === "object" &&
      result !== null
        ? (result as ApiErrorResponse)
        : null;

    throw new OjtRegistrationWindowApiError(
      error?.message ||
        `Yêu cầu không thành công (${response.status}).`,
      response.status,
      error?.errorCode,
      error?.data,
    );
  }

  return result as T;
};

const postJson = <T>(
  path: string,
  body: unknown,
) =>
  requestJson<T>(
    path,
    "POST",
    body,
  );

/* =========================================================
   TYPES
   ========================================================= */

export interface OjtRegistrationWindowScope {
  programIds?: number[];
  cohortIds?: number[];
  majorIds?: number[];
  studentIds?: number[];
  groupCodes?: string[];
}

export interface CreateOjtRegistrationWindowPayload {
  ojtSemesterId: number;

  name: string;

  scope: OjtRegistrationWindowScope;

  startsAt: string;
  endsAt: string;

  reason: string;

  academicPeriodId: number;

  requiredRelativeSemester: number;
}

export interface SearchOjtRegistrationWindowsPayload {
  ojtSemesterId: number;

  status?: string;

  page: number;
  limit: number;
}

export interface OpenOjtRegistrationWindowPayload {
  reason: string;

  windowId: number;
}
export interface CloseOjtRegistrationWindowPayload {
  reason: string;
  windowId: number;
}
export type OjtRegistrationWindowStatus =
  | "DRAFT"
  | "OPEN"
  | "CLOSED"
  | string;

export interface OjtRegistrationWindow {
  id: number;

  ojtSemesterId: number;
  academicPeriodId: number;

  requiredRelativeSemester: number;

  name: string;

  scope: OjtRegistrationWindowScope;

  startsAt: string;
  endsAt: string;

  status: OjtRegistrationWindowStatus;

  createdBy: number | null;
  createdAt: string;

  updatedAt: string;

  openedBy: number | null;
  openedAt: string | null;

  closedBy: number | null;
  closedAt: string | null;
}

export interface OjtRegistrationWindowMutationResponse {
  success: boolean;

  data: OjtRegistrationWindow;
}

export interface SearchOjtRegistrationWindowsResponse {
  success: boolean;

  data: {
    items: OjtRegistrationWindow[];

    total: number;
    page: number;
    limit: number;
  };
}

/* =========================================================
   API
   ========================================================= */

const createWindow = (
  payload: CreateOjtRegistrationWindowPayload,
) => {
  return postJson<OjtRegistrationWindowMutationResponse>(
    "/api/ojt-registration-windows",
    payload,
  );
};

const searchWindows = (
  payload: SearchOjtRegistrationWindowsPayload,
) => {
  return postJson<SearchOjtRegistrationWindowsResponse>(
    "/api/json/ojt-registration-windows/search",
    payload,
  );
};

const openWindow = (
  payload: OpenOjtRegistrationWindowPayload,
) => {
  return postJson<OjtRegistrationWindowMutationResponse>(
    "/api/json/ojt-registration-windows/open",
    payload,
  );
};
const closeWindow = (
  payload: CloseOjtRegistrationWindowPayload,
) => {
  return postJson<OjtRegistrationWindowMutationResponse>(
    "/api/json/ojt-registration-windows/close",
    payload,
  );
};

/* =========================================================
   EXPORT
   ========================================================= */

export const ojtRegistrationWindowService = {
  createWindow,
  searchWindows,
  openWindow,
  closeWindow,
};

export default ojtRegistrationWindowService;