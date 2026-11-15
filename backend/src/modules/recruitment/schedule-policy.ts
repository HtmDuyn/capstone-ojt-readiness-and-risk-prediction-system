import { invalid } from '../students/student.validation';
import { timestamp } from '../combo-registration/combo.validation';
import { hasPhaseSchedule } from './round-policy';
import type { Row } from './recruitment.repository';

export const scheduleColumns = {
 postingStartsAt:'PostingStartsAt', postingEndsAt:'PostingEndsAt',
 applicationStartsAt:'ApplicationStartsAt', applicationEndsAt:'ApplicationEndsAt',
 resultsStartsAt:'ResultsStartsAt', resultsEndsAt:'ResultsEndsAt',
} as const;

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
 for(const [key,column] of Object.entries(scheduleColumns)) {
  const value=new Date(timestamp(input[key],key));
  if(+value===+new Date(before[column]))continue;
  if(!permissions.editableScheduleFields.includes(key)||
   ((before.Status==='OPEN'||key==='postingStartsAt')&&+value<=now))
   throw invalid('Không đổi mốc đã bắt đầu, hạn đã hết hoặc chuyển mốc còn lại về quá khứ.',409,'RECRUITMENT_SCHEDULE_LOCKED');
  after[column]=value;
 }
 const ps=+new Date(after.PostingStartsAt),pe=+new Date(after.PostingEndsAt),
  as=+new Date(after.ApplicationStartsAt),ae=+new Date(after.ApplicationEndsAt),
  rs=+new Date(after.ResultsStartsAt),re=+new Date(after.ResultsEndsAt);
 if(!(ps<pe&&pe<=as&&as<ae&&rs>=as&&rs<re&&ae<=re))
  throw invalid('Hạn đăng tin kết thúc trước hoặc cùng lúc ứng tuyển; xét tuyển bắt đầu từ lúc mở ứng tuyển trở đi, kết thúc sau lúc bắt đầu và bằng hoặc sau hạn ứng tuyển.',400,'RECRUITMENT_PHASE_SCHEDULE_INVALID');
 if(before.Status==='DRAFT'&&ps<=now)throw invalid('Đợt chưa mở phải có lịch bắt đầu trong tương lai.');
 after.StartsAt=after.PostingStartsAt;after.EndsAt=after.ResultsEndsAt;
 return after;
}
