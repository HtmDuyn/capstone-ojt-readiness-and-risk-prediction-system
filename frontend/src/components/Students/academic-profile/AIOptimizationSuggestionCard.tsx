import React from 'react';
import { ExternalLinkIcon, Sparkles } from 'lucide-react';

interface AIOptimizationSuggestionCardProps {
  onOptimizeClick?: () => void;
}

export const AIOptimizationSuggestionCard: React.FC<AIOptimizationSuggestionCardProps> = ({
  onOptimizeClick,
}) => {
  return (
    <div className="bg-[#111827] text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-800 flex flex-col justify-between relative overflow-hidden group h-full hover:shadow-2xl transition-all duration-300">
      {/* Soft Ambient Light Gradient inside Card */}
      <div className="absolute -top-12 -right-12 w-44 h-44 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500 font-outfit">
              GỢI Ý TỪ AI
            </span>
          </div>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
          </span>
        </div>

        {/* Content Paragraph */}
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-outfit">
          Dựa trên kết quả hiện tại, AI dự báo bạn có{' '}
          <span className="font-bold text-emerald-400">95% khả năng</span> được thực tập tại các đối tác{' '}
          <span className="font-semibold text-white">Tier-1</span> (FPT Software, KMS) trong kỳ OJT tới.
        </p>

        {/* Key Highlights / Insights */}
        <div className="pt-2 space-y-2">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-outfit">
            <span className="text-slate-400">Tiêu chí GPA chuyên ngành</span>
            <span className="font-bold text-emerald-400">Đạt chuẩn (3.42)</span>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-outfit">
            <span className="text-slate-400">Môn tiên quyết OJT</span>
            <span className="font-bold text-amber-400">Đang học SWP391</span>
          </div>
        </div>
      </div>

      {/* Footer Action Button */}
      <div className="relative z-10 pt-5 mt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onOptimizeClick}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 hover:border-orange-500/50 text-xs sm:text-sm font-bold text-orange-400 hover:text-orange-300 font-outfit transition-all group/btn cursor-pointer shadow-xs"
        >
          <span>Tối ưu hồ sơ OJT ngay</span>
          <ExternalLinkIcon
            size={15}
            className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform"
          />
        </button>
      </div>
    </div>
  );
};
