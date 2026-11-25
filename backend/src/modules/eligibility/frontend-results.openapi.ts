export function describeOjtEligibilityResults(spec: Record<string, any>) {
  // Retire the unused legacy batch checker; the saved-results endpoint now
  // records the decision and feeds the recruitment roster in one operation.
  delete spec.paths?.['/api/eligibility-check-runs'];
  const response = (description: string) => ({ description });
  spec.paths ??= {};
  spec.paths['/api/ojt-eligibility-results'] = {
    post: {
      tags: ['OJT eligibility'], summary: 'Chạy xét điều kiện OJT và lưu kết quả từ backend',
      description: 'ADMIN/ACADEMIC. Không cần năm học/kỳ OJT. Xét toàn bộ sinh viên đang hoạt động theo điều kiện có hiệu lực, loại sinh viên đã PASSED OJT202, lưu trạng thái và cập nhật roster QHDN. Nút thủ công, import và cron dùng chung service xét. Roster tự trả ASSIGNED khi có đợt mở hoặc WAITING khi chưa có đợt.',
      security: [{ bearerAuth: [] }],
      requestBody: { required: true, content: { 'application/json': {
        schema: { type: 'object', additionalProperties: false },
        example: {},
      } } },
      responses: {
        200: { description: 'Đã xét và lưu kết quả cho toàn bộ sinh viên đang hoạt động.', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object', properties: {
          checkedCount: { type: 'integer', minimum: 0 }, savedCount: { type: 'integer', minimum: 0 },
          eligibleCount: { type: 'integer', minimum: 0 }, notEligibleCount: { type: 'integer', minimum: 0 },
          reviewRequiredCount: { type: 'integer', minimum: 0 }, assignedCount: { type: 'integer', minimum: 0 },
          waitingCount: { type: 'integer', minimum: 0 }, excludedPassedOjt202Count: { type: 'integer', minimum: 0 },
        } } } }, example: { success: true, data: { checkedCount: 100, savedCount: 100, eligibleCount: 38, notEligibleCount: 57, reviewRequiredCount: 5, assignedCount: 20, waitingCount: 18, excludedPassedOjt202Count: 4 } } } } },
        400: response('Body phải là object rỗng.'), 401: response('Chưa đăng nhập.'),
        403: response('Không có quyền chạy xét OJT.'), 409: response('Chưa có điều kiện OJT đang có hiệu lực.'),
      },
    },
    get: {
      tags: ['OJT eligibility'], summary: 'Lấy kết quả xét OJT đã lưu mới nhất theo sinh viên', security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'studentId', schema: { type: 'integer', minimum: 1 } },
        { in: 'query', name: 'status', schema: { type: 'string', enum: ['ELIGIBLE','NOT_ELIGIBLE','REVIEW_REQUIRED'] } },
        { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1, default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
      ],
      responses: { 200: response('success/data: items, total, page, limit. Mỗi item có kết quả, studentCode/fullName, source, batchId, savedAt, savedBy, isStale.'), 401: response('Chưa đăng nhập.'), 403: response('Không có quyền tra cứu.') },
    },
  };
  spec.paths['/api/ojt-conditions'] = {
    get: { tags: ['OJT eligibility'], summary: 'Danh sách điều kiện và văn bản ban hành', security: [{ bearerAuth: [] }], responses: { 200: response('Danh sách điều kiện bất biến theo phiên bản; mỗi lần tạo được ghi audit log.') } },
    post: { tags: ['OJT eligibility'], summary: 'Thêm điều kiện xét OJT', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['minCredits','issuingDocument','effectiveFrom'], properties: { minCredits: { type: 'number', minimum: 0, maximum: 9999.99 }, issuingDocument: { type: 'string', minLength: 1, maxLength: 10000 }, effectiveFrom: { type: 'string', format: 'date', description: 'Ngày sau ngày hiện tại theo giờ Việt Nam.' } } } } } }, responses: { 201: response('Tạo điều kiện mới và audit log.') } },
  };
  const responsePolicy = (description: string) => ({ description });
  spec.paths['/api/ojt-condition-policy'] = {
    get: { tags: ['OJT eligibility'], summary: 'Điều kiện OJT đang áp dụng', security: [{ bearerAuth: [] }], responses: { 200: responsePolicy('Phiên bản, ngưỡng tín chỉ, số môn chưa đạt và người cập nhật.') } },
    post: { tags: ['OJT eligibility'], summary: 'Kiểm tra lại và công bố điều kiện OJT chung', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['minCredits','maxUnpassedCourses','token'], properties: { minCredits: { type: 'number', minimum: 0 }, maxUnpassedCourses: { type: 'integer', minimum: 0 }, token: { type: 'string', minLength: 64, maxLength: 64 } } } } } }, responses: { 201: responsePolicy('Đã lưu phiên bản mới và kích hoạt quy định cho mọi chương trình.'), 409: responsePolicy('Dữ liệu đổi hoặc khung chương trình không đáp ứng.') } },
  };
  spec.paths['/api/ojt-condition-policy/preview'] = { post: { tags: ['OJT eligibility'], summary: 'Đối chiếu điều kiện với các khung chương trình', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['minCredits','maxUnpassedCourses'], properties: { minCredits: { type: 'number', minimum: 0 }, maxUnpassedCourses: { type: 'integer', minimum: 0 } } } } } }, responses: { 200: responsePolicy('Kết quả từng chương trình, trạng thái lưu và token kiểm tra.') } } };
}
