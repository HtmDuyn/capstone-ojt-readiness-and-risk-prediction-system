import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../config/api';
import { clearEducationReadCache } from './educationReadCache';
import { expireBearerSession, expireSession } from './authSession';

export { API_BASE_URL };

export const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Chạy trước khi gửi request (ví dụ: đính kèm token)
API.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if(['get','head'].includes(config.method?.toLowerCase()??'get')){
      config.headers.set('Cache-Control', 'no-cache');
      config.headers.set('Pragma', 'no-cache');
    }
    const token = localStorage.getItem('ojt_auth_token');
    if (
      config.url !== '/auth/login' &&
      token &&
      config.headers &&
      !config.headers.get('Authorization')
    ) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Chạy khi nhận được response (ví dụ: xử lý lỗi 401 chung)
API.interceptors.response.use(
  (response: AxiosResponse) => {
    if (!['get', 'head'].includes(response.config.method?.toLowerCase() ?? 'get')) {
      clearEducationReadCache();
    }
    return response;
  },
  (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      expireBearerSession(error.config?.headers?.Authorization);
    }
    return Promise.reject(error);
  }
);

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token = localStorage.getItem('ojt_auth_token')
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', 'Bearer ' + token);
  let response: Response;
  try {
    response = await fetch(API_BASE_URL + path, { ...options, headers, cache:'no-store' });
  } catch {
    throw new Error('Không kết nối được backend. Kiểm tra máy chủ API và VITE_API_URL.');
  }
  const body = await response.json().catch(() => null);
  if (response.status === 401) expireSession(token);
  if ([502, 503, 504].includes(response.status)) {
    throw new Error('Máy chủ hoặc proxy API không khả dụng (HTTP ' + response.status + '). Kiểm tra backend tại ' + API_BASE_URL + '.');
  }
  if (!response.ok || body?.success === false) {
    throw new Error(body?.message || 'Yêu cầu API thất bại (HTTP ' + response.status + ').');
  }
  if (!body) {
    throw new Error('API không trả JSON. Kiểm tra cấu hình địa chỉ backend.');
  }
  return body as T;
}

export default API;
