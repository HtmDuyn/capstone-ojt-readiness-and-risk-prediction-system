import React, { useState } from 'react';
import { Bar, CartesianGrid, Cell, ComposedChart, Line, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useReducedMotion } from "@/hooks/shared/useReducedMotion";
import type { SemesterProgress } from "@/types/student/studentDashboardTypes";

interface ProgressChartCardProps {
  data: SemesterProgress[];
}

export const ProgressChartCard: React.FC<ProgressChartCardProps> = ({ data }) => {
  const [filterMode, setFilterMode] = useState<'6months' | 'all'>('all');
  const reducedMotion = useReducedMotion();

  // Lọc dữ liệu theo chế độ: 6 tháng (3 kỳ gần nhất) hoặc toàn khóa
  const displayItems = filterMode === '6months' ? data.slice(-3) : data;

  return (
    <div className="card-glass p-5 sm:p-6">
      {/* Card Header & Toggle Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight font-outfit">
            Tiến độ học tập & Tín chỉ tích lũy
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Biểu đồ kết hợp tín chỉ hoàn thành và xu hướng điểm trung bình GPA
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-orange-50/80 p-1 rounded-xl text-xs font-semibold border border-orange-100/80">
          <button
            type="button"
            onClick={() => setFilterMode('6months')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filterMode === '6months'
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20 font-bold'
              : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            6 tháng gần nhất
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filterMode === 'all'
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20 font-bold'
              : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            Toàn khóa
          </button>
        </div>
      </div>

      {/* Credits and GPA chart */}
      <div className="relative w-full h-64 sm:h-72 pt-2">
        <ChartContainer config={{ credits: { label: 'Tín chỉ', color: '#f97316' }, gpa: { label: 'GPA', color: '#10b981' } }} className="h-full w-full aspect-auto" role="img" aria-label="Tín chỉ và GPA theo học kỳ">
          <ComposedChart accessibilityLayer data={displayItems} margin={{ top: 12, right: 4, left: -16, bottom: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="semesterName" axisLine={false} tickLine={false} tickMargin={10} minTickGap={18} />
            <YAxis yAxisId="credits" axisLine={false} tickLine={false} allowDecimals={false} tickFormatter={value => value + ' TC'} />
            <YAxis yAxisId="gpa" orientation="right" domain={[0, 4]} axisLine={false} tickLine={false} width={35} tickFormatter={value => Number(value).toFixed(1)} />
            <ChartTooltip content={<ChartTooltipContent indicator="line"
              labelFormatter={(label, payload) => { const item = payload[0]?.payload; return String(label) + (item?.isCurrent ? ' (Kỳ hiện tại)' : item?.isForecast ? ' (Dự kiến OJT)' : ''); }}
              formatter={(value, name) => <div className="flex w-full justify-between gap-6"><span className="text-slate-500">{name === 'gpa' ? 'GPA' : 'Tín chỉ'}</span><strong>{name === 'gpa' ? Number(value).toFixed(2) + ' / 4.00' : value + ' tín chỉ'}</strong></div>} />} />
            <Bar dataKey="credits" yAxisId="credits" radius={[6, 6, 0, 0]} maxBarSize={36} isAnimationActive={!reducedMotion}>
              {displayItems.map(item => <Cell key={item.id} fill={item.isCurrent ? '#f97316' : item.isForecast ? '#e9d5ff' : '#fed7aa'} stroke={item.isForecast ? '#c084fc' : 'none'} strokeDasharray={item.isForecast ? '4 3' : undefined} />)}
            </Bar>
            <Line dataKey="gpa" yAxisId="gpa" type="monotone" stroke="var(--color-gpa)" strokeWidth={2.5} dot={{ r: 4, fill: 'white', strokeWidth: 2 }} activeDot={{ r: 6 }} isAnimationActive={!reducedMotion} />
          </ComposedChart>
        </ChartContainer>
      </div>

      {/* Interactive Legend & Indicator Summary */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Legend Items */}
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#fed7aa] border border-orange-300" />
            <span className="text-slate-600 font-medium">Kỳ đã qua</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#f97316]" />
            <span className="text-slate-900 font-bold">Kỳ hiện tại</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs border border-dashed border-purple-400 bg-purple-100/50" />
            <span className="text-purple-600 font-medium">Dự báo OJT</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 bg-[#10b981] relative flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
            </span>
            <span className="text-emerald-600 font-bold">GPA học kỳ</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 italic">
          Cập nhật từ hệ thống đào tạo FPT
        </div>
      </div>
    </div>
  );
};
