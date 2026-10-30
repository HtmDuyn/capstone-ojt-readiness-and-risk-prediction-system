import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

export { API_BASE_URL };

// Keep the student's transport independent of the shared API and legacy Axios
// declarations used by the other roles. Axios normalizes headers at runtime.
type HeaderValue = string | number | boolean | null | undefined;
interface StudentHeaders {
  has(name: string): boolean;
  set(name: string, value: HeaderValue): void;
  delete(name: string): void;
}
interface StudentRequestConfig {
  method?: string;
  data?: unknown;
  params?: Record<string, unknown>;
  headers?: Record<string, HeaderValue>;
  signal?: AbortSignal;
  timeout?: number;
}
interface ErrorBody { success?: boolean; message?: string; errorCode?: string; code?: string }
interface HttpError { code?: string; response?: { status: number; data?: ErrorBody } }

export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly code?: string) {
    super(message); this.name = 'ApiError';
  }
}

export const API = axios.create({
  baseURL: API_BASE_URL,
  adapter: 'xhr',
  timeout: 60_000,
  headers: { Accept: 'application/json' },
});

API.interceptors.request.use(config => {
  const headers = config.headers as unknown as StudentHeaders;
  const token = localStorage.getItem('ojt_auth_token');
  if (config.url !== '/auth/login' && token && !headers.has('Authorization')) headers.set('Authorization', 'Bearer ' + token);
  if (config.data instanceof FormData) headers.delete('Content-Type');
  return config;
});

export function isRequestCanceled(error: unknown): boolean {
  return axios.isCancel(error) || (error instanceof DOMException && error.name === 'AbortError');
}

export async function apiRequest<T>(path: string, options: StudentRequestConfig = {}, token?: string | null): Promise<T> {
  const headers = { ...options.headers };
  if (token !== undefined) headers.Authorization = token ? 'Bearer ' + token : false;
  try {
    const response = await API.request({ ...options, url: path, headers, responseType: 'json' }) as { data: T; status: number };
    const body = response.data;
    if (!body || typeof body !== 'object') throw new ApiError('API không trả JSON. Kiểm tra cấu hình địa chỉ backend.', response.status, 'INVALID_API_RESPONSE');
    const result = body as ErrorBody;
    if (result.success === false) throw new ApiError(result.message || 'Yêu cầu API thất bại.', response.status, result.errorCode ?? result.code);
    return body;
  } catch (error) {
    if (isRequestCanceled(error) || error instanceof ApiError) throw error;
    if (!axios.isAxiosError(error)) throw error;
    const failure = error as HttpError;
    if (!failure.response) throw new ApiError(
      ['ECONNABORTED', 'ETIMEDOUT'].includes(failure.code ?? '') ? 'Yêu cầu API hết thời gian chờ. Vui lòng thử lại.' : 'Không kết nối được backend. Kiểm tra máy chủ API và VITE_API_URL.',
      0, failure.code,
    );
    const { status, data } = failure.response;
    throw new ApiError(data?.message || `Yêu cầu API thất bại (HTTP ${status}).`, status, data?.errorCode ?? data?.code);
  }
}

export default API;
