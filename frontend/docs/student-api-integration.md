# Cổng sinh viên — kết nối API

Frontend dùng `VITE_API_URL` (gồm `/api`) và JWT `ojt_auth_token`. Ưu tiên lấy `studentId` từ `GET /auth/me`; không dùng UserID làm StudentID. Với phiên bản backend bỏ sót trường này, frontend lấy liên kết từ `GET /students/me/internships` không có bộ lọc, do máy chủ tự xác định sinh viên đang đăng nhập. Sau khi tải hồ sơ, kiểm tra lại `profile.id` và `profile.userId` khớp phiên hiện tại. `studentId: null` rõ ràng vẫn là lỗi chưa liên kết; không tự gán ID.

Toàn bộ HTTP của ứng dụng dùng Axios instance trong `src/services/api.ts`, adapter `xhr`, timeout 60 giây. `apiRequest` chỉ là wrapper Axios giữ envelope và mã lỗi backend; không dùng Fetch. Các hàm sinh viên nằm trong `studentService.ts`. JSON truyền bằng `data`, query bằng `params` hoặc `studentQuery`, PDF tải bằng `responseType: 'blob'`; FormData giữ boundary do trình duyệt tạo.

Network DevTools có thể hiển thị request đỏ với status trống/0 B khi đổi trang, đổi kỳ hoặc cleanup effect: đó là cancellation, không phải HTTP 4xx/5xx. React StrictMode chạy lại effect trong development; request đã bị hủy trước dispatch được bỏ qua. HTTP 304 là sử dụng cache hợp lệ. Trang tiến độ lấy phân công và nhiệm vụ bằng một request internships. Không tắt StrictMode hoặc bỏ cơ chế hủy request để che màu đỏ.

Kiểm thử transport trong Chrome headless bằng `node scripts/check-axios-browser.cjs` tại frontend. Script tự khởi động Vite tạm và API fixture local; không truy cập DB hoặc Render. Cần Chrome tại đường dẫn mặc định Windows hoặc đặt `CHROME_PATH`.

Khi phát triển local, tạo `.env.development.local` trong `frontend`:

```dotenv
VITE_API_URL=/api
API_PROXY_TARGET=http://localhost:3000
```

Khởi động backend và Vite, rồi đăng nhập lại. Cấu hình này chỉ áp dụng development; production cần `VITE_API_URL` trỏ tới backend đã triển khai cùng phiên bản. Restart Vite sau khi đổi biến môi trường.

`StudentPortalProvider` chia sẻ hồ sơ, đợt OJT và số thông báo chưa đọc. Cổng sinh viên đã bỏ chatbot nổi, combo đã xác nhận và đăng ký/xác nhận combo; provider không gọi API đợt combo. Dữ liệu và API combo của phân hệ Đào tạo vẫn giữ nguyên. Kỳ mục tiêu lấy từ lộ trình khóa ở nấc 6, nên sinh viên kỳ 5 vẫn có kỳ OJT dù chưa đăng ký. Request được giới hạn theo tài khoản; phản hồi cũ bị bỏ qua khi đổi phiên hoặc bộ lọc.

| Màn hình / thao tác | API hiện tại, tương đối với `/api` |
| --- | --- |
| Tài khoản đang đăng nhập | `GET /auth/me` — envelope `user` |
| Dashboard, học vụ, điều kiện, môn bổ sung | `GET /students/me/dashboard?ojtSemesterId=…` |
| Hồ sơ, bảng điểm, chương trình học | `GET /students/:id?include=academicProgress,courseResults,curriculum,…` |
| Tư vấn AI | `GET /students/me/roadmap-recommendations?ojtSemesterId=…` |
| Đợt và đăng ký OJT | `GET /ojt-registration-windows`, `GET /ojt-registrations`, `POST /ojt-registrations` |
| Trạng thái theo kỳ | `GET /ojt-semesters/:id/students` |
| CV | `POST /students/me/cv`, `GET /students/:id/cv?cvFileId=…` |
| Vị trí và ứng tuyển | `GET /students/me/opportunities?windowId=…`, `GET /job-applications`, `POST /job-applications` |
| Phân công, nhiệm vụ, kết quả đã công bố | `GET /students/me/internships?ojtSemesterId=…` |
| Nhiệm vụ sinh viên được giao | `GET /students/me/tasks?ojtSemesterId=…&page=…&limit=20` |
| Lịch sử và nộp nhiệm vụ | `GET`, `POST /students/me/tasks/:id/submissions`; JSON POST `{content}` |
| Chi tiết kết quả của mình | `GET /students/me/internships?ojtSemesterId=…&resultId=…` |
| Thông báo | `GET /students/me/notifications`, `PATCH /students/me/notifications/:id` với `{isRead:true}` |
| Thông tin cá nhân `/student/profile` | `PATCH /accounts/me/profile` — envelope `account`, tên trường `full_name`, `phone` |
| Mật khẩu | `POST /auth/change-password`; từ 12 ký tự, tối đa 72 byte UTF-8; đăng nhập lại sau thành công |

GET không có body; JSON có `Content-Type: application/json`; upload PDF dùng FormData field `cv`, tối đa 10 MiB. Không tự đặt Content-Type JSON cho FormData. API nghiệp vụ trả `data`, trừ Auth (`user`), cập nhật tài khoản (`account`), và tải CV (PDF).

Danh sách thường dùng trang 20 bản ghi. `allStudentPages` đọc đủ các trang khi tải danh sách đợt/đơn ứng tuyển. Bảng điểm tải đủ các trang bằng `resultsPage/resultsLimit=100`, sau đó lọc và phân trang 20 dòng trên giao diện. Cột **Kỳ** dùng `semesterTaken` (0, 1, 2, ...); cột **Học kỳ** dùng `periodCode` (Spring/Summer/Fall). Bộ lọc kỳ và tìm môn áp dụng trên toàn bộ bảng điểm, không chỉ trang hiện tại. Chương trình/lộ trình cũng phân trang 20 môn. Internships có `tasksPage/tasksLimit` và `resultsPage/resultsLimit` độc lập; tìm nhiệm vụ và thông báo vẫn áp dụng trong trang đang xem.

## Điều kiện và ứng tuyển

Menu duy nhất **OJT & hồ sơ ứng tuyển** trỏ tới `/student/ojt-registration`; `/student/ojt-profile` cũ chuyển hướng về trang này. Trang gộp danh sách doanh nghiệp theo đợt OJT, thông tin liên hệ/vị trí tuyển dụng trong cửa sổ chi tiết, CV cá nhân và lịch sử đơn. Thẻ phân công thực tập đã bỏ khỏi giao diện sinh viên; dữ liệu liên kết nội bộ vẫn giữ để xác định người được giao task. Danh sách doanh nghiệp được nhóm theo `company.id` từ các vị trí đã công bố trong kỳ đã chọn, không phụ thuộc sinh viên đã đủ điều kiện nộp đơn hay chưa.

Nút **Nộp đơn đăng ký OJT** mở popup chọn doanh nghiệp/vị trí, thông tin liên hệ và CV PDF. Có thể dùng CV đã lưu hoặc upload mới; upload hoàn tất trước khi gửi đơn để backend gắn phiên bản CV hiện tại vào đơn. CV mới cũng được lưu riêng trong hồ sơ; thay CV sau này không thay file đã gắn ở đơn cũ. Khóa gửi ngăn click lặp; nếu nộp đơn lỗi sau upload, CV vẫn được giữ để thử lại. Mục **CV của tôi** cho tải CV độc lập để chuẩn bị tích hợp AI gợi ý doanh nghiệp sau này, chưa tự chạy AI.

`officialEligibility` là xác nhận từ `EligibilityChecks` cũ. `admissionEligibility` phản ánh bằng chứng Đào tạo đã bàn giao: kết quả frontend được lưu hoặc xác nhận cũ. Hai trường giữ ý nghĩa riêng.

Ứng tuyển cần bàn giao đúng sinh viên/kỳ, kết quả ELIGIBLE còn hiệu lực và đúng batch bàn giao, chương trình không thay đổi, cửa sổ đang mở, tin tuyển dụng còn hạn, vị trí còn chỗ, và chưa có đơn đang xử lý/phân công đang hiệu lực. Giao diện dùng `canSubmit`, `canApply` và blockers; backend kiểm tra lại khi ghi.

Ứng tuyển trực tiếp gửi `POST /job-applications` với `{windowId,postId,positionId,coverLetter,application:{contactPhone,contactEmail,note}}`. ID lấy từ API. Backend tạo/cập nhật đăng ký và đơn trong cùng transaction. Gửi lại cùng yêu cầu không tạo điều phối trùng. Sinh viên bị từ chối có thể nộp lại, giữ lịch sử điều phối.

## Tài khoản import và giới hạn hiện tại

Tài khoản có `mustChangePassword` được đưa tới `/student/profile` để đổi mật khẩu trước. Không tải nghiệp vụ sinh viên bằng mật khẩu tạm.

- Chưa cấu hình `ROADMAP_SERVICE_URL`: AI trả `503 AI_NOT_CONFIGURED`. Giao diện giữ lỗi nghiệp vụ, không báo nhầm proxy hỏng.
- Trang **Nhiệm vụ thực tập** nhận task của chính tài khoản, tự cập nhật mỗi 30 giây khi tab đang hiển thị hoặc khi quay lại tab. Sinh viên nộp nội dung/link bài làm qua popup, xem lịch sử, không tự xác nhận DONE. Doanh nghiệp xem lịch sử và xác nhận/làm lại qua `PATCH /enterprise/tasks/:id/status`. Chưa upload file task trực tiếp và chưa có báo cáo tuần. Chi tiết: [student-task-submissions.md](../../backend/docs/student-task-submissions.md).
- Chỉ kết quả OJT đã CONFIRMED được công bố. Chưa công bố thì danh sách rỗng.
- Chưa có thao tác rút đơn/xóa CV trong các API sinh viên hiện hành.

Đối soát DB và kết quả kiểm tra: [student-flow-audit.md](../../backend/docs/student-flow-audit.md).
