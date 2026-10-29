export type PartnerCompany = {
  id: number; name: string; code?: string; address?: string | null;
  industry?: string | null; contactPersonName?: string | null;
  contactEmail?: string | null; contactPhone?: string | null;
};
export type Opportunity = {
  id: number; postId: number; title: string; description?: string | null;
  requirements?: string | null; location?: string | null; workMode?: string | null;
  remainingSlots: number; canApply: boolean; blockers: string[]; company: PartnerCompany;
  post: { title: string; deadlineAt?: string | null; content?: string | null; benefits?: string | null; applicationInstructions?: string | null };
};
const blockers: Record<string, string> = {
  ELIGIBLE_HANDOFF_REQUIRED: 'Chờ Phòng Đào tạo bàn giao danh sách đủ điều kiện OJT.',
  CONFIRMED_ELIGIBILITY_REQUIRED: 'Chưa có kết quả đủ điều kiện OJT hiện hành. Liên hệ Phòng Đào tạo để kiểm tra.',
  ELIGIBILITY_CHECK_STALE: 'Kết quả xét điều kiện cần được cập nhật.',
  ELIGIBILITY_HANDOFF_STALE: 'Dữ liệu học tập đã thay đổi sau bàn giao; liên hệ Phòng Đào tạo để rà soát.',
  APPLICATION_ALREADY_IN_PROCESS: 'Bạn đã có đơn đang chờ xử lý hoặc đã được tiếp nhận trong đợt này.',
  POSITION_FULL: 'Vị trí đã đủ chỉ tiêu.',
  OJT_REGISTRATION_WINDOW_UNAVAILABLE: 'Đợt đăng ký chưa mở hoặc đã hết hạn.',
  REGISTRATION_OUT_OF_SCOPE: 'Bạn không thuộc phạm vi của đợt đăng ký này.',
  ASSIGNMENT_EXISTS: 'Bạn đã có phân công thực tập trong đợt này.',
  REGISTRATION_PROGRAM_CHANGED: 'Chương trình đào tạo đã thay đổi; cần được rà soát.',
};
export const explainOjtBlockers = (values: string[]) => [...new Set(values)].map((value) => blockers[value] || 'Hồ sơ chưa đáp ứng điều kiện của đợt đăng ký.').join(' ');
export const ojtError = (error: unknown) => error instanceof Error ? error.message : 'Không thể hoàn tất yêu cầu. Vui lòng thử lại.';
export const workModeText = (value?: string | null) => ({ ONSITE: 'Tại văn phòng', REMOTE: 'Từ xa', HYBRID: 'Kết hợp' })[value ?? ''] || value || 'Chưa cập nhật';
