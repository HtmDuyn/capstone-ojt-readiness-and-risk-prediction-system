import React from "react";
import FloatingParticle from "./FloatingParticle";
import { PARTICLES } from "@/types/auth.types";

interface LeftPanelProps {
  statsRef?: React.RefObject<HTMLDivElement | null>;
  statsVisible?: boolean;
}

const LeftPanel: React.FC<LeftPanelProps> = () => {
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

      {/* Header Logo */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 lg:w-13 lg:h-13 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-md shadow-orange-500/30 border border-white/80">
            <span className="text-white font-black text-base lg:text-lg tracking-wider font-inter">FPT</span>
          </div>
          <div>
            <h4 className="text-sm lg:text-base font-extrabold uppercase tracking-widest text-orange-950 font-inter">
              FPT University
            </h4>
            <p className="text-xs text-gray-600 font-semibold font-inter">OJT Management System</p>
          </div>
        </div>
      </div>

      <div className="relative z-10 my-auto w-full max-w-[32rem] py-4 lg:py-6">
        <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-orange-200/70 bg-white/90 px-3.5 py-1.5 shadow-2xs backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping flex-shrink-0" />
          <span className="whitespace-nowrap text-[11px] font-bold tracking-wide text-orange-950 font-inter uppercase sm:text-xs">
            Nền tảng OJT thông minh
          </span>
        </div>

        <h1 className="mb-4 text-[1.75rem] font-black leading-[1.08] tracking-tight text-slate-950 font-inter sm:text-3xl lg:text-[2.125rem] xl:text-[2.3rem]">
          <span className="block lg:whitespace-nowrap">OJT Readiness&nbsp;&amp;</span>
          <span className="block bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 bg-clip-text text-transparent lg:whitespace-nowrap font-inter">
            Risk Prediction System
          </span>
        </h1>

        <p className="mt-3 max-w-[38ch] text-sm font-medium leading-relaxed text-slate-800 font-inter">
          Kết nối sinh viên, nhà trường và doanh nghiệp trên một nền tảng OJT thống nhất.
        </p>
      </div>

    </div>
  );
};

export default LeftPanel;
