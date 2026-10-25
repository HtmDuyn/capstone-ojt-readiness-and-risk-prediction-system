import type { Cohort, CourseDemand, DemandReport, ReportPeriod, ReportScope } from '@/types/education/reporting.types';
import API from './api';
import { cleanQuery, getAllItems, getPage } from './educationApi';

export const academicReportingService = {
  cohorts: (signal?: AbortSignal) => getAllItems<Cohort>('/cohorts', {}, signal),
  periods: (signal?: AbortSignal) => getAllItems<ReportPeriod>('/academic-periods', {}, signal),
  courseDemand: (scope: ReportScope, page: number, includeInProgress: boolean, signal?: AbortSignal) =>
    getPage<CourseDemand>('/course-demands', {
      ...scope, page, limit: 20, includeInProgress: String(includeInProgress),
    }, signal) as Promise<DemandReport>,
  exportCourseDemand: async (scope: ReportScope, includeInProgress = false) => {
    try {
      const response = await API.get<Blob>('/course-demands/export', {
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

