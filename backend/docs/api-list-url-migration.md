# Đổi hậu tố danh sách từ search sang list

43 API danh sách đổi hậu tố `/search` thành `/list`. Method POST, JSON body, bộ lọc `search`, response, phân trang và quyền truy cập giữ nguyên. Tại thời điểm đổi tên có 160 API trong sáu nhóm; sau khi gộp bốn detail, hiện còn 156 API. Xem [hợp đồng gộp](api-detail-list-consolidation.md). URL `/search` cũ của các danh sách trong bảng không còn được đăng ký.

Các API lấy một hồ sơ/batch theo ID vẫn dùng `/detail`. Các API đọc tổng quan, tiến độ, điều kiện hoặc tải file không phải danh sách giữ URL hiện có. GET /api/roles và GET /api/imports/emails không đổi.

Checkout frontend hiện tại không có lời gọi các URL JSON `/search` này; không cần thay source FE trong lượt này. Client đã dùng URL cũ cần thay theo bảng dưới.

| URL cũ (POST) | URL mới (POST) | Chức năng |
| --- | --- | --- |
| `/api/json/academic-years/search` | `/api/json/academic-years/list` | Danh sách năm học |
| `/api/json/academic-periods/search` | `/api/json/academic-periods/list` | Danh sách kỳ học và Block 3 |
| `/api/json/cohorts/search` | `/api/json/cohorts/list` | Danh sách khóa và nhóm |
| `/api/json/academic-periods/combo-phase-schedules/search` | `/api/json/academic-periods/combo-phase-schedules/list` | Xem mốc chọn và xác nhận combo |
| `/api/json/academic/alerts/search` | `/api/json/academic/alerts/list` | Danh sách cảnh báo thiếu điều kiện OJT |
| `/api/json/academic/course-demand/search` | `/api/json/academic/course-demand/list` | Thống kê nhu cầu học môn còn thiếu |
| `/api/json/accounts/search` | `/api/json/accounts/list` | Danh sách tài khoản |
| `/api/json/combo-registration-windows/search` | `/api/json/combo-registration-windows/list` | Danh sách đợt chọn combo |
| `/api/json/combo-registration-windows/selections/search` | `/api/json/combo-registration-windows/selections/list` | Theo dõi lựa chọn combo |
| `/api/json/students/combo-selections/search` | `/api/json/students/combo-selections/list` | Lịch sử lựa chọn combo của sinh viên |
| `/api/json/majors/search` | `/api/json/majors/list` | Danh sách chuyên ngành |
| `/api/json/courses/search` | `/api/json/courses/list` | Danh sách môn học |
| `/api/json/curricula/search` | `/api/json/curricula/list` | Danh sách chương trình đào tạo đã nhập |
| `/api/json/ojt-rule-sets/search` | `/api/json/ojt-rule-sets/list` | Danh sách bộ quy tắc OJT |
| `/api/json/students/eligibility-checks/search` | `/api/json/students/eligibility-checks/list` | Lịch sử kiểm tra điều kiện OJT |
| `/api/json/ojt-registration-windows/search` | `/api/json/ojt-registration-windows/list` | Danh sách đợt đăng ký OJT |
| `/api/json/ojt-registrations/search` | `/api/json/ojt-registrations/list` | Danh sách hồ sơ đăng ký OJT |
| `/api/json/ojt-semesters/eligible-student-handoffs/search` | `/api/json/ojt-semesters/eligible-student-handoffs/list` | Lịch sử bàn giao sinh viên cho QHDN |
| `/api/json/ojt-semesters/students/search` | `/api/json/ojt-semesters/students/list` | Theo dõi trạng thái OJT theo kỳ |
| `/api/json/ojt-results/search` | `/api/json/ojt-results/list` | Danh sách kết quả OJT đã chuyển |
| `/api/json/companies/search` | `/api/json/companies/list` | Danh sách và hồ sơ doanh nghiệp |
| `/api/json/positions/search` | `/api/json/positions/list` | Danh sách và hồ sơ vị trí thực tập |
| `/api/json/ojt-coordinations/search` | `/api/json/ojt-coordinations/list` | Danh sách và hồ sơ điều phối |
| `/api/json/assignments/search` | `/api/json/assignments/list` | Danh sách và hồ sơ phân công thực tập |
| `/api/json/internship-evaluations/search` | `/api/json/internship-evaluations/list` | Danh sách đánh giá thực tập |
| `/api/json/qhdn/registered-students/search` | `/api/json/qhdn/registered-students/list` | Xem sinh viên đã đăng ký OJT |
| `/api/json/qhdn/reports/search` | `/api/json/qhdn/reports/list` | Báo cáo QHDN theo loại |
| `/api/json/students/search` | `/api/json/students/list` | Tìm kiếm và lọc sinh viên |
| `/api/json/students/course-results/search` | `/api/json/students/course-results/list` | Điểm, lần học và trạng thái môn |
| `/api/json/academic-imports/search` | `/api/json/academic-imports/list` | Lịch sử nhập dữ liệu học vụ |
| `/api/json/assessment-templates/search` | `/api/json/assessment-templates/list` | Danh sách và hồ sơ bộ tiêu chí đánh giá |
| `/api/json/predictions/search` | `/api/json/predictions/list` | Lịch sử dự đoán |
| `/api/json/admin/models/search` | `/api/json/admin/models/list` | Danh sách và hồ sơ phiên bản mô hình |
| `/api/json/alerts/search` | `/api/json/alerts/list` | Danh sách và hồ sơ cảnh báo rủi ro |
| `/api/json/students/interventions/search` | `/api/json/students/interventions/list` | Lịch sử hỗ trợ sinh viên |
| `/api/json/admin/reports/readiness/search` | `/api/json/admin/reports/readiness/list` | Báo cáo mức sẵn sàng và rủi ro |
| `/api/json/admin/audit-logs/search` | `/api/json/admin/audit-logs/list` | Nhật ký hoạt động hệ thống |
| `/api/json/enterprise/candidates/search` | `/api/json/enterprise/candidates/list` | Danh sách và hồ sơ ứng viên |
| `/api/json/enterprise/internships/search` | `/api/json/enterprise/internships/list` | Danh sách sinh viên thực tập |
| `/api/json/recruitment/windows/search` | `/api/json/recruitment/windows/list` | Danh sách đợt tuyển dụng theo học kỳ |
| `/api/json/recruitment/posts/search` | `/api/json/recruitment/posts/list` | Danh sách tin tuyển dụng |
| `/api/json/job-applications/search` | `/api/json/job-applications/list` | Danh sách hồ sơ ứng tuyển doanh nghiệp |
| `/api/json/students/me/opportunities/search` | `/api/json/students/me/opportunities/list` | Vị trí tuyển dụng và quyền ứng tuyển |

Kiểm chứng: build và sinh tài liệu thành công; đối chiếu toàn bộ hợp đồng request/response/quyền trước và sau; 43 URL list yêu cầu xác thực, 43 URL search cũ trả ROUTE_NOT_FOUND. Hai danh sách QHDN được gọi với token thật và trả đúng 3 sinh viên hiện có; phân trang sai vẫn trả 400.
