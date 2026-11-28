import { ChartNoAxesCombined,GraduationCap,type LucideIcon } from 'lucide-react';
import type { RiskAssessment } from '@/services/studentService';
import { cardClass,HelpTip,numberText } from './risk-ui';

function GpaTargetArt(){
  return <svg aria-hidden="true" viewBox="0 0 140 140" className="h-20 w-20 drop-shadow-[0_8px_10px_rgba(109,40,217,0.14)] sm:h-24 sm:w-24">
    <circle cx="70" cy="76" r="57" fill="#ede9fe" opacity=".62"/><circle cx="70" cy="76" r="44" fill="#f5f3ff"/><circle cx="70" cy="76" r="34" fill="none" stroke="#ddd6fe" strokeWidth="8"/><circle cx="70" cy="76" r="21" fill="none" stroke="#c4b5fd" strokeWidth="8"/><circle cx="70" cy="76" r="8" fill="#a78bfa"/>
    <path d="M75 70 117 25" fill="none" stroke="#8b5cf6" strokeWidth="8" strokeLinecap="round"/><path d="m110 21 15-8-3 17-7-5-7 7-6-6 8-7Z" fill="#7c3aed"/><path d="m74 68 9 5-6 6-5-8Z" fill="#6d28d9"/>
  </svg>;
}

export function AcademicMetrics({data,academicProgress,embedded=false,profileStyle=false}:{data:RiskAssessment;academicProgress?:{gpa:number|null;gpaScale:number|null}|null;embedded?:boolean;profileStyle?:boolean}){
  const e=data.risk.evidence;
  const earned=e.earnedCredits,missing=e.missingCredits;
  // Display a proportion of backend-provided credit figures, never recompute eligibility.
  const total=earned!=null&&missing!=null?earned+missing:null;
  const percentage=total!=null&&total>0&&earned!=null?Math.max(0,Math.min(100,Math.round(earned/total*100))):null;
  const metrics:{label:string;value:string;secondary?:string;description:string;icon:LucideIcon;iconClass:string;valueClass?:string;tip:string;progress?:number|null}[]=[
    {label:'Tín chỉ tích lũy',value:numberText(earned),secondary:missing!=null&&missing>0&&total!=null?`/ ${numberText(total)}`:undefined,description:missing===0?'Không còn thiếu tín chỉ so với ngưỡng xét':'Tiến độ tín chỉ so với ngưỡng xét OJT',icon:ChartNoAxesCombined,iconClass:'bg-emerald-50 text-emerald-600',tip:'Tín chỉ tích lũy được tính cho các môn đã đạt hoặc được công nhận và đáp ứng yêu cầu của chương trình đào tạo. Môn đang học hoặc chưa có kết quả chưa được tính.',progress:percentage},
    {label:'GPA tích lũy',value:academicProgress?.gpa==null?'—':academicProgress.gpa.toFixed(2),secondary:academicProgress?.gpaScale?`/ ${academicProgress.gpaScale.toFixed(2)}`:undefined,description:academicProgress?.gpa==null?'Chưa đủ dữ liệu hoặc cấu hình để tính GPA.':'Theo kết quả học tập và quy tắc GPA hiện hành.',icon:GraduationCap,iconClass:'bg-blue-50 text-blue-600',tip:'GPA dùng cùng cách tính và chính sách làm lại môn của hồ sơ học vụ; màn hình này chỉ hiển thị kết quả từ hệ thống.'},
  ];
  return <section aria-label="Chỉ số học tập" className={`grid min-w-0 gap-3 ${embedded||profileStyle?'sm:grid-cols-2':''} ${profileStyle?'h-full':''}`}>
    {metrics.map((m,index)=>profileStyle&&index===1?<article key={m.label} className="relative h-full min-h-[118px] min-w-0 overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50/70 p-2.5 sm:p-3">
      <div className="absolute right-1 top-4 opacity-75 sm:right-2"><GpaTargetArt/></div>
      <div className="relative z-10 flex max-w-[72%] items-start gap-2 sm:max-w-[75%]">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-violet-100/90 text-violet-700 shadow-sm"><m.icon size={21} strokeWidth={1.9} aria-hidden="true"/></span>
        <dl className="min-w-0 pt-0.5"><dt className="text-xs font-semibold text-slate-600">{m.label}</dt><dd className="mt-1 flex flex-wrap items-baseline gap-x-2 text-[1.9rem] font-extrabold leading-none tracking-tight text-violet-800">{m.value}{m.secondary&&<span className="text-sm font-semibold text-slate-500">{m.secondary}</span>}</dd></dl>
      </div>
      <p className="relative z-10 mt-1.5 max-w-[75%] text-[11px] leading-relaxed text-slate-600">{m.description}</p>
      <div className="absolute right-3 top-3 z-20"><HelpTip text={m.tip}/></div>
    </article>:<article key={m.label} className={profileStyle?`h-full min-w-0 rounded-2xl border p-2.5 sm:p-3 ${index===0?'border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50/70':'border-violet-100 bg-gradient-to-br from-violet-50 to-fuchsia-50/60'}`:embedded?'min-w-0 rounded-xl border border-slate-100 bg-slate-50/50 p-4':`${cardClass} min-w-0 p-5 transition-shadow hover:shadow-md motion-reduce:transition-none`}>
      <div className={embedded&&!profileStyle?'mb-2 flex items-center justify-between':profileStyle?'mb-1 flex items-center justify-between gap-2':'mb-3 flex items-center justify-between gap-2'}>{(!embedded||profileStyle)&&<span className={`grid ${profileStyle?'size-8':'size-10'} place-items-center rounded-xl ${profileStyle?(index===0?'bg-blue-100 text-blue-700':'bg-violet-100 text-violet-700'):m.iconClass}`}><m.icon size={18} strokeWidth={1.8} aria-hidden="true"/></span>}{embedded&&!profileStyle&&<h3 className="text-base font-semibold text-slate-900">{m.label}</h3>}<HelpTip text={m.tip}/></div>
      <dl><dt className={embedded&&!profileStyle?'sr-only':'text-sm font-semibold text-slate-700'}>{m.label}</dt><dd className={`mt-0.5 ${profileStyle?'text-2xl':'text-3xl'} font-bold tracking-tight ${profileStyle?'text-blue-800':m.valueClass??'text-slate-900'}`}>{m.value}{m.secondary&&<span className="ml-1.5 text-sm font-medium text-slate-500">{m.secondary}</span>}</dd></dl>{!(profileStyle&&index===0)&&<p className={`${profileStyle?'mt-1':'mt-2'} text-xs leading-relaxed text-slate-600`}>{m.description}</p>}
      {profileStyle&&index===0&&total!=null&&<div className="mt-1.5 flex items-center justify-between gap-2 border-t border-blue-200/70 pt-1.5 text-[11px]"><span className="font-medium text-slate-600">Yêu cầu: <strong className="text-slate-800">≥ {numberText(total)} tín chỉ</strong></span><span className={`rounded-full px-2 py-0.5 font-semibold ${missing===0?'bg-emerald-100 text-emerald-800':'bg-amber-100 text-amber-800'}`}>{missing===0?'Đạt':`Thiếu ${numberText(missing)}`}</span></div>}
      {m.progress!=null&&<div className={`${profileStyle?'mt-1.5':'mt-4'} flex items-center gap-2`}><div role="progressbar" aria-label="Tiến độ tín chỉ xét OJT" aria-valuemin={0} aria-valuemax={100} aria-valuenow={m.progress} className={`${profileStyle?'h-1.5':'h-2'} min-w-0 flex-1 overflow-hidden rounded-full bg-white/80`}><div className="h-full rounded-full bg-blue-600 transition-[width] duration-500 motion-reduce:transition-none" style={{width:`${m.progress}%`}}/></div><span className="shrink-0 text-[11px] font-semibold text-blue-800">{m.progress}%</span></div>}
    </article>)}
  </section>;
}
