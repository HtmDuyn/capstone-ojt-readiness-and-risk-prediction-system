import type { Row } from './shared';

export function academicAnswer(message:string, profile:Row) {
  const question=message.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase();
  const topics:string[]=[];
  if(/mon.*(no|rot|truot|chua dat)|no mon|rot mon|hoc lai/.test(question))topics.push('FAILED_COURSES');
  if(/tin chi|tich luy|tien do/.test(question))topics.push('CREDITS');
  if(/ojt|dieu kien|thuc tap/.test(question))topics.push('ELIGIBILITY');
  if(/gpa|diem trung binh/.test(question))topics.push('GPA');
  if(/canh bao|muc do|rui ro|risk/.test(question))topics.push('ACADEMIC_WARNING');
  if(/ky (hoc|may)|hoc ky|dang o ky/.test(question))topics.push('SEMESTER');
  const wantsAdvice=/nen |lam gi|tu van|khuyen nghi|ke hoach|goi y|tien quyet|mon can hoc/.test(question);
  if(wantsAdvice)topics.push('ADVICE');
  const academic=profile.academic, progress=profile.academicProgress;
  const valid=!!academic && academic.currentEligibility?.status!=='REVIEW_REQUIRED' && !!progress?.credits?.completeConfiguration;
  const courses=valid?(academic.failedCourses??[]).map((r:Row)=>({courseId:r.courseId,courseCode:r.courseCode??null,
    courseName:r.course?.name??r.course?.courseName??null})):null;
  const facts={currentSemester:profile.student?.currentSemester??null,
    earnedCredits:progress?.credits?.completeConfiguration?progress.credits.earned:null,
    missingCredits:valid?academic.missingCredits:null,failedCourseCount:valid?academic.failedCourseCount:null,
    failedCourses:courses,gpa:progress?.gpa??null,gpaScale:progress?.gpaScale??null,
    currentEligibilityStatus:academic?.currentEligibility?.status??'REVIEW_REQUIRED',
    ojtSemesterId:profile.ojtSemesterId??null,computedAt:academic?.computedAt??progress?.computedAt??null};
  const parts:string[]=[];
  if(topics.includes('ACADEMIC_WARNING'))parts.push(academic?.academicWarning
    ?`Mức cảnh báo học vụ hiện tại: ${academic.academicWarning.label}. ${academic.academicWarning.reasons.map((r:Row)=>r.message).join(' ')} Đây là cảnh báo theo quy tắc, không phải xác suất trễ OJT.`
    :'Chưa đủ dữ liệu để xác định mức cảnh báo học vụ.');
  if(topics.includes('FAILED_COURSES'))parts.push(!valid?'Chưa đủ dữ liệu đã đối soát để xác định danh sách môn còn nợ.'
    :courses.length?`Bạn hiện còn ${academic.failedCourseCount} môn chưa đạt: ${courses.map((r:Row)=>r.courseCode??`môn ID ${r.courseId}`).join(', ')}. Môn học lại đã đạt không còn được tính là môn nợ.`
    :'Theo dữ liệu hiện tại, bạn không có môn còn nợ.');
  if(topics.includes('CREDITS'))parts.push(facts.earnedCredits===null?'Dữ liệu tín chỉ chưa đầy đủ để tính chính xác.'
    :`Bạn đã tích lũy ${facts.earnedCredits} tín chỉ.${facts.missingCredits===null?' Chưa xác định được tín chỉ còn thiếu để xét OJT.':` Còn thiếu ${facts.missingCredits} tín chỉ so với ngưỡng xét OJT.`}`);
  if(topics.includes('ELIGIBILITY'))parts.push(academic?.earlyWarning?.message??'Chưa xác định được kỳ OJT hoặc dữ liệu xét của bạn. Vui lòng liên hệ phòng đào tạo.');
  if(topics.includes('GPA'))parts.push(facts.gpa===null?'Chưa đủ dữ liệu để tính GPA.':`GPA hiện tại của bạn là ${facts.gpa} trên thang ${facts.gpaScale}.`);
  if(topics.includes('SEMESTER'))parts.push(facts.currentSemester===null?'Chưa xác định được kỳ học theo lộ trình.':`Bạn hiện ở kỳ ${facts.currentSemester} theo lộ trình được nhà trường cấu hình.`);
  if(!topics.length)return {status:'OUT_OF_SCOPE',topics:[],answer:'Mình hỗ trợ thông tin học vụ của chính bạn: môn còn nợ, tín chỉ, GPA, kỳ học và điều kiện OJT. Bạn muốn kiểm tra phần nào?',facts:null,wantsAdvice:false};
  if(wantsAdvice)parts.push(academic?.earlyWarning?.message??'Chưa có đủ dữ liệu để tạo tư vấn OJT.');
  return {status:valid?'ANSWERED':'DATA_INCOMPLETE',topics,answer:[...new Set(parts)].join('\n\n'),facts,wantsAdvice};
}
