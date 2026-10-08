import API from './api';

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
}

export interface CurrentUserResponse {
  success: boolean;
  message: string;
  user: {
    id: number;
    username: string;
    email: string;
    fullName: string;
    status: string;
    roleCode: string | null;
    roleName: string | null;
  };
}

export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    const response = await API.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  // Ví dụ lấy thông tin profile (cần token)
  getProfile: async () => {
    const response = await API.get('/auth/me');
    return response.data;
  },
};
