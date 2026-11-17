# Quản lý điều kiện xét OJT

## Nâng cấp database có dữ liệu

`backend/DB` là script khởi tạo lại toàn bộ dữ liệu. **Không chạy toàn bộ file trên database đang vận hành.** Chỉ chạy phần giữa hai mốc `BEGIN INCREMENTAL UPDATE: 20261109_managed_ojt_policy` và `END INCREMENTAL UPDATE: 20261109_managed_ojt_policy` trong một transaction, sau khi sao lưu database. Phần này bỏ hai ràng buộc cố định 70/2, thêm ràng buộc không âm và bảng `OJTConditionPolicies`; không sửa kết quả xét đã lưu. Chạy migration trước khi triển khai Backend và Frontend mới.

## API và phiên bản

- `GET /api/ojt-condition-policy`: đọc phiên bản đang áp dụng (trước lần lưu đầu tiên dùng quy định ban đầu 70/2, phiên bản 0).
- `POST /api/ojt-condition-policy/preview`: nhận `minCredits`, `maxUnpassedCourses`; trả đối chiếu từng chương trình và `token` gắn với dữ liệu khung hiện tại.
- `POST /api/ojt-condition-policy`: nhận hai giá trị cùng `token`; kiểm tra lại toàn bộ khung trong transaction, lưu `OJTConditionPolicies` mới, tạo bản `OJTRuleSets` bất biến theo từng chương trình và cập nhật `OJTActiveRuleSets`. Chỉ `ADMIN`/`ACADEMIC` được gọi.

Kết quả xét chính thức cũ giữ `RuleSetID` đã dùng; kết quả FE cũ vẫn được giữ nhưng đánh dấu cũ khi phiên bản quy định thay đổi. Các lần xét mới đọc quy định đang áp dụng. Sinh viên không có quyền thay đổi quy định.

## Giới hạn kiểm tra an toàn

Học kỳ OJT được đọc từ dòng học phần `OJT202` trong `ProgramCourses`. Khung thiếu hoặc có nhiều dòng OJT không được kết luận hợp lệ. Mã nguồn hiện tại vẫn ràng buộc `OJT202` ở kỳ 6 khi xuất bản khung; hỗ trợ kỳ OJT khác sẽ cần mở rộng quy tắc xuất bản và các luồng bàn giao theo kỳ, nên chức năng này không tự thay đổi chúng.

Các môn trước kỳ OJT được tính từ `RecommendedSemester` nhỏ hơn học kỳ OJT. Môn thực tế tương đương chỉ cộng một lần. Môn combo chỉ tính qua ô chương trình (`COMBO_SLOT`/`ELECTIVE_SLOT`), không cộng mọi môn của mọi combo. Ngưỡng chung so với **mức tối thiểu** của lộ trình hợp lệ; giá trị bằng đúng mức này được cảnh báo vì không còn dư địa tín chỉ. Không dùng một tỷ lệ cảnh báo tùy ý.

Nếu nhóm combo có số môn được chọn thay đổi, trộn môn trước/sau OJT trong cùng nhóm, thiếu ánh xạ ô, thiếu xác nhận, thiếu tín chỉ hoặc tiên quyết không thể theo thứ tự học kỳ, kết quả là `INSUFFICIENT_DATA` và việc lưu bị chặn. Đây là cách xử lý bảo thủ; dữ liệu này cần được chuẩn hóa hoặc xác nhận rõ quy tắc trước khi có thể tính một phạm vi tín chỉ chính xác.

Luồng PĐT hiện còn một kết quả xét do Frontend tính để lưu vào `StudentOJTCalculatedResults`, tách với quyết định chính thức `EligibilityChecks`. Hai luồng dùng cùng **ngưỡng** sau thay đổi này nhưng vẫn có phạm vi môn chưa đạt khác nhau theo mã nguồn cũ: Frontend gom các lần `FAILED` theo mã môn và xóa khi đã `PASSED`/`RECOGNIZED`, còn Backend chính thức chỉ xét các môn thuộc yêu cầu của chương trình sau ánh xạ tương đương. Chưa hợp nhất hai công thức vì cần xác nhận nghiệp vụ; không xem kết quả FE là quyết định chính thức.

Kiểm thử thuần dữ liệu: `npm run build` trong `backend`, sau đó `node --test tests/ojt-policy-feasibility.test.cjs`. Kiểm thử API/database cần database thử nghiệm riêng đã áp dụng migration; không chạy `backend/DB` trên dữ liệu đang vận hành.
