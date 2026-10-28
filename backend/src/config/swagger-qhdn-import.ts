type Spec = Record<string, any>;

// Apply after academic REST replacements: only these two existing endpoints
// belong exclusively to QHDN. Student/academic import schemas are untouched.
export function describeQhdnImport(spec: Spec): Spec {
  const windows = spec.paths['/api/ojt-registration-windows']?.get;
  if (windows) windows.description = [windows.description, 'Chỉ projection QHDN bổ sung effectiveStatus DRAFT/SCHEDULED/OPEN/EXPIRED/CLOSED; contract Student/Admin giữ nguyên.'].filter(Boolean).join(' ');
  const id = { type: 'integer', minimum: 1, maximum: 2147483647 };
  const position = { type: 'object', required: ['code', 'title', 'description', 'requirements', 'capacity'], properties: {
    code: { type: 'string', maxLength: 60 }, title: { type: 'string', maxLength: 150 }, description: { type: 'string', maxLength: 10000 },
    requirements: { type: 'string', maxLength: 10000 }, capacity: { ...id },
  } };
  const row = { type: 'object', required: ['code', 'email', 'fullName', 'name', 'positions'], properties: {
    code: { type: 'string', maxLength: 20 }, email: { type: 'string', format: 'email' }, fullName: { type: 'string', maxLength: 150 },
    name: { type: 'string', maxLength: 200 }, address: { type: 'string', maxLength: 300 }, positions: { type: 'array', minItems: 1, maxItems: 50, items: position },
  } };
  for (const action of ['preview', 'commit']) {
    const operation = spec.paths['/api/imports/' + action]?.post;
    if (!operation) continue;
    operation.tags = ['Phòng QHDN'];
    operation['x-roles'] = ['OJT_COORD'];
    operation.summary = action === 'preview' ? 'Kiểm tra import doanh nghiệp theo kỳ' : 'Import và công bố tuyển dụng theo kỳ';
    operation.description = 'Chỉ QHDN. Chọn ojtSemesterId của kỳ có sẵn; không dùng windowId hoặc tạo đợt tuyển dụng. Preview không ghi dữ liệu. Commit tự công bố tin PUBLISHED và vị trí OPEN trong cùng transaction; không cần API duyệt/đóng riêng. Tái sử dụng tài khoản doanh nghiệp đã có. Hạn mặc định lấy từ cấu hình đăng ký OJT của kỳ, nếu chưa có lấy cuối ngày RegEndDate hoặc EndDate của kỳ. Excel/CSV: mỗi dòng một vị trí, gom theo mã và email doanh nghiệp; bỏ qua cột nguồn/ghi chú. Tối đa 8 MiB, 5000 dòng, 500 doanh nghiệp và 50 vị trí/doanh nghiệp.';
    operation.description += ' Ô trống ở address được chuẩn hóa thành thiếu dữ liệu; ô bắt buộc trống bị báo lỗi. Chỉ đọc các cột được khai báo/mapping; cột nguồn/ghi chú và cột khác bị bỏ qua, không lưu hoặc tải URL. Vị trí có hiệu lực tối đa 5 tháng lịch từ commit, hết hạn chuyển ARCHIVED và giữ lịch sử/điểm; tài khoản doanh nghiệp được giữ. Hạn ứng tuyển không vượt expiresAt, kể cả khi gia hạn đăng ký. Kỳ mới bổ sung vị trí/chỉ tiêu riêng, không ghi đè kỳ cũ. DB hiện chỉ cho một lô ENTERPRISE mỗi kỳ; lô khác cùng kỳ trả 409 SEMESTER_ALREADY_IMPORTED.';
    operation.responses ??= {};
    operation.responses['200'] = { description: 'Kết quả kiểm tra/import theo kỳ và trạng thái tài khoản, vị trí.', content: { 'application/json': { schema: {
      type: 'object', properties: {
        success: { type: 'boolean' }, ojtSemesterId: id, replayed: { type: 'boolean' }, preview: { type: 'boolean' },
        importedAt: { type: 'string', format: 'date-time', description: 'Preview là thời điểm dự kiến; commit bắt đầu thời hạn lưu trữ.' },
        expiresAt: { type: 'string', format: 'date-time' }, deadlineAt: { type: 'string', format: 'date-time' }, retentionMonths: { type: 'integer', enum: [5] },
        publicationStatus: { type: 'string', enum: ['PUBLISHED', 'CLOSED', 'ARCHIVED', 'MIXED'] },
        rows: { type: 'array', items: { type: 'object', properties: {
          code: { type: 'string' }, action: { type: 'string', enum: ['CREATED', 'UPDATED'] },
          accountStatus: { type: 'string', enum: ['CREATED', 'REUSED'] }, recruitmentStatus: { type: 'string', enum: ['POSITIONS_ADDED'] },
          positionStatus: { type: 'string', description: 'OPEN khi thêm mới; replay trả trạng thái hiện tại hoặc MIXED.' },
          enterpriseId: { ...id, nullable: true }, positionCount: { type: 'integer' },
          positions: { type: 'array', items: { type: 'object', properties: { positionId: { ...id, nullable: true }, code: { type: 'string' }, capacity: id, status: { type: 'string' } } } },
        } } },
      },
    } } } };
    operation.requestBody = { required: true, content: {
      'application/json': { schema: { type: 'object', additionalProperties: false, required: ['kind', 'ojtSemesterId', 'idempotencyKey', 'rows'], properties: {
        kind: { type: 'string', enum: ['ENTERPRISE'] }, ojtSemesterId: id, idempotencyKey: { type: 'string', maxLength: 100 }, rows: { type: 'array', minItems: 1, maxItems: 500, items: row },
      } } },
      'multipart/form-data': { schema: { type: 'object', required: ['kind', 'ojtSemesterId', 'idempotencyKey', 'file'], properties: {
        kind: { type: 'string', enum: ['ENTERPRISE'] }, ojtSemesterId: id, idempotencyKey: { type: 'string', maxLength: 100 },
        file: { type: 'string', format: 'binary' }, mapping: { type: 'string', description: 'JSON map tên trường chuẩn sang tiêu đề cột; tùy chọn.' },
      } } },
    } };
  }
  return spec;
}
