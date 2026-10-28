# Kiểm thử QHDN trên local

Kết quả cập nhật ngày 28/10/2026. Xem thêm [hợp đồng Frontend sau sửa](qhdn-frontend-handoff.md).

| Kiểm tra | Kết quả |
|---|---|
| `npm run build` | Thành công |
| Khởi động entry `dist/server.js` | Kết nối DB, health và Swagger trả 200; đã dừng sau kiểm tra |
| `npm run test:qhdn` | 69/69 đạt; có HTTP end-to-end với toàn bộ script DB và trigger trong PostgreSQL bộ nhớ |
| HTTP local với tài khoản QHDN và Supabase dùng chung | 49/49 kiểm tra đạt |
| Ghi dữ liệu nghiệp vụ lên Supabase, migration | Không thực hiện |

## Nội dung đã sửa

- Khôi phục các module bị thiếu từ lịch sử Git của chính dự án, gồm catalog QHDN, repository, router doanh nghiệp/tuyển dụng, liên kết kỳ OJT, phân trang chi tiết và xử lý PDF.
- Khôi phục script copy asset, font PDF và giấy phép font để build/xuất PDF hoạt động.
- Nạp `backend/.env` khi có; nếu thiếu thì dùng `backend/src/.env`. Biến môi trường đã được đặt từ terminal/deployment vẫn được ưu tiên.
- Bỏ các controller tài khoản cũ không còn được router sử dụng và đang import các hàm đã bị loại bỏ. Không thay route tài khoản đang được mount.
- Bổ sung trường studentId vào kết quả truy vấn xác thực và kiểu dữ liệu tương ứng.
- Giữ lại academic khi payload import sinh viên có cung cấp; không thêm trường bắt buộc mới cho nhánh này.
- Sửa Swagger bị thiếu contract, thiếu ánh xạ role và còn annotation của các API không có handler. Các endpoint dùng chung của Admin vẫn giữ quyền Admin.
- QHDN không truy cập các thao tác đợt tuyển dụng cũ; Admin/Enterprise giữ các thao tác tương ứng đã có. Không tạo đợt ngầm trong import doanh nghiệp.
- API đọc tin tuyển dụng nhận `companyId`, `ojtSemesterId`; tin import trực tiếp vẫn trả academicPeriodId/periodCode khi WindowID là null.
- Thêm công tắc `RECRUITMENT_WORKER_ENABLED=false`; mặc định hoạt động của worker giữ nguyên.

## Chạy bộ test nghiệp vụ bằng dữ liệu riêng

Trong thư mục `backend`:

```powershell
npm run test:qhdn
```

Bộ test kiểm tra mở/đóng/gia hạn đăng ký, import JSON/Excel/CSV, rollback, giữ doanh nghiệp/tài khoản, lưu trữ sau năm tháng, nộp hồ sơ và ứng tuyển trong cùng giao dịch, hai danh sách QHDN, điều phối và phân quyền các role. Dependency PGlite chỉ dành cho development/test; không kết nối Supabase trong bộ test này.

## Chạy HTTP local với DB dùng chung

Đặt cấu hình DB và JWT_SECRET vào file env nói trên. Nhập tài khoản qua terminal để không ghi mật khẩu vào source:

```powershell
$env:QHDN_TEST_EMAIL = Read-Host 'Email QHDN'
$qhdnTestPassword = Read-Host 'Mật khẩu QHDN' -AsSecureString
$env:QHDN_TEST_PASSWORD = [System.Net.NetworkCredential]::new('', $qhdnTestPassword).Password
npm run test:qhdn:local:readonly
Remove-Item Env:QHDN_TEST_PASSWORD
```

Runner tự build, mở app trên một cổng loopback còn trống, đăng nhập bằng tài khoản thật và tự đóng server sau kiểm tra. Không khởi chạy bốn worker provisioning, tuyển dụng, advisory và eligibility. Mỗi kết nối DB được đặt và xác minh `default_transaction_read_only=on` trước khi đưa cho handler; runner dừng nếu không thiết lập được chế độ này. Không gọi API ghi nghiệp vụ.

Các kiểm tra gồm danh sách kỳ/doanh nghiệp/vị trí, hai danh sách sinh viên, bộ lọc trạng thái, điều phối/phân công/đánh giá, dashboard, báo cáo và CSV/PDF, phản hồi 400/401/403 và Swagger. Kết quả không chứa token, mật khẩu hoặc nội dung hồ sơ, được lưu tại `.local/qhdn-local-readonly-report.json` (đã được gitignore).

## Giới hạn kết quả

Lượt kiểm tra DB thật chưa có bàn giao/hồ sơ/ứng tuyển/phân công/kết quả. Các danh sách rỗng trả 200 xác nhận truy vấn chạy được, chưa chứng minh luồng ghi với hồ sơ thật. Luồng ghi và tải CV đã được kiểm thử qua HTTP trên PGlite nạp toàn bộ script DB, gồm trigger về kỳ chương trình, lịch sử học tập và liên kết điểm. Chưa chạy ghi toàn luồng trên Supabase dùng chung. AI chưa có dịch vụ thật; adapter được test với provider giả lập. Chưa deploy, commit hoặc push.
