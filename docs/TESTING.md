# Kiểm thử OJT và xuất báo cáo Excel

Bộ kiểm thử bám theo source hiện tại: backend Express/TypeScript, PostgreSQL và frontend React/Vite. Hai workbook trong `qa/reports/` được tạo theo bố cục của hai file mẫu người dùng cung cấp. Kết quả cũ trong mẫu chỉ là nguồn tham khảo, không được chuyển thành PASS của lần chạy mới.

## Cài đặt trên Windows PowerShell

```powershell
npm.cmd --prefix backend ci
npm.cmd --prefix frontend ci
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r qa/requirements.txt
npx.cmd --prefix frontend playwright install chromium --no-shell
```

Node hiện dùng trong lần thiết lập là v24.19.0. Các phiên bản npm cụ thể được khóa trong hai `package-lock.json`. PowerShell trên máy hiện tại chặn `npm.ps1`, vì vậy dùng `npm.cmd` và `npx.cmd`; không cần đổi execution policy của máy.

Đặt hai file mẫu gốc, giữ nguyên tên, vào thư mục `qa/templates/`:

- `OJT_RPA_Unit_Test_Demo.xlsx`
- `OJT_RPA_Test_Report_Demo.xlsx`

Thư mục này đã có bản sao trên máy làm việc và được gitignore. Khi dùng bản clone khác cần sao chép lại hai mẫu. Xuất Excel cần các mẫu này; hai suite Vitest vẫn chạy độc lập bằng lệnh `npm.cmd --prefix backend test` và `npm.cmd --prefix frontend test`.

## Chạy kiểm thử

Từ thư mục gốc:

```powershell
# Build backend/frontend + unit/component + coverage + xuất/kiểm tra Excel
npm.cmd test

# Thêm API/database thật, không chạy trình duyệt
npm.cmd run test:live

# Build + unit/component + API/database + Chromium + hai báo cáo Excel
npm.cmd run test:all
```

Chạy riêng từng tầng:

```powershell
npm.cmd --prefix backend run test:coverage
npm.cmd --prefix frontend run test:coverage
npm.cmd --prefix backend run test:live
npm.cmd --prefix frontend run test:e2e
```

Hai lệnh Vitest mặc định không dùng database thật: repository, DB và external services được mock tại setup của backend. Test API thật dùng `backend/.env`; không in connection URL hoặc secret. Không chạy `backend/DB` để chuẩn bị test vì file này có phần reset/drop dữ liệu.

`test:all` tạo thư mục lần chạy mới và dùng cùng một `QA_RUN_ID` cho tất cả tầng. File `qa/results/latest.json` trỏ đến lần chạy gần nhất. Chạy riêng từng tầng không qua runner sẽ ghi vào `qa/results/manual`; đây là vùng thử nghiệm, không có bảo đảm rằng các tầng được chạy cùng thời điểm.

## Tài khoản và phân quyền

Mật khẩu thật chỉ nằm trong `qa/accounts.local.json` đã được gitignore. File này đã được cấu hình trên máy theo tài khoản người dùng cung cấp. Khi chuyển máy, sao chép `qa/accounts.example.json` thành `qa/accounts.local.json` và nhập mật khẩu riêng.

| API role | Frontend role | Email demo |
| --- | --- | --- |
| ADMIN | admin | admin@ojtrpa.edu.vn |
| ACADEMIC | education | academic@ojtrpa.edu.vn |
| OJT_COORD | qhdn | ojt.coord@ojtrpa.edu.vn |
| STUDENT | student | student01@student.edu.vn |
| ENTERPRISE | enterprise | hr@techviet.example |

Ma trận API kiểm tra từng role đối với năm tài nguyên đại diện: admin dashboard, academic years, companies, student identity và enterprise profile. Có cả trường hợp được phép, bị cấm và không đăng nhập. ADMIN có quyền trên một số tài nguyên staff nhưng không được coi là người dùng student/enterprise của endpoint self-service.

## Database và trình duyệt

`backend/scripts/qa-readonly.ts` thiết lập `default_transaction_read_only=on` và statement timeout trên mỗi kết nối thật, rồi xác minh trước khi đưa kết nối cho ứng dụng. Không chỉ dựa vào `PGOPTIONS`, vì pooler đang dùng có thể bỏ qua tùy chọn startup đó. Test `DB-READONLY` kiểm tra điều kiện này.

Trình duyệt dùng backend QA tại `127.0.0.1:3300`, Vite tại `127.0.0.1:5175`, worker bị tắt và PostgreSQL chỉ đọc. Playwright tự khởi động/dừng hai server. Cần để trống hai cổng này. Chromium chạy headless với `channel=chromium`; không bắt buộc tải headless shell riêng.

Browser suite kiểm tra đăng nhập qua form thật, đúng role, tải lại phiên, chặn route role khác và điều hướng các trang chính. Assertion chỉ chứng minh các checkpoint được mô tả; trang trống hợp lệ không chứng minh đã kiểm thử thao tác ghi. Ảnh được chụp sau khi rời form đăng nhập; trace/video bị tắt để tránh lưu dữ liệu đăng nhập.

Một giới hạn đã xác định từ source: `GET /api/academic-years/:id/calendar` gọi `findRecord` có `SELECT FOR UPDATE`. Phiên QA chỉ đọc chặn truy vấn này với PostgreSQL25006. Nhóm điều hướng ACADEMIC được ghi Blocked nếu gặp đúng endpoint này; các HTTP500 khác vẫn làm test thất bại. Cần database test riêng cho luồng lịch học có khóa bản ghi. Xem `qa/limitations.json`; đây chưa phải bằng chứng lỗi production.

## Kết quả và độ bao phủ

Mỗi lần chạy tổng hợp lưu:

- `run.json`: thời điểm UTC, timezone hiển thị Việt Nam, Git HEAD, trạng thái working tree, SHA256 của source/backend DB và exit code của từng bước.
- `catalog/*.json`: testcase ID, module, dữ liệu đầu vào, điều kiện, bước thực hiện, kỳ vọng, level và source.
- `backend-unit.json/xml`, `frontend-unit.json/xml`, `live-api.json/xml`, `browser.json` và các log.
- `live-observations.json`: HTTP status, role và các quan sát không chứa password/JWT.
- `browser-artifacts/`, `browser-html/`: ảnh và bằng chứng điều hướng.
- `coverage/backend/`, `coverage/frontend/`: V8 coverage cho các file được chọn.

Coverage được giới hạn trong `include` của hai `vitest.config`. Không dùng phần trăm này để khẳng định coverage toàn backend/frontend. Tỷ lệ testcase đã chạy trong Excel cũng khác với độ bao phủ code.

Unit test kiểm tra JWT/bcrypt, xác thực/phân quyền, curriculum/tiên quyết, import và giới hạn số dòng, GPA/tín chỉ, tính khả thi ngưỡng OJT, cảnh báo sớm, cửa sổ tuyển dụng, điều phối, CSV, tính điểm và phiên frontend. API integration kiểm tra thật 5 tài khoản và database hiện có. Mock/utility test không xác nhận gửi mail thật, chất lượng AI, công bố kết quả hoặc luồng ghi liên role.

## Xuất và xác minh hai workbook

Runner tự xuất báo cáo sau khi chạy, kể cả khi có test thất bại. Có thể xuất lại từ cùng bằng chứng:

```powershell
npm.cmd run qa:report
npm.cmd run qa:verify

# Hoặc gọi Python trong môi trường đã cài
.\.venv\Scripts\python.exe qa/export_reports.py
.\.venv\Scripts\python.exe qa/verify_reports.py

# Hoặc chỉ rõ thư mục một lần chạy
.\.venv\Scripts\python.exe qa/export_reports.py --results qa/results/<run-id>
.\.venv\Scripts\python.exe qa/verify_reports.py --results qa/results/<run-id>
```

Đầu ra:

- `qa/reports/OJT_RPA_Unit_Test_Current.xlsx`: matrix theo testcase, các sheet Functions/Statistics và tám module như mẫu; chỉ chứa unit/component và kế hoạch tham khảo.
- `qa/reports/OJT_RPA_Test_Report_Current.xlsx`: testcase dạng hàng, precondition, procedure, expected/actual, Round1/2/3, role, level, source, evidence và thống kê. Các round chưa chạy để trống.
- `qa/reports/summary.json`, `execution-summary.txt`: số liệu tổng hợp của lần chạy.

Passed chỉ khi có kết quả runner tương ứng ID; Failed khi assertion không đạt; Blocked khi không đủ điều kiện/skip; Pending khi chưa thực thi. `PLAN-*` là 123 kịch bản từ mẫu, giữ Pending để rà soát tiếp. Chúng có thể gần giống testcase tự động nhưng là kế hoạch tham khảo riêng, không cộng vào số ca tự động đã PASS. Tester/reviewer từ mẫu không được mạo nhận là người chạy bộ test mới.

Workbook giữ công thức thống kê có cached values để xem được ngay bằng các viewer không tính lại công thức. Script xác minh kiểm tra ID, tổng số ca, trạng thái, formula/reference/cache, retest chưa thực hiện và không chứa password/JWT. Các chuỗi dữ liệu bắt đầu bằng dấu `=` được giữ dạng text, không thực thi như công thức Excel.

## Kiểm thử tiếp các ghi chú lịch sử

`qa/history-notes.json` đối chiếu các kiểm tra UI đã ghi trong mẫu: application/task trước reset, task submission viewing chưa có UI, chênh lệch bảy giờ và cáo buộc task tự hoàn thành đã rút. Giữ riêng lịch sử này khỏi thống kê hiện tại.

Để chạy đầy đủ luồng ghi, chuẩn bị một database test riêng có fixture đã biết: vị trí tuyển dụng đang mở, sinh viên đủ điều kiện, CV, assignment, task, bài nộp và đánh giá. Cần xác minh đồng bộ qua các role, reload, trạng thái khóa/công bố và cleanup/rollback. Không dùng navigation PASS để thay cho các checkpoint đó.

## Skill dự án

Ba hướng dẫn có thể tái sử dụng:

- `qa/skills/ojt-test-runner/SKILL.md`: cấu hình/chạy và phân tích bằng chứng.
- `qa/skills/ojt-excel-report/SKILL.md`: xuất và đối soát Excel.
- `qa/skills/ojt-workflow-retest/SKILL.md`: rà soát và chuẩn bị retest các luồng liên role.

Các entrypoint tương ứng đã được đăng ký tại `.agents/skills/` để Codex tìm thấy skill trong dự án; nội dung được duy trì tại `qa/skills/`.

Tham khảo công cụ: [Vitest](https://vitest.dev/guide/), [Playwright](https://playwright.dev/docs/intro), [Testing Library](https://testing-library.com/docs/react-testing-library/intro/), [openpyxl](https://openpyxl.readthedocs.io/).
