import { API_BASE_URL } from '../config/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token = localStorage.getItem('ojt_auth_token'),
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData))
    headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', 'Bearer ' + token);
  let response: Response;
  try {
    response = await fetch(API_BASE_URL + path, { ...options, headers });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new Error(
      'Không kết nối được backend. Kiểm tra máy chủ API và VITE_API_URL.',
    );
  }
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.success === false)
    throw new ApiError(
      body?.message || 'Yêu cầu API thất bại (HTTP ' + response.status + ').',
      response.status,
      body?.errorCode,
    );
  if (!body)
    throw new Error('API không trả JSON. Kiểm tra cấu hình địa chỉ backend.');
  return body as T;
}
