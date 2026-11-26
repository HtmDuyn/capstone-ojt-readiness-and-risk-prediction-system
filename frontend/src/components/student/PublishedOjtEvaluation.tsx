import { Building2, CheckCircle2, MessageSquareText } from 'lucide-react';
import { dateText } from '@/components/student/PortalUI';
import type { OjtResult } from '@/types/student/portal';

const scoreText = (value: number | null | undefined) => value == null ? '—' : Number(value).toFixed(2);

export function PublishedOjtEvaluation({ result }: { result: OjtResult }) {
  const criteria = result.template?.criteria?.length
    ? result.template.criteria.map(field => ({ ...field, score: result.scoreDetails?.[field.key] }))
    : [
      { key: 'completionScore', label: 'Kỹ năng chuyên ngành', weight: null, score: result.completionScore },
      { key: 'skillScore', label: 'Kỹ năng mềm', weight: null, score: result.skillScore },
      { key: 'attitudeScore', label: 'Thái độ', weight: null, score: result.attitudeScore },
    ];
  const comments = result.comments?.trim();

  return <article aria-label={`Đánh giá OJT · ${result.enterpriseName} · ${result.semesterCode}`} className="space-y-5 border-b border-slate-200 py-4 last:border-b-0">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500"><Building2 size={20} aria-hidden="true"/></span>
        <div className="min-w-0">
          <h3 className="break-words text-base font-semibold text-slate-900">{result.enterpriseName}</h3>
          <p className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs leading-relaxed text-slate-500"><span className="font-medium text-slate-600">{result.semesterCode}</span><span aria-hidden="true">·</span><span>QHDN công bố: {dateText(result.publishedAt)}</span></p>
        </div>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"><CheckCircle2 size={13} aria-hidden="true"/>Đã công bố</span>
    </header>

    <div className="grid gap-5 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-7">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4 sm:block sm:border-b-0 sm:border-r sm:pb-0 sm:pr-7">
        <p className="text-sm font-medium text-slate-600">Điểm tổng OJT</p>
        <p className="flex items-baseline gap-1.5 sm:mt-2"><strong className="text-4xl font-bold tracking-tight tabular-nums text-orange-600 sm:text-5xl">{scoreText(result.overallScore)}</strong><span className="text-sm text-slate-400">/ 10</span></p>
      </div>
      <div className="min-w-0">
        <table className="w-full table-fixed text-left text-sm">
          <caption className="sr-only">Điểm đánh giá từng tiêu chí của {result.enterpriseName}</caption>
          <colgroup><col/><col className="w-20"/><col className="w-20"/></colgroup>
          <thead><tr className="border-b border-slate-200 text-xs text-slate-500"><th scope="col" className="pb-2 pr-3 font-medium">Tiêu chí đánh giá</th><th scope="col" className="pb-2 text-right font-medium">Trọng số</th><th scope="col" className="pb-2 text-right font-medium">Điểm / 10</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{criteria.map(field => <tr key={field.key}>
            <th scope="row" className="break-words py-2.5 pr-3 font-medium leading-relaxed text-slate-700">{field.label}</th>
            <td className="py-2.5 text-right text-slate-500 tabular-nums">{field.weight == null ? '—' : `${field.weight}%`}</td>
            <td className="py-2.5 text-right font-semibold text-slate-900 tabular-nums">{scoreText(field.score)}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </div>

    <div className="border-t border-slate-100 pt-4">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-800"><MessageSquareText size={16} className="text-slate-400" aria-hidden="true"/>Nhận xét của doanh nghiệp</h4>
      <p className={`mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed ${comments ? 'text-slate-600' : 'italic text-slate-400'}`}>{comments || 'Doanh nghiệp chưa ghi nhận nhận xét.'}</p>
    </div>
  </article>;
}
