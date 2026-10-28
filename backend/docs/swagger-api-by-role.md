# Danh sách API theo nhóm Swagger

Tạo từ OpenAPI hiện hành bằng `npm run docs:api` sau `npm run build`.

Tổng 133 API duy nhất. Nhóm hiển thị theo chức năng chính: API dùng chung với nhóm nghiệp vụ không lặp lại trong Admin. Quyền Admin vẫn giữ nguyên trong middleware/service và x-roles. Quyền nhập doanh nghiệp chỉ dành cho OJT_COORD; quyền nhập sinh viên dành cho ADMIN/ACADEMIC.

| Nhóm | Số API hiển thị |
|---|---:|
| Admin | 18 |
| Phòng đào tạo | 67 |
| Phòng QHDN | 33 |
| Doanh nghiệp | 10 |
| Sinh viên | 19 |
| Auth | 4 |

## Admin

Chức năng quản trị và theo dõi hệ thống. API nghiệp vụ dùng chung hiển thị ở nhóm phụ trách; quyền Admin vẫn giữ nguyên.

| # | Method | Đường dẫn Swagger | Chức năng | Route gốc |
|---:|---|---|---|---|
| 1 | GET | `/api/accounts` | Danh sách tài khoản | `GET /api/accounts` |
| 2 | POST | `/api/accounts` | Tạo tài khoản | `POST /api/accounts` |
| 3 | PATCH | `/api/accounts/update` | Update account | `PATCH /api/accounts/update` |
| 4 | POST | `/api/imports/emails/resend` | Resend email | `POST /api/imports/emails/resend` |
| 5 | POST | `/api/ojt-registrations/{id}/review` | Duyệt hoặc từ chối hồ sơ OJT | `POST /api/ojt-registrations/{id}/review` |
| 6 | DELETE | `/api/companies` | Xóa doanh nghiệp | `DELETE /api/companies` |
| 7 | DELETE | `/api/positions` | Xóa vị trí thực tập | `DELETE /api/positions` |
| 8 | POST | `/api/ojt-coordinations` | Tạo điều phối tương thích dữ liệu cũ | `POST /api/ojt-coordinations` |
| 9 | POST | `/api/assignments` | Phân công dữ liệu cũ | `POST /api/assignments` |
| 10 | PATCH | `/api/assignments/{id}` | Cập nhật assignment dữ liệu cũ | `PATCH /api/assignments/{id}` |
| 11 | POST | `/api/ojt-coordinations/{id}/decision` | Ghi nhận quyết định cho dữ liệu cũ | `POST /api/ojt-coordinations/{id}/decision` |
| 12 | POST | `/api/ojt-coordinations/{id}/reassign` | Điều phối lại dữ liệu cũ | `POST /api/ojt-coordinations/{id}/reassign` |
| 13 | DELETE | `/api/students` | Xóa hồ sơ sinh viên | `DELETE /api/students` |
| 14 | POST | `/api/auth/users/password-reset` | Đặt lại mật khẩu | `POST /api/auth/users/password-reset` |
| 15 | POST | `/api/admin/dashboard` | Tổng quan hệ thống | `POST /api/admin/dashboard` |
| 16 | POST | `/api/students/export` | Xuất danh sách sinh viên | `POST /api/students/export` |
| 17 | POST | `/api/admin/audit-logs/list` | Danh sách nhật ký hoạt động chi tiết | `POST /api/admin/audit-logs/list` |
| 18 | POST | `/api/student-imports/{id}/email-retries` | Gửi lại email tài khoản sinh viên | `POST /api/student-imports/{id}/email-retries` |

## Phòng đào tạo

Quản lý học vụ và xét điều kiện OJT.

| # | Method | Đường dẫn Swagger | Chức năng | Route gốc |
|---:|---|---|---|---|
| 1 | GET | `/api/academic-years` | Danh sách năm học | `GET /api/academic-years` |
| 2 | POST | `/api/academic-years` | Tạo năm học | `POST /api/academic-years` |
| 3 | PATCH | `/api/academic-years/{id}` | Cập nhật năm học | `PATCH /api/academic-years/{id}` |
| 4 | GET | `/api/academic-periods` | Danh sách kỳ học và Block 3 | `GET /api/academic-periods` |
| 5 | POST | `/api/academic-periods` | Tạo kỳ học và Block 3 | `POST /api/academic-periods` |
| 6 | GET | `/api/cohorts` | Danh sách khóa và nhóm | `GET /api/cohorts` |
| 7 | POST | `/api/cohorts` | Tạo khóa và nhóm | `POST /api/cohorts` |
| 8 | PATCH | `/api/cohorts/{id}` | Cập nhật khóa và nhóm | `PATCH /api/cohorts/{id}` |
| 9 | GET | `/api/academic-years/{id}/calendar` | Read a year calendar and its current revision | `GET /api/academic-years/{id}/calendar` |
| 10 | PUT | `/api/academic-years/{id}/calendar` | Save Spring, Summer and Fall dates together | `PUT /api/academic-years/{id}/calendar` |
| 11 | POST | `/api/ojt-registration-windows/{id}/semester-exceptions` | Thêm ngoại lệ kỳ đăng ký OJT | `POST /api/ojt-registration-windows/{id}/semester-exceptions` |
| 12 | POST | `/api/ojt-registration-windows/{id}/semester-exceptions/{exceptionId}/revoke` | Thu hồi ngoại lệ kỳ đăng ký OJT | `POST /api/ojt-registration-windows/{id}/semester-exceptions/{exceptionId}/revoke` |
| 13 | POST | `/api/combo-registration-windows/{id}/preview` | Xem ảnh hưởng của combo dự kiến | `POST /api/combo-registration-windows/{id}/preview` |
| 14 | PATCH | `/api/accounts/me/profile` | Cập nhật hồ sơ cá nhân | `PATCH /api/accounts/me/profile` |
| 15 | GET | `/api/combo-registration-windows` | Danh sách đợt chọn combo | `GET /api/combo-registration-windows` |
| 16 | POST | `/api/combo-registration-windows` | Tạo đợt chọn hoặc xác nhận combo | `POST /api/combo-registration-windows` |
| 17 | GET | `/api/combo-registration-windows/{id}` | Chi tiết đợt và các lựa chọn combo | `GET /api/combo-registration-windows/{id}` |
| 18 | PATCH | `/api/combo-registration-windows/{id}` | Cập nhật hoặc mở/đóng đợt chọn combo | `PATCH /api/combo-registration-windows/{id}` |
| 19 | POST | `/api/combo-registration-windows/{id}/extensions` | Gia hạn chọn combo | `POST /api/combo-registration-windows/{id}/extensions` |
| 20 | POST | `/api/combo-registration-windows/{id}/selections` | Gửi lựa chọn combo | `POST /api/combo-registration-windows/{id}/selections` |
| 21 | POST | `/api/combo-registration-windows/{id}/reminders` | Gửi nhắc chọn combo | `POST /api/combo-registration-windows/{id}/reminders` |
| 22 | POST | `/api/combo-registration-windows/{id}/finalize` | Chốt lựa chọn combo | `POST /api/combo-registration-windows/{id}/finalize` |
| 23 | GET | `/api/majors` | Danh sách chuyên ngành | `GET /api/majors` |
| 24 | POST | `/api/majors` | Tạo chuyên ngành | `POST /api/majors` |
| 25 | GET | `/api/courses` | Danh sách môn học | `GET /api/courses` |
| 26 | POST | `/api/courses` | Tạo môn học | `POST /api/courses` |
| 27 | GET | `/api/curricula` | Danh sách chương trình đào tạo đã nhập | `GET /api/curricula` |
| 28 | PATCH | `/api/courses/{id}` | Cập nhật môn học | `PATCH /api/courses/{id}` |
| 29 | GET | `/api/curricula/{id}` | Chi tiết chương trình đào tạo | `GET /api/curricula/{id}` |
| 30 | GET | `/api/ojt-rule-sets` | Danh sách bộ quy tắc OJT | `GET /api/ojt-rule-sets` |
| 31 | POST | `/api/ojt-rule-sets` | Tạo bộ quy tắc OJT | `POST /api/ojt-rule-sets` |
| 32 | PATCH | `/api/ojt-rule-sets` | Cập nhật hoặc ban hành bộ quy tắc | `PATCH /api/ojt-rule-sets` |
| 33 | POST | `/api/eligibility-check-runs` | Xét điều kiện OJT hàng loạt và cập nhật trạng thái | `POST /api/eligibility-check-runs` |
| 34 | GET | `/api/ojt-semesters/{id}/students` | Theo dõi trạng thái OJT theo kỳ | `GET /api/ojt-semesters/{id}/students` |
| 35 | GET | `/api/students` | Tìm kiếm và lọc sinh viên | `GET /api/students` |
| 36 | GET | `/api/students/{id}` | Hồ sơ học vụ tổng hợp | `GET /api/students/{id}` |
| 37 | PATCH | `/api/students/{id}` | Cập nhật hồ sơ và lộ trình học vụ | `PATCH /api/students/{id}` |
| 38 | PATCH | `/api/course-results/{id}` | Sửa kết quả học tập và ghi lý do | `PATCH /api/course-results/{id}` |
| 39 | GET | `/api/academic-imports` | Lịch sử nhập dữ liệu học vụ | `GET /api/academic-imports` |
| 40 | GET | `/api/ojt-results` | Danh sách kết quả OJT đã được QHDN chuyển | `GET /api/ojt-results` |
| 41 | GET | `/api/ojt-semesters/{id}/results/export` | Xuất báo cáo kết quả OJT theo kỳ | `GET /api/ojt-semesters/{id}/results/export` |
| 42 | GET | `/api/ojt-eligibility-results` | Lấy kết quả FE đã lưu mới nhất theo sinh viên | `GET /api/ojt-eligibility-results` |
| 43 | POST | `/api/ojt-eligibility-results` | Lưu kết quả xét điều kiện OJT do frontend tính | `POST /api/ojt-eligibility-results` |
| 44 | GET | `/api/students/{id}/cv` | Tải CV của sinh viên | `GET /api/students/{id}/cv` |
| 45 | POST | `/api/ojt-results/{id}/confirm` | Phòng đào tạo xác nhận và ghi nhận điểm OJT | `POST /api/ojt-results/{id}/confirm` |
| 46 | GET | `/api/assessment-windows` | Danh sách đợt xét điều kiện | `GET /api/assessment-windows` |
| 47 | POST | `/api/assessment-windows` | Tạo đợt xét điều kiện | `POST /api/assessment-windows` |
| 48 | PATCH | `/api/assessment-windows` | Cập nhật đợt xét hoặc trạng thái mở/đóng | `PATCH /api/assessment-windows` |
| 49 | GET | `/api/ojt-semesters` | Danh sách kỳ OJT | `GET /api/ojt-semesters` |
| 50 | GET | `/api/ojt-semesters/{id}` | Chi tiết kỳ OJT, sinh viên, bàn giao và kết quả | `GET /api/ojt-semesters/{id}` |
| 51 | PUT | `/api/ojt-grade-mappings` | Thiết lập quy đổi điểm OJT | `PUT /api/ojt-grade-mappings` |
| 52 | GET | `/api/eligible-student-handoffs` | Lịch sử bàn giao sinh viên | `GET /api/eligible-student-handoffs` |
| 53 | POST | `/api/eligible-student-handoffs` | Bàn giao sinh viên đủ điều kiện | `POST /api/eligible-student-handoffs` |
| 54 | GET | `/api/academic-notifications` | Lịch sử thông báo học vụ | `GET /api/academic-notifications` |
| 55 | POST | `/api/academic-notifications` | Tạo thông báo học vụ theo loại | `POST /api/academic-notifications` |
| 56 | GET | `/api/academic-notifications/{id}` | Chi tiết thông báo và trạng thái từng sinh viên | `GET /api/academic-notifications/{id}` |
| 57 | GET | `/api/student-imports` | Danh sách yêu cầu nhập dữ liệu | `GET /api/student-imports` |
| 58 | POST | `/api/student-imports` | Kiểm tra và lưu yêu cầu nhập dữ liệu | `POST /api/student-imports` |
| 59 | PATCH | `/api/student-imports` | Xác nhận nhập dữ liệu đã kiểm tra | `PATCH /api/student-imports` |
| 60 | GET | `/api/student-imports/{id}` | Chi tiết yêu cầu, kết quả và lỗi nhập dữ liệu | `GET /api/student-imports/{id}` |
| 61 | GET | `/api/curriculum-imports` | Danh sách yêu cầu nhập dữ liệu | `GET /api/curriculum-imports` |
| 62 | POST | `/api/curriculum-imports` | Kiểm tra và lưu yêu cầu nhập dữ liệu | `POST /api/curriculum-imports` |
| 63 | PATCH | `/api/curriculum-imports` | Xác nhận nhập dữ liệu đã kiểm tra | `PATCH /api/curriculum-imports` |
| 64 | GET | `/api/curriculum-imports/{id}` | Chi tiết yêu cầu, kết quả và lỗi nhập dữ liệu | `GET /api/curriculum-imports/{id}` |
| 65 | GET | `/api/academic-alerts` | Danh sách cảnh báo thiếu điều kiện OJT | `GET /api/academic-alerts` |
| 66 | GET | `/api/course-demands` | Thống kê nhu cầu học môn còn thiếu | `GET /api/course-demands` |
| 67 | GET | `/api/course-demands/export` | Xuất nhu cầu học theo môn, kỳ và Block | `GET /api/course-demands/export` |

## Phòng QHDN

Quản lý doanh nghiệp và đợt đăng ký; theo dõi hồ sơ sinh viên gửi trực tiếp và kết quả OJT.

| # | Method | Đường dẫn Swagger | Chức năng | Route gốc |
|---:|---|---|---|---|
| 1 | GET | `/api/academic-periods` | Danh sách kỳ học và Block 3 | `GET /api/academic-periods` |
| 2 | PATCH | `/api/accounts/me/profile` | Cập nhật hồ sơ cá nhân | `PATCH /api/accounts/me/profile` |
| 3 | POST | `/api/imports/preview` | Kiểm tra import doanh nghiệp hoặc sinh viên | `POST /api/imports/preview` |
| 4 | POST | `/api/imports/commit` | Import doanh nghiệp (QHDN) hoặc sinh viên (Phòng đào tạo/Admin) | `POST /api/imports/commit` |
| 5 | POST | `/api/imports/archive` | Lưu trữ tuyển dụng sau hai học kỳ | `POST /api/imports/archive` |
| 6 | GET | `/api/ojt-registration-windows` | Danh sách đợt đăng ký OJT | `GET /api/ojt-registration-windows` |
| 7 | POST | `/api/ojt-registration-windows` | Tạo đợt đăng ký OJT | `POST /api/ojt-registration-windows` |
| 8 | PATCH | `/api/ojt-registration-windows/{id}` | Cập nhật hoặc mở/đóng đợt đăng ký OJT | `PATCH /api/ojt-registration-windows/{id}` |
| 9 | GET | `/api/ojt-registrations` | Danh sách hồ sơ đăng ký OJT | `GET /api/ojt-registrations` |
| 10 | GET | `/api/ojt-semesters/{id}/eligible-student-handoffs` | Lịch sử bàn giao sinh viên cho QHDN | `GET /api/ojt-semesters/{id}/eligible-student-handoffs` |
| 11 | GET | `/api/ojt-semesters/{id}/students` | Theo dõi trạng thái OJT theo kỳ | `GET /api/ojt-semesters/{id}/students` |
| 12 | GET | `/api/qhdn/eligible-students` | Nhận danh sách sinh viên đủ điều kiện đã được Đào tạo bàn giao | `GET /api/qhdn/eligible-students` |
| 13 | GET | `/api/companies` | Danh sách và hồ sơ doanh nghiệp | `GET /api/companies` |
| 14 | PATCH | `/api/companies/{id}` | Cập nhật doanh nghiệp | `PATCH /api/companies/{id}` |
| 15 | GET | `/api/positions` | Danh sách và hồ sơ vị trí thực tập | `GET /api/positions` |
| 16 | GET | `/api/ojt-coordinations` | Danh sách hồ sơ doanh nghiệp đang xử lý | `GET /api/ojt-coordinations` |
| 17 | GET | `/api/assignments` | Danh sách và hồ sơ phân công thực tập | `GET /api/assignments` |
| 18 | GET | `/api/internship-evaluations` | Danh sách đánh giá thực tập | `GET /api/internship-evaluations` |
| 19 | GET | `/api/qhdn/registered-students` | Xem sinh viên đã đăng ký OJT | `GET /api/qhdn/registered-students` |
| 20 | GET | `/api/qhdn/dashboard` | Tổng quan QHDN | `GET /api/qhdn/dashboard` |
| 21 | GET | `/api/qhdn/reports/export` | Xuất báo cáo QHDN | `GET /api/qhdn/reports/export` |
| 22 | GET | `/api/qhdn/reports` | Báo cáo QHDN theo loại | `GET /api/qhdn/reports` |
| 23 | POST | `/api/recruitment/windows` | Tạo đợt nhận nhu cầu tuyển dụng | `POST /api/recruitment/windows` |
| 24 | PATCH | `/api/recruitment/windows/{id}` | Cập nhật hoặc mở/đóng đợt tuyển dụng | `PATCH /api/recruitment/windows/{id}` |
| 25 | GET | `/api/recruitment/posts` | Danh sách tin tuyển dụng | `GET /api/recruitment/posts` |
| 26 | POST | `/api/recruitment/posts/{id}/review` | Duyệt hoặc từ chối tin tuyển dụng | `POST /api/recruitment/posts/{id}/review` |
| 27 | POST | `/api/recruitment/posts/{id}/close` | Đóng tin tuyển dụng | `POST /api/recruitment/posts/{id}/close` |
| 28 | GET | `/api/ojt-results` | Danh sách kết quả OJT đã được QHDN chuyển | `GET /api/ojt-results` |
| 29 | POST | `/api/ojt-results` | QHDN chốt và chuyển kết quả về Phòng đào tạo | `POST /api/ojt-results` |
| 30 | GET | `/api/ojt-semesters/{id}/results/export` | Xuất báo cáo kết quả OJT theo kỳ | `GET /api/ojt-semesters/{id}/results/export` |
| 31 | GET | `/api/students/{id}/cv` | Tải CV của sinh viên | `GET /api/students/{id}/cv` |
| 32 | GET | `/api/job-applications` | Danh sách hồ sơ ứng tuyển doanh nghiệp | `GET /api/job-applications` |
| 33 | GET | `/api/internship-tasks` | Danh sách task trong phạm vi tài khoản | `GET /api/internship-tasks` |

## Doanh nghiệp

Quản lý hồ sơ, tuyển dụng và thực tập sinh.

| # | Method | Đường dẫn Swagger | Chức năng | Route gốc |
|---:|---|---|---|---|
| 1 | GET | `/api/enterprise/profile` | Hồ sơ doanh nghiệp | `GET /api/enterprise/profile` |
| 2 | PATCH | `/api/enterprise/profile` | Cập nhật hồ sơ doanh nghiệp đã được import | `PATCH /api/enterprise/profile` |
| 3 | GET | `/api/enterprise/candidate-periods` | Danh sách năm học và kỳ OJT của ứng viên | `GET /api/enterprise/candidate-periods` |
| 4 | GET | `/api/enterprise/candidates` | Danh sách và hồ sơ ứng viên | `GET /api/enterprise/candidates` |
| 5 | PATCH | `/api/enterprise/candidates/{id}/decision` | Tiếp nhận hoặc từ chối ứng viên | `PATCH /api/enterprise/candidates/{id}/decision` |
| 6 | GET | `/api/enterprise/internships` | Danh sách sinh viên thực tập | `GET /api/enterprise/internships` |
| 7 | PUT | `/api/enterprise/internships/{id}/evaluation` | Gửi hoặc cập nhật đánh giá thực tập | `PUT /api/enterprise/internships/{id}/evaluation` |
| 8 | GET | `/api/recruitment/posts` | Danh sách tin tuyển dụng | `GET /api/recruitment/posts` |
| 9 | POST | `/api/enterprise/tasks/bulk` | Giao một hoặc nhiều task cho nhiều thực tập sinh | `POST /api/enterprise/tasks/bulk` |
| 10 | GET | `/api/internship-tasks` | Danh sách task trong phạm vi tài khoản | `GET /api/internship-tasks` |

## Sinh viên

Xem học tập, chọn combo và đăng ký OJT.

| # | Method | Đường dẫn Swagger | Chức năng | Route gốc |
|---:|---|---|---|---|
| 1 | POST | `/api/combo-registration-windows/{id}/preview` | Xem ảnh hưởng của combo dự kiến | `POST /api/combo-registration-windows/{id}/preview` |
| 2 | PATCH | `/api/accounts/me/profile` | Cập nhật hồ sơ cá nhân | `PATCH /api/accounts/me/profile` |
| 3 | GET | `/api/combo-registration-windows` | Danh sách đợt chọn combo | `GET /api/combo-registration-windows` |
| 4 | POST | `/api/combo-registration-windows/{id}/selections` | Gửi lựa chọn combo | `POST /api/combo-registration-windows/{id}/selections` |
| 5 | GET | `/api/ojt-registration-windows` | Danh sách đợt đăng ký OJT | `GET /api/ojt-registration-windows` |
| 6 | GET | `/api/ojt-registrations` | Danh sách hồ sơ đăng ký OJT | `GET /api/ojt-registrations` |
| 7 | POST | `/api/ojt-registrations` | Nộp hồ sơ đăng ký OJT | `POST /api/ojt-registrations` |
| 8 | GET | `/api/ojt-semesters/{id}/students` | Theo dõi trạng thái OJT theo kỳ | `GET /api/ojt-semesters/{id}/students` |
| 9 | GET | `/api/students/{id}` | Hồ sơ học vụ tổng hợp | `GET /api/students/{id}` |
| 10 | GET | `/api/students/me/notifications` | thông báo/lọc unread/phân trang, trả unreadCount cùng response | `GET /api/students/me/notifications` |
| 11 | PATCH | `/api/students/me/notifications/{id}` | người nhận đánh dấu đọc, idempotent | `PATCH /api/students/me/notifications/{id}` |
| 12 | GET | `/api/students/me/dashboard` | tổng hợp; không tạo thuật toán học vụ mới | `GET /api/students/me/dashboard` |
| 13 | GET | `/api/students/me/roadmap-recommendations` | tư vấn AI lộ trình; khác đề xuất môn bằng quy tắc | `GET /api/students/me/roadmap-recommendations` |
| 14 | POST | `/api/students/me/cv` | Upload hoặc thay CV cá nhân | `POST /api/students/me/cv` |
| 15 | GET | `/api/students/{id}/cv` | Tải CV của sinh viên | `GET /api/students/{id}/cv` |
| 16 | GET | `/api/job-applications` | Danh sách hồ sơ ứng tuyển doanh nghiệp | `GET /api/job-applications` |
| 17 | POST | `/api/job-applications` | Sinh viên gửi hồ sơ trực tiếp đến doanh nghiệp | `POST /api/job-applications` |
| 18 | GET | `/api/students/me/opportunities` | Danh sách vị trí doanh nghiệp để sinh viên ứng tuyển trực tiếp | `GET /api/students/me/opportunities` |
| 19 | GET | `/api/students/me/internships` | Hồ sơ thực tập: phân công, nhiệm vụ và kết quả đã công bố | `GET /api/students/me/internships` |

## Auth

Đăng nhập, thông tin phiên và đổi mật khẩu.

| # | Method | Đường dẫn Swagger | Chức năng | Route gốc |
|---:|---|---|---|---|
| 1 | POST | `/api/auth/login` | Đăng nhập bằng email và mật khẩu | `POST /api/auth/login` |
| 2 | GET | `/api/auth/me` | Xem tài khoản đang đăng nhập | `GET /api/auth/me` |
| 3 | POST | `/api/auth/logout` | Logout current user | `POST /api/auth/logout` |
| 4 | POST | `/api/auth/change-password` | Đổi mật khẩu | `POST /api/auth/change-password` |
