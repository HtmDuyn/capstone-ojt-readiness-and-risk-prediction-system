/**
 * @swagger
 * /api/qhdn/eligible-students:
 *   get:
 *     tags: [Phòng QHDN]
 *     summary: Danh sách sinh viên đủ điều kiện OJT Đào tạo đã bàn giao
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: ojtSemesterId, required: true, schema: { type: integer, minimum: 1 } }
 *       - { in: query, name: handoffId, schema: { type: integer, minimum: 1 } }
 *       - { in: query, name: studentId, schema: { type: integer, minimum: 1 } }
 *       - { in: query, name: programId, schema: { type: integer, minimum: 1 } }
 *       - { in: query, name: cohortId, schema: { type: integer, minimum: 1 } }
 *       - { in: query, name: groupCode, schema: { type: string, enum: [A, B, C, D] } }
 *       - { in: query, name: search, schema: { type: string, maxLength: 100 } }
 *       - { in: query, name: registrationStatus, schema: { type: string, enum: [NOT_REGISTERED, SUBMITTED, APPROVED, REJECTED, LEGACY_REVIEW_REQUIRED] } }
 *       - { in: query, name: page, schema: { type: integer, minimum: 1, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 100, default: 20 } }
 *     responses:
 *       200: { description: Danh sách bàn giao và kết quả đủ điều kiện tại thời điểm bàn giao. }
 *       400: { description: Thiếu kỳ hoặc bộ lọc không hợp lệ. }
 *       401: { description: Chưa đăng nhập. }
 *       403: { description: Chỉ Admin hoặc QHDN. }
 *       404: { description: Không tìm thấy kỳ. }
 */
