import React from 'react';
import { mockAcademicRoadmap } from '../../../data/mockAcademicProfileData';
import {
  TrendUpIcon,
  CheckIcon,
  LockIcon,
  ArrowRightIcon,
} from '../../dashboard/icons/DashboardIcons';

interface AcademicRoadmapTimelineProps {
  onViewDetailedRoadmap?: () => void;
}

export const AcademicRoadmapTimeline: React.FC<AcademicRoadmapTimelineProps> = ({
  onViewDetailedRoadmap,
}) => {
  return (
    <div className="bg-white/75 backdrop-blur-xl border border-white/80 rounded-2xl p-5 sm:p-6 shadow-md shadow-slate-200/50 hover:shadow-lg transition-all duration-300 flex flex-col justify-between h-full min-h-[360px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-base sm:text-lg font-bold text-slate-800 font-outfit tracking-tight">
            Lộ trình học tập
          </h3>
          <TrendUpIcon size={18} className="text-orange-500" />
        </div>
      </div>

      {/* Timeline Steps */}
      <div className="relative pl-6 space-y-3 flex-1 my-2 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {mockAcademicRoadmap.map((step) => {
          if (step.status === 'completed') {
            return (
              <div key={step.id} className="relative flex items-start gap-3 text-xs sm:text-sm">
                <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs ring-4 ring-white">
                  <CheckIcon size={12} strokeWidth={3} className="text-white" />
                </span>
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 font-outfit">{step.semesterName}</div>
                  <div className="text-slate-500 text-xs">
                    Hoàn thành <span className="mx-1">•</span>{' '}
                    <span className="font-semibold text-slate-700">{step.gpaText}</span>
                  </div>
                </div>
              </div>
            );
          }

          if (step.status === 'current') {
            return (
              <div
                key={step.id}
                className="relative -ml-2 pl-4 pr-3 py-3 rounded-xl bg-orange-50/70 border border-orange-200/80 shadow-xs text-xs sm:text-sm my-1"
              >
                <span className="absolute -left-4 top-4 w-5 h-5 rounded-full bg-amber-700 text-white flex items-center justify-center ring-4 ring-white shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-white" />
                </span>
                <div>
                  <div className="font-bold text-amber-900 font-outfit">{step.semesterName}</div>
                  <div className="text-amber-800 text-xs mt-0.5">{step.subjectCountText}</div>
                  {/* Miniature progress indicator bar */}
                  <div className="w-full bg-amber-200/80 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-full w-[60%]" />
                  </div>
                </div>
              </div>
            );
          }

          // Locked / Upcoming steps
          return (
            <div key={step.id} className="relative flex items-start gap-3 text-xs sm:text-sm opacity-60">
              <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center ring-4 ring-white">
                <LockIcon size={11} className="text-slate-600" />
              </span>
              <div className="min-w-0">
                <div className="font-bold text-slate-700 font-outfit">{step.semesterName}</div>
                <div className="text-slate-400 text-xs italic">{step.subtitleText}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Button */}
      <div className="mt-4 pt-2">
        <button
          type="button"
          onClick={onViewDetailedRoadmap}
          className="w-full py-2.5 px-4 rounded-xl border border-orange-200 hover:border-orange-300 bg-white/80 hover:bg-orange-50/60 text-orange-600 font-bold text-xs sm:text-sm font-outfit transition-all duration-200 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer group"
        >
          <span>Xem lộ trình chi tiết</span>
          <ArrowRightIcon size={14} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
