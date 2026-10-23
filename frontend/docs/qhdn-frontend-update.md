**Cập nhật frontend QHDN — 23/10/2026**

Phạm vi: chỉ frontend. Không thay đổi backend, không commit/push. Các request ghi trong preview được chặn tại trình duyệt và giả lập phản hồi; không gửi tới Render. Đăng nhập và GET dùng tài khoản test được cung cấp. Không lưu tài khoản/mật khẩu/token trong repository.

**File đã thay đổi**

| File trong frontend/src | Thay đổi |
|---|---|
| services/qhdnService.ts | Bỏ API tạo company/position, fallback JSON, tìm hồ sơ JSON, GET profile và các wrapper không có caller. Giữ API đọc, điều phối và đăng ký đang dùng; sửa kiểu PATCH. |
| services/authService.ts | Bỏ getProfile gọi GET /accounts/me/profile. Giữ login và GET /auth/me. |
| services/qhdnService.ts (gộp API) | Tập trung API đợt tuyển dụng, duyệt/đóng tin, hồ sơ/ứng tuyển, cập nhật doanh nghiệp, phân công, báo cáo và API trả Blob qua Bearer header. Xóa file service tách riêng sau khi gộp. |
| utils/downloadFile.ts (mới) | Nhận hàm lấy Blob từ service; tạo link tải file, thu hồi object URL và đọc lỗi JSON trong Blob. Không gọi API trực tiếp. |
| types/qhdn/workflowTypes.ts (mới) | Kiểu phân trang, hồ sơ, ứng tuyển, đợt/tin tuyển dụng, phân công và báo cáo theo contract. |
| types/qhdn/qhdnTypes.ts | Bỏ kiểu mock/cũ; sửa request reason/idempotency; điểm đánh giá cho phép null; type phản hồi import và bỏ type request cũ không có caller; payload import multipart dùng windowId. |
| types/axios.d.ts | Khai báo generic PATCH để không ép API.patch as any. |
| components/qhdn/QhdnUi.tsx (mới) | Field, panel, thông báo, bảng, phân trang; hook bỏ phản hồi cũ; giữ idempotencyKey khi thử lại cùng payload. |
| components/qhdn/import/QhdnEnterpriseImportModal.tsx | Import file XLSX/CSV qua multipart theo windowId; giới hạn 8 MB; tách preview và xác nhận; giữ cùng file/key; không tự sinh email/quota hoặc lưu doanh nghiệp giả trong localStorage. |
| pages/qhdn/QhdnEnterprise.tsx | Thay form tạo API cũ bằng cập nhật doanh nghiệp; quản lý tạo/mở/đóng/gia hạn đợt; đọc/duyệt/đóng tin, chỉ tiêu thực tế; import theo đợt. Bỏ xóa giả trên localStorage và MOU/quota tự gán. |
| pages/qhdn/QhdnOjtCoor.tsx | Tab duyệt hồ sơ, ứng tuyển/CV, điều phối, phân công. Request đúng reason/ngày/idempotency; cập nhật trạng thái riêng với thông tin; không tự tạo phân công khi ACCEPTED; bỏ GPA/kỹ năng/tín chỉ tự gán. |
| pages/qhdn/QhdnEvaluations.tsx | Tab đánh giá, kết quả và ba loại báo cáo; lọc kỳ/doanh nghiệp, phân trang server; điều kiện chuyển giao; giữ null điểm; tải CSV/PDF bằng Bearer. |
| pages/qhdn/QhdnDashboard.tsx | Bỏ limit=200; đọc đủ trang; chỉ lấy lượt điều phối mới nhất theo hồ sơ; xóa dữ liệu cũ khi đổi kỳ và hiển thị lỗi tải. |
| pages/qhdn/QhdnRegistrationWindows.tsx | Tải đủ trang kỳ/đợt; phân trang hiển thị sinh viên và đợt, giữ đầy đủ danh sách cho thao tác chọn scope. |
| config/menus/qhdnMenu.tsx | Đổi tên menu để phản ánh phần tuyển dụng, duyệt hồ sơ và điều phối. |

**File dư đã xóa**

Các file sau không còn được cây import từ main.tsx sử dụng sau khi thay thế màn hình. Chức năng cần thiết được đưa vào các trang/hàm dùng chung nêu trên.

- components/qhdn/coordination/StudentDetailModal.tsx
- components/qhdn/coordination/StudentMatchModal.tsx
- components/qhdn/enterprise/CreateModal.tsx
- components/qhdn/enterprise/PartnerDetailModal.tsx
- components/qhdn/import/EnterpriseDetailModal.tsx
- components/qhdn/import/ExtractionKpiCards.tsx
- components/qhdn/import/FileImportModal.tsx
- components/qhdn/import/ImportSuccessModal.tsx
- data/qhdn/qhdnMockData.ts

**Đánh giá và giới hạn**

- Các bảng nghiệp vụ mới dùng phân trang server, 10 bản ghi/trang. Danh mục dùng cho chọn công ty/kỳ/vị trí và danh sách scope đăng ký tải đủ trang với tối đa 100 bản ghi/request. Đây là lựa chọn phục vụ chọn toàn bộ phạm vi, không phải server pagination cho các danh mục này.
- Swagger hiện không có GET liệt kê đợt tuyển dụng. Màn hình cho tạo mới và mở/đóng/gia hạn theo mã đợt đã biết hoặc vừa tạo; mã đợt cũng hiển thị trong tin tuyển dụng. Không tự thêm endpoint chưa có hoặc giả lập danh sách đợt bằng localStorage.
- Các thao tác không hợp lệ theo dữ liệu hiện tại vẫn được backend kiểm tra và trả lỗi cụ thể, ví dụ hồ sơ đã điều phối, phân công đã tồn tại hoặc bị khóa sau khi có kết quả.
- Chưa kiểm thử ghi dữ liệu thật hay toàn bộ chuyển trạng thái nghiệp vụ trên Render. Preview kiểm tra UI, request contract và xử lý phản hồi bằng cách chặn POST/PATCH.
- Preview local: http://127.0.0.1:5173/qhdn/enterprises . Đăng nhập lại bằng tài khoản QHDN để sử dụng trên trình duyệt của bạn; phiên headless kiểm thử tách riêng.

**Kiểm chứng**

- Build cuối: npm run build (TypeScript + Vite) đạt; git diff --check đạt. Backend không có thay đổi.
- Đối chiếu tĩnh 29 cặp method/path trong service với Swagger: không còn operation không được mô tả. Các URL download và hai nhánh import được kiểm tra bổ sung qua trình duyệt.
- Preview chính: 14 ảnh desktop/mobile, 43 GET từ Render, 7 request ghi bị chặn và kiểm tra các trường theo schema Swagger, không có lỗi JavaScript trong lượt đạt.
- Preview bổ sung với fixture: 2 ảnh (tiếp nhận và import), 25 GET giả lập, 6 request ghi bị chặn; multipart có windowId/kind/idempotencyKey/file và không có semesterId; PATCH trạng thái phân công chỉ gửi status/reason.
- Kiểm tra tải kết quả CSV/PDF và báo cáo CSV có Authorization Bearer, URL không có token; request đọc được kiểm tra ở preview chính, cơ chế header/blob được kiểm tra ở lượt bổ sung.
- Các ca độc lập đạt: phân trang server trang 2/3, reset trang khi đổi bộ lọc, bỏ phản hồi chậm cũ, hiển thị lỗi API, không cho duyệt lại APPROVED (chỉ còn từ chối trước khi điều phối).
- Tổng request ghi ở hai lượt đạt: 13 request được giả lập; không có POST/PATCH nghiệp vụ thực tế lên Render. Chưa xác nhận thành công ghi dữ liệu thật.
- Ảnh/log ở thư mục tạm: C:/Users/THANHH~1/AppData/Local/Temp/ojt-qhdn-preview/ . Files preview-results.json, preview-extra-results.json, pagination-tests.json chứa kết quả đã lược bỏ token/mật khẩu.

Preview ảnh: [Doanh nghiệp desktop](C:/Users/THANHH~1/AppData/Local/Temp/ojt-qhdn-preview/02-enterprises.png), [Hồ sơ/điều phối mobile](C:/Users/THANHH~1/AppData/Local/Temp/ojt-qhdn-preview/14-mobile-coordination.png), [Import multipart — fixture](C:/Users/THANHH~1/AppData/Local/Temp/ojt-qhdn-preview/16-import-preview.png).

Nút lưu trữ tuyển dụng qua POST /imports/archive được giữ lại, chỉ chạy khi người dùng xác nhận trên giao diện; chưa chạy archive thật trong kiểm thử.
