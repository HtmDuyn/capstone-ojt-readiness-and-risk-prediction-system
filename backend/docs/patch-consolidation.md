# Gộp các API cập nhật từng phần

Backend còn 166 API duy nhất: Admin 156, Phòng đào tạo 94, Phòng QHDN 44, Doanh nghiệp 12, Sinh viên 17, Auth 3.

## Các API giữ lại

| PATCH | Nội dung |
|---|---|
| /api/json/assignments | Thông tin phân công và status; giữ giới hạn trường riêng của ADMIN/OJT_COORD |
| /api/json/students | Hồ sơ cá nhân/học vụ và placement lồng |
| /api/json/ojt-registration-windows | Cấu hình đợt, tên/hạn và status OPEN/CLOSED |
| /api/json/combo-registration-windows | Cấu hình đợt nháp và status OPEN/CLOSED |
| /api/json/recruitment/windows | Học kỳ, cấu hình đợt, tên/hạn và status OPEN/CLOSED |

Chỉ gửi trường cần sửa. Request vừa sửa thông tin vừa chuyển trạng thái chạy trong một transaction: sửa/validate cấu hình trước, chuyển trạng thái sau; lỗi bất kỳ bước nào hoàn tác toàn bộ. Không được đổi các trường đã khóa bằng cách gửi kèm status=CLOSED. Scope combo chỉ sửa ở DRAFT, gia hạn theo sinh viên dùng extensions. Lượt này không gộp search/detail.

## Ví dụ

Mở hoặc đóng đợt OJT/combo/tuyển dụng, cùng cấu trúc body tại PATCH tương ứng:

```json
{"windowId":1,"status":"OPEN","reason":"Mở đợt đăng ký theo kế hoạch"}
```

Cập nhật tên/hạn có thể gửi kèm status nếu trạng thái trước khi sửa cho phép các trường đó. reason bắt buộc khi chuyển trạng thái; combo sửa cấu hình thuần vẫn giữ quy tắc reason như trước.

PATCH /api/json/assignments:

```json
{"assignmentId":1,"enterpriseSupervisorName":"Nguyễn Văn An","status":"ACTIVE","reason":"Bắt đầu thực tập"}
```

ADMIN còn được sửa positionId/academicSupervisorId theo luật hiện có. QHDN chỉ sửa người hướng dẫn doanh nghiệp/ngày/trạng thái. Giữ kiểm tra sức chứa, khóa khi có kết quả, chuyển trạng thái và cập nhật chỗ trống khi hủy.

PATCH /api/json/students:

```json
{"studentId":9,"fullName":"Nguyễn Văn An","programId":41,"placement":{"cohortId":1,"groupCode":"A","currentAcademicPeriodId":6},"reason":"Cập nhật hồ sơ và lộ trình"}
```

Các ID trong ví dụ cần thay bằng danh mục hợp lệ. programId đặt ở cấp ngoài, không nằm trong placement. Placement không gửi thì giữ nguyên; lần đầu cần khóa/nhóm/kỳ hiện tại. Khi sửa placement vẫn chạy validateCalendar và syncStudentProgress; response chứa hồ sơ, nhãn và lộ trình sau cập nhật.

## Đường dẫn đã xóa

| API cũ | Thay bằng |
|---|---|
| PATCH /api/json/assignments/status | PATCH /api/json/assignments với status |
| PATCH /api/json/students/academic-placement | PATCH /api/json/students với placement |
| POST /api/json/ojt-registration-windows/open hoặc /close | PATCH /api/json/ojt-registration-windows với status |
| POST /api/json/combo-registration-windows/open hoặc /close | PATCH /api/json/combo-registration-windows với status |
| POST /api/json/recruitment/windows/open hoặc /close | PATCH /api/json/recruitment/windows với status |

Tổng cộng xóa 8 operation Swagger và native route tương ứng. Native PATCH của mỗi tài nguyên vẫn tồn tại để adapter JSON dùng. Không giữ alias của endpoint cũ.

## FE và giới hạn

FE gọi API cũ phải đổi method/path và body như trên. Nhánh Phòng đào tạo có POST native /api/ojt-registration-windows/{id}/open và /close: chuyển sang PATCH /api/ojt-registration-windows/{id}, body status/reason, hoặc adapter JSON kèm windowId. FE chưa được chỉnh sửa trong lượt này.

Giữ riêng publish/confirm/finalize, xét chính thức sau Block 3, duyệt hồ sơ, bàn giao, đánh giá và xác nhận điểm vì có bước nghiệp vụ/quyền khác nhau. Giữ các PATCH đã đủ trường như company/course/curriculum/rule/template/intervention; alert status và enterprise decision hiện là API ghi duy nhất cho tài nguyên đó, không có endpoint PATCH khác để giảm thêm.

Không thay cấu trúc DB hoặc dữ liệu DB chính. Kiểm thử nghiệp vụ thực hiện trên schema tạm, hoàn tác toàn bộ; không tạo file test lâu dài.
