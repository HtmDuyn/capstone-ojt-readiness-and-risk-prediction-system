export type SubjectStatus = 'completed' | 'in_progress' | 'failed' | 'not_started';

export interface SubjectItem {
  id: string;
  code: string;
  name: string;
  credits: number;
  status: SubjectStatus;
  prerequisites: string[]; // e.g., ['SWT301', 'PRN211'] or []
  grade?: number; // e.g., 8.5
  semester: string; // e.g., 'Kỳ 1', 'Kỳ 7'
}

export interface CourseCategoryDistribution {
  id: string;
  name: string;
  percentage: number;
  colorClass: string; // Tailwind color gradient/solid class
  barColor: string; // CSS color string or Tailwind hex
}

export interface AcademicSemesterStep {
  id: number;
  semesterName: string;
  status: 'completed' | 'current' | 'locked';
  gpaText?: string;
  subjectCountText?: string;
  subtitleText?: string;
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
