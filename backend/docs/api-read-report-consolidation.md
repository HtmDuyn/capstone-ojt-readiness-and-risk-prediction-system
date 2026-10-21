# Gộp hồ sơ, báo cáo và dashboard

Tổng hiện hành: 154 API duy nhất, 6 nhóm Swagger. Admin 145, Phòng đào tạo 88, Phòng QHDN 37, Doanh nghiệp 10, Sinh viên 15, Auth 3. Giảm 10 API so với 164 trước lượt này. Không thay cấu trúc hoặc dữ liệu DB chính.

## 1. Năm API search thay detail

Tất cả search dưới đây dùng POST. Không giữ alias endpoint cũ; native GET detail cũng đã xóa.

| API đã xóa | API giữ lại | Bộ lọc chính xác | Dữ liệu nằm ở |
|---|---|---|---|
| /api/json/academic-periods/detail | /api/json/academic-periods/list | academicPeriodId | items[0] |
| /api/json/accounts/detail | /api/json/accounts/list (Admin); /api/auth/me (cá nhân) | userId trong search | data[0] hoặc user |
| /api/json/ojt-coordinations/detail | /api/json/ojt-coordinations/list | coordinationId | data.items[0] |
| /api/json/internship-evaluations/detail | /api/json/internship-evaluations/list | evaluationId | data.items[0] |
| /api/json/enterprise/candidates/detail | /api/json/enterprise/candidates/list | candidateId | data.items[0] |

Các bộ lọc kết hợp AND. Tìm một hồ sơ nên đặt page=1 và bỏ bộ lọc không cần thiết. Không tìm thấy trả HTTP 200 với mảng rỗng; ID không hợp lệ trả 400. Giữ envelope cũ của từng search để không làm hỏng danh sách FE đang dùng.

Điều phối/đánh giá có context sinh viên, doanh nghiệp, vị trí, registration/assignment/template đã có. Khi chọn coordinationId/evaluationId, thêm history và historyPagination; dùng historyPage/historyLimit, mặc định 1/20, tối đa 100 dòng/trang. Điều phối thêm coordinationHistory và coordinationHistoryPagination; dùng coordinationPage/coordinationLimit riêng. Lịch sử mới nhất trước. Không gửi tham số phân trang lịch sử nếu chưa chọn đúng ID.

Search ứng viên mặc định vẫn lấy lần giới thiệu mới nhất theo sinh viên/doanh nghiệp. Khi chọn candidateId sẽ đọc được lần giới thiệu cũ thuộc chính doanh nghiệp đăng nhập, có isLatestCoordination. ID thuộc doanh nghiệp khác trả items rỗng. Không mở quyền staff search cho doanh nghiệp/sinh viên.

## 2. Một API báo cáo QHDN

POST /api/json/qhdn/reports/list:

```json
{"type":"acceptance","ojtSemesterId":6,"companyId":1,"page":1,"limit":20}
```

type bắt buộc, gồm acceptance, internships, enterprise-feedback. Giữ nguyên thống kê/tỷ lệ/điểm xác nhận, lọc kỳ/doanh nghiệp và phân trang; response vẫn data.type, data.filters, data.items, total/page/limit. Chỉ ADMIN/OJT_COORD.

Đã xóa ba endpoint POST /api/json/qhdn/reports/acceptance/search, /internships/search, /enterprise-feedback/search cùng native GET tương ứng. Giữ API export và QHDN dashboard vì tác dụng khác.

## 3. Dashboard chọn section

POST /api/json/admin/dashboard/search:

- section=all (mặc định): data.summary, readiness, risks, trends.
- section=summary: chỉ data.summary; thay GET /api/admin/dashboard/summary đã xóa.
- section=readiness, risks hoặc trends: chỉ phần được yêu cầu.
- summary luôn có scope=ALL_SYSTEM và tổng tài khoản/sinh viên/doanh nghiệp/kỳ/cảnh báo toàn hệ thống. Các phần dự đoán áp dụng bộ lọc riêng. Request summary thuần không nhận bộ lọc dự đoán; all có lọc vẫn ghi rõ summary toàn hệ thống.
- Không nhận page/limit. Các phần được đọc trong cùng repeatable-read snapshot.

POST /api/json/academic/dashboard/search:

```json
{"ojtSemesterId":6,"section":"all","groupBy":"cohort"}
```

- section=all (mặc định), summary hoặc statistics.
- groupBy=cohort (mặc định), group, major hoặc combo; chỉ áp dụng khi lấy statistics.
- Response: data.scope, data.computedAt, data.summary và/hoặc data.statistics. Summary giữ số đủ/chưa đủ/thiếu cấu hình/chờ xác nhận, currentEvaluation và staleConfirmations. Statistics giữ overall, groups và membershipCountsMayOverlap.
- Một lần tính report cho cả summary/statistics, không đọc/tính hai lần; dùng cùng phạm vi và thời điểm.
- Đã xóa POST /api/json/academic/eligibility-statistics/search và native GET tương ứng. FE dashboard cũ đọc các tổng ở cấp data cần chuyển sang data.summary.

## 4. Thống nhất hồ sơ cá nhân

Đã tìm thấy GET /auth/me trong authService.ts của checkout hiện tại và các ref origin/Nhat_Role_PDAoTao, origin/feature/fe-bussiness_duyn, origin/feature/fe-qhdn-duyen, origin/feature/fe-students-duyn. Không thấy lời gọi accounts/me/profile trong các ref đã kiểm tra; origin/Role_Admin_Nhat không có lời gọi hai endpoint này. Chỉ kiểm tra refs đang lưu tại máy, không fetch hoặc xác minh triển khai Render.

Giữ GET /api/auth/me; xóa GET /api/accounts/me/profile. Giữ PATCH /api/accounts/me/profile cho fullName/phone. GET auth/me và PATCH profile dùng cùng personalAccountView và envelope {success,message,user}:

```json
{
  "success":true,
  "message":"...",
  "user":{
    "id":4,"username":"student01","email":"student01@example.invalid",
    "phone":null,"fullName":"Nguyễn Văn An","status":"ACTIVE",
    "roleId":4,"roleCode":"STUDENT","roleName":"Sinh viên",
    "studentId":1,"enterpriseId":null,"mustChangePassword":false,
    "createdAt":"2026-10-19T00:00:00.000Z","updatedAt":"2026-10-19T00:00:00.000Z","lastLoginAt":null
  }
}
```

Giữ các tên trường/envelope mà FE đăng nhập đang đọc. Bổ sung phone/roleId/timestamp và định danh hồ sơ. Không trả password hash, AuthVersion hay payload email. PATCH profile chuyển envelope từ account sang user và tên trường sang camelCase; FE tích hợp sửa hồ sơ cần đọc user. Admin account search/create/update giữ envelope account/data và tên trường admin hiện có; không chuyển hàng loạt DTO quản trị trong lượt này.

## 5. Chuyển đổi và kiểm tra

FE chưa được sửa source. Lời gọi auth/me và màn hình đăng nhập hiện có giữ nguyên; các endpoint bị xóa, response dashboard Đào tạo và PATCH profile cần chuyển như bảng trên. Các API sửa, duyệt, chốt/xác nhận và publish khác giữ đường dẫn/quyền.

Đã kiểm tra HTTP qua JSON adapter trên schema tạm: 5 search, lịch sử, truy cập ứng viên cũ, phân quyền staff, shared profile DTO, 3 loại báo cáo, section dashboard và endpoint cũ 404. Kiểm tra bổ sung bảo đảm không truy cập được candidateId doanh nghiệp khác, ID/phân trang sai trả 400, lịch sử phải chọn ID. Schema tạm được rollback; không thêm file test lâu dài.

Đối chiếu 154 operation Swagger và 118 JSON adapter với 272 cặp method/path thực tế: không thiếu/ngoài mapping; các native route nguồn adapter vẫn giữ. Bốn route write dùng hai handler theo vai trò không tính hai lần.
