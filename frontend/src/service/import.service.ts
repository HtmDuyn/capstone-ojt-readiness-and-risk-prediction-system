import { API_ORIGIN } from "./apiConfig";

const API_BASE_URL = API_ORIGIN;

export type CourseResultStatus =
  "PASSED" | "FAILED" | "IN_PROGRESS" | "WITHDRAWN" | "RECOGNIZED";

export interface StudentCourseResult {
  courseCode: string;
  academicPeriodId: number;
  status: CourseResultStatus;
  score?: number;
  gradePoints?: number;
  grade?: string;
  attemptNumber?: number;
  sourceReference?: string;
}

export interface StudentPlacement {
  cohortId: number;
  groupCode: "A" | "B" | "C" | "D";
  currentAcademicPeriodId: number;
}

export interface StudentAcademicData {
  programId: number;
  phone?: string;
  className?: string;
  placement: StudentPlacement;
  courseResults: StudentCourseResult[];
}

export interface StudentImportRow {
  code: string;
  email: string;
  fullName: string;
  academic: StudentAcademicData;
}

export interface StudentImportPayload {
  kind: "STUDENT";
  idempotencyKey: string;
  rows: StudentImportRow[];
}

export interface ImportPreviewRow {
  rowNumber: number;
  code?: string;
  action?: string;
  message?: string;
  errors?: string[];
}

export interface ImportPreviewResponse {
  success: boolean;
  created: number;
  updated: number;
  total: number;
  preview: boolean;
  rows: ImportPreviewRow[];
}

export interface ImportCommitResponse {
  success: boolean;
  created: number;
  updated: number;
  total: number;
  batchId?: string;
  academicImportId?: string;
  replayed?: boolean;
}

type ApiErrorResponse = {
  success?: boolean;
  errorCode?: string;
  message?: string;
};

const sendImportRequest = async <T>(
  endpoint: string,
  payload: StudentImportPayload,
  fallbackError: string,
): Promise<T> => {
  const token = localStorage.getItem("ojt_auth_token");

  if (!token) {
    throw new Error("Không tìm thấy token đăng nhập. Vui lòng đăng nhập lại.");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  let result: unknown;

  try {
    result = await response.json();
  } catch {
    throw new Error(
      `Backend trả về dữ liệu không hợp lệ (HTTP ${response.status}).`,
    );
  }

  const body =
    result !== null && typeof result === "object" && !Array.isArray(result)
      ? (result as ApiErrorResponse)
      : null;

  if (response.status === 401) {
    throw new Error("Phiên đăng nhập đã hết hạn hoặc không hợp lệ.");
  }

  if (response.status === 403) {
    throw new Error("Tài khoản không có quyền thực hiện chức năng này.");
  }

  if (response.status === 404) {
    throw new Error(
      `API ${endpoint} chưa có trên Backend đang deploy (HTTP 404). ` +
        "Kiểm tra nhánh đã merge và phiên bản Render.",
    );
  }

  if (!response.ok || body?.success === false) {
    throw new Error(
      body?.message || `${fallbackError} (HTTP ${response.status}).`,
    );
  }

  if (!body) {
    throw new Error("Backend trả về cấu trúc kết quả không hợp lệ.");
  }

  return result as T;
};

export const importService = {
  previewStudentImport: (payload: StudentImportPayload) =>
    sendImportRequest<ImportPreviewResponse>(
      "/api/imports/preview",
      payload,
      "Không thể kiểm tra dữ liệu sinh viên",
    ),

  commitStudentImport: (payload: StudentImportPayload) =>
    sendImportRequest<ImportCommitResponse>(
      "/api/imports/commit",
      payload,
      "Không thể nhập dữ liệu sinh viên",
    ),
};
