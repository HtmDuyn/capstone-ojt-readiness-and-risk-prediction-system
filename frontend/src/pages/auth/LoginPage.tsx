import React, { useState, useEffect, useRef } from "react";
import LeftPanel from "@/components/auth/LeftPanel";
import RightPanel from "@/components/auth/RightPanel";
import type { UserRole } from "@/types/auth.types";
import { useAuth } from "@/hooks/useAuth";
import { useRoleRedirect } from "@/hooks/useRoleRedirect";
import { authService } from "@/service/authService";

const roleByCode: Record<string, UserRole> = {
  ADMIN: "admin",
  ACADEMIC: "education",
  OJT_COORD: "qhdn",
  STUDENT: "student",
  ENTERPRISE: "enterprise",
};

const getApiErrorMessage = (error: unknown): string | undefined => {
  if (
    typeof error !== "object" ||
    error === null ||
    !("response" in error)
  ) {
    return undefined;
  }

  const response = error.response;
  if (
    typeof response !== "object" ||
    response === null ||
    !("data" in response)
  ) {
    return undefined;
  }

  const data = response.data;
  if (
    typeof data !== "object" ||
    data === null ||
    !("message" in data) ||
    typeof data.message !== "string"
  ) {
    return undefined;
  }

  return data.message;
};

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { redirectToDashboard } = useRoleRedirect();

  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setAnimateIn(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const loginResponse = await authService.login({
        email: account.trim(),
        password,
      });
      const profileResponse = await authService.getCurrentUser(loginResponse.token);
      const profile = profileResponse.user;
      const role = profile.roleCode
        ? roleByCode[profile.roleCode.toUpperCase()]
        : undefined;

      if (!role) {
        throw new Error("Vai trò tài khoản không được hỗ trợ.");
      }

      login(loginResponse.token, {
        id: String(profile.id),
        name: profile.fullName || profile.username,
        email: profile.email,
        role,
      });
      redirectToDashboard(role);
    } catch (error) {
      const apiErrorMessage = getApiErrorMessage(error);
      if (apiErrorMessage) {
        setErrorMessage(apiErrorMessage);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Không thể đăng nhập. Vui lòng thử lại.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 relative bg-slate-950 overflow-y-auto">
      {/* Fixed Fullscreen Wallpaper Background */}
      <div className="fixed inset-0 w-screen h-screen z-0 overflow-hidden pointer-events-none select-none">
        <img
          src="/login_bg.jpg"
          alt="Campus Background"
          className="w-full h-full object-cover object-center scale-105"
        />
        {/* Fullscreen darkening & translucent color mesh overlay */}
        <div className="absolute inset-0 bg-slate-950/25 backdrop-blur-[2px]" />
        <div className="absolute top-[-10%] left-[-5%] w-[50vw] h-[50vw] rounded-full bg-orange-500/15 blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50vw] h-[50vw] rounded-full bg-amber-500/15 blur-[140px]" />
      </div>

      {/* Main Glassmorphic Container */}
      <div className="relative w-full max-w-5xl rounded-[28px] sm:rounded-[36px] overflow-hidden glass-card flex flex-col lg:flex-row shadow-2xl border border-white/50 z-10 transition-all duration-500 my-auto bg-white/35 backdrop-blur-2xl">
        <LeftPanel
          statsRef={statsRef}
          statsVisible={statsVisible}
        />

        <RightPanel
          animateIn={animateIn}
          account={account}
          onAccountChange={setAccount}
          password={password}
          onPasswordChange={setPassword}
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword((v) => !v)}
          isLoading={isLoading}
          errorMessage={errorMessage}
          onSubmit={handleLogin}
        />
      </div>
    </div>
  );
};

export default LoginPage;
