const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://capstone-ojt-readiness-and-risk.onrender.com";

/* =========================================================
   TYPES
   ========================================================= */

export interface StudentImportRow {
  code: string;
  email: string;
  fullName: string;
}

export interface StudentImportPayload {
  kind: "STUDENT";
  idempotencyKey: string;
  rows: StudentImportRow[];
}

/* ===================== PREVIEW ===================== */

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

/* ===================== COMMIT ===================== */

export interface ImportCommitResponse {
  success: boolean;
  created: number;
  updated: number;
  total: number;
  batchId: string;
  academicImportId: string;
  replayed: boolean;
}

/* ===================== ERROR ===================== */

interface ApiErrorResponse {
  success?: boolean;
  errorCode?: string;
  message?: string;
}

/* =========================================================
   AUTH
   ========================================================= */

const getAuthToken = () => {
  return localStorage.getItem("ojt_auth_token");
};

/* =========================================================
   PREVIEW STUDENT IMPORT
   ========================================================= */

const previewStudentImport = async (
  payload: StudentImportPayload,
): Promise<ImportPreviewResponse> => {
  const token = getAuthToken();

  if (!token) {
    throw new Error(
      "Không tìm thấy token đăng nhập. Vui lòng đăng nhập lại.",
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/api/imports/preview`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify(payload),
    },
  );

  const result = (await response.json()) as
    | ImportPreviewResponse
    | ApiErrorResponse;

  if (!response.ok) {
    const error =
      result as ApiErrorResponse;

    if (response.status === 401) {
      throw new Error(
        "Phiên đăng nhập đã hết hạn hoặc không hợp lệ.",
      );
    }

    if (response.status === 409) {
      throw new Error(
        error.message ||
          "Mã idempotency đã được sử dụng.",
      );
    }

    throw new Error(
      error.message ||
        "Không thể kiểm tra dữ liệu sinh viên.",
    );
  }

  return result as ImportPreviewResponse;
};

/* =========================================================
   COMMIT STUDENT IMPORT
   ========================================================= */

const commitStudentImport = async (
  payload: StudentImportPayload,
): Promise<ImportCommitResponse> => {
  const token = getAuthToken();

  if (!token) {
    throw new Error(
      "Không tìm thấy token đăng nhập. Vui lòng đăng nhập lại.",
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/api/imports/commit`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify(payload),
    },
  );

  const result = (await response.json()) as
    | ImportCommitResponse
    | ApiErrorResponse;

  if (!response.ok) {
    const error =
      result as ApiErrorResponse;

    if (response.status === 401) {
      throw new Error(
        "Phiên đăng nhập đã hết hạn hoặc không hợp lệ.",
      );
    }

    if (response.status === 409) {
      throw new Error(
        error.message ||
          "Mã idempotency đã được sử dụng.",
      );
    }

    throw new Error(
      error.message ||
        "Không thể nhập dữ liệu sinh viên.",
    );
  }

  return result as ImportCommitResponse;
};

/* =========================================================
   EXPORT
   ========================================================= */

export const importService = {
  previewStudentImport,
  commitStudentImport,
};