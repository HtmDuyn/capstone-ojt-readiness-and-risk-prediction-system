import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type {
  UserRole,
  AuthUser,
  AuthContextValue,
} from "../types/auth.types";

export type { UserRole, AuthUser, AuthContextValue };

// ─── Context (Ngữ cảnh) ───────────────────────────────────────────────────────

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

// ─── Khóa lưu trữ (Storage Keys) ───────────────────────────────────────────────

const TOKEN_KEY = "ojt_auth_token";
const USER_KEY = "ojt_auth_user";

// ─── Provider (Nhà cung cấp) ───────────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Khôi phục trạng thái xác thực từ localStorage khi khởi chạy
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser) as AuthUser);
      }
    } catch {
      // Dữ liệu lưu trữ bị lỗi — xóa nó
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Được gọi sau khi nhận phản hồi đăng nhập thành công từ API. */
  const login = useCallback((newToken: string, newUser: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  /** Xóa tất cả trạng thái xác thực và dữ liệu đã lưu. */
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  /** Cho phép cập nhật các trường hồ sơ mà không cần đăng nhập lại. */
  const updateUser = useCallback((partial: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const value: AuthContextValue = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
