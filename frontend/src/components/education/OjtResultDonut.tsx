import { DonutChart } from '@/components/common/DonutChart';

export interface OjtResultGroup {
  label: string;
  count: number;
  color: string;
  dotClass: string;
}

export function OjtResultDonut({ groups }: { groups: OjtResultGroup[] }) {
  const total = groups.reduce((sum, group) => sum + group.count, 0);
  const percent = (count: number) => `${((total > 0 ? count / total * 100 : 0)).toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

  return <div className="flex flex-col items-center justify-center gap-5 sm:flex-row">
    <DonutChart className="size-44 shrink-0" innerRadius="64%"
      segments={groups.map(group => ({ label: group.label, value: group.count, color: group.color }))}
      label={'Kết quả xét điều kiện OJT: ' + groups.map(group => group.label + ': ' + group.count + ' sinh viên').join(', ')} unit="sinh viên">
      <span className="text-2xl font-extrabold text-slate-800">{total.toLocaleString('vi-VN')}</span>
      <span className="text-[11px] text-slate-500">sinh viên đã xét</span>
    </DonutChart>
    <div className="w-full max-w-56 space-y-3">
      {groups.map(group => <div key={group.label} className="flex items-start gap-2.5 text-xs">
        <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${group.dotClass}`} aria-hidden="true" />
        <div className="min-w-0">
          <p className="font-medium leading-5 text-slate-600">{group.label}</p>
          <p className="text-base font-bold leading-6 text-slate-800">{group.count.toLocaleString('vi-VN')} sinh viên</p>
          <p className="leading-5 text-slate-500">{percent(group.count)}</p>
        </div>
      </div>)}
    </div>
  </div>;
}
