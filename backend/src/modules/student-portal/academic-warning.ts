export type WarningLevel='LOW'|'MEDIUM'|'HIGH'|'INSUFFICIENT_DATA';
type Input={available:boolean;gateReasons:string[];semester:number|null;status:string;
  earnedCredits:number|null;missingCredits:number|null;debt:number;maxDebt:number|null;
  overdueCredits:number|null;overdueCourses:string[];blockingCourses:string[]|null;
  projectedStatus:string|null;projectedCredits:number|null;projectedDebt:number|null;
  deadline:string|null;now?:Date};

export function assessAcademicWarning(input:Input) {
  const now=input.now??new Date();
  const deadline=input.deadline&&Number.isFinite(Date.parse(input.deadline))?input.deadline:null;
  const deadlinePassed=deadline!==null&&Date.parse(deadline)<=now.getTime();
  const reasons:{code:string;message:string}[]=[];
  const actions:string[]=[];
  const limitations=['Mức cảnh báo theo quy tắc học vụ, không phải xác suất trễ OJT hoặc quyết định chính thức.'];
  if(!deadline)limitations.push('Chưa có hạn xét OJT hợp lệ; chưa đánh giá khả năng hoàn thành trước hạn.');
  limitations.push('Kịch bản đạt môn đang học chưa xác nhận thời điểm chốt điểm; không chứng minh có thể đạt điều kiện trước hạn.');
  let level:WarningLevel='INSUFFICIENT_DATA';
  const reason=(code:string,message:string)=>reasons.push({code,message});
  if(!input.available){reason('MONITORING_UNAVAILABLE','Chưa đủ điều kiện theo dõi sớm hoặc dữ liệu cần đối soát.');}
  else if(input.status==='ELIGIBLE'){
    level='LOW';reason('CURRENT_REQUIREMENTS_MET','Hiện đáp ứng ngưỡng tín chỉ và môn nợ để xét OJT.');
    actions.push('Duy trì kết quả học tập và theo dõi xác nhận chính thức của nhà trường.');
  }else if(deadlinePassed || (input.semester!==null&&input.semester>=6)){
    level='HIGH';reason(deadlinePassed?'ASSESSMENT_DEADLINE_PASSED':'OJT_STAGE_REACHED',deadlinePassed?'Đã đến hoặc qua hạn xét nhưng chưa đáp ứng điều kiện.':'Đã đến giai đoạn OJT nhưng hiện chưa đáp ứng điều kiện.');
  }else if(input.semester===5){
    if(input.projectedStatus===null||input.projectedStatus==='REVIEW_REQUIRED')reason('SCENARIO_UNAVAILABLE','Chưa đủ dữ liệu cho kịch bản đạt các môn đang học.');
    else if(input.projectedStatus==='ELIGIBLE'){
      level='MEDIUM';reason('CURRENT_COURSES_COULD_CLOSE_GAP','Nếu đạt toàn bộ môn đang học, phép tính đạt ngưỡng OJT; cần theo dõi điểm và thời hạn.');
    }else{
      level='HIGH';reason('CURRENT_COURSES_DO_NOT_CLOSE_GAP','Ở kỳ 5, ngay cả kịch bản đạt toàn bộ môn đang học vẫn chưa đáp ứng điều kiện; cần bổ sung kế hoạch học/học lại.');
    }
  }else if(input.overdueCredits===null||input.blockingCourses===null){
    reason('PATHWAY_BASELINE_INCOMPLETE','Chưa đủ mốc học kỳ hoặc quy tắc tiên quyết để so tiến độ với lộ trình.');
  }else if(input.semester===4&&input.blockingCourses.length){
    level='HIGH';reason('LATE_STAGE_PREREQUISITE_BOTTLENECK','Ở kỳ 4, môn còn nợ đang chặn môn đã đến hạn theo lộ trình.');
  }else if(input.overdueCredits>0 || (input.maxDebt!==null&&input.debt>input.maxDebt) || input.blockingCourses.length){
    level='MEDIUM';reason('PATHWAY_FOLLOW_UP_REQUIRED','Còn môn theo lộ trình kỳ trước chưa hoàn thành hoặc môn nợ cần được xử lý.');
  }else{
    level='LOW';reason('ON_TRACK_FOR_CURRENT_STAGE','Tiến độ các kỳ đã hoàn thành phù hợp với lộ trình; chưa đạt ngưỡng tín chỉ OJT ở giai đoạn này không tự tạo mức cao.');
  }
  if(input.available&&input.status!=='ELIGIBLE'){
    if(input.missingCredits!==null&&input.missingCredits>0)reason('CREDIT_SHORTFALL',`Còn thiếu ${input.missingCredits} tín chỉ so với ngưỡng OJT.`);
    if(input.maxDebt!==null&&input.debt>input.maxDebt)reason('EXCESS_DEBT',`Có ${input.debt} môn nợ, vượt giới hạn ${input.maxDebt} môn.`);
    if(input.blockingCourses?.length)actions.push('Ưu tiên học lại các môn tiên quyết đang chặn môn theo lộ trình.');
    if(level==='HIGH')actions.push('Trao đổi sớm với phòng đào tạo/cố vấn để lập kế hoạch bổ sung và kiểm tra hạn xét.');
    else actions.push('Theo dõi môn đang học, hoàn thành môn nợ và cập nhật tiến độ khi có điểm mới.');
  }
  if(level==='INSUFFICIENT_DATA')actions.push('Liên hệ phòng đào tạo để bổ sung dữ liệu hoặc xác nhận lộ trình học vụ.');
  return {level,label:{LOW:'Thấp',MEDIUM:'Cần theo dõi',HIGH:'Cần ưu tiên hỗ trợ',INSUFFICIENT_DATA:'Chưa đủ dữ liệu'}[level],
    method:'ACADEMIC_RULES',policyVersion:'ACADEMIC_RULES_V1',isAiPrediction:false,riskScore:null,
    reasons,actions,limitations,computedAt:now.toISOString(),
    evidence:{currentSemester:input.semester,earnedCredits:input.earnedCredits,missingCredits:input.missingCredits,
      failedCourseCount:input.debt,maxUnpassedCourses:input.maxDebt,overdueCredits:input.overdueCredits,
      overdueCourses:input.overdueCourses,blockingCourses:input.blockingCourses,monitoringGateReasons:input.gateReasons,
      scenario:{assumption:'ALL_CURRENT_COURSES_PASSED',status:input.projectedStatus,earnedCredits:input.projectedCredits,failedCourseCount:input.projectedDebt},
      assessmentDeadline:deadline,daysUntilAssessment:deadline?Math.ceil((Date.parse(deadline)-now.getTime())/86400000):null}};
}
