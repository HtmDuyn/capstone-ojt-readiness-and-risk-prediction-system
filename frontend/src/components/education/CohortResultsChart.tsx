import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useReducedMotion } from '@/hooks/shared/useReducedMotion';

const config = {
  eligible: { label: 'Đủ điều kiện', color: '#22c55e' },
  ineligible: { label: 'Chưa đủ điều kiện', color: '#f87171' },
  reviewRequired: { label: 'Cần đối soát', color: '#fb923c' },
};
interface CohortResult {
  label: string;
  eligible: number;
  ineligible: number;
  reviewRequired: number;
}

export function CohortResultsChart({ results }: { results: CohortResult[] }) {
  const reducedMotion = useReducedMotion();
  const data = results.map(row => ({ ...row, total: row.eligible + row.ineligible + row.reviewRequired }));
  return <div className="overflow-x-auto">
    <ChartContainer config={config} className="h-[270px] w-full aspect-auto"
      style={{ minWidth: Math.max(280, results.length * 88) }} role="img"
      aria-label={'Kết quả xét OJT theo khóa: ' + results.map(row => `${row.label}: ${row.eligible} đủ điều kiện, ${row.ineligible} chưa đủ điều kiện, ${row.reviewRequired} cần đối soát`).join('; ')}>
      <BarChart accessibilityLayer data={data} margin={{ top: 24, right: 12, left: -20, bottom: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="label" axisLine={false} tickLine={false} tickMargin={10} />
        <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
        <Bar dataKey="eligible" stackId="results" fill="var(--color-eligible)" maxBarSize={44} isAnimationActive={!reducedMotion} />
        <Bar dataKey="ineligible" stackId="results" fill="var(--color-ineligible)" maxBarSize={44} isAnimationActive={!reducedMotion} />
        <Bar dataKey="reviewRequired" stackId="results" fill="var(--color-reviewRequired)" radius={[5, 5, 0, 0]} maxBarSize={44} isAnimationActive={!reducedMotion}>
          <LabelList dataKey="total" position="top" className="fill-slate-600 text-xs font-semibold" />
        </Bar>
      </BarChart>
    </ChartContainer>
  </div>;
}
