import { useOptionalStudentPortal } from '@/contexts/StudentPortalContext';
import {
  getCurrentStudyOverview,
  getStudyOverview,
  type CurrentStudyOverview,
  type StudyOverview,
} from '@/services/studentService';
import { useStudentResource } from './useStudentResource';

export function useStudentAcademicView(enabled = true) {
  const portal = useOptionalStudentPortal();
  const periodId = portal?.academicPeriodId;
  return useStudentResource<StudyOverview | CurrentStudyOverview>(
    enabled && portal?.profile && !portal.academicPeriodsLoading
      ? `study-overview:${portal.profile.id}:${periodId ?? 'all'}:${portal.revision}` : null,
    signal => periodId == null ? getCurrentStudyOverview(signal) : getStudyOverview(periodId, signal),
    { snapshot: true },
  );
}
