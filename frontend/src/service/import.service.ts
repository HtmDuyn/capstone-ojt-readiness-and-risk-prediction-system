
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "https://capstone-ojt-readiness-and-risk.onrender.com"
).replace(/\/+$/, "");

/* =========================================================
   STUDENT IMPORT TYPES
   ========================================================= */

export interface StudentCourseResult {
  courseCode: string;
  academicPeriodId: number;
  status: string;
  score?: number;
  gradePoints?: number;
  grade?: string;
}

export interface StudentPlacement {
  cohortId?: number;
  groupCode?: string;
  currentAcademicPeriodId?: number;
}

export interface StudentAcademicData {
  programId?: number;
  placement?: StudentPlacement;
  courseResults?: StudentCourseResult[];
}

export interface StudentImportRow {
  code: string;
  email: string;
  fullName: string;
  academic?: StudentAcademicData;
}

export interface StudentImportPayload {
  kind: "STUDENT";
  idempotencyKey: string;
  rows: StudentImportRow[];
}

/* =========================================================
   PREVIEW RESPONSE
   ========================================================= */

export interface ImportPreviewRow {
  rowNumber: number;
  code: string;
  action: string;
}

export interface ImportPreviewResponse {
  success: boolean;
  created: number;
  updated: number;
  total: number;
  preview: boolean;
  rows: ImportPreviewRow[];
}

/* =========================================================
   COMMIT RESPONSE
   ========================================================= */

export interface ImportCommitResponse {
  success: boolean;
  created: number;
  updated: number;
  total: number;
  batchId: string;
  academicImportId: string;
  replayed: boolean;
}

/* =========================================================
   API ERROR
   ========================================================= */

interface ApiErrorResponse {
  success?: boolean;
  errorCode?: string;
  message?: string;
}

/* =========================================================
   AUTH
   ========================================================= */

const getAuthToken = (): string | null => {
  return localStorage.getItem("ojt_auth_token");
};

/* =========================================================
   SHARED REQUEST
   ========================================================= */

const sendImportRequest = async <T>(
  endpoint: string,
  payload: StudentImportPayload,
  fallbackError: string,
): Promise<T> => {
  const token = getAuthToken();

  if (!token) {
    throw new Error(
      "Không tìm thấy token đăng nhập. Vui lòng đăng nhập lại.",
    );
  }

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    },
  );

  let result: unknown;

  try {
    result = await response.json();
  } catch {
    throw new Error(
      `Backend trả về dữ liệu không hợp lệ (HTTP ${response.status}).`,
    );
  }

  const apiResult =
    result !== null &&
    typeof result === "object" &&
    !Array.isArray(result)
      ? (result as ApiErrorResponse)
      : null;

  if (response.status === 401) {
    throw new Error(
      "Phiên đăng nhập đã hết hạn hoặc không hợp lệ.",
    );
  }

  if (response.status === 403) {
    throw new Error(
      "Tài khoản không có quyền thực hiện chức năng này.",
    );
  }

  if (!response.ok || apiResult?.success === false) {
    if (response.status === 409) {
      throw new Error(
        apiResult?.message ||
          "Dữ liệu bị xung đột hoặc mã idempotency đã được sử dụng.",
      );
    }

    throw new Error(
      apiResult?.message ||
        `${fallbackError} (HTTP ${response.status}).`,
    );
  }

  if (
    result === null ||
    typeof result !== "object" ||
    Array.isArray(result)
  ) {
    throw new Error(
      "Backend trả về cấu trúc kết quả không hợp lệ.",
    );
  }

  return result as T;
};

/* =========================================================
   PREVIEW
   ========================================================= */

const previewStudentImport = (
  payload: StudentImportPayload,
): Promise<ImportPreviewResponse> => {
  return sendImportRequest<ImportPreviewResponse>(
    "/api/imports/preview",
    payload,
    "Không thể kiểm tra dữ liệu sinh viên",
  );
};

/* =========================================================
   COMMIT
   ========================================================= */

const commitStudentImport = (
  payload: StudentImportPayload,
): Promise<ImportCommitResponse> => {
  return sendImportRequest<ImportCommitResponse>(
    "/api/imports/commit",
    payload,
    "Không thể nhập dữ liệu sinh viên",
  );
};

/* =========================================================
   EXPORT
   ========================================================= */

export const importService = {
  previewStudentImport,
  commitStudentImport,
};
