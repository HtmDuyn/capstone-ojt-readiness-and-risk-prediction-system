> Cập nhật hợp đồng API: xem [API sau khi xóa/gộp](api-consolidation.md) và [danh sách hiện hành](api-input-reference.md). Các endpoint cũ được thay thế theo bảng chuyển đổi.

# Tuyển dụng doanh nghiệp theo học kỳ

## Luồng đã triển khai

1. ADMIN/ACADEMIC tạo học kỳ `SEMESTER` qua `/api/academic-periods`. Hệ thống tự tạo liên kết kỹ thuật trong `OJTSemesters`, trả thêm `ojtSemesterId`. Block 3 không tạo kỳ tuyển dụng riêng.
2. QHDN đọc học kỳ có sẵn bằng `POST /api/json/academic-periods/search`, với `kind: SEMESTER`; tạo đợt bằng **academicPeriodId**, tên và thời hạn. Không nhập mã kỳ OJT, năm học hay ngày học lần nữa.
3. QHDN mở đợt. Doanh nghiệp đã có tài khoản xem đợt mở, gửi nhu cầu gồm tin và 1–50 vị trí. Doanh nghiệp lấy từ JWT, không nhận companyId.
4. QHDN có thể import doanh nghiệp/vị trí qua `/api/imports/preview` và `/api/imports/commit`, `kind: ENTERPRISE`, **windowId**. Tin trực tiếp và tin nhập đều ở PENDING_REVIEW, vị trí CLOSED. QHDN duyệt PUBLISH để công bố/mở vị trí hoặc REJECT kèm lý do.
5. Đóng đợt chỉ ngừng nhận nhu cầu mới; tin đã công bố tiếp tục tới hạn riêng của tin hoặc tới khi QHDN đóng. Worker tự đóng đợt/tin hết hạn mỗi phút, chạy độc lập cấu hình SMTP. Vị trí chưa công bố hoặc tin đã đóng/hết hạn không nhận điều phối/phân công mới.

Không thay đổi quyền/phần xử lý `OJTRegistrationWindows` dành cho sinh viên đăng ký OJT.

## API trên Swagger

Nhóm `QHDN recruitment`. Các API chung có thêm tag `Enterprise`. Cần JWT, danh sách trả `{success:true,data:{items,total,page,limit}}`; chi tiết/ghi trả `{success:true,data:...}`.

| Method | URL | Quyền / chức năng |
|---|---|---|
| POST | `/api/json/recruitment/windows/search` | ADMIN/OJT_COORD: tất cả đợt; ENTERPRISE: chỉ đợt OPEN chưa hết hạn |
| POST | `/api/recruitment/windows` | ADMIN/OJT_COORD tạo đợt từ học kỳ có sẵn |
| PATCH | `/api/json/recruitment/windows` | ADMIN/OJT_COORD sửa đợt |
| POST | `/api/json/recruitment/windows/open` | ADMIN/OJT_COORD mở đợt |
| POST | `/api/json/recruitment/windows/close` | ADMIN/OJT_COORD đóng đợt |
| POST | `/api/recruitment/posts` | ENTERPRISE gửi tin và các vị trí |
| POST | `/api/json/recruitment/posts/search` | QHDN xem mọi tin; ENTERPRISE chỉ xem tin của mình |
| POST | `/api/json/recruitment/posts/detail` | Chi tiết tin kèm vị trí/chỉ tiêu, kiểm tra quyền sở hữu |
| POST | `/api/json/recruitment/posts/review` | ADMIN/OJT_COORD công bố hoặc từ chối |
| POST | `/api/json/recruitment/posts/close` | ADMIN/OJT_COORD đóng tin, đóng vị trí không còn tin khác đang công bố |

### Tạo và mở đợt

```json
{"academicPeriodId":1,"name":"Nhận nhu cầu tuyển dụng Fall","startsAt":"2026-10-01T00:00:00+07:00","endsAt":"2026-10-31T23:59:59+07:00","reason":"Mở đăng ký doanh nghiệp theo học kỳ"}
```

Học kỳ phải là SEMESTER, trạng thái PLANNED/ACTIVE. Đợt có thể bắt đầu trước ngày học để chuẩn bị tuyển dụng; endsAt không vượt quá cuối học kỳ. Chỉ một đợt OPEN mỗi học kỳ. Sau khi mở, chỉ sửa tên/hạn cuối và bắt buộc reason. Body mở/đóng: `{ "windowId": 1, "reason": "..." }`.

### Doanh nghiệp gửi nhu cầu

```json
{"windowId":1,"idempotencyKey":"enterprise-recruitment-001","title":"Tuyển thực tập Backend","content":"Nhu cầu thực tập theo học kỳ","positions":[{"code":"BACKEND-001","title":"Backend Intern","description":"Phát triển API","requirements":"TypeScript, SQL","capacity":5}]}
```

Tùy chọn `benefits`, `applicationInstructions`, `deadlineAt`. Nếu không nhập deadlineAt, mặc định hạn của đợt. Hạn tin phải trong tương lai và không vượt cuối học kỳ. Mã vị trí không trùng trong cùng doanh nghiệp/học kỳ. Gửi lại cùng idempotencyKey và payload/actor trả lại tin đã tạo; khác payload/actor trả 409.

### Duyệt/công bố

```json
{"postId":1,"decision":"PUBLISH","reason":"Nhu cầu phù hợp","deadlineAt":"2026-11-30T23:59:59+07:00"}
```

`decision: REJECT` yêu cầu reason, không nhận deadlineAt. Chỉ duyệt tin PENDING_REVIEW. Body đóng: `{ "postId": 1, "reason": "Đủ chỉ tiêu" }`. Danh sách nhận bộ lọc `academicPeriodId`, `windowId`, `status`, `page`, `limit`.

### Import nhiều lần trong cùng đợt/học kỳ

```json
{"kind":"ENTERPRISE","windowId":1,"idempotencyKey":"import-recruitment-001","rows":[{"code":"DN001","email":"hr@example.invalid","fullName":"Người liên hệ","name":"Doanh nghiệp mẫu","positions":[{"code":"DEV001","title":"Developer Intern","description":"Phát triển ứng dụng","requirements":"TypeScript","capacity":5}]}]}
```

Bỏ đầu vào semesterId; dùng windowId của đợt đang nhận đơn. Cho phép nhiều batch nếu mã vị trí khác nhau; mỗi batch có idempotencyKey riêng. Không yêu cầu tạo kỳ tiếp theo. Preview không tạo tài khoản/tin; commit nguyên tử và giữ cơ chế email mật khẩu tạm hiện có. Tài khoản mới vẫn cần cấu hình SMTP/outbox như trước.

## Database

Toàn bộ cấu trúc nằm trong `backend/DB`, gồm `RecruitmentWindows`, liên kết học kỳ, các cột tuyển dụng và khóa chống trùng. Không có file migration SQL hoặc lệnh nâng cấp riêng.

Chạy toàn bộ file `DB` một lần để clear và dựng lại dữ liệu ứng dụng trong một transaction. Xem [database-reset.md](database-reset.md).

Phòng đào tạo tạo học kỳ sẽ tự sinh liên kết OJT kỹ thuật; QHDN chọn học kỳ để mở đợt. Tin tuyển dụng và batch import thuộc đúng học kỳ của đợt qua khóa ngoại.
