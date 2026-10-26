import type {
  ImportCommitResponse,
  EnterpriseImportPayload,
  ImportPreviewApiResponse,
  ImportPreviewResponse,
} from "@/types/qhdn/qhdnTypes";
import { normalizeEnterpriseImportPreview } from "@/utils/qhdnEnterprise";
import type { CompanyListItem } from "@/types/qhdn/qhdnTypes";
import type {
  Application,
  AssignmentInput,
  AssignmentUpdate,
  Page,
  PageQuery,
  RecruitmentPost,
  ReportType,
  Result,
} from "@/types/qhdn/workflowTypes";
import { loadAllPages } from "../utils/loadAllPages";
import API from "./api";
import type {
  OjtSemesterItem,
  CompanyListResponse,
  PositionListResponse,
  ReassignCoordinationRequest,
  EnterpriseDecisionRequest,
  TransferOjtResultRequest,
  CoordinationListResponse,
  AssignmentListResponse,
  InternshipEvaluationListResponse,
  OjtResultListResponse,
  HandoffStudentListResponse,
  AcademicPeriodItem,
  AcademicPeriodListResponse,
  RegistrationWindowItem,
  CreateRegistrationWindowRequest,
  UpdateRegistrationWindowRequest,
  ListRegistrationWindowsResponse,
} from "@/types/qhdn/qhdnTypes";

/**
 * Tạo idempotencyKey ngẫu nhiên cho mỗi lần import / điều phối / chuyển giao.
 */
export const generateIdempotencyKey = (prefix = "qhdn"): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

/**
 * GET /api/companies
 * Danh sách doanh nghiệp đã được lưu trong hệ thống.
 */
export const listCompanies = async (
  params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  } = { page: 1, limit: 100 },
): Promise<CompanyListResponse> => {
  const response = await API.get<CompanyListResponse>("/companies", { params });
  return response.data;
};

/**
 * GET /api/positions
 * Danh sách vị trí thực tập kèm thông tin doanh nghiệp và học kỳ.
 */
export const listPositions = async (
  params: {
    page?: number;
    limit?: number;
    companyId?: number;
    ojtSemesterId?: number;
    status?: string;
    search?: string;
  } = { page: 1, limit: 100 },
): Promise<PositionListResponse> => {
  const response = await API.get<PositionListResponse>("/positions", {
    params,
  });
  return response.data;
};

/** Read QHDN semester options from the academic-period catalog. */
export const listQhdnOjtSemesters = async (
  academicPeriods?: AcademicPeriodItem[],
): Promise<{ items: OjtSemesterItem[] }> => {
  const periods =
    academicPeriods ??
    (await loadAllPages(async (page) =>
      getAcademicPeriods({ page, limit: 100 }),
    ));
  const semesters = new Map<number, OjtSemesterItem>();
  for (const period of periods) {
    if (period.kind !== "SEMESTER") continue;
    const ojt = period.ojt;
    const id = period.ojtSemesterId || ojt?.id;
    // Academic periods without an OJT link are not OJT semesters.
    if (!id || semesters.has(id)) continue;
    semesters.set(id, {
      id,
      name: ojt?.name || period.name,
      code: ojt?.semesterCode || period.periodCode,
      semesterCode: ojt?.semesterCode || period.periodCode,
      academicPeriodId: ojt?.academicPeriodId ?? period.id,
      academicYearId: ojt?.academicYearId ?? period.academicYearId,
      status: ojt?.status || period.status,
      startDate: ojt?.startDate || period.startDate,
      endDate: ojt?.endDate || period.endDate,
      regStartDate: ojt?.regStartDate ?? undefined,
      regEndDate: ojt?.regEndDate ?? undefined,
    });
  }
  return { items: Array.from(semesters.values()) };
};

// =========================================================================
// 1. LUỒNG TIẾP NHẬN DANH SÁCH SINH VIÊN TỪ PHÒNG ĐÀO TẠO (ACADEMIC -> QHDN)
// =========================================================================

/** GET /api/qhdn/eligible-students: sinh viên đủ điều kiện đã được Đào tạo bàn giao. */
export const listEligibleStudents = async (params: {
  ojtSemesterId: number;
  studentId?: number;
  handoffId?: number;
  programId?: number;
  cohortId?: number;
  groupCode?: "A" | "B" | "C" | "D";
  search?: string;
  registrationStatus?: "NOT_REGISTERED" | "SUBMITTED" | "APPROVED" | "REJECTED" | "LEGACY_REVIEW_REQUIRED";
  page?: number;
  limit?: number;
}): Promise<HandoffStudentListResponse> => {
  const { data } = await API.get<HandoffStudentListResponse>(
    "/qhdn/eligible-students",
    { params: { page: 1, limit: 100, ...params } },
  );
  if (data.success !== true) {
    throw new Error(data.message || "Không tải được danh sách sinh viên đã bàn giao.");
  }
  return data;
};

/**
 * GET /api/ojt-semesters/:id/students
 * Tiếp nhận danh sách sinh viên trong kỳ OJT từ phòng đào tạo (kèm trạng thái bàn giao và đăng ký).
 */
export const listStudentsInSemester = async (
  ojtSemesterId: number,
  params: {
    page?: number;
    limit?: number;
    search?: string;
    registrationStatus?: string;
    coordinationStatus?: string;
  } = { page: 1, limit: 100 },
): Promise<HandoffStudentListResponse> => {
  const response = await API.get<HandoffStudentListResponse>(
    `/ojt-semesters/${ojtSemesterId}/students`,
    { params },
  );
  return response.data;
};

/**
 * GET /api/academic-periods
 * Danh sách học kỳ và Block 3, kèm năm học và liên kết OJT do phòng đào tạo khởi tạo.
 */
export const getAcademicPeriods = async (
  params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  } = {},
): Promise<AcademicPeriodListResponse> => {
  const { data } = await API.get<AcademicPeriodListResponse>("/academic-periods", {
    params: { page: 1, limit: 100, ...params },
  });
  if (data.success !== true) {
    throw new Error(data.message || "Không tải được danh sách kỳ học.");
  }
  // The API returns { success, items, page, limit, total }, without a data wrapper.
  return data;
};

/**
 * GET /api/ojt-registration-windows
 * Danh sách các đợt mở đăng ký OJT (theo kỳ hoặc theo trạng thái).
 */
export const listRegistrationWindows = async (
  params: {
    ojtSemesterId?: number;
    status?: string;
    page?: number;
    limit?: number;
  } = { page: 1, limit: 50 },
): Promise<ListRegistrationWindowsResponse> => {
  const response = await API.get<ListRegistrationWindowsResponse>(
    "/ojt-registration-windows",
    { params },
  );
  return response.data;
};

/**
 * POST /api/ojt-registration-windows
 * Tạo mới đợt đăng ký OJT (ở trạng thái DRAFT) với phạm vi danh sách sinh viên đủ điều kiện.
 */
export const createRegistrationWindow = async (
  payload: CreateRegistrationWindowRequest,
): Promise<{ success: boolean; data: RegistrationWindowItem }> => {
  const response = await API.post<{
    success: boolean;
    data: RegistrationWindowItem;
  }>("/ojt-registration-windows", payload);
  return response.data;
};

/**
 * PATCH /api/ojt-registration-windows/:id
 * Cập nhật thông tin đợt đăng ký (tên, hạn chót endsAt, lý do hoặc thay đổi status OPEN/CLOSED).
 */
export const updateRegistrationWindow = async (
  windowId: number,
  payload: UpdateRegistrationWindowRequest,
): Promise<{ success: boolean; data: RegistrationWindowItem }> => {
  const response = await API.patch<{
    success: boolean;
    data: RegistrationWindowItem;
  }>(`/ojt-registration-windows/${windowId}`, payload);
  return response.data;
};

/**
 * Mở đợt đăng ký OJT (chuyển status thành OPEN).
 */
export const openRegistrationWindow = async (
  windowId: number,
  reason = "Mở cổng đăng ký OJT cho sinh viên đủ điều kiện",
): Promise<{ success: boolean; data: RegistrationWindowItem }> => {
  return updateRegistrationWindow(windowId, { status: "OPEN", reason });
};

/**
 * Đóng đợt đăng ký OJT (chuyển status thành CLOSED).
 */
export const closeRegistrationWindow = async (
  windowId: number,
  reason = "Hết hạn đăng ký OJT đợt này",
): Promise<{ success: boolean; data: RegistrationWindowItem }> => {
  return updateRegistrationWindow(windowId, { status: "CLOSED", reason });
};

// =========================================================================
// 2. LUỒNG ĐIỀU PHỐI SINH VIÊN CHO DOANH NGHIỆP (QHDN -> ENTERPRISE)
// =========================================================================

/**
 * GET /api/ojt-coordinations
 * Danh sách sinh viên đã được điều phối cho doanh nghiệp đối tác.
 */
export const listCoordinations = async (
  params: {
    page?: number;
    limit?: number;
    ojtSemesterId?: number;
    companyId?: number;
    status?: string;
    search?: string;
  } = { page: 1, limit: 100 },
): Promise<CoordinationListResponse> => {
  const response = await API.get<CoordinationListResponse>(
    "/ojt-coordinations",
    { params },
  );
  return response.data;
};

/**
 * POST /api/ojt-coordinations/:id/reassign
 * Điều phối lại cho sinh viên bị doanh nghiệp từ chối sang vị trí/doanh nghiệp khác.
 */
export const reassignStudent = async (
  coordinationId: number,
  payload: ReassignCoordinationRequest,
): Promise<{ success: boolean; data: any }> => {
  const response = await API.post<{ success: boolean; data: any }>(
    `/ojt-coordinations/${coordinationId}/reassign`,
    payload,
  );
  return response.data;
};

/**
 * POST /api/ojt-coordinations/:id/decision
 * Ghi nhận quyết định tiếp nhận sinh viên (ACCEPTED hoặc REJECTED) thay doanh nghiệp nếu cần.
 */
export const recordEnterpriseDecision = async (
  coordinationId: number,
  payload: EnterpriseDecisionRequest,
): Promise<{ success: boolean; data: any }> => {
  const response = await API.post<{ success: boolean; data: any }>(
    `/ojt-coordinations/${coordinationId}/decision`,
    payload,
  );
  return response.data;
};

/**
 * GET /api/assignments
 * Danh sách phân công thực tập chính thức (sau khi doanh nghiệp ACCEPTED).
 */
export const listAssignments = async (
  params: {
    page?: number;
    limit?: number;
    companyId?: number;
    ojtSemesterId?: number;
    status?: string;
    search?: string;
  } = { page: 1, limit: 100 },
): Promise<AssignmentListResponse> => {
  const response = await API.get<AssignmentListResponse>("/assignments", {
    params,
  });
  return response.data;
};

// =========================================================================
// 3. LUỒNG NHẬN KẾT QUẢ TỪ DOANH NGHIỆP & GỬI LẠI PHÒNG ĐÀO TẠO (TRANSFER)
// =========================================================================

/**
 * GET /api/internship-evaluations
 * Tiếp nhận danh sách phiếu đánh giá thực tập từ người hướng dẫn doanh nghiệp.
 */
export const listInternshipEvaluations = async (
  params: {
    page?: number;
    limit?: number;
    ojtSemesterId?: number;
    companyId?: number;
    status?: string;
    search?: string;
  } = { page: 1, limit: 100 },
): Promise<InternshipEvaluationListResponse> => {
  const response = await API.get<InternshipEvaluationListResponse>(
    "/internship-evaluations",
    { params },
  );
  return response.data;
};

/**
 * POST /api/ojt-results
 * Chuyển giao kết quả đánh giá OJT của sinh viên cho phòng đào tạo (ACADEMIC).
 * Yêu cầu: Quyền OJT_COORD hoặc ADMIN, phân công đã COMPLETED và có đánh giá SUBMITTED từ DN.
 */
export const transferOjtResult = async (
  payload: TransferOjtResultRequest,
): Promise<{ success: boolean; data: any }> => {
  const response = await API.post<{ success: boolean; data: any }>(
    "/ojt-results",
    payload,
  );
  return response.data;
};

/**
 * GET /api/ojt-results
 * Danh sách kết quả OJT đã chuyển giao cho phòng đào tạo (và theo dõi trạng thái xác nhận CONFIRMED).
 */
export const listOjtResults = async (
  params: {
    page?: number;
    limit?: number;
    ojtSemesterId?: number;
    status?: string;
    search?: string;
  } = { page: 1, limit: 100 },
): Promise<OjtResultListResponse> => {
  const response = await API.get<OjtResultListResponse>("/ojt-results", {
    params,
  });
  return response.data;
};

export const archiveRecruitment = async () =>
  (
    await API.post<{ success: boolean; archivedCount: number }>(
      "/imports/archive",
    )
  ).data;

export const listApplications = async (params: PageQuery) =>
  (await API.get<Result<Page<Application>>>("/job-applications", { params }))
    .data.data;
export const reviewRegistration = async (
  id: number,
  payload: {
    decision: "APPROVE" | "REJECT";
    reason: string;
    idempotencyKey: string;
  },
) => (await API.post(`/ojt-registrations/${id}/review`, payload)).data;
export const updateCompany = async (
  id: number,
  payload: Partial<
    Pick<
      CompanyListItem,
      | "name"
      | "address"
      | "industry"
      | "contactPersonName"
      | "contactPhone"
      | "contactEmail"
      | "status"
    >
  > & { reason: string },
) => (await API.patch(`/companies/${id}`, payload)).data;
export const listRecruitmentPosts = async (
  params: PageQuery & { companyId: number; windowId?: number },
) =>
  (
    await API.get<Result<Page<RecruitmentPost>>>("/recruitment/posts", {
      params,
    })
  ).data.data;
export const reviewRecruitmentPost = async (
  id: number,
  payload: {
    decision: "PUBLISH" | "REJECT";
    reason: string;
    deadlineAt?: string;
  },
) => (await API.post(`/recruitment/posts/${id}/review`, payload)).data;
export const assignInternship = async (payload: AssignmentInput) =>
  (await API.post("/assignments", payload)).data;
export const editInternship = async (id: number, payload: AssignmentUpdate) =>
  (await API.patch(`/assignments/${id}`, payload)).data;

// API trả Blob; utils/downloadFile phụ trách lưu file trên trình duyệt.
export const getCvFile = async (
  studentId: number,
  cvFileId?: number | null,
): Promise<Blob> =>
  (
    await API.get<Blob>(`/students/${studentId}/cv`, {
      params: cvFileId ? { cvFileId } : {},
      responseType: "blob",
    })
  ).data;
export const exportOjtResults = async (
  semesterId: number,
  format: "csv" | "pdf",
): Promise<Blob> =>
  (
    await API.get<Blob>(`/ojt-semesters/${semesterId}/results/export`, {
      params: { format },
      responseType: "blob",
    })
  ).data;
export const exportQhdnReport = async (
  type: ReportType,
  params: { ojtSemesterId?: number; companyId?: number },
): Promise<Blob> =>
  (
    await API.get<Blob>("/qhdn/reports/export", {
      params: { ...params, type, format: "csv" },
      responseType: "blob",
    })
  ).data;

export const previewEnterpriseImport = async (
  payload: EnterpriseImportPayload,
): Promise<ImportPreviewResponse> => {
  const { data } = await API.post<ImportPreviewApiResponse>(
    "/imports/preview",
    payload,
    {
      headers: { "Content-Type": "application/json" },
    },
  );
  return normalizeEnterpriseImportPreview(data);
};
export const commitEnterpriseImport = async (
  payload: EnterpriseImportPayload,
): Promise<ImportCommitResponse> => {
  const { data } = await API.post<ImportCommitResponse>(
    "/imports/commit",
    payload,
    {
      headers: { "Content-Type": "application/json" },
    },
  );
  if (data.success !== true)
    throw new Error("Import chưa được hệ thống xác nhận thành công.");
  return data;
};
