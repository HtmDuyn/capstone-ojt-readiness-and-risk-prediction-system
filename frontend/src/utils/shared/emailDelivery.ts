export interface EmailDeliveryResult {
  status: 'SENT' | 'PENDING' | 'PARTIAL' | 'FAILED' | 'UNKNOWN';
  total: number;
  sent: number;
  pending: number;
  failed: number;
  cancelled: number;
  issue?: 'AUTH' | 'SENDER' | 'RATE_LIMIT' | 'CONFIGURATION';
}

export function emailDeliveryMessage(result?: EmailDeliveryResult): string {
  if (!result || result.status === 'UNKNOWN' || !result.total)
    return 'Chưa xác nhận được kết quả gửi email. Vui lòng kiểm tra trạng thái gửi.';
  if (result.status === 'SENT')
    return result.total === 1
      ? 'Đã gửi email thông tin đăng nhập. Vui lòng kiểm tra Hộp thư đến hoặc Thư rác.'
      : `Đã gửi ${result.sent} email thông tin đăng nhập. Vui lòng kiểm tra Hộp thư đến hoặc Thư rác.`;
  if (result.status === 'PARTIAL')
    return `Đã gửi ${result.sent}/${result.total} email thông tin đăng nhập. ${deliveryIssue(result.issue) ?? 'Vui lòng kiểm tra trạng thái các email còn lại.'}`;
  const issue = deliveryIssue(result.issue);
  if (issue) return issue;
  if (result.status === 'FAILED')
    return 'Email chưa gửi thành công. Vui lòng liên hệ quản trị viên để kiểm tra và gửi lại.';
  return 'Email chưa gửi thành công. Hệ thống sẽ thử lại; vui lòng kiểm tra cấu hình gửi email nếu tình trạng kéo dài.';
}

function deliveryIssue(issue: EmailDeliveryResult['issue']): string | undefined {
  if (issue === 'AUTH') return 'Gửi email bị từ chối xác thực. Quản trị viên cần kiểm tra cấu hình nhà cung cấp email.';
  if (issue === 'SENDER') return 'Nhà cung cấp chưa cho phép gửi từ địa chỉ đã cấu hình. Quản trị viên cần kiểm tra địa chỉ gửi.';
  if (issue === 'RATE_LIMIT') return 'Đã chạm giới hạn gửi email. Hệ thống sẽ thử lại.';
  if (issue === 'CONFIGURATION') return 'Chưa cấu hình dịch vụ gửi email. Quản trị viên cần kiểm tra backend.';
}
