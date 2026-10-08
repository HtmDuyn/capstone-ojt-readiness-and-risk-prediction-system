# Cấu hình và API xử lý G01–G05

Cập nhật 08/10/2026. Tất cả tính toán học vụ dùng code. Schema duy nhất nằm trong `backend/DB`, section `20261008 academic workflow gap fixes`. Không chạy toàn bộ script DB trên dữ liệu đang sử dụng vì phần đầu script reset bảng.

Các API cấu hình dưới đây dành cho ADMIN/ACADEMIC, nhận JSON và Bearer token. Các ID trong ví dụ phải thay bằng dữ liệu thực tế. Ngày giờ phải có múi giờ; ranh giới lịch học dùng Asia/Bangkok, thời điểm kết thúc là loại trừ.

## G01 — Đăng ký ở kỳ chuyên ngành 5

`POST /api/ojt-registration-windows` bổ sung `academicPeriodId` bắt buộc và `requiredRelativeSemester` mặc định 5. Kỳ tương đối đếm từ entry period trong placement thực tế của sinh viên đến kỳ mục tiêu; Block 3 dùng kỳ cha và không tăng số kỳ.

Nếu cần ngoại lệ đi lại/hoãn kỳ, cấp riêng:
```http
POST /api/ojt-registration-windows/:id/semester-exceptions
```
```json
{"studentIds":[123],"relativeSemester":6,"expiresAt":"2026-11-15T23:59:59+07:00","reason":"Sinh viên được duyệt hoãn OJT một kỳ"}
```
Phải đúng kỳ thực tế, nằm trong scope và không quá hạn đợt. Thu hồi bằng `POST .../:id/semester-exceptions/:exceptionId/revoke`, body `{"reason":"..." }`. Hồ sơ lưu snapshot kỳ/ngoại lệ đã dùng. Không có placement hoặc đợt cũ chưa cấu hình kỳ sẽ bị chặn; không tự đoán dữ liệu lịch sử.

## G02 — Lịch chọn đầu kỳ 4 và xác nhận Block 3

`GET/PUT /api/academic-periods/:id/combo-phase-schedules`:
```json
{"phase":"INITIAL","startsAt":"2026-09-01T00:00:00+07:00","endsAt":"2026-09-15T00:00:00+07:00","reason":"Lịch đầu kỳ do phòng đào tạo phê duyệt"}
```
INITIAL phải trỏ vào SEMESTER; CONFIRMATION phải trỏ vào BLOCK3 của cùng kỳ với đợt INITIAL. Phòng đào tạo khai báo cụ thể khoảng đầu/cuối kỳ theo lịch trường; hệ thống không tự chọn số ngày đầu kỳ. Ngày của đợt phải nằm trong khoảng đã cấu hình, trong khi roster vẫn chỉ nhận sinh viên ở kỳ chuyên ngành 4. Gia hạn vượt mốc chuẩn dùng API extensions hiện có với scope sinh viên và lý do.

## G03 — Preview combo

`POST /api/combo-registration-windows/:id/preview`:
```json
{"comboId":23,"courseIds":[101,102]}
```
Sinh viên chỉ xem chính mình. ADMIN/ACADEMIC thêm `studentId`. Chỉ hoạt động trong đợt mở và hạn hiệu lực của sinh viên.

Trả `preview.current`, `preview.proposed`, `preview.earnedCreditDelta`, `preview.missingRequiredCourses`, `preview.eligibility`. Dùng cùng cách tính học lại, môn tương đương/công nhận, tín chỉ và GPA với API progress; thiếu quy tắc/cấu hình được trả rõ, không tự kết luận đủ điều kiện. Preview không ghi lựa chọn hoặc kết quả xét. API selections cũng trả preview ngay sau khi gửi; lựa chọn chính thức giữ đến finalize. Lịch sử lựa chọn ban đầu/cuối cùng vẫn được lưu.

## G04 — Xét chính thức sau Block 3

`GET/PUT /api/ojt-semesters/:id/assessment-window`:
```json
{"blockPeriodId":12,"opensAt":"2026-09-01T00:00:00+07:00","closesAt":"2026-09-15T00:00:00+07:00","reason":"Lịch xét sau cập nhật điểm Block 3"}
```
Block phải kết thúc trước thời điểm mở xét và không sau ngày bắt đầu OJT. Chỉ sửa cấu hình ở DRAFT.

Sau khi hoàn tất cập nhật điểm, gọi:
```http
POST /api/ojt-semesters/:id/assessment-window/open
```
```json
{"resultsFinalized":true,"reason":"Đã rà soát và hoàn tất cập nhật điểm sau Block 3"}
```
Mở xét là xác nhận chủ động của phòng đào tạo, được ghi người/thời điểm. Phải chạy lại eligibility check sau mốc này rồi mới confirm. Ngoài khoảng thời gian hoặc đợt chưa mở/đã đóng sẽ bị chặn. Kiểm tra dự kiến vẫn chạy được trước mốc. Đóng bằng `POST .../assessment-window/close`, body reason. Mở lại trong khoảng đã khai báo tạo mốc hoàn tất mới cho những kết quả xác nhận tiếp theo. Kết quả đã xác nhận vẫn giữ lịch sử; thay đổi nguồn học vụ tiếp tục làm kết quả cũ stale như trước.

## G05 — Đồng bộ điểm OJT

`GET/PUT /api/curricula/:id/ojt-grade-mappings/:semesterId`:
```json
{"courseId":201,"academicPeriodId":15,"gradeBands":[{"minimumScore":0,"outcome":"FAILED","gradePoints":0,"grade":"F"},{"minimumScore":5,"outcome":"PASSED","gradePoints":2,"grade":"C"},{"minimumScore":9,"outcome":"PASSED","gradePoints":4,"grade":"A"}],"reason":"Bảng quy đổi đã được phòng đào tạo phê duyệt"}
```
**Các mức điểm trên chỉ minh họa cấu trúc JSON, không phải quy chế được cài sẵn.** Môn phải là môn thực trong phiên bản chương trình published. Kỳ ghi điểm thuộc năm học OJT. Bands bắt đầu từ 0, minimumScore không trùng; lấy band có minimumScore cao nhất không vượt điểm chính thức. Thang GPA 4 bắt buộc gradePoints cho mỗi band.

`POST /api/ojt-results/:id/confirm` vẫn dùng `expectedVersion` và reason. Trong cùng transaction, hệ thống kiểm tra curriculum khi đăng ký, ánh xạ, điểm/kết luận, tạo StudentCourseResults, liên kết nguồn OJTResult và cập nhật assignment. Nếu có kết quả môn/kỳ đã import trước thì trả 409 để đối soát; không ghi đè. Gọi lại đúng actor/reason/expectedVersion của lần xác nhận thành công trả replay và không tạo thêm điểm.

GET kết quả OJT trả `courseResultId`, `gradeMappingId`, snapshot ánh xạ. GET course-results trả `ojtResultId`. Điểm đã đồng bộ và ánh xạ đã dùng được bảo vệ bất biến ở API và DB. Progress/GPA đọc kết quả môn đã đồng bộ theo quy tắc hiện có. Hồ sơ OJT cũ không được tự điền môn hoặc thang quy đổi; cần đối soát riêng nếu đã xác nhận trước thay đổi này.

## Thứ tự cấu hình

1. Khai báo lịch học, placement, phiên bản chương trình và chính sách GPA thực tế.
2. Khai báo combo phase schedules trước tạo/mở đợt combo.
3. Gán kỳ mục tiêu cho đợt đăng ký OJT; chỉ cấp ngoại lệ cho danh sách đã duyệt.
4. Khai báo assessment window, cập nhật điểm Block 3, mở xét với acknowledgement, chạy lại checks và xác nhận.
5. Khai báo ánh xạ môn/kỳ/thang điểm trước xác nhận kết quả OJT.

Swagger tại `/api-docs` có các API cấu hình và preview mới. Không tự mở rộng kỳ đăng ký, suy ra hạn xét từ hạn đăng ký hoặc seed quy đổi điểm.

