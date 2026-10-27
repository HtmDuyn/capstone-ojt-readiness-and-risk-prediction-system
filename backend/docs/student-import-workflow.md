# Import sinh viên và lịch sử học

FE đọc hai sheet `Danh sách sinh viên` và `Kết quả học tập`, ghép theo mã sinh viên rồi gửi JSON. Mẫu tải mới chỉ có hai sheet nhập liệu trống (10 cột hồ sơ, 7 cột bảng điểm), không kèm dữ liệu demo hoặc các sheet tra cứu/hướng dẫn. Danh mục và hướng dẫn được hiển thị trên trang import. Tải mẫu không phụ thuộc vào kết nối API danh mục; kiểm tra file vẫn dùng danh mục hiện tại.

Mẫu mặc định không yêu cầu kỳ bắt đầu chuyên ngành (lấy từ nhóm), điểm chữ hoặc nguồn dữ liệu. Parser vẫn nhận các cột tùy chọn này và các sheet tra cứu từ mẫu cũ. GPA, tín chỉ tích lũy, tag kỳ, trạng thái OJT, ID tài khoản và mật khẩu không phải cột nhập liệu.

- `POST /api/student-imports`: `{idempotencyKey, rows}`. Lưu yêu cầu `VALIDATED` và trả `data.id`, `data.preview`.
- `PATCH /api/student-imports`: `{id, status: "COMMITTED"}`. Chỉ người kiểm tra yêu cầu được commit; trả `data.result`.
- Quyền: `ADMIN` hoặc `ACADEMIC`. Không dùng `/api/imports/preview` hoặc `/api/imports/commit` cho sinh viên.

Màn import không yêu cầu chọn năm học hoặc học kỳ chung. Học kỳ hiện tại lấy từ từng hồ sơ sinh viên và học kỳ ghi nhận lấy từ từng dòng kết quả trong Excel; BE ánh xạ năm học và kỳ trong chương trình theo lộ trình đã cấu hình. Một file có thể chứa sinh viên thuộc các học kỳ hiện tại khác nhau. Mỗi lần kiểm tra lại tạo yêu cầu preview riêng; chỉ commit theo importId đã được BE xác nhận.

Một năm có ba học kỳ thực tế Spring, Summer, Fall. Kỳ chương trình gồm các mốc 0–9, được ánh xạ theo khóa/nhóm trong `CohortCurriculumPeriods`. Block 3 dùng kỳ chương trình của học kỳ cha. Không nhập số kỳ chương trình vào cột học kỳ thực tế.

Sinh viên phải có chương trình `PUBLISHED`. Sinh viên qua kỳ 0 phải có lịch sử ở kỳ trước, trong tệp hoặc đã có trong database; không yêu cầu đã đạt mọi môn của kỳ trước. Môn được học phải thuộc khung/combo được duyệt. Tag kỳ là gợi ý lộ trình, không phải giới hạn cứng: được học vượt nếu không có tiên quyết hoặc đã đạt đủ nhóm tiên quyết trước đó. Nhóm tiên quyết phải đủ số môn `PASSED`/`RECOGNIZED` ở kỳ chương trình trước. Điểm học lại môn kỳ trước được chấp nhận. Lần học là số thứ tự lần học cùng môn (1, 2, ...), không phải tag kỳ. Môn IN_PROGRESS không được nhập điểm số, điểm hệ 4 hoặc điểm chữ; FE và BE đều kiểm tra. Import cập nhật lần học đã tồn tại và lưu audit; kết quả OJT chính thức phải sửa qua luồng riêng.

Preview dựng dữ liệu trong giao dịch, chạy `SET CONSTRAINTS ALL IMMEDIATE` rồi rollback. Vì vậy cả preview và commit đều chạy các trigger lịch sử/tiên quyết, không phụ thuộc thứ tự dòng điểm. Vi phạm trả HTTP 422, `INVALID_STUDY_HISTORY`.

Môn combo kế thừa nhóm tiên quyết được cấu hình trên slot liên kết qua `ProgramSlotOptions`. Môn thường hoặc combo có mô tả tiên quyết nhưng chưa có nhóm máy đọc được sẽ bị từ chối và yêu cầu cấu hình; không suy đoán điều kiện từ văn bản tự do. Các giá trị rỗng, `None`, `N/A`, `Không` biểu thị không có tiên quyết.

Học vượt tag kỳ không cho phép ghi kết quả vào học kỳ thực tế vượt quá học kỳ hiện tại đã gán. OJT202 vẫn tuân theo quy định kỳ OJT cố định. Tag theo môn đang học có thể cao hơn kỳ theo lộ trình khóa nếu sinh viên học vượt hợp lệ.

## Email và cập nhật hồ sơ

Email đã tồn tại ở tài khoản STUDENT sẽ dùng lại UserID và StudentID. Có thể đổi MSSV nếu mã mới chưa thuộc người khác; Username, PasswordHash và trạng thái đổi mật khẩu được giữ nguyên. Không cấp lại mật khẩu hoặc tạo welcome email. Email của role khác, tài khoản sinh viên đã xóa, hoặc MSSV và email trỏ tới hai tài khoản khác nhau bị từ chối.

Các trường hồ sơ được gửi trong file sẽ được cập nhật. Lần học trùng môn/học kỳ/lần học được cập nhật tại ResultID cũ và lưu audit. Môn không xuất hiện trong file không bị xóa. Các trường phone/className để trống vẫn giữ dữ liệu cũ. Tài khoản mới vẫn có mật khẩu ngẫu nhiên và một email cấp tài khoản trong EmailOutbox.

## Xét OJT nền sau commit

Phản hồi chi tiết import có studentId, studentStatus, accountStatus và ojtSemesterId theo kỳ 6 trong lộ trình khóa/nhóm. FE gom sinh viên hoạt động theo học kỳ OJT, gọi `POST /api/eligibility-check-runs` với `studentIds`, `ojtSemesterId`, `confirmResults:false` và key ổn định theo batch.

API hiện có tự bảo đảm chính sách 70 tín chỉ / tối đa 2 môn nợ. `confirmResults:false` tính và lưu StudentOJTEligibility, không yêu cầu hoặc tự xác nhận kết quả xét chính thức. Các client cũ bỏ trường này vẫn giữ hành vi xác nhận như trước.

FE hiển thị import thành công ngay; xét OJT chạy nền, có tổng số đủ/chưa đủ/cần đối soát. Danh sách hiển thị Kết quả OJT riêng với trạng thái học vụ. Sinh viên không hoạt động hoặc chưa có kỳ OJT được báo chưa xét. Khi xét lỗi, nút thử lại chỉ gọi API xét, không chạy lại import hoặc cấp lại tài khoản. Kết quả xét cũ hơn cập nhật hồ sơ/bảng điểm được đánh dấu cần xét lại trong danh sách.

Sau import/xét OJT, cache dữ liệu học vụ được xóa để các màn hình đọc trạng thái mới. Thiếu lịch nhóm, kỳ OJT hoặc cấu hình tín chỉ/tiên quyết phải được đối soát; không tự gán nhóm A, tự công nhận môn hoặc tạo kết quả đủ điều kiện.

Phần gọi AI ngoài để gợi ý học lại, đọc CV và ghép doanh nghiệp là bước phát triển tiếp theo; kiểm tra luồng import không gọi model hoặc gửi email thật.

## Khởi tạo

Chạy toàn bộ `backend/DB` để tạo schema, hàm, trigger và dữ liệu ban đầu. Đây là script full reset; không cần chạy migration hoặc seed riêng sau đó.
