import { useNavigate } from 'react-router-dom';
import type { UserRole } from '@/types/auth.types';

// Cấu hình các đường dẫn dashboard tương ứng với từng vai trò

export const ROLE_DASHBOARDS: Record<UserRole, string> = {
  student: '/student/dashboard',
  admin: '/admin/dashboard',
  education: '/education/dashboard',
  enterprise: '/enterprise/dashboard',
  qhdn: '/qhdn/dashboard',
};

export const getDashboardByRole = (role?: UserRole): string => {
  if (!role || !ROLE_DASHBOARDS[role]) {
    return '/student/dashboard';
  }
  return ROLE_DASHBOARDS[role];
};

export function useRoleRedirect() {
  const navigate = useNavigate();

  // Chuyển hướng người dùng đến dashboard tương ứng với vai trò của họ

  const redirectToDashboard = (role?: UserRole) => {
    navigate(getDashboardByRole(role), { replace: true });
  };

  return {
    getDashboardByRole,
    redirectToDashboard,
  };
}

export default useRoleRedirect;
