# Danh sách API theo nhóm Swagger

Tạo từ OpenAPI hiện hành bằng `npm run docs:api` sau `npm run build`.

Tổng 160 API duy nhất. Nhóm hiển thị theo chức năng chính: API dùng chung với nhóm nghiệp vụ không lặp lại trong Admin. Quyền Admin vẫn giữ nguyên trong middleware/service và x-roles. Quyền nhập doanh nghiệp chỉ dành cho OJT_COORD; quyền nhập sinh viên dành cho ADMIN/ACADEMIC.

| Nhóm | Số API hiển thị |
|---|---:|
| Admin | 29 |
| Phòng đào tạo | 75 |
| Phòng QHDN | 39 |
| Doanh nghiệp | 9 |
| Sinh viên | 32 |
| Auth | 3 |

## Admin

Chức năng quản trị và theo dõi hệ thống. API nghiệp vụ dùng chung hiển thị ở nhóm phụ trách; quyền Admin vẫn giữ nguyên.

| # | Method | Đường dẫn Swagger | Chức năng | Route gốc |
|---:|---|---|---|---|
| 1 | GET | `/api/accounts` | Danh sách tài khoản | `GET /api/accounts` |
| 2 | POST | `/api/accounts` | Tạo tài khoản | `POST /api/accounts` |
| 3 | PATCH | `/api/accounts/{userId}` | Cập nhật tài khoản | `PATCH /api/accounts/{userId}` |
| 4 | GET | `/api/imports/emails` | Trạng thái gửi email tài khoản | `GET /api/imports/emails` |
| 5 | POST | `/api/imports/emails/{emailId}/retry` | Gửi lại email bị lỗi | `POST /api/imports/emails/{emailId}/retry` |
| 6 | DELETE | `/api/companies/{id}` | Xóa doanh nghiệp | `DELETE /api/companies/{id}` |
| 7 | DELETE | `/api/students/{id}` | Xóa hồ sơ sinh viên | `DELETE /api/students/{id}` |
| 8 | GET | `/api/health` | Kiểm tra backend và cơ sở dữ liệu | `GET /api/health` |
| 9 | GET | `/api/roles` | Danh sách vai trò | `GET /api/roles` |
| 10 | POST | `/api/auth/users/{userId}/password-reset` | Đặt lại mật khẩu | `POST /api/auth/users/{userId}/password-reset` |
| 11 | GET | `/api/admin/dashboard` | Tổng quan hệ thống và thống kê dự đoán | `GET /api/admin/dashboard` |
| 12 | GET | `/api/students/export` | Xuất danh sách sinh viên | `GET /api/students/export` |
| 13 | DELETE | `/api/positions/{id}` | Xóa vị trí thực tập | `DELETE /api/positions/{id}` |
| 14 | GET | `/api/assessment-templates` | Danh sách và hồ sơ bộ tiêu chí đánh giá | `GET /api/assessment-templates` |
| 15 | POST | `/api/assessment-templates` | Tạo bộ tiêu chí đánh giá | `POST /api/assessment-templates` |
| 16 | PATCH | `/api/assessment-templates/{id}` | Sửa bộ tiêu chí đánh giá | `PATCH /api/assessment-templates/{id}` |
| 17 | POST | `/api/assessment-templates/{id}/publish` | Ban hành bộ tiêu chí đánh giá | `POST /api/assessment-templates/{id}/publish` |
| 18 | POST | `/api/admin/prediction-jobs` | Tạo tác vụ dự đoán | `POST /api/admin/prediction-jobs` |
| 19 | GET | `/api/admin/prediction-jobs/{id}` | Tiến độ dự đoán và lỗi theo sinh viên | `GET /api/admin/prediction-jobs/{id}` |
| 20 | GET | `/api/predictions` | Lịch sử dự đoán | `GET /api/predictions` |
| 21 | GET | `/api/admin/models` | Danh sách và hồ sơ phiên bản mô hình | `GET /api/admin/models` |
| 22 | GET | `/api/alerts` | Danh sách và hồ sơ cảnh báo rủi ro | `GET /api/alerts` |
| 23 | PATCH | `/api/alerts/{id}/status` | Tiếp nhận hoặc đóng cảnh báo | `PATCH /api/alerts/{id}/status` |
| 24 | POST | `/api/alerts/{id}/interventions` | Tạo hoạt động hỗ trợ sinh viên | `POST /api/alerts/{id}/interventions` |
| 25 | GET | `/api/students/{id}/interventions` | Lịch sử hỗ trợ sinh viên | `GET /api/students/{id}/interventions` |
| 26 | PATCH | `/api/interventions/{id}` | Cập nhật hoạt động hỗ trợ | `PATCH /api/interventions/{id}` |
| 27 | GET | `/api/admin/reports/readiness` | Báo cáo mức sẵn sàng và rủi ro | `GET /api/admin/reports/readiness` |
| 28 | GET | `/api/admin/reports/export` | Xuất báo cáo dự đoán | `GET /api/admin/reports/export` |
| 29 | GET | `/api/admin/audit-logs` | Nhật ký hoạt động hệ thống | `GET /api/admin/audit-logs` |

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
| 50 | POST | `/api/students/{id}/eligibility-checks` | Kiểm tra điều kiện OJT của sinh viên | `POST /api/students/{id}/eligibility-checks` |
| 51 | GET | `/api/students/{id}/eligibility` | Kết quả OJT và điều kiện còn thiếu | `GET /api/students/{id}/eligibility` |
| 52 | POST | `/api/eligibility-checks/{id}/confirm` | Xác nhận kết quả xét điều kiện OJT | `POST /api/eligibility-checks/{id}/confirm` |
| 53 | POST | `/api/eligibility-check-runs` | Kiểm tra điều kiện OJT hàng loạt | `POST /api/eligibility-check-runs` |
| 54 | GET | `/api/eligibility-check-runs/{id}` | Tiến độ và kết quả kiểm tra hàng loạt | `GET /api/eligibility-check-runs/{id}` |
| 55 | POST | `/api/imports/preview` | Kiểm tra import doanh nghiệp hoặc sinh viên | `POST /api/imports/preview` |
| 56 | POST | `/api/imports/commit` | Import doanh nghiệp (QHDN) hoặc sinh viên (Phòng đào tạo/Admin) | `POST /api/imports/commit` |
| 57 | GET | `/api/ojt-semesters/{id}/eligible-student-handoffs` | Lịch sử bàn giao sinh viên cho QHDN | `GET /api/ojt-semesters/{id}/eligible-student-handoffs` |
| 58 | POST | `/api/ojt-semesters/{id}/eligible-student-handoffs` | Bàn giao sinh viên đủ điều kiện cho QHDN trước đăng ký | `POST /api/ojt-semesters/{id}/eligible-student-handoffs` |
| 59 | GET | `/api/ojt-semesters/{id}/students` | Theo dõi trạng thái OJT theo kỳ | `GET /api/ojt-semesters/{id}/students` |
| 60 | GET | `/api/students` | Tìm kiếm và lọc sinh viên | `GET /api/students` |
| 61 | GET | `/api/students/{id}` | Hồ sơ học vụ tổng hợp | `GET /api/students/{id}` |
| 62 | PATCH | `/api/students/{id}` | Cập nhật hồ sơ và lộ trình học vụ | `PATCH /api/students/{id}` |
| 63 | GET | `/api/students/{id}/course-results` | Điểm, lần học và trạng thái môn | `GET /api/students/{id}/course-results` |
| 64 | PATCH | `/api/course-results/{id}` | Sửa kết quả học tập và ghi lý do | `PATCH /api/course-results/{id}` |
| 65 | GET | `/api/academic-imports` | Lịch sử nhập dữ liệu học vụ | `GET /api/academic-imports` |
| 66 | GET | `/api/ojt-results` | Danh sách kết quả OJT đã được QHDN chuyển | `GET /api/ojt-results` |
| 67 | GET | `/api/ojt-semesters/{id}/results/export` | Xuất danh sách điểm OJT chính thức | `GET /api/ojt-semesters/{id}/results/export` |
| 68 | POST | `/api/academic/academic-summary-notifications` | gửi snapshot giữa kỳ cho cả scope, kể cả SV không có cảnh báo; có thể gửi thủ công trước. | `POST /api/academic/academic-summary-notifications` |
| 69 | POST | `/api/academic/eligibility-notifications` | thông báo đủ/không đủ/chờ đối soát; tham chiếu snapshot/checkId và chống gửi lặp. | `POST /api/academic/eligibility-notifications` |
| 70 | GET | `/api/academic-periods/{id}/ojt-advisory-schedule` | xem lịch thông báo giữa kỳ và deadline. | `GET /api/academic-periods/{id}/ojt-advisory-schedule` |
| 71 | PUT | `/api/academic-periods/{id}/ojt-advisory-schedule` | cấu hình lịch theo kỳ thực, worker thực thi. | `PUT /api/academic-periods/{id}/ojt-advisory-schedule` |
| 72 | GET | `/api/academic/advisory-runs` | lịch sử batch thông báo khi có worker. | `GET /api/academic/advisory-runs` |
| 73 | GET | `/api/academic/advisory-runs/{id}` | trạng thái/lỗi từng sinh viên. | `GET /api/academic/advisory-runs/{id}` |
| 74 | GET | `/api/students/{id}/cv` | Tải CV của sinh viên | `GET /api/students/{id}/cv` |
| 75 | POST | `/api/ojt-results/{id}/confirm` | Phòng đào tạo xác nhận và ghi nhận điểm OJT | `POST /api/ojt-results/{id}/confirm` |

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
| 1 | POST | `/api/combo-registration-windows/{id}/preview` | Xem ảnh hưởng của combo dự kiến | `POST /api/combo-registration-windows/{id}/preview` |
| 2 | PATCH | `/api/accounts/me/profile` | Cập nhật hồ sơ cá nhân | `PATCH /api/accounts/me/profile` |
| 3 | GET | `/api/combo-registration-windows` | Danh sách đợt chọn combo | `GET /api/combo-registration-windows` |
| 4 | POST | `/api/combo-registration-windows/{id}/selections` | Gửi lựa chọn combo | `POST /api/combo-registration-windows/{id}/selections` |
| 5 | GET | `/api/students/{id}/combo-selections` | Lịch sử lựa chọn combo của sinh viên | `GET /api/students/{id}/combo-selections` |
| 6 | GET | `/api/students/{id}/eligibility-checks` | Lịch sử kiểm tra điều kiện OJT | `GET /api/students/{id}/eligibility-checks` |
| 7 | GET | `/api/students/{id}/eligibility` | Kết quả OJT và điều kiện còn thiếu | `GET /api/students/{id}/eligibility` |
| 8 | GET | `/api/ojt-registration-windows` | Danh sách đợt đăng ký OJT | `GET /api/ojt-registration-windows` |
| 9 | GET | `/api/ojt-registrations` | Danh sách hồ sơ đăng ký OJT | `GET /api/ojt-registrations` |
| 10 | POST | `/api/ojt-registrations` | Nộp hồ sơ đăng ký OJT | `POST /api/ojt-registrations` |
| 11 | GET | `/api/ojt-semesters/{id}/students` | Theo dõi trạng thái OJT theo kỳ | `GET /api/ojt-semesters/{id}/students` |
| 12 | GET | `/api/students/{id}` | Hồ sơ học vụ tổng hợp | `GET /api/students/{id}` |
| 13 | GET | `/api/students/{id}/course-results` | Điểm, lần học và trạng thái môn | `GET /api/students/{id}/course-results` |
| 14 | GET | `/api/student/academic-summary` | tín chỉ đã đạt/đang học/thiếu; môn nợ/chưa học/đang học. Kịch bản đạt ngưỡng không phải xác suất AI | `GET /api/student/academic-summary` |
| 15 | GET | `/api/student/supplementary-course-options` | đề xuất môn/môn học lại, tín chỉ, lý do và tiên quyết; không lớp, không đăng ký học, không cam kết lịch | `GET /api/student/supplementary-course-options` |
| 16 | GET | `/api/student/ojt-registration-windows` | scope/deadline, canRegister/blockReasons | `GET /api/student/ojt-registration-windows` |
| 17 | GET | `/api/student/curriculum` | chương trình đã ban hành của mình | `GET /api/student/curriculum` |
| 18 | GET | `/api/student/notifications` | thông báo/lọc unread/phân trang, trả unreadCount cùng response | `GET /api/student/notifications` |
| 19 | PATCH | `/api/student/notifications/{id}/read` | người nhận đánh dấu đọc, idempotent | `PATCH /api/student/notifications/{id}/read` |
| 20 | GET | `/api/student/combo-registration-windows` | các đợt/lựa chọn khả dụng | `GET /api/student/combo-registration-windows` |
| 21 | GET | `/api/student/assignments/current` | DN/vị trí/giám sát/thời gian của mình theo kỳ | `GET /api/student/assignments/current` |
| 22 | GET | `/api/student/ojt-results` | chỉ kết quả của mình được công bố | `GET /api/student/ojt-results` |
| 23 | GET | `/api/student/ojt-results/{id}` | điểm/nhận xét đã công bố | `GET /api/student/ojt-results/{id}` |
| 24 | GET | `/api/student/dashboard` | tổng hợp; không tạo thuật toán học vụ mới | `GET /api/student/dashboard` |
| 25 | GET | `/api/student/risk-prediction` | kết quả dự báo của mình, dùng lại prediction service khi có dữ liệu | `GET /api/student/risk-prediction` |
| 26 | GET | `/api/student/roadmap-recommendations` | tư vấn AI lộ trình; khác đề xuất môn bằng quy tắc | `GET /api/student/roadmap-recommendations` |
| 27 | POST | `/api/students/me/cv` | Upload hoặc thay CV cá nhân | `POST /api/students/me/cv` |
| 28 | GET | `/api/students/{id}/cv` | Tải CV của sinh viên | `GET /api/students/{id}/cv` |
| 29 | GET | `/api/job-applications` | Danh sách hồ sơ ứng tuyển doanh nghiệp | `GET /api/job-applications` |
| 30 | POST | `/api/job-applications` | Ứng tuyển vị trí doanh nghiệp | `POST /api/job-applications` |
| 31 | GET | `/api/students/me/opportunities` | Vị trí tuyển dụng và quyền ứng tuyển | `GET /api/students/me/opportunities` |
| 32 | GET | `/api/internship-tasks` | Danh sách task trong phạm vi tài khoản | `GET /api/internship-tasks` |

## Auth

Đăng nhập, thông tin phiên và đổi mật khẩu.

| # | Method | Đường dẫn Swagger | Chức năng | Route gốc |
|---:|---|---|---|---|
| 1 | POST | `/api/auth/login` | Đăng nhập bằng email và mật khẩu | `POST /api/auth/login` |
| 2 | GET | `/api/auth/me` | Xem tài khoản đang đăng nhập | `GET /api/auth/me` |
| 3 | POST | `/api/auth/change-password` | Đổi mật khẩu | `POST /api/auth/change-password` |
