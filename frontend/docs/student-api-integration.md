# Frontend sinh viên — phạm vi nhánh hiện tại

Nhánh `feature/FE-Student-update-Duyen` chỉ giữ frontend sinh viên. Backend, DB, Admin, Đào tạo, QHDN, Doanh nghiệp và các component/service dùng chung được hoàn nguyên theo HEAD. `PublicRouter.tsx` chỉ thay phần route sinh viên; định nghĩa route các role khác giữ nguyên.

## Các phần riêng của sinh viên

- `layouts/StudentLayout.tsx`: sidebar/menu sinh viên, header từ hồ sơ thật, điều hướng tài khoản/thông báo. Không dùng hoặc sửa `BaseLayout` của các role khác.
- `components/student/StudentHeader.tsx`, `StudentBanner.tsx`, `StudentAccountSettings.tsx`, `TaskSubmissionsDialog.tsx`: giữ giao diện đã cập nhật trong phạm vi sinh viên. Nút nằm dưới banner; không có chatbot nổi, combo hoặc thẻ phân công.
- `contexts/StudentPortalContext.tsx`: hồ sơ, kỳ OJT, thông báo, trạng thái bắt buộc đổi mật khẩu. Trạng thái này thuộc cổng sinh viên, không đổi LoginPage, PrivateRouter hoặc AuthUser dùng chung.
- `services/studentApi.ts`: Axios instance riêng, adapter XHR, timeout 60 giây, JWT từ phiên đăng nhập hiện có. Không thêm interceptor hoặc sửa cache của API chung.
- `services/studentService.ts`, `types/student/portal.ts`: ánh xạ response và các thao tác API sinh viên.

`studentApi` trả nguyên envelope để service chọn `user`, `account` hoặc `data`; giữ status/errorCode và cancellation. JSON dùng `data`, CV dùng FormData field `cv` (PDF tối đa 10 MB), tải CV dùng blob. Không tự đặt Content-Type JSON cho FormData. File khai báo Axios chung `src/types/axios.d.ts` giữ nguyên để tránh ảnh hưởng role khác.

## Chức năng và hợp đồng API

Base URL lấy từ `VITE_API_URL`, cùng backend/issuer với trang đăng nhập. Không tự thay biến môi trường.

| Chức năng | API tương đối với `/api` |
| --- | --- |
| Hồ sơ tài khoản | `GET /auth/me` |
| Dashboard, điều kiện, môn cần bổ sung | `GET /students/me/dashboard?ojtSemesterId=…` |
| Học tập, bảng điểm, chương trình | `GET /students/:id?include=academicProgress,courseResults,curriculum,…` |
| Đợt và hồ sơ OJT | `GET /ojt-registration-windows`, `GET /ojt-registrations`, `GET /job-applications` |
| Doanh nghiệp/vị trí | `GET /students/me/opportunities?windowId=…` |
| Nộp đơn | `POST /job-applications` với `{windowId,postId,positionId,coverLetter,application}` |
| CV riêng và CV ứng tuyển | `POST /students/me/cv`, `GET /students/:id/cv?cvFileId=…` |
| Nhiệm vụ được giao | `GET /students/me/tasks?ojtSemesterId=…&page=…&limit=20` |
| Lịch sử/nộp nhiệm vụ | `GET/POST /students/me/tasks/:id/submissions`; body POST `{content}` |
| Kết quả OJT | `GET /students/me/internships?ojtSemesterId=…&resultId=…` |
| Thông báo | `GET /students/me/notifications`, `PATCH /students/me/notifications/:id` với `{isRead:true}` |
| Hồ sơ cá nhân | `PATCH /accounts/me/profile`; response `account.full_name`, `account.phone` |
| Đổi mật khẩu | `POST /auth/change-password`; logout và đăng nhập lại sau thành công |
| Tư vấn AI | `GET /students/me/roadmap-recommendations?ojtSemesterId=…` |

Ưu tiên StudentID từ `/auth/me`. Nếu backend cũ bỏ sót trường này, dùng `/students/me/internships` không lọc để máy chủ tự xác định owner, rồi đối chiếu `profile.id` và `profile.userId`. StudentID null rõ ràng vẫn là lỗi thiếu liên kết; không đoán ID hoặc dùng UserID thay StudentID.

Mật khẩu tạm được phát hiện từ `/auth/me` và đưa riêng sinh viên tới `/student/profile`. Không gọi các API nghiệp vụ khi backend yêu cầu đổi mật khẩu.

Bảng điểm phân biệt **Kỳ** (`semesterTaken`) với **Học kỳ** (`periodCode`). Lọc và tìm kiếm áp dụng toàn bộ dữ liệu trước phân trang; chương trình/lộ trình phân trang 20 môn. Menu OJT/hồ sơ/CV gộp chung, URL hồ sơ cũ chuyển hướng về trang OJT. Popup chọn doanh nghiệp/vị trí, dùng CV hiện có hoặc upload mới trước khi gửi đơn.

Nhiệm vụ tự cập nhật khi quay lại tab và mỗi 30 giây khi trang đang hiển thị, tạm dừng khi mở form. Nộp nội dung/link và giữ lịch sử; sinh viên không tự xác nhận DONE. UI không giả lập bài nộp hay trạng thái nếu API chưa sẵn sàng.

## Công việc dành cho nhánh backend riêng

Đối soát Render ngày 30/10/2026 còn thấy: `/auth/me` thiếu StudentID; nguồn điều kiện giữa cửa sổ đăng ký và opportunities chưa thống nhất; API task/submission mới trả 404; AI thiếu cấu hình. Frontend giữ các lời gọi/hợp đồng để tích hợp khi backend được cập nhật, không tự bỏ qua điều kiện nộp đơn.

Các sửa backend trước đó đã được lưu ngoài phần thay đổi commit tại `.cache/student-backend-handoff-20261030/backend-student.patch` cùng bản sao file và manifest. Patch đã qua `git apply --check` trên backend gốc; người dùng tự tạo nhánh backend rồi áp dụng khi cần. Nhánh frontend không sửa DB hoặc tạo nhánh backend.

## Kiểm tra

Chạy từ thư mục frontend:

```powershell
npm.cmd run build
node scripts/check-student-scope.cjs
node scripts/check-student-axios-browser.cjs
```

Kiểm tra scope bảo đảm chỉ có file sinh viên và phần route sinh viên thay đổi. Kiểm tra Axios chạy Chrome ẩn với API giả lập local, kiểm tra instance độc lập, JWT, FormData/blob, lỗi/hủy request và tương thích StudentID; không gửi thông tin sang Render hay Supabase.
