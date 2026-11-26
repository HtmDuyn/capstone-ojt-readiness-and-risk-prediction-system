import { useId } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const pipelineConfig = { value: { label: 'Số lượng sinh viên', color: '#38bdf8' } };
const quotaConfig = {
  totalQuota: { label: 'Tổng chỉ tiêu', color: '#0ea5e9' },
  acceptedCount: { label: 'Đã tiếp nhận', color: '#2563eb' },
  availableQuota: { label: 'Slot còn lại', color: '#7dd3fc' },
};
const pipelineTicks: Record<string, [string, string]> = {
  'Từ chối': ['Từ', 'chối'],
  'Đã chốt DN': ['Đã chốt', 'DN'],
  'Chờ duyệt': ['Chờ', 'duyệt'],
  'Đang thực tập': ['Đang', 'thực tập'],
  'Hoàn thành': ['Hoàn', 'thành'],
};

export function OjtPipelineChart({ stats, reducedMotion }: {
  stats: Record<'rejected' | 'assigned' | 'waiting' | 'inProgress' | 'completed', number | null>;
  reducedMotion: boolean;
}) {
  const gradientId = `pipeline-gradient-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const data = [
    { label: 'Từ chối', value: stats.rejected },
    { label: 'Đã chốt DN', value: stats.assigned },
    { label: 'Chờ duyệt', value: stats.waiting },
    { label: 'Đang thực tập', value: stats.inProgress },
    { label: 'Hoàn thành', value: stats.completed },
  ];
  return <ChartContainer config={pipelineConfig} className="h-full w-full aspect-auto" role="img"
    aria-label={'Tiến độ OJT: ' + data.map(item => `${item.label}: ${item.value ?? 'chưa có dữ liệu'}`).join('; ')}>
    <BarChart accessibilityLayer data={data} margin={{ top: 28, left: -18, right: 12, bottom: 8 }}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="45%" stopColor="#e0f2fe" />
          <stop offset="100%" stopColor="#fed7aa" />
        </linearGradient>
      </defs>
      <CartesianGrid vertical={false} stroke="#e0f2fe" strokeDasharray="3 3" />
      <XAxis dataKey="label" axisLine={false} tickLine={false} tickMargin={12} interval={0} height={44}
        tick={({ x, y, payload }) => <text x={x} y={y} textAnchor="middle" className="fill-slate-500 text-[10px]">
          {(pipelineTicks[String(payload.value)] ?? [String(payload.value), '']).map((line, index) => <tspan key={index} x={x} dy={index === 0 ? 4 : 14}>{line}</tspan>)}
        </text>} />
      <YAxis axisLine={false} tickLine={false} allowDecimals={false} tickMargin={8} />
      <ChartTooltip cursor={{ fill: '#f0f9ff', radius: 8 }} content={<ChartTooltipContent indicator="line"
        formatter={(value, _name, item) => <div className="grid gap-1">
          <span className="font-semibold">{Number(value).toLocaleString('vi-VN')} sinh viên</span>
          {item.payload?.label === 'Hoàn thành' && <span className="max-w-60 text-slate-500">Đã có điểm tổng kết doanh nghiệp hoặc đã hoàn thành hồ sơ thực tập.</span>}
        </div>} />} />
      <Bar dataKey="value" fill={`url(#${gradientId})`} radius={[7, 7, 0, 0]} maxBarSize={48} isAnimationActive={!reducedMotion} animationDuration={700}>
        <LabelList dataKey="value" position="top" className="fill-slate-600 text-xs font-semibold" />
      </Bar>
    </BarChart>
  </ChartContainer>;
}

export function EnterpriseQuotaChart({ partners, reducedMotion }: {
  partners: { id: number; code: string; name: string; acceptedCount: number; availableQuota: number; totalQuota: number }[];
  reducedMotion: boolean;
}) {
  const gradientId = `galaxy-quota-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  if (!partners.length) return <p className="flex h-full items-center justify-center text-sm text-slate-500">Chưa có dữ liệu chỉ tiêu doanh nghiệp cho kỳ này.</p>;
  return <ChartContainer config={quotaConfig} className="h-full w-full aspect-auto" role="img"
    aria-label={'Chỉ tiêu doanh nghiệp: ' + partners.map(company => `${company.name}: tiếp nhận ${company.acceptedCount}, chỉ tiêu ${company.totalQuota}, còn ${company.availableQuota}`).join('; ')}>
    <AreaChart accessibilityLayer data={partners} margin={{ top: 16, right: 16, left: -20, bottom: 8 }}>
      <defs>
        <linearGradient id={`${gradientId}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.4} />
          <stop offset="55%" stopColor="#7dd3fc" stopOpacity={0.2} />
          <stop offset="100%" stopColor="#7dd3fc" stopOpacity={0.03} />
        </linearGradient>
      </defs>
      <CartesianGrid vertical={false} stroke="#e0f2fe" strokeDasharray="3 3" />
      <XAxis dataKey="id" axisLine={false} tickLine={false} tickMargin={10} fontSize={10} minTickGap={12} padding={{ left: 12, right: 12 }}
        tickFormatter={id => { const company = partners.find(item => item.id === id); const text = company?.code || company?.name || ''; return text.length > 11 ? `${text.slice(0, 10)}…` : text; }} />
      <YAxis axisLine={false} tickLine={false} allowDecimals={false} tickMargin={8} />
      <ChartTooltip cursor={{ stroke: '#38bdf8', strokeDasharray: '4 4', strokeWidth: 1 }} content={<ChartTooltipContent
        labelFormatter={(_label, payload) => payload[0]?.payload?.name ?? ''}
        formatter={(_value, _name, item) => <div className="grid min-w-44 gap-2">
          {(['totalQuota', 'acceptedCount', 'availableQuota'] as const).map(key => <div key={key} className="flex items-center justify-between gap-5">
            <span className="flex items-center gap-2 text-slate-500"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: quotaConfig[key].color }} />{quotaConfig[key].label}</span>
            <span className="font-semibold tabular-nums text-slate-900">{Number(item.payload[key]).toLocaleString('vi-VN')}</span>
          </div>)}
        </div>} />} />
      <ChartLegend content={<ChartLegendContent />} />
      <Area type="monotone" dataKey="totalQuota" stroke="var(--color-totalQuota)" strokeWidth={2}
        fill={`url(#${gradientId}-fill)`} fillOpacity={1} baseValue={0}
        dot={{ r: 3, strokeWidth: 2, stroke: 'var(--color-totalQuota)', fill: '#fff' }}
        activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: 'var(--color-totalQuota)' }}
        isAnimationActive={!reducedMotion} animationDuration={700} />
    </AreaChart>
  </ChartContainer>;
}
