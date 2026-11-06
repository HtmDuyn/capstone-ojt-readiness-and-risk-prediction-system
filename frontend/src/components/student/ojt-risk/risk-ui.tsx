import { Info } from 'lucide-react';
import { useId,type ReactNode } from 'react';
import type { RiskAssessment } from '@/services/studentOjtRisk.service';

export const cardClass='rounded-[20px] border border-slate-200/80 bg-white shadow-sm shadow-slate-200/20';
export const focusClass='focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2';
export type RiskLevel=RiskAssessment['risk']['level'];
export const riskTheme={
  LOW:{badge:'border-emerald-200 bg-emerald-50 text-emerald-800',icon:'bg-emerald-50 text-emerald-600',border:'border-l-emerald-500',label:'Rủi ro thấp',description:'Duy trì tiến độ hiện tại và tiếp tục theo dõi các điều kiện xét OJT.'},
  MEDIUM:{badge:'border-amber-200 bg-amber-50 text-amber-900',icon:'bg-amber-50 text-amber-600',border:'border-l-amber-500',label:'Rủi ro trung bình',description:'Có những điểm cần theo dõi. Xem nguyên nhân và các môn nên ưu tiên bên dưới.'},
  HIGH:{badge:'border-rose-200 bg-rose-50 text-rose-800',icon:'bg-rose-50 text-rose-600',border:'border-l-rose-500',label:'Rủi ro cao',description:'Cần ưu tiên xử lý các vấn đề trong tiến độ học tập và chuẩn bị kế hoạch OJT phù hợp.'},
  INSUFFICIENT_DATA:{badge:'border-slate-200 bg-slate-100 text-slate-700',icon:'bg-slate-100 text-slate-500',border:'border-l-slate-400',label:'Chưa đủ dữ liệu',description:'Chưa thể xác định mức rủi ro. Xem thông tin cần bổ sung để tiếp tục đánh giá.'},
};
export const numberText=(n:number|null|undefined)=>n==null||!Number.isFinite(n)?'—':n.toLocaleString('vi-VN');
export function dateText(value:string|null|undefined){
  if(!value||!Number.isFinite(Date.parse(value)))return null;
  return new Date(value).toLocaleString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
}
export function Badge({children,className=''}:{children:ReactNode;className?:string}){
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold leading-4 ${className}`}>{children}</span>;
}
export function HelpTip({text}:{text:string}){
  const id=useId();
  return <span className="group relative inline-flex shrink-0"><button type="button" aria-label="Giải thích chỉ số" aria-describedby={id} className={`rounded-full text-slate-400 hover:text-slate-700 ${focusClass}`}><Info size={14} aria-hidden="true"/></button><span id={id} role="tooltip" className="invisible absolute right-0 top-6 z-20 w-52 rounded-xl bg-slate-800 p-3 text-left text-xs font-normal leading-relaxed text-white opacity-0 shadow-lg group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">{text}</span></span>;
}
export function SectionTitle({eyebrow,title,description,aside}:{eyebrow:string;title:string;description?:string;aside?:ReactNode}){
  return <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="mb-1.5 text-[11px] font-bold uppercase tracking-[.14em] text-slate-500">{eyebrow}</p><h3 className="text-lg font-bold tracking-tight text-slate-900">{title}</h3>{description&&<p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-500">{description}</p>}</div>{aside}</div>;
}
