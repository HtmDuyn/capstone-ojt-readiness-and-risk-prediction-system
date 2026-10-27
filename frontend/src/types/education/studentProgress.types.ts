export type ProgressStatus = "Đúng tiến độ" | "Chậm tiến độ" | "Chưa xác định";

export type SubjectStatus =
  "Passed" | "Not Passed" | "Not Started" | "In Progress" | "Chưa xác định";

export type OjtEligibilityStatus =
  "Đủ điều kiện" | "Chưa đủ điều kiện" | "Chưa có kết quả";

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

export interface StudentProgress {
  id: string;
  studentCode: string;
  fullName: string;
  cohort: string;
  studentClass: string;
  curriculumCode: string;
  currentCurriculumSemester: number | null;
  courseSemesterTag?: number | null;
  currentTerm: string;
  gpa: number | null;
  completedCredits: number | null;
  totalCredits: number | null;
  plannedOjtTerm: string;
  currentEstimatedOjtTerm: string;
  delayTerms: number | null;
  progressStatus: ProgressStatus;
  eligibilityStatus: OjtEligibilityStatus;
  subjects: StudentSubject[];
  dataWarning?: string;
  detailsUnavailable?: boolean;
}
