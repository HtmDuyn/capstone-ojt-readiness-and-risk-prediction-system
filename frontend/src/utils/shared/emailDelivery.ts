export interface EmailDeliveryResult {
  status: 'SENT' | 'PENDING' | 'PARTIAL' | 'FAILED' | 'UNKNOWN';
  total: number;
  sent: number;
  pending: number;
  failed: number;
  cancelled: number;
}

export function emailDeliveryMessage(result?: EmailDeliveryResult): string {
  if (!result || result.status === 'UNKNOWN' || !result.total)
    return 'Chưa xác nhận được kết quả gửi email. Vui lòng kiểm tra trạng thái gửi.';
  if (result.status === 'SENT')
    return result.total === 1
      ? 'Đã gửi email thông tin đăng nhập. Vui lòng kiểm tra Hộp thư đến hoặc Thư rác.'
      : `Đã gửi ${result.sent} email thông tin đăng nhập. Vui lòng kiểm tra Hộp thư đến hoặc Thư rác.`;
  if (result.status === 'PARTIAL')
    return `Đã gửi ${result.sent}/${result.total} email thông tin đăng nhập. Vui lòng kiểm tra trạng thái các email còn lại.`;
  if (result.status === 'FAILED')
    return 'Email chưa gửi thành công. Vui lòng liên hệ quản trị viên để kiểm tra và gửi lại.';
  return 'Email chưa gửi thành công. Hệ thống sẽ thử lại; vui lòng kiểm tra cấu hình gửi email nếu tình trạng kéo dài.';
}
