import React from 'react';
import { mockCourseCategories } from '../../../data/mockAcademicProfileData';

export const CourseDistributionCard: React.FC = () => {
  return (
    <div className="bg-white/75 backdrop-blur-xl border border-white/80 rounded-2xl p-5 sm:p-6 shadow-md shadow-slate-200/50 hover:shadow-lg transition-all duration-300 flex flex-col justify-between h-full min-h-[360px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-bold text-slate-800 font-outfit tracking-tight">
          Phân bổ môn học
        </h3>
        <button
          type="button"
          className="text-xs sm:text-sm font-semibold text-orange-600 hover:text-orange-700 font-outfit transition-colors p-1"
          onClick={() => alert('Chi tiết phân bổ môn học từng chuyên ngành')}
        >
          Chi tiết
        </button>
      </div>

      {/* Categories List */}
      <div className="space-y-4 flex-1 flex flex-col justify-center py-2">
        {mockCourseCategories.map((cat) => (
          <div key={cat.id} className="space-y-1.5">
            <div className="flex justify-between items-center text-xs sm:text-sm font-semibold text-slate-700 font-outfit">
              <span className="truncate pr-2">{cat.name}</span>
              <span className="font-bold text-slate-900 flex-shrink-0">{cat.percentage}%</span>
            </div>

            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${cat.percentage}%`,
                  backgroundColor: cat.barColor,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
