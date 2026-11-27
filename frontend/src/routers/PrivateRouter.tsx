import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/shared/useAuth";
import { getDashboardByRole } from "@/hooks/shared/useRoleRedirect";
import type { UserRole } from "@/types/auth.types";
import { AuthLoadingScreen } from '@/components/auth/AuthLoadingScreen';

interface PrivateRouteProps {
  /** Danh sách các vai trò được phép truy cập route này (tùy chọn). */
  allowedRoles?: UserRole[];
  /** Nơi chuyển hướng người dùng chưa xác thực (mặc định: "/login"). */
  redirectTo?: string;
  /** Nơi chuyển hướng người dùng không có vai trò phù hợp. */
  unauthorizedRedirectTo?: string;
}

/** Chuyển hướng người dùng đã xác thực khỏi các route chỉ dành cho khách. */
export const GuestRoute: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <AuthLoadingScreen />;

  return isAuthenticated ? (
    <Navigate to={user?.mustChangePassword ? '/change-password' : getDashboardByRole(user?.role)} replace />
  ) : (
    <Outlet />
  );
};

/** Bảo vệ các route yêu cầu xác thực và tùy chọn yêu cầu một vai trò cụ thể. */
export const PrivateRoute: React.FC<PrivateRouteProps> = ({
  allowedRoles,
  redirectTo = "/login",
  unauthorizedRedirectTo,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) return <AuthLoadingScreen />;

  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to={unauthorizedRedirectTo || getDashboardByRole(user.role)}
        replace
      />
    );
  }

  return <Outlet />;
};

export default PrivateRoute;
