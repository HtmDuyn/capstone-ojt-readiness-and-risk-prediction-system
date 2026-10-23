# Hợp đồng API Phòng đào tạo

- GET không nhận body; các ID trên URL vẫn bắt buộc. Các bộ lọc query còn lại là tùy chọn.
- `PATCH /api/academic-years` nhận một JSON body gồm `id` và các trường cần sửa; Swagger không hiển thị ô ID riêng. Response trả đầy đủ năm học và các kỳ liên quan.
- Riêng `GET /api/academic-years`: Swagger không có ô nhập query; Execute trả toàn bộ năm học cùng các kỳ học liên quan.
- `PATCH /api/academic-periods` nhận một JSON body gồm `id` và các trường cần sửa; có ví dụ riêng cho SEMESTER (kèm `ojt`) và BLOCK3 (kèm `parentPeriodId`). Response giữ đầy đủ dữ liệu và bổ sung năm học, kỳ cha, OJT liên quan.
- `GET /api/academic-periods` không có ô nhập query/body trong Swagger; Execute trả toàn bộ kỳ học và Block 3 ở mọi trạng thái, kèm năm học, kỳ cha và OJT liên quan.
- `PATCH /api/cohorts` nhận một JSON body gồm `id`, các trường thông tin khóa và `groups`. Có thể sửa 1–4 nhóm; nhóm không gửi được giữ nguyên. Response trả đầy đủ tất cả nhóm và kỳ bắt đầu của từng nhóm.
- `GET /api/cohorts` không có ô nhập query/body trong Swagger; Execute trả JSON toàn bộ khóa, nhóm và kỳ bắt đầu của từng nhóm, không giới hạn 20 bản ghi.
- Các danh sách khác giữ phân trang mặc định `page=1`, `limit=20`, với `total` để biết số bản ghi.
- POST/PUT/PATCH có dữ liệu dùng `Content-Type: application/json`. Form-data và query dùng thay body bị từ chối.
- `POST /api/ojt-rule-sets/{id}/publish` không cần body; có thể gửi `{}`.
- GET báo cáo không có bộ lọc chạy theo tất cả kỳ OJT. Response có `scopes`, kỳ OJT và kỳ học tương ứng; không tự suy ra deadline đăng ký. Thiếu deadline trả `NOT_CONFIGURED`.
- `/students/{id}/eligibility` không lọc kỳ trả `{ studentId, total, items }`; khi lọc `ojtSemesterId` vẫn trả một kết quả như trước.
- Endpoint export vẫn trả CSV/PDF theo định dạng được hỗ trợ; GET CV trả file PDF.

Response bổ sung kỳ cha, năm học, OJT, kỳ bắt đầu của từng nhóm khóa; danh sách chương trình có môn học/combo/tiên quyết/tương đương. Báo cáo nhu cầu có sinh viên chi tiết theo môn và kỳ. Kết quả OJT có `version` để dùng khi xác nhận cùng liên kết điểm học phần/ánh xạ. Quan hệ không có dữ liệu trả null hoặc mảng rỗng.

## Danh sách đã đối chiếu

| Method | URL | Request body | Chức năng |
|---|---|---|---|
| GET | `/api/academic-years` | Không | Danh sách năm học |
| POST | `/api/academic-years` | JSON | Tạo năm học |
| PATCH | `/api/academic-years` | JSON (gồm id) | Cập nhật năm học |
| GET | `/api/academic-periods` | Không | Danh sách kỳ học và Block 3 |
| POST | `/api/academic-periods` | JSON | Tạo kỳ học và Block 3 |
| PATCH | `/api/academic-periods` | JSON (gồm id) | Cập nhật kỳ học và Block 3 |
| GET | `/api/cohorts` | Không | Danh sách khóa và nhóm |
| POST | `/api/cohorts` | JSON | Tạo khóa và nhóm |
| PATCH | `/api/cohorts` | JSON (gồm id) | Cập nhật khóa và nhóm |
| GET | `/api/academic-periods/{id}/combo-phase-schedules` | Không | Xem mốc chọn và xác nhận combo |
| PUT | `/api/academic-periods/{id}/combo-phase-schedules` | JSON | Thiết lập mốc chọn và xác nhận combo |
| GET | `/api/ojt-semesters/{id}/assessment-window` | Không | Xem đợt xét điều kiện chính thức |
| PUT | `/api/ojt-semesters/{id}/assessment-window` | JSON | Thiết lập đợt xét điều kiện chính thức |
| POST | `/api/ojt-semesters/{id}/assessment-window/open` | JSON | Mở xét điều kiện chính thức |
| POST | `/api/ojt-semesters/{id}/assessment-window/close` | JSON | Đóng xét điều kiện chính thức |
| GET | `/api/curricula/{id}/ojt-grade-mappings/{semesterId}` | Không | Xem quy đổi điểm môn OJT |
| PUT | `/api/curricula/{id}/ojt-grade-mappings/{semesterId}` | JSON | Thiết lập quy đổi điểm môn OJT |
| POST | `/api/ojt-registration-windows/{id}/semester-exceptions` | JSON | Thêm ngoại lệ kỳ đăng ký OJT |
| POST | `/api/ojt-registration-windows/{id}/semester-exceptions/{exceptionId}/revoke` | JSON | Thu hồi ngoại lệ kỳ đăng ký OJT |
| POST | `/api/combo-registration-windows/{id}/preview` | JSON | Xem ảnh hưởng của combo dự kiến |
| GET | `/api/academic/dashboard` | Không | Tổng quan và thống kê điều kiện OJT |
| GET | `/api/academic/alerts` | Không | Danh sách cảnh báo thiếu điều kiện OJT |
| GET | `/api/academic/course-demand` | Không | Thống kê nhu cầu học môn còn thiếu |
| GET | `/api/academic/course-demand/export` | Không | Xuất nhu cầu học theo môn, kỳ và Block |
| POST | `/api/academic/alerts/notifications` | JSON | Gửi cảnh báo học vụ |
| PATCH | `/api/accounts/me/profile` | JSON | Cập nhật hồ sơ cá nhân |
| GET | `/api/combo-registration-windows` | Không | Danh sách đợt chọn combo |
| POST | `/api/combo-registration-windows` | JSON | Tạo đợt chọn hoặc xác nhận combo |
| PATCH | `/api/combo-registration-windows/{id}` | JSON | Cập nhật hoặc mở/đóng đợt chọn combo |
| POST | `/api/combo-registration-windows/{id}/extensions` | JSON | Gia hạn chọn combo |
| GET | `/api/combo-registration-windows/{id}/selections` | Không | Theo dõi lựa chọn combo |
| POST | `/api/combo-registration-windows/{id}/selections` | JSON | Gửi lựa chọn combo |
| POST | `/api/combo-registration-windows/{id}/reminders` | JSON | Gửi nhắc chọn combo |
| GET | `/api/students/{id}/combo-selections` | Không | Lịch sử lựa chọn combo của sinh viên |
| POST | `/api/combo-registration-windows/{id}/finalize` | JSON | Chốt lựa chọn combo |
| GET | `/api/majors` | Không | Danh sách chuyên ngành |
| POST | `/api/majors` | JSON | Tạo chuyên ngành |
| GET | `/api/courses` | Không | Danh sách môn học |
| POST | `/api/courses` | JSON | Tạo môn học |
| PATCH | `/api/courses/{id}` | JSON | Cập nhật môn học |
| GET | `/api/curricula` | Không | Danh sách chương trình đào tạo đã nhập |
| GET | `/api/curricula/{id}` | Không | Chi tiết chương trình đào tạo |
| POST | `/api/curriculum-imports/preview` | JSON | Kiểm tra dữ liệu nhập khung chương trình |
| POST | `/api/curriculum-imports/commit` | JSON | Nhập khung chương trình |
| GET | `/api/ojt-rule-sets` | Không | Danh sách bộ quy tắc OJT |
| POST | `/api/ojt-rule-sets` | JSON | Tạo bộ quy tắc OJT |
| PATCH | `/api/ojt-rule-sets/{id}` | JSON | Sửa bộ quy tắc chưa ban hành |
| POST | `/api/ojt-rule-sets/{id}/publish` | Không hoặc `{}` | Ban hành bộ quy tắc OJT |
| GET | `/api/students/{id}/eligibility-checks` | Không | Lịch sử kiểm tra điều kiện OJT |
| GET | `/api/students/{id}/eligibility` | Không | Kết quả OJT và điều kiện còn thiếu |
| POST | `/api/eligibility-check-runs` | JSON | Xét điều kiện OJT hàng loạt và cập nhật trạng thái |
| POST | `/api/imports/preview` | JSON | Kiểm tra import doanh nghiệp hoặc sinh viên |
| POST | `/api/imports/commit` | JSON | Import doanh nghiệp (QHDN) hoặc sinh viên (Phòng đào tạo/Admin) |
| GET | `/api/ojt-semesters/{id}/eligible-student-handoffs` | Không | Lịch sử bàn giao sinh viên cho QHDN |
| POST | `/api/ojt-semesters/{id}/eligible-student-handoffs` | JSON | Bàn giao sinh viên đủ điều kiện cho QHDN trước đăng ký |
| GET | `/api/ojt-semesters/{id}/students` | Không | Theo dõi trạng thái OJT theo kỳ |
| GET | `/api/students` | Không | Tìm kiếm và lọc sinh viên |
| GET | `/api/students/{id}` | Không | Hồ sơ học vụ tổng hợp |
| PATCH | `/api/students/{id}` | JSON | Cập nhật hồ sơ và lộ trình học vụ |
| GET | `/api/students/{id}/course-results` | Không | Điểm, lần học và trạng thái môn |
| PATCH | `/api/course-results/{id}` | JSON | Sửa kết quả học tập và ghi lý do |
| GET | `/api/academic-imports` | Không | Lịch sử nhập dữ liệu học vụ |
| GET | `/api/ojt-results` | Không | Danh sách kết quả OJT đã được QHDN chuyển |
| GET | `/api/ojt-semesters/{id}/results/export` | Không | Xuất danh sách điểm OJT chính thức |
| POST | `/api/academic/academic-summary-notifications` | JSON | gửi snapshot giữa kỳ cho cả scope, kể cả SV không có cảnh báo; có thể gửi thủ công trước. |
| POST | `/api/academic/eligibility-notifications` | JSON | thông báo đủ/không đủ/chờ đối soát; tham chiếu snapshot/checkId và chống gửi lặp. |
| GET | `/api/academic-periods/{id}/ojt-advisory-schedule` | Không | xem lịch thông báo giữa kỳ và deadline. |
| PUT | `/api/academic-periods/{id}/ojt-advisory-schedule` | JSON | cấu hình lịch theo kỳ thực, worker thực thi. |
| GET | `/api/academic/advisory-runs` | Không | lịch sử batch thông báo khi có worker. |
| GET | `/api/academic/advisory-runs/{id}` | Không | trạng thái/lỗi từng sinh viên. |
| GET | `/api/students/{id}/cv` | Không | Tải CV của sinh viên |
| POST | `/api/ojt-results/{id}/confirm` | JSON | Phòng đào tạo xác nhận và ghi nhận điểm OJT |

## Kiểm chứng

`npm run test:academic-contracts` chạy trên PGlite tạm, không kết nối database ứng dụng. Kiểm tra 72 khai báo OpenAPI, 32 GET không truyền query/body, 40 API ghi từ chối form-data, tạo năm học bằng JSON, các trường liên quan, phân quyền và trường hợp chưa có kỳ OJT. Các kiểm tra định dạng không thay thế kiểm thử toàn bộ tình huống nghiệp vụ của từng API ghi.
