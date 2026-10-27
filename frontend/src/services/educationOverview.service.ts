import { getAllItems } from './educationApi';
import { dashboardSummary } from '@/utils/educationDashboardSummary';
import type { QueryParams } from '@/types/education/dashboard.types';
import type { SavedOjtEligibility } from '@/utils/savedOjtEligibility';
import { educationRead } from './educationReadCache';

interface OverviewStudent {
  id: number;
  accountStatus: string;
  cohortId: number | null;
  cohort?: { id: number; name: string; code: string } | null;
  calculatedEligibility?: SavedOjtEligibility | null;
}

export const educationOverviewService = {
  async load(scope: QueryParams = {}, signal?: AbortSignal, onStudentsLoaded?: (total: number) => void) {
    const students = (await educationRead(`overview:students:${scope.cohortId ?? ''}`, () => getAllItems<OverviewStudent>('/students', {
      status: 'ACTIVE', ...(scope.cohortId ? { cohortId: scope.cohortId } : {}),
    }), signal)).filter(student => student.accountStatus === 'ACTIVE');
    signal?.throwIfAborted();
    onStudentsLoaded?.(students.length);
    const rows = students.map(student => {
      const saved = student.calculatedEligibility;
      const status = saved && !saved.isStale ? saved.status : undefined;
      const category = !saved || saved.isStale ? 'AWAITING_CONFIRMATION' : status === 'REVIEW_REQUIRED' ? 'INSUFFICIENT_DATA' : status;
      return { studentId: student.id, cohortId: student.cohortId, category,
        evaluation: { status: status ?? 'NOT_CHECKED' }, officialStale: saved?.isStale ?? false };
    });
    const data = dashboardSummary([{
      rows,
      cohorts: students.flatMap(student => student.cohort ? [{ CohortID: student.cohort.id, Name: student.cohort.name, CohortCode: student.cohort.code }] : []),
    }]);
    const staleCount = students.filter(student => student.calculatedEligibility?.isStale).length;
    return { ...data, unavailableProfiles: 0,
      warning: staleCount ? `${staleCount} kết quả đã cũ do dữ liệu học vụ thay đổi. Cần xét lại trước khi sử dụng.` : '',
    };
  },
};
