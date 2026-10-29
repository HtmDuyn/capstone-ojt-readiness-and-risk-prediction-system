import axios, { AxiosHeaders, type AxiosRequestConfig, type RawAxiosHeaders } from 'axios';
import { API_BASE_URL } from '../config/api';

export { API_BASE_URL };

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Every browser API call shares authentication, timeout and the XHR transport.
export const API = axios.create({
  baseURL: API_BASE_URL,
  adapter: 'xhr',
  timeout: 60_000,
  headers: { Accept: 'application/json' },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('ojt_auth_token');
  if (config.url !== '/auth/login' && token && !config.headers.has('Authorization')) {
    config.headers.set('Authorization', 'Bearer ' + token);
  }
  // Let the browser add the multipart boundary; Axios sets JSON for object data.
  if (config.data instanceof FormData) config.headers.delete('Content-Type');
  return config;
});

interface ErrorBody {
  success?: boolean;
  message?: string;
  errorCode?: string;
  code?: string;
}

export function isRequestCanceled(error: unknown): boolean {
  return axios.isCancel(error)
    || (error instanceof DOMException && error.name === 'AbortError');
}

// Return the backend envelope unchanged; services choose user/account/data.
export async function apiRequest<T>(
  path: string,
  options: AxiosRequestConfig = {},
  token?: string | null,
): Promise<T> {
  const headers = AxiosHeaders.from(options.headers as RawAxiosHeaders | AxiosHeaders | undefined);
  if (token !== undefined) headers.set('Authorization', token ? 'Bearer ' + token : false);
  try {
    const response = await API.request<T>({ ...options, url: path, headers, responseType: 'json' });
    const body = response.data;
    if (!body || typeof body !== 'object') {
      throw new ApiError('API không trả JSON. Kiểm tra cấu hình địa chỉ backend.', response.status, 'INVALID_API_RESPONSE');
    }
    const result = body as ErrorBody;
    if (result.success === false) {
      throw new ApiError(result.message || 'Yêu cầu API thất bại.', response.status, result.errorCode ?? result.code);
    }
    return body;
  } catch (error) {
    // Route changes and effect cleanup are cancellation, not backend failures.
    if (isRequestCanceled(error) || error instanceof ApiError) throw error;
    if (!axios.isAxiosError<ErrorBody>(error)) throw error;
    if (!error.response) {
      throw new ApiError(
        error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
          ? 'Yêu cầu API hết thời gian chờ. Vui lòng thử lại.'
          : 'Không kết nối được backend. Kiểm tra máy chủ API và VITE_API_URL.',
        0,
        error.code,
      );
    }
    const { status, data } = error.response;
    const code = data?.errorCode ?? data?.code;
    throw new ApiError(
      (typeof data?.message === 'string' && data.message)
        || ([502, 503, 504].includes(status)
          ? `Máy chủ hoặc proxy API không khả dụng (HTTP ${status}). Kiểm tra backend tại ${API_BASE_URL}.`
          : `Yêu cầu API thất bại (HTTP ${status}).`),
      status,
      code,
    );
  }
}

export default API;
