# Tuyển dụng doanh nghiệp — công bố trực tiếp

Phạm vi code: `src/modules/enterprise`, kiểm thử và tài liệu backend liên quan. Không sửa frontend, DB/schema, route/service của QHDN, sinh viên hoặc các role khác.

## Định danh doanh nghiệp

- `Enterprises.EnterpriseCode` là mã doanh nghiệp duy nhất hiển thị trên hồ sơ, danh sách đối tác và thông tin tài khoản. Mã hiện có như `TECHVIET` được giữ nguyên; doanh nghiệp mới có mã tự sinh dạng `DN000001`. DB đã có ràng buộc duy nhất và index không phân biệt hoa/thường cho mã này.
- `Enterprises.EnterpriseID` là khóa số nội bộ liên kết tài khoản, tin tuyển dụng, hồ sơ ứng tuyển và sinh viên. Không hiển thị ID số như một mã hồ sơ doanh nghiệp khác. API giữ `id`/`companyId` kiểu số cho các thao tác liên kết và phân quyền; trường `code` dùng để hiển thị.
- GET và PATCH hồ sơ cùng đọc mã từ `EnterpriseCode`. Cập nhật hồ sơ gửi ID số từ dữ liệu API; không chuyển mã hiển thị thành số, không đổi khóa liên kết và không cấp lại mã cho doanh nghiệp đang có.
- Quy ước này dùng cấu trúc DB hiện tại, không cần migration dữ liệu hay chạy lại script khởi tạo.

## API

Tất cả endpoint mới yêu cầu JWT ENTERPRISE. Doanh nghiệp lấy từ tài khoản; không nhận companyId từ client.

| Method | Endpoint | Chức năng |
| --- | --- | --- |
| GET | `/api/enterprise/recruitment/windows` | Xem đợt và hạn đăng tuyển QHDN thiết lập, trạng thái khóa sửa |
| GET | `/api/enterprise/recruitment/posts` | Tin, toàn bộ vị trí, chỉ tiêu và quyền sửa hiện tại |
| POST | `/api/enterprise/recruitment/posts` | Tạo và công bố ngay, không qua QHDN duyệt |
| PATCH | `/api/enterprise/recruitment/posts/:id` | Sửa trực tiếp tin đã công bố khi được phép |

Không thêm API gửi duyệt, công bố riêng, xem giữ chỗ hoặc tuyển tiếp vòng sau. Giữ nguyên URL và cấu trúc `{success:true,data:...}`.

## Tạo tin

```json
{
  "windowId": 1,
  "title": "Tuyển thực tập sinh Backend",
  "content": "Phát triển REST API và hệ thống nội bộ",
  "benefits": "Có mentor hướng dẫn",
  "applicationInstructions": "Ứng tuyển qua hệ thống OJT",
  "positions": [
    {
      "title": "Backend Intern",
      "description": "Phát triển và kiểm thử API",
      "requirements": "TypeScript, PostgreSQL",
      "capacity": 5,
      "location": "TP.HCM",
      "workMode": "HYBRID"
    }
  ]
}
```

Thay windowId bằng dữ liệu thực từ GET windows. Một doanh nghiệp có nhiều tin, mỗi tin có 1–50 vị trí; ít nhất một vị trí có chỉ tiêu dương.

POST thành công trả 201: tin `PUBLISHED`, có `PublishedAt`, vị trí `OPEN`, `requiresReview:false`. Không giả lập người QHDN duyệt (`ReviewedBy/ReviewedAt` null). API cơ hội OJT của sinh viên hiện có đọc được tin ngay; điều kiện sinh viên thuộc kỳ, đủ điều kiện và được ứng tuyển vẫn do luồng sinh viên hiện tại kiểm soát. Không gọi API review, không gửi email hoặc tin nhắn.

## Thời hạn thuộc QHDN

- `RecruitmentWindows.StartsAt/EndsAt`: thời gian doanh nghiệp được tạo/sửa tin. Đợt phải OPEN, đã bắt đầu, chưa hết hạn và liên kết học kỳ còn khả dụng.
- `RecruitmentPosts.DeadlineAt`: hạn sinh viên ứng tuyển, khác với hạn doanh nghiệp đăng tin.
- Doanh nghiệp không đặt hoặc chỉnh thời hạn. Không cần deadlineAt khi tạo/sửa. Giá trị deadlineAt từ client cũ vẫn được chấp nhận để tương thích nhưng **bị bỏ qua**; không thể dùng nó để thay hạn lưu trong DB.
- Khi tạo, backend dùng hạn kết thúc muộn nhất của các đợt OJTRegistrationWindows DRAFT/OPEN còn hạn cùng kỳ do QHDN thiết lập, không vượt cuối học kỳ. Nếu chưa có đợt như vậy, dùng cuối học kỳ liên kết để tin công bố vẫn có thời hạn khả dụng. Không tự tạo hay sửa bất kỳ đợt nào.
- Khi cập nhật, giữ nguyên hạn QHDN đã lưu, kể cả trường hợp hạn ứng tuyển bằng EndsAt của đợt đăng tuyển. Không áp dụng lại quy tắc tạo tin vào hạn này; sửa nội dung/vị trí không gây lỗi so sánh hai thời hạn.

## Sửa tin và khóa theo đợt đăng ký sinh viên

PATCH chỉ gửi các trường cần đổi; không gửi windowId/companyId/status. Nếu gửi positions thì giữ đủ vị trí cũ kèm id, vị trí mới không có id. Không xóa vị trí có lịch sử hoặc sửa vị trí dùng chung với tin khác. Tin CLOSED/ARCHIVED và vị trí đã lưu trữ/xóa không được phục hồi qua API chỉnh sửa.

Tin DRAFT/PENDING_REVIEW/REJECTED/PUBLISHED được sửa trong hạn đăng tuyển. Lưu xong vẫn `PUBLISHED`, vị trí `OPEN`, sinh viên thấy nội dung mới ngay, không chuyển về chờ duyệt. Giữ nguyên PostID, PositionID, phân công đã có và thời điểm công bố lần đầu (nếu đã có).

Khóa chỉnh sửa nếu có ít nhất một `OJTRegistrationWindows`:

1. Cùng OJTSemesterID với tin;
2. Status = OPEN;
3. StartsAt <= giờ DB hiện tại < EndsAt.

Đây là cửa sổ đăng ký OJT theo danh sách/phạm vi sinh viên mà QHDN đang quản lý; không bổ sung loại đợt mới. Khóa áp dụng cho tin trong cùng kỳ, không phụ thuộc số sinh viên trong Scope. Đợt DRAFT/CLOSED, chưa tới ngày mở, đã hết hạn hoặc khác kỳ không khóa sửa.

API bị khóa trả **409 RECRUITMENT_EDIT_LOCKED_BY_OJT_REGISTRATION**, không thay đổi tin/vị trí/chỉ tiêu. Kiểm tra và ghi dữ liệu dùng cùng transaction/advisory lock với API mở/đóng đợt QHDN, nên không bị tranh chấp lúc mở đăng ký đồng thời với sửa tin.

Theo yêu cầu chỉ khóa **chỉnh sửa**, tạo tin mới vẫn được phép trong hạn doanh nghiệp đăng tin kể cả khi sinh viên đang đăng ký; tin mới hiển thị ngay nhưng không được sửa trong thời gian khóa.

## Chỉ tiêu

`remainingSlots = max(0, capacity - số phân công chưa hủy)`.

Cho phép tăng/giảm chỉ tiêu, nhưng không thấp hơn số sinh viên đã xác nhận của từng vị trí. Ví dụ nhận 3 sinh viên: giảm 5 xuống 3 hợp lệ, xuống 2 trả **409 CAPACITY_BELOW_ACCEPTED**. Backend đếm lại sau khi khóa vị trí và dùng cùng transaction với luồng nhận sinh viên hiện có. Khi một vị trí vi phạm, toàn bộ thay đổi của request được rollback.

## Dữ liệu trả cho frontend

GET posts giữ items/total/page/limit và summary (tổng theo bộ lọc, không chỉ trang hiện tại). Hỗ trợ postId, positionId, windowId, status, page, limit. Lọc positionId vẫn trả đầy đủ vị trí của tin.

Mỗi tin được bổ sung:

```json
{
  "status": "PUBLISHED",
  "requiresReview": false,
  "canEdit": false,
  "deadlineManagedBy": "QHDN",
  "postingDeadlineAt": "2026-11-24T16:44:00Z",
  "editLockCode": "RECRUITMENT_EDIT_LOCKED_BY_OJT_REGISTRATION",
  "studentRegistrationWindow": {
    "id": 1,
    "name": "Đợt đăng ký OJT",
    "startsAt": "2026-11-06T00:00:00Z",
    "endsAt": "2026-11-20T16:59:00Z"
  }
}
```

GET windows có accepting/canCreate, canEdit, postingDeadlineAt, deadlineManagedBy, editLockCode, studentRegistrationWindow. Trong thời gian sinh viên đăng ký có thể canCreate=true nhưng canEdit=false. Frontend nên dùng canEdit/editLockCode để hiển thị; lần thay đổi này không sửa frontend hoặc các nhãn “gửi duyệt” còn có trên đó.

## Tiếp tục vòng sau

Worker trong module doanh nghiệp chạy mỗi phút, chỉ cập nhật tin EnterpriseManaged. Không còn phụ thuộc ReviewedAt để tuyển tiếp các tin công bố trực tiếp. Tin còn chỗ có thể tiếp tục đợt OPEN kế tiếp trong cùng kỳ; giữ ID và lịch sử, ghi audit ENTERPRISE_AUTO_CONTINUE.

Worker không sửa tin trong lúc đợt đăng ký OJT của sinh viên đang hoạt động; không tự mở lại tin QHDN chủ động đóng, tin bị từ chối/lưu trữ hoặc tin import không thuộc EnterpriseManaged. Không sửa hàm DB, schema, worker hay service của role khác.

## Tiếp nhận sinh viên hàng loạt

- `POST /api/enterprise/candidates/acceptance-preview` nhận `candidateIds` (1–200 ID hồ sơ điều phối, không trùng), chỉ cho role `ENTERPRISE` và hồ sơ mới nhất đang chờ của doanh nghiệp đăng nhập.
- Kết quả gồm `confirmationToken` và số liệu theo từng kỳ: `capacity`, `currentCount`, `selectedCount`, `afterCount`, `excessCount`. Chỉ tiêu là tổng các vị trí chưa xóa/lưu trữ của doanh nghiệp trong kỳ. Số thực nhận đếm mỗi sinh viên một lần từ hồ sơ đã nhận, phân công còn hiệu lực hoặc lịch sử thực nhận, thống nhất với bảng QHDN.
- `POST /api/enterprise/candidates/accept-bulk` nhận `candidateIds`, `confirmationToken`, `allowOverCapacity` (boolean), `reason`. Khi `afterCount > capacity`, phải gửi `allowOverCapacity: true` sau khi doanh nghiệp xác nhận phần vượt. Còn 0 slot vẫn được nhận nếu đồng ý vượt chỉ tiêu. Giữ nguyên chỉ tiêu; cập nhật trạng thái nhận và số thực nhận/chênh lệch ở QHDN.
- Toàn bộ danh sách chạy trong một transaction; một hồ sơ lỗi thì không nhận hồ sơ nào. Vẫn kiểm tra quyền, hạn phản hồi, điều kiện bàn giao, nơi thực tập đã xác nhận và phân công hiện có. Số liệu thay đổi sau bước xem trước trả `409 BULK_ACCEPTANCE_CHANGED`, cần xem lại và xác nhận lại. Gửi lại lần xác nhận đã thành công trả `replayed: true`.
- DB đang có dữ liệu: chạy riêng khối `BEGIN OJT ENTERPRISE BULK ACCEPTANCE V7` đến `END OJT ENTERPRISE BULK ACCEPTANCE V7` trong `backend/DB`, gồm cả `BEGIN`/`COMMIT`. Khối này cập nhật hàm bảo vệ và marker, không reset dữ liệu. Không chạy toàn bộ `backend/DB` trên DB cần giữ dữ liệu. Nếu thiếu V7, API xác nhận trả `503 BULK_ACCEPTANCE_MIGRATION_REQUIRED`.

Dashboard lấy số liệu mới từ `GET /api/enterprise/profile` khi mở trang, khi quay lại cửa sổ hoặc bấm “Làm mới số liệu”. `summary.acceptedInterns` đếm mỗi sinh viên một lần trong doanh nghiệp trên tất cả học kỳ, hợp nhất hồ sơ đã `ACCEPTED`, phân công chưa hủy và lịch sử thực nhận, cùng nguồn dữ liệu với số thực nhận QHDN. Sinh viên vừa được duyệt được tính ngay cả khi chưa có phân công; tạo phân công không tăng số tiếp nhận lần nữa. Card “Sinh viên đã tiếp nhận” dùng số này. `completedInterns` là số sinh viên duy nhất đã có phiếu đánh giá doanh nghiệp ở trạng thái `SUBMITTED` với điểm tổng kết, không phụ thuộc việc phân công đã chuyển sang `COMPLETED` hay chưa. `activeInterns` giữ ý nghĩa số phân công `ACTIVE`/`IN_PROGRESS` để tương thích API hiện có.

Thay đổi thống kê chỉ sửa truy vấn backend và frontend, không cần đổi schema hoặc chạy lại DB.

Kiểm thử tích hợp dùng DB tạm, có chặn nhầm host/cổng/tên DB và reset DB thử trước khi chạy:

```powershell
npm run build
$env:ENTERPRISE_BULK_TEST_DATABASE_URL='postgresql://postgres@127.0.0.1:55441/enterprise_bulk_test'
node --test tests/enterprise-bulk-acceptance.integration.cjs tests/swagger-startup.test.cjs
```

## Kiểm thử

Trong backend:

```sh
npm run build
```

Kiểm thử API thật dùng duy nhất DB thử cục bộ, có chặn nhầm host/cổng/tên database. Script test **reset database thử này** bằng backend/DB, không thay đổi hệ thống triển khai:

```powershell
$env:ENTERPRISE_TEST_DATABASE_URL='postgresql://enterprise_test@127.0.0.1:55440/enterprise_recruitment_test'
node --test tests/enterprise-recruitment.integration.cjs
```

Kiểm tra trực tiếp API sinh viên thấy tin mới ngay, quyền doanh nghiệp, thời hạn chỉ đọc, sửa tin có hai hạn bằng nhau, khóa/mở lại theo đợt sinh viên, khác kỳ, tạo mới trong khi khóa sửa, chỉ tiêu và nhận sinh viên đồng thời, QHDN mở đăng ký đồng thời với sửa tin, giữ nguyên tin import của QHDN, tiếp tục vòng sau và không phục hồi tin bị QHDN đóng.


## Đồng bộ backend và DB

- `backend/DB` là script duy nhất chứa schema, hàm DB và dữ liệu mẫu. Đây là script khởi tạo FULL RESET, không phải migration cho DB đang vận hành.
- Giữ nguyên API duyệt tin, Swagger, import, các hàm dùng chung và server của các role khác. Tin tạo/sửa qua API doanh nghiệp công bố trực tiếp, không đi qua bước duyệt.
- Script chỉ công bố tin PENDING_REVIEW hợp lệ có `EnterpriseManaged=true`; giữ nguyên ID và lịch sử. Không đổi tin import/QHDN hoặc các bản nháp, tin bị từ chối, đã đóng hay lưu trữ.
- Trạng thái và trường duyệt cũ phục vụ đọc lịch sử và ghi nhận đóng tin. Luồng tạo/sửa mới không có bước duyệt.
- Module doanh nghiệp dùng hàm kiểm tra quyền hiện có bao gồm kiểm tra xóa mềm, không sửa hàm dùng chung. API sửa tái sử dụng doanh nghiệp đã xác thực; summary tổng hợp vị trí trực tiếp, giảm việc tạo rồi phân tích lại JSON.
- Worker tự quản lý một timer duy nhất và dọn timer/listener khi dừng. Không sửa vòng đời server hoặc worker của role khác.
- POST `/api/enterprise/recruitment/posts` nhận thêm `idempotencyKey` tùy chọn (1–100 ký tự). Gửi lại cùng key/payload trả tin hiện có với `replayed:true`, kể cả gửi đồng thời. Dùng key cũ với nội dung khác trả 409 `IDEMPOTENCY_CONFLICT`. Muốn tạo tin khác dùng key mới. Không gửi key vẫn tạo tin như trước.
