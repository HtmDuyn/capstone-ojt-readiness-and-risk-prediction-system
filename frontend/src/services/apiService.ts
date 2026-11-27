import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { clearSharedReads } from '../utils/shared/sharedRead';
import { expireBearerSession, expireSession } from '../utils/shared/authSession';
import { friendlyErrorMessage } from '../utils/shared/friendlyError';

// Tất cả vai trò dùng chung backend; môi trường local đi qua proxy của Vite.
export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? '/api' : 'https://capstone-ojt.onrender.com/api')
).replace(/\/+$/, '');

// Aliases used by the education services.
export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, "");
export const API_URL = API_BASE_URL;

/** Format a request failure for display without exposing transport details. */
export function describeApiError(error: unknown, fallback: string): string {
  return friendlyErrorMessage(error, fallback);
}

// Axios instance dùng chung cho toàn bộ service để đồng nhất baseURL và token.
export const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: không cache response GET và tự gắn bearer token khi cần.
API.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (['get', 'head'].includes(config.method?.toLowerCase() ?? 'get')) {
      config.headers.set('Cache-Control', 'no-cache');
      config.headers.set('Pragma', 'no-cache');
    }
    
    const token = localStorage.getItem('ojt_auth_token');
    if (
      !['/auth/login', '/auth/forgot-password', '/auth/reset-password'].includes(config.url ?? '') &&
      token &&
      !config.headers.get('Authorization')
    ) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// Response interceptor: dọn cache sau mutation và hết phiên khi nhận 401.
API.interceptors.response.use(
  (response: AxiosResponse) => {
    if (!['get', 'head'].includes(response.config.method?.toLowerCase() ?? 'get')) {
      clearSharedReads();
    }
    return response;
  },
  (error: AxiosError) => {
    const incorrectCurrentPassword = error.config?.url === '/auth/change-password'
      && (error.response?.data as { errorCode?: string } | undefined)?.errorCode === 'INVALID_CREDENTIALS';
    if (error.response?.status === 401 && !incorrectCurrentPassword) {
      const authorization = error.config?.headers?.get?.('Authorization')
        ?? error.config?.headers?.Authorization;
      expireBearerSession(authorization);
    }
    error.message = friendlyErrorMessage(error, 'Yêu cầu chưa thể hoàn thành. Vui lòng thử lại.');
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
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers, cache: 'no-store' });
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new Error('Không thể kết nối lúc này. Vui lòng kiểm tra mạng và thử lại.');
  }

  const body = await response.json().catch(() => null);
  if (response.status === 401) expireSession(token);
  if ([502, 503, 504].includes(response.status)) {
    throw new Error('Hệ thống đang gặp sự cố tạm thời. Vui lòng thử lại sau.');
  }
  if (!response.ok || body?.success === false) {
    throw new Error(friendlyErrorMessage({ response: { status: response.status, data: body } }, 'Chưa thể hoàn thành yêu cầu. Vui lòng thử lại.'));
  }
  if (!body) {
    throw new Error('Chưa thể xử lý phản hồi lúc này. Vui lòng thử lại sau.');
  }
  if (!['GET', 'HEAD'].includes((options.method ?? 'GET').toUpperCase())) clearSharedReads();
  return body as T;
}

export default API;

export interface AccountNotification {
  id: number;
  title: string;
  content: string | null;
  isRead: boolean;
  sentAt: string | null;
}

export interface AccountNotificationPage {
  items: AccountNotification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
}

export async function getAccountNotifications(page = 1, signal?: AbortSignal): Promise<AccountNotificationPage> {
  const response = await API.get('/accounts/me/notifications', { params: { page, limit: 20 }, signal });
  return response.data.data;
}

export async function markAccountNotificationRead(id: number): Promise<void> {
  await API.patch(`/accounts/me/notifications/${id}`, { isRead: true });
}
