export function describeJobExtraction(spec: Record<string, any>) {
  const id = { type: 'integer', minimum: 1 };
  const status = { type: 'string', enum: ['NOT_ANALYZED', 'NOT_ELIGIBLE', 'PENDING', 'PROCESSING', 'READY', 'FAILED', 'STALE'] };
  const result = { description: 'Trạng thái của đúng phiên bản nội dung và model hiện tại.', content: { 'application/json': { schema: {
    type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object', properties: {
      postId: id, id: { type: 'string', nullable: true }, status, sourceHash: { type: 'string' },
      schemaVersion: { type: 'string' }, model: { type: 'string' }, attempts: { type: 'integer' },
      usableForMatching: { type: 'boolean' }, errorCode: { type: 'string', nullable: true },
      updatedAt: { type: 'string', format: 'date-time', nullable: true }, nextAttemptAt: { type: 'string', format: 'date-time', nullable: true },
      profile: { type: 'object', nullable: true, description: 'positions[]: positionId, title, location, workMode, responsibilities[], requirements[], benefits[]. Mỗi mục có evidence.field và evidence.quote; requirements có name, category, importance (REQUIRED/PREFERRED/UNSPECIFIED).', additionalProperties: true },
    } } },
  } } } };
  const base = { tags: ['Phòng QHDN'], 'x-roles': ['ADMIN', 'OJT_COORD'], security: [{ bearerAuth: [] }],
    parameters: [{ in: 'path', name: 'postId', required: true, schema: id }],
    responses: { 400: { description: 'ID/body/query không hợp lệ' }, 401: { description: 'Cần đăng nhập' },
      403: { description: 'Chỉ ADMIN hoặc OJT_COORD' }, 404: { description: 'Không tìm thấy tin' },
      409: { description: 'Tin chưa công bố, hết hạn hoặc không còn vị trí tuyển dụng' },
      503: { description: 'Chưa cài SQL hoặc cấu hình Claude' } },
  };
  spec.paths['/api/recruitment-extractions/{postId}'] = { get: { ...base,
    summary: 'Xem kết quả đọc ngầm tin tuyển dụng (quản trị)',
    description: 'Không có giao diện doanh nghiệp. Tin thay đổi sẽ không trả kết quả cũ. READY chỉ biểu thị dữ liệu trích xuất đã qua kiểm tra cấu trúc và đoạn trích; chưa thực hiện matching, không bảo đảm suy diễn của AI chính xác. NOT_ELIGIBLE khi tin không còn đang tuyển. Không gọi AI khi GET.',
    responses: { ...base.responses, 200: result },
  } };
  spec.paths['/api/recruitment-extractions/{postId}/analyze'] = { post: { ...base,
    summary: 'Đưa tin vào hàng đợi đọc / thử lại (Swagger)',
    description: 'Worker tự quét các tin EnterpriseManaged đã công bố và chưa hết hạn mỗi 15 giây, một tin mỗi lượt. Endpoint này hỗ trợ kiểm tra/thử lại, không cần sửa API đăng tin. No request body is needed; provide only postId in the path. READY/PROCESSING được giữ nguyên để không gọi trùng; FAILED/STALE được đưa lại PENDING. Bật RECRUITMENT_CLAUDE_ENABLED=true; dùng ANTHROPIC_API_KEY và CLAUDE_RECRUITMENT_MODEL (fallback CLAUDE_CV_MODEL). Chạy backend/DB (RECRUITMENT EXTRACTION V1 only; do not run the full reset) trên DB hiện có. Sau 202, GET cùng postId tới READY hoặc FAILED; lỗi tự thử lại tối đa 5 lượt, cách 5 phút. Không chạy Cohere Rerank ở bước này.',
    responses: { ...base.responses, 202: result },
  } };
  return spec;
}
