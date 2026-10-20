# Dashboard và báo cáo QHDN

Cập nhật: 12/10/2026. Base path `/api`. Header `Authorization: Bearer <JWT>`. Chỉ ADMIN/OJT_COORD; ENTERPRISE, STUDENT, ACADEMIC nhận 403.

## Endpoint và bộ lọc

| Method | Endpoint | Query |
| --- | --- | --- |
| GET | `/qhdn/dashboard` | ojtSemesterId, companyId |
| GET | `/qhdn/reports/acceptance` | ojtSemesterId, companyId, page, limit |
| GET | `/qhdn/reports/internships` | ojtSemesterId, companyId, page, limit |
| GET | `/qhdn/reports/enterprise-feedback` | ojtSemesterId, companyId, page, limit |
| GET | `/qhdn/reports/export` | type, format, ojtSemesterId, companyId |

`companyId` là `Enterprises.EnterpriseID`. Hai bộ lọc kết hợp AND; bỏ bộ lọc để lấy tất cả kỳ/doanh nghiệp. ID phải là số nguyên dương, ID không tồn tại trả 404. Query lạ/không hợp lệ trả 400. Dashboard/export không nhận phân trang.

Các báo cáo nhóm theo **kỳ OJT + doanh nghiệp**, không tạo hàng cho cặp không có dữ liệu nguồn. Thứ tự tăng dần ojtSemesterId, companyId. Mặc định page=1, limit=20, tối đa 100. `total` là số nhóm trước phân trang, không phải số sinh viên. Trang vượt dữ liệu trả items rỗng và giữ total.

```json
{
  "success": true,
  "data": {
    "type": "acceptance",
    "filters": { "ojtSemesterId": 1, "companyId": null },
    "items": [],
    "total": 0,
    "page": 1,
    "limit": 20
  }
}
```

## 1. Dashboard

`GET /api/qhdn/dashboard?ojtSemesterId=1` trả `{success:true,data:{filters,partners,positions,students,assignments,results}}`.

| Khối | Trường và ý nghĩa |
| --- | --- |
| partners | total, active, inactive: đối tác trong phạm vi. Khi lọc kỳ, chỉ đếm DN có vị trí trong kỳ đó. |
| positions | total: số vị trí; open: vị trí OPEN của DN ACTIVE; totalCapacity: tổng chỉ tiêu của mọi vị trí, gồm vị trí đóng; occupiedSlots: số phân công chưa hủy; remainingSlots: tổng chỉ tiêu còn lại; openRemainingSlots: chỗ còn lại tại vị trí OPEN của DN ACTIVE. |
| students | handedOff: số hồ sơ đã bàn giao; unallocated: chưa có phân công chưa hủy; notCoordinated: chưa có lượt điều phối; waitingForEnterprise: lượt mới nhất đang chờ DN; enterpriseRejected: lượt mới nhất bị từ chối; acceptedAwaitingAssignment: đã được chấp nhận, chưa có phân công chưa hủy; assigned: có phân công chưa hủy. |
| assignments | total, assigned, active, completed, failed, cancelled: số bản ghi phân công theo trạng thái. active gồm ACTIVE/IN_PROGRESS; cancelled gồm CANCELLED/CANCELED. |
| results | total, pending, revisionRequested, confirmed, passed, failed: số kết quả. passed/failed chỉ tính kết quả CONFIRMED. |

Các chỉ số students đếm **hồ sơ sinh viên theo kỳ**, một sinh viên có hồ sơ ở hai kỳ được tính hai lần khi không lọc kỳ. Chỉ lấy hồ sơ có bản ghi bàn giao; không đưa hồ sơ chưa bàn giao vào chỉ số QHDN.

`handedOff = assigned + unallocated`; `unallocated = notCoordinated + waitingForEnterprise + enterpriseRejected + acceptedAwaitingAssignment` trong dữ liệu nghiệp vụ hợp lệ.

Khi lọc companyId, hồ sơ được gán cho DN của phân công chưa hủy hiện có, hoặc DN của lượt điều phối mới nhất nếu chưa phân công. Hồ sơ chưa từng điều phối chưa có DN để gán, nên không xuất hiện trong bộ lọc DN. Lượt điều phối mới nhất được chọn trước khi áp bộ lọc để tránh hồi sinh lượt cũ sau điều phối lại.

Chỉ phân công CANCELLED/CANCELED trả lại chỉ tiêu. COMPLETED/FAILED vẫn chiếm chỉ tiêu kỳ. Backend tính số chỗ từ phân công thực tế, không đọc trực tiếp bộ đếm RemainingSlots có thể đã cũ.

## 2. Tiếp nhận và từ chối

`GET /api/qhdn/reports/acceptance?ojtSemesterId=1&companyId=2`.

Mỗi hàng có ojtSemesterId, semesterCode, companyId, companyName và:

| Trường | Ý nghĩa |
| --- | --- |
| currentStudents | Số hồ sơ có lượt điều phối mới nhất tới DN này |
| pending / accepted / rejected | Trạng thái của lượt mới nhất |
| acceptanceRate | 100 × accepted / (accepted + rejected), làm tròn 2 số lẻ; null khi chưa có quyết định |
| coordinationAttempts | Tổng lượt điều phối trong lịch sử tới DN này |
| pendingAttempts / acceptedAttempts / rejectedAttempts | Số lượt lịch sử theo quyết định |

Quyết định legacy ACCEPT/APPROVED được tính ACCEPTED; REJECT được tính REJECTED; rỗng hoặc quyết định chưa xác định được tính PENDING.

Ví dụ SV bị DN A từ chối rồi chuyển DN B: A có rejectedAttempts tăng, currentStudents không còn SV đó; B có currentStudents tăng. Có thể có hàng currentStudents=0 nhưng coordinationAttempts>0. Tổng lượt lịch sử có thể lớn hơn số sinh viên và không dùng thay mẫu số tỷ lệ tiếp nhận hiện tại.

## 3. Thực tập và kết quả

`GET /api/qhdn/reports/internships?ojtSemesterId=1`.

Mỗi hàng có thông tin kỳ/DN và:

- totalAssignments: mọi bản ghi phân công, kể cả đã hủy.
- assigned, active, completed, failed, cancelled: số phân công theo trạng thái; active gồm ACTIVE/IN_PROGRESS.
- assignedStudents: số StudentID khác nhau có phân công chưa hủy trong nhóm kỳ/DN.
- totalResults, pendingResults, revisionRequestedResults, confirmedResults: số hồ sơ kết quả gắn đúng AssignmentID.
- passedResults, failedResults: chỉ lấy Outcome của kết quả CONFIRMED.
- averageOfficialScore: trung bình OfficialScore của kết quả CONFIRMED, làm tròn 2 số lẻ; null khi chưa có điểm đã xác nhận.

Hoàn thành phân công không đồng nghĩa đã xác nhận điểm học vụ. Điểm và kết luận dự thảo không được đưa vào tỷ lệ/kết quả chính thức. Hồ sơ kết quả được nối với đúng phân công, không nhân bản khi có lịch sử điều phối.

## 4. Phản hồi doanh nghiệp

`GET /api/qhdn/reports/enterprise-feedback?companyId=2`.

Nguồn là InternshipEvaluations gắn với phân công ACTIVE/IN_PROGRESS/COMPLETED/FAILED. Phân công ASSIGNED hoặc đã hủy không thuộc mẫu thống kê đánh giá. Chỉ đánh giá có EvaluatedAt và OverallScore được tính là đã nộp.

| Trường | Ý nghĩa |
| --- | --- |
| eligibleAssignments | Số phân công thuộc mẫu đánh giá |
| evaluationCount / missingEvaluations | Đã nộp / chưa có đánh giá hợp lệ |
| evaluationCoverageRate | 100 × evaluationCount / eligibleAssignments |
| averageCompletionScore / averageAttitudeScore / averageSkillScore / averageOverallScore | Trung bình không trọng số của các giá trị khác null, làm tròn 2 số lẻ |
| commentsCount | Số đánh giá có nhận xét không rỗng |
| enterpriseSubmittedCount / staffEnteredCount | Phân loại người lưu đánh giá cuối cùng theo vai trò hiện tại của EvaluatedBy: ENTERPRISE hoặc ADMIN/OJT_COORD |
| lastEvaluatedAt | Thời điểm đánh giá gần nhất, null khi chưa có |

Nhóm có phân công thuộc mẫu nhưng chưa có đánh giá vẫn xuất hiện: evaluationCount=0, missingEvaluations>0, coverage=0 và điểm trung bình null. Cập nhật cùng EvaluationID chỉ được tính một lần. Để đọc từng nhận xét/người nhập/lý do nhập thay, dùng API `/internship-evaluations` và detail đã có; audit là nguồn đối chiếu vai trò tại thời điểm thao tác.

Đây là tổng hợp đánh giá thực tập, chưa có dữ liệu để suy ra khảo sát hài lòng DN hoặc tỷ lệ có việc làm sau OJT.

## 5. Xuất báo cáo

`GET /api/qhdn/reports/export?type=acceptance&ojtSemesterId=1&format=csv`.

- type bắt buộc: acceptance, internships, enterprise-feedback.
- format: csv mặc định hoặc json.
- Dùng đúng truy vấn/bộ lọc của báo cáo tương ứng, xuất toàn bộ nhóm phù hợp, không nhận page/limit.
- Tối đa 10.000 hàng tổng hợp; vượt giới hạn trả 422 QHDN_EXPORT_TOO_LARGE và yêu cầu thu hẹp bộ lọc.
- CSV: `text/csv; charset=utf-8`, UTF-8 BOM, dấu phẩy, quote/escape đúng chuẩn; phòng công thức Excel trong trường văn bản. Tên attachment `qhdn-<type>-report.csv`.
- JSON: `{success:true,data:{type,filters,items,total}}`; không có page/limit.
- Không có dữ liệu: CSV vẫn có hàng tiêu đề, JSON có items rỗng.

## Adapter JSON và Swagger

Cả 5 route REST đã được mount. Swagger sử dụng adapter JSON theo cấu trúc chung của dự án:

| Method | Endpoint | Body ví dụ |
| --- | --- | --- |
| POST | `/api/json/qhdn/dashboard/search` | `{ "ojtSemesterId": 1 }` |
| POST | `/api/json/qhdn/reports/acceptance/search` | `{ "ojtSemesterId": 1, "companyId": 2, "page": 1, "limit": 20 }` |
| POST | `/api/json/qhdn/reports/internships/search` | `{ "ojtSemesterId": 1 }` |
| POST | `/api/json/qhdn/reports/enterprise-feedback/search` | `{ "companyId": 2 }` |
| POST | `/api/json/qhdn/reports/export` | `{ "type": "acceptance", "format": "csv", "ojtSemesterId": 1 }` |

Adapter dùng cùng middleware, quyền truy cập, bộ lọc và service. CSV vẫn trả file qua adapter.

## Triển khai


Tái sử dụng schema hiện có, không cần migration mới. Chưa kiểm thử kết nối, dữ liệu và quyền trên database triển khai thực tế.
