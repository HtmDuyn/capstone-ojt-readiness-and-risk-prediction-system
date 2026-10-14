# API theo từng actor — danh sách đầy đủ

Mọi endpoint có tiền tố /api. API dùng chung/dùng lại được lặp theo actor và ghi chú. Đã triển khai trong source; DB thực tế chưa migration. AI cần provider/model/dữ liệu thực tế. Mô tả chi tiết và giới hạn: [student-portal-api.md](student-portal-api.md).

## ADMIN

**191 operation**; các actor có thể dùng chung một operation.

| Method | Endpoint | Trạng thái | Chức năng | Dùng lại và phạm vi |
|---|---|---|---|---|
| POST | `/api/auth/login` | Có — dùng lại | Đăng nhập; public. | Dùng chung xác thực/tài khoản; ngoài ADMIN chỉ tài khoản mình |
| POST | `/api/auth/logout` | Có — dùng lại | Tài khoản đăng nhập. | Dùng chung xác thực/tài khoản; ngoài ADMIN chỉ tài khoản mình |
| GET | `/api/auth/me` | Đã sửa/đối chiếu | Bổ sung studentId cho STUDENT, có thể enterpriseId cho ENTERPRISE. Không cần tạo thêm /student/me. | Dùng chung xác thực/tài khoản; ngoài ADMIN chỉ tài khoản mình |
| POST | `/api/auth/change-password` | Có — dùng lại | Đổi mật khẩu của mình. | Dùng chung xác thực/tài khoản; ngoài ADMIN chỉ tài khoản mình |
| GET | `/api/accounts/me/profile` | Có — dùng lại | Đọc hồ sơ tài khoản của mình; khác hồ sơ học vụ. | Dùng chung xác thực/tài khoản; ngoài ADMIN chỉ tài khoản mình |
| PATCH | `/api/accounts/me/profile` | Có — dùng lại | Sửa các trường cá nhân được phép, không sửa điểm/chương trình/trạng thái OJT. | Dùng chung xác thực/tài khoản; ngoài ADMIN chỉ tài khoản mình |
| GET | `/api/accounts/:userId` | Có — dùng lại | ADMIN đọc tất cả; role khác chỉ tài khoản mình theo kiểm tra service. | Dùng chung xác thực/tài khoản; ngoài ADMIN chỉ tài khoản mình |
| PUT | `/api/accounts/:userId` | Có — dùng lại | ADMIN hoặc bản thân với trường được phép. | Dùng chung xác thực/tài khoản; ngoài ADMIN chỉ tài khoản mình |
| GET | `/api/roles` | Có — dùng lại | Danh sách 5 role cố định. | API của actor |
| GET | `/api/accounts` | Có — dùng lại | Danh sách tài khoản. | API của actor |
| POST | `/api/accounts` | Có — dùng lại | Tạo tài khoản. | API của actor |
| PATCH | `/api/accounts/:userId/role` | Có — dùng lại | Đổi role theo ràng buộc service. | API của actor |
| PATCH | `/api/accounts/:userId/status` | Có — dùng lại | Khóa/mở tài khoản. | API của actor |
| POST | `/api/auth/users/:userId/password-reset` | Có — dùng lại | Đã có. Sửa endpoint cũ /accounts/:userId/password-reset trong list thành endpoint này. | API của actor |
| POST | `/api/students` | Có — dùng lại | Tạo sinh viên đơn lẻ; trong file cũ bị đánh dấu chưa có. | API của actor |
| DELETE | `/api/students/:id` | Có — dùng lại | Xóa mềm sinh viên. | API của actor |
| GET | `/api/students/export` | Có — dùng lại | Xuất danh sách sinh viên. | API của actor |
| DELETE | `/api/companies/:id` | Có — dùng lại | Xóa mềm doanh nghiệp, ADMIN; QHDN dùng trạng thái INACTIVE. | API của actor |
| DELETE | `/api/positions/:id` | Có — dùng lại | Xóa mềm vị trí, ADMIN; QHDN dùng CLOSED. | API của actor |
| GET | `/api/ojt-semesters/:id` | Đã sửa/đối chiếu | Chi tiết kỳ OJT; ADMIN/ACADEMIC/OJT_COORD được đọc. | API của actor |
| GET | `/api/admin/dashboard/summary` | Có — dùng lại | Đã có tổng quan tài khoản/SV/DN/kỳ. | API của actor |
| GET | `/api/admin/dashboard/readiness` | Có — để sau | Đã có route, số liệu phụ thuộc dữ liệu dự đoán; để giai đoạn AI. | API của actor |
| GET | `/api/admin/dashboard/risks` | Có — để sau | Đã có route, không coi là AI/model đã chạy thành công. | API của actor |
| GET | `/api/admin/dashboard/trends` | Có — để sau | Đã có route xu hướng; phần prediction để sau. | API của actor |
| GET | `/api/assessment-templates` | Có — dùng lại | Đã có danh sách bộ tiêu chí đánh giá thực tập. | API của actor |
| GET | `/api/assessment-templates/:id` | Có — dùng lại | Đã có chi tiết. | API của actor |
| POST | `/api/assessment-templates` | Có — dùng lại | Đã có tạo bản tiêu chí. | API của actor |
| PATCH | `/api/assessment-templates/:id` | Có — dùng lại | Sửa bản nháp. | API của actor |
| POST | `/api/assessment-templates/:id/publish` | Có — dùng lại | Phát hành phiên bản bất biến. | API của actor |
| GET | `/api/assessments` | Có — dùng lại | Đã có alias đọc đánh giá cho ADMIN; dùng /internship-evaluations cho luồng nghiệp vụ chung. | API của actor |
| GET | `/api/assessments/:id` | Có — dùng lại | Chi tiết đánh giá cho ADMIN, không tạo lại. | API của actor |
| GET | `/api/admin/audit-logs` | Có — dùng lại | Đã có, khác các danh sách cũ. | API của actor |
| GET | `/api/imports/emails` | Có — dùng lại | Danh sách email provisioning. | API của actor |
| POST | `/api/imports/emails/:emailId/retry` | Có — dùng lại | Retry email provisioning đủ điều kiện, không phải retry mọi loại thông báo. | API của actor |
| GET | `/api/academic-years` | Có — dùng lại | Danh sách năm học | Dùng lại từ ACADEMIC; ADMIN có quyền |
| POST | `/api/academic-years` | Có — dùng lại | Tạo năm học; ADMIN/ACADEMIC. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| PATCH | `/api/academic-years/:id` | Có — dùng lại | Sửa năm học; dùng lịch thực, không mặc định mọi kỳ đúng 4 tháng. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| GET | `/api/academic-periods` | Có — dùng lại | Danh sách kỳ học/BLOCK3 | Dùng lại từ ACADEMIC; ADMIN có quyền |
| POST | `/api/academic-periods` | Có — dùng lại | Tạo kỳ học/BLOCK3; ADMIN/ACADEMIC. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| PATCH | `/api/academic-periods/:id` | Có — dùng lại | Sửa kỳ học/BLOCK3; dùng lịch thực, không mặc định mọi kỳ đúng 4 tháng. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| GET | `/api/cohorts` | Có — dùng lại | Danh sách khóa sinh viên | Dùng lại từ ACADEMIC; ADMIN có quyền |
| POST | `/api/cohorts` | Có — dùng lại | Tạo khóa sinh viên; ADMIN/ACADEMIC. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| PATCH | `/api/cohorts/:id` | Có — dùng lại | Sửa khóa sinh viên; dùng lịch thực, không mặc định mọi kỳ đúng 4 tháng. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| GET | `/api/ojt-semesters` | Đã sửa/đối chiếu | Danh sách đợt OJT; OJT_COORD đã có quyền đọc, không cần mở lại. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| POST | `/api/ojt-semesters` | Có — dùng lại | Tạo đợt OJT; ADMIN/ACADEMIC. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| PATCH | `/api/ojt-semesters/:id` | Có — dùng lại | Chi tiết kỳ OJT; ADMIN/ACADEMIC/OJT_COORD được đọc. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| PATCH | `/api/students/:id/academic-placement` | Có — dùng lại | Gán kỳ vào chuyên ngành/kỳ thực tế; BLOCK3 không tăng học kỳ. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| PATCH | `/api/students/academic-placement` | Có — dùng lại | Alias nhận studentId trong body; không cần route mới. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| POST | `/api/imports/preview` | Có — dùng lại | Preview theo kind; ENTERPRISE hỗ trợ JSON/CSV/XLSX, mapping và lỗi từng dòng; STUDENT theo hợp đồng import sinh viên. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| POST | `/api/imports/commit` | Có — dùng lại | Lưu import theo kind và quyền; ENTERPRISE hỗ trợ nhập bổ sung/cập nhật, idempotency và lịch sử lỗi. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| GET | `/api/students` | Có — dùng lại | Danh sách SV; Student không được đọc toàn bộ. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| GET | `/api/students/:id` | Có — dùng lại | Hồ sơ học vụ; Student chỉ mình. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| PATCH | `/api/students/:id` | Có — dùng lại | Sửa hồ sơ có reason. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| GET | `/api/students/:id/course-results` | Có — dùng lại | Bảng điểm/lần học. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| GET | `/api/students/:id/academic-progress` | Có — dùng lại | Nguồn tính GPA/tín chỉ/thiếu cấu hình. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| POST | `/api/course-result-imports/preview` | Có — dùng lại | Preview điểm; gồm dữ liệu liên quan BL3W. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| POST | `/api/course-result-imports/commit` | Có — dùng lại | Commit điểm trước khi chốt. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| PATCH | `/api/course-results/:id` | Có — dùng lại | Đính chính có reason/audit; ảnh hưởng stale của kết quả xét. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| GET | `/api/academic-imports` | Có — dùng lại | Lịch sử import học vụ. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| GET | `/api/academic-imports/:id` | Có — dùng lại | Chi tiết lô/lỗi. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| GET | `/api/majors` | Có — dùng lại | Danh sách chuyên ngành; ADMIN/ACADEMIC. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| POST | `/api/majors` | Có — dùng lại | Tạo chuyên ngành; ADMIN/ACADEMIC. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| GET | `/api/courses` | Có — dùng lại | Danh sách môn; ADMIN/ACADEMIC. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| POST | `/api/courses` | Có — dùng lại | Tạo môn; ADMIN/ACADEMIC. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| PATCH | `/api/courses/:id` | Có — dùng lại | Sửa môn; ADMIN/ACADEMIC. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| GET | `/api/curricula` | Có — dùng lại | Danh sách chương trình; ADMIN/ACADEMIC. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| POST | `/api/curricula` | Có — dùng lại | Tạo chương trình; ADMIN/ACADEMIC. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| GET | `/api/curricula/:id` | Có — dùng lại | Chi tiết chương trình; ADMIN/ACADEMIC. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| PATCH | `/api/curricula/:id` | Có — dùng lại | Sửa chương trình nháp; ADMIN/ACADEMIC. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| POST | `/api/curriculum-imports/preview` | Có — dùng lại | Preview chương trình; ADMIN/ACADEMIC. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| POST | `/api/curriculum-imports/commit` | Có — dùng lại | Import chương trình; ADMIN/ACADEMIC. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| PUT | `/api/curricula/:id/courses` | Có — dùng lại | Cấu trúc môn và tín chỉ; ADMIN/ACADEMIC. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| PUT | `/api/curricula/:id/prerequisites` | Có — dùng lại | Môn tiên quyết; ADMIN/ACADEMIC. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| PUT | `/api/curricula/:id/course-equivalences` | Có — dùng lại | Môn tương đương; ADMIN/ACADEMIC. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| GET | `/api/curricula/:id/combos` | Có — dùng lại | Danh sách combo; ADMIN/ACADEMIC. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| POST | `/api/curricula/:id/combos` | Có — dùng lại | Tạo combo; ADMIN/ACADEMIC. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| PUT | `/api/combos/:id/courses` | Có — dùng lại | Môn thuộc combo; ADMIN/ACADEMIC. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| POST | `/api/curricula/:id/publish` | Có — dùng lại | Ban hành chương trình; ADMIN/ACADEMIC. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| GET | `/api/combo-registration-windows` | Có — dùng lại | Danh sách đợt; luồng combo hiện có. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| POST | `/api/combo-registration-windows` | Có — dùng lại | Tạo đợt; luồng combo hiện có. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| PATCH | `/api/combo-registration-windows/:id` | Có — dùng lại | Sửa đợt; luồng combo hiện có. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| POST | `/api/combo-registration-windows/:id/open` | Có — dùng lại | Mở; luồng combo hiện có. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| POST | `/api/combo-registration-windows/:id/close` | Có — dùng lại | Đóng; luồng combo hiện có. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| POST | `/api/combo-registration-windows/:id/extensions` | Có — dùng lại | Gia hạn; luồng combo hiện có. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| POST | `/api/combo-registration-windows/:id/reminders` | Có — dùng lại | Nhắc hạn; luồng combo hiện có. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| POST | `/api/combo-registration-windows/:id/finalize` | Có — dùng lại | Chốt lựa chọn; luồng combo hiện có. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| GET | `/api/combo-registration-windows/:id/selections` | Có — dùng lại | Báo cáo lựa chọn; luồng combo hiện có. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| GET | `/api/academic-periods/:id/combo-phase-schedules` | Có — dùng lại | Lịch pha chọn/xác nhận; luồng combo hiện có. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| PUT | `/api/academic-periods/:id/combo-phase-schedules` | Có — dùng lại | Cấu hình lịch pha; luồng combo hiện có. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| GET | `/api/ojt-rule-sets` | Có — dùng lại | Danh sách quy tắc | Dùng lại từ ACADEMIC; ADMIN có quyền |
| POST | `/api/ojt-rule-sets` | Có — dùng lại | Tạo quy tắc 70/2 | Dùng lại từ ACADEMIC; ADMIN có quyền |
| PATCH | `/api/ojt-rule-sets/:id` | Có — dùng lại | Sửa bản nháp | Dùng lại từ ACADEMIC; ADMIN có quyền |
| POST | `/api/ojt-rule-sets/:id/publish` | Có — dùng lại | Ban hành | Dùng lại từ ACADEMIC; ADMIN có quyền |
| POST | `/api/students/:id/eligibility-checks` | Có — dùng lại | Lưu lần xét; chưa tự chốt chính thức | Dùng lại từ ACADEMIC; ADMIN có quyền |
| POST | `/api/eligibility-check-runs` | Có — dùng lại | Xét batch; có thể chạy giữa kỳ, snapshot không tự trở thành official | Dùng lại từ ACADEMIC; ADMIN có quyền |
| GET | `/api/eligibility-check-runs/:id` | Có — dùng lại | Tiến trình và lỗi | Dùng lại từ ACADEMIC; ADMIN có quyền |
| GET | `/api/students/:id/eligibility` | Có — dùng lại | Current/latest/official và stale | Dùng lại từ ACADEMIC; ADMIN có quyền |
| GET | `/api/students/:id/eligibility-checks` | Có — dùng lại | Lịch sử | Dùng lại từ ACADEMIC; ADMIN có quyền |
| POST | `/api/eligibility-checks/:id/confirm` | Đã sửa/đối chiếu | Buộc kỳ xét là kỳ tương đối 5 (hoặc ngoại lệ được duyệt), kỳ cha + BL3W đã kết thúc, điểm finalized và snapshot mới. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| GET | `/api/ojt-semesters/:id/assessment-window` | Đã sửa/đối chiếu | Bổ sung rõ kỳ học xét và kỳ OJT đích. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| PUT | `/api/ojt-semesters/:id/assessment-window` | Đã sửa/đối chiếu | Cấu hình assessmentAcademicPeriodId; BLOCK3 phải thuộc kỳ cha cần xét. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| POST | `/api/ojt-semesters/:id/assessment-window/open` | Đã sửa/đối chiếu | Đã có resultsFinalized; bổ sung guard toàn kỳ và luồng mở lại có audit, không âm thầm đổi mốc chốt. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| POST | `/api/ojt-semesters/:id/assessment-window/close` | Có — dùng lại | Đóng đợt xét. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| GET | `/api/ojt-registration-windows` | Đã sửa/đối chiếu | Danh sách đợt; tách kỳ 5 xét/đăng ký khỏi kỳ OJT mục tiêu, thống nhất hạn ứng tuyển. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| POST | `/api/ojt-registration-windows` | Đã sửa/đối chiếu | Tạo đợt; tách kỳ 5 xét/đăng ký khỏi kỳ OJT mục tiêu, thống nhất hạn ứng tuyển. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| PATCH | `/api/ojt-registration-windows/:id` | Đã sửa/đối chiếu | Sửa đợt; tách kỳ 5 xét/đăng ký khỏi kỳ OJT mục tiêu, thống nhất hạn ứng tuyển. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| POST | `/api/ojt-registration-windows/:id/open` | Đã sửa/đối chiếu | Mở đợt; tách kỳ 5 xét/đăng ký khỏi kỳ OJT mục tiêu, thống nhất hạn ứng tuyển. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| POST | `/api/ojt-registration-windows/:id/close` | Đã sửa/đối chiếu | Đóng đợt; tách kỳ 5 xét/đăng ký khỏi kỳ OJT mục tiêu, thống nhất hạn ứng tuyển. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| POST | `/api/ojt-registration-windows/:id/semester-exceptions` | Có — dùng lại | Ngoại lệ kỳ có hạn/reason. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| POST | `/api/ojt-registration-windows/:id/semester-exceptions/:exceptionId/revoke` | Có — dùng lại | Thu hồi ngoại lệ. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| GET | `/api/ojt-registrations` | Có — dùng lại | Theo dõi hồ sơ tham gia OJT. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| GET | `/api/ojt-registrations/:id` | Đã sửa/đối chiếu | DTO theo role; Student không nhận raw snapshot nội bộ. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| POST | `/api/ojt-registrations/:id/review` | Có — dùng lại | Duyệt dựa trên official ELIGIBLE còn hiệu lực. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| POST | `/api/ojt-semesters/:id/eligible-student-handoffs` | Có — dùng lại | Chỉ ADMIN/ACADEMIC tạo bàn giao; không mở QHDN/Student. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| GET | `/api/ojt-semesters/:id/eligible-student-handoffs` | Có — dùng lại | Lịch sử bàn giao; OJT_COORD được đọc. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| GET | `/api/ojt-semesters/:id/students` | Có — dùng lại | Theo dõi kỳ; đã thêm bộ lọc DN/trạng thái điều phối/phân công. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| GET | `/api/academic/dashboard` | Có — dùng lại | Tổng quan học vụ | Dùng lại từ ACADEMIC; ADMIN có quyền |
| GET | `/api/academic/eligibility-statistics` | Có — dùng lại | Thống kê xét điều kiện | Dùng lại từ ACADEMIC; ADMIN có quyền |
| GET | `/api/academic/course-demand` | Có — dùng lại | Nhu cầu môn học; chỉ tham khảo, không đăng ký lớp | Dùng lại từ ACADEMIC; ADMIN có quyền |
| GET | `/api/academic/course-demand/export` | Có — dùng lại | Xuất nhu cầu CSV/JSON, không quản lý lớp | Dùng lại từ ACADEMIC; ADMIN có quyền |
| GET | `/api/academic/alerts` | Đã sửa/đối chiếu | Thêm EXCESS_FAILED_COURSES, đúng scope kỳ 5; không biến thiếu môn bắt buộc thành điều kiện OJT thứ ba. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| POST | `/api/academic/alerts/notifications` | Đã sửa/đối chiếu | Hiện chỉ gửi SV có alert; thêm tín chỉ đã đạt/thiếu và số môn nợ, giữ idempotency. Không dùng để gửi kết quả cuối kỳ. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| GET | `/api/ojt-results` | Có — dùng lại | Đọc kết quả OJT chuyển về. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| GET | `/api/ojt-results/:id` | Có — dùng lại | Chi tiết/lịch sử. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| POST | `/api/ojt-results/:id/revision-requests` | Có — dùng lại | Yêu cầu bổ sung. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| PATCH | `/api/ojt-results/:id` | Có — dùng lại | Điểm/kết quả chính thức. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| POST | `/api/ojt-results/:id/confirm` | Đã sửa/đối chiếu | Xác nhận kết quả; CONFIRMED được hiển thị cho Student. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| GET | `/api/ojt-semesters/:id/results/export` | Có — dùng lại | CSV/JSON; PDF chưa có. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| GET | `/api/curricula/:id/ojt-grade-mappings/:semesterId` | Có — dùng lại | Ánh xạ kết quả OJT về môn học. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| PUT | `/api/curricula/:id/ojt-grade-mappings/:semesterId` | Có — dùng lại | Cấu hình ánh xạ/thang điểm. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| POST | `/api/academic/academic-summary-notifications` | Đã tạo | gửi snapshot giữa kỳ cho cả scope, kể cả SV không có cảnh báo; có thể gửi thủ công trước. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| POST | `/api/academic/eligibility-notifications` | Đã tạo | thông báo đủ/không đủ/chờ đối soát; tham chiếu snapshot/checkId và chống gửi lặp. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| GET | `/api/academic-periods/:id/ojt-advisory-schedule` | Đã tạo | xem lịch thông báo giữa kỳ và deadline. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| PUT | `/api/academic-periods/:id/ojt-advisory-schedule` | Đã tạo | cấu hình lịch theo kỳ thực, worker thực thi. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| GET | `/api/academic/advisory-runs` | Đã tạo | lịch sử batch thông báo khi có worker. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| GET | `/api/academic/advisory-runs/:id` | Đã tạo | trạng thái/lỗi từng sinh viên. | Dùng lại từ ACADEMIC; ADMIN có quyền |
| POST | `/api/imports/archive` | Có — dùng lại | ADMIN/OJT_COORD; lưu trữ dữ liệu tuyển theo chính sách retention hiện có, không tự coi là công bố. | Dùng lại từ OJT_COORD; ADMIN có quyền |
| GET | `/api/company-imports` | Đã tạo | lịch sử import doanh nghiệp theo kỳ; tái sử dụng bảng import đã có. | Dùng lại từ OJT_COORD; ADMIN có quyền |
| GET | `/api/company-imports/:id` | Đã tạo | nguồn sheet, mapping, kết quả từng dòng/lỗi; cần lưu bổ sung metadata nếu schema chưa có. | Dùng lại từ OJT_COORD; ADMIN có quyền |
| GET | `/api/recruitment-posts` | Đã tạo | dữ liệu công bố được tạo từ sheet; không phải DN tự đăng tin. | Dùng lại từ OJT_COORD; ADMIN có quyền |
| GET | `/api/recruitment-posts/:id` | Đã tạo | QHDN kiểm tra vị trí/nội dung/kỳ/deadline trước công bố. | Dùng lại từ OJT_COORD; ADMIN có quyền |
| PATCH | `/api/recruitment-posts/:id` | Đã tạo | QHDN đính chính nội dung/deadline, đồng bộ với vị trí khi cần; không cấp quyền DN. | Dùng lại từ OJT_COORD; ADMIN có quyền |
| POST | `/api/recruitment-posts/:id/publish` | Đã tạo | QHDN duyệt công bố bản import. Cần vì import hiện tạo PENDING_REVIEW. | Dùng lại từ OJT_COORD; ADMIN có quyền |
| POST | `/api/recruitment-posts/:id/close` | Đã tạo | QHDN đóng công bố. Không đề xuất POST tạo tin thủ công/DN. | Dùng lại từ OJT_COORD; ADMIN có quyền |
| GET | `/api/companies` | Có — dùng lại | Danh sách/tìm kiếm/lọc | Dùng lại từ OJT_COORD; ADMIN có quyền |
| GET | `/api/companies/:id` | Có — dùng lại | Chi tiết | Dùng lại từ OJT_COORD; ADMIN có quyền |
| POST | `/api/companies` | Có — dùng lại | Bổ sung đơn lẻ khi cần | Dùng lại từ OJT_COORD; ADMIN có quyền |
| PATCH | `/api/companies/:id` | Có — dùng lại | Đính chính/trạng thái | Dùng lại từ OJT_COORD; ADMIN có quyền |
| GET | `/api/positions` | Có — dùng lại | Vị trí theo DN/kỳ | Dùng lại từ OJT_COORD; ADMIN có quyền |
| GET | `/api/positions/:id` | Có — dùng lại | Yêu cầu/chỉ tiêu/chỗ còn lại | Dùng lại từ OJT_COORD; ADMIN có quyền |
| POST | `/api/positions` | Có — dùng lại | Bổ sung vị trí, có thể cần tạo/liên kết bản công bố từ QHDN | Dùng lại từ OJT_COORD; ADMIN có quyền |
| PATCH | `/api/positions/:id` | Có — dùng lại | Sửa chỉ tiêu, đóng/mở; không thấp hơn chỗ đã giữ | Dùng lại từ OJT_COORD; ADMIN có quyền |
| GET | `/api/ojt-coordinations` | Đã sửa/đối chiếu | Thêm liên kết/filter applicationId. | Dùng lại từ OJT_COORD; ADMIN có quyền |
| GET | `/api/ojt-coordinations/:id` | Đã sửa/đối chiếu | Trả đơn liên quan và lịch sử phù hợp scope. | Dùng lại từ OJT_COORD; ADMIN có quyền |
| POST | `/api/ojt-coordinations` | Đã sửa/đối chiếu | Nhận applicationId; cùng hồ sơ/vị trí/kỳ, chưa rút đơn và đã bàn giao. | Dùng lại từ OJT_COORD; ADMIN có quyền |
| POST | `/api/ojt-coordinations/:id/decision` | Đã sửa/đối chiếu | Đã có DN tự quyết định, QHDN nhập thay reason/audit. Đồng bộ JobApplications và seat reservation cùng transaction. | Dùng lại từ OJT_COORD; ADMIN có quyền |
| POST | `/api/ojt-coordinations/:id/reassign` | Đã sửa/đối chiếu | Không dùng đơn vị trí cũ cho vị trí mới; giữ lịch sử. | Dùng lại từ OJT_COORD; ADMIN có quyền |
| GET | `/api/assignments` | Có — dùng lại | Danh sách phân công | Dùng lại từ OJT_COORD; ADMIN có quyền |
| GET | `/api/assignments/:id` | Có — dùng lại | Chi tiết | Dùng lại từ OJT_COORD; ADMIN có quyền |
| POST | `/api/assignments` | Có — dùng lại | Tạo từ điều phối ACCEPTED, không tự giả lập chấp nhận | Dùng lại từ OJT_COORD; ADMIN có quyền |
| PATCH | `/api/assignments/:id` | Có — dùng lại | Giám sát/thời gian | Dùng lại từ OJT_COORD; ADMIN có quyền |
| PATCH | `/api/assignments/:id/status` | Có — dùng lại | Bắt đầu/hoàn thành/hủy | Dùng lại từ OJT_COORD; ADMIN có quyền |
| GET | `/api/internship-evaluations` | Có — dùng lại | Danh sách đánh giá | Dùng lại từ OJT_COORD; ADMIN có quyền |
| GET | `/api/internship-evaluations/:id` | Có — dùng lại | Chi tiết | Dùng lại từ OJT_COORD; ADMIN có quyền |
| PUT | `/api/assignments/:id/internship-evaluation` | Có — dùng lại | Nhập thay DN bắt buộc reason; ghi người nhập thực | Dùng lại từ OJT_COORD; ADMIN có quyền |
| POST | `/api/ojt-results` | Có — dùng lại | Chuyển hồ sơ kết quả cho Đào tạo | Dùng lại từ OJT_COORD; ADMIN có quyền |
| POST | `/api/ojt-results/:id/transfer` | Có — dùng lại | Chuyển lại sau yêu cầu sửa | Dùng lại từ OJT_COORD; ADMIN có quyền |
| GET | `/api/job-applications` | Đã tạo | đơn ứng tuyển theo kỳ, kể cả đang chờ bàn giao phải giới hạn QHDN chỉ các hồ sơ đã bàn giao. | Dùng lại từ OJT_COORD; ADMIN có quyền |
| GET | `/api/job-applications/:id` | Đã tạo | hồ sơ/đơn cho QHDN; DN chỉ khi đã được điều phối đến DN mình. | Dùng lại từ OJT_COORD; ADMIN có quyền |
| GET | `/api/job-applications/:id/cv` | Đã tạo | tải CV private bằng quyền của đơn; DN chỉ hồ sơ được gửi cho mình. | Dùng lại từ OJT_COORD; ADMIN có quyền |
| GET | `/api/qhdn/dashboard` | Đã tạo | đối tác, chỉ tiêu, chưa phân bổ, chờ DN, đã phân công | Dùng lại từ OJT_COORD; ADMIN có quyền |
| GET | `/api/qhdn/reports/acceptance` | Đã tạo | tiếp nhận/từ chối | Dùng lại từ OJT_COORD; ADMIN có quyền |
| GET | `/api/qhdn/reports/internships` | Đã tạo | đang thực tập/hoàn thành/kết quả | Dùng lại từ OJT_COORD; ADMIN có quyền |
| GET | `/api/qhdn/reports/enterprise-feedback` | Đã tạo | tổng hợp đánh giá DN, không bao hàm module khảo sát mới | Dùng lại từ OJT_COORD; ADMIN có quyền |
| GET | `/api/qhdn/reports/export` | Đã tạo | xuất CSV/JSON, PDF làm sau nếu cần | Dùng lại từ OJT_COORD; ADMIN có quyền |
| POST | `/api/admin/prediction-jobs` | Có — để sau | Tạo job theo model đã cấu hình; hiện chỉ ADMIN. Có route không xác nhận model/dữ liệu AI đã sẵn sàng. | AI — cần cấu hình/model/dữ liệu thực tế |
| GET | `/api/admin/prediction-jobs/:id` | Có — để sau | Theo dõi job/lỗi; hiện chỉ ADMIN. Có route không xác nhận model/dữ liệu AI đã sẵn sàng. | AI — cần cấu hình/model/dữ liệu thực tế |
| GET | `/api/predictions` | Có — để sau | Kết quả dự đoán; hiện chỉ ADMIN. Có route không xác nhận model/dữ liệu AI đã sẵn sàng. | AI — cần cấu hình/model/dữ liệu thực tế |
| GET | `/api/predictions/:id` | Có — để sau | Chi tiết; hiện chỉ ADMIN. Có route không xác nhận model/dữ liệu AI đã sẵn sàng. | AI — cần cấu hình/model/dữ liệu thực tế |
| GET | `/api/students/:id/predictions` | Có — để sau | Lịch sử; hiện chỉ ADMIN. Có route không xác nhận model/dữ liệu AI đã sẵn sàng. | AI — cần cấu hình/model/dữ liệu thực tế |
| GET | `/api/admin/models` | Có — để sau | Phiên bản model; hiện chỉ ADMIN. Có route không xác nhận model/dữ liệu AI đã sẵn sàng. | AI — cần cấu hình/model/dữ liệu thực tế |
| GET | `/api/admin/models/:id` | Có — để sau | Thông tin model; hiện chỉ ADMIN. Có route không xác nhận model/dữ liệu AI đã sẵn sàng. | AI — cần cấu hình/model/dữ liệu thực tế |
| GET | `/api/alerts` | Có — để sau | Cảnh báo dự đoán, khác /academic/alerts; hiện chỉ ADMIN. Có route không xác nhận model/dữ liệu AI đã sẵn sàng. | AI — cần cấu hình/model/dữ liệu thực tế |
| GET | `/api/alerts/:id` | Có — để sau | Chi tiết; hiện chỉ ADMIN. Có route không xác nhận model/dữ liệu AI đã sẵn sàng. | AI — cần cấu hình/model/dữ liệu thực tế |
| PATCH | `/api/alerts/:id/status` | Có — để sau | Theo dõi xử lý cảnh báo; hiện chỉ ADMIN. Có route không xác nhận model/dữ liệu AI đã sẵn sàng. | AI — cần cấu hình/model/dữ liệu thực tế |
| POST | `/api/alerts/:id/interventions` | Có — để sau | Biện pháp hỗ trợ, không đăng ký lớp; hiện chỉ ADMIN. Có route không xác nhận model/dữ liệu AI đã sẵn sàng. | AI — cần cấu hình/model/dữ liệu thực tế |
| GET | `/api/students/:id/interventions` | Có — để sau | Lịch sử hỗ trợ; hiện chỉ ADMIN. Có route không xác nhận model/dữ liệu AI đã sẵn sàng. | AI — cần cấu hình/model/dữ liệu thực tế |
| PATCH | `/api/interventions/:id` | Có — để sau | Cập nhật hỗ trợ; hiện chỉ ADMIN. Có route không xác nhận model/dữ liệu AI đã sẵn sàng. | AI — cần cấu hình/model/dữ liệu thực tế |
| GET | `/api/admin/reports/readiness` | Có — để sau | Báo cáo dự đoán; hiện chỉ ADMIN. Có route không xác nhận model/dữ liệu AI đã sẵn sàng. | AI — cần cấu hình/model/dữ liệu thực tế |
| GET | `/api/admin/reports/risks` | Có — để sau | Báo cáo rủi ro; hiện chỉ ADMIN. Có route không xác nhận model/dữ liệu AI đã sẵn sàng. | AI — cần cấu hình/model/dữ liệu thực tế |
| GET | `/api/admin/reports/export` | Có — để sau | Xuất báo cáo dự đoán; hiện chỉ ADMIN. Có route không xác nhận model/dữ liệu AI đã sẵn sàng. | AI — cần cấu hình/model/dữ liệu thực tế |

## ACADEMIC — Phòng Đào tạo

**111 operation**; các actor có thể dùng chung một operation.

| Method | Endpoint | Trạng thái | Chức năng | Dùng lại và phạm vi |
|---|---|---|---|---|
| POST | `/api/auth/login` | Có — dùng lại | Đăng nhập; public. | Dùng chung xác thực/tài khoản; ngoài ADMIN chỉ tài khoản mình |
| POST | `/api/auth/logout` | Có — dùng lại | Tài khoản đăng nhập. | Dùng chung xác thực/tài khoản; ngoài ADMIN chỉ tài khoản mình |
| GET | `/api/auth/me` | Đã sửa/đối chiếu | Bổ sung studentId cho STUDENT, có thể enterpriseId cho ENTERPRISE. Không cần tạo thêm /student/me. | Dùng chung xác thực/tài khoản; ngoài ADMIN chỉ tài khoản mình |
| POST | `/api/auth/change-password` | Có — dùng lại | Đổi mật khẩu của mình. | Dùng chung xác thực/tài khoản; ngoài ADMIN chỉ tài khoản mình |
| GET | `/api/accounts/me/profile` | Có — dùng lại | Đọc hồ sơ tài khoản của mình; khác hồ sơ học vụ. | Dùng chung xác thực/tài khoản; ngoài ADMIN chỉ tài khoản mình |
| PATCH | `/api/accounts/me/profile` | Có — dùng lại | Sửa các trường cá nhân được phép, không sửa điểm/chương trình/trạng thái OJT. | Dùng chung xác thực/tài khoản; ngoài ADMIN chỉ tài khoản mình |
| GET | `/api/accounts/:userId` | Có — dùng lại | ADMIN đọc tất cả; role khác chỉ tài khoản mình theo kiểm tra service. | Dùng chung xác thực/tài khoản; ngoài ADMIN chỉ tài khoản mình |
| PUT | `/api/accounts/:userId` | Có — dùng lại | ADMIN hoặc bản thân với trường được phép. | Dùng chung xác thực/tài khoản; ngoài ADMIN chỉ tài khoản mình |
| GET | `/api/academic-years` | Có — dùng lại | Danh sách năm học | API của actor |
| POST | `/api/academic-years` | Có — dùng lại | Tạo năm học; ADMIN/ACADEMIC. | API của actor |
| PATCH | `/api/academic-years/:id` | Có — dùng lại | Sửa năm học; dùng lịch thực, không mặc định mọi kỳ đúng 4 tháng. | API của actor |
| GET | `/api/academic-periods` | Có — dùng lại | Danh sách kỳ học/BLOCK3 | API của actor |
| POST | `/api/academic-periods` | Có — dùng lại | Tạo kỳ học/BLOCK3; ADMIN/ACADEMIC. | API của actor |
| PATCH | `/api/academic-periods/:id` | Có — dùng lại | Sửa kỳ học/BLOCK3; dùng lịch thực, không mặc định mọi kỳ đúng 4 tháng. | API của actor |
| GET | `/api/cohorts` | Có — dùng lại | Danh sách khóa sinh viên | API của actor |
| POST | `/api/cohorts` | Có — dùng lại | Tạo khóa sinh viên; ADMIN/ACADEMIC. | API của actor |
| PATCH | `/api/cohorts/:id` | Có — dùng lại | Sửa khóa sinh viên; dùng lịch thực, không mặc định mọi kỳ đúng 4 tháng. | API của actor |
| GET | `/api/ojt-semesters` | Đã sửa/đối chiếu | Danh sách đợt OJT; OJT_COORD đã có quyền đọc, không cần mở lại. | API của actor |
| POST | `/api/ojt-semesters` | Có — dùng lại | Tạo đợt OJT; ADMIN/ACADEMIC. | API của actor |
| PATCH | `/api/ojt-semesters/:id` | Có — dùng lại | Chi tiết kỳ OJT; ADMIN/ACADEMIC/OJT_COORD được đọc. | API của actor |
| PATCH | `/api/students/:id/academic-placement` | Có — dùng lại | Gán kỳ vào chuyên ngành/kỳ thực tế; BLOCK3 không tăng học kỳ. | API của actor |
| PATCH | `/api/students/academic-placement` | Có — dùng lại | Alias nhận studentId trong body; không cần route mới. | API của actor |
| POST | `/api/imports/preview` | Có — dùng lại | Preview theo kind; ENTERPRISE hỗ trợ JSON/CSV/XLSX, mapping và lỗi từng dòng; STUDENT theo hợp đồng import sinh viên. | API của actor |
| POST | `/api/imports/commit` | Có — dùng lại | Lưu import theo kind và quyền; ENTERPRISE hỗ trợ nhập bổ sung/cập nhật, idempotency và lịch sử lỗi. | API của actor |
| GET | `/api/students` | Có — dùng lại | Danh sách SV; Student không được đọc toàn bộ. | API của actor |
| GET | `/api/students/:id` | Có — dùng lại | Hồ sơ học vụ; Student chỉ mình. | API của actor |
| PATCH | `/api/students/:id` | Có — dùng lại | Sửa hồ sơ có reason. | API của actor |
| GET | `/api/students/:id/course-results` | Có — dùng lại | Bảng điểm/lần học. | API của actor |
| GET | `/api/students/:id/academic-progress` | Có — dùng lại | Nguồn tính GPA/tín chỉ/thiếu cấu hình. | API của actor |
| POST | `/api/course-result-imports/preview` | Có — dùng lại | Preview điểm; gồm dữ liệu liên quan BL3W. | API của actor |
| POST | `/api/course-result-imports/commit` | Có — dùng lại | Commit điểm trước khi chốt. | API của actor |
| PATCH | `/api/course-results/:id` | Có — dùng lại | Đính chính có reason/audit; ảnh hưởng stale của kết quả xét. | API của actor |
| GET | `/api/academic-imports` | Có — dùng lại | Lịch sử import học vụ. | API của actor |
| GET | `/api/academic-imports/:id` | Có — dùng lại | Chi tiết lô/lỗi. | API của actor |
| GET | `/api/majors` | Có — dùng lại | Danh sách chuyên ngành; ADMIN/ACADEMIC. | API của actor |
| POST | `/api/majors` | Có — dùng lại | Tạo chuyên ngành; ADMIN/ACADEMIC. | API của actor |
| GET | `/api/courses` | Có — dùng lại | Danh sách môn; ADMIN/ACADEMIC. | API của actor |
| POST | `/api/courses` | Có — dùng lại | Tạo môn; ADMIN/ACADEMIC. | API của actor |
| PATCH | `/api/courses/:id` | Có — dùng lại | Sửa môn; ADMIN/ACADEMIC. | API của actor |
| GET | `/api/curricula` | Có — dùng lại | Danh sách chương trình; ADMIN/ACADEMIC. | API của actor |
| POST | `/api/curricula` | Có — dùng lại | Tạo chương trình; ADMIN/ACADEMIC. | API của actor |
| GET | `/api/curricula/:id` | Có — dùng lại | Chi tiết chương trình; ADMIN/ACADEMIC. | API của actor |
| PATCH | `/api/curricula/:id` | Có — dùng lại | Sửa chương trình nháp; ADMIN/ACADEMIC. | API của actor |
| POST | `/api/curriculum-imports/preview` | Có — dùng lại | Preview chương trình; ADMIN/ACADEMIC. | API của actor |
| POST | `/api/curriculum-imports/commit` | Có — dùng lại | Import chương trình; ADMIN/ACADEMIC. | API của actor |
| PUT | `/api/curricula/:id/courses` | Có — dùng lại | Cấu trúc môn và tín chỉ; ADMIN/ACADEMIC. | API của actor |
| PUT | `/api/curricula/:id/prerequisites` | Có — dùng lại | Môn tiên quyết; ADMIN/ACADEMIC. | API của actor |
| PUT | `/api/curricula/:id/course-equivalences` | Có — dùng lại | Môn tương đương; ADMIN/ACADEMIC. | API của actor |
| GET | `/api/curricula/:id/combos` | Có — dùng lại | Danh sách combo; ADMIN/ACADEMIC. | API của actor |
| POST | `/api/curricula/:id/combos` | Có — dùng lại | Tạo combo; ADMIN/ACADEMIC. | API của actor |
| PUT | `/api/combos/:id/courses` | Có — dùng lại | Môn thuộc combo; ADMIN/ACADEMIC. | API của actor |
| POST | `/api/curricula/:id/publish` | Có — dùng lại | Ban hành chương trình; ADMIN/ACADEMIC. | API của actor |
| GET | `/api/combo-registration-windows` | Có — dùng lại | Danh sách đợt; luồng combo hiện có. | API của actor |
| POST | `/api/combo-registration-windows` | Có — dùng lại | Tạo đợt; luồng combo hiện có. | API của actor |
| PATCH | `/api/combo-registration-windows/:id` | Có — dùng lại | Sửa đợt; luồng combo hiện có. | API của actor |
| POST | `/api/combo-registration-windows/:id/open` | Có — dùng lại | Mở; luồng combo hiện có. | API của actor |
| POST | `/api/combo-registration-windows/:id/close` | Có — dùng lại | Đóng; luồng combo hiện có. | API của actor |
| POST | `/api/combo-registration-windows/:id/extensions` | Có — dùng lại | Gia hạn; luồng combo hiện có. | API của actor |
| POST | `/api/combo-registration-windows/:id/reminders` | Có — dùng lại | Nhắc hạn; luồng combo hiện có. | API của actor |
| POST | `/api/combo-registration-windows/:id/finalize` | Có — dùng lại | Chốt lựa chọn; luồng combo hiện có. | API của actor |
| GET | `/api/combo-registration-windows/:id/selections` | Có — dùng lại | Báo cáo lựa chọn; luồng combo hiện có. | API của actor |
| GET | `/api/academic-periods/:id/combo-phase-schedules` | Có — dùng lại | Lịch pha chọn/xác nhận; luồng combo hiện có. | API của actor |
| PUT | `/api/academic-periods/:id/combo-phase-schedules` | Có — dùng lại | Cấu hình lịch pha; luồng combo hiện có. | API của actor |
| GET | `/api/ojt-rule-sets` | Có — dùng lại | Danh sách quy tắc | API của actor |
| POST | `/api/ojt-rule-sets` | Có — dùng lại | Tạo quy tắc 70/2 | API của actor |
| PATCH | `/api/ojt-rule-sets/:id` | Có — dùng lại | Sửa bản nháp | API của actor |
| POST | `/api/ojt-rule-sets/:id/publish` | Có — dùng lại | Ban hành | API của actor |
| POST | `/api/students/:id/eligibility-checks` | Có — dùng lại | Lưu lần xét; chưa tự chốt chính thức | API của actor |
| POST | `/api/eligibility-check-runs` | Có — dùng lại | Xét batch; có thể chạy giữa kỳ, snapshot không tự trở thành official | API của actor |
| GET | `/api/eligibility-check-runs/:id` | Có — dùng lại | Tiến trình và lỗi | API của actor |
| GET | `/api/students/:id/eligibility` | Có — dùng lại | Current/latest/official và stale | API của actor |
| GET | `/api/students/:id/eligibility-checks` | Có — dùng lại | Lịch sử | API của actor |
| POST | `/api/eligibility-checks/:id/confirm` | Đã sửa/đối chiếu | Buộc kỳ xét là kỳ tương đối 5 (hoặc ngoại lệ được duyệt), kỳ cha + BL3W đã kết thúc, điểm finalized và snapshot mới. | API của actor |
| GET | `/api/ojt-semesters/:id/assessment-window` | Đã sửa/đối chiếu | Bổ sung rõ kỳ học xét và kỳ OJT đích. | API của actor |
| PUT | `/api/ojt-semesters/:id/assessment-window` | Đã sửa/đối chiếu | Cấu hình assessmentAcademicPeriodId; BLOCK3 phải thuộc kỳ cha cần xét. | API của actor |
| POST | `/api/ojt-semesters/:id/assessment-window/open` | Đã sửa/đối chiếu | Đã có resultsFinalized; bổ sung guard toàn kỳ và luồng mở lại có audit, không âm thầm đổi mốc chốt. | API của actor |
| POST | `/api/ojt-semesters/:id/assessment-window/close` | Có — dùng lại | Đóng đợt xét. | API của actor |
| GET | `/api/ojt-registration-windows` | Đã sửa/đối chiếu | Danh sách đợt; tách kỳ 5 xét/đăng ký khỏi kỳ OJT mục tiêu, thống nhất hạn ứng tuyển. | API của actor |
| POST | `/api/ojt-registration-windows` | Đã sửa/đối chiếu | Tạo đợt; tách kỳ 5 xét/đăng ký khỏi kỳ OJT mục tiêu, thống nhất hạn ứng tuyển. | API của actor |
| PATCH | `/api/ojt-registration-windows/:id` | Đã sửa/đối chiếu | Sửa đợt; tách kỳ 5 xét/đăng ký khỏi kỳ OJT mục tiêu, thống nhất hạn ứng tuyển. | API của actor |
| POST | `/api/ojt-registration-windows/:id/open` | Đã sửa/đối chiếu | Mở đợt; tách kỳ 5 xét/đăng ký khỏi kỳ OJT mục tiêu, thống nhất hạn ứng tuyển. | API của actor |
| POST | `/api/ojt-registration-windows/:id/close` | Đã sửa/đối chiếu | Đóng đợt; tách kỳ 5 xét/đăng ký khỏi kỳ OJT mục tiêu, thống nhất hạn ứng tuyển. | API của actor |
| POST | `/api/ojt-registration-windows/:id/semester-exceptions` | Có — dùng lại | Ngoại lệ kỳ có hạn/reason. | API của actor |
| POST | `/api/ojt-registration-windows/:id/semester-exceptions/:exceptionId/revoke` | Có — dùng lại | Thu hồi ngoại lệ. | API của actor |
| GET | `/api/ojt-registrations` | Có — dùng lại | Theo dõi hồ sơ tham gia OJT. | API của actor |
| GET | `/api/ojt-registrations/:id` | Đã sửa/đối chiếu | DTO theo role; Student không nhận raw snapshot nội bộ. | API của actor |
| POST | `/api/ojt-registrations/:id/review` | Có — dùng lại | Duyệt dựa trên official ELIGIBLE còn hiệu lực. | API của actor |
| POST | `/api/ojt-semesters/:id/eligible-student-handoffs` | Có — dùng lại | Chỉ ADMIN/ACADEMIC tạo bàn giao; không mở QHDN/Student. | API của actor |
| GET | `/api/ojt-semesters/:id/eligible-student-handoffs` | Có — dùng lại | Lịch sử bàn giao; OJT_COORD được đọc. | API của actor |
| GET | `/api/ojt-semesters/:id/students` | Có — dùng lại | Theo dõi kỳ; đã thêm bộ lọc DN/trạng thái điều phối/phân công. | API của actor |
| GET | `/api/academic/dashboard` | Có — dùng lại | Tổng quan học vụ | API của actor |
| GET | `/api/academic/eligibility-statistics` | Có — dùng lại | Thống kê xét điều kiện | API của actor |
| GET | `/api/academic/course-demand` | Có — dùng lại | Nhu cầu môn học; chỉ tham khảo, không đăng ký lớp | API của actor |
| GET | `/api/academic/course-demand/export` | Có — dùng lại | Xuất nhu cầu CSV/JSON, không quản lý lớp | API của actor |
| GET | `/api/academic/alerts` | Đã sửa/đối chiếu | Thêm EXCESS_FAILED_COURSES, đúng scope kỳ 5; không biến thiếu môn bắt buộc thành điều kiện OJT thứ ba. | API của actor |
| POST | `/api/academic/alerts/notifications` | Đã sửa/đối chiếu | Hiện chỉ gửi SV có alert; thêm tín chỉ đã đạt/thiếu và số môn nợ, giữ idempotency. Không dùng để gửi kết quả cuối kỳ. | API của actor |
| GET | `/api/ojt-results` | Có — dùng lại | Đọc kết quả OJT chuyển về. | API của actor |
| GET | `/api/ojt-results/:id` | Có — dùng lại | Chi tiết/lịch sử. | API của actor |
| POST | `/api/ojt-results/:id/revision-requests` | Có — dùng lại | Yêu cầu bổ sung. | API của actor |
| PATCH | `/api/ojt-results/:id` | Có — dùng lại | Điểm/kết quả chính thức. | API của actor |
| POST | `/api/ojt-results/:id/confirm` | Đã sửa/đối chiếu | Xác nhận kết quả; CONFIRMED được hiển thị cho Student. | API của actor |
| GET | `/api/ojt-semesters/:id/results/export` | Có — dùng lại | CSV/JSON; PDF chưa có. | API của actor |
| GET | `/api/curricula/:id/ojt-grade-mappings/:semesterId` | Có — dùng lại | Ánh xạ kết quả OJT về môn học. | API của actor |
| PUT | `/api/curricula/:id/ojt-grade-mappings/:semesterId` | Có — dùng lại | Cấu hình ánh xạ/thang điểm. | API của actor |
| POST | `/api/academic/academic-summary-notifications` | Đã tạo | gửi snapshot giữa kỳ cho cả scope, kể cả SV không có cảnh báo; có thể gửi thủ công trước. | API của actor |
| POST | `/api/academic/eligibility-notifications` | Đã tạo | thông báo đủ/không đủ/chờ đối soát; tham chiếu snapshot/checkId và chống gửi lặp. | API của actor |
| GET | `/api/academic-periods/:id/ojt-advisory-schedule` | Đã tạo | xem lịch thông báo giữa kỳ và deadline. | API của actor |
| PUT | `/api/academic-periods/:id/ojt-advisory-schedule` | Đã tạo | cấu hình lịch theo kỳ thực, worker thực thi. | API của actor |
| GET | `/api/academic/advisory-runs` | Đã tạo | lịch sử batch thông báo khi có worker. | API của actor |
| GET | `/api/academic/advisory-runs/:id` | Đã tạo | trạng thái/lỗi từng sinh viên. | API của actor |
| GET | `/api/ojt-semesters/:id` | Đã sửa/đối chiếu | Chi tiết kỳ OJT; ADMIN/ACADEMIC/OJT_COORD được đọc. | Dùng lại API chi tiết kỳ, chỉ đọc |

## OJT_COORD — Phòng Quan hệ doanh nghiệp

**58 operation**; các actor có thể dùng chung một operation.

| Method | Endpoint | Trạng thái | Chức năng | Dùng lại và phạm vi |
|---|---|---|---|---|
| POST | `/api/auth/login` | Có — dùng lại | Đăng nhập; public. | Dùng chung xác thực/tài khoản; ngoài ADMIN chỉ tài khoản mình |
| POST | `/api/auth/logout` | Có — dùng lại | Tài khoản đăng nhập. | Dùng chung xác thực/tài khoản; ngoài ADMIN chỉ tài khoản mình |
| GET | `/api/auth/me` | Đã sửa/đối chiếu | Bổ sung studentId cho STUDENT, có thể enterpriseId cho ENTERPRISE. Không cần tạo thêm /student/me. | Dùng chung xác thực/tài khoản; ngoài ADMIN chỉ tài khoản mình |
| POST | `/api/auth/change-password` | Có — dùng lại | Đổi mật khẩu của mình. | Dùng chung xác thực/tài khoản; ngoài ADMIN chỉ tài khoản mình |
| GET | `/api/accounts/me/profile` | Có — dùng lại | Đọc hồ sơ tài khoản của mình; khác hồ sơ học vụ. | Dùng chung xác thực/tài khoản; ngoài ADMIN chỉ tài khoản mình |
| PATCH | `/api/accounts/me/profile` | Có — dùng lại | Sửa các trường cá nhân được phép, không sửa điểm/chương trình/trạng thái OJT. | Dùng chung xác thực/tài khoản; ngoài ADMIN chỉ tài khoản mình |
| GET | `/api/accounts/:userId` | Có — dùng lại | ADMIN đọc tất cả; role khác chỉ tài khoản mình theo kiểm tra service. | Dùng chung xác thực/tài khoản; ngoài ADMIN chỉ tài khoản mình |
| PUT | `/api/accounts/:userId` | Có — dùng lại | ADMIN hoặc bản thân với trường được phép. | Dùng chung xác thực/tài khoản; ngoài ADMIN chỉ tài khoản mình |
| POST | `/api/imports/preview` | Đã sửa/đối chiếu | Preview theo kind; ENTERPRISE hỗ trợ JSON/CSV/XLSX, mapping và lỗi từng dòng; STUDENT theo hợp đồng import sinh viên. | API của actor |
| POST | `/api/imports/commit` | Đã sửa/đối chiếu | Lưu import theo kind và quyền; ENTERPRISE hỗ trợ nhập bổ sung/cập nhật, idempotency và lịch sử lỗi. | API của actor |
| POST | `/api/imports/archive` | Có — dùng lại | ADMIN/OJT_COORD; lưu trữ dữ liệu tuyển theo chính sách retention hiện có, không tự coi là công bố. | API của actor |
| GET | `/api/company-imports` | Đã tạo | lịch sử import doanh nghiệp theo kỳ; tái sử dụng bảng import đã có. | API của actor |
| GET | `/api/company-imports/:id` | Đã tạo | nguồn sheet, mapping, kết quả từng dòng/lỗi; cần lưu bổ sung metadata nếu schema chưa có. | API của actor |
| GET | `/api/recruitment-posts` | Đã tạo | dữ liệu công bố được tạo từ sheet; không phải DN tự đăng tin. | API của actor |
| GET | `/api/recruitment-posts/:id` | Đã tạo | QHDN kiểm tra vị trí/nội dung/kỳ/deadline trước công bố. | API của actor |
| PATCH | `/api/recruitment-posts/:id` | Đã tạo | QHDN đính chính nội dung/deadline, đồng bộ với vị trí khi cần; không cấp quyền DN. | API của actor |
| POST | `/api/recruitment-posts/:id/publish` | Đã tạo | QHDN duyệt công bố bản import. Cần vì import hiện tạo PENDING_REVIEW. | API của actor |
| POST | `/api/recruitment-posts/:id/close` | Đã tạo | QHDN đóng công bố. Không đề xuất POST tạo tin thủ công/DN. | API của actor |
| GET | `/api/companies` | Có — dùng lại | Danh sách/tìm kiếm/lọc | API của actor |
| GET | `/api/companies/:id` | Có — dùng lại | Chi tiết | API của actor |
| POST | `/api/companies` | Có — dùng lại | Bổ sung đơn lẻ khi cần | API của actor |
| PATCH | `/api/companies/:id` | Có — dùng lại | Đính chính/trạng thái | API của actor |
| GET | `/api/positions` | Có — dùng lại | Vị trí theo DN/kỳ | API của actor |
| GET | `/api/positions/:id` | Có — dùng lại | Yêu cầu/chỉ tiêu/chỗ còn lại | API của actor |
| POST | `/api/positions` | Có — dùng lại | Bổ sung vị trí, có thể cần tạo/liên kết bản công bố từ QHDN | API của actor |
| PATCH | `/api/positions/:id` | Có — dùng lại | Sửa chỉ tiêu, đóng/mở; không thấp hơn chỗ đã giữ | API của actor |
| GET | `/api/ojt-semesters` | Có — dùng lại | Đã có quyền OJT_COORD, bỏ ghi chú cũ chỉ ADMIN/ACADEMIC | API của actor; dùng lại luồng ACADEMIC; scope bàn giao và quyền thao tác QHDN |
| GET | `/api/ojt-registrations` | Có — dùng lại | Chỉ hồ sơ bàn giao | API của actor; dùng lại luồng ACADEMIC; scope bàn giao và quyền thao tác QHDN |
| GET | `/api/ojt-semesters/:id/eligible-student-handoffs` | Có — dùng lại | Đọc lịch sử bàn giao | API của actor; dùng lại luồng ACADEMIC; scope bàn giao và quyền thao tác QHDN |
| GET | `/api/ojt-semesters/:id/students` | Có — dùng lại | Đã có enterpriseId/coordinationStatus/assignmentStatus; QHDN chỉ thấy bàn giao | API của actor; dùng lại luồng ACADEMIC; scope bàn giao và quyền thao tác QHDN |
| GET | `/api/ojt-registrations/:id` | Đã sửa/đối chiếu | Dùng làm nguồn hồ sơ điều phối; lọc DTO theo role. | API của actor; dùng lại luồng ACADEMIC; scope bàn giao và quyền thao tác QHDN |
| GET | `/api/ojt-coordinations` | Đã sửa/đối chiếu | Thêm liên kết/filter applicationId. | API của actor |
| GET | `/api/ojt-coordinations/:id` | Đã sửa/đối chiếu | Trả đơn liên quan và lịch sử phù hợp scope. | API của actor |
| POST | `/api/ojt-coordinations` | Đã sửa/đối chiếu | Nhận applicationId; cùng hồ sơ/vị trí/kỳ, chưa rút đơn và đã bàn giao. | API của actor |
| POST | `/api/ojt-coordinations/:id/decision` | Đã sửa/đối chiếu | Đã có DN tự quyết định, QHDN nhập thay reason/audit. Đồng bộ JobApplications và seat reservation cùng transaction. | API của actor |
| POST | `/api/ojt-coordinations/:id/reassign` | Đã sửa/đối chiếu | Không dùng đơn vị trí cũ cho vị trí mới; giữ lịch sử. | API của actor |
| GET | `/api/assignments` | Có — dùng lại | Danh sách phân công | API của actor |
| GET | `/api/assignments/:id` | Có — dùng lại | Chi tiết | API của actor |
| POST | `/api/assignments` | Có — dùng lại | Tạo từ điều phối ACCEPTED, không tự giả lập chấp nhận | API của actor |
| PATCH | `/api/assignments/:id` | Có — dùng lại | Giám sát/thời gian | API của actor |
| PATCH | `/api/assignments/:id/status` | Có — dùng lại | Bắt đầu/hoàn thành/hủy | API của actor |
| GET | `/api/internship-evaluations` | Có — dùng lại | Danh sách đánh giá | API của actor |
| GET | `/api/internship-evaluations/:id` | Có — dùng lại | Chi tiết | API của actor |
| PUT | `/api/assignments/:id/internship-evaluation` | Có — dùng lại | Nhập thay DN bắt buộc reason; ghi người nhập thực | API của actor |
| GET | `/api/ojt-results` | Có — dùng lại | Kết quả đã chuyển | API của actor; dùng lại luồng ACADEMIC; scope bàn giao và quyền thao tác QHDN |
| GET | `/api/ojt-results/:id` | Có — dùng lại | Chi tiết kết quả | API của actor; dùng lại luồng ACADEMIC; scope bàn giao và quyền thao tác QHDN |
| POST | `/api/ojt-results` | Có — dùng lại | Chuyển hồ sơ kết quả cho Đào tạo | API của actor; dùng lại luồng ACADEMIC; scope bàn giao và quyền thao tác QHDN |
| POST | `/api/ojt-results/:id/transfer` | Có — dùng lại | Chuyển lại sau yêu cầu sửa | API của actor; dùng lại luồng ACADEMIC; scope bàn giao và quyền thao tác QHDN |
| GET | `/api/ojt-semesters/:id/results/export` | Có — dùng lại | CSV/JSON, chưa PDF | API của actor; dùng lại luồng ACADEMIC; scope bàn giao và quyền thao tác QHDN |
| GET | `/api/job-applications` | Đã tạo | đơn ứng tuyển theo kỳ, kể cả đang chờ bàn giao phải giới hạn QHDN chỉ các hồ sơ đã bàn giao. | API của actor |
| GET | `/api/job-applications/:id` | Đã tạo | hồ sơ/đơn cho QHDN; DN chỉ khi đã được điều phối đến DN mình. | API của actor |
| GET | `/api/job-applications/:id/cv` | Đã tạo | tải CV private bằng quyền của đơn; DN chỉ hồ sơ được gửi cho mình. | API của actor |
| GET | `/api/qhdn/dashboard` | Đã tạo | đối tác, chỉ tiêu, chưa phân bổ, chờ DN, đã phân công | API của actor |
| GET | `/api/qhdn/reports/acceptance` | Đã tạo | tiếp nhận/từ chối | API của actor |
| GET | `/api/qhdn/reports/internships` | Đã tạo | đang thực tập/hoàn thành/kết quả | API của actor |
| GET | `/api/qhdn/reports/enterprise-feedback` | Đã tạo | tổng hợp đánh giá DN, không bao hàm module khảo sát mới | API của actor |
| GET | `/api/qhdn/reports/export` | Đã tạo | xuất CSV/JSON, PDF làm sau nếu cần | API của actor |
| GET | `/api/ojt-semesters/:id` | Đã sửa/đối chiếu | Chi tiết kỳ OJT; ADMIN/ACADEMIC/OJT_COORD được đọc. | Dùng lại API chi tiết kỳ, chỉ đọc; dùng lại luồng ACADEMIC; scope bàn giao và quyền thao tác QHDN |

## STUDENT — Sinh viên

**46 operation**; các actor có thể dùng chung một operation.

| Method | Endpoint | Trạng thái | Chức năng | Dùng lại và phạm vi |
|---|---|---|---|---|
| POST | `/api/auth/login` | Có — dùng lại | Đăng nhập; public. | Dùng chung xác thực/tài khoản; ngoài ADMIN chỉ tài khoản mình |
| POST | `/api/auth/logout` | Có — dùng lại | Tài khoản đăng nhập. | Dùng chung xác thực/tài khoản; ngoài ADMIN chỉ tài khoản mình |
| GET | `/api/auth/me` | Đã sửa/đối chiếu | Bổ sung studentId cho STUDENT, có thể enterpriseId cho ENTERPRISE. Không cần tạo thêm /student/me. | Dùng chung xác thực/tài khoản; ngoài ADMIN chỉ tài khoản mình |
| POST | `/api/auth/change-password` | Có — dùng lại | Đổi mật khẩu của mình. | Dùng chung xác thực/tài khoản; ngoài ADMIN chỉ tài khoản mình |
| GET | `/api/accounts/me/profile` | Có — dùng lại | Đọc hồ sơ tài khoản của mình; khác hồ sơ học vụ. | Dùng chung xác thực/tài khoản; ngoài ADMIN chỉ tài khoản mình |
| PATCH | `/api/accounts/me/profile` | Có — dùng lại | Sửa các trường cá nhân được phép, không sửa điểm/chương trình/trạng thái OJT. | Dùng chung xác thực/tài khoản; ngoài ADMIN chỉ tài khoản mình |
| GET | `/api/accounts/:userId` | Có — dùng lại | ADMIN đọc tất cả; role khác chỉ tài khoản mình theo kiểm tra service. | Dùng chung xác thực/tài khoản; ngoài ADMIN chỉ tài khoản mình |
| PUT | `/api/accounts/:userId` | Có — dùng lại | ADMIN hoặc bản thân với trường được phép. | Dùng chung xác thực/tài khoản; ngoài ADMIN chỉ tài khoản mình |
| GET | `/api/students/:id` | Có — dùng lại | Chỉ hồ sơ mình | API của actor; dùng lại luồng ACADEMIC, chỉ dữ liệu/lựa chọn của mình |
| GET | `/api/students/:id/course-results` | Có — dùng lại | Điểm/lần học | API của actor; dùng lại luồng ACADEMIC, chỉ dữ liệu/lựa chọn của mình |
| GET | `/api/students/:id/academic-progress` | Có — dùng lại | Tiến độ | API của actor; dùng lại luồng ACADEMIC, chỉ dữ liệu/lựa chọn của mình |
| GET | `/api/students/:id/eligibility` | Có — dùng lại | Current/latest/official và stale; giữa kỳ đủ chưa là quyền đi chính thức | API của actor; dùng lại luồng ACADEMIC, chỉ dữ liệu/lựa chọn của mình |
| GET | `/api/students/:id/eligibility-checks` | Có — dùng lại | Lịch sử | API của actor; dùng lại luồng ACADEMIC, chỉ dữ liệu/lựa chọn của mình |
| GET | `/api/ojt-registrations` | Có — dùng lại | Hồ sơ của mình | API của actor; dùng lại luồng ACADEMIC, chỉ dữ liệu/lựa chọn của mình |
| GET | `/api/students/:id/combo-selections` | Có — dùng lại | Lịch sử combo | API của actor; dùng lại luồng ACADEMIC, chỉ dữ liệu/lựa chọn của mình |
| POST | `/api/combo-registration-windows/:id/preview` | Có — dùng lại | Xem thử lựa chọn | API của actor; dùng lại luồng ACADEMIC, chỉ dữ liệu/lựa chọn của mình |
| POST | `/api/combo-registration-windows/:id/selections` | Có — dùng lại | Gửi lựa chọn combo | API của actor; dùng lại luồng ACADEMIC, chỉ dữ liệu/lựa chọn của mình |
| POST | `/api/ojt-registrations` | Đã sửa/đối chiếu | Nếu chỉ đăng ký sau chốt: yêu cầu official ELIGIBLE hiện hành. Đây là hồ sơ tham gia OJT, chưa phải đơn DN. | API của actor; dùng lại luồng ACADEMIC, chỉ dữ liệu/lựa chọn của mình |
| GET | `/api/ojt-registrations/:id` | Đã sửa/đối chiếu | DTO riêng; không trả raw AuditLogs/snapshot nội bộ. | API của actor; dùng lại luồng ACADEMIC, chỉ dữ liệu/lựa chọn của mình |
| GET | `/api/student/academic-summary` | Đã tạo | tín chỉ đã đạt/đang học/thiếu; môn nợ/chưa học/đang học. Kịch bản đạt ngưỡng không phải xác suất AI | API của actor |
| GET | `/api/student/supplementary-course-options` | Đã tạo | đề xuất môn/môn học lại, tín chỉ, lý do và tiên quyết; không lớp, không đăng ký học, không cam kết lịch | API của actor |
| GET | `/api/student/ojt-registration-windows` | Đã tạo | scope/deadline, canRegister/blockReasons | API của actor |
| GET | `/api/student/curriculum` | Đã tạo | chương trình đã ban hành của mình | API của actor |
| GET | `/api/student/companies` | Đã tạo | đối tác ACTIVE và có dữ liệu được công bố | API của actor |
| GET | `/api/student/companies/:id` | Đã tạo | chi tiết đối tác công khai phù hợp | API của actor |
| GET | `/api/student/positions` | Đã tạo | vị trí công bố bởi QHDN, đúng kỳ, OPEN/PUBLISHED, deadline/chỉ tiêu/canApply | API của actor |
| GET | `/api/student/positions/:id` | Đã tạo | chi tiết; trả postId phù hợp schema hiện có | API của actor |
| POST | `/api/student/applications` | Đã tạo | ứng tuyển sau official ELIGIBLE, đợt mở và vị trí công bố. Có thể nhận trước bàn giao, nhưng QHDN không điều phối trước bàn giao | API của actor |
| GET | `/api/student/applications` | Đã tạo | đơn của mình | API của actor |
| GET | `/api/student/applications/:id` | Đã tạo | timeline tiếp nhận/điều phối/phân công | API của actor |
| POST | `/api/student/cv` | Đã tạo | upload CV private giữa→cuối kỳ 5, độc lập AI; giới hạn loại/kích thước tệp | API của actor |
| GET | `/api/student/cv` | Đã tạo | thông tin/phiên bản CV của mình, tải có xác thực | API của actor |
| DELETE | `/api/student/cv` | Đã tạo | xóa/ngừng dùng CV hiện tại, giữ bản đã nộp theo chính sách hồ sơ; không phá lịch sử đơn | API của actor |
| GET | `/api/student/notifications` | Đã tạo | thông báo/lọc unread/phân trang, trả unreadCount cùng response | API của actor |
| PATCH | `/api/student/notifications/:id/read` | Đã tạo | người nhận đánh dấu đọc, idempotent | API của actor |
| GET | `/api/student/combo-registration-windows` | Đã tạo | các đợt/lựa chọn khả dụng | API của actor |
| GET | `/api/student/assignments/current` | Đã tạo | DN/vị trí/giám sát/thời gian của mình theo kỳ | API của actor |
| GET | `/api/student/ojt-results` | Đã tạo | chỉ kết quả của mình được công bố | API của actor |
| GET | `/api/student/ojt-results/:id` | Đã tạo | điểm/nhận xét đã công bố | API của actor |
| GET | `/api/student/dashboard` | Đã tạo | tổng hợp; không tạo thuật toán học vụ mới | API của actor |
| POST | `/api/student/applications/:id/withdraw` | Đã tạo | rút đơn trước tiếp nhận/phân công theo chính sách; giữ lịch sử | API của actor |
| GET | `/api/student/risk-prediction` | Đã tạo — cần cấu hình AI | kết quả dự báo của mình, dùng lại prediction service khi có dữ liệu | AI — cần cấu hình/model/dữ liệu thực tế |
| GET | `/api/student/roadmap-recommendations` | Đã tạo — cần cấu hình AI | tư vấn AI lộ trình; khác đề xuất môn bằng quy tắc | AI — cần cấu hình/model/dữ liệu thực tế |
| POST | `/api/student/cv/analyses` | Đã tạo — cần cấu hình AI | chạy trích xuất CV, tạo job | AI — cần cấu hình/model/dữ liệu thực tế |
| GET | `/api/student/cv/analyses/:id` | Đã tạo — cần cấu hình AI | kết quả/lỗi trích xuất | AI — cần cấu hình/model/dữ liệu thực tế |
| GET | `/api/student/company-recommendations` | Đã tạo — cần cấu hình AI | gợi ý vị trí theo CV, điểm/phân tích matching và lý do | AI — cần cấu hình/model/dữ liệu thực tế |

## ENTERPRISE — Doanh nghiệp

**23 operation**; các actor có thể dùng chung một operation.

| Method | Endpoint | Trạng thái | Chức năng | Dùng lại và phạm vi |
|---|---|---|---|---|
| POST | `/api/auth/login` | Có — dùng lại | Đăng nhập; public. | Dùng chung xác thực/tài khoản; ngoài ADMIN chỉ tài khoản mình |
| POST | `/api/auth/logout` | Có — dùng lại | Tài khoản đăng nhập. | Dùng chung xác thực/tài khoản; ngoài ADMIN chỉ tài khoản mình |
| GET | `/api/auth/me` | Đã sửa/đối chiếu | Bổ sung studentId cho STUDENT, có thể enterpriseId cho ENTERPRISE. Không cần tạo thêm /student/me. | Dùng chung xác thực/tài khoản; ngoài ADMIN chỉ tài khoản mình |
| POST | `/api/auth/change-password` | Có — dùng lại | Đổi mật khẩu của mình. | Dùng chung xác thực/tài khoản; ngoài ADMIN chỉ tài khoản mình |
| GET | `/api/accounts/me/profile` | Có — dùng lại | Đọc hồ sơ tài khoản của mình; khác hồ sơ học vụ. | Dùng chung xác thực/tài khoản; ngoài ADMIN chỉ tài khoản mình |
| PATCH | `/api/accounts/me/profile` | Có — dùng lại | Sửa các trường cá nhân được phép, không sửa điểm/chương trình/trạng thái OJT. | Dùng chung xác thực/tài khoản; ngoài ADMIN chỉ tài khoản mình |
| GET | `/api/accounts/:userId` | Có — dùng lại | ADMIN đọc tất cả; role khác chỉ tài khoản mình theo kiểm tra service. | Dùng chung xác thực/tài khoản; ngoài ADMIN chỉ tài khoản mình |
| PUT | `/api/accounts/:userId` | Có — dùng lại | ADMIN hoặc bản thân với trường được phép. | Dùng chung xác thực/tài khoản; ngoài ADMIN chỉ tài khoản mình |
| GET | `/api/companies` | Có — dùng lại | Chỉ doanh nghiệp liên kết qua EnterpriseUsers | API của actor; dùng lại API OJT_COORD; chỉ DN mình và hồ sơ được điều phối |
| GET | `/api/companies/:id` | Có — dùng lại | Chi tiết doanh nghiệp mình | API của actor; dùng lại API OJT_COORD; chỉ DN mình và hồ sơ được điều phối |
| GET | `/api/positions` | Có — dùng lại | Chỉ các vị trí DN mình do QHDN nhập | API của actor; dùng lại API OJT_COORD; chỉ DN mình và hồ sơ được điều phối |
| GET | `/api/positions/:id` | Có — dùng lại | Chi tiết vị trí | API của actor; dùng lại API OJT_COORD; chỉ DN mình và hồ sơ được điều phối |
| GET | `/api/ojt-coordinations` | Có — dùng lại | Chỉ hồ sơ điều phối đến DN mình | API của actor; dùng lại API OJT_COORD; chỉ DN mình và hồ sơ được điều phối |
| GET | `/api/ojt-coordinations/:id` | Có — dùng lại | Chi tiết/lịch sử trong scope | API của actor; dùng lại API OJT_COORD; chỉ DN mình và hồ sơ được điều phối |
| GET | `/api/assignments` | Có — dùng lại | Phân công DN mình | API của actor; dùng lại API OJT_COORD; chỉ DN mình và hồ sơ được điều phối |
| GET | `/api/assignments/:id` | Có — dùng lại | Chi tiết | API của actor; dùng lại API OJT_COORD; chỉ DN mình và hồ sơ được điều phối |
| GET | `/api/internship-evaluations` | Có — dùng lại | Đánh giá DN mình | API của actor; dùng lại API OJT_COORD; chỉ DN mình và hồ sơ được điều phối |
| GET | `/api/internship-evaluations/:id` | Có — dùng lại | Chi tiết | API của actor; dùng lại API OJT_COORD; chỉ DN mình và hồ sơ được điều phối |
| PUT | `/api/assignments/:id/internship-evaluation` | Có — dùng lại | DN nộp/sửa điểm/nhận xét; bảo vệ nguồn khi kết quả đã chuyển | API của actor; dùng lại API OJT_COORD; chỉ DN mình và hồ sơ được điều phối |
| POST | `/api/ojt-coordinations/:id/decision` | Đã sửa/đối chiếu | Giữ quyền sở hữu; thêm đồng bộ đơn ứng tuyển, cùng transaction chỉ tiêu. | API của actor; dùng lại API OJT_COORD; chỉ DN mình và hồ sơ được điều phối |
| GET | `/api/job-applications` | Đã tạo | cùng endpoint với QHDN, chỉ đơn đã điều phối đến DN mình. | API của actor; dùng lại API OJT_COORD; chỉ DN mình và hồ sơ được điều phối |
| GET | `/api/job-applications/:id` | Đã tạo | DTO ứng viên, không mở toàn bộ hồ sơ OJT/học vụ. | API của actor; dùng lại API OJT_COORD; chỉ DN mình và hồ sơ được điều phối |
| GET | `/api/job-applications/:id/cv` | Đã tạo | CV đúng phiên bản của đơn được gửi cho mình. | API của actor; dùng lại API OJT_COORD; chỉ DN mình và hồ sơ được điều phối |

## Hạ tầng

GET /api/health — kiểm tra trạng thái dịch vụ.

ADMIN không tự động truy cập /student/*: các route này yêu cầu STUDENT. QHDN không tạo bàn giao; DN không tự đăng tuyển; Student không chạy/xác nhận xét điều kiện. Không có đăng ký lớp học hoặc xuất báo cáo PDF. Các mô tả checklist gốc cần đọc cùng tài liệu hợp đồng triển khai để biết chi tiết đã cập nhật.
