import type { AcademicPeriod, OjtSemester } from './academic.types';
import type { Page } from './api.types';

export interface Cohort { id: number; cohortCode: string; name: string }

export interface ReportScope { academicPeriodId?: number; ojtSemesterId?: number; cohortId?: number }

export interface CourseDemand {
  ojtSemesterId: number; academicPeriodId: number; courseId: number; courseCode: string; courseName: string; periodCode: string;
  studentCount: number; retakeCount: number; inProgressCount: number;
}

export interface DemandReport extends Page<CourseDemand> {
  studentsWithDataIssues: { studentId: number }[];
  unresolvedAlternatives: { studentId: number }[];
  computedAt: string;
}

export type ReportPeriod = AcademicPeriod & { ojt?: OjtSemester | null };
