import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const baseURL =
  import.meta.env.VITE_API_URL ||
  'https://capstone-ojt-readiness-and-risk.onrender.com/api';

const API = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Chạy trước khi gửi request (ví dụ: đính kèm token)
API.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('ojt_auth_token');
    if (
      config.url !== '/auth/login' &&
      token &&
      config.headers &&
      !config.headers.Authorization
    ) {
      config.headers.Authorization = `Bearer ${token}`;
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
    return response;
  },
  (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      const data = error.response.data as { message?: string; errorCode?: string } | undefined;
      console.warn('[API 401 Unauthorized]', data?.errorCode, data?.message || error.message);
      
      // Nếu token không hợp lệ hoặc đã hết hạn, xóa token lỗi khỏi storage
      if (data?.errorCode === 'INVALID_TOKEN' || data?.errorCode === 'TOKEN_EXPIRED') {
        localStorage.removeItem('ojt_auth_token');
        localStorage.removeItem('ojt_auth_user');
      }
    }
    return Promise.reject(error);
  }
);

export default API;
