import React from 'react';
import { ExternalLinkIcon, Sparkles } from 'lucide-react';

interface AIOptimizationSuggestionCardProps {
  onOptimizeClick?: () => void;
}

const INSIGHT_ROWS = [
  { label: 'Tiêu chí GPA chuyên ngành', value: 'Đạt chuẩn (3.42)', color: 'text-emerald-400' },
  { label: 'Môn tiên quyết OJT', value: 'Đang học SWP391', color: 'text-amber-400' },
] as const;

export const AIOptimizationSuggestionCard: React.FC<AIOptimizationSuggestionCardProps> = ({
  onOptimizeClick,
}) => {
  return (
    <div className="bg-[#111827] text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-800 flex flex-col relative overflow-hidden group h-full hover:shadow-2xl transition-all duration-300">
      {/* Ambient glows */}
      <div className="absolute -top-12 -right-12 w-44 h-44 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col flex-1 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-amber-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500 font-outfit">
              Gợi ý từ AI
            </span>
          </div>
          {/* Live indicator */}
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-orange-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
          </span>
        </div>

        {/* Content */}
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-outfit">
          Dựa trên kết quả hiện tại, AI dự báo bạn có{' '}
          <span className="font-bold text-emerald-400">95% khả năng</span> được thực tập tại các đối tác{' '}
          <span className="font-semibold text-white">Tier-1</span> (FPT Software, KMS) trong kỳ OJT tới.
        </p>

        {/* Insight Rows */}
        <div className="space-y-2">
          {INSIGHT_ROWS.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-outfit"
            >
              <span className="text-slate-400">{row.label}</span>
              <span className={`font-bold ${row.color}`}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* CTA */}
        <div className="pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onOptimizeClick}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-orange-600/20 hover:bg-orange-600/35 border border-orange-500/30 hover:border-orange-500/60 text-xs sm:text-sm font-bold text-orange-400 hover:text-orange-300 font-outfit transition-all group/btn cursor-pointer"
          >
            <span>Tối ưu hồ sơ OJT ngay</span>
            <ExternalLinkIcon
              size={14}
              className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform"
            />
          </button>
        </div>
      </div>
    </div>
  );
};
