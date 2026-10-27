# API dự kiến: lưu kết quả xét OJT từ FE

Endpoint này chưa có trên BE main. FE đã chuẩn bị gọi endpoint sau khi người dùng bấm **Lưu kết quả**. Có thể đổi đường dẫn tại `LOCAL_OJT_SAVE_ENDPOINT` trong `src/services/localOjtEligibility.service.ts`.

## Request

`POST /api/ojt-eligibility-results`, JSON body, Bearer token của tài khoản Phòng Đào tạo hoặc Admin.

```json
{
  "idempotencyKey": "UUID-cua-lan-tinh",
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

- FE xét `earnedCredits >= 70 && unpassedCourseCount <= 2`.
- `status`: `ELIGIBLE`, `NOT_ELIGIBLE`, hoặc `REVIEW_REQUIRED` khi chưa đủ cấu hình/dữ liệu tín chỉ. `earnedCredits` có thể là `null` với `REVIEW_REQUIRED`.
- Gửi tất cả kết quả đã tính, không phụ thuộc tìm kiếm, bộ lọc hoặc phân trang. Không gửi sinh viên bị bỏ qua hoặc tải dữ liệu lỗi.
- FE không gửi năm học hoặc kỳ OJT. BE cần lưu kết quả độc lập với kỳ, hoặc tự xác định kỳ nếu mô hình dữ liệu yêu cầu.
- BE cần kiểm tra quyền, dữ liệu đầu vào, ID sinh viên, và lưu người thực hiện/thời gian phía server để truy vết.
- Lưu toàn bộ request trong một transaction. Cùng khóa và payload khi gửi lại phải trả kết quả cũ; cùng khóa khác payload trả `409`. FE giữ nguyên khóa khi thử lưu lại, tạo khóa mới khi chạy xét lại.
- Request có thể chứa nhiều sinh viên; cấu hình giới hạn JSON phù hợp. Không trả thành công khi chỉ lưu một phần.

## Response sau khi transaction thành công

```json
{
  "success": true,
  "data": { "savedCount": 1 }
}
```

`savedCount` phải bằng số phần tử gửi lên. FE chỉ hiển thị **Đã lưu kết quả** và khóa nút lưu khi nhận xác nhận này. HTTP lỗi hoặc `success: false` không được coi là lưu thành công.

Khi chưa triển khai endpoint (404/405/501), FE thông báo chưa có API và giữ nguyên kết quả trên trang để người dùng thử lại.
