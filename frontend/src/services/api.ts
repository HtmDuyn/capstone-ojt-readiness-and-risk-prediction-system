const baseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

export async function apiRequest<T>(path: string, options: RequestInit = {}, token = localStorage.getItem('ojt_auth_token')): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', 'Bearer ' + token);
  let response: Response;
  try { response = await fetch(baseUrl + path, { ...options, headers }); }
  catch { throw new Error('Không kết nối được backend. Kiểm tra máy chủ API và VITE_API_BASE_URL.'); }
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.success === false) throw new Error(body?.message || 'Yêu cầu API thất bại (HTTP ' + response.status + ').');
  if (!body) throw new Error('API không trả JSON. Kiểm tra cấu hình địa chỉ backend.');
  return body as T;
}
