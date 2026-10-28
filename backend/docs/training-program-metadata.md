# Metadata TrainingPrograms

## Khởi tạo DB mới bằng backend/DB

File bootstrap tạo đủ các cột metadata trong CREATE TABLE và INSERT ngay trạng thái cuối của catalog: 40 chương trình chính thức PUBLISHED cùng chương trình minh họa DEMO-SE-FULL. Không có bước INSERT DRAFT rồi UPDATE để công bố phía dưới.

Version SEED-2026 và EffectiveYear 2026 mô tả bản catalog, không suy luận năm nhập học từ mã khóa. Các giá trị PrerequisitesReviewed và EquivalencesReviewed được giữ đúng cấu hình cuối; không bật review khi còn điều kiện tiên quyết dạng văn bản chưa có nhóm điều kiện. Combo được nạp với CoursesReviewed đã cấu hình, yêu cầu môn và chính sách GPA 10/LATEST được INSERT trực tiếp. Không tự tạo quan hệ tương đương môn.

Giá trị mặc định DRAFT/false vẫn áp dụng cho chương trình mới qua API. Việc công bố chương trình mới tiếp tục dùng kiểm tra nghiệp vụ hiện tại.

## Script duy nhất

Toàn bộ cột, default, ràng buộc và dữ liệu metadata đều nằm trong `backend/DB`. Chạy nguyên file để khởi tạo database; không có migration metadata riêng. File này là full reset, không dùng để nâng cấp DB đang có dữ liệu.
