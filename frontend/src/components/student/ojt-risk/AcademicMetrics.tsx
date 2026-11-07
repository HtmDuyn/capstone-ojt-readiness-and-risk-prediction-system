import { ChartNoAxesCombined,type LucideIcon } from 'lucide-react';
import type { RiskAssessment } from '@/services/studentOjtRisk.service';
import { cardClass,HelpTip,numberText } from './risk-ui';

export function AcademicMetrics({data,embedded=false}:{data:RiskAssessment;embedded?:boolean}){
  const e=data.risk.evidence;
  const earned=e.earnedCredits,missing=e.missingCredits;
  // Display a proportion of backend-provided credit figures, never recompute eligibility.
  const total=earned!=null&&missing!=null?earned+missing:null;
  const percentage=total!=null&&total>0&&earned!=null?Math.max(0,Math.min(100,Math.round(earned/total*100))):null;
  const metrics:{label:string;value:string;secondary?:string;description:string;icon:LucideIcon;iconClass:string;valueClass?:string;tip:string;progress?:number|null}[]=[
    {label:'Tín chỉ tích lũy',value:numberText(earned),secondary:missing!=null&&missing>0&&total!=null?`/ ${numberText(total)}`:undefined,description:missing===0?'Không còn thiếu tín chỉ so với ngưỡng xét':'Tiến độ tín chỉ so với ngưỡng xét OJT',icon:ChartNoAxesCombined,iconClass:'bg-emerald-50 text-emerald-600',tip:'Tín chỉ tích lũy được tính cho các môn đã đạt hoặc được công nhận và đáp ứng yêu cầu của chương trình đào tạo. Môn đang học hoặc chưa có kết quả chưa được tính.',progress:percentage},
  ];
  return <section aria-label="Chỉ số học tập" className="grid min-w-0 gap-3">{metrics.map(m=><article key={m.label} className={embedded?'min-w-0':`${cardClass} min-w-0 p-5 transition-shadow hover:shadow-md motion-reduce:transition-none`}><div className={embedded?'mb-2 flex items-center justify-between':'mb-4 flex items-center justify-between gap-2'}>{!embedded&&<span className={`grid size-10 place-items-center rounded-xl ${m.iconClass}`}><m.icon size={20} strokeWidth={1.8} aria-hidden="true"/></span>}{embedded&&<h3 className="text-base font-semibold text-slate-900">{m.label}</h3>}<HelpTip text={m.tip}/></div><dl><dt className={embedded?'sr-only':'text-xs font-medium text-slate-500'}>{m.label}</dt><dd className={`mt-2 text-3xl font-bold tracking-tight ${m.valueClass??'text-slate-900'}`}>{m.value}{m.secondary&&<span className="ml-1.5 text-base font-medium text-slate-400">{m.secondary}</span>}</dd></dl><p className="mt-2 text-xs leading-relaxed text-slate-500">{m.description}</p>{m.progress!=null&&<div className="mt-4"><div role="progressbar" aria-label="Tiến độ tín chỉ xét OJT" aria-valuemin={0} aria-valuemax={100} aria-valuenow={m.progress} className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500 transition-[width] duration-500 motion-reduce:transition-none" style={{width:`${m.progress}%`}}/></div><p className="mt-1.5 text-right text-[11px] font-medium text-emerald-700">{m.progress}% tiến độ tín chỉ</p></div>}</article>)}</section>;
}
