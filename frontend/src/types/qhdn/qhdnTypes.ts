export interface ImportPreviewRowResult {
  rowNumber: number;
  code: string;
  action: "CREATED" | "UPDATED" | "SKIPPED" | "ERROR";
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

// =========================================================================
// TYPES CHO LUỒNG ĐIỀU PHỐI, DOANH NGHIỆP DUYỆT, ĐÁNH GIÁ VÀ CHUYỂN GIAO PĐT
// =========================================================================

/**
 * Payload cho POST /api/ojt-coordinations (Điều phối lần đầu)
 */
export interface CreateCoordinationRequest {
  registrationId: number;
  positionId: number;
  applicationId?: number;
  reason: string;
  idempotencyKey: string;
}

/**
 * Payload cho POST /api/ojt-coordinations/:id/reassign (Điều phối lại sau khi bị từ chối)
 */
export interface ReassignCoordinationRequest {
  positionId: number;
  reason: string;
  idempotencyKey: string;
}

/**
 * Payload cho POST /api/ojt-coordinations/:id/decision (Ghi nhận quyết định Doanh nghiệp)
 */
export interface EnterpriseDecisionRequest {
  decision: "ACCEPTED" | "REJECTED";
  reason: string;
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
  decision: "PENDING" | "ACCEPTED" | "REJECTED";
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
  status:
    | "ASSIGNED"
    | "ACTIVE"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "FAILED"
    | "CANCELLED";
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
  completionScore: number | null;
  attitudeScore: number | null;
  skillScore: number | null;
  overallScore: number | null;
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
  status: "PENDING_ACADEMIC_CONFIRMATION" | "REVISION_REQUESTED" | "CONFIRMED";
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
  handoffStatus?: "HANDED_OFF" | "NOT_HANDED_OFF";
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
  coordinationStatus?: "NOT_COORDINATED" | "PENDING" | "ACCEPTED" | "REJECTED";
  coordination?: {
    id: number;
    applicationId?: number;
    decision: "PENDING" | "ACCEPTED" | "REJECTED";
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
  kind: "SEMESTER" | "BLOCK3";
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
  status: "DRAFT" | "OPEN" | "CLOSED";
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
  status?: "OPEN" | "CLOSED";
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
