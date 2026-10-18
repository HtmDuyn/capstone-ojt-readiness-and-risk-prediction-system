# API doanh nghiệp

Luồng tuyển dụng mới theo học kỳ: xem [đợt nhận nhu cầu, gửi tin và duyệt công bố](recruitment-api.md). Ngoài sáu API theo dõi thực tập dưới đây, doanh nghiệp có thể xem đợt tuyển dụng đang mở, gửi nhu cầu và xem danh sách/chi tiết tin của mình trong nhóm Recruitment.

Nhóm Swagger: **Enterprise**. Tất cả yêu cầu JWT `ENTERPRISE` liên kết với doanh nghiệp ACTIVE qua `EnterpriseUsers`. Không nhận `companyId` từ client. Response: `{success:true,data:...}`.

## Sáu API nghiệp vụ

| Method | Đường dẫn trên Swagger | Body |
|---|---|---|
| GET | `/api/enterprise/profile` | Không có |
| POST | `/api/json/enterprise/candidates/search` | `{}` hoặc `page`, `limit`, `ojtSemesterId`, `positionId`, `decision`, `search` |
| POST | `/api/json/enterprise/candidates/detail` | `candidateId` |
| PATCH | `/api/json/enterprise/candidates/decision` | `candidateId`, `decision`, `reason` |
| POST | `/api/json/enterprise/internships/search` | `{}` hoặc `page`, `limit`, `ojtSemesterId`, `positionId`, `status`, `search` |
| PUT | `/api/json/enterprise/internships/evaluation` | `internshipId`, `completionScore`, `attitudeScore`, `skillScore`, `overallScore`, `reason`; `comments` tùy chọn |

- `candidateId` là `CoordinationID`; `internshipId` là `AssignmentID`.
- Hai danh sách trả `{items,total,page,limit}`; mặc định 20, tối đa 100 phần tử mỗi trang.
- Ứng viên trả thông tin sinh viên, vị trí tuyển dụng, quyết định, lý do từ chối và `isLatestCoordination`. Chi tiết bổ sung `application` chứa thông tin liên hệ/CV. Danh sách lấy lần giới thiệu mới nhất tới doanh nghiệp cho mỗi hồ sơ đăng ký; `isLatestCoordination=false` nghĩa hồ sơ đã chuyển sang doanh nghiệp khác và không còn được quyết định.
- `decision`: `PENDING`, `ACCEPTED`, `REJECTED` khi lọc; chỉ `ACCEPTED` hoặc `REJECTED` khi ghi. Chỉ được quyết định lần điều phối cuối cùng, đúng phạm vi, chưa có quyết định cuối cùng.
- Danh sách thực tập chứa thông tin sinh viên, vị trí, người hướng dẫn doanh nghiệp, ngày bắt đầu/kết thúc, trạng thái, đánh giá hiện có hoặc `null`, `resultStatus` và `evaluationLocked`. Không cần gọi API chi tiết vị trí, phân công hay đánh giá riêng.
- Điểm đánh giá từ 0–10, tối đa hai chữ số thập phân. Chỉ đánh giá phân công ACTIVE/IN_PROGRESS/COMPLETED. Kết quả đã CONFIRMED khóa đánh giá. Các quy tắc nghiệp vụ/audit được dùng chung với QHDN.
- Đường dẫn REST gốc `/api/enterprise/candidates`, `/api/enterprise/candidates/:id`, `/api/enterprise/candidates/:id/decision`, `/api/enterprise/internships`, `/api/enterprise/internships/:id/evaluation` là đích dispatch của JSON adapter.

## Các API dư đã bỏ khỏi quyền doanh nghiệp

Các API companies/positions/ojt-coordinations/assignments/internship-evaluations cũ và JSON adapter tương ứng chỉ còn phục vụ ADMIN/OJT_COORD. Doanh nghiệp gọi chúng nhận 403; không có alias tương thích cho quyền ENTERPRISE.

`/api/accounts/:userId` GET/PUT (và JSON adapter) không còn cho ENTERPRISE. Dùng GET/PATCH `/api/accounts/me/profile` để xem/sửa hồ sơ cá nhân. Auth và hồ sơ cá nhân nằm trong các nhóm dùng chung, không lặp trong Enterprise.
