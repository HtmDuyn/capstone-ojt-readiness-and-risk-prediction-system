> Cập nhật mới nhất: [API đã xóa theo luồng hiện tại](api-unused-cleanup.md); còn 149 API. Các bảng lịch sử bên dưới không thay thế danh sách Swagger hiện hành.

> Cập nhật sau rà soát: đã thực hiện B1–B5, C1–C3 và D1; còn 154 API. Báo cáo dưới đây là snapshot trước khi thực hiện, không phải danh sách endpoint hiện hành. Xem [hợp đồng mới](api-read-report-consolidation.md) và [toàn bộ API](swagger-api-by-role.md).

> Đây là báo cáo trước lượt gộp bốn API detail. Hợp đồng hiện tại: [gộp detail vào list](api-detail-list-consolidation.md), [danh sách Swagger mới](swagger-api-by-role.md). Các URL detail đã xóa trong bảng dưới chỉ là lịch sử rà soát.

# Rà soát API dư — trạng thái hiện tại

Rà soát ngày 19/10/2026, sau khi gộp account/PATCH và chuyển khung chương trình sang import. Báo cáo này thay kiểm kê cũ 174 API. Lượt này chỉ kiểm tra và cập nhật báo cáo, không sửa endpoint/FE hoặc DB.

## 1. Đối chiếu toàn bộ route

- 164 operation Swagger duy nhất; Admin 154, Phòng đào tạo 92, Phòng QHDN 44, Doanh nghiệp 12, Sinh viên 17, Auth 3.
- 126 adapter JSON; cùng native route tương ứng có 290 cặp method/path chạy thực tế. 126 native bổ sung là nguồn dispatch của adapter, không phải 126 chức năng dư cần xóa.
- Đối chiếu tất cả mount và method/path thực tế: không có route ngoài spec/adapter mapping, không thiếu route đã tài liệu hóa. Toàn bộ schema reference nội bộ giải được.
- 4 native operation có hai handler theo role: POST/PATCH companies và POST/PATCH assignments. Admin middleware chọn handler Admin; QHDN chọn handler QHDN. Không tăng số API Swagger, không xóa một handler chỉ vì trùng URL; payload và ràng buộc nghiệp vụ đang khác nhau.
- Không còn account status/role riêng, assignment status riêng, placement riêng, open/close của ba loại đợt, tạo khung chương trình/combos thủ công. Các chức năng tạo curriculum/combo chỉ còn trong helper import.

## 2. Năm API có thể bỏ sau khi hoàn thiện search

Các dòng dưới đều là POST; tiền tố đầy đủ giữ trong bảng để FE đổi đúng đường dẫn.

| Mã | API dự kiến bỏ | API thay thế | Phần bắt buộc phải bổ sung |
|---|---|---|---|
| B1 | /api/json/academic-periods/detail | /api/json/academic-periods/list | academicPeriodId chính xác; cùng DTO học kỳ/OJT đã có |
| B2 | /api/json/accounts/detail | Admin: /api/json/accounts/list; tự xem: GET /api/accounts/me/profile | Search thêm userId nhưng giữ ADMIN-only; không mở danh sách tài khoản cho sinh viên/QHDN/Đào tạo |
| B3 | /api/json/ojt-coordinations/detail | /api/json/ojt-coordinations/list | coordinationId; lịch sử audit và chuỗi điều phối có phân trang khi chọn ID |
| B4 | /api/json/internship-evaluations/detail | /api/json/internship-evaluations/list | evaluationId; lịch sử audit phân trang; giữ context/registration/assignment/template |
| B5 | /api/json/enterprise/candidates/detail | /api/json/enterprise/candidates/list | candidateId; khi chọn ID vẫn đọc được lần giới thiệu cũ của doanh nghiệp đó, không áp dụng điều kiện latest của danh sách |

Kết luận: dư về số endpoint có thể phục vụ chung, chưa dư hoàn toàn về hợp đồng hiện tại. Không có API nào trong bảng được xóa trong lượt rà soát. Sau khi triển khai đủ cả 5 nhóm, 164 → 159 API duy nhất. Response đơn account/data sẽ đổi sang item của trang danh sách, FE phải đổi cách đọc. Không giả định các search hiện đã nhận ID: mã nguồn hiện chưa nhận các ID này.

## 3. Có thể tối ưu nhưng không coi là API vô dụng

| Mã | API/nhóm | Đánh giá |
|---|---|---|
| D1 | GET /api/auth/me và GET /api/accounts/me/profile | Cùng định danh/liên hệ/vai trò nhưng DTO khác và auth/me có mustChangePassword; profile có timestamp. Có thể thống nhất một API đọc danh tính, giữ PATCH profile. FE hiện dùng auth/me |
| D2 | POST /api/json/students/academic-progress/search | Dữ liệu đã có trong students/detail, dùng cùng hàm tính. Có thể thay bằng section của profile để đọc nhẹ; chưa xóa ngay để tránh tải tất cả điểm/OJT |
| C1 | GET /api/admin/dashboard/summary và POST /api/json/admin/dashboard/search | Một cái tổng hệ thống không lọc, một cái thống kê dự đoán theo scope. Có thể section=summary/all nhưng không trộn mẫu số/phạm vi |
| C2 | 3 POST /api/json/qhdn/reports/{acceptance,internships,enterprise-feedback}/search | Dùng chung report(type,...). Có thể một reports/search nhận type; giảm 2 URL nhưng vẫn là ba báo cáo khác nhau |
| C3 | POST /api/json/academic/dashboard/search và /api/json/academic/eligibility-statistics/search | Cùng report(c,scope), nhưng summary/current/stale và groups khác nhau. Có thể section/groupBy |
| C4 | POST /api/json/predictions/detail | Search thiếu InputSnapshot và lọc predictionId. Có thể nạp theo ID/include; không mang mọi snapshot vào danh sách |
| C5 | POST /api/json/academic-imports/detail | Khác search ở dữ liệu từng dòng raw/normalized/errors và phân trang con. Cần importId + rowsPage/rowsLimit nếu gộp |
| C6 | POST /api/json/ojt-registrations/detail | Thêm officialEligibility, handoffSnapshot, events, điều phối/phân công. Cần registrationId + include/phân trang con, giữ quyền theo handoff/ownership |
| C7 | POST /api/json/ojt-results/detail | Có lịch sử phiên bản khác search; cần resultId + historyPage/historyLimit nếu gộp |
| C8 | POST /api/json/recruitment/posts/review và /close | Cùng reviewPost, có thể một lệnh action PUBLISH/REJECT/CLOSE staff-only. Không đưa status tùy ý vào PATCH chung với doanh nghiệp |
| C9 | PUT cấu hình + POST open/close /api/json/ojt-semesters/assessment-window | Bước xét chính thức sau Block 3 cần resultsFinalized và mốc dữ liệu. Vẫn nên giữ riêng lúc này; không tương đương 3 loại registration window đã gộp |

Các nhóm C/D không cộng vào mục tiêu 159, vì còn đánh đổi về DTO, chi phí đọc hoặc bước xác nhận nghiệp vụ. Chưa có số liệu sử dụng production để kết luận endpoint nào không được dùng.

## 4. Các API cần giữ

- Import preview/commit; danh mục môn/chuyên ngành: import cần dữ liệu tham chiếu tồn tại. Import tạo cả khung/combos, không có nghĩa phải bỏ quyền sửa bản nháp.
- PATCH metadata chương trình và các PUT courses/prerequisites/course-equivalences/combo courses: hỗ trợ sửa/rà soát nháp. Các PUT thay thế tập con, reset cờ review và kiểm tra phụ thuộc; không gọi là dư chỉ vì input nằm trong import.
- Curriculum detail: cấu trúc lớn khác danh sách; publish: kiểm tra và khóa phiên bản. Rule/template publish cũng có tác dụng chính thức.
- Student course-results/search có lọc courseId/academicPeriodId/status; profile mới chỉ phân trang. Student eligibility/search trả current/latest/official; profile chỉ officialEligibility. Combo history có sự kiện, profile chỉ confirmed choices. Chưa đủ tương đương để xóa.
- Đăng ký, xét/confirm, duyệt, handoff, giới thiệu, quyết định, reassign, đánh giá, transfer/revision/confirm kết quả: khác actor, snapshot, version và trạng thái. Reassign tạo dòng lịch sử mới, confirm điểm đồng bộ môn học và khóa hồ sơ.
- Extensions/finalize/reminders combo; ngoại lệ kỳ và revoke; email retry: thao tác riêng theo đối tượng/tác vụ.
- Export không bằng một trang search: trả tập đầy đủ có giới hạn và CSV/PDF/JSON; dashboard cần tổng hợp phía server, không tính tổng từ một trang FE.
- DELETE mềm không bằng status INACTIVE: có kiểm tra quan hệ và DeletedAt.
- Login/change-password/password-reset, profile tự sửa và Admin update khác dữ liệu/quyền.
- Alert status và enterprise candidate decision là lệnh cập nhật duy nhất của tài nguyên đó; không có PATCH chung đang song song để gộp giảm thêm.
- Async job create/detail cho prediction và eligibility: khác tác vụ phát sinh với polling tiến độ.

## 5. Phạm vi kiểm tra FE

Đã đối chiếu các hợp đồng mới với mã nguồn FE checkout và các ref đã rà soát trong phiên. Checkout chủ yếu gọi login/me, các màn hình sinh viên còn mock; không dùng sự vắng mặt lời gọi trong FE để kết luận xóa API nghiệp vụ. Nhánh Phòng đào tạo đã biết cần đổi các đường dẫn cũ ojt-semesters/search, curricula/combos/search, create combo và open/close registration window. Không fetch hoặc kiểm thử UI/Render trong lượt này; không khẳng định toàn bộ nhánh remote/production đã tương thích.

## 6. Kiểm kê toàn bộ 164 API

B: nhóm nên gộp tiếp sau khi bổ sung hợp đồng. C/D: có thể tối ưu thiết kế, chưa coi là dư. GIỮ: không có căn cứ xóa hiện tại. Mỗi operation ghi một lần dù có nhiều tag role.

| # | Method | Đường dẫn | Nhóm Swagger | Chức năng | Kết luận | Lý do/điều kiện |
|---:|---|---|---|---|---|---|
| 1 | POST | `/api/academic-years` | Admin, Phòng đào tạo | Tạo năm học | GIỮ | Giữ: tạo bản ghi/tác vụ độc lập; không gộp tạo và cập nhật bằng ID tùy chọn. |
| 2 | POST | `/api/academic-periods` | Admin, Phòng đào tạo | Tạo kỳ học và Block 3 | GIỮ | Giữ: tạo bản ghi/tác vụ độc lập; không gộp tạo và cập nhật bằng ID tùy chọn. |
| 3 | POST | `/api/cohorts` | Admin, Phòng đào tạo | Tạo khóa và nhóm | GIỮ | Giữ: tạo bản ghi/tác vụ độc lập; không gộp tạo và cập nhật bằng ID tùy chọn. |
| 4 | POST | `/api/academic/alerts/notifications` | Admin, Phòng đào tạo | Gửi cảnh báo học vụ | GIỮ | Giữ: gửi/nhắc/retry là tác vụ có side effect; không tự chạy khi cập nhật dữ liệu. |
| 5 | POST | `/api/accounts` | Admin | Tạo tài khoản | GIỮ | Giữ: tạo bản ghi/tác vụ độc lập; không gộp tạo và cập nhật bằng ID tùy chọn. |
| 6 | GET | `/api/accounts/me/profile` | Admin, Phòng đào tạo, Phòng QHDN, Doanh nghiệp, Sinh viên | Xem hồ sơ cá nhân | D1 | Gần trùng GET auth/me; cần thống nhất DTO (snake_case/camelCase, timestamp, mustChangePassword) trước khi chỉ giữ một API đọc danh tính. |
| 7 | PATCH | `/api/accounts/me/profile` | Admin, Phòng đào tạo, Phòng QHDN, Doanh nghiệp, Sinh viên | Cập nhật hồ sơ cá nhân | GIỮ | Giữ: người dùng tự sửa hồ sơ; không được sửa quyền/trạng thái như Admin. |
| 8 | POST | `/api/auth/login` | Auth | Đăng nhập bằng email và mật khẩu | GIỮ | Giữ: xác thực, đổi mật khẩu và reset có quyền/dữ liệu đầu vào khác nhau. |
| 9 | GET | `/api/auth/me` | Auth | Xem tài khoản đang đăng nhập | D1 | Gần trùng GET accounts/me/profile; FE hiện dùng auth/me. Không bỏ trước khi thống nhất dữ liệu và cập nhật FE. |
| 10 | POST | `/api/combo-registration-windows` | Admin, Phòng đào tạo | Tạo đợt chọn hoặc xác nhận combo | GIỮ | Giữ: tạo bản ghi/tác vụ độc lập; không gộp tạo và cập nhật bằng ID tùy chọn. |
| 11 | POST | `/api/majors` | Admin, Phòng đào tạo | Tạo chuyên ngành | GIỮ | Giữ: tạo bản ghi/tác vụ độc lập; không gộp tạo và cập nhật bằng ID tùy chọn. |
| 12 | POST | `/api/courses` | Admin, Phòng đào tạo | Tạo môn học | GIỮ | Giữ: tạo bản ghi/tác vụ độc lập; không gộp tạo và cập nhật bằng ID tùy chọn. |
| 13 | POST | `/api/curriculum-imports/preview` | Admin, Phòng đào tạo | Kiểm tra dữ liệu nhập khung chương trình | GIỮ | Giữ: preview không ghi dữ liệu; commit ghi dữ liệu/batch và xử lý idempotency. |
| 14 | POST | `/api/curriculum-imports/commit` | Admin, Phòng đào tạo | Nhập khung chương trình | GIỮ | Nguồn tạo khung chương trình/combos mới; tạo bản DRAFT, ghi batch và idempotency. |
| 15 | POST | `/api/ojt-rule-sets` | Admin, Phòng đào tạo | Tạo bộ quy tắc OJT | GIỮ | Giữ: tạo bản ghi/tác vụ độc lập; không gộp tạo và cập nhật bằng ID tùy chọn. |
| 16 | POST | `/api/eligibility-check-runs` | Admin, Phòng đào tạo | Kiểm tra điều kiện OJT hàng loạt | GIỮ | Giữ: tính/lưu lần xét, đọc lịch sử hoặc theo dõi job hàng loạt; khác xem điều kiện hiện tại. |
| 17 | POST | `/api/imports/preview` | Admin, Phòng đào tạo, Phòng QHDN | Kiểm tra dữ liệu nhập sinh viên hoặc doanh nghiệp | GIỮ | Giữ: preview không ghi dữ liệu; commit ghi dữ liệu/batch và xử lý idempotency. |
| 18 | POST | `/api/imports/commit` | Admin, Phòng đào tạo, Phòng QHDN | Nhập sinh viên hoặc doanh nghiệp | GIỮ | Giữ: preview không ghi dữ liệu; commit ghi dữ liệu/batch và xử lý idempotency. |
| 19 | GET | `/api/imports/emails` | Admin | Trạng thái gửi email tài khoản | GIỮ | Giữ: gửi/nhắc/retry là tác vụ có side effect; không tự chạy khi cập nhật dữ liệu. |
| 20 | POST | `/api/imports/archive` | Admin, Phòng QHDN | Lưu trữ tuyển dụng sau hai học kỳ | GIỮ | Giữ: tạo bản ghi/tác vụ độc lập; không gộp tạo và cập nhật bằng ID tùy chọn. |
| 21 | POST | `/api/auth/change-password` | Auth | Đổi mật khẩu | GIỮ | Giữ: xác thực, đổi mật khẩu và reset có quyền/dữ liệu đầu vào khác nhau. |
| 22 | POST | `/api/ojt-registration-windows` | Admin, Phòng đào tạo | Tạo đợt đăng ký OJT | GIỮ | Giữ: tạo bản ghi/tác vụ độc lập; không gộp tạo và cập nhật bằng ID tùy chọn. |
| 23 | POST | `/api/ojt-registrations` | Admin, Phòng đào tạo, Sinh viên | Nộp hồ sơ đăng ký OJT | GIỮ | Giữ: tạo bản ghi/tác vụ độc lập; không gộp tạo và cập nhật bằng ID tùy chọn. |
| 24 | POST | `/api/ojt-results` | Admin, Phòng QHDN | Chuyển đánh giá và hồ sơ OJT cho phòng đào tạo | GIỮ | Giữ: chuyển hồ sơ, nhập điểm, yêu cầu bổ sung và xác nhận khác quyền/tác dụng phụ. |
| 25 | POST | `/api/companies` | Admin, Phòng QHDN | Tạo doanh nghiệp | GIỮ | Giữ: tạo bản ghi/tác vụ độc lập; không gộp tạo và cập nhật bằng ID tùy chọn. |
| 26 | POST | `/api/ojt-coordinations` | Admin, Phòng QHDN | Giới thiệu sinh viên cho doanh nghiệp | GIỮ | Giữ: giới thiệu, quyết định và điều phối lại khác bước; reassign tạo bản ghi nối lịch sử/idempotency. |
| 27 | POST | `/api/assignments` | Admin, Phòng QHDN | Phân công sinh viên thực tập | GIỮ | Giữ: tạo bản ghi/tác vụ độc lập; không gộp tạo và cập nhật bằng ID tùy chọn. |
| 28 | POST | `/api/students` | Admin | Tạo hồ sơ sinh viên | GIỮ | Giữ: tạo bản ghi/tác vụ độc lập; không gộp tạo và cập nhật bằng ID tùy chọn. |
| 29 | POST | `/api/course-result-imports/preview` | Admin, Phòng đào tạo | Kiểm tra dữ liệu nhập kết quả học tập | GIỮ | Giữ: preview không ghi dữ liệu; commit ghi dữ liệu/batch và xử lý idempotency. |
| 30 | POST | `/api/course-result-imports/commit` | Admin, Phòng đào tạo | Nhập kết quả học tập | GIỮ | Giữ: preview không ghi dữ liệu; commit ghi dữ liệu/batch và xử lý idempotency. |
| 31 | GET | `/api/health` | Admin | Kiểm tra backend và cơ sở dữ liệu | GIỮ | Giữ: chức năng đọc/cấu hình/tác vụ độc lập; chưa có bằng chứng dư đủ để xóa. |
| 32 | GET | `/api/roles` | Admin | Danh sách vai trò | GIỮ | Giữ: chức năng đọc/cấu hình/tác vụ độc lập; chưa có bằng chứng dư đủ để xóa. |
| 33 | GET | `/api/admin/dashboard/summary` | Admin | Tổng quan hệ thống | C1 | Có thể thêm section=summary; tách rõ thống kê toàn hệ thống không lọc với thống kê dự đoán theo bộ lọc. |
| 34 | POST | `/api/assessment-templates` | Admin | Tạo bộ tiêu chí đánh giá | GIỮ | Giữ: tạo bản ghi/tác vụ độc lập; không gộp tạo và cập nhật bằng ID tùy chọn. |
| 35 | POST | `/api/admin/prediction-jobs` | Admin | Tạo tác vụ dự đoán | GIỮ | Giữ: job dự đoán bất đồng bộ và kết quả là các tài nguyên khác nhau. |
| 36 | GET | `/api/enterprise/profile` | Doanh nghiệp | Hồ sơ doanh nghiệp | GIỮ | Giữ: chức năng đọc/cấu hình/tác vụ độc lập; chưa có bằng chứng dư đủ để xóa. |
| 37 | POST | `/api/recruitment/windows` | Admin, Phòng QHDN | Tạo đợt nhận nhu cầu tuyển dụng | GIỮ | Giữ: tạo bản ghi/tác vụ độc lập; không gộp tạo và cập nhật bằng ID tùy chọn. |
| 38 | POST | `/api/recruitment/posts` | Doanh nghiệp | Gửi nhu cầu tuyển dụng | GIỮ | Giữ: tạo bản ghi/tác vụ độc lập; không gộp tạo và cập nhật bằng ID tùy chọn. |
| 39 | POST | `/api/json/academic-years/list` | Admin, Phòng đào tạo | Danh sách năm học | GIỮ | Giữ: chức năng đọc/cấu hình/tác vụ độc lập; chưa có bằng chứng dư đủ để xóa. |
| 40 | PATCH | `/api/json/academic-years` | Admin, Phòng đào tạo | Cập nhật năm học | GIỮ | Giữ: cập nhật tài nguyên hiện đã gom trường thông tin/trạng thái khi phù hợp. |
| 41 | POST | `/api/json/academic-periods/list` | Admin, Phòng đào tạo, Phòng QHDN | Danh sách kỳ học và Block 3 | B1 | Search và detail cùng DTO; thêm academicPeriodId chính xác rồi bỏ detail. |
| 42 | POST | `/api/json/academic-periods/detail` | Admin, Phòng đào tạo, Phòng QHDN | Hồ sơ học kỳ và thông tin OJT | B1 | Search và detail cùng DTO; thêm academicPeriodId chính xác rồi bỏ detail. |
| 43 | PATCH | `/api/json/academic-periods` | Admin, Phòng đào tạo | Cập nhật kỳ học và Block 3 | GIỮ | Giữ: cập nhật tài nguyên hiện đã gom trường thông tin/trạng thái khi phù hợp. |
| 44 | POST | `/api/json/cohorts/list` | Admin, Phòng đào tạo | Danh sách khóa và nhóm | GIỮ | Giữ: chức năng đọc/cấu hình/tác vụ độc lập; chưa có bằng chứng dư đủ để xóa. |
| 45 | PATCH | `/api/json/cohorts` | Admin, Phòng đào tạo | Cập nhật khóa và nhóm | GIỮ | Giữ: cập nhật tài nguyên hiện đã gom trường thông tin/trạng thái khi phù hợp. |
| 46 | POST | `/api/json/academic-periods/combo-phase-schedules/list` | Admin, Phòng đào tạo | Xem mốc chọn và xác nhận combo | GIỮ | Giữ: chức năng đọc/cấu hình/tác vụ độc lập; chưa có bằng chứng dư đủ để xóa. |
| 47 | PUT | `/api/json/academic-periods/combo-phase-schedules` | Admin, Phòng đào tạo | Thiết lập mốc chọn và xác nhận combo | GIỮ | Giữ: chức năng đọc/cấu hình/tác vụ độc lập; chưa có bằng chứng dư đủ để xóa. |
| 48 | POST | `/api/json/ojt-semesters/assessment-window/search` | Admin, Phòng đào tạo | Xem đợt xét điều kiện chính thức | GIỮ | Giữ: chức năng đọc/cấu hình/tác vụ độc lập; chưa có bằng chứng dư đủ để xóa. |
| 49 | PUT | `/api/json/ojt-semesters/assessment-window` | Admin, Phòng đào tạo | Thiết lập đợt xét điều kiện chính thức | C9 | Có thể hợp nhất cấu hình/hành động nhưng có mốc sau Block 3, resultsFinalized, khóa dữ liệu xét và audit. Ưu tiên giữ bước xác nhận rõ ràng. |
| 50 | POST | `/api/json/ojt-semesters/assessment-window/open` | Admin, Phòng đào tạo | Mở xét điều kiện chính thức | C9 | Có thể hợp nhất cấu hình/hành động nhưng có mốc sau Block 3, resultsFinalized, khóa dữ liệu xét và audit. Ưu tiên giữ bước xác nhận rõ ràng. |
| 51 | POST | `/api/json/ojt-semesters/assessment-window/close` | Admin, Phòng đào tạo | Đóng xét điều kiện chính thức | C9 | Có thể hợp nhất cấu hình/hành động nhưng có mốc sau Block 3, resultsFinalized, khóa dữ liệu xét và audit. Ưu tiên giữ bước xác nhận rõ ràng. |
| 52 | POST | `/api/json/curricula/ojt-grade-mappings/detail` | Admin, Phòng đào tạo | Xem quy đổi điểm môn OJT | GIỮ | Giữ: thay thế từng tập môn/tiên quyết/tương đương/combo có kiểm tra phụ thuộc; không thay bằng PATCH phẳng. |
| 53 | PUT | `/api/json/curricula/ojt-grade-mappings` | Admin, Phòng đào tạo | Thiết lập quy đổi điểm môn OJT | GIỮ | Giữ: thay thế từng tập môn/tiên quyết/tương đương/combo có kiểm tra phụ thuộc; không thay bằng PATCH phẳng. |
| 54 | POST | `/api/json/ojt-registration-windows/semester-exceptions` | Admin, Phòng đào tạo | Thêm ngoại lệ kỳ đăng ký OJT | GIỮ | Giữ: cấp/thu hồi ngoại lệ có đối tượng, thời hạn và nhật ký riêng. |
| 55 | POST | `/api/json/ojt-registration-windows/semester-exceptions/revoke` | Admin, Phòng đào tạo | Thu hồi ngoại lệ kỳ đăng ký OJT | GIỮ | Giữ: cấp/thu hồi ngoại lệ có đối tượng, thời hạn và nhật ký riêng. |
| 56 | POST | `/api/json/combo-registration-windows/preview` | Admin, Phòng đào tạo, Sinh viên | Xem ảnh hưởng của combo dự kiến | GIỮ | Giữ: preview không ghi dữ liệu; commit ghi dữ liệu/batch và xử lý idempotency. |
| 57 | POST | `/api/json/academic/dashboard/search` | Admin, Phòng đào tạo | Tổng quan điều kiện OJT | C3 | Cùng report(c,scope); có thể dùng section summary/statistics và groupBy. Không gộp cảnh báo/nhu cầu môn vào response mặc định. |
| 58 | POST | `/api/json/academic/eligibility-statistics/search` | Admin, Phòng đào tạo | Thống kê điều kiện theo khóa, nhóm, chuyên ngành và combo | C3 | Cùng report(c,scope); có thể dùng section summary/statistics và groupBy. Không gộp cảnh báo/nhu cầu môn vào response mặc định. |
| 59 | POST | `/api/json/academic/alerts/list` | Admin, Phòng đào tạo | Danh sách cảnh báo thiếu điều kiện OJT | GIỮ | Giữ: chức năng đọc/cấu hình/tác vụ độc lập; chưa có bằng chứng dư đủ để xóa. |
| 60 | POST | `/api/json/academic/course-demand/list` | Admin, Phòng đào tạo | Thống kê nhu cầu học môn còn thiếu | GIỮ | Giữ: chức năng đọc/cấu hình/tác vụ độc lập; chưa có bằng chứng dư đủ để xóa. |
| 61 | POST | `/api/json/academic/course-demand/export` | Admin, Phòng đào tạo | Xuất nhu cầu học theo môn, kỳ và Block | GIỮ | Giữ: xuất dữ liệu có giới hạn và định dạng CSV/PDF/JSON; không tương đương trang danh sách. |
| 62 | POST | `/api/json/accounts/list` | Admin | Danh sách tài khoản | B2 | Admin dùng search có userId; người dùng khác dùng me/profile. Không mở quyền tìm tài khoản người khác. |
| 63 | POST | `/api/json/accounts/detail` | Admin, Phòng đào tạo, Phòng QHDN, Sinh viên | Chi tiết tài khoản | B2 | Admin dùng search có userId; người dùng khác dùng me/profile. Không mở quyền tìm tài khoản người khác. |
| 64 | PATCH | `/api/json/accounts` | Admin | Cập nhật tài khoản | GIỮ | Giữ: cập nhật tài nguyên hiện đã gom trường thông tin/trạng thái khi phù hợp. |
| 65 | POST | `/api/json/combo-registration-windows/list` | Admin, Phòng đào tạo, Sinh viên | Danh sách đợt chọn combo | GIỮ | Giữ: chức năng đọc/cấu hình/tác vụ độc lập; chưa có bằng chứng dư đủ để xóa. |
| 66 | PATCH | `/api/json/combo-registration-windows` | Admin, Phòng đào tạo | Cập nhật hoặc mở/đóng đợt chọn combo | GIỮ | API cập nhật đã gộp trường/trạng thái/lộ trình phù hợp; giữ kiểm tra nghiệp vụ hiện có. |
| 67 | POST | `/api/json/combo-registration-windows/extensions` | Admin, Phòng đào tạo | Gia hạn chọn combo | GIỮ | Giữ: gia hạn theo sinh viên trong phạm vi đã chốt; không phải đổi hạn toàn đợt. |
| 68 | POST | `/api/json/combo-registration-windows/selections/list` | Admin, Phòng đào tạo | Theo dõi lựa chọn combo | GIỮ | Giữ: chức năng đọc/cấu hình/tác vụ độc lập; chưa có bằng chứng dư đủ để xóa. |
| 69 | POST | `/api/json/combo-registration-windows/selections` | Admin, Phòng đào tạo, Sinh viên | Gửi lựa chọn combo | GIỮ | Giữ: chức năng đọc/cấu hình/tác vụ độc lập; chưa có bằng chứng dư đủ để xóa. |
| 70 | POST | `/api/json/combo-registration-windows/reminders` | Admin, Phòng đào tạo | Gửi nhắc chọn combo | GIỮ | Giữ: gửi/nhắc/retry là tác vụ có side effect; không tự chạy khi cập nhật dữ liệu. |
| 71 | POST | `/api/json/students/combo-selections/list` | Admin, Phòng đào tạo, Sinh viên | Lịch sử lựa chọn combo của sinh viên | GIỮ | Giữ: lịch sử sự kiện/lựa chọn; profile chỉ có lựa chọn xác nhận trong chương trình hiện tại. |
| 72 | POST | `/api/json/combo-registration-windows/finalize` | Admin, Phòng đào tạo | Chốt lựa chọn combo | GIỮ | Giữ: chốt lựa chọn và ghi lựa chọn chính thức, không tương đương đóng đợt. |
| 73 | POST | `/api/json/majors/list` | Admin, Phòng đào tạo | Danh sách chuyên ngành | GIỮ | Giữ: chức năng đọc/cấu hình/tác vụ độc lập; chưa có bằng chứng dư đủ để xóa. |
| 74 | POST | `/api/json/courses/list` | Admin, Phòng đào tạo | Danh sách môn học | GIỮ | Giữ: chức năng đọc/cấu hình/tác vụ độc lập; chưa có bằng chứng dư đủ để xóa. |
| 75 | POST | `/api/json/curricula/list` | Admin, Phòng đào tạo | Danh sách chương trình đào tạo đã nhập | GIỮ | Giữ: thay thế từng tập môn/tiên quyết/tương đương/combo có kiểm tra phụ thuộc; không thay bằng PATCH phẳng. |
| 76 | PATCH | `/api/json/courses` | Admin, Phòng đào tạo | Cập nhật môn học | GIỮ | Giữ: cập nhật tài nguyên hiện đã gom trường thông tin/trạng thái khi phù hợp. |
| 77 | POST | `/api/json/curricula/detail` | Admin, Phòng đào tạo | Chi tiết chương trình đào tạo | GIỮ | Giữ: cấu trúc môn, tiên quyết, tương đương, combo; danh sách chương trình là tóm tắt. |
| 78 | PATCH | `/api/json/curricula` | Admin, Phòng đào tạo | Sửa thông tin chương trình đã nhập | GIỮ | Sửa metadata bản nhập DRAFT; không còn tạo chương trình. Tạo phiên bản mới qua import. |
| 79 | PUT | `/api/json/curricula/courses` | Admin, Phòng đào tạo | Thiết lập môn, tín chỉ và kỳ học | GIỮ | Giữ: thay thế từng tập môn/tiên quyết/tương đương/combo có kiểm tra phụ thuộc; không thay bằng PATCH phẳng. |
| 80 | PUT | `/api/json/curricula/prerequisites` | Admin, Phòng đào tạo | Thiết lập môn tiên quyết | GIỮ | Giữ: thay thế từng tập môn/tiên quyết/tương đương/combo có kiểm tra phụ thuộc; không thay bằng PATCH phẳng. |
| 81 | PUT | `/api/json/curricula/course-equivalences` | Admin, Phòng đào tạo | Thiết lập công nhận và tương đương môn | GIỮ | Giữ: thay thế từng tập môn/tiên quyết/tương đương/combo có kiểm tra phụ thuộc; không thay bằng PATCH phẳng. |
| 82 | PUT | `/api/json/combos/courses` | Admin, Phòng đào tạo | Thiết lập môn thuộc combo | GIỮ | Giữ: thay thế từng tập môn/tiên quyết/tương đương/combo có kiểm tra phụ thuộc; không thay bằng PATCH phẳng. |
| 83 | POST | `/api/json/curricula/publish` | Admin, Phòng đào tạo | Ban hành phiên bản chương trình | GIỮ | Giữ: kiểm tra trước ban hành, kích hoạt phiên bản và/hoặc khóa dữ liệu đã công bố. |
| 84 | POST | `/api/json/ojt-rule-sets/list` | Admin, Phòng đào tạo | Danh sách bộ quy tắc OJT | GIỮ | Giữ: chức năng đọc/cấu hình/tác vụ độc lập; chưa có bằng chứng dư đủ để xóa. |
| 85 | PATCH | `/api/json/ojt-rule-sets` | Admin, Phòng đào tạo | Sửa bộ quy tắc chưa ban hành | GIỮ | Giữ: cập nhật tài nguyên hiện đã gom trường thông tin/trạng thái khi phù hợp. |
| 86 | POST | `/api/json/ojt-rule-sets/publish` | Admin, Phòng đào tạo | Ban hành bộ quy tắc OJT | GIỮ | Giữ: kiểm tra trước ban hành, kích hoạt phiên bản và/hoặc khóa dữ liệu đã công bố. |
| 87 | POST | `/api/json/students/eligibility-checks/list` | Admin, Phòng đào tạo, Sinh viên | Lịch sử kiểm tra điều kiện OJT | GIỮ | Giữ: tính/lưu lần xét, đọc lịch sử hoặc theo dõi job hàng loạt; khác xem điều kiện hiện tại. |
| 88 | POST | `/api/json/students/eligibility-checks` | Admin, Phòng đào tạo | Kiểm tra điều kiện OJT của sinh viên | GIỮ | Giữ: tính/lưu lần xét, đọc lịch sử hoặc theo dõi job hàng loạt; khác xem điều kiện hiện tại. |
| 89 | POST | `/api/json/students/eligibility/search` | Admin, Phòng đào tạo, Sinh viên | Kết quả OJT và điều kiện còn thiếu | GIỮ | Giữ: current + latest + official và stale; profile hiện chỉ có officialEligibility. |
| 90 | POST | `/api/json/eligibility-checks/confirm` | Admin, Phòng đào tạo | Xác nhận kết quả xét điều kiện OJT | GIỮ | Giữ: xác nhận chính thức, kiểm tra nguồn/phiên bản và khóa hoặc đồng bộ dữ liệu. |
| 91 | POST | `/api/json/eligibility-check-runs/detail` | Admin, Phòng đào tạo | Tiến độ và kết quả kiểm tra hàng loạt | GIỮ | Giữ: tính/lưu lần xét, đọc lịch sử hoặc theo dõi job hàng loạt; khác xem điều kiện hiện tại. |
| 92 | POST | `/api/json/imports/emails/retry` | Admin | Gửi lại email bị lỗi | GIỮ | Giữ: gửi/nhắc/retry là tác vụ có side effect; không tự chạy khi cập nhật dữ liệu. |
| 93 | POST | `/api/json/ojt-registration-windows/list` | Admin, Phòng đào tạo, Sinh viên | Danh sách đợt đăng ký OJT | GIỮ | Giữ: chức năng đọc/cấu hình/tác vụ độc lập; chưa có bằng chứng dư đủ để xóa. |
| 94 | PATCH | `/api/json/ojt-registration-windows` | Admin, Phòng đào tạo | Cập nhật hoặc mở/đóng đợt đăng ký OJT | GIỮ | API cập nhật đã gộp trường/trạng thái/lộ trình phù hợp; giữ kiểm tra nghiệp vụ hiện có. |
| 95 | POST | `/api/json/ojt-registrations/list` | Admin, Phòng đào tạo, Phòng QHDN, Sinh viên | Danh sách hồ sơ đăng ký OJT | C6 | Detail có officialEligibility, snapshot bàn giao, sự kiện và mọi điều phối/phân công; cần registrationId, include và phân trang lịch sử, giữ lọc bàn giao cho QHDN và sở hữu cho sinh viên. |
| 96 | POST | `/api/json/ojt-registrations/detail` | Admin, Phòng đào tạo, Phòng QHDN, Sinh viên | Chi tiết hồ sơ đăng ký OJT | C6 | Detail có officialEligibility, snapshot bàn giao, sự kiện và mọi điều phối/phân công; cần registrationId, include và phân trang lịch sử, giữ lọc bàn giao cho QHDN và sở hữu cho sinh viên. |
| 97 | POST | `/api/json/ojt-registrations/review` | Admin, Phòng đào tạo | Duyệt hoặc từ chối hồ sơ OJT | GIỮ | Giữ: chức năng đọc/cấu hình/tác vụ độc lập; chưa có bằng chứng dư đủ để xóa. |
| 98 | POST | `/api/json/ojt-semesters/eligible-student-handoffs/list` | Admin, Phòng đào tạo, Phòng QHDN | Lịch sử bàn giao sinh viên cho QHDN | GIỮ | Giữ: chức năng đọc/cấu hình/tác vụ độc lập; chưa có bằng chứng dư đủ để xóa. |
| 99 | POST | `/api/json/ojt-semesters/eligible-student-handoffs` | Admin, Phòng đào tạo | Bàn giao sinh viên đủ điều kiện cho QHDN | GIỮ | Giữ: chức năng đọc/cấu hình/tác vụ độc lập; chưa có bằng chứng dư đủ để xóa. |
| 100 | POST | `/api/json/ojt-semesters/students/list` | Admin, Phòng đào tạo, Phòng QHDN, Sinh viên | Theo dõi trạng thái OJT theo kỳ | GIỮ | Giữ: giám sát nhiều sinh viên theo kỳ và quyền, không tương đương hồ sơ cá nhân. |
| 101 | POST | `/api/json/ojt-results/list` | Admin, Phòng đào tạo, Phòng QHDN | Danh sách kết quả OJT đã chuyển | C7 | Detail thêm lịch sử phiên bản; cần resultId và historyPage/historyLimit; giữ optimistic version và workflow ghi riêng. |
| 102 | POST | `/api/json/ojt-results/detail` | Admin, Phòng đào tạo, Phòng QHDN | Chi tiết đánh giá và hồ sơ OJT | C7 | Detail thêm lịch sử phiên bản; cần resultId và historyPage/historyLimit; giữ optimistic version và workflow ghi riêng. |
| 103 | PATCH | `/api/json/ojt-results` | Admin, Phòng đào tạo | Cập nhật điểm và kết quả OJT chính thức | GIỮ | Giữ: chuyển hồ sơ, nhập điểm, yêu cầu bổ sung và xác nhận khác quyền/tác dụng phụ. |
| 104 | POST | `/api/json/ojt-results/revision-requests` | Admin, Phòng đào tạo | Yêu cầu bổ sung hồ sơ kết quả OJT | GIỮ | Giữ: chuyển hồ sơ, nhập điểm, yêu cầu bổ sung và xác nhận khác quyền/tác dụng phụ. |
| 105 | POST | `/api/json/ojt-results/transfer` | Admin, Phòng QHDN | Gửi lại hồ sơ OJT đã bổ sung | GIỮ | Giữ: chuyển hồ sơ, nhập điểm, yêu cầu bổ sung và xác nhận khác quyền/tác dụng phụ. |
| 106 | POST | `/api/json/ojt-results/confirm` | Admin, Phòng đào tạo | Xác nhận kết quả OJT | GIỮ | Giữ: xác nhận chính thức, kiểm tra nguồn/phiên bản và khóa hoặc đồng bộ dữ liệu. |
| 107 | POST | `/api/json/ojt-semesters/results/export` | Admin, Phòng đào tạo, Phòng QHDN | Xuất báo cáo kết quả OJT theo kỳ | GIỮ | Giữ: xuất dữ liệu có giới hạn và định dạng CSV/PDF/JSON; không tương đương trang danh sách. |
| 108 | POST | `/api/json/companies/list` | Admin, Phòng QHDN | Danh sách và hồ sơ doanh nghiệp | GIỮ | Giữ: chức năng đọc/cấu hình/tác vụ độc lập; chưa có bằng chứng dư đủ để xóa. |
| 109 | PATCH | `/api/json/companies` | Admin, Phòng QHDN | Cập nhật doanh nghiệp | GIỮ | Giữ: cập nhật tài nguyên hiện đã gom trường thông tin/trạng thái khi phù hợp. |
| 110 | DELETE | `/api/json/companies` | Admin | Xóa doanh nghiệp | GIỮ | Giữ: xóa mềm có kiểm tra quan hệ, khác thay đổi trạng thái hoạt động. |
| 111 | POST | `/api/json/positions/list` | Admin, Phòng QHDN | Danh sách và hồ sơ vị trí thực tập | GIỮ | Giữ: chức năng đọc/cấu hình/tác vụ độc lập; chưa có bằng chứng dư đủ để xóa. |
| 112 | POST | `/api/json/ojt-coordinations/list` | Admin, Phòng QHDN | Danh sách điều phối sinh viên | B3 | Search thêm coordinationId và lịch sử phân trang/chuỗi điều phối khi chọn ID; giữ staff-only. |
| 113 | POST | `/api/json/ojt-coordinations/detail` | Admin, Phòng QHDN | Chi tiết và lịch sử điều phối | B3 | Search thêm coordinationId và lịch sử phân trang/chuỗi điều phối khi chọn ID; giữ staff-only. |
| 114 | POST | `/api/json/assignments/list` | Admin, Phòng QHDN | Danh sách và hồ sơ phân công thực tập | GIỮ | Giữ: chức năng đọc/cấu hình/tác vụ độc lập; chưa có bằng chứng dư đủ để xóa. |
| 115 | PATCH | `/api/json/assignments` | Admin, Phòng QHDN | Cập nhật thông tin và trạng thái thực tập | GIỮ | API cập nhật đã gộp trường/trạng thái/lộ trình phù hợp; giữ kiểm tra nghiệp vụ hiện có. |
| 116 | POST | `/api/json/internship-evaluations/list` | Admin, Phòng QHDN | Danh sách đánh giá thực tập | B4 | Search đã có dữ liệu ngữ cảnh; bổ sung evaluationId và lịch sử phân trang trước khi bỏ detail. |
| 117 | POST | `/api/json/internship-evaluations/detail` | Admin, Phòng QHDN | Chi tiết và lịch sử đánh giá thực tập | B4 | Search đã có dữ liệu ngữ cảnh; bổ sung evaluationId và lịch sử phân trang trước khi bỏ detail. |
| 118 | POST | `/api/json/ojt-coordinations/decision` | Admin, Phòng QHDN | Ghi nhận quyết định tiếp nhận sinh viên | GIỮ | Giữ: giới thiệu, quyết định và điều phối lại khác bước; reassign tạo bản ghi nối lịch sử/idempotency. |
| 119 | POST | `/api/json/ojt-coordinations/reassign` | Admin, Phòng QHDN | Điều phối lại sinh viên | GIỮ | Giữ: giới thiệu, quyết định và điều phối lại khác bước; reassign tạo bản ghi nối lịch sử/idempotency. |
| 120 | PUT | `/api/json/assignments/internship-evaluation` | Admin, Phòng QHDN | Ghi nhận đánh giá thực tập | GIỮ | Giữ: chức năng đọc/cấu hình/tác vụ độc lập; chưa có bằng chứng dư đủ để xóa. |
| 121 | POST | `/api/json/qhdn/dashboard/search` | Admin, Phòng QHDN | Tổng quan QHDN | GIỮ | Giữ: chức năng đọc/cấu hình/tác vụ độc lập; chưa có bằng chứng dư đủ để xóa. |
| 122 | POST | `/api/json/qhdn/reports/acceptance/search` | Admin, Phòng QHDN | Thống kê tiếp nhận và từ chối | C2 | Cùng report(type,...); có thể dùng một POST /api/json/qhdn/reports/list với type. Chỉ giảm URL, ba loại báo cáo vẫn khác nhau. |
| 123 | POST | `/api/json/qhdn/reports/internships/search` | Admin, Phòng QHDN | Thống kê thực tập và kết quả | C2 | Cùng report(type,...); có thể dùng một POST /api/json/qhdn/reports/list với type. Chỉ giảm URL, ba loại báo cáo vẫn khác nhau. |
| 124 | POST | `/api/json/qhdn/reports/enterprise-feedback/search` | Admin, Phòng QHDN | Tổng hợp đánh giá từ doanh nghiệp | C2 | Cùng report(type,...); có thể dùng một POST /api/json/qhdn/reports/list với type. Chỉ giảm URL, ba loại báo cáo vẫn khác nhau. |
| 125 | POST | `/api/json/qhdn/reports/export` | Admin, Phòng QHDN | Xuất báo cáo QHDN | GIỮ | Giữ: xuất dữ liệu có giới hạn và định dạng CSV/PDF/JSON; không tương đương trang danh sách. |
| 126 | POST | `/api/json/students/list` | Admin, Phòng đào tạo | Tìm kiếm và lọc sinh viên | GIỮ | Giữ: chức năng đọc/cấu hình/tác vụ độc lập; chưa có bằng chứng dư đủ để xóa. |
| 127 | POST | `/api/json/students/detail` | Admin, Phòng đào tạo, Sinh viên | Hồ sơ học vụ tổng hợp | D2 | Giữ hồ sơ tổng hợp; có thể thêm section để thay endpoint tiến độ riêng, không ép mọi lần đọc nhẹ tải toàn hồ sơ. |
| 128 | PATCH | `/api/json/students` | Admin, Phòng đào tạo | Cập nhật hồ sơ và lộ trình học vụ | GIỮ | API cập nhật đã gộp trường/trạng thái/lộ trình phù hợp; giữ kiểm tra nghiệp vụ hiện có. |
| 129 | DELETE | `/api/json/students` | Admin | Xóa hồ sơ sinh viên | GIỮ | Giữ: xóa mềm có kiểm tra quan hệ, khác thay đổi trạng thái hoạt động. |
| 130 | POST | `/api/json/students/course-results/list` | Admin, Phòng đào tạo, Sinh viên | Điểm, lần học và trạng thái môn | GIỮ | Giữ: lọc môn/kỳ/trạng thái; profile hiện mới có phân trang điểm, chưa có các bộ lọc này. |
| 131 | POST | `/api/json/students/academic-progress/search` | Admin, Phòng đào tạo, Sinh viên | GPA, tín chỉ và tiến độ học tập | D2 | Profile đã trả academicProgress cùng hàm tính; có thể thêm section=academicProgress để thay API này. Giữ trước mắt để đọc nhẹ. |
| 132 | PATCH | `/api/json/course-results` | Admin, Phòng đào tạo | Sửa kết quả học tập và ghi lý do | GIỮ | Giữ: cập nhật tài nguyên hiện đã gom trường thông tin/trạng thái khi phù hợp. |
| 133 | POST | `/api/json/academic-imports/list` | Admin, Phòng đào tạo | Lịch sử nhập dữ liệu học vụ | C5 | Detail có rawData/normalizedData và phân trang dòng độc lập; cần batchId + rowsPage/rowsLimit có điều kiện. |
| 134 | POST | `/api/json/academic-imports/detail` | Admin, Phòng đào tạo | Chi tiết và lỗi nhập dữ liệu học vụ | C5 | Detail có rawData/normalizedData và phân trang dòng độc lập; cần batchId + rowsPage/rowsLimit có điều kiện. |
| 135 | POST | `/api/json/auth/users/password-reset` | Admin | Đặt lại mật khẩu | GIỮ | Giữ: xác thực, đổi mật khẩu và reset có quyền/dữ liệu đầu vào khác nhau. |
| 136 | POST | `/api/json/admin/dashboard/search` | Admin | Thống kê mức sẵn sàng và rủi ro | C1 | Có thể thêm section=summary; tách rõ thống kê toàn hệ thống không lọc với thống kê dự đoán theo bộ lọc. |
| 137 | POST | `/api/json/students/export` | Admin | Xuất danh sách sinh viên | GIỮ | Giữ: xuất dữ liệu có giới hạn và định dạng CSV/PDF/JSON; không tương đương trang danh sách. |
| 138 | DELETE | `/api/json/positions` | Admin | Xóa vị trí thực tập | GIỮ | Giữ: xóa mềm có kiểm tra quan hệ, khác thay đổi trạng thái hoạt động. |
| 139 | POST | `/api/json/assessment-templates/list` | Admin | Danh sách và hồ sơ bộ tiêu chí đánh giá | GIỮ | Giữ: chức năng đọc/cấu hình/tác vụ độc lập; chưa có bằng chứng dư đủ để xóa. |
| 140 | PATCH | `/api/json/assessment-templates` | Admin | Sửa bộ tiêu chí đánh giá | GIỮ | Giữ: cập nhật tài nguyên hiện đã gom trường thông tin/trạng thái khi phù hợp. |
| 141 | POST | `/api/json/assessment-templates/publish` | Admin | Ban hành bộ tiêu chí đánh giá | GIỮ | Giữ: kiểm tra trước ban hành, kích hoạt phiên bản và/hoặc khóa dữ liệu đã công bố. |
| 142 | POST | `/api/json/admin/prediction-jobs/detail` | Admin | Tiến độ dự đoán và lỗi theo sinh viên | GIỮ | Giữ: job dự đoán bất đồng bộ và kết quả là các tài nguyên khác nhau. |
| 143 | POST | `/api/json/predictions/list` | Admin | Lịch sử dự đoán | C4 | Detail thêm InputSnapshot; chỉ nạp theo predictionId/include, không đưa mọi snapshot vào trang danh sách. |
| 144 | POST | `/api/json/predictions/detail` | Admin | Chi tiết dự đoán | C4 | Detail thêm InputSnapshot; chỉ nạp theo predictionId/include, không đưa mọi snapshot vào trang danh sách. |
| 145 | POST | `/api/json/admin/models/list` | Admin | Danh sách và hồ sơ phiên bản mô hình | GIỮ | Giữ: chức năng đọc/cấu hình/tác vụ độc lập; chưa có bằng chứng dư đủ để xóa. |
| 146 | POST | `/api/json/alerts/list` | Admin | Danh sách và hồ sơ cảnh báo rủi ro | GIỮ | Giữ: chức năng đọc/cấu hình/tác vụ độc lập; chưa có bằng chứng dư đủ để xóa. |
| 147 | PATCH | `/api/json/alerts/status` | Admin | Tiếp nhận hoặc đóng cảnh báo | GIỮ | Giữ: đây là API cập nhật duy nhất của cảnh báo; không có PATCH alert chung để gộp. |
| 148 | POST | `/api/json/alerts/interventions` | Admin | Tạo hoạt động hỗ trợ sinh viên | GIỮ | Giữ: hoạt động hỗ trợ là bản ghi riêng; cập nhật đã hỗ trợ status/outcome cùng thông tin. |
| 149 | POST | `/api/json/students/interventions/list` | Admin | Lịch sử hỗ trợ sinh viên | GIỮ | Giữ: hoạt động hỗ trợ là bản ghi riêng; cập nhật đã hỗ trợ status/outcome cùng thông tin. |
| 150 | PATCH | `/api/json/interventions` | Admin | Cập nhật hoạt động hỗ trợ | GIỮ | Giữ: hoạt động hỗ trợ là bản ghi riêng; cập nhật đã hỗ trợ status/outcome cùng thông tin. |
| 151 | POST | `/api/json/admin/reports/readiness/list` | Admin | Báo cáo mức sẵn sàng và rủi ro | GIỮ | Giữ: chức năng đọc/cấu hình/tác vụ độc lập; chưa có bằng chứng dư đủ để xóa. |
| 152 | POST | `/api/json/admin/reports/export` | Admin | Xuất báo cáo dự đoán | GIỮ | Giữ: xuất dữ liệu có giới hạn và định dạng CSV/PDF/JSON; không tương đương trang danh sách. |
| 153 | POST | `/api/json/admin/audit-logs/list` | Admin | Nhật ký hoạt động hệ thống | GIỮ | Giữ: chức năng đọc/cấu hình/tác vụ độc lập; chưa có bằng chứng dư đủ để xóa. |
| 154 | POST | `/api/json/enterprise/candidates/list` | Doanh nghiệp | Danh sách ứng viên | B5 | Search/detail cùng service và trường; thêm candidateId. Truy vấn ID phải xem được lần giới thiệu lịch sử của chính doanh nghiệp, không áp dụng lọc latest như danh sách. |
| 155 | POST | `/api/json/enterprise/candidates/detail` | Doanh nghiệp | Hồ sơ ứng viên | B5 | Search/detail cùng service và trường; thêm candidateId. Truy vấn ID phải xem được lần giới thiệu lịch sử của chính doanh nghiệp, không áp dụng lọc latest như danh sách. |
| 156 | PATCH | `/api/json/enterprise/candidates/decision` | Doanh nghiệp | Tiếp nhận hoặc từ chối ứng viên | GIỮ | Giữ: cập nhật tài nguyên hiện đã gom trường thông tin/trạng thái khi phù hợp. |
| 157 | POST | `/api/json/enterprise/internships/list` | Doanh nghiệp | Danh sách sinh viên thực tập | GIỮ | Giữ: chức năng đọc/cấu hình/tác vụ độc lập; chưa có bằng chứng dư đủ để xóa. |
| 158 | PUT | `/api/json/enterprise/internships/evaluation` | Doanh nghiệp | Gửi hoặc cập nhật đánh giá thực tập | GIỮ | Giữ: chức năng đọc/cấu hình/tác vụ độc lập; chưa có bằng chứng dư đủ để xóa. |
| 159 | POST | `/api/json/recruitment/windows/list` | Admin, Phòng QHDN, Doanh nghiệp | Danh sách đợt tuyển dụng theo học kỳ | GIỮ | Giữ: chức năng đọc/cấu hình/tác vụ độc lập; chưa có bằng chứng dư đủ để xóa. |
| 160 | PATCH | `/api/json/recruitment/windows` | Admin, Phòng QHDN | Cập nhật hoặc mở/đóng đợt tuyển dụng | GIỮ | API cập nhật đã gộp trường/trạng thái/lộ trình phù hợp; giữ kiểm tra nghiệp vụ hiện có. |
| 161 | POST | `/api/json/recruitment/posts/list` | Admin, Phòng QHDN, Doanh nghiệp | Danh sách tin tuyển dụng | GIỮ | Giữ: chức năng đọc/cấu hình/tác vụ độc lập; chưa có bằng chứng dư đủ để xóa. |
| 162 | PATCH | `/api/json/recruitment/posts` | Admin, Phòng QHDN, Doanh nghiệp | Sửa tin và vị trí tuyển dụng | GIỮ | Giữ: cập nhật tài nguyên hiện đã gom trường thông tin/trạng thái khi phù hợp. |
| 163 | POST | `/api/json/recruitment/posts/review` | Admin, Phòng QHDN | Duyệt hoặc từ chối tin tuyển dụng | C8 | Cùng reviewPost(close flag); có thể một API review với action PUBLISH/REJECT/CLOSE. Không gộp vào PATCH chung ENTERPRISE. |
| 164 | POST | `/api/json/recruitment/posts/close` | Admin, Phòng QHDN | Đóng tin tuyển dụng | C8 | Cùng reviewPost(close flag); có thể một API review với action PUBLISH/REJECT/CLOSE. Không gộp vào PATCH chung ENTERPRISE. |
