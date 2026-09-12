import React from 'react';
import { LightningIcon } from './icons/DashboardIcons';
import type { AIRecommendation } from '../../types/students/studentDashboardTypes';

interface AIRecommendationsCardProps {
  recommendations: AIRecommendation[];
  onConsultAction?: (rec: AIRecommendation) => void;
}

export const AIRecommendationsCard: React.FC<AIRecommendationsCardProps> = ({
  recommendations,
  onConsultAction,
}) => {
  return (
    <div className="card-glass p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="p-1.5 rounded-lg bg-orange-50 text-orange-600 border border-orange-200/60">
          <LightningIcon size={17} />
        </span>
        <h3 className="text-sm sm:text-base font-bold text-slate-900 font-outfit tracking-tight">
          Khuyến nghị từ AI
        </h3>
      </div>

      {/* List */}
      <div className="space-y-2.5">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            role="button"
            tabIndex={0}
            onClick={() => onConsultAction?.(rec)}
            onKeyDown={(e) => e.key === 'Enter' && onConsultAction?.(rec)}
            className="p-3.5 rounded-xl bg-slate-50 hover:bg-orange-50/70 border border-slate-200/80 hover:border-orange-300 transition-all duration-200 cursor-pointer group"
          >
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
              {rec.title}
            </h4>
            <p className="mt-0.5 text-[11px] sm:text-xs text-slate-500 leading-relaxed">
              {rec.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
