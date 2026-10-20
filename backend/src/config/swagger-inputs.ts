type Spec = Record<string, any>;

const meanings: Record<string, string> = {
  userId: 'ID tài khoản.', studentId: 'ID hồ sơ sinh viên, khác ID tài khoản.',
  studentIds: 'Danh sách ID sinh viên.', excludeStudentIds: 'ID sinh viên loại khỏi danh sách chốt.',
  academicYearId: 'ID năm học.', academicPeriodId: 'ID kỳ học hoặc Block 3.',
  currentAcademicPeriodId: 'ID kỳ/Block đang học; bắt buộc khi gán lần đầu.',
  entryAcademicPeriodId: 'ID kỳ bắt đầu chuyên ngành thực tế; mặc định theo khóa/nhóm.',
  blockPeriodId: 'ID Block 3 dùng xét điều kiện.', parentPeriodId: 'ID kỳ học cha của Block 3.',
  ojtSemesterId: 'ID kỳ OJT.', semesterId: 'ID kỳ OJT.',
  cohortId: 'ID khóa.', cohortIds: 'Danh sách ID khóa.',
  majorId: 'ID chuyên ngành (SpecializationID).', majorIds: 'Danh sách ID chuyên ngành.',
  parentMajorId: 'ID ngành cha (MajorID).', programId: 'ID phiên bản chương trình đào tạo.',
  programIds: 'Danh sách ID phiên bản chương trình.', courseId: 'ID môn học (CourseID).',
  courseIds: 'Danh sách ID môn học.', sourceCourseId: 'ID môn nguồn.', targetCourseId: 'ID môn đích.',
  prerequisiteCourseIds: 'Danh sách ID môn tiên quyết.', slotCourseIds: 'Danh sách ID môn trong khung chương trình.',
  comboId: 'ID combo (ProgramComboID).', windowId: 'ID đợt đăng ký.',
  initialWindowId: 'ID đợt chọn ban đầu cùng kỳ chuyên ngành và kỳ OJT.',
  registrationIds: 'Danh sách ID hồ sơ OJT bàn giao.', assignmentId: 'ID hồ sơ thực tập đã được đánh giá.',
  roleId: 'ID vai trò.', expectedVersion: 'Phiên bản hiện tại của kết quả; sai phiên bản trả 409.',
  idempotencyKey: 'Khóa chống trùng yêu cầu; dùng lại cùng khóa và dữ liệu khi gửi lại.',
  studentCode: 'Mã sinh viên.', courseCode: 'Mã môn học.', reason: 'Lý do thực hiện.',
  resultsFinalized: 'Xác nhận đã hoàn tất cập nhật điểm.', assessmentDeadline: 'Hạn xét điều kiện, gồm múi giờ.',
  relativeSemester: 'Kỳ chuyên ngành tương đối.', requiredRelativeSemester: 'Kỳ chuyên ngành cho phép đăng ký; mặc định 5.',
  currentSemester: 'Kỳ chuyên ngành hiện tại, tính từ lộ trình thực tế.', attemptNumber: 'Lần học, từ 1 đến 100.',
  gradeBands: 'Mức quy đổi điểm; bắt đầu từ 0, không trùng mốc.', gradePoints: 'Điểm quy đổi theo thang 4.',
  isRequired: 'Môn bắt buộc.', scope: 'Phạm vi áp dụng; các bộ lọc kết hợp đồng thời.',
  page: 'Trang, bắt đầu từ 1.', limit: 'Số bản ghi mỗi trang.'
};
Object.assign(meanings,{
  companyId:'ID doanh nghiệp.',positionId:'ID vị trí thực tập.',assignmentId:'ID phân công thực tập.',
  templateId:'ID bộ tiêu chí đánh giá.',modelId:'ID phiên bản mô hình.',alertId:'ID cảnh báo rủi ro.',
  historyPage:'Trang lịch sử khi lọc theo ID.',historyLimit:'Số sự kiện lịch sử mỗi trang, tối đa 100.',
  interventionPage:'Trang hoạt động hỗ trợ khi lọc alertId.',interventionLimit:'Số hoạt động hỗ trợ mỗi trang, tối đa 100.'
});

const operationTexts: Record<string, { summary: string; description?: string }> = {};
function describe(path: string, methods: Record<string, string | [string, string]>): void {
  for (const [method, text] of Object.entries(methods)) {
    operationTexts[method + ' /api' + path] = typeof text === 'string'
      ? { summary: text } : { summary: text[0], description: text[1] };
  }
}
for (const [resource, name] of Object.entries({
  'academic-years': 'năm học', 'academic-periods': 'kỳ học và Block 3',
  cohorts: 'khóa và nhóm'
})) {
  describe('/' + resource, { get: 'Danh sách ' + name, post: 'Tạo ' + name });
  describe('/' + resource + '/{id}', { patch: 'Cập nhật ' + name });
}
describe('/academic-periods', {
  get: ['Danh sách kỳ học và Block 3', 'Lọc kind=SEMESTER để chọn học kỳ tuyển dụng; kết quả kèm thông tin OJT.'],
  post: ['Tạo kỳ học và Block 3', 'Học kỳ thường tự liên kết OJT và trả ojtSemesterId; QHDN không tạo kỳ riêng.']
});
describe('/academic-periods/{id}/combo-phase-schedules', {
  get: 'Xem mốc chọn và xác nhận combo',
  put: ['Thiết lập mốc chọn và xác nhận combo', 'Chọn ban đầu trong kỳ học; xác nhận trong Block 3. Các mốc phải nằm trong kỳ tương ứng.']
});
describe('/ojt-semesters/{id}/assessment-window', {
  get: 'Xem đợt xét điều kiện chính thức',
  put: ['Thiết lập đợt xét điều kiện chính thức', 'Thiết lập khi còn nháp. Thời điểm mở sau khi Block 3 kết thúc.']
});
describe('/ojt-semesters/{id}/assessment-window/open', { post: ['Mở xét điều kiện chính thức', 'Cần xác nhận đã cập nhật xong điểm. Kết quả kiểm tra trước mốc xác nhận phải được chạy lại.'] });
describe('/ojt-semesters/{id}/assessment-window/close', { post: 'Đóng xét điều kiện chính thức' });
describe('/curricula/{id}/ojt-grade-mappings/{semesterId}', {
  get: 'Xem quy đổi điểm môn OJT',
  put: ['Thiết lập quy đổi điểm môn OJT', 'Chọn môn, kỳ ghi nhận và thang quy đổi. Cấu hình đã dùng để xác nhận kết quả không được sửa.']
});
describe('/ojt-registration-windows/{id}/semester-exceptions', { post: ['Thêm ngoại lệ kỳ đăng ký OJT', 'Chỉ áp dụng cho sinh viên, kỳ và thời hạn được chỉ định; cần lý do.'] });
describe('/ojt-registration-windows/{id}/semester-exceptions/{exceptionId}/revoke', { post: 'Thu hồi ngoại lệ kỳ đăng ký OJT' });
describe('/academic/dashboard', { get: ['Tổng quan và thống kê điều kiện OJT', 'Chọn section summary/statistics/all; thống kê hỗ trợ groupBy.'] });
describe('/academic/alerts', { get: 'Danh sách cảnh báo thiếu điều kiện OJT' });
describe('/academic/alerts/notifications', { post: 'Gửi cảnh báo học vụ' });
describe('/academic/course-demand', { get: 'Thống kê nhu cầu học môn còn thiếu' });
describe('/academic/course-demand/export', { get: 'Xuất nhu cầu học theo môn, kỳ và Block' });
describe('/accounts', { get: 'Danh sách tài khoản', post: 'Tạo tài khoản' });
describe('/accounts/me/profile', { patch: 'Cập nhật hồ sơ cá nhân' });
describe('/accounts/{userId}', { patch: ['Cập nhật tài khoản', 'Admin sửa thông tin, trạng thái và vai trò trong một lần; chỉ gửi trường cần thay đổi.'] });
describe('/auth/login', { post: 'Đăng nhập bằng email và mật khẩu' });
describe('/auth/me', { get: ['Xem tài khoản đang đăng nhập', 'Kèm ID hồ sơ sinh viên hoặc doanh nghiệp liên kết.'] });
describe('/auth/change-password', { post: ['Đổi mật khẩu', 'Token cũ bị thu hồi; cần đăng nhập lại.'] });
describe('/combo-registration-windows', { get: ['Danh sách đợt chọn combo', 'Sinh viên chỉ thấy đợt của mình, kèm lựa chọn hợp lệ, hạn gia hạn và lý do chưa thể nộp.'], post: 'Tạo đợt chọn hoặc xác nhận combo' });
describe('/combo-registration-windows/{id}', { patch: ['Cập nhật hoặc mở/đóng đợt chọn combo', 'Giữ kiểm tra phạm vi, chốt danh sách và hạn đăng ký; status cần reason.'] });
for (const [action, title] of Object.entries({ extensions: 'Gia hạn chọn combo', reminders: 'Gửi nhắc chọn combo', finalize: 'Chốt lựa chọn combo' }))
  describe('/combo-registration-windows/{id}/' + action, { post: title });
describe('/combo-registration-windows/{id}/selections', { get: 'Theo dõi lựa chọn combo', post: 'Gửi lựa chọn combo' });
describe('/combo-registration-windows/{id}/preview', { post: ['Xem ảnh hưởng của combo dự kiến', 'Tính tín chỉ, môn còn thiếu và điều kiện OJT; không lưu lựa chọn chính thức.'] });
describe('/students/{id}/combo-selections', { get: 'Lịch sử lựa chọn combo của sinh viên' });
describe('/majors', { get: 'Danh sách chuyên ngành', post: 'Tạo chuyên ngành' });
describe('/courses', { get: 'Danh sách môn học', post: 'Tạo môn học' });
describe('/courses/{id}', { patch: 'Cập nhật môn học' });
describe('/curricula', { get: 'Danh sách chương trình đào tạo đã nhập' });
describe('/curricula/{id}', { get: 'Chi tiết chương trình đào tạo' });
for (const [resource, name] of Object.entries({ 'curriculum-imports': 'khung chương trình', 'course-result-imports': 'kết quả học tập', imports: 'sinh viên hoặc doanh nghiệp' })) {
  describe('/' + resource + '/preview', { post: 'Kiểm tra dữ liệu nhập ' + name });
  describe('/' + resource + '/commit', { post: 'Nhập ' + name });
}
describe('/ojt-rule-sets', { get: 'Danh sách bộ quy tắc OJT', post: ['Tạo bộ quy tắc OJT', 'Điều kiện: tối thiểu 70 tín chỉ và tối đa 2 môn còn nợ.'] });
describe('/ojt-rule-sets/{id}', { patch: 'Sửa bộ quy tắc chưa ban hành' });
describe('/ojt-rule-sets/{id}/publish', { post: 'Ban hành bộ quy tắc OJT' });
describe('/students/{id}/eligibility-checks', { get: 'Lịch sử kiểm tra điều kiện OJT', post: 'Kiểm tra điều kiện OJT của sinh viên' });
describe('/students/{id}/eligibility', { get: 'Kết quả OJT và điều kiện còn thiếu' });
describe('/eligibility-checks/{id}/confirm', { post: 'Xác nhận kết quả xét điều kiện OJT' });
describe('/eligibility-check-runs', { post: 'Kiểm tra điều kiện OJT hàng loạt' });
describe('/eligibility-check-runs/{id}', { get: 'Tiến độ và kết quả kiểm tra hàng loạt' });
describe('/imports/emails', { get: 'Trạng thái gửi email tài khoản' });
describe('/imports/emails/{emailId}/retry', { post: 'Gửi lại email bị lỗi' });
describe('/imports/archive', { post: 'Lưu trữ tuyển dụng sau hai học kỳ' });
describe('/ojt-registration-windows', { get: ['Danh sách đợt đăng ký OJT', 'Sinh viên chỉ thấy đợt phù hợp, kèm kỳ học, hồ sơ đã nộp và điều kiện đăng ký.'], post: ['Tạo đợt đăng ký OJT', 'Mặc định dành cho kỳ chuyên ngành 5, tính theo lộ trình thực tế.'] });
describe('/ojt-registration-windows/{id}', { patch: ['Cập nhật hoặc mở/đóng đợt đăng ký OJT', 'Gửi status OPEN/CLOSED và reason để chuyển trạng thái.'] });
describe('/ojt-registrations', { get: 'Danh sách hồ sơ đăng ký OJT', post: 'Nộp hồ sơ đăng ký OJT' });
describe('/ojt-registrations/{id}/review', { post: 'Duyệt hoặc từ chối hồ sơ OJT' });
describe('/ojt-semesters/{id}/eligible-student-handoffs', { get: 'Lịch sử bàn giao sinh viên cho QHDN', post: 'Bàn giao sinh viên đủ điều kiện cho QHDN' });
describe('/ojt-semesters/{id}/students', { get: 'Theo dõi trạng thái OJT theo kỳ' });
describe('/ojt-results', { get: 'Danh sách điểm OJT chính thức do doanh nghiệp đánh giá' });
describe('/ojt-semesters/{id}/results/export', { get: 'Xuất báo cáo kết quả OJT theo kỳ' });
describe('/students', { get: 'Tìm kiếm và lọc sinh viên' });
describe('/students/{id}', { get: ['Hồ sơ học vụ tổng hợp', 'Kèm GPA, tín chỉ, điểm, combo và OJT; section=academicProgress chỉ lấy thông tin sinh viên và tiến độ, mặc định all.'], patch: ['Cập nhật hồ sơ và lộ trình học vụ', 'Chỉ gửi trường cần sửa; placement chứa khóa, nhóm và kỳ học.'] });
describe('/students/{id}/course-results', { get: 'Điểm, lần học và trạng thái môn' });
describe('/course-results/{id}', { patch: 'Sửa kết quả học tập và ghi lý do' });
describe('/academic-imports', { get: 'Lịch sử nhập dữ liệu học vụ' });
describe('/health', { get: 'Kiểm tra backend và cơ sở dữ liệu' });
describe('/roles', { get: 'Danh sách vai trò' });

describe('/auth/users/{userId}/password-reset', { post: ['Đặt lại mật khẩu', 'Gửi mật khẩu tạm qua email và thu hồi phiên cũ.'] });
describe('/admin/dashboard', { get: ['Tổng quan hệ thống và thống kê dự đoán', 'section: summary/readiness/risks/trends/all. Summary luôn là tổng toàn hệ thống.'] });
describe('/students', { post: ['Tạo hồ sơ sinh viên', 'Liên kết với tài khoản sinh viên đang hoạt động.'] });
describe('/students/{id}', { delete: ['Xóa hồ sơ sinh viên', 'Xóa mềm hồ sơ và vô hiệu hóa tài khoản.'] });
describe('/students/export', { get: 'Xuất danh sách sinh viên' });
const sharedWrite = 'Admin và Phòng QHDN dùng chung URL; chọn mẫu dữ liệu theo vai trò trong anyOf.';
describe('/companies', { get: ['Danh sách và hồ sơ doanh nghiệp', 'Lọc companyId để lấy một hồ sơ kèm lịch sử phân trang.'], post: ['Tạo doanh nghiệp', sharedWrite] });
describe('/companies/{id}', { patch: ['Cập nhật doanh nghiệp', sharedWrite], delete: ['Xóa doanh nghiệp', 'Xóa mềm doanh nghiệp theo điều kiện dữ liệu liên quan.'] });
describe('/positions', { get: ['Danh sách và hồ sơ vị trí thực tập', 'Lọc positionId để lấy một vị trí kèm lịch sử; có mã, địa điểm và hình thức làm việc.'] });
describe('/positions/{id}', { delete: ['Xóa vị trí thực tập', 'Xóa mềm vị trí theo điều kiện dữ liệu liên quan.'] });
describe('/assignments', { get: ['Danh sách và hồ sơ phân công thực tập', 'Kèm sinh viên, doanh nghiệp, vị trí, đánh giá và kết quả OJT; lọc assignmentId để xem lịch sử.'], post: ['Phân công sinh viên thực tập', sharedWrite] });
describe('/assignments/{id}', { patch: ['Cập nhật thông tin và trạng thái thực tập', sharedWrite] });
describe('/assessment-templates', { get: ['Danh sách và hồ sơ bộ tiêu chí đánh giá', 'Lọc templateId để lấy một bộ tiêu chí đầy đủ.'], post: ['Tạo bộ tiêu chí đánh giá', 'Tổng trọng số tiêu chí phải bằng 100.'] });
describe('/assessment-templates/{id}', { patch: ['Sửa bộ tiêu chí đánh giá', 'Chỉ sửa phiên bản còn nháp.'] });
describe('/assessment-templates/{id}/publish', { post: ['Ban hành bộ tiêu chí đánh giá', 'Phiên bản đã ban hành không được sửa.'] });
describe('/admin/prediction-jobs', { post: ['Tạo tác vụ dự đoán', 'Sử dụng mô hình dự đoán đã cấu hình.'] });
describe('/admin/prediction-jobs/{id}', { get: 'Tiến độ dự đoán và lỗi theo sinh viên' });
describe('/predictions', { get: 'Lịch sử dự đoán' });
describe('/admin/models', { get: ['Danh sách và hồ sơ phiên bản mô hình', 'Lọc modelId; kết quả kèm thông số và cấu trúc đầu vào.'] });
describe('/alerts', { get: ['Danh sách và hồ sơ cảnh báo rủi ro', 'Lọc alertId để lấy cảnh báo kèm hoạt động hỗ trợ phân trang.'] });
describe('/alerts/{id}/status', { patch: 'Tiếp nhận hoặc đóng cảnh báo' });
describe('/alerts/{id}/interventions', { post: 'Tạo hoạt động hỗ trợ sinh viên' });
describe('/students/{id}/interventions', { get: 'Lịch sử hỗ trợ sinh viên' });
describe('/interventions/{id}', { patch: 'Cập nhật hoạt động hỗ trợ' });
describe('/admin/reports/readiness', { get: ['Báo cáo mức sẵn sàng và rủi ro', 'Lấy dự đoán mới nhất của từng sinh viên trong mỗi kỳ.'] });
describe('/admin/reports/export', { get: ['Xuất báo cáo dự đoán', 'Tối đa 10.000 bản ghi dự đoán mới nhất.'] });
describe('/admin/audit-logs', { get: ['Nhật ký hoạt động hệ thống', 'Ẩn các trường dữ liệu nhạy cảm.'] });
describe('/ojt-coordinations', { get: ['Danh sách và hồ sơ điều phối', 'Lọc coordinationId để xem hồ sơ, lịch sử và chuỗi điều phối phân trang.'], post: ['Giới thiệu sinh viên cho doanh nghiệp', 'Áp dụng cho hồ sơ đã bàn giao; cần lý do và lưu nhật ký.'] });
describe('/ojt-coordinations/{id}/decision', { post: ['Ghi nhận quyết định tiếp nhận sinh viên', 'Admin hoặc Phòng QHDN ghi nhận thay doanh nghiệp; cần lý do.'] });
describe('/ojt-coordinations/{id}/reassign', { post: ['Điều phối lại sinh viên', 'Chuyển hồ sơ bị từ chối sang vị trí khác; cần lý do.'] });
describe('/internship-evaluations', { get: ['Danh sách đánh giá thực tập', 'Lọc evaluationId để xem hồ sơ và lịch sử; giữ lọc templateId.'] });
describe('/assignments/{id}/internship-evaluation', { put: ['Ghi nhận đánh giá thực tập', 'Admin hoặc Phòng QHDN nhập thay doanh nghiệp; cần lý do.'] });
describe('/qhdn/dashboard', { get: ['Tổng quan QHDN', 'Tổng hợp bàn giao, tiếp nhận và sức chứa; dùng lần điều phối mới nhất.'] });
describe('/qhdn/reports', {get:['Báo cáo QHDN theo loại', 'type: acceptance, internships hoặc enterprise-feedback; giữ lọc kỳ/doanh nghiệp và phân trang.']});
describe('/qhdn/reports/export', { get: ['Xuất báo cáo QHDN', 'Định dạng CSV hoặc JSON; tối đa 10.000 dòng, không phân trang.'] });
const ownEnterprise = 'Chỉ xem dữ liệu của doanh nghiệp đang đăng nhập.';
describe('/enterprise/profile', { get: ['Hồ sơ doanh nghiệp', ownEnterprise+' Kèm số liệu tuyển dụng và thực tập.'] });
describe('/enterprise/candidates', { get: ['Danh sách và hồ sơ ứng viên', 'Lọc candidateId để xem một lần giới thiệu, kể cả lịch sử thuộc doanh nghiệp đăng nhập.'] });
describe('/enterprise/candidates/{id}/decision', { patch: ['Tiếp nhận hoặc từ chối ứng viên', 'Chỉ xử lý ứng viên được giới thiệu cho doanh nghiệp đang đăng nhập.'] });
describe('/enterprise/internships', { get: ['Danh sách sinh viên thực tập', 'Kèm người hướng dẫn, vị trí, đánh giá và kết quả; điểm chính thức chỉ hiển thị sau xác nhận.'] });
describe('/enterprise/internships/{id}/evaluation', { put: ['Gửi hoặc cập nhật đánh giá thực tập', 'Chỉ đánh giá sinh viên của doanh nghiệp; internshipId là ID phân công.'] });
describe('/recruitment/windows', { get: 'Danh sách đợt tuyển dụng theo học kỳ', post: ['Tạo đợt nhận nhu cầu tuyển dụng', 'Chọn học kỳ có sẵn và thời hạn nhận đơn; không tạo kỳ OJT riêng.'] });
describe('/recruitment/windows/{id}', { patch: ['Cập nhật hoặc mở/đóng đợt tuyển dụng', 'Chọn học kỳ có sẵn; status OPEN/CLOSED cần reason.'] });
describe('/recruitment/posts', { get: ['Danh sách tin tuyển dụng', 'Kèm vị trí và chỉ tiêu; doanh nghiệp chỉ xem tin của mình.'], post: ['Gửi nhu cầu tuyển dụng', 'Gửi vị trí, yêu cầu và số lượng trong đợt đang mở.'] });
describe('/recruitment/posts/{id}', { patch: ['Sửa tin và vị trí tuyển dụng', 'Tin chuyển về chờ duyệt; vị trí có lịch sử chỉ được sửa sức chứa.'] });
describe('/recruitment/posts/{id}/review', { post: ['Duyệt hoặc từ chối tin tuyển dụng', 'Vị trí được mở sau khi tin được công bố.'] });
describe('/recruitment/posts/{id}/close', { post: ['Đóng tin tuyển dụng', 'Ngừng nhận ứng viên vào các vị trí liên quan.'] });

const pathEntities: Record<string, string> = {
  students:'StudentID',accounts:'UserID','academic-years':'AcademicYearID','academic-periods':'AcademicPeriodID',
  'ojt-semesters':'OJTSemesterID',cohorts:'CohortID',curricula:'ProgramID',courses:'CourseID',combos:'ProgramComboID',
  'course-results':'ResultID trong StudentCourseResults','academic-imports':'BatchID trong AcademicImportBatches',
  'ojt-rule-sets':'RuleSetID','eligibility-checks':'CheckID','eligibility-check-runs':'RunID',
  'combo-registration-windows':'WindowID trong ComboRegistrationWindows',
  'ojt-registration-windows':'WindowID trong OJTRegistrationWindows','ojt-registrations':'RegistrationID',
  'ojt-results':'EvaluationID trong InternshipEvaluations (điểm chính thức doanh nghiệp)'
};

export function describeManualInputs(spec: Spec): Spec {
  const resolve = (value: any): any => value?.$ref?.startsWith('#/')
    ? value.$ref.slice(2).split('/').reduce((v:any,k:string)=>v?.[k],spec) : value;
  const visited=new WeakSet<object>();
  function annotate(value:any):void {
    const s=resolve(value);if(!s||typeof s!=='object'||visited.has(s))return;visited.add(s);
    for(const [key,raw]of Object.entries(s.properties??{})){
      const field=resolve(raw);if(!field)continue;
      if(meanings[key])field.description=meanings[key];
      annotate(field);
    }
    if(s.items)annotate(s.items);
    for(const kind of ['allOf','anyOf','oneOf'])for(const child of s[kind]??[])annotate(child);
    if(s.properties?.courseId&&s.properties?.courseCode&&!s.oneOf){
      s.oneOf=[{required:['courseId']},{required:['courseCode']}];
    }
  }
  for(const [path,item]of Object.entries(spec.paths??{}) as [string,Spec][]){
    for(const [method,op]of Object.entries(item) as [string,Spec][]){
      if(!['get','post','put','patch','delete'].includes(method))continue;
      const text=operationTexts[method+' '+path];
      if(text){op.summary=text.summary;if(text.description)op.description=text.description;else delete op.description;}
      for(const raw of [...(item.parameters??[]),...(op.parameters??[])]){
        const p=resolve(raw);let note=meanings[p.name];
        if(p.in==='path'&&p.name==='id')note='ID: '+(pathEntities[path.split('/')[2]]??'bản ghi')+'.';
        if(p.in==='path'&&p.name==='emailId')note='ID email lỗi còn hiệu lực.';
        if(p.in==='path'&&p.name==='exceptionId')note='ID ngoại lệ của đợt đăng ký.';
        if(note)p.description=note;
      }
      const body=resolve(op.requestBody);for(const media of Object.values(body?.content??{}) as Spec[])annotate(media.schema);
    }
  }
  const importBody=resolve(spec.paths?.['/api/imports/commit']?.post?.requestBody);
  if(importBody?.content?.['application/json']){
    const media=importBody.content['application/json'];
    media.examples={
      student:{summary:'Nhập sinh viên',value:{kind:'STUDENT',idempotencyKey:'manual-student-import-001',rows:[{code:'SV-MANUAL-001',email:'student@example.invalid',fullName:'Sinh viên mẫu'}]}},
      enterprise:{summary:'Nhập doanh nghiệp vào đợt tuyển dụng đang mở',value:{kind:'ENTERPRISE',idempotencyKey:'manual-enterprise-import-001',windowId:1,rows:[{code:'DN-MANUAL-001',email:'hr@example.invalid',fullName:'Người phụ trách',name:'Doanh nghiệp mẫu',address:'TP. Hồ Chí Minh',positions:[{code:'DEV-001',title:'Thực tập lập trình',description:'Mô tả công việc',requirements:'Yêu cầu tuyển dụng',capacity:5}]}]}}
    };
  }
  return spec;
}
