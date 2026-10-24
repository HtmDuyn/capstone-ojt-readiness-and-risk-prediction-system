# Cổng sinh viên — kết nối API

Cổng sinh viên sử dụng `VITE_API_URL` (bao gồm `/api`) và JWT `ojt_auth_token` của phiên đăng nhập. Ví dụ backend local: `VITE_API_URL=http://localhost:3000/api`. Không dùng ID tài khoản làm ID sinh viên: lấy `studentId` từ `GET /auth/me`, sau đó đọc hồ sơ `/students/:id`.

`StudentPortalProvider` chia sẻ hồ sơ, đợt OJT được chọn và số thông báo chưa đọc giữa các màn hình. Danh sách đợt được lấy từ các đợt thuộc phạm vi sinh viên, đợt combo và hồ sơ OJT của chính sinh viên, có đọc hết các trang. Không đoán ID/kỳ học. Khi chưa có đợt liên kết, hồ sơ học tập và thông báo vẫn hoạt động.

## Các luồng đã nối

| Màn hình / thao tác | API |
| --- | --- |
| Dashboard | `GET /student/dashboard?ojtSemesterId=…` |
| Hồ sơ học tập | `GET /students/:id`, `GET /students/:id/course-results`, `GET /student/curriculum` |
| Đăng ký combo | `GET /combo-registration-windows`, `POST /combo-registration-windows/:id/preview`, `POST /combo-registration-windows/:id/selections` |
| Phân tích học vụ | `GET /student/academic-summary`, `GET /student/supplementary-course-options` |
| Tư vấn lộ trình, hộp thoại AI | `GET /student/roadmap-recommendations?ojtSemesterId=…` |
| Đợt và hồ sơ OJT | `GET /ojt-registration-windows`, `GET /ojt-registrations`, `POST /ojt-registrations` |
| CV | `POST /students/me/cv` (multipart, trường `cv`, PDF ≤ 10 MB), `GET /students/:id/cv?cvFileId=…` |
| Vị trí và ứng tuyển | `GET /students/me/opportunities`, `GET /job-applications`, `POST /job-applications` |
| Thực tập | `GET /student/assignments/current`, `GET /internship-tasks?studentId=…&ojtSemesterId=…` |
| Kết quả | `GET /student/ojt-results`, `GET /student/ojt-results/:id`; tải JSON của kết quả đã đọc |
| Thông báo | `GET /student/notifications`, `PATCH /student/notifications/:id/read` |

Danh sách có phân trang 20 bản ghi. Tìm kiếm tại bảng điểm, nhiệm vụ và thông báo áp dụng trong trang hiện tại; bộ lọc chưa đọc được gửi lên backend. Đánh dấu tất cả đã đọc áp dụng cho trang hiện tại. Các thao tác chỉ cập nhật trạng thái thành công sau khi backend chấp nhận, khóa gửi lặp và giữ lỗi để thử lại. Đổi đợt hoặc rời màn hình sẽ hủy request đọc và bỏ qua phản hồi cũ.

Các trường chưa có dữ liệu hiển thị trạng thái trống. Chưa cấu hình dịch vụ AI thì hiển thị lỗi do backend trả về. Hộp thoại AI lấy tư vấn lộ trình từ hồ sơ, không giả lập chat trả lời theo từ khóa.

## Phạm vi backend hiện tại

- API dự báo `/student/risk-prediction` đã bị gỡ. Trang tương ứng hiển thị đối chiếu học vụ, kịch bản tín chỉ và tư vấn lộ trình; không tạo điểm/xác suất rủi ro.
- Chưa có API sinh viên cập nhật nhiệm vụ hoặc nộp báo cáo tuần; giao diện hiển thị rõ giới hạn này.
- Chưa có API rút đơn, xóa CV/thông báo hoặc đánh dấu thông báo chưa đọc trong các route hiện hành; không mô phỏng các thao tác đó ở frontend.
- Quyền đăng ký và ứng tuyển dựa trên `canSubmit`, `canApply` và lý do chặn của backend. Backend kiểm tra lại quyền và điều kiện khi nhận yêu cầu.
