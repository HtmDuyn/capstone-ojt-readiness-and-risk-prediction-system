import { useState } from 'react';

export interface OjtResultGroup {
  label: string;
  count: number;
  color: string;
  dotClass: string;
}

export function OjtResultDonut({ groups }: { groups: OjtResultGroup[] }) {
  const [active, setActive] = useState<number | null>(null);
  const total = groups.reduce((sum, group) => sum + group.count, 0);
  const radius = 66;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const percent = (count: number) => `${(count / total * 100).toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

  return <div className="flex flex-col items-center justify-center gap-5 sm:flex-row">
    <div className="relative h-44 w-44 shrink-0">
      <svg viewBox="0 0 176 176" className="h-full w-full -rotate-90 overflow-visible" role="img" aria-label={`Kết quả xét điều kiện OJT: ${groups.map(g => `${g.label} ${g.count} sinh viên`).join(', ')}`}>
        {groups.map((group, index) => {
          const length = group.count / total * circumference;
          const dashOffset = offset;
          offset += length;
          return group.count > 0 && <circle key={group.label} cx="88" cy="88" r={radius} fill="none" stroke={group.color} strokeWidth="32"
            strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-dashOffset}
            className="cursor-pointer transition-[stroke-width,filter] duration-200 ease-out hover:brightness-110 focus:brightness-110"
            style={{ strokeWidth: active === index ? 38 : 32 }}
            onMouseEnter={() => setActive(index)} onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(index)} onBlur={() => setActive(null)} tabIndex={0}>
            <title>{`${group.label}: ${group.count} sinh viên – ${percent(group.count)}`}</title>
          </circle>;
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-extrabold text-slate-800">{total.toLocaleString('vi-VN')}</span>
        <span className="text-[11px] text-slate-500">sinh viên đã xét</span>
      </div>
      {active !== null && <div role="tooltip" className="pointer-events-none absolute -bottom-3 left-1/2 z-10 w-max max-w-44 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-xs shadow-lg">
        <strong className="block text-slate-800">{groups[active].label}</strong>
        <span className="text-slate-600">{groups[active].count.toLocaleString('vi-VN')} sinh viên – {percent(groups[active].count)}</span>
      </div>}
    </div>
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
