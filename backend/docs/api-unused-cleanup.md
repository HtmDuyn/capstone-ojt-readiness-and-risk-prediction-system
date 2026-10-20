# API đã xóa theo luồng hiện tại

Rà soát ngày 19/10/2026. Swagger giảm từ 151 xuống 149 chức năng, vẫn đủ sáu nhóm. Danh sách đầy đủ: [swagger-api-by-role.md](swagger-api-by-role.md).

| API JSON đã xóa | Native route đã xóa | Thay thế |
|---|---|---|
| POST /api/json/curricula/publish | POST /api/curricula/{id}/publish | POST /api/curriculum-imports/commit tự kiểm tra và công bố PUBLISHED khi import hợp lệ. Bản nháp cũ phải import lại; không còn bước publish riêng. |
| POST /api/json/students/academic-progress/search | GET /api/students/{id}/academic-progress | POST /api/json/students/detail với studentId, section: academicProgress; đọc data.academicProgress. |

Ví dụ đọc riêng tiến độ qua API hồ sơ:

```json
{"studentId":7,"section":"academicProgress"}
```

Response vẫn có success/data. data chứa thông tin sinh viên và academicProgress, không truy vấn bảng điểm/lịch sử đăng ký OJT. Trước đây endpoint tiến độ trả trực tiếp data là tiến độ; FE dùng URL cũ cần đổi sang data.academicProgress. Bỏ section hoặc dùng all giữ hồ sơ đầy đủ hiện có. Các trường phân trang cũ không đổi; quyền ADMIN/ACADEMIC/STUDENT và kiểm tra sinh viên sở hữu hồ sơ giữ nguyên.

Đã xóa route, adapter sinh từ Swagger, OpenAPI operation, quyền khai báo và hai hàm bọc không còn caller. Giữ publicationIssues/publicationIssuesForData để import kiểm tra dữ liệu; giữ academicProgressWithClient/calculateProgress để tính tiến độ, xét điều kiện, báo cáo và hồ sơ sinh viên.

## Phần còn lại được giữ

Đối chiếu danh sách Swagger, các route và nhánh xử lý theo role: không coi native route nguồn của adapter JSON là chức năng dư. Các handler trùng URL của Admin và QHDN được chọn theo role, không xóa nhầm một phía.

- Cấu hình học kỳ, chương trình import, quy tắc OJT và xác nhận điều kiện phục vụ các bước khác nhau. Publish quy tắc OJT và template đánh giá không phải publish khung chương trình.
- Danh mục môn/chuyên ngành vẫn cần để import đối chiếu mã; sửa danh mục không phải sửa khung.
- Đợt xét chính thức sau Block 3, đợt đăng ký OJT, đợt chọn combo và đợt tuyển dụng doanh nghiệp có phạm vi và điều kiện khác nhau.
- QHDN xem sinh viên đăng ký trước bàn giao khác danh sách được phép điều phối sau bàn giao; giữ cả hai và các kiểm tra quyền.
- Duyệt, bàn giao, tiếp nhận/từ chối, phân công và xác nhận kết quả tạo các mốc nghiệp vụ/audit khác nhau. Không xóa vì cùng sửa một hồ sơ.
- Course-results/list vẫn có bộ lọc riêng; profile chỉ nhúng điểm phân trang nên chưa thay thế đầy đủ. Lịch sử lựa chọn combo, các detail còn lại và kết quả xét chính thức vẫn có dữ liệu riêng.
- Dashboard, báo cáo và export có phép tổng hợp/phạm vi/định dạng riêng; không coi là dư chỉ vì cùng nguồn dữ liệu.

FE ở checkout hiện tại chỉ gọi auth/login và auth/me; không tìm thấy caller hai API đã xóa. Điều này không chứng minh các API nghiệp vụ khác không cần dùng, cũng không bao gồm các nhánh FE chưa checkout hoặc bản triển khai khác. Không có telemetry truy cập để kết luận API không được sử dụng trong thực tế.

## Kiểm tra

- Build backend và sinh tài liệu thành công: 149 operations, 143 request bodies.
- HTTP: cả bốn URL native/JSON đã xóa trả 404; API hồ sơ giữ yêu cầu xác thực.
- Service với persistence giả lập: section academicProgress trả cùng tiến độ với hồ sơ đầy đủ, bỏ truy vấn lịch sử; section không hợp lệ trả 400, truy cập hồ sơ người khác trả 403.
- Không sửa FE, không thay đổi DB đang chạy và không tạo thêm file test.
