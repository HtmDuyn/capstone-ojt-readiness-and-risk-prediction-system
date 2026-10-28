# CV sinh viên và ứng tuyển doanh nghiệp

## Upload CV độc lập

`POST /api/students/me/cv`, Bearer token STUDENT, multipart/form-data chỉ gồm trường file `cv`. Sinh viên upload/thay CV trước khi đăng ký OJT, không cần windowId, registrationId hoặc xác nhận đủ điều kiện. PDF tối đa 10 MB.

```js
const form = new FormData();
form.append('cv', selectedFile);
const response = await fetch('/api/students/me/cv', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: form,
});
const { data: cv } = await response.json();
```

Không tự đặt Content-Type: trình duyệt thêm multipart boundary. Response `{success:true,data:{id,studentId,fileName,mimeType,size,sha256,uploadedAt,replayed}}` chỉ chứa metadata, không trả bytes/base64/URL. Sinh viên lấy từ token, không truyền studentId.

`StudentCVFiles.Content` lưu BYTEA. Upload thay thế tạo phiên bản mới; retry cùng file và tên trả cùng phiên bản. CV hiện tại là phiên bản có CVFileID lớn nhất của sinh viên. Giữ phiên bản cũ để hồ sơ ứng tuyển đã gửi vẫn tham chiếu đúng file ban đầu. Chưa tích hợp AI đọc/matching CV; file và SHA-256 đã sẵn sàng cho tác vụ sau này.

Tải PDF qua `GET /api/students/:id/cv`; thêm query `cvFileId` để tải phiên bản cũ. FE dùng `response.blob()`/Axios responseType blob và Bearer token. Sinh viên chỉ xem file của mình; Admin/Đào tạo dùng GET /api/students/:id/cv; QHDN chỉ được đọc khi sinh viên đã có bản ghi bàn giao. Doanh nghiệp chưa được cấp quyền API này.

API hồ sơ sinh viên trả `data.cv`; danh sách QHDN trả `items[].cv`. `registrations[].application.cv` là CV hiện tại từ hồ sơ sinh viên, không phải ảnh chụp CV của lần ứng tuyển. Bản CV đã dùng khi ứng tuyển nằm ở `JobApplications.CVFileID` và response hồ sơ ứng tuyển.

## Đăng ký OJT và ứng tuyển là hai nghiệp vụ

`POST /api/ojt-registrations` dùng chung cho Student và nhân sự đúng quyền. Body JSON gồm `windowId`, application (contactPhone, contactEmail, note), studentId khi staff đăng ký thay. API này không nhận file hoặc cvUrl. Đăng ký được kiểm tra theo đợt, bàn giao và quy tắc hiện hành; không tự cấp quyền ứng tuyển hay đi thực tập.

`POST /api/job-applications` dành cho STUDENT:

```json
{
  "registrationId": 1,
  "postId": 1,
  "positionId": 1,
  "coverLetter": "Nguyện vọng ứng tuyển"
}
```

Backend kiểm tra quyền sở hữu, hồ sơ đang hoạt động, kết quả Đào tạo xác nhận ELIGIBLE còn khớp dữ liệu/khung chương trình/quy tắc hiện tại, đợt đăng ký sinh viên đang mở/còn hạn, vị trí đúng kỳ/doanh nghiệp/tin, tin PUBLISHED còn hạn, doanh nghiệp ACTIVE, vị trí OPEN và còn chỉ tiêu. Đợt này là OJTRegistrationWindows, không phải RecruitmentWindows dành cho doanh nghiệp gửi nhu cầu. Ứng tuyển không tự bàn giao, điều phối hoặc chiếm chỗ phân công.

Lưu RegistrationID, StudentID, EnterpriseID, PositionID, PostID, OJTSemesterID, OfficialCheckID và CVFileID hiện tại (null nếu sinh viên chưa upload). Tạo FK đối chiếu đúng sinh viên/kỳ và đúng phiên bản CV. Gửi lại cùng hồ sơ/vị trí/tin và coverLetter không tạo ứng tuyển trùng.

`GET /api/job-applications` nhận query bộ lọc applicationId/studentId/registrationId/ojtSemesterId/companyId/positionId/status và page/limit. Sinh viên chỉ thấy ứng tuyển của mình; Admin/QHDN xem cả trước bàn giao. Response kèm sinh viên, công ty, vị trí, tin, phiên bản CV đã gửi, xác nhận chính thức được dùng, trạng thái bàn giao/điều phối.

`GET /api/students/me/opportunities` nhận query ojtSemesterId, page/limit. Trả vị trí còn công bố và thông tin FE cần, kèm canApply/blockers cho từng vị trí, chỉ tiêu còn, applicationId đã ứng tuyển, registrationId và officialEligibility. canApply tổng thể là điều kiện ở cấp sinh viên; FE dùng canApply trên từng item cho nút ứng tuyển. Backend luôn kiểm tra lại khi gửi.

## Dự báo và bàn giao

Hồ sơ sinh viên trả `officialEligibility`/`officialDecision`; kịch bản học vụ trong academic-summary không cấp quyền OJT. Thiếu xác nhận hoặc kết quả đã cũ trả officialDecision REVIEW_REQUIRED. Dự báo tốt không thể vượt điều kiện official ở API ứng tuyển.

QHDN chỉ đọc trước bàn giao. Điều phối/tiếp nhận/phân công yêu cầu HANDED_OFF và bản ghi bàn giao đúng hồ sơ/sinh viên/kỳ, đồng thời kiểm tra xác nhận chính thức còn hiệu lực. Điều phối nhận applicationId tùy chọn hoặc tự chọn ứng tuyển đúng vị trí; phản hồi doanh nghiệp cập nhật cả trạng thái ứng tuyển liên kết. Điều phối lại sau từ chối vẫn theo nghiệp vụ hiện có.

Đợt chuẩn hóa REST này không thay đổi schema hoặc dữ liệu DB thực tế. FE gửi upload qua API CV riêng, body nghiệp vụ qua JSON.
