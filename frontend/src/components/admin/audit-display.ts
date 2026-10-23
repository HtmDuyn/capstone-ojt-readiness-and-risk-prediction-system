export const AUDIT_ENTITIES: Record<string, string> = {
  Users: 'Tài khoản', Accounts: 'Tài khoản', Students: 'Hồ sơ sinh viên',
  Enterprises: 'Doanh nghiệp', EnterpriseUsers: 'Tài khoản doanh nghiệp',
  InternshipPositions: 'Vị trí thực tập', InternshipAssignments: 'Phân công thực tập',
  InternshipEvaluations: 'Đánh giá thực tập', InternshipTaskBatch: 'Đợt giao nhiệm vụ',
  InternshipTasks: 'Nhiệm vụ thực tập', StudentEnterpriseCoordination: 'Điều phối sinh viên',
  AcademicYears: 'Năm học', AcademicPeriods: 'Kỳ học', Cohorts: 'Khóa sinh viên',
  TrainingPrograms: 'Chương trình đào tạo', ProgramCourses: 'Môn học trong chương trình',
  Courses: 'Môn học', Specializations: 'Chuyên ngành', ProgramCombos: 'Combo môn học',
  StudentAcademicPlacements: 'Phân nhóm học vụ', StudentCourseResults: 'Kết quả học tập',
  AcademicImportBatches: 'Đợt nhập dữ liệu học vụ', AccountImportBatches: 'Đợt nhập tài khoản',
  AcademicAlertNotificationBatches: 'Đợt gửi cảnh báo học vụ', EmailOutbox: 'Email hệ thống',
  OJTSemesters: 'Kỳ thực tập OJT', OJTRuleSets: 'Bộ quy tắc xét điều kiện OJT',
  OJTEligibilityCheckRuns: 'Đợt xét điều kiện OJT', OJTEligibilityChecks: 'Kết quả xét điều kiện OJT',
  StudentOJTEligibility: 'Trạng thái điều kiện OJT', EligibleStudentHandoffs: 'Đợt bàn giao sinh viên',
  EligibleStudentHandoffBatches: 'Đợt bàn giao sinh viên',
  OJTRegistrationWindows: 'Đợt đăng ký OJT', OJTRegistrationExceptions: 'Ngoại lệ đăng ký OJT',
  OJTRegistrations: 'Hồ sơ đăng ký OJT', OJTResults: 'Kết quả thực tập',
  ProgramOJTGradeMappings: 'Quy đổi điểm thực tập', RecruitmentPosts: 'Tin tuyển dụng',
  JobApplications: 'Hồ sơ ứng tuyển', ComboRegistrationWindows: 'Đợt đăng ký combo',
  StudentComboChoices: 'Lựa chọn combo', StudentCVFiles: 'Hồ sơ CV sinh viên',
  CVs: 'Hồ sơ CV sinh viên', Notifications: 'Thông báo',
};

export function entityLabel(entityType: string): string {
  const normalized = entityType.replace(/[_\s-]/g, '').toLowerCase();
  return Object.entries(AUDIT_ENTITIES).find(([key]) => key.toLowerCase() === normalized)?.[1]
    || 'Đối tượng khác';
}

export const AUDIT_ACTIONS: Record<string, string> = {
  ASSIGN: 'Phân công thực tập', ASSIGNMENT_STATUS: 'Cập nhật trạng thái thực tập',
  COORDINATE: 'Điều phối sinh viên', ENTERPRISE_DECISION: 'Doanh nghiệp phản hồi tiếp nhận',
  SUBMIT_EVALUATION: 'Nộp đánh giá thực tập', UPDATE_EVALUATION: 'Cập nhật đánh giá thực tập',
  RESET_DEMO_PASSWORD: 'Đặt lại mật khẩu tài khoản demo', SEED_DEMO: 'Khởi tạo dữ liệu demo',
  CREATE: 'Tạo mới', UPDATE: 'Cập nhật', DELETE: 'Xóa', SOFT_DELETE: 'Ngừng hoạt động / Xóa mềm',
  UPDATE_ACCOUNT: 'Cập nhật tài khoản', UPDATE_PROFILE: 'Cập nhật hồ sơ',
  UPDATE_OWN_PROFILE: 'Cập nhật hồ sơ cá nhân', REQUEST_PASSWORD_RESET: 'Yêu cầu đặt lại mật khẩu',
  ALLOW_SEMESTER_EXCEPTION: 'Cho phép ngoại lệ học kỳ', APPLY: 'Áp dụng',
  APPLY_COMBO_CHOICE: 'Áp dụng lựa chọn combo', ASSIGN_TASKS: 'Giao nhiệm vụ',
  CHECK_AND_UPDATE: 'Xét và cập nhật điều kiện OJT', CLOSE: 'Đóng',
  CLOSE_ASSESSMENT: 'Đóng đợt xét điều kiện', CLOSE_COMBO_WINDOW: 'Đóng đăng ký combo',
  CONFIGURE: 'Thiết lập', CONFIGURE_ASSESSMENT: 'Thiết lập đợt xét điều kiện',
  CONFIRM: 'Xác nhận', CORRECT_RESULT: 'Điều chỉnh kết quả học tập',
  CREATE_COMBO_WINDOW: 'Tạo đợt đăng ký combo', CREATE_COURSE: 'Tạo môn học',
  CREATE_MAJOR: 'Tạo chuyên ngành', EXTEND_COMBO_WINDOW: 'Gia hạn đăng ký combo',
  FINALIZE_COMBO_WINDOW: 'Chốt đăng ký combo', HANDOFF: 'Bàn giao',
  IMPORT_CURRICULUM: 'Nhập khung chương trình', IMPORT_RESULT: 'Nhập kết quả học tập',
  OPEN: 'Mở', OPEN_ASSESSMENT: 'Mở đợt xét điều kiện', OPEN_COMBO_WINDOW: 'Mở đăng ký combo',
  PUBLISH: 'Công bố', PUBLISH_FIXED_POLICY: 'Công bố quy tắc xét điều kiện',
  QUEUE: 'Đưa vào hàng đợi', QUEUE_ALERTS: 'Xếp hàng gửi cảnh báo',
  QUEUE_COMBO_REMINDERS: 'Xếp hàng nhắc đăng ký combo', REOPEN_ASSESSMENT: 'Mở lại đợt xét điều kiện',
  REPLACE_CURRICULUM: 'Thay khung chương trình', RESUBMIT: 'Nộp lại', RETIRE: 'Ngừng sử dụng',
  REVIEW: 'Xét duyệt', REVOKE: 'Thu hồi', SET_COMBO_PHASE_SCHEDULE: 'Thiết lập lịch đăng ký combo',
  SET_OJT_GRADE_MAPPING: 'Thiết lập quy đổi điểm OJT', SUBMIT: 'Nộp',
  SUBMIT_COMBO_CHOICE: 'Nộp lựa chọn combo', SYNC_OFFICIAL_OJT_GRADE: 'Đồng bộ điểm OJT chính thức',
  TRANSFER: 'Chuyển giao', UPDATE_ACADEMIC_PLACEMENT: 'Cập nhật phân nhóm học vụ',
  UPDATE_COMBO_WINDOW: 'Cập nhật đợt đăng ký combo', UPDATE_COURSE: 'Cập nhật môn học',
  UPLOAD: 'Tải tệp lên', UPLOAD_CV: 'Tải CV lên',
};

const FIELD_NAMES: Record<string, string> = {
  id: 'ID', userid: 'ID tài khoản', username: 'Tên đăng nhập', fullname: 'Họ tên',
  email: 'Email', phone: 'Số điện thoại', status: 'Trạng thái', roleid: 'ID vai trò',
  rolecode: 'Mã vai trò', rolename: 'Tên vai trò', createdat: 'Ngày tạo', updatedat: 'Ngày cập nhật',
  lastloginat: 'Đăng nhập gần nhất', deletedat: 'Ngày xóa', studentid: 'ID sinh viên',
  studentcode: 'Mã sinh viên', enterpriseid: 'ID doanh nghiệp', companyid: 'ID doanh nghiệp',
  programid: 'ID chương trình', ojtsemesterid: 'ID kỳ OJT', semesterid: 'ID học kỳ',
  academicperiodid: 'ID kỳ học', cohortid: 'ID khóa', groupcode: 'Nhóm', classname: 'Lớp',
  name: 'Tên', code: 'Mã', reason: 'Lý do', message: 'Nội dung', description: 'Mô tả',
  before: 'Trước thay đổi', after: 'Sau thay đổi', detail: 'Nội dung chi tiết',
  logid: 'ID nhật ký', action: 'Hành động', actionat: 'Thời gian thực hiện',
  entitytype: 'Loại đối tượng', entityid: 'ID đối tượng', ipaddress: 'Địa chỉ IP',
  emailid: 'ID email', expiresat: 'Hết hạn', total: 'Tổng số', count: 'Số lượng',
  version: 'Phiên bản', result: 'Kết quả', results: 'Các kết quả', snapshot: 'Dữ liệu tại thời điểm ghi',
  mincredits: 'Tín chỉ tối thiểu', maxunpassedcourses: 'Số môn chưa đạt tối đa',
  mustchangepassword: 'Bắt buộc đổi mật khẩu', createdby: 'Người tạo', updatedby: 'Người cập nhật',
  actorrole: 'Vai trò thực hiện', enteredonbehalf: 'Nhập thay', source: 'Nguồn dữ liệu',
};

export const actionLabel = (action: string) => AUDIT_ACTIONS[action] || action;
export const fieldLabel = (key: string) => FIELD_NAMES[key.replace(/_/g, '').toLowerCase()]
  || key.replace(/([a-z\d])([A-Z])/g, '$1 $2').replace(/_/g, ' ');
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

// Some older log rows contain a serialized object instead of an object.
export function parseLogValue(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const text = value.trim();
  if (!text.startsWith('{') && !text.startsWith('[')) return value;
  try { return JSON.parse(text); } catch { return value; }
}

export function valuesEqual(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length && left.every((value, index) => valuesEqual(value, right[index]));
  }
  if (isRecord(left) && isRecord(right)) {
    const keys = Object.keys(left);
    return keys.length === Object.keys(right).length
      && keys.every(key => Object.prototype.hasOwnProperty.call(right, key) && valuesEqual(left[key], right[key]));
  }
  return false;
}
