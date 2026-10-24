import { API_ORIGIN } from "@/config/api";
import type { CurriculumDetailResponse, CurriculumImportPayload, CurriculumImportPreviewResponse, SearchCoursesPayload, SearchCoursesResponse, SearchCurriculaPayload, SearchCurriculaResponse, SearchMajorsPayload, SearchMajorsResponse } from '@/types/education/curriculum.types';
import { getJson } from "./educationApi";
const API_BASE_URL = API_ORIGIN;

/* =========================================================
   COMMON
   ========================================================= */

interface ApiErrorResponse {
  success?: boolean;
  errorCode?: string;
  message?: string;
}

const getAuthToken = () => {
  return localStorage.getItem("ojt_auth_token");
};

const requestJson = async <T>(
  path: string,
  method: "POST",
  body: unknown,
): Promise<T> => {
  const token = getAuthToken();

  if (!token) {
    throw new Error("Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,

    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },

    body: JSON.stringify(body),
  });

  const responseText = await response.text();

  let result: unknown = null;

  if (responseText) {
    try {
      result = JSON.parse(responseText);
    } catch {
      result = responseText;
    }
  }

  if (!response.ok) {
    const error =
      typeof result === "object" && result !== null
        ? (result as ApiErrorResponse)
        : null;

    if (response.status === 401) {
      throw new Error("Phiên đăng nhập đã hết hạn hoặc không hợp lệ.");
    }

    throw new Error(
      error?.message || `Yêu cầu không thành công (${response.status}).`,
    );
  }

  return result as T;
};

const postJson = <T>(path: string, body: unknown) => {
  return requestJson<T>(path, "POST", body);
};

/* =========================================================
   MAJOR
   ========================================================= */

/* =========================================================
   COURSE CATALOG
   ========================================================= */

/* =========================================================
   CURRICULUM SEARCH
   ========================================================= */

/* =========================================================
   CURRICULUM DETAIL
   ========================================================= */

/* =========================================================
   CURRICULUM IMPORT
   ========================================================= */

/* =========================================================
   API
   ========================================================= */

const searchMajors = (payload: SearchMajorsPayload) =>
  getJson<SearchMajorsResponse>(
    "/majors",
    payload as unknown as Record<string, unknown>,
  );
const searchCourses = (payload: SearchCoursesPayload) =>
  getJson<SearchCoursesResponse>(
    "/courses",
    payload as unknown as Record<string, unknown>,
  );
const searchCurricula = (payload: SearchCurriculaPayload) =>
  getJson<SearchCurriculaResponse>(
    "/curricula",
    payload as unknown as Record<string, unknown>,
  );
const getCurriculumDetail = (programId: number) =>
  getJson<CurriculumDetailResponse>(`/curricula/${programId}`);
const approvedImports = new Map<string, string>();
const previewCurriculumImport = async (payload: CurriculumImportPayload) => {
  approvedImports.delete(payload.idempotencyKey);
  const response = await postJson<CurriculumImportPreviewResponse>(
    "/api/curriculum-imports/preview",
    payload,
  );
  if (response.data.canCommit) {
    if (response.data.action !== "CREATE")
      throw new Error(
        "Mã chương trình đã tồn tại. Chỉ được import khung mới; không thay thế hoặc cập nhật khung đã nhập.",
      );
    approvedImports.set(payload.idempotencyKey, JSON.stringify(payload));
  }
  return response;
};
const commitCurriculumImport = (payload: CurriculumImportPayload) => {
  if (approvedImports.get(payload.idempotencyKey) !== JSON.stringify(payload))
    throw new Error("Cần kiểm tra và xác nhận một khung mới trước khi import.");
  return postJson<unknown>("/api/curriculum-imports/commit", payload);
};

/* =========================================================
   EXPORT
   ========================================================= */

export const curriculumService = {
  searchMajors,

  searchCourses,

  searchCurricula,
  getCurriculumDetail,

  previewCurriculumImport,
  commitCurriculumImport,
};
