import React from 'react';
import type { AcademicProfileStats } from '../../../types/students/academicProfileTypes';
import {
  StarIcon,
  BookOpenIcon,
  HourglassIcon,
  TrendUpIcon,
} from '../../dashboard/icons/DashboardIcons';

interface AcademicStatsRowProps {
  stats: AcademicProfileStats;
}

export const AcademicStatsRow: React.FC<AcademicStatsRowProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* 1. GPA Hiện Tại Card */}
      <div className="bg-white/75 backdrop-blur-xl border border-white/80 rounded-2xl p-5 sm:p-6 shadow-md shadow-slate-200/50 hover:shadow-lg transition-all duration-300 relative overflow-hidden group flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs group-hover:scale-110 transition-transform">
            <StarIcon size={22} className="fill-blue-500 text-blue-500" />
          </div>

          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60 shadow-2xs">
            +{stats.gpaChange.toFixed(2)}
            <TrendUpIcon size={12} className="text-emerald-700" />
          </span>
        </div>

        <div className="mt-4">
          <p className="text-xs sm:text-sm font-medium text-slate-500 font-outfit">GPA hiện tại</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-outfit tracking-tight">
              {stats.currentGpa.toFixed(2)}
            </span>
            <span className="text-sm font-semibold text-slate-400">/{stats.maxGpa.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* 2. Tín chỉ tích lũy Card */}
      <div className="bg-white/75 backdrop-blur-xl border border-white/80 rounded-2xl p-5 sm:p-6 shadow-md shadow-slate-200/50 hover:shadow-lg transition-all duration-300 relative overflow-hidden group flex flex-col justify-between">
        <div className="w-12 h-12 rounded-2xl bg-amber-50/80 border border-amber-100 flex items-center justify-center text-amber-600 shadow-xs group-hover:scale-110 transition-transform">
          <BookOpenIcon size={22} className="text-amber-500" />
        </div>

        <div className="mt-4">
          <p className="text-xs sm:text-sm font-medium text-slate-500 font-outfit">Tín chỉ tích lũy</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-outfit tracking-tight">
              {stats.earnedCredits}
            </span>
            <span className="text-sm font-semibold text-slate-400">/{stats.totalCredits}</span>
          </div>
        </div>
      </div>

      {/* 3. Tín chỉ còn thiếu Card */}
      <div className="bg-white/75 backdrop-blur-xl border border-white/80 rounded-2xl p-5 sm:p-6 shadow-md shadow-slate-200/50 hover:shadow-lg transition-all duration-300 relative overflow-hidden group flex flex-col justify-between">
        <div className="w-12 h-12 rounded-2xl bg-rose-50/80 border border-rose-100 flex items-center justify-center text-rose-500 shadow-xs group-hover:scale-110 transition-transform">
          <HourglassIcon size={22} className="text-rose-500" />
        </div>

        <div className="mt-4">
          <p className="text-xs sm:text-sm font-medium text-slate-500 font-outfit">Tín chỉ còn thiếu</p>
          <div className="mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 font-outfit tracking-tight">
              {stats.missingCredits}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Tiến độ chương trình Card with Gauge */}
      <div className="bg-white/75 backdrop-blur-xl border border-white/80 rounded-2xl p-5 sm:p-6 shadow-md shadow-slate-200/50 hover:shadow-lg transition-all duration-300 relative flex items-center justify-between group">
        <div>
          <p className="text-xs sm:text-sm font-medium text-slate-500 font-outfit">Tiến độ chương trình</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-outfit tracking-tight mt-2">
            {stats.completionPercentage.toFixed(1)}%
          </p>
        </div>

        {/* Circular Donut Progress Ring */}
        <div className="relative w-16 h-16 sm:w-18 sm:h-18 flex items-center justify-center flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate-100"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-amber-700"
              strokeDasharray={`${Math.round(stats.completionPercentage)}, 100`}
              strokeWidth="3.8"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <span className="absolute text-xs sm:text-sm font-bold text-slate-800 font-outfit">
            {Math.round(stats.completionPercentage)}%
          </span>
        </div>
      </div>
    </div>
  );
};
