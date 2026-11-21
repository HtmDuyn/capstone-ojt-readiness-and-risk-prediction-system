import { useRef } from 'react';
import { CalendarDays, Clock3, LockKeyhole } from 'lucide-react';
import { formatScheduleTimeInput, parseScheduleDate } from '@/utils/qhdn/qhdnRecruitmentSchedule';

export function RecruitmentDateInput({name,label,displayLabel=label,error,value,onValueChange,minDate,disabled=false}:{
 name:string;label:string;displayLabel?:string;error?:string;value:string;
 onValueChange:(value:string)=>void;minDate:string;disabled?:boolean;
}) {
 const [date='',time='']=value.split(' ');
 const calendar=useRef<HTMLInputElement>(null),clock=useRef<HTMLInputElement>(null);
 const update=(nextDate:string,nextTime:string)=>onValueChange(`${nextDate} ${nextTime}`);
 const inputClass='min-w-0 w-full bg-transparent py-2.5 text-sm text-slate-800 outline-none disabled:cursor-not-allowed disabled:text-slate-400 [color-scheme:light] [&::-webkit-calendar-picker-indicator]:cursor-pointer';
 const pickerDate=parseScheduleDate(`${date} 00:00`)?date.split('/').reverse().join('-'):'';
 const validTime=/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time);
 const pickerButton='flex h-10 w-9 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-orange-50 hover:text-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500 disabled:pointer-events-none disabled:opacity-50';
 return <div className="min-w-0 space-y-1.5">
  <div className="flex items-center justify-between gap-2"><label htmlFor={`${name}-date`} className="text-xs font-semibold text-slate-600">{displayLabel}</label>{disabled&&<span className="inline-flex items-center gap-1 text-[11px] text-slate-400"><LockKeyhole size={11}/>Đã khóa</span>}</div>
  <div className={'flex items-center rounded-lg border bg-white transition focus-within:ring-2 '+(error?'border-red-400 focus-within:ring-red-100':disabled?'border-slate-200 bg-slate-50':'border-slate-200 hover:border-slate-300 focus-within:border-orange-400 focus-within:ring-orange-100')}>
   <div className="relative flex min-w-0 flex-1 items-center">
    <input id={`${name}-date`} type="text" value={date} disabled={disabled} aria-required="true" placeholder="dd/mm/yyyy" maxLength={10} autoComplete="off" aria-label={`Ngày ${label.toLowerCase()}`} aria-invalid={!!error} aria-describedby={error?`${name}-error`:undefined} className={inputClass+' pl-3 pr-1'} onChange={event=>update(event.target.value.replace(/\s/g,''),time)}/>
    <button type="button" className={pickerButton} disabled={disabled} aria-label={`Chọn ngày ${label.toLowerCase()} trên lịch`} onClick={()=>calendar.current?.showPicker?.()}><CalendarDays size={16}/></button>
    <input ref={calendar} id={`${name}-picker`} type="date" min={minDate} value={pickerDate} disabled={disabled} tabIndex={-1} aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 h-px w-px opacity-0" onChange={event=>update(event.target.value.split('-').reverse().join('/'),time)}/>
   </div>
   <span className="h-5 w-px shrink-0 bg-slate-200"/>
   <div className="relative flex w-[7rem] shrink-0 items-center">
    <input id={`${name}-time`} type="text" inputMode="numeric" value={time} disabled={disabled} aria-required="true" placeholder="HH:mm" maxLength={5} autoComplete="off" aria-label={`Giờ ${label.toLowerCase()}`} aria-invalid={!!error} aria-describedby={error?`${name}-error`:undefined} className={inputClass+' pl-3 pr-1 tabular-nums'} onChange={event=>update(date,formatScheduleTimeInput(event.target.value.replace(/\s/g,'')))}/>
    <button type="button" className={pickerButton} disabled={disabled} aria-label={`Chọn giờ ${label.toLowerCase()}`} onClick={()=>clock.current?.showPicker?.()}><Clock3 size={16}/></button>
    <input ref={clock} type="time" value={validTime?time:''} disabled={disabled} tabIndex={-1} aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 h-px w-px opacity-0" onChange={event=>update(date,event.target.value)}/>
   </div>
  </div>
  {error&&<p id={`${name}-error`} role="alert" className="text-xs text-red-600">{error}</p>}
 </div>;
}
