import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import LeftPanel from "@/components/auth/LeftPanel";
import RightPanel from "@/components/auth/RightPanel";
import type { UserRole } from "@/types/auth.types";
import { useAuth } from "@/hooks/useAuth";
import { useRoleRedirect } from "@/hooks/useRoleRedirect";
import { apiRequest } from "@/services/api";

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
  const location = useLocation();
  const [authError, setAuthError] = useState('');
  const [temporaryToken, setTemporaryToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
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

  const finishLogin = async (token: string) => {
    const { user } = await apiRequest<{ user: { id: number; fullName: string; email: string; roleCode: string } }>('/auth/me', {}, token);
    const roles: Record<string, UserRole> = { ADMIN: 'admin', STUDENT: 'student', ACADEMIC: 'education', OJT_COORD: 'qhdn', ENTERPRISE: 'enterprise' };
    const role = roles[user.roleCode];
    if (!role) throw new Error('Vai trò tài khoản chưa được hỗ trợ: ' + user.roleCode);
    login(token, { id: String(user.id), name: user.fullName, email: user.email, role });
    redirectToDashboard(role);
  };
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setAuthError('');
    if (authMode === 'register') { setAuthError('Tài khoản được cấp bởi quản trị viên hoặc qua import. Vui lòng liên hệ bộ phận phụ trách.'); return; }
    setIsLoading(true);
    try {
      const result = await apiRequest<{ token: string; mustChangePassword: boolean }>('/auth/login', { method: 'POST', body: JSON.stringify({ email: account.trim(), password }) }, null);
      if (result.mustChangePassword) { setTemporaryToken(result.token); return; }
      await finishLogin(result.token);
    } catch (error) { setAuthError(error instanceof Error ? error.message : 'Đăng nhập thất bại.'); }
    finally { setIsLoading(false); }
  };
  const changeTemporaryPassword = async (event: React.FormEvent) => {
    event.preventDefault(); if (!temporaryToken || isLoading) return; setAuthError('');
    if (newPassword !== confirmation) { setAuthError('Mật khẩu xác nhận không khớp.'); return; }
    setIsLoading(true);
    try {
      await apiRequest('/auth/change-password', {method:'POST',body:JSON.stringify({currentPassword:password,newPassword})},temporaryToken);
      setTemporaryToken(null); setPassword(''); setNewPassword(''); setConfirmation('');
      setAuthError('Đổi mật khẩu thành công. Vui lòng đăng nhập lại bằng mật khẩu mới.');
    } catch (error) { setAuthError(error instanceof Error ? error.message : 'Đổi mật khẩu thất bại.'); }
    finally { setIsLoading(false); }
  };

  const handleSocialLogin = async (_provider: 'google' | 'microsoft') => {
    setAuthError('Đăng nhập mạng xã hội chưa được kết nối. Vui lòng dùng email và mật khẩu hệ thống.');
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

      {(authError || location.state?.message) && !temporaryToken && <div role="alert" className="fixed left-1/2 top-5 z-50 w-[90%] max-w-xl -translate-x-1/2 rounded-xl bg-white p-4 text-sm text-slate-800 shadow-xl">{authError || location.state?.message}</div>}
      {temporaryToken && <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 p-4"><form onSubmit={changeTemporaryPassword} role="dialog" aria-modal="true" aria-label="Đổi mật khẩu tạm thời" className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6"><h2 className="text-xl font-bold">Đổi mật khẩu tạm thời</h2><p className="text-sm text-slate-600">Bạn cần đổi mật khẩu trước khi sử dụng hệ thống.</p>{authError && <p role="alert" className="text-sm text-red-600">{authError}</p>}<label className="block text-sm">Mật khẩu mới<input autoFocus required minLength={8} type="password" autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mt-2 w-full rounded-xl border p-3" /></label><label className="block text-sm">Xác nhận mật khẩu<input required minLength={8} type="password" autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} className="mt-2 w-full rounded-xl border p-3" /></label><div className="flex gap-3"><button disabled={isLoading} className="rounded-xl bg-orange-500 px-4 py-2 text-white disabled:opacity-50">Đổi mật khẩu</button><button type="button" disabled={isLoading} onClick={() => {setTemporaryToken(null);setNewPassword('');setConfirmation('');setAuthError('');}} className="rounded-xl border px-4 py-2">Hủy</button></div></form></div>}
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
