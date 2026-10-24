# Triển khai API kỳ 5 → OJT

## Nhập JSON cho Sinh viên (2026-10-24)

Các API academic-summary, supplementary-course-options, curriculum, roadmap-recommendations, assignments/current, dashboard, opportunities và hai danh sách đợt đăng ký bắt buộc `studentId` trong JSON. Lấy StudentID từ response đăng nhập/thông tin tài khoản; ID phải khớp hồ sơ của tài khoản được xác thực. Thông báo và cập nhật hồ sơ tài khoản vẫn dùng định danh tài khoản, không cần thêm studentId.

Backend vẫn xác thực Bearer token và trạng thái tài khoản. Trong cùng request, adapter và handler gốc dùng lại kết quả xác thực; StudentID lấy từ DB hiện hành, không tin claim StudentID cũ trong token. Truy vấn hồ sơ dùng StudentID kèm UserID; các phần dashboard dùng lại hồ sơ theo request. Không cache xác thực/hồ sơ giữa các request. Chưa đo độ trễ trên dữ liệu thực tế.


Nhóm **Sinh viên** trong Swagger có 30 operation dùng một JSON body tại `/api/student/*`. ID và bộ lọc nằm trong body; không còn ô path/query. Upload CV là ngoại lệ: `POST /api/students/me/cv` dùng multipart/form-data, trường file `cv`.

| Chức năng | API | JSON minh họa |
| --- | --- | --- |
| Dashboard | POST /api/student/dashboard/search | {"studentId":1,"ojtSemesterId":1} |
| Hồ sơ | POST /api/student/profile/detail | {"studentId":1} |
| Điểm học phần | POST /api/student/course-results/search | {"studentId":1,"page":1,"limit":20} |
| Điều kiện OJT | POST /api/student/eligibility/search | {"studentId":1,"ojtSemesterId":1} |
| Xem trước chọn combo | POST /api/student/combo-registration-windows/preview | {"windowId":1,"comboId":1,"courseIds":[1,2]} |
| Đánh dấu thông báo | PATCH /api/student/notifications/update | {"notificationId":1,"isRead":true} |
| Chi tiết kết quả OJT | POST /api/student/ojt-results/detail | {"resultId":1} |
| Tải CV | POST /api/student/cv/download | {"studentId":1,"cvFileId":1} |
| Chương trình học | POST /api/student/curriculum/search | {"studentId":1} |

Gửi `Content-Type: application/json` và Bearer token STUDENT. Thiếu ID bắt buộc, sai kiểu, trường dư hoặc query URL trả 400; sai Content-Type trả 415. Adapter chuyển ID/bộ lọc vào handler nghiệp vụ hiện có, giữ nguyên kiểm tra quyền sở hữu và trạng thái nghiệp vụ. Sinh viên không thể xem hồ sơ của người khác bằng cách thay studentId.

Các route REST gốc tiếp tục hoạt động để giữ tương thích; trên Swagger, phiên bản dùng chung chỉ còn ở nhóm nhân sự, Sinh viên thấy phiên bản JSON. Không thêm lại các API đợt đăng ký portal bị trùng hay logic nghiệp vụ đã xóa. Các mô tả REST/service bên dưới là thông tin triển khai; hợp đồng gọi API Student hiện tại lấy từ `/api-docs/openapi.json` và `docs/api-input-reference.md`.

Đã triển khai 48 operation mới trong checklist và sửa/đối chiếu 24 operation hiện có được đánh dấu cần sửa. Các API `/students/me/...` chỉ nhận STUDENT; API Đào tạo nhận ADMIN/ACADEMIC; import/công bố nhận ADMIN/OJT_COORD; doanh nghiệp chỉ đọc đơn/CV đã được gửi đến doanh nghiệp mình và ghi decision/evaluation trong phạm vi.

## Khởi tạo schema và chạy

Không chạy toàn bộ `backend/DB` để cập nhật database đang có dữ liệu: phần đầu là script reset. Section mới là `Semester 5 student portal APIs`, version `20261013_student_portal`.

Trong thư mục backend:

```sh
npm install
npm run db:migrate:admin
npm run db:migrate:student-portal
npm run build
npm start
```

Hai script migration chỉ chạy section bổ sung tương ứng và bỏ qua version đã cài. Migration mới giữ lịch sử enterprise import cũ, thêm metadata/CV/đơn/thông báo; không reset các bảng. Phần Admin migration là prerequisite vì API dùng DeletedAt và AcademicSupervisorID. Đã kiểm thử schema trong PostgreSQL cô lập; chưa chạy migration vào DB thật của người dùng.

## Cấu hình

Tham khảo `.env.student-portal.example` và gộp vào cấu hình backend hiện có, không ghi đè `.env` đang dùng.

| Biến | Yêu cầu |
|---|---|
| CV_STORAGE_KEY | Base64 của đúng 32 byte, dùng AES-256-GCM cho CV. Giữ ổn định và sao lưu cùng dữ liệu; đổi key không có migration sẽ không đọc được CV cũ |
| EMAIL_OUTBOX_KEY | Key hex 32 byte hiện có cho email cấp tài khoản doanh nghiệp |
| FRONTEND_LOGIN_URL | URL đăng nhập trong email cấp tài khoản |
| ADVISORY_WORKER_ENABLED | Mặc định bật; `false` tắt xử lý batch/thông báo tự động. Không cần SMTP để tạo thông báo IN_APP |
| CV_ANALYSIS_SERVICE_URL | URL dịch vụ đọc PDF CV; thiếu thì API phân tích trả 503 AI_NOT_CONFIGURED |
| ROADMAP_SERVICE_URL | URL dịch vụ tư vấn AI; không dùng thay API đề xuất môn theo quy tắc |
| MATCHING_SERVICE_URL | URL dịch vụ matching CV với danh sách vị trí được công bố |
| STUDENT_AI_API_KEY | Bearer token tùy chọn cho ba dịch vụ AI |

Không thêm model giả hoặc dự báo ngẫu nhiên. API risk đọc Predictions của chính sinh viên; chưa có dữ liệu trả NOT_AVAILABLE. Việc huấn luyện/vận hành model thực tế nằm ngoài thay đổi này.

## Hợp đồng chung

Base URL `/api`, Bearer JWT. Các API mới trả `{success:true,data:...}`. Riêng imports giữ response tương thích ở root như trước; lô bị từ chối trả 422, success:false, rejectedBatch:true và batchId.

Danh sách dùng page/limit (1/20 mặc định, limit tối đa 100). Các endpoint học vụ theo kỳ (`academic-summary`, `supplementary-course-options`, `dashboard`, `risk-prediction`, `roadmap-recommendations`, `company-recommendations`, báo cáo QHDN) yêu cầu `ojtSemesterId`.

Swagger `/api-docs` mô tả route REST trực tiếp. GET dùng path/query; upload CV/import file dùng multipart/form-data.

## Import sheet đối tác — QHDN

`POST /imports/preview`, `/imports/commit` nhận cả JSON hiện có và multipart.

Multipart fields:

- kind: ENTERPRISE.
- semesterId: đợt thực tập mục tiêu, không phải kỳ học xét điều kiện.
- idempotencyKey: khóa chống nhập lặp.
- file: CSV/XLSX, tối đa 8 MiB, tối đa 5000 dòng và 100 cột.
- mode: UPSERT (mặc định) hoặc CREATE_ONLY.
- mapping: tùy chọn chuỗi JSON ánh xạ trường chuẩn sang tên cột sheet.

Header chuẩn: `code,name,email,fullName,address,positionCode,title,description,requirements,capacity`. address không bắt buộc. Một dòng là một vị trí; những dòng cùng mã doanh nghiệp được nhóm lại, tối đa 500 doanh nghiệp/lô và 50 vị trí/doanh nghiệp. Nhóm phải thống nhất tên/email/người liên hệ.

Ví dụ mapping:

```json
{"code":"Mã DN","name":"Tên DN","email":"Email","fullName":"Người liên hệ","positionCode":"Mã vị trí","title":"Vị trí","description":"Mô tả","requirements":"Yêu cầu","capacity":"Chỉ tiêu"}
```

Preview kiểm tra toàn bộ lô, không ghi tài khoản/doanh nghiệp. Errors có rowNumber theo danh sách doanh nghiệp chuẩn hóa; với sheet có thêm sheetRows để đối chiếu số dòng vật lý. Commit có lỗi không ghi bất kỳ doanh nghiệp/vị trí nào, vẫn ghi lịch sử rejected và các dòng NOT_IMPORTED/REJECTED. Dùng GET `/company-imports` và `/:id` để tra lịch sử.

UPSERT nhận nhiều lô trong cùng kỳ, tìm đối tác theo mã, vị trí theo doanh nghiệp+kỳ+mã vị trí. Không giảm chỉ tiêu xuống dưới chỗ đã giữ/phân công. Không hồi sinh bản ghi deleted/archived hoặc thay danh tính tài khoản khác; cần Admin xử lý các xung đột đó. Tài khoản mới được cấp mật khẩu tạm qua outbox, không trả/lưu mật khẩu rõ trong lịch sử API. Khóa idempotency của lô đã hoàn thành không được dùng cho payload khác.

Import tạo `RecruitmentPosts` PENDING_REVIEW liên kết vị trí. QHDN sửa deadline qua PATCH `/recruitment-posts/:id`, sau đó POST `/:id/publish` với reason. DN không có quyền tạo/sửa/công bố tin. Sửa nội dung đã công bố chuyển về PENDING_REVIEW; đơn cũ giữ snapshot. POST `/:id/close` đóng nhận đơn mới.

## Học vụ, mốc xét và thông báo

- academicPeriodId của OJTRegistrationWindows là kỳ học chuẩn bị/đăng ký; ojtSemesterId là đợt thực tập mục tiêu. Hai kỳ có thể khác nhau, kể cả khác năm học.
- PUT `/ojt-semesters/:id/assessment-window` nhận blockPeriodId, assessmentAcademicPeriodId, requiredRelativeSemester=5, opensAt, closesAt, reason. BL3W/BLOCK3 phải thuộc kỳ cha đó; mốc mở xét sau khi cả kỳ cha và BLOCK3 kết thúc.
- POST assessment-window/open yêu cầu resultsFinalized:true. Check được dùng để confirm phải tạo sau mốc finalized và đúng kỳ tương đối 5 hoặc có ngoại lệ hợp lệ. Mở lại CLOSED phải gửi reopen:true, reason và resultsFinalized:true; có thể gửi closesAt mới. Mỗi lần mở lại tăng Revision và làm các xác nhận thuộc revision cũ stale, cần chạy xét/xác nhận lại. Mọi lần mở lại được audit.
- POST `/ojt-registrations` yêu cầu official ELIGIBLE còn hiện hành. Duyệt/bàn giao vẫn chỉ Đào tạo. QHDN kiểm tra lại hiệu lực official trước khi điều phối/tiếp nhận/phân công.
- academic-summary trả earnedCredits, missingCredits, failedCourseCount, outstandingCourses, inProgressCredits, currentEligibility, officialEligibility và scenario. Scenario chỉ là giả định các môn đang học đều đạt, dùng lại thuật toán đối chiếu tín chỉ để không đếm trùng môn/slot; không phải dự đoán AI.
- supplementary-course-options trả môn cần học/học lại, lý do, tín chỉ, tiên quyết, availability:NOT_MANAGED. Không có API quản lý lớp/đăng ký học.
- `/academic/alerts` đã có thêm EXCESS_FAILED_COURSES; endpoint notifications cũ bổ sung số tín chỉ và môn nợ, vẫn chỉ gửi sinh viên có alert.

POST `/academic/academic-summary-notifications` và `/academic/eligibility-notifications` nhận:

```json
{
  "ojtSemesterId": 1,
  "academicPeriodId": 5,
  "studentIds": [123],
  "idempotencyKey": "midterm-2026-v1",
  "reason": "Thông báo giữa kỳ 5"
}
```

ID trên chỉ minh họa. Có thể dùng scope tương tự đợt OJT thay studentIds. Tối đa 1000 sinh viên, đúng kỳ tương đối 5. Response 202 có runId; worker xử lý tối đa 10 dòng/lượt, lưu snapshot + notification cùng transaction. Gửi lại cùng key/payload/người tạo trả run cũ; muốn chạy lại với dữ liệu mới dùng key mới. Kết quả chính thức stale/chưa có được thông báo chờ đối soát, không giả kết luận không đủ.

GET `/academic/advisory-runs`, `/:id` theo dõi tiến trình/lỗi. GET/PUT `/academic-periods/:id/ojt-advisory-schedule` cấu hình sendAt trong kỳ chuẩn bị, assessmentDeadline sau kỳ, ojtSemesterId, scope, enabled, reason. Worker chống gửi trùng theo kỳ+version cấu hình. Thay đổi version lịch là một lần gửi mới có chủ đích.

## CV và ứng tuyển

- POST `/student/cv`: multipart field file, PDF tối đa 5 MiB, kiểm tra chữ ký PDF. Mỗi upload tạo phiên bản mới được mã hóa, không ghi bytes vào audit.
- GET `/student/cv`: metadata; `?download=true` tải PDF riêng tư với Cache-Control:no-store và Content-Disposition:attachment.
- DELETE `/student/cv`: ngừng dùng phiên bản hiện tại; không xóa bản đã gắn vào đơn. Những bản đã nghỉ vẫn giữ để bảo toàn hồ sơ.
- POST `/student/applications`: postId, positionId; cvId (tùy chọn, phải là CV hiện tại của mình), coverLetter. Backend xác định Student/Registration/Enterprise từ token/dữ liệu DB.
- Yêu cầu official ELIGIBLE còn hiện hành, hồ sơ OJT hợp lệ, chương trình khớp, đợt mở, vị trí công bố chưa hết hạn, còn chỉ tiêu, đã upload CV và chưa có tiếp nhận/phân công khác trong kỳ.
- Được nộp đơn trước bàn giao; response waitingForHandoff:true. QHDN không được đọc/điều phối trước bàn giao; ADMIN được tra cứu toàn bộ đơn để quản trị.
- GET `/student/applications`, `/:id` xem đơn/timeline của mình. POST `/:id/withdraw` với reason chỉ trước tiếp nhận/phân công; hủy pending coordination tương ứng. Hồ sơ từng được điều phối không được ghi đè bằng lần nộp lại sau rút; liên hệ QHDN để điều phối lại, giữ nguyên lịch sử.
- GET `/job-applications`, `/:id`, `/:id/cv`: QHDN chỉ hồ sơ đã bàn giao; DN chỉ đơn đã gửi đến DN mình. CV lấy đúng phiên bản gắn vào đơn; upload CV mới không đổi bản DN đã nhận.
- POST `/ojt-coordinations` nhận applicationId + reason (có thể đối chiếu thêm registrationId/positionId). Luồng dữ liệu cũ chưa có application được giữ tương thích; khi hồ sơ đã có đơn phải chọn applicationId.
- Decision là nguồn duy nhất ghi ACCEPTED/REJECTED, đồng bộ đơn và giữ chỗ cùng transaction; không giữ chỗ lần hai lúc tạo phân công. Nhập thay DN vẫn bắt buộc reason và người nhập thực.
- Một sinh viên chỉ có một lượt tiếp nhận/phân công chưa hủy trong kỳ. Reassign yêu cầu đơn phù hợp vị trí mới, giữ lịch sử và giải phóng chỗ cũ. Hủy phân công đồng bộ đơn sang WITHDRAWN.

## Kết quả, báo cáo và dashboard

Student đọc `/student/assignments/current` theo kỳ nếu có, `/student/ojt-results`, `/:id` chỉ CONFIRMED. Xác nhận của Đào tạo là mốc công bố, không cần thêm endpoint publish riêng. DTO Student không trả raw handoff snapshot/audit; Enterprise history không trả snapshot audit nội bộ.

GET `/qhdn/dashboard` và `/qhdn/reports/acceptance|internships|enterprise-feedback` yêu cầu ojtSemesterId, hỗ trợ enterpriseId ở báo cáo. GET `/qhdn/reports/export?type=acceptance&ojtSemesterId=1&format=csv|json`, không page/limit, tối đa 10000 dòng. Không hỗ trợ PDF trong thay đổi này. GET `/student/dashboard` tổng hợp học vụ, đợt, phân công và thông báo của mình.

## Hợp đồng dịch vụ AI

Provider URL chỉ đọc từ cấu hình server, không nhận URL từ client. Request POST JSON, Bearer STUDENT_AI_API_KEY nếu có, timeout 20 giây, redirect bị chặn và response tối đa 1 MiB.

- CV_ANALYSIS_SERVICE_URL nhận `{cvId,mimeType,contentBase64}`. Trả `{summary,skills:string[],education:string[],experience:string[],languages:string[],modelVersion}`. POST `/student/cv/analyses` nhận cvId; lưu job RUNNING/COMPLETED/FAILED; GET `/student/cv/analyses/:id` chỉ chủ hồ sơ đọc. Không chạy model trong repository này.
- ROADMAP_SERVICE_URL nhận `{academicSummary}`. Trả `{recommendations:string[],modelVersion}`.
- MATCHING_SERVICE_URL nhận `{cv,positions}` với kết quả phân tích CV hiện tại và tối đa 500 vị trí được công bố trong kỳ. Trả `{matches:[{positionId,score,reason}],modelVersion}`; score 0–100, không được trả ID ngoài danh sách ứng viên hoặc trùng ID.
- API ghi rõ isAiRecommendation; thiếu provider trả 503, không có kết quả mẫu thay thế.

## Danh sách endpoint

Danh sách đầy đủ theo role tại [api-inventory-by-role.md](api-inventory-by-role.md).
