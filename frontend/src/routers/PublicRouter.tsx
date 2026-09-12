import React from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { GuestRoute, PrivateRoute } from './PrivateRouter';
import { BaseLayout } from '@/layouts/BaseLayout';
import { STUDENT_NAV_ITEMS } from '@/config/menus/studentMenu';
import LoginPage from '@/pages/auth/LoginPage';
import StudentDashboard from '@/pages/student/StudentDashboard';
import StudentAcademicProfile from '@/pages/student/StudentAcademicProfile';
import StudentFeaturePage from '@/pages/student/StudentFeaturePage';

// Các route riêng của sinh viên, đặt chung một layout và một guard quyền truy cập.
const studentRoutes: RouteObject = {
  element: (
    <BaseLayout
      navItems={STUDENT_NAV_ITEMS}
      homePath="/student/dashboard"
      brandSubtitle="Cổng Sinh viên"
    />
  ),
  children: [
    // Route chính của sinh viên.
    { path: '/student', element: <Navigate to="/student/dashboard" replace /> },
    { path: '/student/dashboard', element: <StudentDashboard /> },
    { path: '/student/academic-profile', element: <StudentAcademicProfile /> },
    { path: '/student/risk-prediction', element: <StudentFeaturePage /> },
    { path: '/student/roadmap-consulting', element: <StudentFeaturePage /> },
    { path: '/student/ojt-registration', element: <StudentFeaturePage /> },
    { path: '/student/ojt-profile', element: <StudentFeaturePage /> },
    { path: '/student/internship-progress', element: <StudentFeaturePage /> },
    { path: '/student/evaluation-results', element: <StudentFeaturePage /> },
    { path: '/student/notifications', element: <StudentFeaturePage /> },

    // Alias giữ tương thích với các đường dẫn cũ.
    { path: '/dashboard', element: <Navigate to="/student/dashboard" replace /> },
    { path: '/dashboard/student', element: <Navigate to="/student/dashboard" replace /> },
    { path: '/dashboard/academic-profile', element: <Navigate to="/student/academic-profile" replace /> },
    { path: '/academic-profile', element: <Navigate to="/student/academic-profile" replace /> },
    { path: '/risk-prediction', element: <Navigate to="/student/risk-prediction" replace /> },
    { path: '/roadmap-consulting', element: <Navigate to="/student/roadmap-consulting" replace /> },
    { path: '/ojt-registration', element: <Navigate to="/student/ojt-registration" replace /> },
    { path: '/ojt-profile', element: <Navigate to="/student/ojt-profile" replace /> },
    { path: '/internship-progress', element: <Navigate to="/student/internship-progress" replace /> },
    { path: '/evaluation-results', element: <Navigate to="/student/evaluation-results" replace /> },
    { path: '/notifications', element: <Navigate to="/student/notifications" replace /> },
  ],
};

export const router = createBrowserRouter([
  // Route công khai: người đã đăng nhập sẽ được chuyển về dashboard theo role.
  {
    element: <GuestRoute />,
    children: [
      { index: true, element: <Navigate to="/login" replace /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <LoginPage /> },
    ],
  },

  // Route sinh viên: chỉ tài khoản student được phép truy cập.
  {
    element: <PrivateRoute allowedRoles={['student']} />,
    children: [studentRoutes],
  },

  // Các nhóm route role khác sẽ được bổ sung tại đây.
  // Mỗi role nên có một PrivateRoute với allowedRoles riêng.
]);

export default router;