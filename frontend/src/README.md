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
