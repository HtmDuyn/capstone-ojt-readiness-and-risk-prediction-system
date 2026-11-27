import type { AuthUser, UserRole } from '@/types/auth.types';
import type { CurrentUserResponse } from '@/services/authService';

const roleByCode: Record<string, UserRole> = {
  ADMIN: 'admin', ACADEMIC: 'education', OJT_COORD: 'qhdn', STUDENT: 'student', ENTERPRISE: 'enterprise',
};

export function toAuthUser(profile: CurrentUserResponse['user']): AuthUser {
  const roleCode = profile.roleCode?.toUpperCase();
  const role = roleCode ? roleByCode[roleCode] : undefined;
  if (!role) throw new Error('Vai trò tài khoản không được hỗ trợ.');
  return {
    id: String(profile.id), name: profile.fullName || profile.username, email: profile.email,
    role, roleCode, mustChangePassword: profile.mustChangePassword === true,
  };
}
