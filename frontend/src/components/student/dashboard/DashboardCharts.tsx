import { Pie, PieChart } from 'recharts';
import { DonutChart } from '@/components/common/DonutChart';
import { ChartContainer } from '@/components/ui/chart';
import { useReducedMotion } from '@/hooks/shared/useReducedMotion';
import { riskTheme, type RiskLevel } from '../ojt-risk/risk-ui';

const riskBands = [
  { level: 'LOW', label: 'Thấp', color: '#10b981' },
  { level: 'MEDIUM', label: 'Trung bình', color: '#f59e0b' },
  { level: 'HIGH', label: 'Cao', color: '#f43f5e' },
] as const;

export function RiskLevelChart({ level }: { level: RiskLevel }) {
  const reducedMotion = useReducedMotion();
  const active = riskBands.find(band => band.level === level);
  // Equal sectors represent categories, rather than a numerical risk score.
  const data = riskBands.map(band => ({
    name: band.label, value: 1, fill: active ? band.color : '#cbd5e1',
    opacity: !active || band.level === level ? 1 : 0.2,
  }));
  return <div className="mt-4">
    <div className="relative mx-auto h-[136px] w-full max-w-[240px]">
      <ChartContainer config={{}} className="h-full w-full aspect-auto" role="img" aria-label={'Mức cảnh báo OJT: ' + riskTheme[level].label}>
        <PieChart accessibilityLayer>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="82%" innerRadius={78} outerRadius={98}
            startAngle={180} endAngle={0} paddingAngle={5} cornerRadius={6} stroke="none"
            isAnimationActive={!reducedMotion} animationDuration={650} />
        </PieChart>
      </ChartContainer>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-3 text-center">
        <p className="text-xs text-slate-500">Hiện tại</p>
        <p className="mt-1 text-base font-bold" style={{ color: active?.color ?? '#64748b' }}>{active?.label ?? 'Chưa đủ dữ liệu'}</p>
      </div>
    </div>
    <div aria-hidden="true" className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-slate-600">
      {riskBands.map(band => <span key={band.level} className={'inline-flex items-center gap-1.5 ' + (band.level === level ? 'font-semibold text-slate-900' : '')}><span className="size-2 rounded-full" style={{ backgroundColor: band.color }} />{band.label}</span>)}
    </div>
  </div>;
}

export function CreditProgressChart({ percent }: { percent: number | null }) {
  const value = percent !== null && Number.isFinite(percent) ? Math.max(0, Math.min(100, percent)) : null;
  return <DonutChart className="mx-auto size-36" segments={value === null ? [] : [
    { label: 'Đã tích lũy', value, color: '#2563eb' },
    { label: 'Còn lại', value: 100 - value, color: '#e2e8f0' },
  ]} label={value === null ? 'Chưa đủ dữ liệu tiến độ tín chỉ' : 'Đã hoàn thành ' + value + '% chương trình đào tạo'}>
    <span className="text-3xl font-bold tabular-nums text-slate-900">{value === null ? '—' : value + '%'}</span>
    <span className="mt-1 text-xs text-slate-500">{value === null ? 'Chưa đủ dữ liệu' : 'Hoàn thành'}</span>
  </DonutChart>;
}
