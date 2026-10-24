# Danh sách API theo nhóm Swagger

Tạo từ OpenAPI hiện hành bằng `npm run docs:api` sau `npm run build`.

Tổng 154 API duy nhất. Nhóm hiển thị theo chức năng chính: API dùng chung với nhóm nghiệp vụ không lặp lại trong Admin. Quyền Admin vẫn giữ nguyên trong middleware/service và x-roles. Quyền nhập doanh nghiệp chỉ dành cho OJT_COORD; quyền nhập sinh viên dành cho ADMIN/ACADEMIC.

| Nhóm | Số API hiển thị |
|---|---:|
| Admin | 11 |
| Phòng đào tạo | 72 |
| Phòng QHDN | 39 |
| Doanh nghiệp | 9 |
| Sinh viên | 31 |
| Auth | 3 |

## Admin

Chức năng quản trị và theo dõi hệ thống. API nghiệp vụ dùng chung hiển thị ở nhóm phụ trách; quyền Admin vẫn giữ nguyên.

| # | Method | Đường dẫn Swagger | Chức năng | Route gốc |
|---:|---|---|---|---|
| 1 | GET | `/api/accounts` | Danh sách tài khoản | `GET /api/accounts` |
| 2 | POST | `/api/accounts` | Tạo tài khoản | `POST /api/accounts` |
| 3 | PATCH | `/api/accounts/update` | Update account | `PATCH /api/accounts/update` |
| 4 | POST | `/api/imports/emails/resend` | Resend email | `POST /api/imports/emails/resend` |
| 5 | DELETE | `/api/companies` | Xóa doanh nghiệp | `DELETE /api/companies` |
| 6 | DELETE | `/api/positions` | Xóa vị trí thực tập | `DELETE /api/positions` |
| 7 | DELETE | `/api/students` | Xóa hồ sơ sinh viên | `DELETE /api/students` |
| 8 | POST | `/api/auth/users/password-reset` | Đặt lại mật khẩu | `POST /api/auth/users/password-reset` |
| 9 | POST | `/api/admin/dashboard` | Tổng quan hệ thống | `POST /api/admin/dashboard` |
| 10 | POST | `/api/students/export` | Xuất danh sách sinh viên | `POST /api/students/export` |
| 11 | POST | `/api/admin/audit-logs/list` | Danh sách nhật ký hoạt động chi tiết | `POST /api/admin/audit-logs/list` |

## Phòng đào tạo

Quản lý học vụ và xét điều kiện OJT.

| # | Method | Đường dẫn Swagger | Chức năng | Route gốc |
|---:|---|---|---|---|
| 1 | GET | `/api/academic-years` | Danh sách năm học | `GET /api/academic-years` |
| 2 | POST | `/api/academic-years` | Tạo năm học | `POST /api/academic-years` |
| 3 | PATCH | `/api/academic-years/{id}` | Cập nhật năm học | `PATCH /api/academic-years/{id}` |
| 4 | GET | `/api/academic-periods` | Danh sách kỳ học và Block 3 | `GET /api/academic-periods` |
| 5 | POST | `/api/academic-periods` | Tạo kỳ học và Block 3 | `POST /api/academic-periods` |
| 6 | PATCH | `/api/academic-periods/{id}` | Cập nhật kỳ học và Block 3 | `PATCH /api/academic-periods/{id}` |
| 7 | GET | `/api/cohorts` | Danh sách khóa và nhóm | `GET /api/cohorts` |
| 8 | POST | `/api/cohorts` | Tạo khóa và nhóm | `POST /api/cohorts` |
| 9 | PATCH | `/api/cohorts/{id}` | Cập nhật khóa và nhóm | `PATCH /api/cohorts/{id}` |
| 10 | GET | `/api/academic-periods/{id}/combo-phase-schedules` | Xem mốc chọn và xác nhận combo | `GET /api/academic-periods/{id}/combo-phase-schedules` |
| 11 | PUT | `/api/academic-periods/{id}/combo-phase-schedules` | Thiết lập mốc chọn và xác nhận combo | `PUT /api/academic-periods/{id}/combo-phase-schedules` |
| 12 | GET | `/api/ojt-semesters/{id}/assessment-window` | Xem đợt xét điều kiện chính thức | `GET /api/ojt-semesters/{id}/assessment-window` |
| 13 | PUT | `/api/ojt-semesters/{id}/assessment-window` | Thiết lập đợt xét điều kiện chính thức | `PUT /api/ojt-semesters/{id}/assessment-window` |
| 14 | POST | `/api/ojt-semesters/{id}/assessment-window/open` | Mở xét điều kiện chính thức | `POST /api/ojt-semesters/{id}/assessment-window/open` |
| 15 | POST | `/api/ojt-semesters/{id}/assessment-window/close` | Đóng xét điều kiện chính thức | `POST /api/ojt-semesters/{id}/assessment-window/close` |
| 16 | GET | `/api/curricula/{id}/ojt-grade-mappings/{semesterId}` | Xem quy đổi điểm môn OJT | `GET /api/curricula/{id}/ojt-grade-mappings/{semesterId}` |
| 17 | PUT | `/api/curricula/{id}/ojt-grade-mappings/{semesterId}` | Thiết lập quy đổi điểm môn OJT | `PUT /api/curricula/{id}/ojt-grade-mappings/{semesterId}` |
| 18 | POST | `/api/ojt-registration-windows/{id}/semester-exceptions` | Thêm ngoại lệ kỳ đăng ký OJT | `POST /api/ojt-registration-windows/{id}/semester-exceptions` |
| 19 | POST | `/api/ojt-registration-windows/{id}/semester-exceptions/{exceptionId}/revoke` | Thu hồi ngoại lệ kỳ đăng ký OJT | `POST /api/ojt-registration-windows/{id}/semester-exceptions/{exceptionId}/revoke` |
| 20 | POST | `/api/combo-registration-windows/{id}/preview` | Xem ảnh hưởng của combo dự kiến | `POST /api/combo-registration-windows/{id}/preview` |
| 21 | GET | `/api/academic/dashboard` | Tổng quan và thống kê điều kiện OJT | `GET /api/academic/dashboard` |
| 22 | GET | `/api/academic/alerts` | Danh sách cảnh báo thiếu điều kiện OJT | `GET /api/academic/alerts` |
| 23 | GET | `/api/academic/course-demand` | Thống kê nhu cầu học môn còn thiếu | `GET /api/academic/course-demand` |
| 24 | GET | `/api/academic/course-demand/export` | Xuất nhu cầu học theo môn, kỳ và Block | `GET /api/academic/course-demand/export` |
| 25 | POST | `/api/academic/alerts/notifications` | Gửi cảnh báo học vụ | `POST /api/academic/alerts/notifications` |
| 26 | PATCH | `/api/accounts/me/profile` | Cập nhật hồ sơ cá nhân | `PATCH /api/accounts/me/profile` |
| 27 | GET | `/api/combo-registration-windows` | Danh sách đợt chọn combo | `GET /api/combo-registration-windows` |
| 28 | POST | `/api/combo-registration-windows` | Tạo đợt chọn hoặc xác nhận combo | `POST /api/combo-registration-windows` |
| 29 | PATCH | `/api/combo-registration-windows/{id}` | Cập nhật hoặc mở/đóng đợt chọn combo | `PATCH /api/combo-registration-windows/{id}` |
| 30 | POST | `/api/combo-registration-windows/{id}/extensions` | Gia hạn chọn combo | `POST /api/combo-registration-windows/{id}/extensions` |
| 31 | GET | `/api/combo-registration-windows/{id}/selections` | Theo dõi lựa chọn combo | `GET /api/combo-registration-windows/{id}/selections` |
| 32 | POST | `/api/combo-registration-windows/{id}/selections` | Gửi lựa chọn combo | `POST /api/combo-registration-windows/{id}/selections` |
| 33 | POST | `/api/combo-registration-windows/{id}/reminders` | Gửi nhắc chọn combo | `POST /api/combo-registration-windows/{id}/reminders` |
| 34 | GET | `/api/students/{id}/combo-selections` | Lịch sử lựa chọn combo của sinh viên | `GET /api/students/{id}/combo-selections` |
| 35 | POST | `/api/combo-registration-windows/{id}/finalize` | Chốt lựa chọn combo | `POST /api/combo-registration-windows/{id}/finalize` |
| 36 | GET | `/api/majors` | Danh sách chuyên ngành | `GET /api/majors` |
| 37 | POST | `/api/majors` | Tạo chuyên ngành | `POST /api/majors` |
| 38 | GET | `/api/courses` | Danh sách môn học | `GET /api/courses` |
| 39 | POST | `/api/courses` | Tạo môn học | `POST /api/courses` |
| 40 | GET | `/api/curricula` | Danh sách chương trình đào tạo đã nhập | `GET /api/curricula` |
| 41 | PATCH | `/api/courses/{id}` | Cập nhật môn học | `PATCH /api/courses/{id}` |
| 42 | GET | `/api/curricula/{id}` | Chi tiết chương trình đào tạo | `GET /api/curricula/{id}` |
| 43 | POST | `/api/curriculum-imports/preview` | Kiểm tra dữ liệu nhập khung chương trình | `POST /api/curriculum-imports/preview` |
| 44 | POST | `/api/curriculum-imports/commit` | Nhập khung chương trình | `POST /api/curriculum-imports/commit` |
| 45 | GET | `/api/ojt-rule-sets` | Danh sách bộ quy tắc OJT | `GET /api/ojt-rule-sets` |
| 46 | POST | `/api/ojt-rule-sets` | Tạo bộ quy tắc OJT | `POST /api/ojt-rule-sets` |
| 47 | PATCH | `/api/ojt-rule-sets/{id}` | Sửa bộ quy tắc chưa ban hành | `PATCH /api/ojt-rule-sets/{id}` |
| 48 | POST | `/api/ojt-rule-sets/{id}/publish` | Ban hành bộ quy tắc OJT | `POST /api/ojt-rule-sets/{id}/publish` |
| 49 | GET | `/api/students/{id}/eligibility-checks` | Lịch sử kiểm tra điều kiện OJT | `GET /api/students/{id}/eligibility-checks` |
| 50 | GET | `/api/students/{id}/eligibility` | Kết quả OJT và điều kiện còn thiếu | `GET /api/students/{id}/eligibility` |
| 51 | POST | `/api/eligibility-check-runs` | Xét điều kiện OJT hàng loạt và cập nhật trạng thái | `POST /api/eligibility-check-runs` |
| 52 | POST | `/api/imports/preview` | Kiểm tra import doanh nghiệp hoặc sinh viên | `POST /api/imports/preview` |
| 53 | POST | `/api/imports/commit` | Import doanh nghiệp (QHDN) hoặc sinh viên (Phòng đào tạo/Admin) | `POST /api/imports/commit` |
| 54 | GET | `/api/ojt-semesters/{id}/eligible-student-handoffs` | Lịch sử bàn giao sinh viên cho QHDN | `GET /api/ojt-semesters/{id}/eligible-student-handoffs` |
| 55 | POST | `/api/ojt-semesters/{id}/eligible-student-handoffs` | Bàn giao sinh viên đủ điều kiện cho QHDN trước đăng ký | `POST /api/ojt-semesters/{id}/eligible-student-handoffs` |
| 56 | GET | `/api/ojt-semesters/{id}/students` | Theo dõi trạng thái OJT theo kỳ | `GET /api/ojt-semesters/{id}/students` |
| 57 | GET | `/api/students` | Tìm kiếm và lọc sinh viên | `GET /api/students` |
| 58 | GET | `/api/students/{id}` | Hồ sơ học vụ tổng hợp | `GET /api/students/{id}` |
| 59 | PATCH | `/api/students/{id}` | Cập nhật hồ sơ và lộ trình học vụ | `PATCH /api/students/{id}` |
| 60 | GET | `/api/students/{id}/course-results` | Điểm, lần học và trạng thái môn | `GET /api/students/{id}/course-results` |
| 61 | PATCH | `/api/course-results/{id}` | Sửa kết quả học tập và ghi lý do | `PATCH /api/course-results/{id}` |
| 62 | GET | `/api/academic-imports` | Lịch sử nhập dữ liệu học vụ | `GET /api/academic-imports` |
| 63 | GET | `/api/ojt-results` | Danh sách kết quả OJT đã được QHDN chuyển | `GET /api/ojt-results` |
| 64 | GET | `/api/ojt-semesters/{id}/results/export` | Xuất danh sách điểm OJT chính thức | `GET /api/ojt-semesters/{id}/results/export` |
| 65 | POST | `/api/academic/academic-summary-notifications` | gửi snapshot giữa kỳ cho cả scope, kể cả SV không có cảnh báo; có thể gửi thủ công trước. | `POST /api/academic/academic-summary-notifications` |
| 66 | POST | `/api/academic/eligibility-notifications` | thông báo đủ/không đủ/chờ đối soát; tham chiếu snapshot/checkId và chống gửi lặp. | `POST /api/academic/eligibility-notifications` |
| 67 | GET | `/api/academic-periods/{id}/ojt-advisory-schedule` | xem lịch thông báo giữa kỳ và deadline. | `GET /api/academic-periods/{id}/ojt-advisory-schedule` |
| 68 | PUT | `/api/academic-periods/{id}/ojt-advisory-schedule` | cấu hình lịch theo kỳ thực, worker thực thi. | `PUT /api/academic-periods/{id}/ojt-advisory-schedule` |
| 69 | GET | `/api/academic/advisory-runs` | lịch sử batch thông báo khi có worker. | `GET /api/academic/advisory-runs` |
| 70 | GET | `/api/academic/advisory-runs/{id}` | trạng thái/lỗi từng sinh viên. | `GET /api/academic/advisory-runs/{id}` |
| 71 | GET | `/api/students/{id}/cv` | Tải CV của sinh viên | `GET /api/students/{id}/cv` |
| 72 | POST | `/api/ojt-results/{id}/confirm` | Phòng đào tạo xác nhận và ghi nhận điểm OJT | `POST /api/ojt-results/{id}/confirm` |

## Phòng QHDN

Quản lý tuyển dụng, điều phối và thực tập.

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
| 10 | POST | `/api/ojt-registrations` | Nộp hồ sơ đăng ký OJT | `POST /api/ojt-registrations` |
| 11 | POST | `/api/ojt-registrations/{id}/review` | Duyệt hoặc từ chối hồ sơ OJT | `POST /api/ojt-registrations/{id}/review` |
| 12 | GET | `/api/ojt-semesters/{id}/eligible-student-handoffs` | Lịch sử bàn giao sinh viên cho QHDN | `GET /api/ojt-semesters/{id}/eligible-student-handoffs` |
| 13 | GET | `/api/ojt-semesters/{id}/students` | Theo dõi trạng thái OJT theo kỳ | `GET /api/ojt-semesters/{id}/students` |
| 14 | GET | `/api/companies` | Danh sách và hồ sơ doanh nghiệp | `GET /api/companies` |
| 15 | PATCH | `/api/companies/{id}` | Cập nhật doanh nghiệp | `PATCH /api/companies/{id}` |
| 16 | GET | `/api/positions` | Danh sách và hồ sơ vị trí thực tập | `GET /api/positions` |
| 17 | GET | `/api/ojt-coordinations` | Danh sách và hồ sơ điều phối | `GET /api/ojt-coordinations` |
| 18 | POST | `/api/ojt-coordinations` | Giới thiệu sinh viên cho doanh nghiệp | `POST /api/ojt-coordinations` |
| 19 | GET | `/api/assignments` | Danh sách và hồ sơ phân công thực tập | `GET /api/assignments` |
| 20 | POST | `/api/assignments` | Phân công sinh viên thực tập | `POST /api/assignments` |
| 21 | PATCH | `/api/assignments/{id}` | Cập nhật thông tin và trạng thái thực tập | `PATCH /api/assignments/{id}` |
| 22 | GET | `/api/internship-evaluations` | Danh sách đánh giá thực tập | `GET /api/internship-evaluations` |
| 23 | POST | `/api/ojt-coordinations/{id}/decision` | Ghi nhận quyết định tiếp nhận sinh viên | `POST /api/ojt-coordinations/{id}/decision` |
| 24 | POST | `/api/ojt-coordinations/{id}/reassign` | Điều phối lại sinh viên | `POST /api/ojt-coordinations/{id}/reassign` |
| 25 | GET | `/api/qhdn/registered-students` | Xem sinh viên đã đăng ký OJT | `GET /api/qhdn/registered-students` |
| 26 | GET | `/api/qhdn/dashboard` | Tổng quan QHDN | `GET /api/qhdn/dashboard` |
| 27 | GET | `/api/qhdn/reports/export` | Xuất báo cáo QHDN | `GET /api/qhdn/reports/export` |
| 28 | GET | `/api/qhdn/reports` | Báo cáo QHDN theo loại | `GET /api/qhdn/reports` |
| 29 | POST | `/api/recruitment/windows` | Tạo đợt nhận nhu cầu tuyển dụng | `POST /api/recruitment/windows` |
| 30 | PATCH | `/api/recruitment/windows/{id}` | Cập nhật hoặc mở/đóng đợt tuyển dụng | `PATCH /api/recruitment/windows/{id}` |
| 31 | GET | `/api/recruitment/posts` | Danh sách tin tuyển dụng | `GET /api/recruitment/posts` |
| 32 | POST | `/api/recruitment/posts/{id}/review` | Duyệt hoặc từ chối tin tuyển dụng | `POST /api/recruitment/posts/{id}/review` |
| 33 | POST | `/api/recruitment/posts/{id}/close` | Đóng tin tuyển dụng | `POST /api/recruitment/posts/{id}/close` |
| 34 | GET | `/api/ojt-results` | Danh sách kết quả OJT đã được QHDN chuyển | `GET /api/ojt-results` |
| 35 | POST | `/api/ojt-results` | QHDN chốt và chuyển kết quả về Phòng đào tạo | `POST /api/ojt-results` |
| 36 | GET | `/api/ojt-semesters/{id}/results/export` | Xuất danh sách điểm OJT chính thức | `GET /api/ojt-semesters/{id}/results/export` |
| 37 | GET | `/api/students/{id}/cv` | Tải CV của sinh viên | `GET /api/students/{id}/cv` |
| 38 | GET | `/api/job-applications` | Danh sách hồ sơ ứng tuyển doanh nghiệp | `GET /api/job-applications` |
| 39 | GET | `/api/internship-tasks` | Danh sách task trong phạm vi tài khoản | `GET /api/internship-tasks` |

## Doanh nghiệp

Quản lý hồ sơ, tuyển dụng và thực tập sinh.

| # | Method | Đường dẫn Swagger | Chức năng | Route gốc |
|---:|---|---|---|---|
| 1 | GET | `/api/enterprise/profile` | Hồ sơ doanh nghiệp | `GET /api/enterprise/profile` |
| 2 | PATCH | `/api/enterprise/profile` | Cập nhật hồ sơ doanh nghiệp đã được import | `PATCH /api/enterprise/profile` |
| 3 | GET | `/api/enterprise/candidates` | Danh sách và hồ sơ ứng viên | `GET /api/enterprise/candidates` |
| 4 | PATCH | `/api/enterprise/candidates/{id}/decision` | Tiếp nhận hoặc từ chối ứng viên | `PATCH /api/enterprise/candidates/{id}/decision` |
| 5 | GET | `/api/enterprise/internships` | Danh sách sinh viên thực tập | `GET /api/enterprise/internships` |
| 6 | PUT | `/api/enterprise/internships/{id}/evaluation` | Gửi hoặc cập nhật đánh giá thực tập | `PUT /api/enterprise/internships/{id}/evaluation` |
| 7 | GET | `/api/recruitment/posts` | Danh sách tin tuyển dụng | `GET /api/recruitment/posts` |
| 8 | POST | `/api/enterprise/tasks/bulk` | Giao nhiều task cho nhiều thực tập sinh | `POST /api/enterprise/tasks/bulk` |
| 9 | GET | `/api/internship-tasks` | Danh sách task trong phạm vi tài khoản | `GET /api/internship-tasks` |

## Sinh viên

Xem học tập, chọn combo và đăng ký OJT.

| # | Method | Đường dẫn Swagger | Chức năng | Route gốc |
|---:|---|---|---|---|
| 1 | POST | `/api/students/me/cv` | Upload hoặc thay CV cá nhân | `POST /api/students/me/cv` |
| 2 | POST | `/api/student/combo-registration-windows/preview` | Xem ảnh hưởng của combo dự kiến | `POST /api/student/combo-registration-windows/preview` |
| 3 | PATCH | `/api/student/accounts/me/profile/update` | Cập nhật hồ sơ cá nhân | `PATCH /api/student/accounts/me/profile/update` |
| 4 | POST | `/api/student/auth/me/search` | Xem tài khoản đang đăng nhập | `POST /api/student/auth/me/search` |
| 5 | POST | `/api/student/combo-registration-windows/search` | Danh sách đợt chọn combo | `POST /api/student/combo-registration-windows/search` |
| 6 | POST | `/api/student/combo-registration-windows/selections` | Gửi lựa chọn combo | `POST /api/student/combo-registration-windows/selections` |
| 7 | POST | `/api/student/combo-selections/search` | Lịch sử lựa chọn combo của sinh viên | `POST /api/student/combo-selections/search` |
| 8 | POST | `/api/student/eligibility-checks/search` | Lịch sử kiểm tra điều kiện OJT | `POST /api/student/eligibility-checks/search` |
| 9 | POST | `/api/student/eligibility/search` | Kết quả OJT và điều kiện còn thiếu | `POST /api/student/eligibility/search` |
| 10 | POST | `/api/student/auth/change-password` | Đổi mật khẩu | `POST /api/student/auth/change-password` |
| 11 | POST | `/api/student/ojt-registration-windows/search` | Danh sách đợt đăng ký OJT | `POST /api/student/ojt-registration-windows/search` |
| 12 | POST | `/api/student/ojt-registrations/search` | Danh sách hồ sơ đăng ký OJT | `POST /api/student/ojt-registrations/search` |
| 13 | POST | `/api/student/ojt-registrations/create` | Nộp hồ sơ đăng ký OJT | `POST /api/student/ojt-registrations/create` |
| 14 | POST | `/api/student/ojt-semesters/students/search` | Theo dõi trạng thái OJT theo kỳ | `POST /api/student/ojt-semesters/students/search` |
| 15 | POST | `/api/student/profile/detail` | Hồ sơ học vụ tổng hợp | `POST /api/student/profile/detail` |
| 16 | POST | `/api/student/course-results/search` | Điểm, lần học và trạng thái môn | `POST /api/student/course-results/search` |
| 17 | POST | `/api/student/academic-summary/search` | tín chỉ đã đạt/đang học/thiếu; môn nợ/chưa học/đang học. Kịch bản đạt ngưỡng không phải xác suất AI | `POST /api/student/academic-summary/search` |
| 18 | POST | `/api/student/supplementary-course-options/search` | đề xuất môn/môn học lại, tín chỉ, lý do và tiên quyết; không lớp, không đăng ký học, không cam kết lịch | `POST /api/student/supplementary-course-options/search` |
| 19 | POST | `/api/student/curriculum/search` | chương trình đã ban hành của mình | `POST /api/student/curriculum/search` |
| 20 | POST | `/api/student/notifications/search` | thông báo/lọc unread/phân trang, trả unreadCount cùng response | `POST /api/student/notifications/search` |
| 21 | PATCH | `/api/student/notifications/update` | người nhận đánh dấu đọc, idempotent | `PATCH /api/student/notifications/update` |
| 22 | POST | `/api/student/assignments/current/search` | DN/vị trí/giám sát/thời gian của mình theo kỳ | `POST /api/student/assignments/current/search` |
| 23 | POST | `/api/student/ojt-results/search` | chỉ kết quả của mình được công bố | `POST /api/student/ojt-results/search` |
| 24 | POST | `/api/student/ojt-results/detail` | điểm/nhận xét đã công bố | `POST /api/student/ojt-results/detail` |
| 25 | POST | `/api/student/dashboard/search` | tổng hợp; không tạo thuật toán học vụ mới | `POST /api/student/dashboard/search` |
| 26 | POST | `/api/student/roadmap-recommendations/search` | tư vấn AI lộ trình; khác đề xuất môn bằng quy tắc | `POST /api/student/roadmap-recommendations/search` |
| 27 | POST | `/api/student/cv/download` | Tải CV của sinh viên | `POST /api/student/cv/download` |
| 28 | POST | `/api/student/job-applications/search` | Danh sách hồ sơ ứng tuyển doanh nghiệp | `POST /api/student/job-applications/search` |
| 29 | POST | `/api/student/job-applications/create` | Ứng tuyển vị trí doanh nghiệp | `POST /api/student/job-applications/create` |
| 30 | POST | `/api/student/opportunities/search` | Vị trí tuyển dụng và quyền ứng tuyển | `POST /api/student/opportunities/search` |
| 31 | POST | `/api/student/internship-tasks/search` | Danh sách task trong phạm vi tài khoản | `POST /api/student/internship-tasks/search` |

## Auth

Đăng nhập, thông tin phiên và đổi mật khẩu.

| # | Method | Đường dẫn Swagger | Chức năng | Route gốc |
|---:|---|---|---|---|
| 1 | POST | `/api/auth/login` | Đăng nhập bằng email và mật khẩu | `POST /api/auth/login` |
| 2 | GET | `/api/auth/me` | Xem tài khoản đang đăng nhập | `GET /api/auth/me` |
| 3 | POST | `/api/auth/change-password` | Đổi mật khẩu | `POST /api/auth/change-password` |
