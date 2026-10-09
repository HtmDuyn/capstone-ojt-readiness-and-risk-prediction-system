# API quản trị

Các endpoint dưới đây dùng tiền tố `/api`, yêu cầu JWT và role `ADMIN`.
API tài khoản, đăng nhập, danh sách/chi tiết/cập nhật sinh viên, import và kết quả OJT hiện có được tái sử dụng.
Không có refresh token. Frontend dùng cùng JWT đến khi hết hạn, đăng xuất hoặc bị thu hồi rồi đăng nhập lại.

## Cài đặt

Trong thư mục `backend`:

```sh
npm install
npm run db:migrate:admin
npm run build
npm start
```

`backend/DB` là nguồn schema duy nhất; không có file database hoặc migration SQL riêng.
`db:migrate:admin` đọc phần `Admin management APIs` ngay trong `DB`, áp dụng các thay đổi cộng thêm và bỏ qua nếu đã cài.
Script dùng kết nối backend trong `.env`; cần tài khoản có quyền thay đổi schema.
File `DB` đã được cập nhật cho cài đặt mới, nhưng là script **reset dữ liệu**, không dùng để nâng cấp database đang sử dụng.
Phải chạy migration trước khi dùng backend mới vì API sinh viên hiện có cũng sử dụng cột `DeletedAt`.

## Hợp đồng chung

```http
Authorization: Bearer <jwt>
Content-Type: application/json
```

Thành công: `{ "success": true, "data": ... }`.
Danh sách: `data: { "total": 0, "page": 1, "limit": 20, "items": [] }`.
Xóa mềm trả `204`, không có body. Tạo mới trả `201`; đặt lại mật khẩu và tạo prediction job trả `202`.
Lỗi dùng `{ "success": false, "errorCode": "...", "message": "..." }`.
Phân trang mặc định `page=1`, `limit=20`, tối đa `100`; ID là số nguyên dương.
Export CSV giới hạn 10.000 bản ghi, giữ an toàn với dữ liệu bắt đầu bằng công thức bảng tính.

Các route REST vẫn hoạt động. Swagger của dự án tiếp tục hiển thị các adapter `/api/json/...` để nhập path/query trong JSON body.
Ví dụ tương đương:

```http
GET /api/companies?page=1&limit=20
POST /api/json/companies/search
{"page":1,"limit":20}

GET /api/admin/models/1
POST /api/json/admin/models/detail
{"modelId":1}
```

Schema chi tiết từng body/filter có trong Swagger `/api-docs` và `docs/api-input-reference.md`, tạo lại bằng `npm run docs:api` sau build.

## Endpoint mới

| Method | Endpoint | Chức năng |
|---|---|---|
| POST | `/auth/users/:userId/password-reset` | Đặt lại mật khẩu, trong module auth |
| GET | `/admin/dashboard/summary` | Tổng quan toàn hệ thống |
| GET | `/admin/dashboard/readiness` | Phân bố mức sẵn sàng |
| GET | `/admin/dashboard/risks` | Phân bố mức rủi ro |
| GET | `/admin/dashboard/trends` | Xu hướng theo tháng UTC |
| POST | `/students` | Tạo hồ sơ từ tài khoản STUDENT đã có |
| DELETE | `/students/:id` | Xóa mềm, vô hiệu hóa tài khoản |
| GET | `/students/export` | Xuất sinh viên CSV |
| GET, POST | `/companies` | Danh sách, tạo doanh nghiệp |
| GET, PATCH, DELETE | `/companies/:id` | Chi tiết, cập nhật, xóa mềm |
| GET, POST | `/positions` | Danh sách, tạo vị trí |
| PATCH, DELETE | `/positions/:id` | Cập nhật, xóa mềm vị trí |
| GET | `/ojt-semesters/:id` | Chi tiết đợt OJT |
| GET, POST | `/assignments` | Danh sách, tạo phân công |
| GET, PATCH | `/assignments/:id` | Chi tiết, điều chỉnh phân công |
| PATCH | `/assignments/:id/status` | Trạng thái phân công |
| GET, POST | `/assessment-templates` | Danh sách, tạo phiên bản bộ tiêu chí |
| GET, PATCH | `/assessment-templates/:id` | Chi tiết, sửa bản nháp |
| POST | `/assessment-templates/:id/publish` | Phát hành bộ tiêu chí |
| GET | `/assessments` | Danh sách đánh giá thực tập hiện có |
| GET | `/assessments/:id` | Chi tiết đánh giá |
| POST | `/admin/prediction-jobs` | Tạo tác vụ dự đoán |
| GET | `/admin/prediction-jobs/:id` | Tiến độ, lỗi từng sinh viên |
| GET | `/predictions` | Lịch sử dự đoán |
| GET | `/predictions/:id` | Kết quả, dữ liệu đầu vào và phiên bản mô hình |
| GET | `/students/:id/predictions` | Lịch sử theo sinh viên |
| GET | `/admin/models` | Phiên bản mô hình đã đăng ký |
| GET | `/admin/models/:id` | Metrics và schema đặc trưng |
| GET | `/alerts` | Cảnh báo từ dự đoán rủi ro cao |
| GET | `/alerts/:id` | Chi tiết cảnh báo |
| PATCH | `/alerts/:id/status` | Tiếp nhận, giải quyết, bỏ qua cảnh báo |
| POST | `/alerts/:id/interventions` | Tạo biện pháp hỗ trợ |
| GET | `/students/:id/interventions` | Lịch sử hỗ trợ |
| PATCH | `/interventions/:id` | Cập nhật hỗ trợ |
| GET | `/admin/reports/readiness` | Báo cáo mức sẵn sàng |
| GET | `/admin/reports/risks` | Báo cáo rủi ro |
| GET | `/admin/reports/export` | Xuất CSV/JSON |
| GET | `/admin/audit-logs` | Nhật ký quản trị, che thông tin bí mật |

## Request và quy tắc nghiệp vụ

### Đặt lại mật khẩu

`POST /auth/users/:userId/password-reset`, không cần body.
Chỉ áp dụng cho tài khoản ACTIVE. Sinh mật khẩu tạm ngẫu nhiên, hash bằng bcrypt, tăng `AuthVersion` để thu hồi JWT cũ,
hủy email cũ chưa gửi và xếp email mới vào `EmailOutbox` với payload mã hóa. Response không chứa mật khẩu.
Mật khẩu tạm hết hạn sau 24 giờ. Sau khi đăng nhập, người dùng chỉ được xem `/auth/me`, đăng xuất hoặc đổi mật khẩu.
Đổi mật khẩu thu hồi JWT tạm; cần đăng nhập lại.

Cần `EMAIL_OUTBOX_KEY`, `FRONTEND_LOGIN_URL`; để gửi email thực tế cần SMTP và `PROVISIONING_JOBS_ENABLED=true` theo cơ chế worker có sẵn.
Trạng thái `QUEUED` nghĩa là đã xếp hàng, chưa xác nhận email đã được gửi.

### Sinh viên

```json
{"userId":12,"studentCode":"SV001","programId":1,"enrollmentYear":2026,"currentSemester":1,"className":"SE01"}
```

`userId`, `studentCode` bắt buộc. Tạo tài khoản STUDENT qua `/accounts` trước rồi liên kết hồ sơ; không tạo tài khoản trùng.
Không xóa sinh viên có phân công đang diễn ra. Sinh viên đã xóa không xuất hiện trong API danh sách/chi tiết/cập nhật hiện tại.
Export dùng các filter hiện có: `search`, `status`, `programId`, `cohortId`, `groupCode`, `enrollmentYear`, `currentSemester`; không nhận page/limit.

### Doanh nghiệp và vị trí

```json
{"code":"DN001","name":"Doanh nghiệp A","contactEmail":"hr@example.com","status":"ACTIVE"}
```

```json
{"companyId":1,"ojtSemesterId":1,"recruitmentCode":"DEV001","title":"Thực tập lập trình","capacity":5,"status":"OPEN","workMode":"ONSITE"}
```

Doanh nghiệp: bắt buộc `code`, `name`; có thêm `address`, `industry`, `contactPersonName`, `contactPhone`, `contactEmail`, `status`.
Vị trí: bắt buộc `companyId`, `ojtSemesterId`, `recruitmentCode`, `title`, `capacity`; có thêm `description`, `requirements`, `location`, `workMode`, `status`.
Không thay doanh nghiệp hoặc đợt của vị trí đã tạo. `remainingSlots` do backend tính, không nhận từ client.
Không giảm capacity thấp hơn số phân công chưa bị hủy. Không xóa doanh nghiệp/vị trí có phân công đang diễn ra;
doanh nghiệp còn vị trí OPEN cần đóng vị trí trước khi xóa.
Filter doanh nghiệp: `search`, `status`; vị trí: `search`, `companyId`, `ojtSemesterId`, `status`.

### Phân công

```json
{"registrationId":1,"positionId":1,"academicSupervisorId":2,"enterpriseSupervisorName":"Người hướng dẫn","startDate":"2026-10-01","endDate":"2026-12-31"}
```

Đăng ký phải APPROVED, sinh viên ACTIVE và vị trí cùng đợt OJT. Người phụ trách học vụ phải là tài khoản ACADEMIC đang hoạt động.
Backend tạo bản ghi coordination và assignment trong một transaction, khóa vị trí khi kiểm tra số chỗ.
Mỗi sinh viên chỉ có một phân công chưa bị hủy trong một đợt. Phân công COMPLETED vẫn tính vào số chỗ của đợt đó.
PATCH thông tin cần `reason`; không thay `registrationId` hoặc sinh viên.
PATCH trạng thái dùng `{"status":"ACTIVE","reason":"Bắt đầu thực tập"}`.
Luồng: `ASSIGNED → ACTIVE → COMPLETED`; `ASSIGNED/ACTIVE → CANCELLED`.
Phân công đã có đánh giá/kết quả không được chỉnh hồ sơ hoặc hủy, nhưng vẫn có thể hoàn tất trạng thái.
Đóng tuyển dụng vị trí không chặn hoàn tất phân công hiện có.
Filter: `studentId`, `companyId`, `positionId`, `ojtSemesterId`, `status`.

### Bộ tiêu chí và đánh giá

```json
{"code":"OJT-EVAL","version":1,"name":"Đánh giá OJT","criteria":[{"code":"SKILL","name":"Kỹ năng","weight":60,"maxScore":10},{"code":"ATTITUDE","name":"Thái độ","weight":40,"maxScore":10}]}
```

Các trọng số phải dương, tổng bằng 100, mã tiêu chí không trùng.
PATCH bản nháp chỉ sửa `name`, `criteria`. Phát hành không cần body.
Bộ tiêu chí đã phát hành hoặc đã được sử dụng được khóa cả ở tầng database; tạo version mới để thay đổi.
`/assessments` đọc từ `InternshipEvaluations` hiện có, bổ sung `templateId`, `scoreDetails` nếu đã được ghi nhận.
Đây không phải bộ quy tắc eligibility, và API quản trị này không chấm điểm thay người đánh giá.
Filter bộ tiêu chí: `search`, `status`; đánh giá: `studentId`, `ojtSemesterId`, `templateId`, `status`.

### Cảnh báo và hỗ trợ

Một prediction có `riskLevel=HIGH` tạo một `RiskAlerts` tương ứng; cảnh báo học vụ hiện có vẫn độc lập.
PATCH cảnh báo: `{"status":"ACKNOWLEDGED","reason":"Đã tiếp nhận"}`.
Trạng thái mở `OPEN/ACKNOWLEDGED` có thể chuyển sang `RESOLVED` hoặc `DISMISSED`; trạng thái đóng không mở lại.
Phải hoàn tất/hủy hỗ trợ còn dang dở trước khi đóng cảnh báo. Dự đoán mới không tự đóng cảnh báo cũ.

```json
{"description":"Tư vấn và bổ sung kỹ năng","assignedTo":2,"dueDate":"2026-11-01"}
```

Người được giao hỗ trợ phải ACTIVE và có role ADMIN, ACADEMIC hoặc OJT_COORD.
PATCH hỗ trợ cần `reason`, có thể cập nhật `description`, `assignedTo`, `dueDate`, `status`, `outcome`.
Các trạng thái: `PLANNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`; COMPLETED bắt buộc có `outcome`.
Hỗ trợ COMPLETED/CANCELLED không được sửa.
Filter cảnh báo: `studentId`, `ojtSemesterId`, `status`; lịch sử hỗ trợ: `status`.

## Tích hợp mô hình dự đoán

Repository chưa có mô hình được huấn luyện. API không sinh score giả hay dùng eligibility làm xác suất rủi ro.
Để chạy inference thực tế:

1. Triển khai dịch vụ mô hình theo hợp đồng bên dưới.
2. Đăng ký phiên bản thực trong bảng `PredictionModels` bằng công cụ quản trị database:

```sql
INSERT INTO "PredictionModels" ("Code","Version","Name","Status","Metrics","FeatureSchema")
VALUES ('your-model-code','your-trained-version','Tên mô hình','ACTIVE','{}','{}');
```

Điền metrics/schema đã được kiểm chứng của mô hình thực tế. Không có model giả được seed.
Phiên bản đã được dùng trong job không được sửa code/version/metrics/schema; tạo bản ghi version mới.
Có thể chuyển `Status` sang INACTIVE để chặn tạo job mới; job đã nhận vẫn xử lý theo phiên bản đã chọn.

3. Cấu hình `.env`:

```dotenv
PREDICTION_SERVICE_URL=http://localhost:8000/predict
PREDICTION_SERVICE_API_KEY=
PREDICTION_WORKER_ENABLED=true
```

4. Khởi động backend và tạo job:

```json
{"modelId":1,"ojtSemesterId":1,"studentIds":[1,2],"idempotencyKey":"prediction-batch-001"}
```

Bỏ `studentIds` để chạy cho tất cả sinh viên ACTIVE có đăng ký APPROVED trong đợt, tối đa 10.000 sinh viên.
Danh sách chỉ định tối đa 1.000 ID, không trùng. Cùng idempotency key và payload/actor trả lại job cũ; khác payload/actor trả 409.
Thiếu dịch vụ/model hợp lệ trả lỗi 503/422; không tạo kết quả giả.
Worker xử lý tuần tự từng item, lưu kết quả/lỗi trong database. Khi process dừng giữa chừng, item chưa commit được xử lý lại.
Dịch vụ model nên chỉ thực hiện inference, không gây side effect: request có thể được gửi lại sau khi worker bị dừng.

### Request backend gửi dịch vụ mô hình

```json
{
  "modelCode":"your-model-code",
  "modelVersion":"your-trained-version",
  "input":{
    "schemaVersion":1,
    "student":{"studentId":1,"programId":1,"enrollmentYear":2026,"currentSemester":1},
    "ojtSemesterId":1,
    "courseResults":[],
    "evaluations":[],
    "computedAt":"2026-10-08T00:00:00.000Z"
  }
}
```

Course results gồm `courseId`, `score`, `gradePoints`, `status`, `attemptNumber`, `academicPeriodId`.
Evaluations gồm `overallScore`, `completionScore`, `attitudeScore`, `skillScore`, `evaluatedAt`.
Input được đọc khi worker chạy; là dữ liệu đã ghi nhận tại thời điểm đó, không phải snapshot khi xếp hàng.
Model adapter chịu trách nhiệm xử lý thiếu dữ liệu và chuyển input thành đặc trưng đúng với mô hình đã huấn luyện.
Không gửi tên/email sinh viên cho dịch vụ model.

### Response bắt buộc từ dịch vụ mô hình

```json
{
  "modelCode":"your-model-code",
  "modelVersion":"your-trained-version",
  "readinessScore":75,
  "readinessLevel":"HIGH",
  "riskScore":25,
  "riskLevel":"LOW",
  "factors":[{"feature":"example-feature","impact":-0.2,"description":"Giải thích từ mô hình"}]
}
```

Ví dụ chỉ mô tả cấu trúc response, không phải kết quả mô hình đã triển khai.
Scores 0–100, tối đa hai chữ số thập phân; levels LOW/MEDIUM/HIGH.
Code/version phải đúng phiên bản được yêu cầu. Factor phải có feature, impact hữu hạn và description.
Request timeout 15 giây; response tối đa 1 MB; không theo redirect.
Sai response hoặc provider lỗi được lưu theo item; job kết thúc `COMPLETED_WITH_ERRORS` nếu có lỗi.
Job trả `total`, `completed`, `failed`, `pending`, `progressPercent` và danh sách item phân trang.
Chi tiết prediction lưu nguyên input, metadata/version mô hình, factors và thời điểm chạy để kiểm tra lại.

## Dashboard, báo cáo và nhật ký

Summary là tổng quan toàn hệ thống, không nhận filter.
Readiness/risks và báo cáo chọn **prediction mới nhất trên mỗi cặp sinh viên–đợt OJT trước khi lọc**.
Không lấy lại kết quả rủi ro cao cũ khi prediction mới nhất đã chuyển mức thấp.
Trends thống kê tất cả sự kiện dự đoán theo tháng UTC, không phải số sinh viên duy nhất.

Filter dự đoán/dashboard/báo cáo: `ojtSemesterId`, `studentId`, `modelId`, `riskLevel`, `readinessLevel`, `from`, `to`.
`from/to` là timestamp UTC ISO; phân trang chỉ áp dụng cho danh sách/báo cáo, không áp dụng dashboard.
Export cần `type=readiness|risks`, tùy chọn `format=csv|json`; không nhận page/limit.
Khi chưa có prediction, dashboard/báo cáo trả tổng bằng 0 và danh sách rỗng.

Nhật ký hỗ trợ `userId`, `entityType`, `entityId`, `action`, phân trang.
Các thao tác tạo/sửa/xóa mềm, phát hành tiêu chí, tạo job, xử lý cảnh báo/hỗ trợ và reset mật khẩu đều được ghi nhật ký.
Thông tin có khóa chứa password/token/secret/encrypted/authorization được che trước khi trả API.
