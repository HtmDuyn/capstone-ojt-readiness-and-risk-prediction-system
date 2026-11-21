export const recruitmentPhases = [
  { key: 'posting', label: '1. Doanh nghiệp đăng tin', description: 'Doanh nghiệp tạo, chỉnh sửa và tự công bố tin. Sinh viên xem trước, chưa ứng tuyển.' },
  { key: 'application', label: '2. Sinh viên ứng tuyển', description: 'Sinh viên đủ điều kiện nộp hồ sơ; nội dung và chỉ tiêu tuyển dụng được khóa.' },
  { key: 'results', label: '3. Doanh nghiệp xét tuyển, phản hồi', description: 'Giờ bắt đầu được gợi ý theo hạn ứng tuyển và có thể chỉnh tay. Doanh nghiệp xem hồ sơ, liên hệ, phỏng vấn và nhận hoặc từ chối trong hạn này.' },
] as const;

export type PhaseSchedule = Record<'postingStartsAt'|'postingEndsAt'|'applicationStartsAt'|'applicationEndsAt'|'resultsStartsAt'|'resultsEndsAt', string>;
export const missingRecruitmentRounds = 'Học kỳ này chưa tạo đợt tuyển dụng và chưa mở hạn xét tuyển cho doanh nghiệp và sinh viên.';
