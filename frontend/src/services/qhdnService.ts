import type {
  QhdnStudentDossier,
  ImportCommitResponse,
  EnterpriseImportPayload,
  ImportPreviewApiResponse,
  ImportPreviewResponse,
} from "@/types/qhdn/qhdnTypes";
import { normalizeEnterpriseImportPreview } from "@/utils/qhdn/qhdnEnterprise";
import type { CompanyListItem } from "@/types/qhdn/qhdnTypes";
import type { ReportType } from "@/types/qhdn/workflowTypes";
import API from "./apiService";
import type { DashboardPlacementSummary, QhdnDashboardSummary } from '@/utils/qhdn/qhdnDashboard';
import { qhdnRead, qhdnReadKey } from '@/utils/qhdn/qhdnReadCache';

/** Dashboard projection: counts only, without loading student rows, placement history, or positions. */
export const getDashboardPlacementSummary = async (ojtSemesterId: number, signal?: AbortSignal): Promise<DashboardPlacementSummary> => {
  return qhdnRead(qhdnReadKey('/qhdn/placements/summary',{ojtSemesterId}),async requestSignal=>{
    const response = await API.get<{ success: boolean; data: DashboardPlacementSummary }>('/qhdn/placements/summary', { params: { ojtSemesterId }, signal:requestSignal });
    if (!response.data.success) throw new Error('Không tải được thống kê điều phối OJT.');
    return response.data.data;
  },signal);
};

export const getQhdnDashboardSummary = async (ojtSemesterId: number, signal?: AbortSignal): Promise<QhdnDashboardSummary> => {
  return qhdnRead(qhdnReadKey('/qhdn/dashboard/summary',{ojtSemesterId}),async requestSignal=>{
    const response = await API.get<{ success: boolean; data: QhdnDashboardSummary }>('/qhdn/dashboard/summary', { params: { ojtSemesterId }, signal:requestSignal });
    if (!response.data.success) throw new Error('Không tải được thống kê thực tập OJT.');
    const progress=response.data.data?.progress;
    if(!progress||![progress.completed,progress.inProgress,progress.evaluated].every(count=>Number.isSafeInteger(count)&&count>=0))throw new Error('Chưa tải được đầy đủ thống kê kết quả OJT. Vui lòng thử lại.');
    return response.data.data;
  },signal);
};

import type {
  CompanyListResponse,
  PositionListResponse,
  CoordinationListResponse,
  InternshipEvaluationListResponse,
  OjtResultListResponse,
  PublishOjtResultsRequest,
  PublishOjtResultsResponse,
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
  signal?: AbortSignal,
): Promise<CompanyListResponse> => {
  return qhdnRead(qhdnReadKey('/companies',params),async requestSignal=>(await API.get<CompanyListResponse>("/companies", { params, signal:requestSignal })).data,signal);
};

export const setCompanyAccess = async (id: number, status: 'ACTIVE' | 'INACTIVE') => {
  const response = await API.patch<{ success: boolean; message?: string; data: CompanyListItem & { affectedAccounts: number } }>(
    `/qhdn/companies/${id}/access`, { status },
  );
  if (!response.data.success) throw new Error(response.data.message || 'Không cập nhật được trạng thái tài khoản.');
  return response.data.data;
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
  signal?: AbortSignal,
): Promise<PositionListResponse> => {
  return qhdnRead(qhdnReadKey('/positions',params),async requestSignal=>(await API.get<PositionListResponse>("/positions", { params, signal:requestSignal })).data,signal);
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
  signal?:AbortSignal,
): Promise<AcademicPeriodListResponse> => {
  const query={page:1,limit:100,...params};
  return qhdnRead(qhdnReadKey('/academic-periods',query),async requestSignal=>{
    const { data } = await API.get<AcademicPeriodListResponse>("/academic-periods", { params:query,signal:requestSignal });
    if (data.success !== true) throw new Error(data.message || "Không tải được danh sách kỳ học.");
    return data;
  },signal,5*60_000);
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
  signal?: AbortSignal,
): Promise<ListRegistrationWindowsResponse> => {
  return qhdnRead(qhdnReadKey('/ojt-registration-windows',params),async requestSignal=>(await API.get<ListRegistrationWindowsResponse>("/ojt-registration-windows",{params,signal:requestSignal})).data,signal);
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
  signal?: AbortSignal,
): Promise<CoordinationListResponse> => {
  return qhdnRead(qhdnReadKey('/ojt-coordinations',params),async requestSignal=>(await API.get<CoordinationListResponse>("/ojt-coordinations",{params,signal:requestSignal})).data,signal);
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
  signal?:AbortSignal,
): Promise<InternshipEvaluationListResponse> => {
  return qhdnRead(qhdnReadKey('/internship-evaluations',params),async requestSignal=>(await API.get<InternshipEvaluationListResponse>("/internship-evaluations",{params,signal:requestSignal})).data,signal);
};

export const listOjtResults = async (
  params: {
    page?: number;
    limit?: number;
    ojtSemesterId?: number;
    status?: string;
    search?: string;
    includeUntransferred?: 'true' | 'false';
  } = { page: 1, limit: 100 },
  signal?: AbortSignal,
): Promise<OjtResultListResponse> => {
  return qhdnRead(qhdnReadKey('/ojt-results',params),async requestSignal=>(await API.get<OjtResultListResponse>("/ojt-results",{params,signal:requestSignal})).data,signal);
};

export const getEligibleStudentsPage = async <T>(params:{page:number;limit:number},signal?:AbortSignal):Promise<T> =>
  qhdnRead(qhdnReadKey('/qhdn/eligible-students',params),async requestSignal=>
    (await API.get<{data:T}>('/qhdn/eligible-students',{params,signal:requestSignal})).data.data,signal);

export const publishOjtResults = async (
  payload: PublishOjtResultsRequest,
): Promise<PublishOjtResultsResponse> =>
  (await API.post<PublishOjtResultsResponse>("/ojt-results/publish", payload)).data;

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
export const getQhdnStudentDossier = async (studentId: number, ojtSemesterId: number, signal?: AbortSignal): Promise<QhdnStudentDossier> => {
  return qhdnRead(qhdnReadKey(`/qhdn/students/${studentId}`,{ojtSemesterId}),async requestSignal=>{
    const { data } = await API.get<{ success: boolean; data: QhdnStudentDossier; message?: string }>(`/qhdn/students/${studentId}`, { params:{ojtSemesterId},signal:requestSignal });
    if (!data.success) throw new Error(data.message || 'Không tải được hồ sơ sinh viên.');
    return data.data;
  },signal);
};

// API trả Blob; utils/shared/downloadFile phụ trách lưu file trên trình duyệt.
export const getCvFile = async (
  studentId: number,
  cvFileId?: number | null,
  signal?: AbortSignal,
): Promise<Blob> =>
  (
    await API.get<Blob>(`/students/${studentId}/cv`, {
      params: cvFileId ? { cvFileId } : {},
      responseType: "blob",
      signal,
    })
  ).data;
export const exportOjtResults = async (
  semesterId: number,
  format: "csv" | "pdf",
  includeUntransferred = false,
): Promise<Blob> =>
  (
    await API.get<Blob>(`/ojt-semesters/${semesterId}/results/export`, {
      params: { format, ...(includeUntransferred ? { includeUntransferred: 'true' } : {}) },
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
