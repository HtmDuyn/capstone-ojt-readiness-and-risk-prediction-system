> Hợp đồng đọc/báo cáo mới nhất: [api-read-report-consolidation.md](api-read-report-consolidation.md). GET profile cũ và các detail đã gộp không còn tồn tại.

# Dữ liệu trả về phục vụ FE

Giữ nguyên 154 API và sáu nhóm Swagger. Bổ sung trường vào response hiện có; không thay cấu trúc envelope, không thêm endpoint và không đổi cấu trúc DB. Riêng hai API danh sách đợt OJT/combo mở thêm quyền STUDENT với dữ liệu được lọc theo người đăng nhập.

## Tài khoản và định danh hồ sơ

GET `/api/auth/me` và PATCH `/api/accounts/me/profile` trả thêm `studentId`, `enterpriseId`. ID tài khoản vẫn giữ nguyên. Hai trường liên kết có thể null; FE không được dùng UserID thay StudentID hoặc EnterpriseID.

Các response tài khoản đọc/sửa cũng giữ các trường cũ và bổ sung hai định danh liên kết này.

## Hồ sơ học vụ tổng hợp

POST `/api/json/students/detail`:

```json
{
  "studentId": 9,
  "resultsPage": 1,
  "resultsLimit": 20,
  "ojtPage": 1,
  "ojtLimit": 20,
  "ojtSemesterId": 6
}
```

Ngoài thông tin cơ bản trong `data`, response có:

- `program`: mã, tên, phiên bản, trạng thái, tín chỉ và tên chuyên ngành.
- `cohort`, `entryAcademicPeriod`, `currentAcademicPeriod`: tên và mã khóa/kỳ để hiển thị trực tiếp.
- `academicProgress`: GPA, tín chỉ, môn còn thiếu, vấn đề cấu hình và tiến độ từ cùng logic tính học vụ hiện có.
- `courseResults`: `{items,total,page,limit}`, mặc định 20 dòng, tối đa 100; gồm môn, điểm, lần học, kỳ và trạng thái.
- `comboSelections`: các lựa chọn đã xác nhận trong chương trình hiện tại, kèm môn đã chọn. Danh sách rỗng có nghĩa chưa có lựa chọn xác nhận, không tự suy đoán combo.
- `ojtRegistrations`: `{items,total,page,limit}`, mặc định 20 hồ sơ; gồm học kỳ, hồ sơ nộp, điều phối mới nhất, liên hệ doanh nghiệp/vị trí, phân công/người hướng dẫn, đánh giá và kết quả.
- `ojtSemesterId`, `officialEligibility`: kết quả xét chính thức và độ lỗi thời của nguồn dữ liệu. Ưu tiên kỳ được yêu cầu, sau đó kỳ của đăng ký gần nhất, cuối cùng là kỳ OJT liên kết lộ trình hiện tại. Không lấy kỳ mặc định từ trang lịch sử đang xem.

`ojtSemesterId` là tùy chọn; nếu gửi, phải là kỳ tồn tại. Sinh viên chỉ xem được hồ sơ của mình. Điểm/kết luận OJT chính thức chưa xác nhận được ẩn với sinh viên; Admin/Đào tạo vẫn đọc được dữ liệu theo quyền. Chưa có dữ liệu trả null hoặc danh sách rỗng. Chương trình thiếu cấu hình trả trạng thái/vấn đề thực tế, không giả GPA hoặc điểm.

POST `/api/json/students/search` và các response cập nhật hồ sơ cũng kèm tên chương trình/chuyên ngành/khóa/kỳ. Không tính GPA cho từng dòng danh sách để tránh tải không cần thiết.

## Sinh viên tự xem đợt đăng ký

- POST `/api/json/ojt-registration-windows/search`: chỉ trả đợt không phải nháp và khớp đồng thời phạm vi chương trình/khóa/ngành/nhóm/sinh viên của người đăng nhập.
- POST `/api/json/combo-registration-windows/search`: chỉ trả đợt không phải nháp có sinh viên trong danh sách đã chốt phạm vi.

Sinh viên không truyền studentId. Không trả Scope chứa ID sinh viên khác, danh sách roster hay tổng kết nội bộ. Các bộ lọc và phân trang cũ vẫn dùng được.

Response sinh viên có `student` chứa liên hệ của chính mình để điền sẵn hồ sơ. Mỗi đợt có `period`, `semester`, `effectiveEndsAt`, `canSubmit`, `blockingReasons`, `blockingMessages`. Thông báo chặn có tiếng Việt. Đợt combo có `availableCombos` đã được rà soát và nhóm lựa chọn, `selection` đã nộp, `confirmedSelection` đã xác nhận và `reasonRequiredOnChange` để hiển thị ô lý do khi thay đổi. Đợt OJT có `requiredRelativeSemester`, `pathway` và hồ sơ đã nộp trong kỳ.

Gia hạn combo riêng chỉ áp dụng cho đúng sinh viên được gia hạn. Chương trình không có combo hợp lệ: trả mảng rỗng và COMBO_OPTIONS_UNAVAILABLE. `canSubmit` là khả năng nộp tại thời điểm đọc, không thay kết quả xét ELIGIBLE và không thay kiểm tra lại khi ghi. Kết quả xét chính thức vẫn là điều kiện của bước duyệt/bàn giao.

Admin/Đào tạo vẫn xem phạm vi quản trị qua hai API này và được bổ sung nhãn học kỳ/kỳ OJT. Thao tác mở/sửa/chốt không mở thêm quyền cho sinh viên.

## Điều phối, đánh giá và doanh nghiệp

- QHDN coordination/evaluation search và detail có `student`, `company`, `position`, `registration` với tên/liên hệ/nội dung hồ sơ. Evaluation có thêm phân công, người hướng dẫn, kết quả liên quan và bộ tiêu chí đã lưu.
- Enterprise candidates có liên hệ sinh viên, hồ sơ/CV và vị trí đầy đủ ngay trong danh sách; chi tiết vẫn phục vụ truy cập một lần giới thiệu cụ thể, kể cả lịch sử.
- Enterprise internships có liên hệ, hồ sơ, người hướng dẫn, vị trí/mã/địa điểm/hình thức, templateId/scoreDetails/tiêu chí đã lưu, điểm và trạng thái kết quả. Điểm chính thức/kết luận chưa xác nhận được ẩn với doanh nghiệp.
- Enterprise profile có `summary`: tin đang công bố, tin chờ duyệt, ứng viên hiện tại chờ tiếp nhận, thực tập sinh đang hoạt động và đánh giá còn thiếu. Phạm vi ALL_SEMESTERS, chỉ tính trong doanh nghiệp đăng nhập.

Các trường liên quan chỉ đọc dữ liệu đã tồn tại. Lượt này không thay quy trình ghi đánh giá để áp dụng template; thiếu TemplateID vẫn trả template null. Các bước duyệt/chốt/xác nhận và API lịch sử phân trang vẫn giữ chức năng riêng.

Swagger đã bổ sung schema response, tham số phân trang hồ sơ và mô tả quyền. FE có thể dùng các trường mới dần, không phải đổi đường dẫn hoặc envelope cho các chức năng trên.
