# Hợp đồng luồng QHDN cho Frontend — 28/10/2026

Base URL local: `http://localhost:3000/api`. ID kỳ trong luồng này là **OJTSemesterID** lấy từ liên kết của kỳ do Đào tạo tạo; không thay bằng AcademicPeriodID.

QHDN giữ **32 API tính cả xác thực/hồ sơ chung**, gồm 27 nghiệp vụ và 5 API chung. Gửi lại kết quả dùng POST hiện hữu, không tạo API QHDN mới. Có thêm 2 API Student phục vụ AI và 1 API Enterprise tải CV.

Không đổi schema hoặc script DB. Các quyền nộp hộ, quyết định thay doanh nghiệp, tạo/sửa assignment, giao task và archive vẫn không cấp cho QHDN. Admin giữ handler hiện có; nghiệp vụ doanh nghiệp tự tiếp tục thực tập sau ACCEPTED.

## Các điểm đã sửa

| Điểm trước đây | Hành vi hiện tại |
|---|---|
| Chưa có hồ sơ thì canApply=false | Sinh viên đã bàn giao có thể chọn vị trí trước lần nộp đầu; kiểm tra lịch mở, scope, eligibility, import và chỉ tiêu |
| ACCEPTED chưa có internship | Enterprise ACCEPTED tạo 1 assignment ACTIVE và giữ chỗ trong cùng transaction |
| Đánh giá xong vẫn ACTIVE | Enterprise lưu đánh giá và hoàn tất assignment trong cùng transaction |
| Đồng bộ điểm thiếu SemesterTaken | Dùng syncOfficialGrade để ghi kỳ chương trình/năm học/lần học theo mapping và vượt các trigger hiện hành |
| Nguồn đánh giá đổi, không gửi lại được | QHDN gửi lại qua POST /ojt-results với expectedVersion và idempotencyKey mới |
| Enterprise đọc CV theo nguồn cũ | Đọc StudentCVFiles/CVFileID; dữ liệu cũ còn fallback CV mã hóa, không đánh đồng hai loại ID |
| Upload mới chưa nối AI | Student gọi adapter JSON từ CVFileID, đọc lại kết quả qua API riêng; không cần hồ sơ/kỳ đăng ký |
| Swagger sai body/query điều phối | Contract cuối cùng được đồng bộ với service, có regression test |

## Trình tự gọi API

### 1. Danh sách bàn giao và cấu hình đăng ký

- `GET /academic-periods?kind=SEMESTER`: chọn kỳ và lấy ojtSemesterId.
- `GET /qhdn/eligible-students?ojtSemesterId=...`: danh sách sinh viên đã được Đào tạo bàn giao, không yêu cầu đã nộp hồ sơ.
- `GET /ojt-semesters/{id}/eligible-student-handoffs`: lịch sử bàn giao. Không có nút nhận/từ chối riêng của QHDN.
- `PUT /qhdn/ojt-semesters/{id}/registration-settings`: lịch mở/đóng, mở, đóng, gia hạn hoặc mở lại.

```json
{
  "startsAt": "2026-11-01T08:00:00+07:00",
  "endsAt": "2026-11-15T23:59:59+07:00",
  "status": "OPEN",
  "reason": "Mở đăng ký OJT theo danh sách đã bàn giao"
}
```

Ngày trong ví dụ phải thay bằng lịch thực tế. Khi tạo lần đầu cần cả hai mốc; sau công bố chỉ giữ ngày mở và gia hạn ngày đóng. Hiển thị `effectiveStatus` DRAFT/SCHEDULED/OPEN/EXPIRED/CLOSED. Nhiều cấu hình lịch sử cùng kỳ trả lỗi đối soát, không tự xóa/gộp.

### 2. Import doanh nghiệp

`POST /imports/preview` rồi `POST /imports/commit`, kind ENTERPRISE và ojtSemesterId. Nhận JSON hoặc Excel/CSV. Xem schema chi tiết trong Swagger và api-input-reference.md. Không cần hoặc tạo ngầm đợt tuyển dụng. Tài khoản/doanh nghiệp được tái sử dụng; vị trí/chỉ tiêu riêng theo kỳ.

### 3. Student upload CV và nộp lần đầu

`POST /students/me/cv`: multipart field `cv`, PDF tối đa 10 MiB, có thể upload trước khi mở đăng ký.

`GET /students/me/opportunities?ojtSemesterId=...` trả `windowId`, `registrationId`, `canApply`, `blockers`, `submissionEndpoint`; từng vị trí có canApply/blockers riêng. Lần đầu registrationId=null, submissionEndpoint=/api/ojt-registrations. Gọi endpoint hợp nhất:

```json
{
  "windowId": 1,
  "postId": 1,
  "positionId": 1,
  "application": { "note": "Nguyện vọng thực tập" },
  "coverLetter": "Thông tin ứng tuyển"
}
```

Một transaction tạo OJTRegistration và JobApplication; response `data.jobApplication` chứa thông tin ứng tuyển và cvFileId. Gửi lại cùng lựa chọn không tạo trùng. Khi đã có hồ sơ SUBMITTED/APPROVED, submissionEndpoint trả /api/job-applications; hợp đồng cũ của API này dùng registrationId/postId/positionId. Hồ sơ REJECTED có thể nộp lại qua endpoint hợp nhất nếu chưa điều phối.

### 4. QHDN duyệt và gửi doanh nghiệp

`GET /qhdn/registered-students?ojtSemesterId=...`: bao gồm cả chưa nộp. Lọc bằng **status**, không phải registrationStatus. Chọn studentId hoặc registrationId để đọc thêm lịch sử với phân trang riêng.

`POST /ojt-registrations/{registrationId}/review`:

```json
{"decision":"APPROVE","reason":"Hồ sơ hợp lệ","idempotencyKey":"review-unique-key"}
```

`POST /ojt-coordinations`:

```json
{"registrationId":1,"positionId":1,"applicationId":1,"reason":"Gửi hồ sơ doanh nghiệp","idempotencyKey":"coordination-unique-key"}
```

registrationId, positionId, reason, idempotencyKey bắt buộc; applicationId tùy chọn nhưng phải khớp ứng tuyển sinh viên. Không gửi applicationId đơn lẻ. GET danh sách điều phối không có query applicationId; dùng coordinationId/registrationId/studentId.

### 5. Doanh nghiệp quyết định; QHDN điều phối lại

Doanh nghiệp gọi `GET /enterprise/candidates`. Trường `cv.downloadUrl` dùng Enterprise JWT để tải đúng CV đã có lúc giới thiệu. CV mới upload sau đó không thay CV của hồ sơ đã gửi; doanh nghiệp khác không tải được.

`PATCH /enterprise/candidates/{coordinationId}/decision`:

```json
{"decision":"ACCEPTED","reason":"Đồng ý tiếp nhận"}
```

Khi ACCEPTED, có thể truyền startDate/endDate (YYYY-MM-DD) và enterpriseSupervisorName; nếu bỏ thì dùng ngày kỳ OJT. Ngày thực tập phải thuộc kỳ. Response thêm assignmentId và assignment có status ACTIVE. ACTIVE biểu thị hồ sơ thực tập đã được tiếp nhận; StartDate/EndDate thể hiện lịch thực tập. Chấp nhận lặp không giữ chỗ hoặc tạo assignment lần nữa; hết chỉ tiêu trả POSITION_FULL và rollback quyết định.

REJECTED không tạo assignment. QHDN chọn vị trí khác còn chỗ và gọi `POST /ojt-coordinations/{coordinationId}/reassign`:

```json
{"positionId":2,"reason":"Điều phối sau khi doanh nghiệp từ chối","idempotencyKey":"reassign-unique-key"}
```

API reassign không nhận applicationId. Chỉ lần điều phối mới nhất đã bị từ chối được điều phối lại. CV của sinh viên vẫn đi theo hồ sơ được giới thiệu, kể cả đích mới không có JobApplication riêng.

### 6. Doanh nghiệp giao việc, đánh giá

Doanh nghiệp dùng `POST /enterprise/tasks/bulk` với assignmentId được trả khi tiếp nhận. QHDN chỉ xem qua GET /internship-tasks.

`PUT /enterprise/internships/{assignmentId}/evaluation`:

```json
{"completionScore":8.5,"attitudeScore":9,"skillScore":8,"overallScore":8.5,"comments":"Đạt yêu cầu","reason":"Đánh giá cuối kỳ"}
```

Đánh giá được lưu SUBMITTED và assignment ACTIVE/IN_PROGRESS thành COMPLETED cùng transaction. Response có assignmentStatus=COMPLETED. Kết quả đạt/trượt được xác định bởi mapping điểm do Đào tạo cấu hình, không hard-code ngưỡng trong QHDN.

### 7. QHDN chuyển kết quả, Đào tạo xác nhận

`POST /ojt-results` lần đầu:

```json
{"assignmentId":1,"reason":"Chuyển kết quả đã đánh giá","idempotencyKey":"result-transfer-unique-key"}
```

Response 201 có data.resultId, version và status=PENDING_ACADEMIC_CONFIRMATION. GET /ojt-results trả item.id là resultId và có version. Có thể chọn `GET /ojt-results?resultId=...`.

Đào tạo dùng `POST /ojt-results/{resultId}/confirm`:

```json
{"reason":"Xác nhận kết quả OJT","idempotencyKey":"grade-confirm-unique-key"}
```

Đồng bộ StudentCourseResults và CONFIRMED trong cùng transaction, lưu đúng SemesterTaken/AcademicYearID/AttemptNumber và liên kết kết quả. Điểm học vụ đã tồn tại không bị ghi đè: trả OJT_COURSE_RESULT_CONFLICT để Đào tạo đối soát.

### 8. Sửa đánh giá trước xác nhận và gửi lại

Doanh nghiệp được sửa đánh giá trước CONFIRMED và trong thời hạn hiện hành. Khi nguồn thay đổi, xác nhận trả OJT_RESULT_SOURCE_CHANGED. QHDN đọc version mới nhất và gọi lại **cùng POST /ojt-results**:

```json
{"assignmentId":1,"expectedVersion":1,"reason":"Gửi lại đánh giá đã cập nhật","idempotencyKey":"result-resubmit-new-key"}
```

expectedVersion phải khớp item.version; sai version trả OJT_RESULT_VERSION_CONFLICT. Dùng idempotencyKey mới cho lần gửi lại, cùng key cho retry của chính yêu cầu đó. Không tạo ResultID khác; lịch sử RESUBMITTED được giữ. Sau CONFIRMED, cả đánh giá và kết quả bị khóa.

## Adapter AI cho CV

Chưa có dịch vụ AI thật theo xác nhận của người dùng. Hai API Student đã sẵn adapter và được test với provider giả lập:

- `POST /students/me/cv-analysis`, JSON `{}` hoặc `{"cvFileId":1}`.
- `GET /students/me/cv-analysis?cvFileId=1`; bỏ ID để đọc CV mới nhất của chính sinh viên.

Không cần kỳ mở, bàn giao hay hồ sơ OJT. Result/status được lưu theo CVFileID trong AuditLogs hiện có; không sao chép sang bảng legacy giới hạn 5 MiB. GET trả NOT_ANALYSED/RUNNING/COMPLETED/FAILED. Chưa cấu hình provider thì POST trả 503 AI_NOT_CONFIGURED; upload và đăng ký không phụ thuộc AI.

Khi có AI, cấu hình CV_ANALYSIS_SERVICE_URL (HTTP/HTTPS). STUDENT_AI_API_KEY là Bearer key tùy chọn, chỉ đặt trong môi trường backend. Backend POST JSON:

```json
{"cvFileId":1,"fileName":"cv.pdf","mimeType":"application/pdf","contentBase64":"<PDF base64>"}
```

Provider trả JSON:

```json
{"summary":"Tóm tắt CV","skills":["Node.js"],"education":[],"experience":[],"languages":[],"modelVersion":"v1"}
```

Provider cần nhận payload tương ứng PDF 10 MiB sau base64. Timeout 20 giây; response tối đa 1 MiB. Lỗi provider trả 502, không trả kết quả giả. Phân tích thành công cùng CV/provider được tái sử dụng; CV khác hoặc lần lỗi có thể gọi lại. Kết quả không lộ sang tài khoản khác.

## Điều kiện dữ liệu và kiểm thử

Kỳ, mapping chương trình, đợt xét cuối kỳ 5 và bàn giao phải hợp lệ. Đào tạo phải quản lý tiến độ/kỳ học thực tế của sinh viên đến kỳ 6 trước khi đồng bộ điểm kỳ 6. Các kiểm tra này giữ nguyên, không bỏ trigger hoặc sửa schema để né dữ liệu sai.

Bộ seed DB chứa lịch xét tính theo ngày chạy trong khi ngày kết thúc kỳ chuẩn bị có thể vẫn ở tương lai. Bộ test toàn luồng sửa lịch của **fixture riêng** cho hợp lệ và mô phỏng tiến độ học vụ sang kỳ 6. Không áp dụng những thay đổi dữ liệu đó lên Supabase dùng chung.

Chạy `npm run test:qhdn`: tự build, chạy bộ regression và HTTP end-to-end trên PGlite nạp **toàn bộ backend/DB**, gồm các trigger hiện hành. Fixture chặn nạp env và thay module DB trước khi import app; không dùng credentials production hoặc chạy worker.

Chạy `npm run test:qhdn:local:readonly` với QHDN_TEST_EMAIL/QHDN_TEST_PASSWORD để kiểm tra local với Supabase chỉ đọc. Hướng dẫn nhập credentials ở local-qhdn-testing.md. Các thay đổi chưa được deploy/commit/push tự động.
