# Dashboard, cảnh báo học vụ và nhu cầu học

Base `/api`; JWT bắt buộc, chỉ ADMIN/ACADEMIC. Không tạo lớp hoặc nhận đăng ký lớp hỗ trợ. GET không tạo lịch sử xét, không tự xác nhận và không ghi trạng thái học vụ.

## Bộ lọc chung

`ojtSemesterId` bắt buộc. Bộ lọc tùy chọn, kết hợp AND: `programId`, `cohortId`, `majorId` (SpecializationID), `comboId` (ProgramComboID đã xác nhận của chương trình hiện tại), `groupCode=A|B|C|D`.

Chỉ thống kê sinh viên và tài khoản ACTIVE. Giới hạn phạm vi 20000 sinh viên; vượt giới hạn trả 422 để chọn phạm vi hẹp hơn. Dữ liệu được đọc theo lô và dùng chung calculateProgress/evaluateEligibility, không gọi API xét riêng từng sinh viên. Retake/tương đương/công nhận vẫn không cộng trùng tín chỉ.

## Dashboard

`GET /academic/dashboard?ojtSemesterId=1&cohortId=1`

Bốn nhóm không trùng nhau, cộng bằng total:

- `eligible`: hiện đủ điều kiện và có xác nhận chính thức còn hiệu lực.
- `notEligible`: hiện chưa đủ điều kiện và có xác nhận chính thức còn hiệu lực.
- `insufficientData`: thiếu bộ quy tắc đã ban hành hoặc cấu hình tín chỉ/chương trình/combo cần thiết.
- `awaitingConfirmation`: tính được kết quả ELIGIBLE hoặc NOT_ELIGIBLE nhưng chưa xác nhận, hoặc xác nhận đã cũ.

`currentEvaluation` thống kê kết quả tính hiện tại độc lập việc xác nhận; `staleConfirmations` là số xác nhận cũ. Không dùng GPA hoặc cảnh báo môn bắt buộc làm tiêu chí mới: điều kiện OJT vẫn >=70 tín chỉ và <=2 môn đã trượt chưa đạt/công nhận.

## Thống kê

`GET /academic/eligibility-statistics?ojtSemesterId=1&groupBy=cohort`

`groupBy=cohort|group|major|combo`, mặc định cohort. Trả overall và groups có tên, tổng số và bốn nhóm trên. Giá trị chưa gán có id/name null. Mỗi sinh viên được tính một lần trong mỗi nhóm combo hiện tại đã xác nhận; có thể thuộc nhiều combo (ví dụ chuyên ngành và thể chất), vì vậy tổng nhóm combo có thể vượt overall, được đánh dấu membershipCountsMayOverlap.

## Cảnh báo

```text
GET /academic/alerts?ojtSemesterId=1&academicPeriodId=4&assessmentDeadline=2026-11-10T23:59:59%2B07:00&page=1&limit=20
```

`academicPeriodId` và `assessmentDeadline` bắt buộc. Hạn xét được cung cấp rõ ràng, không suy diễn từ hạn đăng ký OJT. Timestamp phải có timezone; khi dùng URL, encode dấu `+` thành `%2B`.

`type=CREDIT_SHORTFALL|MISSING_REQUIRED_COURSES` tùy chọn. Danh sách theo sinh viên gồm thiếu tín chỉ, môn bắt buộc chưa hoàn thành, lựa chọn còn chưa xác định, lỗi dữ liệu và trạng thái xác nhận. `deadlineStatus=UPCOMING|OVERDUE` giúp phân biệt trước/quá hạn; GET vẫn xem được danh sách quá hạn để đối soát.

Môn đến hạn được xác định bằng RecommendedSemester so với kỳ chuyên ngành thực tế tính từ EntryAcademicPeriodID của sinh viên đến kỳ yêu cầu. Block 3 dùng kỳ cha và không tăng kỳ chuyên ngành. Không dùng CurrentSemester chung để suy diễn lộ trình. Thiếu lộ trình/kỳ đề xuất hoặc cấu hình tín chỉ thì báo dataIssues, không tự coi các môn tương lai là môn nợ.

Cảnh báo môn bắt buộc đến kỳ là thông tin học vụ riêng, không tự làm thay đổi điều kiện OJT 70/2. Môn đang học được ghi IN_PROGRESS, không nằm trong cảnh báo cần ghi danh học lại. Slot nhiều môn thay thế được đưa vào alternativeRequirements thay vì coi tất cả lựa chọn là môn bắt buộc.

## Gửi cảnh báo

`POST /academic/alerts/notifications`:

```json
{
  "ojtSemesterId": 1,
  "academicPeriodId": 4,
  "assessmentDeadline": "2026-11-10T23:59:59+07:00",
  "cohortId": 1,
  "studentIds": [101, 102],
  "channel": "IN_APP",
  "reason": "Vui lòng rà soát kết quả và các môn cần hoàn thành trước hạn xét OJT",
  "idempotencyKey": "academic-alert-fall-2026-1"
}
```

Thay ID/ngày bằng dữ liệu thật. Danh sách sinh viên bắt buộc, 1–1000 ID không trùng. Tất cả phải ACTIVE, đúng bộ lọc và còn cảnh báo hiện tại; một ID không phù hợp làm toàn bộ yêu cầu thất bại. Không gửi cảnh báo sau hạn xét.

`channel=IN_APP` mặc định tạo thông báo trong ứng dụng; EMAIL chỉ xếp email, BOTH dùng cả hai. API trả batchId, requested, inAppCreated, emailsQueued, replayed. Cùng key/body/người gửi trả batch cũ; thay body hoặc người gửi với key cũ trả 409. Mỗi đợt nhắc mới dùng key mới.

Email dùng EmailOutbox mã hóa, SMTP và worker provisioning hiện có. Trước khi gửi, worker so lại nguồn học vụ và hạn xét; nếu dữ liệu đổi, cảnh báo được giải quyết hoặc người nhận không còn phù hợp thì hủy email cũ, không gửi nội dung đã lỗi thời. Thông báo IN_APP là lịch sử tại thời điểm tạo; không tự xóa sau khi sinh viên đủ điều kiện. Không có mật khẩu trong cảnh báo.

## Nhu cầu môn học

`GET /academic/course-demand?ojtSemesterId=1&academicPeriodId=4&page=1&limit=20`

Kỳ/Block yêu cầu bắt buộc; thêm `courseId` để lọc môn. Chỉ tính môn bắt buộc đến kỳ chưa hoàn thành trong chương trình/combo hiện tại, sau xử lý tương đương và công nhận. Mỗi sinh viên chỉ tính một lần/môn/kỳ.

Trả studentCount, retakeCount, inProgressCount theo môn. Mặc định loại môn đang học khỏi nhu cầu ghi danh; `includeInProgress=true` thêm môn đang học và đánh dấu needsEnrollment=false. Retake là môn đã trượt chưa đạt/công nhận; môn chưa hoàn thành chưa có kết quả trượt có reason NOT_COMPLETED. Không yêu cầu sinh viên có bộ quy tắc OJT đã ban hành để thống kê môn nếu khung học vụ đã đủ cấu hình.

`studentsWithDataIssues` và `unresolvedAlternatives` giúp phòng đào tạo đối soát những trường hợp chưa thể đưa vào số liệu chính xác; không tự chọn môn cho sinh viên, không cộng một slot thành nhiều nhu cầu.

## Xuất danh sách

```text
GET /academic/course-demand/export?ojtSemesterId=1&academicPeriodId=4&format=csv
GET /academic/course-demand/export?ojtSemesterId=1&academicPeriodId=4&courseId=10&format=json
```

Cùng bộ lọc với nhu cầu, mặc định CSV UTF-8 có BOM để mở trong Excel. Xuất toàn bộ phạm vi, không phân trang; tối đa 100000 dòng sinh viên-môn. Cột gồm mã/tên sinh viên, khóa/nhóm/chuyên ngành/chương trình, môn, lý do, tín chỉ, kỳ OJT, kỳ/Block. CSV quote dấu phân cách/xuống dòng và vô hiệu hóa công thức từ trường văn bản. Header X-Data-Issue-Students và X-Unresolved-Alternative-Students báo số trường hợp cần đối soát; JSON trả đầy đủ metadata/chi tiết lỗi.

## DB

Schema duy nhất trong backend/DB, phần `20261008 academic reporting and alert notifications`, version `20261008_academic_reporting`. Chỉ thêm lịch sử batch thông báo/delivery và loại email ACADEMIC_ALERT; dashboard và nhu cầu tính trực tiếp, không tạo bảng lớp hoặc seed dữ liệu. File DB đầy đủ là script reset; khi cập nhật DB có dữ liệu chỉ áp dụng phần bổ sung mới. Swagger nhóm Academic reporting tại /api-docs.
