import { BookOpenCheck,CalendarClock,CheckCircle2,GitBranch,Layers3,Route,TriangleAlert,type LucideIcon } from 'lucide-react';
import type { RiskAssessment } from '@/services/studentService';
import { Badge,cardClass,SectionTitle } from './risk-ui';

const labels:Record<string,{title:string;icon:LucideIcon}>={
  CREDIT_SHORTFALL:{title:'Tín chỉ cần bổ sung',icon:Layers3},EXCESS_DEBT:{title:'Số môn chưa đạt vượt giới hạn',icon:BookOpenCheck},
  CURRENT_REQUIREMENTS_MET:{title:'Đáp ứng ngưỡng hiện tại',icon:CheckCircle2},ON_TRACK_FOR_CURRENT_STAGE:{title:'Tiến độ phù hợp',icon:Route},
  MONITORING_UNAVAILABLE:{title:'Cần bổ sung thông tin học vụ',icon:TriangleAlert},ASSESSMENT_DEADLINE_PASSED:{title:'Đã đến hạn xét OJT',icon:CalendarClock},
  OJT_STAGE_REACHED:{title:'Đã đến giai đoạn thực tập',icon:CalendarClock},CURRENT_COURSES_COULD_CLOSE_GAP:{title:'Theo dõi kết quả môn đang học',icon:BookOpenCheck},
  CURRENT_COURSES_DO_NOT_CLOSE_GAP:{title:'Cần bổ sung kế hoạch học tập',icon:Route},LATE_STAGE_PREREQUISITE_BOTTLENECK:{title:'Môn tiên quyết đang chặn lộ trình',icon:GitBranch},
  PATHWAY_FOLLOW_UP_REQUIRED:{title:'Tiến độ cần được theo dõi',icon:Route},SCENARIO_UNAVAILABLE:{title:'Chưa đủ dữ liệu môn đang học',icon:TriangleAlert},
  PATHWAY_BASELINE_INCOMPLETE:{title:'Lộ trình cần được đối soát',icon:Route},
};
export function RiskInsights({data,embedded=false,rows=false,profileStyle=false}:{data:RiskAssessment;embedded?:boolean;rows?:boolean;profileStyle?:boolean}){
  const level=data.risk.level;
  return <section aria-label="Phân tích nguyên nhân rủi ro" className={embedded?'min-w-0':`${cardClass} p-5 sm:p-6`}>{embedded ? <><h3 className="text-base font-semibold text-slate-900">Phân tích nguyên nhân rủi ro</h3><p className="mt-1 text-sm leading-relaxed text-slate-500">Các yếu tố được ghi nhận từ tiến độ học tập và điều kiện OJT của bạn.</p></> : <SectionTitle eyebrow="Hiểu rõ đánh giá" title="Phân tích nguyên nhân rủi ro" description="Các yếu tố được ghi nhận từ tiến độ học tập và điều kiện OJT của bạn."/>}
    {profileStyle?<div className="mt-4 grid gap-2 sm:grid-cols-2">{data.risk.reasons.map(r=>{
      const {title,icon:Icon}=labels[r.code]??{title:'Thông tin cần lưu ý',icon:TriangleAlert};
      const positive=['CURRENT_REQUIREMENTS_MET','ON_TRACK_FOR_CURRENT_STAGE'].includes(r.code);
      const tone=positive?'bg-emerald-50 text-emerald-700':level==='INSUFFICIENT_DATA'?'bg-slate-100 text-slate-600':level==='HIGH'?'bg-rose-50 text-rose-700':'bg-amber-50 text-amber-700';
      return <article key={r.code} className={`flex min-w-0 items-start gap-3 rounded-2xl border p-3.5 ${positive?'border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/60':'border-slate-200 bg-white'}`}><span className={`grid size-9 shrink-0 place-items-center rounded-xl ${tone}`}><Icon size={18} aria-hidden="true"/></span><div className="min-w-0"><h4 className="text-sm font-bold text-slate-800">{title}</h4><p className="mt-1 text-xs leading-relaxed text-slate-600">{r.message}</p></div></article>;
    })}{data.risk.reasons.length===0&&<p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 sm:col-span-2">Chưa có thông tin phân tích chi tiết trong đánh giá hiện tại.</p>}</div>:<><div className={rows?'mt-4 space-y-2':embedded?'mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3':'mt-5 grid gap-3 md:grid-cols-2'}>{data.risk.reasons.map(r=>{
      const {title,icon:Icon}=labels[r.code]??{title:'Thông tin cần lưu ý',icon:TriangleAlert};
      const positive=['CURRENT_REQUIREMENTS_MET','ON_TRACK_FOR_CURRENT_STAGE'].includes(r.code);
      const tone=positive?'bg-emerald-50 text-emerald-700':data.risk.level==='INSUFFICIENT_DATA'?'bg-slate-100 text-slate-600':rows&&data.risk.level==='HIGH'?'bg-rose-50 text-rose-700':rows&&data.risk.level==='LOW'?'bg-blue-50 text-blue-700':'bg-amber-50 text-amber-700';
      return <article key={r.code} className={`flex items-start gap-3 rounded-xl border ${positive?'border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50/70':'border-slate-100 bg-slate-50/70'} ${embedded?'p-3':'rounded-2xl p-4'}`}><span className={`grid size-9 shrink-0 place-items-center rounded-xl ${tone}`}><Icon size={18} aria-hidden="true"/></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h4 className="text-sm font-semibold text-slate-800">{title}</h4><Badge className={`${tone} border-transparent text-[10px]`}>{positive?'Duy trì':data.risk.level==='INSUFFICIENT_DATA'?'Cần đối soát':'Cần lưu ý'}</Badge></div><p className="mt-2 text-sm leading-relaxed text-slate-600">{r.message}</p></div></article>;
    })}</div>{data.risk.reasons.length===0&&<p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Chưa có thông tin phân tích chi tiết trong đánh giá hiện tại.</p>}</>}
  </section>;
}

export function RiskSummaryGauge({data}:{data:RiskAssessment}){
  const level=data.risk.level;
  const tone=level==='LOW'?'#10b981':level==='MEDIUM'?'#f59e0b':level==='HIGH'?'#f43f5e':'#94a3b8';
  const label=level==='LOW'?'Thấp':level==='MEDIUM'?'Trung bình':level==='HIGH'?'Cao':'Chưa đủ dữ liệu';
  const progress=level==='LOW'?34:level==='MEDIUM'?67:level==='HIGH'?100:0;
  return <aside aria-label="Đánh giá rủi ro tổng quan" className="flex h-full min-w-0 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-3 text-center sm:p-4"><h3 className="self-start text-sm font-bold text-slate-800">Đánh giá tổng quan</h3><svg viewBox="0 0 160 100" className="mt-1 w-40 max-w-full" role="img" aria-label={`Mức độ rủi ro OJT: ${label}`}><path d="M 15 85 A 65 65 0 0 1 145 85" fill="none" stroke="#e2e8f0" strokeWidth="12" strokeLinecap="round"/><path d="M 15 85 A 65 65 0 0 1 145 85" fill="none" stroke={tone} strokeWidth="12" strokeLinecap="round" pathLength="100" strokeDasharray={`${progress} 100`}/></svg><p className="-mt-9 text-lg font-extrabold" style={{color:tone}}>{label}</p><p className="mt-3 text-[11px] text-slate-500">Mức độ rủi ro OJT</p><p className="mt-2 text-xs leading-relaxed text-slate-600">{level==='LOW'?'Bạn đang ở mức rủi ro thấp. Tiếp tục theo dõi kết quả học tập.':level==='INSUFFICIENT_DATA'?'Cần bổ sung dữ liệu để đánh giá chính xác hơn.':'Ưu tiên xử lý các yếu tố được nêu trong phân tích.'}</p></aside>;
}
