export const recruitmentPhases = [
  { key: 'posting', label: '1. Doanh nghiệp đăng tin', description: 'Doanh nghiệp tạo, chỉnh sửa và tự công bố tin. Sinh viên xem trước, chưa ứng tuyển.' },
  { key: 'application', label: '2. Sinh viên ứng tuyển', description: 'Sinh viên đủ điều kiện nộp hồ sơ; nội dung và chỉ tiêu tuyển dụng được khóa.' },
  { key: 'results', label: '3. Doanh nghiệp xét tuyển, phản hồi', description: 'Bắt đầu cùng hạn ứng tuyển. Doanh nghiệp xem hồ sơ, liên hệ, phỏng vấn và nhận hoặc từ chối ngay.' },
] as const;

export type PhaseSchedule = Record<'postingStartsAt'|'postingEndsAt'|'applicationStartsAt'|'applicationEndsAt'|'resultsStartsAt'|'resultsEndsAt', string>;
export function validateRecruitmentPhases(schedule: PhaseSchedule) {
  const times = Object.fromEntries(Object.entries(schedule).map(([key, value]) => [key, Date.parse(value)]));
  if (Object.values(times).some(value => !Number.isFinite(value))) throw new Error('Vui lòng nhập đầy đủ ngày giờ hợp lệ cho cả ba hạn.');
  if (times.postingStartsAt >= times.postingEndsAt || times.applicationStartsAt >= times.applicationEndsAt || times.resultsStartsAt >= times.resultsEndsAt)
    throw new Error('Ngày giờ kết thúc của mỗi hạn phải sau ngày giờ bắt đầu.');
  if (times.postingEndsAt > times.applicationStartsAt) throw new Error('Hạn đăng tin phải kết thúc trước hoặc đúng lúc bắt đầu ứng tuyển.');
  if (times.resultsStartsAt !== times.applicationStartsAt) throw new Error('Hạn xét tuyển phải bắt đầu cùng lúc với hạn ứng tuyển để doanh nghiệp xử lý hồ sơ ngay.');
  if (times.resultsEndsAt <= times.applicationEndsAt) throw new Error('Hạn phản hồi của doanh nghiệp phải kết thúc sau hạn ứng tuyển.');
}
