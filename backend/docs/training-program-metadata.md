# Bổ sung metadata TrainingPrograms

## Khởi tạo DB mới bằng backend/DB

Section cuối `20261024 publish seeded training programs` đưa đúng 40 chương trình
catalog và chương trình `DEMO-OJT-READY` của file seed sang PUBLISHED, có người và
thời điểm công bố. Version mặc định `SEED-2026`, EffectiveYear `2026` biểu thị bản
seed này, không suy luận năm nhập học từ mã khóa. Metadata có sẵn được giữ lại.

Theo cấu hình seed dùng ngay, các cờ PrerequisitesReviewed, EquivalencesReviewed
và CoursesReviewed được bật; các dòng yêu cầu chương trình chưa có IsRequired
được chấp nhận là bắt buộc, còn slot vẫn giữ EntryKind và lựa chọn môn. Chính sách
GPA 10/LATEST được thêm cho chương trình chưa có chính sách; không đổi chính sách
đã tồn tại. Không tự dịch văn bản tiên quyết thành quy tắc mới hoặc thêm quan hệ
tương đương môn. Đây là cấu hình chấp nhận dữ liệu seed, không phải biên bản duyệt
CTĐT ngoài hệ thống.

Các giá trị mặc định DRAFT/false trong migration bên dưới vẫn giữ cho chương trình
không nằm trong seed và chương trình tạo mới qua API. Lệnh migration metadata chỉ
thêm cột; section công bố seed chạy khi dùng toàn bộ file để dựng DB mới.

Đã kiểm thử toàn bộ backend/DB trên PostgreSQL cô lập (PGlite): 41/41 chương trình
PUBLISHED, đủ metadata/cờ duyệt/chính sách GPA, truy vấn curriculum detail thành
công và chạy lại section seed không tạo trùng. Không reset hoặc thay đổi DB thật.

## Migration cho database hiện có

API curriculum đang đọc metadata chưa có trong schema rút gọn của TrainingPrograms.
Section `20261024 training program metadata compatibility` trong `backend/DB` bổ sung
10 cột, không tạo bảng ứng dụng mới:

| Cột | Kiểu / giá trị khi thêm vào bảng cũ |
| --- | --- |
| Version | varchar(10), NULL |
| EffectiveYear | integer, NULL; giá trị hợp lệ 1900–2200 |
| Status | varchar(20), DRAFT; chỉ nhận DRAFT/PUBLISHED |
| PrerequisitesReviewed | boolean, false |
| EquivalencesReviewed | boolean, false |
| CreatedBy | integer, NULL; khóa ngoại Users.UserID |
| CreatedAt | timestamptz, thời điểm migration |
| UpdatedAt | timestamptz, thời điểm migration |
| PublishedBy | integer, NULL; khóa ngoại Users.UserID |
| PublishedAt | timestamptz, NULL |

Chạy trong thư mục backend khi muốn áp dụng vào database được cấu hình trong `.env`:

```sh
npm run db:migrate:training-program-metadata
```

Lệnh build backend rồi chỉ trích/chạy đúng section bổ sung từ DB. Không chạy toàn bộ
`backend/DB` trên database đang có dữ liệu vì file có phần reset và seed.

Migration dùng transaction, advisory lock và ADD COLUMN IF NOT EXISTS; version
`20261024_training_program_metadata` được ghi vào bảng SchemaMigrations hiện có.
Chạy lại giữ nguyên giá trị các cột đã tồn tại. Không tự gán phiên bản/năm áp dụng,
người tạo/người công bố hoặc tự duyệt chương trình cũ. Cần điền metadata và thực hiện
nghiệp vụ công bố sau khi xác minh dữ liệu. Các chương trình vừa được bổ sung cột
Status mặc định DRAFT nên API chỉ cho xem chương trình đã công bố có thể trả 409
cho tới khi chương trình được công bố hợp lệ.

Đã kiểm thử SQL trên bảng tạm trong PostgreSQL: thêm đủ 10 cột, bảo toàn dữ liệu,
chạy lại không đổi metadata đã công bố và không ghi trùng version. Toàn bộ kiểm thử
được rollback; schema public không thay đổi. Migration chưa được áp dụng vào DB thật.
