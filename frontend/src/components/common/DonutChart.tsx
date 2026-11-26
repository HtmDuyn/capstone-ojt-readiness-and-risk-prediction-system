import { useId, type ReactNode } from 'react';
import { Pie, PieChart } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { useReducedMotion } from '@/hooks/shared/useReducedMotion';
import { cn } from '@/lib/utils';

interface DonutSegment {
  label: string;
  value: number;
  color: string;
  gradientTo?: string;
}

export function DonutChart({ segments, children, label, className, innerRadius = '76%', unit = '', appearance = 'separated' }: {
  segments: DonutSegment[];
  children?: ReactNode;
  label: string;
  className?: string;
  innerRadius?: string;
  unit?: string;
  appearance?: 'separated' | 'continuous';
}) {
  const reducedMotion = useReducedMotion();
  const gradientId = `donut-gradient-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const safeValue = (value: number) => Number.isFinite(value) ? Math.max(0, value) : 0;
  const total = segments.reduce((sum, segment) => sum + safeValue(segment.value), 0);
  const config = Object.fromEntries(segments.map((segment, index) => [
    `segment${index}`, { label: segment.label, color: segment.color },
  ])) satisfies ChartConfig;
  const data = total > 0
    ? segments.map((segment, index) => ({ name: `segment${index}`, value: safeValue(segment.value), fill: segment.gradientTo ? `url(#${gradientId}-${index})` : `var(--color-segment${index})` }))
    : [{ name: 'empty', value: 1, fill: '#e2e8f0' }];

  return <div className={cn('relative size-full min-w-0', className)}>
    <ChartContainer config={config} className="aspect-square size-full" role="img" aria-label={label}>
      <PieChart accessibilityLayer>
        <defs>
          {segments.map((segment, index) => segment.gradientTo && <linearGradient key={index} id={`${gradientId}-${index}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={segment.color} />
            <stop offset="100%" stopColor={segment.gradientTo} />
          </linearGradient>)}
        </defs>
        {total > 0 && <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel
          formatter={(value, name) => <div className="flex w-full items-center justify-between gap-4">
            <span className="max-w-52 break-words text-slate-500">{config[String(name)]?.label ?? name}</span>
            <span className="whitespace-nowrap font-semibold tabular-nums text-slate-900">
              {Number(value).toLocaleString('vi-VN')}{unit && ` ${unit}`} · {Math.round(Number(value) / total * 100)}%
            </span>
          </div>} />} />}
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={innerRadius} outerRadius="94%"
          startAngle={90} endAngle={-270} stroke="white" strokeWidth={appearance === 'continuous' ? 0 : 3}
          paddingAngle={appearance === 'separated' && total > 0 && segments.filter(segment => segment.value > 0).length > 1 ? 2 : 0}
          cornerRadius={appearance === 'continuous' ? 0 : 5} isAnimationActive={!reducedMotion} animationDuration={700} />
      </PieChart>
    </ChartContainer>
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
  </div>;
}
