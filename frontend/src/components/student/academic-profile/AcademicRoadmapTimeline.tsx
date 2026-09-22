import React, { useState } from 'react';
import { mockAcademicRoadmap } from '@/data/student/mockAcademicProfileData';
import { TrendUpIcon, CheckIcon, ArrowRightIcon, ChevronDownIcon, ChevronUpIcon } from '@/components/common/icons/AppIcons';

interface AcademicRoadmapTimelineProps {
  onViewDetailedRoadmap?: () => void;
}

export const AcademicRoadmapTimeline: React.FC<AcademicRoadmapTimelineProps> = ({
  onViewDetailedRoadmap,
}) => {
  const [expandedSemesterId, setExpandedSemesterId] = useState<number | null>(6); // Default expanded on Kỳ 6

  const toggleExpand = (id: number) => {
    setExpandedSemesterId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="card-glass p-5 sm:p-6 flex flex-col justify-between h-full rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-800 font-outfit tracking-tight">
              Lộ trình học tập (Kỳ 1 - Kỳ 6)
            </h3>
            <TrendUpIcon size={16} className="text-amber-600" />
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-100/80 text-amber-800 border border-orange-200">
            6 Học kỳ
          </span>
        </div>

        {/* Timeline Steps Scrollable Container with Generous Left Padding (pl-10) to Prevent Icon Clipping */}
        <div className="relative pl-10 space-y-3 my-1 max-h-[340px] sm:max-h-[370px] overflow-y-auto pr-1.5 custom-scrollbar before:absolute before:left-[21px] before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-emerald-400 before:via-emerald-500 before:to-amber-500">
          {mockAcademicRoadmap.map((step) => {
            const isCompleted = step.status === 'completed';
            const isCurrent = step.status === 'current';
            const isExpanded = expandedSemesterId === step.id;

            return (
              <div
                key={step.id}
                className={`relative transition-all duration-200 rounded-xl border ${
                  isCurrent
                    ? 'bg-orange-50/80 border-orange-200 shadow-2xs p-3 ml-2'
                    : 'bg-white/70 hover:bg-white border-slate-200/60 p-2.5 ml-2'
                }`}
              >
                {/* Timeline Icon Node safely positioned inside container (left-[11px]) */}
                {isCompleted && (
                  <span className="absolute left-[-29px] top-3 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-2xs ring-4 ring-white flex-shrink-0 z-10">
                    <CheckIcon size={11} strokeWidth={3} />
                  </span>
                )}

                {isCurrent && (
                  <span className="absolute left-[-29px] top-3.5 w-5 h-5 rounded-full bg-amber-700 flex items-center justify-center ring-4 ring-white shadow-md flex-shrink-0 z-10 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-white" />
                  </span>
                )}

                {/* Card Header Content */}
                <div
                  onClick={() => toggleExpand(step.id)}
                  className="flex items-center justify-between cursor-pointer group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`font-bold font-outfit text-sm ${isCurrent ? 'text-amber-950' : 'text-slate-800'}`}>
                        {step.semesterName}
                      </p>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white shadow-2xs">
                          Đang học
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 font-medium mt-0.5">
                      {isCompleted ? (
                        <>
                          <span className="text-emerald-700 font-semibold">Hoàn thành</span>
                          <span>•</span>
                          <span className="font-bold text-slate-700">{step.gpaText}</span>
                          <span>•</span>
                          <span>{step.creditsText}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-amber-800 font-semibold">{step.subjectCountText}</span>
                          <span>•</span>
                          <span className="font-bold text-amber-900">{step.gpaText}</span>
                          <span>•</span>
                          <span>{step.creditsText}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="p-1 text-slate-400 group-hover:text-slate-600 transition-colors cursor-pointer"
                    title="Xem chi tiết môn học"
                  >
                    {isExpanded ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />}
                  </button>
                </div>

                {/* Progress bar for current semester */}
                {isCurrent && (
                  <div className="w-full bg-amber-200/80 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-full w-[70%] transition-all duration-1000 ease-out" />
                  </div>
                )}

                {/* Expanded Subjects */}
                {isExpanded && step.subjectsSummary && (
                  <div className="mt-2 pt-2 border-t border-slate-200/50 flex flex-wrap gap-1.5 animate-fadeIn">
                    <span className="text-[11px] text-slate-400 font-semibold w-full">Môn học tiêu biểu:</span>
                    {step.subjectsSummary.map((code) => (
                      <span
                        key={code}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold border ${
                          isCurrent
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Footer Button Pinned at Bottom */}
      <div className="mt-4 pt-3 border-t border-slate-200/60">
        <button
          type="button"
          onClick={onViewDetailedRoadmap}
          className="w-full py-2.5 px-4 rounded-xl border border-orange-200 hover:border-orange-400 bg-white/90 hover:bg-orange-50/70 text-orange-600 font-bold text-xs sm:text-sm font-outfit transition-all duration-200 flex items-center justify-center gap-2 shadow-2xs cursor-pointer group"
        >
          <span>Xem lộ trình chi tiết toàn khóa</span>
          <ArrowRightIcon size={14} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default AcademicRoadmapTimeline;
