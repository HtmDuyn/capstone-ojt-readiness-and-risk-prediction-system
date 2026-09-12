import React from 'react';
import {
  CheckIcon,
  OjtRegisterIcon,
  BriefcaseIcon,
  AcademicCapIcon,
} from './icons/DashboardIcons';
import type { RoadmapStep } from '../../types/students/studentDashboardTypes';

interface RoadmapStepperProps {
  steps: RoadmapStep[];
}

export const RoadmapStepper: React.FC<RoadmapStepperProps> = ({ steps }) => {
  const renderStepIcon = (step: RoadmapStep) => {
    if (step.status === 'completed') {
      return (
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/25">
          <CheckIcon size={18} />
        </div>
      );
    }

    if (step.status === 'current') {
      return (
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-orange-50 border-2 border-orange-500 text-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 ring-4 ring-orange-100">
          <OjtRegisterIcon size={18} className="text-orange-500" />
        </div>
      );
    }

    // Upcoming / future
    if (step.iconType === 'briefcase') {
      return (
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-purple-50/80 text-purple-400 border border-purple-100 flex items-center justify-center">
          <BriefcaseIcon size={18} />
        </div>
      );
    }

    return (
      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-purple-50/80 text-purple-400 border border-purple-100 flex items-center justify-center">
        <AcademicCapIcon size={18} />
      </div>
    );
  };

  return (
    <div className="card-glass p-5 sm:p-6">
      <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight font-outfit mb-6">
        Lộ trình đến học kỳ OJT
      </h2>

      {/* Stepper horizontal flow */}
      <div className="relative flex items-start justify-between px-2 sm:px-6">
        {/* Connector Line behind nodes */}
        <div className="absolute top-5 sm:top-5.5 left-6 right-6 sm:left-10 sm:right-10 h-[2px] bg-slate-200/80 -z-0">
          {/* Progress fill up to current step (step 3) */}
          <div className="h-full bg-gradient-to-r from-orange-500 to-purple-500 w-1/2 shadow-xs" />
        </div>

        {steps.map((step) => {
          const isCurrent = step.status === 'current';
          const isCompleted = step.status === 'completed';

          return (
            <div
              key={step.id}
              className="relative z-10 flex flex-col items-center text-center flex-1 max-w-[130px]"
            >
              {/* Icon Container */}
              <div className="transition-transform duration-200 hover:scale-105">
                {renderStepIcon(step)}
              </div>

              {/* Step Title */}
              <div className="mt-3">
                <span
                  className={`text-[11px] sm:text-xs leading-snug font-semibold block ${isCurrent
                    ? 'text-orange-600 font-bold'
                    : isCompleted
                      ? 'text-slate-800'
                      : 'text-slate-400 font-medium'
                    }`}
                >
                  {step.title}
                </span>
                {step.description && (
                  <span className="hidden md:block text-[10px] text-slate-400 mt-0.5 max-w-[110px] truncate">
                    {step.description}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
