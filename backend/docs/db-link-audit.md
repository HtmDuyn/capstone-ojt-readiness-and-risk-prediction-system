# Kiểm tra và đồng bộ logic DB

Cập nhật 2026-10-18T18:25:04.912Z. Đã commit cấu hình trên DB đang kết nối; backend/DB đã đồng bộ cùng cấu hình cho lần khởi tạo tiếp theo.

- Đã rà 297 khóa ngoại: 0 bản ghi mồ côi.
- Tạo Block 3 học kỳ 5 bằng cách dành 30 ngày cuối học kỳ; lịch không chồng lấn, không tạo kỳ OJT riêng cho Block 3.
- Mở đợt xét chính thức OJT cho kỳ 6, đã chốt điểm và có hạn 30 ngày; đã kiểm tra assertOfficialAssessment và assertRegistrationSemester.
- student09–11: 72 tín chỉ, ELIGIBLE, snapshot đầy đủ, backend xác nhận isStale=false trước COMMIT.
- DB đang chạy có xác nhận mới 4/5/6. Giữ nguyên 3 bản bàn giao và các xác nhận cũ làm lịch sử; không sửa/tắt trigger append-only.
- Có ánh xạ OJT202/thang điểm mẫu vào học kỳ 6, chuẩn bị cho quy trình ghi nhận kết quả OJT khi có đánh giá thật.
- Hai khóa mẫu đủ nhóm A–D; hồ sơ sinh viên giữ nguyên.
- File DB kiểm tra tạo mới trong schema cô lập thành công, bao gồm fingerprint tương thích backend và các assertion cuối; dữ liệu kiểm tra đã rollback.

## Phạm vi còn giữ nguyên

40 chương trình danh mục DRAFT chưa có xác nhận học vụ chính thức về tiên quyết, quy đổi, tính bắt buộc, combo/slot nên không tự công bố. Chỉ DEMO-SE đang hoạt động với sinh viên mẫu. Chưa tạo giả phân công, đánh giá hoặc điểm thực tập.

## Quy tắc

Tối thiểu 70 tín chỉ và tối đa 2 môn còn nợ; môn đã đạt/được công nhận không tính là còn nợ. Tên field và FAILED_ATTEMPTS giữ tương thích API.
