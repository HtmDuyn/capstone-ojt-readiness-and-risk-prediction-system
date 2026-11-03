# Review logic task của sinh viên

## Lỗi đã sửa

`student-portal/task.service.ts`: subquery lấy bài nộp mới nhất dùng alias `t` trùng với task của danh sách bên ngoài. Điều kiện lọc vô tình so với task trong subquery, nên mọi task có thể hiện bài mới nhất của cùng sinh viên thay vì đúng task. Task chưa có bài cũng có thể nhận nhầm `latestSubmission`.

Đã đổi alias bảng task bên trong thành `submitted_task`. Điều kiện tương quan phía ngoài vẫn lọc chính xác TaskID. Không đổi schema, dữ liệu, frontend hoặc API role khác. Kiểm thử nhiều task đã thất bại trước sửa và pass sau sửa; xác nhận task A/B không nhận bài của nhau, task chưa nộp trả null.

## Luồng hiện tại

1. Frontend gọi GET `/students/me/internships?ojtSemesterId=...&tasksPage=...&tasksLimit=20` và đọc `data.tasks`. GET `/students/me/tasks` trả danh sách tương đương. Tất cả được giới hạn theo tài khoản, kỳ và phân công được chọn.
2. Khi lưu bài thành công, backend student tự đặt `InternshipTasks.Status = DONE` và `TaskProgressUpdates.PercentComplete = 100`, không cần doanh nghiệp duyệt. Sinh viên chỉ gửi nội dung; backend quyết định trạng thái và phần trăm, không nhận Status/PercentComplete từ client.
3. `canSubmit` đúng khi task TODO/PENDING/IN_PROGRESS và phân công ASSIGNED/ACTIVE/IN_PROGRESS, chưa vượt thời gian thực tập. Bản ghi cũ có StartDate/EndDate null được xử lý như không có giới hạn ở đầu mút tương ứng.
4. GET `/students/me/tasks/:id/submissions` trả lịch sử của đúng sinh viên và task, bài mới nhất trước, phân trang độc lập.
5. POST cùng URL nhận `{content}`: nội dung/đường dẫn, không nhận file bài nộp; cắt khoảng trắng đầu cuối, giới hạn 10.000 ký tự.
6. Sau khi task DONE, nội dung giống bài mới nhất trả lại bài cũ (`replayed:true`); nội dung khác bị từ chối 409, lịch sử vẫn đọc được. Task cũ còn mở có bài nộp chưa ghi nhận 100% được hoàn tất bằng lần nộp mới. Các request đồng thời được khóa theo task nên chỉ ghi một bài và hoàn thành một lần.
7. `DueDate` là ngày: nộp hết ngày đó tại Asia/Ho_Chi_Minh vẫn đúng hạn. Sau hạn task vẫn được nộp nếu phân công còn mở; `isLate:true`. Khi không có hạn thì `isLate:false`. `isLate` hiện được đối chiếu với DueDate hiện tại của task khi đọc, không phải snapshot deadline tại lần nộp.
8. Nhiệm vụ hoàn thành/hủy, phân công chưa bắt đầu/đã kết thúc/đã hủy thì chặn bài mới bằng 409. Lịch sử vẫn đọc được nếu hồ sơ student hoạt động. Retry đúng bài mới nhất vẫn trả lại bài đã lưu, không tạo bài mới.
9. Ghi bài, đặt DONE/100% và audit trong cùng transaction. Audit lỗi thì cả bài nộp và trạng thái hoàn thành đều rollback. Task của người khác trả 404; endpoint riêng student từ chối các role khác.

## Tiến độ và giới hạn còn lại

- Mỗi task trả `percentComplete`; task DONE/COMPLETED là 100%. GET tasks và `internships.tasks` thêm `progress: {totalTasks,completedTasks,cancelledTasks,percentComplete}`. Tiến độ tổng = task DONE/COMPLETED / tổng task không bị hủy × 100, làm tròn hai chữ số; khi không có task thì 0%. Tính trên toàn bộ phân công của sinh viên, không phụ thuộc phân trang.
- Frontend student hiện đã đọc Status và tải lại danh sách sau nộp nên task chuyển sang cột DONE. Phần trăm nằm trong response backend; chưa thêm hiển thị phần trăm hoặc sửa lời giải thích cũ về doanh nghiệp duyệt trên frontend vì phạm vi hiện tại chỉ chỉnh backend student.
- Doanh nghiệp không phải duyệt để task hoàn thành. Không sửa route, quyền hoặc giao diện doanh nghiệp; việc doanh nghiệp mở nội dung bài nộp trong giao diện của họ không được bổ sung trong lần sửa backend student này.
- Các bài nộp lưu vào TaskProgressUpdates sẵn có. Không thêm bảng hoặc chạy migration.
- Chưa kiểm tra database production; dùng PostgreSQL thử nghiệm riêng nạp từ `backend/DB`.

## Kiểm thử

Từ backend, với PostgreSQL thử nghiệm đã chạy ở localhost và database `student_flow_test`:

```powershell
npm.cmd run build
$env:STUDENT_TEST_DATABASE_URL = 'postgresql://student_test@127.0.0.1:55439/student_flow_test'
node scripts/test-student-flow.cjs --tasks
node scripts/check-student-other-role-contracts.cjs
```

`--tasks` reset riêng database thử nghiệm, chạy các trường hợp nhiều task, task rỗng, retry, phân trang, ngày hạn, task đóng, thời gian phân công, gửi đồng thời, tự hoàn thành DONE/100%, tiến độ tổng không phụ thuộc trang, hoàn tất bài nộp cũ và rollback khi audit lỗi. Không chạy script reset trên production.
