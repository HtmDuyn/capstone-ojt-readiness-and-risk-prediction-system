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
      console.error('Unauthorized, please login again.');
      // Xóa token hoặc chuyển hướng về trang login nếu cần
      // localStorage.removeItem('token');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;
