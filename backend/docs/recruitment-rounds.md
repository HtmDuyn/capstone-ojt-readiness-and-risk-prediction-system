# Đợt tuyển dụng với ba hạn

Mỗi đợt tuyển dụng con gồm ba khoảng thời gian có ngày giờ bắt đầu và kết thúc:

| Hạn | Thao tác được phép |
| --- | --- |
| 1. Doanh nghiệp đăng tin | Doanh nghiệp tạo, sửa và tự công bố tin. Sinh viên xem trước, chưa nộp hồ sơ. |
| 2. Sinh viên ứng tuyển | Sinh viên đủ điều kiện và đã bàn giao nộp hồ sơ vào vị trí thuộc đúng đợt. Tin, điều kiện và chỉ tiêu tuyển dụng được khóa. |
| 3. Doanh nghiệp xét tuyển, phản hồi | Doanh nghiệp xem hồ sơ, liên hệ, phỏng vấn ngay và cập nhật nhận/từ chối. |

Hạn 1 kết thúc trước hoặc đúng lúc hạn 2 bắt đầu. Hạn 3 **bắt đầu cùng hạn 2 và kết thúc sau hạn 2**. Mọi khoảng có giờ kết thúc lớn hơn giờ bắt đầu. Mốc bắt đầu được tính trong hạn; đúng giờ kết thúc là hết hạn.

## Tạo và mở

Giao diện tạo một đợt với tên và ba cặp ngày giờ. Không có ghi chú thiết lập hoặc thao tác thêm/bỏ đợt con. Ngày bắt đầu/kết thúc chung tự lấy từ đầu hạn đăng tin và cuối hạn phản hồi; backend ghi lý do tạo mặc định khi không truyền `reason`.

Role OJT_COORD và ADMIN tạo đợt tổng cùng 1–30 đợt tuyển dụng con trong một transaction. Mỗi kỳ OJT có một đợt tổng. Các đợt con không trùng nhau và nằm trong lịch đợt tổng; đợt tổng bắt đầu trong tương lai và không vượt ngày kết thúc học kỳ.

Mỗi phần tử rounds nhận name và đủ sáu trường postingStartsAt, postingEndsAt, applicationStartsAt, applicationEndsAt, resultsStartsAt, resultsEndsAt. Không nhận startsAt/endsAt chung cho đợt con mới. Các mốc bắt đầu được giữ cố định. QHDN chỉ được kéo dài thời điểm kết thúc của giai đoạn đang mở, bảo đảm không trùng lịch và không vượt học kỳ. Cửa sổ ứng tuyển OJT liên kết dùng chính lịch hạn 2.

Có thể mở đợt trước giờ đăng tin; hiển thị Chờ bắt đầu. Hệ thống giới hạn từng thao tác theo hạn thực tế. Mở đợt sau yêu cầu các đợt trước kết thúc và được chốt tổng hợp. Không mở lại đợt đã đóng/hết hạn/chốt kết quả.

## Khi hết hạn

- Hết hạn 2: khóa nộp hồ sơ mới; doanh nghiệp tiếp tục xử lý hồ sơ trong hạn 3.
- Hết hạn 3: API khóa nhận/từ chối ngay. Worker tuyển dụng chạy mỗi 60 giây, chuyển SUBMITTED/REVIEWING/INTERVIEW/OFFERED thành REJECTED; ghi lý do doanh nghiệp quá hạn phản hồi và sự kiện AUTO_REJECT_RESPONSE_DEADLINE. Coordination đang PENDING được đồng bộ REJECTED.
- ACCEPTED, REJECTED, WITHDRAWN và hồ sơ có phân công còn hiệu lực được giữ nguyên. Tác vụ chạy lại không tạo thêm sự kiện cho hồ sơ đã xử lý; sau khi backend ngừng rồi chạy lại vẫn xử lý được hồ sơ đã quá hạn.
- Danh sách điều phối QHDN hiển thị Doanh nghiệp từ chối, dấu quá hạn và bộ lọc hồ sơ cần theo dõi đợt sau. Lịch sử hồ sơ và quyết định được giữ lại. Sinh viên bị doanh nghiệp từ chối có thể được QHDN điều phối ngay khi đợt đang diễn ra; không cần đợi hết hạn hoặc chốt tổng hợp. QHDN cũng có thể đợi tổng hợp cuối đợt. Các hồ sơ chưa bị từ chối tiếp tục tuân theo điều kiện hoàn tất tuyển dụng; không tự rút hồ sơ đang được DN xử lý.
- Chốt tổng hợp cũng xử lý hồ sơ quá hạn trong cùng transaction trước khi đếm kết quả.
- Tin và hồ sơ cũ giữ liên kết với đợt gốc. Khi mở đợt bổ sung, hệ thống tạo bản tin tiếp tục tuyển liên kết tin nguồn và dùng lại PositionID, không di chuyển tin cũ hoặc đặt lại chỉ tiêu.

## Gia hạn và đợt bổ sung

Nút **Gia hạn** chỉ xuất hiện với giai đoạn đang mở. Chỉ kéo dài thời điểm kết thúc; không đổi các mốc bắt đầu. Hạn đăng tin không vượt giờ mở ứng tuyển; hạn ứng tuyển luôn kết thúc trước hạn phản hồi. Có thể gia hạn đồng thời ứng tuyển và phản hồi. Hạn ứng tuyển đã đóng không mở lại, kể cả khi hạn phản hồi vẫn còn. Các thay đổi dùng giờ database, kiểm tra lại trong transaction và lưu audit; thông báo trong hệ thống gửi đến doanh nghiệp đang hoạt động, sinh viên đã bàn giao của kỳ và QHDN/Admin. Chuông thông báo DN/QHDN hiển thị nội dung gia hạn; từng người chỉ xem và đánh dấu thông báo của mình.

Sau khi đợt hiện tại kết thúc và được chốt tổng hợp, nút **Tạo đợt bổ sung** mở đúng form tên + ba cặp ngày giờ như tạo đợt mới. API vẫn dùng POST /api/recruitment/windows với supplemental=true. Mỗi đợt bổ sung có lịch riêng, bắt đầu trong tương lai; backend tự đánh số và mở rộng biên quản lý của kỳ, không sửa lịch đợt trước.

Khi mở đợt bổ sung, bản tin tiếp tục tuyển dùng lại các vị trí còn slot của đợt trước và lưu SourcePostID. Số slot dùng chung trong kỳ = số sinh viên đã được xác nhận nhận hoặc có phân công hiệu lực, tính mỗi SV một lần. Không reset Capacity hoặc tạo lại vị trí. Ràng buộc DB và transaction chặn nhận vượt chỉ tiêu. Khi chuyển một SV đã được nhận sang phân công, slot không bị tính hai lần.

SV đã được nhận hoặc có phân công trong kỳ bị khóa ứng tuyển mới. SV chưa có nơi thực tập có thể nộp vào bản tin đợt bổ sung bằng một JobApplication mới, CV/hồ sơ mới. Hồ sơ trùng trong cùng đợt không ghi đè; lịch sử quyết định, CV và ApplicationSnapshot của các lần trước được giữ nguyên. Vị trí dùng chung với đợt trước không cho đặt lại chỉ tiêu hoặc thay điều kiện cũ; bản tin tiếp tục tuyển có thể giữ nguyên các vị trí đó.

## Cập nhật Supabase đang sử dụng

Chạy riêng khối từ **-- BEGIN OJT RECRUITMENT THREE PHASES V3** đến **-- END OJT RECRUITMENT THREE PHASES V3** trong backend/DB, sau khi database đã có các khối V1, CAMPAIGN V2 và PLACEMENT V1. Khối V3 cập nhật hàm/guard, không reset dữ liệu. Không chạy toàn bộ DB trên database cần giữ dữ liệu.

Sau V3, chạy riêng khối **-- BEGIN OJT RECRUITMENT LIFECYCLE V4** đến **-- END OJT RECRUITMENT LIFECYCLE V4** trong backend/DB để dùng gia hạn, đợt bổ sung, chỉ tiêu chung và snapshot hồ sơ. Khối V4 là cập nhật bổ sung, không reset; không cần chạy lại toàn bộ DB.

Các đợt cũ chưa có sáu mốc tiếp tục dùng lịch hiện có. Đợt mới dùng ScheduleVersion=3; không tự suy diễn ba hạn từ lịch cũ.

## Kiểm tra

Build backend rồi chạy node --test tests/recruitment-round-policy.test.cjs. Test tích hợp tests/recruitment-phases.integration.cjs yêu cầu RECRUITMENT_PHASES_TEST_DATABASE_URL trỏ đúng PostgreSQL dùng thử tại 127.0.0.1:55441/qhdn_phases_test; test reset database này. Frontend chạy npm run test:qhdn và npm run build.

Test tests/recruitment-extension.test.cjs kiểm tra giới hạn gia hạn. Test tests/recruitment-lifecycle.integration.cjs yêu cầu RECRUITMENT_LIFECYCLE_TEST_DATABASE_URL trỏ đúng database dùng thử 127.0.0.1:55441/qhdn_lifecycle_test (test reset database này). Test bao gồm thông báo đúng người, hồ sơ mới/khóa SV đã nhận, giữ lịch sử, tiếp tục slot và không đếm trùng khi tạo phân công.

Khi DN từ chối, hệ thống cập nhật trạng thái và tạo thông báo cho QHDN/Admin trong cùng transaction. Màn hình điều phối tự tải lại mỗi 15 giây khi đang xem và không mở hộp xử lý; cũng tải lại khi quay lại cửa sổ. Quyền điều phối được tính theo từng sinh viên: chưa có nơi thực tập, quyết định mới nhất là REJECTED thì được xử lý ngay. Vẫn khóa hồ sơ đã được nhận, đã có phân công/thực nhận hoặc đang chờ phản hồi điều phối QHDN trước; không ghi đè hồ sơ từ chối cũ.
