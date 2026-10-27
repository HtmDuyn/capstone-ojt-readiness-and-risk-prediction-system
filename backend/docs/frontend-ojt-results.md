# Lưu kết quả xét OJT từ frontend

## Cập nhật database

SQL được gộp trực tiếp trong `backend/DB`, giữa hai mốc `BEGIN INCREMENTAL UPDATE: 20261027_frontend_ojt_results` và `END INCREMENTAL UPDATE: 20261027_frontend_ojt_results`. Không có file migration SQL riêng.

Database đang chạy: chỉ thực thi đoạn giữa hai mốc trên trong một transaction `BEGIN; ... COMMIT;` trước khi deploy BE. Đoạn này chỉ thêm bảng/index và có thể chạy lại. **Không chạy toàn bộ `backend/DB` để chỉ cập nhật API này**, vì toàn bộ file là script reset dữ liệu.

## POST /api/ojt-eligibility-results

Bearer token, quyền `ADMIN` hoặc `ACADEMIC`, JSON tối đa 10 MB, từ 1–10.000 sinh viên.

```json
{
  "idempotencyKey": "UUID-do-FE-tao",
  "source": "FRONTEND",
  "rule": { "minCredits": 70, "maxUnpassedCourses": 2 },
  "results": [
    {
      "studentId": 123,
      "status": "ELIGIBLE",
      "earnedCredits": 70,
      "unpassedCourseCount": 2,
      "reasons": [],
      "academicIssues": [],
      "checkedAt": "2026-10-27T09:00:00.000Z"
    }
  ]
}
```

Response sau khi transaction commit:

```json
{ "success": true, "data": { "batchId": 1, "savedCount": 1, "replayed": false } }
```

- Không cần năm học/kỳ OJT, không gọi hàm xét điều kiện của BE. BE kiểm tra kiểu dữ liệu, trạng thái khớp số liệu được gửi, quyền, sinh viên tồn tại/đang hoạt động và lịch sử điểm không đổi sau thời điểm FE xét.
- `ELIGIBLE`: tín chỉ >= 70 và môn chưa đạt <= 2. `NOT_ELIGIBLE`: không đạt ít nhất một ngưỡng. Hai trạng thái này cần số tín chỉ hợp lệ và `academicIssues` rỗng.
- `REVIEW_REQUIRED`: cần ít nhất một `academicIssues`; `earnedCredits` có thể là null. Không tự chuyển hồ sơ thiếu dữ liệu thành đủ điều kiện.
- Không chấp nhận trùng ID. Một dòng không hợp lệ làm toàn bộ request thất bại, không ghi một phần.
- Giữ nguyên `idempotencyKey` khi thử lưu lại. Cùng tài khoản, cùng khóa và payload đã chuẩn hóa trả lại kết quả cũ. Cùng khóa khác payload trả 409. Bấm xét lại cần khóa mới.
- `checkedAt` phải là ISO có múi giờ; thời gian server lưu riêng ở `savedAt`. Không ghi đè kết quả đã xét mới hơn.
- Lưu lịch sử batch trong `OJTEligibilityResultBatches`, cập nhật kết quả mới nhất mỗi sinh viên trong `StudentOJTCalculatedResults`, ghi `AuditLogs` với người thực hiện lấy từ phiên đăng nhập.
- Đây là kết quả FE đã lưu. Không tự ghi `EligibilityConfirmations`, không bỏ qua quy trình quyết định chính thức/bàn giao OJT.

## Đọc lại sau khi tải trang

`GET /api/ojt-eligibility-results?page=1&limit=20` (ADMIN/ACADEMIC). Có thể lọc `studentId` và `status`.

Response: `{success:true,data:{items:[...],total,page,limit}}`.

Mỗi item có các trường kết quả FE, `studentCode`, `fullName`, `source: FRONTEND`, `batchId`, `savedAt`, `savedBy`, `isStale`.

`GET /api/students` và `GET /api/students/:id` cũng có trường `calculatedEligibility` chứa kết quả FE đã lưu hoặc null. FE có thể dùng trường này để hiển thị trạng thái đã lưu; giữ riêng với `officialEligibility` / `officialDecision` của luồng xác nhận chính thức. `isStale` đánh dấu khi chương trình/lộ trình/bảng điểm đã đổi hoặc sinh viên không còn hoạt động.

Các lỗi trả `{success:false,errorCode,message}`. 400: payload sai; 401/403: quyền; 409: xung đột khóa, sinh viên thiếu/không hoạt động hoặc dữ liệu cũ. 413: request quá lớn.
