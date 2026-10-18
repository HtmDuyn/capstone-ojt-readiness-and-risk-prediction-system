# Khung chương trình được tạo bằng import

## Luồng hiện hành

1. POST /api/curriculum-imports/preview kiểm tra dữ liệu chuẩn hóa; không tạo chương trình.
2. POST /api/curriculum-imports/commit nhập chương trình, khung môn/slot, combo/nhóm lựa chọn/ánh xạ slot, tiên quyết và tương đương trong một transaction; kết quả DRAFT.
3. Xem bằng POST /api/json/curricula/search hoặc /detail.
4. Nếu cần, sửa metadata bằng PATCH /api/json/curricula; sửa các tập môn/tiên quyết/tương đương/combo bằng PUT hiện có.
5. POST /api/json/curricula/publish rà soát điều kiện và ban hành; chương trình đã ban hành bị khóa. Muốn phiên bản mới phải import với code/version chưa tồn tại.

Import hiện nhận JSON đã chuẩn hóa, không phải upload trực tiếp file Excel/PDF. Danh mục môn/chuyên ngành phải tồn tại trước; môn được tìm theo courseId hoặc courseCode. Import không tự tạo môn/chuyên ngành mới.

## API đã xóa

| API cũ | Thay thế |
|---|---|
| POST /api/curricula | Preview/commit import trọn khung chương trình |
| POST /api/curricula/{id}/combos; adapter POST /api/json/curricula/combos | Gửi combos cùng payload import |

Đã xóa native route, Swagger, adapter và logic tạo thủ công không còn được dùng. writeMetadata/insertCombo vẫn là helper nội bộ để import tạo dữ liệu; API PATCH metadata chỉ sửa ID tồn tại.

Không xóa POST /api/courses và POST /api/majors vì import còn yêu cầu danh mục này. Không xóa PUT sửa tập môn/tiên quyết/tương đương/combo vì cần sửa/rà soát bản nháp sau import; import hiện chỉ tạo phiên bản mới, không cập nhật đè phiên bản đã có. Giữ publish vì import thành công chưa đồng nghĩa được ban hành.

## Ảnh hưởng FE

FE cần bỏ nút tạo chương trình/tạo combo thủ công và dùng import có combos. Nhánh origin/Nhat_Role_PDAoTao đã có lời gọi POST /api/json/curricula/combos trong curriculum.service.ts, cần chuyển luồng này. FE chưa được sửa trong lượt này. Các API xem, sửa nháp và ban hành giữ đường dẫn hiện có.

Tổng 164 API: Admin 154, Phòng đào tạo 92, Phòng QHDN 44, Doanh nghiệp 12, Sinh viên 17, Auth 3. Không thay đổi DB chính hoặc cấu trúc DB.
