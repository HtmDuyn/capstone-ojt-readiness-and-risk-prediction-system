import { apiData, getAllItems, getJson } from './educationApi';
import { dashboardSummary } from '@/utils/educationDashboardSummary';
import type { StudentEligibility } from '@/types/education/eligibility.types';
import type { QueryParams } from '@/types/education/dashboard.types';
import { getErrorMessage } from '@/utils/educationDashboard';
import { educationRead } from './educationReadCache';

interface OverviewStudent {
  id: number;
  accountStatus: string;
  cohortId: number | null;
  cohort?: { id: number; name: string; code: string } | null;
}

export const educationOverviewService = {
  async load(scope: QueryParams = {}, signal?: AbortSignal, onStudentsLoaded?: (total: number) => void) {
    const students = (await educationRead(`overview:students:${scope.cohortId ?? ''}`, () => getAllItems<OverviewStudent>('/students', {
      status: 'ACTIVE', ...(scope.cohortId ? { cohortId: scope.cohortId } : {}),
    }), signal)).filter(student => student.accountStatus === 'ACTIVE');
    signal?.throwIfAborted();
    onStudentsLoaded?.(students.length);
    const rows: Record<string, unknown>[] = new Array(students.length);
    const failures: string[] = [];
    let next = 0;
    // Limit concurrent profile requests so a large cohort does not flood the API.
    await Promise.all(Array.from({ length: Math.min(4, students.length) }, async () => {
      while (next < students.length) {
        signal?.throwIfAborted();
        const index = next++;
        const student = students[index];
        try {
          const profile = apiData<{ eligibility: StudentEligibility | null }>(await educationRead(
            `overview:profile:${student.id}:${scope.ojtSemesterId ?? ''}`, () => getJson(
            `/students/${student.id}`, {
              include: 'eligibility',
              ...(scope.ojtSemesterId ? { ojtSemesterId: scope.ojtSemesterId } : {}),
            },
          ), signal));
          const decision = profile.eligibility;
          const status = decision?.current?.status;
          const category = !status || status === 'REVIEW_REQUIRED'
            ? 'INSUFFICIENT_DATA'
            : !decision.official || decision.official.isStale
              ? 'AWAITING_CONFIRMATION'
              : status;
          rows[index] = {
            studentId: student.id, cohortId: student.cohortId, category,
            evaluation: { status: status ?? 'REVIEW_REQUIRED' },
            officialStale: decision?.official?.isStale ?? false,
          };
        } catch (error) {
          signal?.throwIfAborted();
          failures.push(`Sinh viên #${student.id}: ${getErrorMessage(error)}`);
          // An unavailable profile is not an eligibility decision or a configuration issue.
          rows[index] = { studentId: student.id, cohortId: student.cohortId,
            category: 'UNAVAILABLE', evaluation: { status: 'UNAVAILABLE' }, officialStale: false };
        }
      }
    }));
    signal?.throwIfAborted();
    const data = dashboardSummary([{
      rows,
      cohorts: students.flatMap(student => student.cohort ? [{
        CohortID: student.cohort.id, Name: student.cohort.name, CohortCode: student.cohort.code,
      }] : []),
    }]);
    const noProfilesLoaded = students.length > 0 && failures.length === students.length;
    return { ...data,
      summary: { ...data.summary,
        eligible: noProfilesLoaded ? null : data.summary.eligible,
        notEligible: noProfilesLoaded ? null : data.summary.notEligible,
        insufficientData: noProfilesLoaded ? null : data.summary.insufficientData,
        awaitingConfirmation: noProfilesLoaded ? null : data.summary.awaitingConfirmation,
      },
      statistics: noProfilesLoaded ? { ...data.statistics, groups: [] } : data.statistics,
      unavailableProfiles: failures.length,
      warning: failures.length
        ? `Đã tải ${students.length - failures.length}/${students.length} hồ sơ xét OJT. Thống kê điều kiện chưa đầy đủ. ${failures.slice(0, 3).join(' | ')}`
        : '',
    };
  },
};
