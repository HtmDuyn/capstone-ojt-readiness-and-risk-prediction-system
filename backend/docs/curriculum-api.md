> Hợp đồng cập nhật: [chỉ import và ghi đè theo mã](curriculum-import-only.md).

> Luồng mới: [khung chương trình tạo bằng import](curriculum-import-only.md). Chỉ import để tạo/thay thế; không còn API sửa riêng metadata, môn, tiên quyết, tương đương hoặc combo.

> Cập nhật hợp đồng API: xem [API sau khi xóa/gộp](api-consolidation.md) và [danh sách hiện hành](api-input-reference.md). Các endpoint cũ được thay thế theo bảng chuyển đổi.

# Chương trình đào tạo và combo

Base URL `http://localhost:3000/api`; gửi Bearer token của ADMIN hoặc ACADEMIC. Swagger JSON tại `http://localhost:3000/api-docs`. Các ID dưới đây chỉ là ví dụ: thay bằng ID thực trả về từ API.

Schema và các ràng buộc được bổ sung trong `backend/DB`, phần `20261008 curriculum management and publication`. API chỉ thao tác dữ liệu, không tạo bảng hoặc seed. File DB đầy đủ là script khởi tạo/reset, không chạy toàn bộ trên dữ liệu production hiện có.

## Danh mục chuyên ngành và môn

`GET /majors`, `POST /majors`: chuyên ngành SE/IA/... nằm trong Specializations. `id` là SpecializationID dùng cho `majorId` của chương trình. Ngành cha nằm trong AcademicMajors; danh sách trả thêm `parentMajorId`, mã và tên ngành cha. Lọc `search`, `parentMajorId`, `page`, `limit` tối đa 100.

```json
{"code":"SE","name":"Kỹ thuật phần mềm","parentMajorId":1}
```

`GET /courses`, `POST /courses`, `PATCH /courses/:id`. Tìm bằng `search`, phân trang `page`/`limit`. Mã không phân biệt hoa thường khi kiểm tra trùng; điểm đã có lịch sử hoặc môn thuộc chương trình đã ban hành không được đổi mã. Tên môn trong khung chương trình được lưu riêng theo phiên bản.

```json
{"code":"PRF192","name":"Programming Fundamentals","defaultCredits":3,"isOjtPrerequisite":false}
```

Tín chỉ mặc định có thể là số thập phân hoặc null. Tính tiến độ vẫn dùng tín chỉ cụ thể trong chương trình; cờ OJT toàn cục không thay thế quy tắc tiên quyết theo chương trình.

## Chương trình và phiên bản

- `GET /curricula`: lọc `search`, `majorId`, `version`, `status` DRAFT/PUBLISHED, `page`, `limit`.
- `POST /curriculum-imports/preview` và `/commit`: kiểm tra và nhập toàn bộ khung và tự công bố PUBLISHED; không có API tạo khung thủ công.
- `GET /curricula/:id`: trả metadata, môn, tiên quyết, combo/nhóm chọn/slot, tương đương môn.
- Trùng `curriculum.code` (curriculum_code), không phân biệt hoa thường: thay thế toàn bộ bản cũ, giữ ProgramID; version là metadata, không phải khóa tạo bản mới.

```json
{
  "code":"SE-OJT",
  "name":"Chương trình kỹ thuật phần mềm",
  "version":"2026.1",
  "majorId":1,
  "totalCredits":9,
  "effectiveYear":2026,
  "gpaScale":10
}
```

Khóa phiên bản là code + version, không phân biệt hoa thường. Cùng code có thể có nhiều version, mỗi bản có ProgramID riêng. Sinh viên vẫn liên kết với ProgramID cụ thể, không tự chuyển sang phiên bản mới. GPA chọn thang 4 hoặc 10; học lại luôn lấy lần hoàn tất có điểm gần nhất (LATEST).

## Môn, tín chỉ và kỳ học

Trường `courses` trong payload import thay toàn bộ khung môn:

```json
{
  "courses":[
    {"courseId":1,"credits":3,"semester":1,"isRequired":true,"entryKind":"COURSE"},
    {"courseId":2,"credits":3,"semester":2,"isRequired":true,"entryKind":"COURSE"},
    {"courseId":3,"credits":3,"semester":3,"isRequired":true,"entryKind":"COMBO_SLOT"}
  ]
}
```

Mỗi dòng gửi đúng một trong `courseId` hoặc `courseCode`; môn phải tồn tại trong danh mục. `credits` >= 0, tối đa hai chữ số thập phân; `semester` 0–20 (0 cho môn nền tảng), `isRequired` phải xác nhận true/false. `entryKind` COURSE/COMBO_SLOT/ELECTIVE_SLOT, mặc định COURSE. `prerequisiteText` chỉ lưu mô tả nguồn, không tự thực thi.

Import lại thay thế toàn bộ cấu trúc, giữ ID các môn/combo còn tồn tại và tự công bố PUBLISHED, kể cả bản đã ban hành. Không xóa combo/môn combo đã được sinh viên chọn; lỗi sẽ rollback toàn bộ.

## Combo, nhóm chọn và slot

Combo mới được gửi trong `combos` của payload import, kèm `courses` và `choiceGroups`. Xem combo qua `POST /api/json/curricula/detail`, trường `data.combos`. Metadata combo trong dữ liệu import:

```json
{"code":"COM_SE","name":"Combo kỹ thuật phần mềm","selectionGroup":"SPECIALIZATION"}
```

Trong từng phần tử `combos` của import, gửi toàn bộ môn, nhóm chọn và ánh xạ slot:

```json
{
  "courses":[
    {"courseId":4,"credits":3,"semester":3,"slotCourseIds":[3]},
    {"courseId":5,"credits":3,"semester":3,"slotCourseIds":[3]}
  ],
  "choiceGroups":[
    {"code":"CHOOSE_ONE","minCourses":1,"maxCourses":1,"courseIds":[4,5]}
  ]
}
```

`slotCourseIds` là CourseID của placeholder trong chương trình, không phải ProgramCourseID. Ánh xạ phải rõ ràng, không tự ghép theo kỳ. Tín chỉ môn combo phải bằng tín chỉ slot được ánh xạ. Mỗi môn phải thuộc đúng một nhóm chọn. Môn bắt buộc dùng nhóm min=max=1; chọn một trong nhiều môn dùng min=max=1 với nhiều thành viên.

Khi ban hành, mọi môn combo phải có slot và giới hạn các nhóm phải có khả năng bố trí vào các slot riêng biệt. Môn combo là cách hoàn thành slot, không cộng thêm tín chỉ vào tổng khung. Cấu hình combo không tự xác nhận lựa chọn cá nhân của sinh viên; StudentComboSelections vẫn cần xác nhận riêng.

## Tiên quyết và tương đương

Trường `prerequisites` trong payload import:

```json
{
  "prerequisites":[
    {"courseId":2,"groupCode":"BASIC","minimumPassed":1,"prerequisiteCourseIds":[1]}
  ]
}
```

Các nhóm của cùng một môn kết hợp AND. Bên trong nhóm cần đạt ít nhất minimumPassed môn: 1 trong nhiều môn là OR; số lượng bằng toàn bộ nhóm là AND. Môn tiên quyết thuộc các môn thực của chương trình/combo; không dùng placeholder, không tự tham chiếu hoặc tạo chu trình. `prerequisites: []` xác nhận chương trình không có điều kiện tiên quyết cần lưu.

Trường `equivalences` trong payload import:

```json
{
  "equivalences":[
    {"sourceCourseId":6,"targetCourseId":4,"reason":"Công nhận môn khi chuyển combo theo quyết định phòng đào tạo"}
  ]
}
```

Nguồn là môn đã học, đích là môn thực thuộc chương trình hoặc combo hiện tại. Mỗi nguồn chỉ có một đích trong một phiên bản; không tự ánh xạ hoặc tạo vòng lặp. Được lưu người xác nhận, thời điểm và lý do. `equivalences: []` xác nhận không có ánh xạ.

API tính tiến độ đã dùng các ánh xạ này để công nhận tín chỉ một lần. Việc xác nhận môn học cụ thể của sinh viên dùng kết quả RECOGNIZED; cấu hình tương đương không tự tạo kết quả học tập. Sau quy đổi tương đương, tiên quyết cũng không được tạo chu trình hoặc đếm hai alias thành hai môn đã đạt.

## Import JSON toàn bộ khung

`POST /curriculum-imports/preview` và `/commit` nhận cùng cấu trúc:

```json
{
  "idempotencyKey":"SE-OJT-2026.1-import-v1",
  "sourceName":"Khung chương trình được phòng đào tạo xác nhận",
  "curriculum":{
    "code":"SE-OJT","name":"Chương trình kỹ thuật phần mềm","version":"2026.1",
    "majorId":1,"totalCredits":9,"effectiveYear":2026,"gpaScale":10
  },
  "courses":[
    {"courseId":1,"credits":3,"semester":1,"isRequired":true},
    {"courseId":2,"credits":3,"semester":2,"isRequired":true},
    {"courseId":3,"credits":3,"semester":3,"isRequired":true,"entryKind":"COMBO_SLOT"}
  ],
  "combos":[{
    "code":"COM_SE","name":"Combo kỹ thuật phần mềm",
    "courses":[
      {"courseId":4,"credits":3,"semester":3,"slotCourseIds":[3]},
      {"courseId":5,"credits":3,"semester":3,"slotCourseIds":[3]}
    ],
    "choiceGroups":[{"code":"CHOOSE_ONE","minCourses":1,"maxCourses":1,"courseIds":[4,5]}]
  }],
  "prerequisites":[{"courseId":2,"groupCode":"BASIC","minimumPassed":1,"prerequisiteCourseIds":[1]}],
  "equivalences":[{"sourceCourseId":6,"targetCourseId":4,"reason":"Công nhận môn khi chuyển combo"}]
}
```

Các danh sách đều phải gửi; dùng [] nếu không có. Import tạo mới khi chưa có mã; trùng mã thì ghi đè bản cũ và tự công bố PUBLISHED khi hợp lệ, không tự tạo môn chưa tồn tại. Chuẩn bị danh mục môn/chuyên ngành trước. Giới hạn 500 môn/nhóm chọn/ánh xạ, 100 combo và 1000 nhóm tiên quyết; toàn bộ body tuân giới hạn JSON 1MB của backend.

Preview đọc và kiểm tra, không ghi bất kỳ dữ liệu/lịch sử nào. Lỗi preview trả `data.canCommit: false` cùng errors. Commit lỗi rollback toàn bộ khung, trả lỗi và `importBatchId` khi đã lưu lịch sử. Thành công trả `curriculumId`, `batchId`, PUBLISHED. Cùng khóa/payload/người nhập trả `replayed: true`; payload khác hoặc người khác dùng khóa đó bị từ chối. Lô lỗi có thể sửa và gửi lại vì chưa có commit thành công.

Tra lịch sử qua `POST /api/json/academic-imports/list` với kind CURRICULUM; lấy chi tiết bằng importId trong cùng API. Import tự kiểm tra điều kiện ban hành và công bố; không cần gọi publish riêng.

## Công bố tự động

Import kiểm tra đầy đủ điều kiện công bố rồi tự đặt PUBLISHED, lưu PublishedBy/PublishedAt. API publish riêng đã xóa; chương trình nháp cũ cần import lại toàn bộ dữ liệu hợp lệ. Lỗi sẽ rollback và giữ bản cũ.
