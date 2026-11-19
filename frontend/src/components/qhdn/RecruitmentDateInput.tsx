import { useEffect, useRef, useState } from 'react';
import { CalendarDays, Clock3, LockKeyhole } from 'lucide-react';
import { parseScheduleDate } from '@/utils/qhdn/qhdnRecruitmentSchedule';

const localDate = (date:Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const localTime = (date:Date) => `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
const textDate=(date:Date)=>`${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1).padStart(2,'0')}/${date.getFullYear()}`;

export function RecruitmentDateInput({name,label,displayLabel=label,error,defaultValue,value,onValueChange,disabled=false}:{
 name:string;label:string;displayLabel?:string;error?:string;defaultValue?:string;value?:string;
 onValueChange?:(value:string)=>void;disabled?:boolean;
}) {
 const initial=parseScheduleDate(value??defaultValue??'');
 const [date,setDate]=useState(initial?textDate(initial):'');
 const [time,setTime]=useState(initial?localTime(initial):name==='resultsEndsAt'?'':'09:00');
 const [stored,setStored]=useState(defaultValue??'');
 const lastEmitted=useRef<string|undefined>(undefined);
 const calendar=useRef<HTMLInputElement>(null),clock=useRef<HTMLInputElement>(null);
 useEffect(()=>{
  if(value!==undefined&&value===lastEmitted.current)return;
  const parsed=parseScheduleDate(value??defaultValue??'');
  setDate(parsed?textDate(parsed):'');
  if(parsed)setTime(localTime(parsed));
 },[value,defaultValue]);
 const update=(nextDate:string,nextTime:string)=>{
  setDate(nextDate);setTime(nextTime);
  const formatted=nextDate||nextTime?`${nextDate} ${nextTime}`.trim():'';
  lastEmitted.current=formatted;setStored(formatted);onValueChange?.(formatted);
 };
 const inputClass='min-w-0 w-full bg-transparent py-2.5 text-sm text-slate-800 outline-none disabled:cursor-not-allowed disabled:text-slate-400 [color-scheme:light] [&::-webkit-calendar-picker-indicator]:cursor-pointer';
 const parsedDate=parseScheduleDate(`${date} 00:00`);
 const validTime=/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time);
 const pickerButton='flex h-10 w-9 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-orange-50 hover:text-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500 disabled:pointer-events-none disabled:opacity-50';
 return <div className="min-w-0 space-y-1.5">
  <div className="flex items-center justify-between gap-2"><label htmlFor={`${name}-date`} className="text-xs font-semibold text-slate-600">{displayLabel}</label>{disabled&&<span className="inline-flex items-center gap-1 text-[11px] text-slate-400"><LockKeyhole size={11}/>Đã khóa</span>}</div>
  <div className={'flex items-center rounded-lg border bg-white transition focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 '+(disabled?'border-slate-200 bg-slate-50':error?'border-red-400':'border-slate-200 hover:border-slate-300')}>
   <div className="relative flex min-w-0 flex-1 items-center">
    <input id={`${name}-date`} type="text" value={date} disabled={disabled} required placeholder="dd/mm/yyyy" maxLength={10} pattern="[0-9]{2}/[0-9]{2}/[0-9]{4}" title="Nhập ngày theo dạng dd/mm/yyyy" autoComplete="off" aria-label={`Ngày ${label.toLowerCase()}`} aria-invalid={!!error} aria-describedby={error?`${name}-error`:undefined} className={inputClass+' pl-3 pr-1'} onChange={event=>update(event.target.value,time)}/>
    <button type="button" className={pickerButton} disabled={disabled} aria-label={`Chọn ngày ${label.toLowerCase()} trên lịch`} onClick={()=>calendar.current?.showPicker?.()}><CalendarDays size={16}/></button>
    <input ref={calendar} id={`${name}-picker`} type="date" value={parsedDate?localDate(parsedDate):''} disabled={disabled} tabIndex={-1} aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 h-px w-px opacity-0" onChange={event=>{if(event.target.value)update(event.target.value.split('-').reverse().join('/'),time);}}/>
   </div>
   <span className="h-5 w-px shrink-0 bg-slate-200"/>
   <div className="relative flex w-[7rem] shrink-0 items-center">
    <input id={`${name}-time`} type="text" value={time} disabled={disabled} required placeholder="HH:mm" maxLength={5} pattern="([01][0-9]|2[0-3]):[0-5][0-9]" title="Nhập giờ theo dạng HH:mm (24 giờ)" autoComplete="off" aria-label={`Giờ ${label.toLowerCase()}`} aria-invalid={!!error} className={inputClass+' pl-3 pr-1 tabular-nums'} onChange={event=>update(date,event.target.value)}/>
    <button type="button" className={pickerButton} disabled={disabled} aria-label={`Chọn giờ ${label.toLowerCase()}`} onClick={()=>clock.current?.showPicker?.()}><Clock3 size={16}/></button>
    <input ref={clock} type="time" value={validTime?time:''} disabled={disabled} tabIndex={-1} aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 h-px w-px opacity-0" onChange={event=>update(date,event.target.value)}/>
   </div>
  </div>
  <input type="hidden" name={name} value={value??stored} disabled={disabled}/>
  {error&&<p id={`${name}-error`} role="alert" className="text-xs text-red-600">{error}</p>}
 </div>;
}
