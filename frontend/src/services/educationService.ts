import type { Page, Query } from '@/types/education/api.types';
import API, { API_ORIGIN } from './apiService';
import type { AcademicPeriod, AcademicYear, CreateAcademicPeriodPayload, CreateAcademicYearPayload, OjtSemester, SearchAcademicPeriodsPayload, SearchOjtSemestersPayload } from '@/types/education/academic.types';
import type { AcademicCalendar, SemesterDates } from '@/types/education/academic.types';
import type { Cohort, CourseDemand, DemandReport, ReportPeriod, ReportScope, RetakeClassReport } from '@/types/education/reporting.types';
import type { CurriculumDetailResponse, CurriculumImportPayload, CurriculumImportPreviewResponse, SearchCoursesPayload, SearchCoursesResponse, SearchCurriculaPayload, SearchCurriculaResponse, SearchMajorsPayload, SearchMajorsResponse } from '@/types/education/curriculum.types';
import type { CurriculumDetail } from '@/types/education/curriculum.types';
import type { AcademicCatalogs, CatalogOption } from '@/types/education/import.types';
import { dashboardSummary } from '@/utils/education/educationDashboardSummary';
import type { QueryParams } from '@/types/education/dashboard.types';
import type { SavedOjtEligibility } from '@/utils/education/savedOjtEligibility';
import { educationRead } from '../utils/education/educationReadCache';
import type { Handoff, OjtFinalResult } from '@/types/education/ojtWorkflow.types';
import type { ImportCommitResponse, ImportPreviewResponse, StudentImportPayload } from '@/types/education/import.types';
import type { ImportedStudent, ImportedStudentFilters, ImportedStudentProfile, StoredCourseResult, StudentImportBatch } from '@/types/education/import.types';
import { clearEducationReadCache } from '../utils/education/educationReadCache';
import type { Profile, LocalOjtResult } from '@/types/education/localEligibility.types';
import { calculateLocalOjtEligibility, type LocalOjtRule } from '@/utils/education/localOjtEligibility';
import { localOjtSavePayload } from '@/utils/education/localOjtSavePayload';
import type { AssessmentWindow, CreateOjtRuleSetPayload, EligibilityBatch, EligibilityCheck, OjtRuleSetMutationResponse, PublishOjtRuleSetPayload, PublishOjtRuleSetResponse, SearchOjtRuleSetsPayload, SearchOjtRuleSetsResponse, StudentEligibility, UpdateOjtRuleSetPayload } from '@/types/education/eligibility.types';
import type { OjtEligibilityStatus, StudentProgress, StudentSubject, SubjectStatus } from '@/types/education/studentProgress.types';
import { savedOjtProgressLabel } from '@/utils/education/savedOjtEligibility';

export const cleanQuery = (params: Query = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );
export async function getJson<T>(
  path: string,
  params: Query = {},
  signal?: AbortSignal,
  timeout = 30000,
): Promise<T> {
  return (await API.get<T>(path, { params: cleanQuery(params), signal, timeout })).data;
}
export function apiData<T>(response: unknown): T {
  const root = response as { success?: boolean; message?: string; data?: T };
  if (root?.success === false)
    throw new Error(root.message || "Yêu cầu không thành công.");
  return (root?.data ?? response) as T;
}
export async function getPage<T>(
  path: string,
  params: Query = {},
  signal?: AbortSignal,
): Promise<Page<T>> {
  const result = apiData<Page<T>>(await getJson(path, params, signal));
  if (!Array.isArray(result?.items))
    throw new Error("Backend trả danh sách không hợp lệ.");
  return result;
}
export async function getAllItems<T>(
  path: string,
  params: Query = {},
  signal?: AbortSignal,
): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; page <= 1000; page++) {
    const data = await getPage<T>(
      path,
      { ...params, page, limit: 100 },
      signal,
    );
    items.push(...data.items);
    if (items.length >= data.total || data.items.length === 0) return items;
  }
  throw new Error("Danh sách vượt giới hạn tải; hãy thu hẹp bộ lọc.");
}

const academicApiOrigin = API_ORIGIN;

// ======================================================
// TYPES - ACADEMIC YEAR
// ======================================================

// ======================================================
// TYPES - ACADEMIC PERIOD
// ======================================================

// PATCH chỉ gửi trường thực sự thay đổi.
// Không gửi lại toàn bộ AcademicPeriod.

// ======================================================
// TYPES - OJT
// ======================================================

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
  method: "GET" | "POST",
  payload?: unknown,
): Promise<Response> => {
  const token = getAuthToken();

  return fetch(`${academicApiOrigin}${path}`, {
    cache:'no-store',
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
): Promise<AcademicCalendar> => {
  return apiData<AcademicCalendar>((await API.post('/academic-years', payload)).data);
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
  getCalendar: async (id: number, signal?: AbortSignal) => apiData<AcademicCalendar>(await getJson(`/academic-years/${id}/calendar`, {}, signal)),
  updateCalendar: async (id: number, semesters: SemesterDates[], revision: string) =>
    apiData<AcademicCalendar>((await API.put(`/academic-years/${id}/calendar`, { semesters, revision })).data),
  createAcademicYear,
  searchAcademicYears,

  createAcademicPeriod,
  searchAcademicPeriods,
  findAcademicPeriod,
  listAllAcademicPeriods,

  searchOjtSemesters,
};

export const academicReportingService = {
  retakeClassProposals:async(periodId:number,scope:ReportScope,page:number,signal?:AbortSignal,mode:'CONFIGURED'|'CALCULATED'='CONFIGURED'):Promise<RetakeClassReport>=>{
    const {academicPeriodId,...filters}=scope;
    void academicPeriodId;
    try{
      return (await API.get('/retake-class-proposals',{params:{...filters,...(mode==='CALCULATED'?{semesterPeriodId:periodId}:{blockPeriodId:periodId}),page,limit:20},signal,timeout:30000})).data.data;
    }catch(error){
      const body=(error as {response?:{data?:{errorCode?:string}}}).response?.data;
      if(body?.errorCode==='BLOCK_OUTSIDE_PARENT_SEMESTER')throw new Error('Block 3 phải nằm trong thời gian của kỳ học đã chọn. Vui lòng kiểm tra lịch đã cấu hình.');
      if(body?.errorCode==='CALCULATED_BLOCK_CONFLICT')throw new Error('Học kỳ đã chọn không đủ thời gian cho Block 10, một tuần nghỉ và Block 3. Vui lòng kiểm tra ngày của học kỳ.');
      if(body?.errorCode==='SEMESTER_REQUIRED')throw new Error('Vui lòng chọn kỳ học chính để tự tính lịch Block 3.');
      const messages:Record<string,string>={UPCOMING_SEMESTER_REQUIRED:'Vui lòng chọn học kỳ sắp tới.',BLOCK3_REQUIRED:'Vui lòng chọn kỳ học loại Block 3.',BLOCK_PERIOD_NOT_FOUND:'Không tìm thấy kỳ Block 3 đã chọn.',BLOCK_PARENT_INVALID:'Kỳ Block 3 chưa được gắn đúng với học kỳ chính. Vui lòng đối soát cấu hình.',BLOCK_NOT_OPEN_FOR_PLANNING:'Kỳ Block 3 này không còn ở trạng thái có thể lập kế hoạch.',BLOCK_ALREADY_ENDED:'Kỳ Block 3 đã kết thúc. Vui lòng chọn kỳ sắp tới hoặc đang diễn ra.',BLOCK_DATES_INVALID:'Ngày bắt đầu và kết thúc Block 3 chưa hợp lệ.'};
      throw new Error(messages[body?.errorCode??'']??'Không tải được đề xuất mở lớp. Vui lòng kiểm tra kết nối và thử lại.');
    }
  },
  cohorts: (signal?: AbortSignal) => getAllItems<Cohort>('/cohorts', {}, signal),
  periods: (signal?: AbortSignal) => getAllItems<ReportPeriod>('/academic-periods', {}, signal),
  courseDemand: (scope: ReportScope, page: number, includeInProgress: boolean, signal?: AbortSignal) =>
    getPage<CourseDemand>('/course-demands', {
      ...scope, page, limit: 20, includeInProgress: String(includeInProgress),
    }, signal) as Promise<DemandReport>,
  exportCourseDemand: async (scope: ReportScope, includeInProgress = false) => {
    try {
      const response = await API.get<Blob>('/course-demands/export', {
        params: cleanQuery({ ...scope, includeInProgress: String(includeInProgress), format: 'csv' }),
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      // Axios returns JSON error bodies as blobs for a file download request.
      const body = (error as { response?: { data?: unknown } }).response?.data;
      if (body instanceof Blob) {
        let message: string | undefined;
        try { message = JSON.parse(await body.text()).message; } catch { /* Use the original HTTP error. */ }
        if (message) throw new Error(message);
      }
      throw error;
    }
  },
};

interface ImportResource {
  id: number;
  status: string;
  preview: CurriculumImportPreviewResponse['data'];
  result?: Record<string, unknown>;
}
const approvedImports = new Map<string, { id: number; payload: string }>();
const previewCurriculumImport = async (payload: CurriculumImportPayload): Promise<CurriculumImportPreviewResponse> => {
  approvedImports.delete(payload.idempotencyKey);
  const resource = apiData<ImportResource>((await API.post('/curriculum-imports', payload)).data);
  if (!Number.isSafeInteger(resource.id) || resource.id <= 0 || !['VALIDATED', 'COMMITTED'].includes(resource.status) || resource.preview?.preview !== true || !resource.preview.canCommit) {
    throw new Error('Backend chưa xác nhận khung chương trình hợp lệ để import.');
  }
  if (resource.preview.action !== 'CREATE') throw new Error('Mã chương trình đã tồn tại. Chỉ được import khung mới; không thay thế khung đã nhập.');
  if (approvedImports.size >= 100) approvedImports.delete(approvedImports.keys().next().value!);
  approvedImports.set(payload.idempotencyKey, { id: resource.id, payload: JSON.stringify(payload) });
  return { success: true, data: resource.preview };
};
const commitCurriculumImport = async (payload: CurriculumImportPayload) => {
  const approved = approvedImports.get(payload.idempotencyKey);
  if (!approved || approved.payload !== JSON.stringify(payload)) throw new Error('Cần kiểm tra và xác nhận đúng khung chương trình trước khi import.');
  const resource = apiData<ImportResource>((await API.patch('/curriculum-imports', { id: approved.id, status: 'COMMITTED' })).data);
  if (resource.status !== 'COMMITTED' || !resource.result) throw new Error('Backend chưa xác nhận hoàn tất import chương trình.');
  return { success: true, data: resource.result };
};

export const curriculumService = {
  searchMajors: (payload: SearchMajorsPayload) => getJson<SearchMajorsResponse>('/majors', payload as unknown as Record<string, unknown>),
  searchCourses: (payload: SearchCoursesPayload) => getJson<SearchCoursesResponse>('/courses', payload as unknown as Record<string, unknown>),
  searchCurricula: (payload: SearchCurriculaPayload) => getJson<SearchCurriculaResponse>('/curricula', payload as unknown as Record<string, unknown>),
  getCurriculumDetail: (programId: number) => getJson<CurriculumDetailResponse>(`/curricula/${programId}`),
  previewCurriculumImport,
  commitCurriculumImport,
};

const getString = (value: unknown) => value == null ? '' : String(value).trim();
export const resolveCurriculumCourseIds =
      async (
        courseCodes: string[],
        curriculumDetail: CurriculumDetail | null,
      ) => {
        const uniqueCodes =
          Array.from(
            new Set(
              courseCodes
                .map(
                  (code) =>
                    code.trim(),
                )
                .filter(Boolean),
            ),
          );

        const cache =
          new Map<
            string,
            number
          >();

        /*
         * Tận dụng data đã có trên màn hiện tại.
         */
        curriculumDetail?.courses.forEach(
          (course) => {
            cache.set(
              course.courseCode
                .trim()
                .toLowerCase(),
              course.courseId,
            );
          },
        );

        curriculumDetail?.combos.forEach(
          (combo) => {
            combo.courses.forEach(
              (course) => {
                cache.set(
                  course.courseCode
                    .trim()
                    .toLowerCase(),
                  course.courseId,
                );
              },
            );
          },
        );

        const unresolved =
          uniqueCodes.filter(
            (code) =>
              !cache.has(
                code.toLowerCase(),
              ),
          );

        /*
         * Không gọi cùng lúc quá nhiều API.
         */
        const concurrency =
          6;

        for (
          let index = 0;
          index <
          unresolved.length;
          index +=
            concurrency
        ) {
          const batch =
            unresolved.slice(
              index,
              index +
                concurrency,
            );

          const results =
            await Promise.all(
              batch.map(
                async (
                  code,
                ) => {
                  const response =
                    await curriculumService.searchCourses(
                      {
                        page: 1,
                        limit: 20,
                        search:
                          code,
                      },
                    );

                  const found =
                    response.data.items.find(
                      (
                        item,
                      ) =>
                        item.code
                          .trim()
                          .toLowerCase() ===
                        code.toLowerCase(),
                    );

                  if (!found) {
                    throw new Error(
                      `Không tìm thấy môn "${code}" trong danh mục môn học.`,
                    );
                  }

                  return {
                    code,
                    id:
                      found.id,
                  };
                },
              ),
            );

          results.forEach(
            (item) => {
              cache.set(
                item.code.toLowerCase(),
                item.id,
              );
            },
          );
        }

        return cache;
      };

    /* =====================================================
       PARSE WORKBOOK
       ===================================================== */

type DataObject = Record<string, unknown>;

const asObject = (value: unknown): DataObject | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as DataObject)
    : null;

const text = (value: unknown): string =>
  value === undefined || value === null ? "" : String(value).trim();

const positiveId = (value: unknown): number | undefined => {
  const raw = text(value);
  if (!raw) return undefined;

  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : undefined;
};

const buildOption = (
  id: number | undefined,
  candidates: unknown[],
): CatalogOption | null => {
  if (!id) return null;

  const aliases = [...new Set(candidates.map(text).filter(Boolean))];

  return {
    id,
    label: aliases[0] || `ID ${id}`,
    aliases,
  };
};

const uniqueOptions = (
  options: Array<CatalogOption | null>,
): CatalogOption[] => {
  const map = new Map<number, CatalogOption>();

  for (const option of options) {
    if (!option) continue;

    const existing = map.get(option.id);

    if (existing) {
      existing.aliases = [...new Set([...existing.aliases, ...option.aliases])];
    } else {
      map.set(option.id, option);
    }
  }

  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, "vi"));
};

export const loadAcademicCatalogs = async (): Promise<AcademicCatalogs> => {
  const [curricula, cohorts, periods] = await Promise.all([
    getAllItems<DataObject>("/curricula", { status: 'PUBLISHED' }),
    getAllItems<DataObject>("/cohorts"),
    getAllItems<DataObject>("/academic-periods"),
  ]);

  const programs = uniqueOptions(
    curricula.map((item) => {
      const program = asObject(item.program);

      // GET /curricula trả id là ProgramID.
      const option = buildOption(
        positiveId(item.id) ??
          positiveId(item.programId) ??
          positiveId(program?.id),
        [
          [program?.code ?? item.code ?? item.programCode, program?.name ?? item.name ?? item.programName].map(text).filter(Boolean).join(' — '),
          program?.name,
          program?.code,
          item.name,
          item.code,
          item.programName,
          item.programCode,
        ],
      );
      return option ? { ...option, majorCode: text(item.majorCode ?? program?.majorCode) } : null;
    }),
  );

  const cohortOptions = uniqueOptions(
    cohorts.filter(item => item.status !== 'ARCHIVED').map((item) => {
      const option = buildOption(positiveId(item.id), [
        item.cohortCode,
        item.code,
        item.cohortName,
        item.name,
      ]);
      return option ? { ...option, groups: Array.isArray(item.groups) ? item.groups as NonNullable<CatalogOption['groups']> : [] } : null;
    }),
  );

  const periodOptions = uniqueOptions(
    periods.map((item) => {
      const code = text(item.periodCode);

      const readableCode = code.replace(
        /^(FALL|SPRING|SUMMER)(\d{4})$/i,
        (_match, term: string, year: string) => `${term} ${year}`,
      );

      const option = buildOption(positiveId(item.id), [item.name, code, readableCode]);
      return option ? { ...option, kind: text(item.kind) } : null;
    }),
  );

  if (!programs.length || !cohortOptions.length || !periodOptions.length) {
    throw new Error(
      "Thiếu danh mục chương trình, khóa hoặc kỳ học từ Backend. " +
        "Đặc biệt, danh sách CTĐT phải trả về programId hoặc program.id; " +
        "id trong danh sách curricula là ProgramID.",
    );
  }

  return {
    programs,
    cohorts: cohortOptions,
    periods: periodOptions,
  };
};

interface OverviewStudent {
  id: number;
  accountStatus: string;
  cohortId: number | null;
  cohort?: { id: number; name: string; code: string } | null;
  calculatedEligibility?: SavedOjtEligibility | null;
}

export const educationOverviewService = {
  async load(scope: QueryParams = {}, signal?: AbortSignal, onStudentsLoaded?: (total: number) => void) {
    const students = (await educationRead(`overview:students:${scope.cohortId ?? ''}`, () => getAllItems<OverviewStudent>('/students', {
      status: 'ACTIVE', ...(scope.cohortId ? { cohortId: scope.cohortId } : {}),
    }), signal)).filter(student => student.accountStatus === 'ACTIVE');
    signal?.throwIfAborted();
    onStudentsLoaded?.(students.length);
    const rows = students.map(student => {
      const saved = student.calculatedEligibility;
      const status = saved && !saved.isStale ? saved.status : undefined;
      const category = !saved || saved.isStale ? 'AWAITING_CONFIRMATION' : status === 'REVIEW_REQUIRED' ? 'INSUFFICIENT_DATA' : status;
      return { studentId: student.id, cohortId: student.cohortId, category,
        evaluation: { status: status ?? 'NOT_CHECKED' }, officialStale: saved?.isStale ?? false };
    });
    const data = dashboardSummary([{
      rows,
      cohorts: students.flatMap(student => student.cohort ? [{ CohortID: student.cohort.id, Name: student.cohort.name, CohortCode: student.cohort.code }] : []),
    }]);
    const staleCount = students.filter(student => student.calculatedEligibility?.isStale).length;
    return { ...data, unavailableProfiles: 0,
      warning: staleCount ? `${staleCount} kết quả đã cũ do dữ liệu học vụ thay đổi. Cần xét lại trước khi sử dụng.` : '',
    };
  },
};

export const educationOjtWorkflowService = {
  getHandoffs: (ojtSemesterId?: number, signal?: AbortSignal) =>
    getAllItems<Handoff>('/eligible-student-handoffs', ojtSemesterId ? { ojtSemesterId } : {}, signal),
  async handoff(payload: { ojtSemesterId: number; studentIds: number[]; reason: string; idempotencyKey: string }) {
    return apiData<{ handoffId: number; total: number; recipientRole: string }>(
      (await API.post('/eligible-student-handoffs', payload)).data,
    );
  },
  getFinalResults: (query: Query, signal?: AbortSignal) =>
    getPage<OjtFinalResult>('/ojt-results', query, signal),
};

type StudentImportErrorResponse = {
  success?: boolean;
  errorCode?: string;
  message?: string;
};

const sendImportRequest = async <T>(
  endpoint: string,
  payload: unknown,
  fallbackError: string,
  method: 'POST' | 'PATCH' = 'POST',
): Promise<T> => {
  const token = localStorage.getItem("ojt_auth_token");

  if (!token) {
    throw new Error("Không tìm thấy token đăng nhập. Vui lòng đăng nhập lại.");
  }

  const response = await fetch(`${API_ORIGIN}${endpoint}`, {
    method,
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
    if (response.status === 404) {
      throw new Error("Không tìm thấy tài nguyên hoặc đường dẫn yêu cầu (HTTP 404).");
    }
    throw new Error(
      `Backend trả về dữ liệu không hợp lệ (HTTP ${response.status}).`,
    );
  }

  const body =
    result !== null && typeof result === "object" && !Array.isArray(result)
      ? (result as StudentImportErrorResponse)
      : null;

  if (response.status === 401) {
    throw new Error("Phiên đăng nhập đã hết hạn hoặc không hợp lệ.");
  }

  if (response.status === 403) {
    throw new Error("Tài khoản không có quyền thực hiện chức năng này.");
  }

  if (response.status === 404) {
    if (body?.errorCode === 'ROUTE_NOT_FOUND') {
      throw new Error(`Không tìm thấy đường dẫn API ${endpoint} (HTTP 404).`);
    }
    throw new Error(
      typeof body?.message === 'string' && body.message.trim()
        ? body.message
        : "Không tìm thấy tài nguyên hoặc đường dẫn yêu cầu (HTTP 404).",
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

  clearEducationReadCache();
  return result as T;
};

interface StudentImportResource {
  id: number;
  status: string;
  preview: Omit<ImportPreviewResponse, 'success'>;
  result?: Omit<ImportCommitResponse, 'success'>;
  students?: ImportCommitResponse['students'];
}

export const importService = {
  getStudentImport: async (id: number, signal?: AbortSignal): Promise<ImportCommitResponse> => {
    const resource = apiData<StudentImportResource>(await getJson(`/student-imports/${id}`, {}, signal));
    if (resource.status !== 'COMMITTED' || !resource.result) throw new Error('Đợt nhập chưa hoàn tất.');
    return { ...resource.result, importId: resource.id, students: resource.students, success: true };
  },
  listImportedStudents: (filters: ImportedStudentFilters, page: number, signal?: AbortSignal) =>
    getPage<ImportedStudent>('/students', { ...filters, page, limit: 20 }, signal),
  listStudentImportBatches: (signal?: AbortSignal) =>
    getAllItems<StudentImportBatch>('/academic-imports', { kind: 'STUDENT', status: 'COMPLETED' }, signal),
  getImportedStudent: async (id: number, signal?: AbortSignal) =>
    apiData<ImportedStudentProfile>(await getJson(`/students/${id}`, { resultsLimit: 1, ojtLimit: 1 }, signal)),
  getStoredCourseResults: async (id: number, page: number, signal?: AbortSignal) =>
    apiData<{ courseResults: import('@/types/education/api.types').Page<StoredCourseResult> }>(
      await getJson(`/students/${id}`, { include: 'courseResults', resultsPage: page, resultsLimit: 20 }, signal),
    ).courseResults,
  previewStudentImport: async (payload: StudentImportPayload): Promise<ImportPreviewResponse> => {
    const response = await sendImportRequest<unknown>(
      '/api/student-imports',
      { idempotencyKey: payload.idempotencyKey, rows: payload.rows },
      'Không thể kiểm tra dữ liệu sinh viên',
    );
    const resource = apiData<StudentImportResource>(response);
    if (resource.status !== 'VALIDATED' || resource.preview?.preview !== true)
      throw new Error('Backend chưa xác nhận dữ liệu import hợp lệ.');
    return { ...resource.preview, success: true, importId: resource.id };
  },

  commitStudentImport: async (importId: number): Promise<ImportCommitResponse> => {
    const response = await sendImportRequest<unknown>(
      '/api/student-imports', { id: importId, status: 'COMMITTED' },
      'Không thể nhập dữ liệu sinh viên', 'PATCH',
    );
    const resource = apiData<StudentImportResource>(response);
    if (resource.status !== 'COMMITTED' || !resource.result)
      throw new Error('Backend chưa xác nhận hoàn tất import.');
    return { ...resource.result, importId: resource.id, students: resource.students, success: true };
  },
};

// Shared contract with the deployed backend; see docs/ojt-eligibility-save-api.md.
export const LOCAL_OJT_SAVE_ENDPOINT = '/ojt-eligibility-results';
export const loadSavedLocalOjtResults = (signal?: AbortSignal) => getAllItems<SavedOjtEligibility & { studentId: number }>(LOCAL_OJT_SAVE_ENDPOINT, {}, signal);
export const loadStudentAcademicCredits = async (studentId: number, signal?: AbortSignal): Promise<number | null> => {
  const profile = apiData<ImportedStudentProfile>(await getJson(`/students/${studentId}`, { section: 'academicProgress' }, signal));
  const earned = profile.academicProgress?.credits?.earned;
  return typeof earned === 'number' && Number.isFinite(earned) ? earned : null;
};
export type CurrentOjtRule = LocalOjtRule & { thresholdId?: number; id?: number | null; maxUnpassedCourses: number; updatedAt?: string | null; effectiveAt?: string | null; updatedByName?: string | null };
export type OjtCreditThreshold = { id: number; minCredits: number };
export const loadOjtCreditThresholds = async (signal?: AbortSignal) =>
  apiData<OjtCreditThreshold[]>(await getJson('/ojt-credit-thresholds', {}, signal));
export const createOjtCreditThreshold = async (minCredits: number) =>
  apiData<OjtCreditThreshold>((await API.post('/ojt-credit-thresholds', { minCredits })).data);
export const loadCurrentOjtRule = async (signal?: AbortSignal): Promise<CurrentOjtRule> =>
  apiData<CurrentOjtRule>(await getJson('/ojt-condition-policy', {}, signal));
export type OjtPolicyPreview = { allowed: boolean; token: string; programs: { programId: number; code: string; name: string; status: string; reasons: string[] }[] };
export const previewOjtPolicy = async (minCredits: number, maxUnpassedCourses: number) =>
  apiData<OjtPolicyPreview>((await API.post('/ojt-condition-policy/preview', { minCredits, maxUnpassedCourses })).data);
export const publishOjtPolicy = async (minCredits: number, maxUnpassedCourses: number, token: string) =>
  apiData<CurrentOjtRule>((await API.post('/ojt-condition-policy', { minCredits, maxUnpassedCourses, token })).data);
export async function saveLocalOjtResults(results: LocalOjtResult[], idempotencyKey: string, rule: CurrentOjtRule): Promise<{ savedCount: number; handedOffCount: number }> {
  if (!results.length) throw new Error('Chưa có kết quả xét để lưu.');
  try {
    const response = await API.post<{ success: boolean; message?: string; data?: { savedCount: number; handedOffCount?: number } }>(
      LOCAL_OJT_SAVE_ENDPOINT, localOjtSavePayload(results, idempotencyKey, rule),
    );
    const body = response.data;
    if (body.success !== true || body.data?.savedCount !== results.length) {
      throw new Error(body.message || 'Backend chưa xác nhận lưu đầy đủ kết quả. Hãy kiểm tra trạng thái lưu trước khi tiếp tục.');
    }
    clearEducationReadCache();
    return { savedCount: body.data.savedCount, handedOffCount: body.data.handedOffCount ?? 0 };
  } catch (error) {
    const response = (error as { response?: { status?: number; data?: { message?: string; errorCode?: string } } } | null)?.response;
    const status = response?.status;
    if ([404, 405, 501].includes(status ?? 0)) {
      throw new Error('Chưa lưu được kết quả: backend chưa hỗ trợ API lưu kết quả xét từ FE.');
    }
    const apiMessage = response?.data?.message;
    if (apiMessage) {
      const translations: Record<string, string> = {
        'Invalid OJT policy snapshot.': 'Quy tắc xét OJT gửi lên không hợp lệ. Vui lòng xét lại trước khi lưu.',
        'OJT policy changed. Recalculate before saving.': 'Quy tắc xét OJT đã thay đổi. Vui lòng xét lại trước khi lưu.',
        'Course history changed after calculation. Recalculate before saving.': 'Bảng điểm đã thay đổi sau lần xét. Vui lòng xét lại trước khi lưu.',
        'All students and their accounts must be active.': 'Có sinh viên hoặc tài khoản không còn hoạt động. Vui lòng tải lại và xét lại.',
      };
      throw new Error(translations[apiMessage] ?? (/[À-ỹ]/.test(apiMessage) ? apiMessage : `Không lưu được kết quả: ${apiMessage}`));
    }
    throw error;
  }
}

export async function loadAndCalculateLocalEligibility(studentId: number, rule: LocalOjtRule, signal?: AbortSignal): Promise<LocalOjtResult> {
  const profile = apiData<Profile>(await getJson(`/students/${studentId}`, { include: 'academicProgress,courseResults', resultsLimit: 100 }, signal));
  const first = profile.courseResults;
  if (!first || !Array.isArray(first.items) || !Number.isSafeInteger(first.total) || first.total < 0) throw new Error('Không tải được đầy đủ bảng điểm.');
  const attempts = [...first.items];
  for (let page = first.page + 1; attempts.length < first.total; page++) {
    const next = apiData<Profile>(await getJson(`/students/${studentId}`, { include: 'courseResults', resultsPage: page, resultsLimit: 100 }, signal)).courseResults;
    if (!next?.items.length) throw new Error('Bảng điểm chưa tải đầy đủ; chưa thể xét điều kiện.');
    attempts.push(...next.items);
  }
  return calculateLocalOjtEligibility(studentId, profile, attempts, rule);
}

const eligibilityApiOrigin = API_ORIGIN;

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

  const response = await fetch(`${eligibilityApiOrigin}${path}`, {
    ...options,
    cache:'no-store',
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

type Row = Record<string, any>;
const progressText = (value: unknown) =>
  value === undefined || value === null || value === "" ? "—" : String(value);
const number = (value: unknown): number | null =>
  value === null || value === undefined
    ? null
    : Number.isFinite(Number(value))
      ? Number(value)
      : null;
async function loadStudent(
  row: Row,
  curricula: Map<number, Promise<Row>>,
  savedResults: Map<number, SavedOjtEligibility>,
  signal?: AbortSignal,
): Promise<StudentProgress> {
  const profile = apiData<Row>(await getJson(`/students/${row.id}`, { include: 'academicProgress,courseResults', resultsLimit: 100 }, signal));
  const progress = profile.academicProgress ?? {},
    program = profile.program ?? {},
    credits = progress.credits ?? {};
  let curriculum: Row | null = null,
    curriculumWarning = "";
  const programId = profile.programId ?? program.id;
  if (programId) {
    if (!curricula.has(programId))
      curricula.set(
        programId,
        getJson(`/curricula/${programId}`, {}, signal).then((response) =>
          apiData<Row>(response),
        ),
      );
    try {
      curriculum = await curricula.get(programId)!;
    } catch {
      curriculumWarning =
        "Không tải được khung chương trình để hiển thị kỳ khuyến nghị và môn tiên quyết.";
    }
  }
  const first = profile.courseResults;
  const attempts: Row[] = [...(first?.items ?? [])];
  // Results are a paginated section of the student profile.
  for (let page = (first?.page ?? 1) + 1; attempts.length < (first?.total ?? 0); page++) {
    const next = apiData<Row>(await getJson(`/students/${row.id}`, {
      include: "courseResults", resultsPage: page, resultsLimit: first.limit,
    }, signal)).courseResults;
    if (!next?.items?.length) throw new Error("Không tải đủ kết quả học tập của sinh viên.");
    attempts.push(...next.items);
  }
  const requirements: Row[] = progress.requirements ?? [];
  const subjects: StudentSubject[] = requirements.map((required: Row) => {
    const matching = attempts.filter((a) =>
      required.choices?.includes(a.courseId),
    );
    const result =
      matching.find((a) =>
        progress.gpaCourses?.some((g: Row) => g.resultId === a.id),
      ) ?? matching[0];
    const course = curriculum?.courses?.find(
      (c: Row) => c.courseId === required.courseId,
    );
    const prerequisiteIds: number[] = (curriculum?.prerequisites ?? [])
      .filter((g: Row) => g.courseId === required.courseId)
      .flatMap((g: Row) => g.prerequisiteCourseIds ?? []);
    const prerequisite = prerequisiteIds.map(
      (id) =>
        curriculum?.courses?.find((c: Row) => c.courseId === id)?.courseCode ??
        String(id),
    );
    const status: SubjectStatus = required.completed
      ? "Passed"
      : result?.status === "FAILED"
        ? "Not Passed"
        : result?.status === "IN_PROGRESS"
          ? "In Progress"
          : result
            ? "Chưa xác định"
            : "Not Started";
    return {
      id: String(required.id),
      curriculumSemester: number(course?.semester),
      actualTerm: progressText(result?.academicPeriod?.name ?? result?.periodName ?? result?.periodCode),
      code: progressText(required.courseCode),
      name: progressText(required.name),
      credits: number(required.credits),
      grade: number(result?.score),
      status,
      prerequisite,
    };
  });
  const official = profile.officialEligibility;
  const decision = profile.officialDecision;
  const saved = savedResults.get(Number(profile.id));
  const eligibilityStatus: OjtEligibilityStatus = saved ? savedOjtProgressLabel(saved) :
    official?.isStale
      ? "Cần xét lại"
      : decision === "ELIGIBLE"
      ? "Đủ điều kiện"
      : decision === "NOT_ELIGIBLE"
        ? "Chưa đủ điều kiện"
        : decision === "REVIEW_REQUIRED"
          ? "Cần đối soát"
        : "Chưa có kết quả";
  return {
    id: String(profile.id),
    studentCode: progressText(profile.studentCode),
    fullName: progressText(profile.fullName),
    cohort: progressText(profile.cohort?.code ?? profile.cohortCode),
    studentClass: progressText(profile.className),
    curriculumCode: progressText(program.code),
    currentCurriculumSemester: number(profile.currentSemester),
    courseSemesterTag: number(profile.courseSemesterTag),
    currentTerm: progressText(profile.currentAcademicPeriod?.name),
    currentTermStartDate: profile.currentAcademicPeriod?.startDate ?? null,
    gpa: number(progress.gpa),
    completedCredits: number(credits.earned),
    totalCredits: number(credits.total ?? program.totalCredits),
    plannedOjtTerm: "—",
    currentEstimatedOjtTerm: "—",
    delayTerms: null,
    progressStatus: "Chưa xác định",
    eligibilityStatus,
    eligibilitySource: saved ? 'FRONTEND' : official || ['ELIGIBLE', 'NOT_ELIGIBLE', 'REVIEW_REQUIRED'].includes(decision) ? 'OFFICIAL' : null,
    subjects,
    dataWarning:
      [
        curriculumWarning,
        progress.issues?.length
          ? "Dữ liệu học vụ cần đối soát: " + progress.issues.join(", ")
          : "",
      ]
        .filter(Boolean)
        .join(" ") || undefined,
  };
}
export const studentProgressService = {
  async loadAll(signal?: AbortSignal): Promise<StudentProgress[]> {
    const curricula = new Map<number, Promise<Row>>();
    const [students, saved] = await Promise.all([getAllItems<Row>("/students", {}, signal), loadSavedLocalOjtResults(signal)]);
    const savedResults = new Map(saved.map(result => [result.studentId, result]));
    const items: StudentProgress[] = new Array(students.length);
    let next = 0;
    await Promise.all(
      Array.from({ length: Math.min(4, students.length) }, async () => {
        while (next < students.length) {
          signal?.throwIfAborted();
          const index = next++;
          try {
            items[index] = await loadStudent(students[index], curricula, savedResults, signal);
          } catch (error) {
            signal?.throwIfAborted();
            const row = students[index];
            const message = progressText(row.studentCode) +
                ": " +
                (error instanceof Error
                  ? error.message
                  : "Không tải được hồ sơ");
            items[index] = {
              id: String(row.id), studentCode: progressText(row.studentCode), fullName: progressText(row.fullName),
              cohort: progressText(row.cohort?.code ?? row.cohortCode), studentClass: progressText(row.className),
              curriculumCode: progressText(row.program?.code), currentCurriculumSemester: number(row.currentSemester),
              currentTerm: progressText(row.currentAcademicPeriod?.name), currentTermStartDate: row.currentAcademicPeriod?.startDate ?? null, gpa: null,
              completedCredits: null, totalCredits: null, plannedOjtTerm: '—',
              currentEstimatedOjtTerm: '—', delayTerms: null, progressStatus: 'Chưa xác định',
              eligibilityStatus: savedOjtProgressLabel(savedResults.get(Number(row.id))),
              eligibilitySource: savedResults.has(Number(row.id)) ? 'FRONTEND' : null,
              subjects: [], dataWarning: message, detailsUnavailable: true,
            };
          }
        }
      }),
    );
    return items;
  },
};
