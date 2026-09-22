import React, { useState, useMemo } from 'react';
import { mockSemesterCredits } from '@/data/student/mockAcademicProfileData';
import { TrendUpIcon, ClockIcon, BookOpenIcon, CheckCircleIcon } from '@/components/common/icons/AppIcons';

export const CreditProgressChartCard: React.FC = () => {
  const [viewMode, setViewMode] = useState<'bar' | 'cumulative'>('bar');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const maxBarCredits = 25;
  const maxCumulativeCredits = 145;
  const totalEarned = 114;
  const targetCredits = 145;
  const completionPercentage = Math.round((totalEarned / targetCredits) * 1000) / 10;

  // Chart dimensions configuration
  const chartHeight = 180;
  const chartWidth = 500;
  const paddingX = 35;
  const stepX = (chartWidth - paddingX * 2) / (mockSemesterCredits.length - 1);

  // Memoize SVG curve calculation
  const { points, pathD, areaD } = useMemo(() => {
    const pts = mockSemesterCredits.map((item, idx) => {
      const x = paddingX + idx * stepX;
      const y = chartHeight - (item.cumulative / maxCumulativeCredits) * chartHeight * 0.7 - 25;
      return { x, y, ...item };
    });

    const path = pts.reduce((acc, pt, idx, arr) => {
      if (idx === 0) return `M ${pt.x},${pt.y}`;
      const prev = arr[idx - 1];
      const cx1 = prev.x + stepX * 0.5;
      const cy1 = prev.y;
      const cx2 = pt.x - stepX * 0.5;
      const cy2 = pt.y;
      return `${acc} C ${cx1},${cy1} ${cx2},${cy2} ${pt.x},${pt.y}`;
    }, '');

    const area = `${path} L ${pts[pts.length - 1].x},${chartHeight} L ${pts[0].x},${chartHeight} Z`;

    return { points: pts, pathD: path, areaD: area };
  }, [stepX]);

  return (
    <div className="card-glass p-5 sm:p-6 flex flex-col justify-between h-full rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      {/* Top Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2 relative z-20">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-800 font-outfit tracking-tight">
                Tiến độ tín chỉ
              </h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                <TrendUpIcon size={12} className="text-amber-700" />
                {completionPercentage}%
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Tích lũy <strong className="text-slate-800 font-bold">{totalEarned}</strong> / {targetCredits} tín chỉ (Kỳ 1 - Kỳ 6)
            </p>
          </div>

          {/* Toggle View Mode Buttons */}
          <div className="flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 self-start sm:self-auto text-xs font-semibold font-outfit relative z-20">
            <button
              type="button"
              onClick={() => setViewMode('bar')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'bar'
                  ? 'bg-white text-amber-800 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Theo từng kỳ
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cumulative')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'cumulative'
                  ? 'bg-white text-amber-800 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Lũy tiến tích lũy
            </button>
          </div>
        </div>

        {/* Dynamic Chart Area with Sufficient Top Clearance (pt-10) */}
        <div className="w-full flex-1 flex flex-col justify-end pt-10 sm:pt-12 relative min-h-[220px]">
          {viewMode === 'bar' ? (
            /* Bar Chart View */
            <div className="w-full flex flex-col h-48 sm:h-52 justify-between relative pt-4">
              <div className="relative w-full h-full flex flex-col justify-end">
                {/* Benchmark line indicator - Aligned to LEFT (justify-start) to avoid covering right-hand bars */}
                <div
                  className="absolute left-0 right-0 border-b border-dashed border-orange-300/80 text-[10px] font-semibold text-amber-800 flex justify-start pl-2 z-20 pointer-events-none"
                  style={{ bottom: `${(20 / maxBarCredits) * 100}%` }}
                >
                  <span className="bg-amber-100/95 px-2 py-0.5 rounded-md text-[10px] font-bold text-amber-900 shadow-2xs border border-amber-300 font-outfit backdrop-blur-xs -translate-y-1/2">
                    Định mức 20 TC
                  </span>
                </div>

                <div className="w-full flex items-end justify-between gap-2 sm:gap-4 px-1 sm:px-3 z-10 h-full">
                  {mockSemesterCredits.map((item, idx) => {
                    const heightPercent = Math.min(100, (item.credits / maxBarCredits) * 100);
                    const isCurrent = idx === mockSemesterCredits.length - 1;
                    const isHovered = hoveredIdx === idx;

                    return (
                      <div
                        key={item.semester}
                        onMouseEnter={() => setHoveredIdx(idx)}
                        onMouseLeave={() => setHoveredIdx(null)}
                        className="flex-1 flex flex-col items-center group relative cursor-pointer h-full justify-end"
                      >
                        {/* Tooltip positioned nicely without hitting header */}
                        <div
                          className={`absolute -top-11 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white text-[11px] font-bold py-1 px-2.5 rounded-xl shadow-xl pointer-events-none whitespace-nowrap transition-all duration-200 z-30 backdrop-blur-xs ${
                            isHovered || isCurrent ? 'opacity-100 scale-100 -translate-y-0.5' : 'opacity-0 scale-95'
                          }`}
                        >
                          <p>{item.semester}: <span className="text-amber-300">{item.credits} Tín chỉ</span></p>
                          <p className="text-[10px] text-slate-300 font-normal">GPA: {item.gpa}</p>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/95" />
                        </div>

                        {/* Bar Container */}
                        <div className="w-full max-w-[38px] sm:max-w-[46px] bg-slate-100/90 rounded-t-xl overflow-hidden flex items-end h-[80%] border border-slate-200/60 shadow-2xs group-hover:border-orange-300 transition-colors">
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className={`w-full transition-all duration-500 ease-out rounded-t-lg relative flex items-start justify-center pt-1 ${
                              isCurrent
                                ? 'bg-gradient-to-t from-orange-500 via-amber-500 to-amber-400 shadow-md shadow-orange-500/30'
                                : 'bg-gradient-to-t from-amber-600/90 via-orange-400/90 to-amber-300/90 group-hover:from-amber-600 group-hover:to-amber-400'
                            }`}
                          >
                            <span className="text-[10px] sm:text-xs font-extrabold text-white font-outfit drop-shadow-xs">
                              {item.credits}
                            </span>
                          </div>
                        </div>

                        {/* Semester Label */}
                        <span
                          className={`mt-2 text-xs font-bold font-outfit transition-colors ${
                            isCurrent
                              ? 'text-amber-800 font-extrabold scale-105'
                              : isHovered
                              ? 'text-slate-900'
                              : 'text-slate-500'
                          }`}
                        >
                          {item.semester}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Cumulative SVG Area Chart View */
            <div className="w-full h-48 sm:h-52 flex flex-col justify-between relative pt-2">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.01" />
                  </linearGradient>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#d97706" />
                    <stop offset="50%" stopColor="#ea580c" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                {[30, 60, 90, 120, 145].map((val) => {
                  const y = chartHeight - (val / maxCumulativeCredits) * chartHeight * 0.7 - 25;
                  return (
                    <g key={val}>
                      <line x1="10" y1={y} x2={chartWidth - 10} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth="1" />
                      <text x={chartWidth - 5} y={y + 3} textAnchor="start" className="text-[9px] fill-slate-400 font-semibold font-outfit">
                        {val} TC
                      </text>
                    </g>
                  );
                })}

                {/* Area Path */}
                <path d={areaD} fill="url(#areaGradient)" className="transition-all duration-500 ease-out" />

                {/* Line Path */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="url(#lineGradient)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  className="transition-all duration-500 ease-out"
                />

                {/* Data Points */}
                {points.map((pt, idx) => {
                  const isCurrent = idx === points.length - 1;
                  const isHovered = hoveredIdx === idx;
                  return (
                    <g
                      key={pt.semester}
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      className="cursor-pointer group"
                    >
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered || isCurrent ? 7 : 5}
                        className={`transition-all duration-300 ${
                          isCurrent
                            ? 'fill-amber-500 stroke-amber-200 stroke-4'
                            : isHovered
                            ? 'fill-orange-500 stroke-orange-100 stroke-4'
                            : 'fill-white stroke-orange-500 stroke-2'
                        }`}
                      />
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered || isCurrent ? 5 : 3.5}
                        className={isCurrent ? 'fill-orange-600' : isHovered ? 'fill-orange-600' : 'fill-orange-500'}
                      />

                      <text
                        x={pt.x}
                        y={pt.y - 12}
                        textAnchor="middle"
                        className={`text-[10px] font-extrabold font-outfit transition-all ${
                          isCurrent ? 'fill-amber-800 text-[11px]' : 'fill-slate-700'
                        }`}
                      >
                        {pt.cumulative} TC
                      </text>

                      <text
                        x={pt.x}
                        y={chartHeight + 14}
                        textAnchor="middle"
                        className={`text-[11px] font-bold font-outfit ${
                          isCurrent ? 'fill-amber-800 font-extrabold' : 'fill-slate-500'
                        }`}
                      >
                        {pt.semester}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Summary Bar */}
      <div className="mt-4 pt-3 border-t border-slate-200/60 grid grid-cols-3 gap-2 text-center bg-slate-50/70 rounded-xl p-2.5">
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center gap-1 text-slate-500 text-[11px] font-medium">
            <BookOpenIcon size={12} className="text-amber-600" />
            <span>TB/Kỳ</span>
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-800 font-outfit mt-0.5">19.0 TC</span>
        </div>
        <div className="flex flex-col items-center justify-center border-x border-slate-200/60 px-1">
          <div className="flex items-center gap-1 text-slate-500 text-[11px] font-medium">
            <CheckCircleIcon size={12} className="text-emerald-600" />
            <span>Tối đa</span>
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-800 font-outfit mt-0.5">20 TC/Kỳ</span>
        </div>
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center gap-1 text-slate-500 text-[11px] font-medium">
            <ClockIcon size={12} className="text-blue-600" />
            <span>Còn lại</span>
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-800 font-outfit mt-0.5">2 Học kỳ</span>
        </div>
      </div>
    </div>
  );
};

export default CreditProgressChartCard;
