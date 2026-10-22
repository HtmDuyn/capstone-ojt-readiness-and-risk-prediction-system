# Rà soát đầu vào JSON của API danh sách

Được xuất từ hợp đồng Swagger hiện hành. Tổng 40 API danh sách.

FE truyền ID/bộ lọc trong JSON body; không truyền query string. Các ID trong ví dụ chỉ minh họa, cần thay bằng ID có thật trong DB. JWT vẫn bắt buộc và dùng để xác thực, kiểm tra quyền. Không tự điền companyId/studentId còn thiếu.

ID quan hệ không cần nhập lặp nếu đã truy ra được từ bản ghi được chọn. Các trường lọc tùy chọn có thể bỏ để xem toàn bộ phạm vi được phép. Phân trang page/limit không yêu cầu đọc toàn bộ DB trong một response.

| API | Trường bắt buộc | Điều kiện vai trò | Các trường JSON |
|---|---|---|---|
| POST /api/json/academic-years/list | Không có ID bắt buộc chung |  | page, limit, search, status |
| POST /api/json/academic-periods/list | Không có ID bắt buộc chung |  | page, limit, search, status, academicYearId, kind, academicPeriodId |
| POST /api/json/cohorts/list | Không có ID bắt buộc chung |  | page, limit, search, status |
| POST /api/json/academic-periods/combo-phase-schedules/list | academicPeriodId |  | academicPeriodId |
| POST /api/json/academic/alerts/list | ojtSemesterId, academicPeriodId, assessmentDeadline |  | ojtSemesterId, programId, cohortId, majorId, comboId, groupCode, academicPeriodId, assessmentDeadline, type, page, limit |
| POST /api/json/academic/course-demand/list | ojtSemesterId, academicPeriodId |  | ojtSemesterId, programId, cohortId, majorId, comboId, groupCode, academicPeriodId, assessmentDeadline, courseId, includeInProgress, page, limit |
| POST /api/json/combo-registration-windows/list | Không có ID bắt buộc chung | studentId: STUDENT | page, limit, phase, status, academicPeriodId, studentId |
| POST /api/json/combo-registration-windows/selections/list | windowId |  | windowId, page, limit, status |
| POST /api/json/students/combo-selections/list | studentId | studentId: STUDENT | studentId, page, limit |
| POST /api/json/majors/list | Không có ID bắt buộc chung |  | page, limit, search, parentMajorId |
| POST /api/json/courses/list | Không có ID bắt buộc chung |  | page, limit, search |
| POST /api/json/curricula/list | Không có ID bắt buộc chung |  | page, limit, search, majorId, status, version |
| POST /api/json/ojt-rule-sets/list | Không có ID bắt buộc chung |  | programId, ojtSemesterId, status, page, limit |
| POST /api/json/students/eligibility-checks/list | studentId | studentId: STUDENT | studentId, ojtSemesterId, page, limit |
| POST /api/json/ojt-registration-windows/list | Không có ID bắt buộc chung | studentId: STUDENT | ojtSemesterId, status, page, limit, studentId |
| POST /api/json/ojt-registrations/list | Không có ID bắt buộc chung | studentId: STUDENT | ojtSemesterId, windowId, studentId, programId, cohortId, groupCode, status, search, page, limit, registrationId, historyPage, historyLimit, coordinationPage, coordinationLimit, assignmentPage, assignmentLimit |
| POST /api/json/ojt-semesters/eligible-student-handoffs/list | ojtSemesterId |  | ojtSemesterId, page, limit |
| POST /api/json/ojt-semesters/students/list | ojtSemesterId | studentId: STUDENT | ojtSemesterId, programId, cohortId, groupCode, registrationStatus, search, page, limit, enterpriseId, coordinationStatus, assignmentStatus, studentId |
| POST /api/json/companies/list | Không có ID bắt buộc chung |  | page, limit, search, status, companyId, historyPage, historyLimit |
| POST /api/json/positions/list | Không có ID bắt buộc chung |  | page, limit, search, status, companyId, ojtSemesterId, positionId, historyPage, historyLimit |
| POST /api/json/ojt-coordinations/list | Không có ID bắt buộc chung |  | page, limit, search, status, companyId, ojtSemesterId, studentId, positionId, registrationId, decision, coordinationId, historyPage, historyLimit, coordinationPage, coordinationLimit, applicationId |
| POST /api/json/assignments/list | Không có ID bắt buộc chung |  | page, limit, search, status, companyId, ojtSemesterId, studentId, positionId, assignmentId, historyPage, historyLimit |
| POST /api/json/internship-evaluations/list | Không có ID bắt buộc chung |  | page, limit, search, status, companyId, ojtSemesterId, studentId, positionId, assignmentId, templateId, evaluationId, historyPage, historyLimit |
| POST /api/json/qhdn/registered-students/list | Không có ID bắt buộc chung |  | registrationId, studentId, ojtSemesterId, academicPeriodId, windowId, status, programId, cohortId, groupCode, search, handoffStatus, page, limit |
| POST /api/json/qhdn/reports/list | type |  | ojtSemesterId, companyId, page, limit, type |
| POST /api/json/students/list | Không có ID bắt buộc chung |  | page, limit, search, status, programId, cohortId, groupCode, enrollmentYear, currentSemester |
| POST /api/json/students/course-results/list | studentId | studentId: STUDENT | studentId, page, limit, courseId, academicPeriodId, status |
| POST /api/json/academic-imports/list | Không có ID bắt buộc chung |  | page, limit, kind, status, importId, rowsPage, rowsLimit |
| POST /api/json/enterprise/candidates/list | companyId | companyId: ENTERPRISE | companyId, studentId, page, limit, ojtSemesterId, positionId, search, candidateId, decision |
| POST /api/json/enterprise/internships/list | companyId | companyId: ENTERPRISE | companyId, studentId, page, limit, ojtSemesterId, positionId, search, internshipId, status |
| POST /api/json/recruitment/posts/list | companyId | companyId: mọi vai trò | page, limit, companyId, postId, windowId, academicPeriodId, status |
| POST /api/json/ojt-results/list | Không có ID bắt buộc chung |  | resultId, studentId, ojtSemesterId, page, limit, status, search |
| POST /api/json/academic/advisory-runs/list | Không có ID bắt buộc chung |  | page, limit |
| POST /api/json/student/ojt-registration-windows/list | studentId | studentId: STUDENT | ojtSemesterId, page, limit, studentId |
| POST /api/json/student/notifications/list | studentId | studentId: STUDENT | unread, page, limit, studentId |
| POST /api/json/student/combo-registration-windows/list | studentId | studentId: STUDENT | page, limit, studentId |
| POST /api/json/student/ojt-results/list | studentId | studentId: STUDENT | ojtSemesterId, page, limit, studentId |
| POST /api/json/job-applications/list | Không có ID bắt buộc chung | studentId: STUDENT | applicationId, studentId, registrationId, ojtSemesterId, companyId, positionId, page, limit, status |
| POST /api/json/students/me/opportunities/list | ojtSemesterId, studentId | studentId: STUDENT | ojtSemesterId, page, limit, studentId |
| POST /api/json/internship-tasks/list | Không có ID bắt buộc chung | companyId: ENTERPRISE; studentId: STUDENT | companyId, studentId, positionId, ojtSemesterId, assignmentId, page, limit |

## POST /api/json/academic-years/list

Danh sách năm học

| Trường | Kiểu | Bắt buộc | Mục đích |
|---|---|---|---|
| page | integer | Không | Trang, bắt đầu từ 1. |
| limit | integer | Không | Số bản ghi mỗi trang. |
| search | string | Không | Bộ lọc search. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| status | string (PLANNED, ACTIVE, CLOSED, ARCHIVED) | Không | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |

Ví dụ tất cả trường có thể nhập (chỉ giữ các bộ lọc cần sử dụng; trường theo vai trò phải phù hợp tài khoản):

~~~json
{
  "page": 1,
  "limit": 20,
  "search": "demo",
  "status": "PLANNED"
}
~~~

Trường response item: id, yearCode, startDate, endDate, status.

## POST /api/json/academic-periods/list

Danh sách kỳ học và Block 3

| Trường | Kiểu | Bắt buộc | Mục đích |
|---|---|---|---|
| page | integer | Không | Trang, bắt đầu từ 1. |
| limit | integer | Không | Số bản ghi mỗi trang. |
| search | string | Không | Bộ lọc search. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| status | string (PLANNED, ACTIVE, CLOSED, ARCHIVED) | Không | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| academicYearId | integer | Không | ID năm học. |
| kind | string (SEMESTER, BLOCK3) | Không | Bộ lọc kind. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| academicPeriodId | integer | Không | ID kỳ học hoặc Block 3. |

Ví dụ tất cả trường có thể nhập (chỉ giữ các bộ lọc cần sử dụng; trường theo vai trò phải phù hợp tài khoản):

~~~json
{
  "page": 1,
  "limit": 20,
  "search": "demo",
  "status": "PLANNED",
  "academicYearId": 1,
  "kind": "SEMESTER",
  "academicPeriodId": 1
}
~~~

Trường response item: id, academicYearId, parentPeriodId, ojtSemesterId, periodCode, name, kind, status, startDate, endDate, ojt, academicYear, semester.

## POST /api/json/cohorts/list

Danh sách khóa và nhóm

| Trường | Kiểu | Bắt buộc | Mục đích |
|---|---|---|---|
| page | integer | Không | Trang, bắt đầu từ 1. |
| limit | integer | Không | Số bản ghi mỗi trang. |
| search | string | Không | Bộ lọc search. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| status | string (PLANNED, ACTIVE, CLOSED, ARCHIVED) | Không | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |

Ví dụ tất cả trường có thể nhập (chỉ giữ các bộ lọc cần sử dụng; trường theo vai trò phải phù hợp tài khoản):

~~~json
{
  "page": 1,
  "limit": 20,
  "search": "demo",
  "status": "PLANNED"
}
~~~

Trường response item: id, cohortCode, name, status, enrollmentYear, groups.

## POST /api/json/academic-periods/combo-phase-schedules/list

Xem mốc chọn và xác nhận combo

| Trường | Kiểu | Bắt buộc | Mục đích |
|---|---|---|---|
| academicPeriodId | integer | Có | ID: AcademicPeriodID. |

Ví dụ tất cả trường có thể nhập (chỉ giữ các bộ lọc cần sử dụng; trường theo vai trò phải phù hợp tài khoản):

~~~json
{
  "academicPeriodId": 1
}
~~~

Trường response item: academicPeriodId, academicPeriod, confirmedBy, confirmedByUser.

## POST /api/json/academic/alerts/list

Danh sách cảnh báo thiếu điều kiện OJT

| Trường | Kiểu | Bắt buộc | Mục đích |
|---|---|---|---|
| ojtSemesterId | integer | Có | ID kỳ OJT. |
| programId | integer | Không | ID phiên bản chương trình đào tạo. |
| cohortId | integer | Không | ID khóa. |
| majorId | integer | Không | ID chuyên ngành (SpecializationID). |
| comboId | integer | Không | ID combo (ProgramComboID). |
| groupCode | string | Không | Bộ lọc groupCode. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| academicPeriodId | integer | Có | ID kỳ học hoặc Block 3. |
| assessmentDeadline | string | Có | Hạn xét điều kiện, gồm múi giờ. |
| type | string (CREDIT_SHORTFALL, MISSING_REQUIRED_COURSES, EXCESS_FAILED_COURSES) | Không | Bộ lọc type. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| page | integer | Không | Trang, bắt đầu từ 1. |
| limit | integer | Không | Số bản ghi mỗi trang. |

Ví dụ tất cả trường có thể nhập (chỉ giữ các bộ lọc cần sử dụng; trường theo vai trò phải phù hợp tài khoản):

~~~json
{
  "ojtSemesterId": 1,
  "programId": 1,
  "cohortId": 1,
  "majorId": 1,
  "comboId": 1,
  "groupCode": "...",
  "academicPeriodId": 1,
  "assessmentDeadline": "2026-12-01T00:00:00+07:00",
  "type": "CREDIT_SHORTFALL",
  "page": 1,
  "limit": 1
}
~~~

Trường response item: studentId, programId, cohortId, majorId, officialCheckId, studentCode, fullName, groupCode, category, comboIds, officialStale, evaluation, missingRequiredCourses, alternativeRequirements, dataIssues, alertTypes, student, program, cohort.

## POST /api/json/academic/course-demand/list

Thống kê nhu cầu học môn còn thiếu

| Trường | Kiểu | Bắt buộc | Mục đích |
|---|---|---|---|
| ojtSemesterId | integer | Có | ID kỳ OJT. |
| programId | integer | Không | ID phiên bản chương trình đào tạo. |
| cohortId | integer | Không | ID khóa. |
| majorId | integer | Không | ID chuyên ngành (SpecializationID). |
| comboId | integer | Không | ID combo (ProgramComboID). |
| groupCode | string | Không | Bộ lọc groupCode. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| academicPeriodId | integer | Có | ID kỳ học hoặc Block 3. |
| assessmentDeadline | string | Không | Hạn xét điều kiện, gồm múi giờ. |
| courseId | integer | Không | ID môn học (CourseID). |
| includeInProgress | string | Không | Bộ lọc includeInProgress. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| page | integer | Không | Trang, bắt đầu từ 1. |
| limit | integer | Không | Số bản ghi mỗi trang. |

Ví dụ tất cả trường có thể nhập (chỉ giữ các bộ lọc cần sử dụng; trường theo vai trò phải phù hợp tài khoản):

~~~json
{
  "ojtSemesterId": 1,
  "programId": 1,
  "cohortId": 1,
  "majorId": 1,
  "comboId": 1,
  "groupCode": "...",
  "academicPeriodId": 1,
  "assessmentDeadline": "2026-12-01T00:00:00+07:00",
  "courseId": 1,
  "includeInProgress": "...",
  "page": 1,
  "limit": 1
}
~~~

Trường response item: courseId, courseCode, courseName, academicPeriodId, periodCode, periodKind, studentCount, retakeCount, inProgressCount, course, academicPeriod.

## POST /api/json/combo-registration-windows/list

Danh sách đợt chọn combo

| Trường | Kiểu | Bắt buộc | Mục đích |
|---|---|---|---|
| page | integer | Không | Trang, bắt đầu từ 1. |
| limit | integer | Không | Số bản ghi mỗi trang. |
| phase | string (INITIAL, CONFIRMATION) | Không | Bộ lọc phase. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| status | string (DRAFT, OPEN, CLOSED, FINALIZED) | Không | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| academicPeriodId | integer | Không | ID kỳ học hoặc Block 3. |
| studentId | integer | Khi vai trò STUDENT | studentId chọn đối tượng truy xuất, FE phải nhập; bắt buộc khi đăng nhập vai trò STUDENT; đây là ID xác định chủ thể cho vai trò này, các vai trò khác không truyền trường này. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này. |

Ví dụ tất cả trường có thể nhập (chỉ giữ các bộ lọc cần sử dụng; trường theo vai trò phải phù hợp tài khoản):

~~~json
{
  "page": 1,
  "limit": 20,
  "phase": "INITIAL",
  "status": "DRAFT",
  "academicPeriodId": 1,
  "studentId": 1
}
~~~

Trường response item: id, name, academicPeriodId, ojtSemesterId, period, semester, startsAt, endsAt, effectiveEndsAt, status, canSubmit, blockingReasons, blockingMessages, phase, initialWindowId, requiredRelativeSemester, pathway, selection, confirmedSelection, reasonRequiredOnChange, registration, availableCombos, academicPeriod, createdByUser.

## POST /api/json/combo-registration-windows/selections/list

Theo dõi lựa chọn combo

| Trường | Kiểu | Bắt buộc | Mục đích |
|---|---|---|---|
| windowId | integer | Có | ID: WindowID trong ComboRegistrationWindows. |
| page | integer | Không | Trang, bắt đầu từ 1. |
| limit | integer | Không | Số bản ghi mỗi trang. |
| status | string (SUBMITTED, MISSING, APPLIED, UNSELECTED) | Không | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |

Ví dụ tất cả trường có thể nhập (chỉ giữ các bộ lọc cần sử dụng; trường theo vai trò phải phù hợp tài khoản):

~~~json
{
  "windowId": 1,
  "page": 1,
  "limit": 20,
  "status": "SUBMITTED"
}
~~~

Trường response item: studentId, programId, userId, eventId, comboId, studentCode, fullName, email, outcome, studentStatus, accountStatus, courseIds, choiceSnapshot, effectiveEndsAt, submittedAt, student, program, user, combo, courses.

## POST /api/json/students/combo-selections/list

Lịch sử lựa chọn combo của sinh viên

| Trường | Kiểu | Bắt buộc | Mục đích |
|---|---|---|---|
| studentId | integer | Có | studentId chọn đối tượng truy xuất, FE phải nhập; bắt buộc khi đăng nhập vai trò STUDENT; vai trò quản trị có thể bỏ để xem toàn bộ. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này. |
| page | integer | Không | Trang, bắt đầu từ 1. |
| limit | integer | Không | Số bản ghi mỗi trang. |

Ví dụ tất cả trường có thể nhập (chỉ giữ các bộ lọc cần sử dụng; trường theo vai trò phải phù hợp tài khoản):

~~~json
{
  "studentId": 1,
  "page": 1,
  "limit": 20
}
~~~

Trường response item: id, windowId, initialWindowId, createdBy, sourceEventId, phase, type, reason, choice, previous, progress, eligibility, createdAt, createdByUser.

## POST /api/json/majors/list

Danh sách chuyên ngành

| Trường | Kiểu | Bắt buộc | Mục đích |
|---|---|---|---|
| page | integer | Không | Trang, bắt đầu từ 1. |
| limit | integer | Không | Số bản ghi mỗi trang. |
| search | string | Không | Bộ lọc search. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| parentMajorId | integer | Không | ID ngành cha (MajorID). |

Ví dụ tất cả trường có thể nhập (chỉ giữ các bộ lọc cần sử dụng; trường theo vai trò phải phù hợp tài khoản):

~~~json
{
  "page": 1,
  "limit": 20,
  "search": "demo",
  "parentMajorId": 1
}
~~~

Trường response item: id, code, name, parentMajorCode, parentMajorName, parentMajorId.

## POST /api/json/courses/list

Danh sách môn học

| Trường | Kiểu | Bắt buộc | Mục đích |
|---|---|---|---|
| page | integer | Không | Trang, bắt đầu từ 1. |
| limit | integer | Không | Số bản ghi mỗi trang. |
| search | string | Không | Bộ lọc search. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |

Ví dụ tất cả trường có thể nhập (chỉ giữ các bộ lọc cần sử dụng; trường theo vai trò phải phù hợp tài khoản):

~~~json
{
  "page": 1,
  "limit": 20,
  "search": "demo"
}
~~~

Trường response item: id, code, name, defaultCredits, isOjtPrerequisite.

## POST /api/json/curricula/list

Danh sách chương trình đào tạo đã nhập

| Trường | Kiểu | Bắt buộc | Mục đích |
|---|---|---|---|
| page | integer | Không | Trang, bắt đầu từ 1. |
| limit | integer | Không | Số bản ghi mỗi trang. |
| search | string | Không | Bộ lọc search. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| majorId | integer | Không | ID chuyên ngành (SpecializationID). |
| status | string (DRAFT, PUBLISHED) | Không | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| version | string | Không | Bộ lọc version. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |

Ví dụ tất cả trường có thể nhập (chỉ giữ các bộ lọc cần sử dụng; trường theo vai trò phải phù hợp tài khoản):

~~~json
{
  "page": 1,
  "limit": 20,
  "search": "demo",
  "majorId": 1,
  "status": "DRAFT",
  "version": "..."
}
~~~

Trường response item: id, code, name, version, majorName, majorCode, status, retakePolicy, majorId, createdBy, publishedBy, totalCredits, effectiveYear, gpaScale, prerequisitesReviewed, equivalencesReviewed, createdAt, updatedAt, publishedAt, createdByUser, publishedByUser.

## POST /api/json/ojt-rule-sets/list

Danh sách bộ quy tắc OJT

| Trường | Kiểu | Bắt buộc | Mục đích |
|---|---|---|---|
| programId | integer | Không | ID phiên bản chương trình đào tạo. |
| ojtSemesterId | integer | Không | ID kỳ OJT. |
| status | string | Không | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| page | integer | Không | Trang, bắt đầu từ 1. |
| limit | integer | Không | Số bản ghi mỗi trang. |

Ví dụ tất cả trường có thể nhập (chỉ giữ các bộ lọc cần sử dụng; trường theo vai trò phải phù hợp tài khoản):

~~~json
{
  "programId": 1,
  "ojtSemesterId": 1,
  "status": "...",
  "page": 1,
  "limit": 1
}
~~~

Trường response item: id, programId, ojtSemesterId, createdBy, publishedBy, name, version, debtBasis, status, minCredits, maxUnpassedCourses, active, createdAt, publishedAt, program, semester, createdByUser, publishedByUser.

## POST /api/json/students/eligibility-checks/list

Lịch sử kiểm tra điều kiện OJT

| Trường | Kiểu | Bắt buộc | Mục đích |
|---|---|---|---|
| studentId | integer | Có | studentId chọn đối tượng truy xuất, FE phải nhập; bắt buộc khi đăng nhập vai trò STUDENT; vai trò quản trị có thể bỏ để xem toàn bộ. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này. |
| ojtSemesterId | integer | Không | ID kỳ OJT. |
| page | integer | Không | Trang, bắt đầu từ 1. |
| limit | integer | Không | Số bản ghi mỗi trang. |

Ví dụ tất cả trường có thể nhập (chỉ giữ các bộ lọc cần sử dụng; trường theo vai trò phải phù hợp tài khoản):

~~~json
{
  "studentId": 1,
  "ojtSemesterId": 1,
  "page": 1,
  "limit": 1
}
~~~

Trường response item: student, semester, ruleSet, checkedByUser.

## POST /api/json/ojt-registration-windows/list

Danh sách đợt đăng ký OJT

| Trường | Kiểu | Bắt buộc | Mục đích |
|---|---|---|---|
| ojtSemesterId | integer | Không | ID kỳ OJT. |
| status | string (DRAFT, OPEN, CLOSED) | Không | Lọc theo trạng thái; bỏ trường này để xem tất cả. |
| page | integer | Không | Trang, bắt đầu từ 1. |
| limit | integer | Không | Số bản ghi mỗi trang. |
| studentId | integer | Khi vai trò STUDENT | studentId chọn đối tượng truy xuất, FE phải nhập; bắt buộc khi đăng nhập vai trò STUDENT; đây là ID xác định chủ thể cho vai trò này, các vai trò khác không truyền trường này. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này. |

Ví dụ tất cả trường có thể nhập (chỉ giữ các bộ lọc cần sử dụng; trường theo vai trò phải phù hợp tài khoản):

~~~json
{
  "ojtSemesterId": 1,
  "status": "DRAFT",
  "page": 1,
  "limit": 20,
  "studentId": 1
}
~~~

Trường response item: id, name, academicPeriodId, ojtSemesterId, period, semester, startsAt, endsAt, effectiveEndsAt, status, canSubmit, blockingReasons, blockingMessages, phase, initialWindowId, requiredRelativeSemester, pathway, selection, confirmedSelection, reasonRequiredOnChange, registration, availableCombos, academicPeriod, createdByUser.

## POST /api/json/ojt-registrations/list

Danh sách hồ sơ đăng ký OJT

| Trường | Kiểu | Bắt buộc | Mục đích |
|---|---|---|---|
| ojtSemesterId | integer | Không | ID kỳ OJT. |
| windowId | integer | Không | ID đợt đăng ký. |
| studentId | integer | Khi vai trò STUDENT | studentId chọn đối tượng truy xuất, FE phải nhập; bắt buộc khi đăng nhập vai trò STUDENT; vai trò quản trị có thể bỏ để xem toàn bộ. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này. |
| programId | integer | Không | ID phiên bản chương trình đào tạo. |
| cohortId | integer | Không | ID khóa. |
| groupCode | string (A, B, C, D) | Không | Bộ lọc groupCode. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| status | string (SUBMITTED, APPROVED, REJECTED, HANDED_OFF) | Không | Lọc theo trạng thái; bỏ trường này để xem tất cả. |
| search | string | Không | Bộ lọc search. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| page | integer | Không | Trang, bắt đầu từ 1. |
| limit | integer | Không | Số bản ghi mỗi trang. |
| registrationId | integer | Không | Chọn một hồ sơ để trả thêm phần chi tiết. |
| historyPage | integer | Không | Phân trang history; chỉ dùng cùng registrationId. |
| historyLimit | integer | Không | Phân trang history; chỉ dùng cùng registrationId. |
| coordinationPage | integer | Không | Phân trang coordination; chỉ dùng cùng registrationId. |
| coordinationLimit | integer | Không | Phân trang coordination; chỉ dùng cùng registrationId. |
| assignmentPage | integer | Không | Phân trang assignment; chỉ dùng cùng registrationId. |
| assignmentLimit | integer | Không | Phân trang assignment; chỉ dùng cùng registrationId. |

Ví dụ tất cả trường có thể nhập (chỉ giữ các bộ lọc cần sử dụng; trường theo vai trò phải phù hợp tài khoản):

~~~json
{
  "ojtSemesterId": 1,
  "windowId": 1,
  "studentId": 1,
  "programId": 1,
  "cohortId": 1,
  "groupCode": "A",
  "status": "SUBMITTED",
  "search": "demo",
  "page": 1,
  "limit": 20,
  "registrationId": 1,
  "historyPage": 1,
  "historyLimit": 20,
  "coordinationPage": 1,
  "coordinationLimit": 20,
  "assignmentPage": 1,
  "assignmentLimit": 20
}
~~~

Trường response item: id, studentId, status, application, student, program, currentProgram, cohort, semester, submittedByUser, history, historyPagination, studentCode, fullName, email, phone, ojtSemesterId, windowId, programId, currentProgramId, programCode, programName, cohortId, groupCode, registeredAt, updatedAt, submittedBy, window, pathway, review, handoff, officialEligibility, handoffSnapshot, coordination, coordinationPagination, assignments, assignmentsPagination.

## POST /api/json/ojt-semesters/eligible-student-handoffs/list

Lịch sử bàn giao sinh viên cho QHDN

| Trường | Kiểu | Bắt buộc | Mục đích |
|---|---|---|---|
| ojtSemesterId | integer | Có | ID: OJTSemesterID. |
| page | integer | Không | Trang, bắt đầu từ 1. |
| limit | integer | Không | Số bản ghi mỗi trang. |

Ví dụ tất cả trường có thể nhập (chỉ giữ các bộ lọc cần sử dụng; trường theo vai trò phải phù hợp tài khoản):

~~~json
{
  "ojtSemesterId": 1,
  "page": 1,
  "limit": 1
}
~~~

Trường response item: semester, createdByUser, id, ojtSemesterId, registrationIds, recipientRole, reason, createdBy, createdAt, studentCount, registrations.

## POST /api/json/ojt-semesters/students/list

Theo dõi trạng thái OJT theo kỳ

| Trường | Kiểu | Bắt buộc | Mục đích |
|---|---|---|---|
| ojtSemesterId | integer | Có | ID: OJTSemesterID. |
| programId | integer | Không | ID phiên bản chương trình đào tạo. |
| cohortId | integer | Không | ID khóa. |
| groupCode | string | Không | Bộ lọc groupCode. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| registrationStatus | string | Không | Bộ lọc registrationStatus. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| search | string | Không | Bộ lọc search. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| page | integer | Không | Trang, bắt đầu từ 1. |
| limit | integer | Không | Số bản ghi mỗi trang. |
| enterpriseId | integer | Không | Filters the latest coordination and its assignment; QHDN remains restricted to handed-off students. |
| coordinationStatus | string (NOT_COORDINATED, PENDING, ACCEPTED, REJECTED) | Không | Filters the latest coordination and its assignment; QHDN remains restricted to handed-off students. |
| assignmentStatus | string (UNASSIGNED, ASSIGNED, ACTIVE, IN_PROGRESS, COMPLETED, CANCELLED, CANCELED, FAILED) | Không | Filters the latest coordination and its assignment; QHDN remains restricted to handed-off students. |
| studentId | integer | Khi vai trò STUDENT | studentId chọn đối tượng truy xuất, FE phải nhập; bắt buộc khi đăng nhập vai trò STUDENT; đây là ID xác định chủ thể cho vai trò này, các vai trò khác không truyền trường này. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này. |

Ví dụ tất cả trường có thể nhập (chỉ giữ các bộ lọc cần sử dụng; trường theo vai trò phải phù hợp tài khoản):

~~~json
{
  "ojtSemesterId": 1,
  "programId": 1,
  "cohortId": 1,
  "groupCode": "...",
  "registrationStatus": "...",
  "search": "demo",
  "page": 1,
  "limit": 1,
  "enterpriseId": 1,
  "coordinationStatus": "NOT_COORDINATED",
  "assignmentStatus": "UNASSIGNED",
  "studentId": 1
}
~~~

Trường response item: student, program, cohort, semester, company, position, studentId, studentCode, fullName, email, phone, programId, programCode, programName, cohortId, cohortName, groupCode, ojtSemesterId, registrationId, handoffId, coordinationId, enterpriseId, positionId, assignmentId, registrationStatus, ojtStatus, enterpriseDecision, assignmentStatus, cv, registration, window, handoff, officialEligibility, eligibilityValidity, coordination, assignment.

## POST /api/json/companies/list

Danh sách và hồ sơ doanh nghiệp

| Trường | Kiểu | Bắt buộc | Mục đích |
|---|---|---|---|
| page | integer | Không | Trang, bắt đầu từ 1. |
| limit | integer | Không | Số bản ghi mỗi trang. |
| search | string | Không | Bộ lọc search. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| status | string (ACTIVE, INACTIVE) | Không | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| companyId | integer | Không | ID doanh nghiệp. |
| historyPage | integer | Không | Trang lịch sử khi lọc theo ID. |
| historyLimit | integer | Không | Số sự kiện lịch sử mỗi trang, tối đa 100. |

Ví dụ tất cả trường có thể nhập (chỉ giữ các bộ lọc cần sử dụng; trường theo vai trò phải phù hợp tài khoản):

~~~json
{
  "page": 1,
  "limit": 1,
  "search": "demo",
  "status": "ACTIVE",
  "companyId": 1,
  "historyPage": 1,
  "historyLimit": 20
}
~~~

Trường response item: id, code, name, address, industry, contactPersonName, contactPhone, contactEmail, status, createdAt, history, historyPagination.

## POST /api/json/positions/list

Danh sách và hồ sơ vị trí thực tập

| Trường | Kiểu | Bắt buộc | Mục đích |
|---|---|---|---|
| page | integer | Không | Trang, bắt đầu từ 1. |
| limit | integer | Không | Số bản ghi mỗi trang. |
| search | string | Không | Bộ lọc search. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| status | string (OPEN, CLOSED) | Không | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| companyId | integer | Không | ID doanh nghiệp. |
| ojtSemesterId | integer | Không | ID kỳ OJT. |
| positionId | integer | Không | ID vị trí thực tập. |
| historyPage | integer | Không | Trang lịch sử khi lọc theo ID. |
| historyLimit | integer | Không | Số sự kiện lịch sử mỗi trang, tối đa 100. |

Ví dụ tất cả trường có thể nhập (chỉ giữ các bộ lọc cần sử dụng; trường theo vai trò phải phù hợp tài khoản):

~~~json
{
  "page": 1,
  "limit": 1,
  "search": "demo",
  "status": "OPEN",
  "companyId": 1,
  "ojtSemesterId": 1,
  "positionId": 1,
  "historyPage": 1,
  "historyLimit": 20
}
~~~

Trường response item: id, companyId, companyName, ojtSemesterId, recruitmentCode, title, description, requirements, status, location, workMode, capacity, remainingSlots, history, historyPagination, company, semester.

## POST /api/json/ojt-coordinations/list

Danh sách và hồ sơ điều phối

| Trường | Kiểu | Bắt buộc | Mục đích |
|---|---|---|---|
| page | integer | Không | Trang, bắt đầu từ 1. |
| limit | integer | Không | Số bản ghi mỗi trang. |
| search | string | Không | Bộ lọc search. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| status | string (PENDING, ACCEPTED, REJECTED) | Không | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| companyId | integer | Không | ID doanh nghiệp. |
| ojtSemesterId | integer | Không | ID kỳ OJT. |
| studentId | integer | Không | ID hồ sơ sinh viên, khác ID tài khoản. |
| positionId | integer | Không | ID vị trí thực tập. |
| registrationId | integer | Không | ID registrationId dùng để chọn/lọc dữ liệu trong DB. Tùy chọn; bỏ qua để không lọc theo ID này. |
| decision | string (PENDING, ACCEPTED, REJECTED) | Không | Bộ lọc decision. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| coordinationId | integer | Không | ID coordinationId dùng để chọn/lọc dữ liệu trong DB. Tùy chọn; bỏ qua để không lọc theo ID này. |
| historyPage | integer | Không | Trang lịch sử khi lọc theo ID. |
| historyLimit | integer | Không | Số sự kiện lịch sử mỗi trang, tối đa 100. |
| coordinationPage | integer | Không | Bộ lọc coordinationPage. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| coordinationLimit | integer | Không | Bộ lọc coordinationLimit. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| applicationId | integer | Không | ID kỳ OJT. |

Ví dụ tất cả trường có thể nhập (chỉ giữ các bộ lọc cần sử dụng; trường theo vai trò phải phù hợp tài khoản):

~~~json
{
  "page": 1,
  "limit": 1,
  "search": "demo",
  "status": "PENDING",
  "companyId": 1,
  "ojtSemesterId": 1,
  "studentId": 1,
  "positionId": 1,
  "registrationId": 1,
  "decision": "PENDING",
  "coordinationId": 1,
  "historyPage": 1,
  "historyLimit": 1,
  "coordinationPage": 1,
  "coordinationLimit": 1,
  "applicationId": 1
}
~~~

Trường response item: id, student, company, position, template, studentId, companyId, positionId, ojtSemesterId, registrationId, assignmentId, studentCode, fullName, companyName, positionTitle, decision, status, comments, templateId, scoreDetails, completionScore, attitudeScore, skillScore, overallScore, evaluatedAt, evaluatedBy, registration, assignment, history, historyPagination, coordinationHistory, coordinationHistoryPagination, semester, coordinatedByUser.

## POST /api/json/assignments/list

Danh sách và hồ sơ phân công thực tập

| Trường | Kiểu | Bắt buộc | Mục đích |
|---|---|---|---|
| page | integer | Không | Trang, bắt đầu từ 1. |
| limit | integer | Không | Số bản ghi mỗi trang. |
| search | string | Không | Bộ lọc search. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| status | string (ASSIGNED, ACTIVE, IN_PROGRESS, COMPLETED, CANCELLED, CANCELED, FAILED) | Không | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| companyId | integer | Không | ID doanh nghiệp. |
| ojtSemesterId | integer | Không | ID kỳ OJT. |
| studentId | integer | Không | ID hồ sơ sinh viên, khác ID tài khoản. |
| positionId | integer | Không | ID vị trí thực tập. |
| assignmentId | integer | Không | ID phân công thực tập. |
| historyPage | integer | Không | Trang lịch sử khi lọc theo ID. |
| historyLimit | integer | Không | Số sự kiện lịch sử mỗi trang, tối đa 100. |

Ví dụ tất cả trường có thể nhập (chỉ giữ các bộ lọc cần sử dụng; trường theo vai trò phải phù hợp tài khoản):

~~~json
{
  "page": 1,
  "limit": 1,
  "search": "demo",
  "status": "ASSIGNED",
  "companyId": 1,
  "ojtSemesterId": 1,
  "studentId": 1,
  "positionId": 1,
  "assignmentId": 1,
  "historyPage": 1,
  "historyLimit": 20
}
~~~

Trường response item: id, coordinationId, studentId, companyId, positionId, ojtSemesterId, academicSupervisorId, studentCode, fullName, companyName, positionTitle, enterpriseSupervisorName, status, startDate, endDate, student, company, academicSupervisor, position, evaluation, result, history, historyPagination, semester.

## POST /api/json/internship-evaluations/list

Danh sách đánh giá thực tập

| Trường | Kiểu | Bắt buộc | Mục đích |
|---|---|---|---|
| page | integer | Không | Trang, bắt đầu từ 1. |
| limit | integer | Không | Số bản ghi mỗi trang. |
| search | string | Không | Bộ lọc search. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| status | string | Không | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| companyId | integer | Không | ID doanh nghiệp. |
| ojtSemesterId | integer | Không | ID kỳ OJT. |
| studentId | integer | Không | ID hồ sơ sinh viên, khác ID tài khoản. |
| positionId | integer | Không | ID vị trí thực tập. |
| assignmentId | integer | Không | ID phân công thực tập. |
| templateId | integer | Không | ID bộ tiêu chí đánh giá. |
| evaluationId | integer | Không | ID evaluationId dùng để chọn/lọc dữ liệu trong DB. Tùy chọn; bỏ qua để không lọc theo ID này. |
| historyPage | integer | Không | Trang lịch sử khi lọc theo ID. |
| historyLimit | integer | Không | Số sự kiện lịch sử mỗi trang, tối đa 100. |

Ví dụ tất cả trường có thể nhập (chỉ giữ các bộ lọc cần sử dụng; trường theo vai trò phải phù hợp tài khoản):

~~~json
{
  "page": 1,
  "limit": 1,
  "search": "demo",
  "status": "...",
  "companyId": 1,
  "ojtSemesterId": 1,
  "studentId": 1,
  "positionId": 1,
  "assignmentId": 1,
  "templateId": 1,
  "evaluationId": 1,
  "historyPage": 1,
  "historyLimit": 1
}
~~~

Trường response item: id, student, company, position, template, studentId, companyId, positionId, ojtSemesterId, registrationId, assignmentId, studentCode, fullName, companyName, positionTitle, decision, status, comments, templateId, scoreDetails, completionScore, attitudeScore, skillScore, overallScore, evaluatedAt, evaluatedBy, registration, assignment, history, historyPagination, semester, evaluatedByUser.

## POST /api/json/qhdn/registered-students/list

Xem sinh viên đã đăng ký OJT

| Trường | Kiểu | Bắt buộc | Mục đích |
|---|---|---|---|
| registrationId | integer | Không | ID registrationId dùng để chọn/lọc dữ liệu trong DB. Tùy chọn; bỏ qua để không lọc theo ID này. |
| studentId | integer | Không | ID hồ sơ sinh viên, khác ID tài khoản. |
| ojtSemesterId | integer | Không | ID kỳ OJT. |
| academicPeriodId | integer | Không | ID kỳ học hoặc Block 3. |
| windowId | integer | Không | ID đợt đăng ký. |
| status | string (SUBMITTED, APPROVED, REJECTED, HANDED_OFF) | Không | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| programId | integer | Không | ID phiên bản chương trình đào tạo. |
| cohortId | integer | Không | ID khóa. |
| groupCode | string (A, B, C, D) | Không | Bộ lọc groupCode. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| search | string | Không | Bộ lọc search. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| handoffStatus | string (NOT_HANDED_OFF, HANDED_OFF) | Không | Lọc hồ sơ chưa bàn giao hoặc đã bàn giao. |
| page | integer | Không | Trang, bắt đầu từ 1. |
| limit | integer | Không | Số bản ghi mỗi trang. |

Ví dụ tất cả trường có thể nhập (chỉ giữ các bộ lọc cần sử dụng; trường theo vai trò phải phù hợp tài khoản):

~~~json
{
  "registrationId": 1,
  "studentId": 1,
  "ojtSemesterId": 1,
  "academicPeriodId": 1,
  "windowId": 1,
  "status": "SUBMITTED",
  "programId": 1,
  "cohortId": 1,
  "groupCode": "A",
  "search": "demo",
  "handoffStatus": "NOT_HANDED_OFF",
  "page": 1,
  "limit": 20
}
~~~

Trường response item: id, studentId, studentCode, fullName, email, phone, studentStatus, accountStatus, programId, programCode, programName, cohortId, cohortName, groupCode, registrations, student, program, cohort.

## POST /api/json/qhdn/reports/list

Báo cáo QHDN theo loại

| Trường | Kiểu | Bắt buộc | Mục đích |
|---|---|---|---|
| ojtSemesterId | integer | Không | ID kỳ OJT. |
| companyId | integer | Không | ID doanh nghiệp. |
| page | integer | Không | Trang, bắt đầu từ 1. |
| limit | integer | Không | Số bản ghi mỗi trang. |
| type | string (acceptance, internships, enterprise-feedback) | Có | Bộ lọc type. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |

Ví dụ tất cả trường có thể nhập (chỉ giữ các bộ lọc cần sử dụng; trường theo vai trò phải phù hợp tài khoản):

~~~json
{
  "ojtSemesterId": 1,
  "companyId": 1,
  "page": 1,
  "limit": 20,
  "type": "acceptance"
}
~~~

Trường response item: ojtSemesterId, semesterCode, companyId, companyName, currentStudents, pending, accepted, rejected, acceptanceRate, coordinationAttempts, pendingAttempts, acceptedAttempts, rejectedAttempts, totalAssignments, assigned, active, completed, failed, cancelled, assignedStudents, totalResults, pendingResults, revisionRequestedResults, confirmedResults, passedResults, failedResults, averageOfficialScore, eligibleAssignments, evaluationCount, missingEvaluations, evaluationCoverageRate, averageCompletionScore, averageAttitudeScore, averageSkillScore, averageOverallScore, commentsCount, enterpriseSubmittedCount, staffEnteredCount, lastEvaluatedAt, company, semester.

## POST /api/json/students/list

Tìm kiếm và lọc sinh viên

| Trường | Kiểu | Bắt buộc | Mục đích |
|---|---|---|---|
| page | integer | Không | Trang, bắt đầu từ 1. |
| limit | integer | Không | Số bản ghi mỗi trang. |
| search | string | Không | Bộ lọc search. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| status | string | Không | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| programId | integer | Không | ID phiên bản chương trình đào tạo. |
| cohortId | integer | Không | ID khóa. |
| groupCode | string | Không | Bộ lọc groupCode. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| enrollmentYear | integer | Không | Bộ lọc enrollmentYear. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| currentSemester | integer | Không | Kỳ chuyên ngành hiện tại, tính từ lộ trình thực tế. |

Ví dụ tất cả trường có thể nhập (chỉ giữ các bộ lọc cần sử dụng; trường theo vai trò phải phù hợp tài khoản):

~~~json
{
  "page": 1,
  "limit": 20,
  "search": "demo",
  "status": "...",
  "programId": 1,
  "cohortId": 1,
  "groupCode": "...",
  "enrollmentYear": 1,
  "currentSemester": 1
}
~~~

Trường response item: id, studentCode, userId, fullName, email, phone, accountStatus, className, status, groupCode, programId, cohortId, currentSemester, entryAcademicPeriodId, currentAcademicPeriodId, enrollmentYear, program, cohort, entryAcademicPeriod, currentAcademicPeriod.

## POST /api/json/students/course-results/list

Điểm, lần học và trạng thái môn

| Trường | Kiểu | Bắt buộc | Mục đích |
|---|---|---|---|
| studentId | integer | Có | studentId chọn đối tượng truy xuất, FE phải nhập; bắt buộc khi đăng nhập vai trò STUDENT; vai trò quản trị có thể bỏ để xem toàn bộ. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này. |
| page | integer | Không | Trang, bắt đầu từ 1. |
| limit | integer | Không | Số bản ghi mỗi trang. |
| courseId | integer | Không | ID môn học (CourseID). |
| academicPeriodId | integer | Không | ID kỳ học hoặc Block 3. |
| status | string (PASSED, FAILED, IN_PROGRESS, WITHDRAWN, RECOGNIZED) | Không | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |

Ví dụ tất cả trường có thể nhập (chỉ giữ các bộ lọc cần sử dụng; trường theo vai trò phải phù hợp tài khoản):

~~~json
{
  "studentId": 1,
  "page": 1,
  "limit": 20,
  "courseId": 1,
  "academicPeriodId": 1,
  "status": "PASSED"
}
~~~

Trường response item: id, studentId, courseId, academicPeriodId, academicYearId, recordedBy, ojtResultId, courseCode, courseName, periodCode, periodKind, status, grade, sourceReference, score, gradePoints, semesterTaken, attemptNumber, periodStartDate, createdAt, updatedAt, course, academicPeriod.

## POST /api/json/academic-imports/list

Lịch sử nhập dữ liệu học vụ

| Trường | Kiểu | Bắt buộc | Mục đích |
|---|---|---|---|
| page | integer | Không | Trang, bắt đầu từ 1. |
| limit | integer | Không | Số bản ghi mỗi trang. |
| kind | string (STUDENT, COURSE_RESULT, CURRICULUM) | Không | Bộ lọc kind. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| status | string (COMPLETED, REJECTED, FAILED) | Không | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| importId | string | Không | Chọn một hồ sơ để trả thêm phần chi tiết. |
| rowsPage | integer | Không | Phân trang rows; chỉ dùng cùng importId. |
| rowsLimit | integer | Không | Phân trang rows; chỉ dùng cùng importId. |

Ví dụ tất cả trường có thể nhập (chỉ giữ các bộ lọc cần sử dụng; trường theo vai trò phải phù hợp tài khoản):

~~~json
{
  "page": 1,
  "limit": 20,
  "kind": "STUDENT",
  "status": "COMPLETED",
  "importId": "...",
  "rowsPage": 1,
  "rowsLimit": 20
}
~~~

Trường response item: importedByUser, id, kind, status, sourceName, summary, importedBy, createdAt, rows, rowsPagination.

## POST /api/json/enterprise/candidates/list

Danh sách và hồ sơ ứng viên

| Trường | Kiểu | Bắt buộc | Mục đích |
|---|---|---|---|
| companyId | integer | Có | companyId chọn đối tượng truy xuất, FE phải nhập; bắt buộc cho mọi vai trò. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này. |
| studentId | integer | Không | ID hồ sơ sinh viên, khác ID tài khoản. |
| page | integer | Không | Trang, bắt đầu từ 1. |
| limit | integer | Không | Số bản ghi mỗi trang. |
| ojtSemesterId | integer | Không | ID kỳ OJT. |
| positionId | integer | Không | ID vị trí thực tập. |
| search | string | Không | Bộ lọc search. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| candidateId | integer | Không | ID candidateId dùng để chọn/lọc dữ liệu trong DB. Tùy chọn; bỏ qua để không lọc theo ID này. |
| decision | string (PENDING, ACCEPTED, REJECTED) | Không | Bộ lọc decision. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |

Ví dụ tất cả trường có thể nhập (chỉ giữ các bộ lọc cần sử dụng; trường theo vai trò phải phù hợp tài khoản):

~~~json
{
  "companyId": 1,
  "studentId": 1,
  "page": 1,
  "limit": 20,
  "ojtSemesterId": 1,
  "positionId": 1,
  "search": "demo",
  "candidateId": 1,
  "decision": "PENDING"
}
~~~

Trường response item: id, student, position, application, decision, introducedAt, decisionAt, rejectReason, isLatestCoordination, company, semester, companyId, studentId, ojtSemesterId, registrationId, positionId, applicationId, jobApplication, coordinatedBy, coordinatedByUser, registration, recruitmentPost.

## POST /api/json/enterprise/internships/list

Danh sách sinh viên thực tập

| Trường | Kiểu | Bắt buộc | Mục đích |
|---|---|---|---|
| companyId | integer | Có | companyId chọn đối tượng truy xuất, FE phải nhập; bắt buộc cho mọi vai trò. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này. |
| studentId | integer | Không | ID hồ sơ sinh viên, khác ID tài khoản. |
| page | integer | Không | Trang, bắt đầu từ 1. |
| limit | integer | Không | Số bản ghi mỗi trang. |
| ojtSemesterId | integer | Không | ID kỳ OJT. |
| positionId | integer | Không | ID vị trí thực tập. |
| search | string | Không | Bộ lọc search. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| internshipId | integer | Không | ID internshipId dùng để chọn/lọc dữ liệu trong DB. Tùy chọn; bỏ qua để không lọc theo ID này. |
| status | string (ASSIGNED, ACTIVE, IN_PROGRESS, COMPLETED, CANCELLED, CANCELED, FAILED) | Không | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |

Ví dụ tất cả trường có thể nhập (chỉ giữ các bộ lọc cần sử dụng; trường theo vai trò phải phù hợp tài khoản):

~~~json
{
  "companyId": 1,
  "studentId": 1,
  "page": 1,
  "limit": 20,
  "ojtSemesterId": 1,
  "positionId": 1,
  "search": "demo",
  "internshipId": 1,
  "status": "ASSIGNED"
}
~~~

Trường response item: id, student, position, application, academicSupervisor, coordinationId, enterpriseSupervisorName, startDate, endDate, status, resultStatus, evaluation, template, result, evaluationLocked, company, semester, companyId, studentId, ojtSemesterId, registrationId, positionId, applicationId, jobApplication.

## POST /api/json/recruitment/posts/list

Danh sách tin tuyển dụng

| Trường | Kiểu | Bắt buộc | Mục đích |
|---|---|---|---|
| page | integer | Không | Trang, bắt đầu từ 1. |
| limit | integer | Không | Số bản ghi mỗi trang. |
| companyId | integer | Có | companyId chọn đối tượng truy xuất, FE phải nhập; bắt buộc cho mọi vai trò. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này. |
| postId | integer | Không | ID kỳ học hoặc Block 3. |
| windowId | integer | Không | ID đợt đăng ký. |
| academicPeriodId | integer | Không | ID kỳ học hoặc Block 3. |
| status | string (DRAFT, PENDING_REVIEW, PUBLISHED, REJECTED, CLOSED, ARCHIVED) | Không | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |

Ví dụ tất cả trường có thể nhập (chỉ giữ các bộ lọc cần sử dụng; trường theo vai trò phải phù hợp tài khoản):

~~~json
{
  "page": 1,
  "limit": 20,
  "companyId": 1,
  "postId": 1,
  "windowId": 1,
  "academicPeriodId": 1,
  "status": "DRAFT"
}
~~~

Trường response item: id, ojtSemesterId, windowId, academicPeriodId, companyId, periodCode, companyName, title, content, benefits, applicationInstructions, status, reviewReason, deadlineAt, publishedAt, reviewedAt, positions, createdAt, updatedAt, company, semester, academicPeriod.

## POST /api/json/ojt-results/list

Danh sách điểm OJT chính thức do doanh nghiệp đánh giá

| Trường | Kiểu | Bắt buộc | Mục đích |
|---|---|---|---|
| resultId | integer | Không | ID resultId dùng để chọn/lọc dữ liệu trong DB. Tùy chọn; bỏ qua để không lọc theo ID này. |
| studentId | integer | Không | ID studentId dùng để chọn/lọc dữ liệu trong DB. Tùy chọn; bỏ qua để không lọc theo ID này. |
| ojtSemesterId | integer | Không | ID ojtSemesterId dùng để chọn/lọc dữ liệu trong DB. Tùy chọn; bỏ qua để không lọc theo ID này. |
| page | integer | Không | Trang kết quả, mặc định 1. |
| limit | integer | Không | Số bản ghi mỗi trang, tối đa 100. |
| status | string (CONFIRMED) | Không | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| search | string | Không | Bộ lọc search. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |

Ví dụ tất cả trường có thể nhập (chỉ giữ các bộ lọc cần sử dụng; trường theo vai trò phải phù hợp tài khoản):

~~~json
{
  "resultId": 1,
  "studentId": 1,
  "ojtSemesterId": 1,
  "page": 1,
  "limit": 1,
  "status": "CONFIRMED",
  "search": "demo"
}
~~~

Trường response item: id, evaluationId, assignmentId, studentId, companyId, positionId, programId, studentCode, fullName, enterpriseName, ojtSemesterId, semesterCode, status, officialScore, completionScore, attitudeScore, skillScore, comments, evaluatedBy, confirmedBy, confirmedAt, source, outcome, student, program, company, position, semester, evaluatedByUser, confirmedByUser.

## POST /api/json/academic/advisory-runs/list

lịch sử batch thông báo khi có worker.

| Trường | Kiểu | Bắt buộc | Mục đích |
|---|---|---|---|
| page | integer | Không | Trang, bắt đầu từ 1. |
| limit | integer | Không | Số bản ghi mỗi trang. |

Ví dụ tất cả trường có thể nhập (chỉ giữ các bộ lọc cần sử dụng; trường theo vai trò phải phù hợp tài khoản):

~~~json
{
  "page": 1,
  "limit": 1
}
~~~

Trường response item: academicPeriod, semester, createdByUser, id, kind, status, createdBy, ojtSemesterId, academicPeriodId, createdAt, completedAt.

## POST /api/json/student/ojt-registration-windows/list

scope/deadline, canRegister/blockReasons

| Trường | Kiểu | Bắt buộc | Mục đích |
|---|---|---|---|
| ojtSemesterId | integer | Không | ID kỳ OJT. |
| page | integer | Không | Trang, bắt đầu từ 1. |
| limit | integer | Không | Số bản ghi mỗi trang. |
| studentId | integer | Có | studentId chọn đối tượng truy xuất, FE phải nhập; bắt buộc cho mọi vai trò. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này. |

Ví dụ tất cả trường có thể nhập (chỉ giữ các bộ lọc cần sử dụng; trường theo vai trò phải phù hợp tài khoản):

~~~json
{
  "ojtSemesterId": 1,
  "page": 1,
  "limit": 1,
  "studentId": 1
}
~~~

Trường response item: id, ojtSemesterId, academicPeriodId, requiredRelativeSemester, registrationId, name, status, registrationStatus, period, startsAt, endsAt, canRegister, blockReasons, academicPeriod, semester.

## POST /api/json/student/notifications/list

thông báo/lọc unread/phân trang, trả unreadCount cùng response

| Trường | Kiểu | Bắt buộc | Mục đích |
|---|---|---|---|
| unread | string (true, false) | Không | Bộ lọc unread. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |
| page | integer | Không | Trang, bắt đầu từ 1. |
| limit | integer | Không | Số bản ghi mỗi trang. |
| studentId | integer | Có | studentId chọn đối tượng truy xuất, FE phải nhập; bắt buộc cho mọi vai trò. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này. |

Ví dụ tất cả trường có thể nhập (chỉ giữ các bộ lọc cần sử dụng; trường theo vai trò phải phù hợp tài khoản):

~~~json
{
  "unread": "true",
  "page": 1,
  "limit": 1,
  "studentId": 1
}
~~~

Trường response item: id, title, content, sentAt, isRead.

## POST /api/json/student/combo-registration-windows/list

các đợt/lựa chọn khả dụng

| Trường | Kiểu | Bắt buộc | Mục đích |
|---|---|---|---|
| page | integer | Không | Trang, bắt đầu từ 1. |
| limit | integer | Không | Số bản ghi mỗi trang. |
| studentId | integer | Có | studentId chọn đối tượng truy xuất, FE phải nhập; bắt buộc cho mọi vai trò. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này. |

Ví dụ tất cả trường có thể nhập (chỉ giữ các bộ lọc cần sử dụng; trường theo vai trò phải phù hợp tài khoản):

~~~json
{
  "page": 1,
  "limit": 1,
  "studentId": 1
}
~~~

Trường response item: id, ojtSemesterId, academicPeriodId, initialWindowId, name, phase, status, period, startsAt, endsAt, effectiveEndsAt, canSelect, choices, academicPeriod, semester.

## POST /api/json/student/ojt-results/list

chỉ kết quả của mình được công bố

| Trường | Kiểu | Bắt buộc | Mục đích |
|---|---|---|---|
| ojtSemesterId | integer | Không | ID kỳ OJT. |
| page | integer | Không | Trang, bắt đầu từ 1. |
| limit | integer | Không | Số bản ghi mỗi trang. |
| studentId | integer | Có | studentId chọn đối tượng truy xuất, FE phải nhập; bắt buộc cho mọi vai trò. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này. |

Ví dụ tất cả trường có thể nhập (chỉ giữ các bộ lọc cần sử dụng; trường theo vai trò phải phù hợp tài khoản):

~~~json
{
  "ojtSemesterId": 1,
  "page": 1,
  "limit": 1,
  "studentId": 1
}
~~~

Trường response item: id, evaluationId, assignmentId, studentId, companyId, positionId, programId, studentCode, fullName, enterpriseName, ojtSemesterId, semesterCode, status, officialScore, completionScore, attitudeScore, skillScore, comments, evaluatedBy, confirmedBy, confirmedAt, source, outcome, student, program, company, position, semester, evaluatedByUser, confirmedByUser.

## POST /api/json/job-applications/list

Danh sách hồ sơ ứng tuyển doanh nghiệp

| Trường | Kiểu | Bắt buộc | Mục đích |
|---|---|---|---|
| applicationId | integer | Không | ID applicationId dùng để chọn/lọc dữ liệu trong DB. Tùy chọn; bỏ qua để không lọc theo ID này. |
| studentId | integer | Khi vai trò STUDENT | studentId chọn đối tượng truy xuất, FE phải nhập; bắt buộc khi đăng nhập vai trò STUDENT; vai trò quản trị có thể bỏ để xem toàn bộ. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này. |
| registrationId | integer | Không | ID registrationId dùng để chọn/lọc dữ liệu trong DB. Tùy chọn; bỏ qua để không lọc theo ID này. |
| ojtSemesterId | integer | Không | ID ojtSemesterId dùng để chọn/lọc dữ liệu trong DB. Tùy chọn; bỏ qua để không lọc theo ID này. |
| companyId | integer | Không | ID companyId dùng để chọn/lọc dữ liệu trong DB. Tùy chọn; bỏ qua để không lọc theo ID này. |
| positionId | integer | Không | ID positionId dùng để chọn/lọc dữ liệu trong DB. Tùy chọn; bỏ qua để không lọc theo ID này. |
| page | integer | Không | Trang kết quả, mặc định 1. |
| limit | integer | Không | Số bản ghi mỗi trang, tối đa 100. |
| status | string (SUBMITTED, REVIEWING, INTERVIEW, OFFERED, ACCEPTED, REJECTED, WITHDRAWN) | Không | Bộ lọc status. Bỏ qua để dùng phạm vi mặc định được mô tả cho API. |

Ví dụ tất cả trường có thể nhập (chỉ giữ các bộ lọc cần sử dụng; trường theo vai trò phải phù hợp tài khoản):

~~~json
{
  "applicationId": 1,
  "studentId": 1,
  "registrationId": 1,
  "ojtSemesterId": 1,
  "companyId": 1,
  "positionId": 1,
  "page": 1,
  "limit": 1,
  "status": "SUBMITTED"
}
~~~

Trường response item: id, registrationId, studentId, studentCode, fullName, ojtSemesterId, postId, positionId, companyId, cvFileId, officialCheckId, status, coverLetter, appliedAt, updatedAt, cv, company, position, post, handedOff, coordination, student, semester.

## POST /api/json/students/me/opportunities/list

Vị trí tuyển dụng và quyền ứng tuyển

| Trường | Kiểu | Bắt buộc | Mục đích |
|---|---|---|---|
| ojtSemesterId | integer | Có | ID ojtSemesterId dùng để chọn/lọc dữ liệu trong DB. Bắt buộc. |
| page | integer | Không | Trang kết quả, mặc định 1. |
| limit | integer | Không | Số bản ghi mỗi trang, tối đa 100. |
| studentId | integer | Có | studentId chọn đối tượng truy xuất, FE phải nhập; bắt buộc cho mọi vai trò. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này. |

Ví dụ tất cả trường có thể nhập (chỉ giữ các bộ lọc cần sử dụng; trường theo vai trò phải phù hợp tài khoản):

~~~json
{
  "ojtSemesterId": 1,
  "page": 1,
  "limit": 1,
  "studentId": 1
}
~~~

Trường response item: id, ojtSemesterId, code, title, description, requirements, location, workMode, capacity, remainingSlots, company, post, applicationId, canApply, blockers, semester.

## POST /api/json/internship-tasks/list

Danh sách task trong phạm vi tài khoản

| Trường | Kiểu | Bắt buộc | Mục đích |
|---|---|---|---|
| companyId | integer | Khi vai trò ENTERPRISE | companyId chọn đối tượng truy xuất, FE phải nhập; bắt buộc khi đăng nhập vai trò ENTERPRISE; vai trò quản trị có thể bỏ để xem toàn bộ. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này. |
| studentId | integer | Khi vai trò STUDENT | studentId chọn đối tượng truy xuất, FE phải nhập; bắt buộc khi đăng nhập vai trò STUDENT; vai trò quản trị có thể bỏ để xem toàn bộ. JWT chỉ dùng xác thực và kiểm tra quyền đối với ID này. |
| positionId | integer | Không | ID positionId dùng để chọn/lọc dữ liệu trong DB. Tùy chọn; bỏ qua để không lọc theo ID này. |
| ojtSemesterId | integer | Không | ID ojtSemesterId dùng để chọn/lọc dữ liệu trong DB. Tùy chọn; bỏ qua để không lọc theo ID này. |
| assignmentId | integer | Không | ID assignmentId dùng để chọn/lọc dữ liệu trong DB. Tùy chọn; bỏ qua để không lọc theo ID này. |
| page | integer | Không | Trang kết quả, mặc định 1. |
| limit | integer | Không | Số bản ghi mỗi trang, tối đa 100. |

Ví dụ tất cả trường có thể nhập (chỉ giữ các bộ lọc cần sử dụng; trường theo vai trò phải phù hợp tài khoản):

~~~json
{
  "companyId": 1,
  "studentId": 1,
  "positionId": 1,
  "ojtSemesterId": 1,
  "assignmentId": 1,
  "page": 1,
  "limit": 1
}
~~~

Trường response item: student, company, position, semester, id, assignmentId, studentId, companyId, positionId, ojtSemesterId, name, description, status, assignedDate, dueDate, assignment, studentCode, fullName, companyName, positionTitle, semesterCode.
