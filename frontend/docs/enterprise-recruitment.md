# Giao diện tuyển dụng doanh nghiệp

Trang: `/enterprise/jobs`, yêu cầu tài khoản doanh nghiệp.

| Thao tác | API |
| --- | --- |
| Xem đợt, giờ mở và hạn đăng/sửa tin | GET `/api/enterprise/recruitment/windows` |
| Xem tin và các vị trí đầy đủ | GET `/api/enterprise/recruitment/posts` |
| Tạo tin, tự gửi QHDN duyệt | POST `/api/enterprise/recruitment/posts` |
| Sửa tin, tự gửi lại QHDN duyệt | PATCH `/api/enterprise/recruitment/posts/:id` |

Token được đính kèm bằng transport Axios hiện có. API tuyển dụng không gửi companyId; backend lấy doanh nghiệp từ JWT. Không thay đổi transport, auth, router hoặc giao diện các role khác.

Form hỗ trợ 1–50 vị trí, mô tả, yêu cầu, chỉ tiêu, địa điểm, hình thức làm việc, quyền lợi và hướng dẫn ứng tuyển. Thời gian được nhập theo múi giờ thiết bị và chuyển sang ISO khi gửi. Hạn sinh viên ứng tuyển phải sau hạn doanh nghiệp đăng tin và trong học kỳ (backend kiểm tra giới hạn cuối học kỳ).

Tin chỉ được chỉnh sửa khi chưa công bố và đợt còn nhận tin. Giữ nguyên ID và toàn bộ vị trí cũ khi cập nhật. Không giảm chỉ tiêu dưới số sinh viên đã nhận. Đợt hết hạn, tin đã công bố hoặc không có đợt mở sẽ khóa thao tác tương ứng. Nếu API từ chối, giữ nội dung form và hiển thị lỗi; chỉ báo thành công sau khi backend xác nhận.

## Kiểm thử

Build frontend bằng `npm run build` trong `frontend`.

Kiểm thử trình duyệt gọi API thật qua backend hiện có, dùng Chrome headless và PostgreSQL thử riêng. Không cần cài thêm dependency. Backend cần đã build; PostgreSQL cục bộ cần đang chạy trên cổng 55440 với database thử có tên như bên dưới.

```powershell
$env:ENTERPRISE_TEST_DATABASE_URL='postgresql://enterprise_test@127.0.0.1:55440/enterprise_recruitment_test'
node scripts/check-enterprise-recruitment-browser.cjs
```

Chỉ chạy từ `frontend` trên database test: script có chặn nhầm host/cổng/tên DB và **reset database thử này** bằng `backend/DB`. Script tự mở backend, Vite và Chrome cục bộ, rồi đóng khi hoàn tất; không thay đổi code backend hoặc gửi dữ liệu lên hệ thống triển khai.

Các kiểm tra: tải đợt/hạn qua GET, chặn tổng chỉ tiêu bằng 0, tạo hai vị trí bằng POST, chống gửi trùng, sửa bằng PATCH và bảo toàn ID, xử lý 409 khi hết hạn, khóa sửa sau công bố QHDN, giao diện điện thoại, phím Escape, không có đợt mở, lỗi tải đợt/thử lại và lỗi JavaScript chưa xử lý.

Ảnh desktop/mobile và báo cáo request được lưu ở `frontend/.cache/enterprise-recruitment-<pid>/`. JWT không ghi vào báo cáo.
