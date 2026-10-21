# Cập nhật hồ sơ doanh nghiệp đã được import

API riêng: **PATCH /api/enterprise/profile**. Vai trò ENTERPRISE; JWT bắt buộc. Chỉ cập nhật doanh nghiệp đang hoạt động được liên kết với tài khoản. Không tạo doanh nghiệp, tài khoản, tin tuyển dụng hoặc vị trí.

Đã đối chiếu information_schema.columns của DB đang cấu hình cho Enterprises, EnterpriseUsers và Users. Không thêm các trường chưa có trong DB như website, mã số thuế hoặc logo.

| JSON input | Cột DB | Điều kiện |
|---|---|---|
| companyId | Enterprises.EnterpriseID | Số nguyên dương bắt buộc, thuộc tài khoản đăng nhập |
| name | Enterprises.Name | Tối đa 200 ký tự, không được rỗng/null |
| address | Enterprises.Address | Tối đa 300 ký tự, cho phép null |
| industry | Enterprises.Industry | Tối đa 100 ký tự, cho phép null |
| contactPersonName | Enterprises.ContactPersonName | Tối đa 100 ký tự, cho phép null |
| contactPhone | Enterprises.ContactPhone | Tối đa 20 ký tự, cho phép null |
| contactEmail | Enterprises.ContactEmail | Email hợp lệ, tối đa 100 ký tự, cho phép null |
| positionTitle | EnterpriseUsers.PositionTitle | Chức danh của tài khoản hiện tại, tối đa 100 ký tự, cho phép null |

Nhập companyId cùng ít nhất một trường cần sửa. Bỏ trường giữ nguyên; null hoặc chuỗi rỗng xóa trường tùy chọn. Không thay đổi thông tin tài khoản cá nhân khi sửa người liên hệ doanh nghiệp.

~~~json
{
  "companyId": 1,
  "name": "Công ty ABC",
  "address": "123 Nguyễn Văn Linh, TP. Hồ Chí Minh",
  "industry": "Công nghệ thông tin",
  "contactPersonName": "Nguyễn Thị Mai",
  "contactPhone": "0901234567",
  "contactEmail": "hr@example.com",
  "positionTitle": "Trưởng phòng nhân sự"
}
~~~

Response: success=true, data chứa id, code, name, address, industry, contactPersonName, contactPhone, contactEmail, status, createdAt và representative { id, userId, username, fullName, email, phone, positionTitle }. representative.id là EnterpriseUserID. code/status/createdAt và thông tin tài khoản là chỉ đọc. Không kèm tin tuyển dụng hoặc thống kê tuyển dụng.

400: thiếu/sai companyId, không có trường cập nhật, vượt độ dài, email không hợp lệ hoặc trường không hỗ trợ. 401: chưa đăng nhập. 403: sai vai trò, doanh nghiệp không thuộc tài khoản, đã xóa hoặc không ACTIVE. Các thay đổi và audit log được ghi trong cùng transaction.

PATCH /api/accounts/me/profile chỉ sửa fullName và phone cá nhân. Email đăng nhập, username, role và trạng thái tài khoản không sửa qua API hồ sơ doanh nghiệp.
