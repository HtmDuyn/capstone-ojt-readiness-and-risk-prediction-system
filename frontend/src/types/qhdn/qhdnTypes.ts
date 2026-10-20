export type SemesterOption = 'Summer 2026' | 'Spring 2026' | 'Fall 2025' | 'Summer 2025';

export interface EnterprisePartner {
  id: string;
  name: string;
  code: string;
  logoUrl?: string;
  industry: string;
  tier: 'Tier-1 Gold' | 'Tier-2 Silver' | 'Tier-3 Standard';
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  mouStatus: 'Active' | 'Pending Renewal' | 'Draft';
  mouSignedDate: string;
  mouExpiryDate: string;
  totalQuota: number;
  acceptedCount: number;
  availableQuota: number;
  semester?: string;
  semesters?: string[];
  cohorts?: string[];
}

export interface InternshipPosition {
  id: string;
  enterpriseId: string;
  enterpriseName: string;
  title: string;
  department: string;
  location: string;
  workType: 'Onsite' | 'Hybrid' | 'Remote';
  stipend: string;
  totalSlots: number;
  filledSlots: number;
  requiredSkills: string[];
  description: string;
  requirements: string;
  status: 'Open' | 'Closed' | 'Draft';
}

export interface EligibleStudent {
  id: string;
  studentCode: string;
  fullName: string;
  avatarUrl?: string;
  major: string;
  gpa: number;
  completedCredits: number;
  englishLevel: string;
  readinessScore: number; // 0 - 100
  topSkills: string[];
  ojtEligibilityStatus: 'Qualified' | 'Pending Review';
  assignedEnterpriseId?: string;
  assignedEnterpriseName?: string;
  assignedPositionId?: string;
  assignedPositionTitle?: string;
  coordinationStatus: 'Unassigned' | 'Pending Response' | 'Accepted' | 'Rejected' | 'Interviewing';
  rejectionReason?: string;
  assignedDate?: string;
}

export interface EnterpriseEvaluation {
  id: string;
  studentCode: string;
  studentName: string;
  major: string;
  enterpriseName: string;
  positionTitle: string;
  evaluatorName: string;
  evaluatorRole: string;
  evaluationDate: string;
  technicalScore: number; // Max 10
  softSkillScore: number; // Max 10
  attitudeScore: number; // Max 10
  overallScore: number; // Max 10
  grade: 'Excellent' | 'Good' | 'Satisfactory' | 'Unsatisfactory';
  recommendForHire: boolean;
  comments: string;
}

export interface SemesterStats {
  semester: SemesterOption;
  totalEligibleStudents: number;
  placedStudents: number;
  pendingStudents: number;
  rejectedStudents: number;
  reassignedStudents: number;
  acceptanceRate: number; // percentage
  enterpriseResponseRate: number; // percentage
  totalPartnerEnterprises: number;
  totalQuotaAvailable: number;
}

export interface ExtractedEnterprise {
  id: string;
  fileName: string;
  fileSize: string;
  name: string;
  shortName: string;
  email: string;
  contactPerson: string;
  contactRole: string;
  phone: string;
  industry: string;
  website: string;
  address: string;
  description: string;
  positionsCount: number;
  quota: number;
  status: 'valid' | 'missing_jd' | 'need_review' | 'error';
  statusText: string;
  createAccount: boolean;
  logoBg: string;
  logoText: string;
  semester?: string;
  semesters?: string[];
}

export interface SelectedFileItem {
  name: string;
  size: string;
}

// ─── IMPORT PREVIEW API TYPES ────────────────────────────────────────────────

export interface ImportPositionRow {
  code: string;
  title: string;
  description?: string;
  requirements?: string;
  capacity: number;
}

export interface ImportEnterpriseRow {
  code: string;
  email: string;
  fullName: string;
  name: string;
  address?: string;
  positions?: ImportPositionRow[];
}

export interface ImportPreviewRequest {
  kind: 'ENTERPRISE';
  idempotencyKey: string;
  semesterId: number;
  rows: ImportEnterpriseRow[];
}

export interface ImportPreviewRowResult {
  rowNumber: number;
  code: string;
  action: 'CREATED' | 'UPDATED' | 'SKIPPED' | 'ERROR';
  error?: string;
}

export interface ImportPreviewResponse {
  success: boolean;
  total: number;
  created: number;
  updated: number;
  errors: string[];
  canCommit: boolean;
  preview: boolean;
  rows: ImportPreviewRowResult[];
}

export interface ImportCommitResponse {
  success: boolean;
  total: number;
  created: number;
  updated: number;
  errors: string[];
  canCommit: boolean;
  /** ID của batch import đã được lưu vào hệ thống */
  batchId: number;
  /** true nếu idempotencyKey đã được dùng trước đó (replay) */
  replayed: boolean;
}

export interface ImportArchiveResponse {
  success: boolean;
  /** Số lượng bản ghi tuyển dụng đã được lưu trữ */
  archivedCount: number;
}

/**
 * Payload gửi lên POST /api/companies
 */
export interface CreateCompanyRequest {
  enterpriseCode: string;
  name: string;
  address?: string;
  industry?: string;
  contactPersonName?: string;
  contactPhone?: string;
  contactEmail?: string;
  status?: string;
  reason?: string;
  code?: string;
}

/**
 * Thông tin chi tiết doanh nghiệp trả về sau khi tạo mới
 */
export interface CompanyData {
  id: number;
  enterpriseCode: string;
  name: string;
  address?: string;
  industry?: string;
  contactPersonName?: string;
  contactPhone?: string;
  contactEmail?: string;
  status: string;
  createdAt: string;
  code?: string;
}

/**
 * Response trả về từ POST /api/companies (201 Created)
 */
export interface CreateCompanyResponse {
  success: boolean;
  data: CompanyData;
  message?: string;
}

/**
 * Request payload cho POST /api/positions
 */
export interface CreatePositionRequest {
  enterpriseId?: number;
  ojtSemesterId?: number;
  title: string;
  description?: string;
  requirements?: string;
  capacity: number;
  status?: string;
  reason?: string;
  companyId?: number;
  recruitmentCode?: string;
  location?: string;
  workMode?: 'ONSITE' | 'REMOTE' | 'HYBRID' | string;
}

/**
 * Chi tiết vị trí tuyển dụng OJT trả về sau khi tạo mới
 */
export interface PositionData {
  id: number;
  enterpriseId?: number;
  ojtSemesterId?: number;
  recruitmentCode?: string;
  title: string;
  description?: string;
  requirements?: string;
  capacity: number;
  status: string;
  location?: string;
  workMode?: string;
  companyId?: number;
  remainingSlots?: number;
}

/**
 * Response trả về từ POST /api/positions (201 Created)
 */
export interface CreatePositionResponse {
  success: boolean;
  data: PositionData;
  message?: string;
}

/**
 * Payload cho POST /api/json/ojt-semesters/search
 */
export interface SearchOjtSemestersRequest {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  academicYearId?: number;
}

/**
 * Thông tin một kỳ OJT trong danh sách items trả về từ POST /api/json/ojt-semesters/search
 */
export interface OjtSemesterItem {
  id: number;
  academicYearId?: number;
  semesterCode?: string;
  name?: string;
  code?: string;
  academicPeriodId?: number | null;
  startDate?: string;
  endDate?: string;
  regStartDate?: string;
  regEndDate?: string;
  status?: string;
  academicYearName?: string;
  [key: string]: any;
}

/**
 * Response trả về từ POST /api/json/ojt-semesters/search
 */
export interface SearchOjtSemestersResponse {
  success: boolean;
  items: OjtSemesterItem[];
  page: number;
  limit: number;
  total: number;
}

/**
 * Thông tin hồ sơ tài khoản từ GET /api/accounts/me/profile
 */
export interface AccountProfile {
  id: number;
  username: string;
  email: string;
  phone: string | null;
  full_name: string;
  status: string;
  role_id: number;
  role_code: string;
  role_name: string;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

/**
 * Response trả về từ GET /api/accounts/me/profile
 */
export interface AccountProfileResponse {
  success: boolean;
  account: AccountProfile;
  message?: string;
}

/**
 * Request payload cho POST /api/json/ojt-registrations/search
 * Danh sách hồ sơ đăng ký OJT
 */
export interface SearchOjtRegistrationsRequest {
  ojtSemesterId?: number;
  windowId?: number;
  studentId?: number;
  programId?: number;
  cohortId?: number;
  groupCode?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Thông tin một hồ sơ đăng ký OJT
 */
export interface OjtRegistrationItem {
  id?: number;
  studentId?: number;
  studentCode?: string;
  studentName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  major?: string;
  gpa?: number;
  credits?: number;
  status?: string;
  groupCode?: string;
  ojtSemesterId?: number;
  windowId?: number;
  programId?: number;
  cohortId?: number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

/**
 * Response trả về từ POST /api/json/ojt-registrations/search
 */
export interface SearchOjtRegistrationsResponse {
  success: boolean;
  data: {
    items: OjtRegistrationItem[];
    total: number;
    page: number;
    limit: number;
  };
  message?: string;
}
