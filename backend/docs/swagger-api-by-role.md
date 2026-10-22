# Danh sách API theo nhóm Swagger

Tạo từ OpenAPI hiện hành bằng `npm run docs:api` sau `npm run build`.

Tổng 136 API duy nhất. Nhóm hiển thị theo chức năng chính: API dùng chung với nhóm nghiệp vụ không lặp lại trong Admin. Quyền Admin vẫn giữ nguyên trong middleware/service và x-roles. Quyền nhập doanh nghiệp chỉ dành cho OJT_COORD; quyền nhập sinh viên dành cho ADMIN/ACADEMIC.

| Nhóm | Số API hiển thị |
|---|---:|
| Admin | 11 |
| Phòng đào tạo | 77 |
| Phòng QHDN | 33 |
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
| 1 | POST | `/api/academic-years` | Tạo năm học | `POST /api/academic-years` |
| 2 | POST | `/api/academic-periods` | Tạo kỳ học và Block 3 | `POST /api/academic-periods` |
| 3 | POST | `/api/cohorts` | Tạo khóa và nhóm | `POST /api/cohorts` |
| 4 | POST | `/api/academic/alerts/notifications` | Gửi cảnh báo học vụ | `POST /api/academic/alerts/notifications` |
| 5 | PATCH | `/api/accounts/me/profile` | Cập nhật hồ sơ cá nhân | `PATCH /api/accounts/me/profile` |
| 6 | POST | `/api/combo-registration-windows` | Tạo đợt chọn hoặc xác nhận combo | `POST /api/combo-registration-windows` |
| 7 | POST | `/api/majors` | Tạo chuyên ngành | `POST /api/majors` |
| 8 | POST | `/api/courses` | Tạo môn học | `POST /api/courses` |
| 9 | POST | `/api/curriculum-imports/preview` | Kiểm tra dữ liệu nhập khung chương trình | `POST /api/curriculum-imports/preview` |
| 10 | POST | `/api/curriculum-imports/commit` | Nhập khung chương trình | `POST /api/curriculum-imports/commit` |
| 11 | POST | `/api/ojt-rule-sets` | Tạo bộ quy tắc OJT | `POST /api/ojt-rule-sets` |
| 12 | POST | `/api/eligibility-check-runs` | Xét điều kiện OJT hàng loạt và cập nhật trạng thái | `POST /api/eligibility-check-runs` |
| 13 | POST | `/api/imports/preview` | Kiểm tra import doanh nghiệp hoặc sinh viên | `POST /api/imports/preview` |
| 14 | POST | `/api/imports/commit` | Import doanh nghiệp (QHDN) hoặc sinh viên (Phòng đào tạo/Admin) | `POST /api/imports/commit` |
| 15 | POST | `/api/ojt-registration-windows` | Tạo đợt đăng ký OJT | `POST /api/ojt-registration-windows` |
| 16 | POST | `/api/ojt-registrations` | Nộp hồ sơ đăng ký OJT | `POST /api/ojt-registrations` |
| 17 | POST | `/api/academic/academic-summary-notifications` | gửi snapshot giữa kỳ cho cả scope, kể cả SV không có cảnh báo; có thể gửi thủ công trước. | `POST /api/academic/academic-summary-notifications` |
| 18 | POST | `/api/academic/eligibility-notifications` | thông báo đủ/không đủ/chờ đối soát; tham chiếu snapshot/checkId và chống gửi lặp. | `POST /api/academic/eligibility-notifications` |
| 19 | POST | `/api/json/academic-years/list` | Danh sách năm học | `GET /api/academic-years` |
| 20 | PATCH | `/api/json/academic-years` | Cập nhật năm học | `PATCH /api/academic-years/{id}` |
| 21 | POST | `/api/json/academic-periods/list` | Danh sách kỳ học và Block 3 | `GET /api/academic-periods` |
| 22 | PATCH | `/api/json/academic-periods` | Cập nhật kỳ học và Block 3 | `PATCH /api/academic-periods/{id}` |
| 23 | POST | `/api/json/cohorts/list` | Danh sách khóa và nhóm | `GET /api/cohorts` |
| 24 | PATCH | `/api/json/cohorts` | Cập nhật khóa và nhóm | `PATCH /api/cohorts/{id}` |
| 25 | POST | `/api/json/academic-periods/combo-phase-schedules/list` | Xem mốc chọn và xác nhận combo | `GET /api/academic-periods/{id}/combo-phase-schedules` |
| 26 | PUT | `/api/json/academic-periods/combo-phase-schedules` | Thiết lập mốc chọn và xác nhận combo | `PUT /api/academic-periods/{id}/combo-phase-schedules` |
| 27 | POST | `/api/json/ojt-semesters/assessment-window/search` | Xem đợt xét điều kiện chính thức | `GET /api/ojt-semesters/{id}/assessment-window` |
| 28 | PUT | `/api/json/ojt-semesters/assessment-window` | Thiết lập đợt xét điều kiện chính thức | `PUT /api/ojt-semesters/{id}/assessment-window` |
| 29 | POST | `/api/json/ojt-semesters/assessment-window/open` | Mở xét điều kiện chính thức | `POST /api/ojt-semesters/{id}/assessment-window/open` |
| 30 | POST | `/api/json/ojt-semesters/assessment-window/close` | Đóng xét điều kiện chính thức | `POST /api/ojt-semesters/{id}/assessment-window/close` |
| 31 | POST | `/api/json/curricula/ojt-grade-mappings/detail` | Xem quy đổi điểm môn OJT | `GET /api/curricula/{id}/ojt-grade-mappings/{semesterId}` |
| 32 | PUT | `/api/json/curricula/ojt-grade-mappings` | Thiết lập quy đổi điểm môn OJT | `PUT /api/curricula/{id}/ojt-grade-mappings/{semesterId}` |
| 33 | POST | `/api/json/ojt-registration-windows/semester-exceptions` | Thêm ngoại lệ kỳ đăng ký OJT | `POST /api/ojt-registration-windows/{id}/semester-exceptions` |
| 34 | POST | `/api/json/ojt-registration-windows/semester-exceptions/revoke` | Thu hồi ngoại lệ kỳ đăng ký OJT | `POST /api/ojt-registration-windows/{id}/semester-exceptions/{exceptionId}/revoke` |
| 35 | POST | `/api/json/combo-registration-windows/preview` | Xem ảnh hưởng của combo dự kiến | `POST /api/combo-registration-windows/{id}/preview` |
| 36 | POST | `/api/json/academic/dashboard/search` | Tổng quan và thống kê điều kiện OJT | `GET /api/academic/dashboard` |
| 37 | POST | `/api/json/academic/alerts/list` | Danh sách cảnh báo thiếu điều kiện OJT | `GET /api/academic/alerts` |
| 38 | POST | `/api/json/academic/course-demand/list` | Thống kê nhu cầu học môn còn thiếu | `GET /api/academic/course-demand` |
| 39 | POST | `/api/json/academic/course-demand/export` | Xuất nhu cầu học theo môn, kỳ và Block | `GET /api/academic/course-demand/export` |
| 40 | POST | `/api/json/combo-registration-windows/list` | Danh sách đợt chọn combo | `GET /api/combo-registration-windows` |
| 41 | PATCH | `/api/json/combo-registration-windows` | Cập nhật hoặc mở/đóng đợt chọn combo | `PATCH /api/combo-registration-windows/{id}` |
| 42 | POST | `/api/json/combo-registration-windows/extensions` | Gia hạn chọn combo | `POST /api/combo-registration-windows/{id}/extensions` |
| 43 | POST | `/api/json/combo-registration-windows/selections/list` | Theo dõi lựa chọn combo | `GET /api/combo-registration-windows/{id}/selections` |
| 44 | POST | `/api/json/combo-registration-windows/selections` | Gửi lựa chọn combo | `POST /api/combo-registration-windows/{id}/selections` |
| 45 | POST | `/api/json/combo-registration-windows/reminders` | Gửi nhắc chọn combo | `POST /api/combo-registration-windows/{id}/reminders` |
| 46 | POST | `/api/json/students/combo-selections/list` | Lịch sử lựa chọn combo của sinh viên | `GET /api/students/{id}/combo-selections` |
| 47 | POST | `/api/json/combo-registration-windows/finalize` | Chốt lựa chọn combo | `POST /api/combo-registration-windows/{id}/finalize` |
| 48 | POST | `/api/json/majors/list` | Danh sách chuyên ngành | `GET /api/majors` |
| 49 | POST | `/api/json/courses/list` | Danh sách môn học | `GET /api/courses` |
| 50 | POST | `/api/json/curricula/list` | Danh sách chương trình đào tạo đã nhập | `GET /api/curricula` |
| 51 | PATCH | `/api/json/courses` | Cập nhật môn học | `PATCH /api/courses/{id}` |
| 52 | POST | `/api/json/curricula/detail` | Chi tiết chương trình đào tạo | `GET /api/curricula/{id}` |
| 53 | POST | `/api/json/ojt-rule-sets/list` | Danh sách bộ quy tắc OJT | `GET /api/ojt-rule-sets` |
| 54 | PATCH | `/api/json/ojt-rule-sets` | Sửa bộ quy tắc chưa ban hành | `PATCH /api/ojt-rule-sets/{id}` |
| 55 | POST | `/api/json/ojt-rule-sets/publish` | Ban hành bộ quy tắc OJT | `POST /api/ojt-rule-sets/{id}/publish` |
| 56 | POST | `/api/json/students/eligibility-checks/list` | Lịch sử kiểm tra điều kiện OJT | `GET /api/students/{id}/eligibility-checks` |
| 57 | POST | `/api/json/students/eligibility/search` | Kết quả OJT và điều kiện còn thiếu | `GET /api/students/{id}/eligibility` |
| 58 | POST | `/api/json/ojt-registration-windows/list` | Danh sách đợt đăng ký OJT | `GET /api/ojt-registration-windows` |
| 59 | PATCH | `/api/json/ojt-registration-windows` | Cập nhật hoặc mở/đóng đợt đăng ký OJT | `PATCH /api/ojt-registration-windows/{id}` |
| 60 | POST | `/api/json/ojt-registrations/list` | Danh sách hồ sơ đăng ký OJT | `GET /api/ojt-registrations` |
| 61 | POST | `/api/json/ojt-registrations/review` | Duyệt hoặc từ chối hồ sơ OJT | `POST /api/ojt-registrations/{id}/review` |
| 62 | POST | `/api/json/ojt-semesters/eligible-student-handoffs/list` | Lịch sử bàn giao sinh viên cho QHDN | `GET /api/ojt-semesters/{id}/eligible-student-handoffs` |
| 63 | POST | `/api/json/ojt-semesters/eligible-student-handoffs` | Bàn giao sinh viên đủ điều kiện cho QHDN | `POST /api/ojt-semesters/{id}/eligible-student-handoffs` |
| 64 | POST | `/api/json/ojt-semesters/students/list` | Theo dõi trạng thái OJT theo kỳ | `GET /api/ojt-semesters/{id}/students` |
| 65 | POST | `/api/json/students/list` | Tìm kiếm và lọc sinh viên | `GET /api/students` |
| 66 | POST | `/api/json/students/detail` | Hồ sơ học vụ tổng hợp | `GET /api/students/{id}` |
| 67 | PATCH | `/api/json/students` | Cập nhật hồ sơ và lộ trình học vụ | `PATCH /api/students/{id}` |
| 68 | POST | `/api/json/students/course-results/list` | Điểm, lần học và trạng thái môn | `GET /api/students/{id}/course-results` |
| 69 | PATCH | `/api/json/course-results` | Sửa kết quả học tập và ghi lý do | `PATCH /api/course-results/{id}` |
| 70 | POST | `/api/json/academic-imports/list` | Lịch sử nhập dữ liệu học vụ | `GET /api/academic-imports` |
| 71 | POST | `/api/json/ojt-results/list` | Danh sách điểm OJT chính thức do doanh nghiệp đánh giá | `GET /api/ojt-results` |
| 72 | POST | `/api/json/ojt-semesters/results/export` | Xuất danh sách điểm OJT chính thức | `GET /api/ojt-semesters/{id}/results/export` |
| 73 | POST | `/api/json/academic-periods/ojt-advisory-schedule/search` | xem lịch thông báo giữa kỳ và deadline. | `GET /api/academic-periods/{id}/ojt-advisory-schedule` |
| 74 | PUT | `/api/json/academic-periods/ojt-advisory-schedule` | cấu hình lịch theo kỳ thực, worker thực thi. | `PUT /api/academic-periods/{id}/ojt-advisory-schedule` |
| 75 | POST | `/api/json/academic/advisory-runs/list` | lịch sử batch thông báo khi có worker. | `GET /api/academic/advisory-runs` |
| 76 | POST | `/api/json/academic/advisory-runs/detail` | trạng thái/lỗi từng sinh viên. | `GET /api/academic/advisory-runs/{id}` |
| 77 | POST | `/api/json/students/cv/search` | Tải CV của sinh viên | `GET /api/students/{id}/cv` |

## Phòng QHDN

Quản lý tuyển dụng, điều phối và thực tập.

| # | Method | Đường dẫn Swagger | Chức năng | Route gốc |
|---:|---|---|---|---|
| 1 | PATCH | `/api/accounts/me/profile` | Cập nhật hồ sơ cá nhân | `PATCH /api/accounts/me/profile` |
| 2 | POST | `/api/imports/preview` | Kiểm tra import doanh nghiệp hoặc sinh viên | `POST /api/imports/preview` |
| 3 | POST | `/api/imports/commit` | Import doanh nghiệp (QHDN) hoặc sinh viên (Phòng đào tạo/Admin) | `POST /api/imports/commit` |
| 4 | POST | `/api/imports/archive` | Lưu trữ tuyển dụng sau hai học kỳ | `POST /api/imports/archive` |
| 5 | POST | `/api/ojt-coordinations` | Giới thiệu sinh viên cho doanh nghiệp | `POST /api/ojt-coordinations` |
| 6 | POST | `/api/assignments` | Phân công sinh viên thực tập | `POST /api/assignments` |
| 7 | POST | `/api/recruitment/windows` | Tạo đợt nhận nhu cầu tuyển dụng | `POST /api/recruitment/windows` |
| 8 | POST | `/api/json/academic-periods/list` | Danh sách kỳ học và Block 3 | `GET /api/academic-periods` |
| 9 | POST | `/api/json/ojt-registrations/list` | Danh sách hồ sơ đăng ký OJT | `GET /api/ojt-registrations` |
| 10 | POST | `/api/json/ojt-semesters/eligible-student-handoffs/list` | Lịch sử bàn giao sinh viên cho QHDN | `GET /api/ojt-semesters/{id}/eligible-student-handoffs` |
| 11 | POST | `/api/json/ojt-semesters/students/list` | Theo dõi trạng thái OJT theo kỳ | `GET /api/ojt-semesters/{id}/students` |
| 12 | POST | `/api/json/companies/list` | Danh sách và hồ sơ doanh nghiệp | `GET /api/companies` |
| 13 | PATCH | `/api/json/companies` | Cập nhật doanh nghiệp | `PATCH /api/companies/{id}` |
| 14 | POST | `/api/json/positions/list` | Danh sách và hồ sơ vị trí thực tập | `GET /api/positions` |
| 15 | POST | `/api/json/ojt-coordinations/list` | Danh sách và hồ sơ điều phối | `GET /api/ojt-coordinations` |
| 16 | POST | `/api/json/assignments/list` | Danh sách và hồ sơ phân công thực tập | `GET /api/assignments` |
| 17 | PATCH | `/api/json/assignments` | Cập nhật thông tin và trạng thái thực tập | `PATCH /api/assignments/{id}` |
| 18 | POST | `/api/json/internship-evaluations/list` | Danh sách đánh giá thực tập | `GET /api/internship-evaluations` |
| 19 | POST | `/api/json/ojt-coordinations/decision` | Ghi nhận quyết định tiếp nhận sinh viên | `POST /api/ojt-coordinations/{id}/decision` |
| 20 | POST | `/api/json/ojt-coordinations/reassign` | Điều phối lại sinh viên | `POST /api/ojt-coordinations/{id}/reassign` |
| 21 | POST | `/api/json/qhdn/registered-students/list` | Xem sinh viên đã đăng ký OJT | `GET /api/qhdn/registered-students` |
| 22 | POST | `/api/json/qhdn/dashboard/search` | Tổng quan QHDN | `GET /api/qhdn/dashboard` |
| 23 | POST | `/api/json/qhdn/reports/export` | Xuất báo cáo QHDN | `GET /api/qhdn/reports/export` |
| 24 | POST | `/api/json/qhdn/reports/list` | Báo cáo QHDN theo loại | `GET /api/qhdn/reports` |
| 25 | PATCH | `/api/json/recruitment/windows` | Cập nhật hoặc mở/đóng đợt tuyển dụng | `PATCH /api/recruitment/windows/{id}` |
| 26 | POST | `/api/json/recruitment/posts/list` | Danh sách tin tuyển dụng | `GET /api/recruitment/posts` |
| 27 | POST | `/api/json/recruitment/posts/review` | Duyệt hoặc từ chối tin tuyển dụng | `POST /api/recruitment/posts/{id}/review` |
| 28 | POST | `/api/json/recruitment/posts/close` | Đóng tin tuyển dụng | `POST /api/recruitment/posts/{id}/close` |
| 29 | POST | `/api/json/ojt-results/list` | Danh sách điểm OJT chính thức do doanh nghiệp đánh giá | `GET /api/ojt-results` |
| 30 | POST | `/api/json/ojt-semesters/results/export` | Xuất danh sách điểm OJT chính thức | `GET /api/ojt-semesters/{id}/results/export` |
| 31 | POST | `/api/json/students/cv/search` | Tải CV của sinh viên | `GET /api/students/{id}/cv` |
| 32 | POST | `/api/json/job-applications/list` | Danh sách hồ sơ ứng tuyển doanh nghiệp | `GET /api/job-applications` |
| 33 | POST | `/api/json/internship-tasks/list` | Danh sách task trong phạm vi tài khoản | `GET /api/internship-tasks` |

## Doanh nghiệp

Quản lý hồ sơ, tuyển dụng và thực tập sinh.

| # | Method | Đường dẫn Swagger | Chức năng | Route gốc |
|---:|---|---|---|---|
| 1 | GET | `/api/enterprise/profile` | Hồ sơ doanh nghiệp | `GET /api/enterprise/profile` |
| 2 | PATCH | `/api/enterprise/profile` | Cập nhật hồ sơ doanh nghiệp đã được import | `PATCH /api/enterprise/profile` |
| 3 | POST | `/api/enterprise/tasks/bulk` | Giao nhiều task cho nhiều thực tập sinh | `POST /api/enterprise/tasks/bulk` |
| 4 | POST | `/api/json/enterprise/candidates/list` | Danh sách và hồ sơ ứng viên | `GET /api/enterprise/candidates` |
| 5 | PATCH | `/api/json/enterprise/candidates/decision` | Tiếp nhận hoặc từ chối ứng viên | `PATCH /api/enterprise/candidates/{id}/decision` |
| 6 | POST | `/api/json/enterprise/internships/list` | Danh sách sinh viên thực tập | `GET /api/enterprise/internships` |
| 7 | PUT | `/api/json/enterprise/internships/evaluation` | Gửi hoặc cập nhật đánh giá thực tập | `PUT /api/enterprise/internships/{id}/evaluation` |
| 8 | POST | `/api/json/recruitment/posts/list` | Danh sách tin tuyển dụng | `GET /api/recruitment/posts` |
| 9 | POST | `/api/json/internship-tasks/list` | Danh sách task trong phạm vi tài khoản | `GET /api/internship-tasks` |

## Sinh viên

Xem học tập, chọn combo và đăng ký OJT.

| # | Method | Đường dẫn Swagger | Chức năng | Route gốc |
|---:|---|---|---|---|
| 1 | PATCH | `/api/accounts/me/profile` | Cập nhật hồ sơ cá nhân | `PATCH /api/accounts/me/profile` |
| 2 | POST | `/api/ojt-registrations` | Nộp hồ sơ đăng ký OJT | `POST /api/ojt-registrations` |
| 3 | GET | `/api/student/curriculum` | chương trình đã ban hành của mình | `GET /api/student/curriculum` |
| 4 | POST | `/api/students/me/cv` | Upload hoặc thay CV cá nhân | `POST /api/students/me/cv` |
| 5 | POST | `/api/job-applications` | Ứng tuyển vị trí doanh nghiệp | `POST /api/job-applications` |
| 6 | POST | `/api/json/combo-registration-windows/preview` | Xem ảnh hưởng của combo dự kiến | `POST /api/combo-registration-windows/{id}/preview` |
| 7 | POST | `/api/json/combo-registration-windows/list` | Danh sách đợt chọn combo | `GET /api/combo-registration-windows` |
| 8 | POST | `/api/json/combo-registration-windows/selections` | Gửi lựa chọn combo | `POST /api/combo-registration-windows/{id}/selections` |
| 9 | POST | `/api/json/students/combo-selections/list` | Lịch sử lựa chọn combo của sinh viên | `GET /api/students/{id}/combo-selections` |
| 10 | POST | `/api/json/students/eligibility-checks/list` | Lịch sử kiểm tra điều kiện OJT | `GET /api/students/{id}/eligibility-checks` |
| 11 | POST | `/api/json/students/eligibility/search` | Kết quả OJT và điều kiện còn thiếu | `GET /api/students/{id}/eligibility` |
| 12 | POST | `/api/json/ojt-registration-windows/list` | Danh sách đợt đăng ký OJT | `GET /api/ojt-registration-windows` |
| 13 | POST | `/api/json/ojt-registrations/list` | Danh sách hồ sơ đăng ký OJT | `GET /api/ojt-registrations` |
| 14 | POST | `/api/json/ojt-semesters/students/list` | Theo dõi trạng thái OJT theo kỳ | `GET /api/ojt-semesters/{id}/students` |
| 15 | POST | `/api/json/students/detail` | Hồ sơ học vụ tổng hợp | `GET /api/students/{id}` |
| 16 | POST | `/api/json/students/course-results/list` | Điểm, lần học và trạng thái môn | `GET /api/students/{id}/course-results` |
| 17 | POST | `/api/json/student/academic-summary/search` | tín chỉ đã đạt/đang học/thiếu; môn nợ/chưa học/đang học. Kịch bản đạt ngưỡng không phải xác suất AI | `GET /api/student/academic-summary` |
| 18 | POST | `/api/json/student/supplementary-course-options/search` | đề xuất môn/môn học lại, tín chỉ, lý do và tiên quyết; không lớp, không đăng ký học, không cam kết lịch | `GET /api/student/supplementary-course-options` |
| 19 | POST | `/api/json/student/ojt-registration-windows/list` | scope/deadline, canRegister/blockReasons | `GET /api/student/ojt-registration-windows` |
| 20 | POST | `/api/json/student/notifications/list` | thông báo/lọc unread/phân trang, trả unreadCount cùng response | `GET /api/student/notifications` |
| 21 | PATCH | `/api/json/student/notifications/read` | người nhận đánh dấu đọc, idempotent | `PATCH /api/student/notifications/{id}/read` |
| 22 | POST | `/api/json/student/combo-registration-windows/list` | các đợt/lựa chọn khả dụng | `GET /api/student/combo-registration-windows` |
| 23 | POST | `/api/json/student/assignments/current/search` | DN/vị trí/giám sát/thời gian của mình theo kỳ | `GET /api/student/assignments/current` |
| 24 | POST | `/api/json/student/ojt-results/list` | chỉ kết quả của mình được công bố | `GET /api/student/ojt-results` |
| 25 | POST | `/api/json/student/ojt-results/detail` | điểm/nhận xét đã công bố | `GET /api/student/ojt-results/{id}` |
| 26 | POST | `/api/json/student/dashboard/search` | tổng hợp; không tạo thuật toán học vụ mới | `GET /api/student/dashboard` |
| 27 | POST | `/api/json/student/roadmap-recommendations/search` | tư vấn AI lộ trình; khác đề xuất môn bằng quy tắc | `GET /api/student/roadmap-recommendations` |
| 28 | POST | `/api/json/students/cv/search` | Tải CV của sinh viên | `GET /api/students/{id}/cv` |
| 29 | POST | `/api/json/job-applications/list` | Danh sách hồ sơ ứng tuyển doanh nghiệp | `GET /api/job-applications` |
| 30 | POST | `/api/json/students/me/opportunities/list` | Vị trí tuyển dụng và quyền ứng tuyển | `GET /api/students/me/opportunities` |
| 31 | POST | `/api/json/internship-tasks/list` | Danh sách task trong phạm vi tài khoản | `GET /api/internship-tasks` |

## Auth

Đăng nhập, thông tin phiên và đổi mật khẩu.

| # | Method | Đường dẫn Swagger | Chức năng | Route gốc |
|---:|---|---|---|---|
| 1 | POST | `/api/auth/login` | Đăng nhập bằng email và mật khẩu | `POST /api/auth/login` |
| 2 | GET | `/api/auth/me` | Xem tài khoản đang đăng nhập | `GET /api/auth/me` |
| 3 | POST | `/api/auth/change-password` | Đổi mật khẩu | `POST /api/auth/change-password` |
