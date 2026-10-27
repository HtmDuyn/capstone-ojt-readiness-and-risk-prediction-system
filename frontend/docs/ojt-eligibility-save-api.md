# API lưu kết quả xét OJT từ FE

FE gọi endpoint sau khi người dùng bấm **Lưu kết quả**. Đường dẫn được khai báo tại `LOCAL_OJT_SAVE_ENDPOINT` trong `src/services/localOjtEligibility.service.ts`. BE đã hỗ trợ lưu và đọc lại kết quả.

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

## Đọc lại và đồng bộ giao diện

`GET /api/ojt-eligibility-results?page=1&limit=100` trả `{success:true,data:{items,total,page,limit}}`. FE tải hết các trang khi mở trang xét OJT và phục hồi kết quả theo `studentId`.

Mỗi kết quả có thêm `savedAt`, `savedBy`, `batchId`, `source` và `isStale`. Kết quả có `isStale: true` hiển thị **Cần xét lại**, không tính vào số đủ/chưa đủ điều kiện hiện tại.

Danh sách import, hồ sơ, tiến độ và tổng quan đọc `calculatedEligibility` trong API `/students` hoặc `/students/:id`. Trang trạng thái hiển thị riêng **Kết quả FE đã lưu** và **Quyết định OJT chính thức**; không tự xác nhận hoặc thay thế quyết định chính thức.

## Bàn giao sinh viên kỳ 5 sang kỳ OJT thứ 6

Trang `/education/ojt-handoff` dùng kết quả từ DB qua GET trên, chỉ lấy sinh viên `currentSemester === 5`, sinh viên/tài khoản `ACTIVE`, kết quả `ELIGIBLE` và không stale. Kỳ nhận là OJT liên kết với `academicPeriodId` của kỳ 6 trong `cohorts.groups.curriculumPeriods` đúng khóa/nhóm. Kỳ 5 phải khớp `currentAcademicPeriodId`; thiếu cấu hình thì chặn gửi. Chọn kỳ OJT sẽ chỉ giữ sinh viên có kỳ 6 tương ứng, không cho bàn giao trùng kỳ.

FE gọi `POST /api/eligible-student-handoffs` với `{ojtSemesterId, studentIds, idempotencyKey, reason}` và đọc lịch sử bằng GET cùng endpoint. Không yêu cầu thêm thao tác xác nhận điều kiện trên FE.

**Phần BE cần đồng bộ:** `origin/main` hiện còn gọi `officialEligibilityWithClient` và trả `CONFIRMED_ELIGIBILITY_REQUIRED` nếu chưa có xác nhận cũ. Luồng mới cần đọc `StudentOJTCalculatedResults`, kiểm tra `ELIGIBLE` còn hiệu lực, sinh viên kỳ 5 và kỳ nhận tương ứng kỳ 6 trong transaction; lưu snapshot kết quả đã lưu, chống bàn giao trùng và giữ idempotency. `EligibleStudentHandoffItems.CheckID` và các ràng buộc liên quan cần tương thích với kết quả FE (không tạo giả `EligibilityChecks`/xác nhận). FE hiện báo rõ lỗi này, không báo bàn giao thành công khi BE từ chối.
