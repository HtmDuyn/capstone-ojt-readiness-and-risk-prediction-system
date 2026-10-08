# Đầu vào API dành cho FE và test thủ công

Nguồn: OpenAPI hiện tại của backend. Tạo lại bằng `npm run docs:api` sau `npm run build`.
Phạm vi: 119 operations; 0 path parameters; 0 query parameters; 112 request bodies.


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
| GET /api/academic-years | POST /api/json/academic-years/search | page, limit, search, status |
| PATCH /api/academic-years/{id} | PATCH /api/json/academic-years | academicYearId (bắt buộc) |
| GET /api/academic-periods | POST /api/json/academic-periods/search | page, limit, search, status, academicYearId, kind |
| PATCH /api/academic-periods/{id} | PATCH /api/json/academic-periods | academicPeriodId (bắt buộc) |
| GET /api/ojt-semesters | POST /api/json/ojt-semesters/search | page, limit, search, status, academicYearId |
| PATCH /api/ojt-semesters/{id} | PATCH /api/json/ojt-semesters | ojtSemesterId (bắt buộc) |
| GET /api/cohorts | POST /api/json/cohorts/search | page, limit, search, status |
| PATCH /api/cohorts/{id} | PATCH /api/json/cohorts | cohortId (bắt buộc) |
| PATCH /api/students/{id}/academic-placement | PATCH /api/json/students/academic-placement | studentId (bắt buộc) |
| GET /api/academic-periods/{id}/combo-phase-schedules | POST /api/json/academic-periods/combo-phase-schedules/search | academicPeriodId (bắt buộc) |
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
| GET /api/academic/dashboard | POST /api/json/academic/dashboard/search | ojtSemesterId (bắt buộc), programId, cohortId, majorId, comboId, groupCode, academicPeriodId, assessmentDeadline |
| GET /api/academic/eligibility-statistics | POST /api/json/academic/eligibility-statistics/search | ojtSemesterId (bắt buộc), programId, cohortId, majorId, comboId, groupCode, academicPeriodId, assessmentDeadline, groupBy |
| GET /api/academic/alerts | POST /api/json/academic/alerts/search | ojtSemesterId (bắt buộc), programId, cohortId, majorId, comboId, groupCode, academicPeriodId (bắt buộc), assessmentDeadline (bắt buộc), type, page, limit |
| GET /api/academic/course-demand | POST /api/json/academic/course-demand/search | ojtSemesterId (bắt buộc), programId, cohortId, majorId, comboId, groupCode, academicPeriodId (bắt buộc), assessmentDeadline, courseId, includeInProgress, page, limit |
| GET /api/academic/course-demand/export | POST /api/json/academic/course-demand/export | ojtSemesterId (bắt buộc), programId, cohortId, majorId, comboId, groupCode, academicPeriodId (bắt buộc), assessmentDeadline, courseId, includeInProgress, format |
| GET /api/accounts | POST /api/json/accounts/search | page, limit, search, roleCode, status |
| GET /api/accounts/{userId} | POST /api/json/accounts/detail | userId (bắt buộc) |
| PUT /api/accounts/{userId} | PUT /api/json/accounts | userId (bắt buộc) |
| PATCH /api/accounts/{userId}/status | PATCH /api/json/accounts/status | userId (bắt buộc) |
| PATCH /api/accounts/{userId}/role | PATCH /api/json/accounts/role | userId (bắt buộc) |
| GET /api/combo-registration-windows | POST /api/json/combo-registration-windows/search | page, limit, phase, status, academicPeriodId |
| PATCH /api/combo-registration-windows/{id} | PATCH /api/json/combo-registration-windows | windowId (bắt buộc) |
| POST /api/combo-registration-windows/{id}/open | POST /api/json/combo-registration-windows/open | windowId (bắt buộc) |
| POST /api/combo-registration-windows/{id}/close | POST /api/json/combo-registration-windows/close | windowId (bắt buộc) |
| POST /api/combo-registration-windows/{id}/extensions | POST /api/json/combo-registration-windows/extensions | windowId (bắt buộc) |
| GET /api/combo-registration-windows/{id}/selections | POST /api/json/combo-registration-windows/selections/search | windowId (bắt buộc), page, limit, status |
| POST /api/combo-registration-windows/{id}/selections | POST /api/json/combo-registration-windows/selections | windowId (bắt buộc) |
| POST /api/combo-registration-windows/{id}/reminders | POST /api/json/combo-registration-windows/reminders | windowId (bắt buộc) |
| GET /api/students/{id}/combo-selections | POST /api/json/students/combo-selections/search | studentId (bắt buộc), page, limit |
| POST /api/combo-registration-windows/{id}/finalize | POST /api/json/combo-registration-windows/finalize | windowId (bắt buộc) |
| GET /api/majors | POST /api/json/majors/search | page, limit, search, parentMajorId |
| GET /api/courses | POST /api/json/courses/search | page, limit, search |
| GET /api/curricula | POST /api/json/curricula/search | page, limit, search, majorId, status, version |
| PATCH /api/courses/{id} | PATCH /api/json/courses | courseId (bắt buộc) |
| GET /api/curricula/{id} | POST /api/json/curricula/detail | programId (bắt buộc) |
| PATCH /api/curricula/{id} | PATCH /api/json/curricula | programId (bắt buộc) |
| PUT /api/curricula/{id}/courses | PUT /api/json/curricula/courses | programId (bắt buộc) |
| PUT /api/curricula/{id}/prerequisites | PUT /api/json/curricula/prerequisites | programId (bắt buộc) |
| PUT /api/curricula/{id}/course-equivalences | PUT /api/json/curricula/course-equivalences | programId (bắt buộc) |
| GET /api/curricula/{id}/combos | POST /api/json/curricula/combos/search | programId (bắt buộc) |
| POST /api/curricula/{id}/combos | POST /api/json/curricula/combos | programId (bắt buộc) |
| PUT /api/combos/{id}/courses | PUT /api/json/combos/courses | comboId (bắt buộc) |
| POST /api/curricula/{id}/publish | POST /api/json/curricula/publish | programId (bắt buộc) |
| GET /api/ojt-rule-sets | POST /api/json/ojt-rule-sets/search | programId, ojtSemesterId, status, page, limit |
| PATCH /api/ojt-rule-sets/{id} | PATCH /api/json/ojt-rule-sets | ruleSetId (bắt buộc) |
| POST /api/ojt-rule-sets/{id}/publish | POST /api/json/ojt-rule-sets/publish | ruleSetId (bắt buộc) |
| GET /api/students/{id}/eligibility-checks | POST /api/json/students/eligibility-checks/search | studentId (bắt buộc), ojtSemesterId, page, limit |
| POST /api/students/{id}/eligibility-checks | POST /api/json/students/eligibility-checks | studentId (bắt buộc) |
| GET /api/students/{id}/eligibility | POST /api/json/students/eligibility/search | studentId (bắt buộc), ojtSemesterId (bắt buộc) |
| POST /api/eligibility-checks/{id}/confirm | POST /api/json/eligibility-checks/confirm | checkId (bắt buộc) |
| GET /api/eligibility-check-runs/{id} | POST /api/json/eligibility-check-runs/detail | runId (bắt buộc), page, limit |
| POST /api/imports/emails/{emailId}/retry | POST /api/json/imports/emails/retry | emailId (bắt buộc) |
| GET /api/ojt-registration-windows | POST /api/json/ojt-registration-windows/search | ojtSemesterId, status, page, limit |
| PATCH /api/ojt-registration-windows/{id} | PATCH /api/json/ojt-registration-windows | windowId (bắt buộc) |
| POST /api/ojt-registration-windows/{id}/open | POST /api/json/ojt-registration-windows/open | windowId (bắt buộc) |
| POST /api/ojt-registration-windows/{id}/close | POST /api/json/ojt-registration-windows/close | windowId (bắt buộc) |
| GET /api/ojt-registrations | POST /api/json/ojt-registrations/search | ojtSemesterId, windowId, studentId, programId, cohortId, groupCode, status, search, page, limit |
| GET /api/ojt-registrations/{id} | POST /api/json/ojt-registrations/detail | registrationId (bắt buộc) |
| POST /api/ojt-registrations/{id}/review | POST /api/json/ojt-registrations/review | registrationId (bắt buộc) |
| GET /api/ojt-semesters/{id}/eligible-student-handoffs | POST /api/json/ojt-semesters/eligible-student-handoffs/search | ojtSemesterId (bắt buộc), page, limit |
| POST /api/ojt-semesters/{id}/eligible-student-handoffs | POST /api/json/ojt-semesters/eligible-student-handoffs | ojtSemesterId (bắt buộc) |
| GET /api/ojt-semesters/{id}/students | POST /api/json/ojt-semesters/students/search | ojtSemesterId (bắt buộc), programId, cohortId, groupCode, registrationStatus, search, page, limit |
| GET /api/ojt-results | POST /api/json/ojt-results/search | status, ojtSemesterId, studentId, search, page, limit |
| GET /api/ojt-results/{id} | POST /api/json/ojt-results/detail | resultId (bắt buộc) |
| PATCH /api/ojt-results/{id} | PATCH /api/json/ojt-results | resultId (bắt buộc) |
| POST /api/ojt-results/{id}/revision-requests | POST /api/json/ojt-results/revision-requests | resultId (bắt buộc) |
| POST /api/ojt-results/{id}/transfer | POST /api/json/ojt-results/transfer | resultId (bắt buộc) |
| POST /api/ojt-results/{id}/confirm | POST /api/json/ojt-results/confirm | resultId (bắt buộc) |
| GET /api/ojt-semesters/{id}/results/export | POST /api/json/ojt-semesters/results/export | ojtSemesterId (bắt buộc), status, ojtSemesterId, studentId, search, format |
| GET /api/students | POST /api/json/students/search | page, limit, search, status, programId, cohortId, groupCode, enrollmentYear, currentSemester |
| GET /api/students/{id} | POST /api/json/students/detail | studentId (bắt buộc) |
| PATCH /api/students/{id} | PATCH /api/json/students | studentId (bắt buộc) |
| GET /api/students/{id}/course-results | POST /api/json/students/course-results/search | studentId (bắt buộc), page, limit, courseId, academicPeriodId, status |
| GET /api/students/{id}/academic-progress | POST /api/json/students/academic-progress/search | studentId (bắt buộc) |
| PATCH /api/course-results/{id} | PATCH /api/json/course-results | courseResultId (bắt buộc) |
| GET /api/academic-imports | POST /api/json/academic-imports/search | page, limit, kind, status |
| GET /api/academic-imports/{id} | POST /api/json/academic-imports/detail | importId (bắt buộc), page, limit |

## POST /api/academic-periods

Tạo kỳ học và Block 3

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

## GET /api/accounts/me/profile

Xem hồ sơ cá nhân

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Không có request body.

## PATCH /api/accounts/me/profile

Cập nhật hồ sơ cá nhân

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| fullName | string | Không / theo điều kiện nghiệp vụ |  |  |
| phone | string | Không / theo điều kiện nghiệp vụ | nullable=true |  |

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

## POST /api/auth/logout

Đăng xuất

Ứng dụng cần xóa token đã lưu.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Không có request body.

## GET /api/auth/me

Xem tài khoản đang đăng nhập

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

## POST /api/course-result-imports/commit

Nhập kết quả học tập

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| idempotencyKey | string | Có | maxLength=100 | Khóa chống trùng yêu cầu; dùng lại cùng khóa và dữ liệu khi gửi lại. |
| sourceName | string | Không / theo điều kiện nghiệp vụ | maxLength=150; nullable=true |  |
| rows | array<object> | Có | minItems=1; maxItems=1000 |  |
| rows[].studentCode | string | Có | maxLength=20 | Mã sinh viên. |
| rows[].courseCode | string | Có | maxLength=20 | Mã môn học. |
| rows[].academicPeriodId | integer | Có | minimum=1 | ID kỳ học hoặc Block 3. |
| rows[].attemptNumber | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=1 | Lần học, từ 1 đến 100. |
| rows[].status | string ∈ "PASSED", "FAILED", "IN_PROGRESS", "WITHDRAWN", "RECOGNIZED" | Có |  |  |
| rows[].score | number | Không / theo điều kiện nghiệp vụ | minimum=0; maximum=10; nullable=true |  |
| rows[].gradePoints | number | Không / theo điều kiện nghiệp vụ | minimum=0; maximum=4; nullable=true | Điểm quy đổi theo thang 4. |
| rows[].grade | string | Không / theo điều kiện nghiệp vụ | maxLength=2; nullable=true |  |
| rows[].sourceReference | string | Không / theo điều kiện nghiệp vụ | maxLength=200; nullable=true |  |

## POST /api/course-result-imports/preview

Kiểm tra dữ liệu nhập kết quả học tập

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| idempotencyKey | string | Có | maxLength=100 | Khóa chống trùng yêu cầu; dùng lại cùng khóa và dữ liệu khi gửi lại. |
| sourceName | string | Không / theo điều kiện nghiệp vụ | maxLength=150; nullable=true |  |
| rows | array<object> | Có | minItems=1; maxItems=1000 |  |
| rows[].studentCode | string | Có | maxLength=20 | Mã sinh viên. |
| rows[].courseCode | string | Có | maxLength=20 | Mã môn học. |
| rows[].academicPeriodId | integer | Có | minimum=1 | ID kỳ học hoặc Block 3. |
| rows[].attemptNumber | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=1 | Lần học, từ 1 đến 100. |
| rows[].status | string ∈ "PASSED", "FAILED", "IN_PROGRESS", "WITHDRAWN", "RECOGNIZED" | Có |  |  |
| rows[].score | number | Không / theo điều kiện nghiệp vụ | minimum=0; maximum=10; nullable=true |  |
| rows[].gradePoints | number | Không / theo điều kiện nghiệp vụ | minimum=0; maximum=4; nullable=true | Điểm quy đổi theo thang 4. |
| rows[].grade | string | Không / theo điều kiện nghiệp vụ | maxLength=2; nullable=true |  |
| rows[].sourceReference | string | Không / theo điều kiện nghiệp vụ | maxLength=200; nullable=true |  |

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

## POST /api/curricula

Tạo phiên bản chương trình

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| code | string | Có | maxLength=100 |  |
| name | string | Có | maxLength=200 |  |
| version | string | Có | maxLength=10 |  |
| majorId | integer | Có | minimum=1 | ID chuyên ngành (SpecializationID). |
| totalCredits | number | Có | minimum=0; maximum=9999.99 |  |
| effectiveYear | integer | Có | minimum=1900; maximum=2200 |  |
| gpaScale | integer ∈ 4, 10 | Có |  |  |

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

Nhập sinh viên hoặc doanh nghiệp

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| kind | string ∈ "STUDENT", "ENTERPRISE" | Có |  |  |
| idempotencyKey | string | Có | maxLength=100 | Khóa chống trùng yêu cầu; dùng lại cùng khóa và dữ liệu khi gửi lại. |
| semesterId | integer | Không / theo điều kiện nghiệp vụ |  | ID kỳ OJT. |
| rows | array<object> | Có | minItems=1; maxItems=500 |  |
| rows[].code | string | Có | maxLength=20 |  |
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

student:

```json
{
  "kind": "STUDENT",
  "idempotencyKey": "manual-student-import-001",
  "rows": [
    {
      "code": "SV-MANUAL-001",
      "email": "student@example.invalid",
      "fullName": "Sinh viên mẫu"
    }
  ]
}
```

enterprise:

```json
{
  "kind": "ENTERPRISE",
  "idempotencyKey": "manual-enterprise-import-001",
  "semesterId": 1,
  "rows": [
    {
      "code": "DN-MANUAL-001",
      "email": "hr@example.invalid",
      "fullName": "Người phụ trách",
      "name": "Doanh nghiệp mẫu",
      "address": "TP. Hồ Chí Minh",
      "positions": [
        {
          "code": "DEV-001",
          "title": "Thực tập lập trình",
          "description": "Mô tả công việc",
          "requirements": "Yêu cầu tuyển dụng",
          "capacity": 5
        }
      ]
    }
  ]
}
```

## GET /api/imports/emails

Trạng thái gửi email tài khoản

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Không có request body.

## POST /api/imports/preview

Kiểm tra dữ liệu nhập sinh viên hoặc doanh nghiệp

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| kind | string ∈ "STUDENT", "ENTERPRISE" | Có |  |  |
| idempotencyKey | string | Có | maxLength=100 | Khóa chống trùng yêu cầu; dùng lại cùng khóa và dữ liệu khi gửi lại. |
| semesterId | integer | Không / theo điều kiện nghiệp vụ |  | ID kỳ OJT. |
| rows | array<object> | Có | minItems=1; maxItems=500 |  |
| rows[].code | string | Có | maxLength=20 |  |
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

student:

```json
{
  "kind": "STUDENT",
  "idempotencyKey": "manual-student-import-001",
  "rows": [
    {
      "code": "SV-MANUAL-001",
      "email": "student@example.invalid",
      "fullName": "Sinh viên mẫu"
    }
  ]
}
```

enterprise:

```json
{
  "kind": "ENTERPRISE",
  "idempotencyKey": "manual-enterprise-import-001",
  "semesterId": 1,
  "rows": [
    {
      "code": "DN-MANUAL-001",
      "email": "hr@example.invalid",
      "fullName": "Người phụ trách",
      "name": "Doanh nghiệp mẫu",
      "address": "TP. Hồ Chí Minh",
      "positions": [
        {
          "code": "DEV-001",
          "title": "Thực tập lập trình",
          "description": "Mô tả công việc",
          "requirements": "Yêu cầu tuyển dụng",
          "capacity": 5
        }
      ]
    }
  ]
}
```

## POST /api/json/academic-imports/detail

Chi tiết và lỗi nhập dữ liệu học vụ

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| importId | string | Có | pattern="^[1-9][0-9]*$" | ID: BatchID trong AcademicImportBatches. |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |

## POST /api/json/academic-imports/search

Lịch sử nhập dữ liệu học vụ

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| kind | string ∈ "STUDENT", "COURSE_RESULT", "CURRICULUM" | Không / theo điều kiện nghiệp vụ |  |  |
| status | string ∈ "COMPLETED", "REJECTED", "FAILED" | Không / theo điều kiện nghiệp vụ |  |  |

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

## POST /api/json/academic-periods/combo-phase-schedules/search

Xem mốc chọn và xác nhận combo

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| academicPeriodId | integer | Có | minimum=1 | ID: AcademicPeriodID. |

## POST /api/json/academic-periods/search

Danh sách kỳ học và Block 3

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| search | string | Không / theo điều kiện nghiệp vụ | maxLength=100 |  |
| status | string ∈ "PLANNED", "ACTIVE", "CLOSED", "ARCHIVED" | Không / theo điều kiện nghiệp vụ |  |  |
| academicYearId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID năm học. |
| kind | string ∈ "SEMESTER", "BLOCK3" | Không / theo điều kiện nghiệp vụ |  |  |

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

## POST /api/json/academic-years/search

Danh sách năm học

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| search | string | Không / theo điều kiện nghiệp vụ | maxLength=100 |  |
| status | string ∈ "PLANNED", "ACTIVE", "CLOSED", "ARCHIVED" | Không / theo điều kiện nghiệp vụ |  |  |

## POST /api/json/academic/alerts/search

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
| groupCode | string | Không / theo điều kiện nghiệp vụ |  |  |
| academicPeriodId | integer | Có | minimum=1 | ID kỳ học hoặc Block 3. |
| assessmentDeadline | string | Có | format="date-time" | Hạn xét điều kiện, gồm múi giờ. |
| type | string | Không / theo điều kiện nghiệp vụ |  |  |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Số bản ghi mỗi trang. |

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

## POST /api/json/academic/course-demand/search

Thống kê nhu cầu học môn còn thiếu

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
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Số bản ghi mỗi trang. |

## POST /api/json/academic/dashboard/search

Tổng quan điều kiện OJT

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

## POST /api/json/academic/eligibility-statistics/search

Thống kê điều kiện theo khóa, nhóm, chuyên ngành và combo

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
| groupBy | string | Không / theo điều kiện nghiệp vụ |  |  |

## PUT /api/json/accounts

Cập nhật tài khoản

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| fullName | string | Không / theo điều kiện nghiệp vụ |  |  |
| phone | string | Không / theo điều kiện nghiệp vụ | nullable=true |  |
| email | string | Không / theo điều kiện nghiệp vụ | format="email" | ADMIN only |
| userId | integer | Có |  | ID tài khoản. |

## POST /api/json/accounts/detail

Chi tiết tài khoản

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| userId | integer | Có |  | ID tài khoản. |

## PATCH /api/json/accounts/role

Cập nhật vai trò tài khoản

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| roleId | integer | Có |  | ID vai trò. |
| userId | integer | Có |  | ID tài khoản. |

## POST /api/json/accounts/search

Danh sách tài khoản

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| page | integer | Không / theo điều kiện nghiệp vụ | default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | default=20 | Số bản ghi mỗi trang. |
| search | string | Không / theo điều kiện nghiệp vụ |  |  |
| roleCode | string ∈ "ADMIN", "ACADEMIC", "OJT_COORD", "STUDENT", "ENTERPRISE" | Không / theo điều kiện nghiệp vụ |  |  |
| status | string ∈ "ACTIVE", "LOCKED", "INACTIVE" | Không / theo điều kiện nghiệp vụ |  |  |

## PATCH /api/json/accounts/status

Cập nhật trạng thái tài khoản

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| status | string ∈ "ACTIVE", "LOCKED", "INACTIVE" | Có |  |  |
| userId | integer | Có |  | ID tài khoản. |

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

## POST /api/json/cohorts/search

Danh sách khóa và nhóm

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| search | string | Không / theo điều kiện nghiệp vụ | maxLength=100 |  |
| status | string ∈ "PLANNED", "ACTIVE", "CLOSED", "ARCHIVED" | Không / theo điều kiện nghiệp vụ |  |  |

## PATCH /api/json/combo-registration-windows

Cập nhật đợt chọn combo

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
| windowId | integer | Có | minimum=1 | ID: WindowID trong ComboRegistrationWindows. |

## POST /api/json/combo-registration-windows/close

Đóng đợt chọn combo

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |
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

## POST /api/json/combo-registration-windows/open

Mở đợt chọn combo

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |
| windowId | integer | Có | minimum=1 | ID: WindowID trong ComboRegistrationWindows. |

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

## POST /api/json/combo-registration-windows/search

Danh sách đợt chọn combo

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| phase | string ∈ "INITIAL", "CONFIRMATION" | Không / theo điều kiện nghiệp vụ |  |  |
| status | string ∈ "DRAFT", "OPEN", "CLOSED", "FINALIZED" | Không / theo điều kiện nghiệp vụ |  |  |
| academicPeriodId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID kỳ học hoặc Block 3. |

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

## POST /api/json/combo-registration-windows/selections/search

Theo dõi lựa chọn combo

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| windowId | integer | Có | minimum=1 | ID: WindowID trong ComboRegistrationWindows. |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| status | string ∈ "SUBMITTED", "MISSING", "APPLIED", "UNSELECTED" | Không / theo điều kiện nghiệp vụ |  |  |

## PUT /api/json/combos/courses

Thiết lập môn thuộc combo

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| courses | array<object> | Có | maxItems=500 |  |
| courses[].courseId | integer | Theo lựa chọn oneOf | minimum=1 | ID môn học (CourseID). |
| courses[].courseCode | string | Theo lựa chọn oneOf | maxLength=20 | Mã môn học. |
| courses[].credits | number | Có | minimum=0; maximum=9999.99 |  |
| courses[].semester | integer | Có | minimum=0; maximum=20 |  |
| courses[].prerequisiteText | string | Không / theo điều kiện nghiệp vụ | maxLength=10000; nullable=true |  |
| courses[].note | string | Không / theo điều kiện nghiệp vụ | maxLength=2000; nullable=true |  |
| courses[].slotCourseIds | array<integer> | Có | maxItems=100 | Danh sách ID môn trong khung chương trình. |
| choiceGroups | array<object> | Có | maxItems=500 |  |
| choiceGroups[].code | string | Có | maxLength=50 |  |
| choiceGroups[].minCourses | integer | Có | minimum=0 |  |
| choiceGroups[].maxCourses | integer | Có | minimum=0 |  |
| choiceGroups[].courseIds | array<integer> | Có | maxItems=500 | Danh sách ID môn học. |
| comboId | integer | Có | minimum=1 | ID: ProgramComboID. |

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

## POST /api/json/courses/search

Danh sách môn học

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| search | string | Không / theo điều kiện nghiệp vụ | maxLength=100 |  |

## PATCH /api/json/curricula

Cập nhật phiên bản chương trình

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| code | string | Không / theo điều kiện nghiệp vụ | maxLength=100 |  |
| name | string | Không / theo điều kiện nghiệp vụ | maxLength=200 |  |
| version | string | Không / theo điều kiện nghiệp vụ | maxLength=10 |  |
| majorId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID chuyên ngành (SpecializationID). |
| totalCredits | number | Không / theo điều kiện nghiệp vụ | minimum=0; maximum=9999.99 |  |
| effectiveYear | integer | Không / theo điều kiện nghiệp vụ | minimum=1900; maximum=2200 |  |
| gpaScale | integer ∈ 4, 10 | Không / theo điều kiện nghiệp vụ |  |  |
| programId | integer | Có | minimum=1 | ID: ProgramID. |

## POST /api/json/curricula/combos

Tạo combo

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| code | string | Có | maxLength=50 |  |
| name | string | Có | maxLength=200 |  |
| selectionGroup | string | Không / theo điều kiện nghiệp vụ | maxLength=50; nullable=true |  |
| note | string | Không / theo điều kiện nghiệp vụ | maxLength=2000; nullable=true |  |
| programId | integer | Có | minimum=1 | ID: ProgramID. |

## POST /api/json/curricula/combos/search

Danh sách combo của chương trình

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| programId | integer | Có | minimum=1 | ID: ProgramID. |

## PUT /api/json/curricula/course-equivalences

Thiết lập công nhận và tương đương môn

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| equivalences | array<object> | Có | maxItems=500 |  |
| equivalences[].sourceCourseId | integer | Có | minimum=1 | ID môn nguồn. |
| equivalences[].targetCourseId | integer | Có | minimum=1 | ID môn đích. |
| equivalences[].reason | string | Có | maxLength=2000 | Lý do thực hiện. |
| programId | integer | Có | minimum=1 | ID: ProgramID. |

## PUT /api/json/curricula/courses

Thiết lập môn, tín chỉ và kỳ học

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| courses | array<object> | Có | maxItems=500 |  |
| courses[].courseId | integer | Theo lựa chọn oneOf | minimum=1 | ID môn học (CourseID). |
| courses[].courseCode | string | Theo lựa chọn oneOf | maxLength=20 | Mã môn học. |
| courses[].credits | number | Có | minimum=0; maximum=9999.99 |  |
| courses[].semester | integer | Có | minimum=0; maximum=20 |  |
| courses[].isRequired | boolean | Có |  | Môn bắt buộc. |
| courses[].entryKind | string ∈ "COURSE", "COMBO_SLOT", "ELECTIVE_SLOT" | Không / theo điều kiện nghiệp vụ | default="COURSE" |  |
| courses[].prerequisiteText | string | Không / theo điều kiện nghiệp vụ | maxLength=10000; nullable=true |  |
| programId | integer | Có | minimum=1 | ID: ProgramID. |

## POST /api/json/curricula/detail

Chi tiết chương trình đào tạo

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| programId | integer | Có | minimum=1 | ID: ProgramID. |

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

## PUT /api/json/curricula/prerequisites

Thiết lập môn tiên quyết

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| prerequisites | array<object> | Có | maxItems=1000 |  |
| prerequisites[].courseId | integer | Có | minimum=1 | ID môn học (CourseID). |
| prerequisites[].groupCode | string | Có | maxLength=50 |  |
| prerequisites[].minimumPassed | integer | Có | minimum=1 |  |
| prerequisites[].prerequisiteCourseIds | array<integer> | Có | maxItems=500 | Danh sách ID môn tiên quyết. |
| programId | integer | Có | minimum=1 | ID: ProgramID. |

## POST /api/json/curricula/publish

Ban hành phiên bản chương trình

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |
| programId | integer | Có | minimum=1 | ID: ProgramID. |

## POST /api/json/curricula/search

Danh sách chương trình đào tạo

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| search | string | Không / theo điều kiện nghiệp vụ | maxLength=100 |  |
| majorId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID chuyên ngành (SpecializationID). |
| status | string ∈ "DRAFT", "PUBLISHED" | Không / theo điều kiện nghiệp vụ |  |  |
| version | string | Không / theo điều kiện nghiệp vụ | maxLength=10 |  |

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

## POST /api/json/imports/emails/retry

Gửi lại email bị lỗi

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| emailId | integer | Có |  | ID email lỗi còn hiệu lực. |

## POST /api/json/majors/search

Danh sách chuyên ngành

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| search | string | Không / theo điều kiện nghiệp vụ | maxLength=100 |  |
| parentMajorId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID ngành cha (MajorID). |

## PATCH /api/json/ojt-registration-windows

Cập nhật đợt đăng ký OJT

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
| windowId | integer | Có | minimum=1 | ID: WindowID trong OJTRegistrationWindows. |

## POST /api/json/ojt-registration-windows/close

Đóng đợt đăng ký OJT

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |
| windowId | integer | Có | minimum=1 | ID: WindowID trong OJTRegistrationWindows. |

## POST /api/json/ojt-registration-windows/open

Mở đợt đăng ký OJT

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |
| windowId | integer | Có | minimum=1 | ID: WindowID trong OJTRegistrationWindows. |

## POST /api/json/ojt-registration-windows/search

Danh sách đợt đăng ký OJT

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID kỳ OJT. |
| status | string | Không / theo điều kiện nghiệp vụ |  |  |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Số bản ghi mỗi trang. |

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

## POST /api/json/ojt-registrations/detail

Chi tiết hồ sơ đăng ký OJT

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| registrationId | integer | Có | minimum=1 | ID: RegistrationID. |

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

## POST /api/json/ojt-registrations/search

Danh sách hồ sơ đăng ký OJT

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID kỳ OJT. |
| windowId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID đợt đăng ký. |
| studentId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID hồ sơ sinh viên, khác ID tài khoản. |
| programId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID phiên bản chương trình đào tạo. |
| cohortId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID khóa. |
| groupCode | string | Không / theo điều kiện nghiệp vụ |  |  |
| status | string | Không / theo điều kiện nghiệp vụ |  |  |
| search | string | Không / theo điều kiện nghiệp vụ |  |  |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Số bản ghi mỗi trang. |

## PATCH /api/json/ojt-results

Cập nhật điểm và kết quả OJT chính thức

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| expectedVersion | integer | Có | minimum=1 | Phiên bản hiện tại của kết quả; sai phiên bản trả 409. |
| reason | string | Có | minLength=1; maxLength=2000 | Lý do thực hiện. |
| officialScore | number | Có | minimum=0; maximum=10 |  |
| outcome | string ∈ "PASSED", "FAILED" | Có |  |  |
| academicNote | string | Không / theo điều kiện nghiệp vụ | maxLength=5000; nullable=true |  |
| resultId | integer | Có | minimum=1 | ID: ResultID trong OJTResults. |

## POST /api/json/ojt-results/confirm

Xác nhận kết quả OJT

Ghi nhận kết quả môn học và trạng thái thực tập theo cấu hình quy đổi điểm.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| expectedVersion | integer | Có | minimum=1 | Phiên bản hiện tại của kết quả; sai phiên bản trả 409. |
| reason | string | Có | minLength=1; maxLength=2000 | Lý do thực hiện. |
| resultId | integer | Có | minimum=1 | ID: ResultID trong OJTResults. |

## POST /api/json/ojt-results/detail

Chi tiết đánh giá và hồ sơ OJT

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| resultId | integer | Có | minimum=1 | ID: ResultID trong OJTResults. |

## POST /api/json/ojt-results/revision-requests

Yêu cầu bổ sung hồ sơ kết quả OJT

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| expectedVersion | integer | Có | minimum=1 | Phiên bản hiện tại của kết quả; sai phiên bản trả 409. |
| reason | string | Có | minLength=1; maxLength=2000 | Lý do thực hiện. |
| resultId | integer | Có | minimum=1 | ID: ResultID trong OJTResults. |

## POST /api/json/ojt-results/search

Danh sách kết quả OJT đã chuyển

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| status | string ∈ "PENDING_ACADEMIC_CONFIRMATION", "REVISION_REQUESTED", "CONFIRMED" | Không / theo điều kiện nghiệp vụ |  |  |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID kỳ OJT. |
| studentId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID hồ sơ sinh viên, khác ID tài khoản. |
| search | string | Không / theo điều kiện nghiệp vụ | maxLength=100 |  |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100 | Số bản ghi mỗi trang. |

## POST /api/json/ojt-results/transfer

Gửi lại hồ sơ OJT đã bổ sung

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| expectedVersion | integer | Có | minimum=1 | Phiên bản hiện tại của kết quả; sai phiên bản trả 409. |
| reason | string | Có | minLength=1; maxLength=2000 | Lý do thực hiện. |
| dossier | object | Có |  |  |
| dossier.summary | string | Có | minLength=1; maxLength=5000 |  |
| dossier.documents | array<object> | Có | minItems=1; maxItems=20 |  |
| dossier.documents[].name | string | Có | minLength=1; maxLength=200 |  |
| dossier.documents[].url | string | Có | format="uri"; maxLength=2000 |  |
| idempotencyKey | string | Có | minLength=1; maxLength=100 | Khóa chống trùng yêu cầu; dùng lại cùng khóa và dữ liệu khi gửi lại. |
| resultId | integer | Có | minimum=1 | ID: ResultID trong OJTResults. |

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

## POST /api/json/ojt-rule-sets/publish

Ban hành bộ quy tắc OJT

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ruleSetId | integer | Có | minimum=1 | ID: RuleSetID. |

## POST /api/json/ojt-rule-sets/search

Danh sách bộ quy tắc OJT

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| programId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID phiên bản chương trình đào tạo. |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID kỳ OJT. |
| status | string | Không / theo điều kiện nghiệp vụ |  |  |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Số bản ghi mỗi trang. |

## PATCH /api/json/ojt-semesters

Cập nhật kỳ OJT

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| academicYearId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID năm học. |
| semesterCode | string | Không / theo điều kiện nghiệp vụ | maxLength=20 |  |
| name | string | Không / theo điều kiện nghiệp vụ | maxLength=100 |  |
| academicPeriodId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647; nullable=true | ID kỳ học hoặc Block 3. |
| startDate | string | Không / theo điều kiện nghiệp vụ | format="date" |  |
| endDate | string | Không / theo điều kiện nghiệp vụ | format="date" |  |
| regStartDate | string | Không / theo điều kiện nghiệp vụ | format="date"; nullable=true |  |
| regEndDate | string | Không / theo điều kiện nghiệp vụ | format="date"; nullable=true |  |
| status | string ∈ "PLANNED", "ACTIVE", "CLOSED", "ARCHIVED" | Không / theo điều kiện nghiệp vụ |  |  |
| ojtSemesterId | integer | Có | minimum=1; maximum=2147483647 | ID: OJTSemesterID. |

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

## POST /api/json/ojt-semesters/eligible-student-handoffs/search

Lịch sử bàn giao sinh viên cho QHDN

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Có | minimum=1 | ID: OJTSemesterID. |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Số bản ghi mỗi trang. |

## POST /api/json/ojt-semesters/results/export

Xuất báo cáo kết quả OJT theo kỳ

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Có | minimum=1 | ID kỳ OJT. |
| status | string ∈ "PENDING_ACADEMIC_CONFIRMATION", "REVISION_REQUESTED", "CONFIRMED" | Không / theo điều kiện nghiệp vụ |  |  |
| studentId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID hồ sơ sinh viên, khác ID tài khoản. |
| search | string | Không / theo điều kiện nghiệp vụ | maxLength=100 |  |
| format | string ∈ "csv", "json" | Không / theo điều kiện nghiệp vụ | default="csv" |  |

## POST /api/json/ojt-semesters/search

Danh sách kỳ OJT

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| search | string | Không / theo điều kiện nghiệp vụ | maxLength=100 |  |
| status | string ∈ "PLANNED", "ACTIVE", "CLOSED", "ARCHIVED" | Không / theo điều kiện nghiệp vụ |  |  |
| academicYearId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID năm học. |

## POST /api/json/ojt-semesters/students/search

Theo dõi trạng thái OJT theo kỳ

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Có | minimum=1 | ID: OJTSemesterID. |
| programId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID phiên bản chương trình đào tạo. |
| cohortId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID khóa. |
| groupCode | string | Không / theo điều kiện nghiệp vụ |  |  |
| registrationStatus | string | Không / theo điều kiện nghiệp vụ |  |  |
| search | string | Không / theo điều kiện nghiệp vụ |  |  |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Số bản ghi mỗi trang. |

## PATCH /api/json/students

Cập nhật hồ sơ học vụ

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
| studentId | integer | Có | minimum=1 | ID: StudentID. |

## PATCH /api/json/students/academic-placement

Gán lộ trình học cho sinh viên

Lần đầu cần khóa, nhóm và kỳ hiện tại. Kỳ chuyên ngành tính từ kỳ vào thực tế; Block 3 không tăng số kỳ.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| cohortId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID khóa. |
| groupCode | string ∈ "A", "B", "C", "D" | Không / theo điều kiện nghiệp vụ |  |  |
| entryAcademicPeriodId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID kỳ bắt đầu chuyên ngành thực tế; mặc định theo khóa/nhóm. |
| currentAcademicPeriodId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID kỳ/Block đang học; bắt buộc khi gán lần đầu. |
| programId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID phiên bản chương trình đào tạo. |
| reason | string | Có | maxLength=1000 | Lý do thực hiện. |
| studentId | integer | Có | minimum=1; maximum=2147483647 | ID: StudentID. |

## POST /api/json/students/academic-progress/search

GPA, tín chỉ và tiến độ học tập

GPA lấy lần học gần nhất. Tín chỉ không cộng trùng học lại, môn tương đương và môn được công nhận.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| studentId | integer | Có | minimum=1 | ID: StudentID. |

## POST /api/json/students/combo-selections/search

Lịch sử lựa chọn combo của sinh viên

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| studentId | integer | Có | minimum=1 | ID: StudentID. |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |

## POST /api/json/students/course-results/search

Điểm, lần học và trạng thái môn

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| studentId | integer | Có | minimum=1 | ID: StudentID. |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| courseId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID môn học (CourseID). |
| academicPeriodId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID kỳ học hoặc Block 3. |
| status | string ∈ "PASSED", "FAILED", "IN_PROGRESS", "WITHDRAWN", "RECOGNIZED" | Không / theo điều kiện nghiệp vụ |  |  |

## POST /api/json/students/detail

Chi tiết hồ sơ học vụ

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| studentId | integer | Có | minimum=1 | ID: StudentID. |

## POST /api/json/students/eligibility-checks

Kiểm tra điều kiện OJT của sinh viên

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Có | minimum=1 | ID kỳ OJT. |
| studentId | integer | Có | minimum=1 | ID: StudentID. |

## POST /api/json/students/eligibility-checks/search

Lịch sử kiểm tra điều kiện OJT

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| studentId | integer | Có | minimum=1 | ID: StudentID. |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID kỳ OJT. |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Số bản ghi mỗi trang. |

## POST /api/json/students/eligibility/search

Kết quả OJT và điều kiện còn thiếu

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| studentId | integer | Có | minimum=1 | ID: StudentID. |
| ojtSemesterId | integer | Có | minimum=1 | ID kỳ OJT. |

## POST /api/json/students/search

Tìm kiếm và lọc sinh viên

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| search | string | Không / theo điều kiện nghiệp vụ |  |  |
| status | string | Không / theo điều kiện nghiệp vụ |  |  |
| programId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID phiên bản chương trình đào tạo. |
| cohortId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID khóa. |
| groupCode | string | Không / theo điều kiện nghiệp vụ |  |  |
| enrollmentYear | integer | Không / theo điều kiện nghiệp vụ | minimum=1 |  |
| currentSemester | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Kỳ chuyên ngành hiện tại, tính từ lộ trình thực tế. |

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
| application.cvUrl | string | Không / theo điều kiện nghiệp vụ | format="uri"; maxLength=2000 |  |
| application.note | string | Không / theo điều kiện nghiệp vụ | maxLength=2000 |  |

## POST /api/ojt-results

Chuyển đánh giá và hồ sơ OJT cho phòng đào tạo

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| assignmentId | integer | Có | minimum=1 | ID hồ sơ thực tập đã được đánh giá. |
| dossier | object | Có |  |  |
| dossier.summary | string | Có | minLength=1; maxLength=5000 |  |
| dossier.documents | array<object> | Có | minItems=1; maxItems=20 |  |
| dossier.documents[].name | string | Có | minLength=1; maxLength=200 |  |
| dossier.documents[].url | string | Có | format="uri"; maxLength=2000 |  |
| reason | string | Có | minLength=1; maxLength=2000 | Lý do thực hiện. |
| idempotencyKey | string | Có | minLength=1; maxLength=100 | Khóa chống trùng yêu cầu; dùng lại cùng khóa và dữ liệu khi gửi lại. |

## POST /api/ojt-rule-sets

Tạo bộ quy tắc OJT

Điều kiện: tối thiểu 70 tín chỉ và tối đa 2 môn chưa đạt.

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

## POST /api/ojt-semesters

Tạo kỳ OJT

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| academicYearId | integer | Có | minimum=1; maximum=2147483647 | ID năm học. |
| semesterCode | string | Có | maxLength=20 |  |
| name | string | Có | maxLength=100 |  |
| academicPeriodId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647; nullable=true | ID kỳ học hoặc Block 3. |
| startDate | string | Có | format="date" |  |
| endDate | string | Có | format="date" |  |
| regStartDate | string | Không / theo điều kiện nghiệp vụ | format="date"; nullable=true |  |
| regEndDate | string | Không / theo điều kiện nghiệp vụ | format="date"; nullable=true |  |
| status | string ∈ "PLANNED", "ACTIVE", "CLOSED", "ARCHIVED" | Không / theo điều kiện nghiệp vụ |  |  |

Ví dụ:

```json
{
  "academicYearId": 1,
  "semesterCode": "OJT-FALL2026",
  "name": "OJT Fall 2026",
  "academicPeriodId": 1,
  "startDate": "2026-09-01",
  "endDate": "2026-12-10",
  "regStartDate": "2026-08-01",
  "regEndDate": "2026-08-25",
  "status": "PLANNED"
}
```

## GET /api/roles

Danh sách vai trò

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Không có request body.

## PATCH /api/students/academic-placement

Gán lộ trình học cho sinh viên

Lần đầu cần khóa, nhóm và kỳ hiện tại. Kỳ chuyên ngành tính từ kỳ vào thực tế; Block 3 không tăng số kỳ.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| studentId | integer | Có | minimum=1; maximum=2147483647 | ID hồ sơ sinh viên, khác ID tài khoản. |
| cohortId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID khóa. |
| groupCode | string ∈ "A", "B", "C", "D" | Không / theo điều kiện nghiệp vụ |  |  |
| entryAcademicPeriodId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID kỳ bắt đầu chuyên ngành thực tế; mặc định theo khóa/nhóm. |
| currentAcademicPeriodId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID kỳ/Block đang học; bắt buộc khi gán lần đầu. |
| programId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID phiên bản chương trình đào tạo. |
| reason | string | Có | maxLength=1000 | Lý do thực hiện. |

Ví dụ:

```json
{
  "studentId": 1,
  "cohortId": 1,
  "groupCode": "A",
  "currentAcademicPeriodId": 1,
  "reason": "Gan lo trinh dau nam hoc"
}
```
