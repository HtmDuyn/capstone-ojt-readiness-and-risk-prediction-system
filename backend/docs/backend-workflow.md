# Luồng import, task và kết quả OJT

Cập nhật 20/10/2026. Swagger hiện tại có **159 API duy nhất**, tất cả adapter JSON có route đích. Danh mục đầy đủ: [swagger-api-by-role.md](swagger-api-by-role.md).

## Mã doanh nghiệp và import tài khoản

`EnterpriseCode` đã có trong `backend/DB`, khác `EnterpriseID`; có unique constraint và unique index trên `upper(EnterpriseCode)`. API dùng trường `code` cho mã nghiệp vụ. Không cần thêm cột mới cho yêu cầu này. Không chạy lại toàn bộ `DB` trên dữ liệu thật vì file schema có phần khởi tạo lại dữ liệu.

Dùng `POST /api/imports/preview` hoặc `POST /api/imports/commit`:

- `kind: ENTERPRISE`: chỉ `OJT_COORD`; bắt buộc `windowId` của đợt tuyển dụng đang mở và ít nhất một vị trí. Không nhận `semesterId` thay cho `windowId`.
- `kind: STUDENT`: chỉ `ADMIN` hoặc `ACADEMIC`; nhận tài khoản, hồ sơ học vụ, placement và toàn bộ `courseResults` trong cùng giao dịch.
- Nhận `application/json` hoặc `multipart/form-data` với `file` `.xlsx`/`.csv`, tối đa 8 MiB. Mỗi batch tối đa 500 doanh nghiệp/sinh viên; file tối đa 5000 dòng dữ liệu.
- `idempotencyKey` dùng lại với cùng payload và người import sẽ trả batch cũ. Dùng key mới cho lần bổ sung tin mới. Preview không lưu tài khoản, bài đăng hoặc email.
- Email được trim và chuyển chữ thường. Trùng email doanh nghiệp: giữ nguyên tài khoản, mật khẩu, mã doanh nghiệp và thông tin cũ; chỉ INSERT vị trí/bài tuyển dụng mới. Mã đầu vào khác nhưng cùng email không tạo doanh nghiệp thứ hai.
- Mã doanh nghiệp và email trỏ tới hai doanh nghiệp khác nhau: 409 `IDENTITY_CONFLICT`. Mã đã tồn tại nhưng email khác: 409, không tự đổi email tài khoản.
- Mỗi vị trí mới cần `positions[].code` mới trong cùng doanh nghiệp/kỳ. Trùng mã vị trí trả 409 `RECRUITMENT_CODE_EXISTS`, không ghi đè hoặc xóa bài cũ. Tin cũ có thể được worker đóng/lưu trữ theo vòng đời hiện có, vẫn giữ dữ liệu.
- Doanh nghiệp mới: tạo mật khẩu ngẫu nhiên 24 ký tự bằng `randomBytes`, chỉ lưu hash bcrypt; email outbox lưu payload mã hóa. Email chứa tài khoản/email đăng nhập, mật khẩu tạm và link đăng nhập. Mật khẩu tạm hết hạn sau 72 giờ, bắt buộc đổi trước khi gọi API nghiệp vụ.
- Tin import ở trạng thái `PENDING_REVIEW`, vị trí `CLOSED` tới khi QHDN duyệt công bố qua API tuyển dụng hiện có.

Ví dụ JSON doanh nghiệp:

```json
{
  "kind": "ENTERPRISE",
  "windowId": 1,
  "idempotencyKey": "enterprise-intake-001",
  "rows": [{
    "code": "DN001",
    "email": "hr@example.com",
    "fullName": "Người phụ trách tuyển dụng",
    "name": "Doanh nghiệp A",
    "positions": [{"code": "DEV001", "title": "Lập trình viên thực tập", "description": "Phát triển ứng dụng", "requirements": "TypeScript", "capacity": 5}]
  }]
}
```

## Cột Excel

Multipart có `kind`, `idempotencyKey`, `file`; doanh nghiệp thêm `windowId`. Trường `mapping` tùy chọn là JSON map tên trường chuẩn sang tiêu đề cột, ví dụ `{"code":"Mã SV","email":"Email"}`. Cột không map dùng tên chuẩn bên dưới. Không nhận định dạng `.xls` cũ.

**Doanh nghiệp:** `code`, `email`, `fullName`, `name`, `address` (tùy chọn), `positionCode`, `title`, `description`, `requirements`, `capacity`. Mỗi dòng là một vị trí; nhiều dòng cùng email được gom thành một doanh nghiệp. Thông tin định danh trên các dòng phải nhất quán.

**Sinh viên:**

| Nhóm | Cột |
|---|---|
| Định danh | `code`, `email`, `fullName` |
| Hồ sơ học vụ | `programId`, `cohortId`, `groupCode`, `currentAcademicPeriodId` |
| Tùy chọn | `entryAcademicPeriodId`, `phone`, `className`, `status` |
| Một lần học môn | `courseCode`, `academicPeriodId`, `courseStatus`, `attemptNumber`, `score`, `gradePoints`, `grade`, `sourceReference` |

Một dòng cho mỗi lần học môn, lặp lại các cột định danh/học vụ của sinh viên. `attemptNumber` mặc định 1. `courseStatus` thuộc `PASSED`, `FAILED`, `IN_PROGRESS`, `WITHDRAWN`, `RECOGNIZED`. Sinh viên chưa có lịch sử môn được nhập bằng dòng không có toàn bộ các trường kết quả môn. Không bỏ `courseCode` nếu còn dữ liệu điểm.

Các ID chương trình/khóa/kỳ và mã môn phải tồn tại trong DB. Các dòng cùng sinh viên phải có hồ sơ nhất quán. Một dòng sai khiến toàn bộ batch rollback; hệ thống có thể lưu lịch sử batch bị từ chối, không lưu tài khoản/hồ sơ/điểm dở dang.

## CV và giao task

Giữ nguyên `POST /api/students/me/cv`: sinh viên gửi multipart trường **`cv`**, PDF hợp lệ tối đa **10 MB**. Không nhập CV chung với file học vụ. Các phiên bản CV đã gắn đơn ứng tuyển được giữ nguyên.

`POST /api/enterprise/tasks/bulk` nhận:

```json
{
  "assignmentIds": [1, 2],
  "idempotencyKey": "task-batch-001",
  "tasks": [{"name": "Hoàn thành báo cáo", "description": "Nộp kết quả tuần", "dueDate": "2026-11-01"}]
}
```

Thay ID và ngày bằng dữ liệu thực tế. Chỉ doanh nghiệp sở hữu toàn bộ phân công được giao task; trạng thái phải `ASSIGNED`, `ACTIVE` hoặc `IN_PROGRESS`. Hạn task phải không ở quá khứ và nằm trong thời gian thực tập. Tối đa 500 phân công, 50 task, 5000 cặp task/phân công. Bất kỳ phân công không hợp lệ làm rollback toàn bộ batch; gửi lại cùng key không tạo trùng.

## Điểm chính thức và email kết thúc OJT

- Doanh nghiệp đánh giá qua `PUT /api/json/enterprise/internships/evaluation`, body có `internshipId`, `completionScore`, `attitudeScore`, `skillScore`, `overallScore`, `comments` (tùy chọn), `reason`. Route gốc là `PUT /api/enterprise/internships/{id}/evaluation`.
- `OverallScore` của đánh giá `SUBMITTED` là điểm chính thức. Không cần QHDN chuyển hồ sơ hoặc phòng đào tạo nhập/xác nhận lại.
- Phòng đào tạo xem `POST /api/json/ojt-results/list` với JSON bộ lọc, ví dụ `{"ojtSemesterId":1,"page":1,"limit":20}`. API gốc: `GET /api/ojt-results`.
- Xuất danh sách: `POST /api/json/ojt-semesters/results/export` với `ojtSemesterId`, `format` (`csv`, `json`, `pdf`).
- Sinh viên xem điểm của mình qua `POST /api/json/student/ojt-results/list` hoặc chi tiết tương ứng. `resultId` hiện là **EvaluationID**, không phải ID của bảng OJTResults cũ.
- Sau cả ngày kết thúc phân công và ngày kết thúc kỳ OJT, worker gửi một email và thông báo trong hệ thống cho sinh viên. Phòng đào tạo lấy danh sách trên API; không gửi email hàng loạt cho cán bộ.
- Sau khi kết thúc kỳ, đánh giá đã nộp bị khóa. Điểm chưa nộp không được tự sinh. Email lấy điểm của doanh nghiệp, không lấy điểm nhập tay cũ.
- Không tự suy ra ngưỡng đậu/rớt hoặc thay đổi GPA: response `outcome` hiện là null. Yêu cầu hiện tại là điểm chính thức, email sinh viên và danh sách phòng đào tạo; không thêm quy chế quy đổi điểm mới.
- Các bản ghi `OJTResults` và lịch sử cũ vẫn giữ trong DB; các màn hình hồ sơ/doanh nghiệp/QHDN và báo cáo lấy điểm chính thức từ đánh giá doanh nghiệp.

Để worker gửi email thật, cần `EMAIL_OUTBOX_KEY` (64 ký tự hex), `FRONTEND_LOGIN_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, tùy máy chủ có `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_SECURE`. `PROVISIONING_JOBS_ENABLED` không được là `false`; worker chạy mỗi 60 giây. Lỗi lưu trữ tuyển dụng không còn chặn worker email.

## API đã loại bỏ

**20 route thực tế:**

- Các route song song `/api/student/companies`, `/api/student/positions` và chi tiết: dùng `/api/students/me/opportunities`.
- Các route `/api/student/applications`, chi tiết và withdraw thuộc luồng CV cũ: dùng luồng `/api/job-applications` hiện tại.
- `POST/GET/DELETE /api/student/cv`, các route `/api/student/cv/analyses` và `/api/student/company-recommendations` thuộc kho CV song song; giữ upload CV chính thức `/api/students/me/cv`.
- `POST /api/ojt-results`, `POST /api/ojt-results/{id}/transfer`, `POST /api/ojt-results/{id}/revision-requests`, `PATCH /api/ojt-results/{id}`, `POST /api/ojt-results/{id}/confirm`.
- `PUT /api/assignments/{id}/internship-evaluation`: bỏ nhập điểm thay doanh nghiệp từ phía QHDN.

**12 operation OpenAPI không có route:** các alias `/api/company-imports`, `/api/recruitment-posts`, chi tiết đơn/CV `/api/job-applications/{id}`, `/api/job-applications/{id}/cv`, và ba đường dẫn báo cáo QHDN tách riêng. Giữ báo cáo thật `/api/qhdn/reports` theo `type`, tuyển dụng thật `/api/recruitment/posts`, lịch sử import theo API hiện hành.

Adapter JSON cho các API bị loại bỏ cũng được gỡ. Các route gốc còn dùng làm đích dispatch cho adapter JSON được giữ. Không xóa dữ liệu lịch sử, tài khoản hoặc tin tuyển dụng cũ trong DB.

## Kiểm thử

Chạy `npm test`, `npm run build`, `npm run docs:api`.

12 nhóm kiểm thử dùng PostgreSQL nhúng PGlite, fixture độc lập và SMTP cục bộ nhận thư thật qua giao thức SMTP. Bao gồm import mới/trùng email/collision, password random/hash/email/replay, nhập Excel doanh nghiệp và sinh viên, rollback, phân quyền QHDN, ma trận task và giới hạn/phạm vi, điểm chính thức/danh sách/email cuối kỳ/chống gửi lặp, Swagger khớp route, HTTP với JWT và multipart.

Không kết nối DB thật, không gửi mail cho địa chỉ thật, không kiểm chứng SMTP production hoặc migration đã được áp dụng ở môi trường triển khai. Fixture kiểm thử chỉ dựng các bảng cần cho luồng này, không thay thế kiểm thử toàn bộ schema production.
