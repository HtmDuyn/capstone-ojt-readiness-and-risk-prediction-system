import React from "react";
import {
  createBrowserRouter,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import LoginPage from "../pages/LoginPage";
import PrivateRoute from "./PrivateRouter";

import StudentDashboard from "../pages/Students/StudentDashboard";
import StudentAcademicProfile from "../pages/Students/StudentAcademicProfile";

// ─── GuestRoute ───────────────────────────────────────────────────────────────
// Redirects already-authenticated users away from public-only pages (login/register).

const GuestRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null; // Avoid flicker during hydration

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

// ─── Router ───────────────────────────────────────────────────────────────────

const router = createBrowserRouter([
  // ── Public / Guest routes (redirect to /dashboard if already logged in) ──
  {
    element: <GuestRoute />,
    children: [
      { index: true, element: <Navigate to="/login" replace /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <LoginPage /> },
    ],
  },

  // ── Protected routes (require authentication) ──────────────────────────────
  {
    element: <PrivateRoute />, // any authenticated role
    children: [
      { path: "/dashboard", element: <StudentDashboard /> },
      { path: "/academic-profile", element: <StudentAcademicProfile /> },
    ],
  },

  // ── Student-only routes ────────────────────────────────────────────────────
  {
    element: <PrivateRoute allowedRoles={["student"]} />,
    children: [
      { path: "/dashboard/student", element: <StudentDashboard /> },
      { path: "/dashboard/academic-profile", element: <StudentAcademicProfile /> },
    ],
  },

  // ── Education staff routes ─────────────────────────────────────────────────
  {
    element: <PrivateRoute allowedRoles={["education"]} />,
    children: [
      // TODO: Add education routes here
    ],
  },

  // ── Enterprise routes ──────────────────────────────────────────────────────
  {
    element: <PrivateRoute allowedRoles={["enterprise"]} />,
    children: [
      // TODO: Add enterprise routes here
    ],
  },

  // ── Quan hệ doanh nghiệp routes ────────────────────────────────────────────
  {
    element: <PrivateRoute allowedRoles={["qh"]} />,
    children: [
      // TODO: Add qh routes here
    ],
  },

  // ── Admin routes ───────────────────────────────────────────────────────────
  {
    element: <PrivateRoute allowedRoles={["admin"]} unauthorizedRedirectTo="/dashboard" />,
    children: [
      // TODO: Add admin routes here
    ],
  },

  // ── 404 Fallback ───────────────────────────────────────────────────────────
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);

export default router;
