# Danh sách API theo role — đã triển khai kỳ 5 → OJT

Đối chiếu file Văn bản đã dán.txt và checkout hiện tại ngày 13/10/2026. Chỉ kiểm tra source/router/service/schema; chưa xác nhận triển khai trên server hoặc dữ liệu DB thật. Đã triển khai theo checklist: 48 operation mới và 24 operation cần sửa/đối chiếu. Cấu hình và hợp đồng request/response: [student-portal-api.md](student-portal-api.md). Migration chưa chạy trên DB thật.

Quy ước: **Có — dùng lại** = route giữ nguyên; **Đã sửa/đối chiếu** = yêu cầu chỉnh sửa đã xử lý; **Đã tạo** = route mới đã được mount, có Swagger và kiểm thử; **Đã tạo — cần cấu hình AI** = API có thật, cần provider/model/dữ liệu thực tế. **Có — để sau** = các API Admin AI đã có từ trước. Cột mô tả là checklist yêu cầu gốc; chi tiết thực thi và giới hạn hiện tại nằm trong tài liệu triển khai.

Phạm vi chốt: QHDN import sheet đối tác/vị trí/chỉ tiêu và quản lý công bố; DN không tự đăng tuyển. Sinh viên chỉ nhận đề xuất môn học, không đăng ký lớp. Upload CV là nghiệp vụ tệp độc lập; đọc CV/dự báo AI/matching làm sau. Điều kiện chính thức: >=70 tín chỉ và <=2 môn đã trượt nhưng chưa được khắc phục. Không xét thêm GPA hay bắt buộc pass tất cả môn nếu chưa có quy chế đó.

## 1. Dùng chung — xác thực và hồ sơ tài khoản

| Trạng thái | Method | Endpoint | Chức năng / việc cần làm |
|---|---|---|---|
| Có — dùng lại | POST | `/api/auth/login` | Đăng nhập; public. |
| Có — dùng lại | POST | `/api/auth/logout` | Tài khoản đăng nhập. |
| Đã sửa/đối chiếu | GET | `/api/auth/me` | Bổ sung studentId cho STUDENT, có thể enterpriseId cho ENTERPRISE. Không cần tạo thêm /student/me. |
| Có — dùng lại | POST | `/api/auth/change-password` | Đổi mật khẩu của mình. |
| Có — dùng lại | GET | `/api/accounts/me/profile` | Đọc hồ sơ tài khoản của mình; khác hồ sơ học vụ. |
| Có — dùng lại | PATCH | `/api/accounts/me/profile` | Sửa các trường cá nhân được phép, không sửa điểm/chương trình/trạng thái OJT. |
| Có — dùng lại | GET | `/api/accounts/:userId` | ADMIN đọc tất cả; role khác chỉ tài khoản mình theo kiểm tra service. |
| Có — dùng lại | PUT | `/api/accounts/:userId` | ADMIN hoặc bản thân với trường được phép. |

## 2. ADMIN — quản trị nền, không thay vai trò nghiệp vụ

| Trạng thái | Method | Endpoint | Chức năng / việc cần làm |
|---|---|---|---|
| Có — dùng lại | GET | `/api/roles` | Danh sách 5 role cố định. |
| Có — dùng lại | GET | `/api/accounts` | Danh sách tài khoản. |
| Có — dùng lại | POST | `/api/accounts` | Tạo tài khoản. |
| Có — dùng lại | PATCH | `/api/accounts/:userId/role` | Đổi role theo ràng buộc service. |
| Có — dùng lại | PATCH | `/api/accounts/:userId/status` | Khóa/mở tài khoản. |
| Có — dùng lại | POST | `/api/auth/users/:userId/password-reset` | Đã có. Sửa endpoint cũ /accounts/:userId/password-reset trong list thành endpoint này. |
| Có — dùng lại | POST | `/api/students` | Tạo sinh viên đơn lẻ; trong file cũ bị đánh dấu chưa có. |
| Có — dùng lại | DELETE | `/api/students/:id` | Xóa mềm sinh viên. |
| Có — dùng lại | GET | `/api/students/export` | Xuất danh sách sinh viên. |
| Có — dùng lại | DELETE | `/api/companies/:id` | Xóa mềm doanh nghiệp, ADMIN; QHDN dùng trạng thái INACTIVE. |
| Có — dùng lại | DELETE | `/api/positions/:id` | Xóa mềm vị trí, ADMIN; QHDN dùng CLOSED. |
| Đã sửa/đối chiếu | GET | `/api/ojt-semesters/:id` | Hiện chỉ ADMIN. Mở đọc ACADEMIC/OJT_COORD để dùng chi tiết kỳ, không mở sửa cho QHDN. |
| Có — dùng lại | GET | `/api/admin/dashboard/summary` | Đã có tổng quan tài khoản/SV/DN/kỳ. |
| Có — để sau | GET | `/api/admin/dashboard/readiness` | Đã có route, số liệu phụ thuộc dữ liệu dự đoán; để giai đoạn AI. |
| Có — để sau | GET | `/api/admin/dashboard/risks` | Đã có route, không coi là AI/model đã chạy thành công. |
| Có — để sau | GET | `/api/admin/dashboard/trends` | Đã có route xu hướng; phần prediction để sau. |
| Có — dùng lại | GET | `/api/assessment-templates` | Đã có danh sách bộ tiêu chí đánh giá thực tập. |
| Có — dùng lại | GET | `/api/assessment-templates/:id` | Đã có chi tiết. |
| Có — dùng lại | POST | `/api/assessment-templates` | Đã có tạo bản tiêu chí. |
| Có — dùng lại | PATCH | `/api/assessment-templates/:id` | Sửa bản nháp. |
| Có — dùng lại | POST | `/api/assessment-templates/:id/publish` | Phát hành phiên bản bất biến. |
| Có — dùng lại | GET | `/api/assessments` | Đã có alias đọc đánh giá cho ADMIN; dùng /internship-evaluations cho luồng nghiệp vụ chung. |
| Có — dùng lại | GET | `/api/assessments/:id` | Chi tiết đánh giá cho ADMIN, không tạo lại. |
| Có — dùng lại | GET | `/api/admin/audit-logs` | Đã có, khác các danh sách cũ. |
| Có — dùng lại | GET | `/api/imports/emails` | Danh sách email provisioning. |
| Có — dùng lại | POST | `/api/imports/emails/:emailId/retry` | Retry email provisioning đủ điều kiện, không phải retry mọi loại thông báo. |

## 3. ACADEMIC — Đào tạo (ADMIN cũng có quyền các API này)

| Trạng thái | Method | Endpoint | Chức năng / việc cần làm |
|---|---|---|---|
| Có — dùng lại | GET | `/api/academic-years` | Danh sách năm học |
| Có — dùng lại | POST | `/api/academic-years` | Tạo năm học; ADMIN/ACADEMIC. |
| Có — dùng lại | PATCH | `/api/academic-years/:id` | Sửa năm học; dùng lịch thực, không mặc định mọi kỳ đúng 4 tháng. |
| Có — dùng lại | GET | `/api/academic-periods` | Danh sách kỳ học/BLOCK3 |
| Có — dùng lại | POST | `/api/academic-periods` | Tạo kỳ học/BLOCK3; ADMIN/ACADEMIC. |
| Có — dùng lại | PATCH | `/api/academic-periods/:id` | Sửa kỳ học/BLOCK3; dùng lịch thực, không mặc định mọi kỳ đúng 4 tháng. |
| Có — dùng lại | GET | `/api/cohorts` | Danh sách khóa sinh viên |
| Có — dùng lại | POST | `/api/cohorts` | Tạo khóa sinh viên; ADMIN/ACADEMIC. |
| Có — dùng lại | PATCH | `/api/cohorts/:id` | Sửa khóa sinh viên; dùng lịch thực, không mặc định mọi kỳ đúng 4 tháng. |
| Đã sửa/đối chiếu | GET | `/api/ojt-semesters` | Danh sách đợt OJT; OJT_COORD đã có quyền đọc, không cần mở lại. |
| Có — dùng lại | POST | `/api/ojt-semesters` | Tạo đợt OJT; ADMIN/ACADEMIC. |
| Có — dùng lại | PATCH | `/api/ojt-semesters/:id` | Sửa đợt OJT; dùng lịch thực, không mặc định mọi kỳ đúng 4 tháng. |
| Có — dùng lại | PATCH | `/api/students/:id/academic-placement` | Gán kỳ vào chuyên ngành/kỳ thực tế; BLOCK3 không tăng học kỳ. |
| Có — dùng lại | PATCH | `/api/students/academic-placement` | Alias nhận studentId trong body; không cần route mới. |
| Có — dùng lại | POST | `/api/imports/preview` | kind=STUDENT; đã nhận JSON, preview. |
| Có — dùng lại | POST | `/api/imports/commit` | kind=STUDENT; ADMIN/ACADEMIC, nhập tài khoản/hồ sơ. |
| Có — dùng lại | GET | `/api/students` | Danh sách SV; Student không được đọc toàn bộ. |
| Có — dùng lại | GET | `/api/students/:id` | Hồ sơ học vụ; Student chỉ mình. |
| Có — dùng lại | PATCH | `/api/students/:id` | Sửa hồ sơ có reason. |
| Có — dùng lại | GET | `/api/students/:id/course-results` | Bảng điểm/lần học. |
| Có — dùng lại | GET | `/api/students/:id/academic-progress` | Nguồn tính GPA/tín chỉ/thiếu cấu hình. |
| Có — dùng lại | POST | `/api/course-result-imports/preview` | Preview điểm; gồm dữ liệu liên quan BL3W. |
| Có — dùng lại | POST | `/api/course-result-imports/commit` | Commit điểm trước khi chốt. |
| Có — dùng lại | PATCH | `/api/course-results/:id` | Đính chính có reason/audit; ảnh hưởng stale của kết quả xét. |
| Có — dùng lại | GET | `/api/academic-imports` | Lịch sử import học vụ. |
| Có — dùng lại | GET | `/api/academic-imports/:id` | Chi tiết lô/lỗi. |
| Có — dùng lại | GET | `/api/majors` | Danh sách chuyên ngành; ADMIN/ACADEMIC. |
| Có — dùng lại | POST | `/api/majors` | Tạo chuyên ngành; ADMIN/ACADEMIC. |
| Có — dùng lại | GET | `/api/courses` | Danh sách môn; ADMIN/ACADEMIC. |
| Có — dùng lại | POST | `/api/courses` | Tạo môn; ADMIN/ACADEMIC. |
| Có — dùng lại | PATCH | `/api/courses/:id` | Sửa môn; ADMIN/ACADEMIC. |
| Có — dùng lại | GET | `/api/curricula` | Danh sách chương trình; ADMIN/ACADEMIC. |
| Có — dùng lại | POST | `/api/curricula` | Tạo chương trình; ADMIN/ACADEMIC. |
| Có — dùng lại | GET | `/api/curricula/:id` | Chi tiết chương trình; ADMIN/ACADEMIC. |
| Có — dùng lại | PATCH | `/api/curricula/:id` | Sửa chương trình nháp; ADMIN/ACADEMIC. |
| Có — dùng lại | POST | `/api/curriculum-imports/preview` | Preview chương trình; ADMIN/ACADEMIC. |
| Có — dùng lại | POST | `/api/curriculum-imports/commit` | Import chương trình; ADMIN/ACADEMIC. |
| Có — dùng lại | PUT | `/api/curricula/:id/courses` | Cấu trúc môn và tín chỉ; ADMIN/ACADEMIC. |
| Có — dùng lại | PUT | `/api/curricula/:id/prerequisites` | Môn tiên quyết; ADMIN/ACADEMIC. |
| Có — dùng lại | PUT | `/api/curricula/:id/course-equivalences` | Môn tương đương; ADMIN/ACADEMIC. |
| Có — dùng lại | GET | `/api/curricula/:id/combos` | Danh sách combo; ADMIN/ACADEMIC. |
| Có — dùng lại | POST | `/api/curricula/:id/combos` | Tạo combo; ADMIN/ACADEMIC. |
| Có — dùng lại | PUT | `/api/combos/:id/courses` | Môn thuộc combo; ADMIN/ACADEMIC. |
| Có — dùng lại | POST | `/api/curricula/:id/publish` | Ban hành chương trình; ADMIN/ACADEMIC. |
| Có — dùng lại | GET | `/api/combo-registration-windows` | Danh sách đợt; luồng combo hiện có. |
| Có — dùng lại | POST | `/api/combo-registration-windows` | Tạo đợt; luồng combo hiện có. |
| Có — dùng lại | PATCH | `/api/combo-registration-windows/:id` | Sửa đợt; luồng combo hiện có. |
| Có — dùng lại | POST | `/api/combo-registration-windows/:id/open` | Mở; luồng combo hiện có. |
| Có — dùng lại | POST | `/api/combo-registration-windows/:id/close` | Đóng; luồng combo hiện có. |
| Có — dùng lại | POST | `/api/combo-registration-windows/:id/extensions` | Gia hạn; luồng combo hiện có. |
| Có — dùng lại | POST | `/api/combo-registration-windows/:id/reminders` | Nhắc hạn; luồng combo hiện có. |
| Có — dùng lại | POST | `/api/combo-registration-windows/:id/finalize` | Chốt lựa chọn; luồng combo hiện có. |
| Có — dùng lại | GET | `/api/combo-registration-windows/:id/selections` | Báo cáo lựa chọn; luồng combo hiện có. |
| Có — dùng lại | GET | `/api/academic-periods/:id/combo-phase-schedules` | Lịch pha chọn/xác nhận; luồng combo hiện có. |
| Có — dùng lại | PUT | `/api/academic-periods/:id/combo-phase-schedules` | Cấu hình lịch pha; luồng combo hiện có. |
| Có — dùng lại | GET | `/api/ojt-rule-sets` | Danh sách quy tắc |
| Có — dùng lại | POST | `/api/ojt-rule-sets` | Tạo quy tắc 70/2 |
| Có — dùng lại | PATCH | `/api/ojt-rule-sets/:id` | Sửa bản nháp |
| Có — dùng lại | POST | `/api/ojt-rule-sets/:id/publish` | Ban hành |
| Có — dùng lại | POST | `/api/students/:id/eligibility-checks` | Lưu lần xét; chưa tự chốt chính thức |
| Có — dùng lại | POST | `/api/eligibility-check-runs` | Xét batch; có thể chạy giữa kỳ, snapshot không tự trở thành official |
| Có — dùng lại | GET | `/api/eligibility-check-runs/:id` | Tiến trình và lỗi |
| Có — dùng lại | GET | `/api/students/:id/eligibility` | Current/latest/official và stale |
| Có — dùng lại | GET | `/api/students/:id/eligibility-checks` | Lịch sử |
| Đã sửa/đối chiếu | POST | `/api/eligibility-checks/:id/confirm` | Buộc kỳ xét là kỳ tương đối 5 (hoặc ngoại lệ được duyệt), kỳ cha + BL3W đã kết thúc, điểm finalized và snapshot mới. |
| Đã sửa/đối chiếu | GET | `/api/ojt-semesters/:id/assessment-window` | Bổ sung rõ kỳ học xét và kỳ OJT đích. |
| Đã sửa/đối chiếu | PUT | `/api/ojt-semesters/:id/assessment-window` | Cấu hình assessmentAcademicPeriodId; BLOCK3 phải thuộc kỳ cha cần xét. |
| Đã sửa/đối chiếu | POST | `/api/ojt-semesters/:id/assessment-window/open` | Đã có resultsFinalized; bổ sung guard toàn kỳ và luồng mở lại có audit, không âm thầm đổi mốc chốt. |
| Có — dùng lại | POST | `/api/ojt-semesters/:id/assessment-window/close` | Đóng đợt xét. |
| Đã sửa/đối chiếu | GET | `/api/ojt-registration-windows` | Danh sách đợt; tách kỳ 5 xét/đăng ký khỏi kỳ OJT mục tiêu, thống nhất hạn ứng tuyển. |
| Đã sửa/đối chiếu | POST | `/api/ojt-registration-windows` | Tạo đợt; tách kỳ 5 xét/đăng ký khỏi kỳ OJT mục tiêu, thống nhất hạn ứng tuyển. |
| Đã sửa/đối chiếu | PATCH | `/api/ojt-registration-windows/:id` | Sửa đợt; tách kỳ 5 xét/đăng ký khỏi kỳ OJT mục tiêu, thống nhất hạn ứng tuyển. |
| Đã sửa/đối chiếu | POST | `/api/ojt-registration-windows/:id/open` | Mở đợt; tách kỳ 5 xét/đăng ký khỏi kỳ OJT mục tiêu, thống nhất hạn ứng tuyển. |
| Đã sửa/đối chiếu | POST | `/api/ojt-registration-windows/:id/close` | Đóng đợt; tách kỳ 5 xét/đăng ký khỏi kỳ OJT mục tiêu, thống nhất hạn ứng tuyển. |
| Có — dùng lại | POST | `/api/ojt-registration-windows/:id/semester-exceptions` | Ngoại lệ kỳ có hạn/reason. |
| Có — dùng lại | POST | `/api/ojt-registration-windows/:id/semester-exceptions/:exceptionId/revoke` | Thu hồi ngoại lệ. |
| Có — dùng lại | GET | `/api/ojt-registrations` | Theo dõi hồ sơ tham gia OJT. |
| Đã sửa/đối chiếu | GET | `/api/ojt-registrations/:id` | DTO theo role; Student không nhận raw snapshot nội bộ. |
| Có — dùng lại | POST | `/api/ojt-registrations/:id/review` | Duyệt dựa trên official ELIGIBLE còn hiệu lực. |
| Có — dùng lại | POST | `/api/ojt-semesters/:id/eligible-student-handoffs` | Chỉ ADMIN/ACADEMIC tạo bàn giao; không mở QHDN/Student. |
| Có — dùng lại | GET | `/api/ojt-semesters/:id/eligible-student-handoffs` | Lịch sử bàn giao; OJT_COORD được đọc. |
| Có — dùng lại | GET | `/api/ojt-semesters/:id/students` | Theo dõi kỳ; đã thêm bộ lọc DN/trạng thái điều phối/phân công. |
| Có — dùng lại | GET | `/api/academic/dashboard` | Tổng quan học vụ |
| Có — dùng lại | GET | `/api/academic/eligibility-statistics` | Thống kê xét điều kiện |
| Có — dùng lại | GET | `/api/academic/course-demand` | Nhu cầu môn học; chỉ tham khảo, không đăng ký lớp |
| Có — dùng lại | GET | `/api/academic/course-demand/export` | Xuất nhu cầu CSV/JSON, không quản lý lớp |
| Đã sửa/đối chiếu | GET | `/api/academic/alerts` | Thêm EXCESS_FAILED_COURSES, đúng scope kỳ 5; không biến thiếu môn bắt buộc thành điều kiện OJT thứ ba. |
| Đã sửa/đối chiếu | POST | `/api/academic/alerts/notifications` | Hiện chỉ gửi SV có alert; thêm tín chỉ đã đạt/thiếu và số môn nợ, giữ idempotency. Không dùng để gửi kết quả cuối kỳ. |
| Có — dùng lại | GET | `/api/ojt-results` | Đọc kết quả OJT chuyển về. |
| Có — dùng lại | GET | `/api/ojt-results/:id` | Chi tiết/lịch sử. |
| Có — dùng lại | POST | `/api/ojt-results/:id/revision-requests` | Yêu cầu bổ sung. |
| Có — dùng lại | PATCH | `/api/ojt-results/:id` | Điểm/kết quả chính thức. |
| Đã sửa/đối chiếu | POST | `/api/ojt-results/:id/confirm` | Chốt công bố: đề xuất CONFIRMED được hiển thị Student ngay; nếu cần công bố riêng mới thêm publish. |
| Có — dùng lại | GET | `/api/ojt-semesters/:id/results/export` | CSV/JSON; PDF chưa có. |
| Có — dùng lại | GET | `/api/curricula/:id/ojt-grade-mappings/:semesterId` | Ánh xạ kết quả OJT về môn học. |
| Có — dùng lại | PUT | `/api/curricula/:id/ojt-grade-mappings/:semesterId` | Cấu hình ánh xạ/thang điểm. |
| Đã tạo | POST | `/api/academic/academic-summary-notifications` | P1: gửi snapshot giữa kỳ cho cả scope, kể cả SV không có cảnh báo; có thể gửi thủ công trước. |
| Đã tạo | POST | `/api/academic/eligibility-notifications` | P1: thông báo đủ/không đủ/chờ đối soát; tham chiếu snapshot/checkId và chống gửi lặp. |
| Đã tạo | GET | `/api/academic-periods/:id/ojt-advisory-schedule` | P2 nếu tự động: xem lịch thông báo giữa kỳ và deadline. |
| Đã tạo | PUT | `/api/academic-periods/:id/ojt-advisory-schedule` | P2 nếu tự động: cấu hình lịch theo kỳ thực, worker thực thi. |
| Đã tạo | GET | `/api/academic/advisory-runs` | P2: lịch sử batch thông báo khi có worker. |
| Đã tạo | GET | `/api/academic/advisory-runs/:id` | P2: trạng thái/lỗi từng sinh viên. |

## 4. OJT_COORD — Phòng Quan hệ doanh nghiệp (ADMIN có quyền dự phòng)

| Trạng thái | Method | Endpoint | Chức năng / việc cần làm |
|---|---|---|---|
| Đã sửa/đối chiếu | POST | `/api/imports/preview` | Đã cho QHDN kind=ENTERPRISE, nhận JSON. Bổ sung parse sheet ở frontend hoặc backend, map cột, lỗi từng dòng và chế độ nhập bổ sung. |
| Đã sửa/đối chiếu | POST | `/api/imports/commit` | Đã có tạo DN/tài khoản/vị trí và RecruitmentPosts PENDING_REVIEW. Hiện chỉ một batch/kỳ, cần sửa để nhập bổ sung/đính chính an toàn. |
| Có — dùng lại | POST | `/api/imports/archive` | ADMIN/OJT_COORD; lưu trữ dữ liệu tuyển theo chính sách retention hiện có, không tự coi là công bố. |
| Đã tạo | GET | `/api/company-imports` | P1: lịch sử import doanh nghiệp theo kỳ; tái sử dụng bảng import đã có. |
| Đã tạo | GET | `/api/company-imports/:id` | P1: nguồn sheet, mapping, kết quả từng dòng/lỗi; cần lưu bổ sung metadata nếu schema chưa có. |
| Đã tạo | GET | `/api/recruitment-posts` | P1: dữ liệu công bố được tạo từ sheet; không phải DN tự đăng tin. |
| Đã tạo | GET | `/api/recruitment-posts/:id` | P1: QHDN kiểm tra vị trí/nội dung/kỳ/deadline trước công bố. |
| Đã tạo | PATCH | `/api/recruitment-posts/:id` | P1: QHDN đính chính nội dung/deadline, đồng bộ với vị trí khi cần; không cấp quyền DN. |
| Đã tạo | POST | `/api/recruitment-posts/:id/publish` | P1: QHDN duyệt công bố bản import. Cần vì import hiện tạo PENDING_REVIEW. |
| Đã tạo | POST | `/api/recruitment-posts/:id/close` | P1: QHDN đóng công bố. Không đề xuất POST tạo tin thủ công/DN. |
| Có — dùng lại | GET | `/api/companies` | Danh sách/tìm kiếm/lọc |
| Có — dùng lại | GET | `/api/companies/:id` | Chi tiết |
| Có — dùng lại | POST | `/api/companies` | Bổ sung đơn lẻ khi cần |
| Có — dùng lại | PATCH | `/api/companies/:id` | Đính chính/trạng thái |
| Có — dùng lại | GET | `/api/positions` | Vị trí theo DN/kỳ |
| Có — dùng lại | GET | `/api/positions/:id` | Yêu cầu/chỉ tiêu/chỗ còn lại |
| Có — dùng lại | POST | `/api/positions` | Bổ sung vị trí, có thể cần tạo/liên kết bản công bố từ QHDN |
| Có — dùng lại | PATCH | `/api/positions/:id` | Sửa chỉ tiêu, đóng/mở; không thấp hơn chỗ đã giữ |
| Có — dùng lại | GET | `/api/ojt-semesters` | Đã có quyền OJT_COORD, bỏ ghi chú cũ chỉ ADMIN/ACADEMIC |
| Có — dùng lại | GET | `/api/ojt-registrations` | Chỉ hồ sơ bàn giao |
| Có — dùng lại | GET | `/api/ojt-semesters/:id/eligible-student-handoffs` | Đọc lịch sử bàn giao |
| Có — dùng lại | GET | `/api/ojt-semesters/:id/students` | Đã có enterpriseId/coordinationStatus/assignmentStatus; QHDN chỉ thấy bàn giao |
| Đã sửa/đối chiếu | GET | `/api/ojt-registrations/:id` | Dùng làm nguồn hồ sơ điều phối; lọc DTO theo role. |
| Đã sửa/đối chiếu | GET | `/api/ojt-coordinations` | Thêm liên kết/filter applicationId. |
| Đã sửa/đối chiếu | GET | `/api/ojt-coordinations/:id` | Trả đơn liên quan và lịch sử phù hợp scope. |
| Đã sửa/đối chiếu | POST | `/api/ojt-coordinations` | Nhận applicationId; cùng hồ sơ/vị trí/kỳ, chưa rút đơn và đã bàn giao. |
| Đã sửa/đối chiếu | POST | `/api/ojt-coordinations/:id/decision` | Đã có DN tự quyết định, QHDN nhập thay reason/audit. Đồng bộ JobApplications và seat reservation cùng transaction. |
| Đã sửa/đối chiếu | POST | `/api/ojt-coordinations/:id/reassign` | Không dùng đơn vị trí cũ cho vị trí mới; giữ lịch sử. |
| Có — dùng lại | GET | `/api/assignments` | Danh sách phân công |
| Có — dùng lại | GET | `/api/assignments/:id` | Chi tiết |
| Có — dùng lại | POST | `/api/assignments` | Tạo từ điều phối ACCEPTED, không tự giả lập chấp nhận |
| Có — dùng lại | PATCH | `/api/assignments/:id` | Giám sát/thời gian |
| Có — dùng lại | PATCH | `/api/assignments/:id/status` | Bắt đầu/hoàn thành/hủy |
| Có — dùng lại | GET | `/api/internship-evaluations` | Danh sách đánh giá |
| Có — dùng lại | GET | `/api/internship-evaluations/:id` | Chi tiết |
| Có — dùng lại | PUT | `/api/assignments/:id/internship-evaluation` | Nhập thay DN bắt buộc reason; ghi người nhập thực |
| Có — dùng lại | GET | `/api/ojt-results` | Kết quả đã chuyển |
| Có — dùng lại | GET | `/api/ojt-results/:id` | Chi tiết kết quả |
| Có — dùng lại | POST | `/api/ojt-results` | Chuyển hồ sơ kết quả cho Đào tạo |
| Có — dùng lại | POST | `/api/ojt-results/:id/transfer` | Chuyển lại sau yêu cầu sửa |
| Có — dùng lại | GET | `/api/ojt-semesters/:id/results/export` | CSV/JSON, chưa PDF |
| Đã tạo | GET | `/api/job-applications` | P1: đơn ứng tuyển theo kỳ, kể cả đang chờ bàn giao phải giới hạn QHDN chỉ các hồ sơ đã bàn giao. |
| Đã tạo | GET | `/api/job-applications/:id` | P1: hồ sơ/đơn cho QHDN; DN chỉ khi đã được điều phối đến DN mình. |
| Đã tạo | GET | `/api/job-applications/:id/cv` | P1: tải CV private bằng quyền của đơn; DN chỉ hồ sơ được gửi cho mình. |
| Đã tạo | GET | `/api/qhdn/dashboard` | P2: đối tác, chỉ tiêu, chưa phân bổ, chờ DN, đã phân công |
| Đã tạo | GET | `/api/qhdn/reports/acceptance` | P2: tiếp nhận/từ chối |
| Đã tạo | GET | `/api/qhdn/reports/internships` | P2: đang thực tập/hoàn thành/kết quả |
| Đã tạo | GET | `/api/qhdn/reports/enterprise-feedback` | P2: tổng hợp đánh giá DN, không bao hàm module khảo sát mới |
| Đã tạo | GET | `/api/qhdn/reports/export` | P2: xuất CSV/JSON, PDF làm sau nếu cần |

## 5. STUDENT — chỉ dữ liệu của người đăng nhập

| Trạng thái | Method | Endpoint | Chức năng / việc cần làm |
|---|---|---|---|
| Có — dùng lại | GET | `/api/students/:id` | Chỉ hồ sơ mình |
| Có — dùng lại | GET | `/api/students/:id/course-results` | Điểm/lần học |
| Có — dùng lại | GET | `/api/students/:id/academic-progress` | Tiến độ |
| Có — dùng lại | GET | `/api/students/:id/eligibility` | Current/latest/official và stale; giữa kỳ đủ chưa là quyền đi chính thức |
| Có — dùng lại | GET | `/api/students/:id/eligibility-checks` | Lịch sử |
| Có — dùng lại | GET | `/api/ojt-registrations` | Hồ sơ của mình |
| Có — dùng lại | GET | `/api/students/:id/combo-selections` | Lịch sử combo |
| Có — dùng lại | POST | `/api/combo-registration-windows/:id/preview` | Xem thử lựa chọn |
| Có — dùng lại | POST | `/api/combo-registration-windows/:id/selections` | Gửi lựa chọn combo |
| Đã sửa/đối chiếu | POST | `/api/ojt-registrations` | Nếu chỉ đăng ký sau chốt: yêu cầu official ELIGIBLE hiện hành. Đây là hồ sơ tham gia OJT, chưa phải đơn DN. |
| Đã sửa/đối chiếu | GET | `/api/ojt-registrations/:id` | DTO riêng; không trả raw AuditLogs/snapshot nội bộ. |
| Đã tạo | GET | `/api/student/academic-summary` | P1: tín chỉ đã đạt/đang học/thiếu; môn nợ/chưa học/đang học. Kịch bản đạt ngưỡng không phải xác suất AI |
| Đã tạo | GET | `/api/student/supplementary-course-options` | P1: đề xuất môn/môn học lại, tín chỉ, lý do và tiên quyết; không lớp, không đăng ký học, không cam kết lịch |
| Đã tạo | GET | `/api/student/ojt-registration-windows` | P1: scope/deadline, canRegister/blockReasons |
| Đã tạo | GET | `/api/student/curriculum` | P1: chương trình đã ban hành của mình |
| Đã tạo | GET | `/api/student/companies` | P1: đối tác ACTIVE và có dữ liệu được công bố |
| Đã tạo | GET | `/api/student/companies/:id` | P1: chi tiết đối tác công khai phù hợp |
| Đã tạo | GET | `/api/student/positions` | P1: vị trí công bố bởi QHDN, đúng kỳ, OPEN/PUBLISHED, deadline/chỉ tiêu/canApply |
| Đã tạo | GET | `/api/student/positions/:id` | P1: chi tiết; trả postId phù hợp schema hiện có |
| Đã tạo | POST | `/api/student/applications` | P1: ứng tuyển sau official ELIGIBLE, đợt mở và vị trí công bố. Có thể nhận trước bàn giao, nhưng QHDN không điều phối trước bàn giao |
| Đã tạo | GET | `/api/student/applications` | P1: đơn của mình |
| Đã tạo | GET | `/api/student/applications/:id` | P1: timeline tiếp nhận/điều phối/phân công |
| Đã tạo | POST | `/api/student/cv` | P1: upload CV private giữa→cuối kỳ 5, độc lập AI; giới hạn loại/kích thước tệp |
| Đã tạo | GET | `/api/student/cv` | P1: thông tin/phiên bản CV của mình, tải có xác thực |
| Đã tạo | DELETE | `/api/student/cv` | P1: xóa/ngừng dùng CV hiện tại, giữ bản đã nộp theo chính sách hồ sơ; không phá lịch sử đơn |
| Đã tạo | GET | `/api/student/notifications` | P1: thông báo/lọc unread/phân trang, trả unreadCount cùng response |
| Đã tạo | PATCH | `/api/student/notifications/:id/read` | P1: người nhận đánh dấu đọc, idempotent |
| Đã tạo | GET | `/api/student/combo-registration-windows` | P2: các đợt/lựa chọn khả dụng |
| Đã tạo | GET | `/api/student/assignments/current` | P2: DN/vị trí/giám sát/thời gian của mình theo kỳ |
| Đã tạo | GET | `/api/student/ojt-results` | P2: chỉ kết quả của mình được công bố |
| Đã tạo | GET | `/api/student/ojt-results/:id` | P2: điểm/nhận xét đã công bố |
| Đã tạo | GET | `/api/student/dashboard` | P2: tổng hợp; không tạo thuật toán học vụ mới |
| Đã tạo | POST | `/api/student/applications/:id/withdraw` | P2: rút đơn trước tiếp nhận/phân công theo chính sách; giữ lịch sử |

## 6. ENTERPRISE — tiếp nhận hồ sơ và đánh giá, không đăng tuyển

| Trạng thái | Method | Endpoint | Chức năng / việc cần làm |
|---|---|---|---|
| Có — dùng lại | GET | `/api/companies` | Chỉ doanh nghiệp liên kết qua EnterpriseUsers |
| Có — dùng lại | GET | `/api/companies/:id` | Chi tiết doanh nghiệp mình |
| Có — dùng lại | GET | `/api/positions` | Chỉ các vị trí DN mình do QHDN nhập |
| Có — dùng lại | GET | `/api/positions/:id` | Chi tiết vị trí |
| Có — dùng lại | GET | `/api/ojt-coordinations` | Chỉ hồ sơ điều phối đến DN mình |
| Có — dùng lại | GET | `/api/ojt-coordinations/:id` | Chi tiết/lịch sử trong scope |
| Có — dùng lại | GET | `/api/assignments` | Phân công DN mình |
| Có — dùng lại | GET | `/api/assignments/:id` | Chi tiết |
| Có — dùng lại | GET | `/api/internship-evaluations` | Đánh giá DN mình |
| Có — dùng lại | GET | `/api/internship-evaluations/:id` | Chi tiết |
| Có — dùng lại | PUT | `/api/assignments/:id/internship-evaluation` | DN nộp/sửa điểm/nhận xét; bảo vệ nguồn khi kết quả đã chuyển |
| Đã sửa/đối chiếu | POST | `/api/ojt-coordinations/:id/decision` | Giữ quyền sở hữu; thêm đồng bộ đơn ứng tuyển, cùng transaction chỉ tiêu. |
| Đã tạo | GET | `/api/job-applications` | P1: cùng endpoint với QHDN, chỉ đơn đã điều phối đến DN mình. |
| Đã tạo | GET | `/api/job-applications/:id` | P1: DTO ứng viên, không mở toàn bộ hồ sơ OJT/học vụ. |
| Đã tạo | GET | `/api/job-applications/:id/cv` | P1: CV đúng phiên bản của đơn được gửi cho mình. |

## 7. AI — kiểm kê riêng, triển khai sau

| Trạng thái | Method | Endpoint | Chức năng / việc cần làm |
|---|---|---|---|
| Có — để sau | POST | `/api/admin/prediction-jobs` | Tạo job theo model đã cấu hình; hiện chỉ ADMIN. Có route không xác nhận model/dữ liệu AI đã sẵn sàng. |
| Có — để sau | GET | `/api/admin/prediction-jobs/:id` | Theo dõi job/lỗi; hiện chỉ ADMIN. Có route không xác nhận model/dữ liệu AI đã sẵn sàng. |
| Có — để sau | GET | `/api/predictions` | Kết quả dự đoán; hiện chỉ ADMIN. Có route không xác nhận model/dữ liệu AI đã sẵn sàng. |
| Có — để sau | GET | `/api/predictions/:id` | Chi tiết; hiện chỉ ADMIN. Có route không xác nhận model/dữ liệu AI đã sẵn sàng. |
| Có — để sau | GET | `/api/students/:id/predictions` | Lịch sử; hiện chỉ ADMIN. Có route không xác nhận model/dữ liệu AI đã sẵn sàng. |
| Có — để sau | GET | `/api/admin/models` | Phiên bản model; hiện chỉ ADMIN. Có route không xác nhận model/dữ liệu AI đã sẵn sàng. |
| Có — để sau | GET | `/api/admin/models/:id` | Thông tin model; hiện chỉ ADMIN. Có route không xác nhận model/dữ liệu AI đã sẵn sàng. |
| Có — để sau | GET | `/api/alerts` | Cảnh báo dự đoán, khác /academic/alerts; hiện chỉ ADMIN. Có route không xác nhận model/dữ liệu AI đã sẵn sàng. |
| Có — để sau | GET | `/api/alerts/:id` | Chi tiết; hiện chỉ ADMIN. Có route không xác nhận model/dữ liệu AI đã sẵn sàng. |
| Có — để sau | PATCH | `/api/alerts/:id/status` | Theo dõi xử lý cảnh báo; hiện chỉ ADMIN. Có route không xác nhận model/dữ liệu AI đã sẵn sàng. |
| Có — để sau | POST | `/api/alerts/:id/interventions` | Biện pháp hỗ trợ, không đăng ký lớp; hiện chỉ ADMIN. Có route không xác nhận model/dữ liệu AI đã sẵn sàng. |
| Có — để sau | GET | `/api/students/:id/interventions` | Lịch sử hỗ trợ; hiện chỉ ADMIN. Có route không xác nhận model/dữ liệu AI đã sẵn sàng. |
| Có — để sau | PATCH | `/api/interventions/:id` | Cập nhật hỗ trợ; hiện chỉ ADMIN. Có route không xác nhận model/dữ liệu AI đã sẵn sàng. |
| Có — để sau | GET | `/api/admin/reports/readiness` | Báo cáo dự đoán; hiện chỉ ADMIN. Có route không xác nhận model/dữ liệu AI đã sẵn sàng. |
| Có — để sau | GET | `/api/admin/reports/risks` | Báo cáo rủi ro; hiện chỉ ADMIN. Có route không xác nhận model/dữ liệu AI đã sẵn sàng. |
| Có — để sau | GET | `/api/admin/reports/export` | Xuất báo cáo dự đoán; hiện chỉ ADMIN. Có route không xác nhận model/dữ liệu AI đã sẵn sàng. |
| Đã tạo — cần cấu hình AI | GET | `/api/student/risk-prediction` | P3: kết quả dự báo của mình, dùng lại prediction service khi có dữ liệu |
| Đã tạo — cần cấu hình AI | GET | `/api/student/roadmap-recommendations` | P3: tư vấn AI lộ trình; khác đề xuất môn bằng quy tắc |
| Đã tạo — cần cấu hình AI | POST | `/api/student/cv/analyses` | P3: chạy trích xuất CV, tạo job |
| Đã tạo — cần cấu hình AI | GET | `/api/student/cv/analyses/:id` | P3: kết quả/lỗi trích xuất |
| Đã tạo — cần cấu hình AI | GET | `/api/student/company-recommendations` | P3: gợi ý vị trí theo CV, điểm/phân tích matching và lý do |

## 8. Hạ tầng

| Trạng thái | Method | Endpoint | Chức năng / việc cần làm |
|---|---|---|---|
| Có — dùng lại | GET | `/api/health` | Health check; không phải nghiệp vụ role. |

## 9. Những mục loại khỏi kế hoạch

- Không tạo API DN tự tạo/sửa/publish tin tuyển; DN không nhận POST/PATCH /companies hoặc /positions. QHDN là chủ dữ liệu import/công bố.
- Không làm /support-classes, /student/support-classes, /student/support-class-registrations. Bảng có sẵn vẫn có thể giữ; không tạo route, không cần xóa bảng.
- Không cần /student/me nếu mở rộng /auth/me; không cần /student/eligibility hoặc /student/course-results nếu endpoint hiện có đủ.
- Không cần /student/notifications/unread-count riêng nếu response danh sách trả unreadCount.
- Không cần /accounts/:userId/password-reset mới: dùng /auth/users/:userId/password-reset đã có.
- 21 endpoint QHDN cốt lõi đã có từ trước thay đổi này: checkout đã có. GET /ojt-semesters đã mở OJT_COORD và danh sách SV đã có các filter điều phối/phân công.
- MOU, lịch phỏng vấn, khảo sát việc làm và PDF báo cáo không tự thêm vào phạm vi hiện tại. Import sheet đối tác là P1, không còn là phần mở rộng để sau.

## 10. Luồng nghiệp vụ đã triển khai

| Mốc | Backend | API chủ yếu |
|---|---|---|
| Đầu kỳ 5 | Đọc chương trình/điểm/tiến độ | progress, course-results, student curriculum |
| Giữa kỳ 5 | Snapshot tín chỉ/môn nợ, cảnh báo và đề xuất môn | academic-summary, supplementary-course-options, academic-summary-notifications/alerts |
| Giữa→cuối kỳ 5 | Upload CV; AI triển khai sau | student/cv; analyses/matching ở P3 |
| Cuối kỳ 5, gồm BL3W | Điểm finalized → xét lại → Đào tạo xác nhận | assessment-window, eligibility-check-runs, confirm, eligibility-notifications |
| Sau đủ điều kiện | Hiện vị trí công bố, nhận hồ sơ OJT và đơn DN | ojt-registrations, student/positions, student/applications |
| Sau đăng ký | Đào tạo duyệt/bàn giao → QHDN gửi hồ sơ → DN decision → phân công | review, handoffs, coordinations, decision, assignments |
| Kết thúc thực tập | DN đánh giá → QHDN chuyển → Đào tạo xác nhận → Student xem | internship-evaluation, transfer, confirm, student/ojt-results |

Không đảo luồng thành bắt buộc đã bàn giao mới cho sinh viên nộp đơn nếu UI yêu cầu đăng ký trước bàn giao. Đơn có thể ở trạng thái chờ bàn giao; backend vẫn tuyệt đối chặn QHDN/Enterprise xử lý trước bàn giao. Hai hồ sơ liên kết: OJTRegistration là hồ sơ tham gia; JobApplication là đơn vị trí DN. Không tạo vòng phụ thuộc hồ sơ cần đơn nhưng đơn lại cần hồ sơ chưa thể tạo.

## 11. Các thay đổi liên thông bắt buộc

1. Tách kỳ học xét/đăng ký (kỳ 5) với OJTSemester mục tiêu. registrationPeriod hiện buộc trùng kỳ OJT, cần sửa nếu thực tập bắt đầu sau kỳ 5 hoặc qua năm học. relativeSemester lấy placement, không suy ra bằng số tháng.
2. Official chỉ chốt sau toàn kỳ 5 và BL3W, nguồn finalized và snapshot mới. Kết quả giữa kỳ/current không tự trở thành official. Thiếu dữ liệu là REVIEW_REQUIRED, không tự kết luận không đủ.
3. Ngưỡng nợ <=2 đếm môn đã trượt chưa khắc phục, không đếm số lần trượt hoặc tất cả môn chưa học. Tín chỉ đang học không được cộng vào earnedCredits; kịch bản cuối kỳ phải ghi giả định, không giả lập xác suất AI.
4. Import JSON hiện tại có quyền đúng: ACADEMIC chỉ STUDENT; QHDN chỉ ENTERPRISE; ADMIN cả hai. Chọn frontend parse XLSX/CSV thành JSON hoặc thêm multipart parser vào preview. Không đánh dấu có upload sheet backend khi source chưa có.
5. Import doanh nghiệp hiện tạo tài khoản/email, cần kỳ sau để retention, chỉ một batch/kỳ và không cập nhật contact của đối tác cũ. Quyết định rõ import đối tác có bắt buộc tạo tài khoản hay không; hỗ trợ bổ sung/cập nhật theo mã DN+mã vị trí+kỳ, preview và commit phải nhất quán. Tất cả import và capacity update phải phối hợp khóa với decision/assignment để tránh vượt chỉ tiêu.
6. Import đã tạo RecruitmentPosts + RecruitmentPostPositions. Giữ chúng như dữ liệu công bố nội bộ do QHDN quản lý, không phải module DN đăng tin. JobApplications hiện bắt buộc PostID; student positions trả postId được công bố, ứng tuyển xác minh cùng DN/vị trí/kỳ/deadline. Không tạo PostID giả hoặc bỏ FK ngầm.
7. Đăng ký/ứng tuyển kiểm tra official ELIGIBLE còn hiện hành, đúng kỳ, đợt mở, published/open và capacity theo chính sách. Đã nộp đơn chưa giữ chỗ; decision ACCEPTED giữ chỗ; phân công không giữ lần nữa. Chốt số đơn đang mở/số tiếp nhận cho một SV trước khi triển khai nhiều đơn.
8. QHDN chỉ điều phối hồ sơ bàn giao; DN chỉ hồ sơ thực sự gửi cho mình. Chỉ decision ghi ACCEPTED/REJECTED; đồng bộ đơn và seat cùng transaction, tránh một API sửa đơn và một API sửa điều phối độc lập.
9. CV cần metadata chủ sở hữu/phiên bản, lưu private. Đơn tham chiếu bản đã nộp; upload lại không âm thầm đổi CV doanh nghiệp đã nhận. Không tin arbitrary object path/cvUrl từ client.
10. Chính sách công bố kết quả đề xuất dùng CONFIRMED → visible cho Student. Nếu cần nút công bố riêng mới bổ sung publish và schema audit; hiện chưa có route publish.
11. Cảnh báo giữa kỳ và thông báo kết quả phải có snapshot/idempotency; alert-only service hiện không gửi cho SV không có alert. Tự động theo lịch cần worker, không chỉ GET notifications.
12. Không mở STUDENT vào route staff rồi trả toàn bộ dữ liệu: DTO riêng, scope token, không lộ raw audit/handoff snapshot nội bộ. Student/Enterprise không được sửa điểm, quy tắc, xác nhận hoặc tạo bàn giao.

## 12. Thứ tự làm để tránh trùng và thiếu luồng

- P1-A: sửa mô hình kỳ/mốc chốt/registration guard; bổ sung cảnh báo môn nợ; rà DTO.
- P1-B: QHDN import sheet + upsert/lịch sử + công bố dữ liệu đã import; các API đọc Student và thông báo.
- P1-C: CV private; đơn ứng tuyển; nối application→handoff→coordination→decision→assignment.
- P2: dashboard/báo cáo, worker tự gửi giữa kỳ và rút đơn theo phạm vi. Không phát triển đăng ký lớp.
- P3: dự báo AI, trích xuất CV và matching. Có route prediction Admin không có nghĩa luồng AI Student đã hoàn thành.

## 13. Source đã đối chiếu

File đính kèm: `C:/Users/tthuh/.codex/attachments/c0ae70ff-9bb2-4939-8e23-563990d4db63/Văn bản đã dán.txt`.

Trong backend: `src/routes/index.ts`, `src/routes/json-input.routes.ts`; routes/service của auth, accounts, roles, imports, admin, academic, students, curriculum, combo-registration, eligibility, ojt-registration, academic-reporting, qhdn, ojt-results; `src/jobs/provisioning.ts`; schema `DB`. Không dựa vào danh sách cũ/Swagger đơn lẻ để khẳng định route đã có.

Thống kê sau triển khai: **223 operation REST đã đăng ký**, gồm **48 operation mới**. Toàn bộ 48 có Swagger/JSON contract tương ứng và kiểm thử route xác thực. **24 operation cần sửa** đã được sửa hoặc đối chiếu quyền đã đúng. AI thật cần cấu hình provider/model, không có kết quả giả. Chưa chạy migration hoặc kiểm thử trên DB production.
