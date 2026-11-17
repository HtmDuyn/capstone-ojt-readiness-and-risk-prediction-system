# Đối chiếu Frontend và Backend cho xét điều kiện, bàn giao OJT

## Giao diện theo dõi hiện tại

Trang Kết quả xét điều kiện OJT chỉ đọc `GET /students`, `GET /ojt-eligibility-results` và `GET /eligible-student-handoffs`. Không gọi API xét, tính hoặc lưu khi tải trang. Nút xét/lưu thủ công đã ẩn khỏi giao diện; mã hook/service cũ vẫn giữ để phục vụ chuyển đổi. Kết quả hiển thị lấy từ API đã lưu; hồ sơ không có kết quả là **Chưa xét**. Không có API trạng thái tác vụ tự động, nên giao diện chỉ báo chức năng đang hoàn thiện. `checkedAt` trên kết quả đã lưu là thời điểm xét gần nhất, không được diễn giải là lần chạy tự động.

## Nghiệp vụ Backend cần triển khai

### Điều kiện được xét

- Sinh viên và tài khoản còn hoạt động.
- Kỳ 5 theo lộ trình đã kết thúc; PĐT đã nhập và chốt đầy đủ kết quả học tập kỳ 5.
- Xác định được khung chương trình và kỳ OJT mục tiêu từ dữ liệu có thẩm quyền.

### Điều kiện đủ để bàn giao

- Tín chỉ tích lũy đạt ít nhất 70 hoặc ngưỡng hiện hành do PĐT cấu hình; tối đa 2 môn chưa đạt.
- Tổng tín chỉ của các môn chưa đạt không vượt giới hạn áp dụng cho khung chương trình. Chỉ tính môn phải hoàn thành trước OJT, dùng kết quả học tập mới nhất, không đếm trùng lần học lại.
- Không thiếu điểm, lựa chọn combo bắt buộc hoặc dữ liệu cần để kết luận.
- Có kết quả `ELIGIBLE` đã lưu, còn hiệu lực; chưa được bàn giao cho cùng kỳ OJT.

### Tự động xét và lưu

- Backend xác định thời điểm xét cho kỳ OJT mới, chọn hồ sơ mới và hồ sơ cần xét lại, tự tính và lưu kết quả mà không phụ thuộc việc PĐT mở website.
- Sinh viên chưa đủ điều kiện được xem xét ở kỳ sau khi có ánh xạ kỳ chính xác và dữ liệu phù hợp; không tự chuyển kỳ bằng suy luận Frontend.
- Chống chạy trùng, tránh ghi đè kết quả đã bàn giao, lưu phiên bản quy tắc, thời gian, trạng thái tác vụ và lỗi từng hồ sơ để Frontend hiển thị.

### API cần đối chiếu với Hà

- `GET /students` có `currentSemester` nhưng chưa xác nhận đã hoàn tất kỳ 5 hoặc đủ điểm; cần dữ liệu xác thực về cả hai điều kiện.
- `GET /ojt-eligibility-results` có `checkedAt`, `isStale` và kết quả đã lưu. Cần thống nhất cách trả phiên bản quy tắc, kỳ OJT mục tiêu, giới hạn và tổng tín chỉ chưa đạt theo khung.
- `POST /eligibility-check-runs` là lệnh xét đồng bộ của luồng quyết định chính thức; chưa phải API theo dõi lịch chạy tự động hoặc chứng cứ kết quả FE đã được tự lưu. Cần thống nhất contract trạng thái tác vụ, lần chạy gần nhất và lỗi; chưa đặt tên endpoint mới.
- `POST /eligible-student-handoffs` cần được đối chiếu khả năng kiểm tra lại mọi điều kiện bàn giao trong cùng transaction và trả lý do không thể bàn giao.

## Luồng xét thủ công còn giữ trong mã nguồn

- Hook xét thủ công cũ tải `GET /students`, `GET /students/{id}` (gồm `academicProgress,courseResults`), `GET /ojt-eligibility-results`, `GET /eligible-student-handoffs`. Frontend tính kết quả tại `calculateLocalOjtEligibility`, rồi có thể gọi `POST /ojt-eligibility-results` để lưu theo lô với `idempotencyKey`. Trang theo dõi hiện tại không gọi các thao tác này. Đây là kết quả FE đã lưu, không phải quyết định OJT chính thức.
- Quy tắc 70 tín chỉ / tối đa 2 môn ở `loadCurrentOjtRule`. `VITE_OJT_POLICY_API=true` chuyển sang `GET /ojt-condition-policy`; phản hồi `404 ROUTE_NOT_FOUND` vẫn fallback về 70/2. Không xóa nhánh này trước khi xác nhận môi trường triển khai với Hà.
- Trang Bàn giao tải thêm `GET /cohorts`, ánh xạ kỳ 5 → kỳ 6 qua `curriculumPeriods`, yêu cầu kết quả FE đã lưu `ELIGIBLE` và `isStale=false`, rồi gọi `POST /eligible-student-handoffs`. Backend xác nhận trước khi UI chuyển sang lịch sử. Lịch sử từ `GET /eligible-student-handoffs`; số đợt hiển thị được tính riêng theo từng kỳ OJT, không đổi ID gốc.

## Contract cần Hà xác nhận hoặc bổ sung

1. **Hoàn tất kỳ 5:** một trạng thái có nguồn xác thực cho thời điểm kỳ 5 kết thúc và việc nhập/chốt đủ điểm của từng sinh viên, bao gồm học lại, môn tương đương và combo. `currentSemester` chỉ nói vị trí hiện tại, không chứng minh đã hoàn tất.
2. **Tín chỉ chưa đạt:** trả danh sách môn bắt buộc trước OJT theo khung đã import, tín chỉ từng môn, lựa chọn combo đã chốt, lần học mới nhất và tổng tín chỉ chưa đạt. Cần thêm giới hạn tín chỉ chưa đạt theo từng khung hoặc quy tắc hiện hành; Frontend không thể tự đặt ngưỡng.
3. **Kết quả xét:** xác nhận nguồn kết quả dùng để bàn giao là kết quả FE đã lưu hay quyết định chính thức của Backend. Hai công thức hiện khác phạm vi môn; `backend/docs/managed-ojt-policy.md` đã ghi nhận khác biệt. Cần thống nhất `policyVersion`, `isStale` và dấu hiệu dữ liệu học vụ thay đổi ở thời điểm bàn giao.
4. **Tự động xét:** API đọc trạng thái tác vụ/lịch chạy theo kỳ OJT, phạm vi hồ sơ mới và cần xét lại, thời điểm, phiên bản quy tắc, số thành công/lỗi và lỗi từng hồ sơ; cơ chế chạy nền, idempotency và khóa chống ghi đè sinh viên đã bàn giao. `POST /eligibility-check-runs` hiện là lệnh gọi đồng bộ, không chứng minh có tác vụ theo lịch hoặc cùng contract kết quả FE.
5. **Kỳ OJT tiếp theo:** ánh xạ có thẩm quyền cho sinh viên học trễ/học lại. Frontend hiện chỉ hỗ trợ lộ trình kỳ 5 → kỳ 6 được cấu hình duy nhất; không tự chuyển sinh viên chưa đủ điều kiện sang kỳ khác.
6. **Bàn giao:** xác nhận Backend kiểm tra lại toàn bộ điều kiện mới trong cùng transaction với `POST /eligible-student-handoffs`, nhất là kỳ 5, giới hạn tín chỉ chưa đạt, kết quả còn hiệu lực và chống trùng theo kỳ. Kiểm tra phía Frontend hiện chỉ dùng dữ liệu đã tải, nên có thể cũ trước khi gửi.

Các cột thiếu contract được ghi “chưa có dữ liệu” trong UI. Không dùng trạng thái đó để suy ra sinh viên đủ điều kiện. Việc thêm điều kiện chặn mới vào luồng xét/lưu/bàn giao cần contract Backend và dữ liệu thử nghiệm được thống nhất trước.
