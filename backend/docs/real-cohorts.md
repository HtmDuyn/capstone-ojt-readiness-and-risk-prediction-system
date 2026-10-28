# Khóa K18–K21 và khung chương trình

Các năm nhập học đã được xác nhận:

| Khóa | EnrollmentYear |
| --- | --- |
| K18 | 2023 |
| K19 | 2024 |
| K20 | 2025 |
| K21 | 2026 |

Các khóa và quan hệ áp dụng chương trình được tạo ngay trong script hoàn chỉnh `backend/DB`. Không có script seed khóa hoặc migration riêng. Lịch từng nhóm vẫn do Phòng đào tạo cấu hình; không tự gán toàn bộ khóa vào nhóm A.

Hàm `CurriculumCohortCodes` tách nhãn khóa từ mã khung, độc lập với năm lịch:

- `BIT_SE_K18D_19A`, `BIT_AI_K18D-19A_FNO`: K18 và K19.
- `BIT_SE_K19D_K20A`: K19 và K20.
- `BIT_AI_K20D-21A`: K20 và K21.
- `BIT_SE_K21B`: K21.
- `BIT_SE_K180A`, `DEMO-SE-FULL`: không khớp K18–K21.

View `TrainingProgramCohorts` cung cấp quan hệ nhiều–nhiều giữa khóa và khung chương trình, tự cập nhật khi thêm/đổi mã chương trình hoặc khóa. Có thể tra cứu:

```sql
SELECT "CohortCode", "ProgramID", "ProgramCode"
FROM "TrainingProgramCohorts"
ORDER BY "CohortCode", "ProgramCode";
```

Trigger deferred kiểm tra quan hệ này khi gán khóa/chương trình cho sinh viên. Preview import chạy cùng các ràng buộc deferred; vì vậy lỗi gán khung không thuộc khóa bị phát hiện trước commit. Khóa demo cũ được giữ nguyên.

**Lịch nhóm cần cấu hình riêng:** năm nhập học không đủ để biết học kỳ bắt đầu của nhóm A–D. Script không tự tạo `CohortGroups` hoặc ánh xạ `CohortCurriculumPeriods`. Cần cung cấp học kỳ bắt đầu của mỗi nhóm và lộ trình 0–9 trước khi dùng các khóa mới trong import sinh viên. Chưa thể coi khóa mới là sẵn sàng import chỉ vì đã có liên kết khung chương trình.

## Khung chương trình độc lập với nhóm nhập học

Sinh viên K21 được gán bất kỳ khung đã công bố có token K21, kể cả K21A, K21B, K21C, K21D hoặc mã dùng chung K20D-21A. Tương tự với các khóa khác. Chữ A/B/C/D trong mã khung không ràng buộc GroupCode của sinh viên.

Nhóm nhập học được chọn riêng để xác định lịch kỳ 0–9; không mặc định toàn bộ K21 vào A. Mỗi nhóm sử dụng lịch riêng do Phòng đào tạo cấu hình; không tự sinh nhóm hoặc sao chép lịch từ dữ liệu mẫu.
