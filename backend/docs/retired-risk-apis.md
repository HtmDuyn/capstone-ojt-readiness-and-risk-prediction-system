# Gỡ cơ chế dự đoán rủi ro OJT cũ

Điều kiện đi OJT do backend tính theo ít nhất 70 tín chỉ và tối đa 2 môn còn nợ. `POST /api/eligibility-check-runs` cập nhật trạng thái theo kỳ và trả kết quả trực tiếp. AI tư vấn bên ngoài có thể được tích hợp riêng sau này.

Đã gỡ route và Swagger của nhóm dự đoán cũ, bao gồm alias `/api/json/...` sinh ra từ các route này:

- Tạo tác vụ, xem tiến độ, lịch sử dự đoán và danh sách mô hình.
- `GET /api/alerts`.
- `PATCH /api/alerts/{id}/status`.
- `POST /api/alerts/{id}/interventions`.
- `GET /api/students/{id}/interventions`.
- `PATCH /api/interventions/{id}`.
- `GET /api/admin/reports/readiness`.
- `GET /api/admin/reports/export`.
- `GET /api/student/risk-prediction`.

Worker dự đoán đã gỡ khỏi server. Hồ sơ sinh viên không còn trả trường `forecast` từ mô hình cũ. Không xóa bảng hoặc dữ liệu lịch sử trong DB.

`POST /api/admin/dashboard` chỉ trả thống kê nghiệp vụ:

```json
{
  "success": true,
  "data": {
    "summary": {
      "scope": "ALL_SYSTEM",
      "accounts": 100,
      "activeAccounts": 90,
      "students": 80,
      "companies": 10,
      "ojtSemesters": 2
    }
  }
}
```

Nhận `{}` hoặc `{"section":"summary"}`; `section=all` vẫn tương đương tổng quan. Các bộ lọc hoặc section dự đoán cũ bị từ chối.

Giữ cảnh báo học vụ `/api/academic/alerts`, thông báo học vụ, lịch sử xét điều kiện và các chức năng thực tập. API AI gợi ý lộ trình `/api/student/roadmap-recommendations` là chức năng riêng và không bị gỡ trong thay đổi này.
