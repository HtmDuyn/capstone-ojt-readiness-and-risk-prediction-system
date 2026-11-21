import { invalid } from '../students/student.validation';
import { timestamp } from '../combo-registration/combo.validation';
import { hasPhaseSchedule } from './round-policy';
import type { Row } from './recruitment.repository';

export const scheduleColumns = {
 postingStartsAt:'PostingStartsAt', postingEndsAt:'PostingEndsAt',
 applicationStartsAt:'ApplicationStartsAt', applicationEndsAt:'ApplicationEndsAt',
 resultsStartsAt:'ResultsStartsAt', resultsEndsAt:'ResultsEndsAt',
} as const;
type ScheduleField = keyof typeof scheduleColumns;
const scheduleClock = new Intl.DateTimeFormat('vi-VN', {
 timeZone:'Asia/Ho_Chi_Minh', day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit', hourCycle:'h23',
});

export function scheduleFieldError(field: ScheduleField, message: string, status = 400, code = 'RECRUITMENT_PHASE_SCHEDULE_INVALID') {
 return Object.assign(invalid(message,status,code),{field});
}

export function futureScheduleMessage(now: Date) {
 return `Chọn mốc sau thời điểm hiện tại (${scheduleClock.format(now)}, giờ Việt Nam).`;
}

export function scheduleDate(value: unknown, field: ScheduleField) {
 try { return new Date(timestamp(value,field)); }
 catch { throw scheduleFieldError(field,'Nhập ngày giờ hợp lệ cho mốc này.'); }
}

export function validatePhaseOrder(dates: Record<ScheduleField, Date>) {
 const rules = [
  ['postingStartsAt','postingEndsAt',false,'Hạn đăng tin phải kết thúc sau khi bắt đầu.'],
  ['postingEndsAt','applicationStartsAt',true,'Hạn ứng tuyển phải bắt đầu từ khi hạn đăng tin kết thúc.'],
  ['applicationStartsAt','applicationEndsAt',false,`Hạn 2 phải kết thúc sau mốc bắt đầu ứng tuyển (${scheduleClock.format(dates.applicationStartsAt)}).`],
  ['applicationStartsAt','resultsStartsAt',true,'Hạn xét tuyển phải bắt đầu từ khi mở ứng tuyển.'],
  ['resultsStartsAt','resultsEndsAt',false,`Hạn kết thúc xét tuyển phải sau mốc bắt đầu đang chọn (${scheduleClock.format(dates.resultsStartsAt)}).`],
  ['applicationEndsAt','resultsEndsAt',true,`Hạn 3 phải kết thúc bằng hoặc sau mốc kết thúc Hạn 2 (${scheduleClock.format(dates.applicationEndsAt)}).`],
 ] as const;
 for (const [earlier,later,allowEqual,message] of rules) {
  if (allowEqual ? dates[earlier]>dates[later] : dates[earlier]>=dates[later]) throw scheduleFieldError(later,message);
 }
}

export function schedulePermissions(w:Row) {
 const now=+new Date(w.DatabaseNow);
 const available=!!w.CampaignID&&hasPhaseSchedule(w)&&!w.ResultsFinalizedAt&&
  w.Kind==='SEMESTER'&&w.LinkedPeriodID===w.AcademicPeriodID&&!['CLOSED','ARCHIVED'].includes(w.PeriodStatus);
 const draft=w.Status==='DRAFT'&&!w.OpenedAt;
 const scheduled=w.Status==='OPEN'&&now<+new Date(w.StartsAt);
 const editable=available&&(draft||scheduled||(w.Status==='OPEN'&&now<+new Date(w.EndsAt)));
 const editableScheduleFields=editable?Object.entries(scheduleColumns).filter(([,column])=>{
  if(draft||scheduled)return true;
  return now<+new Date(w[column]);
 }).map(([key])=>key):[];
 return {canEditSchedule:editable,canDelete:available&&draft,editableScheduleFields};
}

export function editedSchedule(before:Row,input:Row) {
 const permissions=schedulePermissions(before);
 if(!permissions.canEditSchedule)throw invalid('Chỉ sửa đợt chưa mở hoặc đợt đang mở còn thời gian.',409,'RECRUITMENT_SCHEDULE_LOCKED');
 const after={...before},now=+new Date(before.DatabaseNow);
 const dates={} as Record<ScheduleField, Date>;
 for(const key of Object.keys(scheduleColumns) as ScheduleField[]) {
  const column=scheduleColumns[key], value=scheduleDate(input[key],key);
  dates[key]=value;
  if(+value===+new Date(before[column]))continue;
  if(!permissions.editableScheduleFields.includes(key))
   throw scheduleFieldError(key,'Mốc đã bắt đầu hoặc đã hết hạn và đang bị khóa.',409,'RECRUITMENT_SCHEDULE_LOCKED');
  if(+value<=now)throw scheduleFieldError(key,futureScheduleMessage(new Date(now)),409,'RECRUITMENT_SCHEDULE_LOCKED');
  after[column]=value;
 }
 validatePhaseOrder(dates);
 if(before.Status==='DRAFT'&&+dates.postingStartsAt<=now)throw scheduleFieldError('postingStartsAt',futureScheduleMessage(new Date(now)));
 after.StartsAt=after.PostingStartsAt;after.EndsAt=after.ResultsEndsAt;
 return after;
}
