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
export interface UpdateProfileRequest {
  fullName: string;
  phone: string;
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  user: {
    id: number;
    username: string;
    email: string;
    phone: string;
    fullName: string;
    status: string;
    roleId: number;
    roleCode: string;
    roleName: string;
    studentId: number | null;
    enterpriseId: number | null;
    mustChangePassword: boolean;
    createdAt: string;
    updatedAt: string;
    lastLoginAt: string | null;
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
  updateProfile: async (data: UpdateProfileRequest): Promise<UpdateProfileResponse> => {
    const response = await API.patch('/accounts/me/profile', data);
    return response.data as UpdateProfileResponse;
  },
};