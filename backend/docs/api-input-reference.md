# Đầu vào API dành cho FE và test thủ công

Nguồn: OpenAPI hiện tại của backend. Tạo lại bằng `npm run docs:api` sau `npm run build`.
Phạm vi: 154 operations; 54 path parameters; 290 query parameters; 101 request bodies.


Nhóm Sinh viên dùng một JSON body chứa cả ID và bộ lọc tại /api/student/*; API đọc dùng POST, không có ô path/query. Upload CV dùng multipart/form-data. Các nhóm còn lại dùng route REST gốc. GET truyền bộ lọc và phân trang qua query parameters, ID bản ghi qua path; không gửi GET body. POST tạo mới/thực hiện nghiệp vụ, PUT/PATCH cập nhật, DELETE xóa theo quy tắc nghiệp vụ. Các route /api/json/ đã bị xóa. Token, quyền và trạng thái nghiệp vụ vẫn bắt buộc.

Bạn tự insert dữ liệu mẫu: dùng đúng bảng/ID, FK, trạng thái, snapshot và fingerprint nguồn theo schema. Ví dụ confirm eligibility hoặc điểm OJT sẽ trả 409 nếu dữ liệu mẫu thiếu liên kết, snapshot hoặc không còn khớp nguồn. Không chỉ đổi một cột Status để giả lập hoàn tất nghiệp vụ.

- Swagger: `/api-docs`. Nhóm Sinh viên: nhấn Try it out rồi sửa trực tiếp JSON request body, gồm cả ID; API không cần trường nào gửi {}. Các nhóm khác nhập path/query và body theo hợp đồng. GET không có request body. Schema hiển thị các trường và ràng buộc.
- OpenAPI JSON cho FE: `/api-docs/openapi.json`.
- `studentId` = StudentID; `programId` = ProgramID; `majorId` = SpecializationID; `courseId` = CourseID. Các loại ID không thay thế cho nhau.
- Mọi ID trong ví dụ là minh họa; thay bằng ID thực tế trong dữ liệu mẫu. Không tự gọi các API tạo dữ liệu từ ví dụ.
- Import commit nhận đủ JSON và tự kiểm tra, không bắt buộc chạy preview trước.
- Các thao tác mở/đóng/chốt/duyệt/xác nhận kiểm tra trạng thái đang lưu trong DB; không yêu cầu lịch sử gọi API của trình duyệt.
- Các ví dụ không tạo bản ghi mẫu, không thay đổi quy chế và không làm frontend tự gọi thêm API.

## GET /api/academic-imports

Lịch sử nhập dữ liệu học vụ

Không có importId: danh sách thông thường. Có importId: trả thêm chi tiết trong data.items; phần lịch sử/dòng dữ liệu có phân trang riêng. Không khớp bộ lọc trả items rỗng.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | page | integer | Không | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| query | limit | integer | Không | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| query | kind | string ∈ "STUDENT", "COURSE_RESULT", "CURRICULUM" | Không |  |  |
| query | status | string ∈ "COMPLETED", "REJECTED", "FAILED" | Không |  |  |
| query | importId | string | Không | pattern="^[1-9][0-9]{0,18}$" | Chọn một hồ sơ để trả thêm phần chi tiết. |
| query | rowsPage | integer | Không | minimum=1; default=1 | Phân trang rows; chỉ dùng cùng importId. |
| query | rowsLimit | integer | Không | minimum=1; maximum=100; default=20 | Phân trang rows; chỉ dùng cùng importId. |

Không có request body.

## GET /api/academic-periods

Danh sách kỳ học và Block 3

Lọc kind=SEMESTER để chọn học kỳ tuyển dụng; kết quả kèm thông tin OJT.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | page | integer | Không | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| query | limit | integer | Không | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| query | search | string | Không | maxLength=100 |  |
| query | status | string ∈ "PLANNED", "ACTIVE", "CLOSED", "ARCHIVED" | Không |  |  |
| query | academicYearId | integer | Không | minimum=1; maximum=2147483647 | ID năm học. |
| query | kind | string ∈ "SEMESTER", "BLOCK3" | Không |  |  |
| query | academicPeriodId | integer | Không | minimum=1; maximum=2147483647 | ID kỳ học hoặc Block 3. |

Không có request body.

## POST /api/academic-periods

Tạo kỳ học và Block 3

Học kỳ thường tự liên kết OJT và trả ojtSemesterId; QHDN không tạo kỳ riêng.

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

## PATCH /api/academic-periods/{id}

Cập nhật kỳ học và Block 3

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1; maximum=2147483647 | ID: AcademicPeriodID. |

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| academicYearId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID năm học. |
| periodCode | string | Không / theo điều kiện nghiệp vụ | maxLength=30 |  |
| name | string | Không / theo điều kiện nghiệp vụ | maxLength=100 |  |
| kind | string ∈ "SEMESTER", "BLOCK3" | Không / theo điều kiện nghiệp vụ |  |  |
| parentPeriodId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647; nullable=true | ID kỳ học cha của Block 3. |
| startDate | string | Không / theo điều kiện nghiệp vụ | format="date" |  |
| endDate | string | Không / theo điều kiện nghiệp vụ | format="date" |  |
| status | string ∈ "PLANNED", "ACTIVE", "CLOSED", "ARCHIVED" | Không / theo điều kiện nghiệp vụ |  |  |
| ojt | object | Không / theo điều kiện nghiệp vụ |  | Chỉ SEMESTER; thông tin vận hành OJT gắn với học kỳ, không tạo kỳ OJT riêng. |
| ojt.startDate | string | Không / theo điều kiện nghiệp vụ | format="date" |  |
| ojt.endDate | string | Không / theo điều kiện nghiệp vụ | format="date" |  |
| ojt.regStartDate | string | Không / theo điều kiện nghiệp vụ | format="date"; nullable=true |  |
| ojt.regEndDate | string | Không / theo điều kiện nghiệp vụ | format="date"; nullable=true |  |
| ojt.status | string ∈ "PLANNED", "ACTIVE", "CLOSED", "ARCHIVED" | Không / theo điều kiện nghiệp vụ |  |  |

## GET /api/academic-periods/{id}/combo-phase-schedules

Xem mốc chọn và xác nhận combo

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 | ID: AcademicPeriodID. |

Không có request body.

## PUT /api/academic-periods/{id}/combo-phase-schedules

Thiết lập mốc chọn và xác nhận combo

Chọn ban đầu trong kỳ học; xác nhận trong Block 3. Các mốc phải nằm trong kỳ tương ứng.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 | ID: AcademicPeriodID. |

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| phase | string ∈ "INITIAL", "CONFIRMATION" | Có |  |  |
| startsAt | string | Có | format="date-time" |  |
| endsAt | string | Có | format="date-time" |  |
| reason | string | Có | minLength=1; maxLength=2000 | Lý do thực hiện. |

## GET /api/academic-periods/{id}/ojt-advisory-schedule

xem lịch thông báo giữa kỳ và deadline.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1; maximum=2147483647 | ID: AcademicPeriodID. |

Không có request body.

## PUT /api/academic-periods/{id}/ojt-advisory-schedule

cấu hình lịch theo kỳ thực, worker thực thi.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1; maximum=2147483647 | ID: AcademicPeriodID. |

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Có | minimum=1; maximum=2147483647 | ID kỳ OJT. |
| sendAt | string | Có | format="date-time" | Hạn xét điều kiện, gồm múi giờ. |
| assessmentDeadline | string | Có | format="date-time" | Hạn xét điều kiện, gồm múi giờ. |
| scope | object | Có |  | Phạm vi áp dụng; các bộ lọc kết hợp đồng thời. |
| scope.programIds | array<integer> | Không / theo điều kiện nghiệp vụ |  | Danh sách ID phiên bản chương trình. |
| scope.cohortIds | array<integer> | Không / theo điều kiện nghiệp vụ |  | Danh sách ID khóa. |
| scope.majorIds | array<integer> | Không / theo điều kiện nghiệp vụ |  | Danh sách ID chuyên ngành. |
| scope.groupCodes | array<string ∈ "A", "B", "C", "D"> | Không / theo điều kiện nghiệp vụ |  |  |
| scope.studentIds | array<integer> | Không / theo điều kiện nghiệp vụ |  | Danh sách ID sinh viên. |
| enabled | boolean | Không / theo điều kiện nghiệp vụ |  |  |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |

## GET /api/academic-years

Danh sách năm học

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | page | integer | Không | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| query | limit | integer | Không | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| query | search | string | Không | maxLength=100 |  |
| query | status | string ∈ "PLANNED", "ACTIVE", "CLOSED", "ARCHIVED" | Không |  |  |

Không có request body.

## POST /api/academic-years

Tạo năm học

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| yearCode | string | Có | maxLength=20 |  |
| startDate | string | Có | format="date" |  |
| endDate | string | Có | format="date" |  |
| status | string ∈ "PLANNED", "ACTIVE", "CLOSED", "ARCHIVED" | Không / theo điều kiện nghiệp vụ |  |  |

Ví dụ:

```json
{
  "yearCode": "2026-2027",
  "startDate": "2026-09-01",
  "endDate": "2027-08-31",
  "status": "PLANNED"
}
```

## PATCH /api/academic-years/{id}

Cập nhật năm học

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

## POST /api/academic/academic-summary-notifications

gửi snapshot giữa kỳ cho cả scope, kể cả SV không có cảnh báo; có thể gửi thủ công trước.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Có | minimum=1; maximum=2147483647 | ID kỳ OJT. |
| academicPeriodId | integer | Có | minimum=1; maximum=2147483647 | ID kỳ OJT. |
| scope | object | Không / theo điều kiện nghiệp vụ |  | Phạm vi áp dụng; các bộ lọc kết hợp đồng thời. |
| scope.programIds | array<integer> | Không / theo điều kiện nghiệp vụ |  | Danh sách ID phiên bản chương trình. |
| scope.cohortIds | array<integer> | Không / theo điều kiện nghiệp vụ |  | Danh sách ID khóa. |
| scope.majorIds | array<integer> | Không / theo điều kiện nghiệp vụ |  | Danh sách ID chuyên ngành. |
| scope.groupCodes | array<string ∈ "A", "B", "C", "D"> | Không / theo điều kiện nghiệp vụ |  |  |
| scope.studentIds | array<integer> | Không / theo điều kiện nghiệp vụ |  | Danh sách ID sinh viên. |
| studentIds | array<integer> | Không / theo điều kiện nghiệp vụ | minItems=1; maxItems=1000; uniqueItems=true | Danh sách ID sinh viên. |
| idempotencyKey | string | Có | maxLength=100 | Khóa chống trùng yêu cầu; dùng lại cùng khóa và dữ liệu khi gửi lại. |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |

## GET /api/academic/advisory-runs

lịch sử batch thông báo khi có worker.

Mỗi bản ghi giữ ID và bổ sung thông tin liên quan để hiển thị; quan hệ không tồn tại trả null.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | page | integer | Không | minimum=1; maximum=2147483647 | Trang, bắt đầu từ 1. |
| query | limit | integer | Không | minimum=1; maximum=100 | Số bản ghi mỗi trang. |

Không có request body.

## GET /api/academic/advisory-runs/{id}

trạng thái/lỗi từng sinh viên.

Mỗi bản ghi giữ ID và bổ sung thông tin liên quan để hiển thị; quan hệ không tồn tại trả null.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1; maximum=2147483647 | ID: bản ghi. |
| query | page | integer | Không | minimum=1; maximum=2147483647 | Trang, bắt đầu từ 1. |
| query | limit | integer | Không | minimum=1; maximum=100 | Số bản ghi mỗi trang. |

Không có request body.

## GET /api/academic/alerts

Danh sách cảnh báo thiếu điều kiện OJT

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | ojtSemesterId | integer | Có | minimum=1 | ID kỳ OJT. |
| query | programId | integer | Không | minimum=1 | ID phiên bản chương trình đào tạo. |
| query | cohortId | integer | Không | minimum=1 | ID khóa. |
| query | majorId | integer | Không | minimum=1 | ID chuyên ngành (SpecializationID). |
| query | comboId | integer | Không | minimum=1 | ID combo (ProgramComboID). |
| query | groupCode | string | Không |  |  |
| query | academicPeriodId | integer | Có | minimum=1 | ID kỳ học hoặc Block 3. |
| query | assessmentDeadline | string | Có | format="date-time" | Hạn xét điều kiện, gồm múi giờ. |
| query | type | string ∈ "CREDIT_SHORTFALL", "MISSING_REQUIRED_COURSES", "EXCESS_FAILED_COURSES" | Không |  |  |
| query | page | integer | Không | minimum=1 | Trang, bắt đầu từ 1. |
| query | limit | integer | Không | minimum=1 | Số bản ghi mỗi trang. |

Không có request body.

## POST /api/academic/alerts/notifications

Gửi cảnh báo học vụ

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Có | minimum=1 | ID kỳ OJT. |
| programId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID phiên bản chương trình đào tạo. |
| cohortId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID khóa. |
| majorId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID chuyên ngành (SpecializationID). |
| comboId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID combo (ProgramComboID). |
| groupCode | string | Không / theo điều kiện nghiệp vụ |  |  |
| academicPeriodId | integer | Có | minimum=1 | ID kỳ học hoặc Block 3. |
| assessmentDeadline | string | Có |  | Hạn xét điều kiện, gồm múi giờ. |
| studentIds | array<integer> | Có | minItems=1; maxItems=1000; uniqueItems=true | Danh sách ID sinh viên. |
| channel | string ∈ "IN_APP", "EMAIL", "BOTH" | Không / theo điều kiện nghiệp vụ | default="IN_APP" |  |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |
| idempotencyKey | string | Có | maxLength=100 | Khóa chống trùng yêu cầu; dùng lại cùng khóa và dữ liệu khi gửi lại. |

## GET /api/academic/course-demand

Thống kê nhu cầu học môn còn thiếu

Mỗi bản ghi giữ ID và bổ sung thông tin liên quan để hiển thị; quan hệ không tồn tại trả null.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | ojtSemesterId | integer | Có | minimum=1 | ID kỳ OJT. |
| query | programId | integer | Không | minimum=1 | ID phiên bản chương trình đào tạo. |
| query | cohortId | integer | Không | minimum=1 | ID khóa. |
| query | majorId | integer | Không | minimum=1 | ID chuyên ngành (SpecializationID). |
| query | comboId | integer | Không | minimum=1 | ID combo (ProgramComboID). |
| query | groupCode | string | Không |  |  |
| query | academicPeriodId | integer | Có | minimum=1 | ID kỳ học hoặc Block 3. |
| query | assessmentDeadline | string | Không | format="date-time" | Hạn xét điều kiện, gồm múi giờ. |
| query | courseId | integer | Không | minimum=1 | ID môn học (CourseID). |
| query | includeInProgress | string | Không |  |  |
| query | page | integer | Không | minimum=1 | Trang, bắt đầu từ 1. |
| query | limit | integer | Không | minimum=1 | Số bản ghi mỗi trang. |

Không có request body.

## GET /api/academic/course-demand/export

Xuất nhu cầu học theo môn, kỳ và Block

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | ojtSemesterId | integer | Có | minimum=1 | ID kỳ OJT. |
| query | programId | integer | Không | minimum=1 | ID phiên bản chương trình đào tạo. |
| query | cohortId | integer | Không | minimum=1 | ID khóa. |
| query | majorId | integer | Không | minimum=1 | ID chuyên ngành (SpecializationID). |
| query | comboId | integer | Không | minimum=1 | ID combo (ProgramComboID). |
| query | groupCode | string | Không |  |  |
| query | academicPeriodId | integer | Có | minimum=1 | ID kỳ học hoặc Block 3. |
| query | assessmentDeadline | string | Không | format="date-time" | Hạn xét điều kiện, gồm múi giờ. |
| query | courseId | integer | Không | minimum=1 | ID môn học (CourseID). |
| query | includeInProgress | string | Không |  |  |
| query | format | string | Không |  |  |

Không có request body.

## GET /api/academic/dashboard

Tổng quan và thống kê điều kiện OJT

Chọn section summary/statistics/all; thống kê hỗ trợ groupBy.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | ojtSemesterId | integer | Có | minimum=1 | ID kỳ OJT. |
| query | programId | integer | Không | minimum=1 | ID phiên bản chương trình đào tạo. |
| query | cohortId | integer | Không | minimum=1 | ID khóa. |
| query | majorId | integer | Không | minimum=1 | ID chuyên ngành (SpecializationID). |
| query | comboId | integer | Không | minimum=1 | ID combo (ProgramComboID). |
| query | groupCode | string | Không |  |  |
| query | academicPeriodId | integer | Không | minimum=1 | ID kỳ học hoặc Block 3. |
| query | assessmentDeadline | string | Không | format="date-time" | Hạn xét điều kiện, gồm múi giờ. |
| query | section | string ∈ "all", "summary", "statistics" | Không | default="all" |  |
| query | groupBy | string ∈ "cohort", "group", "major", "combo" | Không | default="cohort" |  |

Không có request body.

## POST /api/academic/eligibility-notifications

thông báo đủ/không đủ/chờ đối soát; tham chiếu snapshot/checkId và chống gửi lặp.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Có | minimum=1; maximum=2147483647 | ID kỳ OJT. |
| academicPeriodId | integer | Có | minimum=1; maximum=2147483647 | ID kỳ OJT. |
| scope | object | Không / theo điều kiện nghiệp vụ |  | Phạm vi áp dụng; các bộ lọc kết hợp đồng thời. |
| scope.programIds | array<integer> | Không / theo điều kiện nghiệp vụ |  | Danh sách ID phiên bản chương trình. |
| scope.cohortIds | array<integer> | Không / theo điều kiện nghiệp vụ |  | Danh sách ID khóa. |
| scope.majorIds | array<integer> | Không / theo điều kiện nghiệp vụ |  | Danh sách ID chuyên ngành. |
| scope.groupCodes | array<string ∈ "A", "B", "C", "D"> | Không / theo điều kiện nghiệp vụ |  |  |
| scope.studentIds | array<integer> | Không / theo điều kiện nghiệp vụ |  | Danh sách ID sinh viên. |
| studentIds | array<integer> | Không / theo điều kiện nghiệp vụ | minItems=1; maxItems=1000; uniqueItems=true | Danh sách ID sinh viên. |
| idempotencyKey | string | Có | maxLength=100 | Khóa chống trùng yêu cầu; dùng lại cùng khóa và dữ liệu khi gửi lại. |
| reason | string | Có | maxLength=2000 | Lý do thực hiện. |

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

## GET /api/assignments

Danh sách và hồ sơ phân công thực tập

Kèm sinh viên, doanh nghiệp, vị trí, đánh giá và kết quả OJT; lọc assignmentId để xem lịch sử.

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

Phân công sinh viên thực tập

Admin và Phòng QHDN dùng chung URL; chọn mẫu dữ liệu theo vai trò trong anyOf.

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

Cập nhật thông tin và trạng thái thực tập

Admin và Phòng QHDN dùng chung URL; chọn mẫu dữ liệu theo vai trò trong anyOf.

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

## GET /api/auth/me

Xem tài khoản đang đăng nhập

Kèm ID hồ sơ sinh viên hoặc doanh nghiệp liên kết.

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

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | page | integer | Không | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| query | limit | integer | Không | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| query | search | string | Không | maxLength=100 |  |
| query | status | string ∈ "PLANNED", "ACTIVE", "CLOSED", "ARCHIVED" | Không |  |  |

Không có request body.

## POST /api/cohorts

Tạo khóa và nhóm

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

## GET /api/combo-registration-windows

Danh sách đợt chọn combo

Sinh viên chỉ thấy đợt của mình, kèm lựa chọn hợp lệ, hạn gia hạn và lý do chưa thể nộp.

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

## PATCH /api/combo-registration-windows/{id}

Cập nhật hoặc mở/đóng đợt chọn combo

Giữ kiểm tra phạm vi, chốt danh sách và hạn đăng ký; status cần reason.

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
| status | string ∈ "OPEN", "CLOSED" | Không / theo điều kiện nghiệp vụ |  | Mở/đóng đợt; bắt buộc reason khi gửi status. |
| reason | string | Không / theo điều kiện nghiệp vụ | maxLength=2000 | Lý do thực hiện. |

## POST /api/combo-registration-windows/{id}/extensions

Gia hạn chọn combo

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

Tính tín chỉ, môn còn thiếu và điều kiện OJT; không lưu lựa chọn chính thức.

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

## GET /api/combo-registration-windows/{id}/selections

Theo dõi lựa chọn combo

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 | ID: WindowID trong ComboRegistrationWindows. |
| query | page | integer | Không | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| query | limit | integer | Không | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| query | status | string ∈ "SUBMITTED", "MISSING", "APPLIED", "UNSELECTED" | Không |  |  |

Không có request body.

## POST /api/combo-registration-windows/{id}/selections

Gửi lựa chọn combo

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

## PATCH /api/course-results/{id}

Sửa kết quả học tập và ghi lý do

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

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | page | integer | Không | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| query | limit | integer | Không | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| query | search | string | Không | maxLength=100 |  |

Không có request body.

## POST /api/courses

Tạo môn học

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

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 | ID: ProgramID. |

Không có request body.

## GET /api/curricula/{id}/ojt-grade-mappings/{semesterId}

Xem quy đổi điểm môn OJT

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 | ID: ProgramID. |
| path | semesterId | integer | Có | minimum=1 | ID kỳ OJT. |

Không có request body.

## PUT /api/curricula/{id}/ojt-grade-mappings/{semesterId}

Thiết lập quy đổi điểm môn OJT

Chọn môn, kỳ ghi nhận và thang quy đổi. Cấu hình đã dùng để xác nhận kết quả không được sửa.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 | ID: ProgramID. |
| path | semesterId | integer | Có | minimum=1 | ID kỳ OJT. |

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| courseId | integer | Có | minimum=1 | ID môn học (CourseID). |
| academicPeriodId | integer | Có | minimum=1 | ID kỳ học hoặc Block 3. |
| gradeBands | array<object> | Có | minItems=1; maxItems=30 | Mức quy đổi điểm; bắt đầu từ 0, không trùng mốc. |
| gradeBands[].minimumScore | number | Có | minimum=0; maximum=10 |  |
| gradeBands[].outcome | string ∈ "PASSED", "FAILED" | Có |  |  |
| gradeBands[].gradePoints | number | Không / theo điều kiện nghiệp vụ | minimum=0; maximum=4; nullable=true | Điểm quy đổi theo thang 4. |
| gradeBands[].grade | string | Không / theo điều kiện nghiệp vụ | maxLength=2; nullable=true |  |
| reason | string | Có | minLength=1; maxLength=2000 | Lý do thực hiện. |

## POST /api/curriculum-imports/commit

Nhập khung chương trình

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

## POST /api/curriculum-imports/preview

Kiểm tra dữ liệu nhập khung chương trình

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

## POST /api/eligibility-check-runs

Xét điều kiện OJT hàng loạt và cập nhật trạng thái

Truyền phạm vi sinh viên bằng JSON body. Trả kết quả ngay và ghi nhận kết quả chính thức trong cùng lần gọi; không cần xác nhận riêng.

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

## GET /api/enterprise/candidates

Danh sách và hồ sơ ứng viên

Lọc candidateId để xem một lần giới thiệu, kể cả lịch sử thuộc doanh nghiệp đăng nhập.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | companyId | integer | Có | minimum=1; maximum=2147483647 | ID doanh nghiệp. |
| query | studentId | integer | Không | minimum=1; maximum=2147483647 | ID hồ sơ sinh viên, khác ID tài khoản. |
| query | page | integer | Không | minimum=1; maximum=2147483647; default=1 | Trang, bắt đầu từ 1. |
| query | limit | integer | Không | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| query | ojtSemesterId | integer | Không | minimum=1; maximum=2147483647 | ID kỳ OJT. |
| query | positionId | integer | Không | minimum=1; maximum=2147483647 | ID vị trí thực tập. |
| query | search | string | Không | maxLength=100 |  |
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

Kèm người hướng dẫn, vị trí, đánh giá và kết quả; điểm chính thức chỉ hiển thị sau xác nhận.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | companyId | integer | Có | minimum=1; maximum=2147483647 | ID doanh nghiệp. |
| query | studentId | integer | Không | minimum=1; maximum=2147483647 | ID hồ sơ sinh viên, khác ID tài khoản. |
| query | page | integer | Không | minimum=1; maximum=2147483647; default=1 | Trang, bắt đầu từ 1. |
| query | limit | integer | Không | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
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

Giao nhiều task cho nhiều thực tập sinh

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| idempotencyKey | string | Có | maxLength=100 |  |
| assignmentIds | array<integer> | Có | minItems=1; maxItems=500; uniqueItems=true |  |
| tasks | array<object> | Có | minItems=1; maxItems=50 |  |
| tasks[].name | string | Có | maxLength=200 |  |
| tasks[].description | string | Không / theo điều kiện nghiệp vụ |  |  |
| tasks[].dueDate | string | Có | format="date" |  |

## POST /api/imports/archive

Lưu trữ tuyển dụng sau hai học kỳ

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Không có request body.

## POST /api/imports/commit

Import doanh nghiệp (QHDN) hoặc sinh viên (Phòng đào tạo/Admin)

ENTERPRISE: chỉ OJT_COORD được import, bắt buộc positions và windowId. Trùng email giữ nguyên mã doanh nghiệp, tài khoản và tin cũ; chỉ thêm tuyển dụng với mã vị trí mới. Code/email trỏ tới hai doanh nghiệp khác nhau bị từ chối. STUDENT: ADMIN/ACADEMIC import tài khoản, academic, placement và courseResults trong một giao dịch. CV dùng API upload hiện tại.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| kind | string ∈ "STUDENT", "ENTERPRISE" | Có |  |  |
| idempotencyKey | string | Có | maxLength=100 | Khóa chống trùng yêu cầu; dùng lại cùng khóa và dữ liệu khi gửi lại. |
| windowId | integer | Không / theo điều kiện nghiệp vụ |  | ID đợt đăng ký. |
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
  "windowId": 1,
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
| windowId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Required for ENTERPRISE |
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

ENTERPRISE: chỉ OJT_COORD được import, bắt buộc positions và windowId. Trùng email giữ nguyên mã doanh nghiệp, tài khoản và tin cũ; chỉ thêm tuyển dụng với mã vị trí mới. Code/email trỏ tới hai doanh nghiệp khác nhau bị từ chối. STUDENT: ADMIN/ACADEMIC import tài khoản, academic, placement và courseResults trong một giao dịch. CV dùng API upload hiện tại.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| kind | string ∈ "STUDENT", "ENTERPRISE" | Có |  |  |
| idempotencyKey | string | Có | maxLength=100 | Khóa chống trùng yêu cầu; dùng lại cùng khóa và dữ liệu khi gửi lại. |
| windowId | integer | Không / theo điều kiện nghiệp vụ |  | ID đợt đăng ký. |
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
  "windowId": 1,
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
| windowId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Required for ENTERPRISE |
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

Sinh viên xem hồ sơ của mình; Admin/QHDN xem được trước bàn giao. Kèm vị trí, doanh nghiệp, tin tuyển, CV đã dùng và trạng thái điều phối.

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

## GET /api/majors

Danh sách chuyên ngành

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

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| code | string | Có | maxLength=20 |  |
| name | string | Có | maxLength=200 |  |
| parentMajorId | integer | Có | minimum=1 | ID ngành cha (MajorID). |

## GET /api/ojt-coordinations

Danh sách và hồ sơ điều phối

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

Giới thiệu sinh viên cho doanh nghiệp

Áp dụng cho hồ sơ đã bàn giao; cần lý do và lưu nhật ký.

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

Ghi nhận quyết định tiếp nhận sinh viên

Admin hoặc Phòng QHDN ghi nhận thay doanh nghiệp; cần lý do.

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

Điều phối lại sinh viên

Chuyển hồ sơ bị từ chối sang vị trí khác; cần lý do.

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

## GET /api/ojt-registration-windows

Danh sách đợt đăng ký OJT

Sinh viên chỉ thấy đợt phù hợp, kèm kỳ học, hồ sơ đã nộp và điều kiện đăng ký.

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
| requiredRelativeSemester | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=20; default=5 | Metadata tương thích; quyền đăng ký dựa trên danh sách đã bàn giao. |

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
| requiredRelativeSemester | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=20; default=5 | Metadata tương thích; quyền đăng ký dựa trên danh sách đã bàn giao. |
| status | string ∈ "OPEN", "CLOSED" | Không / theo điều kiện nghiệp vụ |  | Mở/đóng đợt; bắt buộc reason khi gửi status. |

## POST /api/ojt-registration-windows/{id}/semester-exceptions

Thêm ngoại lệ kỳ đăng ký OJT

Chỉ áp dụng cho sinh viên, kỳ và thời hạn được chỉ định; cần lý do.

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

Hồ sơ đăng ký: QHDN xem các hồ sơ thuộc danh sách được bàn giao, STUDENT chỉ xem hồ sơ của mình. status/registrationStatus trả LEGACY_REVIEW_REQUIRED cho HANDED_OFF cũ; legacyStatus giữ nguyên giá trị lịch sử. handoffStatus luôn lấy từ bảng bàn giao.

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

STUDENT nộp hồ sơ của mình; ADMIN/OJT_COORD có thể nhập thay với studentId. Bắt buộc thuộc danh sách đã bàn giao cùng kỳ, đợt OPEN và trong thời hạn, đúng scope.

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

ADMIN/OJT_COORD duyệt hoặc từ chối hồ sơ đã nộp; không phải bước xét/bàn giao của ACADEMIC. Hồ sơ đã điều phối không được duyệt lại.

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

resultId là OJTResults.ResultID. Chỉ kết quả được ACADEMIC xác nhận mới chính thức. Sinh viên chỉ xem CONFIRMED.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| query | resultId | integer | Không | minimum=1 |  |
| query | studentId | integer | Không | minimum=1 |  |
| query | ojtSemesterId | integer | Không | minimum=1 |  |
| query | page | integer | Không | minimum=1 |  |
| query | limit | integer | Không | minimum=1 |  |
| query | status | string ∈ "PENDING_ACADEMIC_CONFIRMATION", "REVISION_REQUESTED", "CONFIRMED" | Không |  |  |
| query | search | string | Không |  |  |

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

Dùng bảng quy đổi điểm đã cấu hình; lưu StudentCourseResults và CONFIRMED trong cùng transaction. Không ghi đè điểm học vụ đang tồn tại.

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

Điều kiện: tối thiểu 70 tín chỉ và tối đa 2 môn còn nợ.

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

## PATCH /api/ojt-rule-sets/{id}

Sửa bộ quy tắc chưa ban hành

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 | ID: RuleSetID. |

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| programId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID phiên bản chương trình đào tạo. |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; nullable=true | ID kỳ OJT. |
| version | integer | Không / theo điều kiện nghiệp vụ | minimum=1 |  |
| name | string | Không / theo điều kiện nghiệp vụ | maxLength=200 |  |
| minCredits | number ∈ 70 | Không / theo điều kiện nghiệp vụ | default=70 |  |
| maxUnpassedCourses | integer ∈ 2 | Không / theo điều kiện nghiệp vụ | default=2 |  |
| debtBasis | string ∈ "FAILED_ATTEMPTS" | Không / theo điều kiện nghiệp vụ | default="FAILED_ATTEMPTS" |  |

## POST /api/ojt-rule-sets/{id}/publish

Ban hành bộ quy tắc OJT

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 | ID: RuleSetID. |

Không có request body.

## GET /api/ojt-semesters/{id}/assessment-window

Xem đợt xét điều kiện chính thức

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 | ID: OJTSemesterID. |

Không có request body.

## PUT /api/ojt-semesters/{id}/assessment-window

Thiết lập đợt xét điều kiện chính thức

Thiết lập khi còn nháp. Thời điểm mở sau khi Block 3 kết thúc.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 | ID: OJTSemesterID. |

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| blockPeriodId | integer | Có | minimum=1 | ID Block 3 dùng xét điều kiện. |
| opensAt | string | Có | format="date-time" |  |
| closesAt | string | Có | format="date-time" |  |
| reason | string | Có | minLength=1; maxLength=2000 | Lý do thực hiện. |
| assessmentAcademicPeriodId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID kỳ OJT. |
| requiredRelativeSemester | integer ∈ 5 | Không / theo điều kiện nghiệp vụ | default=5 | Kỳ chuyên ngành cho phép đăng ký; mặc định 5. |

## POST /api/ojt-semesters/{id}/assessment-window/close

Đóng xét điều kiện chính thức

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 | ID: OJTSemesterID. |

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| reason | string | Có | minLength=1; maxLength=2000 | Lý do thực hiện. |

## POST /api/ojt-semesters/{id}/assessment-window/open

Mở xét điều kiện chính thức

Cần xác nhận đã cập nhật xong điểm. Kết quả kiểm tra trước mốc xác nhận phải được chạy lại.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 | ID: OJTSemesterID. |

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| reason | string | Có | minLength=1; maxLength=2000 | Lý do thực hiện. |
| resultsFinalized | boolean ∈ true | Có |  | Xác nhận đã hoàn tất cập nhật điểm. |
| reopen | boolean | Không / theo điều kiện nghiệp vụ |  | Explicitly reopen a closed assessment, invalidate previous official revision, and audit the reason. |
| closesAt | string | Không / theo điều kiện nghiệp vụ | format="date-time" | Hạn xét điều kiện, gồm múi giờ. |

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

## POST /api/ojt-semesters/{id}/eligible-student-handoffs

Bàn giao sinh viên đủ điều kiện cho QHDN trước đăng ký

ACADEMIC chọn studentIds có kết quả ELIGIBLE đã xác nhận và còn hiệu lực cho kỳ OJT. Không yêu cầu hồ sơ đăng ký; không đổi trạng thái hồ sơ lịch sử. registrationIds không còn là đầu vào.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 | ID: OJTSemesterID. |

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| studentIds | array<integer> | Có | minItems=1; maxItems=1000; uniqueItems=true |  |
| idempotencyKey | string | Có |  |  |
| reason | string | Có |  |  |

## GET /api/ojt-semesters/{id}/results/export

Xuất danh sách điểm OJT chính thức

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 |  |
| query | resultId | integer | Không | minimum=1 |  |
| query | studentId | integer | Không | minimum=1 |  |
| query | ojtSemesterId | integer | Không | minimum=1 |  |
| query | status | string ∈ "PENDING_ACADEMIC_CONFIRMATION", "REVISION_REQUESTED", "CONFIRMED" | Không |  |  |
| query | search | string | Không |  |  |
| query | format | string ∈ "csv", "json", "pdf" | Không |  |  |

Không có request body.

## GET /api/ojt-semesters/{id}/students

Theo dõi trạng thái OJT theo kỳ

Danh sách theo kỳ: QHDN chỉ thấy sinh viên được bàn giao, kể cả chưa đăng ký. registration, handoff, officialEligibility, assignment là các quy trình độc lập.

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

## POST /api/student/academic-summary/search

tín chỉ đã đạt/đang học/thiếu; môn nợ/chưa học/đang học. Kịch bản đạt ngưỡng không phải xác suất AI

Gửi một JSON object chứa ID, bộ lọc và dữ liệu nghiệp vụ. Không truyền path/query parameters.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Có | minimum=1; maximum=2147483647 | ID kỳ OJT. |
| studentId | integer | Có | minimum=1; maximum=2147483647 | StudentID của sinh viên đang đăng nhập; phải khớp tài khoản được xác thực. |

## PATCH /api/student/accounts/me/profile/update

Cập nhật hồ sơ cá nhân

Gửi một JSON object chứa ID, bộ lọc và dữ liệu nghiệp vụ. Không truyền path/query parameters.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| fullName | string | Không / theo điều kiện nghiệp vụ | minLength=1; maxLength=150 |  |
| phone | string | Không / theo điều kiện nghiệp vụ | maxLength=20; nullable=true |  |

## POST /api/student/assignments/current/search

DN/vị trí/giám sát/thời gian của mình theo kỳ

Gửi một JSON object chứa ID, bộ lọc và dữ liệu nghiệp vụ. Không truyền path/query parameters.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID kỳ OJT. |
| studentId | integer | Có | minimum=1; maximum=2147483647 | StudentID của sinh viên đang đăng nhập; phải khớp tài khoản được xác thực. |

## POST /api/student/auth/change-password

Đổi mật khẩu

Gửi một JSON object chứa ID, bộ lọc và dữ liệu nghiệp vụ. Không truyền path/query parameters. Token cũ bị thu hồi; cần đăng nhập lại.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| currentPassword | string | Có | format="password" |  |
| newPassword | string | Có | format="password"; minLength=12 | Maximum 72 UTF-8 bytes |

## POST /api/student/auth/me/search

Xem tài khoản đang đăng nhập

Gửi một JSON object chứa ID, bộ lọc và dữ liệu nghiệp vụ. Không truyền path/query parameters. Kèm ID hồ sơ sinh viên hoặc doanh nghiệp liên kết.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

Schema: object

## POST /api/student/combo-registration-windows/preview

Xem ảnh hưởng của combo dự kiến

Gửi một JSON object chứa ID, bộ lọc và dữ liệu nghiệp vụ. Không truyền path/query parameters. Tính tín chỉ, môn còn thiếu và điều kiện OJT; không lưu lựa chọn chính thức.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| studentId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID hồ sơ sinh viên, khác ID tài khoản. |
| comboId | integer | Có | minimum=1 | ID combo (ProgramComboID). |
| courseIds | array<integer> | Có | minItems=1; uniqueItems=true | Danh sách ID môn học. |
| windowId | integer | Có | minimum=1 | windowId của tài nguyên cần truy cập. |

## POST /api/student/combo-registration-windows/search

Danh sách đợt chọn combo

Gửi một JSON object chứa ID, bộ lọc và dữ liệu nghiệp vụ. Không truyền path/query parameters. Sinh viên chỉ thấy đợt của mình, kèm lựa chọn hợp lệ, hạn gia hạn và lý do chưa thể nộp.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| phase | string ∈ "INITIAL", "CONFIRMATION" | Không / theo điều kiện nghiệp vụ |  |  |
| status | string ∈ "DRAFT", "OPEN", "CLOSED", "FINALIZED" | Không / theo điều kiện nghiệp vụ |  |  |
| academicPeriodId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID kỳ học hoặc Block 3. |
| studentId | integer | Có | minimum=1; maximum=2147483647 | StudentID của sinh viên đang đăng nhập; phải khớp tài khoản được xác thực. |

## POST /api/student/combo-registration-windows/selections

Gửi lựa chọn combo

Gửi một JSON object chứa ID, bộ lọc và dữ liệu nghiệp vụ. Không truyền path/query parameters.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| studentId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID hồ sơ sinh viên, khác ID tài khoản. |
| comboId | integer | Có | minimum=1 | ID combo (ProgramComboID). |
| courseIds | array<integer> | Có | maxItems=500; uniqueItems=true | Danh sách ID môn học. |
| reason | string | Không / theo điều kiện nghiệp vụ | maxLength=2000 | Lý do thực hiện. |
| windowId | integer | Có | minimum=1 | windowId của tài nguyên cần truy cập. |

## POST /api/student/combo-selections/search

Lịch sử lựa chọn combo của sinh viên

Gửi một JSON object chứa ID, bộ lọc và dữ liệu nghiệp vụ. Không truyền path/query parameters.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| studentId | integer | Có | minimum=1 | studentId của tài nguyên cần truy cập. |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |

## POST /api/student/course-results/search

Điểm, lần học và trạng thái môn

Gửi một JSON object chứa ID, bộ lọc và dữ liệu nghiệp vụ. Không truyền path/query parameters. Mỗi bản ghi giữ ID và bổ sung thông tin liên quan để hiển thị; quan hệ không tồn tại trả null.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| studentId | integer | Có | minimum=1 | studentId của tài nguyên cần truy cập. |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| courseId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID môn học (CourseID). |
| academicPeriodId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID kỳ học hoặc Block 3. |
| status | string ∈ "PASSED", "FAILED", "IN_PROGRESS", "WITHDRAWN", "RECOGNIZED" | Không / theo điều kiện nghiệp vụ |  |  |

## POST /api/student/curriculum/search

chương trình đã ban hành của mình

Gửi một JSON object chứa ID, bộ lọc và dữ liệu nghiệp vụ. Không truyền path/query parameters.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| studentId | integer | Có | minimum=1; maximum=2147483647 | StudentID của sinh viên đang đăng nhập; phải khớp tài khoản được xác thực. |

## POST /api/student/cv/download

Tải CV của sinh viên

Gửi một JSON object chứa ID, bộ lọc và dữ liệu nghiệp vụ. Không truyền path/query parameters. QHDN được xem CV sinh viên đã có bàn giao; không yêu cầu sinh viên phải đăng ký trước.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| studentId | integer | Có | minimum=1 | studentId của tài nguyên cần truy cập. |
| cvFileId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 |  |

## POST /api/student/dashboard/search

tổng hợp; không tạo thuật toán học vụ mới

Gửi một JSON object chứa ID, bộ lọc và dữ liệu nghiệp vụ. Không truyền path/query parameters.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Có | minimum=1; maximum=2147483647 | ID kỳ OJT. |
| studentId | integer | Có | minimum=1; maximum=2147483647 | StudentID của sinh viên đang đăng nhập; phải khớp tài khoản được xác thực. |

## POST /api/student/eligibility-checks/search

Lịch sử kiểm tra điều kiện OJT

Gửi một JSON object chứa ID, bộ lọc và dữ liệu nghiệp vụ. Không truyền path/query parameters.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| studentId | integer | Có | minimum=1 | studentId của tài nguyên cần truy cập. |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID kỳ OJT. |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Số bản ghi mỗi trang. |

## POST /api/student/eligibility/search

Kết quả OJT và điều kiện còn thiếu

Gửi một JSON object chứa ID, bộ lọc và dữ liệu nghiệp vụ. Không truyền path/query parameters.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| studentId | integer | Có | minimum=1 | studentId của tài nguyên cần truy cập. |
| ojtSemesterId | integer | Có | minimum=1 | ID kỳ OJT. |

## POST /api/student/internship-tasks/search

Danh sách task trong phạm vi tài khoản

Gửi một JSON object chứa ID, bộ lọc và dữ liệu nghiệp vụ. Không truyền path/query parameters. Mỗi bản ghi giữ ID và bổ sung thông tin liên quan để hiển thị; quan hệ không tồn tại trả null.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| companyId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 |  |
| studentId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 |  |
| positionId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 |  |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 |  |
| assignmentId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 |  |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1 |  |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1 |  |

## POST /api/student/job-applications/create

Ứng tuyển vị trí doanh nghiệp

Gửi một JSON object chứa ID, bộ lọc và dữ liệu nghiệp vụ. Không truyền path/query parameters. Cần hồ sơ OJT của mình, xác nhận ELIGIBLE còn hiệu lực, đợt đăng ký sinh viên đang mở, tin đã công bố còn hạn và vị trí còn chỉ tiêu. Lưu doanh nghiệp/vị trí, kết quả chính thức và phiên bản CV hiện tại. Không tự bàn giao hoặc điều phối.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| registrationId | integer | Có | minimum=1 |  |
| postId | integer | Có | minimum=1 |  |
| positionId | integer | Có | minimum=1 |  |
| coverLetter | string | Không / theo điều kiện nghiệp vụ | maxLength=5000 |  |

## POST /api/student/job-applications/search

Danh sách hồ sơ ứng tuyển doanh nghiệp

Gửi một JSON object chứa ID, bộ lọc và dữ liệu nghiệp vụ. Không truyền path/query parameters. Sinh viên xem hồ sơ của mình; Admin/QHDN xem được trước bàn giao. Kèm vị trí, doanh nghiệp, tin tuyển, CV đã dùng và trạng thái điều phối.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| applicationId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 |  |
| studentId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 |  |
| registrationId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 |  |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 |  |
| companyId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 |  |
| positionId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 |  |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1 |  |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1 |  |
| status | string ∈ "SUBMITTED", "REVIEWING", "INTERVIEW", "OFFERED", "ACCEPTED", "REJECTED", "WITHDRAWN" | Không / theo điều kiện nghiệp vụ |  |  |

## POST /api/student/notifications/search

thông báo/lọc unread/phân trang, trả unreadCount cùng response

Gửi một JSON object chứa ID, bộ lọc và dữ liệu nghiệp vụ. Không truyền path/query parameters. Mỗi bản ghi giữ ID và bổ sung thông tin liên quan để hiển thị; quan hệ không tồn tại trả null.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| unread | string ∈ "true", "false" | Không / theo điều kiện nghiệp vụ |  |  |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100 | Số bản ghi mỗi trang. |

## PATCH /api/student/notifications/update

người nhận đánh dấu đọc, idempotent

Gửi một JSON object chứa ID, bộ lọc và dữ liệu nghiệp vụ. Không truyền path/query parameters.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| isRead | boolean | Có |  |  |
| notificationId | integer | Có | minimum=1; maximum=2147483647 | notificationId của tài nguyên cần truy cập. |

## POST /api/student/ojt-registration-windows/search

Danh sách đợt đăng ký OJT

Gửi một JSON object chứa ID, bộ lọc và dữ liệu nghiệp vụ. Không truyền path/query parameters. Sinh viên chỉ thấy đợt phù hợp, kèm kỳ học, hồ sơ đã nộp và điều kiện đăng ký.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID kỳ OJT. |
| status | string ∈ "DRAFT", "OPEN", "CLOSED" | Không / theo điều kiện nghiệp vụ |  | Lọc theo trạng thái; bỏ trường này để xem tất cả. |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| studentId | integer | Có | minimum=1; maximum=2147483647 | StudentID của sinh viên đang đăng nhập; phải khớp tài khoản được xác thực. |

## POST /api/student/ojt-registrations/create

Nộp hồ sơ đăng ký OJT

Gửi một JSON object chứa ID, bộ lọc và dữ liệu nghiệp vụ. Không truyền path/query parameters. STUDENT nộp hồ sơ của mình; ADMIN/OJT_COORD có thể nhập thay với studentId. Bắt buộc thuộc danh sách đã bàn giao cùng kỳ, đợt OPEN và trong thời hạn, đúng scope.

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

## POST /api/student/ojt-registrations/search

Danh sách hồ sơ đăng ký OJT

Gửi một JSON object chứa ID, bộ lọc và dữ liệu nghiệp vụ. Không truyền path/query parameters. Hồ sơ đăng ký: QHDN xem các hồ sơ thuộc danh sách được bàn giao, STUDENT chỉ xem hồ sơ của mình. status/registrationStatus trả LEGACY_REVIEW_REQUIRED cho HANDED_OFF cũ; legacyStatus giữ nguyên giá trị lịch sử. handoffStatus luôn lấy từ bảng bàn giao.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID kỳ OJT. |
| windowId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID đợt đăng ký. |
| studentId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID hồ sơ sinh viên, khác ID tài khoản. |
| programId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID phiên bản chương trình đào tạo. |
| cohortId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID khóa. |
| groupCode | string ∈ "A", "B", "C", "D" | Không / theo điều kiện nghiệp vụ |  |  |
| status | string ∈ "SUBMITTED", "APPROVED", "REJECTED", "HANDED_OFF" | Không / theo điều kiện nghiệp vụ |  | Lọc theo trạng thái; bỏ trường này để xem tất cả. |
| search | string | Không / theo điều kiện nghiệp vụ |  |  |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| registrationId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Chọn một hồ sơ để trả thêm phần chi tiết. |
| historyPage | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Phân trang history; chỉ dùng cùng registrationId. |
| historyLimit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Phân trang history; chỉ dùng cùng registrationId. |
| coordinationPage | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Phân trang coordination; chỉ dùng cùng registrationId. |
| coordinationLimit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Phân trang coordination; chỉ dùng cùng registrationId. |
| assignmentPage | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 | Phân trang assignment; chỉ dùng cùng registrationId. |
| assignmentLimit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 | Phân trang assignment; chỉ dùng cùng registrationId. |

## POST /api/student/ojt-results/detail

điểm/nhận xét đã công bố

Gửi một JSON object chứa ID, bộ lọc và dữ liệu nghiệp vụ. Không truyền path/query parameters.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| resultId | integer | Có | minimum=1; maximum=2147483647 | resultId của tài nguyên cần truy cập. |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID kỳ OJT. |

## POST /api/student/ojt-results/search

chỉ kết quả của mình được công bố

Gửi một JSON object chứa ID, bộ lọc và dữ liệu nghiệp vụ. Không truyền path/query parameters. Mỗi bản ghi giữ ID và bổ sung thông tin liên quan để hiển thị; quan hệ không tồn tại trả null.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | ID kỳ OJT. |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=2147483647 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100 | Số bản ghi mỗi trang. |

## POST /api/student/ojt-semesters/students/search

Theo dõi trạng thái OJT theo kỳ

Gửi một JSON object chứa ID, bộ lọc và dữ liệu nghiệp vụ. Không truyền path/query parameters. Danh sách theo kỳ: QHDN chỉ thấy sinh viên được bàn giao, kể cả chưa đăng ký. registration, handoff, officialEligibility, assignment là các quy trình độc lập.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Có | minimum=1 | ojtSemesterId của tài nguyên cần truy cập. |
| programId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID phiên bản chương trình đào tạo. |
| cohortId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID khóa. |
| groupCode | string | Không / theo điều kiện nghiệp vụ |  |  |
| registrationStatus | string | Không / theo điều kiện nghiệp vụ |  |  |
| search | string | Không / theo điều kiện nghiệp vụ |  |  |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Trang, bắt đầu từ 1. |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Số bản ghi mỗi trang. |
| enterpriseId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | Filters the latest coordination and its assignment; QHDN remains restricted to handed-off students. |
| coordinationStatus | string ∈ "NOT_COORDINATED", "PENDING", "ACCEPTED", "REJECTED" | Không / theo điều kiện nghiệp vụ |  | Filters the latest coordination and its assignment; QHDN remains restricted to handed-off students. |
| assignmentStatus | string ∈ "UNASSIGNED", "ASSIGNED", "ACTIVE", "IN_PROGRESS", "COMPLETED", "CANCELLED", "CANCELED", "FAILED" | Không / theo điều kiện nghiệp vụ |  | Filters the latest coordination and its assignment; QHDN remains restricted to handed-off students. |

## POST /api/student/opportunities/search

Vị trí tuyển dụng và quyền ứng tuyển

Gửi một JSON object chứa ID, bộ lọc và dữ liệu nghiệp vụ. Không truyền path/query parameters. Tin đã công bố còn hạn, kèm doanh nghiệp, yêu cầu, chỉ tiêu, hồ sơ đã ứng tuyển, canApply và lý do bị chặn. Dự báo AI không cấp quyền ứng tuyển. Mỗi bản ghi giữ ID và bổ sung thông tin liên quan để hiển thị; quan hệ không tồn tại trả null.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Có | minimum=1 |  |
| page | integer | Không / theo điều kiện nghiệp vụ | minimum=1 |  |
| limit | integer | Không / theo điều kiện nghiệp vụ | minimum=1 |  |
| studentId | integer | Có | minimum=1; maximum=2147483647 | StudentID của sinh viên đang đăng nhập; phải khớp tài khoản được xác thực. |

## POST /api/student/profile/detail

Hồ sơ học vụ tổng hợp

Gửi một JSON object chứa ID, bộ lọc và dữ liệu nghiệp vụ. Không truyền path/query parameters. Kèm GPA, tín chỉ, điểm, combo và OJT; section=academicProgress chỉ lấy thông tin sinh viên và tiến độ, mặc định all.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| studentId | integer | Có | minimum=1 | studentId của tài nguyên cần truy cập. |
| resultsPage | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 |  |
| resultsLimit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 |  |
| ojtPage | integer | Không / theo điều kiện nghiệp vụ | minimum=1; default=1 |  |
| ojtLimit | integer | Không / theo điều kiện nghiệp vụ | minimum=1; maximum=100; default=20 |  |
| ojtSemesterId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID kỳ OJT. |
| section | string ∈ "all", "academicProgress" | Không / theo điều kiện nghiệp vụ | default="all" | all: hồ sơ đầy đủ; academicProgress: thông tin sinh viên và tiến độ học tập. |

## POST /api/student/roadmap-recommendations/search

tư vấn AI lộ trình; khác đề xuất môn bằng quy tắc

Gửi một JSON object chứa ID, bộ lọc và dữ liệu nghiệp vụ. Không truyền path/query parameters.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Có | minimum=1; maximum=2147483647 | ID kỳ OJT. |
| studentId | integer | Có | minimum=1; maximum=2147483647 | StudentID của sinh viên đang đăng nhập; phải khớp tài khoản được xác thực. |

## POST /api/student/supplementary-course-options/search

đề xuất môn/môn học lại, tín chỉ, lý do và tiên quyết; không lớp, không đăng ký học, không cam kết lịch

Gửi một JSON object chứa ID, bộ lọc và dữ liệu nghiệp vụ. Không truyền path/query parameters.

Xác thực: Bearer token; role/ownership theo chức năng.

Không có tham số URL/query.

Body: application/json — bắt buộc.

| Trường JSON | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- |
| ojtSemesterId | integer | Có | minimum=1; maximum=2147483647 | ID kỳ OJT. |
| studentId | integer | Có | minimum=1; maximum=2147483647 | StudentID của sinh viên đang đăng nhập; phải khớp tài khoản được xác thực. |

## GET /api/students

Tìm kiếm và lọc sinh viên

Mỗi bản ghi giữ ID và bổ sung thông tin liên quan để hiển thị; quan hệ không tồn tại trả null.

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
| query | currentSemester | integer | Không | minimum=1 | Kỳ chuyên ngành hiện tại, tính từ lộ trình thực tế. |

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

Kèm GPA, tín chỉ, điểm, combo và OJT; section=academicProgress chỉ lấy thông tin sinh viên và tiến độ, mặc định all.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 | ID: StudentID. |
| query | resultsPage | integer | Không | minimum=1; default=1 |  |
| query | resultsLimit | integer | Không | minimum=1; maximum=100; default=20 |  |
| query | ojtPage | integer | Không | minimum=1; default=1 |  |
| query | ojtLimit | integer | Không | minimum=1; maximum=100; default=20 |  |
| query | ojtSemesterId | integer | Không | minimum=1 | ID kỳ OJT. |
| query | section | string ∈ "all", "academicProgress" | Không | default="all" | all: hồ sơ đầy đủ; academicProgress: thông tin sinh viên và tiến độ học tập. |

Không có request body.

## PATCH /api/students/{id}

Cập nhật hồ sơ và lộ trình học vụ

Chỉ gửi trường cần sửa; placement chứa khóa, nhóm và kỳ học.

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
| placement | object | Không / theo điều kiện nghiệp vụ |  | Chỉ gửi trường lộ trình cần sửa. Lần đầu cần khóa, nhóm và kỳ hiện tại. |
| placement.cohortId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID khóa. |
| placement.groupCode | string ∈ "A", "B", "C", "D" | Không / theo điều kiện nghiệp vụ |  |  |
| placement.entryAcademicPeriodId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID kỳ bắt đầu chuyên ngành thực tế; mặc định theo khóa/nhóm. |
| placement.currentAcademicPeriodId | integer | Không / theo điều kiện nghiệp vụ | minimum=1 | ID kỳ/Block đang học; bắt buộc khi gán lần đầu. |

## GET /api/students/{id}/combo-selections

Lịch sử lựa chọn combo của sinh viên

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 | ID: StudentID. |
| query | page | integer | Không | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| query | limit | integer | Không | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |

Không có request body.

## GET /api/students/{id}/course-results

Điểm, lần học và trạng thái môn

Mỗi bản ghi giữ ID và bổ sung thông tin liên quan để hiển thị; quan hệ không tồn tại trả null.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 | ID: StudentID. |
| query | page | integer | Không | minimum=1; default=1 | Trang, bắt đầu từ 1. |
| query | limit | integer | Không | minimum=1; maximum=100; default=20 | Số bản ghi mỗi trang. |
| query | courseId | integer | Không | minimum=1 | ID môn học (CourseID). |
| query | academicPeriodId | integer | Không | minimum=1 | ID kỳ học hoặc Block 3. |
| query | status | string ∈ "PASSED", "FAILED", "IN_PROGRESS", "WITHDRAWN", "RECOGNIZED" | Không |  |  |

Không có request body.

## GET /api/students/{id}/cv

Tải CV của sinh viên

QHDN được xem CV sinh viên đã có bàn giao; không yêu cầu sinh viên phải đăng ký trước.

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 |  |
| query | cvFileId | integer | Không | minimum=1 |  |

Không có request body.

## GET /api/students/{id}/eligibility

Kết quả OJT và điều kiện còn thiếu

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 | ID: StudentID. |
| query | ojtSemesterId | integer | Có | minimum=1 | ID kỳ OJT. |

Không có request body.

## GET /api/students/{id}/eligibility-checks

Lịch sử kiểm tra điều kiện OJT

Xác thực: Bearer token; role/ownership theo chức năng.

| Vị trí | Tên | Kiểu | Bắt buộc | Ràng buộc | Ý nghĩa |
| --- | --- | --- | --- | --- | --- |
| path | id | integer | Có | minimum=1 | ID: StudentID. |
| query | ojtSemesterId | integer | Không | minimum=1 | ID kỳ OJT. |
| query | page | integer | Không | minimum=1 | Trang, bắt đầu từ 1. |
| query | limit | integer | Không | minimum=1 | Số bản ghi mỗi trang. |

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
