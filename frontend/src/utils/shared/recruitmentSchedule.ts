export const recruitmentPhases = [
  { key: 'posting', label: '1. Doanh nghiệp đăng tin', description: 'Doanh nghiệp tạo, chỉnh sửa tin nháp và tự công bố tin trong hạn đăng tin.' },
  { key: 'application', label: '2. Sinh viên ứng tuyển', description: 'Sinh viên đủ điều kiện nộp hồ sơ, kể cả khi hạn đăng tin chưa kết thúc. Bắt đầu Hạn 2 phải sau bắt đầu Hạn 1; kết thúc Hạn 2 phải sau kết thúc Hạn 1.' },
  { key: 'results', label: '3. Doanh nghiệp xét tuyển, phản hồi', description: 'Giờ bắt đầu được gợi ý theo hạn ứng tuyển và có thể chỉnh tay. Doanh nghiệp xem hồ sơ, liên hệ, phỏng vấn và nhận hoặc từ chối trong hạn này.' },
] as const;

export type PhaseSchedule = Record<'postingStartsAt'|'postingEndsAt'|'applicationStartsAt'|'applicationEndsAt'|'resultsStartsAt'|'resultsEndsAt', string>;
export const missingRecruitmentRounds = 'Học kỳ này chưa tạo đợt tuyển dụng và chưa mở hạn xét tuyển cho doanh nghiệp và sinh viên.';
