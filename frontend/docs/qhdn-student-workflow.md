# Giao diện tiếp nhận và điều phối OJT

Cập nhật ngày 23/10/2026. Chỉ thay đổi frontend; không commit/push, không thay đổi backend.
Tài liệu này thay thế mô tả màn hình tiếp nhận/điều phối trong báo cáo `qhdn-frontend-update.md` trước đó.

## Luồng sử dụng

1. **Tiếp nhận & Duyệt hồ sơ**: chọn học kỳ, tìm sinh viên và lọc theo trạng thái, chương trình, khóa. Chỉ có ba trạng thái: Chưa đăng ký, Đã nộp hồ sơ, Đã duyệt. Thẻ thống kê cũng là bộ lọc. Danh sách có phân trang và giữ chức năng chọn sinh viên để mở đợt đăng ký.
2. **Duyệt & gửi**: mở hồ sơ, tải CV, kiểm tra nguyện vọng ứng tuyển, chọn doanh nghiệp/vị trí còn chỉ tiêu, nhập ghi chú và xác nhận. Nếu chưa có ứng tuyển, QHDN có thể chủ động giới thiệu tới vị trí đang mở. Không tự gán nơi nhận ngoài lựa chọn đã xác nhận.
3. Gọi API duyệt trước, sau đó API gửi/điều phối. Hai thao tác backend không phải một giao dịch. Nếu duyệt thành công nhưng gửi lỗi, giao diện báo rõ và cho gửi lại, không duyệt lần hai. Cùng payload thử lại dùng cùng idempotency key.
4. **Theo dõi & Điều phối**: bốn nhóm Cần điều phối, Chờ doanh nghiệp duyệt, Đã tiếp nhận, Doanh nghiệp từ chối. Bộ lọc theo học kỳ, từ khóa, doanh nghiệp và khóa. Dùng lượt điều phối mới nhất do API danh sách sinh viên trả về.
5. Sinh viên bị doanh nghiệp từ chối được tô nổi, hiện lý do và nút **Điều phối lại**. Chọn vị trí mới đang mở, còn chỉ tiêu; nhập lý do và xác nhận. Sau thành công, tải lại trạng thái từ API.
6. Sinh viên đang chờ doanh nghiệp hoặc đã tiếp nhận chỉ xem chi tiết tại danh sách theo dõi. QHDN không nhập quyết định thay doanh nghiệp. Hồ sơ đã duyệt nhưng chưa gửi được dẫn về Tiếp nhận để gửi.
7. **Phân công thực tập** giữ ở tab phụ, tạo phân công từ sinh viên đã được doanh nghiệp tiếp nhận; không tự tạo khi doanh nghiệp đồng ý.

Hồ sơ từng bị QHDN từ chối vẫn thuộc nhóm Đã nộp hồ sơ, kèm ghi chú yêu cầu bổ sung và không có nút duyệt đến khi nộp lại. Hồ sơ cũ cần đối soát cũng có ghi chú riêng. Doanh nghiệp từ chối không làm mất trạng thái Đã duyệt của hồ sơ.

## File thay đổi trong lần thiết kế này

| File trong `frontend/src` | Nội dung |
| --- | --- |
| `pages/qhdn/QhdnRegistrationWindows.tsx` | Thiết kế lại tiếp nhận, ba trạng thái, lọc/phân trang, duyệt và gửi; giữ quản lý đợt đăng ký. |
| `pages/qhdn/QhdnOjtCoor.tsx` | Danh sách theo dõi bốn nhóm, lý do từ chối, chi tiết và điều phối lại; bỏ các tab duyệt/ứng tuyển cũ ở màn hình này. |
| `components/qhdn/StudentReviewModal.tsx` | Xem hồ sơ/CV, kiểm tra nơi nhận, duyệt rồi gửi, xử lý lỗi từng bước và gửi lại. |
| `components/qhdn/StudentWorkflowUi.tsx` | Badge, thống kê, bước quy trình, chọn học kỳ và hộp thoại dùng chung; hỗ trợ bàn phím/focus. |
| `components/qhdn/InternshipAssignments.tsx` | Tách giao diện phân công khỏi trang điều phối để giảm độ dài và giữ chức năng hiện có. |
| `hooks/useQhdnRoster.ts` | Dùng chung tải học kỳ/danh sách đầy đủ, tải lại sau thao tác, bỏ phản hồi cũ khi đổi kỳ. |
| `utils/qhdnStudentStatus.ts` | Quy đổi trạng thái hiển thị, nhãn và tìm kiếm dùng chung; không gọi API. |
| `types/qhdn/workflowTypes.ts` | Bổ sung bộ lọc registrationId để lấy ứng tuyển đúng hồ sơ. |
| `config/menus/qhdnMenu.tsx` | Đổi tên menu theo hai nhiệm vụ mới. |

API tiếp tục tập trung trong `services/qhdnService.ts`; tải file qua Bearer header và helper `utils/downloadFile.ts`. Không bổ sung dữ liệu giả vào giao diện chạy thật.

## Kiểm tra và giới hạn

- `npm.cmd run build --prefix frontend`: thành công, gồm TypeScript và Vite.
- `node --test frontend/tests/qhdnStudentStatus.test.mjs`: 8/8 ca kiểm tra trạng thái và tìm kiếm thành công.
- Kiểm thử trình duyệt với API mô phỏng: đúng ba trạng thái tiếp nhận; phân trang; duyệt trước gửi sau; lỗi gửi sau duyệt và gửi lại cùng key; điều phối lại hồ sơ bị từ chối; loại vị trí cũ/hết chỉ tiêu; hồ sơ chờ duyệt chỉ xem; chuyển về Tiếp nhận; đóng modal bằng Escape; preview desktop/mobile. Không có request tới production trong lần kiểm thử này.
- Chưa thực hiện giao dịch duyệt/gửi/điều phối lại trên dữ liệu backend thật. Tính thành công của giao dịch thật còn phụ thuộc dữ liệu, quyền và quy tắc backend tại thời điểm thao tác.
- Bảng trên điện thoại cuộn ngang để giữ đầy đủ thông tin. Bộ lọc xếp dọc, modal có cuộn và nút thao tác rõ ràng.

## Preview

Ảnh dùng dữ liệu mô phỏng để minh họa, không phải số liệu hệ thống thật.

- [Tiếp nhận desktop](previews/qhdn-reception.png)
- [Hộp thoại duyệt và gửi](previews/qhdn-review.png)
- [Điều phối desktop](previews/qhdn-coordination.png)
- [Tiếp nhận mobile](previews/qhdn-reception-mobile.png)

Chạy `npm.cmd run dev --prefix frontend`, đăng nhập QHDN và mở mục **Tiếp nhận & Duyệt hồ sơ** hoặc **Theo dõi & Điều phối** để xem giao diện tương tác. Thao tác xác nhận ở phiên chạy bình thường sẽ gọi backend được cấu hình trong môi trường.
