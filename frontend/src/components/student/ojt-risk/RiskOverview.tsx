import { AlertTriangle,Check,Clock3,ShieldAlert,ShieldCheck } from 'lucide-react';
import type { RiskAssessment } from '@/services/studentOjtRisk.service';
import { Badge,cardClass,dateText,riskTheme } from './risk-ui';
import { StudentSemesterSelect } from '@/components/student/PortalUI';

export function RiskOverview({data,showSemesterSelector=false}:{data:RiskAssessment;refreshing:boolean;onRefresh:()=>void;showRefreshAction?:boolean;showSemesterSelector?:boolean}){
  const theme=riskTheme[data.risk.level];
  const Icon=data.risk.level==='LOW'?ShieldCheck:ShieldAlert;
  const deadlineValue=data.risk.evidence.assessmentDeadline;
  const deadlineDate=deadlineValue?new Date(deadlineValue):null;
  const deadline=deadlineDate&&Number.isFinite(deadlineDate.getTime())&&deadlineDate.getHours()===0&&deadlineDate.getMinutes()===0&&deadlineDate.getSeconds()===0
    ?deadlineDate.toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'})
    :dateText(deadlineValue);
  const meetsCurrentRequirements=data.risk.reasons.some(reason=>reason.code==='CURRENT_REQUIREMENTS_MET');
  return <section aria-labelledby="risk-overview-heading" className={`${cardClass} overflow-hidden border-l-4 ${theme.border}`}>
    <div className="p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-5">
      <div className="flex min-w-0 items-start gap-3 sm:gap-4"><div className={`grid size-12 shrink-0 place-items-center rounded-2xl ${theme.icon}`}><Icon size={25} strokeWidth={1.8} aria-hidden="true"/></div><div><p className="mb-1 text-xs font-medium text-slate-500">Tổng quan học tập</p><h2 id="risk-overview-heading" className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">Đánh giá mức độ rủi ro OJT</h2><p className="mt-1 text-sm text-slate-500">{data.student.fullName}{data.student.studentCode&&<span className="ml-2 text-slate-400">· {data.student.studentCode}</span>}</p></div></div>
      {showSemesterSelector && <div className="w-full min-w-0 border-t border-slate-100 pt-4 sm:ml-auto sm:w-72 sm:border-t-0 sm:pt-0 lg:w-80"><StudentSemesterSelect /></div>}
    </div>
    <div className="mt-5"><Badge className={theme.badge}><span className="size-1.5 rounded-full bg-current"/>{theme.label}</Badge><p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">{theme.description}</p>{dateText(data.risk.computedAt)&&<p className="mt-3 flex items-center gap-2 text-xs text-slate-500"><Clock3 size={13} aria-hidden="true"/>Cập nhật: {dateText(data.risk.computedAt)}</p>}</div>
    </div>
    <div className={`flex flex-col gap-4 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4 ${meetsCurrentRequirements?'bg-emerald-50/70':'bg-slate-50/60'}`}>
      <div className="min-w-0 space-y-2">{data.risk.reasons.slice(0,2).map(r=><p key={r.code} className={`flex items-start gap-2 text-sm leading-relaxed ${r.code==='CURRENT_REQUIREMENTS_MET'?'font-medium text-emerald-800':'text-slate-600'}`}>{data.risk.level==='LOW'?<Check size={16} className="mt-0.5 shrink-0 text-emerald-700" aria-hidden="true"/>:<AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true"/>}{r.code==='CURRENT_REQUIREMENTS_MET'?'Hiện đáp ứng đủ tiêu chí để tham gia OJT.':r.message}</p>)}</div>
      <div className="shrink-0 sm:text-right"><p className="text-xs text-slate-500">Hạn xét điều kiện OJT</p><p className="mt-1 text-sm font-semibold text-slate-900">{deadline??'Chưa được nhà trường cấu hình'}</p></div>
    </div>
  </section>;
}
