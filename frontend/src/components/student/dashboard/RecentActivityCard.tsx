import React from 'react';
import type { RecentActivity } from '@/types/student/studentDashboardTypes';

interface RecentActivityCardProps {
  activities: RecentActivity[];
}

const DOT_STYLES: Record<NonNullable<RecentActivity['dotColor']>, string> = {
  green: 'bg-emerald-500 ring-4 ring-emerald-100',
  blue: 'bg-purple-600 ring-4 ring-purple-100',
  orange: 'bg-orange-500 ring-4 ring-orange-100',
  purple: 'bg-purple-500 ring-4 ring-purple-100',
};

export const RecentActivityCard: React.FC<RecentActivityCardProps> = ({ activities }) => {
  return (
    <div className="card-glass p-5 sm:p-6">
      <h3 className="text-sm sm:text-base font-bold text-slate-900 font-outfit mb-4">
        Hoạt động gần đây
      </h3>

      <div className="relative pl-6 space-y-4">
        {/* Vertical timeline line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-slate-200/80" />

        {activities.map((act) => (
          <div key={act.id} className="relative flex items-start">
            <span
              className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                DOT_STYLES[act.dotColor] ?? 'bg-slate-400 ring-4 ring-slate-100'
              }`}
            />
            <div className="min-w-0">
              <p className="text-xs sm:text-[13px] font-medium text-slate-800 leading-snug">
                {act.title}
              </p>
              <span className="text-[11px] text-slate-400 block mt-0.5">{act.timeAgo}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
