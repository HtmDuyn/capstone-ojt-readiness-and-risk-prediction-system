import API from './api';
import { cleanQuery, getAllItems, getPage, type Page } from './educationApi';
import type { AcademicPeriod, OjtSemester } from './academic.service';

export interface Cohort { id: number; cohortCode: string; name: string }
export interface ReportScope { academicPeriodId: number; ojtSemesterId: number; cohortId?: number }
export interface CourseDemand {
  courseId: number; courseCode: string; courseName: string; periodCode: string;
  studentCount: number; retakeCount: number; inProgressCount: number;
}
export interface DemandReport extends Page<CourseDemand> {
  studentsWithDataIssues: { studentId: number }[];
  unresolvedAlternatives: { studentId: number }[];
  computedAt: string;
}
export type ReportPeriod = AcademicPeriod & { ojt?: OjtSemester | null };
export const academicReportingService = {
  cohorts: (signal?: AbortSignal) => getAllItems<Cohort>('/cohorts', {}, signal),
  periods: (signal?: AbortSignal) => getAllItems<ReportPeriod>('/academic-periods', {}, signal),
  courseDemand: (scope: ReportScope, page: number, includeInProgress: boolean, signal?: AbortSignal) =>
    getPage<CourseDemand>('/academic/course-demand', {
      ...scope, page, limit: 20, includeInProgress: String(includeInProgress),
    }, signal) as Promise<DemandReport>,
  exportCourseDemand: async (scope: ReportScope, includeInProgress = false) => {
    try {
      const response = await API.get<Blob>('/academic/course-demand/export', {
        params: cleanQuery({ ...scope, includeInProgress: String(includeInProgress), format: 'csv' }),
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      // Axios returns JSON error bodies as blobs for a file download request.
      const body = (error as { response?: { data?: unknown } }).response?.data;
      if (body instanceof Blob) {
        let message: string | undefined;
        try { message = JSON.parse(await body.text()).message; } catch { /* Use the original HTTP error. */ }
        if (message) throw new Error(message);
      }
      throw error;
    }
  },
};
export function downloadCourseDemand(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'nhu-cau-hoc-phan.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
