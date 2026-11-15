import { useEffect, useRef, useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { formatScheduleDate, parseScheduleDate } from '@/utils/qhdnRecruitmentSchedule';

const localDate = (date:Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const localTime = (date:Date) => `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;

export function RecruitmentDateInput({name,label,displayLabel=label,error,defaultValue,value,onValueChange,disabled=false}:{
 name:string;label:string;displayLabel?:string;error?:string;defaultValue?:string;value?:string;
 onValueChange?:(value:string)=>void;disabled?:boolean;
}) {
 const initial=parseScheduleDate(value??defaultValue??'');
 const [date,setDate]=useState(initial?localDate(initial):'');
 const [time,setTime]=useState(initial?localTime(initial):'09:00');
 const [stored,setStored]=useState(defaultValue??'');
 const lastEmitted=useRef<string|undefined>(undefined);
 useEffect(()=>{
  if(value!==undefined&&value===lastEmitted.current)return;
  const parsed=parseScheduleDate(value??defaultValue??'');
  setDate(parsed?localDate(parsed):'');
  if(parsed)setTime(localTime(parsed));
 },[value,defaultValue]);
 const update=(nextDate:string,nextTime:string)=>{
  setDate(nextDate);setTime(nextTime);
  const parsed=nextDate&&nextTime?new Date(`${nextDate}T${nextTime}`):null;
  const formatted=parsed&&Number.isFinite(+parsed)?formatScheduleDate(parsed):'';
  lastEmitted.current=formatted;setStored(formatted);onValueChange?.(formatted);
 };
 const inputClass='min-w-0 w-full bg-transparent py-2.5 text-sm text-slate-800 outline-none disabled:cursor-not-allowed disabled:text-slate-400 [color-scheme:light] [&::-webkit-calendar-picker-indicator]:cursor-pointer';
 return <div className="min-w-0 space-y-1.5">
  <div className="flex items-center justify-between gap-2"><label htmlFor={`${name}-date`} className="text-xs font-semibold text-slate-600">{displayLabel}</label>{disabled&&<span className="inline-flex items-center gap-1 text-[11px] text-slate-400"><LockKeyhole size={11}/>Đã khóa</span>}</div>
  <div className={'flex items-center rounded-lg border bg-white transition focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 '+(disabled?'border-slate-200 bg-slate-50':error?'border-red-400':'border-slate-200 hover:border-slate-300')}>
   <input id={`${name}-date`} type="date" value={date} disabled={disabled} required aria-label={`Ngày ${label.toLowerCase()}`} aria-invalid={!!error} aria-describedby={error?`${name}-error`:undefined} className={inputClass+' px-3'} onChange={event=>update(event.target.value,time)}/>
   <span className="h-5 w-px shrink-0 bg-slate-200"/>
   <input type="time" value={time} disabled={disabled} required step={60} aria-label={`Giờ ${label.toLowerCase()}`} aria-invalid={!!error} className={inputClass+' !w-[8rem] shrink-0 px-3'} onChange={event=>update(date,event.target.value)}/>
  </div>
  <input type="hidden" name={name} value={value??stored} disabled={disabled}/>
  {error&&<p id={`${name}-error`} role="alert" className="text-xs text-red-600">{error}</p>}
 </div>;
}
