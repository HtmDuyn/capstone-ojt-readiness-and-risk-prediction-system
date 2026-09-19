import React, { useState, useEffect, useRef } from "react";
import LeftPanel from "@/components/auth/LeftPanel";
import RightPanel from "@/components/auth/RightPanel";
import type { UserRole } from "@/types/auth.types";
import { useAuth } from "@/hooks/useAuth";
import { useRoleRedirect } from "@/hooks/useRoleRedirect";
import { mockStudentProfile } from "@/data/student/mockStudentData";

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { redirectToDashboard } = useRoleRedirect();

  const [selectedRole, setSelectedRole] = useState<UserRole>("student");
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
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

  const performMockLogin = (role: UserRole) => {
    const mockUser = {
      id: role === 'student' ? mockStudentProfile.studentCode : `${role.toUpperCase()}_001`,
      name: role === 'student' ? mockStudentProfile.fullName : `${role === 'admin' ? 'Quản trị viên' : role === 'education' ? 'Cán bộ Đào tạo' : role === 'qhdn' ? 'Cán bộ QHDN' : 'Đại diện Doanh nghiệp'}`,
      email: role === 'student' ? mockStudentProfile.email : `${role}@fpt.edu.vn`,
      role,
      avatar: mockStudentProfile.avatar,
    };
    login("mock_token_" + Date.now(), mockUser);
    redirectToDashboard(role);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setIsLoading(false);
    performMockLogin(selectedRole);
  };

  const handleSocialLogin = async (_provider: "google" | "microsoft") => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    setIsLoading(false);
    performMockLogin(selectedRole);
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
          authMode={authMode}
          onAuthModeChange={setAuthMode}
        />

        <RightPanel
          animateIn={animateIn}
          selectedRole={selectedRole}
          onSelectRole={setSelectedRole}
          account={account}
          onAccountChange={setAccount}
          password={password}
          onPasswordChange={setPassword}
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword((v) => !v)}
          rememberMe={rememberMe}
          onToggleRemember={() => setRememberMe((v) => !v)}
          isLoading={isLoading}
          onSubmit={handleLogin}
          onSocialLogin={handleSocialLogin}
          authMode={authMode}
          onAuthModeChange={setAuthMode}
        />
      </div>
    </div>
  );
};

export default LoginPage;
