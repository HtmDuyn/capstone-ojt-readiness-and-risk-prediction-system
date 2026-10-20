# Gộp bốn API detail vào list

Các API GET gốc và POST JSON `/detail` dưới đây đã xóa. Swagger còn 156 API, năm API detail phục vụ chức năng riêng. Không thay đổi DB hoặc các API ghi.

| API đã xóa | API thay thế | Trường chọn hồ sơ |
| --- | --- | --- |
| POST /api/json/ojt-registrations/detail | POST /api/json/ojt-registrations/list | registrationId |
| POST /api/json/ojt-results/detail | POST /api/json/ojt-results/list | resultId |
| POST /api/json/academic-imports/detail | POST /api/json/academic-imports/list | importId (chuỗi bigint) |
| POST /api/json/predictions/detail | POST /api/json/predictions/list | predictionId |

Không có ID: danh sách thông thường, không tải thêm phần chi tiết. Có ID: hồ sơ nằm trong `data.items`, không đổi thành object đơn. ID không tồn tại hoặc không khớp bộ lọc trả `items: []`, `total: 0`. Các bộ lọc tiếp tục kết hợp AND.

## Hồ sơ đăng ký OJT

```json
{
  "registrationId": 1,
  "page": 1,
  "limit": 20,
  "historyPage": 1,
  "historyLimit": 20,
  "coordinationPage": 1,
  "coordinationLimit": 20,
  "assignmentPage": 1,
  "assignmentLimit": 20
}
```

Hồ sơ được chọn có thêm officialEligibility (kiểm tra hiệu lực theo dữ liệu hiện tại), handoffSnapshot, history/historyPagination, coordination/coordinationPagination, assignments/assignmentsPagination. Giữ các trường cũ của chi tiết, bổ sung tên người thao tác và context liên quan. Lịch sử và điều phối/phân công sắp xếp mới nhất trước.

Giữ quyền của API detail cũ: sinh viên chỉ xem hồ sơ của mình; QHDN chỉ được chọn hồ sơ đã bàn giao. Chọn một registrationId tồn tại nhưng không có quyền trả 403, kể cả bộ lọc khác không khớp. API qhdn/registered-students/list riêng vẫn cho QHDN chỉ đọc sinh viên đã đăng ký trước bàn giao.

## Kết quả OJT

```json
{
  "resultId": 1,
  "historyPage": 1,
  "historyLimit": 20
}
```

Phần hồ sơ, dossier, source, điểm/kết quả chính thức, thông tin xác nhận và quy đổi vẫn được trả như danh sách hiện tại. Có resultId thì bổ sung history/historyPagination, mới nhất trước. Chỉ Admin/Đào tạo/QHDN; không mở quyền cho Sinh viên/Doanh nghiệp. Export hiện có không nhận các tham số lịch sử và không tải lịch sử.

## Dòng và lỗi import

```json
{
  "importId": "1",
  "rowsPage": 1,
  "rowsLimit": 20
}
```

Mỗi item có rows (rowNumber/rawData/normalizedData/status/errors/resultId) và rowsPagination. Phân trang ngoài tính theo batch; rowsPagination tính theo dòng của batch. Ví dụ batch có 500 dòng thì data.total vẫn là 1 khi chọn importId, rowsPagination.total là 500. Sang trang dòng ngoài phạm vi trả rows rỗng, giữ tổng số dòng.

ID batch và sourceAccountBatchId dùng chuỗi bigint để giữ đúng giá trị 64 bit; tránh ép sang JavaScript Number. Admin/Đào tạo được đọc, QHDN và Sinh viên không được gọi.

## Dự đoán

```json
{
  "predictionId": 1
}
```

Khi chọn predictionId, item có thêm inputSnapshot, giữ modelSnapshot và các điểm/readiness/risk/factors hiện tại. Danh sách thường không tải inputSnapshot. Chỉ Admin.

## Quy tắc phân trang và tích hợp

- page/limit bên ngoài luôn áp dụng cho danh sách hồ sơ/batch/dự đoán.
- historyPage/historyLimit, coordinationPage/coordinationLimit, assignmentPage/assignmentLimit hoặc rowsPage/rowsLimit áp dụng độc lập cho phần chi tiết; mặc định trang 1, giới hạn 20, tối đa 100.
- Tham số phân trang chi tiết yêu cầu ID tương ứng; gửi riêng historyPage hay rowsPage mà thiếu ID trả 400. Giá trị ID/phân trang sai hoặc vượt phạm vi cho phép trả 400.
- Khi page bên ngoài vượt phạm vi, items rỗng và total vẫn giữ đúng số hồ sơ khớp.
- FE thay call detail bằng list kèm ID, lấy hồ sơ qua response.data.data.items[0] nếu dùng Axios. Cần xử lý mảng rỗng và 403. Checkout frontend hiện tại chưa có lời gọi bốn URL detail này.
- Các lần đọc dùng transaction chỉ đọc và cùng snapshot; không tạo event, không chạy xét/lưu kết quả mới, không mở quyền duyệt/điều phối và không trả file CV nhị phân trong JSON.

## Kiểm chứng

Build và sinh tài liệu API thành công. Đối chiếu với response từ bốn hàm detail cũ trên schema fixture riêng: giữ dữ liệu hồ sơ, snapshot, lịch sử, dòng/lỗi import và inputSnapshot. Kiểm tra phân trang độc lập, trang rỗng/tổng số, bộ lọc AND, ID import vượt 2^53, đầu vào sai, quyền sở hữu, chặn QHDN trước bàn giao và export OJT hiện có. Các URL detail JSON và GET gốc đã trả 404. Hash dữ liệu nghiệp vụ trước/sau các lần đọc giống nhau; schema và script fixture đã được xóa sau kiểm tra.
