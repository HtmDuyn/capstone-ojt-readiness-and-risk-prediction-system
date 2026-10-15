> Luồng này đã được mở rộng với applicationId, kiểm tra lại official eligibility, import sheet và CV riêng tư. Xem hợp đồng hiện tại tại [student-portal-api.md](student-portal-api.md).

# API nghiệp vụ QHDN

Base URL: `/api`. Tất cả endpoint yêu cầu `Authorization: Bearer <token>`.

## Phân quyền

| Nhóm thao tác | ADMIN | OJT_COORD | ENTERPRISE |
|---|---|---|---|
| Đọc doanh nghiệp/vị trí/điều phối/phân công/đánh giá | Toàn bộ | Toàn bộ | Chỉ doanh nghiệp liên kết qua EnterpriseUsers |
| Tạo/sửa doanh nghiệp, vị trí | Có | Có | Không |
| Gửi/điều phối lại, tạo/sửa phân công, đổi trạng thái | Có | Có | Không |
| Quyết định tiếp nhận/từ chối, nộp/sửa đánh giá | Nhập thay, bắt buộc reason | Nhập thay, bắt buộc reason | Chỉ hồ sơ thuộc doanh nghiệp của mình |

Doanh nghiệp cần liên kết `EnterpriseUsers`, có trạng thái ACTIVE và chưa xóa mềm. Không nhận enterpriseId từ body để xác định quyền quyết định hoặc đánh giá. ADMIN/ACADEMIC vẫn là các vai trò duy nhất được tạo đợt bàn giao; các API mới không mở quyền này cho QHDN.

## Danh mục

| Endpoint | Input |
|---|---|
| `GET /companies` | page, limit, search (mã/tên), status, industry |
| `GET /companies/:id` | Hồ sơ doanh nghiệp và lịch sử audit |
| `POST /companies` | enterpriseCode hoặc code, name; tùy chọn address, industry, contactPersonName, contactPhone, contactEmail, status, reason |
| `PATCH /companies/:id` | Các trường trên; phải có ít nhất một trường thông tin |
| `GET /positions` | page, limit, search (tiêu đề/mã tuyển), enterpriseId hoặc companyId, ojtSemesterId, status |
| `GET /positions/:id` | Vị trí, capacity, remainingSlots và lịch sử |
| `POST /positions` | enterpriseId hoặc companyId, ojtSemesterId, title, capacity; tùy chọn description, requirements, recruitmentCode, location, workMode, status, reason |
| `PATCH /positions/:id` | Các trường trên; capacity không được thấp hơn số chỗ đã giữ/phân công |

Trạng thái doanh nghiệp: ACTIVE/INACTIVE. Vị trí: OPEN/CLOSED. `workMode`: ONSITE/REMOTE/HYBRID hoặc null. `capacity` là số nguyên 0–2147483647; không nhận `remainingSlots` từ client. Doanh nghiệp/kỳ của vị trí đã có điều phối không được đổi. Danh sách/chi tiết loại bỏ bản ghi đã xóa mềm.

`remainingSlots` tính từ số phân công chưa hủy (kể cả đã hoàn thành/trượt) cộng lượt tiếp nhận chưa phân công và chưa bị điều phối lại. Khi DN chấp nhận, hệ thống giữ chỗ trong transaction; tạo phân công không giữ chỗ lần thứ hai. Hủy phân công hoặc điều phối lại một lượt chưa phân công sẽ giải phóng chỗ. Hồ sơ đang chờ quyết định chưa giữ chỗ.

## Điều phối

| Endpoint | Input |
|---|---|
| `GET /ojt-coordinations` | page, limit, search (mã/tên SV), enterpriseId/companyId, ojtSemesterId, registrationId, decision |
| `GET /ojt-coordinations/:id` | Chi tiết, history (audit của lượt), coordinationHistory (các lượt của hồ sơ, lọc theo DN nếu người đọc là DN) |
| `POST /ojt-coordinations` | registrationId, positionId, reason |
| `POST /ojt-coordinations/:id/decision` | decision: ACCEPTED/REJECTED; reason bắt buộc nếu từ chối hoặc staff nhập thay, tối đa 300 ký tự |
| `POST /ojt-coordinations/:id/reassign` | positionId khác vị trí cũ, reason |

Chỉ gửi hồ sơ có trạng thái HANDED_OFF và có dòng bàn giao thực tế trong `EligibleStudentHandoffItems`. Sinh viên và tài khoản phải đang ACTIVE, sinh viên chưa bị xóa mềm. Vị trí phải thuộc cùng kỳ với hồ sơ, đang OPEN, doanh nghiệp ACTIVE và còn chỉ tiêu.

Luồng quyết định: PENDING → ACCEPTED hoặc REJECTED. Không sửa quyết định đã ghi; dùng reassign khi cần chuyển vị trí. Reassign chỉ áp dụng lượt mới nhất, không có phân công hoặc phân công đã hủy; lượt cũ thành REASSIGNED và lượt mới là PENDING. Không ghi đè hoặc xóa lịch sử cũ.

Ví dụ DN tiếp nhận:

```json
{"decision":"ACCEPTED"}
```

Ví dụ QHDN nhập thay:

```json
{"decision":"REJECTED","reason":"Nhập theo email từ chối của doanh nghiệp ngày 13/10/2026"}
```

## Phân công

| Endpoint | Input |
|---|---|
| `GET /assignments` | page, limit, search (mã/tên SV), enterpriseId/companyId, ojtSemesterId, studentId, positionId, status |
| `GET /assignments/:id` | Chi tiết giám sát, thời gian, trạng thái và audit |
| `POST /assignments` | coordinationId, startDate, endDate; tùy chọn academicSupervisorId, enterpriseSupervisorName, reason |
| `PATCH /assignments/:id` | academicSupervisorId, enterpriseSupervisorName, startDate, endDate; bắt buộc reason |
| `PATCH /assignments/:id/status` | status: IN_PROGRESS/COMPLETED/CANCELLED, reason |

Tạo từ lượt điều phối mới nhất đã ACCEPTED. Không tự tạo quyết định chấp nhận. Một sinh viên chỉ có một phân công chưa hủy trong cùng kỳ; mỗi lượt điều phối chỉ tạo một phân công. Ngày theo YYYY-MM-DD, endDate ≥ startDate. Giám sát học vụ phải là tài khoản ACADEMIC đang ACTIVE.

Trạng thái: ASSIGNED → IN_PROGRESS → COMPLETED; ASSIGNED/IN_PROGRESS → CANCELLED. `ACTIVE` vẫn được nhận/đọc để tương thích trạng thái Admin cũ. Hoàn thành yêu cầu đã có đánh giá với overallScore. COMPLETED/FAILED/CANCELLED không được mở lại bằng API này. Muốn chuyển vị trí: hủy phân công, reassign và chờ DN mới chấp nhận.

Tương thích Admin: `POST /assignments` vẫn nhận registrationId và positionId; backend tìm lượt điều phối mới nhất và yêu cầu đã chấp nhận, không còn tự tạo ACCEPTED từ hồ sơ APPROVED. Các tên code/companyId vẫn được hỗ trợ và trả kèm enterpriseCode/enterpriseId. Các giá trị alias mâu thuẫn bị từ chối.

## Đánh giá

| Endpoint | Input |
|---|---|
| `GET /internship-evaluations` | page, limit, search (mã/tên SV), enterpriseId/companyId, ojtSemesterId, studentId, assignmentId, status |
| `GET /internship-evaluations/:id` | Điểm, nhận xét, evaluatedBy/evaluatedAt và audit |
| `PUT /assignments/:id/internship-evaluation` | completionScore, attitudeScore, skillScore, overallScore; tùy chọn comments, reason |

Các điểm bắt buộc, từ 0–10, tối đa hai chữ số thập phân. OverallScore do DN xác nhận, không tự suy ra trọng số. Chỉ đánh giá phân công IN_PROGRESS/ACTIVE/COMPLETED/FAILED, không nhận phân công chưa bắt đầu hoặc đã hủy. PUT cập nhật một đánh giá duy nhất cho mỗi phân công và giữ lịch sử trước/sau.

```json
{
  "completionScore": 8,
  "attitudeScore": 9,
  "skillScore": 8.5,
  "overallScore": 8.5,
  "comments": "Hoàn thành các nhiệm vụ được giao",
  "reason": "QHDN nhập theo phiếu đánh giá đã ký của doanh nghiệp"
}
```

Nếu staff nhập thay, reason bắt buộc. `EvaluatedBy` luôn là tài khoản thực sự nhập; audit lưu actorId, thời gian, dữ liệu trước/sau, reason, enteredByRole và onBehalfOfEnterprise. Không cho client giả danh người đánh giá. DN không được sửa đánh giá của DN khác.

Sau khi hồ sơ kết quả đã chuyển sang Đào tạo, không sửa nguồn phân công/đánh giá khi OJTResults đang PENDING_ACADEMIC_CONFIRMATION hoặc CONFIRMED. Đào tạo phải yêu cầu REVISION_REQUESTED trước khi DN/QHDN cập nhật nguồn và QHDN chuyển lại kết quả theo luồng có sẵn.

## Hợp đồng, Swagger và kiểm thử

Response: `{success:true,data:...}`. Danh sách: data gồm items/total/page/limit; mặc định 20 dòng, tối đa 100. `search` tối đa 100 ký tự; từ chối query/body không được hỗ trợ. Các bộ lọc kết hợp AND, áp dụng trước đếm/phân trang.

HTTP: 400 input sai; 401 chưa đăng nhập; 403 sai vai trò/phạm vi; 404 không tìm thấy; 409 sai trạng thái, thiếu bàn giao/tiếp nhận hoặc hết chỉ tiêu.

Swagger hiện có cơ chế chuyển input URL sang `/api/json/...` trong tài liệu; các endpoint REST ở trên vẫn hoạt động. Ví dụ `POST /api/json/ojt-coordinations/decision` nhận coordinationId cùng decision/reason; `PUT /api/json/assignments/internship-evaluation` nhận assignmentId cùng các điểm. Các route trùng của Admin đã được hợp nhất vào module QHDN để phân quyền và nghiệp vụ nhất quán.

Không thêm bảng hay chạy migration/reset DB. Cần schema hiện có trong backend/DB, gồm phần Admin management APIs (DeletedAt/AcademicSupervisorID) và các cột tuyển dụng đã có.
