import { inputObject, requiredText } from '../students/student.validation';
import { readiness } from './readiness.service';
import { academicAnswer } from './academic-chat';
import { generateOjtAdvice } from './ojt-advice';
import type { Actor } from './shared';
import { courseScenario } from './course-scenario.service';

export async function academicChat(body:unknown,actor:Actor) {
  const b=inputObject(body,['message']);
  const message=requiredText(b.message,'message',1000);
  const normalized=message.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/đ/g,'d');
  const codes=(message.match(/\b[a-z]{2,5}\d{2,4}[a-z]?\b/gi)??[]).map(code=>code.toUpperCase());
  const simulation=/(neu|gia su|mo phong)/.test(normalized)&&/(qua|dat|hoan thanh)/.test(normalized)&&!/(chua dat|khong dat)/.test(normalized);
  const impact=/(anh huong|bi chan|tien quyet)/.test(normalized)&&codes.length>0;
  if(simulation||impact){
    const common={source:'ACADEMIC_RECORDS',isAiPrediction:false,recommendations:[],adviceSource:null,adviceStatus:null,aiError:null};
    if(!codes.length||(!simulation&&codes.length!==1))return {...common,status:'NEED_COURSE_SELECTION',topics:[simulation?'STUDY_SIMULATION':'COURSE_IMPACT'],
      answer:simulation?'Bạn hãy ghi rõ mã các môn muốn giả định đạt, ví dụ: Nếu mình qua SWP391 và SWR302 thì còn thiếu bao nhiêu tín chỉ?':'Bạn hãy chọn một mã môn cụ thể để kiểm tra ảnh hưởng.',facts:null};
    const scenario=await courseScenario(simulation?{passedCourseCodes:codes}:{courseCode:codes[0]},actor,simulation?'SIMULATION':'IMPACT');
    return {...common,status:'ANSWERED',topics:[simulation?'STUDY_SIMULATION':'COURSE_IMPACT'],facts:scenario,
      answer:'before' in scenario?`Nếu đạt các môn đã chọn, tín chỉ tích lũy dự kiến thay đổi từ ${scenario.before.earnedCredits} lên ${scenario.after.earnedCredits}; còn thiếu ${scenario.after.missingCredits} tín chỉ và còn ${scenario.after.failedCourseCount} môn nợ. Đây là kết quả giả định, không thay đổi điểm hoặc quyết định OJT chính thức.`:scenario.explanation};
  }
  const profile=await readiness(actor,true);
  const {wantsAdvice,...result}=academicAnswer(message,profile);
  const academic=profile.academic;
  // Factual answers never require an external provider; advice follows the existing gate.
  const advice=wantsAdvice&&academic?await generateOjtAdvice({...academic,
    currentEligibility:{status:academic.currentEligibility?.status??'REVIEW_REQUIRED'}},
    {enabled:process.env.OJT_GEMINI_ENABLED,apiKey:process.env.GEMINI_API_KEY,model:process.env.GEMINI_MODEL}):null;
  const coursePlan=wantsAdvice&&academic?.earlyWarning?.available?profile.coursePlan:null;
  const priorityText=coursePlan?.status==='READY'?coursePlan.items.slice(0,5).map(r=>r.explanation).join('\n'):'';
  return {...result,answer:[result.answer,priorityText].filter(Boolean).join('\n\n'),coursePlan,
    source:'ACADEMIC_RECORDS',isAiPrediction:false,
    recommendations:advice?.recommendations??[],adviceSource:advice?.source??null,
    adviceStatus:advice?.status??null,aiError:advice?.aiError??null};
}
