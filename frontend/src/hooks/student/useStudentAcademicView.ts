import { useOptionalStudentPortal } from '@/contexts/StudentPortalContext';
import { getStudyOverview } from '@/services/studentService';
import { useStudentResource } from './useStudentResource';

export function useStudentAcademicView(enabled = true) {
  const portal = useOptionalStudentPortal();
  const periodId = portal?.academicPeriodId;
  return useStudentResource(
    enabled && portal?.profile && periodId ? `study-overview:${portal.profile.id}:${periodId}:${portal.revision}` : null,
    signal => getStudyOverview(periodId!, signal), { snapshot: true },
  );
}
