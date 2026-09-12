import React from 'react';
import { TrendUpIcon } from './icons/DashboardIcons';
import type { StudentProfile } from '../../types/students/studentDashboardTypes';

interface StatCardsProps {
  student: StudentProfile;
}

const CARD_BASE = 'card-glass p-5 flex flex-col justify-between';

export const StatCards: React.FC<StatCardsProps> = ({ student }) => {
  const creditPercent = Math.min(100, Math.round((student.earnedCredits / student.totalCredits) * 100));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* GPA */}
      <div className={CARD_BASE}>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-outfit">
            GPA Hiện tại
          </span>
          <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {student.gpa.toFixed(2)}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold">
          <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <TrendUpIcon size={12} />
            <span>+{student.gpaChange.toFixed(2)}</span>
          </span>
          <span className="text-slate-500 font-normal">học kỳ trước</span>
        </div>
      </div>

      {/* Tín chỉ tích lũy */}
      <div className={CARD_BASE}>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-outfit">
            Tín chỉ tích lũy
          </span>
          <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {student.earnedCredits}/{student.totalCredits}
          </div>
        </div>
        <div className="mt-4 w-full h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-1000 ease-out"
            style={{ width: `${creditPercent}%` }}
          />
        </div>
      </div>

      {/* Tín chỉ còn thiếu */}
      <div className={CARD_BASE}>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-outfit">
            Tín chỉ còn thiếu
          </span>
          <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {student.missingCredits}
          </div>
        </div>
        <p className="mt-4 text-[11px] font-medium text-orange-600">
          Ước tính: {student.estimatedSemestersRemaining} kỳ học
        </p>
      </div>

      {/* Điều kiện OJT */}
      <div className={CARD_BASE}>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-outfit">
            Điều kiện OJT
          </span>
          <div className="mt-2 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 animate-pulse" />
            <span className="text-lg sm:text-xl font-bold text-emerald-600">Đủ điều kiện</span>
          </div>
        </div>
        <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Xác thực bởi {student.ojtVerifiedBy}
        </p>
      </div>
    </div>
  );
};
