import React from 'react';
import type { AcademicProfileStats } from '../../../types/students/academicProfileTypes';
import { StarIcon, BookOpenIcon, HourglassIcon, TrendUpIcon } from '../../dashboard/icons/DashboardIcons';

interface AcademicStatsRowProps {
  stats: AcademicProfileStats;
}

/* ─── Circular Progress Ring ───────────────────────────────── */
const ProgressRing: React.FC<{ percent: number }> = ({ percent }) => {
  const rounded = Math.round(percent);
  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
        <path
          strokeWidth="3.5"
          stroke="#e2e8f0"
          fill="none"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
        <path
          strokeDasharray={`${rounded}, 100`}
          strokeWidth="3.8"
          strokeLinecap="round"
          stroke="#b45309"
          fill="none"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-800 font-outfit">
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
      <div className="card-glass p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden group">
        <div className="flex items-start justify-between">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
            <StarIcon size={20} className="fill-blue-500 text-blue-500" />
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/70">
            +{stats.gpaChange.toFixed(2)}
            <TrendUpIcon size={11} />
          </span>
        </div>
        <div className="mt-4">
          <p className="text-xs text-slate-500 font-outfit">GPA hiện tại</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-outfit tracking-tight">
              {stats.currentGpa.toFixed(2)}
            </span>
            <span className="text-sm font-semibold text-slate-400">/{stats.maxGpa.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* 2. Tín chỉ tích lũy */}
      <div className="card-glass p-5 sm:p-6 flex flex-col justify-between group">
        <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
          <BookOpenIcon size={20} className="text-amber-500" />
        </div>
        <div className="mt-4">
          <p className="text-xs text-slate-500 font-outfit">Tín chỉ tích lũy</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-outfit tracking-tight">
              {stats.earnedCredits}
            </span>
            <span className="text-sm font-semibold text-slate-400">/{stats.totalCredits}</span>
          </div>
        </div>
      </div>

      {/* 3. Tín chỉ còn thiếu */}
      <div className="card-glass p-5 sm:p-6 flex flex-col justify-between group">
        <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center group-hover:scale-110 transition-transform">
          <HourglassIcon size={20} className="text-rose-500" />
        </div>
        <div className="mt-4">
          <p className="text-xs text-slate-500 font-outfit">Tín chỉ còn thiếu</p>
          <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 font-outfit tracking-tight mt-1 block">
            {stats.missingCredits}
          </span>
        </div>
      </div>

      {/* 4. Tiến độ chương trình */}
      <div className="card-glass p-5 sm:p-6 flex items-center justify-between gap-3 group">
        <div>
          <p className="text-xs text-slate-500 font-outfit">Tiến độ chương trình</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-outfit tracking-tight mt-2">
            {stats.completionPercentage.toFixed(1)}%
          </p>
        </div>
        <ProgressRing percent={stats.completionPercentage} />
      </div>
    </div>
  );
};
