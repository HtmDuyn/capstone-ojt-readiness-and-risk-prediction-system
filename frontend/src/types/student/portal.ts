export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
export interface Named {
  id: number;
  name: string;
  code?: string;
}
export interface CV {
  id: number;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}
export interface Requirement {
  id: number;
  courseId: number | null;
  courseCode: string;
  name: string;
  credits: number | null;
  completed: boolean;
  choices: number[];
  learningStatus?: string;
}
export interface AcademicProgress {
  gpa: number | null;
  gpaScale: number | null;
  status: string;
  computedAt: string;
  issues: string[];
  credits: {
    earned: number;
    total: number | null;
    remaining: number | null;
    completeConfiguration?: boolean;
  };
  requirements: Requirement[];
}
export interface Eligibility {
  status: string;
  isStale?: boolean;
  missingCredits: number | null;
  earnedCredits: number;
  unpassedCourseCount: number;
  reasons: string[];
  academicIssues?: string[];
  rule?: { minCredits: number; maxUnpassedCourses: number } | null;
}
export interface AdmissionEligibility extends Eligibility {
  source: 'FRONTEND_HANDOFF' | 'OFFICIAL_CHECK';
  handoffId: number;
  batchId?: number;
  handedOffAt?: string;
}
export interface CourseResult {
  id: number;
  courseId: number;
  courseCode: string;
  courseName: string;
  score: number | null;
  gradePoints: number | null;
  status: string;
  attemptNumber: number;
  semesterTaken: number | null;
  periodName?: string;
  periodCode?: string;
}
export interface Registration {
  id: number;
  ojtSemesterId: number;
  windowId: number;
  status: string;
  registeredAt: string;
  semester?: Named;
  window?: Named;
  application?: {
    contactPhone?: string;
    contactEmail?: string;
    note?: string;
    cv?: CV | null;
  };
  review?: { reason?: string } | null;
}
export interface Profile {
  id: number;
  userId: number;
  studentCode: string;
  fullName: string;
  email: string;
  phone: string | null;
  currentSemester: number | null;
  className: string | null;
  programId: number | null;
  program:
    (Named & { majorName?: string; totalCredits?: number | null }) | null;
  currentAcademicPeriod: Named | null;
  cv: CV | null;
  academicProgress: AcademicProgress;
  ojtSemesterId: number | null;
  officialEligibility: Eligibility | null;
  admissionEligibility?: AdmissionEligibility | null;
  officialDecision: string;
  courseResults: Page<CourseResult>;
  ojtRegistrations: Page<Registration>;
  comboSelections: {
    id: number;
    code: string;
    name: string;
    courses: {
      id: number;
      code: string;
      name: string;
      credits: number | null;
    }[];
  }[];
}
export interface Window {
  id: number;
  name: string;
  ojtSemesterId: number;
  semester?: Named;
  startsAt: string;
  endsAt: string;
  effectiveEndsAt?: string;
  status: string;
  canSubmit?: boolean;
  blockingReasons?: string[];
  blockingMessages?: string[];
  registration?: { id: number; status: string } | null;
  phase?: string;
  selection?: { comboId: number; courseIds: number[] } | null;
  confirmedSelection?: { comboId: number; courseIds: number[] } | null;
  reasonRequiredOnChange?: boolean;
  availableCombos?: Combo[];
}
export interface Combo {
  id: number;
  code: string;
  name: string;
  courses: {
    courseId: number;
    courseCode: string;
    name: string;
    credits: number | null;
  }[];
  choiceGroups: {
    code: string;
    minCourses: number;
    maxCourses: number;
    courseIds: number[];
  }[];
}
export interface AcademicSummary {
  studentId: number;
  earnedCredits: number;
  missingCredits: number | null;
  failedCourseCount: number;
  outstandingCourses: Requirement[];
  gpa: number | null;
  gpaScale: number | null;
  issues: string[];
  currentEligibility: Eligibility | null;
  officialEligibility: Eligibility | null;
  admissionEligibility?: AdmissionEligibility | null;
  inProgressCredits: number | null;
  scenario: { potentialCredits: number | null; isAiPrediction: false };
  deadline: { assessmentDeadline: string | null } | null;
}
export interface Assignment {
  id: number;
  enterpriseId: number;
  enterpriseName: string;
  title: string;
  ojtSemesterId: number;
  enterpriseSupervisorName: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
}
export interface PortalNotification {
  id: number;
  title: string;
  content: string | null;
  sentAt: string | null;
  isRead: boolean | null;
}
export interface Dashboard {
  academic: AcademicSummary & { supplementaryCourses: Supplementary };
  registrationWindows: Page<Window>;
  comboWindows: Page<Window>;
  internship: Internships;
  notifications: Page<PortalNotification> & { unreadCount: number };
  jobApplications: Page<Application>;
}
export interface Internships {
  studentId: number;
  ojtSemesterId: number | null;
  assignment: Assignment | null;
  tasks: Page<Task>;
  results: Page<OjtResult>;
  result: OjtResult | null;
}
export interface Opportunity {
  id: number;
  title: string;
  description: string | null;
  requirements: string | null;
  location: string | null;
  workMode: string | null;
  capacity: number;
  remainingSlots: number;
  canApply: boolean;
  blockers: string[];
  company: Named & { address: string | null };
  post: {
    id: number;
    title: string;
    deadlineAt: string | null;
    content: string | null;
    benefits: string | null;
  };
}
export interface Opportunities extends Page<Opportunity> {
  registrationId: number | null;
  canApply: boolean;
  blockers: string[];
}
export interface Application {
  id: number;
  registrationId: number;
  ojtSemesterId: number;
  status: string;
  appliedAt: string;
  company: Named;
  position: { id: number; title: string };
  coverLetter: string | null;
  reviewNote: string | null;
  coordination: { decision: string | null; rejectReason: string | null } | null;
}
export interface Task {
  id: number;
  assignmentId: number;
  name: string;
  description: string | null;
  assignedDate: string | null;
  dueDate: string | null;
  status: string;
  canSubmit: boolean;
  submissionCount: number;
  latestSubmission: TaskSubmission | null;
  company?: { id: number; name: string };
}
export interface TaskSubmission {
  id: number;
  taskId: number;
  studentId: number;
  content: string;
  submittedAt: string;
  isLate: boolean;
}
export interface OjtResult {
  id: number;
  enterpriseName: string;
  semesterCode: string;
  officialScore: number | null;
  completionScore: number | null;
  attitudeScore: number | null;
  skillScore: number | null;
  comments: string | null;
  confirmedAt: string | null;
  outcome: string | null;
  status: string;
}
export interface Roadmap {
  modelVersion: string;
  recommendations: string[];
  isAiRecommendation: boolean;
}
export interface Supplementary {
  items: {
    requirementId: number;
    courseCode: string;
    name: string;
    credits: number | null;
    reason: string;
    prerequisites: { minimumPassed: number; courseIds: number[] }[];
  }[];
  issues: string[];
}
export interface Curriculum {
  id: number;
  name: string;
  code: string;
  version: string;
  courses: {
    id: number;
    courseId: number;
    courseCode: string;
    name: string;
    credits: number | null;
    semester: number | null;
    prerequisiteText: string | null;
  }[];
  prerequisites: {
    courseId: number;
    minimumPassed: number;
    prerequisiteCourseIds: number[];
  }[];
}
