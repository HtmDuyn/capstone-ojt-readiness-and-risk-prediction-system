# Rà soát API backend theo nhóm Swagger

> Báo cáo trước khi sửa luồng. Các số liệu/lỗi bên dưới là mốc kiểm kê ban đầu; hiện tại đã sửa và còn 159 API. Xem [luồng đã cập nhật](backend-workflow.md) và [danh mục Swagger hiện hành](swagger-api-by-role.md).

Ngày rà soát: 20/10/2026. Nguồn: `backend/src`, route Express, OpenAPI và các service liên quan.

## Kết quả và giới hạn

- Cấu hình hiện tại không khởi tạo được Swagger: `groupSwaggerByRole` báo `Missing Swagger role assignment: POST /api/academic/academic-summary-notifications`. `app.ts` import Swagger nên lỗi này cũng chặn khởi tạo app từ src.
- Bảng dưới là danh mục tái dựng từ chuỗi tạo OpenAPI hiện tại, KHÔNG phải ảnh chụp Swagger đang chạy. Chỉ bỏ chặn kiểm tra nhóm trong bộ nhớ của tiến trình rà soát; không sửa mã nguồn ứng dụng.
- Các API thiếu nhóm được tạm xếp theo route/middleware: `/student/*` thuộc Sinh viên; advisory thuộc Admin/Phòng đào tạo; tuyển dụng/báo cáo QHDN thuộc Admin/Phòng QHDN. API chưa có route chỉ có nhóm dự kiến, không thể coi là quyền đã triển khai.
- Môi trường kiểm kê thiếu `JWT_SECRET` và package `exceljs` dù package đã được khai báo. Tiến trình kiểm kê dùng secret giả và stub import `exceljs` chỉ để đọc cấu trúc router; không chạy server, không gọi handler, không kết nối DB hay kiểm thử upload/import. Không thay đổi cấu hình hoặc dependency dự án.
- “Có route” chỉ xác nhận đã mount handler; chưa xác minh thành công với DB, dữ liệu nghiệp vụ hoặc dịch vụ AI.
- Swagger đặt tại `/api-docs`, JSON tại `/api-docs/openapi.json`. API có ID/bộ lọc được chuyển sang `/api/json/...`; thao tác đọc có đầu vào dùng POST với JSON body. Route cũ vẫn tồn tại. Upload CV/import có thể dùng multipart theo schema.
- Một API có thể xuất hiện ở nhiều nhóm. Tag không thay thế kiểm tra JWT, role và quyền sở hữu dữ liệu. `/api/health` công khai dù nằm trong Admin.

Tổng: **191 API trong danh mục OpenAPI tái dựng**, **179 có route gốc**, **12 chưa tìm thấy route gốc**. Có **150** ánh xạ JSON. 45 operation thiếu cấu hình nhóm hiện hành.

| Nhóm Swagger | Số API |
|---|---:|
| Admin | 152 |
| Phòng đào tạo | 83 |
| Phòng QHDN | 50 |
| Doanh nghiệp | 11 |
| Sinh viên | 46 |
| Auth | 3 |

## Admin

Quản trị và theo dõi hệ thống.

| # | Method | API trên Swagger dự kiến | Chức năng | Route gốc | Triển khai |
|---:|---|---|---|---|---|
| 1 | POST | `/api/academic-years` | Tạo năm học | `POST /api/academic-years` | Có route |
| 2 | POST | `/api/academic-periods` | Tạo kỳ học và Block 3 | `POST /api/academic-periods` | Có route |
| 3 | POST | `/api/cohorts` | Tạo khóa và nhóm | `POST /api/cohorts` | Có route |
| 4 | POST | `/api/academic/alerts/notifications` | Gửi cảnh báo học vụ | `POST /api/academic/alerts/notifications` | Có route |
| 5 | POST | `/api/accounts` | Tạo tài khoản | `POST /api/accounts` | Có route |
| 6 | PATCH | `/api/accounts/me/profile` | Cập nhật hồ sơ cá nhân | `PATCH /api/accounts/me/profile` | Có route |
| 7 | POST | `/api/combo-registration-windows` | Tạo đợt chọn hoặc xác nhận combo | `POST /api/combo-registration-windows` | Có route |
| 8 | POST | `/api/majors` | Tạo chuyên ngành | `POST /api/majors` | Có route |
| 9 | POST | `/api/courses` | Tạo môn học | `POST /api/courses` | Có route |
| 10 | POST | `/api/curriculum-imports/preview` | Kiểm tra dữ liệu nhập khung chương trình | `POST /api/curriculum-imports/preview` | Có route |
| 11 | POST | `/api/curriculum-imports/commit` | Nhập khung chương trình | `POST /api/curriculum-imports/commit` | Có route |
| 12 | POST | `/api/ojt-rule-sets` | Tạo bộ quy tắc OJT | `POST /api/ojt-rule-sets` | Có route |
| 13 | POST | `/api/eligibility-check-runs` | Kiểm tra điều kiện OJT hàng loạt | `POST /api/eligibility-check-runs` | Có route |
| 14 | POST | `/api/imports/preview` | Kiểm tra toàn bộ dữ liệu import | `POST /api/imports/preview` | Có route |
| 15 | POST | `/api/imports/commit` | Import tổng tài khoản và dữ liệu nghiệp vụ | `POST /api/imports/commit` | Có route |
| 16 | GET | `/api/imports/emails` | Trạng thái gửi email tài khoản | `GET /api/imports/emails` | Có route |
| 17 | POST | `/api/imports/archive` | Lưu trữ tuyển dụng sau hai học kỳ | `POST /api/imports/archive` | Có route |
| 18 | POST | `/api/ojt-registration-windows` | Tạo đợt đăng ký OJT | `POST /api/ojt-registration-windows` | Có route |
| 19 | POST | `/api/ojt-registrations` | Nộp hồ sơ đăng ký OJT | `POST /api/ojt-registrations` | Có route |
| 20 | POST | `/api/ojt-results` | Chuyển đánh giá và hồ sơ OJT cho phòng đào tạo | `POST /api/ojt-results` | Có route |
| 21 | POST | `/api/ojt-coordinations` | Giới thiệu sinh viên cho doanh nghiệp | `POST /api/ojt-coordinations` | Có route |
| 22 | POST | `/api/assignments` | Phân công sinh viên thực tập | `POST /api/assignments` | Có route |
| 23 | GET | `/api/health` | Kiểm tra backend và cơ sở dữ liệu | `GET /api/health` | Có route |
| 24 | GET | `/api/roles` | Danh sách vai trò | `GET /api/roles` | Có route |
| 25 | POST | `/api/assessment-templates` | Tạo bộ tiêu chí đánh giá | `POST /api/assessment-templates` | Có route |
| 26 | POST | `/api/admin/prediction-jobs` | Tạo tác vụ dự đoán | `POST /api/admin/prediction-jobs` | Có route |
| 27 | POST | `/api/recruitment/windows` | Tạo đợt nhận nhu cầu tuyển dụng | `POST /api/recruitment/windows` | Có route |
| 28 | POST | `/api/academic/academic-summary-notifications` | P1: gửi snapshot giữa kỳ cho cả scope, kể cả SV không có cảnh báo; có thể gửi thủ công trước. | `POST /api/academic/academic-summary-notifications` | Có route |
| 29 | POST | `/api/academic/eligibility-notifications` | P1: thông báo đủ/không đủ/chờ đối soát; tham chiếu snapshot/checkId và chống gửi lặp. | `POST /api/academic/eligibility-notifications` | Có route |
| 30 | POST | `/api/json/academic-years/list` | Danh sách năm học | `GET /api/academic-years` | Có route |
| 31 | PATCH | `/api/json/academic-years` | Cập nhật năm học | `PATCH /api/academic-years/{id}` | Có route |
| 32 | POST | `/api/json/academic-periods/list` | Danh sách kỳ học và Block 3 | `GET /api/academic-periods` | Có route |
| 33 | PATCH | `/api/json/academic-periods` | Cập nhật kỳ học và Block 3 | `PATCH /api/academic-periods/{id}` | Có route |
| 34 | POST | `/api/json/cohorts/list` | Danh sách khóa và nhóm | `GET /api/cohorts` | Có route |
| 35 | PATCH | `/api/json/cohorts` | Cập nhật khóa và nhóm | `PATCH /api/cohorts/{id}` | Có route |
| 36 | POST | `/api/json/academic-periods/combo-phase-schedules/list` | Xem mốc chọn và xác nhận combo | `GET /api/academic-periods/{id}/combo-phase-schedules` | Có route |
| 37 | PUT | `/api/json/academic-periods/combo-phase-schedules` | Thiết lập mốc chọn và xác nhận combo | `PUT /api/academic-periods/{id}/combo-phase-schedules` | Có route |
| 38 | POST | `/api/json/ojt-semesters/assessment-window/search` | Xem đợt xét điều kiện chính thức | `GET /api/ojt-semesters/{id}/assessment-window` | Có route |
| 39 | PUT | `/api/json/ojt-semesters/assessment-window` | Thiết lập đợt xét điều kiện chính thức | `PUT /api/ojt-semesters/{id}/assessment-window` | Có route |
| 40 | POST | `/api/json/ojt-semesters/assessment-window/open` | Mở xét điều kiện chính thức | `POST /api/ojt-semesters/{id}/assessment-window/open` | Có route |
| 41 | POST | `/api/json/ojt-semesters/assessment-window/close` | Đóng xét điều kiện chính thức | `POST /api/ojt-semesters/{id}/assessment-window/close` | Có route |
| 42 | POST | `/api/json/curricula/ojt-grade-mappings/detail` | Xem quy đổi điểm môn OJT | `GET /api/curricula/{id}/ojt-grade-mappings/{semesterId}` | Có route |
| 43 | PUT | `/api/json/curricula/ojt-grade-mappings` | Thiết lập quy đổi điểm môn OJT | `PUT /api/curricula/{id}/ojt-grade-mappings/{semesterId}` | Có route |
| 44 | POST | `/api/json/ojt-registration-windows/semester-exceptions` | Thêm ngoại lệ kỳ đăng ký OJT | `POST /api/ojt-registration-windows/{id}/semester-exceptions` | Có route |
| 45 | POST | `/api/json/ojt-registration-windows/semester-exceptions/revoke` | Thu hồi ngoại lệ kỳ đăng ký OJT | `POST /api/ojt-registration-windows/{id}/semester-exceptions/{exceptionId}/revoke` | Có route |
| 46 | POST | `/api/json/combo-registration-windows/preview` | Xem ảnh hưởng của combo dự kiến | `POST /api/combo-registration-windows/{id}/preview` | Có route |
| 47 | POST | `/api/json/academic/dashboard/search` | Tổng quan và thống kê điều kiện OJT | `GET /api/academic/dashboard` | Có route |
| 48 | POST | `/api/json/academic/alerts/list` | Danh sách cảnh báo thiếu điều kiện OJT | `GET /api/academic/alerts` | Có route |
| 49 | POST | `/api/json/academic/course-demand/list` | Thống kê nhu cầu học môn còn thiếu | `GET /api/academic/course-demand` | Có route |
| 50 | POST | `/api/json/academic/course-demand/export` | Xuất nhu cầu học theo môn, kỳ và Block | `GET /api/academic/course-demand/export` | Có route |
| 51 | POST | `/api/json/accounts/list` | Danh sách tài khoản | `GET /api/accounts` | Có route |
| 52 | PATCH | `/api/json/accounts` | Cập nhật tài khoản | `PATCH /api/accounts/{userId}` | Có route |
| 53 | POST | `/api/json/combo-registration-windows/list` | Danh sách đợt chọn combo | `GET /api/combo-registration-windows` | Có route |
| 54 | PATCH | `/api/json/combo-registration-windows` | Cập nhật hoặc mở/đóng đợt chọn combo | `PATCH /api/combo-registration-windows/{id}` | Có route |
| 55 | POST | `/api/json/combo-registration-windows/extensions` | Gia hạn chọn combo | `POST /api/combo-registration-windows/{id}/extensions` | Có route |
| 56 | POST | `/api/json/combo-registration-windows/selections/list` | Theo dõi lựa chọn combo | `GET /api/combo-registration-windows/{id}/selections` | Có route |
| 57 | POST | `/api/json/combo-registration-windows/selections` | Gửi lựa chọn combo | `POST /api/combo-registration-windows/{id}/selections` | Có route |
| 58 | POST | `/api/json/combo-registration-windows/reminders` | Gửi nhắc chọn combo | `POST /api/combo-registration-windows/{id}/reminders` | Có route |
| 59 | POST | `/api/json/students/combo-selections/list` | Lịch sử lựa chọn combo của sinh viên | `GET /api/students/{id}/combo-selections` | Có route |
| 60 | POST | `/api/json/combo-registration-windows/finalize` | Chốt lựa chọn combo | `POST /api/combo-registration-windows/{id}/finalize` | Có route |
| 61 | POST | `/api/json/majors/list` | Danh sách chuyên ngành | `GET /api/majors` | Có route |
| 62 | POST | `/api/json/courses/list` | Danh sách môn học | `GET /api/courses` | Có route |
| 63 | POST | `/api/json/curricula/list` | Danh sách chương trình đào tạo đã nhập | `GET /api/curricula` | Có route |
| 64 | PATCH | `/api/json/courses` | Cập nhật môn học | `PATCH /api/courses/{id}` | Có route |
| 65 | POST | `/api/json/curricula/detail` | Chi tiết chương trình đào tạo | `GET /api/curricula/{id}` | Có route |
| 66 | POST | `/api/json/ojt-rule-sets/list` | Danh sách bộ quy tắc OJT | `GET /api/ojt-rule-sets` | Có route |
| 67 | PATCH | `/api/json/ojt-rule-sets` | Sửa bộ quy tắc chưa ban hành | `PATCH /api/ojt-rule-sets/{id}` | Có route |
| 68 | POST | `/api/json/ojt-rule-sets/publish` | Ban hành bộ quy tắc OJT | `POST /api/ojt-rule-sets/{id}/publish` | Có route |
| 69 | POST | `/api/json/students/eligibility-checks/list` | Lịch sử kiểm tra điều kiện OJT | `GET /api/students/{id}/eligibility-checks` | Có route |
| 70 | POST | `/api/json/students/eligibility-checks` | Kiểm tra điều kiện OJT của sinh viên | `POST /api/students/{id}/eligibility-checks` | Có route |
| 71 | POST | `/api/json/students/eligibility/search` | Kết quả OJT và điều kiện còn thiếu | `GET /api/students/{id}/eligibility` | Có route |
| 72 | POST | `/api/json/eligibility-checks/confirm` | Xác nhận kết quả xét điều kiện OJT | `POST /api/eligibility-checks/{id}/confirm` | Có route |
| 73 | POST | `/api/json/eligibility-check-runs/detail` | Tiến độ và kết quả kiểm tra hàng loạt | `GET /api/eligibility-check-runs/{id}` | Có route |
| 74 | POST | `/api/json/imports/emails/retry` | Gửi lại email bị lỗi | `POST /api/imports/emails/{emailId}/retry` | Có route |
| 75 | POST | `/api/json/ojt-registration-windows/list` | Danh sách đợt đăng ký OJT | `GET /api/ojt-registration-windows` | Có route |
| 76 | PATCH | `/api/json/ojt-registration-windows` | Cập nhật hoặc mở/đóng đợt đăng ký OJT | `PATCH /api/ojt-registration-windows/{id}` | Có route |
| 77 | POST | `/api/json/ojt-registrations/list` | Danh sách hồ sơ đăng ký OJT | `GET /api/ojt-registrations` | Có route |
| 78 | POST | `/api/json/ojt-registrations/review` | Duyệt hoặc từ chối hồ sơ OJT | `POST /api/ojt-registrations/{id}/review` | Có route |
| 79 | POST | `/api/json/ojt-semesters/eligible-student-handoffs/list` | Lịch sử bàn giao sinh viên cho QHDN | `GET /api/ojt-semesters/{id}/eligible-student-handoffs` | Có route |
| 80 | POST | `/api/json/ojt-semesters/eligible-student-handoffs` | Bàn giao sinh viên đủ điều kiện cho QHDN | `POST /api/ojt-semesters/{id}/eligible-student-handoffs` | Có route |
| 81 | POST | `/api/json/ojt-semesters/students/list` | Theo dõi trạng thái OJT theo kỳ | `GET /api/ojt-semesters/{id}/students` | Có route |
| 82 | POST | `/api/json/ojt-results/list` | Danh sách kết quả OJT đã chuyển | `GET /api/ojt-results` | Có route |
| 83 | PATCH | `/api/json/ojt-results` | Cập nhật điểm và kết quả OJT chính thức | `PATCH /api/ojt-results/{id}` | Có route |
| 84 | POST | `/api/json/ojt-results/revision-requests` | Yêu cầu bổ sung hồ sơ kết quả OJT | `POST /api/ojt-results/{id}/revision-requests` | Có route |
| 85 | POST | `/api/json/ojt-results/transfer` | Gửi lại hồ sơ OJT đã bổ sung | `POST /api/ojt-results/{id}/transfer` | Có route |
| 86 | POST | `/api/json/ojt-results/confirm` | Xác nhận kết quả OJT | `POST /api/ojt-results/{id}/confirm` | Có route |
| 87 | POST | `/api/json/ojt-semesters/results/export` | Xuất báo cáo kết quả OJT theo kỳ | `GET /api/ojt-semesters/{id}/results/export` | Có route |
| 88 | POST | `/api/json/companies/list` | Danh sách và hồ sơ doanh nghiệp | `GET /api/companies` | Có route |
| 89 | PATCH | `/api/json/companies` | Cập nhật doanh nghiệp | `PATCH /api/companies/{id}` | Có route |
| 90 | DELETE | `/api/json/companies` | Xóa doanh nghiệp | `DELETE /api/companies/{id}` | Có route |
| 91 | POST | `/api/json/positions/list` | Danh sách và hồ sơ vị trí thực tập | `GET /api/positions` | Có route |
| 92 | POST | `/api/json/ojt-coordinations/list` | Danh sách và hồ sơ điều phối | `GET /api/ojt-coordinations` | Có route |
| 93 | POST | `/api/json/assignments/list` | Danh sách và hồ sơ phân công thực tập | `GET /api/assignments` | Có route |
| 94 | PATCH | `/api/json/assignments` | Cập nhật thông tin và trạng thái thực tập | `PATCH /api/assignments/{id}` | Có route |
| 95 | POST | `/api/json/internship-evaluations/list` | Danh sách đánh giá thực tập | `GET /api/internship-evaluations` | Có route |
| 96 | POST | `/api/json/ojt-coordinations/decision` | Ghi nhận quyết định tiếp nhận sinh viên | `POST /api/ojt-coordinations/{id}/decision` | Có route |
| 97 | POST | `/api/json/ojt-coordinations/reassign` | Điều phối lại sinh viên | `POST /api/ojt-coordinations/{id}/reassign` | Có route |
| 98 | PUT | `/api/json/assignments/internship-evaluation` | Ghi nhận đánh giá thực tập | `PUT /api/assignments/{id}/internship-evaluation` | Có route |
| 99 | POST | `/api/json/qhdn/registered-students/list` | Xem sinh viên đã đăng ký OJT | `GET /api/qhdn/registered-students` | Có route |
| 100 | POST | `/api/json/qhdn/dashboard/search` | Tổng quan QHDN | `GET /api/qhdn/dashboard` | Có route |
| 101 | POST | `/api/json/qhdn/reports/export` | Xuất báo cáo QHDN | `GET /api/qhdn/reports/export` | Có route |
| 102 | POST | `/api/json/qhdn/reports/list` | Báo cáo QHDN theo loại | `GET /api/qhdn/reports` | Có route |
| 103 | POST | `/api/json/students/list` | Tìm kiếm và lọc sinh viên | `GET /api/students` | Có route |
| 104 | POST | `/api/json/students/detail` | Hồ sơ học vụ tổng hợp | `GET /api/students/{id}` | Có route |
| 105 | PATCH | `/api/json/students` | Cập nhật hồ sơ và lộ trình học vụ | `PATCH /api/students/{id}` | Có route |
| 106 | DELETE | `/api/json/students` | Xóa hồ sơ sinh viên | `DELETE /api/students/{id}` | Có route |
| 107 | POST | `/api/json/students/course-results/list` | Điểm, lần học và trạng thái môn | `GET /api/students/{id}/course-results` | Có route |
| 108 | PATCH | `/api/json/course-results` | Sửa kết quả học tập và ghi lý do | `PATCH /api/course-results/{id}` | Có route |
| 109 | POST | `/api/json/academic-imports/list` | Lịch sử nhập dữ liệu học vụ | `GET /api/academic-imports` | Có route |
| 110 | POST | `/api/json/auth/users/password-reset` | Đặt lại mật khẩu | `POST /api/auth/users/{userId}/password-reset` | Có route |
| 111 | POST | `/api/json/admin/dashboard/search` | Tổng quan hệ thống và thống kê dự đoán | `GET /api/admin/dashboard` | Có route |
| 112 | POST | `/api/json/students/export` | Xuất danh sách sinh viên | `GET /api/students/export` | Có route |
| 113 | DELETE | `/api/json/positions` | Xóa vị trí thực tập | `DELETE /api/positions/{id}` | Có route |
| 114 | POST | `/api/json/assessment-templates/list` | Danh sách và hồ sơ bộ tiêu chí đánh giá | `GET /api/assessment-templates` | Có route |
| 115 | PATCH | `/api/json/assessment-templates` | Sửa bộ tiêu chí đánh giá | `PATCH /api/assessment-templates/{id}` | Có route |
| 116 | POST | `/api/json/assessment-templates/publish` | Ban hành bộ tiêu chí đánh giá | `POST /api/assessment-templates/{id}/publish` | Có route |
| 117 | POST | `/api/json/admin/prediction-jobs/detail` | Tiến độ dự đoán và lỗi theo sinh viên | `GET /api/admin/prediction-jobs/{id}` | Có route |
| 118 | POST | `/api/json/predictions/list` | Lịch sử dự đoán | `GET /api/predictions` | Có route |
| 119 | POST | `/api/json/admin/models/list` | Danh sách và hồ sơ phiên bản mô hình | `GET /api/admin/models` | Có route |
| 120 | POST | `/api/json/alerts/list` | Danh sách và hồ sơ cảnh báo rủi ro | `GET /api/alerts` | Có route |
| 121 | PATCH | `/api/json/alerts/status` | Tiếp nhận hoặc đóng cảnh báo | `PATCH /api/alerts/{id}/status` | Có route |
| 122 | POST | `/api/json/alerts/interventions` | Tạo hoạt động hỗ trợ sinh viên | `POST /api/alerts/{id}/interventions` | Có route |
| 123 | POST | `/api/json/students/interventions/list` | Lịch sử hỗ trợ sinh viên | `GET /api/students/{id}/interventions` | Có route |
| 124 | PATCH | `/api/json/interventions` | Cập nhật hoạt động hỗ trợ | `PATCH /api/interventions/{id}` | Có route |
| 125 | POST | `/api/json/admin/reports/readiness/list` | Báo cáo mức sẵn sàng và rủi ro | `GET /api/admin/reports/readiness` | Có route |
| 126 | POST | `/api/json/admin/reports/export` | Xuất báo cáo dự đoán | `GET /api/admin/reports/export` | Có route |
| 127 | POST | `/api/json/admin/audit-logs/list` | Nhật ký hoạt động hệ thống | `GET /api/admin/audit-logs` | Có route |
| 128 | POST | `/api/json/recruitment/windows/list` | Danh sách đợt tuyển dụng theo học kỳ | `GET /api/recruitment/windows` | Có route |
| 129 | PATCH | `/api/json/recruitment/windows` | Cập nhật hoặc mở/đóng đợt tuyển dụng | `PATCH /api/recruitment/windows/{id}` | Có route |
| 130 | POST | `/api/json/recruitment/posts/list` | Danh sách tin tuyển dụng | `GET /api/recruitment/posts` | Có route |
| 131 | PATCH | `/api/json/recruitment/posts` | Sửa tin và vị trí tuyển dụng | `PATCH /api/recruitment/posts/{id}` | Có route |
| 132 | POST | `/api/json/recruitment/posts/review` | Duyệt hoặc từ chối tin tuyển dụng | `POST /api/recruitment/posts/{id}/review` | Có route |
| 133 | POST | `/api/json/recruitment/posts/close` | Đóng tin tuyển dụng | `POST /api/recruitment/posts/{id}/close` | Có route |
| 134 | POST | `/api/json/academic-periods/ojt-advisory-schedule/search` | P2 nếu tự động: xem lịch thông báo giữa kỳ và deadline. | `GET /api/academic-periods/{id}/ojt-advisory-schedule` | Có route |
| 135 | PUT | `/api/json/academic-periods/ojt-advisory-schedule` | P2 nếu tự động: cấu hình lịch theo kỳ thực, worker thực thi. | `PUT /api/academic-periods/{id}/ojt-advisory-schedule` | Có route |
| 136 | POST | `/api/json/academic/advisory-runs/list` | P2: lịch sử batch thông báo khi có worker. | `GET /api/academic/advisory-runs` | Có route |
| 137 | POST | `/api/json/academic/advisory-runs/detail` | P2: trạng thái/lỗi từng sinh viên. | `GET /api/academic/advisory-runs/{id}` | Có route |
| 138 | POST | `/api/json/company-imports/list` | P1: lịch sử import doanh nghiệp theo kỳ; tái sử dụng bảng import đã có. | `GET /api/company-imports` | **Chỉ OpenAPI, chưa có route** |
| 139 | POST | `/api/json/company-imports/detail` | P1: nguồn sheet, mapping, kết quả từng dòng/lỗi; cần lưu bổ sung metadata nếu schema chưa có. | `GET /api/company-imports/{id}` | **Chỉ OpenAPI, chưa có route** |
| 140 | POST | `/api/json/recruitment-posts/list` | P1: dữ liệu công bố được tạo từ sheet; không phải DN tự đăng tin. | `GET /api/recruitment-posts` | **Chỉ OpenAPI, chưa có route** |
| 141 | POST | `/api/json/recruitment-posts/detail` | P1: QHDN kiểm tra vị trí/nội dung/kỳ/deadline trước công bố. | `GET /api/recruitment-posts/{id}` | **Chỉ OpenAPI, chưa có route** |
| 142 | PATCH | `/api/json/recruitment-posts` | P1: QHDN đính chính nội dung/deadline, đồng bộ với vị trí khi cần; không cấp quyền DN. | `PATCH /api/recruitment-posts/{id}` | **Chỉ OpenAPI, chưa có route** |
| 143 | POST | `/api/json/recruitment-posts/publish` | P1: QHDN duyệt công bố bản import. Cần vì import hiện tạo PENDING_REVIEW. | `POST /api/recruitment-posts/{id}/publish` | **Chỉ OpenAPI, chưa có route** |
| 144 | POST | `/api/json/recruitment-posts/close` | P1: QHDN đóng công bố. Không đề xuất POST tạo tin thủ công/DN. | `POST /api/recruitment-posts/{id}/close` | **Chỉ OpenAPI, chưa có route** |
| 145 | POST | `/api/json/job-applications/list` | Danh sách hồ sơ ứng tuyển doanh nghiệp | `GET /api/job-applications` | Có route |
| 146 | POST | `/api/json/job-applications/detail` | P1: hồ sơ/đơn cho QHDN; DN chỉ khi đã được điều phối đến DN mình. | `GET /api/job-applications/{id}` | **Chỉ OpenAPI, chưa có route** |
| 147 | POST | `/api/json/job-applications/cv/search` | P1: tải CV private bằng quyền của đơn; DN chỉ hồ sơ được gửi cho mình. | `GET /api/job-applications/{id}/cv` | **Chỉ OpenAPI, chưa có route** |
| 148 | POST | `/api/json/qhdn/reports/acceptance/list` | P2: tiếp nhận/từ chối | `GET /api/qhdn/reports/acceptance` | **Chỉ OpenAPI, chưa có route** |
| 149 | POST | `/api/json/qhdn/reports/internships/list` | P2: đang thực tập/hoàn thành/kết quả | `GET /api/qhdn/reports/internships` | **Chỉ OpenAPI, chưa có route** |
| 150 | POST | `/api/json/qhdn/reports/enterprise-feedback/list` | P2: tổng hợp đánh giá DN, không bao hàm module khảo sát mới | `GET /api/qhdn/reports/enterprise-feedback` | **Chỉ OpenAPI, chưa có route** |
| 151 | POST | `/api/json/students/cv/search` | Tải CV của sinh viên | `GET /api/students/{id}/cv` | Có route |
| 152 | POST | `/api/json/internship-tasks/list` | Danh sách task trong phạm vi tài khoản | `GET /api/internship-tasks` | Có route |

## Phòng đào tạo

Quản lý học vụ và xét điều kiện OJT.

| # | Method | API trên Swagger dự kiến | Chức năng | Route gốc | Triển khai |
|---:|---|---|---|---|---|
| 1 | POST | `/api/academic-years` | Tạo năm học | `POST /api/academic-years` | Có route |
| 2 | POST | `/api/academic-periods` | Tạo kỳ học và Block 3 | `POST /api/academic-periods` | Có route |
| 3 | POST | `/api/cohorts` | Tạo khóa và nhóm | `POST /api/cohorts` | Có route |
| 4 | POST | `/api/academic/alerts/notifications` | Gửi cảnh báo học vụ | `POST /api/academic/alerts/notifications` | Có route |
| 5 | PATCH | `/api/accounts/me/profile` | Cập nhật hồ sơ cá nhân | `PATCH /api/accounts/me/profile` | Có route |
| 6 | POST | `/api/combo-registration-windows` | Tạo đợt chọn hoặc xác nhận combo | `POST /api/combo-registration-windows` | Có route |
| 7 | POST | `/api/majors` | Tạo chuyên ngành | `POST /api/majors` | Có route |
| 8 | POST | `/api/courses` | Tạo môn học | `POST /api/courses` | Có route |
| 9 | POST | `/api/curriculum-imports/preview` | Kiểm tra dữ liệu nhập khung chương trình | `POST /api/curriculum-imports/preview` | Có route |
| 10 | POST | `/api/curriculum-imports/commit` | Nhập khung chương trình | `POST /api/curriculum-imports/commit` | Có route |
| 11 | POST | `/api/ojt-rule-sets` | Tạo bộ quy tắc OJT | `POST /api/ojt-rule-sets` | Có route |
| 12 | POST | `/api/eligibility-check-runs` | Kiểm tra điều kiện OJT hàng loạt | `POST /api/eligibility-check-runs` | Có route |
| 13 | POST | `/api/imports/preview` | Kiểm tra toàn bộ dữ liệu import | `POST /api/imports/preview` | Có route |
| 14 | POST | `/api/imports/commit` | Import tổng tài khoản và dữ liệu nghiệp vụ | `POST /api/imports/commit` | Có route |
| 15 | POST | `/api/ojt-registration-windows` | Tạo đợt đăng ký OJT | `POST /api/ojt-registration-windows` | Có route |
| 16 | POST | `/api/ojt-registrations` | Nộp hồ sơ đăng ký OJT | `POST /api/ojt-registrations` | Có route |
| 17 | POST | `/api/academic/academic-summary-notifications` | P1: gửi snapshot giữa kỳ cho cả scope, kể cả SV không có cảnh báo; có thể gửi thủ công trước. | `POST /api/academic/academic-summary-notifications` | Có route |
| 18 | POST | `/api/academic/eligibility-notifications` | P1: thông báo đủ/không đủ/chờ đối soát; tham chiếu snapshot/checkId và chống gửi lặp. | `POST /api/academic/eligibility-notifications` | Có route |
| 19 | POST | `/api/json/academic-years/list` | Danh sách năm học | `GET /api/academic-years` | Có route |
| 20 | PATCH | `/api/json/academic-years` | Cập nhật năm học | `PATCH /api/academic-years/{id}` | Có route |
| 21 | POST | `/api/json/academic-periods/list` | Danh sách kỳ học và Block 3 | `GET /api/academic-periods` | Có route |
| 22 | PATCH | `/api/json/academic-periods` | Cập nhật kỳ học và Block 3 | `PATCH /api/academic-periods/{id}` | Có route |
| 23 | POST | `/api/json/cohorts/list` | Danh sách khóa và nhóm | `GET /api/cohorts` | Có route |
| 24 | PATCH | `/api/json/cohorts` | Cập nhật khóa và nhóm | `PATCH /api/cohorts/{id}` | Có route |
| 25 | POST | `/api/json/academic-periods/combo-phase-schedules/list` | Xem mốc chọn và xác nhận combo | `GET /api/academic-periods/{id}/combo-phase-schedules` | Có route |
| 26 | PUT | `/api/json/academic-periods/combo-phase-schedules` | Thiết lập mốc chọn và xác nhận combo | `PUT /api/academic-periods/{id}/combo-phase-schedules` | Có route |
| 27 | POST | `/api/json/ojt-semesters/assessment-window/search` | Xem đợt xét điều kiện chính thức | `GET /api/ojt-semesters/{id}/assessment-window` | Có route |
| 28 | PUT | `/api/json/ojt-semesters/assessment-window` | Thiết lập đợt xét điều kiện chính thức | `PUT /api/ojt-semesters/{id}/assessment-window` | Có route |
| 29 | POST | `/api/json/ojt-semesters/assessment-window/open` | Mở xét điều kiện chính thức | `POST /api/ojt-semesters/{id}/assessment-window/open` | Có route |
| 30 | POST | `/api/json/ojt-semesters/assessment-window/close` | Đóng xét điều kiện chính thức | `POST /api/ojt-semesters/{id}/assessment-window/close` | Có route |
| 31 | POST | `/api/json/curricula/ojt-grade-mappings/detail` | Xem quy đổi điểm môn OJT | `GET /api/curricula/{id}/ojt-grade-mappings/{semesterId}` | Có route |
| 32 | PUT | `/api/json/curricula/ojt-grade-mappings` | Thiết lập quy đổi điểm môn OJT | `PUT /api/curricula/{id}/ojt-grade-mappings/{semesterId}` | Có route |
| 33 | POST | `/api/json/ojt-registration-windows/semester-exceptions` | Thêm ngoại lệ kỳ đăng ký OJT | `POST /api/ojt-registration-windows/{id}/semester-exceptions` | Có route |
| 34 | POST | `/api/json/ojt-registration-windows/semester-exceptions/revoke` | Thu hồi ngoại lệ kỳ đăng ký OJT | `POST /api/ojt-registration-windows/{id}/semester-exceptions/{exceptionId}/revoke` | Có route |
| 35 | POST | `/api/json/combo-registration-windows/preview` | Xem ảnh hưởng của combo dự kiến | `POST /api/combo-registration-windows/{id}/preview` | Có route |
| 36 | POST | `/api/json/academic/dashboard/search` | Tổng quan và thống kê điều kiện OJT | `GET /api/academic/dashboard` | Có route |
| 37 | POST | `/api/json/academic/alerts/list` | Danh sách cảnh báo thiếu điều kiện OJT | `GET /api/academic/alerts` | Có route |
| 38 | POST | `/api/json/academic/course-demand/list` | Thống kê nhu cầu học môn còn thiếu | `GET /api/academic/course-demand` | Có route |
| 39 | POST | `/api/json/academic/course-demand/export` | Xuất nhu cầu học theo môn, kỳ và Block | `GET /api/academic/course-demand/export` | Có route |
| 40 | POST | `/api/json/combo-registration-windows/list` | Danh sách đợt chọn combo | `GET /api/combo-registration-windows` | Có route |
| 41 | PATCH | `/api/json/combo-registration-windows` | Cập nhật hoặc mở/đóng đợt chọn combo | `PATCH /api/combo-registration-windows/{id}` | Có route |
| 42 | POST | `/api/json/combo-registration-windows/extensions` | Gia hạn chọn combo | `POST /api/combo-registration-windows/{id}/extensions` | Có route |
| 43 | POST | `/api/json/combo-registration-windows/selections/list` | Theo dõi lựa chọn combo | `GET /api/combo-registration-windows/{id}/selections` | Có route |
| 44 | POST | `/api/json/combo-registration-windows/selections` | Gửi lựa chọn combo | `POST /api/combo-registration-windows/{id}/selections` | Có route |
| 45 | POST | `/api/json/combo-registration-windows/reminders` | Gửi nhắc chọn combo | `POST /api/combo-registration-windows/{id}/reminders` | Có route |
| 46 | POST | `/api/json/students/combo-selections/list` | Lịch sử lựa chọn combo của sinh viên | `GET /api/students/{id}/combo-selections` | Có route |
| 47 | POST | `/api/json/combo-registration-windows/finalize` | Chốt lựa chọn combo | `POST /api/combo-registration-windows/{id}/finalize` | Có route |
| 48 | POST | `/api/json/majors/list` | Danh sách chuyên ngành | `GET /api/majors` | Có route |
| 49 | POST | `/api/json/courses/list` | Danh sách môn học | `GET /api/courses` | Có route |
| 50 | POST | `/api/json/curricula/list` | Danh sách chương trình đào tạo đã nhập | `GET /api/curricula` | Có route |
| 51 | PATCH | `/api/json/courses` | Cập nhật môn học | `PATCH /api/courses/{id}` | Có route |
| 52 | POST | `/api/json/curricula/detail` | Chi tiết chương trình đào tạo | `GET /api/curricula/{id}` | Có route |
| 53 | POST | `/api/json/ojt-rule-sets/list` | Danh sách bộ quy tắc OJT | `GET /api/ojt-rule-sets` | Có route |
| 54 | PATCH | `/api/json/ojt-rule-sets` | Sửa bộ quy tắc chưa ban hành | `PATCH /api/ojt-rule-sets/{id}` | Có route |
| 55 | POST | `/api/json/ojt-rule-sets/publish` | Ban hành bộ quy tắc OJT | `POST /api/ojt-rule-sets/{id}/publish` | Có route |
| 56 | POST | `/api/json/students/eligibility-checks/list` | Lịch sử kiểm tra điều kiện OJT | `GET /api/students/{id}/eligibility-checks` | Có route |
| 57 | POST | `/api/json/students/eligibility-checks` | Kiểm tra điều kiện OJT của sinh viên | `POST /api/students/{id}/eligibility-checks` | Có route |
| 58 | POST | `/api/json/students/eligibility/search` | Kết quả OJT và điều kiện còn thiếu | `GET /api/students/{id}/eligibility` | Có route |
| 59 | POST | `/api/json/eligibility-checks/confirm` | Xác nhận kết quả xét điều kiện OJT | `POST /api/eligibility-checks/{id}/confirm` | Có route |
| 60 | POST | `/api/json/eligibility-check-runs/detail` | Tiến độ và kết quả kiểm tra hàng loạt | `GET /api/eligibility-check-runs/{id}` | Có route |
| 61 | POST | `/api/json/ojt-registration-windows/list` | Danh sách đợt đăng ký OJT | `GET /api/ojt-registration-windows` | Có route |
| 62 | PATCH | `/api/json/ojt-registration-windows` | Cập nhật hoặc mở/đóng đợt đăng ký OJT | `PATCH /api/ojt-registration-windows/{id}` | Có route |
| 63 | POST | `/api/json/ojt-registrations/list` | Danh sách hồ sơ đăng ký OJT | `GET /api/ojt-registrations` | Có route |
| 64 | POST | `/api/json/ojt-registrations/review` | Duyệt hoặc từ chối hồ sơ OJT | `POST /api/ojt-registrations/{id}/review` | Có route |
| 65 | POST | `/api/json/ojt-semesters/eligible-student-handoffs/list` | Lịch sử bàn giao sinh viên cho QHDN | `GET /api/ojt-semesters/{id}/eligible-student-handoffs` | Có route |
| 66 | POST | `/api/json/ojt-semesters/eligible-student-handoffs` | Bàn giao sinh viên đủ điều kiện cho QHDN | `POST /api/ojt-semesters/{id}/eligible-student-handoffs` | Có route |
| 67 | POST | `/api/json/ojt-semesters/students/list` | Theo dõi trạng thái OJT theo kỳ | `GET /api/ojt-semesters/{id}/students` | Có route |
| 68 | POST | `/api/json/ojt-results/list` | Danh sách kết quả OJT đã chuyển | `GET /api/ojt-results` | Có route |
| 69 | PATCH | `/api/json/ojt-results` | Cập nhật điểm và kết quả OJT chính thức | `PATCH /api/ojt-results/{id}` | Có route |
| 70 | POST | `/api/json/ojt-results/revision-requests` | Yêu cầu bổ sung hồ sơ kết quả OJT | `POST /api/ojt-results/{id}/revision-requests` | Có route |
| 71 | POST | `/api/json/ojt-results/confirm` | Xác nhận kết quả OJT | `POST /api/ojt-results/{id}/confirm` | Có route |
| 72 | POST | `/api/json/ojt-semesters/results/export` | Xuất báo cáo kết quả OJT theo kỳ | `GET /api/ojt-semesters/{id}/results/export` | Có route |
| 73 | POST | `/api/json/students/list` | Tìm kiếm và lọc sinh viên | `GET /api/students` | Có route |
| 74 | POST | `/api/json/students/detail` | Hồ sơ học vụ tổng hợp | `GET /api/students/{id}` | Có route |
| 75 | PATCH | `/api/json/students` | Cập nhật hồ sơ và lộ trình học vụ | `PATCH /api/students/{id}` | Có route |
| 76 | POST | `/api/json/students/course-results/list` | Điểm, lần học và trạng thái môn | `GET /api/students/{id}/course-results` | Có route |
| 77 | PATCH | `/api/json/course-results` | Sửa kết quả học tập và ghi lý do | `PATCH /api/course-results/{id}` | Có route |
| 78 | POST | `/api/json/academic-imports/list` | Lịch sử nhập dữ liệu học vụ | `GET /api/academic-imports` | Có route |
| 79 | POST | `/api/json/academic-periods/ojt-advisory-schedule/search` | P2 nếu tự động: xem lịch thông báo giữa kỳ và deadline. | `GET /api/academic-periods/{id}/ojt-advisory-schedule` | Có route |
| 80 | PUT | `/api/json/academic-periods/ojt-advisory-schedule` | P2 nếu tự động: cấu hình lịch theo kỳ thực, worker thực thi. | `PUT /api/academic-periods/{id}/ojt-advisory-schedule` | Có route |
| 81 | POST | `/api/json/academic/advisory-runs/list` | P2: lịch sử batch thông báo khi có worker. | `GET /api/academic/advisory-runs` | Có route |
| 82 | POST | `/api/json/academic/advisory-runs/detail` | P2: trạng thái/lỗi từng sinh viên. | `GET /api/academic/advisory-runs/{id}` | Có route |
| 83 | POST | `/api/json/students/cv/search` | Tải CV của sinh viên | `GET /api/students/{id}/cv` | Có route |

## Phòng QHDN

Quản lý tuyển dụng, điều phối và thực tập.

| # | Method | API trên Swagger dự kiến | Chức năng | Route gốc | Triển khai |
|---:|---|---|---|---|---|
| 1 | PATCH | `/api/accounts/me/profile` | Cập nhật hồ sơ cá nhân | `PATCH /api/accounts/me/profile` | Có route |
| 2 | POST | `/api/imports/preview` | Kiểm tra toàn bộ dữ liệu import | `POST /api/imports/preview` | Có route |
| 3 | POST | `/api/imports/commit` | Import tổng tài khoản và dữ liệu nghiệp vụ | `POST /api/imports/commit` | Có route |
| 4 | POST | `/api/imports/archive` | Lưu trữ tuyển dụng sau hai học kỳ | `POST /api/imports/archive` | Có route |
| 5 | POST | `/api/ojt-results` | Chuyển đánh giá và hồ sơ OJT cho phòng đào tạo | `POST /api/ojt-results` | Có route |
| 6 | POST | `/api/ojt-coordinations` | Giới thiệu sinh viên cho doanh nghiệp | `POST /api/ojt-coordinations` | Có route |
| 7 | POST | `/api/assignments` | Phân công sinh viên thực tập | `POST /api/assignments` | Có route |
| 8 | POST | `/api/recruitment/windows` | Tạo đợt nhận nhu cầu tuyển dụng | `POST /api/recruitment/windows` | Có route |
| 9 | POST | `/api/json/academic-periods/list` | Danh sách kỳ học và Block 3 | `GET /api/academic-periods` | Có route |
| 10 | POST | `/api/json/ojt-registrations/list` | Danh sách hồ sơ đăng ký OJT | `GET /api/ojt-registrations` | Có route |
| 11 | POST | `/api/json/ojt-semesters/eligible-student-handoffs/list` | Lịch sử bàn giao sinh viên cho QHDN | `GET /api/ojt-semesters/{id}/eligible-student-handoffs` | Có route |
| 12 | POST | `/api/json/ojt-semesters/students/list` | Theo dõi trạng thái OJT theo kỳ | `GET /api/ojt-semesters/{id}/students` | Có route |
| 13 | POST | `/api/json/ojt-results/list` | Danh sách kết quả OJT đã chuyển | `GET /api/ojt-results` | Có route |
| 14 | POST | `/api/json/ojt-results/transfer` | Gửi lại hồ sơ OJT đã bổ sung | `POST /api/ojt-results/{id}/transfer` | Có route |
| 15 | POST | `/api/json/ojt-semesters/results/export` | Xuất báo cáo kết quả OJT theo kỳ | `GET /api/ojt-semesters/{id}/results/export` | Có route |
| 16 | POST | `/api/json/companies/list` | Danh sách và hồ sơ doanh nghiệp | `GET /api/companies` | Có route |
| 17 | PATCH | `/api/json/companies` | Cập nhật doanh nghiệp | `PATCH /api/companies/{id}` | Có route |
| 18 | POST | `/api/json/positions/list` | Danh sách và hồ sơ vị trí thực tập | `GET /api/positions` | Có route |
| 19 | POST | `/api/json/ojt-coordinations/list` | Danh sách và hồ sơ điều phối | `GET /api/ojt-coordinations` | Có route |
| 20 | POST | `/api/json/assignments/list` | Danh sách và hồ sơ phân công thực tập | `GET /api/assignments` | Có route |
| 21 | PATCH | `/api/json/assignments` | Cập nhật thông tin và trạng thái thực tập | `PATCH /api/assignments/{id}` | Có route |
| 22 | POST | `/api/json/internship-evaluations/list` | Danh sách đánh giá thực tập | `GET /api/internship-evaluations` | Có route |
| 23 | POST | `/api/json/ojt-coordinations/decision` | Ghi nhận quyết định tiếp nhận sinh viên | `POST /api/ojt-coordinations/{id}/decision` | Có route |
| 24 | POST | `/api/json/ojt-coordinations/reassign` | Điều phối lại sinh viên | `POST /api/ojt-coordinations/{id}/reassign` | Có route |
| 25 | PUT | `/api/json/assignments/internship-evaluation` | Ghi nhận đánh giá thực tập | `PUT /api/assignments/{id}/internship-evaluation` | Có route |
| 26 | POST | `/api/json/qhdn/registered-students/list` | Xem sinh viên đã đăng ký OJT | `GET /api/qhdn/registered-students` | Có route |
| 27 | POST | `/api/json/qhdn/dashboard/search` | Tổng quan QHDN | `GET /api/qhdn/dashboard` | Có route |
| 28 | POST | `/api/json/qhdn/reports/export` | Xuất báo cáo QHDN | `GET /api/qhdn/reports/export` | Có route |
| 29 | POST | `/api/json/qhdn/reports/list` | Báo cáo QHDN theo loại | `GET /api/qhdn/reports` | Có route |
| 30 | POST | `/api/json/recruitment/windows/list` | Danh sách đợt tuyển dụng theo học kỳ | `GET /api/recruitment/windows` | Có route |
| 31 | PATCH | `/api/json/recruitment/windows` | Cập nhật hoặc mở/đóng đợt tuyển dụng | `PATCH /api/recruitment/windows/{id}` | Có route |
| 32 | POST | `/api/json/recruitment/posts/list` | Danh sách tin tuyển dụng | `GET /api/recruitment/posts` | Có route |
| 33 | PATCH | `/api/json/recruitment/posts` | Sửa tin và vị trí tuyển dụng | `PATCH /api/recruitment/posts/{id}` | Có route |
| 34 | POST | `/api/json/recruitment/posts/review` | Duyệt hoặc từ chối tin tuyển dụng | `POST /api/recruitment/posts/{id}/review` | Có route |
| 35 | POST | `/api/json/recruitment/posts/close` | Đóng tin tuyển dụng | `POST /api/recruitment/posts/{id}/close` | Có route |
| 36 | POST | `/api/json/company-imports/list` | P1: lịch sử import doanh nghiệp theo kỳ; tái sử dụng bảng import đã có. | `GET /api/company-imports` | **Chỉ OpenAPI, chưa có route** |
| 37 | POST | `/api/json/company-imports/detail` | P1: nguồn sheet, mapping, kết quả từng dòng/lỗi; cần lưu bổ sung metadata nếu schema chưa có. | `GET /api/company-imports/{id}` | **Chỉ OpenAPI, chưa có route** |
| 38 | POST | `/api/json/recruitment-posts/list` | P1: dữ liệu công bố được tạo từ sheet; không phải DN tự đăng tin. | `GET /api/recruitment-posts` | **Chỉ OpenAPI, chưa có route** |
| 39 | POST | `/api/json/recruitment-posts/detail` | P1: QHDN kiểm tra vị trí/nội dung/kỳ/deadline trước công bố. | `GET /api/recruitment-posts/{id}` | **Chỉ OpenAPI, chưa có route** |
| 40 | PATCH | `/api/json/recruitment-posts` | P1: QHDN đính chính nội dung/deadline, đồng bộ với vị trí khi cần; không cấp quyền DN. | `PATCH /api/recruitment-posts/{id}` | **Chỉ OpenAPI, chưa có route** |
| 41 | POST | `/api/json/recruitment-posts/publish` | P1: QHDN duyệt công bố bản import. Cần vì import hiện tạo PENDING_REVIEW. | `POST /api/recruitment-posts/{id}/publish` | **Chỉ OpenAPI, chưa có route** |
| 42 | POST | `/api/json/recruitment-posts/close` | P1: QHDN đóng công bố. Không đề xuất POST tạo tin thủ công/DN. | `POST /api/recruitment-posts/{id}/close` | **Chỉ OpenAPI, chưa có route** |
| 43 | POST | `/api/json/job-applications/list` | Danh sách hồ sơ ứng tuyển doanh nghiệp | `GET /api/job-applications` | Có route |
| 44 | POST | `/api/json/job-applications/detail` | P1: hồ sơ/đơn cho QHDN; DN chỉ khi đã được điều phối đến DN mình. | `GET /api/job-applications/{id}` | **Chỉ OpenAPI, chưa có route** |
| 45 | POST | `/api/json/job-applications/cv/search` | P1: tải CV private bằng quyền của đơn; DN chỉ hồ sơ được gửi cho mình. | `GET /api/job-applications/{id}/cv` | **Chỉ OpenAPI, chưa có route** |
| 46 | POST | `/api/json/qhdn/reports/acceptance/list` | P2: tiếp nhận/từ chối | `GET /api/qhdn/reports/acceptance` | **Chỉ OpenAPI, chưa có route** |
| 47 | POST | `/api/json/qhdn/reports/internships/list` | P2: đang thực tập/hoàn thành/kết quả | `GET /api/qhdn/reports/internships` | **Chỉ OpenAPI, chưa có route** |
| 48 | POST | `/api/json/qhdn/reports/enterprise-feedback/list` | P2: tổng hợp đánh giá DN, không bao hàm module khảo sát mới | `GET /api/qhdn/reports/enterprise-feedback` | **Chỉ OpenAPI, chưa có route** |
| 49 | POST | `/api/json/students/cv/search` | Tải CV của sinh viên | `GET /api/students/{id}/cv` | Có route |
| 50 | POST | `/api/json/internship-tasks/list` | Danh sách task trong phạm vi tài khoản | `GET /api/internship-tasks` | Có route |

## Doanh nghiệp

Quản lý hồ sơ, tuyển dụng và thực tập sinh.

| # | Method | API trên Swagger dự kiến | Chức năng | Route gốc | Triển khai |
|---:|---|---|---|---|---|
| 1 | PATCH | `/api/accounts/me/profile` | Cập nhật hồ sơ cá nhân | `PATCH /api/accounts/me/profile` | Có route |
| 2 | GET | `/api/enterprise/profile` | Hồ sơ doanh nghiệp | `GET /api/enterprise/profile` | Có route |
| 3 | POST | `/api/enterprise/tasks/bulk` | Giao nhiều task cho nhiều thực tập sinh | `POST /api/enterprise/tasks/bulk` | Có route |
| 4 | POST | `/api/json/enterprise/candidates/list` | Danh sách và hồ sơ ứng viên | `GET /api/enterprise/candidates` | Có route |
| 5 | PATCH | `/api/json/enterprise/candidates/decision` | Tiếp nhận hoặc từ chối ứng viên | `PATCH /api/enterprise/candidates/{id}/decision` | Có route |
| 6 | POST | `/api/json/enterprise/internships/list` | Danh sách sinh viên thực tập | `GET /api/enterprise/internships` | Có route |
| 7 | PUT | `/api/json/enterprise/internships/evaluation` | Gửi hoặc cập nhật đánh giá thực tập | `PUT /api/enterprise/internships/{id}/evaluation` | Có route |
| 8 | POST | `/api/json/recruitment/windows/list` | Danh sách đợt tuyển dụng theo học kỳ | `GET /api/recruitment/windows` | Có route |
| 9 | POST | `/api/json/recruitment/posts/list` | Danh sách tin tuyển dụng | `GET /api/recruitment/posts` | Có route |
| 10 | PATCH | `/api/json/recruitment/posts` | Sửa tin và vị trí tuyển dụng | `PATCH /api/recruitment/posts/{id}` | Có route |
| 11 | POST | `/api/json/internship-tasks/list` | Danh sách task trong phạm vi tài khoản | `GET /api/internship-tasks` | Có route |

## Sinh viên

Xem học tập, chọn combo và đăng ký OJT.

| # | Method | API trên Swagger dự kiến | Chức năng | Route gốc | Triển khai |
|---:|---|---|---|---|---|
| 1 | PATCH | `/api/accounts/me/profile` | Cập nhật hồ sơ cá nhân | `PATCH /api/accounts/me/profile` | Có route |
| 2 | POST | `/api/ojt-registrations` | Nộp hồ sơ đăng ký OJT | `POST /api/ojt-registrations` | Có route |
| 3 | POST | `/api/job-applications` | Ứng tuyển vị trí doanh nghiệp | `POST /api/job-applications` | Có route |
| 4 | GET | `/api/student/curriculum` | P1: chương trình đã ban hành của mình | `GET /api/student/curriculum` | Có route |
| 5 | POST | `/api/student/applications` | P1: ứng tuyển sau official ELIGIBLE, đợt mở và vị trí công bố. Có thể nhận trước bàn giao, nhưng QHDN không điều phối trước bàn giao | `POST /api/student/applications` | Có route |
| 6 | POST | `/api/student/cv` | P1: upload CV private giữa→cuối kỳ 5, độc lập AI; giới hạn loại/kích thước tệp | `POST /api/student/cv` | Có route |
| 7 | DELETE | `/api/student/cv` | P1: xóa/ngừng dùng CV hiện tại, giữ bản đã nộp theo chính sách hồ sơ; không phá lịch sử đơn | `DELETE /api/student/cv` | Có route |
| 8 | POST | `/api/student/cv/analyses` | P3: chạy trích xuất CV, tạo job | `POST /api/student/cv/analyses` | Có route |
| 9 | POST | `/api/students/me/cv` | Upload hoặc thay CV cá nhân | `POST /api/students/me/cv` | Có route |
| 10 | POST | `/api/json/combo-registration-windows/preview` | Xem ảnh hưởng của combo dự kiến | `POST /api/combo-registration-windows/{id}/preview` | Có route |
| 11 | POST | `/api/json/combo-registration-windows/list` | Danh sách đợt chọn combo | `GET /api/combo-registration-windows` | Có route |
| 12 | POST | `/api/json/combo-registration-windows/selections` | Gửi lựa chọn combo | `POST /api/combo-registration-windows/{id}/selections` | Có route |
| 13 | POST | `/api/json/students/combo-selections/list` | Lịch sử lựa chọn combo của sinh viên | `GET /api/students/{id}/combo-selections` | Có route |
| 14 | POST | `/api/json/students/eligibility-checks/list` | Lịch sử kiểm tra điều kiện OJT | `GET /api/students/{id}/eligibility-checks` | Có route |
| 15 | POST | `/api/json/students/eligibility/search` | Kết quả OJT và điều kiện còn thiếu | `GET /api/students/{id}/eligibility` | Có route |
| 16 | POST | `/api/json/ojt-registration-windows/list` | Danh sách đợt đăng ký OJT | `GET /api/ojt-registration-windows` | Có route |
| 17 | POST | `/api/json/ojt-registrations/list` | Danh sách hồ sơ đăng ký OJT | `GET /api/ojt-registrations` | Có route |
| 18 | POST | `/api/json/ojt-semesters/students/list` | Theo dõi trạng thái OJT theo kỳ | `GET /api/ojt-semesters/{id}/students` | Có route |
| 19 | POST | `/api/json/students/detail` | Hồ sơ học vụ tổng hợp | `GET /api/students/{id}` | Có route |
| 20 | POST | `/api/json/students/course-results/list` | Điểm, lần học và trạng thái môn | `GET /api/students/{id}/course-results` | Có route |
| 21 | POST | `/api/json/job-applications/list` | Danh sách hồ sơ ứng tuyển doanh nghiệp | `GET /api/job-applications` | Có route |
| 22 | POST | `/api/json/student/academic-summary/search` | P1: tín chỉ đã đạt/đang học/thiếu; môn nợ/chưa học/đang học. Kịch bản đạt ngưỡng không phải xác suất AI | `GET /api/student/academic-summary` | Có route |
| 23 | POST | `/api/json/student/supplementary-course-options/search` | P1: đề xuất môn/môn học lại, tín chỉ, lý do và tiên quyết; không lớp, không đăng ký học, không cam kết lịch | `GET /api/student/supplementary-course-options` | Có route |
| 24 | POST | `/api/json/student/ojt-registration-windows/list` | P1: scope/deadline, canRegister/blockReasons | `GET /api/student/ojt-registration-windows` | Có route |
| 25 | POST | `/api/json/student/companies/list` | P1: đối tác ACTIVE và có dữ liệu được công bố | `GET /api/student/companies` | Có route |
| 26 | POST | `/api/json/student/companies/detail` | P1: chi tiết đối tác công khai phù hợp | `GET /api/student/companies/{id}` | Có route |
| 27 | POST | `/api/json/student/positions/list` | P1: vị trí công bố bởi QHDN, đúng kỳ, OPEN/PUBLISHED, deadline/chỉ tiêu/canApply | `GET /api/student/positions` | Có route |
| 28 | POST | `/api/json/student/positions/detail` | P1: chi tiết; trả postId phù hợp schema hiện có | `GET /api/student/positions/{id}` | Có route |
| 29 | POST | `/api/json/student/applications/list` | P1: đơn của mình | `GET /api/student/applications` | Có route |
| 30 | POST | `/api/json/student/applications/detail` | P1: timeline tiếp nhận/điều phối/phân công | `GET /api/student/applications/{id}` | Có route |
| 31 | POST | `/api/json/student/cv/search` | P1: thông tin/phiên bản CV của mình, tải có xác thực | `GET /api/student/cv` | Có route |
| 32 | POST | `/api/json/student/notifications/list` | P1: thông báo/lọc unread/phân trang, trả unreadCount cùng response | `GET /api/student/notifications` | Có route |
| 33 | PATCH | `/api/json/student/notifications/read` | P1: người nhận đánh dấu đọc, idempotent | `PATCH /api/student/notifications/{id}/read` | Có route |
| 34 | POST | `/api/json/student/combo-registration-windows/list` | P2: các đợt/lựa chọn khả dụng | `GET /api/student/combo-registration-windows` | Có route |
| 35 | POST | `/api/json/student/assignments/current/search` | P2: DN/vị trí/giám sát/thời gian của mình theo kỳ | `GET /api/student/assignments/current` | Có route |
| 36 | POST | `/api/json/student/ojt-results/list` | P2: chỉ kết quả của mình được công bố | `GET /api/student/ojt-results` | Có route |
| 37 | POST | `/api/json/student/ojt-results/detail` | P2: điểm/nhận xét đã công bố | `GET /api/student/ojt-results/{id}` | Có route |
| 38 | POST | `/api/json/student/dashboard/search` | P2: tổng hợp; không tạo thuật toán học vụ mới | `GET /api/student/dashboard` | Có route |
| 39 | POST | `/api/json/student/applications/withdraw` | P2: rút đơn trước tiếp nhận/phân công theo chính sách; giữ lịch sử | `POST /api/student/applications/{id}/withdraw` | Có route |
| 40 | POST | `/api/json/student/risk-prediction/search` | P3: kết quả dự báo của mình, dùng lại prediction service khi có dữ liệu | `GET /api/student/risk-prediction` | Có route |
| 41 | POST | `/api/json/student/roadmap-recommendations/search` | P3: tư vấn AI lộ trình; khác đề xuất môn bằng quy tắc | `GET /api/student/roadmap-recommendations` | Có route |
| 42 | POST | `/api/json/student/cv/analyses/detail` | P3: kết quả/lỗi trích xuất | `GET /api/student/cv/analyses/{id}` | Có route |
| 43 | POST | `/api/json/student/company-recommendations/search` | P3: gợi ý vị trí theo CV, điểm/phân tích matching và lý do | `GET /api/student/company-recommendations` | Có route |
| 44 | POST | `/api/json/students/cv/search` | Tải CV của sinh viên | `GET /api/students/{id}/cv` | Có route |
| 45 | POST | `/api/json/students/me/opportunities/list` | Vị trí tuyển dụng và quyền ứng tuyển | `GET /api/students/me/opportunities` | Có route |
| 46 | POST | `/api/json/internship-tasks/list` | Danh sách task trong phạm vi tài khoản | `GET /api/internship-tasks` | Có route |

## Auth

Đăng nhập, thông tin phiên và đổi mật khẩu.

| # | Method | API trên Swagger dự kiến | Chức năng | Route gốc | Triển khai |
|---:|---|---|---|---|---|
| 1 | POST | `/api/auth/login` | Đăng nhập bằng email và mật khẩu | `POST /api/auth/login` | Có route |
| 2 | GET | `/api/auth/me` | Xem tài khoản đang đăng nhập | `GET /api/auth/me` | Có route |
| 3 | POST | `/api/auth/change-password` | Đổi mật khẩu | `POST /api/auth/change-password` | Có route |

## API được mô tả nhưng chưa có route

Các adapter JSON có thể được tạo cho các API này, nhưng không có handler nghiệp vụ đích tương ứng.

- `GET /api/company-imports`: P1: lịch sử import doanh nghiệp theo kỳ; tái sử dụng bảng import đã có.
- `GET /api/company-imports/{id}`: P1: nguồn sheet, mapping, kết quả từng dòng/lỗi; cần lưu bổ sung metadata nếu schema chưa có.
- `GET /api/recruitment-posts`: P1: dữ liệu công bố được tạo từ sheet; không phải DN tự đăng tin.
- `GET /api/recruitment-posts/{id}`: P1: QHDN kiểm tra vị trí/nội dung/kỳ/deadline trước công bố.
- `PATCH /api/recruitment-posts/{id}`: P1: QHDN đính chính nội dung/deadline, đồng bộ với vị trí khi cần; không cấp quyền DN.
- `POST /api/recruitment-posts/{id}/publish`: P1: QHDN duyệt công bố bản import. Cần vì import hiện tạo PENDING_REVIEW.
- `POST /api/recruitment-posts/{id}/close`: P1: QHDN đóng công bố. Không đề xuất POST tạo tin thủ công/DN.
- `GET /api/job-applications/{id}`: P1: hồ sơ/đơn cho QHDN; DN chỉ khi đã được điều phối đến DN mình.
- `GET /api/job-applications/{id}/cv`: P1: tải CV private bằng quyền của đơn; DN chỉ hồ sơ được gửi cho mình.
- `GET /api/qhdn/reports/acceptance`: P2: tiếp nhận/từ chối
- `GET /api/qhdn/reports/internships`: P2: đang thực tập/hoàn thành/kết quả
- `GET /api/qhdn/reports/enterprise-feedback`: P2: tổng hợp đánh giá DN, không bao hàm module khảo sát mới

## Route gốc chưa xuất hiện trong danh mục Swagger

Không phát hiện qua các router đã mount.

## Operation thiếu nhóm trong cấu hình hiện hành

- `POST /api/academic/academic-summary-notifications`
- `POST /api/academic/eligibility-notifications`
- `GET /api/academic-periods/{id}/ojt-advisory-schedule`
- `PUT /api/academic-periods/{id}/ojt-advisory-schedule`
- `GET /api/academic/advisory-runs`
- `GET /api/academic/advisory-runs/{id}`
- `GET /api/company-imports`
- `GET /api/company-imports/{id}`
- `GET /api/recruitment-posts`
- `GET /api/recruitment-posts/{id}`
- `PATCH /api/recruitment-posts/{id}`
- `POST /api/recruitment-posts/{id}/publish`
- `POST /api/recruitment-posts/{id}/close`
- `GET /api/job-applications/{id}`
- `GET /api/job-applications/{id}/cv`
- `GET /api/qhdn/reports/acceptance`
- `GET /api/qhdn/reports/internships`
- `GET /api/qhdn/reports/enterprise-feedback`
- `GET /api/student/academic-summary`
- `GET /api/student/supplementary-course-options`
- `GET /api/student/ojt-registration-windows`
- `GET /api/student/curriculum`
- `GET /api/student/companies`
- `GET /api/student/companies/{id}`
- `GET /api/student/positions`
- `GET /api/student/positions/{id}`
- `GET /api/student/applications`
- `POST /api/student/applications`
- `GET /api/student/applications/{id}`
- `GET /api/student/cv`
- `POST /api/student/cv`
- `DELETE /api/student/cv`
- `GET /api/student/notifications`
- `PATCH /api/student/notifications/{id}/read`
- `GET /api/student/combo-registration-windows`
- `GET /api/student/assignments/current`
- `GET /api/student/ojt-results`
- `GET /api/student/ojt-results/{id}`
- `GET /api/student/dashboard`
- `POST /api/student/applications/{id}/withdraw`
- `GET /api/student/risk-prediction`
- `GET /api/student/roadmap-recommendations`
- `POST /api/student/cv/analyses`
- `GET /api/student/cv/analyses/{id}`
- `GET /api/student/company-recommendations`

## Phạm vi src

- `app.ts`, `server.ts`, `routes.ts`, `routes/*`: mount route, Swagger, adapter JSON, khởi động worker.
- `config/*`: OpenAPI, hợp đồng input/output, phân nhóm, cấu hình auth/CORS/DB/log. `swagger-actor-groups.ts` tồn tại nhưng không được gọi trong chuỗi tạo Swagger hiện hành; không lấy mốc 223 của file này làm số lượng thực tế.
- `middleware/*`: xác thực, phân quyền, xử lý lỗi.
- `modules/*`: auth/accounts/system; học vụ/curriculum/students; combo/eligibility/OJT registration; imports/recruitment/QHDN; OJT results/reporting; admin/prediction; student portal/advisory/CV.
- `jobs/*`: provisioning/email/archive, recruitment, eligibility, predictions; advisory worker đặt trong student-portal.
- `shared/*`, `database/*`: context danh sách, phân trang, kiểu DB; `public/*`, `assets/*`: giao diện Swagger và font PDF, không định nghĩa API.

## Lưu ý chức năng

- Dự báo rủi ro của sinh viên đọc kết quả prediction đã lưu; tư vấn lộ trình, phân tích CV và matching cần provider tương ứng. Không xem summary OpenAPI là bằng chứng dịch vụ AI đã cấu hình hoặc chạy thành công.
- Các summary bắt đầu P1/P2/P3 còn chứa mô tả kế hoạch; xem cột triển khai để tránh nhầm mô tả với API hoạt động.
- Tài liệu cũ `docs/swagger-api-by-role.md` ghi 149 API; không phản ánh đầy đủ các operation mới trong src.
- Đây là kiểm kê API và độ khớp route/OpenAPI, chưa phải kiểm toán đầy đủ bảo mật hoặc tính đúng đắn mọi nhánh nghiệp vụ.


