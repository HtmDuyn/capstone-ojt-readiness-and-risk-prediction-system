# Khung chương trình chỉ nhập bằng import

1. POST /api/curriculum-imports/preview: kiểm tra toàn bộ dữ liệu, trả action CREATE/REPLACE và curriculumId bản sẽ thay thế (null nếu mới). Không ghi chương trình.
2. POST /api/curriculum-imports/commit: nhập toàn bộ khung trong một transaction.
3. Xem bằng POST /api/json/curricula/list hoặc /detail.
4. Import hợp lệ tự công bố PUBLISHED; không cần bước publish riêng. API publish riêng đã xóa; bản nháp cũ cần import lại dữ liệu hợp lệ.

Khóa nhận diện là curriculum.code trong request, tương ứng curriculum_code/TrainingPrograms.ProgramCode, không phân biệt hoa thường. Trùng mã thì thay thế bản cũ, kể cả đã PUBLISHED, giữ ProgramID. Version là metadata, không tạo thêm bản cùng mã. Nếu DB cũ có nhiều bản cùng mã, import trả 409 CURRICULUM_CODE_AMBIGUOUS để đối soát liên kết trước.

Mỗi lần nhập gửi đầy đủ curriculum, courses, combos, prerequisites, equivalences. Các tập này được thay thế, không nối thêm; mảng rỗng xóa cấu hình cũ tương ứng. Không gửi PATCH/PUT để sửa từng phần. Môn/chuyên ngành phải có trong danh mục; hiện nhận JSON chuẩn hóa, chưa nhận Excel/PDF trực tiếp.

Bản nhập thành công mặc định PUBLISHED, lưu PublishedBy là người import và PublishedAt là thời điểm nhập. Preview kiểm tra cả điều kiện công bố; thiếu/sai cấu trúc thì không cho commit. Khi ghi đè, DRAFT chỉ là trạng thái tạm bên trong transaction; lỗi sẽ rollback về bản cũ. Giữ ID môn/combo còn tồn tại để bảo toàn liên kết. Không xóa sinh viên, điểm, đăng ký hoặc quy tắc. Nếu bản mới bỏ combo/môn combo mà sinh viên đã chọn, hoặc xung đột FK khác, trả 409 và rollback toàn bộ. Cần xét lại điều kiện sau khi thay đổi khung; không thay thế lịch sử kết quả bằng dữ liệu mới.

Dùng idempotencyKey mới cho mỗi lần cập nhật. Gửi lại cùng key, payload và actor trả kết quả đã lưu (replayed), không ghi đè lần nữa; key cũ với payload/actor khác trả 409 IMPORT_CONFLICT. Commit trả action, curriculumId, status, số lượng cấu trúc và batchId. Audit lưu trước/sau.

Đã xóa native route, adapter JSON, Swagger và service không còn dùng:

- POST /api/curricula/{id}/publish và POST /api/json/curricula/publish
- PATCH /api/curricula/{id}
- PUT /api/curricula/{id}/courses
- PUT /api/curricula/{id}/prerequisites
- PUT /api/curricula/{id}/course-equivalences
- PUT /api/combos/{id}/courses

Danh mục môn/chuyên ngành và cấu hình quy đổi điểm OJT là chức năng riêng, giữ nguyên. FE muốn sửa khung phải import lại toàn bộ. Đã cập nhật trigger GuardPublishedProgram trong file backend/DB; không chỉnh sửa FE hoặc DB đang chạy. DB đã khởi tạo trước thay đổi cần áp dụng lại riêng định nghĩa hàm này trước khi import đè bản PUBLISHED; không chạy toàn bộ file reset để nâng cấp DB đang có dữ liệu.

Kiểm tra: backend build và sinh tài liệu thành công; kiểm tra service với persistence giả lập cho create/replace, preview không ghi, giữ ID, trả PUBLISHED, replay/xung đột key, bảo vệ lựa chọn sinh viên, xóa combo cũ và loại adapter Swagger. Đã kiểm tra trigger mới trên PostgreSQL bằng bảng/hàm tạm trong transaction rollback: chặn sửa trực tiếp bản PUBLISHED, chỉ cho mở lại DRAFT khi không sửa kèm metadata, cho sửa nội dung sau mở lại và rollback khôi phục bản cũ. Chưa chạy toàn bộ import service với PostgreSQL thực.
