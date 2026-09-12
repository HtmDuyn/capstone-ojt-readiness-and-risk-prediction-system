import React from 'react';
import { mockSemesterCredits } from '../../../data/mockAcademicProfileData';
import { MoreVerticalIcon } from '../../dashboard/icons/DashboardIcons';

export const CreditProgressChartCard: React.FC = () => {
  const maxCredits = 25;

  return (
    <div className="bg-white/75 backdrop-blur-xl border border-white/80 rounded-2xl p-5 sm:p-6 shadow-md shadow-slate-200/50 hover:shadow-lg transition-all duration-300 flex flex-col justify-between h-full min-h-[360px]">
      {/* Card Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-bold text-slate-800 font-outfit tracking-tight">
          Tiến độ tín chỉ
        </h3>
        <button
          type="button"
          className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100/60 transition-colors"
          title="Tùy chọn"
        >
          <MoreVerticalIcon size={18} />
        </button>
      </div>

      {/* Bar Chart Visualization */}
      <div className="flex-1 flex flex-col justify-end pt-4">
        <div className="h-44 sm:h-52 w-full flex items-end justify-between gap-1.5 sm:gap-3 px-1 sm:px-2 border-b border-slate-200/70 pb-2">
          {mockSemesterCredits.map((item, idx) => {
            const heightPercent = Math.min(100, (item.credits / maxCredits) * 100);
            const isCurrent = idx === mockSemesterCredits.length - 1;

            return (
              <div key={item.semester} className="flex-1 flex flex-col items-center group relative">
                {/* Tooltip on Hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-900 text-white text-[10px] font-semibold py-1 px-2 rounded-md shadow-md pointer-events-none whitespace-nowrap z-10">
                  {item.credits} tín chỉ
                </div>

                {/* Animated Column Bar */}
                <div className="w-full max-w-[28px] sm:max-w-[32px] bg-slate-100/80 rounded-t-lg overflow-hidden flex items-end h-full">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full transition-all duration-500 rounded-t-md ${
                      isCurrent
                        ? 'bg-gradient-to-t from-orange-500 to-amber-400 shadow-sm shadow-orange-500/30'
                        : 'bg-gradient-to-t from-sky-500 to-blue-400'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* X-Axis Labels */}
        <div className="flex justify-between items-center px-1 sm:px-2 pt-3 text-[10px] sm:text-xs font-semibold text-slate-400">
          {mockSemesterCredits.map((item) => (
            <span key={item.semester} className="flex-1 text-center font-outfit truncate">
              {item.semester}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
