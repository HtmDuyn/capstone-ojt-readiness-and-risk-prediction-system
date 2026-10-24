> Cập nhật hợp đồng API: xem [API sau khi xóa/gộp](api-consolidation.md) và [danh sách hiện hành](api-input-reference.md). Các endpoint cũ được thay thế theo bảng chuyển đổi.

# Danh sách API Phòng Quan hệ doanh nghiệp (QHDN)

Ngày rà soát: 08/10/2026. Vai trò backend: `OJT_COORD`. Base path: `/api`.

## 1. Căn cứ và giới hạn đối chiếu

- Đã kiểm tra router thực sự được mount trong `src/app.ts`, `src/routes/index.ts`, các route/service liên quan và DDL `backend/DB`. “Đã có” nghĩa là có triển khai trong source, chưa phải đã kiểm thử runtime với database.
- **Chưa tìm thấy file proposal** trong workspace, kể cả file ẩn và các file PDF/DOCX. README có nhắc Proposal trong thư mục docs nhưng không có tài liệu tương ứng trong checkout. Chưa thể kết luận danh sách này khớp proposal; cần đối chiếu lại khi có file.
- Phạm vi nghiệp vụ tạm lấy từ mục **Enterprise Relations Office** trong `README.md`: quản lý đối tác/vị trí/chỉ tiêu, nhận sinh viên đủ điều kiện, điều phối, theo dõi tiếp nhận, phân bổ lại và thống kê/phản hồi doanh nghiệp.
- `frontend/src/config/menus/qhdnMenu.tsx` bổ sung ý tưởng MOU, AI matching, lịch phỏng vấn, việc làm sau OJT và PDF. Đây là nội dung menu, **không phải bằng chứng tính năng đã có hoặc yêu cầu đã được proposal duyệt**.

### Phân loại

| Nhãn | Ý nghĩa |
|---|---|
| A — Đã có, QHDN dùng được theo source | Route đã cho phép `OJT_COORD`; vẫn cần dữ liệu/cấu hình hợp lệ |
| B — Tái sử dụng, cần sửa | Có route/service nhưng thiếu quyền QHDN hoặc chưa đáp ứng luồng nghiệp vụ |
| C — Cần xây mới | Chưa có route nghiệp vụ được mount; có bảng DB không đồng nghĩa đã có API |
| D — Mở rộng chờ proposal | Có gợi ý từ UI hoặc nhu cầu mở rộng, chưa xác nhận phạm vi |

Các endpoint dưới đây đều viết đầy đủ `/api`. Những đường dẫn loại C/D là **đề xuất**, chưa gọi được.

## 2. API đã có và QHDN dùng được (A)

| API | Mục đích / input chính | Lưu ý |
|---|---|---|
| `POST /api/auth/login` | Đăng nhập: `email`, `password` | Public; dùng tài khoản có role `OJT_COORD` |
| `GET /api/auth/me` | Thông tin người đăng nhập | JWT |
| `POST /api/auth/logout` | Đăng xuất | Client bỏ JWT theo mô tả route |
| `POST /api/auth/change-password` | `currentPassword`, `newPassword` | Người dùng đã xác thực |
| `GET /api/ojt-registrations` | Danh sách hồ sơ: `ojtSemesterId`, `windowId`, `status`, `studentId`, `programId`, `cohortId`, `groupCode`, `search`, `page`, `limit` | Service tự giới hạn QHDN vào hồ sơ có bản ghi bàn giao |
| `GET /api/ojt-registrations/:id` | Chi tiết hồ sơ, eligibility, snapshot bàn giao, lịch sử, coordination, assignments | QHDN chỉ truy cập hồ sơ đã bàn giao; hồ sơ khác bị 403 |
| `GET /api/ojt-semesters/:id/eligible-student-handoffs` | Lịch sử các đợt bàn giao: `page`, `limit` | Trả mã đợt, danh sách registration IDs, lý do, người tạo |
| `GET /api/ojt-semesters/:id/students` | Danh sách SV nhận bàn giao: `programId`, `cohortId`, `groupCode`, `registrationStatus`, `search`, `page`, `limit` | Có thông tin điều phối, phân công, trạng thái tổng hợp; không có bộ lọc `assignmentStatus` hiện tại |
| `GET /api/ojt-results` | Theo dõi kết quả: `status`, `ojtSemesterId`, `studentId`, `search`, `page`, `limit` | ADMIN/ACADEMIC/OJT_COORD |
| `GET /api/ojt-results/:id` | Hồ sơ kết quả và lịch sử phiên bản | ADMIN/ACADEMIC/OJT_COORD |
| `POST /api/ojt-results` | Chuyển hồ sơ cho Đào tạo: `assignmentId`, `dossier`, `reason`, `idempotencyKey` | ADMIN/OJT_COORD; cần đánh giá thực tập có `EvaluatedAt`, `OverallScore` |
| `POST /api/ojt-results/:id/transfer` | Gửi lại hồ sơ: `expectedVersion`, `dossier`, `reason`, `idempotencyKey` | Chỉ gửi lại khi `REVISION_REQUESTED` |
| `GET /api/ojt-semesters/:id/results/export` | Xuất kết quả: `format=csv\|json`; hỗ trợ lọc kết quả | Không hỗ trợ `page/limit`; tối đa 10.000 kết quả; chưa có PDF |

`dossier` hiện gồm `summary` và `documents: [{name,url}]` (1–20 URL HTTP/HTTPS); đây là tham chiếu tài liệu, chưa phải API upload file.

Nguồn: `src/modules/auth/auth.routes.ts`, `src/modules/ojt-registration/{registration.routes,registration.service,handoff.service}.ts`, `src/modules/ojt-results/{result.routes,result.service}.ts`.

## 3. API có thể tái sử dụng (B)

### 3.1. Danh mục đối tác và vị trí

| API có sẵn | Quyền hiện tại | Dùng cho QHDN / thay đổi cần làm |
|---|---|---|
| `GET /api/companies` | ADMIN | Danh sách đối tác; mở quyền OJT_COORD. Query: `search`, `status`, `page`, `limit` |
| `GET /api/companies/:id` | ADMIN | Chi tiết đối tác; mở quyền OJT_COORD |
| `POST /api/companies` | ADMIN | Thêm đối tác; tái sử dụng `saveCompany` |
| `PATCH /api/companies/:id` | ADMIN | Cập nhật thông tin/trạng thái; tái sử dụng `saveCompany` |
| `DELETE /api/companies/:id` | ADMIN | Xóa mềm; giữ kiểm tra phân công đang hoạt động và vị trí đang mở |
| `GET /api/positions` | ADMIN | Danh sách vị trí/chỉ tiêu; query `companyId`, `ojtSemesterId`, `status`, `search`, `page`, `limit` |
| `POST /api/positions` | ADMIN | Tạo vị trí theo doanh nghiệp và kỳ; tái sử dụng `savePosition` |
| `PATCH /api/positions/:id` | ADMIN | Sửa vị trí/chỉ tiêu, đóng/mở bằng `status`; giữ kiểm tra capacity |
| `DELETE /api/positions/:id` | ADMIN | Xóa mềm; không xóa khi có phân công đang hoạt động |

Input doanh nghiệp hiện có: `code`, `name`, `address`, `industry`, `contactPersonName`, `contactPhone`, `contactEmail`, `status=ACTIVE|INACTIVE`.

Input vị trí hiện có: `companyId`, `ojtSemesterId`, `recruitmentCode`, `title`, `description`, `requirements`, `capacity`, `status=OPEN|CLOSED`, `location`, `workMode=ONSITE|REMOTE|HYBRID`.

`remainingSlots` do backend tính, không nhập thủ công. `companyId` và `ojtSemesterId` của vị trí đã tạo không được đổi. Hiện **không có** `GET /api/positions/:id`; có thể bổ sung bằng `detail(catalogs.positions,id)`.

Nguồn: `src/modules/admin/{admin.routes,catalog.service,admin.repository}.ts`.

### 3.2. Phân công thực tập

| API có sẵn | Quyền hiện tại | Mức tái sử dụng |
|---|---|---|
| `GET /api/assignments` | ADMIN | Mở OJT_COORD; lọc `studentId`, `companyId`, `positionId`, `ojtSemesterId`, `status`, `page`, `limit` |
| `GET /api/assignments/:id` | ADMIN | Mở OJT_COORD; xem doanh nghiệp, vị trí, giám sát, thời gian |
| `POST /api/assignments` | ADMIN | Cần sửa nghiệp vụ trước khi mở QHDN; xem lỗi luồng bên dưới |
| `PATCH /api/assignments/:id` | ADMIN | Có thể dùng đổi vị trí/giám sát/thời gian; bắt buộc `reason`; không thay thế hoàn toàn luồng điều phối lại sau từ chối |
| `PATCH /api/assignments/:id/status` | ADMIN | Chuyển `ASSIGNED → ACTIVE/CANCELLED`, `ACTIVE → COMPLETED/CANCELLED`; bắt buộc `reason` |

Tạo phân công nhận `registrationId`, `positionId`, `academicSupervisorId`, `enterpriseSupervisorName`, `startDate`, `endDate`. Backend đã có transaction, khóa vị trí, chống phân công trùng và cập nhật số chỗ còn lại.

**Hai điểm phải sửa trước khi tái sử dụng cho luồng QHDN:**

1. `handoff.service.ts` đổi đăng ký từ `APPROVED` sang `HANDED_OFF`, nhưng `saveAssignment` trong `assignment.service.ts` chỉ chấp nhận đăng ký mới có trạng thái `APPROVED`. Vì vậy hồ sơ đã bàn giao bị từ chối tạo phân công. Cần quy định nguồn đầu vào QHDN là hồ sơ đã bàn giao hợp lệ và xác thực bản ghi bàn giao tương ứng.
2. Tạo assignment hiện tự tạo coordination với `Decision='ACCEPTED'`. Chưa có bước chờ doanh nghiệp quyết định. Cần tách “gửi điều phối” khỏi “phân công chính thức”; tạo assignment từ coordination đã được chấp nhận. Nếu giữ cơ chế phân công trực tiếp phải quy định rõ đây là nghiệp vụ đặc biệt.

Không chỉ thêm `OJT_COORD` vào toàn bộ router ADMIN. Cần mở từng endpoint phù hợp và giữ các chức năng quản trị khác ở quyền ADMIN.

### 3.3. Dữ liệu dùng chung và báo cáo

| API có sẵn | Quyền hiện tại | Hướng tái sử dụng |
|---|---|---|
| `GET /api/ojt-semesters` | ADMIN/ACADEMIC | Mở quyền đọc OJT_COORD cho bộ chọn kỳ; giữ quyền ghi ở Đào tạo |
| `GET /api/ojt-semesters/:id` | ADMIN | Mở quyền đọc OJT_COORD |
| `GET /api/majors` | ADMIN/ACADEMIC | Mở đọc khi cần danh mục ngành; không coi `majorId` và `programId` là một trường |
| `GET /api/cohorts` | ADMIN/ACADEMIC | Mở đọc khi cần bộ lọc khóa |
| `GET /api/students`, `GET /api/students/:id` | ADMIN/ACADEMIC; chi tiết còn có STUDENT tự xem | Ưu tiên hồ sơ bàn giao đã có. Nếu cần thêm hồ sơ SV, phải giới hạn theo bàn giao; không mở toàn bộ dữ liệu cho QHDN |
| `GET /api/assessments`, `GET /api/assessments/:id` | ADMIN | Đánh giá năng lực theo AssessmentTemplates; không phải đánh giá thực tập cuối kỳ |
| `GET /api/predictions`, `GET /api/predictions/:id`, `GET /api/students/:id/predictions` | ADMIN | Có thể tái dùng kết quả readiness/risk nếu proposal yêu cầu QHDN xem; giới hạn dữ liệu theo phạm vi |
| `GET /api/admin/dashboard/summary`, `/readiness`, `/risks`, `/trends` | ADMIN | Tái dùng thành phần truy vấn phù hợp; cần endpoint tổng quan QHDN riêng |
| `GET /api/admin/reports/readiness`, `/risks`, `/export` | ADMIN | Báo cáo AI readiness/risk; không thay thế báo cáo tiếp nhận/phân công OJT |

`academic-reporting` hiện chỉ cho ADMIN/ACADEMIC và chủ yếu thống kê học vụ/eligibility. Có thể tham khảo kỹ thuật tổng hợp, xuất CSV và thông báo; không mặc định xem đây là dashboard QHDN đã có.

## 4. API cần xây mới cho nghiệp vụ cốt lõi (C)

Đề xuất quyền: ADMIN/OJT_COORD, trừ thao tác quyết định của doanh nghiệp. Mỗi endpoint phải xác thực kỳ, hồ sơ bàn giao và liên kết doanh nghiệp/vị trí. Thứ tự ưu tiên: P0 bảo đảm luồng nghiệp vụ; P1 theo dõi và báo cáo.

| Ưu tiên | API đề xuất (chưa có) | Chức năng / input-output chính | Nền có thể tái dùng |
|---|---|---|---|
| P0 | `GET /api/positions/:id` | Chi tiết vị trí, capacity, remainingSlots | `detail`, `catalogs.positions` |
| P0 | `GET /api/ojt-coordinations` | Danh sách chờ tiếp nhận/từ chối: kỳ, doanh nghiệp, vị trí, quyết định, SV, phân trang | `StudentEnterpriseCoordination` |
| P0 | `GET /api/ojt-coordinations/:id` | Hồ sơ điều phối, lịch sử, doanh nghiệp, SV | Chi tiết registration đã có một phần dữ liệu |
| P0 | `POST /api/ojt-coordinations` | Gửi SV tới DN: `registrationId`, `positionId`, `reason`, `idempotencyKey`; tạo trạng thái chờ | Bảng coordination; kiểm tra bàn giao, cùng kỳ, vị trí mở |
| P0 | `POST /api/ojt-coordinations/:id/decision` | DN chấp nhận/từ chối: `decision`, `reason`, `expectedVersion` | ENTERPRISE chỉ xử lý DN của mình; QHDN nhập thay chỉ khi nghiệp vụ cho phép và có audit |
| P0 | `POST /api/ojt-coordinations/:id/reassign` | Điều phối lại hồ sơ bị từ chối: `positionId`, `reason`, `idempotencyKey`; liên kết lượt trước | `PreviousCoordinationID`, kiểm tra sức chứa; giữ lịch sử từ chối |
| P0 | Điều chỉnh `POST /api/assignments` (API B) | Tạo phân công từ coordination ACCEPTED, hồ sơ đã bàn giao; bổ sung `coordinationId` vào contract | Tái dùng transaction/capacity/audit, không tạo route trùng |
| P0 | `GET /api/internship-evaluations` | Danh sách đánh giá thực tập: kỳ, DN, SV, assignment | `InternshipEvaluations`; khác `/assessments` |
| P0 | `GET /api/internship-evaluations/:id` | Điểm, nhận xét, thời gian đánh giá phục vụ rà soát/chuyển kết quả | `result.service.source` đã đọc bảng này |
| P0 | `PUT /api/assignments/:id/internship-evaluation` | DN nộp/cập nhật đánh giá cuối kỳ theo contract cần chốt | ENTERPRISE theo DN; quy định QHDN nhập thay nếu có; cần cho luồng chuyển kết quả hoạt động đầy đủ |
| P1 | `GET /api/qhdn/dashboard` | Tổng đối tác, chỉ tiêu, đã bàn giao, chưa phân bổ, chờ DN, bị từ chối, đã phân công | Tổng hợp companies/positions/handoffs/coordination/assignments |
| P1 | `GET /api/qhdn/reports/acceptance` | Số tiếp nhận/từ chối/chờ và tỷ lệ theo kỳ/DN | Coordination; chốt mẫu số và cách tính lượt điều phối lại |
| P1 | `GET /api/qhdn/reports/internships` | Phân công, đang thực tập, hoàn thành, kết quả theo kỳ/DN | Assignments, OJTResults, evaluations |
| P1 | `GET /api/qhdn/reports/enterprise-feedback` | Tổng hợp điểm và nhận xét DN | `InternshipEvaluations`; khảo sát hài lòng riêng cần dữ liệu riêng |
| P1 | `GET /api/qhdn/reports/export` | `type`, `ojtSemesterId`, `companyId`, `format=csv|json` | Tái dùng CSV helper; bổ sung truy vấn báo cáo QHDN |

`expectedVersion`, `idempotencyKey` và trạng thái chờ trong bảng trên là contract đề xuất; cần migration nếu schema hiện tại chưa hỗ trợ đầy đủ. Bảng `JobApplications` đã có trong DDL nhưng chưa có route xử lý ứng tuyển/ra quyết định được mount. Cần chốt quyết định DN được lưu ở application hay coordination và đồng bộ một nguồn chính thức, tránh hai trạng thái độc lập mâu thuẫn.

## 5. Mở rộng cần đối chiếu proposal (D)

| Nhóm | API đề xuất | Hiện trạng / điều kiện |
|---|---|---|
| MOU/hợp tác | `GET/POST /api/companies/:id/agreements`; `PATCH /api/company-agreements/:id` | Menu có MOU; chưa thấy API hay bảng MOU chuyên biệt; cần metadata, thời hạn, tài liệu |
| Import đối tác/vị trí | `POST /api/qhdn/enterprise-imports/preview`; `/commit`; `GET /api/qhdn/enterprise-imports/:id` | DDL có `OJTEnterpriseImportBatches/Rows`; chưa có route tương ứng |
| AI ghép cặp | `POST /api/qhdn/matching-runs`; `GET /api/qhdn/matching-runs/:id`; `GET /api/qhdn/matching-recommendations`; `POST /api/qhdn/matching-recommendations/:id/feedback` | DDL có profiles/runs/recommendations/feedback; chưa có API matching được mount. AI dự đoán readiness/risk hiện có không phải AI matching |
| Phỏng vấn | `GET/POST /api/qhdn/interviews`; `PATCH /api/qhdn/interviews/:id`; `POST /api/qhdn/interviews/:id/cancel` | Menu có lịch phỏng vấn; chưa có route và chưa thấy bảng lịch chuyên biệt; trạng thái INTERVIEW của JobApplications chưa đủ quản lý lịch |
| Nhắc lịch/thông báo | `POST /api/qhdn/notifications`; `GET /api/qhdn/notification-batches/:id` | Có Notifications/EmailOutbox và service gửi thông báo học vụ; cần nghiệp vụ, phạm vi người nhận, retry/idempotency riêng |
| Upload hồ sơ/MOU | `POST /api/qhdn/documents/upload-url`; `GET /api/qhdn/documents/:id/download-url` | Chưa có API upload tương ứng; đề xuất storage private và URL có thời hạn |
| PDF | Mở rộng `GET /api/qhdn/reports/export?format=pdf` | Export hiện có chỉ CSV/JSON; cần bộ sinh PDF |
| Việc làm/hài lòng DN | `GET /api/qhdn/reports/employment`; `GET/POST /api/qhdn/enterprise-surveys` | Menu có chỉ số; cần dữ liệu khảo sát/việc làm và định nghĩa thời điểm đo |

Matching chỉ đưa ra gợi ý; nếu triển khai phân bổ tự động cần endpoint xác nhận riêng, kiểm tra lại sức chứa và trạng thái hồ sơ trong transaction trước khi ghi điều phối.

## 6. Phân định trách nhiệm và thứ tự thực hiện

1. **Đào tạo** xét điều kiện, duyệt đăng ký và gọi `POST /api/ojt-semesters/:id/eligible-student-handoffs`. API này đã có nhưng không thuộc quyền ghi QHDN. QHDN nhận dữ liệu bằng các GET ở mục 2.
2. **QHDN** quản lý đối tác/vị trí, gửi điều phối và điều phối lại; **doanh nghiệp** quyết định tiếp nhận. Sửa xung đột `APPROVED/HANDED_OFF` và cơ chế tự ACCEPTED trước khi kết nối phân công.
3. Tái dùng API assignment cho phân công chính thức sau tiếp nhận; giữ khóa sức chứa, chống trùng và audit. Quy định chỗ chờ tiếp nhận có được giữ chỗ hay chỉ kiểm tra lại khi nhận chính thức.
4. Hoàn thiện API đánh giá thực tập để có dữ liệu nguồn. QHDN dùng API đã có để chuyển/gửi lại kết quả; **Đào tạo** giữ quyền sửa điểm chính thức, yêu cầu bổ sung và xác nhận kết quả.
5. Làm dashboard/báo cáo theo nhu cầu README, sau đó đối chiếu proposal trước khi triển khai các mở rộng ở mục 5.

### Kiểm tra nghiệm thu cần có khi triển khai

- Tài khoản OJT_COORD truy cập đúng endpoint được mở, không truy cập quản trị hệ thống hoặc hồ sơ chưa bàn giao.
- Luồng bàn giao → điều phối → DN chấp nhận/từ chối → phân công/điều phối lại chạy xuyên suốt.
- Hai yêu cầu phân công đồng thời không vượt capacity; không tạo hai phân công còn hiệu lực cho một SV trong cùng kỳ.
- DN không quyết định hoặc xem hồ sơ của DN khác; ghi audit khi nhập thay/đổi quyết định/điều phối lại.
- Chuyển kết quả cần đánh giá hợp lệ; gửi lại chỉ khi yêu cầu sửa; confirmed không sửa được; replay không tạo bản ghi trùng.
- Báo cáo định nghĩa rõ tỷ lệ theo SV hay lượt điều phối; tính nhất quán với lịch sử từ chối/phân bổ lại.

## 7. Bản đồ source để đối chiếu

| Nội dung | File |
|---|---|
| Base path, mount module | `src/app.ts`, `src/routes/index.ts` |
| Auth và vai trò QHDN | `src/modules/auth/auth.routes.ts`, `src/middleware/authorize.ts` |
| Đối tác/vị trí và API ADMIN có thể tái dùng | `src/modules/admin/admin.routes.ts`, `catalog.service.ts`, `admin.repository.ts` |
| Phân công và giới hạn trạng thái | `src/modules/admin/assignment.service.ts` |
| Hồ sơ/bàn giao và giới hạn QHDN | `src/modules/ojt-registration/registration.routes.ts`, `registration.service.ts`, `handoff.service.ts` |
| Chuyển kết quả/đánh giá nguồn/export | `src/modules/ojt-results/result.routes.ts`, `result.service.ts` |
| Danh mục kỳ/khóa/ngành | `src/modules/academic/academic.routes.ts`, `academic.repository.ts`, `src/modules/curriculum/curriculum.routes.ts` |
| AI readiness/risk | `src/modules/admin/prediction.service.ts`, `reporting.service.ts` |
| Thống kê/thông báo học vụ | `src/modules/academic/rest.routes.ts`, `report-read.service.ts`, `notification.service.ts` |
| DDL, chưa phải API | `DB` |
| Nghiệp vụ tạm thay proposal | `../README.md` |
| Ý tưởng màn hình QHDN | `../frontend/src/config/menus/qhdnMenu.tsx` |

Các đường dẫn `src/...` trong tài liệu tính từ `backend/`. Chưa chỉnh sửa implementation hoặc phân quyền trong đợt lập danh sách này.
