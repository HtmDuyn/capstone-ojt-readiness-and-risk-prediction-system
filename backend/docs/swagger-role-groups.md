# Nhóm API trên Swagger

Swagger `/api-docs`; tài liệu máy đọc `/api-docs/openapi.json`.

| Nhóm | Số API hiển thị |
|---|---:|
| Admin | 18 |
| Phòng đào tạo | 67 |
| Phòng QHDN | 33 |
| Doanh nghiệp | 10 |
| Sinh viên | 19 |
| Auth | 4 |

Tổng 133 API duy nhất. Nhóm Admin chỉ hiển thị chức năng quản trị riêng; API nghiệp vụ đã có nhóm phụ trách không lặp lại trong Admin. Middleware/service và x-roles vẫn giữ nguyên quyền Admin. Tag không thay thế phân quyền và quyền sở hữu. Health công khai được đặt trong Admin.

`src/config/swagger-role-groups.ts` kiểm tra thiếu/trùng/dư operation. Các API dùng route REST gốc; ID trên path, bộ lọc trên query. Xem `swagger-api-by-role.md` và `backend-workflow.md` để biết chức năng và luồng import/điểm chính thức.
