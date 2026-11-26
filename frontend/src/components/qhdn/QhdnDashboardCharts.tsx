import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const palette = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-5)', 'var(--chart-4)'];
const pipelineConfig = { value: { label: 'Số lượng sinh viên', color: 'var(--chart-1)' } };
const quotaConfig = {
  acceptedCount: { label: 'Đã tiếp nhận', color: 'var(--chart-1)' },
  availableQuota: { label: 'Slot còn lại', color: '#c7d2fe' },
};
const pipelineTicks: Record<string, [string, string]> = {
  'Đủ điều kiện OJT': ['Đủ điều kiện', 'OJT'],
  'Đã chốt DN': ['Đã chốt', 'DN'],
  'Chờ duyệt': ['Chờ', 'duyệt'],
  'Đang thực tập': ['Đang', 'thực tập'],
  'Hoàn thành': ['Hoàn', 'thành'],
};

export function OjtPipelineChart({ stats, reducedMotion }: {
  stats: Record<'handedOff' | 'assigned' | 'waiting' | 'inProgress' | 'completed', number | null>;
  reducedMotion: boolean;
}) {
  const data = [
    { label: 'Đủ điều kiện OJT', value: stats.handedOff },
    { label: 'Đã chốt DN', value: stats.assigned },
    { label: 'Chờ duyệt', value: stats.waiting },
    { label: 'Đang thực tập', value: stats.inProgress },
    { label: 'Hoàn thành', value: stats.completed },
  ];
  return <ChartContainer config={pipelineConfig} className="h-full w-full aspect-auto" role="img"
    aria-label={'Tiến độ OJT: ' + data.map(item => `${item.label}: ${item.value ?? 'chưa có dữ liệu'}`).join('; ')}>
    <BarChart accessibilityLayer data={data} margin={{ top: 28, left: -18, right: 12, bottom: 8 }}>
      <CartesianGrid vertical={false} strokeDasharray="3 3" />
      <XAxis dataKey="label" axisLine={false} tickLine={false} tickMargin={12} interval={0} height={44}
        tick={({ x, y, payload }) => <text x={x} y={y} textAnchor="middle" className="fill-slate-500 text-[10px]">
          {(pipelineTicks[String(payload.value)] ?? [String(payload.value), '']).map((line, index) => <tspan key={index} x={x} dy={index === 0 ? 4 : 14}>{line}</tspan>)}
        </text>} />
      <YAxis axisLine={false} tickLine={false} allowDecimals={false} tickMargin={8} />
      <ChartTooltip cursor={{ fill: '#eef2ff', radius: 8 }} content={<ChartTooltipContent indicator="line"
        formatter={(value, _name, item) => <div className="grid gap-1">
          <span className="font-semibold">{Number(value).toLocaleString('vi-VN')} sinh viên</span>
          {item.payload?.label === 'Hoàn thành' && <span className="max-w-60 text-slate-500">Đã có điểm tổng kết doanh nghiệp hoặc đã hoàn thành hồ sơ thực tập.</span>}
        </div>} />} />
      <Bar dataKey="value" radius={[7, 7, 0, 0]} maxBarSize={48} isAnimationActive={!reducedMotion} animationDuration={700}>
        {data.map((item, index) => <Cell key={item.label} fill={palette[index]} />)}
        <LabelList dataKey="value" position="top" className="fill-slate-600 text-xs font-semibold" />
      </Bar>
    </BarChart>
  </ChartContainer>;
}

export function EnterpriseQuotaChart({ partners, reducedMotion }: {
  partners: { id: number; code: string; name: string; acceptedCount: number; availableQuota: number; totalQuota: number }[];
  reducedMotion: boolean;
}) {
  if (!partners.length) return <p className="flex h-full items-center justify-center text-sm text-slate-500">Chưa có dữ liệu chỉ tiêu doanh nghiệp cho kỳ này.</p>;
  return <ChartContainer config={quotaConfig} className="h-full w-full aspect-auto" role="img"
    aria-label={'Chỉ tiêu doanh nghiệp: ' + partners.map(company => `${company.name}: tiếp nhận ${company.acceptedCount}, chỉ tiêu ${company.totalQuota}, còn ${company.availableQuota}`).join('; ')}>
    <BarChart accessibilityLayer data={partners} layout="vertical" margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
      <CartesianGrid horizontal={false} strokeDasharray="3 3" />
      <XAxis type="number" axisLine={false} tickLine={false} allowDecimals={false} />
      <YAxis type="category" dataKey="id" width={80} axisLine={false} tickLine={false} tickMargin={8} fontSize={10}
        tickFormatter={id => { const company = partners.find(item => item.id === id); const text = company?.code || company?.name || ''; return text.length > 11 ? `${text.slice(0, 10)}…` : text; }} />
      <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line"
        labelFormatter={(_label, payload) => payload[0]?.payload?.name ?? ''} />} />
      <ChartLegend content={<ChartLegendContent />} />
      <Bar dataKey="acceptedCount" stackId="quota" fill="var(--color-acceptedCount)" radius={[4, 0, 0, 4]} maxBarSize={22}
        isAnimationActive={!reducedMotion} animationDuration={700} />
      <Bar dataKey="availableQuota" stackId="quota" fill="var(--color-availableQuota)" radius={[0, 4, 4, 0]} maxBarSize={22}
        isAnimationActive={!reducedMotion} animationDuration={700} />
    </BarChart>
  </ChartContainer>;
}
