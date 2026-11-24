import { useOptionalStudentPortal } from '@/contexts/StudentPortalContext';
import { getCurrentStudyOverview } from '@/services/studentService';
import { useStudentResource } from './useStudentResource';

export function useStudentRisk(enabled = true) {
  const portal = useOptionalStudentPortal();
  const study = useStudentResource(
    enabled && portal?.profile ? `current-study-overview:${portal.profile.id}:${portal.revision}` : null,
    signal => getCurrentStudyOverview(signal),
  );
  return { ...study, data: study.data?.assessment ?? null,
    currentPeriod: study.data?.period ?? null, currentAcademic: study.data?.academic ?? null };
}
export type StudentRiskResource = ReturnType<typeof useStudentRisk>;
