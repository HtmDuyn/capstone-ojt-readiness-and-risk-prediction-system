import React, { useEffect, useState } from "react";
import { ChevronDown, KeyRound } from "lucide-react";
import PasswordResetForm from "./PasswordResetForm";

interface RightPanelProps {
  animateIn: boolean;
  account: string;
  onAccountChange: (val: string) => void;
  password: string;
  onPasswordChange: (val: string) => void;
  showPassword: boolean;
  onTogglePassword: () => void;
  isLoading: boolean;
  errorMessage: string;
  statusMessage?: string;
  onSubmit: (e: React.FormEvent) => void;
  onQuickLogin: (email: string, password: string) => void;
}

const quickAccounts = [
  { role: "Admin", email: "admin@ojtrpa.edu.vn", password: "Admin@123" },
  { role: "Phòng Đào tạo", email: "academic@ojtrpa.edu.vn", password: "Academic@123" },
  { role: "Phòng QHDN", email: "ojt.coord@ojtrpa.edu.vn", password: "Ojt@123" },
  { role: "Doanh nghiệp", email: "hr@techviet.vn", password: "Enterprise@123" },
  { role: "Sinh viên Minh", email: "minhnhis181601@fpt.edu.vn", password: "Student@123" },
  { role: "Sinh viên Anh", email: "anhltnse181602@fpt.edu.vn", password: "Student@123" },
];

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
    <label htmlFor={id} className="block text-xs font-bold text-gray-700 mb-1 font-inter">
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
  account,
  onAccountChange,
  password,
  onPasswordChange,
  showPassword,
  onTogglePassword,
  isLoading,
  errorMessage,
  statusMessage,
  onSubmit,
  onQuickLogin,
}) => {
  const [{ linkEmail, linkToken }] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return { linkEmail: params.get('resetEmail') || '', linkToken: params.get('resetToken') || '' };
  });
  useEffect(() => {
    if (linkToken) window.history.replaceState(null, '', window.location.pathname);
  }, [linkToken]);
  const [resetOpen, setResetOpen] = useState(Boolean(linkEmail && linkToken));
  const [resetMessage, setResetMessage] = useState(statusMessage ?? '');
  useEffect(() => { if (statusMessage) setResetMessage(statusMessage); }, [statusMessage]);
  const [quickLoginOpen, setQuickLoginOpen] = useState(false);
  const fadeStyle = (delay = 0) => ({
    opacity: animateIn ? 1 : 0,
    transform: animateIn ? "translateY(0)" : "translateY(16px)",
    transition: `all 0.6s ${delay}s cubic-bezier(0.22,1,0.36,1)`,
  });

  return (
    <div className="right-panel relative flex flex-col w-full lg:w-[55%] h-full lg:min-h-[33rem] bg-white/40 backdrop-blur-2xl p-6 lg:p-10 justify-between overflow-y-auto custom-scrollbar flex-1">
      <div className="relative z-20 flex justify-end pb-4">
        <div className="relative mr-2">
          <button
            type="button"
            id="quick-login-toggle"
            aria-label="Mở danh sách đăng nhập nhanh"
            aria-haspopup="menu"
            aria-expanded={quickLoginOpen}
            onClick={() => setQuickLoginOpen((open) => !open)}
            className="flex items-center gap-1.5 rounded-full border border-orange-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-orange-700 shadow-2xs transition hover:border-orange-400 hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-400/40"
          >
            <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Đăng nhập nhanh</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${quickLoginOpen ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>
          {quickLoginOpen && (
            <div role="menu" aria-labelledby="quick-login-toggle" className="absolute right-0 top-full mt-2 w-72 overflow-hidden rounded-2xl border border-gray-200 bg-white p-1.5 shadow-xl">
              <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Chọn tài khoản để đăng nhập</p>
              {quickAccounts.map(({ role, email, password }) => (
                <button
                  key={email}
                  type="button"
                  role="menuitem"
                  disabled={isLoading}
                  onClick={() => {
                    setQuickLoginOpen(false);
                    onAccountChange(email);
                    onPasswordChange(password);
                    onQuickLogin(email, password);
                  }}
                  className="flex w-full flex-col rounded-xl px-3 py-2 text-left transition hover:bg-orange-50 focus:bg-orange-50 focus:outline-none disabled:opacity-50"
                >
                  <span className="text-xs font-semibold text-gray-800">{role}</span>
                  <span className="text-[11px] text-gray-500">{email}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Main Form Content */}
      <div className="relative z-10 my-auto max-w-md mx-auto w-full py-2">
        {resetOpen ? (
          <PasswordResetForm
            initialEmail={linkEmail || account}
            initialToken={linkToken}
            onBack={() => { window.history.replaceState(null, '', window.location.pathname); setResetOpen(false); }}
            onComplete={(email, message) => {
              onAccountChange(email);
              onPasswordChange("");
              setResetMessage(message);
              window.history.replaceState(null, '', window.location.pathname);
              setResetOpen(false);
            }}
          />
        ) : (
        <>
        {/* Geometric Diamond Emblem */}
        <div className="flex flex-col items-center justify-center mb-5" style={fadeStyle(0)}>
          <div className="relative w-14 h-14 mb-2 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-orange-500 to-amber-400 rounded-2xl rotate-45 opacity-90 shadow-lg shadow-orange-500/30 animate-pulse" />
            <div className="relative w-10 h-10 bg-white rounded-xl rotate-45 flex items-center justify-center shadow-inner">
              <div className="w-5 h-5 bg-gradient-to-br from-orange-600 to-amber-500 rounded-md -rotate-45" />
            </div>
          </div>
          <span className="text-sm font-extrabold tracking-widest text-orange-600 uppercase font-inter">
            LOGIN
          </span>
        </div>

        {/* Title */}
        <div className="text-center mb-6" style={fadeStyle(0.04)}>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-900 font-inter tracking-tight mb-1.5">
            Đăng nhập hệ thống
          </h2>
          <p className="text-gray-500 text-xs lg:text-sm font-inter">
            Chào mừng bạn trở lại! Vui lòng đăng nhập để tiếp tục.
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={(event) => { setResetMessage(""); onSubmit(event); }} className="auth-form-enter" style={fadeStyle(0.12)}>
          {/* Account */}
          <InputField
            id="login-account"
            label="Email"
            type="email"
            placeholder="Nhập email"
            value={account}
            onChange={onAccountChange}
            autoComplete="email"
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
            autoComplete="current-password"
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

          <div className="mb-4 text-right">
            <button type="button" disabled={isLoading} className="text-sm font-semibold text-orange-700 hover:underline"
              onClick={() => { setResetMessage(""); setResetOpen(true); }}>
              Quên mật khẩu?
            </button>
          </div>

          {resetMessage && (
            <p role="status" className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{resetMessage}</p>
          )}
          {errorMessage && !resetMessage && (
            <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {errorMessage}
            </p>
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
                <span>Đang đăng nhập...</span>
              </div>
            ) : (
              "Đăng nhập"
            )}
          </button>
        </form>
        </>
        )}
      </div>

      {/* Footer text */}
      <div className="relative z-10 pt-4 text-center text-[11px] text-gray-400 font-inter">
        © 2026 FPT University — OJT Readiness & Risk Prediction System
      </div>
    </div>
  );
};

export default RightPanel;
