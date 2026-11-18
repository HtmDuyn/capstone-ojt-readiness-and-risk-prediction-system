# Chấm điểm OJT hàng loạt và đồng bộ QHDN

Doanh nghiệp mở **Quản lý thực tập → Đánh giá OJT** (`/enterprise/evaluation`) để chấm trực tiếp trên bảng. Bốn cột điểm gồm kỹ năng chuyên ngành, kỹ năng mềm, thái độ và điểm trung bình. Điểm trung bình là trung bình cộng ba tiêu chí, làm tròn hai chữ số thập phân; chưa đủ ba tiêu chí thì hiển thị `—`. Điểm 0 vẫn hợp lệ.

- `completionScore`: kỹ năng chuyên ngành. Gợi ý bằng số task `DONE`/`COMPLETED` chia tổng task được giao × 10. Chưa có task hoặc tải task thất bại thì không gợi ý điểm. Gợi ý chỉ điền ban đầu cho hồ sơ chưa có đánh giá; không ghi đè bản nháp. Doanh nghiệp được sửa hoặc bấm dùng lại gợi ý, kể cả khi chưa hoàn thành hết task.
- `skillScore`: kỹ năng mềm.
- `attitudeScore`: thái độ.
- `overallScore`: trung bình ba tiêu chí do backend tính. Giữ tên field DB/API hiện có để tương thích dữ liệu cũ.

Chọn sinh viên theo trang hoặc tất cả kết quả lọc, chọn điểm và cột áp dụng (`all`, chuyên ngành, kỹ năng mềm, thái độ), rồi áp dụng. Áp dụng riêng kỹ năng mềm/thái độ giữ nguyên điểm chuyên ngành. Chọn tất cả tiêu chí có thể ghi đè cả chuyên ngành theo lựa chọn của người dùng. Có tìm kiếm, lọc kỳ OJT, trạng thái, phân trang và xem chi tiết task/nhận xét. Chỉnh ô điểm/nhận xét tự chọn dòng đó để lưu; lựa chọn được giữ khi đổi trang.

## Lưu nháp và gửi chính thức

`POST /api/enterprise/internships/evaluations/bulk`:

```json
{
  "status": "DRAFT",
  "confirmed": false,
  "reason": "Lưu nháp đánh giá OJT hàng loạt",
  "items": [
    { "assignmentId": 1, "completionScore": 9, "skillScore": 8, "attitudeScore": null, "comments": null }
  ]
}
```

`DRAFT` cho phép điểm null và có thể chỉnh sửa sau tải lại trang. Lưu trong `InternshipEvaluations` với `EvaluatedAt=null`; không hiển thị điểm nháp ở kết quả/báo cáo/hồ sơ QHDN và không tính là đã đánh giá trên dashboard.

`SUBMITTED` bắt buộc đủ ba tiêu chí và `confirmed=true` sau popup xem lại điểm. Backend kiểm tra thang điểm 0–10, tối đa hai chữ số thập phân, tự tính điểm trung bình và đặt thời điểm gửi. API trả `{success:true,data:{items,saved,status}}`. Một đợt lưu tối đa 300 phân công không trùng, chỉ thuộc doanh nghiệp đang đăng nhập, trạng thái `ACTIVE`/`IN_PROGRESS`/`COMPLETED`. Tất cả điểm và audit lưu trong cùng transaction; lỗi một dòng rollback cả đợt.

Điểm đã gửi bị khóa chỉnh sửa trực tiếp, kể cả gọi lại API chấm đơn. Gửi lại cùng nội dung an toàn và không tạo đánh giá/audit trùng. Endpoint chấm đơn `PUT /api/enterprise/internships/:id/evaluation` được giữ để tương thích, nhưng luôn tự tính trung bình và không cho sửa điểm đã gửi.

## QHDN công bố trực tiếp cho sinh viên và Đào tạo xem kết quả

`GET /api/ojt-results?ojtSemesterId=...` cho QHDN xem các đánh giá doanh nghiệp đã gửi. `SUBMITTED` là chờ công bố, `PUBLISHED` là đã công bố. `id`/`evaluationId` là EvaluationID, `resultId=null`. Cờ `includeUntransferred` cũ được chấp nhận để tương thích; không còn bước chuyển giao.

QHDN công bố từng sinh viên hoặc cả kỳ qua `POST /api/ojt-results/publish` với `ojtSemesterId`, `reason` và `evaluationIds` tùy chọn. Chỉ ADMIN/OJT_COORD được công bố. Notification `OJT_RESULT_PUBLISHED` là bản ghi công bố bền vững. Đồng thời tạo thông báo hệ thống và xếp email nếu sinh viên có email. Sinh viên/tài khoản không hoạt động bị bỏ qua; thiếu email vẫn công bố trên hệ thống. Retry và công bố đồng thời không tạo trùng. Bất kỳ lỗi nào khi ghi thông báo/email/audit sẽ rollback cả đợt.

Sau khi commit:

- Sinh viên đọc ngay điểm, nhận xét và ngày công bố tại `GET /api/students/me/internships`, cả danh sách và chi tiết `resultId=EvaluationID`. Chỉ xem được điểm của mình đã công bố; điểm chưa công bố và bản nháp vẫn ẩn.
- Phòng Đào tạo tiếp tục dùng `GET /api/ojt-results` và API xuất báo cáo hiện có, chỉ nhận điểm đã được QHDN công bố. Backend trả `officialScore=overallScore`, `status=CONFIRMED`, `confirmedAt=publishedAt` để màn hình Đào tạo hiện có đọc được và không hiện thao tác xác nhận. Đây là ánh xạ tương thích khi đọc, không phải một bước xác nhận mới. Bộ lọc CONFIRMED trả điểm đã công bố; bộ lọc chờ xác nhận/điều chỉnh cũ trả danh sách rỗng. Không chỉnh các file giao diện, hook, service, router và type của role Đào tạo.
- QHDN và sinh viên nhận trạng thái PUBLISHED, `publishedAt` và `publishedToStudent=true`. Điểm 0 vẫn được công bố bình thường.
- Dashboard/báo cáo QHDN đếm `total`, `published`, `unpublished` thay cho các bước chuyển giao/xác nhận. CSV/PDF giữ ba tiêu chí, điểm trung bình và ngày công bố.

Đã bỏ API chuyển giao `POST /api/ojt-results` và xác nhận `POST /api/ojt-results/:id/confirm`. Việc công bố không tạo OJTResults hoặc ghi đè StudentCourseResults; Đào tạo xem trực tiếp cùng kết quả doanh nghiệp đã công bố. Không yêu cầu migration/reset DB; dữ liệu học vụ lịch sử được giữ nguyên.

## Kiểm thử

- `frontend`: `npm run test:qhdn`, `npm run test:education`, `npm run build`.
- `backend`: `npm run build`, `node --test tests/swagger-startup.test.cjs tests/qhdn-student-profile.test.cjs`.
- `tests/enterprise-bulk-evaluation.integration.cjs`: DB dùng thử `127.0.0.1:55441/enterprise_evaluation_test`, biến `ENTERPRISE_EVALUATION_TEST_DATABASE_URL`. Kiểm tra API thật: phân quyền, nháp, gửi điểm, công bố, quyền xem sinh viên/Đào tạo trước/sau công bố, điểm 0, retry đồng thời, rollback khi lỗi và không ghi đè điểm học vụ.
- `tests/enterprise-bulk-acceptance.integration.cjs`: DB dùng thử riêng, kiểm tra dashboard, xuất CSV/PDF, công bố và xem điểm sau tiếp nhận.
