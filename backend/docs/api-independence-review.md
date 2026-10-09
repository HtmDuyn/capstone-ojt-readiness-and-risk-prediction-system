# Rà soát khả năng gọi độc lập và nhập tay

Ngày: 08/10/2026. Phạm vi: toàn bộ 119 operation trong Swagger hiện tại, middleware, nhóm service backend, DB tham chiếu/trạng thái liên quan và lớp gọi API frontend. Đây là rà soát cấu trúc/mã nguồn, không phải xác nhận toàn bộ ca nghiệp vụ trên dữ liệu thật.

Bảng API cũ phía dưới được giữ để đối chiếu mã nghiệp vụ; hợp đồng nhập JSON hiện hành nằm trong `api-input-reference.md`.

## Kết luận

- Cập nhật: 87 operation từng dùng ID trên URL hoặc query đã có cách gọi JSON tại `/api/json/...`. Swagger hiển thị tổng cộng 119 operation và không còn đầu vào path/query. API đọc có đầu vào dùng POST. API cũ vẫn hoạt động để tương thích. Xem [hợp đồng JSON và bảng ánh xạ](api-input-reference.md).
- Swagger không có cơ chế khóa API B cho đến khi người dùng bấm API A. CSS đã bỏ ẩn vùng tham số.
- Không phát hiện cơ chế req.session/previewToken/previousApi buộc chạy chuỗi request từ trình duyệt trong mã đã tìm kiếm. Token vẫn bắt buộc cho API được bảo vệ.
- Import tài khoản, kết quả môn và chương trình: commit tự kiểm tra payload, không đòi một lần preview trước đó.
- Dữ liệu tham chiếu và trạng thái nghiệp vụ vẫn có phụ thuộc. Không thể bảo đảm mọi request thành công trên DB trống hoặc ID bất kỳ mà vẫn giữ quy chế đã chốt.
- Frontend hiện tìm thấy authService gọi login/me và Axios gắn token; không có cơ chế phụ thuộc thứ tự của toàn bộ nghiệp vụ học vụ trong lớp gọi API đã đọc. Trang dùng mock không chứng minh tích hợp nghiệp vụ.

## Những phụ thuộc cần giữ trong production

| Chức năng | Điều kiện cần | Cách test riêng |
| --- | --- | --- |
| Gán lộ trình | Sinh viên, khóa/nhóm và kỳ tồn tại | Dùng ID từ dữ liệu đã chuẩn bị |
| Chọn combo | Chương trình published, lịch và đợt OPEN, roster hợp lệ | Dữ liệu kiểm thử sẵn ở trạng thái OPEN |
| Chốt combo | Đợt CLOSED, lựa chọn/roster hợp lệ | Dữ liệu kiểm thử sẵn ở trạng thái CLOSED |
| Xác nhận điều kiện | Check còn hiệu lực, đợt xét sau Block 3 mở | Dữ liệu kiểm thử sẵn ở giai đoạn xét chính thức |
| Bàn giao QHDN | Hồ sơ duyệt và ELIGIBLE chính thức hiện hành | Dữ liệu kiểm thử sẵn đã duyệt/xét |
| Xác nhận điểm OJT | Hồ sơ, đánh giá, điểm và ánh xạ | Dữ liệu kiểm thử sẵn PENDING_ACADEMIC_CONFIRMATION |
| Retry email | Email FAILED còn hạn, tài khoản còn dùng mật khẩu tạm | DB riêng, vô hiệu gửi email thật |

## Hướng giải quyết mục tiêu test từng chức năng

Theo yêu cầu đã chốt: người dùng tự insert dữ liệu mẫu vào DB ở các trạng thái phù hợp. FE nhập tay ID/query/JSON và gọi riêng API cần test, không bắt buộc gọi lại các API trước trong cùng phiên. Với thao tác thay đổi trạng thái, dùng bản ghi mẫu khác hoặc khôi phục dữ liệu cho lần test tiếp theo. Không tạo DB/bộ seed tự động và không bỏ validation production.

Đã bổ sung diễn giải ID, trường nhập tay và ví dụ import trong Swagger; schema request mở sẵn để FE xem. OpenAPI JSON tại /api-docs/openapi.json. Xem [toàn bộ trường đầu vào cho FE](api-input-reference.md). Không thay đổi dữ liệu DB hoặc thêm phụ thuộc phiên gọi API.

## Danh sách toàn bộ API và đầu vào nhập tay

| Method | API | Path/query nhập tay | Body nhập tay | Phụ thuộc dữ liệu/trạng thái |
| --- | --- | --- | --- | --- |
| GET | /api/academic-imports | query: page, query: limit, query: kind, query: status | — | Lịch sử import tồn tại nếu xem chi tiết |
| GET | /api/academic-imports/{id} | path: id, query: page, query: limit | — | Lịch sử import tồn tại nếu xem chi tiết |
| GET | /api/academic-periods | query: page, query: limit, query: search, query: status, query: academicYearId, query: kind | — | Đọc dữ liệu hiện có; danh sách có thể rỗng |
| POST | /api/academic-periods | — | academicYearId, periodCode, name, kind, parentPeriodId, startDate, endDate, status | Tham chiếu dữ liệu hợp lệ; quyền và validation theo chức năng |
| PATCH | /api/academic-periods/{id} | path: id | academicYearId, periodCode, name, kind, parentPeriodId, startDate, endDate, status | Tham chiếu dữ liệu hợp lệ; quyền và validation theo chức năng |
| GET | /api/academic-periods/{id}/combo-phase-schedules | path: id | — | Kỳ SEMESTER hoặc Block 3 đúng giai đoạn |
| PUT | /api/academic-periods/{id}/combo-phase-schedules | path: id | phase, startsAt, endsAt, reason | Kỳ SEMESTER hoặc Block 3 đúng giai đoạn |
| GET | /api/academic-years | query: page, query: limit, query: search, query: status | — | Đọc dữ liệu hiện có; danh sách có thể rỗng |
| POST | /api/academic-years | — | yearCode, startDate, endDate, status | Tham chiếu dữ liệu hợp lệ; quyền và validation theo chức năng |
| PATCH | /api/academic-years/{id} | path: id | yearCode, startDate, endDate, status | Tham chiếu dữ liệu hợp lệ; quyền và validation theo chức năng |
| GET | /api/academic/alerts | query: ojtSemesterId, query: programId, query: cohortId, query: majorId, query: comboId, query: groupCode, query: academicPeriodId, query: assessmentDeadline, query: type, query: page, query: limit | — | Dữ liệu học vụ thật để thống kê; notifications dùng outbox |
| POST | /api/academic/alerts/notifications | — | ojtSemesterId, programId, cohortId, majorId, comboId, groupCode, academicPeriodId, assessmentDeadline, studentIds, channel, reason, idempotencyKey | Dữ liệu học vụ thật để thống kê; notifications dùng outbox |
| GET | /api/academic/course-demand | query: ojtSemesterId, query: programId, query: cohortId, query: majorId, query: comboId, query: groupCode, query: academicPeriodId, query: assessmentDeadline, query: courseId, query: includeInProgress, query: page, query: limit | — | Dữ liệu học vụ thật để thống kê; notifications dùng outbox |
| GET | /api/academic/course-demand/export | query: ojtSemesterId, query: programId, query: cohortId, query: majorId, query: comboId, query: groupCode, query: academicPeriodId, query: assessmentDeadline, query: courseId, query: includeInProgress, query: format | — | Dữ liệu học vụ thật để thống kê; notifications dùng outbox |
| GET | /api/academic/dashboard | query: ojtSemesterId, query: programId, query: cohortId, query: majorId, query: comboId, query: groupCode, query: academicPeriodId, query: assessmentDeadline | — | Dữ liệu học vụ thật để thống kê; notifications dùng outbox |
| GET | /api/academic/eligibility-statistics | query: ojtSemesterId, query: programId, query: cohortId, query: majorId, query: comboId, query: groupCode, query: academicPeriodId, query: assessmentDeadline, query: groupBy | — | Chương trình/quy tắc/lộ trình/điểm thực; publish/confirm có trạng thái |
| GET | /api/accounts | query: page, query: limit, query: search, query: roleCode, query: status | — | Đọc dữ liệu hiện có; danh sách có thể rỗng |
| POST | /api/accounts | — | username, email, password, fullName, phone, roleId | Tham chiếu dữ liệu hợp lệ; quyền và validation theo chức năng |
| GET | /api/accounts/{userId} | path: userId | — | Đọc dữ liệu hiện có; danh sách có thể rỗng |
| PUT | /api/accounts/{userId} | path: userId | fullName, phone, email | Tham chiếu dữ liệu hợp lệ; quyền và validation theo chức năng |
| PATCH | /api/accounts/{userId}/role | path: userId | roleId | Tham chiếu dữ liệu hợp lệ; quyền và validation theo chức năng |
| PATCH | /api/accounts/{userId}/status | path: userId | status | Tham chiếu dữ liệu hợp lệ; quyền và validation theo chức năng |
| GET | /api/accounts/me/profile | — | — | Đọc dữ liệu hiện có; danh sách có thể rỗng |
| PATCH | /api/accounts/me/profile | — | fullName, phone | Tham chiếu dữ liệu hợp lệ; quyền và validation theo chức năng |
| POST | /api/auth/change-password | — | currentPassword, newPassword | Tài khoản/token phù hợp; đổi mật khẩu tạm nếu được yêu cầu |
| POST | /api/auth/login | — | email, password | Tài khoản/token phù hợp; đổi mật khẩu tạm nếu được yêu cầu |
| POST | /api/auth/logout | — | — | Tài khoản/token phù hợp; đổi mật khẩu tạm nếu được yêu cầu |
| GET | /api/auth/me | — | — | Tài khoản/token phù hợp; đổi mật khẩu tạm nếu được yêu cầu |
| GET | /api/cohorts | query: page, query: limit, query: search, query: status | — | Đọc dữ liệu hiện có; danh sách có thể rỗng |
| POST | /api/cohorts | — | cohortCode, name, enrollmentYear, status, groups | Tham chiếu dữ liệu hợp lệ; quyền và validation theo chức năng |
| PATCH | /api/cohorts/{id} | path: id | cohortCode, name, enrollmentYear, status, groups | Tham chiếu dữ liệu hợp lệ; quyền và validation theo chức năng |
| GET | /api/combo-registration-windows | query: page, query: limit, query: phase, query: status, query: academicPeriodId | — | Lịch/roster/chương trình thực; OPEN để chọn, CLOSED để finalize |
| POST | /api/combo-registration-windows | — | name, phase, academicPeriodId, ojtSemesterId, initialWindowId, scope, startsAt, endsAt | Lịch/roster/chương trình thực; OPEN để chọn, CLOSED để finalize |
| PATCH | /api/combo-registration-windows/{id} | path: id | name, phase, academicPeriodId, ojtSemesterId, initialWindowId, scope, startsAt, endsAt | Lịch/roster/chương trình thực; OPEN để chọn, CLOSED để finalize |
| POST | /api/combo-registration-windows/{id}/close | path: id | reason | Lịch/roster/chương trình thực; OPEN để chọn, CLOSED để finalize |
| POST | /api/combo-registration-windows/{id}/extensions | path: id | studentIds, endsAt, reason | Lịch/roster/chương trình thực; OPEN để chọn, CLOSED để finalize |
| POST | /api/combo-registration-windows/{id}/finalize | path: id | idempotencyKey, reason, allowUnselected, excludeStudentIds | Lịch/roster/chương trình thực; OPEN để chọn, CLOSED để finalize |
| POST | /api/combo-registration-windows/{id}/open | path: id | reason | Lịch/roster/chương trình thực; OPEN để chọn, CLOSED để finalize |
| POST | /api/combo-registration-windows/{id}/preview | path: id | studentId, comboId, courseIds | Lịch/roster/chương trình thực; OPEN để chọn, CLOSED để finalize |
| POST | /api/combo-registration-windows/{id}/reminders | path: id | idempotencyKey, studentIds, target, reason | Lịch/roster/chương trình thực; OPEN để chọn, CLOSED để finalize |
| GET | /api/combo-registration-windows/{id}/selections | path: id, query: page, query: limit, query: status | — | Lịch/roster/chương trình thực; OPEN để chọn, CLOSED để finalize |
| POST | /api/combo-registration-windows/{id}/selections | path: id | studentId, comboId, courseIds, reason | Lịch/roster/chương trình thực; OPEN để chọn, CLOSED để finalize |
| PUT | /api/combos/{id}/courses | path: id | courses, choiceGroups | Dữ liệu master tồn tại; chương trình published được bảo vệ |
| POST | /api/course-result-imports/commit | — | idempotencyKey, sourceName, rows | Sinh viên/môn/kỳ tồn tại; commit không bắt buộc preview |
| POST | /api/course-result-imports/preview | — | idempotencyKey, sourceName, rows | Sinh viên/môn/kỳ tồn tại; commit không bắt buộc preview |
| PATCH | /api/course-results/{id} | path: id | academicPeriodId, attemptNumber, status, score, gradePoints, grade, sourceReference, courseId, reason | Sinh viên/khóa/nhóm/kỳ/môn tồn tại; placement trước tính lộ trình |
| GET | /api/courses | query: page, query: limit, query: search | — | Đọc dữ liệu hiện có; danh sách có thể rỗng |
| POST | /api/courses | — | code, name, defaultCredits, isOjtPrerequisite | Tham chiếu dữ liệu hợp lệ; quyền và validation theo chức năng |
| PATCH | /api/courses/{id} | path: id | code, name, defaultCredits, isOjtPrerequisite | Tham chiếu dữ liệu hợp lệ; quyền và validation theo chức năng |
| GET | /api/curricula | query: page, query: limit, query: search, query: majorId, query: status, query: version | — | Dữ liệu master tồn tại; chương trình published được bảo vệ |
| POST | /api/curricula | — | code, name, version, majorId, totalCredits, effectiveYear, gpaScale | Dữ liệu master tồn tại; chương trình published được bảo vệ |
| GET | /api/curricula/{id} | path: id | — | Dữ liệu master tồn tại; chương trình published được bảo vệ |
| PATCH | /api/curricula/{id} | path: id | code, name, version, majorId, totalCredits, effectiveYear, gpaScale | Dữ liệu master tồn tại; chương trình published được bảo vệ |
| GET | /api/curricula/{id}/combos | path: id | — | Dữ liệu master tồn tại; chương trình published được bảo vệ |
| POST | /api/curricula/{id}/combos | path: id | code, name, selectionGroup, note | Dữ liệu master tồn tại; chương trình published được bảo vệ |
| PUT | /api/curricula/{id}/course-equivalences | path: id | equivalences | Dữ liệu master tồn tại; chương trình published được bảo vệ |
| PUT | /api/curricula/{id}/courses | path: id | courses | Dữ liệu master tồn tại; chương trình published được bảo vệ |
| GET | /api/curricula/{id}/ojt-grade-mappings/{semesterId} | path: id, path: semesterId | — | Chương trình published, môn/kỳ thực; ánh xạ đã dùng bất biến |
| PUT | /api/curricula/{id}/ojt-grade-mappings/{semesterId} | path: id, path: semesterId | courseId, academicPeriodId, gradeBands, reason | Chương trình published, môn/kỳ thực; ánh xạ đã dùng bất biến |
| PUT | /api/curricula/{id}/prerequisites | path: id | prerequisites | Dữ liệu master tồn tại; chương trình published được bảo vệ |
| POST | /api/curricula/{id}/publish | path: id | reason | Dữ liệu master tồn tại; chương trình published được bảo vệ |
| POST | /api/curriculum-imports/commit | — | idempotencyKey, sourceName, curriculum, courses, prerequisites, combos, equivalences | Dữ liệu master và payload đầy đủ; commit không bắt buộc preview |
| POST | /api/curriculum-imports/preview | — | idempotencyKey, sourceName, curriculum, courses, prerequisites, combos, equivalences | Dữ liệu master và payload đầy đủ; commit không bắt buộc preview |
| POST | /api/eligibility-check-runs | — | ojtSemesterId, idempotencyKey, programIds, cohortIds, studentIds, groupCodes | Chương trình/quy tắc/lộ trình/điểm thực; publish/confirm có trạng thái |
| GET | /api/eligibility-check-runs/{id} | path: id, query: page, query: limit | — | Chương trình/quy tắc/lộ trình/điểm thực; publish/confirm có trạng thái |
| POST | /api/eligibility-checks/{id}/confirm | path: id | reason | Check tồn tại, chưa stale; đợt xét chính thức mở sau Block 3 |
| GET | /api/health | — | — | Đọc dữ liệu hiện có; danh sách có thể rỗng |
| POST | /api/imports/archive | — | — | Dữ liệu master theo loại import; commit không bắt buộc gọi preview |
| POST | /api/imports/commit | — | kind, idempotencyKey, semesterId, rows | Dữ liệu master theo loại import; commit không bắt buộc gọi preview |
| GET | /api/imports/emails | — | — | Dữ liệu master theo loại import; commit không bắt buộc gọi preview |
| POST | /api/imports/emails/{emailId}/retry | path: emailId | — | Dữ liệu master theo loại import; commit không bắt buộc gọi preview |
| POST | /api/imports/preview | — | kind, idempotencyKey, semesterId, rows | Dữ liệu master theo loại import; commit không bắt buộc gọi preview |
| GET | /api/majors | query: page, query: limit, query: search, query: parentMajorId | — | Đọc dữ liệu hiện có; danh sách có thể rỗng |
| POST | /api/majors | — | code, name, parentMajorId | Tham chiếu dữ liệu hợp lệ; quyền và validation theo chức năng |
| GET | /api/ojt-registration-windows | query: ojtSemesterId, query: status, query: page, query: limit | — | Đợt/placement/kỳ hợp lệ; duyệt/bàn giao cần ELIGIBLE chính thức |
| POST | /api/ojt-registration-windows | — | ojtSemesterId, name, scope, startsAt, endsAt, reason, academicPeriodId, requiredRelativeSemester | Đợt/placement/kỳ hợp lệ; duyệt/bàn giao cần ELIGIBLE chính thức |
| PATCH | /api/ojt-registration-windows/{id} | path: id | ojtSemesterId, name, scope, startsAt, endsAt, reason, academicPeriodId, requiredRelativeSemester | Đợt/placement/kỳ hợp lệ; duyệt/bàn giao cần ELIGIBLE chính thức |
| POST | /api/ojt-registration-windows/{id}/close | path: id | reason | Đợt/placement/kỳ hợp lệ; duyệt/bàn giao cần ELIGIBLE chính thức |
| POST | /api/ojt-registration-windows/{id}/open | path: id | reason | Đợt/placement/kỳ hợp lệ; duyệt/bàn giao cần ELIGIBLE chính thức |
| POST | /api/ojt-registration-windows/{id}/semester-exceptions | path: id | studentIds, relativeSemester, expiresAt, reason | Đợt/placement/scope thực; ngoại lệ đúng kỳ, hạn và lý do |
| POST | /api/ojt-registration-windows/{id}/semester-exceptions/{exceptionId}/revoke | path: id, path: exceptionId | reason | Đợt/placement/scope thực; ngoại lệ đúng kỳ, hạn và lý do |
| GET | /api/ojt-registrations | query: ojtSemesterId, query: windowId, query: studentId, query: programId, query: cohortId, query: groupCode, query: status, query: search, query: page, query: limit | — | Đợt/placement/kỳ hợp lệ; duyệt/bàn giao cần ELIGIBLE chính thức |
| POST | /api/ojt-registrations | — | windowId, studentId, application | Đợt/placement/kỳ hợp lệ; duyệt/bàn giao cần ELIGIBLE chính thức |
| GET | /api/ojt-registrations/{id} | path: id | — | Đợt/placement/kỳ hợp lệ; duyệt/bàn giao cần ELIGIBLE chính thức |
| POST | /api/ojt-registrations/{id}/review | path: id | decision, reason, idempotencyKey | Đợt/placement/kỳ hợp lệ; duyệt/bàn giao cần ELIGIBLE chính thức |
| GET | /api/ojt-results | query: status, query: ojtSemesterId, query: studentId, query: search, query: page, query: limit | — | Hồ sơ/assignment/đánh giá thực; confirm cần điểm và ánh xạ |
| POST | /api/ojt-results | — | assignmentId, dossier, reason, idempotencyKey | Hồ sơ/assignment/đánh giá thực; confirm cần điểm và ánh xạ |
| GET | /api/ojt-results/{id} | path: id | — | Hồ sơ/assignment/đánh giá thực; confirm cần điểm và ánh xạ |
| PATCH | /api/ojt-results/{id} | path: id | expectedVersion, reason, officialScore, outcome, academicNote | Hồ sơ/assignment/đánh giá thực; confirm cần điểm và ánh xạ |
| POST | /api/ojt-results/{id}/confirm | path: id | expectedVersion, reason | Hồ sơ/assignment/đánh giá thực; confirm cần điểm và ánh xạ |
| POST | /api/ojt-results/{id}/revision-requests | path: id | expectedVersion, reason | Hồ sơ/assignment/đánh giá thực; confirm cần điểm và ánh xạ |
| POST | /api/ojt-results/{id}/transfer | path: id | expectedVersion, reason, dossier, idempotencyKey | Hồ sơ/assignment/đánh giá thực; confirm cần điểm và ánh xạ |
| GET | /api/ojt-rule-sets | query: programId, query: ojtSemesterId, query: status, query: page, query: limit | — | Chương trình/quy tắc/lộ trình/điểm thực; publish/confirm có trạng thái |
| POST | /api/ojt-rule-sets | — | programId, ojtSemesterId, version, name, minCredits, maxUnpassedCourses, debtBasis | Chương trình/quy tắc/lộ trình/điểm thực; publish/confirm có trạng thái |
| PATCH | /api/ojt-rule-sets/{id} | path: id | programId, ojtSemesterId, version, name, minCredits, maxUnpassedCourses, debtBasis | Chương trình/quy tắc/lộ trình/điểm thực; publish/confirm có trạng thái |
| POST | /api/ojt-rule-sets/{id}/publish | path: id | — | Chương trình/quy tắc/lộ trình/điểm thực; publish/confirm có trạng thái |
| GET | /api/ojt-semesters | query: page, query: limit, query: search, query: status, query: academicYearId | — | Đọc dữ liệu hiện có; danh sách có thể rỗng |
| POST | /api/ojt-semesters | — | academicYearId, semesterCode, name, academicPeriodId, startDate, endDate, regStartDate, regEndDate, status | Tham chiếu dữ liệu hợp lệ; quyền và validation theo chức năng |
| PATCH | /api/ojt-semesters/{id} | path: id | academicYearId, semesterCode, name, academicPeriodId, startDate, endDate, regStartDate, regEndDate, status | Tham chiếu dữ liệu hợp lệ; quyền và validation theo chức năng |
| GET | /api/ojt-semesters/{id}/assessment-window | path: id | — | Kỳ OJT/Block 3 tồn tại; mở xét sau hoàn tất điểm và đúng mốc |
| PUT | /api/ojt-semesters/{id}/assessment-window | path: id | blockPeriodId, opensAt, closesAt, reason | Kỳ OJT/Block 3 tồn tại; mở xét sau hoàn tất điểm và đúng mốc |
| POST | /api/ojt-semesters/{id}/assessment-window/close | path: id | reason | Kỳ OJT/Block 3 tồn tại; mở xét sau hoàn tất điểm và đúng mốc |
| POST | /api/ojt-semesters/{id}/assessment-window/open | path: id | reason, resultsFinalized | Kỳ OJT/Block 3 tồn tại; mở xét sau hoàn tất điểm và đúng mốc |
| GET | /api/ojt-semesters/{id}/eligible-student-handoffs | path: id, query: page, query: limit | — | Đợt/placement/kỳ hợp lệ; duyệt/bàn giao cần ELIGIBLE chính thức |
| POST | /api/ojt-semesters/{id}/eligible-student-handoffs | path: id | registrationIds, idempotencyKey, reason | Đợt/placement/kỳ hợp lệ; duyệt/bàn giao cần ELIGIBLE chính thức |
| GET | /api/ojt-semesters/{id}/results/export | path: id, query: status, query: ojtSemesterId, query: studentId, query: search, query: format | — | Hồ sơ/assignment/đánh giá thực; confirm cần điểm và ánh xạ |
| GET | /api/ojt-semesters/{id}/students | path: id, query: programId, query: cohortId, query: groupCode, query: registrationStatus, query: search, query: page, query: limit | — | Sinh viên/khóa/nhóm/kỳ/môn tồn tại; placement trước tính lộ trình |
| GET | /api/roles | — | — | Đọc dữ liệu hiện có; danh sách có thể rỗng |
| GET | /api/students | query: page, query: limit, query: search, query: status, query: programId, query: cohortId, query: groupCode, query: enrollmentYear, query: currentSemester | — | Sinh viên/khóa/nhóm/kỳ/môn tồn tại; placement trước tính lộ trình |
| GET | /api/students/{id} | path: id | — | Sinh viên/khóa/nhóm/kỳ/môn tồn tại; placement trước tính lộ trình |
| PATCH | /api/students/{id} | path: id | fullName, phone, className, status, programId, reason | Sinh viên/khóa/nhóm/kỳ/môn tồn tại; placement trước tính lộ trình |
| PATCH | /api/students/{id}/academic-placement | path: id | cohortId, groupCode, entryAcademicPeriodId, currentAcademicPeriodId, programId, reason | Sinh viên/khóa/nhóm/kỳ/môn tồn tại; placement trước tính lộ trình |
| GET | /api/students/{id}/academic-progress | path: id | — | Sinh viên/khóa/nhóm/kỳ/môn tồn tại; placement trước tính lộ trình |
| GET | /api/students/{id}/combo-selections | path: id, query: page, query: limit | — | Lịch/roster/chương trình thực; OPEN để chọn, CLOSED để finalize |
| GET | /api/students/{id}/course-results | path: id, query: page, query: limit, query: courseId, query: academicPeriodId, query: status | — | Sinh viên/khóa/nhóm/kỳ/môn tồn tại; placement trước tính lộ trình |
| GET | /api/students/{id}/eligibility | path: id, query: ojtSemesterId | — | Chương trình/quy tắc/lộ trình/điểm thực; publish/confirm có trạng thái |
| GET | /api/students/{id}/eligibility-checks | path: id, query: ojtSemesterId, query: page, query: limit | — | Chương trình/quy tắc/lộ trình/điểm thực; publish/confirm có trạng thái |
| POST | /api/students/{id}/eligibility-checks | path: id | ojtSemesterId | Chương trình/quy tắc/lộ trình/điểm thực; publish/confirm có trạng thái |
| PATCH | /api/students/academic-placement | — | studentId, cohortId, groupCode, entryAcademicPeriodId, currentAcademicPeriodId, programId, reason | Sinh viên/khóa/nhóm/kỳ/môn tồn tại; placement trước tính lộ trình |

## Kiểm tra cấu trúc

119 operations; 70 path parameters và 163 query parameters được khai báo; 70 request bodies. Không thiếu khai báo ID required trong URL.

117 protected operations được gọi không token: đều trả 401; không thực hiện ghi dữ liệu thật.

## Kiểm chứng hợp đồng JSON toàn bộ API — 08/10/2026

- Đối chiếu route Express thực tế với hợp đồng OpenAPI: đủ 119/119 operation, không có API thiếu tài liệu hoặc thiếu handler.
- 87 adapter đã được kiểm tra từng route với đầy đủ ID, bộ lọc và dữ liệu JSON; 167 kiểm tra chuyển đầu vào và thiếu trường bắt buộc đều đạt. Các kiểm tra này dùng dispatcher thay thế, không xác nhận toàn bộ quy tắc nghiệp vụ và không ghi DB.
- Swagger có 112 operation nhận JSON body, không có path/query inputs. 7 operation không cần body: health, roles, auth/me, auth/logout, accounts/me/profile, imports/emails, imports/archive. Các thao tác này vẫn có thể yêu cầu xác thực/phân quyền.
- Bộ sinh hợp đồng JSON kiểm tra lại để báo lỗi khi còn API hiển thị path/query inputs hoặc placeholder URL chưa được chuyển.
- Bearer token tiếp tục nhập bằng Authorize; response CSV của các API xuất báo cáo được giữ nguyên.
