import { Navigate, type RouteObject } from "react-router-dom";
import { PrivateRoute } from "@/routers/PrivateRouter";
import { BaseLayout } from "@/layouts/BaseLayout";
import { getMenuByRole } from "@/config";

export const educationRoutes: RouteObject = {
    element: <PrivateRoute allowedRoles={["education"]} />,

    children: [
      {
        element: (
          <BaseLayout
            navItems={getMenuByRole("education")}
            homePath="/education/dashboard"
            brandSubtitle="Phòng Đào tạo"
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
            lazy: async () => ({ Component: (await import("@/pages/education/EducationDashboard")).default }),
          },

          /* =========================
             QUẢN LÝ DỮ LIỆU
             ========================= */

          {
            path: "/education/academic-year",
            lazy: async () => ({ Component: (await import("@/pages/education/EducationAcademicYear")).default }),
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
            lazy: async () => ({ Component: (await import("@/pages/education/EducationOjtConditions")).default }),
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
            lazy: async () => ({ Component: (await import("@/pages/education/EducationStudentProgress")).default }),
          },

          {
            path: "/education/student-status",
            lazy: async () => ({ Component: (await import("@/pages/education/EducationStudentStatus")).default }),
          },
          {
            path: "/education/ojt-final-results",
            lazy: async () => ({ Component: (await import("@/pages/education/EducationOjtFinalResults")).default }),
          },

          /* =========================
             ĐỀ XUẤT LỚP HỖ TRỢ TỪ AI
             ========================= */

          {
            path: "/education/ai-class-proposals",
            lazy: async () => ({ Component: (await import("@/pages/education/EducationSupportClassDemand")).default }),
          },
        ],
      },
    ],
  };
