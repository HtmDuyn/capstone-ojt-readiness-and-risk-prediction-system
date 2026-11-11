import { invalid } from '../students/student.validation';
import { timestamp } from '../combo-registration/combo.validation';
import { phaseIsOpen, hasPhaseSchedule } from './round-policy';
import type { Row } from './recruitment.repository';

export const phaseEnds = { postingEndsAt:'PostingEndsAt',applicationEndsAt:'ApplicationEndsAt',resultsEndsAt:'ResultsEndsAt' } as const;
export function extendedSchedule(before:Row, input:Row) {
 if(!hasPhaseSchedule(before)||before.Status!=='OPEN'||before.ResultsFinalizedAt)
  throw invalid('Chỉ gia hạn giai đoạn của đợt đang mở.',409,'RECRUITMENT_EXTENSION_CLOSED');
 const after={...before};let changed=false;
 for(const [key,column] of Object.entries(phaseEnds))if(input[key]!==undefined){
  const value=new Date(timestamp(input[key],key));
  if(+value===+new Date(before[column]))continue;
  const phase=key==='postingEndsAt'?'POSTING':key==='applicationEndsAt'?'APPLICATION':'RESULTS';
  if(!phaseIsOpen(before,phase))throw invalid('Giai đoạn chưa mở hoặc đã đóng, không được gia hạn/mở lại.',409,'RECRUITMENT_EXTENSION_CLOSED');
  if(value<=new Date(before[column]))throw invalid('Gia hạn chỉ được kéo dài thời điểm kết thúc.',400,'RECRUITMENT_EXTENSION_NOT_LATER');
  after[column]=value;changed=true;
 }
 if(!changed)throw invalid('Chọn ít nhất một thời hạn mới dài hơn hiện tại.');
 if(new Date(after.PostingEndsAt)>new Date(after.ApplicationStartsAt)||new Date(after.ApplicationEndsAt)>=new Date(after.ResultsEndsAt))
  throw invalid('Hạn đăng tin không vượt giờ mở ứng tuyển; hạn phản hồi phải kết thúc sau hạn ứng tuyển. Có thể gia hạn đồng thời hạn ứng tuyển và phản hồi.',400,'RECRUITMENT_PHASE_SCHEDULE_INVALID');
 after.EndsAt=after.ResultsEndsAt;
 return after;
}
