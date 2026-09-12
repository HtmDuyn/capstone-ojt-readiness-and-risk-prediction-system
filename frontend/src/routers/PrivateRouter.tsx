import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardByRole } from "@/hooks/useRoleRedirect";
import type { UserRole } from "@/types/auth.types";

interface PrivateRouteProps {
  /** Optional whitelist of roles allowed to access this route. */
  allowedRoles?: UserRole[];
  /** Where to redirect unauthenticated users (default: "/login"). */
  redirectTo?: string;
  /** Where to redirect users who lack the required role. */
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

/** Redirects authenticated users away from guest-only routes. */
export const GuestRoute: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return null;

  return isAuthenticated ? (
    <Navigate to={getDashboardByRole(user?.role)} replace />
  ) : (
    <Outlet />
  );
};

/** Protects routes that require authentication and optionally a specific role. */
export const PrivateRoute: React.FC<PrivateRouteProps> = ({
  allowedRoles,
  redirectTo = "/login",
  unauthorizedRedirectTo,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) return <AuthLoadingScreen />;

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    if (unauthorizedRedirectTo) {
      return <Navigate to={unauthorizedRedirectTo} replace />;
    }

    return <Navigate to={getDashboardByRole(user.role)} replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;