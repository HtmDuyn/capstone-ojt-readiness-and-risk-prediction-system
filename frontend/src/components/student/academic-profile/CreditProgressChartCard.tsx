import React from 'react';
import { mockSemesterCredits } from '@/data/student/mockAcademicProfileData';
import { MoreVerticalIcon } from '@/components/common/icons/AppIcons';

export const CreditProgressChartCard: React.FC = () => {
  const maxCredits = 25;

  return (
    <div className="card-glass p-5 sm:p-6 flex flex-col h-full min-h-[360px]">
      {/* Card Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-bold text-slate-800 font-outfit tracking-tight">
          Tiến độ tín chỉ
        </h3>
        <button
          type="button"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100/70 transition-colors cursor-pointer"
          title="Tùy chọn"
        >
          <MoreVerticalIcon size={18} />
        </button>
      </div>

      {/* Bar Chart Visualization */}
      <div className="flex-1 flex flex-col justify-end pt-2">
        <div className="h-44 sm:h-52 w-full flex items-end justify-between gap-1.5 sm:gap-2.5 px-1 sm:px-2 border-b border-slate-200/70 pb-2">
          {mockSemesterCredits.map((item, idx) => {
            const heightPercent = Math.min(100, (item.credits / maxCredits) * 100);
            const isCurrent = idx === mockSemesterCredits.length - 1;

            return (
              <div key={item.semester} className="flex-1 flex flex-col items-center group relative">
                {/* Tooltip on Hover */}
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-semibold py-1 px-2 rounded-md shadow-md pointer-events-none whitespace-nowrap z-10">
                  {item.credits} TC
                </span>

                {/* Column Bar */}
                <div className="w-full max-w-[28px] sm:max-w-[32px] bg-slate-100/80 rounded-t-lg overflow-hidden flex items-end h-full">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full transition-all duration-500 ease-out rounded-t-md ${
                      isCurrent
                        ? 'bg-gradient-to-t from-orange-500 to-amber-400 shadow-sm shadow-orange-500/30'
                        : 'bg-gradient-to-t from-sky-500/80 to-blue-400/80'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* X-Axis Labels */}
        <div className="flex justify-between px-1 sm:px-2 pt-3 text-[10px] sm:text-xs font-semibold text-slate-400">
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
