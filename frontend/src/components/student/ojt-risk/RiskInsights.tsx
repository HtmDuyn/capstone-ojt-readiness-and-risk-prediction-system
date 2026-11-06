import { BookOpenCheck,CalendarClock,CheckCircle2,GitBranch,Layers3,Route,TriangleAlert,type LucideIcon } from 'lucide-react';
import type { RiskAssessment } from '@/services/studentOjtRisk.service';
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
export function RiskInsights({data}:{data:RiskAssessment}){
  return <section aria-label="Phân tích nguyên nhân rủi ro" className={`${cardClass} p-5 sm:p-6`}><SectionTitle eyebrow="Hiểu rõ đánh giá" title="Phân tích nguyên nhân rủi ro" description="Các yếu tố được ghi nhận từ tiến độ học tập và điều kiện OJT của bạn."/>
    <div className="mt-5 grid gap-3 md:grid-cols-2">{data.risk.reasons.map(r=>{
      const {title,icon:Icon}=labels[r.code]??{title:'Thông tin cần lưu ý',icon:TriangleAlert};
      const positive=['CURRENT_REQUIREMENTS_MET','ON_TRACK_FOR_CURRENT_STAGE'].includes(r.code);
      const tone=positive?'bg-emerald-50 text-emerald-700':data.risk.level==='INSUFFICIENT_DATA'?'bg-slate-100 text-slate-600':'bg-amber-50 text-amber-700';
      return <article key={r.code} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4"><span className={`grid size-9 shrink-0 place-items-center rounded-xl ${tone}`}><Icon size={18} aria-hidden="true"/></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h4 className="text-sm font-semibold text-slate-800">{title}</h4><Badge className={`${tone} border-transparent text-[10px]`}>{positive?'Duy trì':data.risk.level==='INSUFFICIENT_DATA'?'Cần đối soát':'Cần lưu ý'}</Badge></div><p className="mt-2 text-sm leading-relaxed text-slate-500">{r.message}</p></div></article>;
    })}</div>{data.risk.reasons.length===0&&<p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Chưa có thông tin phân tích chi tiết trong đánh giá hiện tại.</p>}
  </section>;
}
