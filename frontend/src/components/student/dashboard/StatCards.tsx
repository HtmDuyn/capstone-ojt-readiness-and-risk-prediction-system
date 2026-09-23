import React from 'react';
import { TrendUpIcon, CheckCircleIcon, BookOpenIcon, ClockIcon } from '@/components/common/icons/AppIcons';
import type { StudentProfile } from '@/types/student/studentDashboardTypes';

interface StatCardsProps {
  student: StudentProfile;
}

export const StatCards: React.FC<StatCardsProps> = ({ student }) => {
  const creditPercent = Math.min(100, Math.round((student.earnedCredits / student.totalCredits) * 100));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* GPA Card */}
      <div className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/60 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 group">
        <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform duration-500">
          <TrendUpIcon size={80} />
        </div>
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <span className="inline-flex items-center justify-center p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
              <TrendUpIcon size={22} />
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/50">
              +{student.gpaChange.toFixed(2)} kỳ này
            </span>
          </div>
          <div>
            <h3 className="text-slate-500 text-sm font-semibold mb-1">GPA Tích lũy</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-slate-800 tracking-tight">{student.gpa.toFixed(2)}</span>
              <span className="text-slate-400 font-medium text-sm">/ 4.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Credits Card */}
      <div className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/60 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 group">
        <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform duration-500">
          <BookOpenIcon size={80} />
        </div>
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <span className="inline-flex items-center justify-center p-2.5 bg-orange-50 text-orange-600 rounded-2xl">
                <BookOpenIcon size={22} />
              </span>
              <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                {creditPercent}%
              </span>
            </div>
            <h3 className="text-slate-500 text-sm font-semibold mb-1">Tín chỉ tích lũy</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-slate-800 tracking-tight">{student.earnedCredits}</span>
              <span className="text-slate-400 font-medium text-sm">/ {student.totalCredits} TC</span>
            </div>
          </div>
          <div className="mt-5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-orange-400 to-orange-600 h-full rounded-full relative"
              style={{ width: `${creditPercent}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Missing Credits Card */}
      <div className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/60 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 group">
        <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform duration-500">
          <ClockIcon size={80} />
        </div>
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <span className="inline-flex items-center justify-center p-2.5 bg-purple-50 text-purple-600 rounded-2xl">
              <ClockIcon size={22} />
            </span>
          </div>
          <div>
            <h3 className="text-slate-500 text-sm font-semibold mb-1">Tín chỉ còn thiếu</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-slate-800 tracking-tight">{student.missingCredits}</span>
              <span className="text-slate-400 font-medium text-sm">TC</span>
            </div>
            <p className="mt-3 text-xs font-medium text-slate-500">
              Dự kiến cần <strong className="text-purple-600">{student.estimatedSemestersRemaining} học kỳ</strong> nữa
            </p>
          </div>
        </div>
      </div>

      {/* OJT Eligibility Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 shadow-xl border border-slate-700/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl group-hover:bg-emerald-500/30 transition-colors"></div>
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="inline-flex items-center justify-center p-2.5 bg-white/10 text-emerald-400 rounded-2xl backdrop-blur-md border border-white/5 shadow-inner">
              <CheckCircleIcon size={22} />
            </span>
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <h3 className="text-slate-300 text-sm font-medium mb-1">Trạng thái OJT</h3>
            <div className="text-2xl font-extrabold text-white tracking-tight mb-2">
              Đủ điều kiện
            </div>
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-200/80 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
              <CheckCircleIcon size={12} />
              Đã xác thực bởi P.ĐT
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
