import React from 'react';
import type { StudentProfile } from '../../types/students/studentDashboardTypes';

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
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#1c1917] via-[#2e1065] to-[#1c1917] p-6 sm:p-8 text-white shadow-xl shadow-purple-950/20 border border-white/15 backdrop-blur-md">
      {/* Decorative background glow accents */}
      <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-orange-500/25 blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-purple-500/30 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl">
        <h1 className="text-xl sm:text-2xl lg:text-[26px] font-extrabold tracking-tight font-outfit text-white flex items-center gap-2">
          Chào mừng bạn trở lại, {displayName}! <span className="animate-bounce inline-block origin-bottom"></span>
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-purple-100 leading-relaxed font-normal">
          Bạn đã hoàn thành <span className="font-bold text-amber-300">75%</span> chương trình đào tạo. Kỳ OJT đang tới gần, hãy kiểm tra các khuyến nghị từ AI bên dưới.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onRegisterOjt}
            className="btn-login px-5 py-2.5 rounded-xl text-white font-bold text-xs sm:text-sm shadow-lg shadow-orange-500/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            Đăng ký OJT
          </button>
        </div>
      </div>
    </div>
  );
};
