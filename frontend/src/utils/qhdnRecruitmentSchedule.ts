import type { PhaseSchedule } from './recruitmentSchedule';

export type ScheduleField = keyof PhaseSchedule;
export type ScheduleDraft = Record<ScheduleField,string>;
export const emptySchedule:ScheduleDraft={postingStartsAt:'',postingEndsAt:'',applicationStartsAt:'',applicationEndsAt:'',resultsStartsAt:'',resultsEndsAt:''};
export function formatScheduleDate(date:Date) {
 const pad=(n:number)=>String(n).padStart(2,'0');
 return `${pad(date.getDate())}/${pad(date.getMonth()+1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
export function parseScheduleDate(value:string) {
 const parts=/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/.exec(value);
 if(!parts)return null;
 const [,d,m,y,h,min]=parts.map(Number),date=new Date(y,m-1,d,h,min);
 return formatScheduleDate(date)===value?date:null;
}

// Preserve manually entered deadlines when updating the suggested dates.
export function updateScheduleDraft(before:ScheduleDraft,key:ScheduleField,value:string,manual:ReadonlySet<ScheduleField>) {
 const next={...before,[key]:value};
 if(key==='postingEndsAt'&&parseScheduleDate(value)&&!manual.has('applicationStartsAt'))next.applicationStartsAt=value;
 if((key==='postingEndsAt'||key==='applicationStartsAt')&&parseScheduleDate(next.applicationStartsAt)) {
  if(!manual.has('resultsStartsAt'))next.resultsStartsAt=next.applicationStartsAt;
  if(!manual.has('applicationEndsAt')) {
   const end=parseScheduleDate(next.applicationStartsAt)!;end.setDate(end.getDate()+7);
   next.applicationEndsAt=formatScheduleDate(end);
  }
 }
 if(!manual.has('resultsEndsAt')&&parseScheduleDate(next.applicationEndsAt))next.resultsEndsAt=next.applicationEndsAt;
 return next;
}
