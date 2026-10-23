

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
  code: string;
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

export interface CompanyListItem {
  id: number;
  code: string;
  name: string;
  address?: string | null;
  industry?: string | null;
  contactPersonName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  status: string;
  createdAt?: string;
}

export interface CompanyListResponse {
  success: boolean;
  data: {
    items: CompanyListItem[];
    total: number;
    page: number;
    limit: number;
  };
}

export interface PositionListItem {
  id: number;
  companyId: number;
  ojtSemesterId: number;
  recruitmentCode: string;
  title: string;
  description: string;
  requirements: string;
  capacity: number;
  remainingSlots: number;
  status: string;
  location?: string | null;
  workMode?: string | null;
  companyName?: string;
  company?: {
    id: number;
    code?: string;
    name: string;
    status?: string;
    address?: string | null;
    industry?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    contactPersonName?: string | null;
  } | null;
  semesterCode?: string;
  semester?: {
    id: number;
    code?: string;
    name?: string;
    status?: string;
  } | null;
}

export interface PositionListResponse {
  success: boolean;
  data: {
    items: PositionListItem[];
    total: number;
    page: number;
    limit: number;
  };
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

/** OJT semester options for QHDN screens. */
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

// =========================================================================
// TYPES CHO LUỒNG ĐIỀU PHỐI, DOANH NGHIỆP DUYỆT, ĐÁNH GIÁ VÀ CHUYỂN GIAO PĐT
// =========================================================================

/**
 * Payload cho POST /api/ojt-coordinations (Điều phối lần đầu)
 */
export interface CreateCoordinationRequest {
  registrationId: number;
  companyId: number;
  positionId: number;
  notes?: string;
  idempotencyKey?: string;
}

/**
 * Payload cho POST /api/ojt-coordinations/:id/reassign (Điều phối lại sau khi bị từ chối)
 */
export interface ReassignCoordinationRequest {
  registrationId?: number;
  companyId: number;
  positionId: number;
  notes?: string;
  reason?: string;
  idempotencyKey?: string;
}

/**
 * Payload cho POST /api/ojt-coordinations/:id/decision (Ghi nhận quyết định Doanh nghiệp)
 */
export interface EnterpriseDecisionRequest {
  decision: 'ACCEPTED' | 'REJECTED';
  reason?: string;
}

/**
 * Payload cho POST /api/assignments (Tạo phân công sau khi DN duyệt)
 */
export interface CreateAssignmentRequest {
  coordinationId: number;
  registrationId?: number;
  companyId?: number;
  positionId?: number;
  enterpriseSupervisorName?: string;
  enterpriseSupervisorEmail?: string;
  enterpriseSupervisorPhone?: string;
  startDate?: string;
  endDate?: string;
  idempotencyKey?: string;
}

/**
 * Payload cho PATCH /api/assignments/:id
 */
export interface UpdateAssignmentRequest {
  enterpriseSupervisorName?: string;
  enterpriseSupervisorEmail?: string;
  enterpriseSupervisorPhone?: string;
  status?: 'ASSIGNED' | 'ACTIVE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  startDate?: string;
  endDate?: string;
}

/**
 * Payload cho POST /api/ojt-results (Chuyển giao kết quả OJT cho Phòng Đào tạo)
 */
export interface TransferOjtResultRequest {
  assignmentId: number;
  reason: string;
  idempotencyKey: string;
}

/**
 * Thông tin một lượt điều phối OJT
 */
export interface CoordinationItem {
  id: number;
  registrationId: number;
  companyId: number;
  positionId: number;
  ojtSemesterId: number;
  decision: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  rejectReason?: string;
  decisionAt?: string;
  coordinatedAt?: string;
  student?: {
    id: number;
    studentCode: string;
    fullName: string;
    email?: string;
    phone?: string;
    cohortName?: string;
    programName?: string;
  };
  company?: {
    id: number;
    code: string;
    name: string;
    contactPersonName?: string;
    contactEmail?: string;
  };
  position?: {
    id: number;
    code?: string;
    title: string;
    capacity: number;
    remainingSlots?: number;
    location?: string;
    workMode?: string;
  };
  registration?: any;
  replayed?: boolean;
}

export interface CoordinationListResponse {
  success: boolean;
  data: {
    items: CoordinationItem[];
    total: number;
    page: number;
    limit: number;
  };
  message?: string;
}

/**
 * Thông tin phân công thực tập (InternshipAssignment)
 */
export interface AssignmentItem {
  id: number;
  coordinationId: number;
  studentId: number;
  companyId: number;
  positionId: number;
  ojtSemesterId: number;
  status: 'ASSIGNED' | 'ACTIVE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  startDate?: string;
  endDate?: string;
  enterpriseSupervisorName?: string;
  enterpriseSupervisorEmail?: string;
  enterpriseSupervisorPhone?: string;
  student?: any;
  company?: any;
  position?: any;
}

export interface AssignmentListResponse {
  success: boolean;
  data: {
    items: AssignmentItem[];
    total: number;
    page: number;
    limit: number;
  };
  message?: string;
}

/**
 * Thông tin phiếu đánh giá thực tập từ DN (InternshipEvaluations)
 */
export interface InternshipEvaluationItem {
  id: number;
  assignmentId: number;
  completionScore: number;
  attitudeScore: number;
  skillScore: number;
  overallScore: number;
  comments?: string;
  status: string;
  evaluatedBy?: number;
  evaluatedByUser?: { fullName?: string; email?: string } | null;
  evaluatedAt?: string;
  studentCode?: string;
  fullName?: string;
  companyName?: string;
  positionTitle?: string;
  student?: any;
  company?: any;
  position?: any;
  assignment?: any;
  semester?: any;
}

export interface InternshipEvaluationListResponse {
  success: boolean;
  data: {
    items: InternshipEvaluationItem[];
    total: number;
    page: number;
    limit: number;
  };
  message?: string;
}

/**
 * Thông tin kết quả OJT đã chuyển giao cho phòng đào tạo (OJTResults)
 */
export interface OjtResultItem {
  id: number;
  evaluationId?: number;
  assignmentId: number;
  studentId: number;
  companyId?: number;
  positionId?: number;
  programId?: number;
  studentCode: string;
  fullName: string;
  enterpriseName: string;
  ojtSemesterId: number;
  semesterCode?: string;
  status: 'PENDING_ACADEMIC_CONFIRMATION' | 'REVISION_REQUESTED' | 'CONFIRMED';
  officialScore: number | null;
  completionScore?: number | null;
  attitudeScore?: number | null;
  skillScore?: number | null;
  comments?: string;
  outcome?: string | null;
  transferredBy?: number;
  transferredAt?: string;
  confirmedBy?: number;
  confirmedAt?: string;
  student?: any;
  company?: any;
  position?: any;
  program?: any;
}

export interface OjtResultListResponse {
  success: boolean;
  data: {
    items: OjtResultItem[];
    total: number;
    page: number;
    limit: number;
  };
  message?: string;
}

/**
 * Sinh viên trong kỳ OJT nhận từ phòng đào tạo (GET /api/ojt-semesters/:id/students)
 */
export interface HandoffStudentItem {
  studentId: number;
  studentCode: string;
  fullName: string;
  email?: string;
  phone?: string;
  major?: string;
  cohortName?: string;
  programName?: string;
  programCode?: string;
  programId?: number;
  cohortId?: number;
  gpa?: number;
  englishLevel?: string;
  groupCode?: string;
  handoffStatus?: 'HANDED_OFF' | 'NOT_HANDED_OFF';
  handoffId?: number;
  handoff?: {
    id: number;
    reason?: string;
    createdAt?: string;
    createdBy?: number;
    createdByUser?: {
      id: number;
      fullName: string;
    };
  };
  registrationStatus?: string;
  legacyRegistrationStatus?: string | null;
  registrationId?: number | null;
  registration?: {
    id: number;
    status: string;
    registeredAt?: string;
    programId?: number;
    application?: {
      contactEmail?: string;
      contactPhone?: string;
      note?: string;
      cvUrl?: string;
    };
  };
  window?: {
    id: number;
    name: string;
    status: string;
    startsAt: string;
    endsAt: string;
    academicPeriodId?: number;
  };
  officialCheckId?: number;
  officialEligibilityStatus?: string;
  confirmedAt?: string;
  eligibilityValidity?: string | null;
  officialEligibility?: {
    checkId?: number;
    status?: string;
    validity?: string;
    checkedAt?: string;
    confirmedAt?: string;
    confirmedBy?: number;
    result?: {
      ruleSetId?: number;
      studentId?: number;
      earnedCredits?: number;
      minCredits?: number;
      missingCredits?: number;
      unpassedCourseCount?: number;
      excessUnpassedCourses?: number;
      status?: string;
      reasons?: any[];
      unpassedCourses?: any[];
      academicIssues?: any[];
      rule?: any;
    };
  };
  coordinationId?: number;
  coordinationStatus?: 'NOT_COORDINATED' | 'PENDING' | 'ACCEPTED' | 'REJECTED';
  coordination?: {
    id: number;
    applicationId?: number;
    decision: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    decisionAt?: string;
    rejectReason?: string;
    coordinatedAt?: string;
  };
  assignmentId?: number;
  assignmentStatus?: string;
  assignmentStartDate?: string;
  assignmentEndDate?: string;
  assignment?: {
    id: number;
    status: string;
    enterpriseSupervisorName?: string;
    startDate?: string;
    endDate?: string;
    academicSupervisor?: any;
  };
  enterpriseId?: number;
  positionId?: number;
  enterpriseDecision?: string;
  enterpriseName?: string;
  positionTitle?: string;
  ojtStatus?: string;
  student?: any;
  program?: any;
  cohort?: any;
  semester?: any;
  company?: any;
  position?: any;
  cv?: any;
}

export interface HandoffStudentListResponse {
  success: boolean;
  data: {
    ojtSemesterId?: number;
    items: HandoffStudentItem[];
    total: number;
    page: number;
    limit: number;
  };
  message?: string;
}

/**
 * Đợt bàn giao sinh viên từ Đào tạo (GET /api/ojt-semesters/:id/eligible-student-handoffs)
 */
export interface EligibleStudentHandoffBatch {
  id: number;
  handoffId: number;
  ojtSemesterId: number;
  totalStudents: number;
  handedOffBy: number;
  handedOffAt: string;
  reason?: string;
}

export interface EligibleStudentHandoffBatchResponse {
  success: boolean;
  data: {
    items: EligibleStudentHandoffBatch[];
    total: number;
    page: number;
    limit: number;
  };
  message?: string;
}

export interface QhdnDashboardData {
  filters: { ojtSemesterId: number | null; companyId: number | null };
  partners: { total: number; active: number; inactive: number };
  positions: {
    total: number;
    open: number;
    totalCapacity: number;
    occupiedSlots: number;
    remainingSlots: number;
    openRemainingSlots: number;
  };
  students: {
    handedOff: number;
    unallocated: number;
    notCoordinated: number;
    waitingForEnterprise: number;
    enterpriseRejected: number;
    acceptedAwaitingAssignment: number;
    assigned: number;
  };
  assignments: {
    total: number;
    assigned: number;
    active: number;
    completed: number;
    failed: number;
    cancelled: number;
  };
  results: {
    total: number;
    pending: number;
    revisionRequested: number;
    confirmed: number;
    passed: number;
    failed: number;
  };
}

/**
 * Học kỳ học vụ (Academic Period) lấy từ GET /api/academic-periods
 */
export interface AcademicPeriodItem {
  id: number;
  periodCode: string;
  name: string;
  kind: 'SEMESTER' | 'BLOCK3';
  status: string;
  startDate: string;
  endDate: string;
  academicYearId: number;
  parentPeriodId?: number | null;
  academicYear?: {
    id: number;
    code: string;
    status: string;
    startDate: string;
    endDate: string;
  };
  ojtSemesterId?: number | null;
  ojt?: {
    id: number;
    name: string;
    semesterCode: string;
    status: string;
    startDate: string;
    endDate: string;
    regStartDate?: string | null;
    regEndDate?: string | null;
    academicYearId: number;
    academicPeriodId: number;
  } | null;
  semester?: {
    id: number;
    code: string;
    name: string;
    status: string;
    startDate: string;
    endDate: string;
    academicYearId: number;
    academicPeriodId: number;
  } | null;
}

/**
 * Đợt đăng ký OJT từ GET /api/ojt-registration-windows
 */
export interface RegistrationWindowItem {
  id: number;
  name: string;
  ojtSemesterId: number;
  academicPeriodId?: number;
  requiredRelativeSemester?: number;
  status: 'DRAFT' | 'OPEN' | 'CLOSED';
  startsAt: string;
  endsAt: string;
  scope: {
    studentIds?: number[];
    programIds?: number[];
    cohortIds?: number[];
    majorIds?: number[];
    groupCodes?: string[];
  };
  reason?: string;
  createdBy?: number;
  createdAt?: string;
  updatedAt?: string;
  openedBy?: number | null;
  openedAt?: string | null;
  closedBy?: number | null;
  closedAt?: string | null;
  semester?: {
    id: number;
    code: string;
    name: string;
    status?: string;
  };
  period?: {
    id: number;
    code: string;
    kind: string;
    name: string;
    startDate?: string;
    endDate?: string;
  };
  createdByUser?: {
    id: number;
    fullName: string;
  };
  openedByUser?: {
    id: number;
    fullName: string;
  } | null;
  closedByUser?: {
    id: number;
    fullName: string;
  } | null;
  semesterCode?: string;
}

export interface CreateRegistrationWindowRequest {
  ojtSemesterId: number;
  name: string;
  scope: {
    studentIds?: number[];
    programIds?: number[];
    cohortIds?: number[];
    majorIds?: number[];
    groupCodes?: string[];
  };
  startsAt: string;
  endsAt: string;
  reason?: string;
  academicPeriodId?: number;
  requiredRelativeSemester?: number;
}

export interface UpdateRegistrationWindowRequest {
  name?: string;
  endsAt?: string;
  reason?: string;
  status?: 'OPEN' | 'CLOSED';
}

export interface ListRegistrationWindowsResponse {
  success: boolean;
  data: {
    items: RegistrationWindowItem[];
    total: number;
    page: number;
    limit: number;
  };
}

