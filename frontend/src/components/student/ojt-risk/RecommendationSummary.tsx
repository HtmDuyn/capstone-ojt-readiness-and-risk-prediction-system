import { Check,ChevronDown,ChevronUp,ClipboardList,Info } from 'lucide-react';
import type { RiskAssessment } from '@/services/studentOjtRisk.service';
import { cardClass,focusClass,SectionTitle } from './risk-ui';

export function RecommendationSummary({data,embedded=false}:{data:RiskAssessment;embedded?:boolean}){
  return <section aria-label="Hướng hành động tiếp theo" className={embedded?'min-w-0':`${cardClass} p-5 sm:p-6`}>{embedded?<h3 className="text-base font-semibold text-slate-900">Bạn nên làm gì tiếp theo?</h3>:<SectionTitle eyebrow="Hành động tiếp theo" title="Bạn nên làm gì tiếp theo?" aside={<span className="grid size-10 place-items-center rounded-xl bg-orange-50 text-orange-600"><ClipboardList size={20} aria-hidden="true"/></span>}/>}
    {data.roadmap.actions.length>0?<div className={embedded?'mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2':'mt-5 grid gap-3 sm:grid-cols-2'}>{data.roadmap.actions.map((action,index)=><div key={index} className={embedded?'flex items-start gap-2 py-1':'flex items-start gap-3 rounded-xl bg-slate-50 p-4'}><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-white text-orange-600 ring-1 ring-slate-200"><Check size={12} aria-hidden="true"/></span><p className="text-sm leading-relaxed text-slate-600">{action}</p></div>)}</div>:<p className="mt-4 text-sm text-slate-500">Chưa có hướng hành động bổ sung trong đánh giá hiện tại.</p>}
    <div className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-slate-500"><Info size={14} className="mt-0.5 shrink-0" aria-hidden="true"/><p>Đề xuất giúp bạn lập kế hoạch học tập. Việc mở lớp, đăng ký môn và xác nhận đủ điều kiện OJT do nhà trường quyết định.</p></div>
    {embedded ? <details className="group mt-4 rounded-lg border border-slate-200 bg-white" onToggle={event => event.currentTarget.querySelector('summary')?.setAttribute('aria-expanded', String(event.currentTarget.open))}>
      <summary aria-expanded={false} className={`flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition-colors duration-150 hover:bg-slate-100 [&::-webkit-details-marker]:hidden ${focusClass}`}>
        <span>Phạm vi đánh giá rủi ro</span>
        <span className="flex shrink-0 items-center gap-2 text-sm font-medium text-slate-700">
          <span className="group-open:hidden">Xem chi tiết</span><span className="hidden group-open:inline">Thu gọn</span>
          <ChevronDown size={20} className="group-open:hidden" aria-hidden="true"/><ChevronUp size={20} className="hidden group-open:block" aria-hidden="true"/>
        </span>
      </summary>
      <div className="border-t border-slate-200 px-4 py-4 text-sm leading-relaxed text-slate-700"><ul className="list-disc space-y-2 pl-4">{data.risk.limitations.map((l,i)=><li key={i}>{l}</li>)}</ul></div>
    </details> : <details className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-500"><summary className={`cursor-pointer rounded-md font-medium ${focusClass}`}>Phạm vi đánh giá rủi ro</summary><ul className="mt-3 list-disc space-y-2 pl-4 leading-relaxed">{data.risk.limitations.map((l,i)=><li key={i}>{l}</li>)}</ul></details>}
  </section>;
}
