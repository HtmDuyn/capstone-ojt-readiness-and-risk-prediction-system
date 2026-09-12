import React from 'react';
import { TrendUpIcon, ClockIcon } from './icons/DashboardIcons';
import type { StudentProfile } from '../../types/studentDashboardTypes';

interface StatCardsProps {
  student: StudentProfile;
}

export const StatCards: React.FC<StatCardsProps> = ({ student }) => {
  const creditPercent = Math.min(
    100,
    Math.round((student.earnedCredits / student.totalCredits) * 100)
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* Card 1: GPA HIỆN TẠI */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-outfit">
            GPA Hiện tại
          </span>
          <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {student.gpa.toFixed(2)}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
          <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
            <TrendUpIcon size={12} />
            <span>+{student.gpaChange.toFixed(2)}</span>
          </span>
          <span className="text-slate-500 font-normal">học kỳ trước</span>
        </div>
      </div>

      {/* Card 2: TÍN CHỈ TÍCH LŨY */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-outfit">
            Tín chỉ tích lũy
          </span>
          <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {student.earnedCredits}/{student.totalCredits}
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-1000 ease-out"
              style={{ width: `${creditPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Card 3: TÍN CHỈ CÒN THIẾU */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-outfit">
            Tín chỉ còn thiếu
          </span>
          <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {student.missingCredits}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-1.5 text-[11px] font-medium text-orange-600">
          <ClockIcon size={13} className="text-orange-500" />
          <span>Ước tính: {student.estimatedSemestersRemaining} kỳ</span>
        </div>
      </div>

      {/* Card 4: ĐIỀU KIỆN OJT */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-outfit">
            Điều kiện OJT
          </span>
          <div className="mt-1 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 animate-pulse" />
            <span className="text-xl sm:text-2xl font-bold text-emerald-600 tracking-tight">
              Đủ điều kiện
            </span>
          </div>
        </div>
        <div className="mt-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Đã xác thực bởi {student.ojtVerifiedBy}
          </span>
        </div>
      </div>
    </div>
  );
};
