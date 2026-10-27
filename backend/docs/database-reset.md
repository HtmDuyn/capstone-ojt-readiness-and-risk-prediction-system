# Reset DB và dữ liệu 20 sinh viên

`backend/DB` là script **full reset**: xóa bảng/dữ liệu ứng dụng cũ, tạo schema, nạp danh mục và đúng **20 sinh viên** trong một transaction. Chỉ chạy khi muốn khởi tạo lại database. Nếu có lỗi ở bất kỳ phần nào, cả lần reset được rollback.

## Thứ tự khởi tạo

File tạo trực tiếp schema cuối cùng: dọn đối tượng ứng dụng → tạo bảng đủ cột → khóa/index → hàm/view → INSERT catalog và cấu hình cuối → seed lịch/hồ sơ → foreign key/trigger → quyền truy cập → kiểm tra và COMMIT. Không còn các đoạn ALTER để thêm lại cột hoặc UPDATE để vá bản ghi vừa INSERT.

Các khóa ngoại được lắp sau khi đã có đủ bản ghi tham chiếu, để xử lý các quan hệ vòng mà không tắt trigger hoặc dùng chế độ bỏ qua ràng buộc. Các kiểm tra lịch sử học và seed chạy trước commit.

Hàm nghiệp vụ vẫn chứa UPDATE cho thao tác runtime; đó không phải lệnh vá dữ liệu seed. Ngày lịch/đợt OJT được tính theo ngày chạy, không đóng băng theo ngày tạo file.

Toàn bộ schema, hàm, trigger, quyền truy cập và dữ liệu khởi tạo chỉ nằm trong `backend/DB`. Không có migration hoặc seed SQL riêng; không cần chạy thêm script nào sau file này.

## Cách chạy

Mở toàn bộ `backend/DB` trong pgAdmin/DBeaver/SQL Editor và chạy từ `BEGIN` đến `COMMIT`, hoặc từ thư mục gốc dự án:

```powershell
psql -X -v ON_ERROR_STOP=1 -d your_database -f backend/DB
```

Backend cần trỏ tới database đó qua `.env`. Không cần chạy seed riêng sau khi chạy toàn bộ `DB`.

## Dữ liệu sau reset

- 20 tài khoản sinh viên và 20 hồ sơ, tất cả ACTIVE; họ tên tiếng Việt, email, điện thoại mẫu, mã sinh viên, lớp, khóa và nhóm A–D đầy đủ. Mỗi nhóm có 5 sinh viên.
- Giữ nguyên ba tài khoản nhân viên `admin01`, `academic01`, `ojt.coord01` và hash mật khẩu đã có; giữ doanh nghiệp TECHVIET cùng tài khoản `enterprise01` và tin/vị trí tuyển dụng mẫu.
- Tất cả sinh viên thuộc chương trình **DEMO-SE-FULL**, tên hiển thị ghi rõ chương trình minh họa. Chương trình có **39 môn cụ thể, 114 tín chỉ**, lấy từ các môn không phải slot của danh mục `BIT_SE_K18D_19A`; có cấu hình tiên quyết riêng, GPA thang 10 và chính sách lấy lần có điểm gần nhất.
- Theo cập nhật mới, 40 chương trình danh mục được công bố PUBLISHED ngay khi INSERT, kèm metadata và chính sách GPA; cờ review chỉ giữ giá trị đã cấu hình. Bộ 20 sinh viên vẫn dùng DEMO-SE-FULL; không tính tín chỉ từ slot chưa chọn.
- Phân biệt **kỳ chương trình 0–9** với **học kỳ lịch Spring/Summer/Fall**. Kỳ 0 giữ nguyên các môn định hướng; kỳ 1–9 giữ đúng môn theo RecommendedSemester. AcademicYears là năm dương lịch; Spring tháng 1–4, Summer tháng 5–8, Fall tháng 9–12 là lịch mẫu của seed. Ngày cụ thể của trường có thể được cấu hình lại.
- Bảng điểm có kết quả các học phần đã học ở kỳ chương trình 0–5, giữ nguyên kỳ 0, không dồn sang kỳ 1. Mỗi kết quả liên kết học kỳ lịch và năm học thực tế. Sinh viên đang ở nấc 5; OJT202 và ENW493c ở nấc 6 chưa có kết quả.
- Mỗi sinh viên có một snapshot GPA/tín chỉ/số môn nợ, **tính từ từng lần học thực tế**. Điểm chữ F/D/C/B/A được tính từ đúng điểm số tương ứng theo các ngưỡng 5/6/7/8; môn rút học không có điểm. Thi lại giữ cả hai lần và chỉ cộng tín chỉ một lần.
- CohortCurriculumPeriods ánh xạ rõ từng kỳ chương trình 0–9 của nhóm khóa tới một học kỳ lịch; không đếm số dòng AcademicPeriods để suy ra tiến độ. Block 3 dùng nấc của học kỳ cha. Kỳ 6 OJT mục tiêu là học kỳ lịch kế tiếp, không cố định sau 28 ngày. Cửa sổ đăng ký luôn kết thúc trước ngày bắt đầu OJT.
- **Kỳ 6 là kỳ OJT cố định**, theo nấc chương trình đã ánh xạ cho nhóm khóa, không theo ID hay số lượng học kỳ lịch. OJT202 và điểm OJT phải gắn kỳ 6; vẫn giữ các môn song song như ENW493c tại kỳ 6. Trạng thái đang ở kỳ 6 không tự tạo phân công hoặc kết quả thực tập.
- **Xét điều kiện dùng kết quả hết kỳ 5/Block 3**. Đợt đăng ký gắn với học kỳ OJT mục tiêu và `requiredRelativeSemester=6`; không dùng giá trị mặc định 5 hoặc ngoại lệ để chuyển OJT sang kỳ khác.

Mã sinh viên có dạng `SEYY0001`–`SEYY0020`, trong đó `YY` lấy từ năm nhập học của lịch demo. Email và username giữ ổn định khi chạy lại.

## Đăng nhập sinh viên

Email: **`student01@student.edu.vn` đến `student20@student.edu.vn`**.

Mật khẩu chung của dữ liệu demo: **`Student@123`**. Đây là tài khoản minh họa; email/điện thoại không dùng để liên hệ thật.

| Tài khoản | Họ tên | GPA / 10 | Tín chỉ đã đạt | Môn nợ | Đối chiếu OJT hiện tại |
| --- | --- | ---: | ---: | ---: | --- |
| student01 | Nguyễn Minh Anh | 8.04 | 72 | 0 | Đủ điều kiện |
| student02 | Trần Quốc Bảo | 7.30 | 72 | 0 | Đủ điều kiện |
| student03 | Lê Ngọc Châu | 8.72 | 72 | 0 | Đủ điều kiện |
| student04 | Phạm Thành Đạt | 6.88 | 72 | 0 | Đủ điều kiện |
| student05 | Hoàng Thùy Dương | 6.96 | 69 | 1 | Thiếu 1 tín chỉ |
| student06 | Vũ Gia Hân | 6.51 | 66 | 2 | Thiếu tín chỉ |
| student07 | Đặng Minh Hiếu | 5.79 | 63 | 3 | Thiếu tín chỉ và vượt số môn nợ |
| student08 | Bùi Khánh Hòa | 6.89 | 69 | 1 | Thiếu 1 tín chỉ |
| student09 | Đỗ Tuấn Hùng | 7.88 | 72 | 0 | Đủ; đã thi lại đạt SWR302 |
| student10 | Hồ Thanh Hương | 5.84 | 63 | 3 | Thiếu tín chỉ và vượt số môn nợ |
| student11 | Ngô Đức Khang | 8.34 | 72 | 0 | Đủ điều kiện |
| student12 | Dương Bảo Linh | 8.70 | 72 | 0 | Đủ điều kiện |
| student13 | Lý Hoàng Long | 7.62 | 72 | 0 | Đủ điều kiện |
| student14 | Mai Phương Mai | 8.08 | 72 | 0 | Đủ điều kiện |
| student15 | Tạ Quang Minh | 6.66 | 69 | 1 | Thiếu 1 tín chỉ |
| student16 | Phan Hải Nam | 7.19 | 60 | 0 | Rút các môn kỳ 5; thiếu tín chỉ |
| student17 | Cao Bích Ngọc | 6.19 | 66 | 2 | Thiếu tín chỉ |
| student18 | Trịnh Hoài Phong | 7.95 | 72 | 0 | Đủ; đã thi lại đạt SWR302 và SWT301 |
| student19 | Võ Minh Quân | 5.68 | 72 | 0 | Đủ; GPA thấp hơn các trường hợp còn lại |
| student20 | Đinh Hà Trang | 9.27 | 72 | 0 | Đủ; kết quả học tập tốt |

12 hồ sơ đủ điều kiện đối chiếu hiện tại và 8 hồ sơ chưa đủ; cả hai nhóm đều còn ở giai đoạn kết thúc kỳ 5/chờ OJT6. Nhóm chưa đủ không bị tự chuyển sang kỳ OJT hoặc tự lùi OJT sang kỳ 7. GPA không phải điều kiện thay thế cho ngưỡng tín chỉ/số môn nợ trong quy tắc này.

## Luồng OJT

Seed **không giả kết quả xét chính thức, bàn giao, đăng ký, ứng tuyển, tiếp nhận hoặc phân công thực tập**. Đã bỏ các bản ghi HANDED_OFF/ACCEPTED cũ thiếu xác nhận và không khớp chương trình học.

Sau reset, Phòng Đào tạo chạy xét theo kỳ `DEMO-OJT-S6`, xác nhận kết quả rồi bàn giao danh sách đủ điều kiện. Sinh viên sau đó đăng ký OJT và ứng tuyển qua API bình thường. CV được sinh viên tải lên; không tự tạo CV giả.

Theo hợp đồng REST, sinh viên dùng `GET /api/auth/me` để lấy tài khoản và studentId, `GET /api/students/:id` để lấy hồ sơ của mình và `GET /api/students/me/dashboard?ojtSemesterId=...` cho dashboard. GET không gửi body; POST/PATCH dùng JSON khi có dữ liệu nghiệp vụ. Xem student-portal-api.md.

Script reset chỉ xóa đối tượng ứng dụng trong `public`, giữ schema khác và đối tượng thuộc extension. Gặp phụ thuộc ngoài phạm vi thì dừng để đối soát. Chạy nguyên file từ BEGIN đến COMMIT để tạo đủ schema và dữ liệu; không chạy riêng từng đoạn.

Khi chưa có đăng ký OJT, API hồ sơ xác định kỳ OJT mục tiêu bằng ánh xạ nấc chương trình 6 của nhóm khóa tới học kỳ lịch. Vì vậy hồ sơ vẫn trả được `ojtSemesterId` khi sinh viên đang ở kỳ 5.

Cấu hình nhóm khóa qua API cohorts có thể gửi `groups[].curriculumPeriods`: đủ 10 phần tử `{semester: 0..9, academicPeriodId}`. Nấc 0 phải trùng `entryAcademicPeriodId`; các nấc tăng theo thời gian. Không suy diễn nấc từ số lượng học kỳ của toàn hệ thống.
