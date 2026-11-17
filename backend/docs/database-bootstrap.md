# Khởi tạo và reset database

`backend/DB` là script khởi tạo **FULL RESET**: xóa dữ liệu ứng dụng rồi tạo lại schema và dữ liệu mẫu. Chỉ chạy toàn bộ file khi muốn khởi tạo/reset; nếu cần giữ dữ liệu đang dùng, áp dụng riêng khối cập nhật tương ứng. Các khối commit độc lập.

## Lỗi `P0001: Reset stopped: protected or unsupported dependent objects`

Đây là ngoại lệ do khối bảo vệ đầu script chủ động phát sinh. Script tìm thấy bảng/view phụ thuộc vào dữ liệu ứng dụng nhưng chưa được xác nhận thuộc phạm vi reset, hoặc đối tượng thuộc schema/extension cần bảo vệ. Kiểm tra này chạy trước các lệnh DROP.

Trường hợp báo `public."RecruitmentPostExtractions", public."OJTConditionPolicies"` là do danh sách reset bị thiếu:

- `OJTConditionPolicies` được tạo ở khối quản lý điều kiện OJT của chính script, nên lần chạy sau đã gặp bảng này.
- `RecruitmentPostExtractions` là bảng trích xuất JD trong phiên bản cũ; script hiện tại không còn tạo lại bảng này.

Danh sách reset đã bổ sung chính xác hai bảng và biến thể tên viết thường. Khi chủ động reset DB, dùng bản `backend/DB` đã sửa và chạy lại toàn bộ file. Nếu trình SQL còn giữ transaction bị lỗi, chạy `ROLLBACK;` trước khi chạy lại. Không bỏ khối kiểm tra hoặc thay bằng `DROP SCHEMA public CASCADE`, vì có thể xóa đối tượng ngoài ứng dụng.

Nếu thông báo nêu tên đối tượng khác, cần xác minh nguồn gốc và phụ thuộc của đối tượng trước khi đưa vào danh sách reset.

## Kiểm thử

Kiểm thử chỉ chấp nhận DB thử cục bộ `127.0.0.1:55441/ojt_bootstrap_audit`. Dùng DB thử riêng; toàn bộ dữ liệu ứng dụng trong DB này sẽ được khởi tạo lại.

```powershell
$env:DB_BOOTSTRAP_TEST_DATABASE_URL='postgresql://postgres@127.0.0.1:55441/ojt_bootstrap_audit'
node --test tests/database-bootstrap.integration.cjs
```

Kiểm tra khởi tạo, chạy lại khi có bảng quản lý điều kiện và bảng JD cũ, tạo lại dữ liệu mẫu, quyền RLS/service role, đồng thời bảo toàn dữ liệu ngoài ứng dụng và từ chối các phụ thuộc chưa được xác nhận.
