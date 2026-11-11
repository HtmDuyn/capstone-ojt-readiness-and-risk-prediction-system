export function describeFrontendEligibilityResults(spec: Record<string, any>) {
  const result = {
    type: 'object', additionalProperties: false,
    required: ['studentId','status','earnedCredits','unpassedCourseCount','reasons','academicIssues','checkedAt'],
    properties: {
      studentId: { type: 'integer', minimum: 1 },
      status: { type: 'string', enum: ['ELIGIBLE','NOT_ELIGIBLE','REVIEW_REQUIRED'] },
      earnedCredits: { type: 'number', minimum: 0, maximum: 10000, multipleOf: 0.01, nullable: true },
      unpassedCourseCount: { type: 'integer', minimum: 0, maximum: 10000 },
      reasons: { type: 'array', maxItems: 100, items: { type: 'string', maxLength: 1000 } },
      academicIssues: { type: 'array', maxItems: 100, items: { type: 'string', maxLength: 1000 } },
      checkedAt: { type: 'string', format: 'date-time' },
    },
  };
  const response = (description: string) => ({ description });
  spec.paths ??= {};
  spec.paths['/api/ojt-eligibility-results'] = {
    post: {
      tags: ['OJT eligibility'], summary: 'Lưu kết quả xét điều kiện OJT do frontend tính',
      description: 'ADMIN/ACADEMIC. Không cần năm học/kỳ OJT. Lưu kết quả FE theo phiên bản quy định OJT đang áp dụng. Backend từ chối phiên bản cũ và trạng thái không khớp số liệu; không xác nhận quyết định OJT chính thức. Toàn bộ request lưu trong một transaction.',
      security: [{ bearerAuth: [] }],
      requestBody: { required: true, content: { 'application/json': {
        schema: { type: 'object', additionalProperties: false, required: ['idempotencyKey','source','rule','results'], properties: {
          idempotencyKey: { type: 'string', maxLength: 100 }, source: { type: 'string', enum: ['FRONTEND'] },
          rule: { type: 'object', additionalProperties: false, required: ['version','minCredits','maxUnpassedCourses'], properties: { version: { type: 'integer', minimum: 0 }, minCredits: { type: 'number', minimum: 0 }, maxUnpassedCourses: { type: 'integer', minimum: 0 } } },
          results: { type: 'array', minItems: 1, maxItems: 10000, items: result },
        } },
        example: { idempotencyKey: 'fe-ojt-save-unique-key', source: 'FRONTEND', rule: { version: 0, minCredits: 70, maxUnpassedCourses: 2 }, results: [{ studentId: 1, status: 'ELIGIBLE', earnedCredits: 70, unpassedCourseCount: 2, reasons: [], academicIssues: [], checkedAt: '2026-10-27T09:00:00.000Z' }] },
      } } },
      responses: {
        201: { description: 'Đã lưu toàn bộ kết quả (hoặc trả lại request đã lưu).', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object', properties: { batchId: { type: 'integer' }, savedCount: { type: 'integer' }, replayed: { type: 'boolean' } } } } }, example: { success: true, data: { batchId: 1, savedCount: 1, replayed: false } } } } },
        400: response('Payload không hợp lệ hoặc trạng thái không khớp số liệu FE gửi.'), 401: response('Chưa đăng nhập.'),
        403: response('Không có quyền lưu kết quả.'), 409: response('Khóa bị dùng cho payload khác, sinh viên không hoạt động, hoặc dữ liệu đã cũ.'), 413: response('JSON vượt 10 MB.'),
      },
    },
    get: {
      tags: ['OJT eligibility'], summary: 'Lấy kết quả FE đã lưu mới nhất theo sinh viên', security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'studentId', schema: { type: 'integer', minimum: 1 } },
        { in: 'query', name: 'status', schema: { type: 'string', enum: ['ELIGIBLE','NOT_ELIGIBLE','REVIEW_REQUIRED'] } },
        { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1, default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
      ],
      responses: { 200: response('success/data: items, total, page, limit. Mỗi item có kết quả, studentCode/fullName, source, batchId, savedAt, savedBy, isStale.'), 401: response('Chưa đăng nhập.'), 403: response('Không có quyền tra cứu.') },
    },
  };
  const responsePolicy = (description: string) => ({ description });
  spec.paths['/api/ojt-condition-policy'] = {
    get: { tags: ['OJT eligibility'], summary: 'Điều kiện OJT đang áp dụng', security: [{ bearerAuth: [] }], responses: { 200: responsePolicy('Phiên bản, ngưỡng tín chỉ, số môn chưa đạt và người cập nhật.') } },
    post: { tags: ['OJT eligibility'], summary: 'Kiểm tra lại và công bố điều kiện OJT chung', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['minCredits','maxUnpassedCourses','token'], properties: { minCredits: { type: 'number', minimum: 0 }, maxUnpassedCourses: { type: 'integer', minimum: 0 }, token: { type: 'string', minLength: 64, maxLength: 64 } } } } } }, responses: { 201: responsePolicy('Đã lưu phiên bản mới và kích hoạt quy định cho mọi chương trình.'), 409: responsePolicy('Dữ liệu đổi hoặc khung chương trình không đáp ứng.') } },
  };
  spec.paths['/api/ojt-condition-policy/preview'] = { post: { tags: ['OJT eligibility'], summary: 'Đối chiếu điều kiện với các khung chương trình', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['minCredits','maxUnpassedCourses'], properties: { minCredits: { type: 'number', minimum: 0 }, maxUnpassedCourses: { type: 'integer', minimum: 0 } } } } } }, responses: { 200: responsePolicy('Kết quả từng chương trình, trạng thái lưu và token kiểm tra.') } } };
}
