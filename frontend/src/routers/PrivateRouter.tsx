import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { UserRole } from "../contexts/AuthContext";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PrivateRouteProps {
  /**
   * Optional whitelist of roles allowed to access this route.
   * If omitted, any authenticated user is permitted.
   */
  allowedRoles?: UserRole[];
  /** Where to redirect unauthenticated users (default: "/login"). */
  redirectTo?: string;
  /** Where to redirect users who are authenticated but lack the required role. */
  unauthorizedRedirectTo?: string;
}

// ─── Loading Fallback ─────────────────────────────────────────────────────────

const AuthLoadingScreen: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-950">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-full border-4 border-orange-500/30 border-t-orange-500 animate-spin" />
      <p className="text-white/60 text-sm font-medium tracking-wide">
        Đang xác thực...
      </p>
    </div>
  </div>
);

// ─── Unauthorized Fallback ────────────────────────────────────────────────────

const UnauthorizedScreen: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-950">
    <div className="flex flex-col items-center gap-4 text-center px-4">
      <div className="text-6xl">🚫</div>
      <h1 className="text-2xl font-bold text-white">Không có quyền truy cập</h1>
      <p className="text-white/60 max-w-sm">
        Tài khoản của bạn không có quyền truy cập trang này. Vui lòng liên hệ
        quản trị viên nếu bạn cho rằng đây là lỗi.
      </p>
    </div>
  </div>
);

// ─── PrivateRoute Component ───────────────────────────────────────────────────

/**
 * Wraps protected route subtrees.
 *
 * Usage in router config:
 * ```tsx
 * {
 *   element: <PrivateRoute allowedRoles={["student", "education"]} />,
 *   children: [
 *     { path: "/dashboard", element: <DashboardPage /> },
 *   ],
 * }
 * ```
 */
const PrivateRoute: React.FC<PrivateRouteProps> = ({
  allowedRoles,
  redirectTo = "/login",
  unauthorizedRedirectTo,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Show spinner while rehydrating auth state from localStorage
  if (isLoading) return <AuthLoadingScreen />;

  // Not logged in → redirect to login, preserving intended destination
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Role check (only when allowedRoles is specified)
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    if (unauthorizedRedirectTo) {
      return <Navigate to={unauthorizedRedirectTo} replace />;
    }
    return <UnauthorizedScreen />;
  }

  // All checks passed → render child routes
  return <Outlet />;
};

export default PrivateRoute;
