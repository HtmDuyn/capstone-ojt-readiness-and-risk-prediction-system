import { getAllItems } from "./educationApi";
import { API_ORIGIN } from "./apiConfig";

const API_BASE_URL = API_ORIGIN;

// ======================================================
// TYPES - ACADEMIC YEAR
// ======================================================

export type AcademicYearStatus = "PLANNED" | "ACTIVE" | "COMPLETED" | "CLOSED";

export interface CreateAcademicYearPayload {
  yearCode: string;
  startDate: string;
  endDate: string;
  status: AcademicYearStatus;
}

export interface AcademicYear {
  id: number;
  yearCode: string;
  startDate: string;
  endDate: string;
  status: AcademicYearStatus;
}

// ======================================================
// TYPES - ACADEMIC PERIOD
// ======================================================

export type AcademicPeriodKind = "SEMESTER" | "BLOCK3";

export type AcademicPeriodStatus =
  "PLANNED" | "ACTIVE" | "COMPLETED" | "CLOSED" | "ARCHIVED";

export interface CreateAcademicPeriodPayload {
  academicYearId: number;
  periodCode: string;
  name: string;
  kind: AcademicPeriodKind;
  startDate: string;
  endDate: string;
  status?: AcademicPeriodStatus;
}

export interface AcademicPeriod {
  id: number;
  academicYearId: number;
  periodCode: string;
  name: string;
  kind: AcademicPeriodKind;
  parentPeriodId: number | null;
  startDate: string;
  endDate: string;
  status: AcademicPeriodStatus;
}

// PATCH chỉ gửi trường thực sự thay đổi.
// Không gửi lại toàn bộ AcademicPeriod.
export type UpdateAcademicPeriodPayload = Partial<
  Pick<
    AcademicPeriod,
    | "periodCode"
    | "name"
    | "kind"
    | "parentPeriodId"
    | "startDate"
    | "endDate"
    | "status"
  >
>;

export interface SearchAcademicPeriodsPayload {
  page: number;
  limit: number;
  academicYearId?: number;
  search?: string;
}

// ======================================================
// TYPES - OJT
// ======================================================

export interface OjtSemester {
  id: number;
  academicYearId: number;
  semesterCode: string;
  name: string;
  academicPeriodId: number | null;
  startDate: string;
  endDate: string;
  regStartDate: string | null;
  regEndDate: string | null;
  status: AcademicPeriodStatus;
}

export interface SearchOjtSemestersPayload {
  page: number;
  limit: number;
  search?: string;
  status?: AcademicPeriodStatus;
  academicYearId?: number;
}

// ======================================================
// RESPONSE TYPES
// ======================================================

interface ApiErrorResponse {
  success?: boolean;
  errorCode?: string;
  message?: string;
}

interface ListResponse<T> {
  success?: boolean;
  items: T[];
  page: number;
  limit: number;
  total: number;
  message?: string;
}

interface DataResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
}

// ======================================================
// COMMON HELPERS
// ======================================================

const getAuthToken = (): string => {
  const token = localStorage.getItem("ojt_auth_token");

  if (!token) {
    throw new Error("Không tìm thấy token đăng nhập. Vui lòng đăng nhập lại.");
  }

  return token;
};

const authorizedFetch = async (
  path: string,
  method: "GET" | "POST" | "PATCH",
  payload?: unknown,
): Promise<Response> => {
  const token = getAuthToken();

  return fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    ...(payload === undefined
      ? {}
      : {
          body: JSON.stringify(payload),
        }),
  });
};

const readJson = async <T>(response: Response): Promise<T> => {
  const text = await response.text();

  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Phản hồi từ máy chủ không đúng định dạng JSON.");
  }
};

const getErrorMessage = (
  status: number,
  error: ApiErrorResponse,
  fallback: string,
): string => {
  if (status === 401) {
    return "Phiên đăng nhập đã hết hạn hoặc không hợp lệ.";
  }

  if (status === 403) {
    return "Bạn không có quyền thực hiện thao tác này.";
  }

  if (error.errorCode === "ACADEMIC_CALENDAR_CONFLICT") {
    return (
      "Thời gian kỳ học bị trùng với kỳ học " +
      "đã tồn tại trong hệ thống, bao gồm cả Block 3. " +
      "Vui lòng kiểm tra lại lịch học."
    );
  }

  if (error.errorCode === "ACADEMIC_DUPLICATE") {
    return "Dữ liệu năm học hoặc kỳ học đã tồn tại trong hệ thống.";
  }

  if (status === 409) {
    return error.message || "Dữ liệu bị xung đột với thông tin đã tồn tại.";
  }

  return error.message || fallback;
};

const checkResponse = (
  response: Response,
  result: ApiErrorResponse,
  fallback: string,
): void => {
  if (!response.ok || result.success === false) {
    throw new Error(getErrorMessage(response.status, result, fallback));
  }
};

// ======================================================
// COMMON PAGINATED LIST API
// GET danh sách tài nguyên, phân trang qua query parameters
// ======================================================

const fetchAllListItems = <T>(endpoint: string): Promise<T[]> =>
  getAllItems<T>(endpoint);

// ======================================================
// ACADEMIC YEAR
// ======================================================

// Giữ API đang hoạt động tốt.
const searchAcademicYears = (): Promise<AcademicYear[]> => {
  return fetchAllListItems<AcademicYear>("/academic-years");
};

const createAcademicYear = async (
  payload: CreateAcademicYearPayload,
): Promise<AcademicYear> => {
  const response = await authorizedFetch(
    "/api/academic-years",
    "POST",
    payload,
  );

  const result = await readJson<DataResponse<AcademicYear> & ApiErrorResponse>(
    response,
  );

  checkResponse(response, result, "Không thể tạo năm học.");

  if (!result.data) {
    throw new Error(
      "Máy chủ đã xử lý yêu cầu nhưng không trả về thông tin năm học.",
    );
  }

  return result.data;
};

// ======================================================
// ACADEMIC PERIOD - LIST
// Giữ API danh sách đang hoạt động.
// ======================================================

const listAllAcademicPeriods = (): Promise<AcademicPeriod[]> => {
  return fetchAllListItems<AcademicPeriod>("/academic-periods");
};

// ======================================================
// ACADEMIC PERIOD - SEARCH
// GET /api/academic-periods
// ======================================================

const searchAcademicPeriods = async (
  payload: SearchAcademicPeriodsPayload,
): Promise<AcademicPeriod[]> => {
  const params = new URLSearchParams();

  params.set("page", String(payload.page));

  params.set("limit", String(payload.limit));

  if (payload.academicYearId !== undefined) {
    params.set("academicYearId", String(payload.academicYearId));
  }

  if (payload.search) {
    params.set("search", payload.search);
  }

  const response = await authorizedFetch(
    `/api/academic-periods?${params.toString()}`,
    "GET",
  );

  const result = await readJson<ListResponse<AcademicPeriod>>(response);

  checkResponse(response, result, "Không thể tìm kiếm kỳ học.");

  if (!Array.isArray(result.items)) {
    throw new Error("Dữ liệu tìm kiếm kỳ học không hợp lệ.");
  }

  return result.items;
};

// Tìm chính xác kỳ theo academicYearId và periodCode.
//
// Không dùng includes() hoặc so khớp gần đúng.
// Nếu API tìm kiếm lỗi thì ném lỗi, không tự tạo mới.
const findAcademicPeriod = async (
  academicYearId: number,
  periodCode: string,
): Promise<AcademicPeriod | null> => {
  const limit = 20;

  for (let page = 1; page <= 100; page++) {
    const periods = await searchAcademicPeriods({
      page,
      limit,
      academicYearId,
      search: periodCode,
    });

    const exactPeriod = periods.find(
      (period) =>
        period.academicYearId === academicYearId &&
        period.periodCode === periodCode,
    );

    if (exactPeriod) {
      return exactPeriod;
    }

    if (periods.length < limit) {
      return null;
    }
  }

  throw new Error("Không thể kiểm tra hết danh sách kỳ học. Vui lòng thử lại.");
};

// ======================================================
// ACADEMIC PERIOD - CREATE
// POST /api/academic-periods
// ======================================================

const createAcademicPeriod = async (
  payload: CreateAcademicPeriodPayload,
): Promise<AcademicPeriod | undefined> => {
  const response = await authorizedFetch(
    "/api/academic-periods",
    "POST",
    payload,
  );

  const result = await readJson<
    DataResponse<AcademicPeriod> & ApiErrorResponse
  >(response);

  checkResponse(response, result, "Không thể tạo kỳ học.");

  // FE sẽ tải lại danh sách từ BE sau khi tạo.
  // Không bắt buộc response phải có data.
  return result.data;
};

// ======================================================
// ACADEMIC PERIOD - UPDATE
// PATCH /api/academic-periods/{id}
// ======================================================

const updateAcademicPeriod = async (
  academicPeriodId: number,
  payload: UpdateAcademicPeriodPayload,
): Promise<AcademicPeriod | undefined> => {
  if (!Number.isInteger(academicPeriodId) || academicPeriodId <= 0) {
    throw new Error("ID kỳ học không hợp lệ.");
  }

  if (Object.keys(payload).length === 0) {
    throw new Error("Không có thông tin nào cần cập nhật.");
  }

  const response = await authorizedFetch(
    `/api/academic-periods/${academicPeriodId}`,
    "PATCH",
    payload,
  );

  const result = await readJson<
    DataResponse<AcademicPeriod> & ApiErrorResponse
  >(response);

  checkResponse(response, result, "Không thể cập nhật kỳ học.");

  return result.data;
};

// ======================================================
// OJT SEMESTERS
// Giữ nguyên API hiện có.
// ======================================================

const searchOjtSemesters = async (
  payload: SearchOjtSemestersPayload,
): Promise<OjtSemester[]> => {
  const periods = await getAllItems<
    AcademicPeriod & { ojt?: OjtSemester | null }
  >("/academic-periods");
  const terms = periods
    .flatMap((p) => (p.ojt ? [p.ojt] : []))
    .filter(
      (t) =>
        (!payload.academicYearId ||
          t.academicYearId === payload.academicYearId) &&
        (!payload.status || t.status === payload.status) &&
        (!payload.search ||
          (t.name + " " + t.semesterCode)
            .toLowerCase()
            .includes(payload.search.toLowerCase())),
    );
  const unique = [...new Map(terms.map((t) => [t.id, t])).values()];
  return unique.slice(
    (payload.page - 1) * payload.limit,
    payload.page * payload.limit,
  );
};

// ======================================================
// EXPORT
// ======================================================

export const academicService = {
  createAcademicYear,
  searchAcademicYears,

  createAcademicPeriod,
  searchAcademicPeriods,
  findAcademicPeriod,
  listAllAcademicPeriods,
  updateAcademicPeriod,

  searchOjtSemesters,
};
