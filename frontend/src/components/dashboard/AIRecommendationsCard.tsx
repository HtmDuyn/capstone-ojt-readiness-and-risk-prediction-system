import React from 'react';
import { LightningIcon } from './icons/DashboardIcons';
import type { AIRecommendation } from '../../types/studentDashboardTypes';

interface AIRecommendationsCardProps {
  recommendations: AIRecommendation[];
  onConsultAction?: (rec: AIRecommendation) => void;
}

export const AIRecommendationsCard: React.FC<AIRecommendationsCardProps> = ({
  recommendations,
  onConsultAction,
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#1d6bf3] via-[#0060ef] to-[#0252cf] p-5 sm:p-6 text-white shadow-lg shadow-blue-600/20">
      {/* Glow decorative pattern */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />

      {/* Card Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="p-1.5 rounded-lg bg-white/20 text-yellow-300">
          <LightningIcon size={18} />
        </span>
        <h3 className="text-base font-bold text-white font-outfit tracking-tight">
          Khuyến nghị từ AI
        </h3>
      </div>

      {/* Recommendations List */}
      <div className="space-y-3">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            onClick={() => onConsultAction && onConsultAction(rec)}
            className="p-3.5 rounded-xl bg-white/12 hover:bg-white/18 border border-white/15 backdrop-blur-xs transition-all duration-200 cursor-pointer group"
          >
            <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-200 transition-colors">
              {rec.title}
            </h4>
            <p className="mt-1 text-[11px] sm:text-xs text-blue-100 leading-relaxed font-normal">
              {rec.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
