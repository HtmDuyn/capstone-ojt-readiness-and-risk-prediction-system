# API sau khi xóa/gộp

Danh sách và JSON body hiện hành: [api-input-reference.md](api-input-reference.md). Sau hai lượt gộp, Swagger còn 176 operation (ban đầu 196). Xem [sáu cặp search/detail vừa gộp](api-search-consolidation.md). Các URL cũ trong bảng dưới đã bị xóa cả route và Swagger; adapter JSON tương ứng cũng bị xóa. Những native route còn lại được giữ vì adapter JSON đang sử dụng chúng.

| API đã xóa | API thay thế / hành vi mới |
| --- | --- |
| GET, POST `/api/ojt-semesters`; GET, PATCH `/api/ojt-semesters/{id}` | Học kỳ do Đào tạo tạo qua `/api/academic-periods`; bản ghi OJT kỹ thuật được tự liên kết. Search/detail học kỳ trả `ojtSemesterId` và `ojt`. PATCH học kỳ nhận cấu hình `ojt` lồng bên trong. |
| PATCH `/api/students/academic-placement` | Giữ PATCH `/api/students/{id}/academic-placement`, hiển thị qua PATCH `/api/json/students/academic-placement` với `studentId` trong body. |
| GET `/api/students/{id}/predictions` | POST `/api/json/predictions/search` với `studentId`. |
| POST, PATCH `/api/positions`, `/api/positions/{id}` | Tạo vị trí cùng tin tuyển dụng; sửa/thêm vị trí qua PATCH `/api/json/recruitment/posts` với `postId`, `positions`, `reason`. Search/detail vị trí cho quản trị vẫn giữ. |
| GET `/api/curricula/{id}/combos` | POST `/api/json/curricula/detail`; danh sách combo trong `data.combos`. |
| GET `/api/assessments`, `/api/assessments/{id}` | POST `/api/json/internship-evaluations/search` và `/detail`. Giữ thông tin template, điểm chi tiết, sinh viên, học kỳ và lịch sử; search hỗ trợ `templateId`. |
| GET `/api/admin/dashboard/readiness`, `/risks`, `/trends` | POST `/api/json/admin/dashboard/search`; `section` là `all`, `readiness`, `risks`, `trends`; mặc định trả cả ba trong cùng snapshot. |
| GET `/api/admin/reports/risks` | POST `/api/json/admin/reports/readiness/search`; dữ liệu chứa cả readiness và risk. |
| GET `/api/recruitment/posts/{id}` | POST `/api/json/recruitment/posts/search` với `postId`; trả đầy đủ vị trí, vẫn áp dụng phạm vi doanh nghiệp. |
| POST `/api/auth/logout` | Client xóa token đang lưu. Endpoint cũ chỉ trả thành công, không thu hồi JWT trên server. |

PUT `/api/json/accounts` chỉ dành cho ADMIN sửa tài khoản theo `userId`. Người dùng tự xem/sửa thông tin qua GET/PATCH `/api/accounts/me/profile`.

## Cấu hình OJT trong học kỳ

PATCH `/api/json/academic-periods`:

```json
{
  "academicPeriodId": 6,
  "ojt": {
    "startDate": "2027-01-05",
    "endDate": "2027-04-20",
    "regStartDate": "2026-11-01",
    "regEndDate": "2026-12-20",
    "status": "PLANNED"
  }
}
```

Ngày OJT phải nằm trong học kỳ; hai ngày đăng ký phải cùng có hoặc cùng null. Block 3 không nhận cấu hình OJT. ID kỹ thuật được giữ để bảo toàn các liên kết hiện có. QHDN tiếp tục chọn `academicPeriodId` để mở recruitment window, không tạo kỳ OJT riêng.

## Sửa vị trí qua tin tuyển dụng

PATCH `/api/json/recruitment/posts`:

```json
{
  "postId": 1,
  "reason": "Cập nhật nhu cầu tuyển dụng",
  "positions": [{ "positionId": 1, "capacity": 8 }]
}
```

`positions` là các thay đổi từng vị trí, không thay thế toàn bộ danh sách. Bỏ `positionId` để thêm vị trí mới; khi đó bắt buộc `code`, `title`, `description`, `requirements`, `capacity`. Vị trí có lịch sử ứng tuyển/điều phối/thực tập chỉ được đổi sức chứa; sức chứa không được thấp hơn số sinh viên đang chiếm chỗ. Tin sửa chuyển về `PENDING_REVIEW`, QHDN duyệt công bố lại. Doanh nghiệp chỉ sửa tin của mình trong đợt đang mở.

Các FE gọi URL đã xóa cần chuyển sang hợp đồng mới ở trên. Thay đổi này không sửa FE và không yêu cầu reset hoặc thay đổi cấu trúc DB.
