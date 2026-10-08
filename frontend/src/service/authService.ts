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
   getCurrentUser: async (token: string) => {
    const response = await API.get<CurrentUserResponse>('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};