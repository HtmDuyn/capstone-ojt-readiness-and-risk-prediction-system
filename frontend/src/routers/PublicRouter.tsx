import React from "react";
import {
  createBrowserRouter,
  Navigate,
  type RouteObject,
} from "react-router-dom";
import { GuestRoute, PrivateRoute } from "./PrivateRouter";
import { BaseLayout } from "@/layouts/BaseLayout";
import { getMenuByRole } from "@/config";
import LoginPage from "@/pages/auth/LoginPage";
import StudentDashboard from "@/pages/student/StudentDashboard";
import StudentAcademicProfile from "@/pages/student/StudentAcademicProfile";
import StudentFeaturePage from "@/pages/student/StudentFeaturePage";
import StudentOjtRegistration from "@/pages/student/StudentOjtRegistration";
import StudentAIRiskPrediction from "@/pages/student/StudentAIRiskPrediction";
import EducationDashboard from "@/pages/education/EducationDashboard";
import EducationOjtEligibility from "@/pages/education/EducationOjtEligibility";
import EducationAcademicAlerts from "@/pages/education/EducationAcademicAlerts";
import EducationCurriculumPlan from "@/pages/education/EducationCurriculumPlan";
import EducationGraduationReview from "@/pages/education/EducationGraduationReview";
import type { UserRole } from "@/types/auth.types";

const ROLE_LABELS: Record<UserRole, string> = {
  student: "Sinh viên",
  admin: "Quản trị viên",
  education: "Phòng Đào tạo",
  enterprise: "Doanh nghiệp",
  qhdn: "Phòng Quan hệ Doanh nghiệp",
};

// Màn hình tạm thời cho các phân hệ chưa có trang nghiệp vụ riêng.
const RolePlaceholderPage: React.FC<{ role: UserRole }> = ({ role }) => (
  <div className="card-glass p-8 sm:p-12 text-center min-h-[360px] flex flex-col items-center justify-center">
    <div className="w-16 h-16 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-2xl font-bold">
      {ROLE_LABELS[role].charAt(0)}
    </div>
    <h1 className="mt-5 text-2xl font-extrabold text-slate-900">
      Cổng {ROLE_LABELS[role]}
    </h1>
    <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-500">
      Phân hệ này đang được hoàn thiện. Bạn đã đăng nhập đúng vai trò và có thể
      sử dụng menu bên trái khi các chức năng được triển khai.
    </p>
  </div>
);

// Tạo route dùng chung cho các role chưa có dashboard nghiệp vụ hoàn chỉnh.
const createRoleRoutes = (role: Exclude<UserRole, "student">): RouteObject => {
  const navItems = getMenuByRole(role);

  return {
    element: (
      <BaseLayout
        navItems={navItems}
        homePath={navItems[0]?.path || `/${role}/dashboard`}
        brandSubtitle={ROLE_LABELS[role]}
        showAIConsult={false}
      />
    ),
    children: navItems.map((item) => ({
      path: item.path,
      element: <RolePlaceholderPage role={role} />,
    })),
  };
};

// Các route riêng của sinh viên, đặt chung một layout và một guard quyền truy cập.
const studentRoutes: RouteObject = {
  element: (
    <BaseLayout
      navItems={getMenuByRole("student")}
      homePath="/student/dashboard"
      brandSubtitle="Cổng Sinh viên"
    />
  ),
  children: [
    // Route chính của sinh viên.
    { path: "/student", element: <Navigate to="/student/dashboard" replace /> },
    { path: "/student/dashboard", element: <StudentDashboard /> },
    { path: "/student/academic-profile", element: <StudentAcademicProfile /> },
    { path: "/student/risk-prediction", element: <StudentAIRiskPrediction /> },
    { path: "/student/roadmap-consulting", element: <StudentFeaturePage /> },
    { path: "/student/ojt-registration", element: <StudentOjtRegistration /> },
    { path: "/student/ojt-profile", element: <StudentFeaturePage /> },
    { path: "/student/internship-progress", element: <StudentFeaturePage /> },
    { path: "/student/evaluation-results", element: <StudentFeaturePage /> },
    { path: "/student/notifications", element: <StudentFeaturePage /> },

    // Alias giữ tương thích với các đường dẫn cũ.
    {
      path: "/dashboard",
      element: <Navigate to="/student/dashboard" replace />,
    },
    {
      path: "/dashboard/student",
      element: <Navigate to="/student/dashboard" replace />,
    },
    {
      path: "/dashboard/academic-profile",
      element: <Navigate to="/student/academic-profile" replace />,
    },
    {
      path: "/academic-profile",
      element: <Navigate to="/student/academic-profile" replace />,
    },
    {
      path: "/risk-prediction",
      element: <Navigate to="/student/risk-prediction" replace />,
    },
    {
      path: "/roadmap-consulting",
      element: <Navigate to="/student/roadmap-consulting" replace />,
    },
    {
      path: "/ojt-registration",
      element: <Navigate to="/student/ojt-registration" replace />,
    },
    {
      path: "/ojt-profile",
      element: <Navigate to="/student/ojt-profile" replace />,
    },
    {
      path: "/internship-progress",
      element: <Navigate to="/student/internship-progress" replace />,
    },
    {
      path: "/evaluation-results",
      element: <Navigate to="/student/evaluation-results" replace />,
    },
    {
      path: "/notifications",
      element: <Navigate to="/student/notifications" replace />,
    },
  ],
};

export const router = createBrowserRouter([
  // Route công khai: người đã đăng nhập sẽ được chuyển về dashboard theo role.
  {
    element: <GuestRoute />,
    children: [
      { index: true, element: <Navigate to="/login" replace /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <LoginPage /> },
    ],
  },

  // Route sinh viên: chỉ tài khoản student được phép truy cập.
  {
    element: <PrivateRoute allowedRoles={["student"]} />,
    children: [studentRoutes],
  },

  // Các role còn lại dùng layout chung và trang tạm trong khi chờ nghiệp vụ.
  {
    element: <PrivateRoute allowedRoles={["admin"]} />,
    children: [createRoleRoutes("admin")],
  },
  {
    element: <PrivateRoute allowedRoles={["education"]} />,
    children: [
      {
        element: (
          <BaseLayout
            navItems={getMenuByRole("education")}
            homePath="/education/dashboard"
            brandSubtitle="Phòng Đào tạo"
            showAIConsult={false}
          />
        ),
        children: [
          {
            path: "/education/dashboard",
            element: <EducationDashboard />,
          },
          ...getMenuByRole("education")
            .filter((item) => item.path !== "/education/dashboard")
            .map((item) => ({
              path: item.path,
              element:
                item.path === "/education/ojt-eligibility" ? (
                  <EducationOjtEligibility />
                ) : item.path === "/education/academic-alerts" ? (
                  <EducationAcademicAlerts />
                ) : item.path === "/education/curriculum-plan" ? (
                  <EducationCurriculumPlan />
                ) : item.path === "/education/graduation-review" ? (
                  <EducationGraduationReview />
                ) : (
                  <RolePlaceholderPage role="education" />
                ),
            })),
        ],
      },
    ],
  },
  {
    element: <PrivateRoute allowedRoles={["qhdn"]} />,
    children: [createRoleRoutes("qhdn")],
  },
  {
    element: <PrivateRoute allowedRoles={["enterprise"]} />,
    children: [createRoleRoutes("enterprise")],
  },

  // URL không tồn tại luôn quay về login thay vì hiển thị trang 404 mặc định.
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);

export default router;
