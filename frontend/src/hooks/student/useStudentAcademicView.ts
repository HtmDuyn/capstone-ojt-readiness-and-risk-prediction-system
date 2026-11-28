import { useOptionalStudentPortal } from '@/contexts/StudentPortalContext';
import {
  getCurrentStudyOverview,
  getStudyOverview,
  type CurrentStudyOverview,
  type StudyOverview,
} from '@/services/studentService';
import { useStudentResource } from './useStudentResource';

export function useStudentAcademicView({ enabled = true, allPeriods = false }: { enabled?: boolean; allPeriods?: boolean } = {}) {
  const portal = useOptionalStudentPortal();
  const periodId = allPeriods ? null : portal?.academicPeriodId;
  return useStudentResource<StudyOverview | CurrentStudyOverview>(
    enabled && portal?.profile && !portal.academicPeriodsLoading
      ? `study-overview:${portal.profile.id}:${periodId ?? 'all'}:${portal.revision}` : null,
    signal => periodId == null ? getCurrentStudyOverview(signal) : getStudyOverview(periodId, signal),
    { snapshot: true },
  );
}
