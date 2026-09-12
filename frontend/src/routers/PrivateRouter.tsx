import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardByRole } from "@/hooks/useRoleRedirect";
import type { UserRole } from "@/types/auth.types";

interface PrivateRouteProps {
  /** Danh sách các vai trò được phép truy cập route này (tùy chọn). */
  allowedRoles?: UserRole[];
  /** Nơi chuyển hướng người dùng chưa xác thực (mặc định: "/login"). */
  redirectTo?: string;
  /** Nơi chuyển hướng người dùng không có vai trò phù hợp. */
  unauthorizedRedirectTo?: string;
}

const AuthLoadingScreen: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-950 font-outfit">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-full border-4 border-orange-500/30 border-t-orange-500 animate-spin" />
      <p className="text-white/60 text-sm font-medium tracking-wide">
        Đang xác thực tài khoản...
      </p>
    </div>
  </div>
);

/** Chuyển hướng người dùng đã xác thực khỏi các route chỉ dành cho khách. */
export const GuestRoute: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return null;

  return isAuthenticated ? (
    <Navigate to={getDashboardByRole(user?.role)} replace />
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