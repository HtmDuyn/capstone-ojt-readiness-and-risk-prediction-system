export type SubjectStatus = 'completed' | 'in_progress' | 'failed' | 'not_started';

export interface SubjectItem {
  id: string;
  code: string;
  name: string;
  credits: number;
  status: SubjectStatus;
  prerequisites: string[]; // e.g., ['SWT301', 'PRN211'] or []
  grade?: number; // e.g., 8.5
  semester: string; // e.g., 'Kỳ 1', 'Kỳ 6'
}

export interface AcademicSemesterStep {
  id: number;
  semesterName: string; // e.g. 'Học kỳ 1'
  semesterCode: string; // e.g. 'Kỳ 1'
  status: 'completed' | 'current' | 'locked';
  gpaText?: string;
  creditsText?: string;
  subjectCountText?: string;
  subtitleText?: string;
  subjectsSummary?: string[];
}

export interface AcademicProfileStats {
  currentGpa: number;
  maxGpa: number;
  gpaChange: number;
  earnedCredits: number;
  totalCredits: number;
  missingCredits: number;
  completionPercentage: number;
  currentSemester: string;
}

export interface SemesterCreditProgress {
  semester: string;
  credits: number;
  cumulative: number;
  target: number;
  gpa: number;
}

