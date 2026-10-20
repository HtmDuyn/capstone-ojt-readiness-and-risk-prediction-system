# Đợt chọn và xác nhận combo

> Cập nhật G01–G05: xem [cấu hình kỳ đăng ký, lịch combo, preview, mốc xét và đồng bộ điểm OJT](academic-workflow-gaps.md). Các ràng buộc mới này được áp dụng cùng các API bên dưới.

Base URL: `http://localhost:3000/api`. Gửi `Authorization: Bearer <token>`. Các API quản lý dành cho ADMIN/ACADEMIC; sinh viên được gửi lựa chọn của mình và xem lịch sử của chính mình. Swagger: `http://localhost:3000/api-docs`.

Schema tập trung trong `backend/DB`, phần `20261008 combo registration windows and confirmed choices`. Không có tạo bảng/seed/migration tự chạy trong API. DB đầy đủ là script khởi tạo/reset, không chạy toàn bộ trên dữ liệu production hiện có.

## Tạo, xem và sửa đợt

`POST /combo-registration-windows`:

```json
{
  "name":"Chọn combo đầu kỳ chuyên ngành 4",
  "phase":"INITIAL",
  "academicPeriodId":12,
  "ojtSemesterId":5,
  "scope":{"cohortIds":[1],"groupCodes":["A","B"],"majorIds":[1,2]},
  "startsAt":"2026-10-09T08:00:00+07:00",
  "endsAt":"2026-10-20T23:59:59+07:00"
}
```

ID và thời điểm là ví dụ, thay bằng dữ liệu thực. `majorIds` là SpecializationID trả về từ `/majors`. Có thể thêm `scope.studentIds` để thu hẹp các sinh viên trong phạm vi khóa/nhóm/chuyên ngành đã chọn.

`GET /combo-registration-windows`: lọc phase INITIAL/CONFIRMATION, status DRAFT/OPEN/CLOSED/FINALIZED, academicPeriodId, page/limit tối đa 100.

`PATCH /combo-registration-windows/:id`: các trường giống tạo đợt, chỉ sửa trường đã gửi; chỉ được sửa khi DRAFT. Không thay phạm vi/danh sách nền sau khi mở.

INITIAL gắn với một kỳ chuyên ngành thường. CONFIRMATION phải có `initialWindowId`, cùng kỳ chuyên ngành 4 (hoặc Block 3 của kỳ đó) và cùng kỳ OJT mục tiêu. Sinh viên phải có chương trình PUBLISHED và lộ trình thực tế. Hệ thống đếm kỳ thường từ mốc vào chuyên ngành đến kỳ của đợt, không coi cả khóa hoặc mọi nhóm A–D đang cùng kỳ 4.

## Mở và đóng

- `POST /combo-registration-windows/:id/open`
- `POST /combo-registration-windows/:id/close`

```json
{"reason":"Mở đợt theo kế hoạch phòng đào tạo"}
```

Lần mở đầu tiên chốt danh sách sinh viên cùng khóa/nhóm/chuyên ngành/chương trình/mốc chuyên ngành thực tế. Chỉ lấy sinh viên/tài khoản ACTIVE, chương trình đã ban hành, ở kỳ chuyên ngành 4 theo kỳ mục tiêu của đợt. Phạm vi cụ thể có sinh viên không đạt điều kiện sẽ bị từ chối, không lặng lẽ bỏ qua.

CONFIRMATION chỉ mở sau khi đợt INITIAL liên kết đã FINALIZED; chỉ lấy sinh viên có lựa chọn ban đầu đã APPLIED. Không cho hai đợt cùng phase/kỳ chuyên ngành có phạm vi sinh viên trùng nhau. Đợt khác phase có thể liên kết với nhau.

Mở trước startsAt được phép nhưng sinh viên chỉ gửi trong thời hạn của mình. Đóng đợt chặn tất cả lượt gửi, kể cả sinh viên đang được gia hạn, và hủy nhắc nhở email chưa gửi. CLOSED có thể mở lại khi còn thời hạn cơ sở/gia hạn hợp lệ, giữ nguyên danh sách đã chốt. FINALIZED không mở lại.

## Gia hạn theo sinh viên

`POST /combo-registration-windows/:id/extensions`:

```json
{
  "studentIds":[101,102],
  "endsAt":"2026-10-25T23:59:59+07:00",
  "reason":"Sinh viên được duyệt bổ sung thời gian xác nhận"
}
```

Sinh viên phải trong danh sách đã chốt. Thời hạn mới phải ở tương lai và lớn hơn thời hạn hiện tại của từng sinh viên trong danh sách; không rút ngắn các lần gia hạn trước. Gia hạn lưu phạm vi, lý do, người và thời điểm riêng, không thay deadline của các sinh viên khác. Chỉ dùng cho OPEN/CLOSED; gia hạn CLOSED không tự mở lại.

## Gửi lựa chọn và xác nhận

API bổ sung để nhận dữ liệu đăng ký:

`POST /combo-registration-windows/:id/selections`:

```json
{
  "comboId":20,
  "courseIds":[31,32],
  "reason":"Đổi combo theo định hướng chuyên ngành"
}
```

Sinh viên lấy StudentID từ tài khoản đăng nhập, không được gửi hộ người khác. ADMIN/ACADEMIC gửi hộ cần thêm `studentId` và lý do. `courseIds` là CourseID toàn cục của các môn được chọn, không phải ComboCourseID; phải thuộc combo đó, thỏa min/max từng nhóm và ánh xạ các slot riêng biệt. Combo phải thuộc chương trình PUBLISHED của sinh viên và có purpose SPECIALIZATION (selectionGroup rõ ràng hoặc mã combo legacy đã phân loại).

Lần chọn đầu của sinh viên có thể không gửi reason; khi đổi combo/môn so với lần gửi trước hoặc lựa chọn đang được xác nhận, bắt buộc reason. CONFIRMATION yêu cầu gửi một lần ngay cả khi giữ combo ban đầu để ghi nhận hành động xác nhận.

Mỗi lần gửi tạo event mới, không ghi đè event cũ. Chưa chốt thì lựa chọn mới ở trạng thái SUBMITTED, chưa thay lựa chọn đang áp dụng. Nếu tài khoản hoặc mốc khóa/nhóm/chương trình thay đổi sau khi chốt phạm vi, API yêu cầu phòng đào tạo rà soát, không áp dụng nhầm chương trình.

## Theo dõi và nhắc nhở

`GET /combo-registration-windows/:id/selections?status=MISSING&page=1&limit=20`: trả tổng đã gửi/chưa gửi/đã áp dụng/không chọn, chi tiết sinh viên và `effectiveEndsAt`. Status SUBMITTED/MISSING/APPLIED/UNSELECTED. Khi INITIAL chưa chốt, số liệu chưa phản ánh lựa chọn được áp dụng.

`POST /combo-registration-windows/:id/reminders`:

```json
{
  "idempotencyKey":"combo-window-12-reminder-1",
  "target":"MISSING",
  "studentIds":[101,102],
  "reason":"Nhắc các sinh viên chưa xác nhận"
}
```

Mặc định MISSING chỉ nhắc người chưa gửi; ALL nhắc mọi người được yêu cầu. Omit studentIds để lấy toàn bộ đối tượng phù hợp trong đợt. Loại người đã hết hạn/tài khoản không ACTIVE; danh sách ngoài phạm vi bị từ chối. API chỉ dùng khi OPEN, tạo thông báo trong ứng dụng và email mã hóa vào EmailOutbox trong cùng giao dịch.

Cùng khóa/payload/người gửi trả `replayed: true`, không tạo thêm email. Muốn gửi đợt nhắc tiếp theo dùng khóa mới. Email chưa gửi dành cho người MISSING được hủy khi họ gửi lựa chọn; đóng đợt hủy email chưa gửi của đợt. Worker SMTP hiện có xử lý email loại COMBO_REMINDER, không áp điều kiện mật khẩu tạm của email cấp tài khoản lên nhắc nhở.

## Chốt và tính lại

Đóng đợt trước rồi `POST /combo-registration-windows/:id/finalize`:

```json
{
  "idempotencyKey":"finalize-window-12-v1",
  "reason":"Chốt danh sách đã được phòng đào tạo rà soát",
  "allowUnselected":false
}
```

Mặc định không chốt nếu còn sinh viên chưa gửi. Có thể gia hạn/mở lại hoặc dùng `allowUnselected: true` với lý do để ghi UNSELECTED cho những người còn thiếu, không tự chọn combo thay họ. `excludeStudentIds` cho phép phòng đào tạo loại rõ những sinh viên đã chuyển chương trình/không còn tham gia; vẫn lưu lịch sử và quyết định loại, không áp dụng lượt gửi của họ.

Chốt INITIAL xác nhận lựa chọn ban đầu để dùng cho tiến độ đầu kỳ. Chốt CONFIRMATION áp dụng lựa chọn cuối cùng. Giữ nguyên các event ban đầu, các lần sửa và event cuối cùng cùng snapshot trước/sau; chỉ thay bản lựa chọn đang hoạt động. Không xóa combo thể chất hoặc các purpose khác.

Trong cùng giao dịch, hệ thống xác nhận môn được chọn, tính lại tiến độ bằng code đã có, xét điều kiện OJT của `ojtSemesterId` gắn với đợt, cập nhật StudentOJTEligibility và lưu snapshot tính lại gắn với event APPLIED. Nếu có lỗi, toàn bộ việc chốt rollback. Chốt lại cùng khóa/payload/người thực hiện trả kết quả cũ; yêu cầu khác trên đợt FINALIZED bị từ chối.

Khi đổi combo, tín chỉ slot chỉ tính các môn đã đạt/công nhận phù hợp combo đang áp dụng, quy đổi môn tương đương đã duyệt và tránh cộng trùng. GPA vẫn lấy lần hoàn tất có điểm gần nhất; môn đã học trong combo trước giữ trọng số GPA đã xác nhận của chương trình, không tự tính môn đó thành tín chỉ slot của combo mới.

Điều kiện OJT dùng OJTRuleSets đã ban hành: ít nhất 70 tín chỉ và tối đa 2 môn đã trượt chưa đạt/công nhận trong chương trình/combo hiện tại, không xét GPA. Ưu tiên phiên bản đang áp dụng cho kỳ cụ thể, sau đó quy tắc chung của chương trình. Thiếu quy tắc hoặc cấu hình tín chỉ trả REVIEW_REQUIRED. Mỗi lần tính lại lưu EligibilityChecks với source COMBO_CHANGE và không tự xác nhận chính thức. Xem [API xét điều kiện OJT](ojt-eligibility-api.md) để cấu hình, xét và xác nhận; các quy tắc legacy OJTEligibilityConditions không tham gia bộ xét mới.

## Lịch sử của sinh viên

`GET /students/:id/combo-selections?page=1&limit=20`: staff hoặc chính sinh viên. Trả lựa chọn đang áp dụng, các event phase INITIAL/CONFIRMATION, loại SUBMITTED/APPLIED/UNSELECTED, lý do/người/thời điểm, snapshot lựa chọn trước/sau và snapshot progress/eligibility khi chốt. Có cả lịch sử chương trình cũ; lịch sử không bị ghi đè khi đổi combo.

Snapshot OJT là kết quả tại thời điểm chốt. API academic-progress tiếp tục tính trực tiếp từ điểm/lộ trình mới nhất. Không tạo dự đoán AI hoặc chuyển tự động chương trình của sinh viên.
