# Kiểm tra database cho student

Đã gộp phần kiểm tra của `scripts/audit-student-database.cjs` vào cuối `backend/DB` và bỏ file JavaScript này. Dự án vẫn dùng một database ứng dụng; kiểm tra không tạo database khác.

Khối kiểm tra bắt đầu bằng `-- BEGIN STUDENT DATABASE AUDIT (READ ONLY)` và kết thúc bằng `-- END STUDENT DATABASE AUDIT (READ ONLY)`.

- Khi khởi tạo mới bằng toàn bộ file DB, khối này tự kiểm tra trước COMMIT. Thiếu bảng/cột hoặc hàm học vụ thì báo lỗi, không commit bootstrap thiếu cấu trúc.
- Khi kiểm tra database hiện có, chỉ copy/chạy khối giữa hai dấu trên trong SQL editor kết nối đúng database. Có thể chạy trong transaction `BEGIN READ ONLY; ... ROLLBACK;`.
- Không chạy lại toàn bộ file DB chỉ để audit: phần đầu là FULL RESET và xóa dữ liệu ứng dụng.

Khối kiểm tra đọc 27 bảng cần thiết cho student, kiểm tra cột và hàm AssertStudentOJTTerm6, rồi in NOTICE về tài khoản chưa liên kết hồ sơ, nguồn bàn giao, số task/bài nộp và quyền SELECT/INSERT của tài khoản SQL đang chạy. Không in mật khẩu, token, dữ liệu bài nộp hoặc thông tin cá nhân.

Quyền được báo là quyền của kết nối SQL hiện tại. Khi chạy bằng tài khoản quản trị trong SQL editor, kết quả không xác nhận quyền của tài khoản backend nếu hai tài khoản khác nhau. JWT_SECRET và địa chỉ dịch vụ AI là cấu hình server, không thể kiểm tra từ SQL.

PostgreSQL localhost dùng trong các test là môi trường thử nghiệm riêng để không tác động dữ liệu của database ứng dụng; đó không phải yêu cầu triển khai thêm database cho dự án.
