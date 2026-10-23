# Danh sách nhật ký hoạt động — bản demo

`POST /api/admin/audit-logs/list`, quyền ADMIN, nhận JSON body.

```json
{
  "page": 1,
  "limit": 20,
  "entityType": "Students",
  "entityId": 12
}
```

Gửi `{}` để lấy trang đầu. Các bộ lọc tùy chọn: `logId`, `userId`, `entityType`, `entityId`, `action`. `page` mặc định 1, `limit` mặc định 20 và tối đa 100. Không nhận query parameters.

HTTP 200 trả `{success:true,data:{items,total,page,limit}}`, sắp xếp log mới nhất trước. Mỗi item gồm:

- `id`, `userId`, `entityType`, `entityId`, `action`, `createdAt`, `ipAddress`.
- `user`: thông tin tài khoản người thực hiện và vai trò hiện tại; null nếu không còn người thực hiện liên kết.
- `detail`: toàn bộ nội dung Detail; parse JSON nếu hợp lệ, giữ chuỗi gốc nếu không phải JSON. Không che trường nào trong bản demo.
- `rawLog`: đầy đủ tất cả cột AuditLogs gốc, gồm `LogID`, `UserID`, `Action`, `EntityType`, `EntityID`, `ActionAt`, `Detail`, `IPAddress`. Detail ở đây giữ nguyên dạng đã lưu.

Những dữ liệu chưa từng được ghi vào log không được dựng thêm. Không đổi cách ghi log hoặc dữ liệu DB. GET cũ và alias JSON tự sinh từ GET cũ đã được gỡ.
