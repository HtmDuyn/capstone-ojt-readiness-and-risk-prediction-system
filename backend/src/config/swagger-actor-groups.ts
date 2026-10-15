/**
 * Swagger display-only grouping by frontend actor.
 * This file changes OpenAPI tags, NOT Express routes or authorization.
 * Inventory baseline: 223 unique operations (method + path).
 * Source mapping: actor docs reviewed against critical route middleware.
 * IMPORTANT: /api/health is public; it is shown under Admin for navigation only.
 * Do not treat membership in a Swagger tag as access control.
 */

const actorGroups = [
  {
    "name": "Auth",
    "description": "Đăng nhập, đăng xuất và quản lý phiên."
  },
  {
    "name": "Admin",
    "description": "Quản trị hệ thống và các API Admin được quyền sử dụng."
  },
  {
    "name": "Phòng Đào tạo",
    "description": "API cho vai trò ACADEMIC; quyền thao tác do backend quyết định."
  },
  {
    "name": "Phòng QHDN",
    "description": "API cho vai trò OJT_COORD; chỉ dữ liệu đúng phạm vi được phép."
  },
  {
    "name": "Doanh nghiệp",
    "description": "API cho vai trò ENTERPRISE; giới hạn theo doanh nghiệp liên kết."
  },
  {
    "name": "Student",
    "description": "API cho vai trò STUDENT; chỉ thông tin và thao tác hợp lệ của sinh viên."
  }
] as const;

const operationTags: Readonly<Record<string, readonly string[]>> = {
  "POST /api/academic-periods": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/academic-years": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/academic/academic-summary-notifications": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/academic/alerts/notifications": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/academic/eligibility-notifications": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/accounts": [
    "Admin"
  ],
  "GET /api/accounts/me/profile": [
    "Admin",
    "Phòng Đào tạo",
    "Phòng QHDN",
    "Doanh nghiệp",
    "Student"
  ],
  "PATCH /api/accounts/me/profile": [
    "Admin",
    "Phòng Đào tạo",
    "Phòng QHDN",
    "Doanh nghiệp",
    "Student"
  ],
  "GET /api/admin/dashboard/summary": [
    "Admin"
  ],
  "POST /api/admin/prediction-jobs": [
    "Admin"
  ],
  "POST /api/assessment-templates": [
    "Admin"
  ],
  "POST /api/assignments": [
    "Admin",
    "Phòng QHDN"
  ],
  "POST /api/auth/change-password": [
    "Auth"
  ],
  "POST /api/auth/login": [
    "Auth"
  ],
  "POST /api/auth/logout": [
    "Auth"
  ],
  "GET /api/auth/me": [
    "Auth"
  ],
  "POST /api/cohorts": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/combo-registration-windows": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/companies": [
    "Admin",
    "Phòng QHDN"
  ],
  "POST /api/course-result-imports/commit": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/course-result-imports/preview": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/courses": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/curricula": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/curriculum-imports/commit": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/curriculum-imports/preview": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/eligibility-check-runs": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "GET /api/health": [
    "Admin"
  ],
  "POST /api/imports/archive": [
    "Admin",
    "Phòng QHDN"
  ],
  "POST /api/imports/commit": [
    "Admin",
    "Phòng Đào tạo",
    "Phòng QHDN"
  ],
  "GET /api/imports/emails": [
    "Admin"
  ],
  "POST /api/imports/preview": [
    "Admin",
    "Phòng Đào tạo",
    "Phòng QHDN"
  ],
  "POST /api/json/academic-imports/detail": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/academic-imports/search": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "PATCH /api/json/academic-periods": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "PUT /api/json/academic-periods/combo-phase-schedules": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/academic-periods/combo-phase-schedules/search": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "PUT /api/json/academic-periods/ojt-advisory-schedule": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/academic-periods/ojt-advisory-schedule/search": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/academic-periods/search": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "PATCH /api/json/academic-years": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/academic-years/search": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/academic/advisory-runs/detail": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/academic/advisory-runs/search": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/academic/alerts/search": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/academic/course-demand/export": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/academic/course-demand/search": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/academic/dashboard/search": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/academic/eligibility-statistics/search": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "PUT /api/json/accounts": [
    "Admin",
    "Phòng Đào tạo",
    "Phòng QHDN",
    "Doanh nghiệp",
    "Student"
  ],
  "POST /api/json/accounts/detail": [
    "Admin",
    "Phòng Đào tạo",
    "Phòng QHDN",
    "Doanh nghiệp",
    "Student"
  ],
  "PATCH /api/json/accounts/role": [
    "Admin"
  ],
  "POST /api/json/accounts/search": [
    "Admin"
  ],
  "PATCH /api/json/accounts/status": [
    "Admin"
  ],
  "POST /api/json/admin/audit-logs/search": [
    "Admin"
  ],
  "POST /api/json/admin/dashboard/readiness/search": [
    "Admin"
  ],
  "POST /api/json/admin/dashboard/risks/search": [
    "Admin"
  ],
  "POST /api/json/admin/dashboard/trends/search": [
    "Admin"
  ],
  "POST /api/json/admin/models/detail": [
    "Admin"
  ],
  "POST /api/json/admin/models/search": [
    "Admin"
  ],
  "POST /api/json/admin/prediction-jobs/detail": [
    "Admin"
  ],
  "POST /api/json/admin/reports/export": [
    "Admin"
  ],
  "POST /api/json/admin/reports/readiness/search": [
    "Admin"
  ],
  "POST /api/json/admin/reports/risks/search": [
    "Admin"
  ],
  "POST /api/json/alerts/detail": [
    "Admin"
  ],
  "POST /api/json/alerts/interventions": [
    "Admin"
  ],
  "POST /api/json/alerts/search": [
    "Admin"
  ],
  "PATCH /api/json/alerts/status": [
    "Admin"
  ],
  "PATCH /api/json/assessment-templates": [
    "Admin"
  ],
  "POST /api/json/assessment-templates/detail": [
    "Admin"
  ],
  "POST /api/json/assessment-templates/publish": [
    "Admin"
  ],
  "POST /api/json/assessment-templates/search": [
    "Admin"
  ],
  "POST /api/json/assessments/detail": [
    "Admin"
  ],
  "POST /api/json/assessments/search": [
    "Admin"
  ],
  "PATCH /api/json/assignments": [
    "Admin",
    "Phòng QHDN"
  ],
  "POST /api/json/assignments/detail": [
    "Admin",
    "Phòng QHDN",
    "Doanh nghiệp"
  ],
  "PUT /api/json/assignments/internship-evaluation": [
    "Admin",
    "Phòng QHDN",
    "Doanh nghiệp"
  ],
  "POST /api/json/assignments/search": [
    "Admin",
    "Phòng QHDN",
    "Doanh nghiệp"
  ],
  "PATCH /api/json/assignments/status": [
    "Admin",
    "Phòng QHDN"
  ],
  "POST /api/json/auth/users/password-reset": [
    "Admin"
  ],
  "PATCH /api/json/cohorts": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/cohorts/search": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "PATCH /api/json/combo-registration-windows": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/combo-registration-windows/close": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/combo-registration-windows/extensions": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/combo-registration-windows/finalize": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/combo-registration-windows/open": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/combo-registration-windows/preview": [
    "Admin",
    "Phòng Đào tạo",
    "Student"
  ],
  "POST /api/json/combo-registration-windows/reminders": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/combo-registration-windows/search": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/combo-registration-windows/selections": [
    "Admin",
    "Phòng Đào tạo",
    "Student"
  ],
  "POST /api/json/combo-registration-windows/selections/search": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "PUT /api/json/combos/courses": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "DELETE /api/json/companies": [
    "Admin"
  ],
  "PATCH /api/json/companies": [
    "Admin",
    "Phòng QHDN"
  ],
  "POST /api/json/companies/detail": [
    "Admin",
    "Phòng QHDN",
    "Doanh nghiệp"
  ],
  "POST /api/json/companies/search": [
    "Admin",
    "Phòng QHDN",
    "Doanh nghiệp"
  ],
  "POST /api/json/company-imports/detail": [
    "Admin",
    "Phòng QHDN"
  ],
  "POST /api/json/company-imports/search": [
    "Admin",
    "Phòng QHDN"
  ],
  "PATCH /api/json/course-results": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "PATCH /api/json/courses": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/courses/search": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "PATCH /api/json/curricula": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/curricula/combos": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/curricula/combos/search": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "PUT /api/json/curricula/course-equivalences": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "PUT /api/json/curricula/courses": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/curricula/detail": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "PUT /api/json/curricula/ojt-grade-mappings": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/curricula/ojt-grade-mappings/detail": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "PUT /api/json/curricula/prerequisites": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/curricula/publish": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/curricula/search": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/eligibility-check-runs/detail": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/eligibility-checks/confirm": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/imports/emails/retry": [
    "Admin"
  ],
  "POST /api/json/internship-evaluations/detail": [
    "Admin",
    "Phòng QHDN",
    "Doanh nghiệp"
  ],
  "POST /api/json/internship-evaluations/search": [
    "Admin",
    "Phòng QHDN",
    "Doanh nghiệp"
  ],
  "PATCH /api/json/interventions": [
    "Admin"
  ],
  "POST /api/json/job-applications/cv/search": [
    "Admin",
    "Phòng QHDN",
    "Doanh nghiệp"
  ],
  "POST /api/json/job-applications/detail": [
    "Admin",
    "Phòng QHDN",
    "Doanh nghiệp"
  ],
  "POST /api/json/job-applications/search": [
    "Admin",
    "Phòng QHDN",
    "Doanh nghiệp"
  ],
  "POST /api/json/majors/search": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/ojt-coordinations/decision": [
    "Admin",
    "Phòng QHDN",
    "Doanh nghiệp"
  ],
  "POST /api/json/ojt-coordinations/detail": [
    "Admin",
    "Phòng QHDN",
    "Doanh nghiệp"
  ],
  "POST /api/json/ojt-coordinations/reassign": [
    "Admin",
    "Phòng QHDN"
  ],
  "POST /api/json/ojt-coordinations/search": [
    "Admin",
    "Phòng QHDN",
    "Doanh nghiệp"
  ],
  "PATCH /api/json/ojt-registration-windows": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/ojt-registration-windows/close": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/ojt-registration-windows/open": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/ojt-registration-windows/search": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/ojt-registration-windows/semester-exceptions": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/ojt-registration-windows/semester-exceptions/revoke": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/ojt-registrations/detail": [
    "Admin",
    "Phòng Đào tạo",
    "Phòng QHDN",
    "Student"
  ],
  "POST /api/json/ojt-registrations/review": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/ojt-registrations/search": [
    "Admin",
    "Phòng Đào tạo",
    "Phòng QHDN",
    "Student"
  ],
  "PATCH /api/json/ojt-results": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/ojt-results/confirm": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/ojt-results/detail": [
    "Admin",
    "Phòng Đào tạo",
    "Phòng QHDN"
  ],
  "POST /api/json/ojt-results/revision-requests": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/ojt-results/search": [
    "Admin",
    "Phòng Đào tạo",
    "Phòng QHDN"
  ],
  "POST /api/json/ojt-results/transfer": [
    "Admin",
    "Phòng QHDN"
  ],
  "PATCH /api/json/ojt-rule-sets": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/ojt-rule-sets/publish": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/ojt-rule-sets/search": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "PATCH /api/json/ojt-semesters": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "PUT /api/json/ojt-semesters/assessment-window": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/ojt-semesters/assessment-window/close": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/ojt-semesters/assessment-window/open": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/ojt-semesters/assessment-window/search": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/ojt-semesters/detail": [
    "Admin",
    "Phòng Đào tạo",
    "Phòng QHDN"
  ],
  "POST /api/json/ojt-semesters/eligible-student-handoffs": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/ojt-semesters/eligible-student-handoffs/search": [
    "Admin",
    "Phòng Đào tạo",
    "Phòng QHDN"
  ],
  "POST /api/json/ojt-semesters/results/export": [
    "Admin",
    "Phòng Đào tạo",
    "Phòng QHDN"
  ],
  "POST /api/json/ojt-semesters/search": [
    "Admin",
    "Phòng Đào tạo",
    "Phòng QHDN"
  ],
  "POST /api/json/ojt-semesters/students/search": [
    "Admin",
    "Phòng Đào tạo",
    "Phòng QHDN",
    "Student"
  ],
  "DELETE /api/json/positions": [
    "Admin"
  ],
  "PATCH /api/json/positions": [
    "Admin",
    "Phòng QHDN"
  ],
  "POST /api/json/positions/detail": [
    "Admin",
    "Phòng QHDN",
    "Doanh nghiệp"
  ],
  "POST /api/json/positions/search": [
    "Admin",
    "Phòng QHDN",
    "Doanh nghiệp"
  ],
  "POST /api/json/predictions/detail": [
    "Admin"
  ],
  "POST /api/json/predictions/search": [
    "Admin"
  ],
  "POST /api/json/qhdn/dashboard/search": [
    "Admin",
    "Phòng QHDN"
  ],
  "POST /api/json/qhdn/reports/acceptance/search": [
    "Admin",
    "Phòng QHDN"
  ],
  "POST /api/json/qhdn/reports/enterprise-feedback/search": [
    "Admin",
    "Phòng QHDN"
  ],
  "POST /api/json/qhdn/reports/export": [
    "Admin",
    "Phòng QHDN"
  ],
  "POST /api/json/qhdn/reports/internships/search": [
    "Admin",
    "Phòng QHDN"
  ],
  "PATCH /api/json/recruitment-posts": [
    "Admin",
    "Phòng QHDN"
  ],
  "POST /api/json/recruitment-posts/close": [
    "Admin",
    "Phòng QHDN"
  ],
  "POST /api/json/recruitment-posts/detail": [
    "Admin",
    "Phòng QHDN"
  ],
  "POST /api/json/recruitment-posts/publish": [
    "Admin",
    "Phòng QHDN"
  ],
  "POST /api/json/recruitment-posts/search": [
    "Admin",
    "Phòng QHDN"
  ],
  "POST /api/json/student/academic-summary/search": [
    "Student"
  ],
  "POST /api/json/student/applications/detail": [
    "Student"
  ],
  "POST /api/json/student/applications/search": [
    "Student"
  ],
  "POST /api/json/student/applications/withdraw": [
    "Student"
  ],
  "POST /api/json/student/assignments/current/search": [
    "Student"
  ],
  "POST /api/json/student/combo-registration-windows/search": [
    "Student"
  ],
  "POST /api/json/student/companies/detail": [
    "Student"
  ],
  "POST /api/json/student/companies/search": [
    "Student"
  ],
  "POST /api/json/student/company-recommendations/search": [
    "Student"
  ],
  "POST /api/json/student/cv/analyses/detail": [
    "Student"
  ],
  "POST /api/json/student/cv/search": [
    "Student"
  ],
  "POST /api/json/student/dashboard/search": [
    "Student"
  ],
  "PATCH /api/json/student/notifications/read": [
    "Student"
  ],
  "POST /api/json/student/notifications/search": [
    "Student"
  ],
  "POST /api/json/student/ojt-registration-windows/search": [
    "Student"
  ],
  "POST /api/json/student/ojt-results/detail": [
    "Student"
  ],
  "POST /api/json/student/ojt-results/search": [
    "Student"
  ],
  "POST /api/json/student/positions/detail": [
    "Student"
  ],
  "POST /api/json/student/positions/search": [
    "Student"
  ],
  "POST /api/json/student/risk-prediction/search": [
    "Student"
  ],
  "POST /api/json/student/roadmap-recommendations/search": [
    "Student"
  ],
  "POST /api/json/student/supplementary-course-options/search": [
    "Student"
  ],
  "DELETE /api/json/students": [
    "Admin"
  ],
  "PATCH /api/json/students": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "PATCH /api/json/students/academic-placement": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/students/academic-progress/search": [
    "Admin",
    "Phòng Đào tạo",
    "Student"
  ],
  "POST /api/json/students/combo-selections/search": [
    "Admin",
    "Phòng Đào tạo",
    "Student"
  ],
  "POST /api/json/students/course-results/search": [
    "Admin",
    "Phòng Đào tạo",
    "Student"
  ],
  "POST /api/json/students/detail": [
    "Admin",
    "Phòng Đào tạo",
    "Student"
  ],
  "POST /api/json/students/eligibility-checks": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/json/students/eligibility-checks/search": [
    "Admin",
    "Phòng Đào tạo",
    "Student"
  ],
  "POST /api/json/students/eligibility/search": [
    "Admin",
    "Phòng Đào tạo",
    "Student"
  ],
  "POST /api/json/students/export": [
    "Admin"
  ],
  "POST /api/json/students/interventions/search": [
    "Admin"
  ],
  "POST /api/json/students/predictions/search": [
    "Admin"
  ],
  "POST /api/json/students/search": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/majors": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/ojt-coordinations": [
    "Admin",
    "Phòng QHDN"
  ],
  "POST /api/ojt-registration-windows": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/ojt-registrations": [
    "Admin",
    "Phòng Đào tạo",
    "Student"
  ],
  "POST /api/ojt-results": [
    "Admin",
    "Phòng QHDN"
  ],
  "POST /api/ojt-rule-sets": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/ojt-semesters": [
    "Admin",
    "Phòng Đào tạo"
  ],
  "POST /api/positions": [
    "Admin",
    "Phòng QHDN"
  ],
  "GET /api/roles": [
    "Admin"
  ],
  "POST /api/student/applications": [
    "Student"
  ],
  "GET /api/student/curriculum": [
    "Student"
  ],
  "DELETE /api/student/cv": [
    "Student"
  ],
  "POST /api/student/cv": [
    "Student"
  ],
  "POST /api/student/cv/analyses": [
    "Student"
  ],
  "POST /api/students": [
    "Admin"
  ],
  "PATCH /api/students/academic-placement": [
    "Admin",
    "Phòng Đào tạo"
  ]
};

const HTTP_METHODS = ["get", "post", "put", "patch", "delete"] as const;

export function groupSwaggerByActor<T extends Record<string, any>>(spec: T): T {
  const accepted = new Set<string>(actorGroups.map(group => group.name));
  const seen = new Set<string>();
  const changes: Array<{ operation: Record<string, any>; tags: string[] }> = [];
  for (const [url, pathItem] of Object.entries(spec.paths ?? {})) {
    for (const method of HTTP_METHODS) {
      const operation = (pathItem as Record<string, any>)[method] as Record<string, any> | undefined;
      if (!operation) continue;
      const key = `${method.toUpperCase()} ${url}`;
      const tags = operationTags[key];
      if (!tags) throw new Error(`Missing Swagger actor mapping: ${key}`);
      if (seen.has(key)) throw new Error(`Duplicate Swagger operation: ${key}`);
      if (tags.length === 0 || new Set(tags).size !== tags.length || tags.some(tag => !accepted.has(tag))) {
        throw new Error(`Invalid Swagger actor tags: ${key}`);
      }
      seen.add(key);
      changes.push({ operation, tags: [...tags] });
    }
  }
  const expected = Object.keys(operationTags);
  if (seen.size !== expected.length || expected.length !== 223) {
    const missing = expected.filter(key => !seen.has(key));
    throw new Error(`Swagger actor inventory changed; found ${seen.size} operations, expected 223. Missing: ${missing.join(", ")}`);
  }
  // Assign only tags, preserving original paths, methods, payload schemas and security.
  for (const { operation, tags } of changes) operation.tags = tags;
  (spec as Record<string, any>).tags = actorGroups.map(group => ({ ...group }));
  return spec;
}
