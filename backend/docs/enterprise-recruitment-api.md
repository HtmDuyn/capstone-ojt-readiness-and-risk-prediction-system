# Tuyển dụng doanh nghiệp — công bố trực tiếp

Phạm vi code: `src/modules/enterprise`, kiểm thử và tài liệu backend liên quan. Không sửa frontend, DB/schema, route/service của QHDN, sinh viên hoặc các role khác.

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
