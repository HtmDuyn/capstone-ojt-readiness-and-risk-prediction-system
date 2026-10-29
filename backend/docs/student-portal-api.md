# API Sinh viên — REST và các nhóm đã gộp

Base URL `/api`, Bearer token STUDENT. GET không có body; ID tài nguyên nằm trong path, bộ lọc nằm trong query. POST/PATCH dùng JSON object với `Content-Type: application/json`. Upload CV dùng multipart/form-data.

Frontend dùng Axios instance chung (`adapter: xhr`). Request bị hủy khi rời trang không phải lỗi HTTP; 304 là cache hợp lệ. Chi tiết kiểm chứng DB duy nhất và luồng tới kết quả OJT chính thức: [student-flow-audit.md](student-flow-audit.md).

Giao diện sinh viên đã gộp đăng ký OJT và hồ sơ/CV vào một trang; bỏ chatbot nổi và phần đăng ký/xác nhận combo. API học vụ/combo vẫn giữ để các phân hệ khác sử dụng. `courseResults.items[].semesterTaken` là số kỳ học theo lộ trình, tách biệt với `periodCode` là học kỳ lịch.

`GET /students/me/opportunities?windowId=…` trả thêm `company.code`, `industry`, `contactPersonName`, `contactEmail`, `contactPhone` và `post.applicationInstructions` để xem chi tiết doanh nghiệp/tin tuyển dụng. Chỉ trả các vị trí/doanh nghiệp chưa xóa, chưa lưu trữ và tin đã công bố còn hạn trong đúng kỳ. Sinh viên chưa đủ điều kiện vẫn xem được danh sách; `canApply`/`blockers` kiểm soát nộp đơn.

Student có **22 operation cần xác thực: 13 GET, 7 POST, 2 PATCH**, cộng thêm `POST /auth/login` công khai. Swagger `/api-docs`, hợp đồng máy đọc `/api-docs/openapi.json`, đầu vào đầy đủ tại [api-input-reference.md](api-input-reference.md).

## 1. Hồ sơ và học vụ

`GET /api/students/:id` là API đọc tổng hợp thay cho các API riêng về bảng điểm, chương trình, tổng hợp học vụ, môn cần học, điều kiện/lịch sử xét và lịch sử combo.

`id` là StudentID, không phải UserID. Student chỉ đọc hồ sơ của mình; Admin/Đào tạo vẫn có quyền đọc theo nghiệp vụ. Không đổi thuật toán GPA, tín chỉ hoặc ràng buộc OJT kỳ chương trình 6.

### Chọn phần cần tải

Query `include` là danh sách phân cách bằng dấu phẩy. Không truyền thì lấy tất cả phần bên dưới; truyền `include` giúp bỏ truy vấn và dữ liệu không cần cho màn hình.

| Phần | Dữ liệu |
| --- | --- |
| `academicProgress` | GPA, thang điểm, tín chỉ, yêu cầu môn, môn dùng tính GPA, lỗi cấu hình |
| `courseResults` | Bảng điểm từng lần học, điểm số/điểm chữ, kỳ chương trình và học kỳ lịch/năm học |
| `comboSelections` | Các combo đã xác nhận và môn đã chọn |
| `ojtRegistrations` | Hồ sơ đăng ký và thông tin điều phối/phân công; đánh giá chỉ hiển thị cho Student sau khi kết quả CONFIRMED |
| `eligibility` | Kết quả hiện tại, lần xét gần nhất và quyết định chính thức cho kỳ đã chọn/suy ra |
| `eligibilityChecks` | Lịch sử xét/xác nhận, có phân trang |
| `comboHistory` | Lịch sử lựa chọn, lần thay đổi, ảnh hưởng học vụ, có phân trang |
| `academic` | Tổng hợp học vụ, điều kiện OJT, deadline, kịch bản tín chỉ và `supplementaryCourses` (môn cần học/học lại, tiên quyết, lý do) |
| `curriculum` | Chương trình đã ban hành: metadata, môn theo kỳ, combo/nhóm lựa chọn, tiên quyết, tương đương, chính sách GPA |

Thông tin cơ bản, CV và kỳ OJT mục tiêu vẫn được trả. `officialEligibility`/`officialDecision` kèm khi tải academicProgress/academic/eligibility. Nếu chưa có kỳ OJT, `academic`/`eligibility` là null. Chương trình chưa gán hoặc chưa công bố trả `curriculum=null`, kèm `curriculumStatus`; không làm mất các phần khác của hồ sơ.

`section=academicProgress` còn dùng được để tương thích cách lọc cũ; không dùng cùng `include`.

### Bộ lọc và phân trang

| Query | Áp dụng |
| --- | --- |
| `ojtSemesterId` | Chọn kỳ OJT cho học vụ, điều kiện và hồ sơ đăng ký; bỏ trống suy ra kỳ từ đăng ký gần nhất hoặc ánh xạ nấc 6 |
| `resultsPage`, `resultsLimit` | Phân trang courseResults |
| `courseId`, `academicPeriodId`, `courseStatus` | Lọc courseResults; status thuộc PASSED/FAILED/IN_PROGRESS/WITHDRAWN/RECOGNIZED |
| `ojtPage`, `ojtLimit` | Phân trang ojtRegistrations |
| `checksPage`, `checksLimit` | Phân trang eligibilityChecks; không truyền ojtSemesterId thì lịch sử gồm các kỳ |
| `comboPage`, `comboLimit` | Phân trang comboHistory |

Mỗi trang mặc định 1/20, limit tối đa 100. Mỗi phần danh sách trả `{items,total,page,limit}` độc lập. Lịch sử combo giữ đủ trường phase, previous, sourceEventId, progress và eligibility của API cũ.

```http
GET /api/students/1?include=academic,curriculum&ojtSemesterId=1
GET /api/students/1?include=courseResults&resultsPage=2&resultsLimit=20&courseStatus=FAILED
GET /api/students/1?include=eligibilityChecks,comboHistory&checksPage=2&comboPage=1
```

## 2. Hồ sơ thực tập, nhiệm vụ và kết quả

`GET /api/students/me/internships` trả:

```json
{
  "success": true,
  "data": {
    "studentId": 1,
    "ojtSemesterId": 1,
    "assignment": null,
    "tasks": {"items": [], "total": 0, "page": 1, "limit": 20},
    "results": {"items": [], "total": 0, "page": 1, "limit": 20},
    "result": null
  }
}
```

- `ojtSemesterId`: lọc kỳ OJT. Bỏ trống thì assignment là phân công chưa hủy mới nhất; results là lịch sử kết quả của mình.
- `assignmentId`: chọn đúng phân công lịch sử, kể cả đã hủy. Nhiệm vụ luôn thuộc phân công được chọn, không lẫn sang lần phân công mới.
- `resultId`: chọn kết quả CONFIRMED của mình, trả trong `result`, đồng thời chọn đúng phân công gắn kết quả và nhiệm vụ tương ứng. Không có, chưa công bố hoặc thuộc người khác đều trả 404.
- `tasksPage/tasksLimit`, `resultsPage/resultsLimit`: phân trang độc lập. Không dùng page/limit chung.
- Chọn assignmentId cùng resultId phải cùng phân công. results là danh sách kết quả theo kỳ được chọn; result là bản ghi chi tiết được chọn.

Assignment giữ thông tin doanh nghiệp/vị trí/học kỳ/hồ sơ đăng ký và người hướng dẫn. Kết quả giữ điểm chính thức/thành phần, nhận xét, tiêu chí/mẫu đánh giá và scoreDetails. Chưa có phân công thì assignment=null, tasks rỗng; lịch sử results vẫn hoạt động.

```http
GET /api/students/me/internships?ojtSemesterId=1&tasksPage=2&tasksLimit=20
GET /api/students/me/internships?assignmentId=5
GET /api/students/me/internships?resultId=7
```

## 3. Dashboard

`GET /api/students/me/dashboard?ojtSemesterId=1` trả `academic` (kèm supplementaryCourses), `registrationWindows`, `comboWindows`, `internship`, `notifications`, `jobApplications`.

Các danh sách trên dashboard lấy tối đa 5 bản ghi đầu và có total/page/limit. Đọc tiếp qua API hồ sơ/nhóm tương ứng. Toàn bộ dashboard dùng một transaction REPEATABLE READ READ ONLY; không lấy khóa ghi academic-calendar. Hồ sơ học vụ tải dữ liệu điểm/chương trình/combo một lần để tính hiện tại và kịch bản, tái dùng cho đối chiếu điều kiện trong cùng request. Không cache dữ liệu giữa các request.

## 4. Các API được giữ

| Chức năng | API |
| --- | --- |
| Tài khoản hiện tại | GET `/auth/me` |
| Hồ sơ/học vụ | GET `/students/:id` |
| Dashboard | GET `/students/me/dashboard` |
| Hồ sơ thực tập | GET `/students/me/internships` |
| Đợt chọn combo, có combo khả dụng/lựa chọn hiện tại | GET `/combo-registration-windows` |
| Xem trước tác động combo | POST `/combo-registration-windows/:id/preview` |
| Gửi lựa chọn combo | POST `/combo-registration-windows/:id/selections` |
| Đợt đăng ký OJT, có hồ sơ đã nộp và lý do chặn | GET `/ojt-registration-windows` |
| Danh sách/lịch sử hồ sơ OJT | GET `/ojt-registrations` |
| Gửi hồ sơ OJT | POST `/ojt-registrations` |
| Theo dõi trạng thái của mình theo kỳ | GET `/ojt-semesters/:id/students` |
| Cơ hội/vị trí thực tập | GET `/students/me/opportunities?windowId=...` |
| Đơn ứng tuyển và điều phối | GET `/job-applications` |
| Ứng tuyển | POST `/job-applications` |
| Thông báo | GET `/students/me/notifications` |
| Đánh dấu đã đọc/chưa đọc | PATCH `/students/me/notifications/:id` |
| Upload CV PDF | POST `/students/me/cv` — multipart field `cv`, tối đa 10 MiB |
| Download CV PDF | GET `/students/:id/cv?cvFileId=...` |
| Tư vấn AI | GET `/students/me/roadmap-recommendations?ojtSemesterId=...` |
| Cập nhật liên hệ cá nhân | PATCH `/accounts/me/profile` |
| Đổi mật khẩu | POST `/auth/change-password` |

Các API dùng chung còn cần cho nhân sự không bị xóa. GET `/internship-tasks` giữ cho ADMIN/OJT_COORD/ENTERPRISE; Student lấy nhiệm vụ trong internships. Upload/download CV và tư vấn AI giữ riêng vì khác định dạng/luồng xử lý. Auth giữ envelope user; nghiệp vụ dùng data, CV download trả PDF.

## 5. Các API đã gỡ và thay thế

| API GET đã gỡ | API/thành phần thay thế |
| --- | --- |
| `/students/:id/course-results` | `/students/:id?include=courseResults` |
| `/students/:id/eligibility` | `/students/:id?include=eligibility&ojtSemesterId=...` |
| `/students/:id/eligibility-checks` | `/students/:id?include=eligibilityChecks` |
| `/students/:id/combo-selections` | `/students/:id?include=comboHistory,comboSelections` |
| `/students/me/academic-summary` | `/students/:id?include=academic` |
| `/students/me/supplementary-course-options` | `/students/:id?include=academic` → academic.supplementaryCourses |
| `/students/me/curriculum` | `/students/:id?include=curriculum` |
| `/students/me/assignments/current` | `/students/me/internships` → assignment |
| `/students/me/ojt-results` | `/students/me/internships` → results |
| `/students/me/ojt-results/:id` | `/students/me/internships?resultId=...` → result |

Các route trên không còn được đăng ký hoặc hiển thị trong Swagger; không chuyển tiếp và không giữ alias. Các adapter POST `/student/*/search`, `/detail`, `/create`, `/update` cũ cũng đã gỡ từ đợt REST trước. FE cần đổi URL và đọc đúng phần response theo bảng, cùng các tên phân trang mới.

## JSON body nghiệp vụ

```http
POST /api/ojt-registrations
Content-Type: application/json

{"windowId":1,"application":{"contactPhone":"0901234567","contactEmail":"student@example.com","note":"Đăng ký OJT"}}
```

```http
POST /api/job-applications
Content-Type: application/json

{"registrationId":1,"postId":1,"positionId":1,"coverLetter":"Nguyện vọng ứng tuyển"}
```

```http
PATCH /api/students/me/notifications/1
Content-Type: application/json

{"isRead":true}
```

Combo gửi JSON `{comboId,courseIds,reason?}`; preview không cần reason. Cập nhật tài khoản nhận `{fullName?,phone?}`; đổi mật khẩu nhận `{currentPassword,newPassword}`. ID ví dụ phải thay bằng dữ liệu thật. Không gửi body cho GET, không đặt Content-Type JSON cho FormData.

Bản gộp này không thêm bảng/cột, không cần migration. Không đổi quy tắc GPA, 70 tín chỉ/tối đa 2 môn nợ, quyền bàn giao hoặc kỳ OJT cố định ở nấc chương trình 6. Không trả mật khẩu, khóa hoặc bytes CV trong JSON. AI chưa cấu hình vẫn trả 503 AI_NOT_CONFIGURED.
