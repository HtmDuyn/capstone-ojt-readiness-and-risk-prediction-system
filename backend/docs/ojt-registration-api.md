# API đăng ký OJT và bàn giao cho QHDN

Base URL: `/api`. Header: `Authorization: Bearer <JWT>`. Response: `{ "success": true, "data": ... }`.

## Phân vai

- ADMIN/ACADEMIC: tạo/sửa/mở/đóng đợt, xem mọi hồ sơ, duyệt/từ chối, chuyển danh sách.
- STUDENT: nộp và xem hồ sơ của mình; không duyệt hoặc bàn giao.
- OJT_COORD (QHDN): xem hồ sơ/danh sách/lịch sử đã bàn giao. Không duyệt học vụ hoặc tự chuyển danh sách.
- ENTERPRISE không truy cập các API học vụ này. Điều phối doanh nghiệp và xử lý tiếp nhận tiếp tục dùng dữ liệu QHDN, không được tạo tự động khi bàn giao.

## 1. Đợt đăng ký

`POST /ojt-registration-windows`:

```json
{
  "ojtSemesterId": 1,
  "name": "Đăng ký OJT kỳ Fall",
  "scope": { "programIds": [1], "cohortIds": [1], "groupCodes": ["A", "B"] },
  "startsAt": "2026-10-08T08:00:00+07:00",
  "endsAt": "2026-10-30T23:59:59+07:00"
}
```

Thay các ID/ngày bằng dữ liệu thật. `scope` nhận `programIds`, `cohortIds`, `majorIds` (SpecializationID), `studentIds`, `groupCodes`. Phải có ít nhất một bộ lọc ngoài nhóm; mảng cung cấp phải không rỗng, không trùng. Các bộ lọc kết hợp AND.

`GET /ojt-registration-windows?ojtSemesterId=1&status=OPEN&page=1&limit=20`.

`PATCH /ojt-registration-windows/1` nhận các trường tạo đợt. Chỉ DRAFT sửa phạm vi, kỳ và ngày bắt đầu. Khi OPEN/CLOSED chỉ sửa tên/hạn cuối và bắt buộc có lý do:

```json
{ "endsAt": "2026-11-02T23:59:59+07:00", "reason": "Gia hạn để sinh viên bổ sung hồ sơ" }
```

`POST /ojt-registration-windows/1/open` hoặc `/close`:

```json
{ "reason": "Phòng đào tạo mở đợt đăng ký" }
```

Trạng thái DRAFT → OPEN → CLOSED, có thể mở lại sau khi điều chỉnh hạn. Có thể mở trước ngày bắt đầu để chuẩn bị, nhưng việc nộp chỉ nhận trong `[startsAt, endsAt)` và khi OPEN. Quá hạn thì không nhận hồ sơ dù chưa gọi close. Chỉ đợt OPEN mới được đóng.

## 2. Nộp hồ sơ (API bổ sung để hoàn thiện luồng)

`POST /ojt-registrations`:

```json
{
  "windowId": 1,
  "application": {
    "contactPhone": "0901234567",
    "contactEmail": "student@example.com",
    "cvUrl": "https://example.com/cv/student.pdf",
    "note": "Đăng ký thực tập theo kế hoạch của trường"
  }
}
```

STUDENT được xác định từ JWT. ADMIN/ACADEMIC nộp hộ phải thêm `studentId`. Không nhận trường điều phối doanh nghiệp. Application là dữ liệu JSON, không upload hoặc tải nội dung URL; các trường đều tùy chọn, email/URL được kiểm tra định dạng.

Sinh viên/tài khoản phải ACTIVE, chương trình PUBLISHED, đúng phạm vi và thời hạn. Nộp hồ sơ chưa đòi hỏi xác nhận ELIGIBLE để phòng đào tạo có thể rà soát và từ chối hồ sơ chưa đủ điều kiện. Duyệt/bàn giao luôn đòi xác nhận ELIGIBLE hiện hành.

Mỗi sinh viên có một hồ sơ/kỳ. Nộp lại cùng nội dung ở cùng đợt đang mở trả `replayed: true`. Chỉ hồ sơ REJECTED được nộp lại (có thể qua đợt khác trong cùng kỳ); giữ RegistrationID và lịch sử trước đó. Hồ sơ SUBMITTED/APPROVED/HANDED_OFF không được sửa bằng POST khác. Hồ sơ legacy không có WindowID được giữ nguyên để đối soát, không tự chuyển vào luồng mới.

## 3. Xem hồ sơ

`GET /ojt-registrations?ojtSemesterId=1&status=SUBMITTED&page=1&limit=20`.

Bộ lọc thêm: `windowId`, `studentId`, `programId`, `cohortId`, `groupCode`, `search` (mã sinh viên/tên/email). Trạng thái lọc: SUBMITTED, APPROVED, REJECTED, HANDED_OFF.

`GET /ojt-registrations/1` trả hồ sơ, thông tin liên hệ, lịch sử nộp/duyệt/bàn giao, `officialEligibility` kèm `isStale`, `handoffSnapshot` bất biến, lịch sử điều phối/assignment nếu có. STUDENT chỉ xem của mình; QHDN chỉ xem đã bàn giao.

## 4. Duyệt hoặc từ chối

`POST /ojt-registrations/1/review`:

```json
{
  "decision": "APPROVE",
  "reason": "Hồ sơ đầy đủ; đã đối chiếu xác nhận đủ điều kiện OJT",
  "idempotencyKey": "registration-1-review-1"
}
```

`decision: "REJECT"` để từ chối. Cả hai quyết định đều bắt buộc lý do. APPROVE yêu cầu xác nhận chính thức ELIGIBLE mới nhất còn khớp fingerprint của điểm, combo, lộ trình, trạng thái và quy tắc đang áp dụng, đồng thời chương trình phải khớp chương trình lúc nộp. Kết quả cũ/chưa xác nhận/không đủ điều kiện trả 409.

Hồ sơ APPROVED có thể chuyển REJECTED trước bàn giao để sửa sai, có lý do/lịch sử; hồ sơ REJECTED phải được nộp lại trước khi duyệt mới. Sau bàn giao không đổi quyết định học vụ bằng API này.

Cùng khóa/payload/người thực hiện trả snapshot quyết định cũ và `replayed: true`, không duyệt lại. Mỗi lượt rà soát sau nộp lại phải dùng khóa mới; khác payload/người thực hiện với khóa cũ trả 409.

## 5. Bàn giao danh sách cho QHDN

`POST /ojt-semesters/1/eligible-student-handoffs`:

```json
{
  "registrationIds": [1, 2],
  "idempotencyKey": "ojt-semester-1-handoff-1",
  "reason": "Chuyển danh sách học vụ đã duyệt cho phòng QHDN"
}
```

Bỏ `registrationIds` để lấy mọi hồ sơ APPROVED chưa bàn giao của kỳ. Mỗi lần tối đa 1000 hồ sơ. ID chỉ định sai kỳ, thiếu, chưa duyệt, đã chuyển hoặc xác nhận không còn hiệu lực đều làm toàn bộ yêu cầu thất bại; không âm thầm bỏ sinh viên.

Hệ thống kiểm tra lại xác nhận ELIGIBLE của từng sinh viên trong cùng transaction, chốt snapshot hồ sơ/kết quả/người/thời điểm/lý do, chuyển trạng thái HANDED_OFF. Nếu một hồ sơ lỗi, không hồ sơ nào được bàn giao. Mỗi RegistrationID chỉ bàn giao một lần.

Response HTTP 201 có `handoffId`, `recipientRole: "OJT_COORD"`, `registrationIds`, `total`, `createdAt`, `replayed`. Gọi lại cùng khóa/payload/người thực hiện trả đợt cũ; không tạo thêm đợt hay ghi lại trạng thái. Khi bỏ registrationIds, lần gọi lại vẫn trả roster của lần đầu dù có hồ sơ mới; dùng khóa mới cho đợt tiếp theo.

`GET /ojt-semesters/1/eligible-student-handoffs?page=1&limit=20` là API bổ sung xem lịch sử batch, cho ADMIN/ACADEMIC/OJT_COORD. Snapshot từng hồ sơ xem qua GET chi tiết hồ sơ.

Bàn giao chỉ ghi vào DB để QHDN tiếp tục nghiệp vụ. Không tự gán doanh nghiệp, tạo assignment, thay quyết định tiếp nhận hoặc gửi email. Điểm/quy tắc thay đổi sau bàn giao không xóa lịch sử; GET chi tiết trả xác nhận hiện tại cùng `isStale` để đối soát.

## 6. Theo dõi trạng thái OJT

`GET /ojt-semesters/1/students?page=1&limit=20`.

Bộ lọc: `programId`, `cohortId`, `groupCode`, `registrationStatus`, `search`. Danh sách gồm sinh viên đã có hồ sơ hoặc xác nhận học vụ ở kỳ đó, không lấy toàn bộ sinh viên của trường. QHDN chỉ thấy đã bàn giao; STUDENT chỉ thấy mình.

Trả `registrationStatus` (NOT_REGISTERED/SUBMITTED/APPROVED/REJECTED/HANDED_OFF), `handoffId`, `officialCheckId`, `officialEligibilityStatus`, `coordinationId`, doanh nghiệp/vị trí/quyết định tiếp nhận và assignment/trạng thái/ngày thực tập nếu có. `ojtStatus` ưu tiên assignment, sau đó điều phối mới nhất, sau đó trạng thái hồ sơ.

Đây là danh sách theo dõi trạng thái đã lưu. `eligibilityValidity: "NOT_RECHECKED"` nghĩa là danh sách chưa tính lại xác nhận; dùng GET chi tiết để xem `isStale`. API duyệt/bàn giao luôn kiểm tra nguồn mới nhất, không dựa riêng trên trạng thái lưu ở danh sách.

## DB và xác minh

Schema duy nhất trong `backend/DB`, phần `20261008 OJT registration and academic handoffs`, version `20261008_ojt_registration`. Tận dụng OJTRegistrations, StudentEnterpriseCoordination, InternshipAssignments; thêm bảng đợt, lịch sử và snapshot bàn giao. Không có DDL/seed trong runtime API. File DB đầy đủ là script reset; với DB đã có dữ liệu chỉ áp dụng phần mới trong transaction.

Swagger: `/api-docs`, nhóm `OJT registration and handoff`. Nhóm API không phụ thuộc SMTP hoặc worker.
