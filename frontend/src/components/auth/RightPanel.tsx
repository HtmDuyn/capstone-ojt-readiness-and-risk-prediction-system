import React from "react";

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
  onSubmit: (e: React.FormEvent) => void;
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
  onSubmit,
}) => {
  const fadeStyle = (delay = 0) => ({
    opacity: animateIn ? 1 : 0,
    transform: animateIn ? "translateY(0)" : "translateY(16px)",
    transition: `all 0.6s ${delay}s cubic-bezier(0.22,1,0.36,1)`,
  });

  return (
    <div className="right-panel relative flex flex-col w-full lg:w-[55%] h-full bg-white/40 backdrop-blur-2xl p-6 lg:p-10 justify-between overflow-y-auto custom-scrollbar flex-1">
      {/* Top Header Row with Language switcher */}
      <div className="relative z-10 flex items-center justify-between pb-4">
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
        <form onSubmit={onSubmit} className="auth-form-enter" style={fadeStyle(0.12)}>
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

          {errorMessage && (
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

      </div>

      {/* Footer text */}
      <div className="relative z-10 pt-4 text-center text-[11px] text-gray-400 font-inter">
        © 2026 FPT University — OJT Readiness & Risk Prediction System
      </div>
    </div>
  );
};

export default RightPanel;
