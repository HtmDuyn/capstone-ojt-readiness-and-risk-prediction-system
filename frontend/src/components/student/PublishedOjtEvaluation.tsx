import { Building2, CheckCircle2, MessageSquareText } from 'lucide-react';
import { dateText } from '@/components/student/PortalUI';
import type { OjtResult } from '@/types/student/portal';

const scoreValue = (value: number | null | undefined) => value == null || !Number.isFinite(Number(value)) ? null : Number(value);
const scoreText = (value: number | null | undefined) => scoreValue(value)?.toFixed(2) ?? '—';
// Continuous visual scale only; the published score and outcome are unchanged.
const scoreColor = (value: number | null | undefined) => {
  const score = scoreValue(value);
  return score === null ? '#64748b' : `hsl(${Math.max(0, Math.min(10, score)) * 14.5} 62% 35%)`;
};

export function PublishedOjtEvaluation({ result }: { result: OjtResult }) {
  const criteria = result.template?.criteria?.length
    ? result.template.criteria.map(field => ({ ...field, score: result.scoreDetails?.[field.key] }))
    : [
      { key: 'completionScore', label: 'Kỹ năng chuyên ngành', weight: null, score: result.completionScore },
      { key: 'skillScore', label: 'Kỹ năng mềm', weight: null, score: result.skillScore },
      { key: 'attitudeScore', label: 'Thái độ', weight: null, score: result.attitudeScore },
    ];
  const comments = result.comments?.trim();

  return <article aria-label={`Đánh giá OJT · ${result.enterpriseName} · ${result.semesterCode}`} className="space-y-5 border-b border-slate-200 py-4 first:pt-0 last:border-b-0 last:pb-0">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500"><Building2 size={20} aria-hidden="true"/></span>
        <div className="min-w-0">
          <h3 className="break-words text-base font-semibold text-slate-900">{result.enterpriseName}</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">QHDN công bố: {dateText(result.publishedAt)}</p>
        </div>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"><CheckCircle2 size={13} aria-hidden="true"/>Đã công bố</span>
    </header>

    <div className="grid gap-5 border-t border-slate-100 pt-5 md:grid-cols-[minmax(0,3fr)_minmax(0,7fr)] md:gap-6">
      <div className="flex flex-col items-center justify-center gap-3 border-b border-slate-100 pb-4 text-center md:border-b-0 md:border-r md:pb-0 md:pr-6">
        <p className="text-sm font-medium text-slate-600">Điểm tổng OJT</p>
        <p className="flex items-baseline gap-1.5"><strong className="text-5xl font-bold tracking-tight tabular-nums sm:text-6xl" style={{ color: scoreColor(result.overallScore) }}>{scoreText(result.overallScore)}</strong><span className="text-base text-slate-400">/10</span></p>
      </div>
      <div className="min-w-0">
        <h4 className="text-sm font-semibold text-slate-800">Tiêu chí đánh giá</h4>
        <ul className="mt-3 space-y-4">{criteria.map(field => {
          const score = scoreValue(field.score);
          return <li key={field.key}>
            <div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="break-words text-sm font-medium text-slate-700">{field.label}</p><p className="mt-0.5 text-xs text-slate-500">Trọng số: {field.weight == null ? 'Chưa có dữ liệu' : `${field.weight}%`}</p></div><p className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">{scoreText(field.score)} <span className="text-xs font-normal text-slate-400">/10</span></p></div>
            {score !== null ? <div role="progressbar" aria-label={`Điểm ${field.label}`} aria-valuemin={0} aria-valuemax={10} aria-valuenow={Math.max(0, Math.min(10, score))} aria-valuetext={`${scoreText(field.score)} trên 10`} className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(10, score)) * 10}%`, backgroundColor: scoreColor(score) }} /></div> : <div aria-hidden="true" className="mt-2 h-1.5 rounded-full bg-slate-100" />}
          </li>;
        })}</ul>
      </div>
    </div>

    <div className="rounded-xl bg-slate-50 px-4 py-3.5">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-800"><MessageSquareText size={16} className="text-slate-400" aria-hidden="true"/>Nhận xét của doanh nghiệp</h4>
      <p className={`mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed ${comments ? 'text-slate-600' : 'italic text-slate-400'}`}>{comments || 'Doanh nghiệp chưa ghi nhận nhận xét.'}</p>
    </div>
  </article>;
}
