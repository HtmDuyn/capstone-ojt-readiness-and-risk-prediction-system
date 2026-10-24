// Route access snapshot for Swagger grouping. Keep in sync with authorizeRoles in route modules.
// Explicit entries make a new undocumented role assignment fail at startup.
import type { RoleCode } from '../modules/auth/auth.types';

type Spec = Record<string, any>;
const roleNames: Record<RoleCode, string> = {
  ADMIN: 'Admin', ACADEMIC: 'Phòng đào tạo', OJT_COORD: 'Phòng QHDN',
  ENTERPRISE: 'Doanh nghiệp', STUDENT: 'Sinh viên',
};

const accessGroups: { roles: RoleCode[]; operations: string[] }[] = [
  {roles:["ADMIN","ACADEMIC"],operations:["POST /api/academic/academic-summary-notifications","POST /api/academic/eligibility-notifications","GET /api/academic-periods/{id}/ojt-advisory-schedule","PUT /api/academic-periods/{id}/ojt-advisory-schedule","GET /api/academic/advisory-runs","GET /api/academic/advisory-runs/{id}"]},
  {roles:["STUDENT"],operations:["GET /api/students/me/academic-summary","GET /api/students/me/supplementary-course-options","GET /api/students/me/curriculum","GET /api/students/me/notifications","PATCH /api/students/me/notifications/{id}","GET /api/students/me/assignments/current","GET /api/students/me/ojt-results","GET /api/students/me/ojt-results/{id}","GET /api/students/me/dashboard","GET /api/students/me/roadmap-recommendations"]},
  {roles:['ENTERPRISE'],operations:['POST /api/enterprise/tasks/bulk']},
  {roles:['ADMIN','OJT_COORD','ENTERPRISE','STUDENT'],operations:['GET /api/internship-tasks']},
  {roles:['STUDENT'],operations:['POST /api/students/me/cv','POST /api/job-applications','GET /api/students/me/opportunities']},
  {roles:['ADMIN','OJT_COORD','STUDENT'],operations:['GET /api/job-applications']},
  { roles: ["ADMIN","ACADEMIC"], operations: [
    "GET /api/academic-imports",
    "GET /api/academic-periods/{id}/combo-phase-schedules",
    "GET /api/academic-years",
    "GET /api/academic/alerts",
    "GET /api/academic/course-demand",
    "GET /api/academic/course-demand/export",
    "GET /api/academic/dashboard",
    "GET /api/cohorts",
    "GET /api/combo-registration-windows/{id}/selections",
    "GET /api/courses",
    "GET /api/curricula",
    "GET /api/curricula/{id}",
    "GET /api/curricula/{id}/ojt-grade-mappings/{semesterId}",
    "GET /api/majors",
    "GET /api/ojt-rule-sets",
    "GET /api/ojt-semesters/{id}/assessment-window",
    "GET /api/students",
    "PATCH /api/academic-periods",
    "PATCH /api/academic-years",
    "PATCH /api/cohorts",
    "PATCH /api/combo-registration-windows/{id}",
    "PATCH /api/course-results/{id}",
    "PATCH /api/courses/{id}",
    "PATCH /api/ojt-registration-windows/{id}",
    "PATCH /api/ojt-rule-sets/{id}",
    "PATCH /api/students/{id}",
    "POST /api/academic-periods",
    "POST /api/academic-years",
    "POST /api/academic/alerts/notifications",
    "POST /api/cohorts",
    "POST /api/combo-registration-windows",
    "POST /api/combo-registration-windows/{id}/extensions",
    "POST /api/combo-registration-windows/{id}/finalize",
    "POST /api/combo-registration-windows/{id}/reminders",
    "POST /api/courses",
    "POST /api/curriculum-imports/commit",
    "POST /api/curriculum-imports/preview",
    "POST /api/eligibility-check-runs",
    "POST /api/majors",
    "POST /api/ojt-registration-windows",
    "POST /api/ojt-registration-windows/{id}/semester-exceptions",
    "POST /api/ojt-registration-windows/{id}/semester-exceptions/{exceptionId}/revoke",
    "POST /api/ojt-registrations/{id}/review",
    "POST /api/ojt-rule-sets",
    "POST /api/ojt-rule-sets/{id}/publish",
    "POST /api/ojt-semesters/{id}/assessment-window/close",
    "POST /api/ojt-semesters/{id}/assessment-window/open",
    "POST /api/ojt-semesters/{id}/eligible-student-handoffs",
    "PUT /api/academic-periods/{id}/combo-phase-schedules",
    "PUT /api/curricula/{id}/ojt-grade-mappings/{semesterId}",
    "PUT /api/ojt-semesters/{id}/assessment-window",
  ] },
  { roles: ["ADMIN"], operations: [
    "DELETE /api/companies",
    "DELETE /api/positions",
    "DELETE /api/students",
    "GET /api/accounts",
    "POST /api/admin/audit-logs/list",
    "POST /api/admin/dashboard",



    "POST /api/students/export",



    "POST /api/accounts",

    "POST /api/auth/users/password-reset",
    "POST /api/imports/emails/resend",
    "PATCH /api/accounts/update",
  ] },
  { roles: ["ADMIN","ACADEMIC","OJT_COORD","ENTERPRISE","STUDENT"], operations: [
    "GET /api/auth/me",
    "PATCH /api/accounts/me/profile",
    "POST /api/auth/change-password",
    "POST /api/auth/login",
  ] },
  { roles: ["ADMIN","ACADEMIC","OJT_COORD"], operations: [
    "GET /api/academic-periods",
    "GET /api/ojt-results",
    "GET /api/ojt-semesters/{id}/eligible-student-handoffs",
    "GET /api/ojt-semesters/{id}/results/export",
    "POST /api/imports/commit",
    "POST /api/imports/preview",
  ] },
  { roles: ["ADMIN","OJT_COORD"], operations: [
    "GET /api/assignments",
    "GET /api/companies",
    "GET /api/internship-evaluations",
    "GET /api/ojt-coordinations",
    "GET /api/positions",
    "GET /api/qhdn/dashboard",
    "GET /api/qhdn/registered-students",
    "GET /api/qhdn/reports",
    "GET /api/qhdn/reports/export",
    "PATCH /api/assignments/{id}",
    "PATCH /api/companies/{id}",
    "PATCH /api/recruitment/windows/{id}",
    "POST /api/assignments",
    "POST /api/imports/archive",
    "POST /api/ojt-coordinations",
    "POST /api/ojt-coordinations/{id}/decision",
    "POST /api/ojt-coordinations/{id}/reassign",
    "POST /api/recruitment/posts/{id}/close",
    "POST /api/recruitment/posts/{id}/review",
    "POST /api/recruitment/windows",
  ] },
  { roles: ["ADMIN","ACADEMIC","STUDENT"], operations: [
    "GET /api/ojt-registration-windows",
    "GET /api/combo-registration-windows",
    "GET /api/students/{id}",
    "GET /api/students/{id}/combo-selections",
    "GET /api/students/{id}/course-results",
    "GET /api/students/{id}/eligibility",
    "GET /api/students/{id}/eligibility-checks",
    "POST /api/combo-registration-windows/{id}/preview",
    "POST /api/combo-registration-windows/{id}/selections",
    "POST /api/ojt-registrations",
  ] },
  { roles: [], operations: [
  ] },
  { roles: ["ENTERPRISE"], operations: [
    "GET /api/enterprise/candidates",
    "GET /api/enterprise/internships",
    "GET /api/enterprise/profile",
    "PATCH /api/enterprise/profile",
    "PATCH /api/enterprise/candidates/{id}/decision",
    "PUT /api/enterprise/internships/{id}/evaluation",
  ] },
  { roles: ["ADMIN","ACADEMIC","OJT_COORD","STUDENT"], operations: [
    "GET /api/ojt-registrations",
    "GET /api/students/{id}/cv",
    "GET /api/ojt-semesters/{id}/students",
  ] },
  { roles: ["ADMIN","OJT_COORD","ENTERPRISE"], operations: [
    "GET /api/recruitment/posts",

  ] },
];

export function groupSwaggerByRole(spec: Spec): Spec {
  const access = new Map<string, RoleCode[]>();
  for (const group of accessGroups) for (const key of group.operations) {
    if (access.has(key)) throw new Error('Duplicate Swagger access entry: ' + key);
    access.set(key, group.roles);
  }
  for(const key of ['POST /api/ojt-registration-windows','PATCH /api/ojt-registration-windows/{id}','POST /api/ojt-registrations/{id}/review','POST /api/ojt-results'])access.set(key,['ADMIN','OJT_COORD']);
  for(const key of ['GET /api/ojt-registration-windows','POST /api/ojt-registrations','GET /api/ojt-registrations'])access.set(key,['ADMIN','OJT_COORD','STUDENT']);
  access.set('POST /api/ojt-results/{id}/confirm',['ADMIN','ACADEMIC']);
  const used = new Set<string>();
  for (const [path, item] of Object.entries(spec.paths ?? {}) as [string, Spec][]) {
    for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
      const operation = item[method];
      if (!operation) continue;
      const key = method.toUpperCase() + ' ' + path;
      const roles = access.get(key);
      if (!roles) throw new Error('Missing Swagger role assignment: ' + key);
      used.add(key);
      operation['x-roles'] = operation.security?.length ? [...roles] : [];
      // Tags organize primary functions, while x-roles retains every authorized role.
      // Shared business APIs appear under their business roles instead of repeating under Admin.
      const displayRoles = roles.length > 1 ? roles.filter(role => role !== 'ADMIN' && !(path === '/api/accounts/me/profile' && role === 'ENTERPRISE')) : roles;
      // Authentication lives in its own group. Admin password reset stays under Admin.
      operation.tags = path.startsWith('/api/auth/') && !path.startsWith('/api/auth/users/')
        ? ['Auth'] : displayRoles.length ? displayRoles.map(role => roleNames[role]) : ['Admin'];
    }
  }
  for (const key of access.keys()) if (!used.has(key)) throw new Error('Stale Swagger role assignment: ' + key);
  spec.tags = [
    { name: 'Admin', description: 'Chức năng quản trị và theo dõi hệ thống. API nghiệp vụ dùng chung hiển thị ở nhóm phụ trách; quyền Admin vẫn giữ nguyên.' },
    { name: 'Phòng đào tạo', description: 'Quản lý học vụ và xét điều kiện OJT.' },
    { name: 'Phòng QHDN', description: 'Quản lý tuyển dụng, điều phối và thực tập.' },
    { name: 'Doanh nghiệp', description: 'Quản lý hồ sơ, tuyển dụng và thực tập sinh.' },
    { name: 'Sinh viên', description: 'Xem học tập, chọn combo và đăng ký OJT.' },
    { name: 'Auth', description: 'Đăng nhập, thông tin phiên và đổi mật khẩu.' },
  ];
  return spec;
}
