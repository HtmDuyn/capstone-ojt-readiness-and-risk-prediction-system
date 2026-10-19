# Rà soát response danh sách API

## Phạm vi và kết quả

Đã đọc các service/repository và gọi HTTP toàn bộ 45 operation có phân trang trong Swagger. Kiểm tra thêm ba danh sách không phân trang: vai trò, email khởi tạo và lịch chọn combo theo kỳ. Tổng API giữ nguyên 160 operation, sáu nhóm Swagger. Không thêm endpoint hoặc thay đổi DB trong đợt rà soát này.

Các danh sách đã có tên, mã, mô tả và tổng hợp đúng chức năng được giữ nguyên. Các danh sách thiếu thông tin liên kết được bổ sung context có chọn lọc; các trường ID, bộ lọc, total/page/limit và envelope cũ được giữ nguyên.

## Phần đã bổ sung

- Danh sách sinh viên bàn giao: liên hệ, CV metadata, chương trình/khóa/nhóm, kỳ OJT/học kỳ, đợt đăng ký, thông tin bàn giao/người bàn giao, kết quả xét chính thức đã lưu, doanh nghiệp/vị trí, điều phối và phân công/giảng viên hướng dẫn.
- Danh sách đăng ký/ứng tuyển: student, program/currentProgram, cohort, semester, window, company/position, tên người gửi; giữ đúng phiên bản CV đã dùng trong ứng tuyển.
- Danh sách QHDN và doanh nghiệp: tên kỳ/chương trình, mô tả vị trí, chỉ tiêu; metadata ứng tuyển/CV đã gắn điều phối, không truy vấn file CV mới nhất của sinh viên để thay hồ sơ đã gửi.
- Danh sách quy tắc/lịch/batch xét/batch dự báo: tên chương trình, học kỳ, sinh viên, quy tắc/mô hình và tên người thực hiện.
- Cảnh báo/can thiệp/nhật ký/import/tài khoản: các tên hiển thị tương ứng với ID đã có trên trang, dùng projection không có thông tin xác thực.
- Tin tuyển dụng: bổ sung ojtSemesterId và context kỳ; remainingSlots tính từ phân công hiện tại thay vì dùng bộ đếm cũ.
- Lịch sử bàn giao: tên kỳ/người bàn giao và studentCount; registrationIds vẫn giữ nguyên.
- Email khởi tạo: user, canRetry theo cùng điều kiện API gửi lại, total/limit/hasMore; giới hạn cũ 100 email mới nhất được giữ nguyên.

## Giới hạn và quyền dữ liệu

- Một truy vấn context tổng hợp cho một trang, gộp các ID trùng; không truy vấn từng dòng và không tải toàn bộ danh mục. Quan hệ chưa có trả null khi có ID null; không loại dòng làm sai total.
- Context sinh viên là thông tin hiện tại; program của đăng ký vẫn theo programId đã lưu, currentProgram theo chương trình hiện tại. Phiên bản CV hồ sơ ứng tuyển giữ nguyên.
- Không nhúng file/base64, mật khẩu, token hoặc nội dung email mã hóa. Không thay đổi quyền truy cập CV.
- Sinh viên chỉ đọc hồ sơ của mình; doanh nghiệp chỉ đọc dữ liệu đã thuộc doanh nghiệp; QHDN danh sách bàn giao chỉ nhận bản ghi đã bàn giao, danh sách registered-students vẫn xem được trước bàn giao.
- Điểm/kết quả OJT chưa xác nhận vẫn bị ẩn với doanh nghiệp. Các trường context không mở thêm quyền duyệt/điều phối.
- officialEligibility trong danh sách bàn giao là kết quả xác nhận đã lưu, validity=NOT_RECHECKED. Không dùng trường này như kết luận hiệu lực hiện tại; API ứng tuyển/điều phối tiếp tục kiểm tra lại trước khi ghi.
- Danh sách cấu hình/báo cáo trả metadata và tổng hợp đúng chức năng; không nhúng toàn bộ bảng điểm, lịch sử hoặc toàn bộ sinh viên vào từng dòng danh mục.

## Ma trận 45 API có phân trang

HTTP 200 được kiểm tra trong schema riêng với dữ liệu fixture; đây không phải số lượng dữ liệu sản xuất. Các danh sách không có bản ghi vẫn trả mảng rỗng và metadata đúng.

| API | Nhóm Swagger | Context có trong mẫu kiểm tra | Kết quả |
| --- | --- | --- | --- |
| `POST /api/json/academic-years/search` | Admin, Phòng đào tạo | Thông tin chính của bản ghi đã có | 200 |
| `POST /api/json/academic-periods/search` | Admin, Phòng đào tạo, Phòng QHDN | `academicYear` | 200 |
| `POST /api/json/cohorts/search` | Admin, Phòng đào tạo | Thông tin chính của bản ghi đã có | 200 |
| `POST /api/json/academic/alerts/search` | Admin, Phòng đào tạo | `student`, `program`, `cohort` | 200 |
| `POST /api/json/academic/course-demand/search` | Admin, Phòng đào tạo | Thông tin chính của bản ghi đã có | 200 |
| `POST /api/json/accounts/search` | Admin | Thông tin chính của bản ghi đã có | 200 |
| `POST /api/json/combo-registration-windows/search` | Admin, Phòng đào tạo, Sinh viên | `semester`, `academicPeriod`, `createdByUser` | 200 |
| `POST /api/json/combo-registration-windows/selections/search` | Admin, Phòng đào tạo | `student`, `program` | 200 |
| `POST /api/json/students/combo-selections/search` | Admin, Phòng đào tạo, Sinh viên | Mảng rỗng hợp lệ | 200 |
| `POST /api/json/majors/search` | Admin, Phòng đào tạo | Thông tin chính của bản ghi đã có | 200 |
| `POST /api/json/courses/search` | Admin, Phòng đào tạo | Thông tin chính của bản ghi đã có | 200 |
| `POST /api/json/curricula/search` | Admin, Phòng đào tạo | `createdByUser`, `publishedByUser` | 200 |
| `POST /api/json/ojt-rule-sets/search` | Admin, Phòng đào tạo | `program`, `semester`, `createdByUser`, `publishedByUser` | 200 |
| `POST /api/json/students/eligibility-checks/search` | Admin, Phòng đào tạo, Sinh viên | `student`, `semester`, `ruleSet`, `checkedByUser` | 200 |
| `POST /api/json/eligibility-check-runs/detail` | Admin, Phòng đào tạo | `student`, `program`, `ruleSet` | 200 |
| `POST /api/json/ojt-registration-windows/search` | Admin, Phòng đào tạo, Sinh viên | `semester`, `academicPeriod`, `createdByUser`, `openedByUser` | 200 |
| `POST /api/json/ojt-registrations/search` | Admin, Phòng đào tạo, Phòng QHDN, Sinh viên | `window`, `handoff`, `student`, `program`, `currentProgram`, `cohort`, `semester`, `submittedByUser` | 200 |
| `POST /api/json/ojt-semesters/eligible-student-handoffs/search` | Admin, Phòng đào tạo, Phòng QHDN | `semester`, `createdByUser` | 200 |
| `POST /api/json/ojt-semesters/students/search` | Admin, Phòng đào tạo, Phòng QHDN, Sinh viên | `cv`, `window`, `handoff`, `officialEligibility`, `student`, `program`, `cohort`, `semester`, `company`, `position` | 200 |
| `POST /api/json/ojt-results/search` | Admin, Phòng đào tạo, Phòng QHDN | `student`, `program`, `semester`, `company`, `position`, `transferredByUser` | 200 |
| `POST /api/json/companies/search` | Admin, Phòng QHDN | Thông tin chính của bản ghi đã có | 200 |
| `POST /api/json/positions/search` | Admin, Phòng QHDN | `semester`, `company` | 200 |
| `POST /api/json/ojt-coordinations/search` | Admin, Phòng QHDN | `student`, `company`, `position`, `semester`, `coordinatedByUser` | 200 |
| `POST /api/json/assignments/search` | Admin, Phòng QHDN | `student`, `company`, `position`, `semester` | 200 |
| `POST /api/json/internship-evaluations/search` | Admin, Phòng QHDN | `student`, `company`, `position`, `semester`, `evaluatedByUser` | 200 |
| `POST /api/json/qhdn/registered-students/search` | Admin, Phòng QHDN | `cv`, `student`, `program`, `cohort` | 200 |
| `POST /api/json/qhdn/reports/search` | Admin, Phòng QHDN | Thông tin chính của bản ghi đã có | 200 |
| `POST /api/json/students/search` | Admin, Phòng đào tạo | `cv`, `cohort`, `program` | 200 |
| `POST /api/json/students/course-results/search` | Admin, Phòng đào tạo, Sinh viên | Thông tin chính của bản ghi đã có | 200 |
| `POST /api/json/academic-imports/search` | Admin, Phòng đào tạo | `importedByUser` | 200 |
| `POST /api/json/academic-imports/detail` | Admin, Phòng đào tạo | Thông tin chính của bản ghi đã có | 200 |
| `POST /api/json/assessment-templates/search` | Admin | Mảng rỗng hợp lệ | 200 |
| `POST /api/json/admin/prediction-jobs/detail` | Admin | `student` | 200 |
| `POST /api/json/predictions/search` | Admin | `student`, `semester`, `model` | 200 |
| `POST /api/json/admin/models/search` | Admin | Thông tin chính của bản ghi đã có | 200 |
| `POST /api/json/alerts/search` | Admin | `student`, `semester` | 200 |
| `POST /api/json/students/interventions/search` | Admin | `student`, `createdByUser`, `assignedToUser` | 200 |
| `POST /api/json/admin/reports/readiness/search` | Admin | `student`, `semester`, `model` | 200 |
| `POST /api/json/admin/audit-logs/search` | Admin | Thông tin chính của bản ghi đã có | 200 |
| `POST /api/json/enterprise/candidates/search` | Doanh nghiệp | `student`, `position`, `jobApplication`, `semester` | 200 |
| `POST /api/json/enterprise/internships/search` | Doanh nghiệp | `student`, `position`, `jobApplication`, `semester` | 200 |
| `POST /api/json/recruitment/windows/search` | Admin, Phòng QHDN, Doanh nghiệp | `semester`, `academicPeriod` | 200 |
| `POST /api/json/recruitment/posts/search` | Admin, Phòng QHDN, Doanh nghiệp | `semester`, `academicPeriod`, `company` | 200 |
| `POST /api/json/job-applications/search` | Admin, Phòng QHDN, Sinh viên | `company`, `position`, `cv`, `student`, `semester` | 200 |
| `POST /api/json/students/me/opportunities/search` | Sinh viên | `company` | 200 |

## Kiểm chứng

Build TypeScript và sinh tài liệu API thành công. Kiểm tra phân trang/trang rỗng, giữ total, scope sinh viên/doanh nghiệp, chặn sinh viên gọi danh sách QHDN, che điểm chưa xác nhận, không trả credential/file bytes. Hash dữ liệu nghiệp vụ trước/sau các API đọc giống nhau. Kiểm tra một lần truy vấn context cho nhiều dòng và ID trùng; quan hệ null không phát sinh truy vấn. Schema fixture được xóa sau kiểm tra; không giữ script test trong repository.
