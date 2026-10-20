# Quản lý sinh viên và kết quả học tập

Base URL: `http://localhost:3000/api`. Gửi `Authorization: Bearer <token>` của ADMIN hoặc ACADEMIC. Sinh viên được xem hồ sơ, kết quả và tiến độ của chính mình. ENTERPRISE và OJT_COORD không được truy cập nhóm API học vụ này.

Schema được quản lý tại **backend/DB**, phần `20261008 student records and academic imports`. Không có tạo bảng, seed hoặc migration tự chạy trong API. File DB đầy đủ là script khởi tạo/reset; không chạy toàn bộ trên dữ liệu production đang dùng.

## Sinh viên

| API | Dữ liệu |
|---|---|
| `GET /students` | `page`, `limit` tối đa 100; `search` tìm mã/tên/email; `status`, `programId`, `cohortId`, `groupCode`, `enrollmentYear`, `currentSemester` |
| `GET /students/:id` | Hồ sơ và các mốc chuyên ngành thực tế |
| `PATCH /students/:id` | `fullName`, `phone`, `className`, `status`, `programId`; bắt buộc `reason` |
| `GET /students/:id/course-results` | Tất cả các lần học; lọc `courseId`, `academicPeriodId`, `status`, phân trang |
| `GET /students/:id/academic-progress` | GPA, tín chỉ, yêu cầu đã hoàn thành/chưa hoàn thành và lỗi cấu hình |

`id` là StudentID, không phải UserID hoặc mã sinh viên. Mã sinh viên và email không sửa qua hồ sơ học vụ. Khóa, nhóm, kỳ vào chuyên ngành và kỳ hiện tại sửa qua `PATCH /students/:id/academic-placement` đã có; không sửa trực tiếp các giá trị suy ra `currentSemester`/`enrollmentYear`. Chuyển chương trình có thể bị từ chối nếu xung đột lộ trình combo đã lưu.

```json
{
  "className": "SE1801",
  "status": "ACTIVE",
  "reason": "Cập nhật lớp theo danh sách phòng đào tạo"
}
```

Trạng thái hồ sơ: `ACTIVE`, `INACTIVE`, `SUSPENDED`, `GRADUATED`, `DROPPED_OUT`. Trạng thái tài khoản được hiển thị riêng trong `accountStatus`.

## Import kết quả

`POST /course-result-imports/preview` và `POST /course-result-imports/commit` nhận cùng JSON:

```json
{
  "idempotencyKey": "results-2026-block3-v1",
  "sourceName": "Danh sách kết quả sau Block 3",
  "rows": [
    {
      "studentCode": "SE180001",
      "courseCode": "PRF192",
      "academicPeriodId": 12,
      "attemptNumber": 2,
      "status": "PASSED",
      "score": 7.5,
      "gradePoints": 3.0,
      "sourceReference": "sheet-1:row-8"
    }
  ]
}
```

Các mã/ID trên chỉ minh họa; dùng dữ liệu thực đã có trong DB. Gán kỳ chuyên ngành thực tế cho sinh viên trước khi import. `academicPeriodId` nhận kỳ thường hoặc BLOCK3, thuộc kỳ chuyên ngành tương ứng; không dùng số thứ tự kỳ làm ID. Block 3 không tăng `semesterTaken` thêm một kỳ. `attemptNumber` 1–100, mặc định 1, phân biệt những lần học cùng môn trong cùng kỳ; không tự tăng khi import lại.

Mỗi lô 1–1000 dòng. `status`: `PASSED`, `FAILED`, `IN_PROGRESS`, `WITHDRAWN`, `RECOGNIZED`. Điểm 0–10, `gradePoints` 0–4, tối đa hai chữ số thập phân. Trạng thái đỗ/trượt do nguồn phòng đào tạo xác nhận; hệ thống không suy diễn ngưỡng đỗ. `grade` tối đa hai ký tự. Công nhận môn dùng `RECOGNIZED`, `score` và `gradePoints` null/không gửi, không tính GPA.

Preview chỉ kiểm tra, trả `canCommit`, tổng dòng và lỗi theo dòng; không ghi dữ liệu hay lịch sử. Commit có dòng lỗi trả HTTP 422, `success: false`, `data.batchId`; **không nhập bất kỳ kết quả nào** và vẫn lưu lịch sử lỗi. Tra cứu qua `/academic-imports/:id`.

Khóa trùng là sinh viên + môn + kỳ thực tế + lần học. Cùng dữ liệu: `UNCHANGED`; khác dữ liệu: báo lỗi yêu cầu sửa qua PATCH. Cùng `idempotencyKey`, cùng payload và cùng người nhập trả kết quả cũ với `replayed: true`. Payload khác phải dùng khóa mới. Lô bị từ chối có thể sửa dữ liệu rồi dùng lại khóa vì chưa commit thành công.

## Sửa kết quả và lịch sử

`PATCH /course-results/:id`, bắt buộc `reason`:

```json
{
  "score": 8.0,
  "gradePoints": 3.5,
  "status": "PASSED",
  "reason": "Đính chính điểm theo biên bản phòng đào tạo"
}
```

Có thể sửa `courseId`, `academicPeriodId`, `attemptNumber`, `score`, `grade`, `gradePoints`, `status`, `sourceReference`; không chuyển kết quả sang sinh viên khác. Khi đổi thành RECOGNIZED, gửi các điểm cũ thành null. Lưu người sửa, thời điểm, lý do, dữ liệu trước/sau trong AuditLogs cùng giao dịch với cập nhật.

- `GET /academic-imports?kind=COURSE_RESULT&status=REJECTED&page=1&limit=20`
- `GET /academic-imports/:id?page=1&limit=100`

Lịch sử gồm STUDENT và COURSE_RESULT, trạng thái COMPLETED/REJECTED/FAILED. Import tài khoản sinh viên qua `/imports/commit` trả thêm `academicImportId` để tra lịch sử học vụ; `batchId` cũ vẫn là ID riêng của import tài khoản. Các lô sinh viên cũ được giữ lại nhưng chỉ có thông tin trước đây hệ thống đã lưu, không tạo giả dữ liệu nguồn hoặc lỗi. Lỗi commit ngoài lỗi từng dòng trả `importBatchId` khi đã lưu được lịch sử. Không lưu mật khẩu vào lịch sử học vụ.

## Cách tính tiến độ

GPA dùng **lần hoàn tất có điểm gần nhất** theo ngày bắt đầu kỳ thực tế rồi lần học; tính cả điểm trượt, bỏ IN_PROGRESS/WITHDRAWN/RECOGNIZED. Học lại trượt sau khi từng đỗ làm GPA thay đổi nhưng không xóa tín chỉ đã đạt.

Tín chỉ lấy từ chương trình cụ thể `ProgramCourses.Credits`, không dùng số tín chỉ mặc định toàn cục của Courses. Môn PASSED/RECOGNIZED chỉ tạo một thành tích; các alias đã xác nhận trong `ProgramCourseEquivalences` được quy về môn chương trình và chỉ cộng một lần. Các slot sử dụng `ProgramSlotOptions` và lựa chọn môn/combo đã xác nhận (`ConfirmedBy`, `ConfirmedAt`); kiểm tra giới hạn nhóm chọn môn, không coi lựa chọn nháp là phê duyệt. Một thành tích không lấp đồng thời hai slot hoặc vừa slot vừa môn thường.

DB chứa chính sách GPA `AcademicGradingPolicies` theo ProgramID: `GpaScale` 4 hoặc 10, `RetakePolicy` luôn LATEST, người xác nhận. Thang 4 dùng `gradePoints`, thang 10 dùng `score`; không tự chuyển đổi giữa hai thang. Phòng đào tạo cần xác nhận thang GPA và dữ liệu môn/slot/tương đương trong DB. Không seed quy chế hoặc ánh xạ tương đương giả trong code.

Khi thiếu quy chế, tín chỉ, chương trình, phê duyệt slot hoặc kỳ thực tế của điểm cũ, API trả `INSUFFICIENT_CONFIGURATION` và danh sách `issues`, GPA null khi chưa tính được chính thức. `credits.earned` là tổng tín chỉ đã đối chiếu được; `completeConfiguration: false` nghĩa là số liệu còn thiếu cấu hình, `remaining` null thay vì kết luận sai về số tín chỉ còn thiếu. Điểm cũ có kỳ null cần đính chính qua PATCH để xác định đúng lần học gần nhất.

Swagger tại `http://localhost:3000/api-docs` có schema JSON cho toàn bộ nhóm API.

Sau khi có nhóm API chương trình, cấu hình thang GPA và ánh xạ tương đương được quản lý qua API curriculum. Chương trình nháp trả thêm `CURRICULUM_NOT_PUBLISHED`; ban hành qua `/curricula/:id/publish` để xác nhận phiên bản chính thức. Hướng dẫn chi tiết trong `curriculum-api.md`.
