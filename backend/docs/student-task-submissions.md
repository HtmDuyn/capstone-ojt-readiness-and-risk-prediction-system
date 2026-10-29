# Giao và nộp nhiệm vụ thực tập

API dùng base `/api`, JWT Bearer và Axios ở frontend. Thẻ **Phân công thực tập** đã bỏ khỏi giao diện sinh viên; liên kết `InternshipAssignments` vẫn dùng nội bộ để xác định doanh nghiệp và sinh viên được giao task.

## Quy trình

1. Doanh nghiệp giao nhiệm vụ bằng `POST /enterprise/tasks/bulk`, chọn các thực tập sinh thuộc doanh nghiệp mình.
2. Sinh viên xem `GET /students/me/tasks?ojtSemesterId=1&page=1&limit=20`. Máy chủ tự lấy StudentID từ tài khoản, không nhận StudentID trong query.
3. Sinh viên nộp nội dung kết quả và đường dẫn GitHub/tài liệu qua `POST /students/me/tasks/:id/submissions`.
4. Doanh nghiệp xem bài nộp trong danh sách nhiệm vụ hoặc `GET /enterprise/tasks/:id/submissions?page=1&limit=20`.
5. Doanh nghiệp xác nhận bằng `PATCH /enterprise/tasks/:id/status` với `{"status":"DONE"}`. Muốn sinh viên bổ sung, đổi lại `IN_PROGRESS`.

Frontend sinh viên tự cập nhật khi quay lại tab và mỗi 30 giây lúc trang đang hiển thị; tạm dừng làm mới khi đang mở form để không mất nội dung. Có nút **Cập nhật nhiệm vụ** để tải ngay. Giao diện doanh nghiệp lưu trạng thái qua API trước khi cập nhật màn hình.

## Nộp bài

```http
POST /api/students/me/tasks/12/submissions
Content-Type: application/json
Authorization: Bearer <student-token>
```

```json
{
  "content": "Đã hoàn thành API đăng nhập và kiểm thử. Bài làm: https://example.com/repository"
}
```

`content` bắt buộc, được trim, từ 1 đến 10.000 ký tự. Đường dẫn nằm trong nội dung; máy chủ không tải nội dung từ URL. Luồng này chưa upload file trực tiếp.

Response HTTP 201: `{success:true,data:{id,taskId,studentId,content,submittedAt,isLate,replayed}}`. Gửi lặp cùng nội dung với bài nộp mới nhất trả lại ID cũ và `replayed:true`; hai yêu cầu đồng thời không tạo bài trùng. Nội dung thay đổi tạo bản nộp mới, giữ nguyên lịch sử cũ.

Nộp bài không tự đặt task thành DONE. Cho phép nộp sau hạn và hiển thị `isLate:true` theo ngày Việt Nam. Task đã được doanh nghiệp xác nhận DONE/COMPLETED hoặc đợt thực tập đã kết thúc/hủy trả HTTP 409. Doanh nghiệp có thể mở lại task trong đợt đang hoạt động.

## Đọc bài nộp và phân quyền

| API | Quyền |
| --- | --- |
| `GET /students/me/tasks` | Chỉ nhiệm vụ được giao cho chính sinh viên |
| `GET /students/me/tasks/:id/submissions` | Sinh viên được giao nhiệm vụ |
| `POST /students/me/tasks/:id/submissions` | Sinh viên được giao nhiệm vụ; đợt và task còn cho nộp |
| `GET /enterprise/tasks/:id/submissions` | Doanh nghiệp sở hữu nhiệm vụ |
| `PATCH /enterprise/tasks/:id/status` | Doanh nghiệp sở hữu nhiệm vụ; đợt đang hoạt động |

Các danh sách trả `{items,total,page,limit}`; lịch sử thêm `taskId`, sắp xếp mới nhất trước. Mặc định 20 dòng, tối đa 100. Truy cập task thuộc sinh viên/doanh nghiệp khác trả 404; vai trò không phù hợp trả 403. JSON ghi không nhận trường lạ hoặc query thay body. Có audit cho nộp bài và đổi trạng thái.

`GET /students/me/tasks`, `GET /internship-tasks` của doanh nghiệp và phần tasks trong `/students/me/internships` trả thêm `canSubmit`, `submissionCount`, `latestSubmission`. Doanh nghiệp xem lịch sử ngay tại màn hình chi tiết nhiệm vụ.

## DB và kiểm chứng

Dùng bảng hiện có `TaskProgressUpdates`: `TaskID` liên kết nhiệm vụ, `UpdatedByStudentID` là người nộp, `ProgressDescription` là nội dung, `PercentComplete=100` phân biệt bài nộp, `UpdateDate` được ghi UTC và API trả ISO có múi giờ. Trạng thái doanh nghiệp lưu riêng trong `InternshipTasks.Status`. **Không cần sửa schema hoặc reset/chạy lại DB trên Supabase cho tính năng này.**

Kiểm tra độc lập sau khi build backend:

```powershell
npm.cmd run build
node scripts/check-task-submissions.cjs
```

Công cụ tự khởi tạo PostgreSQL tạm trên loopback, nạp đúng `backend/DB`, kiểm tra quyền sở hữu, nộp lặp/đồng thời, lịch sử, nộp muộn và trạng thái doanh nghiệp, rồi dừng DB tạm. Không dùng `.env` hoặc Supabase. Cần PostgreSQL 18 local hoặc cấu hình `PG_BIN`. Script này là công cụ kiểm thử tùy chọn, không được gọi khi chạy hệ thống.
