# Đầu vào API dành cho FE và test thủ công

Nguồn: OpenAPI hiện tại của backend. Tạo lại bằng `npm run docs:api` sau `npm run build`.
Phạm vi: 158 operations; 0 path parameters; 0 query parameters; 151 request bodies.


FE nhập ID, bộ lọc và dữ liệu trong JSON body. Các API trước đây dùng path/query có cách gọi mới tại `/api/json/...`; API đọc có đầu vào chuyển sang POST. Các API vốn chỉ nhận JSON và API không có đầu vào giữ đường dẫn hiện tại. API cũ vẫn hoạt động để tương thích. Không cần gọi GET trước khi đã biết ID và không cần chạy lại chuỗi API trong cùng phiên. Token hợp lệ, quan hệ dữ liệu, version và trạng thái nghiệp vụ vẫn bắt buộc.

Bạn tự insert dữ liệu mẫu: dùng đúng bảng/ID, FK, trạng thái, snapshot và fingerprint nguồn theo schema. Ví dụ confirm eligibility hoặc điểm OJT sẽ trả 409 nếu dữ liệu mẫu thiếu liên kết, snapshot hoặc không còn khớp nguồn. Không chỉ đổi một cột Status để giả lập hoàn tất nghiệp vụ.

- Swagger: `/api-docs`. Nhấn Try it out rồi nhập tất cả trường trong Request body / Edit Value. Không nhập path/query cho cách gọi JSON. Schema hiển thị các trường và ràng buộc.
- OpenAPI JSON cho FE: `/api-docs/openapi.json`.
- `studentId` = StudentID; `programId` = ProgramID; `majorId` = SpecializationID; `courseId` = CourseID. Các loại ID không thay thế cho nhau.
- Mọi ID trong ví dụ là minh họa; thay bằng ID thực tế trong dữ liệu mẫu. Không tự gọi các API tạo dữ liệu từ ví dụ.
- Import commit nhận đủ JSON và tự kiểm tra, không bắt buộc chạy preview trước.
- Các thao tác mở/đóng/chốt/duyệt/xác nhận kiểm tra trạng thái đang lưu trong DB; không yêu cầu lịch sử gọi API của trình duyệt.
- Các ví dụ không tạo bản ghi mẫu, không thay đổi quy chế và không làm frontend tự gọi thêm API.

## Ánh xạ cách gọi cũ sang JSON

| API cũ | API nhập JSON | ID và bộ lọc trong JSON |
| --- | --- | --- |
| GET /api/academic-years | POST /api/json/academic-years/list | page, limit, search, status |
| PATCH /api/academic-years/{id} | PATCH /api/json/academic-years | academicYearId (bắt buộc) |
| GET /api/academic-periods | POST /api/json/academic-periods/list | page, limit, search, status, academicYearId, kind, academicPeriodId |
| PATCH /api/academic-periods/{id} | PATCH /api/json/academic-periods | academicPeriodId (bắt buộc) |
| GET /api/cohorts | POST /api/json/cohorts/list | page, limit, search, status |
| PATCH /api/cohorts/{id} | PATCH /api/json/cohorts | cohortId (bắt buộc) |
| GET /api/academic-periods/{id}/combo-phase-schedules | POST /api/json/academic-periods/combo-phase-schedules/list | academicPeriodId (bắt buộc) |
| PUT /api/academic-periods/{id}/combo-phase-schedules | PUT /api/json/academic-periods/combo-phase-schedules | academicPeriodId (bắt buộc) |
| GET /api/ojt-semesters/{id}/assessment-window | POST /api/json/ojt-semesters/assessment-window/search | ojtSemesterId (bắt buộc) |
| PUT /api/ojt-semesters/{id}/assessment-window | PUT /api/json/ojt-semesters/assessment-window | ojtSemesterId (bắt buộc) |
| POST /api/ojt-semesters/{id}/assessment-window/open | POST /api/json/ojt-semesters/assessment-window/open | ojtSemesterId (bắt buộc) |
| POST /api/ojt-semesters/{id}/assessment-window/close | POST /api/json/ojt-semesters/assessment-window/close | ojtSemesterId (bắt buộc) |
| GET /api/curricula/{id}/ojt-grade-mappings/{semesterId} | POST /api/json/curricula/ojt-grade-mappings/detail | programId (bắt buộc), semesterId (bắt buộc) |
| PUT /api/curricula/{id}/ojt-grade-mappings/{semesterId} | PUT /api/json/curricula/ojt-grade-mappings | programId (bắt buộc), semesterId (bắt buộc) |
| POST /api/ojt-registration-windows/{id}/semester-exceptions | POST /api/json/ojt-registration-windows/semester-exceptions | windowId (bắt buộc) |
| POST /api/ojt-registration-windows/{id}/semester-exceptions/{exceptionId}/revoke | POST /api/json/ojt-registration-windows/semester-exceptions/revoke | windowId (bắt buộc), exceptionId (bắt buộc) |
| POST /api/combo-registration-windows/{id}/preview | POST /api/json/combo-registration-windows/preview | windowId (bắt buộc) |
| GET /api/academic/dashboard | POST /api/json/academic/dashboard/search | ojtSemesterId (bắt buộc), programId, cohortId, majorId, comboId, groupCode, academicPeriodId, assessmentDeadline, section, groupBy |
| GET /api/academic/alerts | POST /api/json/academic/alerts/list | ojtSemesterId (bắt buộc), programId, cohortId, majorId, comboId, groupCode, academicPeriodId (bắt buộc), assessmentDeadline (bắt buộc), type, page, limit |
| GET /api/academic/course-demand | POST /api/json/academic/course-demand/list | ojtSemesterId (bắt buộc), programId, cohortId, majorId, comboId, groupCode, academicPeriodId (bắt buộc), assessmentDeadline, courseId, includeInProgress, page, limit |
| GET /api/academic/course-demand/export | POST /api/json/academic/course-demand/export | ojtSemesterId (bắt buộc), programId, cohortId, majorId, comboId, groupCode, academicPeriodId (bắt buộc), assessmentDeadline, courseId, includeInProgress, format |
| GET /api/accounts | POST /api/json/accounts/list | userId, page, limit, search, roleCode, status |
| PATCH /api/accounts/{userId} | PATCH /api/json/accounts | userId (bắt buộc) |
| GET /api/combo-registration-windows | POST /api/json/combo-registration-windows/list | page, limit, phase, status, academicPeriodId, studentId |
| PATCH /api/combo-registration-windows/{id} | PATCH /api/json/combo-registration-windows | windowId (bắt buộc) |
| POST /api/combo-registration-windows/{id}/extensions | POST /api/json/combo-registration-windows/extensions | windowId (bắt buộc) |
| GET /api/combo-registration-windows/{id}/selections | POST /api/json/combo-registration-windows/selections/list | windowId (bắt buộc), page, limit, status |
| POST /api/combo-registration-windows/{id}/selections | POST /api/json/combo-registration-windows/selections | windowId (bắt buộc) |
| POST /api/combo-registration-windows/{id}/reminders | POST /api/json/combo-registration-windows/reminders | windowId (bắt buộc) |
| GET /api/students/{id}/combo-selections | POST /api/json/students/combo-selections/list | studentId (bắt buộc), page, limit |
| POST /api/combo-registration-windows/{id}/finalize | POST /api/json/combo-registration-windows/finalize | windowId (bắt buộc) |
| GET /api/majors | POST /api/json/majors/list | page, limit, search, parentMajorId |
| GET /api/courses | POST /api/json/courses/list | page, limit, search |
| GET /api/curricula | POST /api/json/curricula/list | page, limit, search, majorId, status, version |
| PATCH /api/courses/{id} | PATCH /api/json/courses | courseId (bắt buộc) |
| GET /api/curricula/{id} | POST /api/json/curricula/detail | programId (bắt buộc) |
| GET /api/ojt-rule-sets | POST /api/json/ojt-rule-sets/list | programId, ojtSemesterId, status, page, limit |
| PATCH /api/ojt-rule-sets/{id} | PATCH /api/json/ojt-rule-sets | ruleSetId (bắt buộc) |
| POST /api/ojt-rule-sets/{id}/publish | POST /api/json/ojt-rule-sets/publish | ruleSetId (bắt buộc) |
| GET /api/students/{id}/eligibility-checks | POST /api/json/students/eligibility-checks/list | studentId (bắt buộc), ojtSemesterId, page, limit |
| POST /api/students/{id}/eligibility-checks | POST /api/json/students/eligibility-checks | studentId (bắt buộc) |
| GET /api/students/{id}/eligibility | POST /api/json/students/eligibility/search | studentId (bắt buộc), ojtSemesterId (bắt buộc) |
| POST /api/eligibility-checks/{id}/confirm | POST /api/json/eligibility-checks/confirm | checkId (bắt buộc) |
| GET /api/eligibility-check-runs/{id} | POST /api/json/eligibility-check-runs/detail | runId (bắt buộc), page, limit |
| POST /api/imports/emails/{emailId}/retry | POST /api/json/imports/emails/retry | emailId (bắt buộc) |
| GET /api/ojt-registration-windows | POST /api/json/ojt-registration-windows/list | ojtSemesterId, status, page, limit, studentId |
| PATCH /api/ojt-registration-windows/{id} | PATCH /api/json/ojt-registration-windows | windowId (bắt buộc) |
| GET /api/ojt-registrations | POST /api/json/ojt-registrations/list | ojtSemesterId, windowId, studentId, programId, cohortId, groupCode, status, search, page, limit, registrationId, historyPage, historyLimit, coordinationPage, coordinationLimit, assignmentPage, assignmentLimit |
| POST /api/ojt-registrations/{id}/review | POST /api/json/ojt-registrations/review | registrationId (bắt buộc) |
| GET /api/ojt-semesters/{id}/eligible-student-handoffs | POST /api/json/ojt-semesters/eligible-student-handoffs/list | ojtSemesterId (bắt buộc), page, limit |
| POST /api/ojt-semesters/{id}/eligible-student-handoffs | POST /api/json/ojt-semesters/eligible-student-handoffs | ojtSemesterId (bắt buộc) |
| GET /api/ojt-semesters/{id}/students | POST /api/json/ojt-semesters/students/list | ojtSemesterId (bắt buộc), programId, cohortId, groupCode, registrationStatus, search, page, limit, enterpriseId, coordinationStatus, assignmentStatus, studentId |
| GET /api/companies | POST /api/json/companies/list | page, limit, search, status, companyId, historyPage, historyLimit |
| PATCH /api/companies/{id} | PATCH /api/json/companies | companyId (bắt buộc) |
| DELETE /api/companies/{id} | DELETE /api/json/companies | companyId (bắt buộc) |
| GET /api/positions | POST /api/json/positions/list | page, limit, search, status, companyId, ojtSemesterId, positionId, historyPage, historyLimit |
| GET /api/ojt-coordinations | POST /api/json/ojt-coordinations/list | page, limit, search, status, companyId, ojtSemesterId, studentId, positionId, registrationId, decision, coordinationId, historyPage, historyLimit, coordinationPage, coordinationLimit, applicationId |
| GET /api/assignments | POST /api/json/assignments/list | page, limit, search, status, companyId, ojtSemesterId, studentId, positionId, assignmentId, historyPage, historyLimit |
| PATCH /api/assignments/{id} | PATCH /api/json/assignments | assignmentId (bắt buộc) |
| GET /api/internship-evaluations | POST /api/json/internship-evaluations/list | page, limit, search, status, companyId, ojtSemesterId, studentId, positionId, assignmentId, templateId, evaluationId, historyPage, historyLimit |
| POST /api/ojt-coordinations/{id}/decision | POST /api/json/ojt-coordinations/decision | coordinationId (bắt buộc) |
| POST /api/ojt-coordinations/{id}/reassign | POST /api/json/ojt-coordinations/reassign | coordinationId (bắt buộc) |
| GET /api/qhdn/registered-students | POST /api/json/qhdn/registered-students/list | registrationId, studentId, ojtSemesterId, academicPeriodId, windowId, status, programId, cohortId, groupCode, search, handoffStatus, page, limit |
| GET /api/qhdn/dashboard | POST /api/json/qhdn/dashboard/search | ojtSemesterId, companyId |
| GET /api/qhdn/reports/export | POST /api/json/qhdn/reports/export | ojtSemesterId, companyId, type (bắt buộc), format |
| GET /api/qhdn/reports | POST /api/json/qhdn/reports/list | ojtSemesterId, companyId, page, limit, type (bắt buộc) |
| GET /api/students | POST /api/json/students/list | page, limit, search, status, programId, cohortId, groupCode, enrollmentYear, currentSemester |
| GET /api/students/{id} | POST /api/json/students/detail | studentId (bắt buộc), resultsPage, resultsLimit, ojtPage, ojtLimit, ojtSemesterId, section |
| PATCH /api/students/{id} | PATCH /api/json/students | studentId (bắt buộc) |
| DELETE /api/students/{id} | DELETE /api/json/students | studentId (bắt buộc) |
| GET /api/students/{id}/course-results | POST /api/json/students/course-results/list | studentId (bắt buộc), page, limit, courseId, academicPeriodId, status |
| PATCH /api/course-results/{id} | PATCH /api/json/course-results | courseResultId (bắt buộc) |
| GET /api/academic-imports | POST /api/json/academic-imports/list | page, limit, kind, status, importId, rowsPage, rowsLimit |
| POST /api/auth/users/{userId}/password-reset | POST /api/json/auth/users/password-reset | userId (bắt buộc) |
| GET /api/admin/dashboard | POST /api/json/admin/dashboard/search | ojtSemesterId, studentId, modelId, riskLevel, readinessLevel, from, to, section |
| GET /api/students/export | POST /api/json/students/export | search, status, programId, cohortId, groupCode, enrollmentYear, currentSemester |
| DELETE /api/positions/{id} | DELETE /api/json/positions | positionId (bắt buộc) |
| GET /api/assessment-templates | POST /api/json/assessment-templates/list | page, limit, templateId, search, status |
| PATCH /api/assessment-templates/{id} | PATCH /api/json/assessment-templates | templateId (bắt buộc) |
| POST /api/assessment-templates/{id}/publish | POST /api/json/assessment-templates/publish | templateId (bắt buộc) |
| GET /api/admin/prediction-jobs/{id} | POST /api/json/admin/prediction-jobs/detail | jobId (bắt buộc), page, limit |
| GET /api/predictions | POST /api/json/predictions/list | page, limit, ojtSemesterId, studentId, modelId, riskLevel, readinessLevel, from, to, predictionId |
| GET /api/admin/models | POST /api/json/admin/models/list | page, limit, modelId, search, status |
| GET /api/alerts | POST /api/json/alerts/list | page, limit, alertId, studentId, ojtSemesterId, status, interventionPage, interventionLimit |
| PATCH /api/alerts/{id}/status | PATCH /api/json/alerts/status | alertId (bắt buộc) |
| POST /api/alerts/{id}/interventions | POST /api/json/alerts/interventions | alertId (bắt buộc) |
| GET /api/students/{id}/interventions | POST /api/json/students/interventions/list | studentId (bắt buộc), page, limit, status |
| PATCH /api/interventions/{id} | PATCH /api/json/interventions | interventionId (bắt buộc) |
| GET /api/admin/reports/readiness | POST /api/json/admin/reports/readiness/list | page, limit, ojtSemesterId, studentId, modelId, riskLevel, readinessLevel, from, to |
| GET /api/admin/reports/export | POST /api/json/admin/reports/export | ojtSemesterId, studentId, modelId, riskLevel, readinessLevel, from, to, type (bắt buộc), format |
| GET /api/admin/audit-logs | POST /api/json/admin/audit-logs/list | page, limit, userId, entityType, entityId, action |
| GET /api/enterprise/candidates | POST /api/json/enterprise/candidates/list | companyId (bắt buộc), studentId, page, limit, ojtSemesterId, positionId, search, candidateId, decision |
| PATCH /api/enterprise/candidates/{id}/decision | PATCH /api/json/enterprise/candidates/decision | candidateId (bắt buộc) |
| GET /api/enterprise/internships | POST /api/json/enterprise/internships/list | companyId (bắt buộc), studentId, page, limit, ojtSemesterId, positionId, search, internshipId, status |
| PUT /api/enterprise/internships/{id}/evaluation | PUT /api/json/enterprise/internships/evaluation | internshipId (bắt buộc) |
| PATCH /api/recruitment/windows/{id} | PATCH /api/json/recruitment/windows | windowId (bắt buộc) |
| GET /api/recruitment/posts | POST /api/json/recruitment/posts/list | page, limit, companyId (bắt buộc), postId, windowId, academicPeriodId, status |
| POST /api/recruitment/posts/{id}/review | POST /api/json/recruitment/posts/review | postId (bắt buộc) |
| POST /api/recruitment/posts/{id}/close | POST /api/json/recruitment/posts/close | postId (bắt buộc) |
| GET /api/ojt-results | POST /api/json/ojt-results/list | resultId, studentId, ojtSemesterId, page, limit, status, search |
| GET /api/ojt-semesters/{id}/results/export | POST /api/json/ojt-semesters/results/export | ojtSemesterId (bắt buộc), resultId, studentId, ojtSemesterId, status, search, format |
| GET /api/academic-periods/{id}/ojt-advisory-schedule | POST /api/json/academic-periods/ojt-advisory-schedule/search | academicPeriodId (bắt buộc) |
| PUT /api/academic-periods/{id}/ojt-advisory-schedule | PUT /api/json/academic-periods/ojt-advisory-schedule | academicPeriodId (bắt buộc) |
| GET /api/academic/advisory-runs | POST /api/json/academic/advisory-runs/list | page, limit |
| GET /api/academic/advisory-runs/{id} | POST /api/json/academic/advisory-runs/detail | runId (bắt buộc), page, limit |
| GET /api/student/academic-summary | POST /api/json/student/academic-summary/search | ojtSemesterId (bắt buộc) |
| GET /api/student/supplementary-course-options | POST /api/json/student/supplementary-course-options/search | ojtSemesterId (bắt buộc) |
| GET /api/student/ojt-registration-windows | POST /api/json/student/ojt-registration-windows/list | ojtSemesterId, page, limit, studentId (bắt buộc) |
| GET /api/student/notifications | POST /api/json/student/notifications/list | unread, page, limit, studentId (bắt buộc) |
| PATCH /api/student/notifications/{id}/read | PATCH /api/json/student/notifications/read | id (bắt buộc) |
| GET /api/student/combo-registration-windows | POST /api/json/student/combo-registration-windows/list | page, limit, studentId (bắt buộc) |
| GET /api/student/assignments/current | POST /api/json/student/assignments/current/search | ojtSemesterId |
| GET /api/student/ojt-results | POST /api/json/student/ojt-results/list | ojtSemesterId, page, limit, studentId (bắt buộc) |
| GET /api/student/ojt-results/{id} | POST /api/json/student/ojt-results/detail | resultId (bắt buộc), ojtSemesterId |
| GET /api/student/dashboard | POST /api/json/student/dashboard/search | ojtSemesterId (bắt buộc) |
| GET /api/student/risk-prediction | POST /api/json/student/risk-prediction/search | ojtSemesterId (bắt buộc) |
| GET /api/student/roadmap-recommendations | POST /api/json/student/roadmap-recommendations/search | ojtSemesterId (bắt buộc) |
| GET /api/students/{id}/cv | POST /api/json/students/cv/search | studentId (bắt buộc), cvFileId |
| GET /api/job-applications | POST /api/json/job-applications/list | applicationId, studentId, registrationId, ojtSemesterId, companyId, positionId, page, limit, status |
| GET /api/students/me/opportunities | POST /api/json/students/me/opportunities/list | ojtSemesterId (bắt buộc), page, limit, studentId (bắt buộc) |
| GET /api/internship-tasks | POST /api/json/internship-tasks/list | companyId, studentId, positionId, ojtSemesterId, assignmentId, page, limit |

## POST /api/academic-periods

Tạo kỳ học và Block 3

Học kỳ thường tự liên kết OJT và trả ojtSemesterId; QHDN không tạo kỳ riêng.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| academicYearId | integer | Có | minimum=1; maximum=2147483647 | ID năm học. |
| periodCode | string | Có | maxLength=30 |  |
| name | string | Có | maxLength=100 |  |
| kind | string ∈ "SEMESTER", "BLOCK3" | Có |  |  |
| parentPeriodId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647; nullable=true | ID kỳ học cha của Block 3. |
| startDate | string | Có | format="date" |  |
| endDate | string | Có | format="date" |  |
| status | string ∈ "PLANNED", "ACTIVE", "CLOSED", "ARCHIVED" | Không / theo điều kiện nghiệp vụ |  |  |
| ojt | object | Không / theo điều kiện nghiệp vụ |  | Chỉ SEMESTER; thông tin vận hành OJT gắn với học kỳ, không tạo kỳ OJT riêng. |
| ojt.startDate | string | Không / theo điều kiện nghiệp vụ | format="date" |  |
| ojt.endDate | string | Không / theo điều kiện nghiệp vụ | format="date" |  |
| ojt.regStartDate | string | Không / theo điều kiện nghiệp vụ | format="date"; nullable=true |  |
| ojt.regEndDate | string | Không / theo điều kiện nghiệp vụ | format="date"; nullable=true |  |
| ojt.status | string ∈ "PLANNED", "ACTIVE", "CLOSED", "ARCHIVED" | Không / theo điều kiện nghiệp vụ |  |  |

Ví dụ:

```json
{
  "academicYearId": 1,
  "periodCode": "FALL2026",
  "name": "Ky chuyen nganh Fall 2026",
  "kind": "SEMESTER",
  "startDate": "2026-09-01",
  "endDate": "2026-12-10",
  "status": "PLANNED"
}
```

## POST /api/academic-years

Tạo năm học

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| yearCode | string | Có | maxLength=20 |  |
| startDate | string | Có | format="date" |  |
| endDate | string | Có | format="date" |  |
| status | string ∈ "PLANNED", "ACTIVE", "CLOSED", "ARCHIVED" | Không / theo điều kiện nghiệp vụ |  |  |

Ví dụ:

```json
{
  "yearCode": "2026-2027",
  "startDate": "2026-09-01",
  "endDate": "2027-08-31",
  "status": "PLANNED"
}
```

## POST /api/academic/academic-summary-notifications

gửi snapshot giữa kỳ cho cả scope, kể cả SV không có cảnh báo; có thể gửi thủ công trước.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Có | minimum=1; maximum=2147483647 | ID kỳ OJT. |
| academicPeriodId | integer | Có | minimum=1; maximum=2147483647 | ID kỳ OJT. |
| scope | object | Không / theo điều kiện nghiệp vụ |  | Phạm vi áp dụng; các bộ lọc kết hợp đồng thời. |
| scope.programIds | array<integer> | Không / theo điều kiện nghiệp vụ |  | Danh sách ID phiên bản chương trình. |
| scope.cohortIds | array<integer> | Không / theo điều kiện nghiệp vụ |  | Danh sách ID khóa. |
| scope.majorIds | array<integer> | Không / theo điều kiện nghiệp vụ |  | Danh sách ID chuyên ngành. |
| scope.groupCodes | array<string ∈ "A", "B", "C", "D"> | Không / theo điều kiện nghiệp vụ |  |  |
| scope.studentIds | array<integer> | Không / theo điều kiện nghiệp vụ |  | Danh sách ID sinh viên. |
| studentIds | array<integer> | Không / theo điều kiện nghiệp vụ | minItems=1; maxItems=1000; uniqueItems=true | Danh sách ID sinh viên. |
| idempotencyKey | string | Có | maxLength=100 | Khóa chống trùng yêu cầu; dùng lại cùng khóa và dữ liệu khi gửi lại. |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |

## POST /api/academic/alerts/notifications

Gửi cảnh báo học vụ

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Có | minimum=1 | ID kỳ OJT. |
| programId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID phiên bản chương trình đào tạo. |
| cohortId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID khóa. |
| majorId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID chuyên ngành (SpecializationID). |
| comboId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID combo (ProgramComboID). |
| groupCode | string | Không / theo điều kiện nghiệp vụ |  |  |
| academicPeriodId | integer | Có | minimum=1 | ID kỳ học hoặc Block 3. |
| assessmentDeadline | string | Có |  | Hạn xét điều kiện, gồm múi giờ. |
| studentIds | array<integer> | Có | minItems=1; maxItems=1000; uniqueItems=true | Danh sách ID sinh viên. |
| channel | string ∈ "IN_APP", "EMAIL", "BOTH" | Không / theo điều kiện nghiệp vụ | default="IN_APP" |  |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |
| idempotencyKey | string | Có | maxLength=100 | Khóa chống trùng yêu cầu; dùng lại cùng khóa và dữ liệu khi gửi lại. |

## POST /api/academic/eligibility-notifications

thông báo đủ/không đủ/chờ đối soát; tham chiếu snapshot/checkId và chống gửi lặp.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Có | minimum=1; maximum=2147483647 | ID kỳ OJT. |
| academicPeriodId | integer | Có | minimum=1; maximum=2147483647 | ID kỳ OJT. |
| scope | object | Không / theo điều kiện nghiệp vụ |  | Phạm vi áp dụng; các bộ lọc kết hợp đồng thời. |
| scope.programIds | array<integer> | Không / theo điều kiện nghiệp vụ |  | Danh sách ID phiên bản chương trình. |
| scope.cohortIds | array<integer> | Không / theo điều kiện nghiệp vụ |  | Danh sách ID khóa. |
| scope.majorIds | array<integer> | Không / theo điều kiện nghiệp vụ |  | Danh sách ID chuyên ngành. |
| scope.groupCodes | array<string ∈ "A", "B", "C", "D"> | Không / theo điều kiện nghiệp vụ |  |  |
| scope.studentIds | array<integer> | Không / theo điều kiện nghiệp vụ |  | Danh sách ID sinh viên. |
| studentIds | array<integer> | Không / theo điều kiện nghiệp vụ | minItems=1; maxItems=1000; uniqueItems=true | Danh sách ID sinh viên. |
| idempotencyKey | string | Có | maxLength=100 | Khóa chống trùng yêu cầu; dùng lại cùng khóa và dữ liệu khi gửi lại. |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |

## POST /api/accounts

Tạo tài khoản

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| username | string | Có |  |  |
| email | string | Có | format="email" |  |
| password | string | Có |  |  |
| fullName | string | Có |  |  |
| phone | string | Không / theo điều kiện nghiệp vụ | nullable=true |  |
| roleId | integer | Có |  | ID vai trò. |

## PATCH /api/accounts/me/profile

Cập nhật hồ sơ cá nhân

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| fullName | string | Không / theo điều kiện nghiệp vụ | minLength=1; maxLength=150 |  |
| phone | string | Không / theo điều kiện nghiệp vụ | maxLength=20; nullable=true |  |

## POST /api/admin/prediction-jobs

Tạo tác vụ dự đoán

Sử dụng mô hình dự đoán đã cấu hình.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| modelId | integer | Có | minimum=1; maximum=2147483647 | ID kỳ OJT. |
| ojtSemesterId | integer | Có | minimum=1; maximum=2147483647 | ID kỳ OJT. |
| studentIds | array<integer> | Không / theo điều kiện nghiệp vụ | minItems=1; maxItems=1000; uniqueItems=true | Danh sách ID sinh viên. |
| idempotencyKey | string | Có | maxLength=100 | Khóa chống trùng yêu cầu; dùng lại cùng khóa và dữ liệu khi gửi lại. |

## POST /api/assessment-templates

Tạo bộ tiêu chí đánh giá

Tổng trọng số tiêu chí phải bằng 100.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| code | string | Có | maxLength=50 |  |
| version | integer | Có | minimum=1; maximum=2147483647 | ID kỳ OJT. |
| name | string | Có | maxLength=150 |  |
| criteria | array<object> | Có | minItems=1; maxItems=100 |  |
| criteria[].code | string | Có | maxLength=50 |  |
| criteria[].name | string | Có | maxLength=150 |  |
| criteria[].weight | number | Có | minimum=0; maximum=100 |  |
| criteria[].maxScore | number | Có | minimum=0; maximum=100 |  |

## POST /api/assignments

Phân công sinh viên thực tập

Admin và Phòng QHDN dùng chung URL; chọn mẫu dữ liệu theo vai trò trong anyOf.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| registrationId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID vị trí thực tập. |
| positionId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID vị trí thực tập. |
| academicSupervisorId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647; nullable=true |  |
| enterpriseSupervisorName | string | Không / theo điều kiện nghiệp vụ | maxLength=100; nullable=true |  |
| startDate | string | Không / theo điều kiện nghiệp vụ | format="date" |  |
| endDate | string | Không / theo điều kiện nghiệp vụ | format="date" |  |
| coordinationId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 |  |
| reason | string | Không / theo điều kiện nghiệp vụ | maxLength=2000 | Lý do thực hiện. |
| registrationId | integer | Có | minimum=1; maximum=2147483647 | ID vị trí thực tập. |
| positionId | integer | Có | minimum=1; maximum=2147483647 | ID vị trí thực tập. |
| academicSupervisorId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647; nullable=true |  |
| enterpriseSupervisorName | string | Không / theo điều kiện nghiệp vụ | maxLength=100 |  |
| startDate | string | Có | format="date" |  |
| endDate | string | Có | format="date" |  |
| coordinationId | integer | Có | minimum=1 |  |
| enterpriseSupervisorName | string | Không / theo điều kiện nghiệp vụ | maxLength=100; nullable=true |  |
| startDate | string | Có | format="date" |  |
| endDate | string | Có | format="date" |  |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |

## POST /api/auth/change-password

Đổi mật khẩu

Token cũ bị thu hồi; cần đăng nhập lại.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| currentPassword | string | Có | format="password" |  |
| newPassword | string | Có | format="password"; minLength=12 | Maximum 72 UTF-8 bytes |

## POST /api/auth/login

Đăng nhập bằng email và mật khẩu

Xác thực: Không yêu cầu Bearer token trong OpenAPI.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| email | string | Có | format="email" |  |
| password | string | Có | format="password" |  |

## GET /api/auth/me

Xem tài khoản đang đăng nhập

Kèm ID hồ sơ sinh viên hoặc doanh nghiệp liên kết.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Không có request body.

## POST /api/cohorts

Tạo khóa và nhóm

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| cohortCode | string | Có | maxLength=20 |  |
| name | string | Có | maxLength=100 |  |
| enrollmentYear | integer | Có | minimum=1900; maximum=2200 |  |
| status | string ∈ "PLANNED", "ACTIVE", "CLOSED", "ARCHIVED" | Không / theo điều kiện nghiệp vụ |  |  |
| groups | array<object> | Có | minItems=4; maxItems=4 |  |
| groups[].groupCode | string ∈ "A", "B", "C", "D" | Có |  |  |
| groups[].entryAcademicPeriodId | integer | Có | minimum=1; maximum=2147483647 | ID kỳ bắt đầu chuyên ngành thực tế; mặc định theo khóa/nhóm. |

Ví dụ:

```json
{
  "cohortCode": "K22",
  "name": "Khoa 22",
  "enrollmentYear": 2026,
  "status": "ACTIVE",
  "groups": [
    {
      "groupCode": "A",
      "entryAcademicPeriodId": 1
    },
    {
      "groupCode": "B",
      "entryAcademicPeriodId": 2
    },
    {
      "groupCode": "C",
      "entryAcademicPeriodId": 3
    },
    {
      "groupCode": "D",
      "entryAcademicPeriodId": 4
    }
  ]
}
```

## POST /api/combo-registration-windows

Tạo đợt chọn hoặc xác nhận combo

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| name | string | Có | maxLength=150 |  |
| phase | string ∈ "INITIAL", "CONFIRMATION" | Có |  |  |
| academicPeriodId | integer | Có | minimum=1 | ID kỳ học hoặc Block 3. |
| ojtSemesterId | integer | Có | minimum=1 | ID kỳ OJT. |
| initialWindowId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; nullable=true | ID đợt chọn ban đầu cùng kỳ chuyên ngành và kỳ OJT. |
| scope | object | Có |  | Phạm vi áp dụng; các bộ lọc kết hợp đồng thời. |
| scope.cohortIds | array<integer> | Có | maxItems=1000; uniqueItems=true | Danh sách ID khóa. |
| scope.groupCodes | array<string ∈ "A", "B", "C", "D"> | Có | minItems=1; maxItems=4; uniqueItems=true |  |
| scope.majorIds | array<integer> | Có | maxItems=1000; uniqueItems=true | Danh sách ID chuyên ngành. |
| scope.studentIds | array<integer> | Không / theo điều kiện nghiệp vụ | maxItems=1000; uniqueItems=true | Danh sách ID sinh viên. |
| startsAt | string | Có | format="date-time" |  |
| endsAt | string | Có | format="date-time" |  |

## POST /api/courses

Tạo môn học

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| code | string | Có | maxLength=20 |  |
| name | string | Có | maxLength=200 |  |
| defaultCredits | number | Không / theo điều kiện nghiệp vụ | minimum=0; maximum=9999.99; nullable=true |  |
| isOjtPrerequisite | boolean | Không / theo điều kiện nghiệp vụ |  |  |

## POST /api/curriculum-imports/commit

Nhập khung chương trình

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| idempotencyKey | string | Có | maxLength=100 | Khóa chống trùng yêu cầu; dùng lại cùng khóa và dữ liệu khi gửi lại. |
| sourceName | string | Không / theo điều kiện nghiệp vụ | maxLength=150; nullable=true |  |
| curriculum | object | Có |  |  |
| curriculum.code | string | Có | maxLength=100 |  |
| curriculum.name | string | Có | maxLength=200 |  |
| curriculum.version | string | Có | maxLength=10 |  |
| curriculum.majorId | integer | Có | minimum=1 | ID chuyên ngành (SpecializationID). |
| curriculum.totalCredits | number | Có | minimum=0; maximum=9999.99 |  |
| curriculum.effectiveYear | integer | Có | minimum=1900; maximum=2200 |  |
| curriculum.gpaScale | integer ∈ 4, 10 | Có |  |  |
| courses | array<object> | Có | maxItems=500 |  |
| courses[].courseId | integer | Theo lựa chọn oneOf | minimum=1 | ID môn học (CourseID). |
| courses[].courseCode | string | Theo lựa chọn oneOf | maxLength=20 | Mã môn học. |
| courses[].credits | number | Có | minimum=0; maximum=9999.99 |  |
| courses[].semester | integer | Có | minimum=0; maximum=20 |  |
| courses[].isRequired | boolean | Có |  | Môn bắt buộc. |
| courses[].entryKind | string ∈ "COURSE", "COMBO_SLOT", "ELECTIVE_SLOT" | Không / theo điều kiện nghiệp vụ | default="COURSE" |  |
| courses[].prerequisiteText | string | Không / theo điều kiện nghiệp vụ | maxLength=10000; nullable=true |  |
| prerequisites | array<object> | Có | maxItems=1000 |  |
| prerequisites[].courseId | integer | Có | minimum=1 | ID môn học (CourseID). |
| prerequisites[].groupCode | string | Có | maxLength=50 |  |
| prerequisites[].minimumPassed | integer | Có | minimum=1 |  |
| prerequisites[].prerequisiteCourseIds | array<integer> | Có | maxItems=500 | Danh sách ID môn tiên quyết. |
| combos | array<object> | Có | maxItems=100 |  |
| combos[].code | string | Có | maxLength=50 |  |
| combos[].name | string | Có | maxLength=200 |  |
| combos[].selectionGroup | string | Không / theo điều kiện nghiệp vụ | maxLength=50; nullable=true |  |
| combos[].note | string | Không / theo điều kiện nghiệp vụ | maxLength=2000; nullable=true |  |
| combos[].courses | array<object> | Có | maxItems=500 |  |
| combos[].courses[].courseId | integer | Theo lựa chọn oneOf | minimum=1 | ID môn học (CourseID). |
| combos[].courses[].courseCode | string | Theo lựa chọn oneOf | maxLength=20 | Mã môn học. |
| combos[].courses[].credits | number | Có | minimum=0; maximum=9999.99 |  |
| combos[].courses[].semester | integer | Có | minimum=0; maximum=20 |  |
| combos[].courses[].prerequisiteText | string | Không / theo điều kiện nghiệp vụ | maxLength=10000; nullable=true |  |
| combos[].courses[].note | string | Không / theo điều kiện nghiệp vụ | maxLength=2000; nullable=true |  |
| combos[].courses[].slotCourseIds | array<integer> | Có | maxItems=100 | Danh sách ID môn trong khung chương trình. |
| combos[].choiceGroups | array<object> | Có | maxItems=500 |  |
| combos[].choiceGroups[].code | string | Có | maxLength=50 |  |
| combos[].choiceGroups[].minCourses | integer | Có | minimum=0 |  |
| combos[].choiceGroups[].maxCourses | integer | Có | minimum=0 |  |
| combos[].choiceGroups[].courseIds | array<integer> | Có | maxItems=500 | Danh sách ID môn học. |
| equivalences | array<object> | Có | maxItems=500 |  |
| equivalences[].sourceCourseId | integer | Có | minimum=1 | ID môn nguồn. |
| equivalences[].targetCourseId | integer | Có | minimum=1 | ID môn đích. |
| equivalences[].reason | string | Có | maxLength=2000 | Lý do thực hiện. |

## POST /api/curriculum-imports/preview

Kiểm tra dữ liệu nhập khung chương trình

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| idempotencyKey | string | Có | maxLength=100 | Khóa chống trùng yêu cầu; dùng lại cùng khóa và dữ liệu khi gửi lại. |
| sourceName | string | Không / theo điều kiện nghiệp vụ | maxLength=150; nullable=true |  |
| curriculum | object | Có |  |  |
| curriculum.code | string | Có | maxLength=100 |  |
| curriculum.name | string | Có | maxLength=200 |  |
| curriculum.version | string | Có | maxLength=10 |  |
| curriculum.majorId | integer | Có | minimum=1 | ID chuyên ngành (SpecializationID). |
| curriculum.totalCredits | number | Có | minimum=0; maximum=9999.99 |  |
| curriculum.effectiveYear | integer | Có | minimum=1900; maximum=2200 |  |
| curriculum.gpaScale | integer ∈ 4, 10 | Có |  |  |
| courses | array<object> | Có | maxItems=500 |  |
| courses[].courseId | integer | Theo lựa chọn oneOf | minimum=1 | ID môn học (CourseID). |
| courses[].courseCode | string | Theo lựa chọn oneOf | maxLength=20 | Mã môn học. |
| courses[].credits | number | Có | minimum=0; maximum=9999.99 |  |
| courses[].semester | integer | Có | minimum=0; maximum=20 |  |
| courses[].isRequired | boolean | Có |  | Môn bắt buộc. |
| courses[].entryKind | string ∈ "COURSE", "COMBO_SLOT", "ELECTIVE_SLOT" | Không / theo điều kiện nghiệp vụ | default="COURSE" |  |
| courses[].prerequisiteText | string | Không / theo điều kiện nghiệp vụ | maxLength=10000; nullable=true |  |
| prerequisites | array<object> | Có | maxItems=1000 |  |
| prerequisites[].courseId | integer | Có | minimum=1 | ID môn học (CourseID). |
| prerequisites[].groupCode | string | Có | maxLength=50 |  |
| prerequisites[].minimumPassed | integer | Có | minimum=1 |  |
| prerequisites[].prerequisiteCourseIds | array<integer> | Có | maxItems=500 | Danh sách ID môn tiên quyết. |
| combos | array<object> | Có | maxItems=100 |  |
| combos[].code | string | Có | maxLength=50 |  |
| combos[].name | string | Có | maxLength=200 |  |
| combos[].selectionGroup | string | Không / theo điều kiện nghiệp vụ | maxLength=50; nullable=true |  |
| combos[].note | string | Không / theo điều kiện nghiệp vụ | maxLength=2000; nullable=true |  |
| combos[].courses | array<object> | Có | maxItems=500 |  |
| combos[].courses[].courseId | integer | Theo lựa chọn oneOf | minimum=1 | ID môn học (CourseID). |
| combos[].courses[].courseCode | string | Theo lựa chọn oneOf | maxLength=20 | Mã môn học. |
| combos[].courses[].credits | number | Có | minimum=0; maximum=9999.99 |  |
| combos[].courses[].semester | integer | Có | minimum=0; maximum=20 |  |
| combos[].courses[].prerequisiteText | string | Không / theo điều kiện nghiệp vụ | maxLength=10000; nullable=true |  |
| combos[].courses[].note | string | Không / theo điều kiện nghiệp vụ | maxLength=2000; nullable=true |  |
| combos[].courses[].slotCourseIds | array<integer> | Có | maxItems=100 | Danh sách ID môn trong khung chương trình. |
| combos[].choiceGroups | array<object> | Có | maxItems=500 |  |
| combos[].choiceGroups[].code | string | Có | maxLength=50 |  |
| combos[].choiceGroups[].minCourses | integer | Có | minimum=0 |  |
| combos[].choiceGroups[].maxCourses | integer | Có | minimum=0 |  |
| combos[].choiceGroups[].courseIds | array<integer> | Có | maxItems=500 | Danh sách ID môn học. |
| equivalences | array<object> | Có | maxItems=500 |  |
| equivalences[].sourceCourseId | integer | Có | minimum=1 | ID môn nguồn. |
| equivalences[].targetCourseId | integer | Có | minimum=1 | ID môn đích. |
| equivalences[].reason | string | Có | maxLength=2000 | Lý do thực hiện. |

## POST /api/eligibility-check-runs

Kiểm tra điều kiện OJT hàng loạt

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Có | minimum=1 | ID kỳ OJT. |
| idempotencyKey | string | Có | maxLength=100 | Khóa chống trùng yêu cầu; dùng lại cùng khóa và dữ liệu khi gửi lại. |
| programIds | array<integer> | Không / theo điều kiện nghiệp vụ |  | Danh sách ID phiên bản chương trình. |
| cohortIds | array<integer> | Không / theo điều kiện nghiệp vụ |  | Danh sách ID khóa. |
| studentIds | array<integer> | Không / theo điều kiện nghiệp vụ |  | Danh sách ID sinh viên. |
| groupCodes | array<string ∈ "A", "B", "C", "D"> | Không / theo điều kiện nghiệp vụ |  |  |

## GET /api/enterprise/profile

Hồ sơ doanh nghiệp

Chỉ xem dữ liệu của doanh nghiệp đang đăng nhập. Kèm số liệu tuyển dụng và thực tập.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Không có request body.

## PATCH /api/enterprise/profile

Cập nhật hồ sơ doanh nghiệp đã được import

Chỉ sửa hồ sơ doanh nghiệp đã có từ import. companyId bắt buộc cùng ít nhất một trường cần sửa. Trường bỏ qua giữ nguyên; null hoặc chuỗi rỗng xóa trường tùy chọn. name không được rỗng. Không sửa mã, trạng thái, tài khoản đăng nhập và không tạo/sửa tin hay vị trí tuyển dụng. positionTitle thuộc tài khoản hiện tại; fullName/phone cá nhân sửa qua /api/accounts/me/profile.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| companyId | integer | Có | minimum=1; maximum=2147483647 | ID doanh nghiệp. |
| name | string | Không / theo điều kiện nghiệp vụ | minLength=1; maxLength=200 |  |
| address | string | Không / theo điều kiện nghiệp vụ | maxLength=300; nullable=true |  |
| industry | string | Không / theo điều kiện nghiệp vụ | maxLength=100; nullable=true |  |
| contactPersonName | string | Không / theo điều kiện nghiệp vụ | maxLength=100; nullable=true |  |
| contactPhone | string | Không / theo điều kiện nghiệp vụ | maxLength=20; nullable=true |  |
| contactEmail | string | Không / theo điều kiện nghiệp vụ | format="email"; maxLength=100; nullable=true |  |
| positionTitle | string | Không / theo điều kiện nghiệp vụ | maxLength=100; nullable=true | Chức danh của tài khoản đang đăng nhập tại doanh nghiệp. |

## POST /api/enterprise/tasks/bulk

Giao nhiều task cho nhiều thực tập sinh

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| idempotencyKey | string | Có | maxLength=100 |  |
| assignmentIds | array<integer> | Có | minItems=1; maxItems=500; uniqueItems=true |  |
| tasks | array<object> | Có | minItems=1; maxItems=50 |  |
| tasks[].name | string | Có | maxLength=200 |  |
| tasks[].description | string | Không / theo điều kiện nghiệp vụ |  |  |
| tasks[].dueDate | string | Có | format="date" |  |

## GET /api/health

Kiểm tra backend và cơ sở dữ liệu

Xác thực: Không yêu cầu Bearer token trong OpenAPI.

Không có tham số URL/query.

Không có request body.

## POST /api/imports/archive

Lưu trữ tuyển dụng sau hai học kỳ

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Không có request body.

## POST /api/imports/commit

Import doanh nghiệp (QHDN) hoặc sinh viên (Phòng đào tạo/Admin)

ENTERPRISE: chỉ OJT_COORD được import, bắt buộc positions và windowId. Trùng email giữ nguyên mã doanh nghiệp, tài khoản và tin cũ; chỉ thêm tuyển dụng với mã vị trí mới. Code/email trỏ tới hai doanh nghiệp khác nhau bị từ chối. STUDENT: ADMIN/ACADEMIC import tài khoản, academic, placement và courseResults trong một giao dịch. CV dùng API upload hiện tại.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| kind | string ∈ "STUDENT", "ENTERPRISE" | Có |  |  |
| idempotencyKey | string | Có | maxLength=100 | Khóa chống trùng yêu cầu; dùng lại cùng khóa và dữ liệu khi gửi lại. |
| windowId | integer | Không / theo điều kiện nghiệp vụ |  | ID đợt đăng ký. |
| rows | array<object> | Có | minItems=1; maxItems=500 |  |
| rows[].code | string | Có | maxLength=20 | Stable enterprise/student business code, distinct from database ID. |
| rows[].email | string | Có | format="email"; maxLength=100 |  |
| rows[].fullName | string | Có | maxLength=150 |  |
| rows[].name | string | Không / theo điều kiện nghiệp vụ |  | Required enterprise name |
| rows[].address | string | Không / theo điều kiện nghiệp vụ |  |  |
| rows[].positions | array<object> | Không / theo điều kiện nghiệp vụ | minItems=1; maxItems=50 | Required for enterprise imports |
| rows[].positions[].code | string | Có | maxLength=60 |  |
| rows[].positions[].title | string | Có | maxLength=150 |  |
| rows[].positions[].description | string | Có |  |  |
| rows[].positions[].requirements | string | Có |  |  |
| rows[].positions[].capacity | integer | Có | minimum=1 |  |
| rows[].academic | object | Không / theo điều kiện nghiệp vụ |  |  |
| rows[].academic.programId | integer | Có | minimum=1 |  |
| rows[].academic.phone | string | Không / theo điều kiện nghiệp vụ | nullable=true |  |
| rows[].academic.className | string | Không / theo điều kiện nghiệp vụ | nullable=true |  |
| rows[].academic.status | string ∈ "ACTIVE", "INACTIVE", "SUSPENDED", "GRADUATED", "DROPPED_OUT" | Không / theo điều kiện nghiệp vụ |  |  |
| rows[].academic.placement | object | Có |  |  |
| rows[].academic.placement.cohortId | integer | Có | minimum=1 |  |
| rows[].academic.placement.groupCode | string ∈ "A", "B", "C", "D" | Có |  |  |
| rows[].academic.placement.entryAcademicPeriodId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 |  |
| rows[].academic.placement.currentAcademicPeriodId | integer | Có | minimum=1 |  |
| rows[].academic.courseResults | array<object> | Có | maxItems=1000 |  |
| rows[].academic.courseResults[].courseCode | string | Có |  |  |
| rows[].academic.courseResults[].academicPeriodId | integer | Có | minimum=1 |  |
| rows[].academic.courseResults[].attemptNumber | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100 |  |
| rows[].academic.courseResults[].status | string ∈ "PASSED", "FAILED", "IN_PROGRESS", "WITHDRAWN", "RECOGNIZED" | Có |  |  |
| rows[].academic.courseResults[].score | number | Không / theo điều kiện nghiệp vụ | minimum=0; maximum=10; nullable=true |  |
| rows[].academic.courseResults[].gradePoints | number | Không / theo điều kiện nghiệp vụ | minimum=0; maximum=4; nullable=true |  |
| rows[].academic.courseResults[].grade | string | Không / theo điều kiện nghiệp vụ | nullable=true |  |
| rows[].academic.courseResults[].sourceReference | string | Không / theo điều kiện nghiệp vụ | nullable=true |  |

enterprise:

```json
{
  "kind": "ENTERPRISE",
  "idempotencyKey": "enterprise-import-001",
  "windowId": 1,
  "rows": [
    {
      "code": "DN001",
      "email": "hr@example.com",
      "fullName": "Nguyễn Thị Mai",
      "name": "Công ty ABC",
      "address": "123 Nguyễn Văn Linh, TP. Hồ Chí Minh",
      "positions": [
        {
          "code": "DEV001",
          "title": "Thực tập lập trình",
          "description": "Tham gia phát triển phần mềm",
          "requirements": "Kiến thức TypeScript và SQL",
          "capacity": 5
        }
      ]
    }
  ]
}
```

student:

```json
{
  "kind": "STUDENT",
  "idempotencyKey": "student-full-001",
  "rows": [
    {
      "code": "SV001",
      "email": "student@example.com",
      "fullName": "Nguyễn Văn A",
      "academic": {
        "programId": 1,
        "className": "SE01",
        "placement": {
          "cohortId": 1,
          "groupCode": "A",
          "currentAcademicPeriodId": 1
        },
        "courseResults": [
          {
            "courseCode": "PRF192",
            "academicPeriodId": 1,
            "status": "PASSED",
            "score": 8,
            "gradePoints": 3.5,
            "grade": "B"
          }
        ]
      }
    }
  ]
}
```

Body: multipart/form-data — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| kind | string ∈ "STUDENT", "ENTERPRISE" | Có |  |  |
| idempotencyKey | string | Có | maxLength=100 |  |
| windowId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Required for ENTERPRISE |
| mapping | string | Không / theo điều kiện nghiệp vụ |  | JSON map canonical field to header |
| file | string | Có | format="binary" | XLSX or CSV; 8 MiB maximum. One row per course attempt or recruitment position. |

## GET /api/imports/emails

Trạng thái gửi email tài khoản

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Không có request body.

## POST /api/imports/preview

Kiểm tra import doanh nghiệp hoặc sinh viên

ENTERPRISE: chỉ OJT_COORD được import, bắt buộc positions và windowId. Trùng email giữ nguyên mã doanh nghiệp, tài khoản và tin cũ; chỉ thêm tuyển dụng với mã vị trí mới. Code/email trỏ tới hai doanh nghiệp khác nhau bị từ chối. STUDENT: ADMIN/ACADEMIC import tài khoản, academic, placement và courseResults trong một giao dịch. CV dùng API upload hiện tại.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| kind | string ∈ "STUDENT", "ENTERPRISE" | Có |  |  |
| idempotencyKey | string | Có | maxLength=100 | Khóa chống trùng yêu cầu; dùng lại cùng khóa và dữ liệu khi gửi lại. |
| windowId | integer | Không / theo điều kiện nghiệp vụ |  | ID đợt đăng ký. |
| rows | array<object> | Có | minItems=1; maxItems=500 |  |
| rows[].code | string | Có | maxLength=20 | Stable enterprise/student business code, distinct from database ID. |
| rows[].email | string | Có | format="email"; maxLength=100 |  |
| rows[].fullName | string | Có | maxLength=150 |  |
| rows[].name | string | Không / theo điều kiện nghiệp vụ |  | Required enterprise name |
| rows[].address | string | Không / theo điều kiện nghiệp vụ |  |  |
| rows[].positions | array<object> | Không / theo điều kiện nghiệp vụ | minItems=1; maxItems=50 | Required for enterprise imports |
| rows[].positions[].code | string | Có | maxLength=60 |  |
| rows[].positions[].title | string | Có | maxLength=150 |  |
| rows[].positions[].description | string | Có |  |  |
| rows[].positions[].requirements | string | Có |  |  |
| rows[].positions[].capacity | integer | Có | minimum=1 |  |
| rows[].academic | object | Không / theo điều kiện nghiệp vụ |  |  |
| rows[].academic.programId | integer | Có | minimum=1 |  |
| rows[].academic.phone | string | Không / theo điều kiện nghiệp vụ | nullable=true |  |
| rows[].academic.className | string | Không / theo điều kiện nghiệp vụ | nullable=true |  |
| rows[].academic.status | string ∈ "ACTIVE", "INACTIVE", "SUSPENDED", "GRADUATED", "DROPPED_OUT" | Không / theo điều kiện nghiệp vụ |  |  |
| rows[].academic.placement | object | Có |  |  |
| rows[].academic.placement.cohortId | integer | Có | minimum=1 |  |
| rows[].academic.placement.groupCode | string ∈ "A", "B", "C", "D" | Có |  |  |
| rows[].academic.placement.entryAcademicPeriodId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 |  |
| rows[].academic.placement.currentAcademicPeriodId | integer | Có | minimum=1 |  |
| rows[].academic.courseResults | array<object> | Có | maxItems=1000 |  |
| rows[].academic.courseResults[].courseCode | string | Có |  |  |
| rows[].academic.courseResults[].academicPeriodId | integer | Có | minimum=1 |  |
| rows[].academic.courseResults[].attemptNumber | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100 |  |
| rows[].academic.courseResults[].status | string ∈ "PASSED", "FAILED", "IN_PROGRESS", "WITHDRAWN", "RECOGNIZED" | Có |  |  |
| rows[].academic.courseResults[].score | number | Không / theo điều kiện nghiệp vụ | minimum=0; maximum=10; nullable=true |  |
| rows[].academic.courseResults[].gradePoints | number | Không / theo điều kiện nghiệp vụ | minimum=0; maximum=4; nullable=true |  |
| rows[].academic.courseResults[].grade | string | Không / theo điều kiện nghiệp vụ | nullable=true |  |
| rows[].academic.courseResults[].sourceReference | string | Không / theo điều kiện nghiệp vụ | nullable=true |  |

enterprise:

```json
{
  "kind": "ENTERPRISE",
  "idempotencyKey": "enterprise-import-001",
  "windowId": 1,
  "rows": [
    {
      "code": "DN001",
      "email": "hr@example.com",
      "fullName": "Nguyễn Thị Mai",
      "name": "Công ty ABC",
      "address": "123 Nguyễn Văn Linh, TP. Hồ Chí Minh",
      "positions": [
        {
          "code": "DEV001",
          "title": "Thực tập lập trình",
          "description": "Tham gia phát triển phần mềm",
          "requirements": "Kiến thức TypeScript và SQL",
          "capacity": 5
        }
      ]
    }
  ]
}
```

student:

```json
{
  "kind": "STUDENT",
  "idempotencyKey": "student-full-001",
  "rows": [
    {
      "code": "SV001",
      "email": "student@example.com",
      "fullName": "Nguyễn Văn A",
      "academic": {
        "programId": 1,
        "className": "SE01",
        "placement": {
          "cohortId": 1,
          "groupCode": "A",
          "currentAcademicPeriodId": 1
        },
        "courseResults": [
          {
            "courseCode": "PRF192",
            "academicPeriodId": 1,
            "status": "PASSED",
            "score": 8,
            "gradePoints": 3.5,
            "grade": "B"
          }
        ]
      }
    }
  ]
}
```

Body: multipart/form-data — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| kind | string ∈ "STUDENT", "ENTERPRISE" | Có |  |  |
| idempotencyKey | string | Có | maxLength=100 |  |
| windowId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Required for ENTERPRISE |
| mapping | string | Không / theo điều kiện nghiệp vụ |  | JSON map canonical field to header |
| file | string | Có | format="binary" | XLSX or CSV; 8 MiB maximum. One row per course attempt or recruitment position. |

## POST /api/job-applications

Ứng tuyển vị trí doanh nghiệp

Cần hồ sơ OJT của mình, xác nhận ELIGIBLE còn hiệu lực, đợt đăng ký sinh viên đang mở, tin đã công bố còn hạn và vị trí còn chỉ tiêu. Lưu doanh nghiệp/vị trí, kết quả chính thức và phiên bản CV hiện tại. Không tự bàn giao hoặc điều phối.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| registrationId | integer | Có | minimum=1 |  |
| postId | integer | Có | minimum=1 |  |
| positionId | integer | Có | minimum=1 |  |
| coverLetter | string | Không / theo điều kiện nghiệp vụ | maxLength=5000 |  |

## POST /api/json/academic-imports/list

Lịch sử nhập dữ liệu học vụ

Không có importId: danh sách thông thường. Có importId: trả thêm chi tiết trong data.items; phần lịch sử/dòng dữ liệu có phân trang riêng. Không khớp bộ lọc trả items rỗng.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| kind | string ∈ "STUDENT", "COURSE_RESULT", "CURRICULUM" | Không / theo điều kiện nghiệp vụ |  | Bộ lọc kind. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| status | string ∈ "COMPLETED", "REJECTED", "FAILED" | Không / theo điều kiện nghiệp vụ |  | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| importId | string | Không / theo điều kiện nghiệp vụ | pattern="^[1-9][0-9]{0,18}$" | Chọn một hồ sơ để trả thêm phần chi tiết. |
| rowsPage | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Phân trang rows; chỉ dùng cùng importId. |
| rowsLimit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Phân trang rows; chỉ dùng cùng importId. |

list:

```json
{
  "page": 1,
  "limit": 20
}
```

record:

```json
{
  "importId": "1",
  "page": 1,
  "limit": 20
}
```

## PATCH /api/json/academic-periods

Cập nhật kỳ học và Block 3

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| academicYearId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID năm học. |
| periodCode | string | Không / theo điều kiện nghiệp vụ | maxLength=30 |  |
| name | string | Không / theo điều kiện nghiệp vụ | maxLength=100 |  |
| kind | string ∈ "SEMESTER", "BLOCK3" | Không / theo điều kiện nghiệp vụ |  |  |
| parentPeriodId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647; nullable=true | ID kỳ học cha của Block 3. |
| startDate | string | Không / theo điều kiện nghiệp vụ | format="date" |  |
| endDate | string | Không / theo điều kiện nghiệp vụ | format="date" |  |
| status | string ∈ "PLANNED", "ACTIVE", "CLOSED", "ARCHIVED" | Không / theo điều kiện nghiệp vụ |  |  |
| ojt | object | Không / theo điều kiện nghiệp vụ |  | Chỉ SEMESTER; thông tin vận hành OJT gắn với học kỳ, không tạo kỳ OJT riêng. |
| ojt.startDate | string | Không / theo điều kiện nghiệp vụ | format="date" |  |
| ojt.endDate | string | Không / theo điều kiện nghiệp vụ | format="date" |  |
| ojt.regStartDate | string | Không / theo điều kiện nghiệp vụ | format="date"; nullable=true |  |
| ojt.regEndDate | string | Không / theo điều kiện nghiệp vụ | format="date"; nullable=true |  |
| ojt.status | string ∈ "PLANNED", "ACTIVE", "CLOSED", "ARCHIVED" | Không / theo điều kiện nghiệp vụ |  |  |
| academicPeriodId | integer | Có | minimum=1; maximum=2147483647 | ID: AcademicPeriodID. |

## PUT /api/json/academic-periods/combo-phase-schedules

Thiết lập mốc chọn và xác nhận combo

Chọn ban đầu trong kỳ học; xác nhận trong Block 3. Các mốc phải nằm trong kỳ tương ứng.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| phase | string ∈ "INITIAL", "CONFIRMATION" | Có |  |  |
| startsAt | string | Có | format="date-time" |  |
| endsAt | string | Có | format="date-time" |  |
| reason | string | Có | minLength=1; maxLength=2000 | Lý do thực hiện. |
| academicPeriodId | integer | Có | minimum=1 | ID: AcademicPeriodID. |

## POST /api/json/academic-periods/combo-phase-schedules/list

Xem mốc chọn và xác nhận combo

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| academicPeriodId | integer | Có | minimum=1 | ID: AcademicPeriodID. |

list:

```json
{
  "page": 1,
  "limit": 20,
  "academicPeriodId": 1
}
```

## POST /api/json/academic-periods/list

Danh sách kỳ học và Block 3

Lọc kind=SEMESTER để chọn học kỳ tuyển dụng; kết quả kèm thông tin OJT.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| search | string | Không / theo điều kiện nghiệp vụ | maxLength=100 | Bộ lọc search. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| status | string ∈ "PLANNED", "ACTIVE", "CLOSED", "ARCHIVED" | Không / theo điều kiện nghiệp vụ |  | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| academicYearId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID năm học. |
| kind | string ∈ "SEMESTER", "BLOCK3" | Không / theo điều kiện nghiệp vụ |  | Bộ lọc kind. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| academicPeriodId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID kỳ học hoặc Block 3. |

list:

```json
{
  "page": 1,
  "limit": 20
}
```

record:

```json
{
  "academicPeriodId": 1,
  "page": 1,
  "limit": 20
}
```

## PUT /api/json/academic-periods/ojt-advisory-schedule

cấu hình lịch theo kỳ thực, worker thực thi.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Có | minimum=1; maximum=2147483647 | ID kỳ OJT. |
| sendAt | string | Có | format="date-time" | Hạn xét điều kiện, gồm múi giờ. |
| assessmentDeadline | string | Có | format="date-time" | Hạn xét điều kiện, gồm múi giờ. |
| scope | object | Có |  | Phạm vi áp dụng; các bộ lọc kết hợp đồng thời. |
| scope.programIds | array<integer> | Không / theo điều kiện nghiệp vụ |  | Danh sách ID phiên bản chương trình. |
| scope.cohortIds | array<integer> | Không / theo điều kiện nghiệp vụ |  | Danh sách ID khóa. |
| scope.majorIds | array<integer> | Không / theo điều kiện nghiệp vụ |  | Danh sách ID chuyên ngành. |
| scope.groupCodes | array<string ∈ "A", "B", "C", "D"> | Không / theo điều kiện nghiệp vụ |  |  |
| scope.studentIds | array<integer> | Không / theo điều kiện nghiệp vụ |  | Danh sách ID sinh viên. |
| enabled | boolean | Không / theo điều kiện nghiệp vụ |  |  |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |
| academicPeriodId | integer | Có | minimum=1; maximum=2147483647 | ID: AcademicPeriodID. |

## POST /api/json/academic-periods/ojt-advisory-schedule/search

xem lịch thông báo giữa kỳ và deadline.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| academicPeriodId | integer | Có | minimum=1; maximum=2147483647 | ID: AcademicPeriodID. |

## PATCH /api/json/academic-years

Cập nhật năm học

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| yearCode | string | Không / theo điều kiện nghiệp vụ | maxLength=20 |  |
| startDate | string | Không / theo điều kiện nghiệp vụ | format="date" |  |
| endDate | string | Không / theo điều kiện nghiệp vụ | format="date" |  |
| status | string ∈ "PLANNED", "ACTIVE", "CLOSED", "ARCHIVED" | Không / theo điều kiện nghiệp vụ |  |  |
| academicYearId | integer | Có | minimum=1; maximum=2147483647 | ID: AcademicYearID. |

## POST /api/json/academic-years/list

Danh sách năm học

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| search | string | Không / theo điều kiện nghiệp vụ | maxLength=100 | Bộ lọc search. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| status | string ∈ "PLANNED", "ACTIVE", "CLOSED", "ARCHIVED" | Không / theo điều kiện nghiệp vụ |  | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |

list:

```json
{
  "page": 1,
  "limit": 20
}
```

## POST /api/json/academic/advisory-runs/detail

trạng thái/lỗi từng sinh viên.

Mỗi bản ghi giữ ID và bổ sung thông tin liên quan để hiển thị; quan hệ không tồn tại trả null.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| runId | integer | Có | minimum=1; maximum=2147483647 | ID: bản ghi. |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100 | Số bản ghi mỗi trang. |

## POST /api/json/academic/advisory-runs/list

lịch sử batch thông báo khi có worker.

Mỗi bản ghi giữ ID và bổ sung thông tin liên quan để hiển thị; quan hệ không tồn tại trả null.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100 | Số bản ghi mỗi trang. |

list:

```json
{
  "page": 1,
  "limit": 20
}
```

## POST /api/json/academic/alerts/list

Danh sách cảnh báo thiếu điều kiện OJT

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Có | minimum=1 | ID kỳ OJT. |
| programId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID phiên bản chương trình đào tạo. |
| cohortId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID khóa. |
| majorId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID chuyên ngành (SpecializationID). |
| comboId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID combo (ProgramComboID). |
| groupCode | string | Không / theo điều kiện nghiệp vụ |  | Bộ lọc groupCode. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| academicPeriodId | integer | Có | minimum=1 | ID kỳ học hoặc Block 3. |
| assessmentDeadline | string | Có | format="date-time" | Hạn xét điều kiện, gồm múi giờ. |
| type | string ∈ "CREDIT_SHORTFALL", "MISSING_REQUIRED_COURSES", "EXCESS_FAILED_COURSES" | Không / theo điều kiện nghiệp vụ |  | Bộ lọc type. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Số bản ghi mỗi trang. |

list:

```json
{
  "page": 1,
  "limit": 20,
  "ojtSemesterId": 1,
  "academicPeriodId": 1,
  "assessmentDeadline": "2026-12-01T00:00:00+07:00"
}
```

## POST /api/json/academic/course-demand/export

Xuất nhu cầu học theo môn, kỳ và Block

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Có | minimum=1 | ID kỳ OJT. |
| programId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID phiên bản chương trình đào tạo. |
| cohortId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID khóa. |
| majorId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID chuyên ngành (SpecializationID). |
| comboId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID combo (ProgramComboID). |
| groupCode | string | Không / theo điều kiện nghiệp vụ |  |  |
| academicPeriodId | integer | Có | minimum=1 | ID kỳ học hoặc Block 3. |
| assessmentDeadline | string | Không / theo điều kiện nghiệp vụ | format="date-time" | Hạn xét điều kiện, gồm múi giờ. |
| courseId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID môn học (CourseID). |
| includeInProgress | string | Không / theo điều kiện nghiệp vụ |  |  |
| format | string | Không / theo điều kiện nghiệp vụ |  |  |

## POST /api/json/academic/course-demand/list

Thống kê nhu cầu học môn còn thiếu

Mỗi bản ghi giữ ID và bổ sung thông tin liên quan để hiển thị; quan hệ không tồn tại trả null.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Có | minimum=1 | ID kỳ OJT. |
| programId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID phiên bản chương trình đào tạo. |
| cohortId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID khóa. |
| majorId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID chuyên ngành (SpecializationID). |
| comboId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID combo (ProgramComboID). |
| groupCode | string | Không / theo điều kiện nghiệp vụ |  | Bộ lọc groupCode. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| academicPeriodId | integer | Có | minimum=1 | ID kỳ học hoặc Block 3. |
| assessmentDeadline | string | Không / theo điều kiện nghiệp vụ | format="date-time" | Hạn xét điều kiện, gồm múi giờ. |
| courseId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID môn học (CourseID). |
| includeInProgress | string | Không / theo điều kiện nghiệp vụ |  | Bộ lọc includeInProgress. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Số bản ghi mỗi trang. |

list:

```json
{
  "page": 1,
  "limit": 20,
  "ojtSemesterId": 1,
  "academicPeriodId": 1
}
```

## POST /api/json/academic/dashboard/search

Tổng quan và thống kê điều kiện OJT

Chọn section summary/statistics/all; thống kê hỗ trợ groupBy.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Có | minimum=1 | ID kỳ OJT. |
| programId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID phiên bản chương trình đào tạo. |
| cohortId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID khóa. |
| majorId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID chuyên ngành (SpecializationID). |
| comboId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID combo (ProgramComboID). |
| groupCode | string | Không / theo điều kiện nghiệp vụ |  |  |
| academicPeriodId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID kỳ học hoặc Block 3. |
| assessmentDeadline | string | Không / theo điều kiện nghiệp vụ | format="date-time" | Hạn xét điều kiện, gồm múi giờ. |
| section | string ∈ "all", "summary", "statistics" | Không / theo điều kiện nghiệp vụ | default="all" |  |
| groupBy | string ∈ "cohort", "group", "major", "combo" | Không / theo điều kiện nghiệp vụ | default="cohort" |  |

## PATCH /api/json/accounts

Cập nhật tài khoản

Admin sửa thông tin, trạng thái và vai trò trong một lần; chỉ gửi trường cần thay đổi.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| fullName | string | Không / theo điều kiện nghiệp vụ |  |  |
| phone | string | Không / theo điều kiện nghiệp vụ | nullable=true |  |
| email | string | Không / theo điều kiện nghiệp vụ | format="email" | ADMIN only |
| status | string ∈ "ACTIVE", "LOCKED", "INACTIVE" | Không / theo điều kiện nghiệp vụ |  |  |
| roleId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID vai trò. |
| userId | integer | Có |  | ID tài khoản. |

## POST /api/json/accounts/list

Danh sách tài khoản

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| userId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID tài khoản. |
| page | integer | Không / theo điều kiện nghiệp vụ | default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | default=20 | Số bản ghi mỗi trang. |
| search | string | Không / theo điều kiện nghiệp vụ |  | Bộ lọc search. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| roleCode | string ∈ "ADMIN", "ACADEMIC", "OJT_COORD", "STUDENT", "ENTERPRISE" | Không / theo điều kiện nghiệp vụ |  | Bộ lọc roleCode. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| status | string ∈ "ACTIVE", "LOCKED", "INACTIVE" | Không / theo điều kiện nghiệp vụ |  | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |

list:

```json
{
  "page": 1,
  "limit": 20
}
```

record:

```json
{
  "userId": 1,
  "page": 1,
  "limit": 20
}
```

## POST /api/json/admin/audit-logs/list

Nhật ký hoạt động hệ thống

Ẩn các trường dữ liệu nhạy cảm.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| userId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID tài khoản. |
| entityType | string | Không / theo điều kiện nghiệp vụ | maxLength=100 | Bộ lọc entityType. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| entityId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID kỳ OJT. |
| action | string | Không / theo điều kiện nghiệp vụ | maxLength=100 | Bộ lọc action. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |

list:

```json
{
  "page": 1,
  "limit": 20
}
```

## POST /api/json/admin/dashboard/search

Tổng quan hệ thống và thống kê dự đoán

section: summary/readiness/risks/trends/all. Summary luôn là tổng toàn hệ thống.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID kỳ OJT. |
| studentId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID hồ sơ sinh viên, khác ID tài khoản. |
| modelId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID phiên bản mô hình. |
| riskLevel | string ∈ "LOW", "MEDIUM", "HIGH" | Không / theo điều kiện nghiệp vụ |  |  |
| readinessLevel | string ∈ "LOW", "MEDIUM", "HIGH" | Không / theo điều kiện nghiệp vụ |  |  |
| from | string | Không / theo điều kiện nghiệp vụ | format="date-time" |  |
| to | string | Không / theo điều kiện nghiệp vụ | format="date-time" |  |
| section | string ∈ "all", "summary", "readiness", "risks", "trends" | Không / theo điều kiện nghiệp vụ |  |  |

## POST /api/json/admin/models/list

Danh sách và hồ sơ phiên bản mô hình

Lọc modelId; kết quả kèm thông số và cấu trúc đầu vào.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| modelId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID phiên bản mô hình. |
| search | string | Không / theo điều kiện nghiệp vụ | maxLength=100 | Bộ lọc search. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| status | string ∈ "ACTIVE", "INACTIVE" | Không / theo điều kiện nghiệp vụ |  | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |

list:

```json
{
  "page": 1,
  "limit": 20
}
```

record:

```json
{
  "modelId": 1,
  "page": 1,
  "limit": 20
}
```

## POST /api/json/admin/prediction-jobs/detail

Tiến độ dự đoán và lỗi theo sinh viên

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| jobId | integer | Có | minimum=1; maximum=2147483647 | ID: bản ghi. |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |

## POST /api/json/admin/reports/export

Xuất báo cáo dự đoán

Tối đa 10.000 bản ghi dự đoán mới nhất.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID kỳ OJT. |
| studentId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID hồ sơ sinh viên, khác ID tài khoản. |
| modelId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID phiên bản mô hình. |
| riskLevel | string ∈ "LOW", "MEDIUM", "HIGH" | Không / theo điều kiện nghiệp vụ |  |  |
| readinessLevel | string ∈ "LOW", "MEDIUM", "HIGH" | Không / theo điều kiện nghiệp vụ |  |  |
| from | string | Không / theo điều kiện nghiệp vụ | format="date-time" |  |
| to | string | Không / theo điều kiện nghiệp vụ | format="date-time" |  |
| type | string ∈ "readiness", "risks" | Có |  |  |
| format | string ∈ "csv", "json" | Không / theo điều kiện nghiệp vụ |  |  |

## POST /api/json/admin/reports/readiness/list

Báo cáo mức sẵn sàng và rủi ro

Lấy dự đoán mới nhất của từng sinh viên trong mỗi kỳ.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID kỳ OJT. |
| studentId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID hồ sơ sinh viên, khác ID tài khoản. |
| modelId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID phiên bản mô hình. |
| riskLevel | string ∈ "LOW", "MEDIUM", "HIGH" | Không / theo điều kiện nghiệp vụ |  | Bộ lọc riskLevel. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| readinessLevel | string ∈ "LOW", "MEDIUM", "HIGH" | Không / theo điều kiện nghiệp vụ |  | Bộ lọc readinessLevel. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| from | string | Không / theo điều kiện nghiệp vụ | format="date-time" | Bộ lọc from. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| to | string | Không / theo điều kiện nghiệp vụ | format="date-time" | Bộ lọc to. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |

list:

```json
{
  "page": 1,
  "limit": 20
}
```

## POST /api/json/alerts/interventions

Tạo hoạt động hỗ trợ sinh viên

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| description | string | Có | maxLength=10000 |  |
| assignedTo | integer | Có | minimum=1; maximum=2147483647 | ID kỳ OJT. |
| dueDate | string | Không / theo điều kiện nghiệp vụ | format="date"; nullable=true |  |
| alertId | integer | Có | minimum=1; maximum=2147483647 | ID: bản ghi. |

## POST /api/json/alerts/list

Danh sách và hồ sơ cảnh báo rủi ro

Lọc alertId để lấy cảnh báo kèm hoạt động hỗ trợ phân trang.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| alertId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID cảnh báo rủi ro. |
| studentId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID hồ sơ sinh viên, khác ID tài khoản. |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID kỳ OJT. |
| status | string ∈ "OPEN", "ACKNOWLEDGED", "RESOLVED", "DISMISSED" | Không / theo điều kiện nghiệp vụ |  | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| interventionPage | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | Trang hoạt động hỗ trợ khi lọc alertId. |
| interventionLimit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100 | Số hoạt động hỗ trợ mỗi trang, tối đa 100. |

list:

```json
{
  "page": 1,
  "limit": 20
}
```

record:

```json
{
  "alertId": 1,
  "page": 1,
  "limit": 20
}
```

## PATCH /api/json/alerts/status

Tiếp nhận hoặc đóng cảnh báo

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| status | string ∈ "ACKNOWLEDGED", "RESOLVED", "DISMISSED" | Có |  |  |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |
| alertId | integer | Có | minimum=1; maximum=2147483647 | ID: bản ghi. |

## PATCH /api/json/assessment-templates

Sửa bộ tiêu chí đánh giá

Chỉ sửa phiên bản còn nháp.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| name | string | Không / theo điều kiện nghiệp vụ | maxLength=150 |  |
| criteria | array<object> | Không / theo điều kiện nghiệp vụ | minItems=1; maxItems=100 |  |
| criteria[].code | string | Có | maxLength=50 |  |
| criteria[].name | string | Có | maxLength=150 |  |
| criteria[].weight | number | Có | minimum=0; maximum=100 |  |
| criteria[].maxScore | number | Có | minimum=0; maximum=100 |  |
| templateId | integer | Có | minimum=1; maximum=2147483647 | ID: bản ghi. |

## POST /api/json/assessment-templates/list

Danh sách và hồ sơ bộ tiêu chí đánh giá

Lọc templateId để lấy một bộ tiêu chí đầy đủ.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| templateId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID bộ tiêu chí đánh giá. |
| search | string | Không / theo điều kiện nghiệp vụ | maxLength=100 | Bộ lọc search. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| status | string ∈ "DRAFT", "PUBLISHED" | Không / theo điều kiện nghiệp vụ |  | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |

list:

```json
{
  "page": 1,
  "limit": 20
}
```

record:

```json
{
  "templateId": 1,
  "page": 1,
  "limit": 20
}
```

## POST /api/json/assessment-templates/publish

Ban hành bộ tiêu chí đánh giá

Phiên bản đã ban hành không được sửa.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| templateId | integer | Có | minimum=1; maximum=2147483647 | ID: bản ghi. |

## PATCH /api/json/assignments

Cập nhật thông tin và trạng thái thực tập

Admin và Phòng QHDN dùng chung URL; chọn mẫu dữ liệu theo vai trò trong anyOf.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| positionId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID vị trí thực tập. |
| academicSupervisorId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647; nullable=true |  |
| enterpriseSupervisorName | string | Không / theo điều kiện nghiệp vụ | maxLength=100; nullable=true |  |
| startDate | string | Không / theo điều kiện nghiệp vụ | format="date" |  |
| endDate | string | Không / theo điều kiện nghiệp vụ | format="date" |  |
| status | string ∈ "ACTIVE", "COMPLETED", "CANCELLED" | Không / theo điều kiện nghiệp vụ |  |  |
| reason | string | Không / theo điều kiện nghiệp vụ | maxLength=2000 | Lý do thực hiện. |
| assignmentId | integer | Có | minimum=1; maximum=2147483647 | ID: bản ghi. |
| positionId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID vị trí thực tập. |
| academicSupervisorId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647; nullable=true |  |
| enterpriseSupervisorName | string | Không / theo điều kiện nghiệp vụ | maxLength=100 |  |
| startDate | string | Không / theo điều kiện nghiệp vụ | format="date" |  |
| endDate | string | Không / theo điều kiện nghiệp vụ | format="date" |  |
| status | string ∈ "ACTIVE", "COMPLETED", "CANCELLED" | Không / theo điều kiện nghiệp vụ |  |  |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |
| enterpriseSupervisorName | string | Không / theo điều kiện nghiệp vụ | maxLength=100; nullable=true |  |
| startDate | string | Không / theo điều kiện nghiệp vụ | format="date" |  |
| endDate | string | Không / theo điều kiện nghiệp vụ | format="date" |  |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |
| status | string ∈ "ACTIVE", "COMPLETED", "CANCELLED" | Không / theo điều kiện nghiệp vụ |  |  |

## POST /api/json/assignments/list

Danh sách và hồ sơ phân công thực tập

Kèm sinh viên, doanh nghiệp, vị trí, đánh giá và kết quả OJT; lọc assignmentId để xem lịch sử.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100 | Số bản ghi mỗi trang. |
| search | string | Không / theo điều kiện nghiệp vụ | maxLength=100 | Bộ lọc search. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| status | string ∈ "ASSIGNED", "ACTIVE", "IN_PROGRESS", "COMPLETED", "CANCELLED", "CANCELED", "FAILED" | Không / theo điều kiện nghiệp vụ |  | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| companyId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID doanh nghiệp. |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID kỳ OJT. |
| studentId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID hồ sơ sinh viên, khác ID tài khoản. |
| positionId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID vị trí thực tập. |
| assignmentId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID phân công thực tập. |
| historyPage | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Trang lịch sử khi lọc theo ID. |
| historyLimit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số sự kiện lịch sử mỗi trang, tối đa 100. |

list:

```json
{
  "page": 1,
  "limit": 20
}
```

record:

```json
{
  "assignmentId": 1,
  "page": 1,
  "limit": 20
}
```

## POST /api/json/auth/users/password-reset

Đặt lại mật khẩu

Gửi mật khẩu tạm qua email và thu hồi phiên cũ.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| userId | integer | Có | minimum=1; maximum=2147483647 | ID tài khoản. |

## PATCH /api/json/cohorts

Cập nhật khóa và nhóm

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| cohortCode | string | Không / theo điều kiện nghiệp vụ | maxLength=20 |  |
| name | string | Không / theo điều kiện nghiệp vụ | maxLength=100 |  |
| enrollmentYear | integer | Không / theo điều kiện nghiệp vụ | minimum=1900; maximum=2200 |  |
| status | string ∈ "PLANNED", "ACTIVE", "CLOSED", "ARCHIVED" | Không / theo điều kiện nghiệp vụ |  |  |
| groups | array<object> | Không / theo điều kiện nghiệp vụ | minItems=1; maxItems=4 |  |
| groups[].groupCode | string ∈ "A", "B", "C", "D" | Có |  |  |
| groups[].entryAcademicPeriodId | integer | Có | minimum=1; maximum=2147483647 | ID kỳ bắt đầu chuyên ngành thực tế; mặc định theo khóa/nhóm. |
| cohortId | integer | Có | minimum=1; maximum=2147483647 | ID: CohortID. |

## POST /api/json/cohorts/list

Danh sách khóa và nhóm

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| search | string | Không / theo điều kiện nghiệp vụ | maxLength=100 | Bộ lọc search. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| status | string ∈ "PLANNED", "ACTIVE", "CLOSED", "ARCHIVED" | Không / theo điều kiện nghiệp vụ |  | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |

list:

```json
{
  "page": 1,
  "limit": 20
}
```

## PATCH /api/json/combo-registration-windows

Cập nhật hoặc mở/đóng đợt chọn combo

Giữ kiểm tra phạm vi, chốt danh sách và hạn đăng ký; status cần reason.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| name | string | Không / theo điều kiện nghiệp vụ | maxLength=150 |  |
| phase | string ∈ "INITIAL", "CONFIRMATION" | Không / theo điều kiện nghiệp vụ |  |  |
| academicPeriodId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID kỳ học hoặc Block 3. |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID kỳ OJT. |
| initialWindowId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; nullable=true | ID đợt chọn ban đầu cùng kỳ chuyên ngành và kỳ OJT. |
| scope | object | Không / theo điều kiện nghiệp vụ |  | Phạm vi áp dụng; các bộ lọc kết hợp đồng thời. |
| scope.cohortIds | array<integer> | Có | maxItems=1000; uniqueItems=true | Danh sách ID khóa. |
| scope.groupCodes | array<string ∈ "A", "B", "C", "D"> | Có | minItems=1; maxItems=4; uniqueItems=true |  |
| scope.majorIds | array<integer> | Có | maxItems=1000; uniqueItems=true | Danh sách ID chuyên ngành. |
| scope.studentIds | array<integer> | Không / theo điều kiện nghiệp vụ | maxItems=1000; uniqueItems=true | Danh sách ID sinh viên. |
| startsAt | string | Không / theo điều kiện nghiệp vụ | format="date-time" |  |
| endsAt | string | Không / theo điều kiện nghiệp vụ | format="date-time" |  |
| status | string ∈ "OPEN", "CLOSED" | Không / theo điều kiện nghiệp vụ |  | Mở/đóng đợt; bắt buộc reason khi gửi status. |
| reason | string | Không / theo điều kiện nghiệp vụ | maxLength=2000 | Lý do thực hiện. |
| windowId | integer | Có | minimum=1 | ID: WindowID trong ComboRegistrationWindows. |

## POST /api/json/combo-registration-windows/extensions

Gia hạn chọn combo

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| studentIds | array<integer> | Có | minItems=1; maxItems=1000; uniqueItems=true | Danh sách ID sinh viên. |
| endsAt | string | Có | format="date-time" |  |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |
| windowId | integer | Có | minimum=1 | ID: WindowID trong ComboRegistrationWindows. |

## POST /api/json/combo-registration-windows/finalize

Chốt lựa chọn combo

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| idempotencyKey | string | Có | maxLength=100 | Khóa chống trùng yêu cầu; dùng lại cùng khóa và dữ liệu khi gửi lại. |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |
| allowUnselected | boolean | Không / theo điều kiện nghiệp vụ | default=false |  |
| excludeStudentIds | array<integer> | Không / theo điều kiện nghiệp vụ | maxItems=1000; uniqueItems=true | ID sinh viên loại khỏi danh sách chốt. |
| windowId | integer | Có | minimum=1 | ID: WindowID trong ComboRegistrationWindows. |

## POST /api/json/combo-registration-windows/list

Danh sách đợt chọn combo

Sinh viên chỉ thấy đợt của mình, kèm lựa chọn hợp lệ, hạn gia hạn và lý do chưa thể nộp. studentId chọn đối tượng truy xuất, FE phải nhập; bắt buộc khi đăng nhập vai trò STUDENT; đây là ID xác định chủ thể cho vai trò này, các vai trò khác không truyền trường này. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| phase | string ∈ "INITIAL", "CONFIRMATION" | Không / theo điều kiện nghiệp vụ |  | Bộ lọc phase. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| status | string ∈ "DRAFT", "OPEN", "CLOSED", "FINALIZED" | Không / theo điều kiện nghiệp vụ |  | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| academicPeriodId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID kỳ học hoặc Block 3. |
| studentId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | studentId chọn đối tượng truy xuất, FE phải nhập; bắt buộc khi đăng nhập vai trò STUDENT; đây là ID xác định chủ thể cho vai trò này, các vai trò khác không truyền trường này. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này. |

list:

```json
{
  "page": 1,
  "limit": 20,
  "studentId": 1
}
```

staff:

```json
{
  "page": 1,
  "limit": 20
}
```

student:

```json
{
  "page": 1,
  "limit": 20,
  "studentId": 1
}
```

## POST /api/json/combo-registration-windows/preview

Xem ảnh hưởng của combo dự kiến

Tính tín chỉ, môn còn thiếu và điều kiện OJT; không lưu lựa chọn chính thức.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| studentId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID hồ sơ sinh viên, khác ID tài khoản. |
| comboId | integer | Có | minimum=1 | ID combo (ProgramComboID). |
| courseIds | array<integer> | Có | minItems=1; uniqueItems=true | Danh sách ID môn học. |
| windowId | integer | Có | minimum=1 | ID: WindowID trong ComboRegistrationWindows. |

## POST /api/json/combo-registration-windows/reminders

Gửi nhắc chọn combo

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| idempotencyKey | string | Có | maxLength=100 | Khóa chống trùng yêu cầu; dùng lại cùng khóa và dữ liệu khi gửi lại. |
| studentIds | array<integer> | Không / theo điều kiện nghiệp vụ | maxItems=1000; uniqueItems=true | Danh sách ID sinh viên. |
| target | string ∈ "MISSING", "ALL" | Không / theo điều kiện nghiệp vụ | default="MISSING" |  |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |
| windowId | integer | Có | minimum=1 | ID: WindowID trong ComboRegistrationWindows. |

## POST /api/json/combo-registration-windows/selections

Gửi lựa chọn combo

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| studentId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID hồ sơ sinh viên, khác ID tài khoản. |
| comboId | integer | Có | minimum=1 | ID combo (ProgramComboID). |
| courseIds | array<integer> | Có | maxItems=500; uniqueItems=true | Danh sách ID môn học. |
| reason | string | Không / theo điều kiện nghiệp vụ | maxLength=2000 | Lý do thực hiện. |
| windowId | integer | Có | minimum=1 | ID: WindowID trong ComboRegistrationWindows. |

## POST /api/json/combo-registration-windows/selections/list

Theo dõi lựa chọn combo

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| windowId | integer | Có | minimum=1 | ID: WindowID trong ComboRegistrationWindows. |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| status | string ∈ "SUBMITTED", "MISSING", "APPLIED", "UNSELECTED" | Không / theo điều kiện nghiệp vụ |  | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |

list:

```json
{
  "page": 1,
  "limit": 20,
  "windowId": 1
}
```

## PATCH /api/json/companies

Cập nhật doanh nghiệp

Admin và Phòng QHDN dùng chung URL; chọn mẫu dữ liệu theo vai trò trong anyOf.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| code | string | Không / theo điều kiện nghiệp vụ | maxLength=20 |  |
| name | string | Không / theo điều kiện nghiệp vụ | maxLength=200 |  |
| address | string | Không / theo điều kiện nghiệp vụ | maxLength=300; nullable=true |  |
| industry | string | Không / theo điều kiện nghiệp vụ | maxLength=100; nullable=true |  |
| contactPersonName | string | Không / theo điều kiện nghiệp vụ | maxLength=100; nullable=true |  |
| contactPhone | string | Không / theo điều kiện nghiệp vụ | maxLength=20; nullable=true |  |
| contactEmail | string | Không / theo điều kiện nghiệp vụ | format="email"; maxLength=100; nullable=true |  |
| status | string ∈ "ACTIVE", "INACTIVE" | Không / theo điều kiện nghiệp vụ |  |  |
| reason | string | Không / theo điều kiện nghiệp vụ | maxLength=2000 | Lý do thực hiện. |
| companyId | integer | Có | minimum=1; maximum=2147483647 | ID: bản ghi. |
| code | string | Không / theo điều kiện nghiệp vụ | maxLength=20 |  |
| name | string | Không / theo điều kiện nghiệp vụ | maxLength=200 |  |
| address | string | Không / theo điều kiện nghiệp vụ | maxLength=300 |  |
| industry | string | Không / theo điều kiện nghiệp vụ | maxLength=100 |  |
| contactPersonName | string | Không / theo điều kiện nghiệp vụ | maxLength=100 |  |
| contactPhone | string | Không / theo điều kiện nghiệp vụ | maxLength=20 |  |
| contactEmail | string | Không / theo điều kiện nghiệp vụ | format="email"; maxLength=100 |  |
| status | string ∈ "ACTIVE", "INACTIVE" | Không / theo điều kiện nghiệp vụ |  |  |
| code | string | Không / theo điều kiện nghiệp vụ | maxLength=20 |  |
| name | string | Không / theo điều kiện nghiệp vụ | maxLength=200 |  |
| address | string | Không / theo điều kiện nghiệp vụ | maxLength=300; nullable=true |  |
| industry | string | Không / theo điều kiện nghiệp vụ | maxLength=100; nullable=true |  |
| contactPersonName | string | Không / theo điều kiện nghiệp vụ | maxLength=100; nullable=true |  |
| contactPhone | string | Không / theo điều kiện nghiệp vụ | maxLength=20; nullable=true |  |
| contactEmail | string | Không / theo điều kiện nghiệp vụ | format="email"; maxLength=100; nullable=true |  |
| status | string ∈ "ACTIVE", "INACTIVE" | Không / theo điều kiện nghiệp vụ |  |  |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |

## DELETE /api/json/companies

Xóa doanh nghiệp

Xóa mềm doanh nghiệp theo điều kiện dữ liệu liên quan.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| companyId | integer | Có | minimum=1; maximum=2147483647 | ID: bản ghi. |

## POST /api/json/companies/list

Danh sách và hồ sơ doanh nghiệp

Lọc companyId để lấy một hồ sơ kèm lịch sử phân trang.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100 | Số bản ghi mỗi trang. |
| search | string | Không / theo điều kiện nghiệp vụ | maxLength=100 | Bộ lọc search. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| status | string ∈ "ACTIVE", "INACTIVE" | Không / theo điều kiện nghiệp vụ |  | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| companyId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID doanh nghiệp. |
| historyPage | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Trang lịch sử khi lọc theo ID. |
| historyLimit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số sự kiện lịch sử mỗi trang, tối đa 100. |

list:

```json
{
  "page": 1,
  "limit": 20
}
```

record:

```json
{
  "companyId": 1,
  "page": 1,
  "limit": 20
}
```

## PATCH /api/json/course-results

Sửa kết quả học tập và ghi lý do

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| academicPeriodId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID kỳ học hoặc Block 3. |
| attemptNumber | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=1 | Lần học, từ 1 đến 100. |
| status | string ∈ "PASSED", "FAILED", "IN_PROGRESS", "WITHDRAWN", "RECOGNIZED" | Không / theo điều kiện nghiệp vụ |  |  |
| score | number | Không / theo điều kiện nghiệp vụ | minimum=0; maximum=10; nullable=true |  |
| gradePoints | number | Không / theo điều kiện nghiệp vụ | minimum=0; maximum=4; nullable=true | Điểm quy đổi theo thang 4. |
| grade | string | Không / theo điều kiện nghiệp vụ | maxLength=2; nullable=true |  |
| sourceReference | string | Không / theo điều kiện nghiệp vụ | maxLength=200; nullable=true |  |
| courseId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID môn học (CourseID). |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |
| courseResultId | integer | Có | minimum=1 | ID: ResultID trong StudentCourseResults. |

## PATCH /api/json/courses

Cập nhật môn học

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| code | string | Không / theo điều kiện nghiệp vụ | maxLength=20 |  |
| name | string | Không / theo điều kiện nghiệp vụ | maxLength=200 |  |
| defaultCredits | number | Không / theo điều kiện nghiệp vụ | minimum=0; maximum=9999.99; nullable=true |  |
| isOjtPrerequisite | boolean | Không / theo điều kiện nghiệp vụ |  |  |
| courseId | integer | Có | minimum=1 | ID: CourseID. |

## POST /api/json/courses/list

Danh sách môn học

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| search | string | Không / theo điều kiện nghiệp vụ | maxLength=100 | Bộ lọc search. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |

list:

```json
{
  "page": 1,
  "limit": 20
}
```

## POST /api/json/curricula/detail

Chi tiết chương trình đào tạo

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| programId | integer | Có | minimum=1 | ID: ProgramID. |

## POST /api/json/curricula/list

Danh sách chương trình đào tạo đã nhập

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| search | string | Không / theo điều kiện nghiệp vụ | maxLength=100 | Bộ lọc search. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| majorId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID chuyên ngành (SpecializationID). |
| status | string ∈ "DRAFT", "PUBLISHED" | Không / theo điều kiện nghiệp vụ |  | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| version | string | Không / theo điều kiện nghiệp vụ | maxLength=10 | Bộ lọc version. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |

list:

```json
{
  "page": 1,
  "limit": 20
}
```

## PUT /api/json/curricula/ojt-grade-mappings

Thiết lập quy đổi điểm môn OJT

Chọn môn, kỳ ghi nhận và thang quy đổi. Cấu hình đã dùng để xác nhận kết quả không được sửa.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| courseId | integer | Có | minimum=1 | ID môn học (CourseID). |
| academicPeriodId | integer | Có | minimum=1 | ID kỳ học hoặc Block 3. |
| gradeBands | array<object> | Có | minItems=1; maxItems=30 | Mức quy đổi điểm; bắt đầu từ 0, không trùng mốc. |
| gradeBands[].minimumScore | number | Có | minimum=0; maximum=10 |  |
| gradeBands[].outcome | string ∈ "PASSED", "FAILED" | Có |  |  |
| gradeBands[].gradePoints | number | Không / theo điều kiện nghiệp vụ | minimum=0; maximum=4; nullable=true | Điểm quy đổi theo thang 4. |
| gradeBands[].grade | string | Không / theo điều kiện nghiệp vụ | maxLength=2; nullable=true |  |
| reason | string | Có | minLength=1; maxLength=2000 | Lý do thực hiện. |
| programId | integer | Có | minimum=1 | ID: ProgramID. |
| semesterId | integer | Có | minimum=1 | ID kỳ OJT. |

## POST /api/json/curricula/ojt-grade-mappings/detail

Xem quy đổi điểm môn OJT

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| programId | integer | Có | minimum=1 | ID: ProgramID. |
| semesterId | integer | Có | minimum=1 | ID kỳ OJT. |

## POST /api/json/eligibility-check-runs/detail

Tiến độ và kết quả kiểm tra hàng loạt

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| runId | integer | Có | minimum=1 | ID: RunID. |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Số bản ghi mỗi trang. |

## POST /api/json/eligibility-checks/confirm

Xác nhận kết quả xét điều kiện OJT

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| reason | string | Có | maxLength=1000 | Lý do thực hiện. |
| checkId | integer | Có | minimum=1 | ID: CheckID. |

## PATCH /api/json/enterprise/candidates/decision

Tiếp nhận hoặc từ chối ứng viên

Chỉ xử lý ứng viên được giới thiệu cho doanh nghiệp đang đăng nhập.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| decision | string ∈ "ACCEPTED", "REJECTED" | Có |  |  |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |
| candidateId | integer | Có | minimum=1; maximum=2147483647 | ID: bản ghi. |

## POST /api/json/enterprise/candidates/list

Danh sách và hồ sơ ứng viên

Lọc candidateId để xem một lần giới thiệu, kể cả lịch sử thuộc doanh nghiệp đăng nhập. companyId chọn đối tượng truy xuất, FE phải nhập; bắt buộc cho mọi vai trò. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| companyId | integer | Có | minimum=1; maximum=2147483647 | companyId chọn đối tượng truy xuất, FE phải nhập; bắt buộc cho mọi vai trò. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này. |
| studentId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID hồ sơ sinh viên, khác ID tài khoản. |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID kỳ OJT. |
| positionId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID vị trí thực tập. |
| search | string | Không / theo điều kiện nghiệp vụ | maxLength=100 | Bộ lọc search. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| candidateId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID candidateId dùng để chọn/lọc dữ liệu trong DB. Tùy chọn; bỏ qua để không lọc theo ID này. |
| decision | string ∈ "PENDING", "ACCEPTED", "REJECTED" | Không / theo điều kiện nghiệp vụ |  | Bộ lọc decision. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |

list:

```json
{
  "page": 1,
  "limit": 20,
  "companyId": 1
}
```

record:

```json
{
  "candidateId": 1,
  "page": 1,
  "limit": 20,
  "companyId": 1
}
```

enterprise:

```json
{
  "page": 1,
  "limit": 20,
  "companyId": 1
}
```

## PUT /api/json/enterprise/internships/evaluation

Gửi hoặc cập nhật đánh giá thực tập

Chỉ đánh giá sinh viên của doanh nghiệp; internshipId là ID phân công.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| completionScore | number | Có | minimum=0; maximum=10 |  |
| attitudeScore | number | Có | minimum=0; maximum=10 |  |
| skillScore | number | Có | minimum=0; maximum=10 |  |
| overallScore | number | Có | minimum=0; maximum=10 |  |
| comments | string | Không / theo điều kiện nghiệp vụ | maxLength=5000; nullable=true |  |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |
| internshipId | integer | Có | minimum=1; maximum=2147483647 | ID: bản ghi. |

## POST /api/json/enterprise/internships/list

Danh sách sinh viên thực tập

Kèm người hướng dẫn, vị trí, đánh giá và kết quả; điểm chính thức chỉ hiển thị sau xác nhận. companyId chọn đối tượng truy xuất, FE phải nhập; bắt buộc cho mọi vai trò. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| companyId | integer | Có | minimum=1; maximum=2147483647 | companyId chọn đối tượng truy xuất, FE phải nhập; bắt buộc cho mọi vai trò. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này. |
| studentId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID hồ sơ sinh viên, khác ID tài khoản. |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID kỳ OJT. |
| positionId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID vị trí thực tập. |
| search | string | Không / theo điều kiện nghiệp vụ | maxLength=100 | Bộ lọc search. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| internshipId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID internshipId dùng để chọn/lọc dữ liệu trong DB. Tùy chọn; bỏ qua để không lọc theo ID này. |
| status | string ∈ "ASSIGNED", "ACTIVE", "IN_PROGRESS", "COMPLETED", "CANCELLED", "CANCELED", "FAILED" | Không / theo điều kiện nghiệp vụ |  | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |

list:

```json
{
  "page": 1,
  "limit": 20,
  "companyId": 1
}
```

enterprise:

```json
{
  "page": 1,
  "limit": 20,
  "companyId": 1
}
```

## POST /api/json/imports/emails/retry

Gửi lại email bị lỗi

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| emailId | integer | Có |  | ID email lỗi còn hiệu lực. |

## POST /api/json/internship-evaluations/list

Danh sách đánh giá thực tập

Lọc evaluationId để xem hồ sơ và lịch sử; giữ lọc templateId.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100 | Số bản ghi mỗi trang. |
| search | string | Không / theo điều kiện nghiệp vụ | maxLength=100 | Bộ lọc search. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| status | string | Không / theo điều kiện nghiệp vụ | maxLength=20 | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| companyId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID doanh nghiệp. |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID kỳ OJT. |
| studentId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID hồ sơ sinh viên, khác ID tài khoản. |
| positionId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID vị trí thực tập. |
| assignmentId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID phân công thực tập. |
| templateId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID bộ tiêu chí đánh giá. |
| evaluationId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID evaluationId dùng để chọn/lọc dữ liệu trong DB. Tùy chọn; bỏ qua để không lọc theo ID này. |
| historyPage | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | Trang lịch sử khi lọc theo ID. |
| historyLimit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100 | Số sự kiện lịch sử mỗi trang, tối đa 100. |

list:

```json
{
  "page": 1,
  "limit": 20
}
```

record:

```json
{
  "evaluationId": 1,
  "page": 1,
  "limit": 20
}
```

## POST /api/json/internship-tasks/list

Danh sách task trong phạm vi tài khoản

Mỗi bản ghi giữ ID và bổ sung thông tin liên quan để hiển thị; quan hệ không tồn tại trả null. companyId chọn đối tượng truy xuất, FE phải nhập; bắt buộc khi đăng nhập vai trò ENTERPRISE; vai trò quản trị có thể bỏ để xem toàn bộ. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này. studentId chọn đối tượng truy xuất, FE phải nhập; bắt buộc khi đăng nhập vai trò STUDENT; vai trò quản trị có thể bỏ để xem toàn bộ. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| companyId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | companyId chọn đối tượng truy xuất, FE phải nhập; bắt buộc khi đăng nhập vai trò ENTERPRISE; vai trò quản trị có thể bỏ để xem toàn bộ. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này. |
| studentId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | studentId chọn đối tượng truy xuất, FE phải nhập; bắt buộc khi đăng nhập vai trò STUDENT; vai trò quản trị có thể bỏ để xem toàn bộ. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này. |
| positionId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID positionId dùng để chọn/lọc dữ liệu trong DB. Tùy chọn; bỏ qua để không lọc theo ID này. |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID ojtSemesterId dùng để chọn/lọc dữ liệu trong DB. Tùy chọn; bỏ qua để không lọc theo ID này. |
| assignmentId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID assignmentId dùng để chọn/lọc dữ liệu trong DB. Tùy chọn; bỏ qua để không lọc theo ID này. |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Trang kết quả, mặc định 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Số bản ghi mỗi trang, tối đa 100. |

list:

```json
{
  "page": 1,
  "limit": 20,
  "companyId": 1,
  "studentId": 1
}
```

staff:

```json
{
  "page": 1,
  "limit": 20
}
```

enterprise:

```json
{
  "page": 1,
  "limit": 20,
  "companyId": 1
}
```

student:

```json
{
  "page": 1,
  "limit": 20,
  "studentId": 1
}
```

## PATCH /api/json/interventions

Cập nhật hoạt động hỗ trợ

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| description | string | Không / theo điều kiện nghiệp vụ | maxLength=10000 |  |
| assignedTo | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID kỳ OJT. |
| dueDate | string | Không / theo điều kiện nghiệp vụ | format="date"; nullable=true |  |
| status | string ∈ "PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED" | Không / theo điều kiện nghiệp vụ |  |  |
| outcome | string | Không / theo điều kiện nghiệp vụ | maxLength=10000 |  |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |
| interventionId | integer | Có | minimum=1; maximum=2147483647 | ID: bản ghi. |

## POST /api/json/job-applications/list

Danh sách hồ sơ ứng tuyển doanh nghiệp

Sinh viên xem hồ sơ của mình; Admin/QHDN xem được trước bàn giao. Kèm vị trí, doanh nghiệp, tin tuyển, CV đã dùng và trạng thái điều phối. studentId chọn đối tượng truy xuất, FE phải nhập; bắt buộc khi đăng nhập vai trò STUDENT; vai trò quản trị có thể bỏ để xem toàn bộ. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| applicationId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID applicationId dùng để chọn/lọc dữ liệu trong DB. Tùy chọn; bỏ qua để không lọc theo ID này. |
| studentId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | studentId chọn đối tượng truy xuất, FE phải nhập; bắt buộc khi đăng nhập vai trò STUDENT; vai trò quản trị có thể bỏ để xem toàn bộ. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này. |
| registrationId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID registrationId dùng để chọn/lọc dữ liệu trong DB. Tùy chọn; bỏ qua để không lọc theo ID này. |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID ojtSemesterId dùng để chọn/lọc dữ liệu trong DB. Tùy chọn; bỏ qua để không lọc theo ID này. |
| companyId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID companyId dùng để chọn/lọc dữ liệu trong DB. Tùy chọn; bỏ qua để không lọc theo ID này. |
| positionId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID positionId dùng để chọn/lọc dữ liệu trong DB. Tùy chọn; bỏ qua để không lọc theo ID này. |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Trang kết quả, mặc định 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Số bản ghi mỗi trang, tối đa 100. |
| status | string ∈ "SUBMITTED", "REVIEWING", "INTERVIEW", "OFFERED", "ACCEPTED", "REJECTED", "WITHDRAWN" | Không / theo điều kiện nghiệp vụ |  | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |

list:

```json
{
  "page": 1,
  "limit": 20,
  "studentId": 1
}
```

record:

```json
{
  "applicationId": 1,
  "page": 1,
  "limit": 20,
  "studentId": 1
}
```

staff:

```json
{
  "page": 1,
  "limit": 20
}
```

student:

```json
{
  "page": 1,
  "limit": 20,
  "studentId": 1
}
```

## POST /api/json/majors/list

Danh sách chuyên ngành

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| search | string | Không / theo điều kiện nghiệp vụ | maxLength=100 | Bộ lọc search. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| parentMajorId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID ngành cha (MajorID). |

list:

```json
{
  "page": 1,
  "limit": 20
}
```

## POST /api/json/ojt-coordinations/decision

Ghi nhận quyết định tiếp nhận sinh viên

Admin hoặc Phòng QHDN ghi nhận thay doanh nghiệp; cần lý do.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| decision | string ∈ "ACCEPTED", "REJECTED" | Có |  |  |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |
| coordinationId | integer | Có | minimum=1 | ID: bản ghi. |

## POST /api/json/ojt-coordinations/list

Danh sách và hồ sơ điều phối

Lọc coordinationId để xem hồ sơ, lịch sử và chuỗi điều phối phân trang.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100 | Số bản ghi mỗi trang. |
| search | string | Không / theo điều kiện nghiệp vụ | maxLength=100 | Bộ lọc search. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| status | string ∈ "PENDING", "ACCEPTED", "REJECTED" | Không / theo điều kiện nghiệp vụ |  | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| companyId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID doanh nghiệp. |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID kỳ OJT. |
| studentId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID hồ sơ sinh viên, khác ID tài khoản. |
| positionId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID vị trí thực tập. |
| registrationId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID registrationId dùng để chọn/lọc dữ liệu trong DB. Tùy chọn; bỏ qua để không lọc theo ID này. |
| decision | string ∈ "PENDING", "ACCEPTED", "REJECTED" | Không / theo điều kiện nghiệp vụ |  | Bộ lọc decision. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| coordinationId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID coordinationId dùng để chọn/lọc dữ liệu trong DB. Tùy chọn; bỏ qua để không lọc theo ID này. |
| historyPage | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | Trang lịch sử khi lọc theo ID. |
| historyLimit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100 | Số sự kiện lịch sử mỗi trang, tối đa 100. |
| coordinationPage | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | Bộ lọc coordinationPage. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| coordinationLimit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100 | Bộ lọc coordinationLimit. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| applicationId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID kỳ OJT. |

list:

```json
{
  "page": 1,
  "limit": 20
}
```

record:

```json
{
  "coordinationId": 1,
  "page": 1,
  "limit": 20
}
```

## POST /api/json/ojt-coordinations/reassign

Điều phối lại sinh viên

Chuyển hồ sơ bị từ chối sang vị trí khác; cần lý do.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| positionId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID vị trí thực tập. |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |
| idempotencyKey | string | Có | maxLength=100 | Khóa chống trùng yêu cầu; dùng lại cùng khóa và dữ liệu khi gửi lại. |
| applicationId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID kỳ OJT. |
| coordinationId | integer | Có | minimum=1 | ID: bản ghi. |

## PATCH /api/json/ojt-registration-windows

Cập nhật hoặc mở/đóng đợt đăng ký OJT

Gửi status OPEN/CLOSED và reason để chuyển trạng thái.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID kỳ OJT. |
| name | string | Không / theo điều kiện nghiệp vụ | maxLength=150 |  |
| scope | object | Không / theo điều kiện nghiệp vụ |  | Phạm vi áp dụng; các bộ lọc kết hợp đồng thời. |
| scope.programIds | array<integer> | Không / theo điều kiện nghiệp vụ | minItems=1; uniqueItems=true | Danh sách ID phiên bản chương trình. |
| scope.cohortIds | array<integer> | Không / theo điều kiện nghiệp vụ | minItems=1; uniqueItems=true | Danh sách ID khóa. |
| scope.majorIds | array<integer> | Không / theo điều kiện nghiệp vụ | minItems=1; uniqueItems=true | Danh sách ID chuyên ngành. |
| scope.studentIds | array<integer> | Không / theo điều kiện nghiệp vụ | minItems=1; uniqueItems=true | Danh sách ID sinh viên. |
| scope.groupCodes | array<string ∈ "A", "B", "C", "D"> | Không / theo điều kiện nghiệp vụ | minItems=1; uniqueItems=true |  |
| startsAt | string | Không / theo điều kiện nghiệp vụ | format="date-time" |  |
| endsAt | string | Không / theo điều kiện nghiệp vụ | format="date-time" |  |
| reason | string | Không / theo điều kiện nghiệp vụ | maxLength=2000 | Lý do thực hiện. |
| academicPeriodId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID kỳ học hoặc Block 3. |
| requiredRelativeSemester | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=20; default=5 | Kỳ chuyên ngành cho phép đăng ký; mặc định 5. |
| status | string ∈ "OPEN", "CLOSED" | Không / theo điều kiện nghiệp vụ |  | Mở/đóng đợt; bắt buộc reason khi gửi status. |
| windowId | integer | Có | minimum=1 | ID: WindowID trong OJTRegistrationWindows. |

## POST /api/json/ojt-registration-windows/list

Danh sách đợt đăng ký OJT

Sinh viên chỉ thấy đợt phù hợp, kèm kỳ học, hồ sơ đã nộp và điều kiện đăng ký. studentId chọn đối tượng truy xuất, FE phải nhập; bắt buộc khi đăng nhập vai trò STUDENT; đây là ID xác định chủ thể cho vai trò này, các vai trò khác không truyền trường này. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID kỳ OJT. |
| status | string ∈ "DRAFT", "OPEN", "CLOSED" | Không / theo điều kiện nghiệp vụ |  | Lọc theo trạng thái; bỏ trường này để xem tất cả. |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| studentId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | studentId chọn đối tượng truy xuất, FE phải nhập; bắt buộc khi đăng nhập vai trò STUDENT; đây là ID xác định chủ thể cho vai trò này, các vai trò khác không truyền trường này. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này. |

list:

```json
{
  "page": 1,
  "limit": 20,
  "studentId": 1
}
```

staff:

```json
{
  "page": 1,
  "limit": 20
}
```

student:

```json
{
  "page": 1,
  "limit": 20,
  "studentId": 1
}
```

## POST /api/json/ojt-registration-windows/semester-exceptions

Thêm ngoại lệ kỳ đăng ký OJT

Chỉ áp dụng cho sinh viên, kỳ và thời hạn được chỉ định; cần lý do.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| studentIds | array<integer> | Có | minItems=1; uniqueItems=true | Danh sách ID sinh viên. |
| relativeSemester | integer | Có | minimum=1; maximum=20 | Kỳ chuyên ngành tương đối. |
| expiresAt | string | Có | format="date-time" |  |
| reason | string | Có | minLength=1; maxLength=2000 | Lý do thực hiện. |
| windowId | integer | Có | minimum=1 | ID: WindowID trong OJTRegistrationWindows. |

## POST /api/json/ojt-registration-windows/semester-exceptions/revoke

Thu hồi ngoại lệ kỳ đăng ký OJT

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| reason | string | Có | minLength=1; maxLength=2000 | Lý do thực hiện. |
| windowId | integer | Có | minimum=1 | ID: WindowID trong OJTRegistrationWindows. |
| exceptionId | integer | Có | minimum=1 | ID ngoại lệ của đợt đăng ký. |

## POST /api/json/ojt-registrations/list

Danh sách hồ sơ đăng ký OJT

Không có registrationId: danh sách thông thường. Có registrationId: trả thêm chi tiết trong data.items; phần lịch sử/dòng dữ liệu có phân trang riêng. Không khớp bộ lọc trả items rỗng. studentId chọn đối tượng truy xuất, FE phải nhập; bắt buộc khi đăng nhập vai trò STUDENT; vai trò quản trị có thể bỏ để xem toàn bộ. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID kỳ OJT. |
| windowId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID đợt đăng ký. |
| studentId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | studentId chọn đối tượng truy xuất, FE phải nhập; bắt buộc khi đăng nhập vai trò STUDENT; vai trò quản trị có thể bỏ để xem toàn bộ. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này. |
| programId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID phiên bản chương trình đào tạo. |
| cohortId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID khóa. |
| groupCode | string ∈ "A", "B", "C", "D" | Không / theo điều kiện nghiệp vụ |  | Bộ lọc groupCode. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| status | string ∈ "SUBMITTED", "APPROVED", "REJECTED", "HANDED_OFF" | Không / theo điều kiện nghiệp vụ |  | Lọc theo trạng thái; bỏ trường này để xem tất cả. |
| search | string | Không / theo điều kiện nghiệp vụ |  | Bộ lọc search. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| registrationId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Chọn một hồ sơ để trả thêm phần chi tiết. |
| historyPage | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Phân trang history; chỉ dùng cùng registrationId. |
| historyLimit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Phân trang history; chỉ dùng cùng registrationId. |
| coordinationPage | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Phân trang coordination; chỉ dùng cùng registrationId. |
| coordinationLimit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Phân trang coordination; chỉ dùng cùng registrationId. |
| assignmentPage | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Phân trang assignment; chỉ dùng cùng registrationId. |
| assignmentLimit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Phân trang assignment; chỉ dùng cùng registrationId. |

list:

```json
{
  "page": 1,
  "limit": 20,
  "studentId": 1
}
```

record:

```json
{
  "registrationId": 1,
  "page": 1,
  "limit": 20,
  "studentId": 1
}
```

staff:

```json
{
  "page": 1,
  "limit": 20
}
```

student:

```json
{
  "page": 1,
  "limit": 20,
  "studentId": 1
}
```

## POST /api/json/ojt-registrations/review

Duyệt hoặc từ chối hồ sơ OJT

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| decision | string ∈ "APPROVE", "REJECT" | Có |  |  |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |
| idempotencyKey | string | Có | maxLength=100 | Khóa chống trùng yêu cầu; dùng lại cùng khóa và dữ liệu khi gửi lại. |
| registrationId | integer | Có | minimum=1 | ID: RegistrationID. |

## POST /api/json/ojt-results/list

Danh sách điểm OJT chính thức do doanh nghiệp đánh giá

OverallScore của đánh giá SUBMITTED là điểm chính thức; phòng đào tạo không nhập lại hoặc xác nhận. resultId là EvaluationID. Mỗi bản ghi giữ ID và bổ sung thông tin liên quan để hiển thị; quan hệ không tồn tại trả null.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| resultId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID resultId dùng để chọn/lọc dữ liệu trong DB. Tùy chọn; bỏ qua để không lọc theo ID này. |
| studentId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID studentId dùng để chọn/lọc dữ liệu trong DB. Tùy chọn; bỏ qua để không lọc theo ID này. |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID ojtSemesterId dùng để chọn/lọc dữ liệu trong DB. Tùy chọn; bỏ qua để không lọc theo ID này. |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Trang kết quả, mặc định 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Số bản ghi mỗi trang, tối đa 100. |
| status | string ∈ "CONFIRMED" | Không / theo điều kiện nghiệp vụ |  | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| search | string | Không / theo điều kiện nghiệp vụ |  | Bộ lọc search. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |

list:

```json
{
  "page": 1,
  "limit": 20
}
```

record:

```json
{
  "resultId": 1,
  "page": 1,
  "limit": 20
}
```

## PATCH /api/json/ojt-rule-sets

Sửa bộ quy tắc chưa ban hành

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| programId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID phiên bản chương trình đào tạo. |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; nullable=true | ID kỳ OJT. |
| version | integer | Không / theo điều kiện nghiệp vụ | minimum=1 |  |
| name | string | Không / theo điều kiện nghiệp vụ | maxLength=200 |  |
| minCredits | number ∈ 70 | Không / theo điều kiện nghiệp vụ | default=70 |  |
| maxUnpassedCourses | integer ∈ 2 | Không / theo điều kiện nghiệp vụ | default=2 |  |
| debtBasis | string ∈ "FAILED_ATTEMPTS" | Không / theo điều kiện nghiệp vụ | default="FAILED_ATTEMPTS" |  |
| ruleSetId | integer | Có | minimum=1 | ID: RuleSetID. |

## POST /api/json/ojt-rule-sets/list

Danh sách bộ quy tắc OJT

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| programId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID phiên bản chương trình đào tạo. |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID kỳ OJT. |
| status | string | Không / theo điều kiện nghiệp vụ |  | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Số bản ghi mỗi trang. |

list:

```json
{
  "page": 1,
  "limit": 20
}
```

## POST /api/json/ojt-rule-sets/publish

Ban hành bộ quy tắc OJT

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ruleSetId | integer | Có | minimum=1 | ID: RuleSetID. |

## PUT /api/json/ojt-semesters/assessment-window

Thiết lập đợt xét điều kiện chính thức

Thiết lập khi còn nháp. Thời điểm mở sau khi Block 3 kết thúc.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| blockPeriodId | integer | Có | minimum=1 | ID Block 3 dùng xét điều kiện. |
| opensAt | string | Có | format="date-time" |  |
| closesAt | string | Có | format="date-time" |  |
| reason | string | Có | minLength=1; maxLength=2000 | Lý do thực hiện. |
| assessmentAcademicPeriodId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID kỳ OJT. |
| requiredRelativeSemester | integer ∈ 5 | Không / theo điều kiện nghiệp vụ | default=5 | Kỳ chuyên ngành cho phép đăng ký; mặc định 5. |
| ojtSemesterId | integer | Có | minimum=1 | ID: OJTSemesterID. |

## POST /api/json/ojt-semesters/assessment-window/close

Đóng xét điều kiện chính thức

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| reason | string | Có | minLength=1; maxLength=2000 | Lý do thực hiện. |
| ojtSemesterId | integer | Có | minimum=1 | ID: OJTSemesterID. |

## POST /api/json/ojt-semesters/assessment-window/open

Mở xét điều kiện chính thức

Cần xác nhận đã cập nhật xong điểm. Kết quả kiểm tra trước mốc xác nhận phải được chạy lại.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| reason | string | Có | minLength=1; maxLength=2000 | Lý do thực hiện. |
| resultsFinalized | boolean ∈ true | Có |  | Xác nhận đã hoàn tất cập nhật điểm. |
| reopen | boolean | Không / theo điều kiện nghiệp vụ |  | Explicitly reopen a closed assessment, invalidate previous official revision, and audit the reason. |
| closesAt | string | Không / theo điều kiện nghiệp vụ | format="date-time" | Hạn xét điều kiện, gồm múi giờ. |
| ojtSemesterId | integer | Có | minimum=1 | ID: OJTSemesterID. |

## POST /api/json/ojt-semesters/assessment-window/search

Xem đợt xét điều kiện chính thức

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Có | minimum=1 | ID: OJTSemesterID. |

## POST /api/json/ojt-semesters/eligible-student-handoffs

Bàn giao sinh viên đủ điều kiện cho QHDN

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| registrationIds | array<integer> | Không / theo điều kiện nghiệp vụ | minItems=1; maxItems=1000; uniqueItems=true | Danh sách ID hồ sơ OJT bàn giao. |
| idempotencyKey | string | Có | maxLength=100 | Khóa chống trùng yêu cầu; dùng lại cùng khóa và dữ liệu khi gửi lại. |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |
| ojtSemesterId | integer | Có | minimum=1 | ID: OJTSemesterID. |

## POST /api/json/ojt-semesters/eligible-student-handoffs/list

Lịch sử bàn giao sinh viên cho QHDN

Mỗi bản ghi giữ ID và bổ sung thông tin liên quan để hiển thị; quan hệ không tồn tại trả null.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Có | minimum=1 | ID: OJTSemesterID. |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Số bản ghi mỗi trang. |

list:

```json
{
  "page": 1,
  "limit": 20,
  "ojtSemesterId": 1
}
```

## POST /api/json/ojt-semesters/results/export

Xuất danh sách điểm OJT chính thức

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Có | minimum=1 |  |
| resultId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 |  |
| studentId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 |  |
| status | string ∈ "CONFIRMED" | Không / theo điều kiện nghiệp vụ |  |  |
| search | string | Không / theo điều kiện nghiệp vụ |  |  |
| format | string ∈ "csv", "json", "pdf" | Không / theo điều kiện nghiệp vụ |  |  |

## POST /api/json/ojt-semesters/students/list

Theo dõi trạng thái OJT theo kỳ

 studentId chọn đối tượng truy xuất, FE phải nhập; bắt buộc khi đăng nhập vai trò STUDENT; đây là ID xác định chủ thể cho vai trò này, các vai trò khác không truyền trường này. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Có | minimum=1 | ID: OJTSemesterID. |
| programId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID phiên bản chương trình đào tạo. |
| cohortId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID khóa. |
| groupCode | string | Không / theo điều kiện nghiệp vụ |  | Bộ lọc groupCode. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| registrationStatus | string | Không / theo điều kiện nghiệp vụ |  | Bộ lọc registrationStatus. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| search | string | Không / theo điều kiện nghiệp vụ |  | Bộ lọc search. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Số bản ghi mỗi trang. |
| enterpriseId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Filters the latest coordination and its assignment; QHDN remains restricted to handed-off students. |
| coordinationStatus | string ∈ "NOT_COORDINATED", "PENDING", "ACCEPTED", "REJECTED" | Không / theo điều kiện nghiệp vụ |  | Filters the latest coordination and its assignment; QHDN remains restricted to handed-off students. |
| assignmentStatus | string ∈ "UNASSIGNED", "ASSIGNED", "ACTIVE", "IN_PROGRESS", "COMPLETED", "CANCELLED", "CANCELED", "FAILED" | Không / theo điều kiện nghiệp vụ |  | Filters the latest coordination and its assignment; QHDN remains restricted to handed-off students. |
| studentId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | studentId chọn đối tượng truy xuất, FE phải nhập; bắt buộc khi đăng nhập vai trò STUDENT; đây là ID xác định chủ thể cho vai trò này, các vai trò khác không truyền trường này. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này. |

list:

```json
{
  "page": 1,
  "limit": 20,
  "studentId": 1,
  "ojtSemesterId": 1
}
```

staff:

```json
{
  "page": 1,
  "limit": 20,
  "ojtSemesterId": 1
}
```

student:

```json
{
  "page": 1,
  "limit": 20,
  "ojtSemesterId": 1,
  "studentId": 1
}
```

## DELETE /api/json/positions

Xóa vị trí thực tập

Xóa mềm vị trí theo điều kiện dữ liệu liên quan.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| positionId | integer | Có | minimum=1; maximum=2147483647 | ID: bản ghi. |

## POST /api/json/positions/list

Danh sách và hồ sơ vị trí thực tập

Lọc positionId để lấy một vị trí kèm lịch sử; có mã, địa điểm và hình thức làm việc.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100 | Số bản ghi mỗi trang. |
| search | string | Không / theo điều kiện nghiệp vụ | maxLength=100 | Bộ lọc search. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| status | string ∈ "OPEN", "CLOSED" | Không / theo điều kiện nghiệp vụ |  | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| companyId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID doanh nghiệp. |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID kỳ OJT. |
| positionId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID vị trí thực tập. |
| historyPage | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Trang lịch sử khi lọc theo ID. |
| historyLimit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số sự kiện lịch sử mỗi trang, tối đa 100. |

list:

```json
{
  "page": 1,
  "limit": 20
}
```

record:

```json
{
  "positionId": 1,
  "page": 1,
  "limit": 20
}
```

## POST /api/json/predictions/list

Lịch sử dự đoán

Không có predictionId: danh sách thông thường. Có predictionId: trả thêm chi tiết trong data.items; phần lịch sử/dòng dữ liệu có phân trang riêng. Không khớp bộ lọc trả items rỗng.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID kỳ OJT. |
| studentId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID hồ sơ sinh viên, khác ID tài khoản. |
| modelId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID phiên bản mô hình. |
| riskLevel | string ∈ "LOW", "MEDIUM", "HIGH" | Không / theo điều kiện nghiệp vụ |  | Bộ lọc riskLevel. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| readinessLevel | string ∈ "LOW", "MEDIUM", "HIGH" | Không / theo điều kiện nghiệp vụ |  | Bộ lọc readinessLevel. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| from | string | Không / theo điều kiện nghiệp vụ | format="date-time" | Bộ lọc from. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| to | string | Không / theo điều kiện nghiệp vụ | format="date-time" | Bộ lọc to. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| predictionId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Chọn một hồ sơ để trả thêm phần chi tiết. |

list:

```json
{
  "page": 1,
  "limit": 20
}
```

record:

```json
{
  "predictionId": 1,
  "page": 1,
  "limit": 20
}
```

## POST /api/json/qhdn/dashboard/search

Tổng quan QHDN

Tổng hợp bàn giao, tiếp nhận và sức chứa; dùng lần điều phối mới nhất.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID kỳ OJT. |
| companyId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID doanh nghiệp. |

## POST /api/json/qhdn/registered-students/list

Xem sinh viên đã đăng ký OJT

Admin/QHDN chỉ xem sinh viên đã có đăng ký OJT, kể cả chưa bàn giao. Mỗi sinh viên một dòng, các hồ sơ khớp bộ lọc nằm trong registrations; total và phân trang tính theo sinh viên. Không cấp quyền duyệt hoặc điều phối trước bàn giao.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| registrationId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID registrationId dùng để chọn/lọc dữ liệu trong DB. Tùy chọn; bỏ qua để không lọc theo ID này. |
| studentId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID hồ sơ sinh viên, khác ID tài khoản. |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID kỳ OJT. |
| academicPeriodId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID kỳ học hoặc Block 3. |
| windowId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID đợt đăng ký. |
| status | string ∈ "SUBMITTED", "APPROVED", "REJECTED", "HANDED_OFF" | Không / theo điều kiện nghiệp vụ |  | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| programId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID phiên bản chương trình đào tạo. |
| cohortId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID khóa. |
| groupCode | string ∈ "A", "B", "C", "D" | Không / theo điều kiện nghiệp vụ |  | Bộ lọc groupCode. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| search | string | Không / theo điều kiện nghiệp vụ | maxLength=100 | Bộ lọc search. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| handoffStatus | string ∈ "NOT_HANDED_OFF", "HANDED_OFF" | Không / theo điều kiện nghiệp vụ |  | Lọc hồ sơ chưa bàn giao hoặc đã bàn giao. |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |

all:

```json
{
  "page": 1,
  "limit": 20
}
```

notHandedOff:

```json
{
  "handoffStatus": "NOT_HANDED_OFF",
  "page": 1,
  "limit": 20
}
```

## POST /api/json/qhdn/reports/export

Xuất báo cáo QHDN

Định dạng CSV hoặc JSON; tối đa 10.000 dòng, không phân trang.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID kỳ OJT. |
| companyId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID doanh nghiệp. |
| type | string ∈ "acceptance", "internships", "enterprise-feedback" | Có |  |  |
| format | string ∈ "csv", "json" | Không / theo điều kiện nghiệp vụ | default="csv" |  |

## POST /api/json/qhdn/reports/list

Báo cáo QHDN theo loại

type: acceptance, internships hoặc enterprise-feedback; giữ lọc kỳ/doanh nghiệp và phân trang. Mỗi bản ghi giữ ID và bổ sung thông tin liên quan để hiển thị; quan hệ không tồn tại trả null.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID kỳ OJT. |
| companyId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID doanh nghiệp. |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| type | string ∈ "acceptance", "internships", "enterprise-feedback" | Có |  | Bộ lọc type. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |

list:

```json
{
  "page": 1,
  "limit": 20,
  "type": "acceptance"
}
```

## POST /api/json/recruitment/posts/close

Đóng tin tuyển dụng

Ngừng nhận ứng viên vào các vị trí liên quan.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |
| postId | integer | Có | minimum=1; maximum=2147483647 | ID: bản ghi. |

## POST /api/json/recruitment/posts/list

Danh sách tin tuyển dụng

Kèm vị trí và chỉ tiêu; doanh nghiệp chỉ xem tin của mình. companyId chọn đối tượng truy xuất, FE phải nhập; bắt buộc cho mọi vai trò. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| companyId | integer | Có | minimum=1; maximum=2147483647 | companyId chọn đối tượng truy xuất, FE phải nhập; bắt buộc cho mọi vai trò. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này. |
| postId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID kỳ học hoặc Block 3. |
| windowId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID đợt đăng ký. |
| academicPeriodId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID kỳ học hoặc Block 3. |
| status | string ∈ "DRAFT", "PENDING_REVIEW", "PUBLISHED", "REJECTED", "CLOSED", "ARCHIVED" | Không / theo điều kiện nghiệp vụ |  | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |

list:

```json
{
  "page": 1,
  "limit": 20,
  "companyId": 1
}
```

staff:

```json
{
  "page": 1,
  "limit": 20,
  "companyId": 1
}
```

enterprise:

```json
{
  "page": 1,
  "limit": 20,
  "companyId": 1
}
```

## POST /api/json/recruitment/posts/review

Duyệt hoặc từ chối tin tuyển dụng

Vị trí được mở sau khi tin được công bố.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| decision | string ∈ "PUBLISH", "REJECT" | Có |  |  |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |
| deadlineAt | string | Không / theo điều kiện nghiệp vụ | format="date-time" |  |
| postId | integer | Có | minimum=1; maximum=2147483647 | ID: bản ghi. |

## PATCH /api/json/recruitment/windows

Cập nhật hoặc mở/đóng đợt tuyển dụng

Chọn học kỳ có sẵn; status OPEN/CLOSED cần reason.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| academicPeriodId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID kỳ học hoặc Block 3. |
| name | string | Không / theo điều kiện nghiệp vụ | maxLength=150 |  |
| startsAt | string | Không / theo điều kiện nghiệp vụ | format="date-time" |  |
| endsAt | string | Không / theo điều kiện nghiệp vụ | format="date-time" |  |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |
| status | string ∈ "OPEN", "CLOSED" | Không / theo điều kiện nghiệp vụ |  |  |
| windowId | integer | Có | minimum=1; maximum=2147483647 | ID: bản ghi. |

## POST /api/json/student/academic-summary/search

tín chỉ đã đạt/đang học/thiếu; môn nợ/chưa học/đang học. Kịch bản đạt ngưỡng không phải xác suất AI

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Có | minimum=1; maximum=2147483647 | ID kỳ OJT. |

## POST /api/json/student/assignments/current/search

DN/vị trí/giám sát/thời gian của mình theo kỳ

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID kỳ OJT. |

## POST /api/json/student/combo-registration-windows/list

các đợt/lựa chọn khả dụng

Mỗi bản ghi giữ ID và bổ sung thông tin liên quan để hiển thị; quan hệ không tồn tại trả null. studentId chọn đối tượng truy xuất, FE phải nhập; bắt buộc cho mọi vai trò. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100 | Số bản ghi mỗi trang. |
| studentId | integer | Có | minimum=1; maximum=2147483647 | studentId chọn đối tượng truy xuất, FE phải nhập; bắt buộc cho mọi vai trò. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này. |

list:

```json
{
  "page": 1,
  "limit": 20,
  "studentId": 1
}
```

student:

```json
{
  "page": 1,
  "limit": 20,
  "studentId": 1
}
```

## POST /api/json/student/dashboard/search

tổng hợp; không tạo thuật toán học vụ mới

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Có | minimum=1; maximum=2147483647 | ID kỳ OJT. |

## POST /api/json/student/notifications/list

thông báo/lọc unread/phân trang, trả unreadCount cùng response

Mỗi bản ghi giữ ID và bổ sung thông tin liên quan để hiển thị; quan hệ không tồn tại trả null. studentId chọn đối tượng truy xuất, FE phải nhập; bắt buộc cho mọi vai trò. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| unread | string ∈ "true", "false" | Không / theo điều kiện nghiệp vụ |  | Bộ lọc unread. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100 | Số bản ghi mỗi trang. |
| studentId | integer | Có | minimum=1; maximum=2147483647 | studentId chọn đối tượng truy xuất, FE phải nhập; bắt buộc cho mọi vai trò. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này. |

list:

```json
{
  "page": 1,
  "limit": 20,
  "studentId": 1
}
```

student:

```json
{
  "page": 1,
  "limit": 20,
  "studentId": 1
}
```

## PATCH /api/json/student/notifications/read

người nhận đánh dấu đọc, idempotent

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| id | integer | Có | minimum=1; maximum=2147483647 | ID: bản ghi. |

## POST /api/json/student/ojt-registration-windows/list

scope/deadline, canRegister/blockReasons

Mỗi bản ghi giữ ID và bổ sung thông tin liên quan để hiển thị; quan hệ không tồn tại trả null. studentId chọn đối tượng truy xuất, FE phải nhập; bắt buộc cho mọi vai trò. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID kỳ OJT. |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100 | Số bản ghi mỗi trang. |
| studentId | integer | Có | minimum=1; maximum=2147483647 | studentId chọn đối tượng truy xuất, FE phải nhập; bắt buộc cho mọi vai trò. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này. |

list:

```json
{
  "page": 1,
  "limit": 20,
  "studentId": 1
}
```

student:

```json
{
  "page": 1,
  "limit": 20,
  "studentId": 1
}
```

## POST /api/json/student/ojt-results/detail

điểm/nhận xét đã công bố

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| resultId | integer | Có | minimum=1; maximum=2147483647 | ID: bản ghi. |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID kỳ OJT. |

## POST /api/json/student/ojt-results/list

chỉ kết quả của mình được công bố

Mỗi bản ghi giữ ID và bổ sung thông tin liên quan để hiển thị; quan hệ không tồn tại trả null. studentId chọn đối tượng truy xuất, FE phải nhập; bắt buộc cho mọi vai trò. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID kỳ OJT. |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100 | Số bản ghi mỗi trang. |
| studentId | integer | Có | minimum=1; maximum=2147483647 | studentId chọn đối tượng truy xuất, FE phải nhập; bắt buộc cho mọi vai trò. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này. |

list:

```json
{
  "page": 1,
  "limit": 20,
  "studentId": 1
}
```

student:

```json
{
  "page": 1,
  "limit": 20,
  "studentId": 1
}
```

## POST /api/json/student/risk-prediction/search

kết quả dự báo của mình, dùng lại prediction service khi có dữ liệu

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Có | minimum=1; maximum=2147483647 | ID kỳ OJT. |

## POST /api/json/student/roadmap-recommendations/search

tư vấn AI lộ trình; khác đề xuất môn bằng quy tắc

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Có | minimum=1; maximum=2147483647 | ID kỳ OJT. |

## POST /api/json/student/supplementary-course-options/search

đề xuất môn/môn học lại, tín chỉ, lý do và tiên quyết; không lớp, không đăng ký học, không cam kết lịch

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Có | minimum=1; maximum=2147483647 | ID kỳ OJT. |

## PATCH /api/json/students

Cập nhật hồ sơ và lộ trình học vụ

Chỉ gửi trường cần sửa; placement chứa khóa, nhóm và kỳ học.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| fullName | string | Không / theo điều kiện nghiệp vụ | maxLength=100 |  |
| phone | string | Không / theo điều kiện nghiệp vụ | maxLength=20; nullable=true |  |
| className | string | Không / theo điều kiện nghiệp vụ | maxLength=20; nullable=true |  |
| status | string ∈ "ACTIVE", "INACTIVE", "SUSPENDED", "GRADUATED", "DROPPED_OUT" | Không / theo điều kiện nghiệp vụ |  |  |
| programId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; nullable=true | ID phiên bản chương trình đào tạo. |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |
| placement | object | Không / theo điều kiện nghiệp vụ |  | Chỉ gửi trường lộ trình cần sửa. Lần đầu cần khóa, nhóm và kỳ hiện tại. |
| placement.cohortId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID khóa. |
| placement.groupCode | string ∈ "A", "B", "C", "D" | Không / theo điều kiện nghiệp vụ |  |  |
| placement.entryAcademicPeriodId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID kỳ bắt đầu chuyên ngành thực tế; mặc định theo khóa/nhóm. |
| placement.currentAcademicPeriodId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID kỳ/Block đang học; bắt buộc khi gán lần đầu. |
| studentId | integer | Có | minimum=1 | ID: StudentID. |

## DELETE /api/json/students

Xóa hồ sơ sinh viên

Xóa mềm hồ sơ và vô hiệu hóa tài khoản.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| studentId | integer | Có | minimum=1; maximum=2147483647 | ID: StudentID. |

## POST /api/json/students/combo-selections/list

Lịch sử lựa chọn combo của sinh viên

 studentId chọn đối tượng truy xuất, FE phải nhập; bắt buộc khi đăng nhập vai trò STUDENT; vai trò quản trị có thể bỏ để xem toàn bộ. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| studentId | integer | Có | minimum=1; maximum=2147483647 | studentId chọn đối tượng truy xuất, FE phải nhập; bắt buộc khi đăng nhập vai trò STUDENT; vai trò quản trị có thể bỏ để xem toàn bộ. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này. |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |

list:

```json
{
  "page": 1,
  "limit": 20,
  "studentId": 1
}
```

staff:

```json
{
  "page": 1,
  "limit": 20,
  "studentId": 1
}
```

student:

```json
{
  "page": 1,
  "limit": 20,
  "studentId": 1
}
```

## POST /api/json/students/course-results/list

Điểm, lần học và trạng thái môn

Mỗi bản ghi giữ ID và bổ sung thông tin liên quan để hiển thị; quan hệ không tồn tại trả null. studentId chọn đối tượng truy xuất, FE phải nhập; bắt buộc khi đăng nhập vai trò STUDENT; vai trò quản trị có thể bỏ để xem toàn bộ. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| studentId | integer | Có | minimum=1; maximum=2147483647 | studentId chọn đối tượng truy xuất, FE phải nhập; bắt buộc khi đăng nhập vai trò STUDENT; vai trò quản trị có thể bỏ để xem toàn bộ. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này. |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| courseId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID môn học (CourseID). |
| academicPeriodId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID kỳ học hoặc Block 3. |
| status | string ∈ "PASSED", "FAILED", "IN_PROGRESS", "WITHDRAWN", "RECOGNIZED" | Không / theo điều kiện nghiệp vụ |  | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |

list:

```json
{
  "page": 1,
  "limit": 20,
  "studentId": 1
}
```

staff:

```json
{
  "page": 1,
  "limit": 20,
  "studentId": 1
}
```

student:

```json
{
  "page": 1,
  "limit": 20,
  "studentId": 1
}
```

## POST /api/json/students/cv/search

Tải CV của sinh viên

Mặc định tải CV mới nhất. cvFileId để tải phiên bản cũ. QHDN chỉ xem sinh viên đã đăng ký OJT; sinh viên chỉ xem CV của mình.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| studentId | integer | Có | minimum=1 |  |
| cvFileId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 |  |

latest:

```json
{
  "studentId": 1
}
```

version:

```json
{
  "studentId": 1,
  "cvFileId": 1
}
```

## POST /api/json/students/detail

Hồ sơ học vụ tổng hợp

Kèm GPA, tín chỉ, điểm, combo và OJT; section=academicProgress chỉ lấy thông tin sinh viên và tiến độ, mặc định all.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| studentId | integer | Có | minimum=1 | ID: StudentID. |
| resultsPage | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 |  |
| resultsLimit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 |  |
| ojtPage | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 |  |
| ojtLimit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 |  |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID kỳ OJT. |
| section | string ∈ "all", "academicProgress" | Không / theo điều kiện nghiệp vụ | default="all" | all: hồ sơ đầy đủ; academicProgress: thông tin sinh viên và tiến độ học tập. |

## POST /api/json/students/eligibility-checks

Kiểm tra điều kiện OJT của sinh viên

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Có | minimum=1 | ID kỳ OJT. |
| studentId | integer | Có | minimum=1 | ID: StudentID. |

## POST /api/json/students/eligibility-checks/list

Lịch sử kiểm tra điều kiện OJT

 studentId chọn đối tượng truy xuất, FE phải nhập; bắt buộc khi đăng nhập vai trò STUDENT; vai trò quản trị có thể bỏ để xem toàn bộ. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| studentId | integer | Có | minimum=1; maximum=2147483647 | studentId chọn đối tượng truy xuất, FE phải nhập; bắt buộc khi đăng nhập vai trò STUDENT; vai trò quản trị có thể bỏ để xem toàn bộ. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này. |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID kỳ OJT. |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Số bản ghi mỗi trang. |

list:

```json
{
  "page": 1,
  "limit": 20,
  "studentId": 1
}
```

staff:

```json
{
  "page": 1,
  "limit": 20,
  "studentId": 1
}
```

student:

```json
{
  "page": 1,
  "limit": 20,
  "studentId": 1
}
```

## POST /api/json/students/eligibility/search

Kết quả OJT và điều kiện còn thiếu

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| studentId | integer | Có | minimum=1 | ID: StudentID. |
| ojtSemesterId | integer | Có | minimum=1 | ID kỳ OJT. |

## POST /api/json/students/export

Xuất danh sách sinh viên

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| search | string | Không / theo điều kiện nghiệp vụ | maxLength=100 |  |
| status | string | Không / theo điều kiện nghiệp vụ | maxLength=30 |  |
| programId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID phiên bản chương trình đào tạo. |
| cohortId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID khóa. |
| groupCode | string ∈ "A", "B", "C", "D" | Không / theo điều kiện nghiệp vụ |  |  |
| enrollmentYear | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID kỳ OJT. |
| currentSemester | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | Kỳ chuyên ngành hiện tại, tính từ lộ trình thực tế. |

## POST /api/json/students/interventions/list

Lịch sử hỗ trợ sinh viên

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| studentId | integer | Có | minimum=1; maximum=2147483647 | ID: StudentID. |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| status | string ∈ "PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED" | Không / theo điều kiện nghiệp vụ |  | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |

list:

```json
{
  "page": 1,
  "limit": 20,
  "studentId": 1
}
```

## POST /api/json/students/list

Tìm kiếm và lọc sinh viên

Mỗi bản ghi giữ ID và bổ sung thông tin liên quan để hiển thị; quan hệ không tồn tại trả null.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| search | string | Không / theo điều kiện nghiệp vụ |  | Bộ lọc search. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| status | string | Không / theo điều kiện nghiệp vụ |  | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| programId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID phiên bản chương trình đào tạo. |
| cohortId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID khóa. |
| groupCode | string | Không / theo điều kiện nghiệp vụ |  | Bộ lọc groupCode. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| enrollmentYear | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Bộ lọc enrollmentYear. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| currentSemester | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Kỳ chuyên ngành hiện tại, tính từ lộ trình thực tế. |

list:

```json
{
  "page": 1,
  "limit": 20
}
```

## POST /api/json/students/me/opportunities/list

Vị trí tuyển dụng và quyền ứng tuyển

Tin đã công bố còn hạn, kèm doanh nghiệp, yêu cầu, chỉ tiêu, hồ sơ đã ứng tuyển, canApply và lý do bị chặn. Dự báo AI không cấp quyền ứng tuyển. Mỗi bản ghi giữ ID và bổ sung thông tin liên quan để hiển thị; quan hệ không tồn tại trả null. studentId chọn đối tượng truy xuất, FE phải nhập; bắt buộc cho mọi vai trò. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Có | minimum=1 | ID ojtSemesterId dùng để chọn/lọc dữ liệu trong DB. Bắt buộc. |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Trang kết quả, mặc định 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Số bản ghi mỗi trang, tối đa 100. |
| studentId | integer | Có | minimum=1; maximum=2147483647 | studentId chọn đối tượng truy xuất, FE phải nhập; bắt buộc cho mọi vai trò. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này. |

list:

```json
{
  "page": 1,
  "limit": 20,
  "studentId": 1,
  "ojtSemesterId": 1
}
```

student:

```json
{
  "page": 1,
  "limit": 20,
  "ojtSemesterId": 1,
  "studentId": 1
}
```

## POST /api/majors

Tạo chuyên ngành

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| code | string | Có | maxLength=20 |  |
| name | string | Có | maxLength=200 |  |
| parentMajorId | integer | Có | minimum=1 | ID ngành cha (MajorID). |

## POST /api/ojt-coordinations

Giới thiệu sinh viên cho doanh nghiệp

Áp dụng cho hồ sơ đã bàn giao; cần lý do và lưu nhật ký.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| registrationId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 |  |
| positionId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID vị trí thực tập. |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |
| idempotencyKey | string | Có | maxLength=100 | Khóa chống trùng yêu cầu; dùng lại cùng khóa và dữ liệu khi gửi lại. |
| applicationId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Ứng tuyển của sinh viên tại đúng hồ sơ và vị trí; bỏ trống để tự tìm hồ sơ phù hợp. |

## POST /api/ojt-registration-windows

Tạo đợt đăng ký OJT

Mặc định dành cho kỳ chuyên ngành 5, tính theo lộ trình thực tế.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Có | minimum=1 | ID kỳ OJT. |
| name | string | Có | maxLength=150 |  |
| scope | object | Có |  | Phạm vi áp dụng; các bộ lọc kết hợp đồng thời. |
| scope.programIds | array<integer> | Không / theo điều kiện nghiệp vụ | minItems=1; uniqueItems=true | Danh sách ID phiên bản chương trình. |
| scope.cohortIds | array<integer> | Không / theo điều kiện nghiệp vụ | minItems=1; uniqueItems=true | Danh sách ID khóa. |
| scope.majorIds | array<integer> | Không / theo điều kiện nghiệp vụ | minItems=1; uniqueItems=true | Danh sách ID chuyên ngành. |
| scope.studentIds | array<integer> | Không / theo điều kiện nghiệp vụ | minItems=1; uniqueItems=true | Danh sách ID sinh viên. |
| scope.groupCodes | array<string ∈ "A", "B", "C", "D"> | Không / theo điều kiện nghiệp vụ | minItems=1; uniqueItems=true |  |
| startsAt | string | Có | format="date-time" |  |
| endsAt | string | Có | format="date-time" |  |
| reason | string | Không / theo điều kiện nghiệp vụ | maxLength=2000 | Lý do thực hiện. |
| academicPeriodId | integer | Có | minimum=1 | ID kỳ học hoặc Block 3. |
| requiredRelativeSemester | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=20; default=5 | Kỳ chuyên ngành cho phép đăng ký; mặc định 5. |

## POST /api/ojt-registrations

Nộp hồ sơ đăng ký OJT

Đăng ký tham gia OJT bằng JSON. CV tải riêng trong hồ sơ sinh viên; đăng ký OJT không phải ứng tuyển doanh nghiệp.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| windowId | integer | Có | minimum=1 | ID đợt đăng ký. |
| studentId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID hồ sơ sinh viên, khác ID tài khoản. |
| application | object | Không / theo điều kiện nghiệp vụ |  |  |
| application.contactPhone | string | Không / theo điều kiện nghiệp vụ | maxLength=30 |  |
| application.contactEmail | string | Không / theo điều kiện nghiệp vụ | format="email"; maxLength=100 |  |
| application.note | string | Không / theo điều kiện nghiệp vụ | maxLength=2000 |  |

## POST /api/ojt-rule-sets

Tạo bộ quy tắc OJT

Điều kiện: tối thiểu 70 tín chỉ và tối đa 2 môn còn nợ.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| programId | integer | Có | minimum=1 | ID phiên bản chương trình đào tạo. |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; nullable=true | ID kỳ OJT. |
| version | integer | Có | minimum=1 |  |
| name | string | Có | maxLength=200 |  |
| minCredits | number ∈ 70 | Không / theo điều kiện nghiệp vụ | default=70 |  |
| maxUnpassedCourses | integer ∈ 2 | Không / theo điều kiện nghiệp vụ | default=2 |  |
| debtBasis | string ∈ "FAILED_ATTEMPTS" | Không / theo điều kiện nghiệp vụ | default="FAILED_ATTEMPTS" |  |

## POST /api/recruitment/windows

Tạo đợt nhận nhu cầu tuyển dụng

Chọn học kỳ có sẵn và thời hạn nhận đơn; không tạo kỳ OJT riêng.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| academicPeriodId | integer | Có | minimum=1; maximum=2147483647 | ID kỳ học hoặc Block 3. |
| name | string | Có | maxLength=150 |  |
| startsAt | string | Có | format="date-time" |  |
| endsAt | string | Có | format="date-time" |  |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |

## GET /api/roles

Danh sách vai trò

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Không có request body.

## GET /api/student/curriculum

chương trình đã ban hành của mình

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Không có request body.

## POST /api/students/me/cv

Upload hoặc thay CV cá nhân

Sinh viên tải PDF tối đa 10 MB; không cần đăng ký OJT hoặc đợt mở đơn. Lưu file nhị phân trong DB, không nhận URL. Giữ phiên bản CV đã gắn ứng tuyển.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: multipart/form-data — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| cv | string | Có | format="binary" |  |
