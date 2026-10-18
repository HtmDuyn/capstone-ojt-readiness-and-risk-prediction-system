# Danh sách API theo 6 nhóm Swagger

Danh sách lấy trực tiếp từ swaggerSpec hiện tại. Tổng 176 cặp HTTP method + đường dẫn duy nhất. Một API được phép cho nhiều vai trò sẽ xuất hiện ở nhiều nhóm; không cộng số dòng các nhóm để tính tổng API. Đường dẫn dưới đây là đường dẫn đang hiển thị trên Swagger, bao gồm các adapter /api/json.

## Tổng hợp

| Nhóm | Số API hiển thị |
|---|---:|
| Admin | 166 |
| Phòng đào tạo | 99 |
| Phòng QHDN | 47 |
| Doanh nghiệp | 12 |
| Sinh viên | 17 |
| Auth | 3 |

## Admin — 166 API

| # | Method | Đường dẫn | Chức năng |
|---:|---|---|---|
| 1 | POST | `/api/academic-years` | Tạo năm học |
| 2 | POST | `/api/academic-periods` | Tạo kỳ học và Block 3. Học kỳ thường tự liên kết OJT và trả ojtSemesterId; QHDN không tạo kỳ riêng. |
| 3 | POST | `/api/cohorts` | Tạo khóa và nhóm |
| 4 | POST | `/api/academic/alerts/notifications` | Gửi cảnh báo học vụ |
| 5 | POST | `/api/accounts` | Tạo tài khoản |
| 6 | GET | `/api/accounts/me/profile` | Xem hồ sơ cá nhân. Kèm studentId và enterpriseId để mở đúng hồ sơ chức năng. |
| 7 | PATCH | `/api/accounts/me/profile` | Cập nhật hồ sơ cá nhân |
| 8 | POST | `/api/combo-registration-windows` | Tạo đợt chọn hoặc xác nhận combo |
| 9 | POST | `/api/majors` | Tạo chuyên ngành |
| 10 | POST | `/api/courses` | Tạo môn học |
| 11 | POST | `/api/curricula` | Tạo phiên bản chương trình |
| 12 | POST | `/api/curriculum-imports/preview` | Kiểm tra dữ liệu nhập khung chương trình |
| 13 | POST | `/api/curriculum-imports/commit` | Nhập khung chương trình |
| 14 | POST | `/api/ojt-rule-sets` | Tạo bộ quy tắc OJT. Điều kiện: tối thiểu 70 tín chỉ và tối đa 2 môn còn nợ. |
| 15 | POST | `/api/eligibility-check-runs` | Kiểm tra điều kiện OJT hàng loạt |
| 16 | POST | `/api/imports/preview` | Kiểm tra dữ liệu nhập sinh viên hoặc doanh nghiệp |
| 17 | POST | `/api/imports/commit` | Nhập sinh viên hoặc doanh nghiệp |
| 18 | GET | `/api/imports/emails` | Trạng thái gửi email tài khoản |
| 19 | POST | `/api/imports/archive` | Lưu trữ tuyển dụng sau hai học kỳ |
| 20 | POST | `/api/ojt-registration-windows` | Tạo đợt đăng ký OJT. Mặc định dành cho kỳ chuyên ngành 5, tính theo lộ trình thực tế. |
| 21 | POST | `/api/ojt-registrations` | Nộp hồ sơ đăng ký OJT |
| 22 | POST | `/api/ojt-results` | Chuyển đánh giá và hồ sơ OJT cho phòng đào tạo |
| 23 | POST | `/api/companies` | Tạo doanh nghiệp. Admin và Phòng QHDN dùng chung URL; chọn mẫu dữ liệu theo vai trò trong anyOf. |
| 24 | POST | `/api/ojt-coordinations` | Giới thiệu sinh viên cho doanh nghiệp. Áp dụng cho hồ sơ đã bàn giao; cần lý do và lưu nhật ký. |
| 25 | POST | `/api/assignments` | Phân công sinh viên thực tập. Admin và Phòng QHDN dùng chung URL; chọn mẫu dữ liệu theo vai trò trong anyOf. |
| 26 | POST | `/api/students` | Tạo hồ sơ sinh viên. Liên kết với tài khoản sinh viên đang hoạt động. |
| 27 | POST | `/api/course-result-imports/preview` | Kiểm tra dữ liệu nhập kết quả học tập |
| 28 | POST | `/api/course-result-imports/commit` | Nhập kết quả học tập |
| 29 | GET | `/api/health` | Kiểm tra backend và cơ sở dữ liệu |
| 30 | GET | `/api/roles` | Danh sách vai trò |
| 31 | GET | `/api/admin/dashboard/summary` | Tổng quan hệ thống |
| 32 | POST | `/api/assessment-templates` | Tạo bộ tiêu chí đánh giá. Tổng trọng số tiêu chí phải bằng 100. |
| 33 | POST | `/api/admin/prediction-jobs` | Tạo tác vụ dự đoán. Sử dụng mô hình dự đoán đã cấu hình. |
| 34 | POST | `/api/recruitment/windows` | Tạo đợt nhận nhu cầu tuyển dụng. Chọn học kỳ có sẵn và thời hạn nhận đơn; không tạo kỳ OJT riêng. |
| 35 | POST | `/api/json/academic-years/search` | Danh sách năm học |
| 36 | PATCH | `/api/json/academic-years` | Cập nhật năm học |
| 37 | POST | `/api/json/academic-periods/search` | Danh sách kỳ học và Block 3. Lọc kind=SEMESTER để chọn học kỳ tuyển dụng; kết quả kèm thông tin OJT. |
| 38 | POST | `/api/json/academic-periods/detail` | Hồ sơ học kỳ và thông tin OJT |
| 39 | PATCH | `/api/json/academic-periods` | Cập nhật kỳ học và Block 3 |
| 40 | POST | `/api/json/cohorts/search` | Danh sách khóa và nhóm |
| 41 | PATCH | `/api/json/cohorts` | Cập nhật khóa và nhóm |
| 42 | PATCH | `/api/json/students/academic-placement` | Gán lộ trình học cho sinh viên. Lần đầu cần khóa, nhóm và kỳ hiện tại. Kỳ chuyên ngành tính từ kỳ vào thực tế; Block 3 không tăng số kỳ. |
| 43 | POST | `/api/json/academic-periods/combo-phase-schedules/search` | Xem mốc chọn và xác nhận combo |
| 44 | PUT | `/api/json/academic-periods/combo-phase-schedules` | Thiết lập mốc chọn và xác nhận combo. Chọn ban đầu trong kỳ học; xác nhận trong Block 3. Các mốc phải nằm trong kỳ tương ứng. |
| 45 | POST | `/api/json/ojt-semesters/assessment-window/search` | Xem đợt xét điều kiện chính thức |
| 46 | PUT | `/api/json/ojt-semesters/assessment-window` | Thiết lập đợt xét điều kiện chính thức. Thiết lập khi còn nháp. Thời điểm mở sau khi Block 3 kết thúc. |
| 47 | POST | `/api/json/ojt-semesters/assessment-window/open` | Mở xét điều kiện chính thức. Cần xác nhận đã cập nhật xong điểm. Kết quả kiểm tra trước mốc xác nhận phải được chạy lại. |
| 48 | POST | `/api/json/ojt-semesters/assessment-window/close` | Đóng xét điều kiện chính thức |
| 49 | POST | `/api/json/curricula/ojt-grade-mappings/detail` | Xem quy đổi điểm môn OJT |
| 50 | PUT | `/api/json/curricula/ojt-grade-mappings` | Thiết lập quy đổi điểm môn OJT. Chọn môn, kỳ ghi nhận và thang quy đổi. Cấu hình đã dùng để xác nhận kết quả không được sửa. |
| 51 | POST | `/api/json/ojt-registration-windows/semester-exceptions` | Thêm ngoại lệ kỳ đăng ký OJT. Chỉ áp dụng cho sinh viên, kỳ và thời hạn được chỉ định; cần lý do. |
| 52 | POST | `/api/json/ojt-registration-windows/semester-exceptions/revoke` | Thu hồi ngoại lệ kỳ đăng ký OJT |
| 53 | POST | `/api/json/combo-registration-windows/preview` | Xem ảnh hưởng của combo dự kiến. Tính tín chỉ, môn còn thiếu và điều kiện OJT; không lưu lựa chọn chính thức. |
| 54 | POST | `/api/json/academic/dashboard/search` | Tổng quan điều kiện OJT |
| 55 | POST | `/api/json/academic/eligibility-statistics/search` | Thống kê điều kiện theo khóa, nhóm, chuyên ngành và combo |
| 56 | POST | `/api/json/academic/alerts/search` | Danh sách cảnh báo thiếu điều kiện OJT |
| 57 | POST | `/api/json/academic/course-demand/search` | Thống kê nhu cầu học môn còn thiếu |
| 58 | POST | `/api/json/academic/course-demand/export` | Xuất nhu cầu học theo môn, kỳ và Block |
| 59 | POST | `/api/json/accounts/search` | Danh sách tài khoản |
| 60 | POST | `/api/json/accounts/detail` | Chi tiết tài khoản |
| 61 | PUT | `/api/json/accounts` | Cập nhật tài khoản |
| 62 | PATCH | `/api/json/accounts/status` | Cập nhật trạng thái tài khoản |
| 63 | PATCH | `/api/json/accounts/role` | Cập nhật vai trò tài khoản |
| 64 | POST | `/api/json/combo-registration-windows/search` | Danh sách đợt chọn combo. Sinh viên chỉ thấy đợt của mình, kèm lựa chọn hợp lệ, hạn gia hạn và lý do chưa thể nộp. |
| 65 | PATCH | `/api/json/combo-registration-windows` | Cập nhật đợt chọn combo |
| 66 | POST | `/api/json/combo-registration-windows/open` | Mở đợt chọn combo |
| 67 | POST | `/api/json/combo-registration-windows/close` | Đóng đợt chọn combo |
| 68 | POST | `/api/json/combo-registration-windows/extensions` | Gia hạn chọn combo |
| 69 | POST | `/api/json/combo-registration-windows/selections/search` | Theo dõi lựa chọn combo |
| 70 | POST | `/api/json/combo-registration-windows/selections` | Gửi lựa chọn combo |
| 71 | POST | `/api/json/combo-registration-windows/reminders` | Gửi nhắc chọn combo |
| 72 | POST | `/api/json/students/combo-selections/search` | Lịch sử lựa chọn combo của sinh viên |
| 73 | POST | `/api/json/combo-registration-windows/finalize` | Chốt lựa chọn combo |
| 74 | POST | `/api/json/majors/search` | Danh sách chuyên ngành |
| 75 | POST | `/api/json/courses/search` | Danh sách môn học |
| 76 | POST | `/api/json/curricula/search` | Danh sách chương trình đào tạo |
| 77 | PATCH | `/api/json/courses` | Cập nhật môn học |
| 78 | POST | `/api/json/curricula/detail` | Chi tiết chương trình đào tạo |
| 79 | PATCH | `/api/json/curricula` | Cập nhật phiên bản chương trình |
| 80 | PUT | `/api/json/curricula/courses` | Thiết lập môn, tín chỉ và kỳ học |
| 81 | PUT | `/api/json/curricula/prerequisites` | Thiết lập môn tiên quyết |
| 82 | PUT | `/api/json/curricula/course-equivalences` | Thiết lập công nhận và tương đương môn |
| 83 | POST | `/api/json/curricula/combos` | Tạo combo |
| 84 | PUT | `/api/json/combos/courses` | Thiết lập môn thuộc combo |
| 85 | POST | `/api/json/curricula/publish` | Ban hành phiên bản chương trình |
| 86 | POST | `/api/json/ojt-rule-sets/search` | Danh sách bộ quy tắc OJT |
| 87 | PATCH | `/api/json/ojt-rule-sets` | Sửa bộ quy tắc chưa ban hành |
| 88 | POST | `/api/json/ojt-rule-sets/publish` | Ban hành bộ quy tắc OJT |
| 89 | POST | `/api/json/students/eligibility-checks/search` | Lịch sử kiểm tra điều kiện OJT |
| 90 | POST | `/api/json/students/eligibility-checks` | Kiểm tra điều kiện OJT của sinh viên |
| 91 | POST | `/api/json/students/eligibility/search` | Kết quả OJT và điều kiện còn thiếu |
| 92 | POST | `/api/json/eligibility-checks/confirm` | Xác nhận kết quả xét điều kiện OJT |
| 93 | POST | `/api/json/eligibility-check-runs/detail` | Tiến độ và kết quả kiểm tra hàng loạt |
| 94 | POST | `/api/json/imports/emails/retry` | Gửi lại email bị lỗi |
| 95 | POST | `/api/json/ojt-registration-windows/search` | Danh sách đợt đăng ký OJT. Sinh viên chỉ thấy đợt phù hợp, kèm kỳ học, hồ sơ đã nộp và điều kiện đăng ký. |
| 96 | PATCH | `/api/json/ojt-registration-windows` | Cập nhật đợt đăng ký OJT |
| 97 | POST | `/api/json/ojt-registration-windows/open` | Mở đợt đăng ký OJT |
| 98 | POST | `/api/json/ojt-registration-windows/close` | Đóng đợt đăng ký OJT |
| 99 | POST | `/api/json/ojt-registrations/search` | Danh sách hồ sơ đăng ký OJT |
| 100 | POST | `/api/json/ojt-registrations/detail` | Chi tiết hồ sơ đăng ký OJT |
| 101 | POST | `/api/json/ojt-registrations/review` | Duyệt hoặc từ chối hồ sơ OJT |
| 102 | POST | `/api/json/ojt-semesters/eligible-student-handoffs/search` | Lịch sử bàn giao sinh viên cho QHDN |
| 103 | POST | `/api/json/ojt-semesters/eligible-student-handoffs` | Bàn giao sinh viên đủ điều kiện cho QHDN |
| 104 | POST | `/api/json/ojt-semesters/students/search` | Theo dõi trạng thái OJT theo kỳ |
| 105 | POST | `/api/json/ojt-results/search` | Danh sách kết quả OJT đã chuyển |
| 106 | POST | `/api/json/ojt-results/detail` | Chi tiết đánh giá và hồ sơ OJT |
| 107 | PATCH | `/api/json/ojt-results` | Cập nhật điểm và kết quả OJT chính thức |
| 108 | POST | `/api/json/ojt-results/revision-requests` | Yêu cầu bổ sung hồ sơ kết quả OJT |
| 109 | POST | `/api/json/ojt-results/transfer` | Gửi lại hồ sơ OJT đã bổ sung |
| 110 | POST | `/api/json/ojt-results/confirm` | Xác nhận kết quả OJT. Ghi nhận kết quả môn học và trạng thái thực tập theo cấu hình quy đổi điểm. |
| 111 | POST | `/api/json/ojt-semesters/results/export` | Xuất báo cáo kết quả OJT theo kỳ |
| 112 | POST | `/api/json/companies/search` | Danh sách và hồ sơ doanh nghiệp. Lọc companyId để lấy một hồ sơ kèm lịch sử phân trang. |
| 113 | PATCH | `/api/json/companies` | Cập nhật doanh nghiệp. Admin và Phòng QHDN dùng chung URL; chọn mẫu dữ liệu theo vai trò trong anyOf. |
| 114 | DELETE | `/api/json/companies` | Xóa doanh nghiệp. Xóa mềm doanh nghiệp theo điều kiện dữ liệu liên quan. |
| 115 | POST | `/api/json/positions/search` | Danh sách và hồ sơ vị trí thực tập. Lọc positionId để lấy một vị trí kèm lịch sử; có mã, địa điểm và hình thức làm việc. |
| 116 | POST | `/api/json/ojt-coordinations/search` | Danh sách điều phối sinh viên |
| 117 | POST | `/api/json/ojt-coordinations/detail` | Chi tiết và lịch sử điều phối |
| 118 | POST | `/api/json/assignments/search` | Danh sách và hồ sơ phân công thực tập. Kèm sinh viên, doanh nghiệp, vị trí, đánh giá và kết quả OJT; lọc assignmentId để xem lịch sử. |
| 119 | PATCH | `/api/json/assignments` | Cập nhật phân công thực tập. Admin và Phòng QHDN dùng chung URL; chọn mẫu dữ liệu theo vai trò trong anyOf. |
| 120 | POST | `/api/json/internship-evaluations/search` | Danh sách đánh giá thực tập. Có bộ tiêu chí và điểm chi tiết; hỗ trợ lọc theo templateId. |
| 121 | POST | `/api/json/internship-evaluations/detail` | Chi tiết và lịch sử đánh giá thực tập |
| 122 | POST | `/api/json/ojt-coordinations/decision` | Ghi nhận quyết định tiếp nhận sinh viên. Admin hoặc Phòng QHDN ghi nhận thay doanh nghiệp; cần lý do. |
| 123 | POST | `/api/json/ojt-coordinations/reassign` | Điều phối lại sinh viên. Chuyển hồ sơ bị từ chối sang vị trí khác; cần lý do. |
| 124 | PATCH | `/api/json/assignments/status` | Cập nhật trạng thái thực tập. Admin và Phòng QHDN dùng chung URL; chọn mẫu dữ liệu theo vai trò trong anyOf. |
| 125 | PUT | `/api/json/assignments/internship-evaluation` | Ghi nhận đánh giá thực tập. Admin hoặc Phòng QHDN nhập thay doanh nghiệp; cần lý do. |
| 126 | POST | `/api/json/qhdn/dashboard/search` | Tổng quan QHDN. Tổng hợp bàn giao, tiếp nhận và sức chứa; dùng lần điều phối mới nhất. |
| 127 | POST | `/api/json/qhdn/reports/acceptance/search` | Thống kê tiếp nhận và từ chối. Theo học kỳ và doanh nghiệp. Tỷ lệ tiếp nhận tính trên các hồ sơ đã có quyết định. |
| 128 | POST | `/api/json/qhdn/reports/internships/search` | Thống kê thực tập và kết quả. Theo học kỳ và doanh nghiệp; điểm và kết quả chỉ lấy hồ sơ đã xác nhận. |
| 129 | POST | `/api/json/qhdn/reports/enterprise-feedback/search` | Tổng hợp đánh giá từ doanh nghiệp. Gồm mức độ hoàn tất đánh giá và điểm trung bình; không phải khảo sát hài lòng. |
| 130 | POST | `/api/json/qhdn/reports/export` | Xuất báo cáo QHDN. Định dạng CSV hoặc JSON; tối đa 10.000 dòng, không phân trang. |
| 131 | POST | `/api/json/students/search` | Tìm kiếm và lọc sinh viên |
| 132 | POST | `/api/json/students/detail` | Hồ sơ học vụ tổng hợp. Kèm GPA, tín chỉ, điểm, combo và OJT; điểm và lịch sử đăng ký có phân trang. |
| 133 | PATCH | `/api/json/students` | Cập nhật hồ sơ học vụ |
| 134 | DELETE | `/api/json/students` | Xóa hồ sơ sinh viên. Xóa mềm hồ sơ và vô hiệu hóa tài khoản. |
| 135 | POST | `/api/json/students/course-results/search` | Điểm, lần học và trạng thái môn |
| 136 | POST | `/api/json/students/academic-progress/search` | GPA, tín chỉ và tiến độ học tập. GPA lấy lần học gần nhất. Tín chỉ không cộng trùng học lại, môn tương đương và môn được công nhận. |
| 137 | PATCH | `/api/json/course-results` | Sửa kết quả học tập và ghi lý do |
| 138 | POST | `/api/json/academic-imports/search` | Lịch sử nhập dữ liệu học vụ |
| 139 | POST | `/api/json/academic-imports/detail` | Chi tiết và lỗi nhập dữ liệu học vụ |
| 140 | POST | `/api/json/auth/users/password-reset` | Đặt lại mật khẩu. Gửi mật khẩu tạm qua email và thu hồi phiên cũ. |
| 141 | POST | `/api/json/admin/dashboard/search` | Thống kê mức sẵn sàng và rủi ro. Xem phân bố và xu hướng; dùng section để chọn nội dung. |
| 142 | POST | `/api/json/students/export` | Xuất danh sách sinh viên |
| 143 | DELETE | `/api/json/positions` | Xóa vị trí thực tập. Xóa mềm vị trí theo điều kiện dữ liệu liên quan. |
| 144 | POST | `/api/json/assessment-templates/search` | Danh sách và hồ sơ bộ tiêu chí đánh giá. Lọc templateId để lấy một bộ tiêu chí đầy đủ. |
| 145 | PATCH | `/api/json/assessment-templates` | Sửa bộ tiêu chí đánh giá. Chỉ sửa phiên bản còn nháp. |
| 146 | POST | `/api/json/assessment-templates/publish` | Ban hành bộ tiêu chí đánh giá. Phiên bản đã ban hành không được sửa. |
| 147 | POST | `/api/json/admin/prediction-jobs/detail` | Tiến độ dự đoán và lỗi theo sinh viên |
| 148 | POST | `/api/json/predictions/search` | Lịch sử dự đoán |
| 149 | POST | `/api/json/predictions/detail` | Chi tiết dự đoán. Kèm dữ liệu đầu vào và phiên bản mô hình đã sử dụng. |
| 150 | POST | `/api/json/admin/models/search` | Danh sách và hồ sơ phiên bản mô hình. Lọc modelId; kết quả kèm thông số và cấu trúc đầu vào. |
| 151 | POST | `/api/json/alerts/search` | Danh sách và hồ sơ cảnh báo rủi ro. Lọc alertId để lấy cảnh báo kèm hoạt động hỗ trợ phân trang. |
| 152 | PATCH | `/api/json/alerts/status` | Tiếp nhận hoặc đóng cảnh báo |
| 153 | POST | `/api/json/alerts/interventions` | Tạo hoạt động hỗ trợ sinh viên |
| 154 | POST | `/api/json/students/interventions/search` | Lịch sử hỗ trợ sinh viên |
| 155 | PATCH | `/api/json/interventions` | Cập nhật hoạt động hỗ trợ |
| 156 | POST | `/api/json/admin/reports/readiness/search` | Báo cáo mức sẵn sàng và rủi ro. Lấy dự đoán mới nhất của từng sinh viên trong mỗi kỳ. |
| 157 | POST | `/api/json/admin/reports/export` | Xuất báo cáo dự đoán. Tối đa 10.000 bản ghi dự đoán mới nhất. |
| 158 | POST | `/api/json/admin/audit-logs/search` | Nhật ký hoạt động hệ thống. Ẩn các trường dữ liệu nhạy cảm. |
| 159 | POST | `/api/json/recruitment/windows/search` | Danh sách đợt tuyển dụng theo học kỳ |
| 160 | PATCH | `/api/json/recruitment/windows` | Cập nhật đợt nhận nhu cầu tuyển dụng |
| 161 | POST | `/api/json/recruitment/windows/open` | Mở đợt nhận nhu cầu tuyển dụng |
| 162 | POST | `/api/json/recruitment/windows/close` | Đóng đợt nhận nhu cầu tuyển dụng |
| 163 | POST | `/api/json/recruitment/posts/search` | Danh sách tin tuyển dụng. Kèm vị trí và chỉ tiêu; doanh nghiệp chỉ xem tin của mình. |
| 164 | PATCH | `/api/json/recruitment/posts` | Sửa tin và vị trí tuyển dụng. Tin chuyển về chờ duyệt; vị trí có lịch sử chỉ được sửa sức chứa. |
| 165 | POST | `/api/json/recruitment/posts/review` | Duyệt hoặc từ chối tin tuyển dụng. Vị trí được mở sau khi tin được công bố. |
| 166 | POST | `/api/json/recruitment/posts/close` | Đóng tin tuyển dụng. Ngừng nhận ứng viên vào các vị trí liên quan. |

## Phòng đào tạo — 99 API

| # | Method | Đường dẫn | Chức năng |
|---:|---|---|---|
| 1 | POST | `/api/academic-years` | Tạo năm học |
| 2 | POST | `/api/academic-periods` | Tạo kỳ học và Block 3. Học kỳ thường tự liên kết OJT và trả ojtSemesterId; QHDN không tạo kỳ riêng. |
| 3 | POST | `/api/cohorts` | Tạo khóa và nhóm |
| 4 | POST | `/api/academic/alerts/notifications` | Gửi cảnh báo học vụ |
| 5 | GET | `/api/accounts/me/profile` | Xem hồ sơ cá nhân. Kèm studentId và enterpriseId để mở đúng hồ sơ chức năng. |
| 6 | PATCH | `/api/accounts/me/profile` | Cập nhật hồ sơ cá nhân |
| 7 | POST | `/api/combo-registration-windows` | Tạo đợt chọn hoặc xác nhận combo |
| 8 | POST | `/api/majors` | Tạo chuyên ngành |
| 9 | POST | `/api/courses` | Tạo môn học |
| 10 | POST | `/api/curricula` | Tạo phiên bản chương trình |
| 11 | POST | `/api/curriculum-imports/preview` | Kiểm tra dữ liệu nhập khung chương trình |
| 12 | POST | `/api/curriculum-imports/commit` | Nhập khung chương trình |
| 13 | POST | `/api/ojt-rule-sets` | Tạo bộ quy tắc OJT. Điều kiện: tối thiểu 70 tín chỉ và tối đa 2 môn còn nợ. |
| 14 | POST | `/api/eligibility-check-runs` | Kiểm tra điều kiện OJT hàng loạt |
| 15 | POST | `/api/imports/preview` | Kiểm tra dữ liệu nhập sinh viên hoặc doanh nghiệp |
| 16 | POST | `/api/imports/commit` | Nhập sinh viên hoặc doanh nghiệp |
| 17 | POST | `/api/ojt-registration-windows` | Tạo đợt đăng ký OJT. Mặc định dành cho kỳ chuyên ngành 5, tính theo lộ trình thực tế. |
| 18 | POST | `/api/ojt-registrations` | Nộp hồ sơ đăng ký OJT |
| 19 | POST | `/api/course-result-imports/preview` | Kiểm tra dữ liệu nhập kết quả học tập |
| 20 | POST | `/api/course-result-imports/commit` | Nhập kết quả học tập |
| 21 | POST | `/api/json/academic-years/search` | Danh sách năm học |
| 22 | PATCH | `/api/json/academic-years` | Cập nhật năm học |
| 23 | POST | `/api/json/academic-periods/search` | Danh sách kỳ học và Block 3. Lọc kind=SEMESTER để chọn học kỳ tuyển dụng; kết quả kèm thông tin OJT. |
| 24 | POST | `/api/json/academic-periods/detail` | Hồ sơ học kỳ và thông tin OJT |
| 25 | PATCH | `/api/json/academic-periods` | Cập nhật kỳ học và Block 3 |
| 26 | POST | `/api/json/cohorts/search` | Danh sách khóa và nhóm |
| 27 | PATCH | `/api/json/cohorts` | Cập nhật khóa và nhóm |
| 28 | PATCH | `/api/json/students/academic-placement` | Gán lộ trình học cho sinh viên. Lần đầu cần khóa, nhóm và kỳ hiện tại. Kỳ chuyên ngành tính từ kỳ vào thực tế; Block 3 không tăng số kỳ. |
| 29 | POST | `/api/json/academic-periods/combo-phase-schedules/search` | Xem mốc chọn và xác nhận combo |
| 30 | PUT | `/api/json/academic-periods/combo-phase-schedules` | Thiết lập mốc chọn và xác nhận combo. Chọn ban đầu trong kỳ học; xác nhận trong Block 3. Các mốc phải nằm trong kỳ tương ứng. |
| 31 | POST | `/api/json/ojt-semesters/assessment-window/search` | Xem đợt xét điều kiện chính thức |
| 32 | PUT | `/api/json/ojt-semesters/assessment-window` | Thiết lập đợt xét điều kiện chính thức. Thiết lập khi còn nháp. Thời điểm mở sau khi Block 3 kết thúc. |
| 33 | POST | `/api/json/ojt-semesters/assessment-window/open` | Mở xét điều kiện chính thức. Cần xác nhận đã cập nhật xong điểm. Kết quả kiểm tra trước mốc xác nhận phải được chạy lại. |
| 34 | POST | `/api/json/ojt-semesters/assessment-window/close` | Đóng xét điều kiện chính thức |
| 35 | POST | `/api/json/curricula/ojt-grade-mappings/detail` | Xem quy đổi điểm môn OJT |
| 36 | PUT | `/api/json/curricula/ojt-grade-mappings` | Thiết lập quy đổi điểm môn OJT. Chọn môn, kỳ ghi nhận và thang quy đổi. Cấu hình đã dùng để xác nhận kết quả không được sửa. |
| 37 | POST | `/api/json/ojt-registration-windows/semester-exceptions` | Thêm ngoại lệ kỳ đăng ký OJT. Chỉ áp dụng cho sinh viên, kỳ và thời hạn được chỉ định; cần lý do. |
| 38 | POST | `/api/json/ojt-registration-windows/semester-exceptions/revoke` | Thu hồi ngoại lệ kỳ đăng ký OJT |
| 39 | POST | `/api/json/combo-registration-windows/preview` | Xem ảnh hưởng của combo dự kiến. Tính tín chỉ, môn còn thiếu và điều kiện OJT; không lưu lựa chọn chính thức. |
| 40 | POST | `/api/json/academic/dashboard/search` | Tổng quan điều kiện OJT |
| 41 | POST | `/api/json/academic/eligibility-statistics/search` | Thống kê điều kiện theo khóa, nhóm, chuyên ngành và combo |
| 42 | POST | `/api/json/academic/alerts/search` | Danh sách cảnh báo thiếu điều kiện OJT |
| 43 | POST | `/api/json/academic/course-demand/search` | Thống kê nhu cầu học môn còn thiếu |
| 44 | POST | `/api/json/academic/course-demand/export` | Xuất nhu cầu học theo môn, kỳ và Block |
| 45 | POST | `/api/json/accounts/detail` | Chi tiết tài khoản |
| 46 | POST | `/api/json/combo-registration-windows/search` | Danh sách đợt chọn combo. Sinh viên chỉ thấy đợt của mình, kèm lựa chọn hợp lệ, hạn gia hạn và lý do chưa thể nộp. |
| 47 | PATCH | `/api/json/combo-registration-windows` | Cập nhật đợt chọn combo |
| 48 | POST | `/api/json/combo-registration-windows/open` | Mở đợt chọn combo |
| 49 | POST | `/api/json/combo-registration-windows/close` | Đóng đợt chọn combo |
| 50 | POST | `/api/json/combo-registration-windows/extensions` | Gia hạn chọn combo |
| 51 | POST | `/api/json/combo-registration-windows/selections/search` | Theo dõi lựa chọn combo |
| 52 | POST | `/api/json/combo-registration-windows/selections` | Gửi lựa chọn combo |
| 53 | POST | `/api/json/combo-registration-windows/reminders` | Gửi nhắc chọn combo |
| 54 | POST | `/api/json/students/combo-selections/search` | Lịch sử lựa chọn combo của sinh viên |
| 55 | POST | `/api/json/combo-registration-windows/finalize` | Chốt lựa chọn combo |
| 56 | POST | `/api/json/majors/search` | Danh sách chuyên ngành |
| 57 | POST | `/api/json/courses/search` | Danh sách môn học |
| 58 | POST | `/api/json/curricula/search` | Danh sách chương trình đào tạo |
| 59 | PATCH | `/api/json/courses` | Cập nhật môn học |
| 60 | POST | `/api/json/curricula/detail` | Chi tiết chương trình đào tạo |
| 61 | PATCH | `/api/json/curricula` | Cập nhật phiên bản chương trình |
| 62 | PUT | `/api/json/curricula/courses` | Thiết lập môn, tín chỉ và kỳ học |
| 63 | PUT | `/api/json/curricula/prerequisites` | Thiết lập môn tiên quyết |
| 64 | PUT | `/api/json/curricula/course-equivalences` | Thiết lập công nhận và tương đương môn |
| 65 | POST | `/api/json/curricula/combos` | Tạo combo |
| 66 | PUT | `/api/json/combos/courses` | Thiết lập môn thuộc combo |
| 67 | POST | `/api/json/curricula/publish` | Ban hành phiên bản chương trình |
| 68 | POST | `/api/json/ojt-rule-sets/search` | Danh sách bộ quy tắc OJT |
| 69 | PATCH | `/api/json/ojt-rule-sets` | Sửa bộ quy tắc chưa ban hành |
| 70 | POST | `/api/json/ojt-rule-sets/publish` | Ban hành bộ quy tắc OJT |
| 71 | POST | `/api/json/students/eligibility-checks/search` | Lịch sử kiểm tra điều kiện OJT |
| 72 | POST | `/api/json/students/eligibility-checks` | Kiểm tra điều kiện OJT của sinh viên |
| 73 | POST | `/api/json/students/eligibility/search` | Kết quả OJT và điều kiện còn thiếu |
| 74 | POST | `/api/json/eligibility-checks/confirm` | Xác nhận kết quả xét điều kiện OJT |
| 75 | POST | `/api/json/eligibility-check-runs/detail` | Tiến độ và kết quả kiểm tra hàng loạt |
| 76 | POST | `/api/json/ojt-registration-windows/search` | Danh sách đợt đăng ký OJT. Sinh viên chỉ thấy đợt phù hợp, kèm kỳ học, hồ sơ đã nộp và điều kiện đăng ký. |
| 77 | PATCH | `/api/json/ojt-registration-windows` | Cập nhật đợt đăng ký OJT |
| 78 | POST | `/api/json/ojt-registration-windows/open` | Mở đợt đăng ký OJT |
| 79 | POST | `/api/json/ojt-registration-windows/close` | Đóng đợt đăng ký OJT |
| 80 | POST | `/api/json/ojt-registrations/search` | Danh sách hồ sơ đăng ký OJT |
| 81 | POST | `/api/json/ojt-registrations/detail` | Chi tiết hồ sơ đăng ký OJT |
| 82 | POST | `/api/json/ojt-registrations/review` | Duyệt hoặc từ chối hồ sơ OJT |
| 83 | POST | `/api/json/ojt-semesters/eligible-student-handoffs/search` | Lịch sử bàn giao sinh viên cho QHDN |
| 84 | POST | `/api/json/ojt-semesters/eligible-student-handoffs` | Bàn giao sinh viên đủ điều kiện cho QHDN |
| 85 | POST | `/api/json/ojt-semesters/students/search` | Theo dõi trạng thái OJT theo kỳ |
| 86 | POST | `/api/json/ojt-results/search` | Danh sách kết quả OJT đã chuyển |
| 87 | POST | `/api/json/ojt-results/detail` | Chi tiết đánh giá và hồ sơ OJT |
| 88 | PATCH | `/api/json/ojt-results` | Cập nhật điểm và kết quả OJT chính thức |
| 89 | POST | `/api/json/ojt-results/revision-requests` | Yêu cầu bổ sung hồ sơ kết quả OJT |
| 90 | POST | `/api/json/ojt-results/confirm` | Xác nhận kết quả OJT. Ghi nhận kết quả môn học và trạng thái thực tập theo cấu hình quy đổi điểm. |
| 91 | POST | `/api/json/ojt-semesters/results/export` | Xuất báo cáo kết quả OJT theo kỳ |
| 92 | POST | `/api/json/students/search` | Tìm kiếm và lọc sinh viên |
| 93 | POST | `/api/json/students/detail` | Hồ sơ học vụ tổng hợp. Kèm GPA, tín chỉ, điểm, combo và OJT; điểm và lịch sử đăng ký có phân trang. |
| 94 | PATCH | `/api/json/students` | Cập nhật hồ sơ học vụ |
| 95 | POST | `/api/json/students/course-results/search` | Điểm, lần học và trạng thái môn |
| 96 | POST | `/api/json/students/academic-progress/search` | GPA, tín chỉ và tiến độ học tập. GPA lấy lần học gần nhất. Tín chỉ không cộng trùng học lại, môn tương đương và môn được công nhận. |
| 97 | PATCH | `/api/json/course-results` | Sửa kết quả học tập và ghi lý do |
| 98 | POST | `/api/json/academic-imports/search` | Lịch sử nhập dữ liệu học vụ |
| 99 | POST | `/api/json/academic-imports/detail` | Chi tiết và lỗi nhập dữ liệu học vụ |

## Phòng QHDN — 47 API

| # | Method | Đường dẫn | Chức năng |
|---:|---|---|---|
| 1 | GET | `/api/accounts/me/profile` | Xem hồ sơ cá nhân. Kèm studentId và enterpriseId để mở đúng hồ sơ chức năng. |
| 2 | PATCH | `/api/accounts/me/profile` | Cập nhật hồ sơ cá nhân |
| 3 | POST | `/api/imports/preview` | Kiểm tra dữ liệu nhập sinh viên hoặc doanh nghiệp |
| 4 | POST | `/api/imports/commit` | Nhập sinh viên hoặc doanh nghiệp |
| 5 | POST | `/api/imports/archive` | Lưu trữ tuyển dụng sau hai học kỳ |
| 6 | POST | `/api/ojt-results` | Chuyển đánh giá và hồ sơ OJT cho phòng đào tạo |
| 7 | POST | `/api/companies` | Tạo doanh nghiệp. Admin và Phòng QHDN dùng chung URL; chọn mẫu dữ liệu theo vai trò trong anyOf. |
| 8 | POST | `/api/ojt-coordinations` | Giới thiệu sinh viên cho doanh nghiệp. Áp dụng cho hồ sơ đã bàn giao; cần lý do và lưu nhật ký. |
| 9 | POST | `/api/assignments` | Phân công sinh viên thực tập. Admin và Phòng QHDN dùng chung URL; chọn mẫu dữ liệu theo vai trò trong anyOf. |
| 10 | POST | `/api/recruitment/windows` | Tạo đợt nhận nhu cầu tuyển dụng. Chọn học kỳ có sẵn và thời hạn nhận đơn; không tạo kỳ OJT riêng. |
| 11 | POST | `/api/json/academic-periods/search` | Danh sách kỳ học và Block 3. Lọc kind=SEMESTER để chọn học kỳ tuyển dụng; kết quả kèm thông tin OJT. |
| 12 | POST | `/api/json/academic-periods/detail` | Hồ sơ học kỳ và thông tin OJT |
| 13 | POST | `/api/json/accounts/detail` | Chi tiết tài khoản |
| 14 | POST | `/api/json/ojt-registrations/search` | Danh sách hồ sơ đăng ký OJT |
| 15 | POST | `/api/json/ojt-registrations/detail` | Chi tiết hồ sơ đăng ký OJT |
| 16 | POST | `/api/json/ojt-semesters/eligible-student-handoffs/search` | Lịch sử bàn giao sinh viên cho QHDN |
| 17 | POST | `/api/json/ojt-semesters/students/search` | Theo dõi trạng thái OJT theo kỳ |
| 18 | POST | `/api/json/ojt-results/search` | Danh sách kết quả OJT đã chuyển |
| 19 | POST | `/api/json/ojt-results/detail` | Chi tiết đánh giá và hồ sơ OJT |
| 20 | POST | `/api/json/ojt-results/transfer` | Gửi lại hồ sơ OJT đã bổ sung |
| 21 | POST | `/api/json/ojt-semesters/results/export` | Xuất báo cáo kết quả OJT theo kỳ |
| 22 | POST | `/api/json/companies/search` | Danh sách và hồ sơ doanh nghiệp. Lọc companyId để lấy một hồ sơ kèm lịch sử phân trang. |
| 23 | PATCH | `/api/json/companies` | Cập nhật doanh nghiệp. Admin và Phòng QHDN dùng chung URL; chọn mẫu dữ liệu theo vai trò trong anyOf. |
| 24 | POST | `/api/json/positions/search` | Danh sách và hồ sơ vị trí thực tập. Lọc positionId để lấy một vị trí kèm lịch sử; có mã, địa điểm và hình thức làm việc. |
| 25 | POST | `/api/json/ojt-coordinations/search` | Danh sách điều phối sinh viên |
| 26 | POST | `/api/json/ojt-coordinations/detail` | Chi tiết và lịch sử điều phối |
| 27 | POST | `/api/json/assignments/search` | Danh sách và hồ sơ phân công thực tập. Kèm sinh viên, doanh nghiệp, vị trí, đánh giá và kết quả OJT; lọc assignmentId để xem lịch sử. |
| 28 | PATCH | `/api/json/assignments` | Cập nhật phân công thực tập. Admin và Phòng QHDN dùng chung URL; chọn mẫu dữ liệu theo vai trò trong anyOf. |
| 29 | POST | `/api/json/internship-evaluations/search` | Danh sách đánh giá thực tập. Có bộ tiêu chí và điểm chi tiết; hỗ trợ lọc theo templateId. |
| 30 | POST | `/api/json/internship-evaluations/detail` | Chi tiết và lịch sử đánh giá thực tập |
| 31 | POST | `/api/json/ojt-coordinations/decision` | Ghi nhận quyết định tiếp nhận sinh viên. Admin hoặc Phòng QHDN ghi nhận thay doanh nghiệp; cần lý do. |
| 32 | POST | `/api/json/ojt-coordinations/reassign` | Điều phối lại sinh viên. Chuyển hồ sơ bị từ chối sang vị trí khác; cần lý do. |
| 33 | PATCH | `/api/json/assignments/status` | Cập nhật trạng thái thực tập. Admin và Phòng QHDN dùng chung URL; chọn mẫu dữ liệu theo vai trò trong anyOf. |
| 34 | PUT | `/api/json/assignments/internship-evaluation` | Ghi nhận đánh giá thực tập. Admin hoặc Phòng QHDN nhập thay doanh nghiệp; cần lý do. |
| 35 | POST | `/api/json/qhdn/dashboard/search` | Tổng quan QHDN. Tổng hợp bàn giao, tiếp nhận và sức chứa; dùng lần điều phối mới nhất. |
| 36 | POST | `/api/json/qhdn/reports/acceptance/search` | Thống kê tiếp nhận và từ chối. Theo học kỳ và doanh nghiệp. Tỷ lệ tiếp nhận tính trên các hồ sơ đã có quyết định. |
| 37 | POST | `/api/json/qhdn/reports/internships/search` | Thống kê thực tập và kết quả. Theo học kỳ và doanh nghiệp; điểm và kết quả chỉ lấy hồ sơ đã xác nhận. |
| 38 | POST | `/api/json/qhdn/reports/enterprise-feedback/search` | Tổng hợp đánh giá từ doanh nghiệp. Gồm mức độ hoàn tất đánh giá và điểm trung bình; không phải khảo sát hài lòng. |
| 39 | POST | `/api/json/qhdn/reports/export` | Xuất báo cáo QHDN. Định dạng CSV hoặc JSON; tối đa 10.000 dòng, không phân trang. |
| 40 | POST | `/api/json/recruitment/windows/search` | Danh sách đợt tuyển dụng theo học kỳ |
| 41 | PATCH | `/api/json/recruitment/windows` | Cập nhật đợt nhận nhu cầu tuyển dụng |
| 42 | POST | `/api/json/recruitment/windows/open` | Mở đợt nhận nhu cầu tuyển dụng |
| 43 | POST | `/api/json/recruitment/windows/close` | Đóng đợt nhận nhu cầu tuyển dụng |
| 44 | POST | `/api/json/recruitment/posts/search` | Danh sách tin tuyển dụng. Kèm vị trí và chỉ tiêu; doanh nghiệp chỉ xem tin của mình. |
| 45 | PATCH | `/api/json/recruitment/posts` | Sửa tin và vị trí tuyển dụng. Tin chuyển về chờ duyệt; vị trí có lịch sử chỉ được sửa sức chứa. |
| 46 | POST | `/api/json/recruitment/posts/review` | Duyệt hoặc từ chối tin tuyển dụng. Vị trí được mở sau khi tin được công bố. |
| 47 | POST | `/api/json/recruitment/posts/close` | Đóng tin tuyển dụng. Ngừng nhận ứng viên vào các vị trí liên quan. |

## Doanh nghiệp — 12 API

| # | Method | Đường dẫn | Chức năng |
|---:|---|---|---|
| 1 | GET | `/api/accounts/me/profile` | Xem hồ sơ cá nhân. Kèm studentId và enterpriseId để mở đúng hồ sơ chức năng. |
| 2 | PATCH | `/api/accounts/me/profile` | Cập nhật hồ sơ cá nhân |
| 3 | GET | `/api/enterprise/profile` | Hồ sơ doanh nghiệp. Chỉ xem dữ liệu của doanh nghiệp đang đăng nhập. Kèm số liệu tuyển dụng và thực tập. |
| 4 | POST | `/api/recruitment/posts` | Gửi nhu cầu tuyển dụng. Gửi vị trí, yêu cầu và số lượng trong đợt đang mở. |
| 5 | POST | `/api/json/enterprise/candidates/search` | Danh sách ứng viên. Kèm liên hệ, CV, vị trí và quyết định tiếp nhận của doanh nghiệp đang đăng nhập. |
| 6 | POST | `/api/json/enterprise/candidates/detail` | Hồ sơ ứng viên. Kèm CV và vị trí; candidateId là ID điều phối. |
| 7 | PATCH | `/api/json/enterprise/candidates/decision` | Tiếp nhận hoặc từ chối ứng viên. Chỉ xử lý ứng viên được giới thiệu cho doanh nghiệp đang đăng nhập. |
| 8 | POST | `/api/json/enterprise/internships/search` | Danh sách sinh viên thực tập. Kèm người hướng dẫn, vị trí, đánh giá và kết quả; điểm chính thức chỉ hiển thị sau xác nhận. |
| 9 | PUT | `/api/json/enterprise/internships/evaluation` | Gửi hoặc cập nhật đánh giá thực tập. Chỉ đánh giá sinh viên của doanh nghiệp; internshipId là ID phân công. |
| 10 | POST | `/api/json/recruitment/windows/search` | Danh sách đợt tuyển dụng theo học kỳ |
| 11 | POST | `/api/json/recruitment/posts/search` | Danh sách tin tuyển dụng. Kèm vị trí và chỉ tiêu; doanh nghiệp chỉ xem tin của mình. |
| 12 | PATCH | `/api/json/recruitment/posts` | Sửa tin và vị trí tuyển dụng. Tin chuyển về chờ duyệt; vị trí có lịch sử chỉ được sửa sức chứa. |

## Sinh viên — 17 API

| # | Method | Đường dẫn | Chức năng |
|---:|---|---|---|
| 1 | GET | `/api/accounts/me/profile` | Xem hồ sơ cá nhân. Kèm studentId và enterpriseId để mở đúng hồ sơ chức năng. |
| 2 | PATCH | `/api/accounts/me/profile` | Cập nhật hồ sơ cá nhân |
| 3 | POST | `/api/ojt-registrations` | Nộp hồ sơ đăng ký OJT |
| 4 | POST | `/api/json/combo-registration-windows/preview` | Xem ảnh hưởng của combo dự kiến. Tính tín chỉ, môn còn thiếu và điều kiện OJT; không lưu lựa chọn chính thức. |
| 5 | POST | `/api/json/accounts/detail` | Chi tiết tài khoản |
| 6 | POST | `/api/json/combo-registration-windows/search` | Danh sách đợt chọn combo. Sinh viên chỉ thấy đợt của mình, kèm lựa chọn hợp lệ, hạn gia hạn và lý do chưa thể nộp. |
| 7 | POST | `/api/json/combo-registration-windows/selections` | Gửi lựa chọn combo |
| 8 | POST | `/api/json/students/combo-selections/search` | Lịch sử lựa chọn combo của sinh viên |
| 9 | POST | `/api/json/students/eligibility-checks/search` | Lịch sử kiểm tra điều kiện OJT |
| 10 | POST | `/api/json/students/eligibility/search` | Kết quả OJT và điều kiện còn thiếu |
| 11 | POST | `/api/json/ojt-registration-windows/search` | Danh sách đợt đăng ký OJT. Sinh viên chỉ thấy đợt phù hợp, kèm kỳ học, hồ sơ đã nộp và điều kiện đăng ký. |
| 12 | POST | `/api/json/ojt-registrations/search` | Danh sách hồ sơ đăng ký OJT |
| 13 | POST | `/api/json/ojt-registrations/detail` | Chi tiết hồ sơ đăng ký OJT |
| 14 | POST | `/api/json/ojt-semesters/students/search` | Theo dõi trạng thái OJT theo kỳ |
| 15 | POST | `/api/json/students/detail` | Hồ sơ học vụ tổng hợp. Kèm GPA, tín chỉ, điểm, combo và OJT; điểm và lịch sử đăng ký có phân trang. |
| 16 | POST | `/api/json/students/course-results/search` | Điểm, lần học và trạng thái môn |
| 17 | POST | `/api/json/students/academic-progress/search` | GPA, tín chỉ và tiến độ học tập. GPA lấy lần học gần nhất. Tín chỉ không cộng trùng học lại, môn tương đương và môn được công nhận. |

## Auth — 3 API

| # | Method | Đường dẫn | Chức năng |
|---:|---|---|---|
| 1 | POST | `/api/auth/login` | Đăng nhập bằng email và mật khẩu |
| 2 | GET | `/api/auth/me` | Xem tài khoản đang đăng nhập. Kèm ID hồ sơ sinh viên hoặc doanh nghiệp liên kết. |
| 3 | POST | `/api/auth/change-password` | Đổi mật khẩu. Token cũ bị thu hồi; cần đăng nhập lại. |
