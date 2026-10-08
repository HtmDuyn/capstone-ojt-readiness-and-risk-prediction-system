import API from './api';

// Đây là ví dụ về cách dùng API (axios instance) đã tạo để gọi backend

export const authService = {
  // Ví dụ đăng nhập
  login: async (credentials: { username?: string; password?: string; email?: string }) => {
    const response = await API.post('/auth/login', credentials);
    // Nếu có token, bạn có thể lưu ở đây hoặc ở component
    // if (response.data.token) {
    //   localStorage.setItem('token', response.data.token);
    // }
    return response.data;
  },

  // Ví dụ lấy thông tin profile (cần token)
  getProfile: async () => {
    const response = await API.get('/auth/me');
    return response.data;
  },
};
