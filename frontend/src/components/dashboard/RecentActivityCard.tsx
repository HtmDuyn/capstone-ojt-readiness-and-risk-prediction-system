import React from 'react';
import type { RecentActivity } from '../../types/students/studentDashboardTypes';

interface RecentActivityCardProps {
  activities: RecentActivity[];
}

export const RecentActivityCard: React.FC<RecentActivityCardProps> = ({
  activities,
}) => {
  const getDotStyle = (color: RecentActivity['dotColor']) => {
    switch (color) {
      case 'green':
        return 'bg-emerald-500 ring-4 ring-emerald-100';
      case 'blue':
        return 'bg-purple-600 ring-4 ring-purple-100';
      case 'orange':
        return 'bg-orange-500 ring-4 ring-orange-100';
      default:
        return 'bg-slate-400 ring-4 ring-slate-100';
    }
  };

  return (
    <div className="bg-white/75 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-white/80 shadow-md">
      <h3 className="text-sm sm:text-base font-bold text-slate-900 font-outfit mb-4">
        Hoạt động gần đây
      </h3>

      <div className="relative pl-6 space-y-4">
        {/* Continuous vertical timeline connector line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-slate-200/80" />

        {activities.map((act) => (
          <div key={act.id} className="relative flex items-start">
            {/* Timeline bullet dot */}
            <span
              className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full transition-transform ${getDotStyle(
                act.dotColor
              )}`}
            />

            {/* Content */}
            <div className="min-w-0">
              <p className="text-xs sm:text-[13px] font-medium text-slate-800 leading-snug">
                {act.title}
              </p>
              <span className="text-[11px] text-slate-400 block mt-0.5 font-normal">
                {act.timeAgo}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
