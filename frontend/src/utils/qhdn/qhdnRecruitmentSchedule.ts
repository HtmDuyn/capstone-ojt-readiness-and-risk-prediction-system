import type { PhaseSchedule } from '@/utils/shared/recruitmentSchedule';
import { displayTaskTime, vietnamTaskMinute } from '@/utils/shared/taskTime';

export type ScheduleField = keyof PhaseSchedule;
export type ScheduleDraft = Record<ScheduleField,string>;
export type ScheduleErrors = Partial<Record<ScheduleField, string>>;
export const emptySchedule:ScheduleDraft={postingStartsAt:'',postingEndsAt:'',applicationStartsAt:'',applicationEndsAt:'',resultsStartsAt:'',resultsEndsAt:''};
export const scheduleFields = Object.keys(emptySchedule) as ScheduleField[];

// Older list responses may omit action hints; the server still validates every edit.
export function recruitmentScheduleAccess(round:Partial<PhaseSchedule>&{
 status:string;endsAt:string;resultsFinalizedAt?:string;serverNow?:string;
 canEditSchedule?:boolean;editableScheduleFields?:string[];
},periodAvailable=true) {
 const now=round.serverNow?Date.parse(round.serverNow):Date.now();
 const hasSchedule=Object.keys(emptySchedule).every(key=>Number.isFinite(Date.parse(round[key as ScheduleField]??'')));
 const editable=periodAvailable&&hasSchedule&&!round.resultsFinalizedAt&&
  (round.status==='DRAFT'||(round.status==='OPEN'&&now<Date.parse(round.endsAt)));
 return {
  canEditSchedule:round.canEditSchedule??editable,
  editableScheduleFields:round.editableScheduleFields??(editable?Object.keys(emptySchedule).filter(key=>round.status==='DRAFT'||now<Date.parse(round[key as ScheduleField]!)):[]),
 };
}
export function formatScheduleDate(date:Date) {
 return displayTaskTime(vietnamTaskMinute(date));
}
export function parseScheduleDate(value:string) {
 const parts=/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/.exec(value);
 if(!parts)return null;
 const [,day,month,year,hour,minute]=parts;
 const date=new Date(`${year}-${month}-${day}T${hour}:${minute}:00+07:00`);
 return Number.isFinite(+date)&&formatScheduleDate(date)===value?date:null;
}

export function newRecruitmentSchedule(now: number): ScheduleDraft {
 const nextMinute = formatScheduleDate(new Date((Math.floor(now / 60000) + 1) * 60000));
 return Object.fromEntries(scheduleFields.map(field => [field, nextMinute])) as ScheduleDraft;
}

export function formatScheduleTimeInput(value: string) {
 return /^\d{4}$/.test(value) ? `${value.slice(0, 2)}:${value.slice(2)}` : value;
}

export function validateRecruitmentSchedule(draft: ScheduleDraft, options: {
 now: number; semesterEnd?: string; original?: Partial<PhaseSchedule>; requireFutureStart?: boolean; changedField?: ScheduleField;
}) {
 const { now, semesterEnd, original, requireFutureStart, changedField } = options;
 const endOfSemester = semesterEnd ? Date.parse(`${semesterEnd.slice(0, 10)}T00:00:00+07:00`) + 86400000 : Infinity;
 const errors: ScheduleErrors = {};
 const times = {} as Record<ScheduleField, number>;
 const schedule = {} as PhaseSchedule;
 const errorAt = (field: ScheduleField, message: string) => { errors[field] ??= message; };
 for (const field of scheduleFields) {
  const [date] = draft[field].split(' ');
  if (!parseScheduleDate(`${date} 00:00`)) { errorAt(field, 'Nhập ngày hợp lệ theo dạng dd/mm/yyyy.'); continue; }
  const parsed = parseScheduleDate(draft[field]);
  if (!parsed) { errorAt(field, 'Nhập giờ hợp lệ theo dạng HH:mm (00:00–23:59).'); continue; }
  const previous = original?.[field];
  const unchanged = !!previous && formatScheduleDate(new Date(previous)) === draft[field];
  schedule[field] = unchanged ? previous : parsed.toISOString();
  times[field] = Date.parse(schedule[field]);
  if ((!unchanged || (requireFutureStart && field === 'postingStartsAt')) && times[field] <= now) {
   errorAt(field, `Chọn mốc sau thời điểm hiện tại (${formatScheduleDate(new Date(now))}, giờ Việt Nam).`);
  } else if (times[field] > endOfSemester) {
   errorAt(field, 'Mốc này vượt quá ngày kết thúc học kỳ.');
  }
 }
 const checkOrder = (earlier: ScheduleField, later: ScheduleField, allowEqual: boolean, message: string, earlierMessage: string | null = message) => {
  if (!Number.isFinite(times[earlier]) || !Number.isFinite(times[later])) return;
  if (allowEqual ? times[earlier] > times[later] : times[earlier] >= times[later]) {
   if (changedField === earlier && earlierMessage !== null) errorAt(earlier, earlierMessage);
   else errorAt(later, message);
  }
 };
 checkOrder('postingStartsAt', 'postingEndsAt', false, 'Hạn đăng tin phải kết thúc sau khi bắt đầu.');
 checkOrder('postingEndsAt', 'applicationStartsAt', true, 'Hạn ứng tuyển phải bắt đầu từ khi hạn đăng tin kết thúc.');
 checkOrder('applicationStartsAt', 'applicationEndsAt', false,
  `Hạn 2 phải kết thúc sau mốc bắt đầu ứng tuyển (${draft.applicationStartsAt}).`, null);
 checkOrder('applicationStartsAt', 'resultsStartsAt', true, 'Hạn xét tuyển phải bắt đầu từ khi mở ứng tuyển.');
 checkOrder('resultsStartsAt', 'resultsEndsAt', false,
  `Hạn kết thúc xét tuyển phải sau mốc bắt đầu đang chọn (${draft.resultsStartsAt}).`,
  `Hạn bắt đầu xét tuyển phải trước mốc kết thúc đang chọn (${draft.resultsEndsAt}).`);
 checkOrder('applicationEndsAt', 'resultsEndsAt', true,
  `Hạn 3 phải kết thúc bằng hoặc sau mốc kết thúc Hạn 2 (${draft.applicationEndsAt}).`, null);
 return { errors, schedule };
}

// Preserve manually entered deadlines when updating the suggested dates.
export function updateScheduleDraft(before:ScheduleDraft,key:ScheduleField,value:string,manual:ReadonlySet<ScheduleField>) {
 const next={...before,[key]:value};
 if(key==='postingEndsAt'&&parseScheduleDate(value)&&!manual.has('applicationStartsAt'))next.applicationStartsAt=value;
 if((key==='postingEndsAt'||key==='applicationStartsAt')&&parseScheduleDate(next.applicationStartsAt)) {
  if(!manual.has('resultsStartsAt'))next.resultsStartsAt=next.applicationStartsAt;
  if(!manual.has('applicationEndsAt')) {
   const start=parseScheduleDate(next.applicationStartsAt)!;
   next.applicationEndsAt=formatScheduleDate(new Date(+start+7*86400000));
  }
 }
 return next;
}
