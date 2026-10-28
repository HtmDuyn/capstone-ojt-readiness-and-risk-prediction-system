# Đầu vào API dành cho FE và test thủ công

Nguồn: OpenAPI hiện tại của backend. Tạo lại bằng `npm run docs:api` sau `npm run build`.
Phạm vi: 133 operations; 41 path parameters; 245 query parameters; 72 request bodies.


Tất cả nhóm dùng REST: GET đọc dữ liệu, ID trong path, bộ lọc/phân trang trong query; GET không có body. POST tạo/gửi hồ sơ hoặc xem trước nghiệp vụ, PUT/PATCH cập nhật. Body nghiệp vụ dùng application/json; upload CV dùng multipart/form-data. Sinh viên dùng các tài nguyên /students/:id, /students/me/* và các route dùng chung; các adapter /api/student/*/search, /detail, /create, /update đã gỡ. Token, quyền sở hữu và trạng thái nghiệp vụ vẫn bắt buộc.

Bạn tự insert dữ liệu mẫu: dùng đúng bảng/ID, FK, trạng thái, snapshot và fingerprint nguồn theo schema. Ví dụ confirm eligibility hoặc điểm OJT sẽ trả 409 nếu dữ liệu mẫu thiếu liên kết, snapshot hoặc không còn khớp nguồn. Không chỉ đổi một cột Status để giả lập hoàn tất nghiệp vụ.

- Swagger: `/api-docs`. Nhấn Try it out: GET nhập ID trong path và bộ lọc trong query; POST/PUT/PATCH sửa JSON request body khi cần. Upload dùng ô chọn file. GET không có body. Schema mô tả các trường và ràng buộc.
- OpenAPI JSON cho FE: `/api-docs/openapi.json`.
- `studentId` = StudentID; `programId` = ProgramID; `majorId` = SpecializationID; `courseId` = CourseID. Các loại ID không thay thế cho nhau.
- Mọi ID trong ví dụ là minh họa; thay bằng ID thực tế trong dữ liệu mẫu. Không tự gọi các API tạo dữ liệu từ ví dụ.
- Import commit nhận đủ JSON và tự kiểm tra, không bắt buộc chạy preview trước.
- Các thao tác mở/đóng/chốt/duyệt/xác nhận kiểm tra trạng thái đang lưu trong DB; không yêu cầu lịch sử gọi API của trình duyệt.
- Các ví dụ không tạo bản ghi mẫu, không thay đổi quy chế và không làm frontend tự gọi thêm API.

## GET /api/academic-alerts

Danh sách cảnh báo thiếu điều kiện OJT

undefined Khi không lọc, trả dữ liệu theo tất cả kỳ OJT. Kỳ học và deadline lấy từ cấu hình đã lưu; thiếu deadline trả NOT_CONFIGURED, không tự suy ra từ hạn đăng ký. Không nhận request body. Chỉ ID trên URL là bắt buộc (nếu có); bộ lọc query và phân trang đều tùy chọn. Danh sách mặc định page=1, limit=20.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Không có request body.

## GET /api/academic-imports

Lịch sử nhập dữ liệu học vụ

Không nhận request body. Chỉ ID trên URL là bắt buộc (nếu có); bộ lọc query và phân trang đều tùy chọn. Danh sách mặc định page=1, limit=20.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | page | integer | Không | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| query | limit | integer | Không | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| query | kind | string ∈ "STUDENT", "COURSE_RESULT", "CURRICULUM" | Không |  |  |
| query | status | string ∈ "COMPLETED", "REJECTED", "FAILED" | Không |  |  |

Không có request body.

## GET /api/academic-notifications

Lịch sử thông báo học vụ

Mỗi bản ghi giữ ID và bổ sung thông tin liên quan để hiển thị; quan hệ không tồn tại trả null. Không nhận request body. Chỉ ID trên URL là bắt buộc (nếu có); bộ lọc query và phân trang đều tùy chọn. Danh sách mặc định page=1, limit=20.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Không có request body.

## POST /api/academic-notifications

Tạo thông báo học vụ theo loại

Dữ liệu đầu vào dùng JSON body với Content-Type: application/json; không truyền trường dữ liệu qua query hoặc form-data.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| type | string ∈ "ALERT", "SUMMARY", "ELIGIBILITY" | Có |  |  |

## GET /api/academic-notifications/{id}

Chi tiết thông báo và trạng thái từng sinh viên

Mỗi bản ghi giữ ID và bổ sung thông tin liên quan để hiển thị; quan hệ không tồn tại trả null.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | string | Có |  |  |

Không có request body.

## GET /api/academic-periods

Danh sách kỳ học và Block 3

Không cần nhập tham số hoặc request body. Chỉ cần Bearer token và bấm Execute; trả toàn bộ kỳ học và Block 3 ở mọi trạng thái, kèm năm học, kỳ cha và thông tin OJT liên quan.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Không có request body.

## POST /api/academic-periods

Tạo kỳ học và Block 3

Học kỳ thường tự liên kết OJT và trả ojtSemesterId; QHDN không tạo kỳ riêng. Dữ liệu đầu vào dùng JSON body với Content-Type: application/json; không truyền trường dữ liệu qua query hoặc form-data.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| academicYearId | integer | Có | minimum=1; maximum=2147483647 | ID năm học. |
| periodCode | string | Có | maxLength=30 |  |
| name | string | Có | maxLength=100 |  |
| kind | string ∈ "SEMESTER", "BLOCK3" | Có |  |  |
| parentPeriodId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647; nullable=true | ID kỳ học cha của Block 3. |
| startDate | string | Có | format="date" |  |
| endDate | string | Có | format="date" |  |
| status | string ∈ "PLANNED", "ACTIVE", "CLOSED", "ARCHIVED" | Không / theo điều kiện nghiệp vụ |  |  |
| ojt | object | Không / theo điều kiện nghiệp vụ |  | Chỉ SEMESTER; thông tin vận hành OJT gắn với học kỳ, không tạo kỳ OJT riêng. |
| ojt.startDate | string | Không / theo điều kiện nghiệp vụ | format="date" |  |
| ojt.endDate | string | Không / theo điều kiện nghiệp vụ | format="date" |  |
| ojt.regStartDate | string | Không / theo điều kiện nghiệp vụ | format="date"; nullable=true |  |
| ojt.regEndDate | string | Không / theo điều kiện nghiệp vụ | format="date"; nullable=true |  |
| ojt.status | string ∈ "PLANNED", "ACTIVE", "CLOSED", "ARCHIVED" | Không / theo điều kiện nghiệp vụ |  |  |

Ví dụ:

```json
{
  "academicYearId": 1,
  "periodCode": "FALL2026",
  "name": "Ky chuyen nganh Fall 2026",
  "kind": "SEMESTER",
  "startDate": "2026-09-01",
  "endDate": "2026-12-10",
  "status": "PLANNED"
}
```

## GET /api/academic-years

Danh sách năm học

Không cần nhập tham số hoặc request body. Chỉ cần Bearer token và bấm Execute; trả toàn bộ năm học kèm các kỳ học liên quan.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Không có request body.

## POST /api/academic-years

Tạo năm học

Dữ liệu đầu vào dùng JSON body với Content-Type: application/json; không truyền trường dữ liệu qua query hoặc form-data.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| yearCode | string | Có | pattern="^\\d{4}-\\d{4}$" |  |

Ví dụ:

```json
{
  "yearCode": "2026-2027"
}
```

## PATCH /api/academic-years/{id}

Cập nhật năm học

Dữ liệu đầu vào dùng JSON body với Content-Type: application/json; không truyền trường dữ liệu qua query hoặc form-data.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1; maximum=2147483647 | ID: AcademicYearID. |

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| yearCode | string | Không / theo điều kiện nghiệp vụ | maxLength=20 |  |
| startDate | string | Không / theo điều kiện nghiệp vụ | format="date" |  |
| endDate | string | Không / theo điều kiện nghiệp vụ | format="date" |  |
| status | string ∈ "PLANNED", "ACTIVE", "CLOSED", "ARCHIVED" | Không / theo điều kiện nghiệp vụ |  |  |

## GET /api/academic-years/{id}/calendar

Read a year calendar and its current revision

Không nhận request body. Chỉ ID trên URL là bắt buộc (nếu có); bộ lọc query và phân trang đều tùy chọn. Danh sách mặc định page=1, limit=20.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 | ID: AcademicYearID. |

Không có request body.

## PUT /api/academic-years/{id}/calendar

Save Spring, Summer and Fall dates together

ACADEMIC/ADMIN. Send all three semesters in SPRING, SUMMER, FALL order with the revision from GET. Dates must fall inside the first year, be ordered and not overlap. IDs and linked history are preserved. Other dependent calendar constraints still apply. Dữ liệu đầu vào dùng JSON body với Content-Type: application/json; không truyền trường dữ liệu qua query hoặc form-data.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 | ID: AcademicYearID. |

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| revision | string | Có |  |  |
| semesters | array<object> | Có | minItems=3; maxItems=3 |  |
| semesters[].term | string ∈ "SPRING", "SUMMER", "FALL" | Có |  |  |
| semesters[].startDate | string | Có | format="date" |  |
| semesters[].endDate | string | Có | format="date" |  |

## GET /api/accounts

Danh sách tài khoản

Không cần nhập tham số hoặc request body. Trả toàn bộ tài khoản ở mọi trạng thái; chỉ cần xác thực ADMIN và bấm Execute.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Không có request body.

## POST /api/accounts

Tạo tài khoản

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| username | string | Có |  |  |
| email | string | Có | format="email" |  |
| password | string | Có |  |  |
| fullName | string | Có |  |  |
| phone | string | Không / theo điều kiện nghiệp vụ | nullable=true |  |
| roleId | integer | Có |  | ID vai trò. |

## PATCH /api/accounts/me/profile

Cập nhật hồ sơ cá nhân

Dữ liệu đầu vào dùng JSON body với Content-Type: application/json; không truyền trường dữ liệu qua query hoặc form-data.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| fullName | string | Không / theo điều kiện nghiệp vụ | minLength=1; maxLength=150 |  |
| phone | string | Không / theo điều kiện nghiệp vụ | maxLength=20; nullable=true |  |

## PATCH /api/accounts/update

Update account

Admin sửa thông tin, trạng thái và vai trò trong một lần; chỉ gửi trường cần thay đổi.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| userId | integer | Có | minimum=1 | ID tài khoản. |
| fullName | string | Không / theo điều kiện nghiệp vụ |  |  |
| phone | string | Không / theo điều kiện nghiệp vụ | nullable=true |  |
| email | string | Không / theo điều kiện nghiệp vụ | format="email" | ADMIN only |
| status | string ∈ "ACTIVE", "LOCKED", "INACTIVE" | Không / theo điều kiện nghiệp vụ |  |  |
| roleId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID vai trò. |

## POST /api/admin/audit-logs/list

Danh sách nhật ký hoạt động chi tiết

Nhập bộ lọc JSON. Trả toàn bộ detail và bản ghi rawLog nguyên gốc, không che dữ liệu trong bản demo.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| logId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID tài khoản. |
| userId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID tài khoản. |
| entityType | string | Không / theo điều kiện nghiệp vụ | maxLength=100 |  |
| entityId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID tài khoản. |
| action | string | Không / theo điều kiện nghiệp vụ | maxLength=100 |  |

## POST /api/admin/dashboard

Tổng quan hệ thống

Thống kê tài khoản, sinh viên, doanh nghiệp và kỳ OJT. Gửi {} hoặc section=summary/all.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| section | string ∈ "all", "summary" | Không / theo điều kiện nghiệp vụ | default="summary" |  |

## GET /api/assessment-windows

Danh sách đợt xét điều kiện

Không nhận request body. Chỉ ID trên URL là bắt buộc (nếu có); bộ lọc query và phân trang đều tùy chọn. Danh sách mặc định page=1, limit=20.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Không có request body.

## POST /api/assessment-windows

Tạo đợt xét điều kiện

Thiết lập khi còn nháp. Thời điểm mở sau khi Block 3 kết thúc. Dữ liệu đầu vào dùng JSON body với Content-Type: application/json; không truyền trường dữ liệu qua query hoặc form-data.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

Schema: object

## PATCH /api/assessment-windows

Cập nhật đợt xét hoặc trạng thái mở/đóng

Thiết lập khi còn nháp. Thời điểm mở sau khi Block 3 kết thúc. Dữ liệu đầu vào dùng JSON body với Content-Type: application/json; không truyền trường dữ liệu qua query hoặc form-data.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| id | integer | Có | minimum=1 |  |
| status | string ∈ "OPEN", "CLOSED" | Không / theo điều kiện nghiệp vụ |  |  |

## GET /api/assignments

Danh sách và hồ sơ phân công thực tập

Kèm sinh viên, doanh nghiệp, vị trí, đánh giá và kết quả OJT; assignment được tạo tự động khi doanh nghiệp chấp nhận.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | page | integer | Không | minimum=1 | Trang, bắt đầu từ 1. |
| query | limit | integer | Không | minimum=1; maximum=100 | Số bản ghi mỗi trang. |
| query | search | string | Không | maxLength=100 |  |
| query | status | string ∈ "ASSIGNED", "ACTIVE", "IN_PROGRESS", "COMPLETED", "CANCELLED", "CANCELED", "FAILED" | Không |  |  |
| query | companyId | integer | Không | minimum=1 | ID doanh nghiệp. |
| query | ojtSemesterId | integer | Không | minimum=1 | ID kỳ OJT. |
| query | studentId | integer | Không | minimum=1 | ID hồ sơ sinh viên, khác ID tài khoản. |
| query | positionId | integer | Không | minimum=1 | ID vị trí thực tập. |
| query | assignmentId | integer | Không | minimum=1 | ID phân công thực tập. |
| query | historyPage | integer | Không | minimum=1; default=1 | Trang lịch sử khi lọc theo ID. |
| query | historyLimit | integer | Không | minimum=1; maximum=100; default=20 | Số sự kiện lịch sử mỗi trang, tối đa 100. |

Không có request body.

## POST /api/assignments

Phân công dữ liệu cũ

Chỉ ADMIN dùng để đối soát; luồng thường tự tạo assignment khi doanh nghiệp chấp nhận.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| registrationId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID vị trí thực tập. |
| positionId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID vị trí thực tập. |
| academicSupervisorId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647; nullable=true |  |
| enterpriseSupervisorName | string | Không / theo điều kiện nghiệp vụ | maxLength=100; nullable=true |  |
| startDate | string | Không / theo điều kiện nghiệp vụ | format="date" |  |
| endDate | string | Không / theo điều kiện nghiệp vụ | format="date" |  |
| coordinationId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 |  |
| reason | string | Không / theo điều kiện nghiệp vụ | maxLength=2000 | Lý do thực hiện. |
| registrationId | integer | Có | minimum=1; maximum=2147483647 | ID vị trí thực tập. |
| positionId | integer | Có | minimum=1; maximum=2147483647 | ID vị trí thực tập. |
| academicSupervisorId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647; nullable=true |  |
| enterpriseSupervisorName | string | Không / theo điều kiện nghiệp vụ | maxLength=100 |  |
| startDate | string | Có | format="date" |  |
| endDate | string | Có | format="date" |  |
| coordinationId | integer | Có | minimum=1 |  |
| enterpriseSupervisorName | string | Không / theo điều kiện nghiệp vụ | maxLength=100; nullable=true |  |
| startDate | string | Có | format="date" |  |
| endDate | string | Có | format="date" |  |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |

## PATCH /api/assignments/{id}

Cập nhật assignment dữ liệu cũ

Chỉ ADMIN dùng để đối soát assignment đã tồn tại.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1; maximum=2147483647 | ID: bản ghi. |

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| positionId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID vị trí thực tập. |
| academicSupervisorId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647; nullable=true |  |
| enterpriseSupervisorName | string | Không / theo điều kiện nghiệp vụ | maxLength=100; nullable=true |  |
| startDate | string | Không / theo điều kiện nghiệp vụ | format="date" |  |
| endDate | string | Không / theo điều kiện nghiệp vụ | format="date" |  |
| status | string ∈ "ACTIVE", "COMPLETED", "CANCELLED" | Không / theo điều kiện nghiệp vụ |  |  |
| reason | string | Không / theo điều kiện nghiệp vụ | maxLength=2000 | Lý do thực hiện. |
| positionId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID vị trí thực tập. |
| academicSupervisorId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647; nullable=true |  |
| enterpriseSupervisorName | string | Không / theo điều kiện nghiệp vụ | maxLength=100 |  |
| startDate | string | Không / theo điều kiện nghiệp vụ | format="date" |  |
| endDate | string | Không / theo điều kiện nghiệp vụ | format="date" |  |
| status | string ∈ "ACTIVE", "COMPLETED", "CANCELLED" | Không / theo điều kiện nghiệp vụ |  |  |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |
| enterpriseSupervisorName | string | Không / theo điều kiện nghiệp vụ | maxLength=100; nullable=true |  |
| startDate | string | Không / theo điều kiện nghiệp vụ | format="date" |  |
| endDate | string | Không / theo điều kiện nghiệp vụ | format="date" |  |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |
| status | string ∈ "ACTIVE", "COMPLETED", "CANCELLED" | Không / theo điều kiện nghiệp vụ |  |  |

## POST /api/auth/change-password

Đổi mật khẩu

Token cũ bị thu hồi; cần đăng nhập lại.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| currentPassword | string | Có | format="password" |  |
| newPassword | string | Có | format="password"; minLength=12 | Maximum 72 UTF-8 bytes |

## POST /api/auth/login

Đăng nhập bằng email và mật khẩu

Xác thực: Không yêu cầu Bearer token trong OpenAPI.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| email | string | Có | format="email" |  |
| password | string | Có | format="password" |  |

admin01:

```json
{
  "email": "admin@ojtrpa.edu.vn",
  "password": "Admin@123"
}
```

academic01:

```json
{
  "email": "academic@ojtrpa.edu.vn",
  "password": "Academic@123"
}
```

ojt.coord01:

```json
{
  "email": "ojt.coord@ojtrpa.edu.vn",
  "password": "Ojt@123"
}
```

student01:

```json
{
  "email": "student01@student.edu.vn",
  "password": "Student@123"
}
```

enterprise01:

```json
{
  "email": "hr@techviet.example",
  "password": "Enterprise@123"
}
```

## POST /api/auth/logout

Logout current user

Acknowledge logout. The client should discard its JWT.


Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Không có request body.

## GET /api/auth/me

Xem tài khoản đang đăng nhập

Kèm ID hồ sơ sinh viên hoặc doanh nghiệp liên kết. GET không nhận body. ID nằm trong path; bộ lọc và phân trang nằm trong query. Sinh viên chỉ truy cập dữ liệu thuộc phạm vi tài khoản.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Không có request body.

## POST /api/auth/users/password-reset

Đặt lại mật khẩu

Gửi mật khẩu tạm qua email và thu hồi phiên cũ.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| userId | integer | Có | minimum=1; maximum=2147483647 | ID tài khoản. |

## GET /api/cohorts

Danh sách khóa và nhóm

Không cần nhập tham số hoặc request body. Chỉ cần Bearer token và bấm Execute; trả JSON toàn bộ khóa ở mọi trạng thái, các nhóm và thông tin kỳ bắt đầu của từng nhóm.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Không có request body.

## POST /api/cohorts

Tạo khóa và nhóm

Dữ liệu đầu vào dùng JSON body với Content-Type: application/json; không truyền trường dữ liệu qua query hoặc form-data.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| cohortCode | string | Có | maxLength=20 |  |
| name | string | Có | maxLength=100 |  |
| enrollmentYear | integer | Có | minimum=1900; maximum=2200 |  |
| status | string ∈ "PLANNED", "ACTIVE", "CLOSED", "ARCHIVED" | Không / theo điều kiện nghiệp vụ |  |  |
| groups | array<object> | Có | minItems=4; maxItems=4 |  |
| groups[].groupCode | string ∈ "A", "B", "C", "D" | Có |  |  |
| groups[].entryAcademicPeriodId | integer | Có | minimum=1; maximum=2147483647 | ID kỳ bắt đầu chuyên ngành thực tế; mặc định theo khóa/nhóm. |
| groups[].curriculumPeriods | array<object> | Không / theo điều kiện nghiệp vụ | minItems=10; maxItems=10 | Explicit mapping of curriculum stages 0–9 to Spring/Summer/Fall calendar periods. Stage 0 must match entryAcademicPeriodId. |
| groups[].curriculumPeriods[].semester | integer | Có | minimum=0; maximum=9 |  |
| groups[].curriculumPeriods[].academicPeriodId | integer | Có | minimum=1 | ID kỳ học hoặc Block 3. |

Ví dụ:

```json
{
  "cohortCode": "K22",
  "name": "Khoa 22",
  "enrollmentYear": 2026,
  "status": "ACTIVE",
  "groups": [
    {
      "groupCode": "A",
      "entryAcademicPeriodId": 1
    },
    {
      "groupCode": "B",
      "entryAcademicPeriodId": 2
    },
    {
      "groupCode": "C",
      "entryAcademicPeriodId": 3
    },
    {
      "groupCode": "D",
      "entryAcademicPeriodId": 4
    }
  ]
}
```

## PATCH /api/cohorts/{id}

Cập nhật khóa và nhóm

Dữ liệu đầu vào dùng JSON body với Content-Type: application/json; không truyền trường dữ liệu qua query hoặc form-data.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1; maximum=2147483647 | ID: CohortID. |

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| cohortCode | string | Không / theo điều kiện nghiệp vụ | maxLength=20 |  |
| name | string | Không / theo điều kiện nghiệp vụ | maxLength=100 |  |
| enrollmentYear | integer | Không / theo điều kiện nghiệp vụ | minimum=1900; maximum=2200 |  |
| status | string ∈ "PLANNED", "ACTIVE", "CLOSED", "ARCHIVED" | Không / theo điều kiện nghiệp vụ |  |  |
| groups | array<object> | Không / theo điều kiện nghiệp vụ | minItems=1; maxItems=4 |  |
| groups[].groupCode | string ∈ "A", "B", "C", "D" | Có |  |  |
| groups[].entryAcademicPeriodId | integer | Có | minimum=1; maximum=2147483647 | ID kỳ bắt đầu chuyên ngành thực tế; mặc định theo khóa/nhóm. |
| groups[].curriculumPeriods | array<object> | Không / theo điều kiện nghiệp vụ | minItems=10; maxItems=10 | Explicit mapping of curriculum stages 0–9 to Spring/Summer/Fall calendar periods. Stage 0 must match entryAcademicPeriodId. |
| groups[].curriculumPeriods[].semester | integer | Có | minimum=0; maximum=9 |  |
| groups[].curriculumPeriods[].academicPeriodId | integer | Có | minimum=1 | ID kỳ học hoặc Block 3. |

## GET /api/combo-registration-windows

Danh sách đợt chọn combo

Sinh viên chỉ thấy đợt của mình, kèm lựa chọn hợp lệ, hạn gia hạn và lý do chưa thể nộp. GET không nhận body. ID nằm trong path; bộ lọc và phân trang nằm trong query. Sinh viên chỉ truy cập dữ liệu thuộc phạm vi tài khoản. Không nhận request body. Chỉ ID trên URL là bắt buộc (nếu có); bộ lọc query và phân trang đều tùy chọn. Danh sách mặc định page=1, limit=20.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | page | integer | Không | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| query | limit | integer | Không | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| query | phase | string ∈ "INITIAL", "CONFIRMATION" | Không |  |  |
| query | status | string ∈ "DRAFT", "OPEN", "CLOSED", "FINALIZED" | Không |  |  |
| query | academicPeriodId | integer | Không | minimum=1 | ID kỳ học hoặc Block 3. |

Không có request body.

## POST /api/combo-registration-windows

Tạo đợt chọn hoặc xác nhận combo

Dữ liệu đầu vào dùng JSON body với Content-Type: application/json; không truyền trường dữ liệu qua query hoặc form-data.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| name | string | Có | maxLength=150 |  |
| phase | string ∈ "INITIAL", "CONFIRMATION" | Có |  |  |
| academicPeriodId | integer | Có | minimum=1 | ID kỳ học hoặc Block 3. |
| ojtSemesterId | integer | Có | minimum=1 | ID kỳ OJT. |
| initialWindowId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; nullable=true | ID đợt chọn ban đầu cùng kỳ chuyên ngành và kỳ OJT. |
| scope | object | Có |  | Phạm vi áp dụng; các bộ lọc kết hợp đồng thời. |
| scope.cohortIds | array<integer> | Có | maxItems=1000; uniqueItems=true | Danh sách ID khóa. |
| scope.groupCodes | array<string ∈ "A", "B", "C", "D"> | Có | minItems=1; maxItems=4; uniqueItems=true |  |
| scope.majorIds | array<integer> | Có | maxItems=1000; uniqueItems=true | Danh sách ID chuyên ngành. |
| scope.studentIds | array<integer> | Không / theo điều kiện nghiệp vụ | maxItems=1000; uniqueItems=true | Danh sách ID sinh viên. |
| startsAt | string | Có | format="date-time" |  |
| endsAt | string | Có | format="date-time" |  |

## GET /api/combo-registration-windows/{id}

Chi tiết đợt và các lựa chọn combo

Không nhận request body. Chỉ ID trên URL là bắt buộc (nếu có); bộ lọc query và phân trang đều tùy chọn. Danh sách mặc định page=1, limit=20.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có |  |  |

Không có request body.

## PATCH /api/combo-registration-windows/{id}

Cập nhật hoặc mở/đóng đợt chọn combo

Giữ kiểm tra phạm vi, chốt danh sách và hạn đăng ký; status cần reason. Dữ liệu đầu vào dùng JSON body với Content-Type: application/json; không truyền trường dữ liệu qua query hoặc form-data.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 | ID: WindowID trong ComboRegistrationWindows. |

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| name | string | Không / theo điều kiện nghiệp vụ | maxLength=150 |  |
| phase | string ∈ "INITIAL", "CONFIRMATION" | Không / theo điều kiện nghiệp vụ |  |  |
| academicPeriodId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID kỳ học hoặc Block 3. |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID kỳ OJT. |
| initialWindowId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; nullable=true | ID đợt chọn ban đầu cùng kỳ chuyên ngành và kỳ OJT. |
| scope | object | Không / theo điều kiện nghiệp vụ |  | Phạm vi áp dụng; các bộ lọc kết hợp đồng thời. |
| scope.cohortIds | array<integer> | Có | maxItems=1000; uniqueItems=true | Danh sách ID khóa. |
| scope.groupCodes | array<string ∈ "A", "B", "C", "D"> | Có | minItems=1; maxItems=4; uniqueItems=true |  |
| scope.majorIds | array<integer> | Có | maxItems=1000; uniqueItems=true | Danh sách ID chuyên ngành. |
| scope.studentIds | array<integer> | Không / theo điều kiện nghiệp vụ | maxItems=1000; uniqueItems=true | Danh sách ID sinh viên. |
| startsAt | string | Không / theo điều kiện nghiệp vụ | format="date-time" |  |
| endsAt | string | Không / theo điều kiện nghiệp vụ | format="date-time" |  |

## POST /api/combo-registration-windows/{id}/extensions

Gia hạn chọn combo

Dữ liệu đầu vào dùng JSON body với Content-Type: application/json; không truyền trường dữ liệu qua query hoặc form-data.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 | ID: WindowID trong ComboRegistrationWindows. |

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| studentIds | array<integer> | Có | minItems=1; maxItems=1000; uniqueItems=true | Danh sách ID sinh viên. |
| endsAt | string | Có | format="date-time" |  |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |

## POST /api/combo-registration-windows/{id}/finalize

Chốt lựa chọn combo

Dữ liệu đầu vào dùng JSON body với Content-Type: application/json; không truyền trường dữ liệu qua query hoặc form-data.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 | ID: WindowID trong ComboRegistrationWindows. |

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| idempotencyKey | string | Có | maxLength=100 | Khóa chống trùng yêu cầu; dùng lại cùng khóa và dữ liệu khi gửi lại. |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |
| allowUnselected | boolean | Không / theo điều kiện nghiệp vụ | default=false |  |
| excludeStudentIds | array<integer> | Không / theo điều kiện nghiệp vụ | maxItems=1000; uniqueItems=true | ID sinh viên loại khỏi danh sách chốt. |

## POST /api/combo-registration-windows/{id}/preview

Xem ảnh hưởng của combo dự kiến

Tính tín chỉ, môn còn thiếu và điều kiện OJT; không lưu lựa chọn chính thức. Dữ liệu đầu vào dùng JSON body với Content-Type: application/json; không truyền trường dữ liệu qua query hoặc form-data.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 | ID: WindowID trong ComboRegistrationWindows. |

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| studentId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID hồ sơ sinh viên, khác ID tài khoản. |
| comboId | integer | Có | minimum=1 | ID combo (ProgramComboID). |
| courseIds | array<integer> | Có | minItems=1; uniqueItems=true | Danh sách ID môn học. |

## POST /api/combo-registration-windows/{id}/reminders

Gửi nhắc chọn combo

Dữ liệu đầu vào dùng JSON body với Content-Type: application/json; không truyền trường dữ liệu qua query hoặc form-data.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 | ID: WindowID trong ComboRegistrationWindows. |

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| idempotencyKey | string | Có | maxLength=100 | Khóa chống trùng yêu cầu; dùng lại cùng khóa và dữ liệu khi gửi lại. |
| studentIds | array<integer> | Không / theo điều kiện nghiệp vụ | maxItems=1000; uniqueItems=true | Danh sách ID sinh viên. |
| target | string ∈ "MISSING", "ALL" | Không / theo điều kiện nghiệp vụ | default="MISSING" |  |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |

## POST /api/combo-registration-windows/{id}/selections

Gửi lựa chọn combo

Dữ liệu đầu vào dùng JSON body với Content-Type: application/json; không truyền trường dữ liệu qua query hoặc form-data.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 | ID: WindowID trong ComboRegistrationWindows. |

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| studentId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID hồ sơ sinh viên, khác ID tài khoản. |
| comboId | integer | Có | minimum=1 | ID combo (ProgramComboID). |
| courseIds | array<integer> | Có | maxItems=500; uniqueItems=true | Danh sách ID môn học. |
| reason | string | Không / theo điều kiện nghiệp vụ | maxLength=2000 | Lý do thực hiện. |

## GET /api/companies

Danh sách và hồ sơ doanh nghiệp

Lọc companyId để lấy một hồ sơ kèm lịch sử phân trang.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | page | integer | Không | minimum=1 | Trang, bắt đầu từ 1. |
| query | limit | integer | Không | minimum=1; maximum=100 | Số bản ghi mỗi trang. |
| query | search | string | Không | maxLength=100 |  |
| query | status | string ∈ "ACTIVE", "INACTIVE" | Không |  |  |
| query | companyId | integer | Không | minimum=1 | ID doanh nghiệp. |
| query | historyPage | integer | Không | minimum=1; default=1 | Trang lịch sử khi lọc theo ID. |
| query | historyLimit | integer | Không | minimum=1; maximum=100; default=20 | Số sự kiện lịch sử mỗi trang, tối đa 100. |

Không có request body.

## DELETE /api/companies

Xóa doanh nghiệp

Truyền companyId trong JSON body. Xóa mềm doanh nghiệp theo điều kiện dữ liệu liên quan.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| companyId | integer | Có | minimum=1; maximum=2147483647 | ID tài khoản. |

## PATCH /api/companies/{id}

Cập nhật doanh nghiệp

Admin và Phòng QHDN dùng chung URL; chọn mẫu dữ liệu theo vai trò trong anyOf.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1; maximum=2147483647 | ID doanh nghiệp cần cập nhật; lấy từ danh sách doanh nghiệp. |

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| code | string | Không / theo điều kiện nghiệp vụ | maxLength=20 |  |
| name | string | Không / theo điều kiện nghiệp vụ | maxLength=200 |  |
| address | string | Không / theo điều kiện nghiệp vụ | maxLength=300; nullable=true |  |
| industry | string | Không / theo điều kiện nghiệp vụ | maxLength=100; nullable=true |  |
| contactPersonName | string | Không / theo điều kiện nghiệp vụ | maxLength=100; nullable=true |  |
| contactPhone | string | Không / theo điều kiện nghiệp vụ | maxLength=20; nullable=true |  |
| contactEmail | string | Không / theo điều kiện nghiệp vụ | format="email"; maxLength=100; nullable=true |  |
| status | string ∈ "ACTIVE", "INACTIVE" | Không / theo điều kiện nghiệp vụ |  |  |
| reason | string | Không / theo điều kiện nghiệp vụ | maxLength=2000 | Lý do thực hiện. |
| code | string | Không / theo điều kiện nghiệp vụ | maxLength=20 |  |
| name | string | Không / theo điều kiện nghiệp vụ | maxLength=200 |  |
| address | string | Không / theo điều kiện nghiệp vụ | maxLength=300 |  |
| industry | string | Không / theo điều kiện nghiệp vụ | maxLength=100 |  |
| contactPersonName | string | Không / theo điều kiện nghiệp vụ | maxLength=100 |  |
| contactPhone | string | Không / theo điều kiện nghiệp vụ | maxLength=20 |  |
| contactEmail | string | Không / theo điều kiện nghiệp vụ | format="email"; maxLength=100 |  |
| status | string ∈ "ACTIVE", "INACTIVE" | Không / theo điều kiện nghiệp vụ |  |  |
| code | string | Không / theo điều kiện nghiệp vụ | maxLength=20 |  |
| name | string | Không / theo điều kiện nghiệp vụ | maxLength=200 |  |
| address | string | Không / theo điều kiện nghiệp vụ | maxLength=300; nullable=true |  |
| industry | string | Không / theo điều kiện nghiệp vụ | maxLength=100; nullable=true |  |
| contactPersonName | string | Không / theo điều kiện nghiệp vụ | maxLength=100; nullable=true |  |
| contactPhone | string | Không / theo điều kiện nghiệp vụ | maxLength=20; nullable=true |  |
| contactEmail | string | Không / theo điều kiện nghiệp vụ | format="email"; maxLength=100; nullable=true |  |
| status | string ∈ "ACTIVE", "INACTIVE" | Không / theo điều kiện nghiệp vụ |  |  |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |

qhdn:

```json
{
  "name": "Doanh nghiệp công nghệ",
  "reason": "Cập nhật tên doanh nghiệp"
}
```

admin:

```json
{
  "name": "Doanh nghiệp công nghệ"
}
```

## GET /api/course-demands

Thống kê nhu cầu học môn còn thiếu

Mỗi bản ghi giữ ID và bổ sung thông tin liên quan để hiển thị; quan hệ không tồn tại trả null. Khi không lọc, trả dữ liệu theo tất cả kỳ OJT. Kỳ học và deadline lấy từ cấu hình đã lưu; thiếu deadline trả NOT_CONFIGURED, không tự suy ra từ hạn đăng ký. Không nhận request body. Chỉ ID trên URL là bắt buộc (nếu có); bộ lọc query và phân trang đều tùy chọn. Danh sách mặc định page=1, limit=20.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Không có request body.

## GET /api/course-demands/export

Xuất nhu cầu học theo môn, kỳ và Block

undefined Khi không lọc, trả dữ liệu theo tất cả kỳ OJT. Kỳ học và deadline lấy từ cấu hình đã lưu; thiếu deadline trả NOT_CONFIGURED, không tự suy ra từ hạn đăng ký. Không nhận request body. Chỉ ID trên URL là bắt buộc (nếu có); bộ lọc query và phân trang đều tùy chọn. Danh sách mặc định page=1, limit=20.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Không có request body.

## PATCH /api/course-results/{id}

Sửa kết quả học tập và ghi lý do

Dữ liệu đầu vào dùng JSON body với Content-Type: application/json; không truyền trường dữ liệu qua query hoặc form-data.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 | ID: ResultID trong StudentCourseResults. |

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| academicPeriodId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID kỳ học hoặc Block 3. |
| attemptNumber | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=1 | Lần học, từ 1 đến 100. |
| status | string ∈ "PASSED", "FAILED", "IN_PROGRESS", "WITHDRAWN", "RECOGNIZED" | Không / theo điều kiện nghiệp vụ |  |  |
| score | number | Không / theo điều kiện nghiệp vụ | minimum=0; maximum=10; nullable=true |  |
| gradePoints | number | Không / theo điều kiện nghiệp vụ | minimum=0; maximum=4; nullable=true | Điểm quy đổi theo thang 4. |
| grade | string | Không / theo điều kiện nghiệp vụ | maxLength=2; nullable=true |  |
| sourceReference | string | Không / theo điều kiện nghiệp vụ | maxLength=200; nullable=true |  |
| courseId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID môn học (CourseID). |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |

## GET /api/courses

Danh sách môn học

Không nhận request body. Chỉ ID trên URL là bắt buộc (nếu có); bộ lọc query và phân trang đều tùy chọn. Danh sách mặc định page=1, limit=20.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | page | integer | Không | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| query | limit | integer | Không | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| query | search | string | Không | maxLength=100 |  |

Không có request body.

## POST /api/courses

Tạo môn học

Dữ liệu đầu vào dùng JSON body với Content-Type: application/json; không truyền trường dữ liệu qua query hoặc form-data.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| code | string | Có | maxLength=20 |  |
| name | string | Có | maxLength=200 |  |
| defaultCredits | number | Không / theo điều kiện nghiệp vụ | minimum=0; maximum=9999.99; nullable=true |  |
| isOjtPrerequisite | boolean | Không / theo điều kiện nghiệp vụ |  |  |

## PATCH /api/courses/{id}

Cập nhật môn học

Dữ liệu đầu vào dùng JSON body với Content-Type: application/json; không truyền trường dữ liệu qua query hoặc form-data.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 | ID: CourseID. |

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| code | string | Không / theo điều kiện nghiệp vụ | maxLength=20 |  |
| name | string | Không / theo điều kiện nghiệp vụ | maxLength=200 |  |
| defaultCredits | number | Không / theo điều kiện nghiệp vụ | minimum=0; maximum=9999.99; nullable=true |  |
| isOjtPrerequisite | boolean | Không / theo điều kiện nghiệp vụ |  |  |

## GET /api/curricula

Danh sách chương trình đào tạo đã nhập

Không nhận request body. Chỉ ID trên URL là bắt buộc (nếu có); bộ lọc query và phân trang đều tùy chọn. Danh sách mặc định page=1, limit=20.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | page | integer | Không | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| query | limit | integer | Không | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| query | search | string | Không | maxLength=100 |  |
| query | majorId | integer | Không | minimum=1 | ID chuyên ngành (SpecializationID). |
| query | status | string ∈ "DRAFT", "PUBLISHED" | Không |  |  |
| query | version | string | Không | maxLength=10 |  |

Không có request body.

## GET /api/curricula/{id}

Chi tiết chương trình đào tạo

Không nhận request body. Chỉ ID trên URL là bắt buộc (nếu có); bộ lọc query và phân trang đều tùy chọn. Danh sách mặc định page=1, limit=20.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 | ID: ProgramID. |

Không có request body.

## GET /api/curriculum-imports

Danh sách yêu cầu nhập dữ liệu

Không nhận request body. Chỉ ID trên URL là bắt buộc (nếu có); bộ lọc query và phân trang đều tùy chọn. Danh sách mặc định page=1, limit=20.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Không có request body.

## POST /api/curriculum-imports

Kiểm tra và lưu yêu cầu nhập dữ liệu

Dữ liệu đầu vào dùng JSON body với Content-Type: application/json; không truyền trường dữ liệu qua query hoặc form-data.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| idempotencyKey | string | Có | maxLength=100 | Khóa chống trùng yêu cầu; dùng lại cùng khóa và dữ liệu khi gửi lại. |
| sourceName | string | Không / theo điều kiện nghiệp vụ | maxLength=150; nullable=true |  |
| curriculum | object | Có |  |  |
| curriculum.code | string | Có | maxLength=100 |  |
| curriculum.name | string | Có | maxLength=200 |  |
| curriculum.version | string | Có | maxLength=10 |  |
| curriculum.majorId | integer | Có | minimum=1 | ID chuyên ngành (SpecializationID). |
| curriculum.totalCredits | number | Có | minimum=0; maximum=9999.99 |  |
| curriculum.effectiveYear | integer | Có | minimum=1900; maximum=2200 |  |
| curriculum.gpaScale | integer ∈ 4, 10 | Có |  |  |
| courses | array<object> | Có | maxItems=500 |  |
| courses[].courseId | integer | Theo lựa chọn oneOf | minimum=1 | ID môn học (CourseID). |
| courses[].courseCode | string | Theo lựa chọn oneOf | maxLength=20 | Mã môn học. |
| courses[].credits | number | Có | minimum=0; maximum=9999.99 |  |
| courses[].semester | integer | Có | minimum=0; maximum=20 |  |
| courses[].isRequired | boolean | Có |  | Môn bắt buộc. |
| courses[].entryKind | string ∈ "COURSE", "COMBO_SLOT", "ELECTIVE_SLOT" | Không / theo điều kiện nghiệp vụ | default="COURSE" |  |
| courses[].prerequisiteText | string | Không / theo điều kiện nghiệp vụ | maxLength=10000; nullable=true |  |
| prerequisites | array<object> | Có | maxItems=1000 |  |
| prerequisites[].courseId | integer | Có | minimum=1 | ID môn học (CourseID). |
| prerequisites[].groupCode | string | Có | maxLength=50 |  |
| prerequisites[].minimumPassed | integer | Có | minimum=1 |  |
| prerequisites[].prerequisiteCourseIds | array<integer> | Có | maxItems=500 | Danh sách ID môn tiên quyết. |
| combos | array<object> | Có | maxItems=100 |  |
| combos[].code | string | Có | maxLength=50 |  |
| combos[].name | string | Có | maxLength=200 |  |
| combos[].selectionGroup | string | Không / theo điều kiện nghiệp vụ | maxLength=50; nullable=true |  |
| combos[].note | string | Không / theo điều kiện nghiệp vụ | maxLength=2000; nullable=true |  |
| combos[].courses | array<object> | Có | maxItems=500 |  |
| combos[].courses[].courseId | integer | Theo lựa chọn oneOf | minimum=1 | ID môn học (CourseID). |
| combos[].courses[].courseCode | string | Theo lựa chọn oneOf | maxLength=20 | Mã môn học. |
| combos[].courses[].credits | number | Có | minimum=0; maximum=9999.99 |  |
| combos[].courses[].semester | integer | Có | minimum=0; maximum=20 |  |
| combos[].courses[].prerequisiteText | string | Không / theo điều kiện nghiệp vụ | maxLength=10000; nullable=true |  |
| combos[].courses[].note | string | Không / theo điều kiện nghiệp vụ | maxLength=2000; nullable=true |  |
| combos[].courses[].slotCourseIds | array<integer> | Có | maxItems=100 | Danh sách ID môn trong khung chương trình. |
| combos[].choiceGroups | array<object> | Có | maxItems=500 |  |
| combos[].choiceGroups[].code | string | Có | maxLength=50 |  |
| combos[].choiceGroups[].minCourses | integer | Có | minimum=0 |  |
| combos[].choiceGroups[].maxCourses | integer | Có | minimum=0 |  |
| combos[].choiceGroups[].courseIds | array<integer> | Có | maxItems=500 | Danh sách ID môn học. |
| equivalences | array<object> | Có | maxItems=500 |  |
| equivalences[].sourceCourseId | integer | Có | minimum=1 | ID môn nguồn. |
| equivalences[].targetCourseId | integer | Có | minimum=1 | ID môn đích. |
| equivalences[].reason | string | Có | maxLength=2000 | Lý do thực hiện. |

## PATCH /api/curriculum-imports

Xác nhận nhập dữ liệu đã kiểm tra

Dữ liệu đầu vào dùng JSON body với Content-Type: application/json; không truyền trường dữ liệu qua query hoặc form-data.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| id | integer | Có | minimum=1 |  |
| status | string ∈ "COMMITTED" | Có |  |  |

## GET /api/curriculum-imports/{id}

Chi tiết yêu cầu, kết quả và lỗi nhập dữ liệu

Không nhận request body. Chỉ ID trên URL là bắt buộc (nếu có); bộ lọc query và phân trang đều tùy chọn. Danh sách mặc định page=1, limit=20.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có |  |  |

Không có request body.

## POST /api/eligibility-check-runs

Xét điều kiện OJT hàng loạt và cập nhật trạng thái

Truyền phạm vi sinh viên bằng JSON body. Trả kết quả ngay và ghi nhận kết quả chính thức trong cùng lần gọi; không cần xác nhận riêng. Dữ liệu đầu vào dùng JSON body với Content-Type: application/json; không truyền trường dữ liệu qua query hoặc form-data.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Có | minimum=1 | ID kỳ OJT. |
| idempotencyKey | string | Không / theo điều kiện nghiệp vụ | minLength=1; maxLength=100 | Khóa chống trùng yêu cầu; dùng lại cùng khóa và dữ liệu khi gửi lại. |
| programIds | array<integer> | Không / theo điều kiện nghiệp vụ | minItems=1; maxItems=10000; uniqueItems=true | Danh sách ID phiên bản chương trình. |
| cohortIds | array<integer> | Không / theo điều kiện nghiệp vụ | minItems=1; maxItems=10000; uniqueItems=true | Danh sách ID khóa. |
| studentIds | array<integer> | Không / theo điều kiện nghiệp vụ | minItems=1; maxItems=10000; uniqueItems=true | Danh sách ID sinh viên. |
| groupCodes | array<string ∈ "A", "B", "C", "D"> | Không / theo điều kiện nghiệp vụ |  |  |
| confirmResults | boolean | Không / theo điều kiện nghiệp vụ | default=true | false: chỉ tính và cập nhật StudentOJTEligibility, không xác nhận kết quả chính thức. FE dùng false cho lần xét nền sau import. |

## GET /api/eligible-student-handoffs

Lịch sử bàn giao sinh viên

Lịch sử các đợt bàn giao danh sách đủ điều kiện. studentIds và studentCount lấy từ các mục bàn giao; registrationIds chỉ phục vụ lịch sử cũ. Không nhận request body. Chỉ ID trên URL là bắt buộc (nếu có); bộ lọc query và phân trang đều tùy chọn. Danh sách mặc định page=1, limit=20.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Không có request body.

## POST /api/eligible-student-handoffs

Bàn giao sinh viên đủ điều kiện

ADMIN/ACADEMIC bàn giao sinh viên đang học kỳ 5, tài khoản hoạt động, có kết quả FE ELIGIBLE đã lưu trong DB và còn hiệu lực. Kỳ nhận phải là kỳ OJT thứ 6 theo lộ trình khóa/nhóm. Không tính lại điều kiện, không yêu cầu xác nhận EligibilityChecks hay hồ sơ đăng ký. Lưu snapshot kết quả và batch nguồn; toàn bộ danh sách cùng thành công hoặc rollback. Gửi lại cùng idempotencyKey và payload trả kết quả cũ. Lỗi 409: SAVED_ELIGIBILITY_REQUIRED, ELIGIBILITY_RESULT_STALE, HANDOFF_SEMESTER_5_REQUIRED, OJT_FIXED_SEMESTER_REQUIRED, HANDOFF_STUDENT_INACTIVE, HANDOFF_SEMESTER_CLOSED, STUDENT_ALREADY_HANDED_OFF, IDEMPOTENCY_CONFLICT. Dữ liệu đầu vào dùng JSON body với Content-Type: application/json; không truyền trường dữ liệu qua query hoặc form-data.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Có | minimum=1 |  |
| studentIds | array<integer> | Có | minItems=1; maxItems=1000; uniqueItems=true |  |
| idempotencyKey | string | Có | minLength=1; maxLength=100 |  |
| reason | string | Có | minLength=1; maxLength=2000 |  |

## GET /api/enterprise/candidate-periods

Danh sách năm học và kỳ OJT của ứng viên

Chỉ trả về năm học và kỳ có hồ sơ mới nhất được giới thiệu cho doanh nghiệp đang đăng nhập.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Không có request body.

## GET /api/enterprise/candidates

Danh sách và hồ sơ ứng viên

Tự giới hạn theo doanh nghiệp trong token. Không cần nhập companyId; bỏ page và limit để lấy toàn bộ danh sách. Có thể lọc theo năm học, kỳ OJT, studentId, candidateId, vị trí, decision và search. Lọc candidateId để xem một lần giới thiệu, kể cả lịch sử thuộc doanh nghiệp đăng nhập.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | studentId | integer | Không | minimum=1; maximum=2147483647 | ID hồ sơ sinh viên, khác ID tài khoản. |
| query | page | integer | Không | minimum=1; maximum=2147483647 | Trang, bắt đầu từ 1. |
| query | limit | integer | Không | minimum=1; maximum=100 | Số bản ghi mỗi trang. |
| query | ojtSemesterId | integer | Không | minimum=1; maximum=2147483647 | ID kỳ OJT. |
| query | positionId | integer | Không | minimum=1; maximum=2147483647 | ID vị trí thực tập. |
| query | search | string | Không | maxLength=100 |  |
| query | academicYearId | integer | Không | minimum=1; maximum=2147483647 | ID năm học. |
| query | candidateId | integer | Không | minimum=1; maximum=2147483647 |  |
| query | decision | string ∈ "PENDING", "ACCEPTED", "REJECTED" | Không |  |  |

Không có request body.

## PATCH /api/enterprise/candidates/{id}/decision

Tiếp nhận hoặc từ chối ứng viên

Chỉ xử lý ứng viên được giới thiệu cho doanh nghiệp đang đăng nhập.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1; maximum=2147483647 | ID: bản ghi. |

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| decision | string ∈ "ACCEPTED", "REJECTED" | Có |  |  |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |

## GET /api/enterprise/internships

Danh sách sinh viên thực tập

Tự giới hạn theo doanh nghiệp trong token. Không cần nhập companyId; bỏ page và limit để lấy toàn bộ danh sách. Các bộ lọc studentId, internshipId, kỳ OJT, vị trí, status và search đều tùy chọn. Kèm người hướng dẫn, vị trí, đánh giá và kết quả; điểm chính thức chỉ hiển thị sau xác nhận.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | studentId | integer | Không | minimum=1; maximum=2147483647 | ID hồ sơ sinh viên, khác ID tài khoản. |
| query | page | integer | Không | minimum=1; maximum=2147483647 | Trang, bắt đầu từ 1. |
| query | limit | integer | Không | minimum=1; maximum=100 | Số bản ghi mỗi trang. |
| query | ojtSemesterId | integer | Không | minimum=1; maximum=2147483647 | ID kỳ OJT. |
| query | positionId | integer | Không | minimum=1; maximum=2147483647 | ID vị trí thực tập. |
| query | search | string | Không | maxLength=100 |  |
| query | internshipId | integer | Không | minimum=1; maximum=2147483647 |  |
| query | status | string ∈ "ASSIGNED", "ACTIVE", "IN_PROGRESS", "COMPLETED", "CANCELLED", "CANCELED", "FAILED" | Không |  |  |

Không có request body.

## PUT /api/enterprise/internships/{id}/evaluation

Gửi hoặc cập nhật đánh giá thực tập

Chỉ đánh giá sinh viên của doanh nghiệp; internshipId là ID phân công.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1; maximum=2147483647 | ID: bản ghi. |

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| completionScore | number | Có | minimum=0; maximum=10 |  |
| attitudeScore | number | Có | minimum=0; maximum=10 |  |
| skillScore | number | Có | minimum=0; maximum=10 |  |
| overallScore | number | Có | minimum=0; maximum=10 |  |
| comments | string | Không / theo điều kiện nghiệp vụ | maxLength=5000; nullable=true |  |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |

## GET /api/enterprise/profile

Hồ sơ doanh nghiệp

Chỉ xem dữ liệu của doanh nghiệp đang đăng nhập. Kèm số liệu tuyển dụng và thực tập.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Không có request body.

## PATCH /api/enterprise/profile

Cập nhật hồ sơ doanh nghiệp đã được import

Chỉ sửa hồ sơ doanh nghiệp đã có từ import. companyId bắt buộc cùng ít nhất một trường cần sửa. Trường bỏ qua giữ nguyên; null hoặc chuỗi rỗng xóa trường tùy chọn. name không được rỗng. Không sửa mã, trạng thái, tài khoản đăng nhập và không tạo/sửa tin hay vị trí tuyển dụng. positionTitle thuộc tài khoản hiện tại; fullName/phone cá nhân sửa qua /api/accounts/me/profile.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| companyId | integer | Có | minimum=1; maximum=2147483647 | ID doanh nghiệp. |
| name | string | Không / theo điều kiện nghiệp vụ | minLength=1; maxLength=200 |  |
| address | string | Không / theo điều kiện nghiệp vụ | maxLength=300; nullable=true |  |
| industry | string | Không / theo điều kiện nghiệp vụ | maxLength=100; nullable=true |  |
| contactPersonName | string | Không / theo điều kiện nghiệp vụ | maxLength=100; nullable=true |  |
| contactPhone | string | Không / theo điều kiện nghiệp vụ | maxLength=20; nullable=true |  |
| contactEmail | string | Không / theo điều kiện nghiệp vụ | format="email"; maxLength=100; nullable=true |  |
| positionTitle | string | Không / theo điều kiện nghiệp vụ | maxLength=100; nullable=true | Chức danh của tài khoản đang đăng nhập tại doanh nghiệp. |

## POST /api/enterprise/tasks/bulk

Giao một hoặc nhiều task cho nhiều thực tập sinh

assignmentIds là ID phân công thực tập (AssignmentID), không phải studentId. Mỗi task trong tasks được giao cho mọi phân công đã chọn. Chấp nhận tối đa 500 phân công và 50 task (tổng tối đa 5000 task). Toàn bộ giao dịch thất bại nếu có phân công không thuộc doanh nghiệp trong token, không ở trạng thái đang thực tập, hoặc dueDate nằm ngoài thời gian thực tập.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| idempotencyKey | string | Có | minLength=1; maxLength=100 | Dùng lại cùng key và payload khi thử lại request chưa rõ kết quả. |
| assignmentIds | array<integer> | Có | minItems=1; maxItems=500; uniqueItems=true |  |
| tasks | array<object> | Có | minItems=1; maxItems=50 |  |
| tasks[].name | string | Có | minLength=1; maxLength=200 |  |
| tasks[].description | string | Không / theo điều kiện nghiệp vụ | maxLength=10000 |  |
| tasks[].dueDate | string | Có | format="date" |  |

## POST /api/imports/archive

Lưu trữ tuyển dụng sau hai học kỳ

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Không có request body.

## POST /api/imports/commit

Import doanh nghiệp (QHDN) hoặc sinh viên (Phòng đào tạo/Admin)

ENTERPRISE: chỉ OJT_COORD được import, bắt buộc positions và semesterId. Trùng email giữ nguyên mã doanh nghiệp, tài khoản và tin cũ; chỉ thêm tuyển dụng với mã vị trí mới. Code/email trỏ tới hai doanh nghiệp khác nhau bị từ chối. STUDENT: ADMIN/ACADEMIC import tài khoản, academic, placement và courseResults trong một giao dịch. CV dùng API upload hiện tại.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| kind | string ∈ "STUDENT", "ENTERPRISE" | Có |  |  |
| idempotencyKey | string | Có | maxLength=100 | Khóa chống trùng yêu cầu; dùng lại cùng khóa và dữ liệu khi gửi lại. |
| semesterId | integer | Không / theo điều kiện nghiệp vụ |  | ID kỳ OJT. |
| rows | array<object> | Có | minItems=1; maxItems=500 |  |
| rows[].code | string | Có | maxLength=20 | Stable enterprise/student business code, distinct from database ID. |
| rows[].email | string | Có | format="email"; maxLength=100 |  |
| rows[].fullName | string | Có | maxLength=150 |  |
| rows[].name | string | Không / theo điều kiện nghiệp vụ |  | Required enterprise name |
| rows[].address | string | Không / theo điều kiện nghiệp vụ |  |  |
| rows[].positions | array<object> | Không / theo điều kiện nghiệp vụ | minItems=1; maxItems=50 | Required for enterprise imports |
| rows[].positions[].code | string | Có | maxLength=60 |  |
| rows[].positions[].title | string | Có | maxLength=150 |  |
| rows[].positions[].description | string | Có |  |  |
| rows[].positions[].requirements | string | Có |  |  |
| rows[].positions[].capacity | integer | Có | minimum=1 |  |
| rows[].academic | object | Không / theo điều kiện nghiệp vụ |  |  |
| rows[].academic.programId | integer | Có | minimum=1 |  |
| rows[].academic.phone | string | Không / theo điều kiện nghiệp vụ | nullable=true |  |
| rows[].academic.className | string | Không / theo điều kiện nghiệp vụ | nullable=true |  |
| rows[].academic.status | string ∈ "ACTIVE", "INACTIVE", "SUSPENDED", "GRADUATED", "DROPPED_OUT" | Không / theo điều kiện nghiệp vụ |  |  |
| rows[].academic.placement | object | Có |  |  |
| rows[].academic.placement.cohortId | integer | Có | minimum=1 |  |
| rows[].academic.placement.groupCode | string ∈ "A", "B", "C", "D" | Có |  |  |
| rows[].academic.placement.entryAcademicPeriodId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 |  |
| rows[].academic.placement.currentAcademicPeriodId | integer | Có | minimum=1 |  |
| rows[].academic.courseResults | array<object> | Có | maxItems=1000 |  |
| rows[].academic.courseResults[].courseCode | string | Có |  |  |
| rows[].academic.courseResults[].academicPeriodId | integer | Có | minimum=1 |  |
| rows[].academic.courseResults[].attemptNumber | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100 |  |
| rows[].academic.courseResults[].status | string ∈ "PASSED", "FAILED", "IN_PROGRESS", "WITHDRAWN", "RECOGNIZED" | Có |  |  |
| rows[].academic.courseResults[].score | number | Không / theo điều kiện nghiệp vụ | minimum=0; maximum=10; nullable=true |  |
| rows[].academic.courseResults[].gradePoints | number | Không / theo điều kiện nghiệp vụ | minimum=0; maximum=4; nullable=true |  |
| rows[].academic.courseResults[].grade | string | Không / theo điều kiện nghiệp vụ | nullable=true |  |
| rows[].academic.courseResults[].sourceReference | string | Không / theo điều kiện nghiệp vụ | nullable=true |  |

enterprise:

```json
{
  "kind": "ENTERPRISE",
  "idempotencyKey": "enterprise-import-001",
  "semesterId": 1,
  "rows": [
    {
      "code": "DN001",
      "email": "hr@example.com",
      "fullName": "Nguyễn Thị Mai",
      "name": "Công ty ABC",
      "address": "123 Nguyễn Văn Linh, TP. Hồ Chí Minh",
      "positions": [
        {
          "code": "DEV001",
          "title": "Thực tập lập trình",
          "description": "Tham gia phát triển phần mềm",
          "requirements": "Kiến thức TypeScript và SQL",
          "capacity": 5
        }
      ]
    }
  ]
}
```

student:

```json
{
  "kind": "STUDENT",
  "idempotencyKey": "student-full-001",
  "rows": [
    {
      "code": "SV001",
      "email": "student@example.com",
      "fullName": "Nguyễn Văn A",
      "academic": {
        "programId": 1,
        "className": "SE01",
        "placement": {
          "cohortId": 1,
          "groupCode": "A",
          "currentAcademicPeriodId": 1
        },
        "courseResults": [
          {
            "courseCode": "PRF192",
            "academicPeriodId": 1,
            "status": "PASSED",
            "score": 8,
            "gradePoints": 3.5,
            "grade": "B"
          }
        ]
      }
    }
  ]
}
```

Body: multipart/form-data — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| kind | string ∈ "STUDENT", "ENTERPRISE" | Có |  |  |
| idempotencyKey | string | Có | maxLength=100 |  |
| semesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Required for ENTERPRISE |
| mapping | string | Không / theo điều kiện nghiệp vụ |  | JSON map canonical field to header |
| file | string | Có | format="binary" | XLSX or CSV; 8 MiB maximum. One row per course attempt or recruitment position. |

## POST /api/imports/emails/resend

Resend email

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| email | string | Có | format="email"; maxLength=100 |  |

## POST /api/imports/preview

Kiểm tra import doanh nghiệp hoặc sinh viên

ENTERPRISE: chỉ OJT_COORD được import, bắt buộc positions và semesterId. Trùng email giữ nguyên mã doanh nghiệp, tài khoản và tin cũ; chỉ thêm tuyển dụng với mã vị trí mới. Code/email trỏ tới hai doanh nghiệp khác nhau bị từ chối. STUDENT: ADMIN/ACADEMIC import tài khoản, academic, placement và courseResults trong một giao dịch. CV dùng API upload hiện tại.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| kind | string ∈ "STUDENT", "ENTERPRISE" | Có |  |  |
| idempotencyKey | string | Có | maxLength=100 | Khóa chống trùng yêu cầu; dùng lại cùng khóa và dữ liệu khi gửi lại. |
| semesterId | integer | Không / theo điều kiện nghiệp vụ |  | ID kỳ OJT. |
| rows | array<object> | Có | minItems=1; maxItems=500 |  |
| rows[].code | string | Có | maxLength=20 | Stable enterprise/student business code, distinct from database ID. |
| rows[].email | string | Có | format="email"; maxLength=100 |  |
| rows[].fullName | string | Có | maxLength=150 |  |
| rows[].name | string | Không / theo điều kiện nghiệp vụ |  | Required enterprise name |
| rows[].address | string | Không / theo điều kiện nghiệp vụ |  |  |
| rows[].positions | array<object> | Không / theo điều kiện nghiệp vụ | minItems=1; maxItems=50 | Required for enterprise imports |
| rows[].positions[].code | string | Có | maxLength=60 |  |
| rows[].positions[].title | string | Có | maxLength=150 |  |
| rows[].positions[].description | string | Có |  |  |
| rows[].positions[].requirements | string | Có |  |  |
| rows[].positions[].capacity | integer | Có | minimum=1 |  |
| rows[].academic | object | Không / theo điều kiện nghiệp vụ |  |  |
| rows[].academic.programId | integer | Có | minimum=1 |  |
| rows[].academic.phone | string | Không / theo điều kiện nghiệp vụ | nullable=true |  |
| rows[].academic.className | string | Không / theo điều kiện nghiệp vụ | nullable=true |  |
| rows[].academic.status | string ∈ "ACTIVE", "INACTIVE", "SUSPENDED", "GRADUATED", "DROPPED_OUT" | Không / theo điều kiện nghiệp vụ |  |  |
| rows[].academic.placement | object | Có |  |  |
| rows[].academic.placement.cohortId | integer | Có | minimum=1 |  |
| rows[].academic.placement.groupCode | string ∈ "A", "B", "C", "D" | Có |  |  |
| rows[].academic.placement.entryAcademicPeriodId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 |  |
| rows[].academic.placement.currentAcademicPeriodId | integer | Có | minimum=1 |  |
| rows[].academic.courseResults | array<object> | Có | maxItems=1000 |  |
| rows[].academic.courseResults[].courseCode | string | Có |  |  |
| rows[].academic.courseResults[].academicPeriodId | integer | Có | minimum=1 |  |
| rows[].academic.courseResults[].attemptNumber | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100 |  |
| rows[].academic.courseResults[].status | string ∈ "PASSED", "FAILED", "IN_PROGRESS", "WITHDRAWN", "RECOGNIZED" | Có |  |  |
| rows[].academic.courseResults[].score | number | Không / theo điều kiện nghiệp vụ | minimum=0; maximum=10; nullable=true |  |
| rows[].academic.courseResults[].gradePoints | number | Không / theo điều kiện nghiệp vụ | minimum=0; maximum=4; nullable=true |  |
| rows[].academic.courseResults[].grade | string | Không / theo điều kiện nghiệp vụ | nullable=true |  |
| rows[].academic.courseResults[].sourceReference | string | Không / theo điều kiện nghiệp vụ | nullable=true |  |

enterprise:

```json
{
  "kind": "ENTERPRISE",
  "idempotencyKey": "enterprise-import-001",
  "semesterId": 1,
  "rows": [
    {
      "code": "DN001",
      "email": "hr@example.com",
      "fullName": "Nguyễn Thị Mai",
      "name": "Công ty ABC",
      "address": "123 Nguyễn Văn Linh, TP. Hồ Chí Minh",
      "positions": [
        {
          "code": "DEV001",
          "title": "Thực tập lập trình",
          "description": "Tham gia phát triển phần mềm",
          "requirements": "Kiến thức TypeScript và SQL",
          "capacity": 5
        }
      ]
    }
  ]
}
```

student:

```json
{
  "kind": "STUDENT",
  "idempotencyKey": "student-full-001",
  "rows": [
    {
      "code": "SV001",
      "email": "student@example.com",
      "fullName": "Nguyễn Văn A",
      "academic": {
        "programId": 1,
        "className": "SE01",
        "placement": {
          "cohortId": 1,
          "groupCode": "A",
          "currentAcademicPeriodId": 1
        },
        "courseResults": [
          {
            "courseCode": "PRF192",
            "academicPeriodId": 1,
            "status": "PASSED",
            "score": 8,
            "gradePoints": 3.5,
            "grade": "B"
          }
        ]
      }
    }
  ]
}
```

Body: multipart/form-data — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| kind | string ∈ "STUDENT", "ENTERPRISE" | Có |  |  |
| idempotencyKey | string | Có | maxLength=100 |  |
| semesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Required for ENTERPRISE |
| mapping | string | Không / theo điều kiện nghiệp vụ |  | JSON map canonical field to header |
| file | string | Có | format="binary" | XLSX or CSV; 8 MiB maximum. One row per course attempt or recruitment position. |

## GET /api/internship-evaluations

Danh sách đánh giá thực tập

Lọc evaluationId để xem hồ sơ và lịch sử; giữ lọc templateId.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | page | integer | Không | minimum=1 | Trang, bắt đầu từ 1. |
| query | limit | integer | Không | minimum=1; maximum=100 | Số bản ghi mỗi trang. |
| query | search | string | Không | maxLength=100 |  |
| query | status | string | Không | maxLength=20 |  |
| query | companyId | integer | Không | minimum=1 | ID doanh nghiệp. |
| query | ojtSemesterId | integer | Không | minimum=1 | ID kỳ OJT. |
| query | studentId | integer | Không | minimum=1 | ID hồ sơ sinh viên, khác ID tài khoản. |
| query | positionId | integer | Không | minimum=1 | ID vị trí thực tập. |
| query | assignmentId | integer | Không | minimum=1 | ID phân công thực tập. |
| query | templateId | integer | Không | minimum=1 | ID bộ tiêu chí đánh giá. |
| query | evaluationId | integer | Không | minimum=1; maximum=2147483647 |  |
| query | historyPage | integer | Không | minimum=1; maximum=2147483647 | Trang lịch sử khi lọc theo ID. |
| query | historyLimit | integer | Không | minimum=1; maximum=100 | Số sự kiện lịch sử mỗi trang, tối đa 100. |

Không có request body.

## GET /api/internship-tasks

Danh sách task trong phạm vi tài khoản

Mỗi bản ghi giữ ID và bổ sung thông tin liên quan để hiển thị; quan hệ không tồn tại trả null.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | companyId | integer | Không | minimum=1 |  |
| query | studentId | integer | Không | minimum=1 |  |
| query | positionId | integer | Không | minimum=1 |  |
| query | ojtSemesterId | integer | Không | minimum=1 |  |
| query | assignmentId | integer | Không | minimum=1 |  |
| query | page | integer | Không | minimum=1 |  |
| query | limit | integer | Không | minimum=1 |  |

Không có request body.

## GET /api/job-applications

Danh sách hồ sơ ứng tuyển doanh nghiệp

Sinh viên xem hồ sơ của mình; Admin/QHDN xem được trước bàn giao. Kèm vị trí, doanh nghiệp, tin tuyển, CV đã dùng và trạng thái điều phối. GET không nhận body. ID nằm trong path; bộ lọc và phân trang nằm trong query. Sinh viên chỉ truy cập dữ liệu thuộc phạm vi tài khoản.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | applicationId | integer | Không | minimum=1 |  |
| query | studentId | integer | Không | minimum=1 |  |
| query | registrationId | integer | Không | minimum=1 |  |
| query | ojtSemesterId | integer | Không | minimum=1 |  |
| query | companyId | integer | Không | minimum=1 |  |
| query | positionId | integer | Không | minimum=1 |  |
| query | page | integer | Không | minimum=1 |  |
| query | limit | integer | Không | minimum=1 |  |
| query | status | string ∈ "SUBMITTED", "REVIEWING", "INTERVIEW", "OFFERED", "ACCEPTED", "REJECTED", "WITHDRAWN" | Không |  |  |

Không có request body.

## POST /api/job-applications

Sinh viên gửi hồ sơ trực tiếp đến doanh nghiệp

POST tạo JobApplication và StudentEnterpriseCoordination PENDING trong cùng transaction. QHDN không duyệt hoặc chuyển tiếp; khi doanh nghiệp chấp nhận, assignment được tạo tự động.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| windowId | integer | Có | minimum=1; maximum=2147483647 |  |
| postId | integer | Có | minimum=1; maximum=2147483647 |  |
| positionId | integer | Có | minimum=1; maximum=2147483647 |  |
| coverLetter | string | Không / theo điều kiện nghiệp vụ | maxLength=5000 |  |
| application | object | Không / theo điều kiện nghiệp vụ |  |  |
| application.contactPhone | string | Không / theo điều kiện nghiệp vụ | maxLength=30 |  |
| application.contactEmail | string | Không / theo điều kiện nghiệp vụ | maxLength=100 |  |
| application.note | string | Không / theo điều kiện nghiệp vụ | maxLength=2000 |  |

## GET /api/majors

Danh sách chuyên ngành

Không nhận request body. Chỉ ID trên URL là bắt buộc (nếu có); bộ lọc query và phân trang đều tùy chọn. Danh sách mặc định page=1, limit=20.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | page | integer | Không | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| query | limit | integer | Không | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| query | search | string | Không | maxLength=100 |  |
| query | parentMajorId | integer | Không | minimum=1 | ID ngành cha (MajorID). |

Không có request body.

## POST /api/majors

Tạo chuyên ngành

Dữ liệu đầu vào dùng JSON body với Content-Type: application/json; không truyền trường dữ liệu qua query hoặc form-data.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| code | string | Có | maxLength=20 |  |
| name | string | Có | maxLength=200 |  |
| parentMajorId | integer | Có | minimum=1 | ID ngành cha (MajorID). |

## GET /api/ojt-coordinations

Danh sách hồ sơ doanh nghiệp đang xử lý

Lọc coordinationId để xem hồ sơ, lịch sử và chuỗi điều phối phân trang.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | page | integer | Không | minimum=1 | Trang, bắt đầu từ 1. |
| query | limit | integer | Không | minimum=1; maximum=100 | Số bản ghi mỗi trang. |
| query | search | string | Không | maxLength=100 |  |
| query | status | string ∈ "PENDING", "ACCEPTED", "REJECTED" | Không |  |  |
| query | companyId | integer | Không | minimum=1 | ID doanh nghiệp. |
| query | ojtSemesterId | integer | Không | minimum=1 | ID kỳ OJT. |
| query | studentId | integer | Không | minimum=1 | ID hồ sơ sinh viên, khác ID tài khoản. |
| query | positionId | integer | Không | minimum=1 | ID vị trí thực tập. |
| query | registrationId | integer | Không | minimum=1 |  |
| query | decision | string ∈ "PENDING", "ACCEPTED", "REJECTED" | Không |  |  |
| query | coordinationId | integer | Không | minimum=1; maximum=2147483647 |  |
| query | historyPage | integer | Không | minimum=1; maximum=2147483647 | Trang lịch sử khi lọc theo ID. |
| query | historyLimit | integer | Không | minimum=1; maximum=100 | Số sự kiện lịch sử mỗi trang, tối đa 100. |
| query | coordinationPage | integer | Không | minimum=1; maximum=2147483647 |  |
| query | coordinationLimit | integer | Không | minimum=1; maximum=100 |  |
| query | applicationId | integer | Không | minimum=1; maximum=2147483647 |  |

Không có request body.

## POST /api/ojt-coordinations

Tạo điều phối tương thích dữ liệu cũ

Chỉ ADMIN dùng để đối soát; sinh viên hiện gửi hồ sơ trực tiếp đến doanh nghiệp.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| registrationId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 |  |
| positionId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID vị trí thực tập. |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |
| idempotencyKey | string | Có | maxLength=100 | Khóa chống trùng yêu cầu; dùng lại cùng khóa và dữ liệu khi gửi lại. |
| applicationId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Ứng tuyển của sinh viên tại đúng hồ sơ và vị trí; bỏ trống để tự tìm hồ sơ phù hợp. |

## POST /api/ojt-coordinations/{id}/decision

Ghi nhận quyết định cho dữ liệu cũ

Chỉ ADMIN xử lý đối soát; doanh nghiệp quyết định hồ sơ mới qua API candidates.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 | ID: bản ghi. |

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| decision | string ∈ "ACCEPTED", "REJECTED" | Có |  |  |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |

## POST /api/ojt-coordinations/{id}/reassign

Điều phối lại dữ liệu cũ

Chỉ ADMIN dùng để đối soát; khi bị từ chối, sinh viên tự chọn vị trí khác và nộp lại.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 | ID: bản ghi. |

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| positionId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID vị trí thực tập. |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |
| idempotencyKey | string | Có | maxLength=100 | Khóa chống trùng yêu cầu; dùng lại cùng khóa và dữ liệu khi gửi lại. |
| applicationId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID kỳ OJT. |

## GET /api/ojt-eligibility-results

Lấy kết quả FE đã lưu mới nhất theo sinh viên

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | studentId | integer | Không | minimum=1 |  |
| query | status | string ∈ "ELIGIBLE", "NOT_ELIGIBLE", "REVIEW_REQUIRED" | Không |  |  |
| query | page | integer | Không | minimum=1; default=1 |  |
| query | limit | integer | Không | minimum=1; maximum=100; default=20 |  |

Không có request body.

## POST /api/ojt-eligibility-results

Lưu kết quả xét điều kiện OJT do frontend tính

ADMIN/ACADEMIC. Không cần năm học/kỳ OJT. Lưu nguyên kết quả FE sau khi kiểm tra cấu trúc và tính nhất quán của ngưỡng 70 tín chỉ / tối đa 2 môn nợ. Không chạy lại phép tính học vụ hoặc xác nhận quyết định OJT chính thức. Toàn bộ request lưu trong một transaction; gửi lại cùng khóa/payload trả kết quả cũ. Tối đa 10.000 sinh viên, JSON 10 MB. Kết quả cũ hơn kết quả đã lưu hoặc bảng điểm đã đổi bị từ chối 409.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| idempotencyKey | string | Có | maxLength=100 |  |
| source | string ∈ "FRONTEND" | Có |  |  |
| rule | object | Có |  |  |
| rule.minCredits | integer ∈ 70 | Có |  |  |
| rule.maxUnpassedCourses | integer ∈ 2 | Có |  |  |
| results | array<object> | Có | minItems=1; maxItems=10000 |  |
| results[].studentId | integer | Có | minimum=1 |  |
| results[].status | string ∈ "ELIGIBLE", "NOT_ELIGIBLE", "REVIEW_REQUIRED" | Có |  |  |
| results[].earnedCredits | number | Có | minimum=0; maximum=10000; nullable=true |  |
| results[].unpassedCourseCount | integer | Có | minimum=0; maximum=10000 |  |
| results[].reasons | array<string> | Có | maxItems=100 |  |
| results[].academicIssues | array<string> | Có | maxItems=100 |  |
| results[].checkedAt | string | Có | format="date-time" |  |

## PUT /api/ojt-grade-mappings

Thiết lập quy đổi điểm OJT

Chọn môn, kỳ ghi nhận và thang quy đổi. Cấu hình đã dùng để xác nhận kết quả không được sửa. Dữ liệu đầu vào dùng JSON body với Content-Type: application/json; không truyền trường dữ liệu qua query hoặc form-data.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| programId | integer | Có | minimum=1 |  |
| ojtSemesterId | integer | Có | minimum=1 |  |

## GET /api/ojt-registration-windows

Danh sách đợt đăng ký OJT

Sinh viên chỉ thấy đợt phù hợp, kèm kỳ học, hồ sơ đã nộp và điều kiện đăng ký. GET không nhận body. ID nằm trong path; bộ lọc và phân trang nằm trong query. Sinh viên chỉ truy cập dữ liệu thuộc phạm vi tài khoản.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | ojtSemesterId | integer | Không | minimum=1 | ID kỳ OJT. |
| query | status | string ∈ "DRAFT", "OPEN", "CLOSED" | Không |  | Lọc theo trạng thái; bỏ trường này để xem tất cả. |
| query | page | integer | Không | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| query | limit | integer | Không | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |

Không có request body.

## POST /api/ojt-registration-windows

Tạo đợt đăng ký OJT

Chỉ ADMIN/OJT_COORD quản lý đợt đăng ký. Tạo ở DRAFT; PATCH status OPEN/CLOSED và reason để mở/đóng. Chỉ mở khi phạm vi có sinh viên đã bàn giao. academicPeriodId mặc định từ kỳ OJT và phải khớp kỳ đã chọn. requiredRelativeSemester là metadata tương thích, không thay thế điều kiện bàn giao.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Có | minimum=1 | ID kỳ OJT. |
| name | string | Có | maxLength=150 |  |
| scope | object | Có |  | Phạm vi áp dụng; các bộ lọc kết hợp đồng thời. |
| scope.programIds | array<integer> | Không / theo điều kiện nghiệp vụ | minItems=1; uniqueItems=true | Danh sách ID phiên bản chương trình. |
| scope.cohortIds | array<integer> | Không / theo điều kiện nghiệp vụ | minItems=1; uniqueItems=true | Danh sách ID khóa. |
| scope.majorIds | array<integer> | Không / theo điều kiện nghiệp vụ | minItems=1; uniqueItems=true | Danh sách ID chuyên ngành. |
| scope.studentIds | array<integer> | Không / theo điều kiện nghiệp vụ | minItems=1; uniqueItems=true | Danh sách ID sinh viên. |
| scope.groupCodes | array<string ∈ "A", "B", "C", "D"> | Không / theo điều kiện nghiệp vụ | minItems=1; uniqueItems=true |  |
| startsAt | string | Có | format="date-time" |  |
| endsAt | string | Có | format="date-time" |  |
| reason | string | Không / theo điều kiện nghiệp vụ | maxLength=2000 | Lý do thực hiện. |
| academicPeriodId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Mặc định từ kỳ OJT; nếu truyền phải khớp kỳ đã chọn. |
| requiredRelativeSemester | integer | Không / theo điều kiện nghiệp vụ | minimum=6; maximum=6; default=6 | Metadata tương thích; quyền đăng ký dựa trên danh sách đã bàn giao. |

## PATCH /api/ojt-registration-windows/{id}

Cập nhật hoặc mở/đóng đợt đăng ký OJT

Chỉ ADMIN/OJT_COORD quản lý đợt đăng ký. Tạo ở DRAFT; PATCH status OPEN/CLOSED và reason để mở/đóng. Chỉ mở khi phạm vi có sinh viên đã bàn giao. academicPeriodId mặc định từ kỳ OJT và phải khớp kỳ đã chọn. requiredRelativeSemester là metadata tương thích, không thay thế điều kiện bàn giao.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 | ID: WindowID trong OJTRegistrationWindows. |

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID kỳ OJT. |
| name | string | Không / theo điều kiện nghiệp vụ | maxLength=150 |  |
| scope | object | Không / theo điều kiện nghiệp vụ |  | Phạm vi áp dụng; các bộ lọc kết hợp đồng thời. |
| scope.programIds | array<integer> | Không / theo điều kiện nghiệp vụ | minItems=1; uniqueItems=true | Danh sách ID phiên bản chương trình. |
| scope.cohortIds | array<integer> | Không / theo điều kiện nghiệp vụ | minItems=1; uniqueItems=true | Danh sách ID khóa. |
| scope.majorIds | array<integer> | Không / theo điều kiện nghiệp vụ | minItems=1; uniqueItems=true | Danh sách ID chuyên ngành. |
| scope.studentIds | array<integer> | Không / theo điều kiện nghiệp vụ | minItems=1; uniqueItems=true | Danh sách ID sinh viên. |
| scope.groupCodes | array<string ∈ "A", "B", "C", "D"> | Không / theo điều kiện nghiệp vụ | minItems=1; uniqueItems=true |  |
| startsAt | string | Không / theo điều kiện nghiệp vụ | format="date-time" |  |
| endsAt | string | Không / theo điều kiện nghiệp vụ | format="date-time" |  |
| reason | string | Không / theo điều kiện nghiệp vụ | maxLength=2000 | Lý do thực hiện. |
| academicPeriodId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Mặc định từ kỳ OJT; nếu truyền phải khớp kỳ đã chọn. |
| requiredRelativeSemester | integer | Không / theo điều kiện nghiệp vụ | minimum=6; maximum=6; default=6 | Metadata tương thích; quyền đăng ký dựa trên danh sách đã bàn giao. |
| status | string ∈ "OPEN", "CLOSED" | Không / theo điều kiện nghiệp vụ |  | Mở/đóng đợt; bắt buộc reason khi gửi status. |

## POST /api/ojt-registration-windows/{id}/semester-exceptions

Thêm ngoại lệ kỳ đăng ký OJT

Chỉ áp dụng cho sinh viên, kỳ và thời hạn được chỉ định; cần lý do. Dữ liệu đầu vào dùng JSON body với Content-Type: application/json; không truyền trường dữ liệu qua query hoặc form-data.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 | ID: WindowID trong OJTRegistrationWindows. |

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| studentIds | array<integer> | Có | minItems=1; uniqueItems=true | Danh sách ID sinh viên. |
| relativeSemester | integer | Có | minimum=1; maximum=20 | Kỳ chuyên ngành tương đối. |
| expiresAt | string | Có | format="date-time" |  |
| reason | string | Có | minLength=1; maxLength=2000 | Lý do thực hiện. |

## POST /api/ojt-registration-windows/{id}/semester-exceptions/{exceptionId}/revoke

Thu hồi ngoại lệ kỳ đăng ký OJT

Dữ liệu đầu vào dùng JSON body với Content-Type: application/json; không truyền trường dữ liệu qua query hoặc form-data.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 | ID: WindowID trong OJTRegistrationWindows. |
| path | exceptionId | integer | Có | minimum=1 | ID ngoại lệ của đợt đăng ký. |

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| reason | string | Có | minLength=1; maxLength=2000 | Lý do thực hiện. |

## GET /api/ojt-registrations

Danh sách hồ sơ đăng ký OJT

Hồ sơ đăng ký: QHDN xem các hồ sơ thuộc danh sách được bàn giao, STUDENT chỉ xem hồ sơ của mình. status/registrationStatus trả LEGACY_REVIEW_REQUIRED cho HANDED_OFF cũ; legacyStatus giữ nguyên giá trị lịch sử. handoffStatus luôn lấy từ bảng bàn giao. GET không nhận body. ID nằm trong path; bộ lọc và phân trang nằm trong query. Sinh viên chỉ truy cập dữ liệu thuộc phạm vi tài khoản.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | ojtSemesterId | integer | Không | minimum=1 | ID kỳ OJT. |
| query | windowId | integer | Không | minimum=1 | ID đợt đăng ký. |
| query | studentId | integer | Không | minimum=1 | ID hồ sơ sinh viên, khác ID tài khoản. |
| query | programId | integer | Không | minimum=1 | ID phiên bản chương trình đào tạo. |
| query | cohortId | integer | Không | minimum=1 | ID khóa. |
| query | groupCode | string ∈ "A", "B", "C", "D" | Không |  |  |
| query | status | string ∈ "SUBMITTED", "APPROVED", "REJECTED", "HANDED_OFF" | Không |  | Lọc theo trạng thái; bỏ trường này để xem tất cả. |
| query | search | string | Không |  |  |
| query | page | integer | Không | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| query | limit | integer | Không | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| query | registrationId | integer | Không | minimum=1 | Chọn một hồ sơ để trả thêm phần chi tiết. |
| query | historyPage | integer | Không | minimum=1; default=1 | Phân trang history; chỉ dùng cùng registrationId. |
| query | historyLimit | integer | Không | minimum=1; maximum=100; default=20 | Phân trang history; chỉ dùng cùng registrationId. |
| query | coordinationPage | integer | Không | minimum=1; default=1 | Phân trang coordination; chỉ dùng cùng registrationId. |
| query | coordinationLimit | integer | Không | minimum=1; maximum=100; default=20 | Phân trang coordination; chỉ dùng cùng registrationId. |
| query | assignmentPage | integer | Không | minimum=1; default=1 | Phân trang assignment; chỉ dùng cùng registrationId. |
| query | assignmentLimit | integer | Không | minimum=1; maximum=100; default=20 | Phân trang assignment; chỉ dùng cùng registrationId. |

Không có request body.

## POST /api/ojt-registrations

Nộp hồ sơ đăng ký OJT

Endpoint tương thích cho hồ sơ đăng ký OJT cũ; luồng mới STUDENT chọn vị trí và gửi trực tiếp bằng POST /api/job-applications. STUDENT chỉ nộp hồ sơ của mình; ADMIN có thể nhập thay. Bắt buộc thuộc danh sách đã bàn giao cùng kỳ, đợt OPEN, trong thời hạn và đúng scope.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| windowId | integer | Có | minimum=1 | ID đợt đăng ký. |
| studentId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID hồ sơ sinh viên, khác ID tài khoản. |
| application | object | Không / theo điều kiện nghiệp vụ |  |  |
| application.contactPhone | string | Không / theo điều kiện nghiệp vụ | maxLength=30 |  |
| application.contactEmail | string | Không / theo điều kiện nghiệp vụ | format="email"; maxLength=100 |  |
| application.note | string | Không / theo điều kiện nghiệp vụ | maxLength=2000 |  |

## POST /api/ojt-registrations/{id}/review

Duyệt hoặc từ chối hồ sơ OJT

Chỉ ADMIN xử lý dữ liệu hồ sơ cũ. Đây không còn là bước duyệt của Phòng QHDN trong luồng đăng ký trực tiếp.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 | ID: RegistrationID. |

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| decision | string ∈ "APPROVE", "REJECT" | Có |  |  |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |
| idempotencyKey | string | Có | maxLength=100 | Khóa chống trùng yêu cầu; dùng lại cùng khóa và dữ liệu khi gửi lại. |

## GET /api/ojt-results

Danh sách kết quả OJT đã được QHDN chuyển

resultId là OJTResults.ResultID. Chỉ kết quả được ACADEMIC xác nhận mới chính thức. Sinh viên chỉ xem CONFIRMED. Không nhận request body. Chỉ ID trên URL là bắt buộc (nếu có); bộ lọc query và phân trang đều tùy chọn. Danh sách mặc định page=1, limit=20.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | resultId | integer | Không | minimum=1 |  |
| query | studentId | integer | Không | minimum=1 | ID hồ sơ sinh viên, khác ID tài khoản. |
| query | ojtSemesterId | integer | Không | minimum=1 | ID kỳ OJT. |
| query | page | integer | Không | minimum=1 | Trang, bắt đầu từ 1. |
| query | limit | integer | Không | minimum=1 | Số bản ghi mỗi trang. |
| query | status | string ∈ "PENDING_ACADEMIC_CONFIRMATION", "REVISION_REQUESTED", "CONFIRMED" | Không |  |  |
| query | search | string | Không |  |  |
| query | resultId | integer | Không | minimum=1 | Chọn một hồ sơ để trả thêm phần chi tiết. |
| query | historyPage | integer | Không | minimum=1; default=1 | Phân trang history; chỉ dùng cùng resultId. |
| query | historyLimit | integer | Không | minimum=1; maximum=100; default=20 | Phân trang history; chỉ dùng cùng resultId. |

Không có request body.

## POST /api/ojt-results

QHDN chốt và chuyển kết quả về Phòng đào tạo

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| assignmentId | integer | Có | minimum=1; maximum=2147483647 |  |
| reason | string | Có |  |  |
| idempotencyKey | string | Có |  |  |

## POST /api/ojt-results/{id}/confirm

Phòng đào tạo xác nhận và ghi nhận điểm OJT

Dùng bảng quy đổi điểm đã cấu hình; lưu StudentCourseResults và CONFIRMED trong cùng transaction. Không ghi đè điểm học vụ đang tồn tại. Dữ liệu đầu vào dùng JSON body với Content-Type: application/json; không truyền trường dữ liệu qua query hoặc form-data.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1; maximum=2147483647 |  |

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| reason | string | Có |  |  |
| idempotencyKey | string | Có |  |  |

## GET /api/ojt-rule-sets

Danh sách bộ quy tắc OJT

Không nhận request body. Chỉ ID trên URL là bắt buộc (nếu có); bộ lọc query và phân trang đều tùy chọn. Danh sách mặc định page=1, limit=20.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | programId | integer | Không | minimum=1 | ID phiên bản chương trình đào tạo. |
| query | ojtSemesterId | integer | Không | minimum=1 | ID kỳ OJT. |
| query | status | string | Không |  |  |
| query | page | integer | Không | minimum=1 | Trang, bắt đầu từ 1. |
| query | limit | integer | Không | minimum=1 | Số bản ghi mỗi trang. |

Không có request body.

## POST /api/ojt-rule-sets

Tạo bộ quy tắc OJT

Điều kiện: tối thiểu 70 tín chỉ và tối đa 2 môn còn nợ. Dữ liệu đầu vào dùng JSON body với Content-Type: application/json; không truyền trường dữ liệu qua query hoặc form-data.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| programId | integer | Có | minimum=1 | ID phiên bản chương trình đào tạo. |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; nullable=true | ID kỳ OJT. |
| version | integer | Có | minimum=1 |  |
| name | string | Có | maxLength=200 |  |
| minCredits | number ∈ 70 | Không / theo điều kiện nghiệp vụ | default=70 |  |
| maxUnpassedCourses | integer ∈ 2 | Không / theo điều kiện nghiệp vụ | default=2 |  |
| debtBasis | string ∈ "FAILED_ATTEMPTS" | Không / theo điều kiện nghiệp vụ | default="FAILED_ATTEMPTS" |  |

## PATCH /api/ojt-rule-sets

Cập nhật hoặc ban hành bộ quy tắc

Dữ liệu đầu vào dùng JSON body với Content-Type: application/json; không truyền trường dữ liệu qua query hoặc form-data.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| id | integer | Có | minimum=1 |  |
| status | string ∈ "PUBLISHED" | Không / theo điều kiện nghiệp vụ |  |  |

## GET /api/ojt-semesters

Danh sách kỳ OJT

Danh sách theo kỳ: QHDN chỉ thấy sinh viên được bàn giao, kể cả chưa đăng ký. registration, handoff, officialEligibility, assignment là các quy trình độc lập. Không nhận request body. Chỉ ID trên URL là bắt buộc (nếu có); bộ lọc query và phân trang đều tùy chọn. Danh sách mặc định page=1, limit=20.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Không có request body.

## GET /api/ojt-semesters/{id}

Chi tiết kỳ OJT, sinh viên, bàn giao và kết quả

Danh sách theo kỳ: QHDN chỉ thấy sinh viên được bàn giao, kể cả chưa đăng ký. registration, handoff, officialEligibility, assignment là các quy trình độc lập. Không nhận request body. Chỉ ID trên URL là bắt buộc (nếu có); bộ lọc query và phân trang đều tùy chọn. Danh sách mặc định page=1, limit=20.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có |  |  |

Không có request body.

## GET /api/ojt-semesters/{id}/eligible-student-handoffs

Lịch sử bàn giao sinh viên cho QHDN

Lịch sử các đợt bàn giao danh sách đủ điều kiện. studentIds và studentCount lấy từ các mục bàn giao; registrationIds chỉ phục vụ lịch sử cũ.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 | ID: OJTSemesterID. |
| query | page | integer | Không | minimum=1 | Trang, bắt đầu từ 1. |
| query | limit | integer | Không | minimum=1 | Số bản ghi mỗi trang. |

Không có request body.

## GET /api/ojt-semesters/{id}/results/export

Xuất báo cáo kết quả OJT theo kỳ

Không nhận request body. Chỉ ID trên URL là bắt buộc (nếu có); bộ lọc query và phân trang đều tùy chọn. Danh sách mặc định page=1, limit=20.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 | ID: OJTSemesterID. |
| query | resultId | integer | Không | minimum=1 |  |
| query | studentId | integer | Không | minimum=1 | ID hồ sơ sinh viên, khác ID tài khoản. |
| query | ojtSemesterId | integer | Không | minimum=1 | ID kỳ OJT. |
| query | status | string ∈ "PENDING_ACADEMIC_CONFIRMATION", "REVISION_REQUESTED", "CONFIRMED" | Không |  |  |
| query | search | string | Không |  |  |
| query | format | string ∈ "csv", "json", "pdf" | Không |  |  |

Không có request body.

## GET /api/ojt-semesters/{id}/students

Theo dõi trạng thái OJT theo kỳ

Danh sách theo kỳ: QHDN chỉ thấy sinh viên được bàn giao, kể cả chưa đăng ký. registration, handoff, officialEligibility, assignment là các quy trình độc lập. GET không nhận body. ID nằm trong path; bộ lọc và phân trang nằm trong query. Sinh viên chỉ truy cập dữ liệu thuộc phạm vi tài khoản. Không nhận request body. Chỉ ID trên URL là bắt buộc (nếu có); bộ lọc query và phân trang đều tùy chọn. Danh sách mặc định page=1, limit=20.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 | ID: OJTSemesterID. |
| query | programId | integer | Không | minimum=1 | ID phiên bản chương trình đào tạo. |
| query | cohortId | integer | Không | minimum=1 | ID khóa. |
| query | groupCode | string | Không |  |  |
| query | registrationStatus | string | Không |  |  |
| query | search | string | Không |  |  |
| query | page | integer | Không | minimum=1 | Trang, bắt đầu từ 1. |
| query | limit | integer | Không | minimum=1 | Số bản ghi mỗi trang. |
| query | enterpriseId | integer | Không | minimum=1 | Filters the latest coordination and its assignment; QHDN remains restricted to handed-off students. |
| query | coordinationStatus | string ∈ "NOT_COORDINATED", "PENDING", "ACCEPTED", "REJECTED" | Không |  | Filters the latest coordination and its assignment; QHDN remains restricted to handed-off students. |
| query | assignmentStatus | string ∈ "UNASSIGNED", "ASSIGNED", "ACTIVE", "IN_PROGRESS", "COMPLETED", "CANCELLED", "CANCELED", "FAILED" | Không |  | Filters the latest coordination and its assignment; QHDN remains restricted to handed-off students. |

Không có request body.

## GET /api/positions

Danh sách và hồ sơ vị trí thực tập

Lọc positionId để lấy một vị trí kèm lịch sử; có mã, địa điểm và hình thức làm việc.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | page | integer | Không | minimum=1 | Trang, bắt đầu từ 1. |
| query | limit | integer | Không | minimum=1; maximum=100 | Số bản ghi mỗi trang. |
| query | search | string | Không | maxLength=100 |  |
| query | status | string ∈ "OPEN", "CLOSED" | Không |  |  |
| query | companyId | integer | Không | minimum=1 | ID doanh nghiệp. |
| query | ojtSemesterId | integer | Không | minimum=1 | ID kỳ OJT. |
| query | positionId | integer | Không | minimum=1 | ID vị trí thực tập. |
| query | historyPage | integer | Không | minimum=1; default=1 | Trang lịch sử khi lọc theo ID. |
| query | historyLimit | integer | Không | minimum=1; maximum=100; default=20 | Số sự kiện lịch sử mỗi trang, tối đa 100. |

Không có request body.

## DELETE /api/positions

Xóa vị trí thực tập

Xóa mềm vị trí theo điều kiện dữ liệu liên quan.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| positionId | integer | Có | minimum=1; maximum=2147483647 | ID tài khoản. |

## GET /api/qhdn/dashboard

Tổng quan QHDN

Tổng hợp bàn giao, tiếp nhận và sức chứa; dùng lần điều phối mới nhất.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | ojtSemesterId | integer | Không | minimum=1 | ID kỳ OJT. |
| query | companyId | integer | Không | minimum=1 | ID doanh nghiệp. |

Không có request body.

## GET /api/qhdn/eligible-students

Nhận danh sách sinh viên đủ điều kiện đã được Đào tạo bàn giao

ADMIN/OJT_COORD xem danh sách Đào tạo đã duyệt và gửi cho đúng kỳ OJT. Chỉ có kết quả ELIGIBLE đã xác nhận và bản ghi bàn giao thật mới xuất hiện; không yêu cầu có hồ sơ đăng ký. Mỗi sinh viên một dòng trong kỳ. eligibilityAtHandoff là kết quả tại thời điểm bàn giao, không kiểm tra lại hiệu lực hiện tại và không cấp quyền điều phối. Hồ sơ đã xóa mềm không hiển thị. API chỉ đọc; dữ liệu đăng ký/chương trình/khóa là hiện tại.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | ojtSemesterId | integer | Có | minimum=1; maximum=2147483647 | ID kỳ OJT. |
| query | studentId | integer | Không | minimum=1; maximum=2147483647 | ID hồ sơ sinh viên, khác ID tài khoản. |
| query | handoffId | integer | Không | minimum=1; maximum=2147483647 |  |
| query | programId | integer | Không | minimum=1; maximum=2147483647 | ID phiên bản chương trình đào tạo. |
| query | cohortId | integer | Không | minimum=1; maximum=2147483647 | ID khóa. |
| query | groupCode | string ∈ "A", "B", "C", "D" | Không |  |  |
| query | search | string | Không | minLength=1; maxLength=100 | Tìm theo MSSV, họ tên hoặc email. |
| query | registrationStatus | string ∈ "NOT_REGISTERED", "SUBMITTED", "APPROVED", "REJECTED", "LEGACY_REVIEW_REQUIRED" | Không |  | NOT_REGISTERED để xem sinh viên chưa đăng ký. Trạng thái HANDED_OFF cũ được trả thành LEGACY_REVIEW_REQUIRED. |
| query | page | integer | Không | minimum=1; maximum=2147483647; default=1 | Trang, bắt đầu từ 1. |
| query | limit | integer | Không | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |

Không có request body.

## GET /api/qhdn/registered-students

Xem sinh viên đã đăng ký OJT

Danh sách sinh viên đã đăng ký và có bản ghi bàn giao thật cùng kỳ. Mỗi sinh viên một dòng; đăng ký trong registrations. Dùng ojt-semesters/students để nhận danh sách bàn giao trước đăng ký. Không suy ra bàn giao từ trạng thái HANDED_OFF cũ.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | registrationId | integer | Không | minimum=1; maximum=2147483647 |  |
| query | studentId | integer | Không | minimum=1; maximum=2147483647 | ID hồ sơ sinh viên, khác ID tài khoản. |
| query | ojtSemesterId | integer | Không | minimum=1; maximum=2147483647 | ID kỳ OJT. |
| query | academicPeriodId | integer | Không | minimum=1; maximum=2147483647 | ID kỳ học hoặc Block 3. |
| query | windowId | integer | Không | minimum=1; maximum=2147483647 | ID đợt đăng ký. |
| query | status | string ∈ "SUBMITTED", "APPROVED", "REJECTED", "HANDED_OFF" | Không |  |  |
| query | programId | integer | Không | minimum=1; maximum=2147483647 | ID phiên bản chương trình đào tạo. |
| query | cohortId | integer | Không | minimum=1; maximum=2147483647 | ID khóa. |
| query | groupCode | string ∈ "A", "B", "C", "D" | Không |  |  |
| query | search | string | Không | maxLength=100 |  |
| query | handoffStatus | string ∈ "NOT_HANDED_OFF", "HANDED_OFF" | Không |  | Lọc hồ sơ chưa bàn giao hoặc đã bàn giao. |
| query | page | integer | Không | minimum=1; maximum=2147483647; default=1 | Trang, bắt đầu từ 1. |
| query | limit | integer | Không | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |

Không có request body.

## GET /api/qhdn/reports

Báo cáo QHDN theo loại

type: acceptance, internships hoặc enterprise-feedback; giữ lọc kỳ/doanh nghiệp và phân trang. Mỗi bản ghi giữ ID và bổ sung thông tin liên quan để hiển thị; quan hệ không tồn tại trả null.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | ojtSemesterId | integer | Không | minimum=1 | ID kỳ OJT. |
| query | companyId | integer | Không | minimum=1 | ID doanh nghiệp. |
| query | page | integer | Không | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| query | limit | integer | Không | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| query | type | string ∈ "acceptance", "internships", "enterprise-feedback" | Có |  |  |

Không có request body.

## GET /api/qhdn/reports/export

Xuất báo cáo QHDN

Định dạng CSV hoặc JSON; tối đa 10.000 dòng, không phân trang.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | ojtSemesterId | integer | Không | minimum=1 | ID kỳ OJT. |
| query | companyId | integer | Không | minimum=1 | ID doanh nghiệp. |
| query | type | string ∈ "acceptance", "internships", "enterprise-feedback" | Có |  |  |
| query | format | string ∈ "csv", "json" | Không | default="csv" |  |

Không có request body.

## GET /api/recruitment/posts

Danh sách tin tuyển dụng

Kèm vị trí và chỉ tiêu; doanh nghiệp chỉ xem tin của mình.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | page | integer | Không | minimum=1; maximum=2147483647; default=1 | Trang, bắt đầu từ 1. |
| query | limit | integer | Không | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| query | companyId | integer | Có | minimum=1; maximum=2147483647 | ID doanh nghiệp. |
| query | postId | integer | Không | minimum=1; maximum=2147483647 |  |
| query | windowId | integer | Không | minimum=1; maximum=2147483647 | ID đợt đăng ký. |
| query | academicPeriodId | integer | Không | minimum=1; maximum=2147483647 | ID kỳ học hoặc Block 3. |
| query | status | string ∈ "DRAFT", "PENDING_REVIEW", "PUBLISHED", "REJECTED", "CLOSED", "ARCHIVED" | Không |  |  |

Không có request body.

## POST /api/recruitment/posts/{id}/close

Đóng tin tuyển dụng

Ngừng nhận ứng viên vào các vị trí liên quan.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1; maximum=2147483647 | ID: bản ghi. |

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |

## POST /api/recruitment/posts/{id}/review

Duyệt hoặc từ chối tin tuyển dụng

Vị trí được mở sau khi tin được công bố.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1; maximum=2147483647 | ID: bản ghi. |

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| decision | string ∈ "PUBLISH", "REJECT" | Có |  |  |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |
| deadlineAt | string | Không / theo điều kiện nghiệp vụ | format="date-time" |  |

## POST /api/recruitment/windows

Tạo đợt nhận nhu cầu tuyển dụng

Chọn học kỳ có sẵn và thời hạn nhận đơn; không tạo kỳ OJT riêng.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| academicPeriodId | integer | Có | minimum=1; maximum=2147483647 | ID kỳ học hoặc Block 3. |
| name | string | Có | maxLength=150 |  |
| startsAt | string | Có | format="date-time" |  |
| endsAt | string | Có | format="date-time" |  |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |

## PATCH /api/recruitment/windows/{id}

Cập nhật hoặc mở/đóng đợt tuyển dụng

Chọn học kỳ có sẵn; status OPEN/CLOSED cần reason.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1; maximum=2147483647 | ID: bản ghi. |

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| academicPeriodId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID kỳ học hoặc Block 3. |
| name | string | Không / theo điều kiện nghiệp vụ | maxLength=150 |  |
| startsAt | string | Không / theo điều kiện nghiệp vụ | format="date-time" |  |
| endsAt | string | Không / theo điều kiện nghiệp vụ | format="date-time" |  |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |
| status | string ∈ "OPEN", "CLOSED" | Không / theo điều kiện nghiệp vụ |  |  |

## GET /api/student-imports

Danh sách yêu cầu nhập dữ liệu

Không nhận request body. Chỉ ID trên URL là bắt buộc (nếu có); bộ lọc query và phân trang đều tùy chọn. Danh sách mặc định page=1, limit=20.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Không có request body.

## POST /api/student-imports

Kiểm tra và lưu yêu cầu nhập dữ liệu

FE đọc hai sheet Danh sách sinh viên và Kết quả học tập thành rows JSON. Học kỳ thực tế được ánh xạ sang kỳ chương trình 0–9 theo khóa/nhóm. Bắt buộc chương trình PUBLISHED; sinh viên qua kỳ 0 phải có lịch sử kỳ trước (trong tệp hoặc đã lưu). Môn thuộc khung/combo được duyệt; được học vượt tag kỳ khi không có hoặc đã đạt đủ tiên quyết; nhóm tiên quyết phải đạt ở kỳ trước. Preview chạy cả ràng buộc deferred trước khi lưu yêu cầu VALIDATED. PATCH cùng tài nguyên với {id,status:"COMMITTED"} để nhập dữ liệu. Dữ liệu đầu vào dùng JSON body với Content-Type: application/json; không truyền trường dữ liệu qua query hoặc form-data.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| idempotencyKey | string | Có | maxLength=100 | Khóa chống trùng yêu cầu; dùng lại cùng khóa và dữ liệu khi gửi lại. |
| semesterId | integer | Không / theo điều kiện nghiệp vụ |  | ID kỳ OJT. |
| rows | array<object> | Có | minItems=1; maxItems=500 |  |
| rows[].code | string | Có | maxLength=20 | Stable enterprise/student business code, distinct from database ID. |
| rows[].email | string | Có | format="email"; maxLength=100 |  |
| rows[].fullName | string | Có | maxLength=150 |  |
| rows[].name | string | Không / theo điều kiện nghiệp vụ |  | Required enterprise name |
| rows[].address | string | Không / theo điều kiện nghiệp vụ |  |  |
| rows[].positions | array<object> | Không / theo điều kiện nghiệp vụ | minItems=1; maxItems=50 | Required for enterprise imports |
| rows[].positions[].code | string | Có | maxLength=60 |  |
| rows[].positions[].title | string | Có | maxLength=150 |  |
| rows[].positions[].description | string | Có |  |  |
| rows[].positions[].requirements | string | Có |  |  |
| rows[].positions[].capacity | integer | Có | minimum=1 |  |
| rows[].academic | object | Không / theo điều kiện nghiệp vụ |  |  |
| rows[].academic.programId | integer | Có | minimum=1 |  |
| rows[].academic.phone | string | Không / theo điều kiện nghiệp vụ | nullable=true |  |
| rows[].academic.className | string | Không / theo điều kiện nghiệp vụ | nullable=true |  |
| rows[].academic.status | string ∈ "ACTIVE", "INACTIVE", "SUSPENDED", "GRADUATED", "DROPPED_OUT" | Không / theo điều kiện nghiệp vụ |  |  |
| rows[].academic.placement | object | Có |  |  |
| rows[].academic.placement.cohortId | integer | Có | minimum=1 |  |
| rows[].academic.placement.groupCode | string ∈ "A", "B", "C", "D" | Có |  |  |
| rows[].academic.placement.entryAcademicPeriodId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 |  |
| rows[].academic.placement.currentAcademicPeriodId | integer | Có | minimum=1 |  |
| rows[].academic.courseResults | array<object> | Có | maxItems=1000 |  |
| rows[].academic.courseResults[].courseCode | string | Có |  |  |
| rows[].academic.courseResults[].academicPeriodId | integer | Có | minimum=1 |  |
| rows[].academic.courseResults[].attemptNumber | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100 |  |
| rows[].academic.courseResults[].status | string ∈ "PASSED", "FAILED", "IN_PROGRESS", "WITHDRAWN", "RECOGNIZED" | Có |  |  |
| rows[].academic.courseResults[].score | number | Không / theo điều kiện nghiệp vụ | minimum=0; maximum=10; nullable=true |  |
| rows[].academic.courseResults[].gradePoints | number | Không / theo điều kiện nghiệp vụ | minimum=0; maximum=4; nullable=true |  |
| rows[].academic.courseResults[].grade | string | Không / theo điều kiện nghiệp vụ | nullable=true |  |
| rows[].academic.courseResults[].sourceReference | string | Không / theo điều kiện nghiệp vụ | nullable=true |  |

Ví dụ:

```json
{
  "kind": "ENTERPRISE",
  "idempotencyKey": "enterprise-import-001",
  "semesterId": 1,
  "rows": [
    {
      "code": "DN001",
      "email": "hr@example.com",
      "fullName": "Nguyễn Thị Mai",
      "name": "Công ty ABC",
      "address": "123 Nguyễn Văn Linh, TP. Hồ Chí Minh",
      "positions": [
        {
          "code": "DEV001",
          "title": "Thực tập lập trình",
          "description": "Tham gia phát triển phần mềm",
          "requirements": "Kiến thức TypeScript và SQL",
          "capacity": 5
        }
      ]
    }
  ]
}
```

## PATCH /api/student-imports

Xác nhận nhập dữ liệu đã kiểm tra

ENTERPRISE: chỉ OJT_COORD được import, bắt buộc positions và semesterId. Trùng email giữ nguyên mã doanh nghiệp, tài khoản và tin cũ; chỉ thêm tuyển dụng với mã vị trí mới. Code/email trỏ tới hai doanh nghiệp khác nhau bị từ chối. STUDENT: ADMIN/ACADEMIC import tài khoản, academic, placement và courseResults trong một giao dịch. CV dùng API upload hiện tại. Dữ liệu đầu vào dùng JSON body với Content-Type: application/json; không truyền trường dữ liệu qua query hoặc form-data.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| id | integer | Có | minimum=1 |  |
| status | string ∈ "COMMITTED" | Có |  |  |

## GET /api/student-imports/{id}

Chi tiết yêu cầu, kết quả và lỗi nhập dữ liệu

Không nhận request body. Chỉ ID trên URL là bắt buộc (nếu có); bộ lọc query và phân trang đều tùy chọn. Danh sách mặc định page=1, limit=20.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có |  |  |

Không có request body.

## POST /api/student-imports/{id}/email-retries

Gửi lại email tài khoản sinh viên

ENTERPRISE: chỉ OJT_COORD được import, bắt buộc positions và semesterId. Trùng email giữ nguyên mã doanh nghiệp, tài khoản và tin cũ; chỉ thêm tuyển dụng với mã vị trí mới. Code/email trỏ tới hai doanh nghiệp khác nhau bị từ chối. STUDENT: ADMIN/ACADEMIC import tài khoản, academic, placement và courseResults trong một giao dịch. CV dùng API upload hiện tại.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có |  |  |

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| email | string | Có | format="email" |  |

## GET /api/students

Tìm kiếm và lọc sinh viên

Mỗi bản ghi giữ ID và bổ sung thông tin liên quan để hiển thị; quan hệ không tồn tại trả null. Không nhận request body. Chỉ ID trên URL là bắt buộc (nếu có); bộ lọc query và phân trang đều tùy chọn. Danh sách mặc định page=1, limit=20.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | page | integer | Không | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| query | limit | integer | Không | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| query | search | string | Không |  |  |
| query | status | string | Không |  |  |
| query | programId | integer | Không | minimum=1 | ID phiên bản chương trình đào tạo. |
| query | cohortId | integer | Không | minimum=1 | ID khóa. |
| query | groupCode | string | Không |  |  |
| query | enrollmentYear | integer | Không | minimum=1 |  |
| query | currentSemester | integer | Không | minimum=0; maximum=9 | Kỳ chương trình hiện tại từ 0 đến 9, lấy từ lộ trình khóa/nhóm; khác tag môn đang học. |
| query | importedOnly | boolean | Không | default=false | Only students included in a successful student account import. |
| query | importBatchId | string | Không | pattern="^[1-9][0-9]*$" | Filter by the source account import batch ID (positive bigint string). |

Không có request body.

## DELETE /api/students

Xóa hồ sơ sinh viên

Xóa mềm hồ sơ và vô hiệu hóa tài khoản.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| studentId | integer | Có | minimum=1; maximum=2147483647 | ID tài khoản. |

## GET /api/students/{id}

Hồ sơ học vụ tổng hợp

Hồ sơ tổng hợp, thay các API riêng về bảng điểm, chương trình, tổng hợp học vụ, điều kiện/lịch sử xét và lịch sử combo. include chọn các phần cần tải; mặc định trả tất cả. academic=null khi chưa có kỳ OJT; curriculum=null khi chưa công bố/gán chương trình. Không trả điểm đánh giá chưa công bố cho Student. GET không nhận body. ID nằm trong path; bộ lọc và phân trang nằm trong query. Sinh viên chỉ truy cập dữ liệu thuộc phạm vi tài khoản. Không nhận request body. Chỉ ID trên URL là bắt buộc (nếu có); bộ lọc query và phân trang đều tùy chọn. Danh sách mặc định page=1, limit=20.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 | ID: StudentID. |
| query | include | string | Không |  | Danh sách phân cách bằng dấu phẩy: academicProgress,courseResults,comboSelections,ojtRegistrations,eligibility,eligibilityChecks,comboHistory,academic,curriculum. Không dùng cùng section. |
| query | checksPage | integer | Không | minimum=1 |  |
| query | checksLimit | integer | Không | minimum=1; maximum=100 |  |
| query | comboPage | integer | Không | minimum=1 |  |
| query | comboLimit | integer | Không | minimum=1; maximum=100 |  |
| query | courseId | integer | Không | minimum=1 |  |
| query | academicPeriodId | integer | Không | minimum=1 |  |
| query | courseStatus | string ∈ "PASSED", "FAILED", "IN_PROGRESS", "WITHDRAWN", "RECOGNIZED" | Không |  | Lọc courseResults; dùng resultsPage/resultsLimit để phân trang. |

Không có request body.

## PATCH /api/students/{id}

Cập nhật hồ sơ và lộ trình học vụ

Chỉ gửi trường cần sửa; placement chứa khóa, nhóm và kỳ học. Dữ liệu đầu vào dùng JSON body với Content-Type: application/json; không truyền trường dữ liệu qua query hoặc form-data.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 | ID: StudentID. |

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| fullName | string | Không / theo điều kiện nghiệp vụ | maxLength=100 |  |
| phone | string | Không / theo điều kiện nghiệp vụ | maxLength=20; nullable=true |  |
| className | string | Không / theo điều kiện nghiệp vụ | maxLength=20; nullable=true |  |
| status | string ∈ "ACTIVE", "INACTIVE", "SUSPENDED", "GRADUATED", "DROPPED_OUT" | Không / theo điều kiện nghiệp vụ |  |  |
| programId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; nullable=true | ID phiên bản chương trình đào tạo. |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |

## GET /api/students/{id}/cv

Tải CV của sinh viên

QHDN được xem CV sinh viên đã có bàn giao; không yêu cầu sinh viên phải đăng ký trước. GET không nhận body. ID nằm trong path; bộ lọc và phân trang nằm trong query. Sinh viên chỉ truy cập dữ liệu thuộc phạm vi tài khoản. Không nhận request body. Chỉ ID trên URL là bắt buộc (nếu có); bộ lọc query và phân trang đều tùy chọn. Danh sách mặc định page=1, limit=20.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 |  |
| query | cvFileId | integer | Không | minimum=1 |  |

Không có request body.

## POST /api/students/export

Xuất danh sách sinh viên

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| search | string | Không / theo điều kiện nghiệp vụ | maxLength=100 |  |
| status | string | Không / theo điều kiện nghiệp vụ | maxLength=30 |  |
| programId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID tài khoản. |
| cohortId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID tài khoản. |
| groupCode | string ∈ "A", "B", "C", "D" | Không / theo điều kiện nghiệp vụ |  |  |
| enrollmentYear | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID tài khoản. |
| currentSemester | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID tài khoản. |

## POST /api/students/me/cv

Upload hoặc thay CV cá nhân

Sinh viên tải PDF tối đa 10 MB; không cần đăng ký OJT hoặc đợt mở đơn. Lưu file nhị phân trong DB, không nhận URL. Giữ phiên bản CV đã gắn ứng tuyển.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: multipart/form-data — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| cv | string | Có | format="binary" |  |

## GET /api/students/me/dashboard

tổng hợp; không tạo thuật toán học vụ mới

GET không nhận body. ID nằm trong path; bộ lọc và phân trang nằm trong query. Sinh viên chỉ truy cập dữ liệu thuộc phạm vi tài khoản.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | ojtSemesterId | integer | Có | minimum=1; maximum=2147483647 | ID kỳ OJT. |

Không có request body.

## GET /api/students/me/internships

Hồ sơ thực tập: phân công, nhiệm vụ và kết quả đã công bố

Gộp phân công hiện tại, nhiệm vụ và kết quả OJT. Bỏ bộ lọc kỳ: phân công đang hiệu lực mới nhất và lịch sử kết quả của mình. assignmentId chọn phân công lịch sử, resultId chọn kết quả CONFIRMED kèm đúng phân công. Không tìm thấy hoặc không thuộc mình trả 404. Các danh sách có phân trang độc lập. GET không nhận body. ID nằm trong path; bộ lọc và phân trang nằm trong query. Sinh viên chỉ truy cập dữ liệu thuộc phạm vi tài khoản.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | ojtSemesterId | integer | Không | minimum=1 |  |
| query | assignmentId | integer | Không | minimum=1 |  |
| query | resultId | integer | Không | minimum=1 |  |
| query | tasksPage | integer | Không | minimum=1; default=1 |  |
| query | tasksLimit | integer | Không | minimum=1; maximum=100 |  |
| query | resultsPage | integer | Không | minimum=1; default=1 |  |
| query | resultsLimit | integer | Không | minimum=1; maximum=100 |  |

Không có request body.

## GET /api/students/me/notifications

thông báo/lọc unread/phân trang, trả unreadCount cùng response

Mỗi bản ghi giữ ID và bổ sung thông tin liên quan để hiển thị; quan hệ không tồn tại trả null. GET không nhận body. ID nằm trong path; bộ lọc và phân trang nằm trong query. Sinh viên chỉ truy cập dữ liệu thuộc phạm vi tài khoản.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | unread | boolean | Không |  |  |
| query | page | integer | Không | minimum=1; maximum=2147483647 | Trang, bắt đầu từ 1. |
| query | limit | integer | Không | minimum=1; maximum=100 | Số bản ghi mỗi trang. |

Không có request body.

## PATCH /api/students/me/notifications/{id}

người nhận đánh dấu đọc, idempotent

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1; maximum=2147483647 | ID: StudentID. |

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| isRead | boolean | Có |  |  |

## GET /api/students/me/opportunities

Danh sách vị trí doanh nghiệp để sinh viên ứng tuyển trực tiếp

Bắt buộc windowId của đợt đăng ký đang mở. Chỉ trả về vị trí phù hợp kỳ OJT; canApply và blockers phản ánh kết quả bàn giao, eligibility, scope, trạng thái hồ sơ và chỉ tiêu. GET không nhận body. ID nằm trong path; bộ lọc và phân trang nằm trong query. Sinh viên chỉ truy cập dữ liệu thuộc phạm vi tài khoản.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | windowId | integer | Có | minimum=1 |  |
| query | page | integer | Không | minimum=1 |  |
| query | limit | integer | Không | minimum=1 |  |

Không có request body.

## GET /api/students/me/roadmap-recommendations

tư vấn AI lộ trình; khác đề xuất môn bằng quy tắc

GET không nhận body. ID nằm trong path; bộ lọc và phân trang nằm trong query. Sinh viên chỉ truy cập dữ liệu thuộc phạm vi tài khoản.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | ojtSemesterId | integer | Có | minimum=1; maximum=2147483647 | ID kỳ OJT. |

Không có request body.
