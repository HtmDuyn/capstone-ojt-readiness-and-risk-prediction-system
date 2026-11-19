import { useAuth } from './useAuth';
import { useStudentResource } from './useStudentResource';
import { useOptionalStudentPortal } from '@/contexts/StudentPortalContext';
import { getOjtRiskAssessment } from '@/services/studentService';

// The endpoint resolves its owner from the token; it can start while the portal
// verifies the profile instead of waiting for profile and catalog requests.
export function useStudentRisk(enabled = true) {
  const { token, user } = useAuth();
  const portal = useOptionalStudentPortal();
  return useStudentResource(
    enabled && token ? `ojt-risk:${user?.id ?? ''}:${portal?.revision ?? 0}` : null,
    signal => getOjtRiskAssessment(signal),
    { snapshot: true },
  );
}
export type StudentRiskResource = ReturnType<typeof useStudentRisk>;
