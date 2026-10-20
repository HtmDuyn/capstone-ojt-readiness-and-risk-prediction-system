> Bản này đã được thay thế bởi [Danh sách API theo role](api-inventory-by-role.md), theo yêu cầu QHDN import sheet và không đăng ký lớp học.

# Danh sách API theo luồng kỳ 5 → OJT

Kiểm tra source trong checkout hiện tại ngày 13/10/2026. Đây là bản kiểm kê và đề xuất, chưa triển khai các thay đổi nêu trong tài liệu và chưa kiểm tra môi trường deploy/DB thật.

Phạm vi: học vụ, cảnh báo giữa kỳ 5, chốt cuối kỳ 5 gồm BL3W, đăng ký doanh nghiệp, điều phối và kết quả OJT. AI dự báo/đọc CV/matching để giai đoạn sau. Các đường dẫn có tiền tố `/api`.

## 1. Kết quả kiểm tra thực tế

- `src/routes/index.ts` mount auth, accounts, roles, imports, academic, students, curriculum, combo-registration, eligibility, ojt-registration, academic-reporting, qhdn, ojt-results và admin.
- Chưa thấy route `/student/...`, route ứng tuyển doanh nghiệp, route đọc thông báo của người nhận hay upload CV trong checkout này. Nếu các phần đã hoàn thành ở branch khác thì cần đối chiếu/đưa về branch hiện tại; không triển khai trùng.
- `JobApplications`, `RecruitmentPosts`, `RecruitmentPostPositions`, `SupportClasses`, `SupportClassRegistrations`, `Notifications` có schema. Có bảng không có nghĩa đã có API.
- Quy tắc 70 tín chỉ/không quá 2 môn nợ đã có trong eligibility. Một môn trượt nhưng sau đó đã đạt/công nhận không còn là môn nợ; không đếm số lần thi trượt.
- Có xét hiện tại, lịch sử, xác nhận chính thức, fingerprint nguồn và kiểm tra stale. Có cấu hình xét sau BLOCK3 và yêu cầu xác nhận điểm đã cập nhật (`resultsFinalized`).
- Cảnh báo hiện chỉ có CREDIT_SHORTFALL và MISSING_REQUIRED_COURSES, chưa có loại riêng cho vượt ngưỡng môn nợ. Gửi cảnh báo hiện chỉ nhận sinh viên đang có cảnh báo, nên không dùng nguyên trạng để thông báo giữa kỳ cho toàn bộ sinh viên hoặc công bố kết quả cuối kỳ.
- POST /ojt-registrations kiểm tra đợt, scope, sinh viên và kỳ; chưa yêu cầu kết quả chính thức ELIGIBLE ở bước nộp. Bước duyệt/bàn giao mới yêu cầu kết quả đủ điều kiện còn hiệu lực.
- registrationPeriod đang buộc kỳ mục tiêu đăng ký trùng kỳ thực tập hoặc chứa ngày bắt đầu OJT; cần tách kỳ học xét điều kiện/kỳ đăng ký khỏi kỳ thực tập nếu OJT diễn ra sau kỳ 5. Không mặc định OJT là kỳ 6 khi chưa cấu hình.
- assertOfficialAssessment kiểm tra BLOCK3 đã kết thúc và thời điểm chốt điểm; chưa buộc kỳ cha của BLOCK3 là kỳ tương đối 5, và chưa bảo đảm toàn bộ kỳ cha đã kết thúc nếu lịch BLOCK3 kết thúc sớm hơn.
- QHDN có đủ 21 endpoint doanh nghiệp/vị trí/điều phối/phân công/đánh giá. Enterprise có scope riêng; staff nhập thay quyết định/đánh giá cần reason và audit. Chưa liên kết ApplicationID trong API điều phối.
- Kết quả OJT có chuyển, sửa, yêu cầu sửa và xác nhận; chưa có cờ/mốc công bố cho sinh viên. CONFIRMED và công bố là hai khái niệm cần quy định rõ.
- Swagger hiện chuyển những operation có path/query sang hợp đồng `/api/json/...`; route REST vẫn tồn tại. API mới phải cập nhật cả schema và bộ chuyển này.

## 2. API Student/dùng chung hiện có

| Method | Endpoint | Quyền hiện tại | Hành động |
|---|---|---|---|
| POST | /auth/login | Public | Giữ |
| GET | /auth/me | Đã đăng nhập | Mở rộng studentId cho STUDENT; chọn cách này thay vì thêm /student/me |
| POST | /auth/change-password | Đã đăng nhập | Giữ |
| POST | /auth/logout | Đã đăng nhập | Giữ |
| GET | /students/:id | ADMIN/ACADEMIC/STUDENT của mình | Giữ; rà DTO cho Student |
| GET | /students/:id/course-results | ADMIN/ACADEMIC/STUDENT của mình | Giữ |
| GET | /students/:id/academic-progress | ADMIN/ACADEMIC/STUDENT của mình | Giữ, dùng làm nguồn summary |
| GET | /students/:id/eligibility | ADMIN/ACADEMIC/STUDENT của mình | Giữ; phân biệt current/latest/official, stale và quyền đăng ký |
| GET | /students/:id/eligibility-checks | ADMIN/ACADEMIC/STUDENT của mình | Giữ |
| POST | /ojt-registrations | ADMIN/ACADEMIC/STUDENT | Sửa nếu chỉ cho tạo hồ sơ sau chốt: yêu cầu official ELIGIBLE còn hiệu lực |
| GET | /ojt-registrations | ADMIN/ACADEMIC/OJT_COORD/STUDENT | Giữ lọc theo actor; QHDN chỉ hồ sơ đã bàn giao |
| GET | /ojt-registrations/:id | Như trên, kiểm tra scope | Sửa DTO: Student không nhận raw coordination/assignment, ghi chú nội bộ hoặc snapshot bàn giao đầy đủ |
| GET | /students/:id/combo-selections | ADMIN/ACADEMIC/STUDENT của mình | Giữ |
| POST | /combo-registration-windows/:id/preview | ADMIN/ACADEMIC/STUDENT | Giữ |
| POST | /combo-registration-windows/:id/selections | ADMIN/ACADEMIC/STUDENT | Giữ |

## 3. API Đào tạo/Admin hiện có

ADMIN được phép thực hiện các thao tác Đào tạo bên dưới. Không mở quyền sửa học vụ/xác nhận cho QHDN hoặc Enterprise.

| Method | Endpoint/nhóm | Hành động |
|---|---|---|
| GET/POST/PATCH | /academic-years, /academic-periods, /cohorts, /ojt-semesters và /:id khi có route sửa | Giữ lịch thực tế. GET /ojt-semesters đã cho OJT_COORD; các catalog khác chỉ ADMIN/ACADEMIC |
| PATCH | /students/:id/academic-placement; /students/academic-placement | Giữ; xác định kỳ tương đối từ placement, BLOCK3 thuộc kỳ cha |
| GET/PATCH | /students; /students/:id (GET danh sách, PATCH hồ sơ) | Giữ vai trò quản trị học vụ; không mở danh sách toàn bộ cho Student |
| POST | /course-result-imports/preview; /course-result-imports/commit | Giữ, nhập cả kết quả liên quan BL3W trước khi chốt |
| PATCH | /course-results/:id | Giữ audit; sửa điểm phải làm kết quả xét cũ stale |
| GET | /academic-imports; /academic-imports/:id | Giữ lịch sử import |
| GET/POST/PATCH/PUT | Các API majors/courses/curricula/combos và cấu trúc chương trình hiện có | Giữ phân quyền; Student đọc qua DTO riêng chỉ chương trình đã ban hành |
| POST | /curricula/:id/publish | Giữ |
| GET/POST/PATCH; POST publish | /ojt-rule-sets; /ojt-rule-sets/:id; /ojt-rule-sets/:id/publish | Giữ quy tắc 70/2 và phiên bản |
| POST | /students/:id/eligibility-checks | Giữ để tính/lưu snapshot; chưa tự xác nhận chính thức |
| POST/GET | /eligibility-check-runs; /eligibility-check-runs/:id | Giữ chạy batch và theo dõi |
| POST | /eligibility-checks/:id/confirm | Sửa guard: đúng kỳ học xét, toàn bộ kỳ 5 và BL3W kết thúc, điểm finalized, nguồn còn khớp |
| GET/PUT | /ojt-semesters/:id/assessment-window | Mở rộng xác định assessmentAcademicPeriodId/requiredRelativeSemester; BLOCK3 phải thuộc kỳ này |
| POST | /ojt-semesters/:id/assessment-window/open; /close | Giữ mở/chốt điểm; không mở lại CLOSED âm thầm, sửa sau chốt cần luồng có lý do và audit |
| GET/POST/PATCH | /ojt-registration-windows; /ojt-registration-windows/:id | Sửa mô hình kỳ: kỳ học đăng ký/xét khác kỳ thực tập; có thể hỗ trợ mục đích OJT_PROFILE/COMPANY_APPLICATION hoặc lịch ứng tuyển riêng |
| POST | /ojt-registration-windows/:id/open; /close | Sửa guard theo loại đợt và timeline mới |
| POST | /ojt-registration-windows/:id/semester-exceptions; /:exceptionId/revoke | Giữ ngoại lệ có hạn/lý do; không dùng ngoại lệ để che sai mô hình kỳ |
| POST | /ojt-registrations/:id/review | Giữ duyệt hồ sơ dựa trên official ELIGIBLE hiện hành |
| POST/GET | /ojt-semesters/:id/eligible-student-handoffs | Giữ bàn giao; POST chỉ ADMIN/ACADEMIC, GET thêm OJT_COORD |
| GET | /academic/dashboard; /academic/eligibility-statistics | Giữ; bổ sung nhóm chưa chốt/chờ dữ liệu/chưa bàn giao khi cần |
| GET | /academic/alerts | Sửa: thêm EXCESS_FAILED_COURSES, phân biệt môn nợ và môn bắt buộc thiếu; scope đúng kỳ 5 |
| POST | /academic/alerts/notifications | Sửa nội dung gồm earnedCredits/missingCredits/failedCourseCount; giữ idempotency; chỉ gửi cảnh báo có thật |
| GET | /academic/course-demand; /academic/course-demand/export | Giữ làm nguồn tổng hợp nhu cầu học bổ sung; chưa phải danh sách lớp đang mở |
| GET/POST/PATCH; POST actions | Các API combo-registration-windows và academic-periods/:id/combo-phase-schedules hiện có | Giữ luồng chọn/chốt combo đã xác nhận |
| GET/PUT | /curricula/:id/ojt-grade-mappings/:semesterId | Giữ để đồng bộ kết quả OJT về học vụ |

Lưu ý: bảng này gom các endpoint quản trị nền theo nhóm, không khẳng định có GET detail cho mọi catalog. Các route chi tiết phải theo implementation hiện có.

## 4. API QHDN/Enterprise hiện có

Trong bảng: đọc dành cho ADMIN/OJT_COORD/ENTERPRISE trong phạm vi; ghi catalog/điều phối/phân công dành cho ADMIN/OJT_COORD; decision/evaluation Enterprise được ghi của mình, staff nhập thay có reason/audit.

| Method | Endpoint | Hành động |
|---|---|---|
| GET | /companies; /companies/:id | Giữ, Student dùng DTO riêng |
| POST/PATCH | /companies; /companies/:id | Giữ |
| GET | /positions; /positions/:id | Giữ chỉ tiêu tính từ reservation/assignment, bổ sung liên kết tin tuyển khi triển khai |
| POST/PATCH | /positions; /positions/:id | Giữ QHDN quản lý; chỉ mở DN tự chỉnh nếu có quy trình duyệt riêng |
| GET | /ojt-coordinations; /ojt-coordinations/:id | Thêm applicationId/filter/trạng thái ứng tuyển nếu liên kết |
| POST | /ojt-coordinations | Thêm applicationId; xác minh cùng registration/position/kỳ, đã bàn giao; không điều phối đơn đã rút |
| POST | /ojt-coordinations/:id/decision | Giữ là nơi ghi quyết định DN duy nhất; đồng bộ JobApplications, kiểm tra chỗ trong cùng transaction |
| POST | /ojt-coordinations/:id/reassign | Liên kết đơn mới khi đổi vị trí; không mang đơn của vị trí cũ sang vị trí mới |
| GET | /assignments; /assignments/:id | Giữ; Student đọc bản thân qua endpoint riêng |
| POST | /assignments | Giữ tạo từ ACCEPTED, không tự giả lập quyết định DN |
| PATCH | /assignments/:id | Giữ giám sát/thời gian; đổi vị trí qua hủy/reassign |
| PATCH | /assignments/:id/status | Giữ chuyển trạng thái; đồng bộ thông báo và tiến trình đơn |
| GET | /internship-evaluations; /internship-evaluations/:id | Giữ scope DN |
| PUT | /assignments/:id/internship-evaluation | Giữ nộp/sửa và proxy audit |
| GET | /ojt-semesters | Đã hỗ trợ OJT_COORD; DN chọn kỳ từ tin tuyển/dữ liệu của mình |
| GET | /ojt-semesters/:id/students | Giữ QHDN chỉ hồ sơ bàn giao, các bộ lọc enterprise/coordination/assignment đã thêm |
| GET | /ojt-registrations/:id | Giữ nguồn hồ sơ QHDN; DN chỉ nhận DTO ứng viên của hồ sơ đã gửi cho mình |
| GET | /ojt-results; /ojt-results/:id | Giữ ADMIN/ACADEMIC/OJT_COORD |
| POST | /ojt-results; /ojt-results/:id/transfer | Giữ ADMIN/OJT_COORD chuyển kết quả |
| PATCH | /ojt-results/:id | Giữ ADMIN/ACADEMIC sửa điểm chính thức |
| POST | /ojt-results/:id/revision-requests; /confirm | Giữ ADMIN/ACADEMIC; thêm quy tắc công bố sau xác nhận |
| GET | /ojt-semesters/:id/results/export | Giữ CSV/JSON; PDF ngoài phạm vi hiện tại |

## 5. API Student cần thêm hoặc đối chiếu branch đã hoàn thành

P1 cần cho luồng chính; P2 tiện ích/tự phục vụ. Không tạo alias mới cho endpoint đã đủ chức năng.

| Ưu tiên | Method | Endpoint đề xuất | Nguồn/ghi chú |
|---|---|---|---|
| P1 | GET | /student/academic-summary | Tổng hợp progress + eligibility: đã đạt/đang học/thiếu, môn nợ/chưa học/đang học; deadline và computedAt |
| P1 | GET | /student/ojt-registration-windows | Service đợt hiện có + scope sinh viên; canRegister/blockReasons; phân biệt mục đích đợt |
| P1 | GET | /student/curriculum | Chương trình của mình đã ban hành, môn bắt buộc, combo |
| P1 | GET | /student/companies; /student/companies/:id | Đối tác ACTIVE, chưa xóa, dữ liệu được công bố |
| P1 | GET | /student/positions; /student/positions/:id | Vị trí OPEN + tin PUBLISHED, đúng kỳ; postId, yêu cầu, deadline, remainingSlots, canApply/blockReasons |
| P1 | POST | /student/applications | Body postId/positionId, thông tin hồ sơ; backend xác định Student/Registration/Enterprise. Dùng JobApplications |
| P1 | GET | /student/applications; /student/applications/:id | Đơn của mình, timeline, quyết định, trạng thái điều phối/phân công |
| P1 | GET | /student/notifications | Phân trang/lọc unread; trả unreadCount cùng response, không cần endpoint count riêng |
| P1 | PATCH | /student/notifications/:id/read | Chỉ người nhận; idempotent |
| P1 | GET | /student/supplementary-course-options | Gợi ý bằng quy tắc; nếu chưa có lịch lớp chỉ trả môn cần bổ sung và availability UNKNOWN |
| P2 | GET | /student/combo-registration-windows | Scope/lịch/quyền chọn, tái sử dụng combo service |
| P2 | GET | /student/assignments/current | Phân công chưa hủy trong kỳ được chọn; có lịch sử học kỳ ở dữ liệu nguồn |
| P2 | GET | /student/ojt-results; /student/ojt-results/:id | Chỉ kết quả được công bố của mình |
| P2 | GET | /student/dashboard | Tổng hợp các nguồn trên, không tạo thuật toán học vụ mới |
| P2 | POST | /student/applications/:id/withdraw | Chỉ trước tiếp nhận/phân công theo chính sách; thông báo QHDN, hủy điều phối pending nếu có, không xóa lịch sử |

Không thêm /student/me nếu GET /auth/me đã được mở rộng studentId. Không thêm /student/eligibility nếu /students/:id/eligibility đã đủ.

## 6. API role khác cần tạo mới

| Ưu tiên | Method | Endpoint đề xuất | Quyền | Mục đích |
|---|---|---|---|---|
| P1 | GET | /recruitment-posts; /recruitment-posts/:id | ADMIN/QHDN; DN của mình | Quản lý tin tuyển; Student xem thông tin công bố qua positions |
| P1 | POST/PATCH | /recruitment-posts; /recruitment-posts/:id | ADMIN/QHDN | Soạn tin, liên kết vị trí cùng DN/kỳ, deadline |
| P1 | POST | /recruitment-posts/:id/publish; /close | ADMIN/QHDN | Công bố/đóng; dùng RecruitmentPosts + RecruitmentPostPositions có sẵn |
| P1 | GET | /job-applications; /job-applications/:id | ADMIN/QHDN; DN của mình sau điều phối | Theo dõi đơn; DN chỉ đọc ứng viên được gửi cho mình, không đọc toàn bộ hồ sơ OJT |
| P1 | POST | /academic/eligibility-notifications | ADMIN/ACADEMIC | Công bố kết quả chính thức đủ/không đủ/chờ đối soát theo checkId/runId, chống gửi lặp; không phụ thuộc có cảnh báo |
| P1 nếu gửi toàn bộ giữa kỳ | POST | /academic/academic-summary-notifications | ADMIN/ACADEMIC | Gửi snapshot giữa kỳ cho toàn bộ scope, kể cả SV chưa có cảnh báo. Khác alert-only endpoint |
| P2 | GET/PUT | /academic-periods/:id/ojt-advisory-schedule | ADMIN/ACADEMIC | Cấu hình thời điểm giữa kỳ, assessmentPeriod và kỳ OJT mục tiêu; worker dùng nếu cần gửi tự động |
| P2 | GET | /academic/advisory-runs; /academic/advisory-runs/:id | ADMIN/ACADEMIC | Theo dõi tác vụ giữa kỳ, kết quả gửi và retry; cần nếu triển khai worker |
| P2 | POST | /ojt-results/:id/publish | ADMIN/ACADEMIC | Chỉ thêm nếu công bố là bước riêng; nếu quy định CONFIRMED được công bố ngay thì dùng confirm và không tạo endpoint này |
| P2 | GET/POST/PATCH | /support-classes; /support-classes/:id (GET/PATCH) | ADMIN/ACADEMIC | Danh sách/tạo/sửa lớp bổ sung, môn, kỳ, lịch, chỉ tiêu; chỉ cần khi quản lý lớp trong hệ thống |
| P2 | GET | /student/support-classes | STUDENT | Lớp phù hợp và đang nhận đăng ký |
| P2 | POST/GET | /student/support-class-registrations | STUDENT | Đăng ký/theo dõi lớp; không chỉ làm gợi ý nếu chưa có module quản lý lớp |

Không tạo thêm endpoint quyết định trên /job-applications trong phiên bản đầu: dùng /ojt-coordinations/:id/decision làm nguồn duy nhất và đồng bộ trạng thái đơn. Nếu cần REVIEWING/INTERVIEW, bổ sung PATCH /job-applications/:id/stage cho DN scoped/QHDN với enum chỉ các bước trung gian, không cho ghi ACCEPTED/REJECTED ở đó.

Nếu cần nộp CV trước khi có AI: bổ sung POST /student/cv (upload private), GET /student/cv, DELETE /student/cv; staff/DN lấy bản của hồ sơ được phép xem qua GET /job-applications/:id/cv bằng tải có xác thực/URL ngắn hạn. Đây là quản lý tệp, không cần model AI, và chỉ triển khai khi yêu cầu CV của hồ sơ được chốt. Cần metadata phiên bản/quyền sở hữu, không tin object path client gửi tự do. Không tiếp tục dùng public cvUrl làm thiết kế lưu trữ chính.

## 7. Quy tắc liên thông cần chốt trước khi triển khai

1. Phân biệt assessmentAcademicPeriodId (kỳ 5), registrationAcademicPeriodId và ojtSemesterId (đợt thực tập tương lai). BL3W là BLOCK3 của kỳ cha, không phải học kỳ mới. Không lấy mặc định 4 tháng để quyết định mốc chốt.
2. Chốt chính thức sau khi cả kỳ cha và BL3W kết thúc, điểm được Đào tạo finalized; xác nhận chỉ dùng snapshot mới, đúng kỳ sinh viên. Thiếu dữ liệu trả REVIEW_REQUIRED/chờ đối soát.
3. Luồng đầu tiên tái sử dụng hồ sơ hiện có: official ELIGIBLE → Student nộp hồ sơ OJT → Đào tạo duyệt/bàn giao → mở ứng tuyển DN → QHDN gửi đơn → DN decision → phân công. UI phải hiển thị rõ đang chờ duyệt/bàn giao, không chỉ nút đăng ký bị khóa không lý do.
4. Nếu muốn sinh viên ứng tuyển ngay sau chốt mà không đợi xử lý hồ sơ thủ công, cần bổ sung tác vụ Đào tạo tạo/duyệt/bàn giao hàng loạt với audit. Không cho Student/QHDN tự tạo bàn giao, không tạo vòng phụ thuộc ứng tuyển mới có hồ sơ nhưng hồ sơ lại cần ứng tuyển.
5. Môn nợ để xét <=2 chỉ là môn từng trượt chưa khắc phục. Môn chưa học/đang học nằm ở danh sách tiến độ/tư vấn và không tự cộng vào số môn nợ. Môn bắt buộc của chương trình chưa pass không tự trở thành điều kiện OJT thứ ba nếu quy chế chỉ có 70/2.
6. JobApplications hiện yêu cầu PostID và PositionID liên kết qua RecruitmentPostPositions. Hoặc triển khai tin tuyển như đề xuất, hoặc sửa schema có migration để ứng tuyển trực tiếp vị trí; không nhận positionId đơn lẻ rồi tạo giả PostID.
7. Chọn một nơi ghi ACCEPTED/REJECTED; cập nhật application/coordination/reservation cùng transaction. Phân công vẫn chỉ từ tiếp nhận hợp lệ, không giữ chỗ lần hai. Chốt chính sách số đơn đang mở/số vị trí được tiếp nhận cho mỗi SV/kỳ trước khi triển khai nhiều đơn.
8. Ghi snapshot và idempotency cho gửi thông báo/chốt/bàn giao. Cảnh báo giữa kỳ không tự thay kết quả chính thức; sửa điểm sau chốt cần đối soát và xử lý hồ sơ đã bàn giao theo quyết định Đào tạo, không âm thầm xóa lịch sử.
9. Tách DTO theo role. Student chỉ dữ liệu của mình; Enterprise chỉ doanh nghiệp mình và hồ sơ thực sự được gửi; không trả raw AuditLogs/snapshot nội bộ qua DTO Student/Enterprise nếu không cần.
10. Admin prediction/risk/model APIs đã có một phần trong module admin nhưng nằm ngoài phạm vi hiện tại. Không dùng dữ liệu dự báo để quyết định đủ điều kiện OJT.

## 8. Trình tự triển khai đề xuất

P1-A: sửa mô hình kỳ/mốc chốt và registration guard; bổ sung môn nợ vào cảnh báo; kiểm tra DTO.

P1-B: studentId trong auth/me; các API đọc Student và summary/thông báo, tái sử dụng service.

P1-C: tin tuyển → đơn ứng tuyển → liên kết điều phối/decision/phân công; gửi kết quả chính thức.

P2: dashboard, worker gửi giữa kỳ tự động, quản lý lớp bổ sung, CV thông thường và các tiện ích theo phạm vi đã chốt.

Sau cùng mới làm AI dự báo, tư vấn tối ưu, đọc CV và matching.

## 9. Source đã đối chiếu

- src/routes/index.ts; src/routes/json-input.routes.ts; src/config/json-input-operations.ts.
- src/modules/students/student.routes.ts; student.service.ts; academic-progress.ts.
- src/modules/eligibility/eligibility.routes.ts; eligibility.service.ts.
- src/modules/academic/academic.routes.ts; workflow.routes.ts; workflow-policy.ts.
- src/modules/academic-reporting/report.routes.ts; report.repository.ts; report.service.ts; notification.service.ts.
- src/modules/ojt-registration/registration.routes.ts; registration.service.ts; handoff.service.ts.
- src/modules/curriculum/curriculum.routes.ts; src/modules/combo-registration/combo.routes.ts.
- src/modules/qhdn/qhdn.routes.ts; qhdn.repository.ts; workflow.service.ts.
- src/modules/ojt-results/result.routes.ts; result.service.ts.
- src/modules/auth/auth.controller.ts; auth.service.ts; src/modules/admin/admin.routes.ts.
- backend/DB, chỉ đọc các phần liên quan, không chạy script.
