type Spec = Record<string, any>;

// Final role-specific contracts. No new routes, receipt workflow or DB states.
export function describeQhdnDossiers(spec: Spec): Spec {
  const id = { type: 'integer', minimum: 1, maximum: 2147483647 };
  const submission = spec.paths['/api/ojt-registrations']?.post;
  if (submission) {
    const original = submission.requestBody?.content?.['application/json']?.schema ?? { type: 'object', additionalProperties: false, required: ['windowId', 'studentId'], properties: { windowId: id, studentId: id, application: { type: 'object' } } };
    const student = { type: 'object', additionalProperties: false, required: ['windowId', 'postId', 'positionId'], properties: {
      windowId: id, studentId: { ...id, description: 'Tùy chọn; phải là sinh viên đang đăng nhập.' },
      postId: { ...id, description: 'Tin đã công bố thuộc kỳ đăng ký.' }, positionId: { ...id, description: 'Vị trí thuộc đúng tin, doanh nghiệp và kỳ, còn chỉ tiêu.' },
      application: original.properties?.application ?? { type: 'object' }, coverLetter: { type: 'string', maxLength: 5000 },
    } };
    submission.summary = 'Sinh viên nộp hồ sơ OJT và chọn vị trí doanh nghiệp trong một lần';
    submission.description = 'STUDENT: bắt buộc windowId/postId/positionId. Kỳ đã có bàn giao, đăng ký OPEN trong thời hạn, doanh nghiệp đã import và có tin/vị trí đang nhận còn chỉ tiêu. Tạo hồ sơ và ứng tuyển trong cùng transaction, lỗi rollback cả hai; response data có jobApplication. Không tự duyệt, gửi doanh nghiệp hoặc phân công. ADMIN giữ đầu vào nộp hộ hiện có (windowId/studentId/application); không bắt buộc chọn vị trí. QHDN không được nộp hộ. Không có bước xác nhận QHDN nhận bàn giao.';
    submission.requestBody = { required: true, content: { 'application/json': { schema: { oneOf: [
      { ...original, description: 'Đầu vào ADMIN nộp hộ hiện có.' }, { ...student, description: 'Đầu vào STUDENT nộp hồ sơ và ứng tuyển cùng lúc.' },
    ] }, example: { windowId: 1, postId: 1, positionId: 1, application: { note: 'Đăng ký OJT' }, coverLetter: 'Nguyện vọng thực tập' } } } };
  }
  const progress = spec.paths['/api/qhdn/registered-students']?.get;
  if (progress) {
    progress.summary = 'QHDN xem tiến độ nộp hồ sơ và điều phối theo kỳ';
    progress.description = 'OJT_COORD bắt buộc ojtSemesterId. Một sinh viên một dòng trong kỳ, nguồn là tất cả sinh viên Đào tạo đã bàn giao; chưa nộp có registration=null và registrations=[]. status/registrationStatus: NOT_REGISTERED (chưa nộp), SUBMITTED (đã nộp), APPROVED (đã duyệt); giữ REJECTED và LEGACY_REVIEW_REQUIRED cho hồ sơ cần bổ sung/đối soát. applications chứa doanh nghiệp/vị trí đã chọn và trạng thái ứng tuyển. coordinationStatus, coordination, assignment, workflowStatus, canSendToEnterprise và canReassign phản ánh điều phối/ý kiến doanh nghiệp, độc lập trạng thái hồ sơ. ADMIN giữ projection danh sách đã đăng ký và bộ lọc hiện có. GET không tạo dữ liệu.';
    progress.description += ' QHDN chọn studentId hoặc registrationId để đọc officialEligibility hiện tại, handoff/handoffSnapshot, history/historyPagination, coordinationHistory/coordinationPagination và assignments/assignmentsPagination. coordination và assignment vẫn là bản mới nhất, không đổi theo trang lịch sử. Chưa nộp trả các lịch sử rỗng. Bộ lọc không khớp trả items=[]; không lộ lịch sử sinh viên chưa bàn giao hoặc khác kỳ. QHDN không còn gọi GET /api/ojt-registrations hoặc GET /api/ojt-semesters/{id}/students.';
    progress.parameters ??= [];
    const parameter = (name: string, schema: Spec, description: string) => {
      const value = progress.parameters.find((p: Spec) => p.in === 'query' && p.name === name);
      if (value) Object.assign(value, { schema, description });
      else progress.parameters.push({ in: 'query', name, required: false, schema, description });
    };
    parameter('ojtSemesterId', id, 'Bắt buộc với QHDN; Admin giữ bộ lọc kỳ tùy chọn.');
    parameter('status', { type: 'string', enum: ['NOT_REGISTERED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'LEGACY_REVIEW_REQUIRED', 'HANDED_OFF'] }, 'QHDN dùng NOT_REGISTERED/SUBMITTED/APPROVED/REJECTED/LEGACY_REVIEW_REQUIRED; HANDED_OFF chỉ giữ tương thích bộ lọc Admin.');
    parameter('coordinationStatus', { type: 'string', enum: ['NOT_COORDINATED', 'PENDING', 'ACCEPTED', 'REJECTED'] }, 'Bộ lọc riêng QHDN; doanh nghiệp quyết định nhận/từ chối.');
    parameter('studentId', id, 'QHDN chọn một sinh viên trong kỳ để đọc thêm lịch sử và chi tiết.');
    parameter('registrationId', id, 'QHDN chọn một hồ sơ trong kỳ để đọc thêm lịch sử và chi tiết.');
    parameter('enterpriseId', id, 'Bộ lọc riêng QHDN theo doanh nghiệp ở lần điều phối mới nhất.');
    parameter('assignmentStatus', { type: 'string', enum: ['UNASSIGNED', 'ASSIGNED', 'ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'CANCELED', 'FAILED'] }, 'Bộ lọc riêng QHDN theo phân công gắn với điều phối mới nhất.');
    for (const prefix of ['history', 'coordination', 'assignment']) {
      parameter(prefix + 'Page', { ...id, default: 1 }, 'Chỉ QHDN: trang ' + prefix + '; bắt buộc chọn studentId hoặc registrationId.');
      parameter(prefix + 'Limit', { ...id, maximum: 100, default: 20 }, 'Chỉ QHDN: số bản ghi ' + prefix + ' mỗi trang, tối đa 100.');
    }
    const oldResponse = progress.responses?.['200']?.content?.['application/json']?.schema;
    const item = { type: 'object', properties: {
      studentId: id, ojtSemesterId: id, registrationId: { ...id, nullable: true },
      status: { type: 'string', enum: ['NOT_REGISTERED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'LEGACY_REVIEW_REQUIRED'] },
      registrationStatus: { type: 'string' }, statusLabel: { type: 'string' },
      registration: { type: 'object', nullable: true, additionalProperties: true }, registrations: { type: 'array', items: { type: 'object' } },
      applications: { type: 'array', items: { type: 'object', properties: { id, status: { type: 'string' }, enterpriseId: id, positionId: id, company: { type: 'object' }, position: { type: 'object' } } } },
      coordinationStatus: { type: 'string', enum: ['NOT_COORDINATED', 'PENDING', 'ACCEPTED', 'REJECTED'] },
      coordination: { type: 'object', nullable: true, additionalProperties: true }, assignment: { type: 'object', nullable: true, additionalProperties: true },
      workflowStatus: { type: 'string', enum: ['NOT_SUBMITTED', 'AWAITING_REVIEW', 'READY_TO_COORDINATE', 'SENT_TO_ENTERPRISE', 'ENTERPRISE_REJECTED', 'NEEDS_REASSIGNMENT', 'ENTERPRISE_ACCEPTED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'NEEDS_RESUBMISSION', 'LEGACY_REVIEW_REQUIRED'] },
      canSendToEnterprise: { type: 'boolean' }, canReassign: { type: 'boolean' },
      officialEligibility: { type: 'object', nullable: true, additionalProperties: true }, handoff: { type: 'object', additionalProperties: true }, handoffSnapshot: { type: 'object', nullable: true, additionalProperties: true }, window: { type: 'object', nullable: true, additionalProperties: true },
      history: { type: 'array', items: { type: 'object', additionalProperties: true } },
      coordinationHistory: { type: 'array', items: { type: 'object', additionalProperties: true } },
      assignments: { type: 'array', items: { type: 'object', additionalProperties: true } },
      ...Object.fromEntries(['historyPagination', 'coordinationPagination', 'assignmentsPagination'].map(name => [name, { type: 'object', properties: { total: { type: 'integer', minimum: 0 }, page: id, limit: { ...id, maximum: 100 } } }])),
    } };
    const response = { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object', properties: { ojtSemesterId: id, items: { type: 'array', items: item }, total: { type: 'integer' }, page: { type: 'integer' }, limit: { type: 'integer' } } } } };
    progress.responses ??= {};
    progress.responses['200'] = { description: 'QHDN: tiến độ theo kỳ; Admin: projection danh sách đã đăng ký hiện có.', content: { 'application/json': { schema: oldResponse ? { anyOf: [oldResponse, response] } : response } } };
  }
  const roster = spec.paths['/api/qhdn/eligible-students']?.get;
  if (roster) roster.description = 'Danh sách đủ điều kiện OJT đã được Đào tạo bàn giao theo ojtSemesterId; độc lập hồ sơ đã nộp hay chưa. HandoffId/lịch sử bàn giao là căn cứ, không có thao tác nhận hoặc từ chối riêng của QHDN. Dùng GET /api/qhdn/registered-students để xem tiến độ nộp và điều phối.';
  return spec;
}
