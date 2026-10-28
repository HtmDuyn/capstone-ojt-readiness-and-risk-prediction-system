# Tag kỳ theo môn đang học

`courseSemesterTag` là số kỳ lớn nhất trong các môn có trạng thái `IN_PROGRESS`, thuộc khung chương trình đang gán cho sinh viên. Mỗi môn lấy tag từ `ProgramCourses.RecommendedSemester` hoặc `ComboCourses.Semester` của combo đã duyệt. Không lấy `SemesterTaken` vì học lại môn kỳ 1 ở kỳ thực tế sau vẫn là môn có tag kỳ 1.

- Đang học ít nhất một môn kỳ 3: tag 3.
- Đang học môn kỳ 1, 3 và 5: tag 5.
- Chỉ đang học môn kỳ 0: tag 0.
- Không có môn đang học: `null`. PASSED, FAILED, WITHDRAWN, RECOGNIZED không tạo tag đang học.

Trạng thái `IN_PROGRESS` là nguồn xác định đang học; không suy đoán từ ngày lịch. Tag được tính khi đọc, vì vậy import, sửa trạng thái/điểm, xóa kết quả hoặc đổi chương trình sẽ phản ánh ngay, không cần chạy đồng bộ hay nhập tay tag.

Tag này được trả trong danh sách và hồ sơ sinh viên, hiển thị trên trang tiến độ và hồ sơ import. Nó độc lập với `currentSemester` theo lộ trình khóa và `currentAcademicPeriodId` theo lịch thực tế. Không thay đổi các điều kiện tiên quyết hoặc điều kiện OJT.

Hàm tính tag kỳ được tạo trực tiếp trong `backend/DB`.
