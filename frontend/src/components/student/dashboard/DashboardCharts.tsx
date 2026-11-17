import { riskTheme, type RiskLevel } from '../ojt-risk/risk-ui';

const riskBands = [
  { level: 'LOW', label: 'Thấp', color: '#10b981', start: -180, end: -122, marker: -150 },
  { level: 'MEDIUM', label: 'Trung bình', color: '#f59e0b', start: -118, end: -62, marker: -90 },
  { level: 'HIGH', label: 'Cao', color: '#f43f5e', start: -58, end: 0, marker: -30 },
] as const;

function gaugePoint(angle: number) {
  const radians = angle * Math.PI / 180;
  return { x: 120 + 96 * Math.cos(radians), y: 112 + 96 * Math.sin(radians) };
}

export function RiskLevelChart({ level }: { level: RiskLevel }) {
  const active = riskBands.find(band => band.level === level);
  const marker = active ? gaugePoint(active.marker) : null;

  return <div className="mt-4">
    <svg viewBox="0 0 240 136" role="img" aria-label={`Mức cảnh báo AI: ${riskTheme[level].label}`} className="mx-auto w-full max-w-[240px]">
      {riskBands.map(band => {
        const start = gaugePoint(band.start), end = gaugePoint(band.end);
        return <path key={band.level} d={`M ${start.x} ${start.y} A 96 96 0 0 1 ${end.x} ${end.y}`}
          fill="none" stroke={active ? band.color : '#cbd5e1'} strokeWidth="18" strokeLinecap="round" opacity={!active || active.level === band.level ? 1 : 0.25} />;
      })}
      {marker && <circle cx={marker.x} cy={marker.y} r="10" fill={active?.color} stroke="white" strokeWidth="4" />}
      <text x="120" y="94" textAnchor="middle" className="fill-slate-500 text-[12px]">Mức cảnh báo AI</text>
      <text x="120" y="118" textAnchor="middle" className="fill-slate-900 text-[17px] font-bold">{active?.label ?? 'Chưa đủ dữ liệu'}</text>
    </svg>
    <div aria-hidden="true" className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-slate-600">
      {riskBands.map(band => <span key={band.level} className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ backgroundColor: band.color }} />{band.label}</span>)}
    </div>
  </div>;
}

export function CreditProgressChart({ percent }: { percent: number | null }) {
  const value = percent !== null && Number.isFinite(percent) ? Math.max(0, Math.min(100, percent)) : null;
  return <div className="relative mx-auto mt-4 size-40" role="img" aria-label={value === null ? 'Chưa đủ dữ liệu tiến độ tín chỉ' : `Đã hoàn thành ${value}% chương trình đào tạo`}>
    <svg viewBox="0 0 160 160" className="size-full -rotate-90" aria-hidden="true">
      <circle cx="80" cy="80" r="64" fill="none" stroke="#e2e8f0" strokeWidth="14" />
      {value !== null && value > 0 && <circle cx="80" cy="80" r="64" fill="none" stroke="#2563eb" strokeWidth="14"
        pathLength="100" strokeDasharray={`${value} ${100 - value}`} />}
    </svg>
    <div aria-hidden="true" className="absolute inset-0 flex flex-col items-center justify-center">
      <span className="text-3xl font-bold tabular-nums text-slate-900">{value === null ? '—' : `${value}%`}</span>
      <span className="mt-1 text-xs text-slate-500">{value === null ? 'Chưa đủ dữ liệu' : 'Hoàn thành'}</span>
    </div>
  </div>;
}
