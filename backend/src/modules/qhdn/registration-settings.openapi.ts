/**
 * @swagger
 * /api/qhdn/ojt-semesters/{id}/registration-settings:
 *   put:
 *     tags: [Phòng QHDN]
 *     summary: Cấu hình, mở, đóng hoặc gia hạn đăng ký OJT theo kỳ có sẵn
 *     description: Chỉ OJT_COORD. Tạo cấu hình nếu chưa có; không tạo kỳ học hoặc nộp hồ sơ thay sinh viên. Khi tạo mới phải có startsAt và endsAt. Mặc định OPEN khi tạo, hoặc giữ trạng thái hiện có khi cập nhật. OPEN yêu cầu sinh viên đã bàn giao trong phạm vi và hạn còn hiệu lực. Sau công bố chỉ được giữ ngày mở và gia hạn ngày đóng. Nhiều cấu hình cũ cùng kỳ trả 409 để đối soát, không tự chọn hoặc xóa lịch sử.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1, maximum: 2147483647 }
 *         description: OJTSemesterID của kỳ do Đào tạo tạo.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             required: [reason]
 *             properties:
 *               name: { type: string, maxLength: 150 }
 *               startsAt: { type: string, format: date-time, description: Bắt buộc khi tạo lần đầu; timestamp có giây và múi giờ. }
 *               endsAt: { type: string, format: date-time, description: Bắt buộc khi tạo lần đầu; gửi hạn mới để gia hạn. }
 *               status: { type: string, enum: [DRAFT, OPEN, CLOSED] }
 *               reason: { type: string, minLength: 1, maxLength: 2000 }
 *           examples:
 *             close:
 *               summary: Đóng đăng ký
 *               value: { status: CLOSED, reason: Đóng đăng ký theo kế hoạch }
 *     responses:
 *       200:
 *         description: Cấu hình đã lưu; data có id, ojtSemesterId, status, effectiveStatus (DRAFT/SCHEDULED/OPEN/EXPIRED/CLOSED), startsAt, endsAt và replayed.
 *       400: { description: Dữ liệu không hợp lệ }
 *       401: { description: Chưa đăng nhập }
 *       403: { description: Chỉ QHDN được dùng API này }
 *       404: { description: Không tìm thấy kỳ }
 *       409: { description: Chưa bàn giao sinh viên, hết hạn, kỳ đóng, thay ngày mở sau công bố hoặc nhiều cấu hình cũ cần đối soát }
 */
