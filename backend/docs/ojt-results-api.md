# Xác nhận kết quả OJT

> Cập nhật G01–G05: xem [cấu hình kỳ đăng ký, lịch combo, preview, mốc xét và đồng bộ điểm OJT](academic-workflow-gaps.md). Các ràng buộc mới này được áp dụng cùng các API bên dưới.

Base URL: `/api`. Gửi `Authorization: Bearer <accessToken>`. JSON thành công: `{ "success": true, "data": ... }`.

## Vai trò và luồng xử lý

- `ACADEMIC`, `ADMIN`: xem, yêu cầu bổ sung, nhập điểm/kết luận và xác nhận.
- `OJT_COORD`, `ADMIN`: chuyển/nộp lại hồ sơ; xem và xuất kết quả.
- `STUDENT`, `ENTERPRISE`: không truy cập các API xét duyệt này.

`PENDING_ACADEMIC_CONFIRMATION → REVISION_REQUESTED → PENDING_ACADEMIC_CONFIRMATION → CONFIRMED`.

Mỗi sinh viên chỉ có một kết quả chính thức trong một kỳ OJT. Kết quả gắn với assignment và phải khớp sinh viên, đăng ký, kỳ, doanh nghiệp, vị trí. Assignment bị hủy hoặc chưa có đánh giá với `OverallScore` không được chuyển. Điểm đánh giá có giá trị từ 0 đến 10.

Mỗi lần chuyển lưu bản chụp đánh giá và hồ sơ; mỗi thao tác lưu phiên bản, người thực hiện, thời điểm và lý do. Nếu đánh giá hoặc thông tin assignment thay đổi sau khi chuyển, phòng đào tạo phải yêu cầu bổ sung và QHDN chuyển lại trước khi nhập/xác nhận điểm. Kết quả đã xác nhận và lịch sử không được sửa/xóa.

## API

| Method | URL | Sử dụng |
| --- | --- | --- |
| GET | `/ojt-results` | Lọc `status`, `ojtSemesterId`, `studentId`, `search`; `page=1`, `limit=20`, tối đa 100 |
| GET | `/ojt-results/:id` | Hồ sơ, bản chụp đánh giá, điểm chính thức, lịch sử đầy đủ |
| POST | `/ojt-results/:id/revision-requests` | Yêu cầu QHDN bổ sung; xóa điểm/kết luận đang dự thảo |
| PATCH | `/ojt-results/:id` | Nhập điểm chính thức và kết luận |
| POST | `/ojt-results/:id/confirm` | Chốt kết quả chính thức và trạng thái assignment |
| GET | `/ojt-semesters/:id/results/export` | CSV mặc định; `format=json` trả JSON. Lọc `status`, `studentId`, `search` |
| POST | `/ojt-results` | QHDN chuyển kết quả lần đầu |
| POST | `/ojt-results/:id/transfer` | QHDN nộp lại hồ sơ đang yêu cầu bổ sung |

Xuất báo cáo bao gồm mọi trạng thái nếu không truyền `status`; dùng `status=CONFIRMED` để lấy kết quả chính thức. Không phân trang khi xuất; giới hạn 10.000 kết quả và chống công thức CSV trong dữ liệu văn bản. Kỳ không tồn tại trả 404.

## JSON để gọi API

QHDN chuyển kết quả: `POST /ojt-results`

```json
{
  "assignmentId": 12,
  "dossier": {
    "summary": "Đã nhận đánh giá doanh nghiệp và báo cáo OJT",
    "documents": [
      { "name": "Báo cáo OJT đã ký", "url": "https://files.example.edu.vn/ojt/report.pdf" }
    ]
  },
  "reason": "Chuyển kết quả cho phòng đào tạo",
  "idempotencyKey": "ojt-result-assignment-12-v1"
}
```

`dossier.summary` bắt buộc, tối đa 5.000 ký tự; 1–20 tài liệu, tên tối đa 200 ký tự, URL HTTP(S) tối đa 2.000 ký tự, không chứa tài khoản/mật khẩu trong URL. Backend lưu đường dẫn, không tải tài liệu. Không có dữ liệu hồ sơ/điểm tạo sẵn.

Nhập điểm: `PATCH /ojt-results/1`

```json
{
  "expectedVersion": 1,
  "officialScore": 8.5,
  "outcome": "PASSED",
  "academicNote": "Hồ sơ và đánh giá đầy đủ",
  "reason": "Chốt điểm theo biên bản phòng đào tạo"
}
```

`officialScore` và `outcome` bắt buộc khi PATCH; điểm 0–10, tối đa 2 chữ số thập phân; kết luận `PASSED` hoặc `FAILED`. Hệ thống không tự đặt ngưỡng đạt, trọng số hoặc quy đổi GPA. Điểm/kết luận được lưu ở kết quả OJT; API này chưa tự tạo `StudentCourseResults`, vì chưa có cấu hình ánh xạ môn OJT và quy đổi điểm.

Yêu cầu bổ sung: `POST /ojt-results/1/revision-requests`

```json
{
  "expectedVersion": 2,
  "reason": "Bổ sung báo cáo có chữ ký người hướng dẫn"
}
```

QHDN nộp lại: `POST /ojt-results/1/transfer`

```json
{
  "expectedVersion": 3,
  "dossier": {
    "summary": "Đã bổ sung chữ ký",
    "documents": [
      { "name": "Báo cáo đã bổ sung", "url": "https://files.example.edu.vn/ojt/report-signed.pdf" }
    ]
  },
  "reason": "Bổ sung theo yêu cầu phòng đào tạo",
  "idempotencyKey": "ojt-result-1-resubmit-v3"
}
```

Sau khi nộp lại, phòng đào tạo nhập lại điểm, lấy `version` mới từ phản hồi để xác nhận: `POST /ojt-results/1/confirm`

```json
{
  "expectedVersion": 5,
  "reason": "Xác nhận theo hồ sơ đã bổ sung"
}
```

Xác nhận yêu cầu điểm/kết luận đã nhập và nguồn đánh giá không thay đổi. `PASSED` đặt assignment thành `COMPLETED`; `FAILED` đặt assignment thành `FAILED` và vẫn chốt kết quả chính thức. Cả hai đều đặt kết quả thành `CONFIRMED`. Mọi thao tác ghi bắt buộc lý do và tăng `version`; dùng phiên bản cũ trả 409 để tránh ghi đè. Gửi lại xác nhận sau khi đã chốt trả 409.

API chuyển/nộp lại có `idempotencyKey` bắt buộc, tối đa 100 ký tự; cùng người, cùng key và nội dung trả bản chụp lần chuyển trước với `replayed: true`. Key dùng cho nội dung khác trả 409. Phản hồi replay có thể là phiên bản cũ: gọi GET để xem trạng thái hiện tại.

## Database

Schema tập trung ở `backend/DB`, section `20261008 official OJT results`; hai bảng `OJTResults`, `OJTResultEvents`, migration version `20261008_ojt_results`. Các bảng có RLS và thu hồi quyền truy cập trực tiếp của `anon`/`authenticated`; backend kiểm tra vai trò và điều kiện nghiệp vụ. Không chạy toàn bộ `DB` trên dữ liệu cần giữ vì phần đầu là reset schema.

Lỗi nghiệp vụ thường gặp: `OJT_RESULT_VERSION_CONFLICT`, `OJT_EVALUATION_REQUIRED`, `OJT_RESULT_CONTEXT_MISMATCH`, `OJT_RESULT_SOURCE_CHANGED`, `OJT_RESULT_REVISION_PENDING`, `OJT_OFFICIAL_RESULT_REQUIRED`, `OJT_RESULT_CONFIRMED` (409); dữ liệu không hợp lệ (400), sai vai trò (403), bản ghi không tồn tại (404).
