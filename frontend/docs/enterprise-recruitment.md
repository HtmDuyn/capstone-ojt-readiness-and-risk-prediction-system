# Giao diện tuyển dụng doanh nghiệp

Trang: `/enterprise/jobs`, yêu cầu tài khoản doanh nghiệp.

| Thao tác | API |
| --- | --- |
| Xem đợt, giờ mở và hạn đăng/sửa tin | GET `/api/enterprise/recruitment/windows` |
| Xem tin và các vị trí đầy đủ | GET `/api/enterprise/recruitment/posts` |
| Tạo và công bố tin ngay | POST `/api/enterprise/recruitment/posts` |
| Sửa nội dung tin đã công bố | PATCH `/api/enterprise/recruitment/posts/:id` |

Token được đính kèm bằng transport Axios hiện có. API tuyển dụng không gửi companyId; backend lấy doanh nghiệp từ JWT. Không thay đổi transport, auth hoặc router. Ngoài giao diện doanh nghiệp, chỉ gỡ thao tác duyệt cũ ở màn tin tuyển dụng QHDN theo yêu cầu bổ sung; không sửa backend.

Giao diện QHDN đã bỏ thao tác duyệt/công bố/từ chối tin, trường hạn khi duyệt và hàm frontend gọi API review. QHDN chỉ xem tin và vị trí trong màn hình tuyển dụng; các chức năng quản lý đợt, doanh nghiệp và phân công không thay đổi. Các trạng thái PENDING_REVIEW/REJECTED còn đọc được để hiển thị lịch sử, không tạo một bước duyệt mới.

Form hỗ trợ 1–50 vị trí, mô tả, yêu cầu, chỉ tiêu, địa điểm, hình thức làm việc, quyền lợi và hướng dẫn ứng tuyển. Hạn đăng/sửa tin và hạn ứng tuyển do QHDN quản lý, chỉ hiển thị để xem. Frontend không gửi `deadlineAt` trong POST/PATCH, không tự cộng ngày và không gọi API gửi duyệt.

Tin đã công bố vẫn chỉnh sửa được trong hạn. Frontend dùng `canCreate`, `canEdit`, `editLockCode` và `studentRegistrationWindow` từ backend để giải thích việc khóa sửa khi sinh viên đang đăng ký OJT. Giữ nguyên ID và toàn bộ vị trí cũ khi cập nhật; không giảm chỉ tiêu dưới số sinh viên đã nhận. Nếu API từ chối, giữ nội dung form và hiển thị lỗi; chỉ báo công bố thành công khi response có trạng thái PUBLISHED.

Mỗi form tạo tin giữ một `idempotencyKey` cho mọi lần gửi lại, kể cả khi mất phản hồi hoặc sửa nội dung sau lỗi. Backend trả lại tin đã tạo nếu payload giống nhau; payload khác với key đã lưu trả 409 để tránh tạo thêm tin. Khóa nút gửi trong lúc chờ. Muốn tạo tin khác thì mở form mới.

Danh sách và vị trí lấy từ API tổng hợp, không gọi API chi tiết riêng. Dữ liệu phân trang được loại hàng trùng theo ID; tổng chỉ tiêu/chỗ trống đếm từng PositionID một lần. Bộ lọc đợt thực sự lọc tin. Sau khi lưu, thay đúng tin theo ID bằng response của API, không tải lại toàn bộ tin/đợt. Giao diện dùng danh sách dạng hàng, thông số tổng quan cùng một dải và form có một vùng cuộn, footer lưu cố định.

## Kiểm thử

Build frontend bằng `npm run build` trong `frontend`.

Kiểm thử trình duyệt gọi API thật qua backend v2 (`feature/be-dn-update-v2`), dùng Chrome headless và PostgreSQL thử riêng. Không cần cài thêm dependency. Backend cần đã build; PostgreSQL cục bộ cần đang chạy trên cổng 55440 với database thử có tên như bên dưới. Nếu checkout frontend chứa backend cũ, chỉ định bản backend v2 riêng bằng `ENTERPRISE_BACKEND_ROOT`; không thay code backend trong nhánh frontend.

```powershell
$env:ENTERPRISE_TEST_DATABASE_URL='postgresql://enterprise_test@127.0.0.1:55440/enterprise_recruitment_test'
$env:ENTERPRISE_BACKEND_ROOT='D:/path/to/built-backend-v2'
node scripts/check-enterprise-recruitment-browser.cjs
```

Chỉ chạy từ `frontend` trên database test: script có chặn nhầm host/cổng/tên DB và **reset database thử này** bằng `backend/DB`. Script tự mở backend, Vite và Chrome cục bộ, rồi đóng khi hoàn tất; không thay đổi code backend hoặc gửi dữ liệu lên hệ thống triển khai.

Các kiểm tra: tải đợt/hạn, chặn tổng chỉ tiêu bằng 0, tạo hai vị trí và sinh viên thấy ngay; gửi kép/mất phản hồi/thử lại không tạo trùng; PATCH giữ ID và hạn; không gọi GET dư sau lưu; loại hàng trùng, lọc đợt, khóa sửa khi mở đăng ký OJT, chỉ tiêu khi nhận sinh viên đồng thời, lỗi hết hạn, giao diện điện thoại, phím Escape, không có đợt mở, lỗi tải đợt/thử lại và lỗi JavaScript chưa xử lý.

Ảnh desktop/mobile và báo cáo request được lưu ở `frontend/.cache/enterprise-recruitment-<pid>/`. JWT không ghi vào báo cáo.
