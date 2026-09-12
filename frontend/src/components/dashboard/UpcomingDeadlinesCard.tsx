import React from 'react';
import type { DeadlineItem } from '../../types/students/studentDashboardTypes';

interface UpcomingDeadlinesCardProps {
  deadlines: DeadlineItem[];
  onViewAll?: () => void;
}

const BADGE_STYLES: Record<NonNullable<DeadlineItem['badgeColor']>, string> = {
  orange: 'bg-orange-50 text-orange-600 border-orange-200',
  blue: 'bg-purple-50 text-purple-600 border-purple-200',
  slate: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const UpcomingDeadlinesCard: React.FC<UpcomingDeadlinesCardProps> = ({
  deadlines,
  onViewAll,
}) => {
  return (
    <div className="card-glass p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 font-outfit">
          Deadline sắp tới
        </h3>
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline transition-colors cursor-pointer"
        >
          Xem tất cả
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {deadlines.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 p-2 rounded-xl hover:bg-orange-50/50 transition-colors"
          >
            {/* Date Block */}
            <div
              className={`flex-shrink-0 w-11 h-11 rounded-xl border flex flex-col items-center justify-center ${
                BADGE_STYLES[item.badgeColor] ?? BADGE_STYLES.slate
              }`}
            >
              <span className="text-[9px] font-bold uppercase tracking-wider leading-none">
                {item.month}
              </span>
              <span className="text-sm font-extrabold leading-tight">{item.day}</span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate">{item.title}</h4>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">{item.subtext}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
