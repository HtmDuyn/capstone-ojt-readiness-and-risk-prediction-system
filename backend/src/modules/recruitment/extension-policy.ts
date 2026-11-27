import { invalid } from '../students/student.validation';
import { phaseIsOpen, hasPhaseSchedule } from './round-policy';
import { scheduleDate, scheduleFieldError } from './schedule-policy';
import type { Row } from './recruitment.repository';

export const phaseEnds = { postingEndsAt:'PostingEndsAt',applicationEndsAt:'ApplicationEndsAt',resultsEndsAt:'ResultsEndsAt' } as const;
export function extendedSchedule(before:Row, input:Row) {
 if(!hasPhaseSchedule(before)||before.Status!=='OPEN'||before.ResultsFinalizedAt)
  throw invalid('Chỉ gia hạn giai đoạn của đợt đang mở.',409,'RECRUITMENT_EXTENSION_CLOSED');
 const after={...before};let changed=false;
 for(const key of Object.keys(phaseEnds) as (keyof typeof phaseEnds)[])if(input[key]!==undefined){
  const column=phaseEnds[key],value=scheduleDate(input[key],key);
  if(+value===+new Date(before[column]))continue;
  const phase=key==='postingEndsAt'?'POSTING':key==='applicationEndsAt'?'APPLICATION':'RESULTS';
  if(!phaseIsOpen(before,phase))throw scheduleFieldError(key,'Giai đoạn chưa mở hoặc đã đóng, không được gia hạn.',409,'RECRUITMENT_EXTENSION_CLOSED');
  if(value<=new Date(before[column]))throw scheduleFieldError(key,'Hạn mới phải sau hạn hiện tại.',400,'RECRUITMENT_EXTENSION_NOT_LATER');
  after[column]=value;changed=true;
 }
 if(!changed)throw invalid('Chọn ít nhất một thời hạn mới dài hơn hiện tại.');
 if(new Date(after.PostingEndsAt)>=new Date(after.ApplicationEndsAt))
  throw scheduleFieldError('postingEndsAt','Hạn 1 phải kết thúc trước thời điểm kết thúc Hạn 2.');
 if(new Date(after.ApplicationEndsAt)>new Date(after.ResultsEndsAt))
  throw scheduleFieldError('applicationEndsAt','Hạn ứng tuyển phải kết thúc trước hoặc đúng lúc hết hạn xét tuyển. Có thể gia hạn đồng thời hai hạn khi cả hai đang mở.');
 after.EndsAt=after.ResultsEndsAt;
 return after;
}
