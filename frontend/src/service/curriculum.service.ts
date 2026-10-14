const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://capstone-ojt-readiness-and-risk.onrender.com";

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
  method: "POST" | "PUT" | "PATCH",
  body: unknown,
): Promise<T> => {
  const token = getAuthToken();

  if (!token) {
    throw new Error(
      "Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.",
    );
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
      throw new Error(
        "Phiên đăng nhập đã hết hạn hoặc không hợp lệ.",
      );
    }

    throw new Error(
      error?.message ||
        `Yêu cầu không thành công (${response.status}).`,
    );
  }

  return result as T;
};

const postJson = <T>(
  path: string,
  body: unknown,
) => {
  return requestJson<T>(
    path,
    "POST",
    body,
  );
};

const putJson = <T>(
  path: string,
  body: unknown,
) => {
  return requestJson<T>(
    path,
    "PUT",
    body,
  );
};

/* =========================================================
   MAJOR
   ========================================================= */

export interface Major {
  id: number;
  code: string;
  name: string;

  parentMajorId: number | null;
  parentMajorCode: string | null;
  parentMajorName: string | null;
}

export interface SearchMajorsPayload {
  page: number;
  limit: number;
  search: string;

  parentMajorId?: number;
}

export interface SearchMajorsResponse {
  success: boolean;

  data: {
    total: number;
    items: Major[];
    page: number;
    limit: number;
  };
}

/* =========================================================
   COURSE CATALOG
   ========================================================= */

export interface CourseCatalogItem {
  id: number;

  code: string;
  name: string;

  defaultCredits: number | null;

  isOjtPrerequisite: boolean;
}

export interface SearchCoursesPayload {
  page: number;
  limit: number;
  search: string;
}

export interface SearchCoursesResponse {
  success: boolean;

  data: {
    total: number;
    items: CourseCatalogItem[];
    page: number;
    limit: number;
  };
}

export interface CreateCoursePayload {
  code: string;
  name: string;

  defaultCredits: number;

  isOjtPrerequisite: boolean;
}

/* =========================================================
   CURRICULUM SEARCH
   ========================================================= */

export interface CurriculumSummary {
  id: number;

  code: string;
  name: string;

  status: string;

  majorId: number;
  majorName: string;

  version: string | null;
  gpaScale: number | null;

  createdAt: string | null;
  createdBy: number | null;

  updatedAt: string | null;

  publishedAt: string | null;
  publishedBy: number | null;

  retakePolicy: string | null;

  totalCredits: number;

  effectiveYear: number | null;

  equivalencesReviewed: boolean;
  prerequisitesReviewed: boolean;
}

export interface SearchCurriculaPayload {
  page: number;
  limit: number;
  search: string;

  majorId: number;

  status?: string;
  version?: string;
}

export interface SearchCurriculaResponse {
  success: boolean;

  data: {
    total: number;
    items: CurriculumSummary[];
    page: number;
    limit: number;
  };
}

/* =========================================================
   CURRICULUM DETAIL
   ========================================================= */

export type CurriculumEntryKind =
  | "COURSE"
  | "COMBO_SLOT"
  | "ELECTIVE_SLOT"
  | string;

export interface CurriculumCourse {
  id: number;

  courseId: number;
  courseCode: string;

  name: string;

  credits: number;
  semester: number;

  isRequired: boolean | null;

  entryKind: CurriculumEntryKind;

  prerequisiteText: string;
}

export interface ComboCourse {
  id: number;

  courseId: number;
  courseCode: string;

  name: string;

  note: string;

  credits: number | null;
  semester: number;

  slotCourseIds: number[];

  prerequisiteText: string;
}

export interface ComboChoiceGroup {
  code: string;

  minCourses: number;
  maxCourses: number;

  courseIds: number[];
}

export interface CurriculumCombo {
  id: number;

  code: string;
  name: string;

  selectionGroup: string | null;
  note: string;

  coursesReviewed: boolean;

  courses: ComboCourse[];

  choiceGroups: ComboChoiceGroup[];
}

export interface CurriculumDetail {
  id: number;

  code: string;
  name: string;

  version: string | null;

  majorId: number;
  majorName: string;

  totalCredits: number;

  effectiveYear: number | null;

  status: string;

  prerequisitesReviewed: boolean;
  equivalencesReviewed: boolean;

  createdBy: number | null;
  createdAt: string | null;

  updatedAt: string | null;

  publishedBy: number | null;
  publishedAt: string | null;

  gpaScale: number | null;
  retakePolicy: string | null;

  courses: CurriculumCourse[];

  prerequisites: unknown[];

  combos: CurriculumCombo[];

  equivalences: unknown[];
}

export interface CurriculumDetailResponse {
  success: boolean;

  data: CurriculumDetail;
}

/* =========================================================
   UPDATE CURRICULUM COURSES
   ========================================================= */

export interface UpdateCurriculumCourseItem {
  courseId: number;

  credits: number;
  semester: number;

  isRequired: boolean;

  entryKind: CurriculumEntryKind;

  prerequisiteText: string;
}

export interface UpdateCurriculumCoursesPayload {
  courses: UpdateCurriculumCourseItem[];

  programId: number;
}

/* =========================================================
   CURRICULUM COMBOS
   ========================================================= */

export interface CreateCurriculumComboPayload {
  code: string;
  name: string;

  selectionGroup: string | null;
  note: string | null;

  programId: number;
}

export interface SearchCurriculumCombosPayload {
  programId: number;
}

export interface SearchCurriculumCombosResponse {
  success: boolean;

  data: CurriculumCombo[];
}

/* =========================================================
   UPDATE COMBO COURSES
   ========================================================= */

export interface UpdateComboCourseItem {
  /*
   * Backend yêu cầu đúng một trong hai:
   * courseId hoặc courseCode.
   *
   * FE dùng courseId.
   */
  courseId: number;

  credits: number;
  semester: number;

  prerequisiteText: string | null;
  note: string | null;

  /*
   * Đây là CourseID của COMBO_SLOT
   * trong curriculum.
   */
  slotCourseIds: number[];
}

export interface UpdateComboChoiceGroupItem {
  code: string;

  minCourses: number;
  maxCourses: number;

  courseIds: number[];
}

export interface UpdateComboCoursesPayload {
  courses: UpdateComboCourseItem[];

  /*
   * Backend bắt buộc field này.
   * Combo thường hiện tại chưa có choice group
   * nên FE gửi [].
   */
  choiceGroups: UpdateComboChoiceGroupItem[];

  comboId: number;
}

/* =========================================================
   API
   ========================================================= */

const searchMajors = (
  payload: SearchMajorsPayload,
) => {
  return postJson<SearchMajorsResponse>(
    "/api/json/majors/search",
    payload,
  );
};

const searchCourses = (
  payload: SearchCoursesPayload,
) => {
  return postJson<SearchCoursesResponse>(
    "/api/json/courses/search",
    payload,
  );
};

const createCourse = (
  payload: CreateCoursePayload,
) => {
  return postJson<unknown>(
    "/api/courses",
    payload,
  );
};

const searchCurricula = (
  payload: SearchCurriculaPayload,
) => {
  return postJson<SearchCurriculaResponse>(
    "/api/json/curricula/search",
    payload,
  );
};

const getCurriculumDetail = (
  programId: number,
) => {
  return postJson<CurriculumDetailResponse>(
    "/api/json/curricula/detail",
    {
      programId,
    },
  );
};

const updateCurriculumCourses = (
  payload: UpdateCurriculumCoursesPayload,
) => {
  return putJson<unknown>(
    "/api/json/curricula/courses",
    payload,
  );
};

const createCurriculumCombo = (
  payload: CreateCurriculumComboPayload,
) => {
  return postJson<unknown>(
    "/api/json/curricula/combos",
    payload,
  );
};

const searchCurriculumCombos = (
  payload: SearchCurriculumCombosPayload,
) => {
  return postJson<SearchCurriculumCombosResponse>(
    "/api/json/curricula/combos/search",
    payload,
  );
};

const updateComboCourses = (
  payload: UpdateComboCoursesPayload,
) => {
  return putJson<unknown>(
    "/api/json/combos/courses",
    payload,
  );
};

/* =========================================================
   EXPORT
   ========================================================= */

export const curriculumService = {
  searchMajors,

  searchCourses,
  createCourse,

  searchCurricula,
  getCurriculumDetail,
  updateCurriculumCourses,

  createCurriculumCombo,
  searchCurriculumCombos,
  updateComboCourses,
};