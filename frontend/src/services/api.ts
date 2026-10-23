import { API_BASE_URL } from '../config/api';

export async function apiRequest<T>(path: string, options: RequestInit = {}, token = localStorage.getItem('ojt_auth_token')): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', 'Bearer ' + token);
  let response: Response;
  try { response = await fetch(API_BASE_URL + path, { ...options, headers }); }
  catch { throw new Error('Không kết nối được backend. Kiểm tra máy chủ API và VITE_API_URL.'); }
  const body = await response.json().catch(() => null);
  if ([502, 503, 504].includes(response.status)) throw new Error('Máy chủ hoặc proxy API không khả dụng (HTTP ' + response.status + '). Kiểm tra backend tại ' + API_BASE_URL + '.');
  if (!response.ok || body?.success === false) throw new Error(body?.message || 'Yêu cầu API thất bại (HTTP ' + response.status + ').');
  if (!body) throw new Error('API không trả JSON. Kiểm tra cấu hình địa chỉ backend.');
  return body as T;
}
