import API from './api';
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
 * Tạo idempotencyKey ngẫu nhiên cho mỗi lần import.
 */
export const generateIdempotencyKey = (): string => {
  return `enterprise-import-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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
  params: { page?: number; limit?: number } = { page: 1, limit: 100 }
): Promise<CompanyListResponse> => {
  const response = await API.get<CompanyListResponse>('/companies', { params });
  return response.data;
};

/**
 * POST /api/json/positions/list
 * Danh sách vị trí thực tập kèm thông tin doanh nghiệp và học kỳ.
 */
export const listPositions = async (
  params: { page?: number; limit?: number } = { page: 1, limit: 20 }
): Promise<PositionListResponse> => {
  const response = await API.post<PositionListResponse>('/json/positions/list', {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  });
  return response.data;
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
