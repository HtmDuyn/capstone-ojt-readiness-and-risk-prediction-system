# Hướng dẫn thông báo và gửi email

Chạy file `backend/migrations/20261120_system_notifications.sql` trên database hiện có trước khi triển khai bản sửa. File này bổ sung khóa sự kiện thông báo cho phép để trống, chỉ mục duy nhất để chống trùng và loại email `SYSTEM_NOTIFICATION` trong hàng đợi. Migration giữ nguyên dữ liệu hiện có và có thể chạy lại. Không chạy toàn bộ file khởi tạo `backend/DB` trên database đang sử dụng vì file đó sẽ đặt lại dữ liệu.

Backend cần chạy bằng `npm start` (`dist/server.js`). Đặt `PROVISIONING_JOBS_ENABLED=true` để gửi email và xử lý nhắc hạn. Đặt `ADVISORY_WORKER_ENABLED=true` nếu sử dụng thông báo tổng hợp giữa kỳ 5 theo lịch hoặc các đợt thông báo kết quả xét điều kiện OJT. Cấu hình các biến này trên môi trường chạy backend, chẳng hạn Render. Cấu hình frontend trên Vercel không điều khiển các tác vụ này. Khi backend ngủ hoặc dừng, các tác vụ theo lịch bên trong tiến trình cũng ngừng chạy; cần dùng dịch vụ chạy liên tục hoặc bộ lập lịch bên ngoài.

Các biến bắt buộc để gửi email gồm `SMTP_HOST`, `SMTP_FROM` và `EMAIL_OUTBOX_KEY` (64 ký tự thập lục phân). Đặt `FRONTEND_LOGIN_URL=https://capstone-ojt-readiness-and-risk-pre.vercel.app/login` trên backend để thống nhất địa chỉ đăng nhập. Cấu hình `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER` và `SMTP_PASSWORD` theo nhà cung cấp email. Cổng 465 thường dùng `SMTP_SECURE=true`; cổng 587 thường dùng `false` và STARTTLS. Giữ nguyên khóa mã hóa qua các lần triển khai để hệ thống tiếp tục giải mã được email đang chờ gửi. Kiểm tra SMTP ngay trên môi trường chạy backend vì khả năng kết nối mạng có thể khác máy phát triển.

Email cấp tài khoản cho các vai trò Sinh viên, Doanh nghiệp, Quản trị viên, Phòng Đào tạo và Phòng Quan hệ doanh nghiệp dùng mẫu chung với cả bản HTML và văn bản thuần. Nội dung gồm lời chào, vai trò, thông tin tài khoản, mã sinh viên/doanh nghiệp nếu có, hướng dẫn đăng nhập, nút mở hệ thống và thông tin hỗ trợ. Nếu `FRONTEND_LOGIN_URL` để trống hoặc trỏ đến `localhost`, địa chỉ loopback IPv4/IPv6, email cấp tài khoản tự dùng link production Vercel nêu trên. Có thể đặt một URL HTTP/HTTPS công khai khác khi thay đổi tên miền triển khai.

Hạn mật khẩu tạm hiển thị theo dạng `23/11/2026, 13:05 (giờ Việt Nam, UTC+7)`, lấy đúng thời điểm hết hạn đã lưu trong database. Thời hạn thực tế không thay đổi: tài khoản import dùng mật khẩu tạm trong 72 giờ; mật khẩu do quản trị viên đặt lại có hạn 24 giờ. Tài khoản nhân viên tạo thủ công vẫn dùng mật khẩu do quản trị viên cung cấp; email không ghi hạn mật khẩu tạm cho các tài khoản này. Mẫu mới áp dụng cho email được tạo sau khi cập nhật; email đã gửi hoặc đã xếp hàng trước đó giữ nguyên nội dung.

Khi import tài khoản, mỗi tài khoản được tạo mới có một email chứa thông tin đăng nhập được mã hóa trong hàng đợi và một thông báo chào mừng trong hệ thống. Import cập nhật sinh viên đã tồn tại không đặt lại mật khẩu hoặc gửi lại email cấp tài khoản. Xem trước và gửi lại cùng yêu cầu import không tạo bản ghi trùng. Khi tạo thủ công tài khoản nhân viên, thông báo chào mừng và email được lưu trong cùng transaction với tài khoản; email hướng dẫn dùng mật khẩu do quản trị viên cung cấp. Thông báo trong hệ thống không chứa mật khẩu.

Khi bấm tạo tài khoản hoặc xác nhận import, backend lưu dữ liệu thành công rồi gửi ngay email của những tài khoản vừa tạo, trước khi trả kết quả cho giao diện. Lượt gửi này hoạt động độc lập với chu kỳ kiểm tra mỗi phút và ưu tiên đúng email thuộc thao tác tạo hiện tại. Giao diện chỉ báo đã gửi khi SMTP đã chấp nhận email. Nếu gửi lỗi, tài khoản vẫn được giữ, email tiếp tục được lưu để thử lại và giao diện báo trạng thái thực tế. Gửi lại cùng yêu cầu không gửi trùng email đã thành công. Với import hàng loạt, lượt gửi trực tiếp xử lý tối đa 20 email trong khoảng thời gian bắt đầu gửi 15 giây; một email đang gửi có thể chờ thêm theo timeout SMTP. Tiến trình nền được kích hoạt ngay để tiếp tục xử lý phần còn lại theo từng nhóm, không chờ một phút giữa các nhóm đã gửi đủ 20 email.

Các thao tác tạo đợt tuyển dụng, mở/đóng đợt, sửa lịch và gia hạn đều tạo thông báo trong hệ thống và email được mã hóa trong hàng đợi. Sinh viên chỉ nhận thông báo cho kỳ OJT mà mình đã được bàn giao hoặc đăng ký. Tài khoản doanh nghiệp đang hoạt động nhận lịch tuyển dụng liên quan. Với các đợt đăng ký độc lập theo luồng cũ, người nhận là sinh viên đang hoạt động, đã được bàn giao và nằm trong phạm vi được cấu hình. Lưu lại lịch không thay đổi sẽ không tạo thêm thông báo.

Tiến trình xử lý thông báo và email kiểm tra mỗi phút, đồng thời được kích hoạt sau khi transaction tạo dữ liệu đã commit. Với đợt tuyển dụng đang mở, hệ thống thông báo khi từng giai đoạn đang diễn ra và nhắc một lần trong 24 giờ cuối trước khi hết hạn. Nhắc hạn đăng tin và phản hồi được gửi cho doanh nghiệp; nhắc hạn ứng tuyển được gửi cho sinh viên. Các đợt đăng ký theo luồng cũ cũng có thông báo mở đợt và nhắc trước hạn 24 giờ. Khóa sự kiện ngăn gửi trùng giữa các lần kiểm tra, khi khởi động lại hoặc khi nhiều tiến trình chạy đồng thời. Email lịch đang chờ sẽ bị hủy nếu mã nhận diện lịch không còn khớp với lịch hiện tại. Thông báo trong hệ thống vẫn được giữ làm lịch sử. Một giai đoạn ngắn vừa mở có thể phát sinh cả thông báo mở giai đoạn và thông báo sắp hết hạn.

`SentAt` của thông báo trong hệ thống là thời điểm thông báo được đưa lên cổng người dùng. `EmailOutbox.Status='SENT'` nghĩa là máy chủ SMTP đã chấp nhận email, chưa bảo đảm email nằm trong Hộp thư đến. `PENDING` là đang chờ gửi, bao gồm chờ thử lại; `FAILED` là đã hết số lần thử; `CANCELLED` là nội dung đã hết hạn hoặc không còn phù hợp. Lỗi xác thực SMTP sẽ tạm dừng lượt gửi và không làm hao số lần thử. Nhật ký chỉ ghi mã lỗi, không ghi mật khẩu hoặc nội dung phản hồi SMTP.

Sinh viên xem thông báo tại trang thông báo riêng. Header sinh viên không hiển thị chuông thông báo.

Kiểm tra chỉ đọc:

Sau khi build backend, chạy `npm run check:notifications` trên môi trường chạy backend. Lệnh này kiểm tra các biến cấu hình đã được khai báo chưa, migration đã sẵn sàng chưa, thống kê trạng thái gửi và xác thực kết nối SMTP mà không gửi email. Lệnh không in thông tin xác thực hoặc nội dung email.

Có thể dùng các truy vấn SQL chỉ đọc sau để xem thống kê hàng đợi email và thông báo:

```sql
SELECT "Kind", "Status", count(*) AS total, max("CreatedAt") AS latest,
       array_agg(DISTINCT "LastError") FILTER (WHERE "LastError" IS NOT NULL) AS errors
FROM "EmailOutbox" GROUP BY "Kind", "Status";

SELECT "RelatedEntityType", count(*) AS total, max("SentAt") AS latest
FROM "Notifications" GROUP BY "RelatedEntityType";
```

Nếu bảng hàng đợi không có bản ghi, luồng tạo email chưa xếp mail vào hàng đợi của database đó; đổi thông tin xác thực SMTP sẽ không tạo ra các email còn thiếu. Tài khoản dữ liệu mẫu được tạo sẵn không phải tài khoản được tạo qua import và không tự nhận email cấp tài khoản. Sau khi triển khai, tiến trình nhắc hạn sẽ kiểm tra cả các đợt đang mở từ trước. Lệnh `npm run jobs:provisioning` chạy một lượt tạo nhắc hạn và gửi email; lệnh này gửi email thật đang chờ trong hàng đợi, nên không dùng để thử kết nối.
