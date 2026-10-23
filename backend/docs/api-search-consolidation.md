# Gộp sáu cặp search/detail

Backend còn 176 API trên Swagger. Sáu operation detail đã bị xóa cả route gốc lẫn adapter JSON. API search trả hồ sơ đầy đủ và hỗ trợ lọc đúng một ID; không cần gọi detail tiếp theo.

| POST đã xóa | POST giữ lại | Trường lọc |
| --- | --- | --- |
| `/api/json/companies/detail` | `/api/json/companies/list` | companyId |
| `/api/json/positions/detail` | `/api/json/positions/list` | positionId |
| `/api/json/assignments/detail` | `/api/json/assignments/list` | assignmentId |
| `/api/json/assessment-templates/detail` | `/api/json/assessment-templates/list` | templateId |
| `/api/json/admin/models/detail` | `/api/json/admin/models/list` | modelId |
| `/api/json/alerts/detail` | `/api/json/alerts/list` | alertId |

Các GET gốc `/api/companies/{id}`, `/api/positions/{id}`, `/api/assignments/{id}`, `/api/assessment-templates/{id}`, `/api/admin/models/{id}`, `/api/alerts/{id}` cũng đã xóa. Các thao tác PATCH/DELETE/POST khác trên cùng tài nguyên vẫn tồn tại theo quyền cũ.

## Cách gọi và đọc response

Ví dụ POST `/api/json/assignments/list`:

```json
{
  "assignmentId": 1,
  "page": 1,
  "limit": 20,
  "historyPage": 1,
  "historyLimit": 20
}
```

Response giữ dạng `{success:true,data:{items,total,page,limit}}`. Hồ sơ nằm trong `data.items[0]`; không đọc trực tiếp `data` như detail cũ. Không có hồ sơ khớp bộ lọc: HTTP 200, `items: []`, `total: 0`. ID sai kiểu hoặc không dương: HTTP 400. Các bộ lọc kết hợp đồng thời; khi lấy một ID nên bỏ các bộ lọc không cần thiết và đặt page=1.

Để lấy danh sách, chỉ gửi `{ "page": 1, "limit": 20 }` hoặc các bộ lọc cần dùng. Swagger có sẵn hai mẫu: danh sách và một hồ sơ theo ID.

## Nội dung đã bổ sung

- Company/position/assignment search dùng chung handler đọc và DTO cho Admin/QHDN. Các hợp đồng ghi theo role vẫn giữ nguyên.
- Position có `recruitmentCode`, `location`, `workMode`, `companyName`; remainingSlots tính theo sức chứa và phân công chưa hủy. Search hỗ trợ cả tên và mã tuyển dụng.
- Assignment giữ các trường cũ và thêm `student`, `company`, `position`, `academicSupervisor`, `evaluation`, `result`. Đánh giá có templateId/scoreDetails/điểm/nhận xét/người và ngày đánh giá; kết quả có trạng thái, phiên bản, điểm chính thức và cờ khóa. Dữ liệu chưa tồn tại trả null, không tạo điểm hoặc kết quả giả.
- Khi lọc companyId/positionId/assignmentId, từng item có `history` và `historyPagination: {total,page,limit}`. Mặc định 20 sự kiện mới nhất; tối đa 100/trang. Dùng historyPage/historyLimit để xem tiếp. Không truyền các trường phân trang lịch sử nếu chưa chọn một ID.
- Alert search thêm mã/tên sinh viên. Khi lọc alertId, item có `interventions: {items,total,page,limit}`. Dùng interventionPage/interventionLimit để phân trang, mặc định 20 và tối đa 100; chỉ dùng khi chọn alertId.
- Template search giữ đầy đủ criteria; model search giữ metrics và featureSchema. Hai API hỗ trợ lọc templateId/modelId.
- Sáu API giữ lại có schema response trên Swagger. Phân công, lịch sử và hoạt động hỗ trợ được đọc trong cùng snapshot cho từng request.

## Phạm vi và chuyển đổi FE

Ba API company/position/assignment cho ADMIN/OJT_COORD. Template/model/alert cho ADMIN. Doanh nghiệp tiếp tục dùng API riêng; không mở quyền đọc quản trị cho doanh nghiệp hoặc sinh viên.

FE gọi các detail trong bảng phải chuyển URL, gửi trường ID tương ứng và đọc `data.items[0]`. Không sửa FE trong thay đổi backend này. Không thay đổi cấu trúc DB, không cần chạy lại file DB.

Các vấn đề khác trong báo cáo rà soát — hồ sơ sinh viên tổng hợp, sinh viên tự xem đợt đăng ký và áp dụng template khi ghi đánh giá — chưa thuộc phạm vi gộp sáu cặp này.
