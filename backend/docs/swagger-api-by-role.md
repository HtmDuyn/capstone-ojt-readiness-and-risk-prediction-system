# Danh sách API theo 6 nhóm Swagger

Tổng 149 API duy nhất; API dùng chung hiển thị trong từng nhóm được cấp quyền.

| Nhóm | Số API hiển thị |
|---|---:|
| Admin | 137 |
| Phòng đào tạo | 79 |
| Phòng QHDN | 38 |
| Doanh nghiệp | 10 |
| Sinh viên | 18 |
| Auth | 3 |

## Admin — 137 API

| # | Method | Đường dẫn | Chức năng |
|---:|---|---|---|
| 1 | POST | `/api/academic-years` | Tạo năm học |
| 2 | POST | `/api/academic-periods` | Tạo kỳ học và Block 3 |
| 3 | POST | `/api/cohorts` | Tạo khóa và nhóm |
| 4 | POST | `/api/academic/alerts/notifications` | Gửi cảnh báo học vụ |
| 5 | POST | `/api/accounts` | Tạo tài khoản |
| 6 | PATCH | `/api/accounts/me/profile` | Cập nhật hồ sơ cá nhân |
| 7 | POST | `/api/combo-registration-windows` | Tạo đợt chọn hoặc xác nhận combo |
| 8 | POST | `/api/majors` | Tạo chuyên ngành |
| 9 | POST | `/api/courses` | Tạo môn học |
| 10 | POST | `/api/curriculum-imports/preview` | Kiểm tra dữ liệu nhập khung chương trình |
| 11 | POST | `/api/curriculum-imports/commit` | Nhập khung chương trình |
| 12 | POST | `/api/ojt-rule-sets` | Tạo bộ quy tắc OJT |
| 13 | POST | `/api/eligibility-check-runs` | Kiểm tra điều kiện OJT hàng loạt |
| 14 | POST | `/api/imports/preview` | Kiểm tra dữ liệu nhập sinh viên hoặc doanh nghiệp |
| 15 | POST | `/api/imports/commit` | Nhập sinh viên hoặc doanh nghiệp |
| 16 | GET | `/api/imports/emails` | Trạng thái gửi email tài khoản |
| 17 | POST | `/api/imports/archive` | Lưu trữ tuyển dụng sau hai học kỳ |
| 18 | POST | `/api/ojt-registration-windows` | Tạo đợt đăng ký OJT |
| 19 | POST | `/api/ojt-registrations` | Nộp hồ sơ đăng ký OJT |
| 20 | POST | `/api/ojt-results` | Chuyển đánh giá và hồ sơ OJT cho phòng đào tạo |
| 21 | POST | `/api/companies` | Tạo doanh nghiệp |
| 22 | POST | `/api/ojt-coordinations` | Giới thiệu sinh viên cho doanh nghiệp |
| 23 | POST | `/api/assignments` | Phân công sinh viên thực tập |
| 24 | POST | `/api/students` | Tạo hồ sơ sinh viên |
| 25 | POST | `/api/course-result-imports/preview` | Kiểm tra dữ liệu nhập kết quả học tập |
| 26 | POST | `/api/course-result-imports/commit` | Nhập kết quả học tập |
| 27 | GET | `/api/health` | Kiểm tra backend và cơ sở dữ liệu |
| 28 | GET | `/api/roles` | Danh sách vai trò |
| 29 | POST | `/api/assessment-templates` | Tạo bộ tiêu chí đánh giá |
| 30 | POST | `/api/admin/prediction-jobs` | Tạo tác vụ dự đoán |
| 31 | POST | `/api/recruitment/windows` | Tạo đợt nhận nhu cầu tuyển dụng |
| 32 | POST | `/api/json/academic-years/list` | Danh sách năm học |
| 33 | PATCH | `/api/json/academic-years` | Cập nhật năm học |
| 34 | POST | `/api/json/academic-periods/list` | Danh sách kỳ học và Block 3 |
| 35 | PATCH | `/api/json/academic-periods` | Cập nhật kỳ học và Block 3 |
| 36 | POST | `/api/json/cohorts/list` | Danh sách khóa và nhóm |
| 37 | PATCH | `/api/json/cohorts` | Cập nhật khóa và nhóm |
| 38 | POST | `/api/json/academic-periods/combo-phase-schedules/list` | Xem mốc chọn và xác nhận combo |
| 39 | PUT | `/api/json/academic-periods/combo-phase-schedules` | Thiết lập mốc chọn và xác nhận combo |
| 40 | POST | `/api/json/ojt-semesters/assessment-window/search` | Xem đợt xét điều kiện chính thức |
| 41 | PUT | `/api/json/ojt-semesters/assessment-window` | Thiết lập đợt xét điều kiện chính thức |
| 42 | POST | `/api/json/ojt-semesters/assessment-window/open` | Mở xét điều kiện chính thức |
| 43 | POST | `/api/json/ojt-semesters/assessment-window/close` | Đóng xét điều kiện chính thức |
| 44 | POST | `/api/json/curricula/ojt-grade-mappings/detail` | Xem quy đổi điểm môn OJT |
| 45 | PUT | `/api/json/curricula/ojt-grade-mappings` | Thiết lập quy đổi điểm môn OJT |
| 46 | POST | `/api/json/ojt-registration-windows/semester-exceptions` | Thêm ngoại lệ kỳ đăng ký OJT |
| 47 | POST | `/api/json/ojt-registration-windows/semester-exceptions/revoke` | Thu hồi ngoại lệ kỳ đăng ký OJT |
| 48 | POST | `/api/json/combo-registration-windows/preview` | Xem ảnh hưởng của combo dự kiến |
| 49 | POST | `/api/json/academic/dashboard/search` | Tổng quan và thống kê điều kiện OJT |
| 50 | POST | `/api/json/academic/alerts/list` | Danh sách cảnh báo thiếu điều kiện OJT |
| 51 | POST | `/api/json/academic/course-demand/list` | Thống kê nhu cầu học môn còn thiếu |
| 52 | POST | `/api/json/academic/course-demand/export` | Xuất nhu cầu học theo môn, kỳ và Block |
| 53 | POST | `/api/json/accounts/list` | Danh sách tài khoản |
| 54 | PATCH | `/api/json/accounts` | Cập nhật tài khoản |
| 55 | POST | `/api/json/combo-registration-windows/list` | Danh sách đợt chọn combo |
| 56 | PATCH | `/api/json/combo-registration-windows` | Cập nhật hoặc mở/đóng đợt chọn combo |
| 57 | POST | `/api/json/combo-registration-windows/extensions` | Gia hạn chọn combo |
| 58 | POST | `/api/json/combo-registration-windows/selections/list` | Theo dõi lựa chọn combo |
| 59 | POST | `/api/json/combo-registration-windows/selections` | Gửi lựa chọn combo |
| 60 | POST | `/api/json/combo-registration-windows/reminders` | Gửi nhắc chọn combo |
| 61 | POST | `/api/json/students/combo-selections/list` | Lịch sử lựa chọn combo của sinh viên |
| 62 | POST | `/api/json/combo-registration-windows/finalize` | Chốt lựa chọn combo |
| 63 | POST | `/api/json/majors/list` | Danh sách chuyên ngành |
| 64 | POST | `/api/json/courses/list` | Danh sách môn học |
| 65 | POST | `/api/json/curricula/list` | Danh sách chương trình đào tạo đã nhập |
| 66 | PATCH | `/api/json/courses` | Cập nhật môn học |
| 67 | POST | `/api/json/curricula/detail` | Chi tiết chương trình đào tạo |
| 68 | POST | `/api/json/ojt-rule-sets/list` | Danh sách bộ quy tắc OJT |
| 69 | PATCH | `/api/json/ojt-rule-sets` | Sửa bộ quy tắc chưa ban hành |
| 70 | POST | `/api/json/ojt-rule-sets/publish` | Ban hành bộ quy tắc OJT |
| 71 | POST | `/api/json/students/eligibility-checks/list` | Lịch sử kiểm tra điều kiện OJT |
| 72 | POST | `/api/json/students/eligibility-checks` | Kiểm tra điều kiện OJT của sinh viên |
| 73 | POST | `/api/json/students/eligibility/search` | Kết quả OJT và điều kiện còn thiếu |
| 74 | POST | `/api/json/eligibility-checks/confirm` | Xác nhận kết quả xét điều kiện OJT |
| 75 | POST | `/api/json/eligibility-check-runs/detail` | Tiến độ và kết quả kiểm tra hàng loạt |
| 76 | POST | `/api/json/imports/emails/retry` | Gửi lại email bị lỗi |
| 77 | POST | `/api/json/ojt-registration-windows/list` | Danh sách đợt đăng ký OJT |
| 78 | PATCH | `/api/json/ojt-registration-windows` | Cập nhật hoặc mở/đóng đợt đăng ký OJT |
| 79 | POST | `/api/json/ojt-registrations/list` | Danh sách hồ sơ đăng ký OJT |
| 80 | POST | `/api/json/ojt-registrations/review` | Duyệt hoặc từ chối hồ sơ OJT |
| 81 | POST | `/api/json/ojt-semesters/eligible-student-handoffs/list` | Lịch sử bàn giao sinh viên cho QHDN |
| 82 | POST | `/api/json/ojt-semesters/eligible-student-handoffs` | Bàn giao sinh viên đủ điều kiện cho QHDN |
| 83 | POST | `/api/json/ojt-semesters/students/list` | Theo dõi trạng thái OJT theo kỳ |
| 84 | POST | `/api/json/ojt-results/list` | Danh sách kết quả OJT đã chuyển |
| 85 | PATCH | `/api/json/ojt-results` | Cập nhật điểm và kết quả OJT chính thức |
| 86 | POST | `/api/json/ojt-results/revision-requests` | Yêu cầu bổ sung hồ sơ kết quả OJT |
| 87 | POST | `/api/json/ojt-results/transfer` | Gửi lại hồ sơ OJT đã bổ sung |
| 88 | POST | `/api/json/ojt-results/confirm` | Xác nhận kết quả OJT |
| 89 | POST | `/api/json/ojt-semesters/results/export` | Xuất báo cáo kết quả OJT theo kỳ |
| 90 | POST | `/api/json/companies/list` | Danh sách và hồ sơ doanh nghiệp |
| 91 | PATCH | `/api/json/companies` | Cập nhật doanh nghiệp |
| 92 | DELETE | `/api/json/companies` | Xóa doanh nghiệp |
| 93 | POST | `/api/json/positions/list` | Danh sách và hồ sơ vị trí thực tập |
| 94 | POST | `/api/json/ojt-coordinations/list` | Danh sách và hồ sơ điều phối |
| 95 | POST | `/api/json/assignments/list` | Danh sách và hồ sơ phân công thực tập |
| 96 | PATCH | `/api/json/assignments` | Cập nhật thông tin và trạng thái thực tập |
| 97 | POST | `/api/json/internship-evaluations/list` | Danh sách đánh giá thực tập |
| 98 | POST | `/api/json/ojt-coordinations/decision` | Ghi nhận quyết định tiếp nhận sinh viên |
| 99 | POST | `/api/json/ojt-coordinations/reassign` | Điều phối lại sinh viên |
| 100 | PUT | `/api/json/assignments/internship-evaluation` | Ghi nhận đánh giá thực tập |
| 101 | POST | `/api/json/qhdn/registered-students/list` | Xem sinh viên đã đăng ký OJT |
| 102 | POST | `/api/json/qhdn/dashboard/search` | Tổng quan QHDN |
| 103 | POST | `/api/json/qhdn/reports/export` | Xuất báo cáo QHDN |
| 104 | POST | `/api/json/qhdn/reports/list` | Báo cáo QHDN theo loại |
| 105 | POST | `/api/json/students/list` | Tìm kiếm và lọc sinh viên |
| 106 | POST | `/api/json/students/detail` | Hồ sơ học vụ tổng hợp |
| 107 | PATCH | `/api/json/students` | Cập nhật hồ sơ và lộ trình học vụ |
| 108 | DELETE | `/api/json/students` | Xóa hồ sơ sinh viên |
| 109 | POST | `/api/json/students/course-results/list` | Điểm, lần học và trạng thái môn |
| 110 | PATCH | `/api/json/course-results` | Sửa kết quả học tập và ghi lý do |
| 111 | POST | `/api/json/academic-imports/list` | Lịch sử nhập dữ liệu học vụ |
| 112 | POST | `/api/json/auth/users/password-reset` | Đặt lại mật khẩu |
| 113 | POST | `/api/json/admin/dashboard/search` | Tổng quan hệ thống và thống kê dự đoán |
| 114 | POST | `/api/json/students/export` | Xuất danh sách sinh viên |
| 115 | DELETE | `/api/json/positions` | Xóa vị trí thực tập |
| 116 | POST | `/api/json/assessment-templates/list` | Danh sách và hồ sơ bộ tiêu chí đánh giá |
| 117 | PATCH | `/api/json/assessment-templates` | Sửa bộ tiêu chí đánh giá |
| 118 | POST | `/api/json/assessment-templates/publish` | Ban hành bộ tiêu chí đánh giá |
| 119 | POST | `/api/json/admin/prediction-jobs/detail` | Tiến độ dự đoán và lỗi theo sinh viên |
| 120 | POST | `/api/json/predictions/list` | Lịch sử dự đoán |
| 121 | POST | `/api/json/admin/models/list` | Danh sách và hồ sơ phiên bản mô hình |
| 122 | POST | `/api/json/alerts/list` | Danh sách và hồ sơ cảnh báo rủi ro |
| 123 | PATCH | `/api/json/alerts/status` | Tiếp nhận hoặc đóng cảnh báo |
| 124 | POST | `/api/json/alerts/interventions` | Tạo hoạt động hỗ trợ sinh viên |
| 125 | POST | `/api/json/students/interventions/list` | Lịch sử hỗ trợ sinh viên |
| 126 | PATCH | `/api/json/interventions` | Cập nhật hoạt động hỗ trợ |
| 127 | POST | `/api/json/admin/reports/readiness/list` | Báo cáo mức sẵn sàng và rủi ro |
| 128 | POST | `/api/json/admin/reports/export` | Xuất báo cáo dự đoán |
| 129 | POST | `/api/json/admin/audit-logs/list` | Nhật ký hoạt động hệ thống |
| 130 | POST | `/api/json/recruitment/windows/list` | Danh sách đợt tuyển dụng theo học kỳ |
| 131 | PATCH | `/api/json/recruitment/windows` | Cập nhật hoặc mở/đóng đợt tuyển dụng |
| 132 | POST | `/api/json/recruitment/posts/list` | Danh sách tin tuyển dụng |
| 133 | PATCH | `/api/json/recruitment/posts` | Sửa tin và vị trí tuyển dụng |
| 134 | POST | `/api/json/recruitment/posts/review` | Duyệt hoặc từ chối tin tuyển dụng |
| 135 | POST | `/api/json/recruitment/posts/close` | Đóng tin tuyển dụng |
| 136 | POST | `/api/json/students/cv/search` | Tải CV của sinh viên |
| 137 | POST | `/api/json/job-applications/list` | Danh sách hồ sơ ứng tuyển doanh nghiệp |

## Phòng đào tạo — 79 API

| # | Method | Đường dẫn | Chức năng |
|---:|---|---|---|
| 1 | POST | `/api/academic-years` | Tạo năm học |
| 2 | POST | `/api/academic-periods` | Tạo kỳ học và Block 3 |
| 3 | POST | `/api/cohorts` | Tạo khóa và nhóm |
| 4 | POST | `/api/academic/alerts/notifications` | Gửi cảnh báo học vụ |
| 5 | PATCH | `/api/accounts/me/profile` | Cập nhật hồ sơ cá nhân |
| 6 | POST | `/api/combo-registration-windows` | Tạo đợt chọn hoặc xác nhận combo |
| 7 | POST | `/api/majors` | Tạo chuyên ngành |
| 8 | POST | `/api/courses` | Tạo môn học |
| 9 | POST | `/api/curriculum-imports/preview` | Kiểm tra dữ liệu nhập khung chương trình |
| 10 | POST | `/api/curriculum-imports/commit` | Nhập khung chương trình |
| 11 | POST | `/api/ojt-rule-sets` | Tạo bộ quy tắc OJT |
| 12 | POST | `/api/eligibility-check-runs` | Kiểm tra điều kiện OJT hàng loạt |
| 13 | POST | `/api/imports/preview` | Kiểm tra dữ liệu nhập sinh viên hoặc doanh nghiệp |
| 14 | POST | `/api/imports/commit` | Nhập sinh viên hoặc doanh nghiệp |
| 15 | POST | `/api/ojt-registration-windows` | Tạo đợt đăng ký OJT |
| 16 | POST | `/api/ojt-registrations` | Nộp hồ sơ đăng ký OJT |
| 17 | POST | `/api/course-result-imports/preview` | Kiểm tra dữ liệu nhập kết quả học tập |
| 18 | POST | `/api/course-result-imports/commit` | Nhập kết quả học tập |
| 19 | POST | `/api/json/academic-years/list` | Danh sách năm học |
| 20 | PATCH | `/api/json/academic-years` | Cập nhật năm học |
| 21 | POST | `/api/json/academic-periods/list` | Danh sách kỳ học và Block 3 |
| 22 | PATCH | `/api/json/academic-periods` | Cập nhật kỳ học và Block 3 |
| 23 | POST | `/api/json/cohorts/list` | Danh sách khóa và nhóm |
| 24 | PATCH | `/api/json/cohorts` | Cập nhật khóa và nhóm |
| 25 | POST | `/api/json/academic-periods/combo-phase-schedules/list` | Xem mốc chọn và xác nhận combo |
| 26 | PUT | `/api/json/academic-periods/combo-phase-schedules` | Thiết lập mốc chọn và xác nhận combo |
| 27 | POST | `/api/json/ojt-semesters/assessment-window/search` | Xem đợt xét điều kiện chính thức |
| 28 | PUT | `/api/json/ojt-semesters/assessment-window` | Thiết lập đợt xét điều kiện chính thức |
| 29 | POST | `/api/json/ojt-semesters/assessment-window/open` | Mở xét điều kiện chính thức |
| 30 | POST | `/api/json/ojt-semesters/assessment-window/close` | Đóng xét điều kiện chính thức |
| 31 | POST | `/api/json/curricula/ojt-grade-mappings/detail` | Xem quy đổi điểm môn OJT |
| 32 | PUT | `/api/json/curricula/ojt-grade-mappings` | Thiết lập quy đổi điểm môn OJT |
| 33 | POST | `/api/json/ojt-registration-windows/semester-exceptions` | Thêm ngoại lệ kỳ đăng ký OJT |
| 34 | POST | `/api/json/ojt-registration-windows/semester-exceptions/revoke` | Thu hồi ngoại lệ kỳ đăng ký OJT |
| 35 | POST | `/api/json/combo-registration-windows/preview` | Xem ảnh hưởng của combo dự kiến |
| 36 | POST | `/api/json/academic/dashboard/search` | Tổng quan và thống kê điều kiện OJT |
| 37 | POST | `/api/json/academic/alerts/list` | Danh sách cảnh báo thiếu điều kiện OJT |
| 38 | POST | `/api/json/academic/course-demand/list` | Thống kê nhu cầu học môn còn thiếu |
| 39 | POST | `/api/json/academic/course-demand/export` | Xuất nhu cầu học theo môn, kỳ và Block |
| 40 | POST | `/api/json/combo-registration-windows/list` | Danh sách đợt chọn combo |
| 41 | PATCH | `/api/json/combo-registration-windows` | Cập nhật hoặc mở/đóng đợt chọn combo |
| 42 | POST | `/api/json/combo-registration-windows/extensions` | Gia hạn chọn combo |
| 43 | POST | `/api/json/combo-registration-windows/selections/list` | Theo dõi lựa chọn combo |
| 44 | POST | `/api/json/combo-registration-windows/selections` | Gửi lựa chọn combo |
| 45 | POST | `/api/json/combo-registration-windows/reminders` | Gửi nhắc chọn combo |
| 46 | POST | `/api/json/students/combo-selections/list` | Lịch sử lựa chọn combo của sinh viên |
| 47 | POST | `/api/json/combo-registration-windows/finalize` | Chốt lựa chọn combo |
| 48 | POST | `/api/json/majors/list` | Danh sách chuyên ngành |
| 49 | POST | `/api/json/courses/list` | Danh sách môn học |
| 50 | POST | `/api/json/curricula/list` | Danh sách chương trình đào tạo đã nhập |
| 51 | PATCH | `/api/json/courses` | Cập nhật môn học |
| 52 | POST | `/api/json/curricula/detail` | Chi tiết chương trình đào tạo |
| 53 | POST | `/api/json/ojt-rule-sets/list` | Danh sách bộ quy tắc OJT |
| 54 | PATCH | `/api/json/ojt-rule-sets` | Sửa bộ quy tắc chưa ban hành |
| 55 | POST | `/api/json/ojt-rule-sets/publish` | Ban hành bộ quy tắc OJT |
| 56 | POST | `/api/json/students/eligibility-checks/list` | Lịch sử kiểm tra điều kiện OJT |
| 57 | POST | `/api/json/students/eligibility-checks` | Kiểm tra điều kiện OJT của sinh viên |
| 58 | POST | `/api/json/students/eligibility/search` | Kết quả OJT và điều kiện còn thiếu |
| 59 | POST | `/api/json/eligibility-checks/confirm` | Xác nhận kết quả xét điều kiện OJT |
| 60 | POST | `/api/json/eligibility-check-runs/detail` | Tiến độ và kết quả kiểm tra hàng loạt |
| 61 | POST | `/api/json/ojt-registration-windows/list` | Danh sách đợt đăng ký OJT |
| 62 | PATCH | `/api/json/ojt-registration-windows` | Cập nhật hoặc mở/đóng đợt đăng ký OJT |
| 63 | POST | `/api/json/ojt-registrations/list` | Danh sách hồ sơ đăng ký OJT |
| 64 | POST | `/api/json/ojt-registrations/review` | Duyệt hoặc từ chối hồ sơ OJT |
| 65 | POST | `/api/json/ojt-semesters/eligible-student-handoffs/list` | Lịch sử bàn giao sinh viên cho QHDN |
| 66 | POST | `/api/json/ojt-semesters/eligible-student-handoffs` | Bàn giao sinh viên đủ điều kiện cho QHDN |
| 67 | POST | `/api/json/ojt-semesters/students/list` | Theo dõi trạng thái OJT theo kỳ |
| 68 | POST | `/api/json/ojt-results/list` | Danh sách kết quả OJT đã chuyển |
| 69 | PATCH | `/api/json/ojt-results` | Cập nhật điểm và kết quả OJT chính thức |
| 70 | POST | `/api/json/ojt-results/revision-requests` | Yêu cầu bổ sung hồ sơ kết quả OJT |
| 71 | POST | `/api/json/ojt-results/confirm` | Xác nhận kết quả OJT |
| 72 | POST | `/api/json/ojt-semesters/results/export` | Xuất báo cáo kết quả OJT theo kỳ |
| 73 | POST | `/api/json/students/list` | Tìm kiếm và lọc sinh viên |
| 74 | POST | `/api/json/students/detail` | Hồ sơ học vụ tổng hợp |
| 75 | PATCH | `/api/json/students` | Cập nhật hồ sơ và lộ trình học vụ |
| 76 | POST | `/api/json/students/course-results/list` | Điểm, lần học và trạng thái môn |
| 77 | PATCH | `/api/json/course-results` | Sửa kết quả học tập và ghi lý do |
| 78 | POST | `/api/json/academic-imports/list` | Lịch sử nhập dữ liệu học vụ |
| 79 | POST | `/api/json/students/cv/search` | Tải CV của sinh viên |

## Phòng QHDN — 38 API

| # | Method | Đường dẫn | Chức năng |
|---:|---|---|---|
| 1 | PATCH | `/api/accounts/me/profile` | Cập nhật hồ sơ cá nhân |
| 2 | POST | `/api/imports/preview` | Kiểm tra dữ liệu nhập sinh viên hoặc doanh nghiệp |
| 3 | POST | `/api/imports/commit` | Nhập sinh viên hoặc doanh nghiệp |
| 4 | POST | `/api/imports/archive` | Lưu trữ tuyển dụng sau hai học kỳ |
| 5 | POST | `/api/ojt-results` | Chuyển đánh giá và hồ sơ OJT cho phòng đào tạo |
| 6 | POST | `/api/companies` | Tạo doanh nghiệp |
| 7 | POST | `/api/ojt-coordinations` | Giới thiệu sinh viên cho doanh nghiệp |
| 8 | POST | `/api/assignments` | Phân công sinh viên thực tập |
| 9 | POST | `/api/recruitment/windows` | Tạo đợt nhận nhu cầu tuyển dụng |
| 10 | POST | `/api/json/academic-periods/list` | Danh sách kỳ học và Block 3 |
| 11 | POST | `/api/json/ojt-registrations/list` | Danh sách hồ sơ đăng ký OJT |
| 12 | POST | `/api/json/ojt-semesters/eligible-student-handoffs/list` | Lịch sử bàn giao sinh viên cho QHDN |
| 13 | POST | `/api/json/ojt-semesters/students/list` | Theo dõi trạng thái OJT theo kỳ |
| 14 | POST | `/api/json/ojt-results/list` | Danh sách kết quả OJT đã chuyển |
| 15 | POST | `/api/json/ojt-results/transfer` | Gửi lại hồ sơ OJT đã bổ sung |
| 16 | POST | `/api/json/ojt-semesters/results/export` | Xuất báo cáo kết quả OJT theo kỳ |
| 17 | POST | `/api/json/companies/list` | Danh sách và hồ sơ doanh nghiệp |
| 18 | PATCH | `/api/json/companies` | Cập nhật doanh nghiệp |
| 19 | POST | `/api/json/positions/list` | Danh sách và hồ sơ vị trí thực tập |
| 20 | POST | `/api/json/ojt-coordinations/list` | Danh sách và hồ sơ điều phối |
| 21 | POST | `/api/json/assignments/list` | Danh sách và hồ sơ phân công thực tập |
| 22 | PATCH | `/api/json/assignments` | Cập nhật thông tin và trạng thái thực tập |
| 23 | POST | `/api/json/internship-evaluations/list` | Danh sách đánh giá thực tập |
| 24 | POST | `/api/json/ojt-coordinations/decision` | Ghi nhận quyết định tiếp nhận sinh viên |
| 25 | POST | `/api/json/ojt-coordinations/reassign` | Điều phối lại sinh viên |
| 26 | PUT | `/api/json/assignments/internship-evaluation` | Ghi nhận đánh giá thực tập |
| 27 | POST | `/api/json/qhdn/registered-students/list` | Xem sinh viên đã đăng ký OJT |
| 28 | POST | `/api/json/qhdn/dashboard/search` | Tổng quan QHDN |
| 29 | POST | `/api/json/qhdn/reports/export` | Xuất báo cáo QHDN |
| 30 | POST | `/api/json/qhdn/reports/list` | Báo cáo QHDN theo loại |
| 31 | POST | `/api/json/recruitment/windows/list` | Danh sách đợt tuyển dụng theo học kỳ |
| 32 | PATCH | `/api/json/recruitment/windows` | Cập nhật hoặc mở/đóng đợt tuyển dụng |
| 33 | POST | `/api/json/recruitment/posts/list` | Danh sách tin tuyển dụng |
| 34 | PATCH | `/api/json/recruitment/posts` | Sửa tin và vị trí tuyển dụng |
| 35 | POST | `/api/json/recruitment/posts/review` | Duyệt hoặc từ chối tin tuyển dụng |
| 36 | POST | `/api/json/recruitment/posts/close` | Đóng tin tuyển dụng |
| 37 | POST | `/api/json/students/cv/search` | Tải CV của sinh viên |
| 38 | POST | `/api/json/job-applications/list` | Danh sách hồ sơ ứng tuyển doanh nghiệp |

## Doanh nghiệp — 10 API

| # | Method | Đường dẫn | Chức năng |
|---:|---|---|---|
| 1 | PATCH | `/api/accounts/me/profile` | Cập nhật hồ sơ cá nhân |
| 2 | GET | `/api/enterprise/profile` | Hồ sơ doanh nghiệp |
| 3 | POST | `/api/recruitment/posts` | Gửi nhu cầu tuyển dụng |
| 4 | POST | `/api/json/enterprise/candidates/list` | Danh sách và hồ sơ ứng viên |
| 5 | PATCH | `/api/json/enterprise/candidates/decision` | Tiếp nhận hoặc từ chối ứng viên |
| 6 | POST | `/api/json/enterprise/internships/list` | Danh sách sinh viên thực tập |
| 7 | PUT | `/api/json/enterprise/internships/evaluation` | Gửi hoặc cập nhật đánh giá thực tập |
| 8 | POST | `/api/json/recruitment/windows/list` | Danh sách đợt tuyển dụng theo học kỳ |
| 9 | POST | `/api/json/recruitment/posts/list` | Danh sách tin tuyển dụng |
| 10 | PATCH | `/api/json/recruitment/posts` | Sửa tin và vị trí tuyển dụng |

## Sinh viên — 18 API

| # | Method | Đường dẫn | Chức năng |
|---:|---|---|---|
| 1 | PATCH | `/api/accounts/me/profile` | Cập nhật hồ sơ cá nhân |
| 2 | POST | `/api/ojt-registrations` | Nộp hồ sơ đăng ký OJT |
| 3 | POST | `/api/students/me/cv` | Upload hoặc thay CV cá nhân |
| 4 | POST | `/api/job-applications` | Ứng tuyển vị trí doanh nghiệp |
| 5 | POST | `/api/json/combo-registration-windows/preview` | Xem ảnh hưởng của combo dự kiến |
| 6 | POST | `/api/json/combo-registration-windows/list` | Danh sách đợt chọn combo |
| 7 | POST | `/api/json/combo-registration-windows/selections` | Gửi lựa chọn combo |
| 8 | POST | `/api/json/students/combo-selections/list` | Lịch sử lựa chọn combo của sinh viên |
| 9 | POST | `/api/json/students/eligibility-checks/list` | Lịch sử kiểm tra điều kiện OJT |
| 10 | POST | `/api/json/students/eligibility/search` | Kết quả OJT và điều kiện còn thiếu |
| 11 | POST | `/api/json/ojt-registration-windows/list` | Danh sách đợt đăng ký OJT |
| 12 | POST | `/api/json/ojt-registrations/list` | Danh sách hồ sơ đăng ký OJT |
| 13 | POST | `/api/json/ojt-semesters/students/list` | Theo dõi trạng thái OJT theo kỳ |
| 14 | POST | `/api/json/students/detail` | Hồ sơ học vụ tổng hợp |
| 15 | POST | `/api/json/students/course-results/list` | Điểm, lần học và trạng thái môn |
| 16 | POST | `/api/json/students/cv/search` | Tải CV của sinh viên |
| 17 | POST | `/api/json/job-applications/list` | Danh sách hồ sơ ứng tuyển doanh nghiệp |
| 18 | POST | `/api/json/students/me/opportunities/list` | Vị trí tuyển dụng và quyền ứng tuyển |

## Auth — 3 API

| # | Method | Đường dẫn | Chức năng |
|---:|---|---|---|
| 1 | POST | `/api/auth/login` | Đăng nhập bằng email và mật khẩu |
| 2 | GET | `/api/auth/me` | Xem tài khoản đang đăng nhập |
| 3 | POST | `/api/auth/change-password` | Đổi mật khẩu |
