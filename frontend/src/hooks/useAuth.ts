import { useContext } from "react";
import { AuthContext, type AuthContextValue } from "../contexts/AuthContext";

/**
 * Custom hook để truy cập ngữ cảnh xác thực (authentication context).
 * Phải được sử dụng bên trong <AuthProvider>.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return context;
}
