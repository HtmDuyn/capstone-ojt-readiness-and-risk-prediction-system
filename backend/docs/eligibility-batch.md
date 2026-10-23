# Xét điều kiện OJT hàng loạt

`POST /api/eligibility-check-runs` — ADMIN hoặc ACADEMIC.

```json
{
  "ojtSemesterId": 1,
  "studentIds": [12, 13, 14]
}
```

Có thể dùng `programIds` hoặc `cohortIds` để giới hạn phạm vi thay cho `studentIds`, và thêm `groupCodes`. Phải có ít nhất một phạm vi student/program/cohort. Tối đa 1000 sinh viên đang hoạt động, chưa bị xóa mềm trong một lần gọi.

API xử lý ngay trong request và trả HTTP 200 với `success` và `data`. `data` gồm `runId`, `ojtSemesterId`, `status: COMPLETED`, `total`, `eligible`, `notEligible`, `reviewRequired`, `items`, `replayed`. Mỗi item có ID sinh viên, trạng thái, tín chỉ đạt/thiếu, số môn còn nợ, lý do và thời điểm ghi nhận.

Điều kiện cố định: ít nhất 70 tín chỉ và tối đa 2 môn đã rớt nhưng chưa học lại đạt/được công nhận. Không cần chọn mô hình AI. Nếu chương trình đã ban hành chưa có bộ quy tắc, API tự ghi nhận phiên bản quy tắc cố định để giữ liên kết lịch sử.

Một lần gọi thực hiện xét, cập nhật `StudentOJTEligibility.Status`, lưu `EligibilityChecks`, và xác nhận nội bộ các kết quả `ELIGIBLE`/`NOT_ELIGIBLE`. Không cần API xác nhận riêng. Dữ liệu chưa đủ để kết luận được lưu `REVIEW_REQUIRED` và không được xác nhận là đủ điều kiện.

Các kiểm tra thời điểm xét chính thức, kỳ học và điểm đã chốt vẫn áp dụng. Nếu một hồ sơ vi phạm các ràng buộc này hoặc có lỗi xử lý, toàn bộ giao dịch rollback; không lưu dở một phần danh sách.

`idempotencyKey` là tùy chọn. Gửi lại cùng key và cùng phạm vi trả lại kết quả của đợt cũ. Dùng key mới hoặc bỏ key để xét lại theo dữ liệu hiện tại. Key của tác vụ hàng đợi cũ chưa hoàn tất bị từ chối; dùng key mới để xét ngay.

Đã gỡ các API thực hiện xét từng sinh viên, xác nhận riêng và theo dõi tiến độ đợt. Các API chỉ đọc trạng thái/lịch sử vẫn phục vụ màn hình sinh viên và đối soát. Worker chỉ giữ để xử lý các tác vụ cũ đã nằm trong hàng đợi.
