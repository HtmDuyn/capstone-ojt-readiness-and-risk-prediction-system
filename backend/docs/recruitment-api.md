# Tuyển dụng và danh sách cho doanh nghiệp

Hợp đồng hiện hành nằm trong Swagger và [tham chiếu đầu vào](api-input-reference.md). FE nhập ID/bộ lọc trong JSON, không dùng query string. JWT xác thực và kiểm tra quyền, không tự điền companyId/studentId còn thiếu.

| API | Đầu vào và chức năng |
|---|---|
| POST /api/json/recruitment/posts/list | companyId bắt buộc với mọi vai trò; postId, windowId, academicPeriodId, status, page, limit là tùy chọn. Trả mọi trạng thái nếu bỏ status, kèm đầy đủ nội dung và vị trí. |
| POST /api/json/enterprise/candidates/list | companyId bắt buộc; studentId, candidateId, positionId, ojtSemesterId, decision, search, page, limit tùy chọn. Hồ sơ sinh viên, doanh nghiệp, học kỳ, vị trí, CV metadata, hồ sơ đăng ký, tin tuyển dụng và thông tin giới thiệu/tiếp nhận. Mặc định lấy lần giới thiệu mới nhất trong doanh nghiệp. |
| POST /api/json/enterprise/internships/list | companyId bắt buộc; studentId, internshipId, positionId, ojtSemesterId, status, search, page, limit tùy chọn. Trả phân công, sinh viên, doanh nghiệp, vị trí, người hướng dẫn, hồ sơ, đánh giá và kết quả thực tập. |
| POST /api/json/internship-tasks/list | ENTERPRISE bắt buộc companyId, STUDENT bắt buộc studentId; Admin/QHDN có thể xem toàn bộ hoặc lọc. Hỗ trợ companyId, studentId, assignmentId, positionId, ojtSemesterId, page, limit. |

Doanh nghiệp chỉ được nhập companyId thuộc tài khoản; sinh viên chỉ được nhập studentId của mình. Thiếu ID bắt buộc hoặc ID sai định dạng trả 400; ID ngoài quyền trả 403. Admin/QHDN chọn doanh nghiệp bằng companyId ở danh sách tin.

Response danh sách giữ phân trang items/total/page/limit. Các quan hệ không tồn tại trả null hoặc mảng rỗng tùy trường, không tạo dữ liệu giả. CV trả metadata, không trả nội dung tệp hay dữ liệu mã hóa trong danh sách.

## Các API đã bỏ

- POST /api/json/recruitment/windows/list và GET /api/recruitment/windows.
- PATCH /api/json/recruitment/posts và PATCH /api/recruitment/posts/:id.
- API tạo tin/vị trí trực tiếp; dữ liệu mới qua import của QHDN.

## Quản trị đợt tuyển

QHDN chọn học kỳ SEMESTER đã có, tạo đợt qua POST /api/recruitment/windows; sửa hoặc mở/đóng bằng PATCH /api/json/recruitment/windows với windowId, reason và status OPEN/CLOSED khi đổi trạng thái. Một học kỳ chỉ có một đợt OPEN. Không dùng đợt tuyển để tạo học kỳ đào tạo mới.

QHDN import tài khoản doanh nghiệp và vị trí qua /api/imports/preview, /api/imports/commit với kind ENTERPRISE, windowId, idempotencyKey và rows. Tin mới chờ duyệt, vị trí chưa mở. QHDN dùng POST /api/json/recruitment/posts/review với postId, decision PUBLISH/REJECT, reason; PUBLISH có thể nhận deadlineAt. Đóng tin bằng POST /api/json/recruitment/posts/close với postId và reason.
