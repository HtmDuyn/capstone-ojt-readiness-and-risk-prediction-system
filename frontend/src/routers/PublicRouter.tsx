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

import EducationDashboard from "@/pages/education/EducationDashboard";
import EducationOjtEligibility from "@/pages/education/EducationOjtEligibility";
import EducationCurriculumPlan from "@/pages/education/EducationCurriculumPlan";
import EducationAcademicYear from "@/pages/education/EducationAcademicYear";
import EducationStudentImport from "@/pages/education/EducationStudentImport";
import EducationOjtConditions from "@/pages/education/EducationOjtConditions";
import EducationStudentProgress from "@/pages/education/EducationStudentProgress";
import EducationStudentStatus from "@/pages/education/EducationStudentStatus";
import EducationAiClassProposals from "@/pages/education/EducationAiClassProposals";

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
      Phân hệ này đang được hoàn thiện. Bạn đã đăng nhập đúng vai trò
      và có thể sử dụng menu bên trái khi các chức năng được triển khai.
    </p>
  </div>
);

/* =========================================================
   ROLE ROUTES CHUNG
   ========================================================= */

const createRoleRoutes = (
  role: Exclude<UserRole, "student">,
): RouteObject => {
  const navItems = getMenuByRole(role);

  return {
    element: (
      <BaseLayout
        navItems={navItems}
        homePath={
          navItems[0]?.path || `/${role}/dashboard`
        }
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
      element: (
        <Navigate
          to="/student/dashboard"
          replace
        />
      ),
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
      element: <StudentFeaturePage />,
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
      element: (
        <Navigate
          to="/student/dashboard"
          replace
        />
      ),
    },

    {
      path: "/dashboard/student",
      element: (
        <Navigate
          to="/student/dashboard"
          replace
        />
      ),
    },

    {
      path: "/dashboard/academic-profile",
      element: (
        <Navigate
          to="/student/academic-profile"
          replace
        />
      ),
    },

    {
      path: "/academic-profile",
      element: (
        <Navigate
          to="/student/academic-profile"
          replace
        />
      ),
    },

    {
      path: "/risk-prediction",
      element: (
        <Navigate
          to="/student/risk-prediction"
          replace
        />
      ),
    },

    {
      path: "/roadmap-consulting",
      element: (
        <Navigate
          to="/student/roadmap-consulting"
          replace
        />
      ),
    },

    {
      path: "/ojt-registration",
      element: (
        <Navigate
          to="/student/ojt-registration"
          replace
        />
      ),
    },

    {
      path: "/ojt-profile",
      element: (
        <Navigate
          to="/student/ojt-profile"
          replace
        />
      ),
    },

    {
      path: "/internship-progress",
      element: (
        <Navigate
          to="/student/internship-progress"
          replace
        />
      ),
    },

    {
      path: "/evaluation-results",
      element: (
        <Navigate
          to="/student/evaluation-results"
          replace
        />
      ),
    },

    {
      path: "/notifications",
      element: (
        <Navigate
          to="/student/notifications"
          replace
        />
      ),
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
        element: (
          <Navigate
            to="/login"
            replace
          />
        ),
      },

      {
        path: "/login",
        element: <LoginPage />,
      },

      {
        path: "/register",
        element: <LoginPage />,
      },
    ],
  },

  /* =======================================================
     STUDENT
     ======================================================= */

  {
    element: (
      <PrivateRoute
        allowedRoles={["student"]}
      />
    ),

    children: [studentRoutes],
  },

  /* =======================================================
     ADMIN
     ======================================================= */

  {
    element: (
      <PrivateRoute
        allowedRoles={["admin"]}
      />
    ),

    children: [
      createRoleRoutes("admin"),
    ],
  },

  /* =======================================================
     PHÒNG ĐÀO TẠO
     ======================================================= */

  {
    element: (
      <PrivateRoute
        allowedRoles={["education"]}
      />
    ),

    children: [
      {
        element: (
          <BaseLayout
            navItems={getMenuByRole(
              "education",
            )}
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
            element: (
              <Navigate
                to="/education/dashboard"
                replace
              />
            ),
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
            element: <EducationStudentImport />,
          },

          {
            path: "/education/curriculum-plan",
            element: <EducationCurriculumPlan />,
          },

          {
            path: "/education/ojt-conditions",
            element: <EducationOjtConditions />,
          },

          /* =========================
             QUẢN LÝ SINH VIÊN
             ========================= */

          {
            path: "/education/student-progress",
            element: <EducationStudentProgress />,
          },

          {
            path: "/education/ojt-eligibility",
            element: <EducationOjtEligibility />,
          },

          {
            path: "/education/student-status",
            element: <EducationStudentStatus />,
          },

          /* =========================
             ĐỀ XUẤT LỚP HỖ TRỢ TỪ AI
             ========================= */

          {
            path: "/education/ai-class-proposals",
            element: (
              <EducationAiClassProposals />
            ),
          },
        ],
      },
    ],
  },

  /* =======================================================
     QHDN
     ======================================================= */

  {
    element: (
      <PrivateRoute
        allowedRoles={["qhdn"]}
      />
    ),

    children: [
      createRoleRoutes("qhdn"),
    ],
  },

  /* =======================================================
     ENTERPRISE
     ======================================================= */

  {
    element: (
      <PrivateRoute
        allowedRoles={["enterprise"]}
      />
    ),

    children: [
      createRoleRoutes("enterprise"),
    ],
  },

  /* =======================================================
     FALLBACK
     ======================================================= */

  {
    path: "*",
    element: (
      <Navigate
        to="/login"
        replace
      />
    ),
  },
]);

export default router;