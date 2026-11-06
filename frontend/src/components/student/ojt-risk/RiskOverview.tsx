import { AlertTriangle,CalendarDays,Check,Clock3,RefreshCw,ShieldAlert,ShieldCheck } from 'lucide-react';
import type { RiskAssessment } from '@/services/studentOjtRisk.service';
import { Badge,cardClass,dateText,focusClass,riskTheme } from './risk-ui';

export function RiskOverview({data,refreshing,onRefresh}:{data:RiskAssessment;refreshing:boolean;onRefresh:()=>void}){
  const theme=riskTheme[data.risk.level];
  const Icon=data.risk.level==='LOW'?ShieldCheck:ShieldAlert;
  const deadline=dateText(data.risk.evidence.assessmentDeadline);
  return <section aria-labelledby="risk-overview-heading" className={`${cardClass} overflow-hidden border-l-4 ${theme.border}`}>
    <div className="p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-5">
      <div className="flex min-w-0 items-start gap-3 sm:gap-4"><div className={`grid size-12 shrink-0 place-items-center rounded-2xl ${theme.icon}`}><Icon size={25} strokeWidth={1.8} aria-hidden="true"/></div><div><p className="mb-1 text-xs font-medium text-slate-500">Tổng quan học tập</p><h2 id="risk-overview-heading" className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">Đánh giá mức độ rủi ro OJT</h2><p className="mt-1 text-sm text-slate-500">{data.student.fullName}{data.student.studentCode&&<span className="ml-2 text-slate-400">· {data.student.studentCode}</span>}</p></div></div>
      <button type="button" onClick={onRefresh} disabled={refreshing} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-orange-300 hover:bg-orange-50 disabled:cursor-wait disabled:opacity-60 ${focusClass}`}><RefreshCw size={15} className={refreshing?'animate-spin motion-reduce:animate-none':''} aria-hidden="true"/>{refreshing?'Đang cập nhật…':'Cập nhật đánh giá'}</button>
    </div>
    <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_auto]"><div><Badge className={theme.badge}><span className="size-1.5 rounded-full bg-current"/>{theme.label}</Badge><p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">{theme.description}</p></div><div className="flex flex-col gap-2 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500 lg:min-w-60"><span className="flex items-center gap-2"><CalendarDays size={15} aria-hidden="true"/>Hạn xét điều kiện OJT</span><span className="font-semibold text-slate-800">{deadline??'Chưa được nhà trường cấu hình'}</span>{dateText(data.risk.computedAt)&&<span className="mt-1 flex items-center gap-2"><Clock3 size={13} aria-hidden="true"/>Cập nhật: {dateText(data.risk.computedAt)}</span>}</div></div>
    </div>
    {data.risk.reasons.length>0&&<div className="grid gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">{data.risk.reasons.slice(0,2).map(r=><p key={r.code} className="flex items-start gap-2 text-sm leading-relaxed text-slate-600">{data.risk.level==='LOW'?<Check size={16} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true"/>:<AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true"/>}{r.message}</p>)}</div>}
  </section>;
}
