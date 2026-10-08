# Fit-gap API phòng đào tạo

Ngày kiểm tra: 08/10/2026. Đối chiếu mã nguồn, Swagger, backend đang chạy, schema và dữ liệu cấu hình hiện tại. Bản đánh giá gốc được giữ bên dưới; G01–G05 đã được xử lý bằng thay đổi API/schema và kiểm thử riêng. Không chạy reset DB trên dữ liệu đang sử dụng.

## Nguồn và phạm vi được chốt

1. Proposal PDF: [Proposal PDF](C:/Users/tthuh/Downloads/OJT-RPA_Proposal_hoan_chinh.pdf). Các mục đối chiếu chính: 7.1–7.3, trang 5; 8.2, trang 6; luồng 2/3/6, trang 7; nguyên tắc AI, trang 8; các điểm cần xác nhận, trang 11–12.
2. Tám bảng API phòng đào tạo do người dùng yêu cầu trong hội thoại, cùng các điều chỉnh về JSON, tài khoản import, GPA, điều kiện OJT và bỏ permission.
3. Phạm vi AI mới nhất: **chỉ gọi model để đề xuất doanh nghiệp đang tuyển dụng phù hợp cho sinh viên**. Không dùng AI xét điều kiện, dự báo rủi ro học vụ, tư vấn lộ trình học, cảnh báo hoặc thống kê nhu cầu học.

Khi nội dung proposal khác với yêu cầu đã chốt trong hội thoại, dùng yêu cầu mới nhất. Vì vậy:

- Điều kiện cứng hiện tại: ít nhất 70 tín chỉ và tối đa 2 môn chưa đạt; không tự thêm GPA hay tiên quyết vào điều kiện OJT.
- GPA lấy lần học hoàn tất gần nhất; công nhận/tương đương/học lại không cộng trùng tín chỉ.
- Backend nhận JSON để test và dùng API; upload CSV/Excel trực tiếp chưa thuộc phạm vi đã yêu cầu. Frontend hoặc công cụ import có thể chuyển file thành JSON.
- Chỉ thống kê và xuất nhu cầu học; không tạo lớp, thông báo mở lớp hoặc nhận đăng ký lớp.
- Có năm role cố định, không có subsystem permission tùy biến.
- Các chức năng Risk Score, AI tư vấn học tập, AI đề xuất mở lớp trong PDF được loại khỏi tiêu chí nghiệm thu.
- AI đề xuất doanh nghiệp là yêu cầu bổ sung của người dùng, chưa được mô tả bởi danh sách ba chức năng AI cũ trong PDF.

## Kết luận

**Đủ 85/85 endpoint đã yêu cầu. G01–G05 đã có xử lý trong API và DB; vẫn cần cấu hình lịch/mốc xét/ánh xạ điểm thực tế trước khi vận hành. G06 (AI gợi ý doanh nghiệp) và G07 (dữ liệu cấu hình) còn ngoài phần sửa này.**

Xem [Cấu hình và JSON G01–G05](academic-workflow-gaps.md). Nội dung mô tả/tái hiện dưới đây là trạng thái trước khi sửa; phần “Đã xử lý” ghi hành vi mới.

Tất cả 85 operation có trong Swagger; kiểm tra HTTP không token đều trả 401. Đây là kiểm tra route/tài liệu/xác thực, không chứng minh mọi nhánh nghiệp vụ đã đúng. Build TypeScript đạt. Có thêm kiểm tra trực tiếp các hàm tính toán và tái hiện gap trong schema riêng.

| Nhóm | Endpoint yêu cầu/hiện có | Đánh giá | Căn cứ |
| --- | --- | --- | --- |
| 1. Năm học, kỳ, lộ trình | 13/13 | Fit phạm vi API | Khóa, nhóm A–D, entry/current period thực tế; Block 3 không tăng kỳ tương đối; đồng bộ lộ trình và audit |
| 2. Sinh viên, kết quả học tập | 12/12 | Fit phạm vi JSON; phụ thuộc dữ liệu | Import tài khoản/email tạm, xem/sửa hồ sơ, kết quả/attempts, import sau Block 3, sửa có lý do, tiến độ, lịch sử lỗi; chưa có dữ liệu chương trình/placement để xét thực |
| 3. Chương trình, combo | 18/18 | Fit phạm vi API | Phiên bản, thang GPA, môn/tín chỉ/kỳ, tiên quyết, combo, tương đương, kiểm tra trước ban hành; chương trình published được bảo vệ |
| 4. Đợt chọn/xác nhận combo | 10/10 | Đã xử lý G02/G03 | Giai đoạn cấu hình, xác nhận Block 3, preview code; cần lịch thực tế |
| 5. Điều kiện OJT | 10/10 | Đã xử lý G04 | Xét 70/2; đợt xét sau Block 3 và acknowledgement hoàn tất điểm |
| 6. Đăng ký OJT, bàn giao QHDN | 10/10 | Đã xử lý G01 | Ràng buộc kỳ 5 theo placement; ngoại lệ rõ; ELIGIBLE chính thức còn hiệu lực |
| 7. Dashboard, cảnh báo, nhu cầu | 6/6 | Fit phạm vi thống kê đã chốt | Code thống kê theo khóa/nhóm/chuyên ngành/combo, cảnh báo, email outbox, nhu cầu, CSV/JSON; không tạo lớp |
| 8. Xác nhận kết quả OJT | 6/6 | Đã xử lý G05 | Đồng bộ StudentCourseResults khi confirm, ánh xạ theo curriculum/kỳ, chống trùng và bất biến |

## Gap và trạng thái xử lý

### G01 — Đăng ký OJT chưa ràng buộc kỳ chuyên ngành 5

**Đã xử lý: bắt buộc kỳ mục tiêu, mặc định kỳ tương đối 5 theo placement; ngoại lệ theo sinh viên/kỳ/hạn/lý do và có thu hồi, snapshot hồ sơ.**

Mức ưu tiên: P1. Nguồn: proposal 7.1 và luồng 3, trang 5/7.

[registration.service.ts](D:/HANNAH/capstone-ojt-readiness-and-risk-prediction-system/capstone-ojt-readiness-and-risk-prediction-system/backend/src/modules/ojt-registration/registration.service.ts:13), hàm `submit`, chỉ kiểm tra window/deadline, tài khoản/sinh viên active, chương trình published và scope. Không kiểm tra kỳ chuyên ngành tương đối bằng placement thực tế. Đã tái hiện: sinh viên có placement ở kỳ 4 vẫn nộp thành công.

Đề xuất: thêm phạm vi kỳ tương đối của đợt đăng ký, mặc định kỳ 5 theo quy chế được chốt; tính từ entry period và kỳ mục tiêu, Block 3 dùng kỳ cha. Trường hợp đi lại/hoãn kỳ cần ngoại lệ được cấu hình và ghi lý do, không tự mở rộng thành mọi kỳ.

### G02 — Thời gian đợt combo chưa gắn chặt với đầu/cuối kỳ 4

**Đã xử lý: lịch INITIAL/CONFIRMATION khai báo riêng, base window nằm trong giai đoạn; CONFIRMATION bắt buộc Block 3, gia hạn qua API extensions có scope/lý do.**

Mức ưu tiên: P1. Nguồn: proposal 7.1/7.2, trang 5.

[window.service.ts](D:/HANNAH/capstone-ojt-readiness-and-risk-prediction-system/capstone-ojt-readiness-and-risk-prediction-system/backend/src/modules/combo-registration/window.service.ts:8), hàm `validateWindow`, kiểm tra endsAt > startsAt và quan hệ initial/confirmation nhưng không kiểm tra ngày nằm trong kỳ/Block đã chọn. CONFIRMATION cũng chấp nhận kỳ SEMESTER thông thường. Việc tuyển roster có kiểm tra kỳ tương đối 4, nhưng không thay thế ràng buộc thời gian đợt.

Đã tái hiện hai trường hợp: tạo INITIAL có deadline ngoài kỳ mục tiêu; tạo CONFIRMATION trỏ vào kỳ thường thay vì Block 3.

Đề xuất: cấu hình giai đoạn cho chọn ban đầu và xác nhận cuối kỳ; xác nhận gắn đúng Block 3 của kỳ 4 theo proposal. Cho phép gia hạn ngoài mốc chuẩn qua API extension với lý do và scope rõ ràng. Không tự đoán số ngày của “đầu kỳ”.

### G03 — Chưa hiển thị ảnh hưởng dự kiến ngay khi chọn/đổi combo

**Đã xử lý: API preview và response selections trả tiến độ/điều kiện dự kiến bằng code, không đổi lựa chọn chính thức trước finalize.**

Mức ưu tiên: P2. Nguồn: proposal 7.2 và 8.1, trang 5/6; yêu cầu khi đổi combo tính lại tiến độ và điều kiện OJT.

[selection.service.ts](D:/HANNAH/capstone-ojt-readiness-and-risk-prediction-system/capstone-ojt-readiness-and-risk-prediction-system/backend/src/modules/combo-registration/selection.service.ts:34), hàm `submitChoice`, chỉ lưu sự kiện và trả choice/deadline. `recalculateAcademicState` được gọi trong `finalizeWindow`, sau khi ghi lựa chọn vào bảng đang áp dụng. Vì vậy việc chốt đã tính lại đúng, nhưng lựa chọn đang gửi chưa có preview về tín chỉ/môn còn thiếu/điều kiện.

Đề xuất: bổ sung preview thuần code trên combo dự kiến, không thay lựa chọn chính thức; trả môn còn thiếu, tín chỉ và điều kiện dự kiến. Giữ bản chính thức đến khi finalize.

### G04 — Chưa có mốc chốt điều kiện sau Block 3 trong luồng xác nhận

**Đã xử lý: assessment window sau Block 3, phòng đào tạo xác nhận hoàn tất điểm khi mở xét; chỉ confirm checks sau mốc này và trong đợt mở.**

Mức ưu tiên: P1 nếu quy chế bắt buộc mốc này. Nguồn: proposal 7.1 và luồng 3, trang 5/7.

[eligibility.service.ts](D:/HANNAH/capstone-ojt-readiness-and-risk-prediction-system/capstone-ojt-readiness-and-risk-prediction-system/backend/src/modules/eligibility/eligibility.service.ts:73), hàm `confirm`, kiểm tra REVIEW_REQUIRED, fingerprint nguồn, lịch sử và bản mới hơn, nhưng không kiểm tra kỳ/Block xét hoặc mốc hoàn tất cập nhật điểm. Có thể xác nhận ELIGIBLE/NOT_ELIGIBLE khi nguồn hiện tại đủ để tính, kể cả trước mốc chốt được mô tả trong proposal.

Đề xuất: bổ sung kỳ/Block và giai đoạn xét chính thức vào cấu hình kỳ OJT; có trạng thái mở xét/chốt hoặc mốc xét được phòng đào tạo xác nhận. Vẫn cho phép kiểm tra dự kiến trước hạn. Cần chốt trường hợp ngoại lệ; không suy diễn hạn xét từ hạn đăng ký.

### G05 — Điểm OJT chưa đồng bộ sang kết quả môn học

**Đã xử lý: ánh xạ môn/kỳ/bands điểm theo chương trình; confirm ghi điểm môn và nguồn trong cùng transaction, chống trùng, bảo vệ bất biến.**

Mức ưu tiên: P2 cho liên kết hồ sơ học tập; P1 nếu nghiệp vụ yêu cầu điểm OJT tham gia GPA/tín chỉ ngay khi chốt.

[result.service.ts](D:/HANNAH/capstone-ojt-readiness-and-risk-prediction-system/capstone-ojt-readiness-and-risk-prediction-system/backend/src/modules/ojt-results/result.service.ts:97), hàm `change`, cập nhật `OJTResults` và khi CONFIRMED cập nhật assignment thành COMPLETED/FAILED. Không ghi `StudentCourseResults`; API progress chỉ đọc bảng kết quả môn học.

Đề xuất: cấu hình ánh xạ môn OJT theo phiên bản chương trình, kỳ học và cách quy đổi điểm/gradePoints đã xác nhận; ghi kết quả môn học cùng transaction xác nhận, chống trùng khi gọi lại và liên kết nguồn OJTResult. Không suy ra mã môn, ngưỡng đạt hoặc thang GPA trong code.

### G06 — AI đề xuất doanh nghiệp chưa được triển khai thành API

Phạm vi: module sinh viên/QHDN, bổ sung cho hệ thống; không phải thiếu endpoint trong 85 API phòng đào tạo.

DB có các bảng matching/profiles/runs/recommendations, nhưng không thấy module route/service đang hoạt động để gọi model và trả doanh nghiệp/vị trí phù hợp. Không thấy client gọi model trong `backend/src`/`backend/scripts`. Có schema không đồng nghĩa chức năng đã chạy.

Đề xuất luồng: backend lọc doanh nghiệp liên kết và vị trí đang tuyển còn hiệu lực theo kỳ/chỉ tiêu, chuẩn bị hồ sơ học tập/kỹ năng/nguyện vọng cần thiết, gọi model xếp hạng trong tập ứng viên đã lọc, kiểm tra JSON và ID trả về, trả gợi ý cùng lý do. Không để model tự tạo doanh nghiệp/vị trí hoặc quyết định điều kiện OJT. Nếu model lỗi, vẫn xem/đăng ký vị trí bằng API thông thường. Không bổ sung Risk Score, embedding hoặc AI học vụ khi chưa có yêu cầu.

### G07 — Chưa sẵn sàng cấu hình xét trên database hiện tại

Đây là gap triển khai/dữ liệu, không phải route thiếu. Tại thời điểm kiểm tra:

- Có 1 hồ sơ sinh viên; chưa gán chương trình và academic placement.
- Có 0 chương trình PUBLISHED, 0 bộ quy tắc OJT PUBLISHED, 0 kết quả OJT.
- Các biến cần cho SMTP hiện có và worker provisioning/eligibility được bật. Chưa kiểm tra gửi mail thật trong audit này.

Đề xuất: nhập/ban hành chương trình đã rà soát; thiết lập GPA, combo/tương đương; gán placement; nhập kết quả thật; ban hành quy tắc 70/2; khai báo kỳ/Block/đợt và kiểm tra các hồ sơ mẫu nghiệp vụ. Không tạo dữ liệu nghiệp vụ giả để làm dashboard trông đủ dữ liệu.

## Các giới hạn cần ghi rõ, không tự coi là gap trong phạm vi đã chốt

- “Môn chưa đạt” hiện được code hiểu là môn đã có FAILED nhưng chưa có PASSED/RECOGNIZED, trong chương trình/combo hiện áp dụng; môn chưa học và IN_PROGRESS không tự tính thành nợ. Nếu trường dùng định nghĩa khác, cần sửa quy tắc sau khi chốt.
- Nhu cầu học đang thống kê cho kỳ/Block do người gọi cung cấp; slot nhiều lựa chọn được trả unresolvedAlternatives. Chưa tự đề xuất kỳ/Block khả thi dựa trên tiên quyết hoặc chọn môn thay sinh viên. Chức năng thống kê/xuất đã đáp ứng bảng API; nếu muốn tư vấn lịch bằng code thì đó là phần bổ sung.
- Import/cập nhật điểm làm kết quả xét cũ bị nhận diện là stale; GET eligibility tính lại hiện trạng. Không tự xác nhận kết quả hoặc tự gửi cảnh báo sau mỗi lần import. Chạy kiểm tra/batch và thao tác xác nhận/notifications là các bước rõ ràng.
- API kết quả OJT hiện cho ADMIN/ACADEMIC/OJT_COORD đọc; chưa cho STUDENT đọc kết quả của mình. Đây là gap liên vai trò so với 8.1/luồng 6 của proposal, không phải endpoint phòng đào tạo thiếu.
- Các API điều phối, tiếp nhận, giao việc và đánh giá doanh nghiệp chưa nằm trong các module đang mount. Kết quả OJT đã có API QHDN chuyển/nộp lại nhưng vẫn phụ thuộc assignment/evaluation được tạo bởi luồng QHDN/doanh nghiệp. Chưa kiểm thử toàn bộ vòng đời liên vai trò từ đầu đến cuối.
- Phản hồi API lịch học/import dùng một số dạng khác nhau (`items` ở gốc hoặc dưới `data`). Không sai yêu cầu nghiệp vụ, nhưng frontend cần theo Swagger hoặc thống nhất trước tích hợp.

## Kiểm chứng đã thực hiện

1. Build TypeScript: đạt.
2. 85/85 operation khớp Swagger; 85 request không token trả 401. Không thực hiện request ghi trên dữ liệu thật.
3. Năm kịch bản tính toán đạt: GPA lần học gần nhất; học lại/tương đương/công nhận không cộng trùng; 70 tín chỉ/2 môn nợ đủ; 69/2 chưa đủ; 70/3 chưa đủ.
4. Ba gap G01/G02 được tái hiện bằng service thực với schema/fixture riêng; đã xóa schema sau kiểm tra, không gửi email.
5. Đọc dữ liệu cấu hình thật và cờ bật worker, không in credentials. Không coi SMTP đã gửi thành công chỉ vì có cấu hình.

Chưa chạy lại toàn bộ các ca ghi nghiệp vụ của mọi module trong audit này. Các kiểm tra đơn/batch/import/confirm/export ở các lần triển khai trước là bằng chứng bổ sung trong hội thoại, không được tính lại thành kết quả audit hiện tại.

## Kiểm chứng bổ sung sau sửa G01–G05

- Build TypeScript đạt; tạo full schema từ DB trong schema tạm thành công.
- 72 kiểm tra HTTP/nghiệp vụ và 2 kiểm tra bất biến DB: kỳ 4 bị chặn, ngoại lệ/thu hồi, sai kỳ mục tiêu, lịch combo/Block 3, preview không ghi dữ liệu, finalize tính lại, xét quá sớm/đợt đóng/tương lai bị chặn.
- Điểm PASSED/FAILED đồng bộ đúng; GPA/tín chỉ đọc được điểm mới; gọi lại confirm không thêm dòng. Sai quy đổi hoặc đã có điểm import trả xung đột, rollback và giữ assignment/hồ sơ chưa chốt.
- 11 operation bổ sung khớp Swagger và trả 401 khi không có token; health/Swagger UI trả 200.
- Áp dụng riêng section bổ sung từ DB, giữ nguyên 5 users, 1 student và toàn bộ dữ liệu hiện có; không seed cấu hình nghiệp vụ.
- Các schema kiểm thử đã được dọn; không giữ file test hoặc gửi email thật.

## Phần còn lại ngoài G01–G05

1. Chuẩn bị dữ liệu thật/cấu hình G07 và kiểm thử toàn bộ luồng liên vai trò.
2. Triển khai riêng AI matching G06 theo phạm vi mới; giữ toàn bộ học vụ dùng code.

## Phụ lục endpoint

Danh sách operation dưới đây là phạm vi 85 API đã kiểm tra, không bao gồm các endpoint bổ trợ như nộp đăng ký, sinh viên gửi lựa chọn combo, QHDN chuyển/nộp lại kết quả và xem lịch sử handoff.

### 1. Năm học, kỳ học, lộ trình

| Method | API |
| --- | --- |
| GET | `/api/academic-years` |
| POST | `/api/academic-years` |
| PATCH | `/api/academic-years/{id}` |
| GET | `/api/academic-periods` |
| POST | `/api/academic-periods` |
| PATCH | `/api/academic-periods/{id}` |
| GET | `/api/ojt-semesters` |
| POST | `/api/ojt-semesters` |
| PATCH | `/api/ojt-semesters/{id}` |
| GET | `/api/cohorts` |
| POST | `/api/cohorts` |
| PATCH | `/api/cohorts/{id}` |
| PATCH | `/api/students/{id}/academic-placement` |

### 2. Sinh viên, kết quả học tập

| Method | API |
| --- | --- |
| POST | `/api/imports/preview` |
| POST | `/api/imports/commit` |
| GET | `/api/students` |
| GET | `/api/students/{id}` |
| PATCH | `/api/students/{id}` |
| GET | `/api/students/{id}/course-results` |
| POST | `/api/course-result-imports/preview` |
| POST | `/api/course-result-imports/commit` |
| PATCH | `/api/course-results/{id}` |
| GET | `/api/students/{id}/academic-progress` |
| GET | `/api/academic-imports` |
| GET | `/api/academic-imports/{id}` |

### 3. Chương trình, combo

| Method | API |
| --- | --- |
| GET | `/api/majors` |
| POST | `/api/majors` |
| GET | `/api/courses` |
| POST | `/api/courses` |
| PATCH | `/api/courses/{id}` |
| GET | `/api/curricula` |
| POST | `/api/curricula` |
| GET | `/api/curricula/{id}` |
| PATCH | `/api/curricula/{id}` |
| POST | `/api/curriculum-imports/preview` |
| POST | `/api/curriculum-imports/commit` |
| PUT | `/api/curricula/{id}/courses` |
| PUT | `/api/curricula/{id}/prerequisites` |
| PUT | `/api/curricula/{id}/course-equivalences` |
| GET | `/api/curricula/{id}/combos` |
| POST | `/api/curricula/{id}/combos` |
| PUT | `/api/combos/{id}/courses` |
| POST | `/api/curricula/{id}/publish` |

### 4. Đợt combo

| Method | API |
| --- | --- |
| GET | `/api/combo-registration-windows` |
| POST | `/api/combo-registration-windows` |
| PATCH | `/api/combo-registration-windows/{id}` |
| POST | `/api/combo-registration-windows/{id}/open` |
| POST | `/api/combo-registration-windows/{id}/close` |
| POST | `/api/combo-registration-windows/{id}/extensions` |
| POST | `/api/combo-registration-windows/{id}/reminders` |
| POST | `/api/combo-registration-windows/{id}/finalize` |
| GET | `/api/combo-registration-windows/{id}/selections` |
| GET | `/api/students/{id}/combo-selections` |

### 5. Xét điều kiện

| Method | API |
| --- | --- |
| GET | `/api/ojt-rule-sets` |
| POST | `/api/ojt-rule-sets` |
| PATCH | `/api/ojt-rule-sets/{id}` |
| POST | `/api/ojt-rule-sets/{id}/publish` |
| POST | `/api/students/{id}/eligibility-checks` |
| POST | `/api/eligibility-check-runs` |
| GET | `/api/eligibility-check-runs/{id}` |
| GET | `/api/students/{id}/eligibility` |
| GET | `/api/students/{id}/eligibility-checks` |
| POST | `/api/eligibility-checks/{id}/confirm` |

### 6. Đăng ký OJT, bàn giao

| Method | API |
| --- | --- |
| GET | `/api/ojt-registration-windows` |
| POST | `/api/ojt-registration-windows` |
| PATCH | `/api/ojt-registration-windows/{id}` |
| POST | `/api/ojt-registration-windows/{id}/open` |
| POST | `/api/ojt-registration-windows/{id}/close` |
| GET | `/api/ojt-registrations` |
| GET | `/api/ojt-registrations/{id}` |
| POST | `/api/ojt-registrations/{id}/review` |
| POST | `/api/ojt-semesters/{id}/eligible-student-handoffs` |
| GET | `/api/ojt-semesters/{id}/students` |

### 7. Dashboard, cảnh báo, nhu cầu

| Method | API |
| --- | --- |
| GET | `/api/academic/dashboard` |
| GET | `/api/academic/eligibility-statistics` |
| GET | `/api/academic/alerts` |
| GET | `/api/academic/course-demand` |
| GET | `/api/academic/course-demand/export` |
| POST | `/api/academic/alerts/notifications` |

### 8. Kết quả OJT

| Method | API |
| --- | --- |
| GET | `/api/ojt-results` |
| GET | `/api/ojt-results/{id}` |
| POST | `/api/ojt-results/{id}/revision-requests` |
| PATCH | `/api/ojt-results/{id}` |
| POST | `/api/ojt-results/{id}/confirm` |
| GET | `/api/ojt-semesters/{id}/results/export` |
