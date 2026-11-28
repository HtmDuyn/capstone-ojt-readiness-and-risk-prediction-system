export type ProgressStatus = "Đúng tiến độ" | "Chậm tiến độ" | "Chưa xác định";

export type SubjectStatus =
  "Passed" | "Not Passed" | "Not Started" | "In Progress" | "Chưa xác định";

export type OjtEligibilityStatus =
  "Đủ điều kiện" | "Chưa đủ điều kiện" | "Chưa có kết quả" | "Chưa đủ dữ liệu" | "Cần xét lại";

export interface StudentSubject {
  id: string;
  curriculumSemester: number | null;
  actualTerm: string;
  code: string;
  name: string;
  credits: number | null;
  grade: number | null;
  status: SubjectStatus;
  prerequisite: string[];
}

export interface StudentCourseAttempt {
  id: string;
  code: string;
  name: string;
  academicPeriod: string;
  attemptNumber: number;
  status: string;
  score: number | null;
  grade: string | null;
}

export interface StudentProgress {
  id: string;
  studentCode: string;
  fullName: string;
  cohort: string;
  curriculumCode: string;
  currentCurriculumSemester: number | null;
  courseSemesterTag?: number | null;
  currentTerm: string;
  currentTermStartDate: string | null;
  gpa: number | null;
  gpaScale?: number | null;
  gpaLoaded?: boolean;
  gpaLoading?: boolean;
  completedCredits: number | null;
  totalCredits: number | null;
  plannedOjtTerm: string;
  currentEstimatedOjtTerm: string;
  delayTerms: number | null;
  progressStatus: ProgressStatus;
  eligibilityStatus: OjtEligibilityStatus;
  eligibilitySource?: 'BACKEND' | 'FRONTEND' | 'OFFICIAL' | null;
  subjects: StudentSubject[];
  courseHistory?: StudentCourseAttempt[];
  detailsLoaded?: boolean;
  unpassedCourseCount?: number | null;
  dataWarning?: string;
  detailsUnavailable?: boolean;
}
