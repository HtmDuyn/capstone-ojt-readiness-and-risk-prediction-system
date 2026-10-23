# Clear và khởi tạo PostgreSQL bằng một file

Chạy toàn bộ **`backend/DB`** một lần bằng tài khoản sở hữu database. Script xóa các bảng/dữ liệu ứng dụng cũ, tạo schema hiện tại và nạp danh mục trong **một transaction**. Nếu có lỗi, toàn bộ thay đổi được rollback.

## Cách chạy

Trong pgAdmin/DBeaver hoặc SQL Editor: mở file `backend/DB`, chọn toàn bộ nội dung và chạy cả script, từ `BEGIN` đến `COMMIT`. Đây là file định nghĩa database duy nhất; không có migration SQL hoặc script nâng cấp riêng.

Hoặc từ thư mục gốc dự án, với PostgreSQL CLI:

```powershell
psql -X -v ON_ERROR_STOP=1 -d your_database -f backend/DB
```

Dùng tùy chọn kết nối host/port/user phù hợp với PostgreSQL của bạn. Sau khi khởi tạo, backend dùng kết nối tới database này trong `.env`.

## Dữ liệu sau reset

- Giữ 5 vai trò cố định và 3 tài khoản khởi tạo đã có trong script: `admin01`, `academic01`, `ojt.coord01`. Giữ nguyên hash mật khẩu tương ứng.
- Giữ danh mục chương trình đào tạo, môn học, tiên quyết, chuyên ngành và combo.
- Tạo 11 sinh viên mẫu, 1 doanh nghiệp và tài khoản doanh nghiệp, lịch học kỳ mẫu, 1 đợt tuyển dụng, 1 tin và 1 vị trí mẫu; 3 sinh viên đã đăng ký doanh nghiệp. Không tạo phân công thực tập, đánh giá, kết quả, dự đoán hoặc email mẫu.
- Các bảng mới `RecruitmentWindows`, khóa liên kết học kỳ và trạng thái tuyển dụng được tạo sẵn.
- Phòng đào tạo thêm `AcademicPeriods.Kind=SEMESTER` sẽ tự có một liên kết trong `OJTSemesters`, cả khi thêm qua API lẫn SQL. Sửa tên/ngày/năm học đồng bộ vào cùng ID OJT; Block 3 không tạo kỳ OJT riêng.
- QHDN chọn `academicPeriodId` để mở đợt tuyển dụng. Import dùng `windowId`, có thể nhiều batch trong một kỳ và không cần kỳ tiếp theo.

Script chỉ reset đối tượng ứng dụng trong `public`, giữ schema khác và đối tượng thuộc extension. Nếu đối tượng ở schema khác phụ thuộc vào bảng ứng dụng cần xóa, script dừng và rollback để đối soát, không tự xóa dây chuyền ngoài `public`.

Đã kiểm tra trên PostgreSQL trong schema cô lập: tạo từ trống, reset/chạy lại, dữ liệu danh mục, ba tài khoản khởi tạo và đồng bộ học kỳ–OJT. Schema kiểm tra được rollback; chưa clear database đang kết nối.

## Tài khoản sinh viên mẫu

Đăng nhập bằng email; mật khẩu chung ban đầu: `Student@123`. Trạng thái hồ sơ sinh viên độc lập với trạng thái tài khoản.

| Email | Trạng thái sinh viên | Trạng thái tài khoản |
| --- | --- | --- |
| student01@example.invalid | ACTIVE | ACTIVE |
| student02@example.invalid | INACTIVE | ACTIVE |
| student03@example.invalid | SUSPENDED | ACTIVE |
| student04@example.invalid | GRADUATED | ACTIVE |
| student05@example.invalid | DROPPED_OUT | ACTIVE |
| student06@example.invalid | ACTIVE | LOCKED |
| student07@example.invalid | ACTIVE | INACTIVE |
| student08@example.invalid | ACTIVE | ACTIVE, buộc đổi mật khẩu |

Các email mẫu không nhận thư. Tài khoản LOCKED/INACTIVE không đăng nhập được. Các hồ sơ dùng chương trình DEMO-SE riêng. student01–08 chưa có đăng ký OJT.

## Sinh viên đã đăng ký doanh nghiệp

| Email | Đơn ứng tuyển | Phản hồi doanh nghiệp |
| --- | --- | --- |
| student09@example.invalid | SUBMITTED | PENDING — chờ phản hồi |
| student10@example.invalid | ACCEPTED | ACCEPTED — đã nhận |
| student11@example.invalid | REJECTED | REJECTED — từ chối |

Mật khẩu sinh viên: `Student@123`. Cả ba có trạng thái tài khoản/hồ sơ ACTIVE và hồ sơ OJT HANDED_OFF, kèm xét điều kiện ELIGIBLE đã xác nhận, sự kiện duyệt và bản ghi bàn giao. Các hồ sơ có bảng điểm và đạt 72 tín chỉ theo quy tắc OJT mẫu đã công bố. Seed tạo snapshot đầy đủ và SHA-256 tương thích fingerprint backend; cả ba xác nhận đã được đối chiếu isStale=false.

Doanh nghiệp: `DNDEMO001` — Doanh nghiệp công nghệ mẫu; đăng nhập `enterprise01@example.invalid`, mật khẩu `Enterprise@123` để xem các ứng viên. Cả ba ứng tuyển vị trí Thực tập sinh phát triển phần mềm trong tin đã công bố. Sinh viên đã được nhận chưa được phân công thực tập.

Ngày của học kỳ và các đợt được tính theo ngày chạy DB. Học kỳ được tạo qua AcademicPeriods để trigger tự tạo liên kết OJT; QHDN sử dụng học kỳ đó cho đợt tuyển dụng.

## Quá trình học của sinh viên mẫu

Có khóa/lớp, học kỳ, bảng điểm từng môn, điểm trung bình theo thang 10 với chính sách lần thi mới nhất và snapshot tín chỉ. Ngày lịch học tính tương đối theo ngày chạy DB.

`DEMO-SE` là chương trình minh họa 114 tín chỉ gồm 39 môn cụ thể lấy từ danh mục SE; không bao gồm các slot/combo chưa được đối soát và không thay thế chương trình chính thức. Danh mục chính thức giữ nguyên.

| Sinh viên | Quá trình học | Tín chỉ tích lũy |
| --- | --- | --- |
| student01 | Học kỳ 6; còn nợ 1 môn, có môn đang học | 69 |
| student02 | Ngừng hoạt động sau 2 kỳ | 30 |
| student03 | Tạm đình chỉ sau 3 kỳ; còn nợ 1 môn | 42 |
| student04 | Hoàn tất 9 kỳ của chương trình mẫu | 114 |
| student05 | Thôi học sau 2 kỳ | 30 |
| student06–08 | Hoàn tất 5 kỳ; có môn đang học kỳ 6 | 72 |
| student09 | Hoàn tất 5 kỳ, chờ doanh nghiệp phản hồi | 72 |
| student10 | Đã học lại và đạt môn từng trượt, doanh nghiệp đã nhận | 72 |
| student11 | Đủ tín chỉ OJT; doanh nghiệp từ chối do yêu cầu vị trí | 72 |

Trạng thái tài khoản độc lập với bảng điểm. Ba sinh viên ứng tuyển có ít nhất 70 tín chỉ và không quá 2 môn còn nợ, được kiểm tra bằng hàm tính tiến độ/xét điều kiện của backend trên schema cô lập.

## Cấu hình luồng OJT đầy đủ cho dữ liệu mẫu

- Học kỳ 5 của khóa hiện tại được tách 30 ngày cuối thành Block 3 riêng, đã đóng; không tạo OJT kỹ thuật cho Block 3.
- Có đợt xét chính thức OJT đang OPEN, điểm đã chốt trước lần xét, sau Block 3 và nằm trong hạn 30 ngày tính từ ngày chạy DB.
- Hai khóa mẫu có đủ nhóm A–D. Ba hồ sơ đăng ký có pathway học kỳ 6 và dữ liệu liên hệ đúng schema API.
- Có ánh xạ môn OJT202 sang học kỳ 6, thang điểm mẫu 10: dưới 5 trượt, từ 5 đạt, từ 7 loại B, từ 8 loại A. Chỉ áp dụng DEMO-SE.
- Ba hồ sơ có snapshot đầy đủ và hash tương thích backend, kèm snapshot đợt xét trong xác nhận; không bỏ kiểm tra stale hoặc tắt trigger bảo vệ lịch sử.
- Các helper PostgreSQL tạm được xóa trước COMMIT. Seed serializer chỉ dành cho DEMO-SE với các môn cụ thể và không có combo/equivalence; dùng ICU để đồng nhất thứ tự mảng với Node.js. Mốc ngày trong snapshot theo múi giờ nghiệp vụ Asia/Bangkok; backend khi kiểm tra bộ seed này chạy cùng múi giờ.
- 40 chương trình chính thức nhập từ danh mục vẫn DRAFT vì thiếu xác nhận học vụ/slot/combo. Không tự công bố hoặc gán các xác nhận rà soát chưa có căn cứ.

Không tạo giả phân công, điểm đánh giá hoặc kết quả thực tập; các bước đó thực hiện khi có quyết định nghiệp vụ tương ứng.
