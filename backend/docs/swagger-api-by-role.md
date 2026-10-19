# Danh sách API theo 6 nhóm Swagger

Tổng 155 API duy nhất; API dùng chung hiển thị trong từng nhóm được cấp quyền.

| Nhóm | Số API hiển thị |
|---|---:|
| Admin | 146 |
| Phòng đào tạo | 88 |
| Phòng QHDN | 38 |
| Doanh nghiệp | 10 |
| Sinh viên | 15 |
| Auth | 3 |

## Admin — 146 API

| # | Method | Đường dẫn | Chức năng |
|---:|---|---|---|
| 1 | POST | `/api/academic-years` | Tạo năm học |
| 2 | POST | `/api/academic-periods` | Tạo kỳ học và Block 3. Học kỳ thường tự liên kết OJT và trả ojtSemesterId; QHDN không tạo kỳ riêng. |
| 3 | POST | `/api/cohorts` | Tạo khóa và nhóm |
| 4 | POST | `/api/academic/alerts/notifications` | Gửi cảnh báo học vụ |
| 5 | POST | `/api/accounts` | Tạo tài khoản |
| 6 | PATCH | `/api/accounts/me/profile` | Cập nhật hồ sơ cá nhân |
| 7 | POST | `/api/combo-registration-windows` | Tạo đợt chọn hoặc xác nhận combo |
| 8 | POST | `/api/majors` | Tạo chuyên ngành |
| 9 | POST | `/api/courses` | Tạo môn học |
| 10 | POST | `/api/curriculum-imports/preview` | Kiểm tra dữ liệu nhập khung chương trình |
| 11 | POST | `/api/curriculum-imports/commit` | Nhập khung chương trình |
| 12 | POST | `/api/ojt-rule-sets` | Tạo bộ quy tắc OJT. Điều kiện: tối thiểu 70 tín chỉ và tối đa 2 môn còn nợ. |
| 13 | POST | `/api/eligibility-check-runs` | Kiểm tra điều kiện OJT hàng loạt |
| 14 | POST | `/api/imports/preview` | Kiểm tra dữ liệu nhập sinh viên hoặc doanh nghiệp |
| 15 | POST | `/api/imports/commit` | Nhập sinh viên hoặc doanh nghiệp |
| 16 | GET | `/api/imports/emails` | Trạng thái gửi email tài khoản |
| 17 | POST | `/api/imports/archive` | Lưu trữ tuyển dụng sau hai học kỳ |
| 18 | POST | `/api/ojt-registration-windows` | Tạo đợt đăng ký OJT. Mặc định dành cho kỳ chuyên ngành 5, tính theo lộ trình thực tế. |
| 19 | POST | `/api/ojt-registrations` | Nộp hồ sơ đăng ký OJT |
| 20 | POST | `/api/ojt-results` | Chuyển đánh giá và hồ sơ OJT cho phòng đào tạo |
| 21 | POST | `/api/companies` | Tạo doanh nghiệp. Admin và Phòng QHDN dùng chung URL; chọn mẫu dữ liệu theo vai trò trong anyOf. |
| 22 | POST | `/api/ojt-coordinations` | Giới thiệu sinh viên cho doanh nghiệp. Áp dụng cho hồ sơ đã bàn giao; cần lý do và lưu nhật ký. |
| 23 | POST | `/api/assignments` | Phân công sinh viên thực tập. Admin và Phòng QHDN dùng chung URL; chọn mẫu dữ liệu theo vai trò trong anyOf. |
| 24 | POST | `/api/students` | Tạo hồ sơ sinh viên. Liên kết với tài khoản sinh viên đang hoạt động. |
| 25 | POST | `/api/course-result-imports/preview` | Kiểm tra dữ liệu nhập kết quả học tập |
| 26 | POST | `/api/course-result-imports/commit` | Nhập kết quả học tập |
| 27 | GET | `/api/health` | Kiểm tra backend và cơ sở dữ liệu |
| 28 | GET | `/api/roles` | Danh sách vai trò |
| 29 | POST | `/api/assessment-templates` | Tạo bộ tiêu chí đánh giá. Tổng trọng số tiêu chí phải bằng 100. |
| 30 | POST | `/api/admin/prediction-jobs` | Tạo tác vụ dự đoán. Sử dụng mô hình dự đoán đã cấu hình. |
| 31 | POST | `/api/recruitment/windows` | Tạo đợt nhận nhu cầu tuyển dụng. Chọn học kỳ có sẵn và thời hạn nhận đơn; không tạo kỳ OJT riêng. |
| 32 | POST | `/api/json/academic-years/search` | Danh sách năm học |
| 33 | PATCH | `/api/json/academic-years` | Cập nhật năm học |
| 34 | POST | `/api/json/academic-periods/search` | Danh sách kỳ học và Block 3. Lọc kind=SEMESTER để chọn học kỳ tuyển dụng; kết quả kèm thông tin OJT. |
| 35 | PATCH | `/api/json/academic-periods` | Cập nhật kỳ học và Block 3 |
| 36 | POST | `/api/json/cohorts/search` | Danh sách khóa và nhóm |
| 37 | PATCH | `/api/json/cohorts` | Cập nhật khóa và nhóm |
| 38 | POST | `/api/json/academic-periods/combo-phase-schedules/search` | Xem mốc chọn và xác nhận combo |
| 39 | PUT | `/api/json/academic-periods/combo-phase-schedules` | Thiết lập mốc chọn và xác nhận combo. Chọn ban đầu trong kỳ học; xác nhận trong Block 3. Các mốc phải nằm trong kỳ tương ứng. |
| 40 | POST | `/api/json/ojt-semesters/assessment-window/search` | Xem đợt xét điều kiện chính thức |
| 41 | PUT | `/api/json/ojt-semesters/assessment-window` | Thiết lập đợt xét điều kiện chính thức. Thiết lập khi còn nháp. Thời điểm mở sau khi Block 3 kết thúc. |
| 42 | POST | `/api/json/ojt-semesters/assessment-window/open` | Mở xét điều kiện chính thức. Cần xác nhận đã cập nhật xong điểm. Kết quả kiểm tra trước mốc xác nhận phải được chạy lại. |
| 43 | POST | `/api/json/ojt-semesters/assessment-window/close` | Đóng xét điều kiện chính thức |
| 44 | POST | `/api/json/curricula/ojt-grade-mappings/detail` | Xem quy đổi điểm môn OJT |
| 45 | PUT | `/api/json/curricula/ojt-grade-mappings` | Thiết lập quy đổi điểm môn OJT. Chọn môn, kỳ ghi nhận và thang quy đổi. Cấu hình đã dùng để xác nhận kết quả không được sửa. |
| 46 | POST | `/api/json/ojt-registration-windows/semester-exceptions` | Thêm ngoại lệ kỳ đăng ký OJT. Chỉ áp dụng cho sinh viên, kỳ và thời hạn được chỉ định; cần lý do. |
| 47 | POST | `/api/json/ojt-registration-windows/semester-exceptions/revoke` | Thu hồi ngoại lệ kỳ đăng ký OJT |
| 48 | POST | `/api/json/combo-registration-windows/preview` | Xem ảnh hưởng của combo dự kiến. Tính tín chỉ, môn còn thiếu và điều kiện OJT; không lưu lựa chọn chính thức. |
| 49 | POST | `/api/json/academic/dashboard/search` | Tổng quan và thống kê điều kiện OJT. Chọn section summary/statistics/all; thống kê hỗ trợ groupBy. |
| 50 | POST | `/api/json/academic/alerts/search` | Danh sách cảnh báo thiếu điều kiện OJT |
| 51 | POST | `/api/json/academic/course-demand/search` | Thống kê nhu cầu học môn còn thiếu |
| 52 | POST | `/api/json/academic/course-demand/export` | Xuất nhu cầu học theo môn, kỳ và Block |
| 53 | POST | `/api/json/accounts/search` | Danh sách tài khoản |
| 54 | PATCH | `/api/json/accounts` | Cập nhật tài khoản. Admin sửa thông tin, trạng thái và vai trò trong một lần; chỉ gửi trường cần thay đổi. |
| 55 | POST | `/api/json/combo-registration-windows/search` | Danh sách đợt chọn combo. Sinh viên chỉ thấy đợt của mình, kèm lựa chọn hợp lệ, hạn gia hạn và lý do chưa thể nộp. |
| 56 | PATCH | `/api/json/combo-registration-windows` | Cập nhật hoặc mở/đóng đợt chọn combo. Giữ kiểm tra phạm vi, chốt danh sách và hạn đăng ký; status cần reason. |
| 57 | POST | `/api/json/combo-registration-windows/extensions` | Gia hạn chọn combo |
| 58 | POST | `/api/json/combo-registration-windows/selections/search` | Theo dõi lựa chọn combo |
| 59 | POST | `/api/json/combo-registration-windows/selections` | Gửi lựa chọn combo |
| 60 | POST | `/api/json/combo-registration-windows/reminders` | Gửi nhắc chọn combo |
| 61 | POST | `/api/json/students/combo-selections/search` | Lịch sử lựa chọn combo của sinh viên |
| 62 | POST | `/api/json/combo-registration-windows/finalize` | Chốt lựa chọn combo |
| 63 | POST | `/api/json/majors/search` | Danh sách chuyên ngành |
| 64 | POST | `/api/json/courses/search` | Danh sách môn học |
| 65 | POST | `/api/json/curricula/search` | Danh sách chương trình đào tạo đã nhập |
| 66 | PATCH | `/api/json/courses` | Cập nhật môn học |
| 67 | POST | `/api/json/curricula/detail` | Chi tiết chương trình đào tạo |
| 68 | PATCH | `/api/json/curricula` | Sửa thông tin chương trình đã nhập. Chỉ sửa bản nháp; tạo phiên bản mới bằng import. |
| 69 | PUT | `/api/json/curricula/courses` | Thiết lập môn, tín chỉ và kỳ học |
| 70 | PUT | `/api/json/curricula/prerequisites` | Thiết lập môn tiên quyết |
| 71 | PUT | `/api/json/curricula/course-equivalences` | Thiết lập công nhận và tương đương môn |
| 72 | PUT | `/api/json/combos/courses` | Thiết lập môn thuộc combo |
| 73 | POST | `/api/json/curricula/publish` | Ban hành phiên bản chương trình |
| 74 | POST | `/api/json/ojt-rule-sets/search` | Danh sách bộ quy tắc OJT |
| 75 | PATCH | `/api/json/ojt-rule-sets` | Sửa bộ quy tắc chưa ban hành |
| 76 | POST | `/api/json/ojt-rule-sets/publish` | Ban hành bộ quy tắc OJT |
| 77 | POST | `/api/json/students/eligibility-checks/search` | Lịch sử kiểm tra điều kiện OJT |
| 78 | POST | `/api/json/students/eligibility-checks` | Kiểm tra điều kiện OJT của sinh viên |
| 79 | POST | `/api/json/students/eligibility/search` | Kết quả OJT và điều kiện còn thiếu |
| 80 | POST | `/api/json/eligibility-checks/confirm` | Xác nhận kết quả xét điều kiện OJT |
| 81 | POST | `/api/json/eligibility-check-runs/detail` | Tiến độ và kết quả kiểm tra hàng loạt |
| 82 | POST | `/api/json/imports/emails/retry` | Gửi lại email bị lỗi |
| 83 | POST | `/api/json/ojt-registration-windows/search` | Danh sách đợt đăng ký OJT. Sinh viên chỉ thấy đợt phù hợp, kèm kỳ học, hồ sơ đã nộp và điều kiện đăng ký. |
| 84 | PATCH | `/api/json/ojt-registration-windows` | Cập nhật hoặc mở/đóng đợt đăng ký OJT. Gửi status OPEN/CLOSED và reason để chuyển trạng thái. |
| 85 | POST | `/api/json/ojt-registrations/search` | Danh sách hồ sơ đăng ký OJT |
| 86 | POST | `/api/json/ojt-registrations/detail` | Chi tiết hồ sơ đăng ký OJT |
| 87 | POST | `/api/json/ojt-registrations/review` | Duyệt hoặc từ chối hồ sơ OJT |
| 88 | POST | `/api/json/ojt-semesters/eligible-student-handoffs/search` | Lịch sử bàn giao sinh viên cho QHDN |
| 89 | POST | `/api/json/ojt-semesters/eligible-student-handoffs` | Bàn giao sinh viên đủ điều kiện cho QHDN |
| 90 | POST | `/api/json/ojt-semesters/students/search` | Theo dõi trạng thái OJT theo kỳ |
| 91 | POST | `/api/json/ojt-results/search` | Danh sách kết quả OJT đã chuyển |
| 92 | POST | `/api/json/ojt-results/detail` | Chi tiết đánh giá và hồ sơ OJT |
| 93 | PATCH | `/api/json/ojt-results` | Cập nhật điểm và kết quả OJT chính thức |
| 94 | POST | `/api/json/ojt-results/revision-requests` | Yêu cầu bổ sung hồ sơ kết quả OJT |
| 95 | POST | `/api/json/ojt-results/transfer` | Gửi lại hồ sơ OJT đã bổ sung |
| 96 | POST | `/api/json/ojt-results/confirm` | Xác nhận kết quả OJT. Ghi nhận kết quả môn học và trạng thái thực tập theo cấu hình quy đổi điểm. |
| 97 | POST | `/api/json/ojt-semesters/results/export` | Xuất báo cáo kết quả OJT theo kỳ |
| 98 | POST | `/api/json/companies/search` | Danh sách và hồ sơ doanh nghiệp. Lọc companyId để lấy một hồ sơ kèm lịch sử phân trang. |
| 99 | PATCH | `/api/json/companies` | Cập nhật doanh nghiệp. Admin và Phòng QHDN dùng chung URL; chọn mẫu dữ liệu theo vai trò trong anyOf. |
| 100 | DELETE | `/api/json/companies` | Xóa doanh nghiệp. Xóa mềm doanh nghiệp theo điều kiện dữ liệu liên quan. |
| 101 | POST | `/api/json/positions/search` | Danh sách và hồ sơ vị trí thực tập. Lọc positionId để lấy một vị trí kèm lịch sử; có mã, địa điểm và hình thức làm việc. |
| 102 | POST | `/api/json/ojt-coordinations/search` | Danh sách và hồ sơ điều phối. Lọc coordinationId để xem hồ sơ, lịch sử và chuỗi điều phối phân trang. |
| 103 | POST | `/api/json/assignments/search` | Danh sách và hồ sơ phân công thực tập. Kèm sinh viên, doanh nghiệp, vị trí, đánh giá và kết quả OJT; lọc assignmentId để xem lịch sử. |
| 104 | PATCH | `/api/json/assignments` | Cập nhật thông tin và trạng thái thực tập. Admin và Phòng QHDN dùng chung URL; chọn mẫu dữ liệu theo vai trò trong anyOf. |
| 105 | POST | `/api/json/internship-evaluations/search` | Danh sách đánh giá thực tập. Lọc evaluationId để xem hồ sơ và lịch sử; giữ lọc templateId. |
| 106 | POST | `/api/json/ojt-coordinations/decision` | Ghi nhận quyết định tiếp nhận sinh viên. Admin hoặc Phòng QHDN ghi nhận thay doanh nghiệp; cần lý do. |
| 107 | POST | `/api/json/ojt-coordinations/reassign` | Điều phối lại sinh viên. Chuyển hồ sơ bị từ chối sang vị trí khác; cần lý do. |
| 108 | PUT | `/api/json/assignments/internship-evaluation` | Ghi nhận đánh giá thực tập. Admin hoặc Phòng QHDN nhập thay doanh nghiệp; cần lý do. |
| 109 | POST | `/api/json/qhdn/registered-students/search` | Xem sinh viên đã đăng ký OJT. Admin/QHDN chỉ xem sinh viên đã có đăng ký OJT, kể cả chưa bàn giao. Mỗi sinh viên một dòng, các hồ sơ khớp bộ lọc nằm trong registrations; total và phân trang tính theo sinh viên. Không cấp quyền duyệt hoặc điều phối trước bàn giao. |
| 110 | POST | `/api/json/qhdn/dashboard/search` | Tổng quan QHDN. Tổng hợp bàn giao, tiếp nhận và sức chứa; dùng lần điều phối mới nhất. |
| 111 | POST | `/api/json/qhdn/reports/export` | Xuất báo cáo QHDN. Định dạng CSV hoặc JSON; tối đa 10.000 dòng, không phân trang. |
| 112 | POST | `/api/json/qhdn/reports/search` | Báo cáo QHDN theo loại. type: acceptance, internships hoặc enterprise-feedback; giữ lọc kỳ/doanh nghiệp và phân trang. |
| 113 | POST | `/api/json/students/search` | Tìm kiếm và lọc sinh viên |
| 114 | POST | `/api/json/students/detail` | Hồ sơ học vụ tổng hợp. Kèm GPA, tín chỉ, điểm, combo và OJT; điểm và lịch sử đăng ký có phân trang. |
| 115 | PATCH | `/api/json/students` | Cập nhật hồ sơ và lộ trình học vụ. Chỉ gửi trường cần sửa; placement chứa khóa, nhóm và kỳ học. |
| 116 | DELETE | `/api/json/students` | Xóa hồ sơ sinh viên. Xóa mềm hồ sơ và vô hiệu hóa tài khoản. |
| 117 | POST | `/api/json/students/course-results/search` | Điểm, lần học và trạng thái môn |
| 118 | POST | `/api/json/students/academic-progress/search` | GPA, tín chỉ và tiến độ học tập. GPA lấy lần học gần nhất. Tín chỉ không cộng trùng học lại, môn tương đương và môn được công nhận. |
| 119 | PATCH | `/api/json/course-results` | Sửa kết quả học tập và ghi lý do |
| 120 | POST | `/api/json/academic-imports/search` | Lịch sử nhập dữ liệu học vụ |
| 121 | POST | `/api/json/academic-imports/detail` | Chi tiết và lỗi nhập dữ liệu học vụ |
| 122 | POST | `/api/json/auth/users/password-reset` | Đặt lại mật khẩu. Gửi mật khẩu tạm qua email và thu hồi phiên cũ. |
| 123 | POST | `/api/json/admin/dashboard/search` | Tổng quan hệ thống và thống kê dự đoán. section: summary/readiness/risks/trends/all. Summary luôn là tổng toàn hệ thống. |
| 124 | POST | `/api/json/students/export` | Xuất danh sách sinh viên |
| 125 | DELETE | `/api/json/positions` | Xóa vị trí thực tập. Xóa mềm vị trí theo điều kiện dữ liệu liên quan. |
| 126 | POST | `/api/json/assessment-templates/search` | Danh sách và hồ sơ bộ tiêu chí đánh giá. Lọc templateId để lấy một bộ tiêu chí đầy đủ. |
| 127 | PATCH | `/api/json/assessment-templates` | Sửa bộ tiêu chí đánh giá. Chỉ sửa phiên bản còn nháp. |
| 128 | POST | `/api/json/assessment-templates/publish` | Ban hành bộ tiêu chí đánh giá. Phiên bản đã ban hành không được sửa. |
| 129 | POST | `/api/json/admin/prediction-jobs/detail` | Tiến độ dự đoán và lỗi theo sinh viên |
| 130 | POST | `/api/json/predictions/search` | Lịch sử dự đoán |
| 131 | POST | `/api/json/predictions/detail` | Chi tiết dự đoán. Kèm dữ liệu đầu vào và phiên bản mô hình đã sử dụng. |
| 132 | POST | `/api/json/admin/models/search` | Danh sách và hồ sơ phiên bản mô hình. Lọc modelId; kết quả kèm thông số và cấu trúc đầu vào. |
| 133 | POST | `/api/json/alerts/search` | Danh sách và hồ sơ cảnh báo rủi ro. Lọc alertId để lấy cảnh báo kèm hoạt động hỗ trợ phân trang. |
| 134 | PATCH | `/api/json/alerts/status` | Tiếp nhận hoặc đóng cảnh báo |
| 135 | POST | `/api/json/alerts/interventions` | Tạo hoạt động hỗ trợ sinh viên |
| 136 | POST | `/api/json/students/interventions/search` | Lịch sử hỗ trợ sinh viên |
| 137 | PATCH | `/api/json/interventions` | Cập nhật hoạt động hỗ trợ |
| 138 | POST | `/api/json/admin/reports/readiness/search` | Báo cáo mức sẵn sàng và rủi ro. Lấy dự đoán mới nhất của từng sinh viên trong mỗi kỳ. |
| 139 | POST | `/api/json/admin/reports/export` | Xuất báo cáo dự đoán. Tối đa 10.000 bản ghi dự đoán mới nhất. |
| 140 | POST | `/api/json/admin/audit-logs/search` | Nhật ký hoạt động hệ thống. Ẩn các trường dữ liệu nhạy cảm. |
| 141 | POST | `/api/json/recruitment/windows/search` | Danh sách đợt tuyển dụng theo học kỳ |
| 142 | PATCH | `/api/json/recruitment/windows` | Cập nhật hoặc mở/đóng đợt tuyển dụng. Chọn học kỳ có sẵn; status OPEN/CLOSED cần reason. |
| 143 | POST | `/api/json/recruitment/posts/search` | Danh sách tin tuyển dụng. Kèm vị trí và chỉ tiêu; doanh nghiệp chỉ xem tin của mình. |
| 144 | PATCH | `/api/json/recruitment/posts` | Sửa tin và vị trí tuyển dụng. Tin chuyển về chờ duyệt; vị trí có lịch sử chỉ được sửa sức chứa. |
| 145 | POST | `/api/json/recruitment/posts/review` | Duyệt hoặc từ chối tin tuyển dụng. Vị trí được mở sau khi tin được công bố. |
| 146 | POST | `/api/json/recruitment/posts/close` | Đóng tin tuyển dụng. Ngừng nhận ứng viên vào các vị trí liên quan. |

## Phòng đào tạo — 88 API

| # | Method | Đường dẫn | Chức năng |
|---:|---|---|---|
| 1 | POST | `/api/academic-years` | Tạo năm học |
| 2 | POST | `/api/academic-periods` | Tạo kỳ học và Block 3. Học kỳ thường tự liên kết OJT và trả ojtSemesterId; QHDN không tạo kỳ riêng. |
| 3 | POST | `/api/cohorts` | Tạo khóa và nhóm |
| 4 | POST | `/api/academic/alerts/notifications` | Gửi cảnh báo học vụ |
| 5 | PATCH | `/api/accounts/me/profile` | Cập nhật hồ sơ cá nhân |
| 6 | POST | `/api/combo-registration-windows` | Tạo đợt chọn hoặc xác nhận combo |
| 7 | POST | `/api/majors` | Tạo chuyên ngành |
| 8 | POST | `/api/courses` | Tạo môn học |
| 9 | POST | `/api/curriculum-imports/preview` | Kiểm tra dữ liệu nhập khung chương trình |
| 10 | POST | `/api/curriculum-imports/commit` | Nhập khung chương trình |
| 11 | POST | `/api/ojt-rule-sets` | Tạo bộ quy tắc OJT. Điều kiện: tối thiểu 70 tín chỉ và tối đa 2 môn còn nợ. |
| 12 | POST | `/api/eligibility-check-runs` | Kiểm tra điều kiện OJT hàng loạt |
| 13 | POST | `/api/imports/preview` | Kiểm tra dữ liệu nhập sinh viên hoặc doanh nghiệp |
| 14 | POST | `/api/imports/commit` | Nhập sinh viên hoặc doanh nghiệp |
| 15 | POST | `/api/ojt-registration-windows` | Tạo đợt đăng ký OJT. Mặc định dành cho kỳ chuyên ngành 5, tính theo lộ trình thực tế. |
| 16 | POST | `/api/ojt-registrations` | Nộp hồ sơ đăng ký OJT |
| 17 | POST | `/api/course-result-imports/preview` | Kiểm tra dữ liệu nhập kết quả học tập |
| 18 | POST | `/api/course-result-imports/commit` | Nhập kết quả học tập |
| 19 | POST | `/api/json/academic-years/search` | Danh sách năm học |
| 20 | PATCH | `/api/json/academic-years` | Cập nhật năm học |
| 21 | POST | `/api/json/academic-periods/search` | Danh sách kỳ học và Block 3. Lọc kind=SEMESTER để chọn học kỳ tuyển dụng; kết quả kèm thông tin OJT. |
| 22 | PATCH | `/api/json/academic-periods` | Cập nhật kỳ học và Block 3 |
| 23 | POST | `/api/json/cohorts/search` | Danh sách khóa và nhóm |
| 24 | PATCH | `/api/json/cohorts` | Cập nhật khóa và nhóm |
| 25 | POST | `/api/json/academic-periods/combo-phase-schedules/search` | Xem mốc chọn và xác nhận combo |
| 26 | PUT | `/api/json/academic-periods/combo-phase-schedules` | Thiết lập mốc chọn và xác nhận combo. Chọn ban đầu trong kỳ học; xác nhận trong Block 3. Các mốc phải nằm trong kỳ tương ứng. |
| 27 | POST | `/api/json/ojt-semesters/assessment-window/search` | Xem đợt xét điều kiện chính thức |
| 28 | PUT | `/api/json/ojt-semesters/assessment-window` | Thiết lập đợt xét điều kiện chính thức. Thiết lập khi còn nháp. Thời điểm mở sau khi Block 3 kết thúc. |
| 29 | POST | `/api/json/ojt-semesters/assessment-window/open` | Mở xét điều kiện chính thức. Cần xác nhận đã cập nhật xong điểm. Kết quả kiểm tra trước mốc xác nhận phải được chạy lại. |
| 30 | POST | `/api/json/ojt-semesters/assessment-window/close` | Đóng xét điều kiện chính thức |
| 31 | POST | `/api/json/curricula/ojt-grade-mappings/detail` | Xem quy đổi điểm môn OJT |
| 32 | PUT | `/api/json/curricula/ojt-grade-mappings` | Thiết lập quy đổi điểm môn OJT. Chọn môn, kỳ ghi nhận và thang quy đổi. Cấu hình đã dùng để xác nhận kết quả không được sửa. |
| 33 | POST | `/api/json/ojt-registration-windows/semester-exceptions` | Thêm ngoại lệ kỳ đăng ký OJT. Chỉ áp dụng cho sinh viên, kỳ và thời hạn được chỉ định; cần lý do. |
| 34 | POST | `/api/json/ojt-registration-windows/semester-exceptions/revoke` | Thu hồi ngoại lệ kỳ đăng ký OJT |
| 35 | POST | `/api/json/combo-registration-windows/preview` | Xem ảnh hưởng của combo dự kiến. Tính tín chỉ, môn còn thiếu và điều kiện OJT; không lưu lựa chọn chính thức. |
| 36 | POST | `/api/json/academic/dashboard/search` | Tổng quan và thống kê điều kiện OJT. Chọn section summary/statistics/all; thống kê hỗ trợ groupBy. |
| 37 | POST | `/api/json/academic/alerts/search` | Danh sách cảnh báo thiếu điều kiện OJT |
| 38 | POST | `/api/json/academic/course-demand/search` | Thống kê nhu cầu học môn còn thiếu |
| 39 | POST | `/api/json/academic/course-demand/export` | Xuất nhu cầu học theo môn, kỳ và Block |
| 40 | POST | `/api/json/combo-registration-windows/search` | Danh sách đợt chọn combo. Sinh viên chỉ thấy đợt của mình, kèm lựa chọn hợp lệ, hạn gia hạn và lý do chưa thể nộp. |
| 41 | PATCH | `/api/json/combo-registration-windows` | Cập nhật hoặc mở/đóng đợt chọn combo. Giữ kiểm tra phạm vi, chốt danh sách và hạn đăng ký; status cần reason. |
| 42 | POST | `/api/json/combo-registration-windows/extensions` | Gia hạn chọn combo |
| 43 | POST | `/api/json/combo-registration-windows/selections/search` | Theo dõi lựa chọn combo |
| 44 | POST | `/api/json/combo-registration-windows/selections` | Gửi lựa chọn combo |
| 45 | POST | `/api/json/combo-registration-windows/reminders` | Gửi nhắc chọn combo |
| 46 | POST | `/api/json/students/combo-selections/search` | Lịch sử lựa chọn combo của sinh viên |
| 47 | POST | `/api/json/combo-registration-windows/finalize` | Chốt lựa chọn combo |
| 48 | POST | `/api/json/majors/search` | Danh sách chuyên ngành |
| 49 | POST | `/api/json/courses/search` | Danh sách môn học |
| 50 | POST | `/api/json/curricula/search` | Danh sách chương trình đào tạo đã nhập |
| 51 | PATCH | `/api/json/courses` | Cập nhật môn học |
| 52 | POST | `/api/json/curricula/detail` | Chi tiết chương trình đào tạo |
| 53 | PATCH | `/api/json/curricula` | Sửa thông tin chương trình đã nhập. Chỉ sửa bản nháp; tạo phiên bản mới bằng import. |
| 54 | PUT | `/api/json/curricula/courses` | Thiết lập môn, tín chỉ và kỳ học |
| 55 | PUT | `/api/json/curricula/prerequisites` | Thiết lập môn tiên quyết |
| 56 | PUT | `/api/json/curricula/course-equivalences` | Thiết lập công nhận và tương đương môn |
| 57 | PUT | `/api/json/combos/courses` | Thiết lập môn thuộc combo |
| 58 | POST | `/api/json/curricula/publish` | Ban hành phiên bản chương trình |
| 59 | POST | `/api/json/ojt-rule-sets/search` | Danh sách bộ quy tắc OJT |
| 60 | PATCH | `/api/json/ojt-rule-sets` | Sửa bộ quy tắc chưa ban hành |
| 61 | POST | `/api/json/ojt-rule-sets/publish` | Ban hành bộ quy tắc OJT |
| 62 | POST | `/api/json/students/eligibility-checks/search` | Lịch sử kiểm tra điều kiện OJT |
| 63 | POST | `/api/json/students/eligibility-checks` | Kiểm tra điều kiện OJT của sinh viên |
| 64 | POST | `/api/json/students/eligibility/search` | Kết quả OJT và điều kiện còn thiếu |
| 65 | POST | `/api/json/eligibility-checks/confirm` | Xác nhận kết quả xét điều kiện OJT |
| 66 | POST | `/api/json/eligibility-check-runs/detail` | Tiến độ và kết quả kiểm tra hàng loạt |
| 67 | POST | `/api/json/ojt-registration-windows/search` | Danh sách đợt đăng ký OJT. Sinh viên chỉ thấy đợt phù hợp, kèm kỳ học, hồ sơ đã nộp và điều kiện đăng ký. |
| 68 | PATCH | `/api/json/ojt-registration-windows` | Cập nhật hoặc mở/đóng đợt đăng ký OJT. Gửi status OPEN/CLOSED và reason để chuyển trạng thái. |
| 69 | POST | `/api/json/ojt-registrations/search` | Danh sách hồ sơ đăng ký OJT |
| 70 | POST | `/api/json/ojt-registrations/detail` | Chi tiết hồ sơ đăng ký OJT |
| 71 | POST | `/api/json/ojt-registrations/review` | Duyệt hoặc từ chối hồ sơ OJT |
| 72 | POST | `/api/json/ojt-semesters/eligible-student-handoffs/search` | Lịch sử bàn giao sinh viên cho QHDN |
| 73 | POST | `/api/json/ojt-semesters/eligible-student-handoffs` | Bàn giao sinh viên đủ điều kiện cho QHDN |
| 74 | POST | `/api/json/ojt-semesters/students/search` | Theo dõi trạng thái OJT theo kỳ |
| 75 | POST | `/api/json/ojt-results/search` | Danh sách kết quả OJT đã chuyển |
| 76 | POST | `/api/json/ojt-results/detail` | Chi tiết đánh giá và hồ sơ OJT |
| 77 | PATCH | `/api/json/ojt-results` | Cập nhật điểm và kết quả OJT chính thức |
| 78 | POST | `/api/json/ojt-results/revision-requests` | Yêu cầu bổ sung hồ sơ kết quả OJT |
| 79 | POST | `/api/json/ojt-results/confirm` | Xác nhận kết quả OJT. Ghi nhận kết quả môn học và trạng thái thực tập theo cấu hình quy đổi điểm. |
| 80 | POST | `/api/json/ojt-semesters/results/export` | Xuất báo cáo kết quả OJT theo kỳ |
| 81 | POST | `/api/json/students/search` | Tìm kiếm và lọc sinh viên |
| 82 | POST | `/api/json/students/detail` | Hồ sơ học vụ tổng hợp. Kèm GPA, tín chỉ, điểm, combo và OJT; điểm và lịch sử đăng ký có phân trang. |
| 83 | PATCH | `/api/json/students` | Cập nhật hồ sơ và lộ trình học vụ. Chỉ gửi trường cần sửa; placement chứa khóa, nhóm và kỳ học. |
| 84 | POST | `/api/json/students/course-results/search` | Điểm, lần học và trạng thái môn |
| 85 | POST | `/api/json/students/academic-progress/search` | GPA, tín chỉ và tiến độ học tập. GPA lấy lần học gần nhất. Tín chỉ không cộng trùng học lại, môn tương đương và môn được công nhận. |
| 86 | PATCH | `/api/json/course-results` | Sửa kết quả học tập và ghi lý do |
| 87 | POST | `/api/json/academic-imports/search` | Lịch sử nhập dữ liệu học vụ |
| 88 | POST | `/api/json/academic-imports/detail` | Chi tiết và lỗi nhập dữ liệu học vụ |

## Phòng QHDN — 38 API

| # | Method | Đường dẫn | Chức năng |
|---:|---|---|---|
| 1 | PATCH | `/api/accounts/me/profile` | Cập nhật hồ sơ cá nhân |
| 2 | POST | `/api/imports/preview` | Kiểm tra dữ liệu nhập sinh viên hoặc doanh nghiệp |
| 3 | POST | `/api/imports/commit` | Nhập sinh viên hoặc doanh nghiệp |
| 4 | POST | `/api/imports/archive` | Lưu trữ tuyển dụng sau hai học kỳ |
| 5 | POST | `/api/ojt-results` | Chuyển đánh giá và hồ sơ OJT cho phòng đào tạo |
| 6 | POST | `/api/companies` | Tạo doanh nghiệp. Admin và Phòng QHDN dùng chung URL; chọn mẫu dữ liệu theo vai trò trong anyOf. |
| 7 | POST | `/api/ojt-coordinations` | Giới thiệu sinh viên cho doanh nghiệp. Áp dụng cho hồ sơ đã bàn giao; cần lý do và lưu nhật ký. |
| 8 | POST | `/api/assignments` | Phân công sinh viên thực tập. Admin và Phòng QHDN dùng chung URL; chọn mẫu dữ liệu theo vai trò trong anyOf. |
| 9 | POST | `/api/recruitment/windows` | Tạo đợt nhận nhu cầu tuyển dụng. Chọn học kỳ có sẵn và thời hạn nhận đơn; không tạo kỳ OJT riêng. |
| 10 | POST | `/api/json/academic-periods/search` | Danh sách kỳ học và Block 3. Lọc kind=SEMESTER để chọn học kỳ tuyển dụng; kết quả kèm thông tin OJT. |
| 11 | POST | `/api/json/ojt-registrations/search` | Danh sách hồ sơ đăng ký OJT |
| 12 | POST | `/api/json/ojt-registrations/detail` | Chi tiết hồ sơ đăng ký OJT |
| 13 | POST | `/api/json/ojt-semesters/eligible-student-handoffs/search` | Lịch sử bàn giao sinh viên cho QHDN |
| 14 | POST | `/api/json/ojt-semesters/students/search` | Theo dõi trạng thái OJT theo kỳ |
| 15 | POST | `/api/json/ojt-results/search` | Danh sách kết quả OJT đã chuyển |
| 16 | POST | `/api/json/ojt-results/detail` | Chi tiết đánh giá và hồ sơ OJT |
| 17 | POST | `/api/json/ojt-results/transfer` | Gửi lại hồ sơ OJT đã bổ sung |
| 18 | POST | `/api/json/ojt-semesters/results/export` | Xuất báo cáo kết quả OJT theo kỳ |
| 19 | POST | `/api/json/companies/search` | Danh sách và hồ sơ doanh nghiệp. Lọc companyId để lấy một hồ sơ kèm lịch sử phân trang. |
| 20 | PATCH | `/api/json/companies` | Cập nhật doanh nghiệp. Admin và Phòng QHDN dùng chung URL; chọn mẫu dữ liệu theo vai trò trong anyOf. |
| 21 | POST | `/api/json/positions/search` | Danh sách và hồ sơ vị trí thực tập. Lọc positionId để lấy một vị trí kèm lịch sử; có mã, địa điểm và hình thức làm việc. |
| 22 | POST | `/api/json/ojt-coordinations/search` | Danh sách và hồ sơ điều phối. Lọc coordinationId để xem hồ sơ, lịch sử và chuỗi điều phối phân trang. |
| 23 | POST | `/api/json/assignments/search` | Danh sách và hồ sơ phân công thực tập. Kèm sinh viên, doanh nghiệp, vị trí, đánh giá và kết quả OJT; lọc assignmentId để xem lịch sử. |
| 24 | PATCH | `/api/json/assignments` | Cập nhật thông tin và trạng thái thực tập. Admin và Phòng QHDN dùng chung URL; chọn mẫu dữ liệu theo vai trò trong anyOf. |
| 25 | POST | `/api/json/internship-evaluations/search` | Danh sách đánh giá thực tập. Lọc evaluationId để xem hồ sơ và lịch sử; giữ lọc templateId. |
| 26 | POST | `/api/json/ojt-coordinations/decision` | Ghi nhận quyết định tiếp nhận sinh viên. Admin hoặc Phòng QHDN ghi nhận thay doanh nghiệp; cần lý do. |
| 27 | POST | `/api/json/ojt-coordinations/reassign` | Điều phối lại sinh viên. Chuyển hồ sơ bị từ chối sang vị trí khác; cần lý do. |
| 28 | PUT | `/api/json/assignments/internship-evaluation` | Ghi nhận đánh giá thực tập. Admin hoặc Phòng QHDN nhập thay doanh nghiệp; cần lý do. |
| 29 | POST | `/api/json/qhdn/registered-students/search` | Xem sinh viên đã đăng ký OJT. Admin/QHDN chỉ xem sinh viên đã có đăng ký OJT, kể cả chưa bàn giao. Mỗi sinh viên một dòng, các hồ sơ khớp bộ lọc nằm trong registrations; total và phân trang tính theo sinh viên. Không cấp quyền duyệt hoặc điều phối trước bàn giao. |
| 30 | POST | `/api/json/qhdn/dashboard/search` | Tổng quan QHDN. Tổng hợp bàn giao, tiếp nhận và sức chứa; dùng lần điều phối mới nhất. |
| 31 | POST | `/api/json/qhdn/reports/export` | Xuất báo cáo QHDN. Định dạng CSV hoặc JSON; tối đa 10.000 dòng, không phân trang. |
| 32 | POST | `/api/json/qhdn/reports/search` | Báo cáo QHDN theo loại. type: acceptance, internships hoặc enterprise-feedback; giữ lọc kỳ/doanh nghiệp và phân trang. |
| 33 | POST | `/api/json/recruitment/windows/search` | Danh sách đợt tuyển dụng theo học kỳ |
| 34 | PATCH | `/api/json/recruitment/windows` | Cập nhật hoặc mở/đóng đợt tuyển dụng. Chọn học kỳ có sẵn; status OPEN/CLOSED cần reason. |
| 35 | POST | `/api/json/recruitment/posts/search` | Danh sách tin tuyển dụng. Kèm vị trí và chỉ tiêu; doanh nghiệp chỉ xem tin của mình. |
| 36 | PATCH | `/api/json/recruitment/posts` | Sửa tin và vị trí tuyển dụng. Tin chuyển về chờ duyệt; vị trí có lịch sử chỉ được sửa sức chứa. |
| 37 | POST | `/api/json/recruitment/posts/review` | Duyệt hoặc từ chối tin tuyển dụng. Vị trí được mở sau khi tin được công bố. |
| 38 | POST | `/api/json/recruitment/posts/close` | Đóng tin tuyển dụng. Ngừng nhận ứng viên vào các vị trí liên quan. |

## Doanh nghiệp — 10 API

| # | Method | Đường dẫn | Chức năng |
|---:|---|---|---|
| 1 | PATCH | `/api/accounts/me/profile` | Cập nhật hồ sơ cá nhân |
| 2 | GET | `/api/enterprise/profile` | Hồ sơ doanh nghiệp. Chỉ xem dữ liệu của doanh nghiệp đang đăng nhập. Kèm số liệu tuyển dụng và thực tập. |
| 3 | POST | `/api/recruitment/posts` | Gửi nhu cầu tuyển dụng. Gửi vị trí, yêu cầu và số lượng trong đợt đang mở. |
| 4 | POST | `/api/json/enterprise/candidates/search` | Danh sách và hồ sơ ứng viên. Lọc candidateId để xem một lần giới thiệu, kể cả lịch sử thuộc doanh nghiệp đăng nhập. |
| 5 | PATCH | `/api/json/enterprise/candidates/decision` | Tiếp nhận hoặc từ chối ứng viên. Chỉ xử lý ứng viên được giới thiệu cho doanh nghiệp đang đăng nhập. |
| 6 | POST | `/api/json/enterprise/internships/search` | Danh sách sinh viên thực tập. Kèm người hướng dẫn, vị trí, đánh giá và kết quả; điểm chính thức chỉ hiển thị sau xác nhận. |
| 7 | PUT | `/api/json/enterprise/internships/evaluation` | Gửi hoặc cập nhật đánh giá thực tập. Chỉ đánh giá sinh viên của doanh nghiệp; internshipId là ID phân công. |
| 8 | POST | `/api/json/recruitment/windows/search` | Danh sách đợt tuyển dụng theo học kỳ |
| 9 | POST | `/api/json/recruitment/posts/search` | Danh sách tin tuyển dụng. Kèm vị trí và chỉ tiêu; doanh nghiệp chỉ xem tin của mình. |
| 10 | PATCH | `/api/json/recruitment/posts` | Sửa tin và vị trí tuyển dụng. Tin chuyển về chờ duyệt; vị trí có lịch sử chỉ được sửa sức chứa. |

## Sinh viên — 15 API

| # | Method | Đường dẫn | Chức năng |
|---:|---|---|---|
| 1 | PATCH | `/api/accounts/me/profile` | Cập nhật hồ sơ cá nhân |
| 2 | POST | `/api/ojt-registrations` | Nộp hồ sơ đăng ký OJT |
| 3 | POST | `/api/json/combo-registration-windows/preview` | Xem ảnh hưởng của combo dự kiến. Tính tín chỉ, môn còn thiếu và điều kiện OJT; không lưu lựa chọn chính thức. |
| 4 | POST | `/api/json/combo-registration-windows/search` | Danh sách đợt chọn combo. Sinh viên chỉ thấy đợt của mình, kèm lựa chọn hợp lệ, hạn gia hạn và lý do chưa thể nộp. |
| 5 | POST | `/api/json/combo-registration-windows/selections` | Gửi lựa chọn combo |
| 6 | POST | `/api/json/students/combo-selections/search` | Lịch sử lựa chọn combo của sinh viên |
| 7 | POST | `/api/json/students/eligibility-checks/search` | Lịch sử kiểm tra điều kiện OJT |
| 8 | POST | `/api/json/students/eligibility/search` | Kết quả OJT và điều kiện còn thiếu |
| 9 | POST | `/api/json/ojt-registration-windows/search` | Danh sách đợt đăng ký OJT. Sinh viên chỉ thấy đợt phù hợp, kèm kỳ học, hồ sơ đã nộp và điều kiện đăng ký. |
| 10 | POST | `/api/json/ojt-registrations/search` | Danh sách hồ sơ đăng ký OJT |
| 11 | POST | `/api/json/ojt-registrations/detail` | Chi tiết hồ sơ đăng ký OJT |
| 12 | POST | `/api/json/ojt-semesters/students/search` | Theo dõi trạng thái OJT theo kỳ |
| 13 | POST | `/api/json/students/detail` | Hồ sơ học vụ tổng hợp. Kèm GPA, tín chỉ, điểm, combo và OJT; điểm và lịch sử đăng ký có phân trang. |
| 14 | POST | `/api/json/students/course-results/search` | Điểm, lần học và trạng thái môn |
| 15 | POST | `/api/json/students/academic-progress/search` | GPA, tín chỉ và tiến độ học tập. GPA lấy lần học gần nhất. Tín chỉ không cộng trùng học lại, môn tương đương và môn được công nhận. |

## Auth — 3 API

| # | Method | Đường dẫn | Chức năng |
|---:|---|---|---|
| 1 | POST | `/api/auth/login` | Đăng nhập bằng email và mật khẩu |
| 2 | GET | `/api/auth/me` | Xem tài khoản đang đăng nhập. Kèm ID hồ sơ sinh viên hoặc doanh nghiệp liên kết. |
| 3 | POST | `/api/auth/change-password` | Đổi mật khẩu. Token cũ bị thu hồi; cần đăng nhập lại. |
