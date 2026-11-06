import React from 'react';
import type { CourseCategoryDistribution } from '@/types/student/academicProfileTypes';

export const CourseDistributionCard: React.FC<{ categories: CourseCategoryDistribution[] }> = ({ categories }) => {

  return (
    <div className="card-glass p-5 sm:p-6 flex flex-col h-full min-h-[360px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base sm:text-lg font-bold text-slate-800 font-outfit tracking-tight">
          Phân bổ môn học
        </h3>
      </div>

      {/* Categories List */}
      <div className="space-y-4 flex-1 flex flex-col justify-center">
        {!categories.length && <p className="text-sm text-slate-500">Chưa có dữ liệu phân bổ môn học.</p>}
        {categories.map((cat) => (
          <div key={cat.id} className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm font-semibold text-slate-700 font-outfit truncate pr-2">
                {cat.name}
              </span>
              <span className="text-xs font-bold text-slate-900 flex-shrink-0">
                {cat.percentage}%
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${cat.percentage}%`, backgroundColor: cat.barColor }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
