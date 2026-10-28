# Cổng sinh viên — kết nối API

Frontend dùng `VITE_API_URL` (gồm `/api`) và JWT `ojt_auth_token`. Lấy `studentId` từ `GET /auth/me`; không dùng UserID làm StudentID. Backend chưa trả trường này là lỗi phiên bản API; `studentId: null` mới là tài khoản chưa liên kết hồ sơ.

Khi phát triển local, tạo `.env.development.local` trong `frontend`:

```dotenv
VITE_API_URL=/api
API_PROXY_TARGET=http://localhost:3000
```

Khởi động backend và Vite, rồi đăng nhập lại. Cấu hình này chỉ áp dụng development; production cần `VITE_API_URL` trỏ tới backend đã triển khai cùng phiên bản. Restart Vite sau khi đổi biến môi trường.

`StudentPortalProvider` chia sẻ hồ sơ, đợt OJT, đợt combo và số thông báo chưa đọc. Kỳ mục tiêu lấy từ lộ trình khóa ở nấc 6, nên sinh viên kỳ 5 vẫn có kỳ OJT dù chưa đăng ký. Request được giới hạn theo tài khoản; phản hồi cũ bị bỏ qua khi đổi phiên hoặc bộ lọc.

| Màn hình / thao tác | API hiện tại, tương đối với `/api` |
| --- | --- |
| Tài khoản đang đăng nhập | `GET /auth/me` — envelope `user` |
| Dashboard, học vụ, điều kiện, môn bổ sung | `GET /students/me/dashboard?ojtSemesterId=…` |
| Hồ sơ, bảng điểm, chương trình học | `GET /students/:id?include=academicProgress,courseResults,curriculum,…` |
| Combo | `GET /combo-registration-windows`, `POST /combo-registration-windows/:id/preview`, `POST /combo-registration-windows/:id/selections` |
| Tư vấn AI | `GET /students/me/roadmap-recommendations?ojtSemesterId=…` |
| Đợt và đăng ký OJT | `GET /ojt-registration-windows`, `GET /ojt-registrations`, `POST /ojt-registrations` |
| Trạng thái theo kỳ | `GET /ojt-semesters/:id/students` |
| CV | `POST /students/me/cv`, `GET /students/:id/cv?cvFileId=…` |
| Vị trí và ứng tuyển | `GET /students/me/opportunities?windowId=…`, `GET /job-applications`, `POST /job-applications` |
| Phân công, nhiệm vụ, kết quả đã công bố | `GET /students/me/internships?ojtSemesterId=…` |
| Chi tiết kết quả của mình | `GET /students/me/internships?ojtSemesterId=…&resultId=…` |
| Thông báo | `GET /students/me/notifications`, `PATCH /students/me/notifications/:id` với `{isRead:true}` |
| Thông tin cá nhân `/student/profile` | `PATCH /accounts/me/profile` — envelope `account`, tên trường `full_name`, `phone` |
| Mật khẩu | `POST /auth/change-password`; từ 12 ký tự, tối đa 72 byte UTF-8; đăng nhập lại sau thành công |

GET không có body; JSON có `Content-Type: application/json`; upload PDF dùng FormData field `cv`, tối đa 10 MiB. Không tự đặt Content-Type JSON cho FormData. API nghiệp vụ trả `data`, trừ Auth (`user`), cập nhật tài khoản (`account`), và tải CV (PDF).

Danh sách thường dùng trang 20 bản ghi. `allStudentPages` đọc đủ các trang khi tải danh sách đợt/đơn ứng tuyển. Bảng điểm dùng `resultsPage/resultsLimit`; internships có `tasksPage/tasksLimit` và `resultsPage/resultsLimit` độc lập. Tìm kiếm giao diện trên bảng điểm, nhiệm vụ và thông báo áp dụng trong trang đang xem.

## Điều kiện và ứng tuyển

`officialEligibility` là xác nhận từ `EligibilityChecks` cũ. `admissionEligibility` phản ánh bằng chứng Đào tạo đã bàn giao: kết quả frontend được lưu hoặc xác nhận cũ. Hai trường giữ ý nghĩa riêng.

Ứng tuyển cần bàn giao đúng sinh viên/kỳ, kết quả ELIGIBLE còn hiệu lực và đúng batch bàn giao, chương trình không thay đổi, cửa sổ đang mở, tin tuyển dụng còn hạn, vị trí còn chỗ, và chưa có đơn đang xử lý/phân công đang hiệu lực. Giao diện dùng `canSubmit`, `canApply` và blockers; backend kiểm tra lại khi ghi.

Ứng tuyển trực tiếp gửi `POST /job-applications` với `{windowId,postId,positionId,coverLetter,application:{contactPhone,contactEmail,note}}`. ID lấy từ API. Backend tạo/cập nhật đăng ký và đơn trong cùng transaction. Gửi lại cùng yêu cầu không tạo điều phối trùng. Sinh viên bị từ chối có thể nộp lại, giữ lịch sử điều phối.

## Tài khoản import và giới hạn hiện tại

Tài khoản có `mustChangePassword` được đưa tới `/student/profile` để đổi mật khẩu trước. Không tải nghiệp vụ sinh viên bằng mật khẩu tạm.

- Chưa cấu hình `ROADMAP_SERVICE_URL`: AI trả `503 AI_NOT_CONFIGURED`. Giao diện giữ lỗi nghiệp vụ, không báo nhầm proxy hỏng.
- DB chưa có đợt combo: danh sách rỗng hợp lệ; cần Đào tạo tạo đợt/roster để kiểm thử gửi lựa chọn thực tế.
- Chưa có API sinh viên cập nhật nhiệm vụ hoặc nộp báo cáo tuần. Trang tiến độ hiện xem nhiệm vụ do doanh nghiệp giao.
- Chỉ kết quả OJT đã CONFIRMED được công bố. Chưa công bố thì danh sách rỗng.
- Chưa có thao tác rút đơn/xóa CV trong các API sinh viên hiện hành.

Đối soát DB và kết quả kiểm tra: [student-flow-audit.md](../../backend/docs/student-flow-audit.md).
