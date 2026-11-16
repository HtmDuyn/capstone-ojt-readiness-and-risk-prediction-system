# Đồng bộ điểm doanh nghiệp với Báo cáo OJT của QHDN

Doanh nghiệp gửi điểm qua `PUT /api/enterprise/internships/:id/evaluation`. Điểm được lưu tại `InternshipEvaluations` với `Status=SUBMITTED`. Trước đây Báo cáo OJT chỉ đọc `OJTResults`, nên đánh giá chưa chuyển giao sang Đào tạo không xuất hiện dù đã lưu thành công.

Trang QHDN dùng `GET /api/ojt-results?ojtSemesterId=...&includeUntransferred=true` để xem cả đánh giá đã gửi và kết quả đã chuyển giao. Chế độ này chỉ dành cho `ADMIN`/`OJT_COORD`; role `ACADEMIC` và các API đọc kết quả sinh viên giữ quy tắc hiện có.

- Hồ sơ doanh nghiệp đã chấm, chưa chuyển giao: `status=SUBMITTED`, `source=ENTERPRISE_EVALUATION`, `resultId=null`, `id=EvaluationID`, `overallScore` là điểm doanh nghiệp; `officialScore=null`.
- Sau chuyển giao: hồ sơ vẫn chỉ hiển thị một lần, có `resultId`, trạng thái chuyển giao/xác nhận tương ứng.
- QHDN hiển thị đủ bốn cột doanh nghiệp đã chấm: “Điểm hoàn thành” (`completionScore`), “Điểm thái độ” (`attitudeScore`), “Điểm kỹ năng” (`skillScore`), “Điểm tổng kết OJT” (`overallScore`). Không hiển thị cột “Điểm chính thức”. Giữ nguyên điểm đã nhập, kể cả điểm 0 và phần thập phân.
- Trang đọc điểm theo kỳ OJT của hồ sơ thực tập, không theo ngày chấm. Chọn đúng học kỳ và bấm “Tải lại”; khi quay lại cửa sổ, trang tự tải lại.
- Xuất CSV/PDF từ QHDN gửi cùng `includeUntransferred=true`, gồm đủ bốn điểm thành phần/tổng kết và bỏ cột điểm chính thức. CSV/PDF mặc định của API khác giữ nguyên các cột cũ.

Thay đổi này không tự chuyển giao hay xác nhận điểm học vụ, không yêu cầu reset hoặc thay đổi schema DB.

Kiểm thử `tests/enterprise-bulk-acceptance.integration.cjs` dùng DB thử cục bộ, bao gồm: doanh nghiệp chấm/cập nhật điểm, QHDN đọc ngay trước chuyển giao, phân quyền đọc, xuất CSV/PDF, không nhân đôi sau chuyển giao và không công bố điểm chưa xác nhận cho sinh viên.
