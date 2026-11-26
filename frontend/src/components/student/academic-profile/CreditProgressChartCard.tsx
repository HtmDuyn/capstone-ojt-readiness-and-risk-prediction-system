import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useReducedMotion } from '@/hooks/shared/useReducedMotion';

interface SemesterCredits { semester: string; credits: number; isCurrent?: boolean }

export function CreditProgressChartCard({ semesters }: { semesters: SemesterCredits[] }) {
  const reducedMotion = useReducedMotion();
  return <div className="card-glass flex h-full min-h-[360px] flex-col p-5 sm:p-6">
    <h3 className="mb-4 text-base font-bold tracking-tight text-slate-800 sm:text-lg">Tiến độ tín chỉ</h3>
    {!semesters.length ? <p className="text-sm text-slate-500">Chưa có dữ liệu tín chỉ theo kỳ.</p> :
      <ChartContainer config={{ credits: { label: 'Tín chỉ', color: '#3b82f6' } }} className="mt-auto h-64 w-full aspect-auto"
        role="img" aria-label={'Tín chỉ theo kỳ: ' + semesters.map(item => item.semester + ': ' + item.credits).join('; ')}>
        <BarChart accessibilityLayer data={semesters} margin={{ top: 12, left: -20, right: 8, bottom: 8 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="semester" axisLine={false} tickLine={false} tickMargin={10} minTickGap={12} />
          <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line"
            labelFormatter={(label, payload) => String(label) + (payload[0]?.payload?.isCurrent ? ' (Kỳ hiện tại)' : '')} />} />
          <Bar dataKey="credits" radius={[6, 6, 0, 0]} maxBarSize={36} isAnimationActive={!reducedMotion}>
            {semesters.map((item, index) => <Cell key={item.semester + index} fill={item.isCurrent ? '#f97316' : 'var(--color-credits)'} />)}
          </Bar>
        </BarChart>
      </ChartContainer>}
  </div>;
}
