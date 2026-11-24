type ErrorShape = {
  message?: unknown;
  code?: unknown;
  response?: {
    status?: unknown;
    data?: { message?: unknown; error?: unknown; detail?: unknown };
  };
};

const technicalMessage = /\b(api|backend|http(?:s)?|json|endpoint|sql|database|stack trace|internal server error|exception|proxy|axios|econn[a-z]*|err_[a-z_]+|failed to fetch|network error|request failed|cannot read properties|undefined|null)\b/i;

function messageOf(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (value instanceof Error) return value.message.trim();
  return '';
}

/** Return a clear message for the interface without exposing transport or implementation details. */
export function friendlyErrorMessage(error: unknown, fallback = 'Chưa thể hoàn thành yêu cầu. Vui lòng thử lại.'): string {
  const shape = (typeof error === 'object' && error !== null ? error : {}) as ErrorShape;
  const status = typeof shape.response?.status === 'number' ? shape.response.status : undefined;
  const payload = shape.response?.data;
  const rawMessage = messageOf(payload?.message) || messageOf(payload?.error) || messageOf(payload?.detail) || messageOf(shape.message) || messageOf(error);

  if (status === 401) return 'Thông tin đăng nhập hoặc phiên làm việc không hợp lệ. Vui lòng kiểm tra lại hoặc đăng nhập lại.';
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
  if (status === 404) return 'Không tìm thấy dữ liệu cần thiết. Vui lòng tải lại trang.';
  if (status === 408 || status === 504 || shape.code === 'ECONNABORTED' || shape.code === 'ETIMEDOUT') {
    return 'Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại sau.';
  }
  if (status === 429) return 'Có quá nhiều yêu cầu trong thời gian ngắn. Vui lòng đợi một chút rồi thử lại.';
  if (status !== undefined && status >= 500) return 'Hệ thống đang gặp sự cố tạm thời. Vui lòng thử lại sau.';
  if (!shape.response && /network error|failed to fetch|econn|enotfound|connection/i.test(rawMessage)) {
    return 'Không thể kết nối lúc này. Vui lòng kiểm tra mạng và thử lại.';
  }

  if (!rawMessage || technicalMessage.test(rawMessage) || (!/[À-ỹ]/i.test(rawMessage) && /[A-Za-z]/.test(rawMessage))) return fallback;
  return rawMessage;
}
