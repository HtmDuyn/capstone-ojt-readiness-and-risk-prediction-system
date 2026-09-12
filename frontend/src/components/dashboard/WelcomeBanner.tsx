import React from 'react';
import type { StudentProfile } from '../../types/studentDashboardTypes';

interface WelcomeBannerProps {
  student: StudentProfile;
  onRegisterOjt?: () => void;
  onViewRoadmap?: () => void;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({
  student,
  onRegisterOjt,
  onViewRoadmap,
}) => {
  // Extract first name or greeting name
  const nameParts = student.fullName.trim().split(' ');
  const displayName = nameParts.length > 1 ? nameParts.slice(-2).join(' ') : student.fullName;

  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#172033] via-[#1a233b] to-[#121829] p-6 sm:p-8 text-white shadow-xl shadow-slate-900/10 border border-slate-700/40">
      {/* Decorative background glow accents */}
      <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl">
        <h1 className="text-xl sm:text-2xl lg:text-[26px] font-extrabold tracking-tight font-outfit text-white flex items-center gap-2">
          Chào mừng bạn trở lại, {displayName}! <span className="animate-bounce inline-block origin-bottom">👋</span>
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
          Bạn đã hoàn thành <span className="font-semibold text-white">75%</span> chương trình đào tạo. Kỳ OJT đang tới gần, hãy kiểm tra các khuyến nghị từ AI bên dưới.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onRegisterOjt}
            className="px-5 py-2.5 rounded-xl bg-[#ea580c] hover:bg-[#d94806] text-white font-semibold text-xs sm:text-sm shadow-md shadow-orange-600/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Đăng ký OJT
          </button>
          <button
            type="button"
            onClick={onViewRoadmap}
            className="px-5 py-2.5 rounded-xl bg-slate-700/50 hover:bg-slate-700/80 text-white font-medium text-xs sm:text-sm border border-slate-600/50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Xem lộ trình
          </button>
        </div>
      </div>
    </div>
  );
};
