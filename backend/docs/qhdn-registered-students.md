# QHDN xem sinh viên đã đăng ký OJT

POST /api/json/qhdn/registered-students/list; native GET /api/qhdn/registered-students. Đây là một operation mới trên Swagger, nhóm Admin và Phòng QHDN. Không có endpoint ghi/duyệt cho danh sách này.

## Mục đích

Cho phép QHDN xem danh sách sinh viên đã có đăng ký OJT, kể cả hồ sơ SUBMITTED/APPROVED/REJECTED chưa bàn giao. Không lấy sinh viên chưa có đăng ký. Mỗi sinh viên chỉ xuất hiện một dòng; nếu có nhiều kỳ đăng ký, các hồ sơ nằm trong registrations. total, page và limit tính theo sinh viên không trùng.

```json
{
  "page":1,
  "limit":20
}
```

Đây là request mặc định để FE lấy tất cả sinh viên đã đăng ký, bao gồm hồ sơ đã bàn giao. Chỉ thêm bộ lọc khi người dùng chọn lọc. Ví dụ `handoffStatus: "NOT_HANDED_OFF"` chỉ lấy hồ sơ chưa bàn giao và sẽ trả rỗng nếu tất cả hồ sơ đã bàn giao. Không gửi các ID mẫu hoặc `search: "string"` do Swagger tự sinh.

Với Axios, lấy danh sách từ `response.data.data.items`; tổng số sinh viên từ `response.data.data.total`. Mỗi phần tử là một sinh viên, thông tin hồ sơ nằm trong `registrations`.

## Bộ lọc

Tất cả tùy chọn: registrationId, studentId, ojtSemesterId, academicPeriodId, windowId, programId, cohortId, groupCode, status, handoffStatus, search, page, limit.

- status: SUBMITTED, APPROVED, REJECTED, HANDED_OFF; bỏ trường này để xem tất cả.
- handoffStatus: NOT_HANDED_OFF hoặc HANDED_OFF; dựa trên bản ghi bàn giao thực tế.
- academicPeriodId: học kỳ liên kết với kỳ OJT, không phải kỳ mục tiêu riêng của đợt đăng ký.
- search: mã sinh viên, họ tên hoặc email. Các bộ lọc kết hợp AND.
- page mặc định 1, limit mặc định 20 và tối đa 100. Không khớp bộ lọc trả trang rỗng với total=0.

## Response

Giữ dạng {success:true,data:{items,total,page,limit}}. Mỗi item là một sinh viên:

- id = studentId; studentCode, fullName, email, phone, studentStatus/accountStatus.
- programId/programCode/programName của chương trình hiện tại; cohortId/cohortName, groupCode.
- registrations: danh sách hồ sơ đăng ký khớp bộ lọc, mới nhất trước. Mỗi hồ sơ có id/registrationId, ojtSemesterId/semester, academicPeriod, window, chương trình lúc đăng ký, status, application (liên hệ/CV/note), pathway, registeredAt/updatedAt, review, handoff và handoffStatus.

Không lọc kỳ: một sinh viên vẫn chỉ một dòng, registrations có thể gồm nhiều kỳ. Lọc kỳ/trạng thái/bàn giao: chỉ giữ hồ sơ khớp trong registrations; sinh viên không có hồ sơ khớp không xuất hiện. programId lọc chương trình lúc đăng ký; chương trình hiện tại ở cấp sinh viên có thể khác nếu đã chuyển chương trình.

Không trả mật khẩu/hash/token hoặc tự chạy xét điều kiện. Lọc registrationId vẫn trả một item sinh viên chứa hồ sơ tương ứng trong registrations. Không có trường registrationId ở cấp sinh viên; FE không dùng id sinh viên làm ID hồ sơ.

## Giới hạn quyền

ADMIN/OJT_COORD được đọc; ACADEMIC/STUDENT/ENTERPRISE không được gọi endpoint này. Danh sách quản trị học vụ của Đào tạo vẫn dùng các API hiện có.

API mới chỉ mở quyền quan sát. POST /api/json/ojt-registrations/list và /api/json/ojt-semesters/students/list đối với QHDN vẫn chỉ trả hồ sơ đã bàn giao. Chi tiết hồ sơ nghiệp vụ trước bàn giao vẫn bị chặn với QHDN; review chỉ Admin/Đào tạo, coordinate vẫn yêu cầu HANDED_OFF hợp lệ. Không có thay đổi trạng thái, cập nhật hồ sơ hoặc tạo bản ghi điều phối khi gọi API mới.

Không sửa FE hoặc DB chính. Swagger hiện có 156 API: Admin 144, Phòng đào tạo 86, Phòng QHDN 38, Doanh nghiệp 10, Sinh viên 19, Auth 3.

Metadata CV mới nhất ở items[].cv và registrations[].application.cv; tải file theo studentId/cvFileId qua POST /api/json/students/cv/search. File CV không còn phụ thuộc đăng ký. Xem student-cv-upload.md.
