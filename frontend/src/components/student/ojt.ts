import { friendlyErrorMessage } from '@/utils/shared/friendlyError';

export type PartnerCompany = {
  id: number; name: string; code?: string; address?: string | null;
  industry?: string | null; contactPersonName?: string | null;
  contactEmail?: string | null; contactPhone?: string | null;
};
export type Opportunity = {
  id: number; postId: number; ojtSemesterId?: number; title: string; description?: string | null;
  requirements?: string | null; location?: string | null; workMode?: string | null;
  remainingSlots: number; canApply: boolean; blockers: string[]; company: PartnerCompany;
  applicationWindowId?: number | null;
  post: { id?: number; windowId?: number; title: string; deadlineAt?: string | null; content?: string | null; benefits?: string | null; applicationInstructions?: string | null };
};
const blockers: Record<string, string> = {

  OJT_REGISTRATION_WINDOW_REQUIRED: 'Chưa có đợt OJT đang mở phù hợp với kỳ tuyển dụng này.',
  ELIGIBLE_HANDOFF_REQUIRED: 'Chưa có kết quả đủ điều kiện OJT.',
  CONFIRMED_ELIGIBILITY_REQUIRED: 'Chưa có kết quả đủ điều kiện OJT hiện hành. Liên hệ Phòng Đào tạo để kiểm tra.',
  ELIGIBILITY_CHECK_STALE: 'Kết quả xét điều kiện cần được cập nhật.',
  ELIGIBILITY_HANDOFF_STALE: 'Kết quả xét OJT đã cũ do dữ liệu học tập thay đổi; liên hệ Phòng Đào tạo để rà soát.',
  APPLICATION_ALREADY_IN_PROCESS: 'Bạn đang có một hồ sơ chờ doanh nghiệp xác nhận. Chỉ được nộp tiếp sau khi hồ sơ bị từ chối.',
  STUDENT_ALREADY_CONFIRMED: 'Bạn đã được xác nhận nơi thực tập trong kỳ nên không thể ứng tuyển mới, kể cả ở đợt bổ sung.',
  APPLICATION_ROUND_ALREADY_SUBMITTED: 'Bạn đã nộp hồ sơ tại vị trí này. Hãy chọn vị trí khác nếu còn hạn.',
  APPLICATION_POSITION_ALREADY_SUBMITTED: 'Bạn đã ứng tuyển vị trí này trong tin này. Hãy chọn vị trí khác, có thể trong cùng tin và cùng doanh nghiệp nếu còn hạn.',
  OJT_ALREADY_GRADED: 'Bạn đã có điểm OJT nên không thể nộp hồ sơ ứng tuyển mới.',
  OJT202_ALREADY_PASSED: 'Bạn đã pass OJT nên không thể đăng ký thực tập lại.',
  OJT_MINIMUM_SEMESTER_REQUIRED: 'Chỉ được đăng ký OJT từ kỳ chuyên ngành 6 trở lên.',
  ACTUAL_PATHWAY_REQUIRED: 'Chưa có lộ trình học phù hợp với kỳ OJT đã chọn.',
  OJT_PERIOD_REQUIRED: 'Kỳ OJT chưa được liên kết với học kỳ phù hợp.',
  RECRUITMENT_PHASE_CLOSED: 'Chưa đến hoặc đã hết hạn sinh viên nộp hồ sơ.',
  RECRUITMENT_WINDOW_CLOSED: 'Đợt tuyển dụng chưa mở hoặc đã chốt.',
  RECRUITMENT_PERIOD_UNAVAILABLE: 'Học kỳ tuyển dụng đã đóng hoặc không còn phù hợp.',
  WINDOW_NOT_OPEN: 'Đợt đăng ký chưa mở hoặc đã đóng.',
  WINDOW_NOT_STARTED: 'Chưa đến thời gian sinh viên nộp hồ sơ.',
  WINDOW_EXPIRED: 'Đã hết hạn sinh viên nộp hồ sơ.',
  REGISTRATION_ALREADY_EXISTS: 'Bạn đã có một hồ sơ đang chờ doanh nghiệp xác nhận hoặc đã được nhận.',
  REGISTRATION_WINDOW_REQUIRED: 'Chưa chọn được đợt đăng ký phù hợp.',
  POSITION_FULL: 'Vị trí đã đủ chỉ tiêu.',
  OJT_REGISTRATION_WINDOW_UNAVAILABLE: 'Đợt đăng ký chưa mở hoặc đã hết hạn.',
  REGISTRATION_OUT_OF_SCOPE: 'Bạn không thuộc phạm vi của đợt đăng ký này.',
  ASSIGNMENT_EXISTS: 'Bạn đã có phân công thực tập trong đợt này.',
  REGISTRATION_PROGRAM_CHANGED: 'Chương trình đào tạo đã thay đổi; cần được rà soát.',
};
export const explainOjtBlockers = (values: string[]) => [...new Set(values)].map((value) => blockers[value] || 'Hồ sơ chưa đáp ứng điều kiện của đợt đăng ký.').join(' ');
export const ojtError = (error: unknown) => friendlyErrorMessage(error, 'Không thể hoàn tất yêu cầu. Vui lòng thử lại.');
export const workModeText = (value?: string | null) => ({ ONSITE: 'Tại văn phòng', REMOTE: 'Từ xa', HYBRID: 'Kết hợp' })[value ?? ''] || value || 'Chưa cập nhật';
