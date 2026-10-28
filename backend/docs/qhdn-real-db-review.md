# Kết quả kiểm thử DB thật và đánh giá luồng QHDN

**Cập nhật 28/10/2026:** các điểm chặn code trong báo cáo lịch sử này đã được sửa và có kiểm thử HTTP toàn luồng với toàn bộ schema/trigger trên DB thử. Xem [hợp đồng Frontend và nội dung sửa](qhdn-frontend-handoff.md). AI thật chưa có; adapter được kiểm thử bằng provider giả lập. Nội dung dưới đây giữ lại bằng chứng của lượt review 27/10, không phải trạng thái code mới.

Ngày kiểm tra: 27/10/2026 (Asia/Saigon).

**Kết luận: backend local khởi động và phục vụ API đọc được, nhưng luồng QHDN chưa hoàn thiện để vận hành từ đầu đến cuối.** Production đang khác hợp đồng của source local. Các lỗi nghiệp vụ dưới đây không được loại trừ bởi kết quả smoke test 49/49 hay bộ regression 53 test trước đó.

## Phạm vi và kết quả

| Môi trường | Kiểm tra | Kết quả |
|---|---|---|
| Local | Build lại source | Thành công |
| Local + Supabase thật | Đăng nhập QHDN, 49 trường hợp GET/Swagger/bộ lọc/quyền/export | 49/49 đạt |
| Production + dữ liệu thật | Đăng nhập QHDN, cùng 49 trường hợp so với hợp đồng local | 39 đạt, 10 khác biệt |
| Supabase thật | SELECT số lượng dữ liệu, cột/default, mapping điểm và định nghĩa trigger | Thành công trong transaction READ ONLY |
| Probe source hiện tại | Nộp lần đầu, CV doanh nghiệp, điều phối sau chấp nhận, chuyển kết quả | Đã tái hiện các bất nhất bằng dependency/fixture tách biệt |
| Probe trigger điểm | SQL của confirmResult với trigger lấy từ DB thật, chạy trên PGlite riêng | Lỗi 23514, không tạo được điểm |

Lần gọi production đầu bị timeout; sau khi health trả 200 đã chạy lại đầy đủ bộ kiểm tra. Không gọi API ghi nghiệp vụ trên production hoặc local dùng chung Supabase; không tạo sinh viên, doanh nghiệp, hồ sơ hay gửi email. Kiểm tra HTTP local tắt toàn bộ worker và xác minh từng kết nối DB chỉ đọc. Các probe ghi chỉ sử dụng fixture trong bộ nhớ. Không thay đổi source nghiệp vụ trong lượt review này.

## Dữ liệu hiện có trên DB thật

Tại thời điểm kiểm tra:

- Có 1 kỳ OJT, 1 cấu hình đăng ký OPEN còn trong thời gian, 1 doanh nghiệp, 5 vị trí, 5 tin tuyển dụng, 1 đợt tuyển dụng lịch sử và 1 mapping điểm OJT202.
- AccountImportBatches = 0: các tin hiện có chưa chứng minh đã qua nhánh import doanh nghiệp mới. `hasSemesterRecruitment` yêu cầu có batch ENTERPRISE cùng kỳ.
- Bàn giao, mục bàn giao, hồ sơ OJT, ứng tuyển, điều phối, phân công, đánh giá và kết quả đều bằng 0.
- StudentCVFiles, StudentCVVersions và CVAnalysisJobs đều bằng 0.

Do đó, danh sách rỗng trả 200 chứng minh truy vấn và phân quyền chạy được, không xác nhận được nội dung hồ sơ thật, lịch sử thật hay các chuyển trạng thái ghi trên DB này. Mapping điểm đã tồn tại; vấn đề đồng bộ điểm không chỉ là thiếu cấu hình mapping.

## Các điểm cần xử lý trước khi chốt luồng

### 1. Sinh viên nộp lần đầu nhưng API cơ hội yêu cầu hồ sơ đã tồn tại

`src/modules/students/job-application.service.ts`, hàm `studentOpportunities`, vẫn đưa `REGISTRATION_REQUIRED` và `OJT_REGISTRATION_WINDOW_UNAVAILABLE` vào blockers khi chưa có OJTRegistrations.

Probe với sinh viên đã bàn giao, đủ điều kiện và vị trí còn 5 chỗ trả `canApply=false` với hai blocker này. Trong khi đó, luồng đã thống nhất là POST /api/ojt-registrations tạo hồ sơ và ứng tuyển cùng giao dịch. Nếu Frontend dựa vào canApply để cho nộp lần đầu thì giao diện bị chặn, dù gọi thẳng POST hợp nhất có thể xử lý được.

Cần thống nhất điều kiện của GET cơ hội với POST hợp nhất: trước khi nộp, kiểm tra kỳ/cửa sổ, bàn giao, eligibility, import và vị trí; không yêu cầu hồ sơ phải tồn tại sẵn.

### 2. Doanh nghiệp chấp nhận chưa tạo được kỳ thực tập tiếp theo

`src/modules/qhdn/workflow.service.ts`, hàm `decision`, cập nhật quyết định và trạng thái JobApplications nhưng không tạo InternshipAssignments. Trigger thật `TR_CoordinationContext` chỉ kiểm tra ngữ cảnh, không tạo phân công.

Các API tạo/cập nhật assignment hiện chỉ dành cho Admin; router doanh nghiệp không có thao tác tạo, kích hoạt hay hoàn tất assignment. Vì vậy, luồng Đào tạo → QHDN → Sinh viên → Doanh nghiệp chưa tự tiếp tục sau ACCEPTED nếu không thêm thao tác Admin.

Cần chốt nghiệp vụ tạo/kích hoạt thực tập sau khi doanh nghiệp nhận, giữ QHDN không có quyền phân công. Có thể xử lý trong logic doanh nghiệp hoặc tự động, không cần khôi phục quyền ghi assignment cho QHDN.

### 3. Doanh nghiệp đánh giá xong chưa đủ điều kiện để QHDN chuyển kết quả

`evaluate` cho phép assignment ACTIVE/IN_PROGRESS và lưu đánh giá SUBMITTED nhưng không hoàn tất assignment. `result-workflow.service.ts`, hàm source, chỉ nhận assignment COMPLETED/FAILED.

Probe ACTIVE + đánh giá SUBMITTED trả 409 `OJT_RESULT_NOT_READY`. Hiện chuyển trạng thái assignment vẫn cần Admin. Cần nối bước hoàn tất thực tập với nghiệp vụ doanh nghiệp/tự động trước bước QHDN chuyển kết quả, không cấp lại quyền sửa trạng thái cho QHDN.

### 4. Xác nhận điểm chưa tương thích với trigger đang có trên DB thật

`src/modules/ojt-results/result-workflow.service.ts:45` INSERT StudentCourseResults không truyền SemesterTaken và AcademicYearID. Trên DB thật, SemesterTaken có default NULL; mapping đang dùng môn OJT202. Trigger `GuardFixedOJTSemester6` yêu cầu SemesterTaken = 6 và kỳ chương trình đúng.

Đã dùng SQL của confirmResult và định nghĩa trigger đọc từ DB thật để tái hiện trên DB PGlite tách biệt:

```text
23514: OJT202 results must belong to the student relative semester 6.
```

Có sẵn `src/modules/ojt-results/grade-sync.ts`, hàm syncOfficialGrade, xử lý kỳ chương trình, năm học, lần học và mapping, nhưng hiện không được luồng confirmResult gọi. Cần nối lại bước đồng bộ điểm và kiểm thử bằng cả các trigger hiện hành. Không cần thay DB để khắc phục việc thiếu giá trị cột này.

### 5. CV của hồ sơ mới chưa thống nhất với doanh nghiệp và AI

- Upload đang dùng `Students/cv.service.ts` → StudentCVFiles.
- Ứng tuyển mới lưu JobApplications.CVFileID.
- `qhdn/enterprise.service.ts` vẫn đọc StudentCVVersions qua JobApplications.CVID khi trả hồ sơ ứng viên/thực tập.
- Cả CVID và CVFileID có mặt trên DB thật, nên truy vấn vẫn có thể chạy 200 nhưng CV của hồ sơ mới sẽ không được đọc qua liên kết cũ.
- Hàm analyseCv dùng StudentCVVersions; không có route hiện hành gọi analyseCv. Upload trước đăng ký được hỗ trợ, nhưng chưa có chuỗi upload mới → AI đọc CV được nối hoàn chỉnh.

Cần thống nhất nguồn CV theo luồng hiện hành và bảo đảm doanh nghiệp chỉ đọc CV của hồ sơ đã điều phối đúng phạm vi. Việc nối AI cần xử lý riêng theo yêu cầu đọc CV trước đăng ký.

### 6. Nhánh sửa và gửi lại kết quả chưa hoàn chỉnh

confirmResult có thể trả `OJT_RESULT_SOURCE_CHANGED` và yêu cầu QHDN gửi lại, trong khi transferResult từ chối assignment đã có OJTResults bằng `OJT_RESULT_EXISTS`. Không có route hiện hành để sửa/gửi lại kết quả này. Đây là thiếu sót của luồng khôi phục khi dữ liệu nguồn thay đổi; chưa tái hiện bằng hồ sơ thật do DB chưa có kết quả.

## Khác biệt production với local

| Kiểm tra | Production thực tế | Hợp đồng local |
|---|---|---|
| Swagger | Chưa có PUT cấu hình đăng ký theo kỳ; kiểm tra quyền QHDN không đạt | Có API gộp và giới hạn quyền |
| GET cấu hình đăng ký | Thiếu effectiveStatus | Có effectiveStatus |
| Hồ sơ status=NOT_REGISTERED | 400 | 200 |
| Hồ sơ status=LEGACY_REVIEW_REQUIRED | 400 | 200 |
| coordinationStatus + assignmentStatus | 400 | 200 |
| Tin tuyển dụng theo companyId + ojtSemesterId | 400 | 200 |
| GET /api/ojt-registrations với QHDN | 200 | 403 |
| GET /api/ojt-semesters/{id}/students với QHDN | 200 | 403 |
| GET /api/recruitment/windows với QHDN | 404 | 403 |
| GET /api/qhdn/registered-students không chọn kỳ | 200 | 400 |

10 trường hợp không khớp không có nghĩa là 10 lỗi nghiệp vụ độc lập. Riêng 404 của GET đợt tuyển dụng vẫn ngăn QHDN dùng API này, phù hợp chủ trương bỏ đợt khỏi luồng QHDN; không cần triển khai thêm endpoint đó cho QHDN. Swagger thiếu PUT chưa đủ để kết luận route PUT không tồn tại, vì không gọi API ghi để kiểm tra trên production.

## Mức sẵn sàng

- Frontend có thể tích hợp và kiểm thử màn danh sách, trạng thái, dashboard, báo cáo với bản local.
- Các nhánh mở đăng ký, import, nộp hợp nhất, duyệt và điều phối đã có handler và test fixture, nhưng chưa chạy ghi toàn luồng trên DB thử độc lập có cấu trúc/trigger tương đương DB thật.
- Chưa nên chốt luồng vận hành từ đầu đến cuối hoặc coi production đã đồng bộ bản local.
- Ưu tiên sửa điểm đồng bộ, nối vòng đời internship sau ACCEPTED, điều kiện nộp lần đầu và nguồn CV; sau đó chạy end-to-end trên DB thử riêng. Có thể giữ schema hiện tại và các quyền đã giới hạn cho QHDN, nhưng phải điều chỉnh logic nối giữa sinh viên, doanh nghiệp và đào tạo.

## Bằng chứng cục bộ

Các file JSON dưới `.local` được gitignore và không chứa token/mật khẩu hoặc nội dung hồ sơ:

- qhdn-local-readonly-report.json: 49 trường hợp local.
- qhdn-production-readonly-report.json: 49 trường hợp production.
- qhdn-real-db-audit.json: số lượng dữ liệu, cột, trigger.
- qhdn-grade-db-audit.json: default cột và mapping OJT202.
- qhdn-flow-probes.json: probe các điểm nối luồng.
- qhdn-grade-trigger-probe.json: tái hiện lỗi đồng bộ điểm với trigger thật trên fixture riêng.

Chưa commit, push hoặc deploy. Không thay đổi dữ liệu nghiệp vụ hay schema trên DB dùng chung.
