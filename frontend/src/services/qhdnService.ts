import API, { API_BASE_URL } from './api';
import type {
  ImportPreviewRequest,
  ImportPreviewResponse,
  ImportCommitResponse,
  ImportArchiveResponse,
  CreateCompanyRequest,
  CreateCompanyResponse,
  CreatePositionRequest,
  CreatePositionResponse,
  SearchOjtSemestersRequest,
  SearchOjtSemestersResponse,
  AccountProfileResponse,
  SearchOjtRegistrationsRequest,
  SearchOjtRegistrationsResponse,
  CompanyListResponse,
  PositionListResponse,
  CreateCoordinationRequest,
  ReassignCoordinationRequest,
  EnterpriseDecisionRequest,
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  TransferOjtResultRequest,
  CoordinationListResponse,
  AssignmentListResponse,
  InternshipEvaluationListResponse,
  OjtResultListResponse,
  HandoffStudentListResponse,
  EligibleStudentHandoffBatchResponse,
  QhdnDashboardData,
  AcademicPeriodItem,
  RegistrationWindowItem,
  CreateRegistrationWindowRequest,
  UpdateRegistrationWindowRequest,
  ListRegistrationWindowsResponse,
} from '@/types/qhdn/qhdnTypes';

/**
 * POST /api/imports/preview
 * Kiểm tra dữ liệu nhập sinh viên hoặc doanh nghiệp (preview mode, chưa commit).
 */
export const previewImport = async (
  payload: ImportPreviewRequest
): Promise<ImportPreviewResponse> => {
  const response = await API.post<ImportPreviewResponse>(
    '/imports/preview',
    payload
  );
  return response.data;
};

/**
 * Tạo idempotencyKey ngẫu nhiên cho mỗi lần import / điều phối / chuyển giao.
 */
export const generateIdempotencyKey = (prefix = 'qhdn'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

/**
 * POST /api/imports/commit
 * Xác nhận nhập chính thức sinh viên hoặc doanh nghiệp vào hệ thống.
 * Request body giống /preview, response bổ sung batchId & replayed.
 */
export const commitImport = async (
  payload: ImportPreviewRequest
): Promise<ImportCommitResponse> => {
  const response = await API.post<ImportCommitResponse>(
    '/imports/commit',
    payload
  );
  return response.data;
};

/**
 * POST /api/imports/archive
 * Lưu trữ tuyển dụng sau hai học kỳ kể từ khi sinh viên đi OJT.
 * Không có request body.
 */
export const archiveImport = async (): Promise<ImportArchiveResponse> => {
  const response = await API.post<ImportArchiveResponse>('/imports/archive');
  return response.data;
};

/**
 * GET /api/companies
 * Danh sách doanh nghiệp đã được lưu trong hệ thống.
 */
export const listCompanies = async (
  params: { page?: number; limit?: number; search?: string; status?: string } = { page: 1, limit: 100 }
): Promise<CompanyListResponse> => {
  const response = await API.get<CompanyListResponse>('/companies', { params });
  return response.data;
};

/**
 * GET /api/positions hoặc POST /api/json/positions/list
 * Danh sách vị trí thực tập kèm thông tin doanh nghiệp và học kỳ.
 */
export const listPositions = async (
  params: { page?: number; limit?: number; companyId?: number; ojtSemesterId?: number; status?: string; search?: string } = { page: 1, limit: 100 }
): Promise<PositionListResponse> => {
  try {
    const response = await API.get<PositionListResponse>('/positions', { params });
    return response.data;
  } catch {
    const response = await API.post<PositionListResponse>('/json/positions/list', {
      page: params.page ?? 1,
      limit: params.limit ?? 100,
      ...params,
    });
    return response.data;
  }
};

/**
 * POST /api/companies
 * Tạo mới doanh nghiệp đối tác (HTTP 201 Created).
 * Quyền: ADMIN/OJT_COORD và ENTERPRISE scoped thông qua EnterpriseUser.
 */
export const createCompany = async (
  payload: CreateCompanyRequest
): Promise<CreateCompanyResponse> => {
  const response = await API.post<CreateCompanyResponse>('/companies', payload);
  return response.data;
};

/**
 * POST /api/positions
 * Tạo mới vị trí tuyển dụng thực tập OJT cho doanh nghiệp (HTTP 201 Created).
 */
export const createPosition = async (
  payload: CreatePositionRequest
): Promise<CreatePositionResponse> => {
  const response = await API.post<CreatePositionResponse>('/positions', payload);
  return response.data;
};

/**
 * POST /api/json/ojt-semesters/search
 * Danh sách kỳ OJT (Tìm kiếm / Phân trang kỳ OJT do phòng đào tạo khởi tạo).
 */
export const searchOjtSemesters = async (
  payload: SearchOjtSemestersRequest = { page: 1, limit: 100 }
): Promise<SearchOjtSemestersResponse> => {
  const requestBody: SearchOjtSemestersRequest = {
    page: payload.page ?? 1,
    limit: payload.limit ?? 100,
    ...(payload.status ? { status: payload.status } : {}),
    ...(payload.search ? { search: payload.search } : {}),
    ...(payload.academicYearId ? { academicYearId: payload.academicYearId } : {}),
  };
  const response = await API.post<SearchOjtSemestersResponse>(
    '/json/ojt-semesters/search',
    requestBody
  );
  return response.data;
};

/**
 * GET /api/accounts/me/profile
 * Xem hồ sơ cá nhân của tài khoản đang đăng nhập.
 */
export const getAccountProfile = async (): Promise<AccountProfileResponse> => {
  const response = await API.get<AccountProfileResponse>('/accounts/me/profile');
  return response.data;
};

/**
 * POST /api/json/ojt-registrations/search
 * Tìm kiếm danh sách hồ sơ đăng ký OJT của sinh viên.
 */
export const searchOjtRegistrations = async (
  payload: SearchOjtRegistrationsRequest = {}
): Promise<SearchOjtRegistrationsResponse> => {
  const response = await API.post<SearchOjtRegistrationsResponse>(
    '/json/ojt-registrations/search',
    payload
  );
  return response.data;
};

// =========================================================================
// 1. LUỒNG TIẾP NHẬN DANH SÁCH SINH VIÊN TỪ PHÒNG ĐÀO TẠO (ACADEMIC -> QHDN)
// =========================================================================

/**
 * GET /api/ojt-semesters/:id/students
 * Tiếp nhận danh sách sinh viên trong kỳ OJT từ phòng đào tạo (kèm trạng thái bàn giao và đăng ký).
 */
export const listStudentsInSemester = async (
  ojtSemesterId: number,
  params: { page?: number; limit?: number; search?: string; registrationStatus?: string; coordinationStatus?: string } = { page: 1, limit: 100 }
): Promise<HandoffStudentListResponse> => {
  const response = await API.get<HandoffStudentListResponse>(
    `/ojt-semesters/${ojtSemesterId}/students`,
    { params }
  );
  return response.data;
};

/**
 * GET /api/ojt-semesters/:id/eligible-student-handoffs
 * Lịch sử các đợt bàn giao sinh viên đủ điều kiện từ phòng đào tạo sang QHDN.
 */
export const listHandoffBatches = async (
  ojtSemesterId: number,
  params: { page?: number; limit?: number } = { page: 1, limit: 50 }
): Promise<EligibleStudentHandoffBatchResponse> => {
  const response = await API.get<EligibleStudentHandoffBatchResponse>(
    `/ojt-semesters/${ojtSemesterId}/eligible-student-handoffs`,
    { params }
  );
  return response.data;
};

/**
 * GET /api/qhdn/registered-students
 * Danh sách sinh viên đã đăng ký và có bản ghi bàn giao thật từ đào tạo cùng kỳ.
 */
export const listRegisteredStudents = async (
  params: { page?: number; limit?: number; search?: string; ojtSemesterId?: number; status?: string } = { page: 1, limit: 100 }
): Promise<{ success: boolean; data: { items: any[]; total: number; page: number; limit: number } }> => {
  const response = await API.get<{ success: boolean; data: { items: any[]; total: number; page: number; limit: number } }>(
    '/qhdn/registered-students',
    { params }
  );
  return response.data;
};

/**
 * GET /api/academic-periods
 * Danh sách kỳ học và năm học do phòng đào tạo khởi tạo.
 */
export const getAcademicPeriods = async (
  params: { page?: number; limit?: number; search?: string; status?: string } = { page: 1, limit: 100 }
): Promise<{ success: boolean; items: AcademicPeriodItem[]; total: number; page: number; limit: number }> => {
  const response = await API.get<{ success: boolean; items: AcademicPeriodItem[]; total: number; page: number; limit: number }>(
    '/academic-periods',
    { params }
  );
  return response.data;
};

/**
 * GET /api/ojt-registration-windows
 * Danh sách các đợt mở đăng ký OJT (theo kỳ hoặc theo trạng thái).
 */
export const listRegistrationWindows = async (
  params: { ojtSemesterId?: number; status?: string; page?: number; limit?: number } = { page: 1, limit: 50 }
): Promise<ListRegistrationWindowsResponse> => {
  const response = await API.get<ListRegistrationWindowsResponse>(
    '/ojt-registration-windows',
    { params }
  );
  return response.data;
};

/**
 * POST /api/ojt-registration-windows
 * Tạo mới đợt đăng ký OJT (ở trạng thái DRAFT) với phạm vi danh sách sinh viên đủ điều kiện.
 */
export const createRegistrationWindow = async (
  payload: CreateRegistrationWindowRequest
): Promise<{ success: boolean; data: RegistrationWindowItem }> => {
  const response = await API.post<{ success: boolean; data: RegistrationWindowItem }>(
    '/ojt-registration-windows',
    payload
  );
  return response.data;
};

/**
 * PATCH /api/ojt-registration-windows/:id
 * Cập nhật thông tin đợt đăng ký (tên, hạn chót endsAt, lý do hoặc thay đổi status OPEN/CLOSED).
 */
export const updateRegistrationWindow = async (
  windowId: number,
  payload: UpdateRegistrationWindowRequest
): Promise<{ success: boolean; data: RegistrationWindowItem }> => {
  const response: any = await (API.patch as any)(
    `/ojt-registration-windows/${windowId}`,
    payload
  );
  return response.data;
};

/**
 * Mở đợt đăng ký OJT (chuyển status thành OPEN).
 */
export const openRegistrationWindow = async (
  windowId: number,
  reason = 'Mở cổng đăng ký OJT cho sinh viên đủ điều kiện'
): Promise<{ success: boolean; data: RegistrationWindowItem }> => {
  return updateRegistrationWindow(windowId, { status: 'OPEN', reason });
};

/**
 * Đóng đợt đăng ký OJT (chuyển status thành CLOSED).
 */
export const closeRegistrationWindow = async (
  windowId: number,
  reason = 'Hết hạn đăng ký OJT đợt này'
): Promise<{ success: boolean; data: RegistrationWindowItem }> => {
  return updateRegistrationWindow(windowId, { status: 'CLOSED', reason });
};

// =========================================================================
// 2. LUỒNG ĐIỀU PHỐI SINH VIÊN CHO DOANH NGHIỆP (QHDN -> ENTERPRISE)
// =========================================================================

/**
 * GET /api/ojt-coordinations
 * Danh sách sinh viên đã được điều phối cho doanh nghiệp đối tác.
 */
export const listCoordinations = async (
  params: { page?: number; limit?: number; ojtSemesterId?: number; companyId?: number; status?: string; search?: string } = { page: 1, limit: 100 }
): Promise<CoordinationListResponse> => {
  const response = await API.get<CoordinationListResponse>('/ojt-coordinations', { params });
  return response.data;
};

/**
 * POST /api/ojt-coordinations
 * Điều phối hồ sơ sinh viên đã bàn giao đến doanh nghiệp (lần đầu).
 */
export const coordinateStudent = async (
  payload: CreateCoordinationRequest
): Promise<{ success: boolean; data: any }> => {
  const response = await API.post<{ success: boolean; data: any }>(
    '/ojt-coordinations',
    payload
  );
  return response.data;
};

/**
 * POST /api/ojt-coordinations/:id/reassign
 * Điều phối lại cho sinh viên bị doanh nghiệp từ chối sang vị trí/doanh nghiệp khác.
 */
export const reassignStudent = async (
  coordinationId: number,
  payload: ReassignCoordinationRequest
): Promise<{ success: boolean; data: any }> => {
  const response = await API.post<{ success: boolean; data: any }>(
    `/ojt-coordinations/${coordinationId}/reassign`,
    payload
  );
  return response.data;
};

/**
 * POST /api/ojt-coordinations/:id/decision
 * Ghi nhận quyết định tiếp nhận sinh viên (ACCEPTED hoặc REJECTED) thay doanh nghiệp nếu cần.
 */
export const recordEnterpriseDecision = async (
  coordinationId: number,
  payload: EnterpriseDecisionRequest
): Promise<{ success: boolean; data: any }> => {
  const response = await API.post<{ success: boolean; data: any }>(
    `/ojt-coordinations/${coordinationId}/decision`,
    payload
  );
  return response.data;
};

/**
 * GET /api/assignments
 * Danh sách phân công thực tập chính thức (sau khi doanh nghiệp ACCEPTED).
 */
export const listAssignments = async (
  params: { page?: number; limit?: number; companyId?: number; ojtSemesterId?: number; status?: string; search?: string } = { page: 1, limit: 100 }
): Promise<AssignmentListResponse> => {
  const response = await API.get<AssignmentListResponse>('/assignments', { params });
  return response.data;
};

/**
 * POST /api/assignments
 * Tạo phân công thực tập sau khi điều phối được doanh nghiệp chấp thuận.
 */
export const createAssignment = async (
  payload: CreateAssignmentRequest
): Promise<{ success: boolean; data: any }> => {
  const response = await API.post<{ success: boolean; data: any }>(
    '/assignments',
    payload
  );
  return response.data;
};

/**
 * PATCH /api/assignments/:id
 * Cập nhật phân công (thời gian thực tập, người hướng dẫn, trạng thái ACTIVE/COMPLETED/CANCELLED).
 */
export const updateAssignment = async (
  assignmentId: number,
  payload: UpdateAssignmentRequest
): Promise<{ success: boolean; data: any }> => {
  const response: any = await API.patch(
    `/assignments/${assignmentId}`,
    payload
  );
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
  params: { page?: number; limit?: number; ojtSemesterId?: number; companyId?: number; status?: string; search?: string } = { page: 1, limit: 100 }
): Promise<InternshipEvaluationListResponse> => {
  const response = await API.get<InternshipEvaluationListResponse>(
    '/internship-evaluations',
    { params }
  );
  return response.data;
};

/**
 * POST /api/ojt-results
 * Chuyển giao kết quả đánh giá OJT của sinh viên cho phòng đào tạo (ACADEMIC).
 * Yêu cầu: Quyền OJT_COORD hoặc ADMIN, phân công đã COMPLETED và có đánh giá SUBMITTED từ DN.
 */
export const transferOjtResult = async (
  payload: TransferOjtResultRequest
): Promise<{ success: boolean; data: any }> => {
  const response = await API.post<{ success: boolean; data: any }>(
    '/ojt-results',
    payload
  );
  return response.data;
};

/**
 * GET /api/ojt-results
 * Danh sách kết quả OJT đã chuyển giao cho phòng đào tạo (và theo dõi trạng thái xác nhận CONFIRMED).
 */
export const listOjtResults = async (
  params: { page?: number; limit?: number; ojtSemesterId?: number; status?: string; search?: string } = { page: 1, limit: 100 }
): Promise<OjtResultListResponse> => {
  const response = await API.get<OjtResultListResponse>('/ojt-results', { params });
  return response.data;
};

/**
 * GET /api/ojt-semesters/:id/results/export
 * Xuất danh sách kết quả OJT theo học kỳ dưới định dạng CSV hoặc PDF.
 */
export const exportOjtResultsUrl = (
  ojtSemesterId: number,
  format: 'csv' | 'pdf' = 'csv'
): string => {
  const token = localStorage.getItem('ojt_auth_token') || '';
  return `${API_BASE_URL}/ojt-semesters/${ojtSemesterId}/results/export?format=${format}&token=${token}`;
};

// =========================================================================
// 4. DASHBOARD & BÁO CÁO QHDN
// =========================================================================

/**
 * GET /api/qhdn/dashboard
 * Dữ liệu tổng quan phòng QHDN (bàn giao, sức chứa, tiếp nhận, kết quả).
 */
export const getQhdnDashboard = async (
  params: { ojtSemesterId?: number; companyId?: number } = {}
): Promise<{ success: boolean; data: QhdnDashboardData }> => {
  const response = await API.get<{ success: boolean; data: QhdnDashboardData }>(
    '/qhdn/dashboard',
    { params }
  );
  return response.data;
};

/**
 * GET /api/qhdn/reports
 * Báo cáo chi tiết QHDN theo loại: acceptance | internships | enterprise-feedback
 */
export const getQhdnReports = async (
  type: 'acceptance' | 'internships' | 'enterprise-feedback',
  params: { ojtSemesterId?: number; companyId?: number; page?: number; limit?: number } = { page: 1, limit: 100 }
): Promise<{ success: boolean; data: any }> => {
  const response = await API.get<{ success: boolean; data: any }>('/qhdn/reports', {
    params: { type, ...params },
  });
  return response.data;
};
