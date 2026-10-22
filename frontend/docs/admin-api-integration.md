# Kết nối API cho giao diện Admin

Phạm vi: các màn hình Admin của nhánh `Role_Admin_Nhat`. Không thay đổi nghiệp vụ của các vai trò khác.

| Màn hình / thao tác | API | Trạng thái |
| --- | --- | --- |
| Đăng nhập | POST /api/auth/login, GET /api/auth/me | Dùng token và vai trò backend; loại token mock cũ |
| Đổi mật khẩu tạm thời | POST /api/auth/change-password | Bắt buộc trước khi vào nghiệp vụ; đăng nhập lại sau khi đổi |
| Tổng quan | POST /api/admin/dashboard | Số tài khoản, tài khoản hoạt động, sinh viên, doanh nghiệp, kỳ OJT |
| Số tài khoản theo vai trò / trạng thái | GET /api/accounts | Tính từ toàn bộ danh sách trả về, không gửi query/page/limit |
| Thêm tài khoản cán bộ / admin | POST /api/accounts | Nhận username, fullName, email, phone, password, roleId |
| Cập nhật / ngừng hoạt động | PATCH /api/accounts/update | userId trong JSON; không xóa dòng giả ở frontend |
| Gửi lại email đăng nhập bị lỗi | POST /api/imports/emails/resend | Backend kiểm tra email còn hạn và đủ điều kiện retry |
| Đặt lại mật khẩu | POST /api/auth/users/password-reset | Nhận userId; thông báo đã xếp hàng, không báo email đã gửi thành công |
| Nhật ký hoạt động | POST /api/admin/audit-logs/list | Bộ lọc, phân trang theo API, xem JSON đầy đủ của từng log |
| Hồ sơ cá nhân | GET /api/auth/me, PATCH /api/accounts/me/profile | Sửa họ tên, điện thoại; cập nhật tên trên header |
| Đổi mật khẩu cá nhân | POST /api/auth/change-password | Đăng xuất sau khi đổi thành công |
| Cấu hình AI ngoài | Chưa có | Không gọi lại các API dự đoán cũ; nút lưu bị vô hiệu hóa |
| Cài đặt toàn hệ thống | Chưa có | Giữ mockup ở trạng thái xem trước, các trường và nút lưu bị vô hiệu hóa |
| CPU / RAM / uptime | Chưa có | Không hiển thị số liệu giả; chỉ đo thời gian tải log ở frontend |

## Chạy frontend

- Chạy backend ở cổng 3000 rồi `npm run dev` trong frontend.
- Dev server proxy `/api` tới `http://localhost:3000`; đổi bằng `API_PROXY_TARGET` trong file môi trường nếu cần.
- Nếu triển khai frontend riêng, đặt `VITE_API_BASE_URL` thành URL đầy đủ kết thúc bằng `/api`, hoặc cấu hình reverse proxy cho `/api`.
- Xem `.env.example`. Không đưa mật khẩu hoặc token vào các biến VITE.
- Đăng nhập bằng email và mật khẩu thật. Vai trò được lấy từ backend, không lấy quyền từ nút chọn vai trò của mockup.

## Giới hạn hiện tại

- API danh sách vai trò đã bị xóa. `roleId` được lấy từ tài khoản hiện có cùng vai trò, không đoán ID. Nếu một vai trò chưa có bất kỳ tài khoản nào, frontend chưa thể tạo tài khoản đầu tiên cho vai trò đó qua mockup này.
- Sinh viên và doanh nghiệp phải được tạo qua import theo backend. Mockup Admin hiện không có luồng import nên không tạo giả các hồ sơ này.
- Backend kiểm tra ràng buộc đổi vai trò của tài khoản có hồ sơ liên kết và không cho tự vô hiệu hóa tài khoản đang dùng.
- Nhật ký dùng phân trang vì endpoint POST hiện trả dữ liệu theo page/limit. Danh sách tài khoản vẫn tải toàn bộ như yêu cầu.
- Không có thay đổi bảng/cột DB hoặc API backend trong đợt kết nối UI này.

## Đã kiểm tra

- Build TypeScript + Vite thành công.
- Render 5 trang Admin bằng React SSR thành công.
- Kiểm tra 7 lời gọi dịch vụ Admin với phản hồi mô phỏng, đối chiếu đường dẫn, phương thức, JSON và Bearer token với OpenAPI đang chạy.
- Kiểm tra xử lý lỗi 401, phản hồi không phải JSON và mất kết nối.
- Kiểm tra chỉ đọc DB: tổng quan, danh sách 16 tài khoản, 5 nhật ký; cấu trúc dữ liệu phù hợp với frontend.
- Không gửi email, đặt lại mật khẩu hoặc thay đổi tài khoản thật để kiểm tra. Chưa kiểm tra tương tác trực tiếp bằng trình duyệt vì browser automation đang bị tắt trong Work settings.
