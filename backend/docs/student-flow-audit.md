# Đối soát luồng sinh viên — 28/10/2026

Phạm vi: source frontend/backend hiện tại, DB PostgreSQL được cấu hình trong dự án, các API của STUDENT và điểm nối bàn giao Đào tạo → QHDN → ứng tuyển → doanh nghiệp. Giữ các thay đổi đã có trong working tree; không reset DB.

## Kết quả DB

`student01`: `Users.UserID=5 → Students.StudentID=1`, mã `SE250001`, chương trình 41, cohort 1/nhóm A. Tài khoản và hồ sơ ACTIVE, không bị xóa. API học vụ tính GPA 8.04 và 72 tín chỉ từ bảng điểm; kỳ mục tiêu OJT là 1 theo ánh xạ nấc chương trình 6.

20 tài khoản STUDENT đều có hồ sơ. Đối soát 183 khóa ngoại trong nhóm bảng trực tiếp/gián tiếp liên quan: tất cả đã validate, không có bản ghi mồ côi.

| Nhóm bảng | Số bản ghi lúc kiểm tra |
| --- | ---: |
| Students / StudentAcademicPlacements | 20 / 20 |
| StudentCourseResults | 520 |
| StudentOJTCalculatedResults / EligibleStudentHandoffItems | 11 / 11 |
| EligibilityChecks / EligibilityConfirmations | 0 / 0 |
| OJTRegistrationWindows | 1 |
| OJTRegistrations / JobApplications / StudentEnterpriseCoordination | 10 / 10 / 10 |
| InternshipAssignments / InternshipTasks / InternshipEvaluations | 4 / 12 / 1 |
| Notifications | 20 |
| StudentCVFiles / OJTResults | 0 / 0 |
| ComboRegistrationWindows / StudentComboSelections | 0 / 0 |

Quan hệ chính:

```mermaid
flowchart TD
  Roles --> Users
  Users --> Students
  Users --> Notifications
  Students --> StudentAcademicPlacements
  StudentAcademicPlacements --> CohortGroups
  CohortGroups --> CohortCurriculumPeriods
  CohortCurriculumPeriods --> OJTSemesters
  Students --> TrainingPrograms
  Students --> StudentCourseResults
  Students --> StudentOJTCalculatedResults
  StudentOJTCalculatedResults --> EligibleStudentHandoffItems
  EligibleStudentHandoffItems --> OJTRegistrations
  Students --> StudentCVFiles
  OJTRegistrations --> JobApplications
  StudentCVFiles --> JobApplications
  JobApplications --> StudentEnterpriseCoordination
  StudentEnterpriseCoordination --> InternshipAssignments
  InternshipAssignments --> InternshipTasks
  InternshipAssignments --> InternshipEvaluations
  InternshipAssignments --> OJTResults
```

Sơ đồ biểu diễn liên kết nghiệp vụ; chiều mũi tên không phải chiều khai báo FK. Chi tiết từng FK nằm trong `.local/student-db-audit.json`, tạo bởi script audit.

## Lỗi và sửa đổi

1. `/auth/me` cần trả StudentID liên kết. Frontend phân biệt trường bị thiếu (backend không đồng bộ) với `null` (chưa liên kết). DB hiện không thiếu liên kết student01; không tạo thêm hồ sơ hoặc gán UserID làm StudentID để chữa lỗi.
2. FE đã có các thay đổi chuyển sang REST nhưng còn URL `/student/ojt-registration-windows` và tài liệu cũ. Dùng `/ojt-registration-windows` cùng các nhóm `/students/me/dashboard`, `/students/me/internships`, profile `include` và tên phân trang hiện hành.
3. Header trước đây lấy mã SE150000/kỳ 7 từ mock. Nay đọc mã, kỳ, ngành từ hồ sơ API; chuông thông báo nối trang và unreadCount thật.
4. Handoff mới dùng `StudentOJTCalculatedResults`/`CalculatedBatchID`, còn ứng tuyển vẫn đòi EligibilityChecks cũ. Bổ sung kiểm tra admission theo đúng nguồn bàn giao; không dựng xác nhận cũ. Chặn kết quả không ELIGIBLE, stale, đổi batch, tài khoản/hồ sơ/chương trình không hợp lệ. Luồng EligibilityChecks cũ vẫn giữ nguyên.
5. Dashboard/profile có `admissionEligibility` riêng với `officialEligibility`. Danh sách QHDN nhận bàn giao hỗ trợ cả hai nguồn, giữ kết quả tại thời điểm bàn giao.
6. Ứng tuyển trực tiếp kiểm tra biểu mẫu liên hệ và kỳ của registration/window; hỗ trợ retry cùng yêu cầu và nộp lại sau từ chối. FE tải đủ trang, lọc đúng kỳ và bỏ phản hồi cũ khi đổi đợt.
7. `/student/profile` chưa được khai báo; form tài khoản đọc nhầm `user.fullName` thay vì `account.full_name`. Đã nối trang, sửa envelope, thêm phone trong auth/me và xử lý đổi mật khẩu tạm trước khi truy cập nghiệp vụ.
8. Giữ mã lỗi backend (`errorCode`), lỗi cấu hình AI và thao tác hủy request; không thay lỗi AI bằng thông báo proxy chung.
9. Backend local hỗ trợ `.env` tại backend hoặc `src/.env`, ưu tiên biến môi trường deployment và backend/.env. Đã tạo cấu hình development local của FE để chạy qua proxy `/api` tới localhost:3000.

Không cần migration hoặc chạy lại file `DB` cho các sửa đổi này.

## API và kiểm tra

Swagger có 22 operation xác thực cho STUDENT (13 GET, 7 POST, 2 PATCH), cộng POST login công khai. Danh sách và request hiện hành: [student-portal-api.md](student-portal-api.md), [tích hợp frontend](../../frontend/docs/student-api-integration.md).

- Build backend và frontend thành công.
- 197/197 kiểm tra HTTP trên 20 tài khoản: hồ sơ, học vụ, curriculum, đợt, đơn, phân công/nhiệm vụ/kết quả, thông báo, vị trí, phân quyền và lỗi đầu vào.
- 38/38 kiểm tra HTTP sau sửa trên student01, student02 và student05, gồm xác nhận student01 có thể ứng tuyển theo bàn giao frontend.
- 29/29 kiểm tra bổ sung trên student01: trạng thái theo kỳ, phân trang bảng điểm, quyền CV, validation POST/PATCH, PDF không hợp lệ và AI chưa cấu hình.
- 11/11 kiểm tra luồng có ghi và rollback: tạo đơn/retry, bảng điểm stale, kết quả không đủ điều kiện, chưa bàn giao, dùng đăng ký người khác, form sai, đợt đóng, nộp lại sau từ chối, CV upload/retry/download và quyền sở hữu, thông báo read/unread và quyền nhận, QHDN nhận roster frontend.
- Đăng nhập thực tế qua frontend local/proxy: login, auth/me và profile đều HTTP 200; trả đúng UserID 5, StudentID 1, SE250001/kỳ 5, GPA 8.04 và 72 tín chỉ. Bản frontend kiểm thử đang chạy tại `http://127.0.0.1:5174` vì cổng 5173 đã có tiến trình khác; backend loopback tại cổng 3000 không bật worker nền.

Các kiểm tra HTTP dùng server loopback và connection DB mặc định chỉ đọc. Kiểm tra luồng dùng savepoint trong transaction luôn rollback; không gửi email, không gọi AI hoặc gửi mật khẩu ra dịch vụ bên ngoài. API combo được kiểm tra validation; chưa có đợt/roster để kiểm thử lựa chọn combo thành công. Chưa chạy kiểm thử UI tự động trong trình duyệt.

Chạy tại thư mục `backend` sau build:

```powershell
npm.cmd run build
node scripts/audit-student.cjs
node scripts/check-student-api.cjs --all --admission
node scripts/check-student-workflow.cjs
```

Script workflow yêu cầu bộ demo hiện tại (student01 chưa ứng tuyển, student02 có đăng ký, student05 chưa bàn giao và có hồ sơ bị từ chối để thử nộp lại). Script không reset hoặc tự dựng dữ liệu demo.

## Phần còn phụ thuộc cấu hình/nghiệp vụ

- Chưa cấu hình `ROADMAP_SERVICE_URL`: tư vấn AI trả 503 AI_NOT_CONFIGURED.
- Chưa có đợt combo, CV được tải lên hoặc kết quả OJT đã công bố. Các màn hình tương ứng trả trạng thái trống đúng dữ liệu.
- Chưa có API sinh viên cập nhật nhiệm vụ/nộp báo cáo tuần. Cần thiết kế nghiệp vụ và triển khai riêng nếu muốn mở các thao tác này.
- FE production đang cấu hình Render. Sau khi người dùng cho phép rõ ràng, đã kiểm thử đăng nhập mẫu student01: login HTTP 200, auth/me HTTP 200, đúng UserID 5/role STUDENT nhưng JSON **không có trường studentId**. OpenAPI Render lại mô tả trường này, cho thấy hợp đồng tài liệu và controller đang chạy chưa đồng bộ. Đây là nguyên nhân trực tiếp của thông báo chưa liên kết trong ảnh, không phải thiếu liên kết DB. Bản source/local trả đúng studentId; cần triển khai lại backend Render. Không gửi JWT ra log hoặc thay đổi dữ liệu khi kiểm tra.

Luồng dùng để demo: student01 đăng nhập → dashboard (SE250001/kỳ 5, 72 tín chỉ) → đợt OJT mục tiêu → upload CV nếu có → chọn vị trí → gửi trực tiếp → theo dõi phản hồi doanh nghiệp. Dùng student02 để xem nhiệm vụ/phân công; dùng student05 để xem trạng thái chưa đủ điều kiện/chưa bàn giao.
