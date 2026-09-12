import React from 'react';
import { mockAcademicRoadmap } from '@/data/student/mockAcademicProfileData';
import { TrendUpIcon, CheckIcon, LockIcon, ArrowRightIcon } from '@/components/common/icons/AppIcons';

interface AcademicRoadmapTimelineProps {
  onViewDetailedRoadmap?: () => void;
}

export const AcademicRoadmapTimeline: React.FC<AcademicRoadmapTimelineProps> = ({
  onViewDetailedRoadmap,
}) => {
  return (
    <div className="card-glass p-5 sm:p-6 flex flex-col h-full min-h-[360px]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <h3 className="text-base sm:text-lg font-bold text-slate-800 font-outfit tracking-tight">
          Lộ trình học tập
        </h3>
        <TrendUpIcon size={16} className="text-orange-500" />
      </div>

      {/* Timeline Steps */}
      <div className="relative pl-6 flex-1 space-y-3 my-1 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {mockAcademicRoadmap.map((step) => {
          if (step.status === 'completed') {
            return (
              <div key={step.id} className="relative flex items-start gap-3 text-xs sm:text-sm">
                <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs ring-4 ring-white flex-shrink-0">
                  <CheckIcon size={11} strokeWidth={3} />
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 font-outfit">{step.semesterName}</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Hoàn thành <span className="mx-1">•</span>
                    <span className="font-semibold text-slate-700">{step.gpaText}</span>
                  </p>
                </div>
              </div>
            );
          }

          if (step.status === 'current') {
            return (
              <div
                key={step.id}
                className="relative -ml-2 pl-4 pr-3 py-2.5 rounded-xl bg-orange-50/80 border border-orange-200/80 shadow-xs text-xs sm:text-sm"
              >
                <span className="absolute -left-4 top-3.5 w-5 h-5 rounded-full bg-amber-700 flex items-center justify-center ring-4 ring-white shadow-xs flex-shrink-0">
                  <span className="w-2 h-2 rounded-full bg-white" />
                </span>
                <p className="font-bold text-amber-900 font-outfit">{step.semesterName}</p>
                <p className="text-amber-800 text-[11px] mt-0.5">{step.subjectCountText}</p>
                <div className="w-full bg-amber-200/80 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-full w-[60%]" />
                </div>
              </div>
            );
          }

          return (
            <div key={step.id} className="relative flex items-start gap-3 text-xs sm:text-sm opacity-55">
              <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center ring-4 ring-white flex-shrink-0">
                <LockIcon size={10} className="text-slate-500" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-slate-600 font-outfit">{step.semesterName}</p>
                <p className="text-slate-400 text-[11px] italic mt-0.5">{step.subtitleText}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA Button */}
      <div className="mt-4 pt-3">
        <button
          type="button"
          onClick={onViewDetailedRoadmap}
          className="w-full py-2.5 px-4 rounded-xl border border-orange-200 hover:border-orange-400 bg-white/80 hover:bg-orange-50/70 text-orange-600 font-bold text-xs sm:text-sm font-outfit transition-all duration-200 flex items-center justify-center gap-2 shadow-xs cursor-pointer group"
        >
          <span>Xem lộ trình chi tiết</span>
          <ArrowRightIcon size={14} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
