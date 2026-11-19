import API from "./api";

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user?: CurrentUserResponse["user"];
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
  sendPasswordResetCode: async (email: string) => {
    const { data } = await API.post<{ message: string }>("/auth/forgot-password", { email });
    return data;
  },
  resetPassword: async (email: string, code: string, newPassword: string) => {
    const { data } = await API.post<{ message: string }>("/auth/reset-password", { email, code, newPassword });
    return data;
  },
  logout: async (token: string) => {
    const response = await API.post<{ success: boolean; message: string }>("/auth/logout", undefined, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000,
    });
    return response.data;
  },
  login: async (credentials: { email: string; password: string }) => {
    const response = await API.post<LoginResponse>("/auth/login", credentials);
    return response.data;
  },
  getCurrentUser: async (token: string) => {
    const response = await API.get<CurrentUserResponse>("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};
