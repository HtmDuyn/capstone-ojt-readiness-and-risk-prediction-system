import { frontendLoginUrl } from '../config/frontend';
import type { RoleCode } from '../modules/auth/auth.types';

export type EmailContent = { subject: string; text: string; html?: string };
export const accountRoleLabels: Record<RoleCode, string> = {
  STUDENT: 'Sinh viên', ENTERPRISE: 'Doanh nghiệp', ADMIN: 'Quản trị viên',
  ACADEMIC: 'Phòng Đào tạo', OJT_COORD: 'Phòng Quan hệ doanh nghiệp',
};

export function formatEmailDateTime(value: Date): string {
  const parts = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === type)!.value;
  return `${part('day')}/${part('month')}/${part('year')}, ${part('hour')}:${part('minute')} (giờ Việt Nam, UTC+7)`;
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]!);

export function accountEmail(input: {
  fullName: string; email: string; username: string; roleCode: RoleCode;
  code?: string; companyName?: string; temporary?: { password: string; expiresAt: Date };
  purpose?: 'WELCOME' | 'PASSWORD_RESET';
}): EmailContent {
  const loginUrl = frontendLoginUrl();
  const role = accountRoleLabels[input.roleCode];
  const reset = input.purpose === 'PASSWORD_RESET';
  const title = reset ? 'Thông tin đặt lại mật khẩu' : 'Chào mừng bạn đến với Hệ thống OJT';
  const intro = reset
    ? 'Mật khẩu tài khoản của bạn đã được quản trị viên đặt lại. Vui lòng sử dụng thông tin dưới đây để đăng nhập và đổi mật khẩu mới.'
    : 'Tài khoản của bạn đã được tạo thành công trên Hệ thống Quản lý OJT. Dưới đây là thông tin tài khoản và hướng dẫn đăng nhập.';
  const details: [string, string][] = [
    ['Họ và tên', input.fullName], ['Vai trò', role],
    ...(input.companyName ? [['Tên doanh nghiệp', input.companyName] as [string, string]] : []),
    ...(input.code ? [[input.roleCode === 'ENTERPRISE' ? 'Mã doanh nghiệp' : 'Mã sinh viên', input.code] as [string, string]] : []),
    ['Email đăng nhập', input.email], ['Tên tài khoản', input.username],
    input.temporary ? ['Mật khẩu tạm', input.temporary.password] : ['Mật khẩu đăng nhập', 'Sử dụng mật khẩu do quản trị viên cung cấp.'],
  ];
  const deadline = input.temporary ? `Mật khẩu tạm hết hạn vào: ${formatEmailDateTime(input.temporary.expiresAt)}.` : '';
  const steps = [
    'Truy cập đường dẫn đăng nhập bên dưới.',
    `Nhập email đăng nhập và ${input.temporary ? 'mật khẩu tạm được cung cấp trong email này' : 'mật khẩu do quản trị viên cung cấp'}.`,
    input.temporary ? 'Thực hiện đổi mật khẩu ngay sau lần đăng nhập đầu tiên theo yêu cầu của hệ thống.' : 'Kiểm tra thông tin cá nhân và cập nhật mật khẩu trong mục tài khoản.',
  ];
  const notes = [
    ...(input.temporary ? ['Vui lòng đăng nhập trước thời điểm hết hạn. Nếu mật khẩu tạm đã hết hạn, hãy dùng chức năng Quên mật khẩu tại trang đăng nhập hoặc liên hệ quản trị viên.'] : []),
    'Giữ bí mật thông tin đăng nhập và không chia sẻ mật khẩu cho người khác.',
    'Nếu thông tin tài khoản chưa chính xác hoặc bạn cần hỗ trợ, vui lòng liên hệ bộ phận quản lý OJT hoặc quản trị viên của trường.',
  ];
  const text = [
    `Kính gửi ${input.fullName},`, intro,
    `THÔNG TIN TÀI KHOẢN\n${details.map(([label, value]) => `${label}: ${value}`).join('\n')}`,
    ...(deadline ? [deadline] : []),
    `Đăng nhập hệ thống: ${loginUrl}`,
    `HƯỚNG DẪN ĐĂNG NHẬP\n${steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}`,
    `LƯU Ý\n${notes.map(note => `- ${note}`).join('\n')}`,
    'Trân trọng,\nHệ thống Quản lý OJT',
    'Đây là email thông báo tự động từ hệ thống.',
  ].join('\n\n');
  const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f4f5f7;color:#1f2937;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px">
<tr><td style="padding:24px;background:#fff7ed;border-bottom:3px solid #f97316"><p style="margin:0;color:#c2410c;font-size:13px;font-weight:bold">HỆ THỐNG QUẢN LÝ OJT</p><h1 style="margin:8px 0 0;font-size:23px;line-height:1.4">${title}</h1></td></tr>
<tr><td style="padding:24px"><p style="margin-top:0">Kính gửi <strong>${escapeHtml(input.fullName)}</strong>,</p><p>${intro}</p>
<h2 style="font-size:17px">Thông tin tài khoản</h2>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e5e7eb;border-radius:8px">${details.map(([label, value]) => `<tr><td style="padding:10px 12px;border-bottom:1px solid #f1f5f9"><div style="font-size:12px;color:#64748b">${label}</div><div style="font-weight:bold;word-break:break-word;overflow-wrap:anywhere;${label === 'Mật khẩu tạm' ? 'font-family:monospace;font-size:16px;' : ''}">${escapeHtml(value)}</div></td></tr>`).join('')}</table>
${deadline ? `<p style="padding:12px;background:#fff7ed;border-left:3px solid #f97316"><strong>${escapeHtml(deadline)}</strong></p>` : ''}
<p style="margin:24px 0;text-align:center"><a href="${escapeHtml(loginUrl)}" style="display:inline-block;padding:12px 24px;background:#ea580c;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold">Đăng nhập hệ thống</a></p>
<p style="font-size:13px;color:#64748b">Bạn cũng có thể truy cập trực tiếp:<br><a href="${escapeHtml(loginUrl)}" style="color:#c2410c;word-break:break-all">${escapeHtml(loginUrl)}</a></p>
<h2 style="font-size:17px">Hướng dẫn đăng nhập</h2><ol style="padding-left:22px">${steps.map(step => `<li style="margin-bottom:8px">${step}</li>`).join('')}</ol>
<h2 style="font-size:17px">Lưu ý</h2><ul style="padding-left:22px">${notes.map(note => `<li style="margin-bottom:8px">${note}</li>`).join('')}</ul>
<p style="margin-bottom:0">Trân trọng,<br><strong>Hệ thống Quản lý OJT</strong></p></td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #e5e7eb;font-size:12px;color:#64748b">Đây là email thông báo tự động từ hệ thống.</td></tr>
</table></td></tr></table></body></html>`;
  return { subject: `[OJT] ${reset ? 'Đặt lại mật khẩu' : 'Thông tin tài khoản'} - ${role}`, text, html };
}
