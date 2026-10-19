# Nhóm API trên Swagger

Swagger `/api-docs` hiển thị đúng sáu nhóm theo thứ tự:

| Nhóm | Số operation hiển thị |
| --- | ---: |
| Admin | 148 |
| Phòng đào tạo | 89 |
| Phòng QHDN | 40 |
| Doanh nghiệp | 10 |
| Sinh viên | 20 |
| Auth | 3 |

Có 160 operation duy nhất. API dùng chung xuất hiện trong từng nhóm role được phép gọi nên tổng số ở các nhóm lớn hơn 160. Phạm vi bản ghi vẫn theo kiểm tra trong service: sinh viên chỉ xem hồ sơ của mình, doanh nghiệp chỉ thao tác dữ liệu thuộc doanh nghiệp của mình.

Auth chứa đăng nhập, thông tin phiên và đổi mật khẩu. Đặt lại mật khẩu theo userId dành cho Admin. Health công khai được đặt ở nhóm Admin để không phát sinh nhóm thứ bảy.

Các nhóm luôn hiển thị; Authorize cung cấp JWT khi gọi API, không tự ẩn nhóm theo token. Thay đổi này chỉ tổ chức tài liệu, giữ nguyên URL, body, response và quyền truy cập thực tế.

`src/config/swagger-role-groups.ts` khai báo quyền theo METHOD + URL gốc, đối chiếu middleware route. `swagger.ts` áp dụng nhóm trước khi sinh adapter JSON để hai hợp đồng giữ cùng metadata. `x-roles` lưu các role ở mức route; API công khai có danh sách rỗng. Khi thêm/xóa API phải cập nhật bảng quyền: thiếu, trùng hoặc dư operation sẽ báo lỗi khi sinh Swagger.
