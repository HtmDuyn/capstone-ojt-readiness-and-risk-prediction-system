import { Check,ClipboardList,Info } from 'lucide-react';
import type { RiskAssessment } from '@/services/studentOjtRisk.service';
import { cardClass,focusClass,SectionTitle } from './risk-ui';

export function RecommendationSummary({data}:{data:RiskAssessment}){
  return <section aria-label="Hướng hành động tiếp theo" className={`${cardClass} p-5 sm:p-6`}><SectionTitle eyebrow="Hành động tiếp theo" title="Bạn nên làm gì tiếp theo?" aside={<span className="grid size-10 place-items-center rounded-xl bg-orange-50 text-orange-600"><ClipboardList size={20} aria-hidden="true"/></span>}/>
    {data.roadmap.actions.length>0?<div className="mt-5 grid gap-3 sm:grid-cols-2">{data.roadmap.actions.map((action,index)=><div key={index} className="flex items-start gap-3 rounded-xl bg-slate-50 p-4"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-white text-orange-600 ring-1 ring-slate-200"><Check size={12} aria-hidden="true"/></span><p className="text-sm leading-relaxed text-slate-600">{action}</p></div>)}</div>:<p className="mt-4 text-sm text-slate-500">Chưa có hướng hành động bổ sung trong đánh giá hiện tại.</p>}
    <div className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-slate-500"><Info size={14} className="mt-0.5 shrink-0" aria-hidden="true"/><p>Đề xuất giúp bạn lập kế hoạch học tập. Việc mở lớp, đăng ký môn và xác nhận đủ điều kiện OJT do nhà trường quyết định.</p></div>
    <details className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-500"><summary className={`cursor-pointer rounded-md font-medium ${focusClass}`}>Phạm vi đánh giá rủi ro</summary><ul className="mt-3 list-disc space-y-2 pl-4 leading-relaxed">{data.risk.limitations.map((l,i)=><li key={i}>{l}</li>)}</ul></details>
  </section>;
}
