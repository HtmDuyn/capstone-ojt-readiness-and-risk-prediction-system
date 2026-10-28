# QHDN: đăng ký và import tuyển dụng theo kỳ

QHDN chọn kỳ OJT do Đào tạo tạo, dùng `ojtSemesterId` lấy từ `GET /api/academic-periods`. Không tạo lại kỳ hoặc đợt tuyển dụng. Không đổi schema DB. Giữ quyền Admin, Đào tạo và Doanh nghiệp. Theo luồng mới đã thống nhất, sinh viên nộp hồ sơ OJT và chọn vị trí ứng tuyển trong cùng một request; QHDN không nộp hộ.

## PUT /api/qhdn/ojt-semesters/{id}/registration-settings

Chỉ `OJT_COORD`. JSON body, không truyền dữ liệu qua query. `{id}` là `OJTSemesterID`, không phải `AcademicPeriodID` hoặc số thứ tự học kỳ chuyên ngành.

Lần đầu cấu hình ngày và mở đăng ký trong cùng một transaction:

```json
{
  "startsAt": "2026-12-01T08:00:00+07:00",
  "endsAt": "2026-12-15T23:59:59+07:00",
  "status": "OPEN",
  "reason": "Mở đăng ký cho danh sách Đào tạo đã bàn giao"
}
```

Thay ID và ngày bằng kế hoạch thực tế. `name` tùy chọn, mặc định theo tên kỳ. `reason` bắt buộc, tối đa 2000 ký tự. `startsAt` và `endsAt` bắt buộc khi chưa có cấu hình. Khi cập nhật có thể bỏ qua các giá trị không đổi. `status` nhận `DRAFT`, `OPEN`, `CLOSED`; khi không gửi thì giữ trạng thái hiện có, hoặc mặc định `OPEN` nếu tạo mới.

- `OPEN`: cần có sinh viên đã bàn giao trong phạm vi, kỳ chưa đóng và hạn còn ở tương lai.
- `DRAFT`: lưu lịch chuẩn bị; không cho sinh viên nộp. Không đưa cấu hình đã công bố về nháp.
- Đóng: gửi `{"status":"CLOSED","reason":"Đóng theo kế hoạch"}`.
- Gia hạn: gửi `endsAt` mới và `reason`. Đợt đã công bố không được rút ngắn hạn hoặc đổi ngày mở.
- Mở lại: gửi `status: OPEN`, `reason` và hạn mới nếu hạn cũ đã hết. Giữ nguyên ID cấu hình và lịch sử.
- Cấu hình mới áp dụng cho toàn bộ sinh viên đã bàn giao cùng kỳ; sinh viên vẫn phải tự nộp và đáp ứng kiểm tra hiện có. Không tạo `OJTRegistrations` khi mở đăng ký.
- Một cấu hình cũ: giữ nguyên phạm vi đã lưu. Nhiều cấu hình cũ trong một kỳ: trả 409 `REGISTRATION_SETTINGS_AMBIGUOUS`, không tự gộp hoặc xóa dữ liệu.

Response giữ `status` DB và thêm `effectiveStatus` (`DRAFT`, `SCHEDULED`, `OPEN`, `EXPIRED`, `CLOSED`), `replayed`. Gửi lại cùng cấu hình không tạo đợt hoặc lịch sử trùng. Đọc danh sách bằng `GET /api/ojt-registration-windows?ojtSemesterId=...`; projection QHDN có thêm `effectiveStatus`, dữ liệu trả về cho Student/Admin giữ nguyên. Ngày hiệu lực vẫn được kiểm tra ở API sinh viên.

`POST /api/ojt-registration-windows` và `PATCH /api/ojt-registration-windows/{id}` vẫn dành cho Admin; QHDN gọi trả 403 và không còn hiển thị hai API này trong nhóm Swagger QHDN.

## POST /api/imports/preview

Chỉ `OJT_COORD`, `kind: ENTERPRISE`. Chọn kỳ rồi kiểm tra file/dữ liệu; không ghi tài khoản, tin, vị trí hoặc email. Response có số doanh nghiệp, số vị trí, kỳ và hạn công bố dự kiến.

JSON body:

```json
{
  "kind": "ENTERPRISE",
  "ojtSemesterId": 1,
  "idempotencyKey": "enterprise-semester-001",
  "rows": [{
    "code": "DN001",
    "email": "hr@example.com",
    "fullName": "Người phụ trách OJT",
    "name": "Doanh nghiệp A",
    "positions": [{
      "code": "DEV001",
      "title": "Lập trình viên thực tập",
      "description": "Phát triển ứng dụng",
      "requirements": "TypeScript",
      "capacity": 5
    }]
  }]
}
```

Hoặc multipart có `kind`, `ojtSemesterId`, `idempotencyKey`, `file` `.xlsx`/`.csv`; `mapping` tùy chọn là JSON map tên chuẩn sang tiêu đề cột. Sheet `EnterpriseImport` được ưu tiên, nếu không có dùng sheet đầu.

Cột chuẩn: `code`, `email`, `fullName`, `name`, `address` (tùy chọn), `positionCode`, `title`, `description`, `requirements`, `capacity`. Mỗi dòng một vị trí; gom các dòng cùng mã/email doanh nghiệp trước khi kiểm tra trùng. Các cột nguồn/ghi chú được bỏ qua, không tải URL trong file. Tối đa 8 MiB, 5000 dòng, 500 doanh nghiệp, 50 vị trí mỗi doanh nghiệp.

`semesterId` cũ được chấp nhận như alias của `ojtSemesterId`; gửi cả hai phải trùng nhau. Đầu vào mới dùng thống nhất `ojtSemesterId` từ năm/kỳ đã chọn. Không nhận `windowId`, không đọc hoặc tạo `RecruitmentWindows`.

Quy tắc ô trống: bỏ qua dòng không có dữ liệu ở các cột chuẩn; `address` thiếu, `null`, chuỗi rỗng hoặc toàn khoảng trắng được xem là không cung cấp. Các dòng cùng doanh nghiệp có thể bổ sung địa chỉ còn thiếu; hai địa chỉ khác nhau bị báo lỗi. Trường bắt buộc trống bị báo lỗi, không tự điền. Cả JSON lồng `positions` và Excel/CSV đều cắt khoảng trắng, chuẩn hóa mã/email và chuyển chỉ tiêu dạng chuỗi số thành số nguyên. Cột nguồn/ghi chú và mọi cột ngoài danh sách chuẩn/mapping được bỏ qua, không lưu hoặc truy cập URL; không dùng chúng để nhận diện doanh nghiệp hoặc tính hash.

## POST /api/imports/commit

Nhận cùng định dạng với preview và kiểm tra lại mọi điều kiện. Không bắt buộc phải gọi preview trước. Toàn bộ lô nằm trong một transaction; lỗi thì rollback, không để lại dữ liệu dở dang.

- Doanh nghiệp mới: tạo doanh nghiệp/tài khoản và email outbox mã hóa; mật khẩu tạm phải đổi khi đăng nhập. Cần cấu hình `EMAIL_OUTBOX_KEY` và `FRONTEND_LOGIN_URL`. API không gửi SMTP trực tiếp.
- Doanh nghiệp đã có: dùng lại tài khoản, mã và thông tin cũ; bổ sung vị trí theo kỳ, không đổi mật khẩu hoặc gửi lại tài khoản.
- Vị trí mới `OPEN`; tin mới `PUBLISHED` với người và thời gian công bố. Không cần QHDN gọi API duyệt hoặc đóng tin riêng.
- Trùng mã vị trí trong cùng doanh nghiệp/kỳ: 409, không ghi đè. Mã/email xung đột: 409. Dùng lại khóa cùng nội dung/người import: trả lô cũ; khác kỳ hoặc nội dung: 409.
- Hạn ban đầu lấy từ cấu hình đăng ký của kỳ; nếu chưa có, lấy thời điểm bắt đầu ngày tiếp theo `RegEndDate` hoặc `EndDate` của kỳ, theo giờ Việt Nam. Hạn phải còn hiệu lực và không vượt `expiresAt` (5 tháng lịch kể từ commit). Thời điểm hết hạn được loại trừ.
- Khi QHDN mở/gia hạn/mở lại đăng ký, chỉ các tin do nhánh import mới tạo, còn theo chính sách hạn tự động và chưa bị role khác sửa/đóng thủ công, được đồng bộ hạn trong giới hạn `expiresAt`. Tin đóng do hết hạn có thể mở lại trước mốc 5 tháng; tin Admin đóng hoặc sửa được giữ nguyên. Worker chỉ áp dụng chính sách 5 tháng cho lô có dấu nguồn và thời hạn mới.
- Không tự công bố hoặc thay đổi các tin `PENDING_REVIEW` lịch sử.

Vị trí/tin từ lô mới dùng thời hạn **5 tháng lịch kể từ commit import**, không phải từ ngày mở kỳ và không phải 150 ngày. Preview chỉ trả ngày dự kiến; gửi lại đúng khóa không làm bắt đầu lại thời hạn. Mở lại/gia hạn đăng ký không kéo dài quá mốc này. Worker hiện có kiểm tra mỗi phút, chuyển tin/vị trí hết thời hạn sang `ARCHIVED`; không xóa bản ghi, tài khoản, ứng tuyển, phân công, đánh giá hoặc điểm. Chính sách cũ của tin thủ công/tin không có dấu nguồn import và thời hạn mới được giữ. Không ghi đè vị trí/chỉ tiêu ở kỳ cũ khi import kỳ mới.

Response preview/commit có `importedAt`, `expiresAt`, `retentionMonths: 5`, `deadlineAt`, `publicationStatus` và `rows`. Mỗi doanh nghiệp có `accountStatus` (`CREATED`/`REUSED`), `recruitmentStatus: POSITIONS_ADDED`, `positionStatus`, danh sách `positions` (mã, chỉ tiêu, trạng thái, `positionId` sau commit), cùng `enterpriseId`. `UPDATED` nghĩa là bổ sung tuyển dụng trên doanh nghiệp cũ; không sửa mật khẩu hoặc ghi đè kỳ cũ. Replay đọc trạng thái tin/vị trí hiện tại (`CLOSED`, `ARCHIVED`, hoặc `MIXED` nếu nhiều trạng thái); các số lượng/action còn lại là kết quả lô ban đầu.

DB hiện có unique index `UQ_EnterpriseImport_Semester`: chỉ một lô `ENTERPRISE` mỗi kỳ. Code giữ nguyên ràng buộc này và trả 409 `SEMESTER_ALREADY_IMPORTED` cho lô khác cùng kỳ. Gửi lại khóa cũ đúng dữ liệu được phép; thay đổi kỳ/nội dung/actor với cùng khóa trả 409. Không thay schema để cho phép nhiều lô trong cùng kỳ.

QHDN không dùng các API tạo/sửa đợt tuyển dụng hoặc duyệt/đóng tin cũ. Các contract cũ của Admin được giữ. Không thêm `PATCH /api/qhdn/recruitment-posts/{id}`.

## Hai danh sách QHDN và thao tác nộp hồ sơ

Không thêm thao tác “QHDN đã nhận”, `receivedBy`, `receivedAt` hoặc quyền từ chối bàn giao. Đào tạo bàn giao là đủ căn cứ; các đợt bàn giao A/B cùng kỳ đều thuộc phạm vi mặc định `{}`. Giữ API lịch sử bàn giao đang có. Phạm vi cũ hẹp hơn vẫn được giữ; nhiều cấu hình cũ tiếp tục trả 409 để đối soát.

| API | Mục đích |
| --- | --- |
| `GET /api/qhdn/eligible-students?ojtSemesterId=1` | Danh sách đủ điều kiện OJT Đào tạo đã bàn giao, độc lập đã nộp hồ sơ hay chưa; có lọc `handoffId`. |
| `GET /api/qhdn/registered-students?ojtSemesterId=1` | Tiến độ hồ sơ của toàn bộ sinh viên đã bàn giao trong kỳ, gồm người chưa nộp. Chỉ QHDN bắt buộc chọn kỳ; projection/bộ lọc Admin giữ nguyên. |

API tiến độ trả một sinh viên một dòng, `registration` (null khi chưa nộp), `registrations` (rỗng khi chưa nộp), `applications` (doanh nghiệp/vị trí đã ứng tuyển), `coordination` mới nhất và `assignment`. `status`/`registrationStatus`: `NOT_REGISTERED` = chưa nộp hồ sơ, `SUBMITTED` = đã nộp, `APPROVED` = đã duyệt. Giữ `REJECTED` khi cần bổ sung/nộp lại và `LEGACY_REVIEW_REQUIRED` cho dữ liệu cũ; không đổi enum DB. Bộ lọc `status` dùng các giá trị này; `coordinationStatus` dùng `NOT_COORDINATED`, `PENDING`, `ACCEPTED`, `REJECTED`.

Nhóm Swagger QHDN còn **28 API**. QHDN không còn quyền đọc hai API chồng lặp `GET /api/ojt-registrations` và `GET /api/ojt-semesters/{id}/students`; gọi trực tiếp trả 403 ở route và service. Admin/Sinh viên giữ quyền đọc hồ sơ cũ; Admin/Đào tạo/Sinh viên giữ quyền đọc sinh viên theo kỳ cũ. API review hồ sơ vẫn dành cho QHDN. Giữ riêng các API ứng tuyển, điều phối, thực tập, báo cáo và xuất dữ liệu.

Xem chi tiết QHDN qua API tiến độ, không thêm endpoint:

```http
GET /api/qhdn/registered-students?ojtSemesterId=1&studentId=123&historyPage=1&historyLimit=20&coordinationPage=1&coordinationLimit=20&assignmentPage=1&assignmentLimit=20
```

Có thể dùng `registrationId` thay `studentId`. Kết quả vẫn nằm trong `data.items`, không đổi envelope sang object riêng. Khi chọn một sinh viên/hồ sơ, mỗi item bổ sung:

- `officialEligibility`: kết quả chính thức hiện tại, có kiểm tra độ còn hiệu lực; `handoff` và `handoffSnapshot`: thông tin/snapshot của lần bàn giao thật trong kỳ.
- `history`, `historyPagination`: lịch sử nộp, duyệt và nộp lại hồ sơ.
- `coordinationHistory`, `coordinationPagination`: các lần gửi/điều phối lại, doanh nghiệp/vị trí, quyết định và liên kết lần trước.
- `assignments`, `assignmentsPagination`: các phân công đã có, ngày bắt đầu/kết thúc, người hướng dẫn doanh nghiệp và giảng viên phụ trách.

`coordination` và `assignment` tiếp tục biểu diễn bản mới nhất, không bị thay bằng mảng hoặc đổi theo trang lịch sử. `window` và thông tin hồ sơ hiện có vẫn được trả. `historyPage/historyLimit`, `coordinationPage/coordinationLimit`, `assignmentPage/assignmentLimit` chỉ dùng cùng `studentId` hoặc `registrationId`; mặc định trang 1, 20 dòng, tối đa 100 dòng/phần. Chưa nộp trả lịch sử/mảng phân công rỗng và total=0. Không khớp kỳ, sinh viên chưa bàn giao hoặc bộ lọc không khớp trả `items=[]`, không đọc thêm lịch sử của người khác. Tất cả phần đọc dùng cùng transaction chỉ đọc, không tạo hoặc sửa hồ sơ.

Bổ sung bộ lọc QHDN `enterpriseId` (doanh nghiệp ở lần điều phối mới nhất) và `assignmentStatus` (`UNASSIGNED`, `ASSIGNED`, `ACTIVE`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `CANCELED`, `FAILED`). Giao diện QHDN đang dùng hai GET cũ cần chuyển sang API tiến độ; không cần đổi client của role khác.

`workflowStatus` thể hiện tiến trình riêng: `NOT_SUBMITTED`, `AWAITING_REVIEW`, `READY_TO_COORDINATE`, `SENT_TO_ENTERPRISE`, `NEEDS_REASSIGNMENT`, `ENTERPRISE_ACCEPTED`, `ASSIGNED`, `IN_PROGRESS`, `COMPLETED`, `FAILED`, `NEEDS_RESUBMISSION` hoặc `LEGACY_REVIEW_REQUIRED`. Không đổi `APPROVED` thành `REJECTED` chỉ vì doanh nghiệp từ chối. `canSendToEnterprise` yêu cầu hồ sơ duyệt, có ứng tuyển chưa kết thúc, chưa điều phối và chưa phân công; `canReassign` yêu cầu hồ sơ duyệt và điều phối mới nhất bị doanh nghiệp từ chối.

Sinh viên gọi **một lần** `POST /api/ojt-registrations`:

```json
{
  "windowId": 1,
  "postId": 1,
  "positionId": 1,
  "application": { "note": "Đăng ký OJT" },
  "coverLetter": "Nguyện vọng thực tập"
}
```

Backend kiểm tra bàn giao, lịch đăng ký, import doanh nghiệp của kỳ, tin đã công bố còn hạn và vị trí còn chỉ tiêu. Sau đó tạo `OJTRegistrations` và `JobApplications` trong cùng transaction; chọn sai kỳ/tin/vị trí, hồ sơ đủ điều kiện lỗi hoặc ghi dữ liệu lỗi thì rollback cả hồ sơ, ứng tuyển và audit. Response `data` giữ thông tin hồ sơ và thêm `jobApplication`. Cùng thông tin/lựa chọn trả replay; đổi lựa chọn trong khi hồ sơ đang nộp trả 409 `OJT_SUBMISSION_CONFLICT`. Hồ sơ và ứng tuyển bị từ chối có thể nộp lại với cùng ID khi hợp lệ, không tạo bản ghi trùng. Không tự tạo hồ sơ khi mở đăng ký hoặc import doanh nghiệp.

Student GET cấu hình đăng ký có `canSubmit=false` và blocker `RECRUITMENT_NOT_READY` nếu kỳ chưa có import và vị trí đang nhận còn chỗ; API nộp kiểm tra lại, không dựa vào cờ của giao diện. Mở đăng ký và import có thể thực hiện theo bất kỳ thứ tự nào, nhưng cần đủ hai điều kiện trước khi sinh viên nộp.

Admin vẫn dùng đầu vào nộp hộ cũ `windowId`, `studentId`, `application`, không bắt buộc chọn vị trí. `POST /api/job-applications` hiện có vẫn được giữ cho chức năng ứng tuyển; giao diện mới không cần gọi thêm API này sau request nộp hồ sơ gộp thành công. Giao diện cần gửi thêm `postId`/`positionId` và đọc response mới.

QHDN duyệt hồ sơ bằng API review hiện có, gửi hồ sơ bằng `POST /api/ojt-coordinations` (cần vị trí sinh viên đã ứng tuyển), điều phối lại bằng `POST /api/ojt-coordinations/{id}/reassign` sau khi doanh nghiệp từ chối. Không cấp lại quyền QHDN cập nhật quyết định nhận/từ chối của doanh nghiệp hoặc tạo/sửa phân công.

## Kiểm chứng

`node --test tests/qhdn-write-permissions.test.cjs tests/qhdn-semester-workflow.test.cjs tests/enterprise-import-entrypoints.test.cjs tests/qhdn-roster-workflow.test.cjs`

Các bài kiểm tra dùng fixture PostgreSQL trong bộ nhớ, không chạy script reset hoặc truy cập DB thật. Có kiểm tra API dùng chung của Admin/Student, lịch đăng ký, upload multipart, replay, rollback và bảo toàn tin Admin đã sửa/đóng.
