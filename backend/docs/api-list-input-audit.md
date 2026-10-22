# Đầu vào API GET danh sách

GET dùng path/query parameters, không gửi request body. ID trong ví dụ phải thay bằng dữ liệu thật. JWT và quyền sở hữu vẫn được kiểm tra. Các route /api/json/ đã bị xóa.

Tổng 52 API danh sách.

| API | Vị trí | Trường | Bắt buộc | Ý nghĩa |
|---|---|---|---|---|
| GET /api/academic-years | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/academic-years | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/academic-years | query | search | Không |  |
| GET /api/academic-years | query | status | Không |  |
| GET /api/academic-periods | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/academic-periods | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/academic-periods | query | search | Không |  |
| GET /api/academic-periods | query | status | Không |  |
| GET /api/academic-periods | query | academicYearId | Không | ID năm học. |
| GET /api/academic-periods | query | kind | Không |  |
| GET /api/academic-periods | query | academicPeriodId | Không | ID kỳ học hoặc Block 3. |
| GET /api/cohorts | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/cohorts | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/cohorts | query | search | Không |  |
| GET /api/cohorts | query | status | Không |  |
| GET /api/academic-periods/{id}/combo-phase-schedules | path | id | Có | ID: AcademicPeriodID. |
| GET /api/academic/alerts | query | ojtSemesterId | Có | ID kỳ OJT. |
| GET /api/academic/alerts | query | programId | Không | ID phiên bản chương trình đào tạo. |
| GET /api/academic/alerts | query | cohortId | Không | ID khóa. |
| GET /api/academic/alerts | query | majorId | Không | ID chuyên ngành (SpecializationID). |
| GET /api/academic/alerts | query | comboId | Không | ID combo (ProgramComboID). |
| GET /api/academic/alerts | query | groupCode | Không |  |
| GET /api/academic/alerts | query | academicPeriodId | Có | ID kỳ học hoặc Block 3. |
| GET /api/academic/alerts | query | assessmentDeadline | Có | Hạn xét điều kiện, gồm múi giờ. |
| GET /api/academic/alerts | query | type | Không |  |
| GET /api/academic/alerts | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/academic/alerts | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/academic/course-demand | query | ojtSemesterId | Có | ID kỳ OJT. |
| GET /api/academic/course-demand | query | programId | Không | ID phiên bản chương trình đào tạo. |
| GET /api/academic/course-demand | query | cohortId | Không | ID khóa. |
| GET /api/academic/course-demand | query | majorId | Không | ID chuyên ngành (SpecializationID). |
| GET /api/academic/course-demand | query | comboId | Không | ID combo (ProgramComboID). |
| GET /api/academic/course-demand | query | groupCode | Không |  |
| GET /api/academic/course-demand | query | academicPeriodId | Có | ID kỳ học hoặc Block 3. |
| GET /api/academic/course-demand | query | assessmentDeadline | Không | Hạn xét điều kiện, gồm múi giờ. |
| GET /api/academic/course-demand | query | courseId | Không | ID môn học (CourseID). |
| GET /api/academic/course-demand | query | includeInProgress | Không |  |
| GET /api/academic/course-demand | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/academic/course-demand | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/accounts | query | userId | Không | ID tài khoản. |
| GET /api/accounts | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/accounts | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/accounts | query | search | Không |  |
| GET /api/accounts | query | roleCode | Không |  |
| GET /api/accounts | query | status | Không |  |
| GET /api/combo-registration-windows | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/combo-registration-windows | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/combo-registration-windows | query | phase | Không |  |
| GET /api/combo-registration-windows | query | status | Không |  |
| GET /api/combo-registration-windows | query | academicPeriodId | Không | ID kỳ học hoặc Block 3. |
| GET /api/combo-registration-windows/{id}/selections | path | id | Có | ID: WindowID trong ComboRegistrationWindows. |
| GET /api/combo-registration-windows/{id}/selections | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/combo-registration-windows/{id}/selections | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/combo-registration-windows/{id}/selections | query | status | Không |  |
| GET /api/students/{id}/combo-selections | path | id | Có | ID: StudentID. |
| GET /api/students/{id}/combo-selections | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/students/{id}/combo-selections | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/majors | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/majors | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/majors | query | search | Không |  |
| GET /api/majors | query | parentMajorId | Không | ID ngành cha (MajorID). |
| GET /api/courses | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/courses | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/courses | query | search | Không |  |
| GET /api/curricula | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/curricula | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/curricula | query | search | Không |  |
| GET /api/curricula | query | majorId | Không | ID chuyên ngành (SpecializationID). |
| GET /api/curricula | query | status | Không |  |
| GET /api/curricula | query | version | Không |  |
| GET /api/ojt-rule-sets | query | programId | Không | ID phiên bản chương trình đào tạo. |
| GET /api/ojt-rule-sets | query | ojtSemesterId | Không | ID kỳ OJT. |
| GET /api/ojt-rule-sets | query | status | Không |  |
| GET /api/ojt-rule-sets | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/ojt-rule-sets | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/students/{id}/eligibility-checks | path | id | Có | ID: StudentID. |
| GET /api/students/{id}/eligibility-checks | query | ojtSemesterId | Không | ID kỳ OJT. |
| GET /api/students/{id}/eligibility-checks | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/students/{id}/eligibility-checks | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/eligibility-check-runs/{id} | path | id | Có | ID: RunID. |
| GET /api/eligibility-check-runs/{id} | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/eligibility-check-runs/{id} | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/ojt-registration-windows | query | ojtSemesterId | Không | ID kỳ OJT. |
| GET /api/ojt-registration-windows | query | status | Không | Lọc theo trạng thái; bỏ trường này để xem tất cả. |
| GET /api/ojt-registration-windows | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/ojt-registration-windows | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/ojt-registrations | query | ojtSemesterId | Không | ID kỳ OJT. |
| GET /api/ojt-registrations | query | windowId | Không | ID đợt đăng ký. |
| GET /api/ojt-registrations | query | studentId | Không | ID hồ sơ sinh viên, khác ID tài khoản. |
| GET /api/ojt-registrations | query | programId | Không | ID phiên bản chương trình đào tạo. |
| GET /api/ojt-registrations | query | cohortId | Không | ID khóa. |
| GET /api/ojt-registrations | query | groupCode | Không |  |
| GET /api/ojt-registrations | query | status | Không | Lọc theo trạng thái; bỏ trường này để xem tất cả. |
| GET /api/ojt-registrations | query | search | Không |  |
| GET /api/ojt-registrations | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/ojt-registrations | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/ojt-registrations | query | registrationId | Không | Chọn một hồ sơ để trả thêm phần chi tiết. |
| GET /api/ojt-registrations | query | historyPage | Không | Phân trang history; chỉ dùng cùng registrationId. |
| GET /api/ojt-registrations | query | historyLimit | Không | Phân trang history; chỉ dùng cùng registrationId. |
| GET /api/ojt-registrations | query | coordinationPage | Không | Phân trang coordination; chỉ dùng cùng registrationId. |
| GET /api/ojt-registrations | query | coordinationLimit | Không | Phân trang coordination; chỉ dùng cùng registrationId. |
| GET /api/ojt-registrations | query | assignmentPage | Không | Phân trang assignment; chỉ dùng cùng registrationId. |
| GET /api/ojt-registrations | query | assignmentLimit | Không | Phân trang assignment; chỉ dùng cùng registrationId. |
| GET /api/ojt-semesters/{id}/eligible-student-handoffs | path | id | Có | ID: OJTSemesterID. |
| GET /api/ojt-semesters/{id}/eligible-student-handoffs | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/ojt-semesters/{id}/eligible-student-handoffs | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/ojt-semesters/{id}/students | path | id | Có | ID: OJTSemesterID. |
| GET /api/ojt-semesters/{id}/students | query | programId | Không | ID phiên bản chương trình đào tạo. |
| GET /api/ojt-semesters/{id}/students | query | cohortId | Không | ID khóa. |
| GET /api/ojt-semesters/{id}/students | query | groupCode | Không |  |
| GET /api/ojt-semesters/{id}/students | query | registrationStatus | Không |  |
| GET /api/ojt-semesters/{id}/students | query | search | Không |  |
| GET /api/ojt-semesters/{id}/students | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/ojt-semesters/{id}/students | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/ojt-semesters/{id}/students | query | enterpriseId | Không | Filters the latest coordination and its assignment; QHDN remains restricted to handed-off students. |
| GET /api/ojt-semesters/{id}/students | query | coordinationStatus | Không | Filters the latest coordination and its assignment; QHDN remains restricted to handed-off students. |
| GET /api/ojt-semesters/{id}/students | query | assignmentStatus | Không | Filters the latest coordination and its assignment; QHDN remains restricted to handed-off students. |
| GET /api/companies | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/companies | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/companies | query | search | Không |  |
| GET /api/companies | query | status | Không |  |
| GET /api/companies | query | companyId | Không | ID doanh nghiệp. |
| GET /api/companies | query | historyPage | Không | Trang lịch sử khi lọc theo ID. |
| GET /api/companies | query | historyLimit | Không | Số sự kiện lịch sử mỗi trang, tối đa 100. |
| GET /api/positions | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/positions | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/positions | query | search | Không |  |
| GET /api/positions | query | status | Không |  |
| GET /api/positions | query | companyId | Không | ID doanh nghiệp. |
| GET /api/positions | query | ojtSemesterId | Không | ID kỳ OJT. |
| GET /api/positions | query | positionId | Không | ID vị trí thực tập. |
| GET /api/positions | query | historyPage | Không | Trang lịch sử khi lọc theo ID. |
| GET /api/positions | query | historyLimit | Không | Số sự kiện lịch sử mỗi trang, tối đa 100. |
| GET /api/ojt-coordinations | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/ojt-coordinations | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/ojt-coordinations | query | search | Không |  |
| GET /api/ojt-coordinations | query | status | Không |  |
| GET /api/ojt-coordinations | query | companyId | Không | ID doanh nghiệp. |
| GET /api/ojt-coordinations | query | ojtSemesterId | Không | ID kỳ OJT. |
| GET /api/ojt-coordinations | query | studentId | Không | ID hồ sơ sinh viên, khác ID tài khoản. |
| GET /api/ojt-coordinations | query | positionId | Không | ID vị trí thực tập. |
| GET /api/ojt-coordinations | query | registrationId | Không |  |
| GET /api/ojt-coordinations | query | decision | Không |  |
| GET /api/ojt-coordinations | query | coordinationId | Không |  |
| GET /api/ojt-coordinations | query | historyPage | Không | Trang lịch sử khi lọc theo ID. |
| GET /api/ojt-coordinations | query | historyLimit | Không | Số sự kiện lịch sử mỗi trang, tối đa 100. |
| GET /api/ojt-coordinations | query | coordinationPage | Không |  |
| GET /api/ojt-coordinations | query | coordinationLimit | Không |  |
| GET /api/ojt-coordinations | query | applicationId | Không |  |
| GET /api/assignments | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/assignments | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/assignments | query | search | Không |  |
| GET /api/assignments | query | status | Không |  |
| GET /api/assignments | query | companyId | Không | ID doanh nghiệp. |
| GET /api/assignments | query | ojtSemesterId | Không | ID kỳ OJT. |
| GET /api/assignments | query | studentId | Không | ID hồ sơ sinh viên, khác ID tài khoản. |
| GET /api/assignments | query | positionId | Không | ID vị trí thực tập. |
| GET /api/assignments | query | assignmentId | Không | ID phân công thực tập. |
| GET /api/assignments | query | historyPage | Không | Trang lịch sử khi lọc theo ID. |
| GET /api/assignments | query | historyLimit | Không | Số sự kiện lịch sử mỗi trang, tối đa 100. |
| GET /api/internship-evaluations | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/internship-evaluations | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/internship-evaluations | query | search | Không |  |
| GET /api/internship-evaluations | query | status | Không |  |
| GET /api/internship-evaluations | query | companyId | Không | ID doanh nghiệp. |
| GET /api/internship-evaluations | query | ojtSemesterId | Không | ID kỳ OJT. |
| GET /api/internship-evaluations | query | studentId | Không | ID hồ sơ sinh viên, khác ID tài khoản. |
| GET /api/internship-evaluations | query | positionId | Không | ID vị trí thực tập. |
| GET /api/internship-evaluations | query | assignmentId | Không | ID phân công thực tập. |
| GET /api/internship-evaluations | query | templateId | Không | ID bộ tiêu chí đánh giá. |
| GET /api/internship-evaluations | query | evaluationId | Không |  |
| GET /api/internship-evaluations | query | historyPage | Không | Trang lịch sử khi lọc theo ID. |
| GET /api/internship-evaluations | query | historyLimit | Không | Số sự kiện lịch sử mỗi trang, tối đa 100. |
| GET /api/qhdn/registered-students | query | registrationId | Không |  |
| GET /api/qhdn/registered-students | query | studentId | Không | ID hồ sơ sinh viên, khác ID tài khoản. |
| GET /api/qhdn/registered-students | query | ojtSemesterId | Không | ID kỳ OJT. |
| GET /api/qhdn/registered-students | query | academicPeriodId | Không | ID kỳ học hoặc Block 3. |
| GET /api/qhdn/registered-students | query | windowId | Không | ID đợt đăng ký. |
| GET /api/qhdn/registered-students | query | status | Không |  |
| GET /api/qhdn/registered-students | query | programId | Không | ID phiên bản chương trình đào tạo. |
| GET /api/qhdn/registered-students | query | cohortId | Không | ID khóa. |
| GET /api/qhdn/registered-students | query | groupCode | Không |  |
| GET /api/qhdn/registered-students | query | search | Không |  |
| GET /api/qhdn/registered-students | query | handoffStatus | Không | Lọc hồ sơ chưa bàn giao hoặc đã bàn giao. |
| GET /api/qhdn/registered-students | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/qhdn/registered-students | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/qhdn/reports | query | ojtSemesterId | Không | ID kỳ OJT. |
| GET /api/qhdn/reports | query | companyId | Không | ID doanh nghiệp. |
| GET /api/qhdn/reports | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/qhdn/reports | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/qhdn/reports | query | type | Có |  |
| GET /api/students | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/students | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/students | query | search | Không |  |
| GET /api/students | query | status | Không |  |
| GET /api/students | query | programId | Không | ID phiên bản chương trình đào tạo. |
| GET /api/students | query | cohortId | Không | ID khóa. |
| GET /api/students | query | groupCode | Không |  |
| GET /api/students | query | enrollmentYear | Không |  |
| GET /api/students | query | currentSemester | Không | Kỳ chuyên ngành hiện tại, tính từ lộ trình thực tế. |
| GET /api/students/{id}/course-results | path | id | Có | ID: StudentID. |
| GET /api/students/{id}/course-results | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/students/{id}/course-results | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/students/{id}/course-results | query | courseId | Không | ID môn học (CourseID). |
| GET /api/students/{id}/course-results | query | academicPeriodId | Không | ID kỳ học hoặc Block 3. |
| GET /api/students/{id}/course-results | query | status | Không |  |
| GET /api/academic-imports | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/academic-imports | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/academic-imports | query | kind | Không |  |
| GET /api/academic-imports | query | status | Không |  |
| GET /api/academic-imports | query | importId | Không | Chọn một hồ sơ để trả thêm phần chi tiết. |
| GET /api/academic-imports | query | rowsPage | Không | Phân trang rows; chỉ dùng cùng importId. |
| GET /api/academic-imports | query | rowsLimit | Không | Phân trang rows; chỉ dùng cùng importId. |
| GET /api/assessment-templates | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/assessment-templates | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/assessment-templates | query | templateId | Không | ID bộ tiêu chí đánh giá. |
| GET /api/assessment-templates | query | search | Không |  |
| GET /api/assessment-templates | query | status | Không |  |
| GET /api/admin/prediction-jobs/{id} | path | id | Có | ID: bản ghi. |
| GET /api/admin/prediction-jobs/{id} | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/admin/prediction-jobs/{id} | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/predictions | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/predictions | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/predictions | query | ojtSemesterId | Không | ID kỳ OJT. |
| GET /api/predictions | query | studentId | Không | ID hồ sơ sinh viên, khác ID tài khoản. |
| GET /api/predictions | query | modelId | Không | ID phiên bản mô hình. |
| GET /api/predictions | query | riskLevel | Không |  |
| GET /api/predictions | query | readinessLevel | Không |  |
| GET /api/predictions | query | from | Không |  |
| GET /api/predictions | query | to | Không |  |
| GET /api/predictions | query | predictionId | Không | Chọn một hồ sơ để trả thêm phần chi tiết. |
| GET /api/admin/models | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/admin/models | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/admin/models | query | modelId | Không | ID phiên bản mô hình. |
| GET /api/admin/models | query | search | Không |  |
| GET /api/admin/models | query | status | Không |  |
| GET /api/alerts | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/alerts | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/alerts | query | alertId | Không | ID cảnh báo rủi ro. |
| GET /api/alerts | query | studentId | Không | ID hồ sơ sinh viên, khác ID tài khoản. |
| GET /api/alerts | query | ojtSemesterId | Không | ID kỳ OJT. |
| GET /api/alerts | query | status | Không |  |
| GET /api/alerts | query | interventionPage | Không | Trang hoạt động hỗ trợ khi lọc alertId. |
| GET /api/alerts | query | interventionLimit | Không | Số hoạt động hỗ trợ mỗi trang, tối đa 100. |
| GET /api/students/{id}/interventions | path | id | Có | ID: StudentID. |
| GET /api/students/{id}/interventions | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/students/{id}/interventions | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/students/{id}/interventions | query | status | Không |  |
| GET /api/admin/reports/readiness | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/admin/reports/readiness | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/admin/reports/readiness | query | ojtSemesterId | Không | ID kỳ OJT. |
| GET /api/admin/reports/readiness | query | studentId | Không | ID hồ sơ sinh viên, khác ID tài khoản. |
| GET /api/admin/reports/readiness | query | modelId | Không | ID phiên bản mô hình. |
| GET /api/admin/reports/readiness | query | riskLevel | Không |  |
| GET /api/admin/reports/readiness | query | readinessLevel | Không |  |
| GET /api/admin/reports/readiness | query | from | Không |  |
| GET /api/admin/reports/readiness | query | to | Không |  |
| GET /api/admin/audit-logs | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/admin/audit-logs | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/admin/audit-logs | query | userId | Không | ID tài khoản. |
| GET /api/admin/audit-logs | query | entityType | Không |  |
| GET /api/admin/audit-logs | query | entityId | Không |  |
| GET /api/admin/audit-logs | query | action | Không |  |
| GET /api/enterprise/candidates | query | companyId | Có | ID doanh nghiệp. |
| GET /api/enterprise/candidates | query | studentId | Không | ID hồ sơ sinh viên, khác ID tài khoản. |
| GET /api/enterprise/candidates | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/enterprise/candidates | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/enterprise/candidates | query | ojtSemesterId | Không | ID kỳ OJT. |
| GET /api/enterprise/candidates | query | positionId | Không | ID vị trí thực tập. |
| GET /api/enterprise/candidates | query | search | Không |  |
| GET /api/enterprise/candidates | query | candidateId | Không |  |
| GET /api/enterprise/candidates | query | decision | Không |  |
| GET /api/enterprise/internships | query | companyId | Có | ID doanh nghiệp. |
| GET /api/enterprise/internships | query | studentId | Không | ID hồ sơ sinh viên, khác ID tài khoản. |
| GET /api/enterprise/internships | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/enterprise/internships | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/enterprise/internships | query | ojtSemesterId | Không | ID kỳ OJT. |
| GET /api/enterprise/internships | query | positionId | Không | ID vị trí thực tập. |
| GET /api/enterprise/internships | query | search | Không |  |
| GET /api/enterprise/internships | query | internshipId | Không |  |
| GET /api/enterprise/internships | query | status | Không |  |
| GET /api/recruitment/posts | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/recruitment/posts | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/recruitment/posts | query | companyId | Có | ID doanh nghiệp. |
| GET /api/recruitment/posts | query | postId | Không |  |
| GET /api/recruitment/posts | query | windowId | Không | ID đợt đăng ký. |
| GET /api/recruitment/posts | query | academicPeriodId | Không | ID kỳ học hoặc Block 3. |
| GET /api/recruitment/posts | query | status | Không |  |
| GET /api/ojt-results | query | resultId | Không |  |
| GET /api/ojt-results | query | studentId | Không |  |
| GET /api/ojt-results | query | ojtSemesterId | Không |  |
| GET /api/ojt-results | query | page | Không |  |
| GET /api/ojt-results | query | limit | Không |  |
| GET /api/ojt-results | query | status | Không |  |
| GET /api/ojt-results | query | search | Không |  |
| GET /api/ojt-semesters/{id}/results/export | path | id | Có |  |
| GET /api/ojt-semesters/{id}/results/export | query | resultId | Không |  |
| GET /api/ojt-semesters/{id}/results/export | query | studentId | Không |  |
| GET /api/ojt-semesters/{id}/results/export | query | ojtSemesterId | Không |  |
| GET /api/ojt-semesters/{id}/results/export | query | status | Không |  |
| GET /api/ojt-semesters/{id}/results/export | query | search | Không |  |
| GET /api/ojt-semesters/{id}/results/export | query | format | Không |  |
| GET /api/academic/advisory-runs | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/academic/advisory-runs | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/academic/advisory-runs/{id} | path | id | Có | ID: bản ghi. |
| GET /api/academic/advisory-runs/{id} | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/academic/advisory-runs/{id} | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/student/ojt-registration-windows | query | ojtSemesterId | Không | ID kỳ OJT. |
| GET /api/student/ojt-registration-windows | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/student/ojt-registration-windows | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/student/notifications | query | unread | Không |  |
| GET /api/student/notifications | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/student/notifications | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/student/combo-registration-windows | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/student/combo-registration-windows | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/student/ojt-results | query | ojtSemesterId | Không | ID kỳ OJT. |
| GET /api/student/ojt-results | query | page | Không | Trang, bắt đầu từ 1. |
| GET /api/student/ojt-results | query | limit | Không | Số bản ghi mỗi trang. |
| GET /api/job-applications | query | applicationId | Không |  |
| GET /api/job-applications | query | studentId | Không |  |
| GET /api/job-applications | query | registrationId | Không |  |
| GET /api/job-applications | query | ojtSemesterId | Không |  |
| GET /api/job-applications | query | companyId | Không |  |
| GET /api/job-applications | query | positionId | Không |  |
| GET /api/job-applications | query | page | Không |  |
| GET /api/job-applications | query | limit | Không |  |
| GET /api/job-applications | query | status | Không |  |
| GET /api/students/me/opportunities | query | ojtSemesterId | Có |  |
| GET /api/students/me/opportunities | query | page | Không |  |
| GET /api/students/me/opportunities | query | limit | Không |  |
| GET /api/internship-tasks | query | companyId | Không |  |
| GET /api/internship-tasks | query | studentId | Không |  |
| GET /api/internship-tasks | query | positionId | Không |  |
| GET /api/internship-tasks | query | ojtSemesterId | Không |  |
| GET /api/internship-tasks | query | assignmentId | Không |  |
| GET /api/internship-tasks | query | page | Không |  |
| GET /api/internship-tasks | query | limit | Không |  |
