# Hợp đồng Backend cần bổ sung cho quản lý điều kiện OJT

Trang Phòng Đào tạo hiện dùng `GET /api/ojt-condition-policy` để đọc phiên bản mới nhất, `POST /api/ojt-condition-policy/preview` để kiểm tra, rồi `POST /api/ojt-condition-policy` để công bố phiên bản mới. API công bố vẫn yêu cầu `maxUnpassedCourses`; Frontend giữ nguyên giá trị Backend trả về và chỉ cho chỉnh sửa `minCredits`.

## Lịch sử thay đổi

Cần endpoint đọc danh sách các phiên bản điều kiện chung, sắp xếp mới nhất trước và có phân trang. Mỗi bản ghi cần thời gian, giá trị tín chỉ trước và sau, người thực hiện (tên hiển thị), mã phiên bản và trạng thái công bố. Lịch sử phải lấy từ dữ liệu đã lưu hoặc audit của Backend; Frontend không suy diễn từ phiên bản hiện tại. Sau khi công bố, endpoint lịch sử phải trả phiên bản mới.

## Giá trị ban đầu và khôi phục

Cần API xác nhận giá trị gốc của điều kiện chung, thay vì dựa vào giá trị fallback 70 tín chỉ của `GET /api/ojt-condition-policy`. Cần endpoint khôi phục có bước kiểm tra tương tự `preview`, chống dữ liệu thay đổi giữa kiểm tra và ghi. Khôi phục phải tạo phiên bản và bản ghi lịch sử mới, giữ các phiên bản trước.

## Hiệu lực và kết quả xét

Cần trường hoặc endpoint cho biết điều kiện chung có hiệu lực theo chương trình và kỳ OJT nào, kèm mã quy tắc đang được dùng. `id` của phiên bản mới nhất chỉ chứng minh đã công bố, chưa đủ để khẳng định hiệu lực ở mọi phạm vi. Khi thay đổi hoặc khôi phục, Backend cần xác định lần xét sau dùng phiên bản nào, giữ nguyên kết quả và bàn giao đã lưu, đồng thời quy định khi nào sinh viên chưa bàn giao cần được xét lại.

Các mức tín chỉ tùy chọn cũ vẫn tồn tại và trang xét sinh viên cũ còn cho chọn chúng. Nếu nghiệp vụ mới chỉ dùng điều kiện chung, cần thống nhất việc ngừng nhận `thresholdId` trong luồng xét và lưu kết quả trước khi Frontend thay đổi luồng đó.
