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

const operationTexts: Record<string, { summary: string; description?: string }> = {};
function describe(path: string, methods: Record<string, string | [string, string]>): void {
  for (const [method, text] of Object.entries(methods)) {
    operationTexts[method + ' /api' + path] = typeof text === 'string'
      ? { summary: text } : { summary: text[0], description: text[1] };
  }
}
for (const [resource, name] of Object.entries({
  'academic-years': 'năm học', 'academic-periods': 'kỳ học và Block 3',
  'ojt-semesters': 'kỳ OJT', cohorts: 'khóa và nhóm'
})) {
  describe('/' + resource, { get: 'Danh sách ' + name, post: 'Tạo ' + name });
  describe('/' + resource + '/{id}', { patch: 'Cập nhật ' + name });
}
const placement: [string, string] = ['Gán lộ trình học cho sinh viên', 'Lần đầu cần khóa, nhóm và kỳ hiện tại. Kỳ chuyên ngành tính từ kỳ vào thực tế; Block 3 không tăng số kỳ.'];
describe('/students/academic-placement', { patch: placement });
describe('/students/{id}/academic-placement', { patch: placement });
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
describe('/academic/dashboard', { get: 'Tổng quan điều kiện OJT' });
describe('/academic/eligibility-statistics', { get: 'Thống kê điều kiện theo khóa, nhóm, chuyên ngành và combo' });
describe('/academic/alerts', { get: 'Danh sách cảnh báo thiếu điều kiện OJT' });
describe('/academic/alerts/notifications', { post: 'Gửi cảnh báo học vụ' });
describe('/academic/course-demand', { get: 'Thống kê nhu cầu học môn còn thiếu' });
describe('/academic/course-demand/export', { get: 'Xuất nhu cầu học theo môn, kỳ và Block' });
describe('/accounts', { get: 'Danh sách tài khoản', post: 'Tạo tài khoản' });
describe('/accounts/me/profile', { get: 'Xem hồ sơ cá nhân', patch: 'Cập nhật hồ sơ cá nhân' });
describe('/accounts/{userId}', { get: 'Chi tiết tài khoản', put: 'Cập nhật tài khoản' });
describe('/accounts/{userId}/status', { patch: 'Cập nhật trạng thái tài khoản' });
describe('/accounts/{userId}/role', { patch: 'Cập nhật vai trò tài khoản' });
describe('/auth/login', { post: 'Đăng nhập bằng email và mật khẩu' });
describe('/auth/me', { get: 'Xem tài khoản đang đăng nhập' });
describe('/auth/logout', { post: ['Đăng xuất', 'Ứng dụng cần xóa token đã lưu.'] });
describe('/auth/change-password', { post: ['Đổi mật khẩu', 'Token cũ bị thu hồi; cần đăng nhập lại.'] });
describe('/combo-registration-windows', { get: 'Danh sách đợt chọn combo', post: 'Tạo đợt chọn hoặc xác nhận combo' });
describe('/combo-registration-windows/{id}', { patch: 'Cập nhật đợt chọn combo' });
for (const [action, title] of Object.entries({ open: 'Mở đợt chọn combo', close: 'Đóng đợt chọn combo', extensions: 'Gia hạn chọn combo', reminders: 'Gửi nhắc chọn combo', finalize: 'Chốt lựa chọn combo' }))
  describe('/combo-registration-windows/{id}/' + action, { post: title });
describe('/combo-registration-windows/{id}/selections', { get: 'Theo dõi lựa chọn combo', post: 'Gửi lựa chọn combo' });
describe('/combo-registration-windows/{id}/preview', { post: ['Xem ảnh hưởng của combo dự kiến', 'Tính tín chỉ, môn còn thiếu và điều kiện OJT; không lưu lựa chọn chính thức.'] });
describe('/students/{id}/combo-selections', { get: 'Lịch sử lựa chọn combo của sinh viên' });
describe('/majors', { get: 'Danh sách chuyên ngành', post: 'Tạo chuyên ngành' });
describe('/courses', { get: 'Danh sách môn học', post: 'Tạo môn học' });
describe('/courses/{id}', { patch: 'Cập nhật môn học' });
describe('/curricula', { get: 'Danh sách chương trình đào tạo', post: 'Tạo phiên bản chương trình' });
describe('/curricula/{id}', { get: 'Chi tiết chương trình đào tạo', patch: 'Cập nhật phiên bản chương trình' });
describe('/curricula/{id}/courses', { put: 'Thiết lập môn, tín chỉ và kỳ học' });
describe('/curricula/{id}/prerequisites', { put: 'Thiết lập môn tiên quyết' });
describe('/curricula/{id}/course-equivalences', { put: 'Thiết lập công nhận và tương đương môn' });
describe('/curricula/{id}/combos', { get: 'Danh sách combo của chương trình', post: 'Tạo combo' });
describe('/combos/{id}/courses', { put: 'Thiết lập môn thuộc combo' });
describe('/curricula/{id}/publish', { post: 'Ban hành phiên bản chương trình' });
for (const [resource, name] of Object.entries({ 'curriculum-imports': 'khung chương trình', 'course-result-imports': 'kết quả học tập', imports: 'sinh viên hoặc doanh nghiệp' })) {
  describe('/' + resource + '/preview', { post: 'Kiểm tra dữ liệu nhập ' + name });
  describe('/' + resource + '/commit', { post: 'Nhập ' + name });
}
describe('/ojt-rule-sets', { get: 'Danh sách bộ quy tắc OJT', post: ['Tạo bộ quy tắc OJT', 'Điều kiện: tối thiểu 70 tín chỉ và tối đa 2 môn chưa đạt.'] });
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
describe('/ojt-registration-windows', { get: 'Danh sách đợt đăng ký OJT', post: ['Tạo đợt đăng ký OJT', 'Mặc định dành cho kỳ chuyên ngành 5, tính theo lộ trình thực tế.'] });
describe('/ojt-registration-windows/{id}', { patch: 'Cập nhật đợt đăng ký OJT' });
describe('/ojt-registration-windows/{id}/open', { post: 'Mở đợt đăng ký OJT' });
describe('/ojt-registration-windows/{id}/close', { post: 'Đóng đợt đăng ký OJT' });
describe('/ojt-registrations', { get: 'Danh sách hồ sơ đăng ký OJT', post: 'Nộp hồ sơ đăng ký OJT' });
describe('/ojt-registrations/{id}', { get: 'Chi tiết hồ sơ đăng ký OJT' });
describe('/ojt-registrations/{id}/review', { post: 'Duyệt hoặc từ chối hồ sơ OJT' });
describe('/ojt-semesters/{id}/eligible-student-handoffs', { get: 'Lịch sử bàn giao sinh viên cho QHDN', post: 'Bàn giao sinh viên đủ điều kiện cho QHDN' });
describe('/ojt-semesters/{id}/students', { get: 'Theo dõi trạng thái OJT theo kỳ' });
describe('/ojt-results', { get: 'Danh sách kết quả OJT đã chuyển', post: 'Chuyển đánh giá và hồ sơ OJT cho phòng đào tạo' });
describe('/ojt-results/{id}', { get: 'Chi tiết đánh giá và hồ sơ OJT', patch: 'Cập nhật điểm và kết quả OJT chính thức' });
describe('/ojt-results/{id}/revision-requests', { post: 'Yêu cầu bổ sung hồ sơ kết quả OJT' });
describe('/ojt-results/{id}/transfer', { post: 'Gửi lại hồ sơ OJT đã bổ sung' });
describe('/ojt-results/{id}/confirm', { post: ['Xác nhận kết quả OJT', 'Ghi nhận kết quả môn học và trạng thái thực tập theo cấu hình quy đổi điểm.'] });
describe('/ojt-semesters/{id}/results/export', { get: 'Xuất báo cáo kết quả OJT theo kỳ' });
describe('/students', { get: 'Tìm kiếm và lọc sinh viên' });
describe('/students/{id}', { get: 'Chi tiết hồ sơ học vụ', patch: 'Cập nhật hồ sơ học vụ' });
describe('/students/{id}/course-results', { get: 'Điểm, lần học và trạng thái môn' });
describe('/students/{id}/academic-progress', { get: ['GPA, tín chỉ và tiến độ học tập', 'GPA lấy lần học gần nhất. Tín chỉ không cộng trùng học lại, môn tương đương và môn được công nhận.'] });
describe('/course-results/{id}', { patch: 'Sửa kết quả học tập và ghi lý do' });
describe('/academic-imports', { get: 'Lịch sử nhập dữ liệu học vụ' });
describe('/academic-imports/{id}', { get: 'Chi tiết và lỗi nhập dữ liệu học vụ' });
describe('/health', { get: 'Kiểm tra backend và cơ sở dữ liệu' });
describe('/roles', { get: 'Danh sách vai trò' });

const pathEntities: Record<string, string> = {
  students:'StudentID',accounts:'UserID','academic-years':'AcademicYearID','academic-periods':'AcademicPeriodID',
  'ojt-semesters':'OJTSemesterID',cohorts:'CohortID',curricula:'ProgramID',courses:'CourseID',combos:'ProgramComboID',
  'course-results':'ResultID trong StudentCourseResults','academic-imports':'BatchID trong AcademicImportBatches',
  'ojt-rule-sets':'RuleSetID','eligibility-checks':'CheckID','eligibility-check-runs':'RunID',
  'combo-registration-windows':'WindowID trong ComboRegistrationWindows',
  'ojt-registration-windows':'WindowID trong OJTRegistrationWindows','ojt-registrations':'RegistrationID',
  'ojt-results':'ResultID trong OJTResults'
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
      enterprise:{summary:'Nhập doanh nghiệp',value:{kind:'ENTERPRISE',idempotencyKey:'manual-enterprise-import-001',semesterId:1,rows:[{code:'DN-MANUAL-001',email:'hr@example.invalid',fullName:'Người phụ trách',name:'Doanh nghiệp mẫu',address:'TP. Hồ Chí Minh',positions:[{code:'DEV-001',title:'Thực tập lập trình',description:'Mô tả công việc',requirements:'Yêu cầu tuyển dụng',capacity:5}]}]}}
    };
  }
  return spec;
}
