import React from "react";
import {
  createBrowserRouter,
  Navigate,
  type RouteObject,
} from "react-router-dom";

import { getMenuByRole } from "@/config";
import { EnterpriseProvider } from "@/contexts/EnterpriseContext";
import { BaseLayout } from "@/layouts/BaseLayout";
import { GuestRoute, PrivateRoute } from "./PrivateRouter";

import LoginPage from "@/pages/auth/LoginPage";

import EducationAcademicYear from "@/pages/education/EducationAcademicYear";
import EducationDashboard from "@/pages/education/EducationDashboard";
import EducationOjtConditions from "@/pages/education/EducationOjtConditions";
import EducationOjtFinalResults from "@/pages/education/EducationOjtFinalResults";
import EducationStudentProgress from "@/pages/education/EducationStudentProgress";
import EducationStudentStatus from "@/pages/education/EducationStudentStatus";
import EducationSupportClassDemand from "@/pages/education/EducationSupportClassDemand";
import StudentAcademicProfile from "@/pages/student/StudentAcademicProfile";
import StudentDashboard from "@/pages/student/StudentDashboard";
import StudentFeaturePage from "@/pages/student/StudentFeaturePage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminSystemMetrics from "@/pages/admin/AdminSystemMetrics";
import AdminAiConfig from "@/pages/admin/AdminAiConfig";
import AdminSettings from "@/pages/admin/AdminSettings";
import StudentOjtRegistration from "@/pages/student/StudentOjtRegistration";
import EnterpriseDashboard from "@/pages/enterprise/EnterpriseDashboard";
import EnterpriseJobs from "@/pages/enterprise/EnterpriseJobs";
import EnterpriseCandidates from "@/pages/enterprise/EnterpriseCandidates";
import EnterpriseInterns from "@/pages/enterprise/EnterpriseInterns";
import EnterpriseEvaluation from "@/pages/enterprise/EnterpriseEvaluation";
import EnterpriseProfile from "@/pages/enterprise/EnterpriseProfile";
import QhdnDashboard from "@/pages/qhdn/QhdnDashboard";
import QhdnEnterprise from "@/pages/qhdn/QhdnEnterprise";
import QhdnOjtCoor from "@/pages/qhdn/QhdnOjtCoor";
import QhdnRegistrationWindows from "@/pages/qhdn/QhdnRegistrationWindows";
import QhdnEvaluations from "@/pages/qhdn/QhdnEvaluations";
import type { UserRole } from "@/types/auth.types";

const ROLE_LABELS: Record<UserRole, string> = {
  student: "Sinh viên",
  admin: "Quản trị viên",
  education: "Phòng Đào tạo",
  enterprise: "Doanh nghiệp",
  qhdn: "Phòng Quan hệ Doanh nghiệp",
};

/* =========================================================
   PLACEHOLDER
   ========================================================= */

const RolePlaceholderPage: React.FC<{
  role: UserRole;
}> = ({ role }) => (
  <div className="card-glass flex min-h-[360px] flex-col items-center justify-center p-8 text-center sm:p-12">
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-2xl font-bold text-orange-600">
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

/* =========================================================
   STUDENT ROUTES
   ========================================================= */

const studentRoutes: RouteObject = {
  element: (
    <BaseLayout
      navItems={getMenuByRole("student")}
      homePath="/student/dashboard"
      brandSubtitle="Cổng Sinh viên"
    />
  ),

  children: [
    {
      path: "/student",
      element: <Navigate to="/student/dashboard" replace />,
    },

    {
      path: "/student/dashboard",
      element: <StudentDashboard />,
    },

    {
      path: "/student/academic-profile",
      element: <StudentAcademicProfile />,
    },

    {
      path: "/student/risk-prediction",
      element: <StudentFeaturePage />,
    },

    {
      path: "/student/roadmap-consulting",
      element: <StudentFeaturePage />,
    },

    {
      path: "/student/ojt-registration",
      element: <StudentOjtRegistration />,
    },

    {
      path: "/student/ojt-profile",
      element: <StudentFeaturePage />,
    },

    {
      path: "/student/internship-progress",
      element: <StudentFeaturePage />,
    },

    {
      path: "/student/evaluation-results",
      element: <StudentFeaturePage />,
    },

    {
      path: "/student/notifications",
      element: <StudentFeaturePage />,
    },

    /* =====================================================
       ALIAS CŨ
       ===================================================== */

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

/* =========================================================
   ROUTER
   ========================================================= */

export const router = createBrowserRouter([
  /* =======================================================
     PUBLIC / GUEST
     ======================================================= */

  {
    element: <GuestRoute />,

    children: [
      {
        index: true,
        element: <Navigate to="/login" replace />,
      },

      {
        path: "/login",
        element: <LoginPage />,
      },
    ],
  },

  /* =======================================================
     STUDENT
     ======================================================= */

  {
    element: <PrivateRoute allowedRoles={["student"]} />,

    children: [studentRoutes],
  },

  /* =======================================================
     ADMIN
     ======================================================= */

  {
    element: <PrivateRoute allowedRoles={["admin"]} />,
    children: [
      {
        element: (
          <BaseLayout
            navItems={getMenuByRole("admin")}
            homePath="/admin/dashboard"
            brandSubtitle="Quản trị viên"
            showAIConsult={false}
          />
        ),
        children: [
          {
            path: "/admin/dashboard",
            element: <AdminDashboard />,
          },
          ...getMenuByRole("admin")
            .filter((item) => item.path !== "/admin/dashboard")
            .map((item) => ({
              path: item.path,
              element:
                item.path === "/admin/users" ? (
                  <AdminUsers />
                ) : item.path === "/admin/metrics" ? (
                  <AdminSystemMetrics />
                ) : item.path === "/admin/ai-config" ? (
                  <AdminAiConfig />
                ) : item.path === "/admin/settings" ? (
                  <AdminSettings />
                ) : (
                  <RolePlaceholderPage role="admin" />
                ),
            })),
        ],
      },
    ],
  },

  /* =======================================================
     PHÒNG ĐÀO TẠO
     ======================================================= */

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
          /* =========================
             DASHBOARD
             ========================= */

          {
            path: "/education",
            element: <Navigate to="/education/dashboard" replace />,
          },

          {
            path: "/education/dashboard",
            element: <EducationDashboard />,
          },

          /* =========================
             QUẢN LÝ DỮ LIỆU
             ========================= */

          {
            path: "/education/academic-year",
            element: <EducationAcademicYear />,
          },

          {
            path: "/education/student-import",
            lazy: async () => ({ Component: (await import("@/pages/education/EducationStudentImport")).default }),
          },
          {
            path: "/education/student-import/students/:studentId",
            lazy: async () => ({ Component: (await import("@/pages/education/EducationStudentDetail")).default }),
          },

          {
            path: "/education/curriculum-plan",
            lazy: async () => ({ Component: (await import("@/pages/education/EducationCurriculumPlan")).default }),
          },

          {
            path: "/education/ojt-conditions",
            element: <EducationOjtConditions />,
          },
          {
            path: "/education/ojt-handoff",
            lazy: async () => ({ Component: (await import("@/pages/education/EducationOjtHandoff")).default }),
          },

          /* =========================
             QUẢN LÝ SINH VIÊN
             ========================= */

          {
            path: "/education/student-progress",
            element: <EducationStudentProgress />,
          },

          {
            path: "/education/student-status",
            element: <EducationStudentStatus />,
          },
          {
            path: "/education/ojt-final-results",
            element: <EducationOjtFinalResults />,
          },

          /* =========================
             ĐỀ XUẤT LỚP HỖ TRỢ TỪ AI
             ========================= */

          {
            path: "/education/ai-class-proposals",
            element: <EducationSupportClassDemand />,
          },
        ],
      },
    ],
  },

  /* =======================================================
     QHDN
     ======================================================= */

  {
    element: <PrivateRoute allowedRoles={["qhdn"]} />,
    children: [{
      element: <BaseLayout navItems={getMenuByRole("qhdn")} homePath="/qhdn/dashboard" brandSubtitle="Phòng Quan hệ Doanh nghiệp" showAIConsult={false} />,
      children: [
        { path: "/qhdn", element: <Navigate to="/qhdn/dashboard" replace /> },
        { path: "/qhdn/dashboard", element: <QhdnDashboard /> },
        { path: "/qhdn/enterprises", element: <QhdnEnterprise /> },
        { path: "/qhdn/registration-windows", element: <QhdnRegistrationWindows /> },
        { path: "/qhdn/coordination", element: <QhdnOjtCoor /> },
        { path: "/qhdn/evaluations", element: <QhdnEvaluations /> },
      ],
    }],
  },

  /* =======================================================
     ENTERPRISE
     ======================================================= */

  {
    element: <PrivateRoute allowedRoles={["enterprise"]} />,
    children: [{
      element: <EnterpriseProvider><BaseLayout navItems={getMenuByRole("enterprise")} homePath="/enterprise/dashboard" brandSubtitle="Đối tác Doanh nghiệp" showAIConsult={false} /></EnterpriseProvider>,
      children: [
        { path: "/enterprise", element: <Navigate to="/enterprise/dashboard" replace /> },
        { path: "/enterprise/dashboard", element: <EnterpriseDashboard /> },
        { path: "/enterprise/jobs", element: <EnterpriseJobs /> },
        { path: "/enterprise/candidates", element: <EnterpriseCandidates /> },
        { path: "/enterprise/interns", element: <EnterpriseInterns /> },
        { path: "/enterprise/evaluation", element: <EnterpriseEvaluation /> },
        { path: "/enterprise/profile", element: <EnterpriseProfile /> },
      ],
    }],
  },

  /* =======================================================
     FALLBACK
     ======================================================= */

  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);

export default router;
