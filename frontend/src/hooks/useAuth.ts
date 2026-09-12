import { useContext } from "react";
import { AuthContext, type AuthContextValue } from "../contexts/AuthContext";

/**
 * Custom hook to access the authentication context.
 * Must be used inside <AuthProvider>.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return context;
}
