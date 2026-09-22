import React from 'react';
import type { AcademicProfileStats } from '@/types/student/academicProfileTypes';
import { StarIcon, BookOpenIcon, HourglassIcon, TrendUpIcon } from '@/components/common/icons/AppIcons';

interface AcademicStatsRowProps {
  stats: AcademicProfileStats;
}

/* ─── Circular Progress Ring ───────────────────────────────── */
const ProgressRing: React.FC<{ percent: number }> = ({ percent }) => {
  const rounded = Math.round(percent);
  return (
    <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
        <path
          strokeWidth="3.5"
          stroke="#f1f5f9"
          fill="none"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
        <path
          strokeDasharray={`${rounded}, 100`}
          strokeWidth="3.8"
          strokeLinecap="round"
          stroke="#d97706"
          fill="none"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-extrabold text-slate-800 font-outfit">
        {rounded}%
      </span>
    </div>
  );
};

/* ─── Component ────────────────────────────────────────────── */
export const AcademicStatsRow: React.FC<AcademicStatsRowProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* 1. GPA */}
      <div className="card-glass p-5 flex flex-col justify-between relative overflow-hidden group hover:border-blue-200 transition-all h-full">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center group-hover:scale-105 transition-transform">
            <StarIcon size={19} className="fill-blue-500 text-blue-500" />
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80">
            +{stats.gpaChange.toFixed(2)}
            <TrendUpIcon size={11} />
          </span>
        </div>
        <div className="mt-3">
          <p className="text-xs font-semibold text-slate-500 font-outfit tracking-tight">GPA hiện tại</p>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-outfit tracking-tight">
              {stats.currentGpa.toFixed(2)}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-400">/{stats.maxGpa.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* 2. Tín chỉ tích lũy */}
      <div className="card-glass p-5 flex flex-col justify-between relative overflow-hidden group hover:border-amber-200 transition-all h-full">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center group-hover:scale-105 transition-transform">
            <BookOpenIcon size={19} className="text-amber-600" />
          </div>
          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/80">
            Kỳ 6 hiện tại
          </span>
        </div>
        <div className="mt-3">
          <p className="text-xs font-semibold text-slate-500 font-outfit tracking-tight">Tín chỉ tích lũy</p>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-outfit tracking-tight">
              {stats.earnedCredits}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-400">/{stats.totalCredits} TC</span>
          </div>
        </div>
      </div>

      {/* 3. Tín chỉ còn thiếu */}
      <div className="card-glass p-5 flex flex-col justify-between relative overflow-hidden group hover:border-rose-200 transition-all h-full">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center group-hover:scale-105 transition-transform">
            <HourglassIcon size={19} className="text-rose-500" />
          </div>
          <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200/80">
            Còn 2 học kỳ
          </span>
        </div>
        <div className="mt-3">
          <p className="text-xs font-semibold text-slate-500 font-outfit tracking-tight">Tín chỉ còn thiếu</p>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 font-outfit tracking-tight">
              {stats.missingCredits}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-400">TC</span>
          </div>
        </div>
      </div>

      {/* 4. Tiến độ chương trình */}
      <div className="card-glass p-5 flex items-center justify-between gap-3 group hover:border-orange-200 transition-all h-full">
        <div>
          <span className="text-[11px] font-bold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200/80 inline-block mb-1.5">
            Chương trình KTPM
          </span>
          <p className="text-xs font-semibold text-slate-500 font-outfit tracking-tight">Tiến độ chương trình</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-outfit tracking-tight mt-0.5">
            {stats.completionPercentage.toFixed(1)}%
          </p>
        </div>
        <ProgressRing percent={stats.completionPercentage} />
      </div>
    </div>
  );
};

export default AcademicStatsRow;
