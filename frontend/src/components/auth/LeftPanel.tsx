import React from "react";
import FloatingParticle from "./FloatingParticle";
import { PARTICLES } from "@/types/auth.types";

interface LeftPanelProps {
  statsRef?: React.RefObject<HTMLDivElement | null>;
  statsVisible?: boolean;
  authMode: "login" | "register";
  onAuthModeChange: (mode: "login" | "register") => void;
}

const LeftPanel: React.FC<LeftPanelProps> = ({
  authMode,
  onAuthModeChange,
}) => {
  return (
    <div className="left-panel relative flex flex-col justify-between w-full lg:w-[45%] min-h-[340px] lg:min-h-full p-7 lg:p-10 overflow-hidden text-gray-900 select-none bg-gradient-to-br from-white/45 via-orange-50/25 to-amber-100/20 backdrop-blur-2xl border-r border-white/30">
      {/* Soft Ambient Glows (Trắng loang màu cam nhẹ) */}
      <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full bg-orange-200/35 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-amber-200/30 blur-3xl pointer-events-none" />

      {/* Geometric Diagonal Bands from reference image */}
      <div className="stripe-pattern">
        <div className="stripe-band-1" />
        <div className="stripe-band-2" />
        <div className="stripe-band-3" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {PARTICLES.slice(0, 10).map((p, i) => (
          <FloatingParticle key={i} {...p} opacity={0.45} />
        ))}
      </div>

      {/* Vertical Boundary Notch Tab Switcher (Reference Image Cutout Replica) */}
      <div className="hidden lg:flex notch-boundary-wrapper">
        {/* Active sliding notch background with concave curves */}
        <div
          className="notch-pill-active"
          style={{
            transform: authMode === "login" ? "translateY(0px)" : "translateY(54px)",
          }}
        />

        {/* LOGIN Button */}
        <button
          type="button"
          onClick={() => onAuthModeChange("login")}
          className={`relative z-10 w-full h-[48px] pr-7 flex items-center justify-end font-extrabold text-xs lg:text-sm tracking-widest transition-colors duration-300 ${authMode === "login"
              ? "text-slate-900 font-black"
              : "text-orange-950/80 hover:text-orange-900 font-extrabold"
            }`}
        >
          LOGIN
        </button>

        {/* SIGN IN / REGISTER Button */}
        <button
          type="button"
          onClick={() => onAuthModeChange("register")}
          className={`relative z-10 w-full h-[48px] pr-7 flex items-center justify-end font-extrabold text-xs lg:text-sm tracking-widest transition-colors duration-300 mt-1.5 ${authMode === "register"
              ? "text-slate-900 font-black"
              : "text-orange-950/80 hover:text-orange-900 font-extrabold"
            }`}
        >
          SIGN IN
        </button>
      </div>

      {/* Header Logo */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 lg:w-13 lg:h-13 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-md shadow-orange-500/30 border border-white/80">
            <span className="text-white font-black text-base lg:text-lg tracking-wider font-outfit">FPT</span>
          </div>
          <div>
            <h4 className="text-sm lg:text-base font-extrabold uppercase tracking-widest text-orange-950 font-cinematic">
              FPT University
            </h4>
            <p className="text-xs text-gray-600 font-semibold font-outfit">OJT Management System</p>
          </div>
        </div>
      </div>

      {/* Hero Content (max-w-[72%] strictly prevents any text from touching notch tabs on the right) */}
      <div className="relative z-10 my-auto py-4 lg:py-6 max-w-[72%]">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-orange-200/70 shadow-2xs mb-4">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping flex-shrink-0" />
          <span className="text-[11px] sm:text-xs font-extrabold text-orange-950 tracking-wider font-outfit uppercase">
            Hệ thống quản lý OJT tích hợp AI
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-[2.25rem] font-black font-outfit text-slate-950 leading-[1.2] mb-3 tracking-tight">
          OJT Readiness & <br />
          <span className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 bg-clip-text text-transparent font-outfit">
            Risk Prediction System
          </span>
        </h1>

        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-outfit mt-3 font-medium">
          Giải pháp toàn diện kết nối <strong className="font-bold text-orange-950">Sinh viên — Nhà trường — Doanh nghiệp</strong>. 
          Dự báo rủi ro thực tập và cá nhân hóa lộ trình phát triển.
        </p>
      </div>

      {/* Mobile Tab Switcher (Fallback for small screens) */}
      <div className="relative z-10 pt-4 flex lg:hidden items-center justify-between border-t border-orange-200/40">
        <div className="text-xs text-gray-600 font-medium font-outfit">
          {authMode === "login" ? "Chưa có tài khoản?" : "Đã có tài khoản?"}
        </div>
        <div className="flex bg-white/80 backdrop-blur-md p-1 rounded-full border border-orange-200/60 shadow-2xs">
          <button
            type="button"
            onClick={() => onAuthModeChange("login")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${authMode === "login"
              ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-xs"
              : "text-gray-600 hover:text-orange-600"
              }`}
          >
            LOGIN
          </button>
          <button
            type="button"
            onClick={() => onAuthModeChange("register")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${authMode === "register"
              ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-xs"
              : "text-gray-600 hover:text-orange-600"
              }`}
          >
            SIGN IN
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;
