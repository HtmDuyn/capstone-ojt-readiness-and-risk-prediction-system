# Tuyển dụng doanh nghiệp

Chỉ bổ sung code của role ENTERPRISE và SQL trực tiếp trong `backend/DB`. Giữ nguyên route/service của QHDN, sinh viên và luồng nhận ứng viên hiện có. Không có migration riêng, bảng offer, API giữ chỗ hoặc trigger mới tác động lên phân công/chỉ tiêu của các role khác.

Các file riêng của doanh nghiệp nằm trong `backend/src/modules/enterprise`: routes, service hồ sơ/ứng viên/thực tập, cập nhật hồ sơ, service/worker tuyển dụng và OpenAPI. Các helper dùng chung vẫn được import từ module QHDN, không sửa logic của chúng.

## API hiện có sau khi gộp

Tất cả endpoint mới yêu cầu JWT ENTERPRISE. Doanh nghiệp được lấy từ tài khoản; không nhận `companyId` từ client.

| Method | Endpoint | Chức năng |
| --- | --- | --- |
| GET | `/api/enterprise/recruitment/windows` | Đợt đăng tin, hạn và trạng thái mở |
| GET | `/api/enterprise/recruitment/posts` | Tổng hợp tin và toàn bộ chi tiết các vị trí |
| POST | `/api/enterprise/recruitment/posts` | Tạo tin và tự gửi QHDN duyệt |
| PATCH | `/api/enterprise/recruitment/posts/:id` | Sửa tin chưa công bố và tự gửi lại QHDN |

GET posts hỗ trợ `postId`, `positionId`, `windowId`, `status`, `page`, `limit` (tối đa 100). Cùng một endpoint được dùng cho cả danh sách và màn hình chi tiết. Lọc `positionId` chọn tin chứa vị trí đó, vẫn trả toàn bộ vị trí của tin. Không có kết quả thuộc doanh nghiệp hiện tại thì trả danh sách rỗng.

Response có dạng:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 6,
        "windowId": 1,
        "title": "Tuyển Backend Intern",
        "content": "Phát triển hệ thống nội bộ",
        "status": "PENDING_REVIEW",
        "deadlineAt": "2026-12-15T10:00:00.000Z",
        "positions": [
          {
            "id": 6,
            "title": "Backend Intern",
            "description": "Phát triển REST API",
            "requirements": "TypeScript, PostgreSQL",
            "capacity": 5,
            "remainingSlots": 5,
            "status": "CLOSED",
            "location": "TP.HCM",
            "workMode": "HYBRID"
          }
        ]
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20,
    "summary": {
      "totalPosts": 1,
      "totalPositions": 1,
      "totalCapacity": 5,
      "acceptedStudents": 0,
      "remainingSlots": 5
    }
  }
}
```

Mỗi tin còn có thông tin doanh nghiệp, kỳ OJT, phúc lợi, hướng dẫn ứng tuyển, thời gian công bố và kết quả duyệt. `summary` tính trên **toàn bộ kết quả theo bộ lọc**, không chỉ trang hiện tại; vị trí dùng chung nhiều tin chỉ tính một lần.

Đã bỏ các API: GET `/posts/:id`, POST `/posts/:id/submit`, POST `/posts/:id/continue`, GET `/offers` trong nhóm `/api/enterprise/recruitment`.

## Tạo và sửa

Body POST mẫu (thay `windowId` và hạn theo dữ liệu thực):

```json
{
  "windowId": 1,
  "title": "Tuyển Backend Intern",
  "content": "Phát triển hệ thống nội bộ",
  "benefits": "Mentor và hỗ trợ thực tập",
  "applicationInstructions": "Nộp CV trên hệ thống",
  "deadlineAt": "2026-12-15T17:00:00+07:00",
  "positions": [
    {
      "title": "Backend Intern",
      "description": "Phát triển REST API",
      "requirements": "TypeScript, PostgreSQL",
      "capacity": 5,
      "location": "TP.HCM",
      "workMode": "HYBRID"
    }
  ]
}
```

- Một doanh nghiệp có thể đăng nhiều tin, mỗi tin 1–50 vị trí. `workMode`: ONSITE, REMOTE, HYBRID.
- Tạo thành công trả 201, lưu `PENDING_REVIEW` trong cùng transaction với các vị trí. Tin xuất hiện ngay trong hàng chờ QHDN bằng API hiện có; chưa hiển thị cho sinh viên trước khi QHDN công bố. Không gửi email hoặc tạo thông báo ngoài luồng.
- PATCH chỉ gửi các trường cần sửa. Kết quả vẫn là `PENDING_REVIEW`, không cần gọi API gửi duyệt. Khi gửi `positions`, giữ đầy đủ các vị trí cũ kèm `id`; vị trí mới không có `id`.
- Chỉ cho tạo/sửa khi đợt OPEN, đã tới giờ mở và chưa tới hạn. `deadlineAt` phải sau hạn đăng tin của doanh nghiệp và trong học kỳ.
- Tin đã công bố bị khóa sửa. Không xóa vị trí cũ để bảo toàn lịch sử; có thể đặt capacity bằng 0 khi chưa có sinh viên được nhận, nếu tin vẫn còn ít nhất một vị trí có chỉ tiêu dương.
- Chặn giảm capacity xuống thấp hơn số phân công chưa hủy của vị trí. Không sửa vị trí dùng chung với tin khác.

QHDN tiếp tục dùng API mở đợt và duyệt/công bố hiện có, không đổi request/response hoặc quyền.

## Nhận sinh viên và chỉ tiêu

Giữ nguyên API và service hiện có:

```http
PATCH /api/enterprise/candidates/:id/decision
```

```json
{"decision":"ACCEPTED","reason":"Hồ sơ phù hợp"}
```

Không có `confirmBy` hoặc bước giữ chỗ riêng. Doanh nghiệp nhận sinh viên thành công thì luồng hiện tại tạo phân công và cập nhật chỉ tiêu ngay. Gọi lại không tạo thêm phân công. Các kiểm tra đồng thời về chỉ tiêu và nơi thực tập khác dùng transaction/khóa OJT hiện có.

`remainingSlots = max(0, capacity - số phân công chưa bị hủy)`.

## Tự tuyển tiếp vòng sau

Worker trong module doanh nghiệp chạy mỗi 60 giây khi backend đang hoạt động; không cần gọi API, không cần cấu hình cron riêng. Có thể tắt bằng `ENTERPRISE_RECRUITMENT_WORKER_ENABLED=false` khi chạy test.

Worker chỉ xử lý tin được đánh dấu `EnterpriseManaged` từ API tạo/sửa tin doanh nghiệp. Các tin QHDN import có mặc định false và không được sửa tự động.

Tin tự tiếp tục khi:

- Đã được QHDN công bố, chưa lưu trữ và doanh nghiệp còn ACTIVE.
- Đợt cũ đã hết hạn; có đợt OPEN đang trong thời gian nhận tin tiếp theo, cùng kỳ OJT/học kỳ.
- Ít nhất một vị trí còn chỉ tiêu. Không tự tăng capacity hoặc mang tin sang kỳ OJT khác.
- Học kỳ còn khả dụng; tin chưa bị QHDN chủ động đóng, từ chối hoặc đang chờ duyệt.

Giữ nguyên PostID, PositionID, lịch sử ứng tuyển/phân công và phê duyệt đã có. Tin vẫn PUBLISHED; khi chuyển vòng, hạn nhận ứng tuyển được nối đến cuối học kỳ để tiếp tục tuyển các vòng còn lại. Cửa sổ đăng ký của sinh viên vẫn do luồng hiện tại kiểm soát. Nếu chưa có đợt tiếp theo đang mở thì chờ worker lần sau. Tin đóng tự động do hết hạn được phép tiếp tục; tin QHDN chủ động đóng không tự mở lại. Mỗi lần chuyển đợt ghi audit log `ENTERPRISE_AUTO_CONTINUE`.

## DB và kiểm thử

SQL nằm trực tiếp cuối `backend/DB`: cột `RecruitmentPosts.EnterpriseManaged`, index và hàm `AdvanceEnterpriseRecruitment`. Không bổ sung trigger toàn cục lên positions/assignments/windows. Script vẫn là **full reset**, chỉ chạy trên database cần khởi tạo lại; chưa chạy lên database triển khai.

Build:

```sh
npm run build
```

Kiểm thử PostgreSQL dùng DB riêng, có chặn nhầm host/cổng/tên DB; test reset database này bằng chính `backend/DB`:

```powershell
$env:ENTERPRISE_TEST_DATABASE_URL='postgresql://enterprise_test@127.0.0.1:55440/enterprise_recruitment_test'
npm run test:enterprise-recruitment
```

Kiểm tra quyền, cách ly doanh nghiệp, tạo/sửa tự gửi duyệt, GET tổng hợp, API cũ bị gỡ, chỉ tiêu giảm ngay khi nhận, tranh chấp đồng thời, giới hạn giảm capacity, tự chuyển vòng, giữ nguyên dữ liệu tin QHDN import và tôn trọng QHDN chủ động đóng tin.
