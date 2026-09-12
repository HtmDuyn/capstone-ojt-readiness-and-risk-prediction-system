import React, { useState } from "react";
import type { Role } from "../../types/loginTypes";
import { roles } from "./loginData";

interface RightPanelProps {
  animateIn: boolean;
  selectedRole: Role;
  onSelectRole: (role: Role) => void;
  account: string;
  onAccountChange: (val: string) => void;
  password: string;
  onPasswordChange: (val: string) => void;
  showPassword: boolean;
  onTogglePassword: () => void;
  rememberMe: boolean;
  onToggleRemember: () => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onSocialLogin?: (provider: "google" | "microsoft") => void;
  authMode?: "login" | "register";
  onAuthModeChange?: (mode: "login" | "register") => void;
}

interface InputFieldProps {
  id?: string;
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  icon: React.ReactNode;
  rightElement?: React.ReactNode;
  autoComplete?: string;
  required?: boolean;
}

// Sub-component for input fields
const InputField: React.FC<InputFieldProps> = ({
  id,
  label,
  type,
  placeholder,
  value,
  onChange,
  icon,
  rightElement,
  autoComplete,
  required = false,
}) => (
  <div className="mb-3.5">
    <label htmlFor={id} className="block text-xs font-bold text-gray-700 mb-1 font-outfit">
      {label}
    </label>
    <div className="input-field relative flex items-center rounded-xl border border-gray-200 bg-white/90 shadow-2xs focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all duration-200">
      <span className="pl-3.5 pr-2 flex-shrink-0 text-gray-400 focus-within:text-orange-500 transition-colors">
        {icon}
      </span>
      <input
        id={id}
        type={type}
        required={required}
        className="flex-1 py-2.5 pr-3 text-xs lg:text-sm text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
      />
      {rightElement}
    </div>
  </div>
);

const RightPanel: React.FC<RightPanelProps> = ({
  animateIn,
  selectedRole,
  onSelectRole,
  account,
  onAccountChange,
  password,
  onPasswordChange,
  showPassword,
  onTogglePassword,
  rememberMe,
  onToggleRemember,
  isLoading,
  onSubmit,
  onSocialLogin,
  authMode = "login",
  onAuthModeChange,
}) => {
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const fadeStyle = (delay = 0) => ({
    opacity: animateIn ? 1 : 0,
    transform: animateIn ? "translateY(0)" : "translateY(16px)",
    transition: `all 0.6s ${delay}s cubic-bezier(0.22,1,0.36,1)`,
  });

  return (
    <div className="right-panel relative flex flex-col w-full lg:w-[55%] h-full bg-white/40 backdrop-blur-2xl p-6 lg:p-10 justify-between overflow-y-auto custom-scrollbar flex-1">
      {/* Top Header Row with Language switcher */}
      <div className="relative z-10 flex items-center justify-between pb-4">
        {/* Notch switch for Mobile */}
        <div className="flex items-center gap-1 bg-orange-50/80 p-1 rounded-full border border-orange-200/60 lg:hidden">
          <button
            type="button"
            onClick={() => onAuthModeChange?.("login")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              authMode === "login" ? "bg-orange-500 text-white shadow-2xs" : "text-gray-600"
            }`}
          >
            LOGIN
          </button>
          <button
            type="button"
            onClick={() => onAuthModeChange?.("register")}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              authMode === "register" ? "bg-orange-500 text-white shadow-2xs" : "text-gray-600"
            }`}
          >
            SIGN IN
          </button>
        </div>

        {/* Language selector */}
        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-xs font-medium text-gray-600 hover:border-orange-400 hover:text-orange-600 bg-white/90 shadow-2xs transition-all duration-300 ml-auto"
        >
          <svg className="w-3.5 h-3.5 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
          </svg>
          Tiếng Việt
          <svg className="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      {/* Main Form Content */}
      <div className="relative z-10 my-auto max-w-md mx-auto w-full py-2">
        {/* Geometric Diamond Emblem */}
        <div className="flex flex-col items-center justify-center mb-5" style={fadeStyle(0)}>
          <div className="relative w-14 h-14 mb-2 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-orange-500 to-amber-400 rounded-2xl rotate-45 opacity-90 shadow-lg shadow-orange-500/30 animate-pulse" />
            <div className="relative w-10 h-10 bg-white rounded-xl rotate-45 flex items-center justify-center shadow-inner">
              <div className="w-5 h-5 bg-gradient-to-br from-orange-600 to-amber-500 rounded-md -rotate-45" />
            </div>
          </div>
          <span className="text-sm font-extrabold tracking-widest text-orange-600 uppercase font-cinematic">
            {authMode === "login" ? "LOGIN" : "SIGN IN"}
          </span>
        </div>

        {/* Title */}
        <div className="text-center mb-6" style={fadeStyle(0.04)}>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-900 font-cinematic tracking-tight mb-1.5">
            {authMode === "login" ? "Đăng nhập hệ thống" : "Tạo tài khoản mới"}
          </h2>
          <p className="text-gray-500 text-xs lg:text-sm font-outfit">
            {authMode === "login"
              ? "Chào mừng bạn trở lại! Vui lòng đăng nhập để tiếp tục."
              : "Vui lòng nhập thông tin để đăng ký tài khoản OJT."}
          </p>
        </div>

        {/* Role selection */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5" style={fadeStyle(0.08)}>
          {roles.map((role) => {
            const isSelected = selectedRole === role.id;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => onSelectRole(role.id)}
                className={`role-card relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all duration-300 focus:outline-none ${
                  isSelected
                    ? "border-orange-500 bg-gradient-to-br from-orange-50 to-amber-100/80 shadow-2xs"
                    : "border-gray-200 bg-white/90 hover:border-gray-300"
                }`}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                    isSelected ? "bg-orange-500/15 text-orange-600" : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {role.icon}
                </div>
                <span
                  className={`text-[10.5px] font-bold text-center leading-snug line-clamp-2 h-[26px] flex items-center justify-center ${
                    isSelected ? "text-orange-700" : "text-gray-600"
                  }`}
                >
                  {role.label}
                </span>
                <div
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${
                    isSelected ? "border-orange-500 bg-white" : "border-gray-300 bg-white"
                  }`}
                >
                  {isSelected && (
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Form Container */}
        <form onSubmit={onSubmit} key={authMode} className="auth-form-enter" style={fadeStyle(0.12)}>
          {/* Full Name field if Register mode */}
          {authMode === "register" && (
            <InputField
              label="Họ và tên"
              type="text"
              placeholder="Nhập họ và tên đầy đủ"
              value={fullName}
              onChange={setFullName}
              required
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />
          )}

          {/* Account */}
          <InputField
            id="login-account"
            label="Tài khoản"
            type="text"
            placeholder="Nhập email hoặc mã sinh viên"
            value={account}
            onChange={onAccountChange}
            autoComplete="username"
            required
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
              </svg>
            }
          />

          {/* Password */}
          <InputField
            id="login-password"
            label="Mật khẩu"
            type={showPassword ? "text" : "password"}
            placeholder="Nhập mật khẩu"
            value={password}
            onChange={onPasswordChange}
            autoComplete={authMode === "login" ? "current-password" : "new-password"}
            required
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" />
              </svg>
            }
            rightElement={
              <button
                type="button"
                id="toggle-password"
                onClick={onTogglePassword}
                className="px-3 text-gray-400 hover:text-orange-500 transition-colors focus:outline-none"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" strokeLinecap="round" />
                    <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            }
          />

          {/* Confirm Password if Register mode */}
          {authMode === "register" && (
            <InputField
              label="Xác nhận mật khẩu"
              type="password"
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
              required
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" />
                </svg>
              }
            />
          )}

          {/* Remember & Forgot Password */}
          {authMode === "login" && (
            <div className="flex items-center justify-between mb-5">
              <label className="flex items-center gap-2 cursor-pointer group select-none">
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                    rememberMe ? "border-orange-500 bg-orange-500" : "border-gray-300 bg-white"
                  }`}
                  onClick={onToggleRemember}
                >
                  {rememberMe && (
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <path d="M5 12l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <input id="remember-me" type="checkbox" className="sr-only" checked={rememberMe} onChange={onToggleRemember} />
                <span className="text-xs text-gray-600 group-hover:text-gray-800 transition-colors font-outfit">
                  Ghi nhớ đăng nhập
                </span>
              </label>
              <a href="#" className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors font-outfit hover:underline">
                Quên mật khẩu?
              </a>
            </div>
          )}

          {/* Submit button */}
          <button
            id="login-submit"
            type="submit"
            disabled={isLoading}
            className="btn-login w-full py-3 rounded-full text-white font-bold text-sm tracking-wide focus:outline-none disabled:opacity-70 shadow-lg shadow-orange-500/25 mb-4"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{authMode === "login" ? "Đang đăng nhập..." : "Đang xử lý..."}</span>
              </div>
            ) : authMode === "login" ? (
              "Đăng nhập"
            ) : (
              "Đăng ký ngay"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4" style={{ opacity: animateIn ? 1 : 0, transition: "all 0.6s 0.2s ease" }}>
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 whitespace-nowrap font-outfit">Or Login with</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Social login buttons */}
        <div className="grid grid-cols-2 gap-3" style={{ opacity: animateIn ? 1 : 0, transition: "all 0.6s 0.25s ease" }}>
          <button
            id="google-login"
            type="button"
            onClick={() => onSocialLogin && onSocialLogin("google")}
            className="social-btn flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 bg-white/90 text-gray-700 font-semibold text-xs shadow-2xs hover:bg-white"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>
          <button
            id="microsoft-login"
            type="button"
            onClick={() => onSocialLogin && onSocialLogin("microsoft")}
            className="social-btn flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 bg-white/90 text-gray-700 font-semibold text-xs shadow-2xs hover:bg-white"
          >
            <svg className="w-4 h-4" viewBox="0 0 23 23">
              <path fill="#f25022" d="M1 1h10v10H1z" />
              <path fill="#00a4ef" d="M12 1h10v10H12z" />
              <path fill="#7fba00" d="M1 12h10v10H1z" />
              <path fill="#ffb900" d="M12 12h10v10H12z" />
            </svg>
            Microsoft
          </button>
        </div>
      </div>

      {/* Footer text */}
      <div className="relative z-10 pt-4 text-center text-[11px] text-gray-400 font-outfit">
        © 2026 FPT University — OJT Readiness & Risk Prediction System
      </div>
    </div>
  );
};

export default RightPanel;
