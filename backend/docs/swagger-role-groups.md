# Nhóm API trên Swagger

Swagger `/api-docs`; tài liệu máy đọc `/api-docs/openapi.json`.

| Nhóm | Số API hiển thị |
|---|---:|
| Admin | 29 |
| Phòng đào tạo | 80 |
| Phòng QHDN | 33 |
| Doanh nghiệp | 9 |
| Sinh viên | 32 |
| Auth | 3 |

Tổng 158 API duy nhất. Nhóm Admin chỉ hiển thị chức năng quản trị riêng; API nghiệp vụ đã có nhóm phụ trách không lặp lại trong Admin. Middleware/service và x-roles vẫn giữ nguyên quyền Admin. Tag không thay thế phân quyền và quyền sở hữu. Health công khai được đặt trong Admin.

`src/config/swagger-role-groups.ts` kiểm tra thiếu/trùng/dư operation. Adapter JSON kế thừa cùng nhóm và quyền từ API gốc. Xem `swagger-api-by-role.md` và `backend-workflow.md` để biết chức năng và luồng import/điểm chính thức.
