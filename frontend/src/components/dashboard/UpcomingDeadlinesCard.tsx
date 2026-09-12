import React from 'react';
import type { DeadlineItem } from '../../types/studentDashboardTypes';

interface UpcomingDeadlinesCardProps {
  deadlines: DeadlineItem[];
  onViewAll?: () => void;
}

export const UpcomingDeadlinesCard: React.FC<UpcomingDeadlinesCardProps> = ({
  deadlines,
  onViewAll,
}) => {
  const getBadgeStyle = (color: DeadlineItem['badgeColor']) => {
    switch (color) {
      case 'orange':
        return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'blue':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'slate':
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 font-outfit">
          Deadline sắp tới
        </h3>
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline transition-colors"
        >
          Xem tất cả
        </button>
      </div>

      {/* Deadlines List */}
      <div className="space-y-3.5">
        {deadlines.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors"
          >
            {/* Calendar Date Block */}
            <div
              className={`flex-shrink-0 w-11 h-11 rounded-xl border flex flex-col items-center justify-center text-center ${getBadgeStyle(
                item.badgeColor
              )}`}
            >
              <span className="text-[9px] font-bold uppercase tracking-wider leading-none">
                {item.month}
              </span>
              <span className="text-sm font-extrabold leading-tight">
                {item.day}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                {item.title}
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                {item.subtext}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
