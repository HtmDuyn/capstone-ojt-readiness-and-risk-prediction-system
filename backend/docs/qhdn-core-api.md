# API nghiệp vụ cốt lõi QHDN

Cập nhật: 12/10/2026. Base path `/api`. Header `Authorization: Bearer <JWT>`.
Response thành công: `{ "success": true, "data": ... }`. Danh sách trả `data: {items,total,page,limit}`; mặc định page=1, limit=20, tối đa 100.

## Quyền truy cập

- ADMIN/OJT_COORD: quản lý doanh nghiệp, vị trí, điều phối, phân công; đọc các hồ sơ nghiệp vụ.
- ENTERPRISE: đọc doanh nghiệp/vị trí/điều phối/phân công/đánh giá thuộc doanh nghiệp của mình; quyết định tiếp nhận và nộp đánh giá. Không được quản lý danh mục, gửi điều phối hoặc tạo/sửa phân công.
- Phạm vi ENTERPRISE lấy từ `EnterpriseUsers.UserID` và doanh nghiệp ACTIVE. Không lấy companyId từ body để xác định quyền. Danh sách ngoài phạm vi trả rỗng; xem/sửa chi tiết ngoài phạm vi trả 403. Tài khoản chưa liên kết doanh nghiệp nhận 403.
- STUDENT/ACADEMIC không truy cập module mới. Các API học vụ hiện có giữ nguyên quyền.
- Mọi thao tác ghi yêu cầu `reason`. AuditLogs ghi người thao tác, vai trò, lý do và dữ liệu trước/sau. Khi OJT_COORD quyết định hoặc nộp/cập nhật đánh giá thay DN, audit có `enteredOnBehalf: true`.

`companyId` trong module này tương ứng `Enterprises.EnterpriseID`. API danh sách sinh viên bàn giao hiện có dùng tên query `enterpriseId`.

## Danh sách endpoint

| Method | Endpoint | Quyền | Input |
| --- | --- | --- | --- |
| GET | `/companies` | Staff/DN | search, status, page, limit |
| GET | `/companies/:id` | Staff/DN | ID doanh nghiệp |
| POST | `/companies` | Staff | code, name, thông tin liên hệ, status, reason |
| PATCH | `/companies/:id` | Staff | Trường cần sửa và reason |
| GET | `/positions` | Staff/DN | companyId, ojtSemesterId, status, search, page, limit |
| GET | `/positions/:id` | Staff/DN | ID vị trí |
| POST | `/positions` | Staff | companyId, ojtSemesterId, title, capacity, description, requirements, status, reason |
| PATCH | `/positions/:id` | Staff | title, capacity, description, requirements, status, reason |
| GET | `/ojt-coordinations` | Staff/DN | companyId, ojtSemesterId, studentId, positionId, registrationId, decision/status, search, page, limit |
| GET | `/ojt-coordinations/:id` | Staff/DN | Chi tiết, application, lịch sử điều phối và audit |
| POST | `/ojt-coordinations` | Staff | registrationId, positionId, reason, idempotencyKey |
| POST | `/ojt-coordinations/:id/decision` | DN hoặc Staff nhập thay | decision, reason |
| POST | `/ojt-coordinations/:id/reassign` | Staff | positionId, reason, idempotencyKey |
| GET | `/assignments` | Staff/DN | companyId, ojtSemesterId, studentId, positionId, status, search, page, limit |
| GET | `/assignments/:id` | Staff/DN | Chi tiết và audit |
| POST | `/assignments` | Staff | coordinationId, startDate, endDate, enterpriseSupervisorName, reason |
| PATCH | `/assignments/:id` | Staff | startDate, endDate, enterpriseSupervisorName, reason |
| PATCH | `/assignments/:id/status` | Staff | status, reason |
| GET | `/internship-evaluations` | Staff/DN | companyId, ojtSemesterId, studentId, positionId, assignmentId, status, search, page, limit |
| GET | `/internship-evaluations/:id` | Staff/DN | Điểm, nhận xét, người đánh giá, audit |
| PUT | `/assignments/:id/internship-evaluation` | DN hoặc Staff nhập thay | completionScore, attitudeScore, skillScore, overallScore, comments, reason |

Staff = ADMIN/OJT_COORD; DN = ENTERPRISE trong phạm vi doanh nghiệp.

## Ví dụ body và quy tắc

### 1. Doanh nghiệp

```json
{
  "code": "DN001",
  "name": "Công ty Công nghệ ABC",
  "address": "Hà Nội",
  "industry": "Công nghệ thông tin",
  "contactPersonName": "Nguyễn Văn A",
  "contactPhone": "0901234567",
  "contactEmail": "hr@example.com",
  "status": "ACTIVE",
  "reason": "Bổ sung doanh nghiệp đối tác"
}
```

Bắt buộc code (20 ký tự), name (200 ký tự), reason (2.000 ký tự). Status ACTIVE mặc định hoặc INACTIVE. PATCH yêu cầu ít nhất một trường chỉnh sửa. Không vô hiệu hóa DN khi còn phân công ASSIGNED/ACTIVE/IN_PROGRESS. Mã trùng trả 409. Không có API xóa để bảo toàn lịch sử.

### 2. Vị trí/chỉ tiêu

```json
{
  "companyId": 1,
  "ojtSemesterId": 1,
  "title": "Backend Intern",
  "description": "Phát triển API",
  "requirements": "Node.js và SQL",
  "capacity": 5,
  "status": "OPEN",
  "reason": "Mở chỉ tiêu kỳ OJT"
}
```

Capacity là số nguyên dương. Status OPEN mặc định hoặc CLOSED. Backend tự tính remainingSlots; không nhận số chỗ còn lại từ client. Company/kỳ không đổi sau tạo. OPEN yêu cầu doanh nghiệp ACTIVE; capacity không được thấp hơn số chỗ đã dùng. Chỉ các phân công CANCELLED/CANCELED mới trả lại chỗ; COMPLETED/FAILED vẫn tính vào chỉ tiêu của kỳ.

### 3. Điều phối và quyết định

```json
{
  "registrationId": 1,
  "positionId": 1,
  "reason": "Gửi hồ sơ phù hợp tới doanh nghiệp",
  "idempotencyKey": "coord-registration-1-attempt-1"
}
```

Hồ sơ phải có trạng thái HANDED_OFF và bản ghi bàn giao khớp sinh viên/kỳ. Vị trí phải cùng kỳ, OPEN, DN ACTIVE và còn chỉ tiêu. POST lần đầu không được tạo lượt thứ hai cho cùng đăng ký; dùng reassign sau khi bị từ chối.

Trạng thái: PENDING → ACCEPTED hoặc REJECTED. Chỉ lượt mới nhất được quyết định/điều phối lại. Quyết định đã chốt không đổi sang quyết định khác.

```json
{ "decision": "REJECTED", "reason": "Vị trí không phù hợp với hồ sơ" }
```

Decision chỉ nhận ACCEPTED/REJECTED. Lý do từ chối tối đa 300 ký tự. Chấp nhận phải kiểm tra lại vị trí và sức chứa. DN không tự tạo phân công khi chấp nhận.

```json
{
  "positionId": 2,
  "reason": "Điều phối sang vị trí khác sau từ chối",
  "idempotencyKey": "coord-registration-1-attempt-2"
}
```

Reassign tạo bản ghi mới với PreviousCoordinationID, giữ nguyên lượt từ chối. Vị trí mới phải khác vị trí trước. GET detail trả `coordinationHistory`; DN chỉ thấy các lượt thuộc DN mình.

Idempotency key bắt buộc, tối đa 100 ký tự. Gửi lại cùng key, người gửi và payload trả snapshot ban đầu với `replayed: true`; đổi payload hoặc người gửi trả 409. Khóa được lưu trong audit và kiểm tra bên trong transaction.

**Chỗ chờ tiếp nhận không giữ chỉ tiêu.** Backend kiểm tra sức chứa tại gửi điều phối, chấp nhận và tạo phân công. ACCEPTED chưa đảm bảo có chỗ nếu phân công khác đã dùng hết chỉ tiêu.

### 4. Phân công

```json
{
  "coordinationId": 2,
  "enterpriseSupervisorName": "Trần Thị B",
  "startDate": "2026-10-15",
  "endDate": "2027-01-15",
  "reason": "Phân công sau doanh nghiệp tiếp nhận"
}
```

Chỉ tạo từ lượt mới nhất ACCEPTED và hồ sơ đã bàn giao hợp lệ. Backend suy ra sinh viên, doanh nghiệp, vị trí; không nhận các ID đó từ client. Một sinh viên chỉ có một phân công chưa hủy trong cùng kỳ. Mỗi coordination chỉ tạo được một assignment, kể cả assignment đó đã hủy. Ngày bắt buộc đúng YYYY-MM-DD và ngày kết thúc không trước ngày bắt đầu.

Tạo mới ASSIGNED. PATCH chỉ đổi giám sát/ngày khi ASSIGNED/ACTIVE/IN_PROGRESS; không đổi sinh viên, doanh nghiệp hoặc vị trí trực tiếp.

```json
{ "status": "ACTIVE", "reason": "Sinh viên bắt đầu thực tập" }
```

Chuyển trạng thái:

- ASSIGNED → ACTIVE hoặc CANCELLED.
- ACTIVE/IN_PROGRESS → COMPLETED hoặc CANCELLED.
- Trạng thái kết thúc không mở lại.

Đã chuyển hồ sơ kết quả thì không hủy phân công. Kết quả CONFIRMED khóa việc sửa phân công và đánh giá. Hoàn thành thực tập không tự chốt điểm học vụ; vẫn dùng API OJT results hiện có.

Tạo phân công khóa vị trí, kiểm tra lại số chỗ, chống trùng sinh viên, cập nhật RemainingSlots và ghi audit trong cùng transaction. Dùng transaction helper hiện có, bao gồm advisory lock dùng chung của dự án.

### 5. Đánh giá thực tập

```json
{
  "completionScore": 8.5,
  "attitudeScore": 9,
  "skillScore": 8,
  "overallScore": 8.5,
  "comments": "Sinh viên đáp ứng yêu cầu thực tập",
  "reason": "Nộp đánh giá cuối kỳ"
}
```

Cả bốn điểm bắt buộc, 0–10, tối đa hai chữ số thập phân. Backend không tự suy ra overallScore hoặc ngưỡng đạt. Comments tối đa 5.000 ký tự. Chỉ đánh giá phân công ACTIVE/IN_PROGRESS/COMPLETED. PUT tạo hoặc cập nhật cùng EvaluationID, lưu EvaluatedBy/EvaluatedAt và audit.

Nếu đánh giá thay đổi sau chuyển hồ sơ kết quả, API kết quả hiện có phát hiện source thay đổi: Đào tạo yêu cầu bổ sung, QHDN chuyển lại trước khi sửa/chốt điểm. Kết quả đã CONFIRMED không cho sửa đánh giá.

## Swagger và adapter JSON

Swagger của dự án ưu tiên input JSON; các route REST ở trên vẫn được mount. Adapter được sinh từ OpenAPI và dùng cùng middleware/service, ví dụ:

| REST | Adapter JSON |
| --- | --- |
| GET `/companies?search=ABC` | POST `/json/companies/search`, body `{ "search": "ABC" }` |
| GET `/companies/1` | POST `/json/companies/detail`, body `{ "companyId": 1 }` |
| PATCH `/positions/2` | PATCH `/json/positions`, body `{ "positionId": 2, "capacity": 10, "reason": "Tăng chỉ tiêu" }` |
| POST `/ojt-coordinations/3/decision` | POST `/json/ojt-coordinations/decision`, body `{ "coordinationId": 3, "decision": "ACCEPTED", "reason": "Đồng ý tiếp nhận" }` |
| PUT `/assignments/4/internship-evaluation` | PUT `/json/assignments/internship-evaluation`, body chứa `assignmentId: 4` và các trường đánh giá |

ID path được đặt tên companyId/positionId/coordinationId/assignmentId/evaluationId trong adapter JSON. Các endpoint POST tạo mới vẫn dùng đường dẫn REST gốc vì không có path/query input cần chuyển đổi.

## Triển khai


Module tái sử dụng bảng/cột đã có trong schema đầy đủ hiện tại, không cần migration riêng. Không chạy lại file DB trên database đang có dữ liệu để triển khai module: file đó là bộ khởi tạo có thao tác reset. Khi triển khai, dùng database đã được cập nhật đúng phiên bản schema, cài dependencies và chạy build. Kiểm thử kết nối/quyền DB thực tế ở môi trường triển khai vẫn cần thực hiện.
