# API kiểm tra và xác nhận điều kiện OJT

> Cập nhật G01–G05: xem [cấu hình kỳ đăng ký, lịch combo, preview, mốc xét và đồng bộ điểm OJT](academic-workflow-gaps.md). Các ràng buộc mới này được áp dụng cùng các API bên dưới.

Tất cả API dùng `Authorization: Bearer <JWT>`. ADMIN và ACADEMIC quản lý quy tắc, chạy kiểm tra, xác nhận và xem batch. STUDENT chỉ xem kết quả/lịch sử của mình. Response có dạng `{ "success": true, "data": ... }`.

## Định nghĩa điều kiện

- Tín chỉ tích lũy **>= 70**, theo chương trình và combo đã xác nhận hiện tại. Dùng chung thuật toán tiến độ: học lại, công nhận và tương đương chỉ ghi nhận tín chỉ một lần.
- Số môn chưa đạt **<= 2**. `debtBasis: "FAILED_ATTEMPTS"`: đếm môn thuộc chương trình/combo hiện tại đã trượt và chưa từng đạt hoặc được công nhận. Môn chưa học/đang học chưa có kết quả trượt không được tính là môn nợ; các môn tương đương tính một môn.
- Không xét GPA. Thiếu cấu hình tín chỉ, combo, chương trình đã ban hành, quy tắc đã ban hành hoặc sinh viên/tài khoản không ACTIVE trả `REVIEW_REQUIRED` và lý do; không tự coi là đủ điều kiện.
- `ELIGIBLE`: đủ điều kiện; `NOT_ELIGIBLE`: thiếu tín chỉ hoặc vượt số môn nợ. Kết quả trả `earnedCredits`, `missingCredits`, `unpassedCourseCount`, `unpassedCourses`, `excessUnpassedCourses`, `reasons` và bản quy tắc.

## 1. Bộ quy tắc

`GET /api/ojt-rule-sets?programId=1&page=1&limit=20` hỗ trợ thêm `ojtSemesterId`, `status=DRAFT|PUBLISHED`.

`POST /api/ojt-rule-sets`:

```json
{
  "programId": 1,
  "ojtSemesterId": null,
  "version": 1,
  "name": "Điều kiện OJT phiên bản 1",
  "minCredits": 70,
  "maxUnpassedCourses": 2,
  "debtBasis": "FAILED_ATTEMPTS"
}
```

Hai ngưỡng được mặc định tại DB và chỉ nhận 70/2. `ojtSemesterId: null` áp dụng chung; quy tắc riêng theo kỳ được ưu tiên. Các ID ví dụ cần thay bằng ID thật.

`PATCH /api/ojt-rule-sets/1` nhận các trường ở trên, chỉ sửa DRAFT:

```json
{ "name": "Điều kiện OJT cập nhật" }
```

`POST /api/ojt-rule-sets/1/publish` không cần body. Chương trình phải PUBLISHED. Quy tắc ban hành bất biến cả ở API và DB. Phiên bản mới phải lớn hơn phiên bản đang hoạt động trong cùng chương trình/phạm vi kỳ. Ban hành phiên bản mới chuyển con trỏ quy tắc đang áp dụng, giữ lịch sử cũ. Gọi lại publish phiên bản cũ không kích hoạt lại phiên bản đó.

## 2. Kiểm tra một sinh viên

`POST /api/students/1/eligibility-checks`:

```json
{ "ojtSemesterId": 1 }
```

Trả HTTP 201 và `checkId`. Mỗi lần xét lưu snapshot nguồn, quy tắc và kết quả bất biến. Không gửi email và không tự xác nhận chính thức.

## 3. Kiểm tra hàng loạt

`POST /api/eligibility-check-runs`:

```json
{
  "ojtSemesterId": 1,
  "programIds": [1],
  "cohortIds": [1],
  "groupCodes": ["A", "B"],
  "idempotencyKey": "ojt-2026-fall-k20-v1"
}
```

Có thể dùng `studentIds: [1,2]` thay cho lọc chương trình/khóa. Phải có ít nhất một trong `programIds`, `cohortIds`, `studentIds`; các bộ lọc kết hợp AND. Chỉ lấy sinh viên và tài khoản ACTIVE. ID sinh viên chỉ định không khớp phạm vi bị từ chối, không âm thầm bỏ qua. Không có sinh viên trả 422.

Trả HTTP 202 `{runId,status,total,replayed}`. Gọi lại cùng key/body/người tạo trả batch cũ, key khác body hoặc khác người tạo trả 409. Danh sách sinh viên và phiên bản quy tắc được chốt lúc tạo batch. Điểm được đọc lúc worker xử lý từng sinh viên; snapshot ghi thời điểm kiểm tra. Nếu đổi chương trình sau lúc tạo, dòng đó FAILED; nếu ban hành quy tắc mới thì kết quả dùng bản chốt sẽ bị đánh dấu cũ khi đọc/xác nhận.

`GET /api/eligibility-check-runs/1?page=1&limit=20` trả `QUEUED|RUNNING|COMPLETED|COMPLETED_WITH_ERRORS`, tổng số, completed/failed/pending, `progressPercent`, kết quả/lỗi từng sinh viên.

Worker bật mặc định khi chạy backend; `.env` có thể cấu hình `ELIGIBILITY_WORKER_ENABLED=true`. Worker xử lý tối đa 10 dòng mỗi lượt, mỗi 5 giây. Dòng đang xử lý và kết quả cùng transaction; khi backend dừng đột ngột, dòng chưa commit vẫn PENDING và tiếp tục sau restart. Worker độc lập SMTP.

## 4. Kết quả và lịch sử

`GET /api/students/1/eligibility?ojtSemesterId=1` trả:

- `current`: tính hiện tại, không ghi thêm lịch sử.
- `latest`: lần kiểm tra lưu gần nhất, kèm `isStale`.
- `official`: lần xác nhận chính thức gần nhất, kèm `isStale`, người xác nhận, thời điểm, lý do; null nếu chưa có.

`GET /api/students/1/eligibility-checks?ojtSemesterId=1&page=1&limit=20` trả lịch sử gồm kết quả và xác nhận, không trả snapshot nguồn nội bộ. Bỏ bộ lọc kỳ để xem toàn bộ lịch sử.

Nguồn được so fingerprint mỗi lần đọc/xác nhận. Sửa điểm, công nhận môn, đổi combo, lộ trình, trạng thái hoặc quy tắc làm kết quả cũ `isStale: true`; cần chạy lại trước khi xác nhận. Xác nhận cũ vẫn được giữ làm lịch sử, không còn là căn cứ hiện tại khi stale.

## 5. Xác nhận chính thức

`POST /api/eligibility-checks/1/confirm`:

```json
{ "reason": "Phòng đào tạo đã đối chiếu kết quả học tập" }
```

Chỉ xác nhận ELIGIBLE hoặc NOT_ELIGIBLE có snapshot còn khớp dữ liệu và quy tắc đang áp dụng. REVIEW_REQUIRED, nguồn thay đổi hoặc có lần xét mới hơn đã xác nhận trả 409. Gọi lại cùng người/lý do trên kết quả còn hiện hành trả xác nhận cũ.

Đổi combo qua luồng chốt lựa chọn dùng cùng bộ xét 70/2, lưu lần kiểm tra `source: COMBO_CHANGE` và snapshot tiến độ. Kết quả này không thay thế xác nhận chính thức.

## DB và triển khai

Schema duy nhất: `backend/DB`, phần `20261008 OJT rules and eligibility checks`, version `20261008_ojt_eligibility`. Không có DDL/seed chạy trong API. File DB đầy đủ là script reset; trên DB đang có dữ liệu chỉ áp dụng phần bổ sung mới trong transaction, không chạy cả file để cập nhật.

Swagger: `/api-docs`. Không cần SMTP để chạy nhóm API này.
