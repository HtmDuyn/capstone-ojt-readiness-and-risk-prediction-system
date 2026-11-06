# Cấu trúc frontend

Phân hệ Phòng Đào tạo dùng cùng cách phân tầng với QHDN:

```text
pages/education/          Màn hình và tương tác theo route
components/education/     Thành phần giao diện, bảng và biểu mẫu
hooks/useEducation*.ts    Trạng thái, tải dữ liệu và điều phối thao tác
services/                API client và các service nghiệp vụ
types/education/         Kiểu dữ liệu học vụ, import, báo cáo và xét OJT
utils/                   Chuẩn hóa dữ liệu, lọc kết quả, xử lý Excel, tải file
config/api.ts            Địa chỉ API dùng chung cho toàn ứng dụng
config/menus/            Menu riêng cho từng role
routers/                 Khai báo route và kiểm tra role
```

- Dùng duy nhất `services/`; không tạo lại thư mục `service/`.
- Import types từ `types/education/`, không lấy types qua service.
- Component dùng chung cho nhiều màn hình đặt trong `components/education/`.
- Hook gọi service; hàm xử lý dữ liệu thuần đặt trong `utils/`.
- `educationCatalog.service.ts` tải danh mục cho import. Truyền danh mục vào `studentImportWorkbook.ts` để xử lý file độc lập với API.
- `EducationSupportClassDemand.tsx` là màn hình nhu cầu lớp hỗ trợ; giữ URL `/education/ai-class-proposals` để tương thích đường dẫn cũ.
- Phòng Đào tạo quản lý năm học, học kỳ và xét điều kiện; đợt đăng ký OJT thuộc QHDN.
- Trang năm học dùng `useEducationAcademicCalendar`, `AcademicCalendarEditor` và `utils/academicCalendar.ts`. Tạo năm học tự sinh Spring → Summer → Fall của năm đầu trong mã năm học; chỉnh lịch gửi đủ 3 kỳ và revision trong một yêu cầu. BE lưu bằng transaction, không gọi PATCH từng kỳ từ FE.

Kiểm tra sau khi thay đổi: `npm run build`.

## Luồng Education hiện tại

- Route Education được khai báo trong `routers/educationRoutes.tsx`, kiểm tra role bằng `PrivateRoute` và tải trang bằng lazy import.
- `EducationOjtConditions` chỉ hiển thị UI; `useEducationOjtEligibility` điều phối tải hồ sơ, xét tối đa 4 hồ sơ đồng thời và lưu kết quả.
- `utils/localOjtEligibility.ts` chứa hàm tính thuần và quy tắc dùng chung: 70 tín chỉ, tối đa 2 môn chưa đạt. `localOjtEligibility.service.ts` tải đủ các trang bảng điểm và lưu kết quả tới BE; không chuyển sang API xét điều kiện tại BE.
- `useEducationOjtHandoff` và `useEducationOjtFinalResults` quản lý trạng thái; `educationOjtWorkflow.service.ts` phụ trách API bàn giao và xác nhận kết quả. Hợp đồng dữ liệu đặt trong `types/education/ojtWorkflow.types.ts`.
- Import chương trình đào tạo: component quản lý tương tác, `utils/curriculumImportWorkbook.ts` đọc/kiểm tra Excel và tạo file mẫu; `services/curriculumCourseResolver.ts` tra mã môn học. Parser nhận hàm tra cứu qua tham số để không phụ thuộc trực tiếp API.
- Đã bỏ các trang mock xét OJT, cảnh báo học vụ và xét tốt nghiệp cùng route tương ứng; bỏ component `EligibilityAssessment` chưa được sử dụng. Các service eligibility còn được các màn hình thực tế gọi vẫn được giữ.

Kiểm tra hồi quy nghiệp vụ: `npm run test:education`. Kiểm tra TypeScript và bundle: `npm run build`.
