# Cập nhật tài khoản Admin

Dùng PATCH /api/json/accounts với userId và một hoặc nhiều trường: fullName, phone, email, status, roleId. Native route: PATCH /api/accounts/{userId}.

Đã xóa PUT /api/json/accounts và hai API PATCH /api/json/accounts/status, /api/json/accounts/role cùng native routes cũ. FE cần chuyển các lời gọi này sang PATCH /api/json/accounts.

Response giữ success/message/account; account có vai trò và studentId/enterpriseId. Các trường không gửi giữ nguyên; phone=null xóa số điện thoại. Body rỗng hoặc trường ngoài danh sách bị từ chối.

Chỉ ADMIN được cập nhật. Mọi trường được kiểm tra và ghi trong một transaction có khóa tài khoản. Không tự khóa hoặc đổi vai trò của chính mình. Không chuyển vai trò trái với hồ sơ sinh viên/doanh nghiệp liên kết. Đổi trạng thái hoặc vai trò làm tăng AuthVersion một lần để thu hồi phiên cũ.

PATCH /api/accounts/me/profile và API đổi mật khẩu giữ riêng.
