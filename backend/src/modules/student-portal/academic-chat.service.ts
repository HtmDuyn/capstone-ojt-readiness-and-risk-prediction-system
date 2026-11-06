import { inputObject, requiredText } from '../students/student.validation';
import { readiness } from './readiness.service';
import { academicAnswer } from './academic-chat';
import { ChatAiError,interpretAcademicQuestion,writeAcademicAnswer,type ChatTopic } from './gemini-academic-chat';
import type { Actor } from './shared';
import { courseScenario } from './course-scenario.service';

export async function academicChat(body:unknown,actor:Actor) {
  const b=inputObject(body,['message']);
  const message=requiredText(b.message,'message',1000);
  // One shared deadline bounds both interpretation and writing. No DB transaction
  // is held open while waiting for the provider.
  const signal=AbortSignal.timeout(45000);
  let interpreted:ChatTopic[]=[];
  let interpretationError:unknown;
  try{interpreted=await interpretAcademicQuestion(message,signal);}catch(e){interpretationError=e;}
  const finish=async (result:Record<string,any>)=>{
    let error=interpretationError;
    if(!error){
      try{
        const answer=await writeAcademicAnswer(message,{
          topics:result.topics,status:result.status,backendAnswer:result.answer,facts:result.facts,
          academicWarning:result.academicWarning??null,coursePlan:result.coursePlan
            ?{status:result.coursePlan.status,message:result.coursePlan.message,items:result.coursePlan.items?.slice(0,10)??[]}:null,
          monitoringAvailable:result.monitoringAvailable??false,
        },signal);
        return {...result,answer,answerSource:'GEMINI',adviceSource:'GEMINI',adviceStatus:'READY',
          modelVersion:process.env.GEMINI_MODEL?.trim()??null,aiError:null};
      }catch(e){error=e;}
    }
    const failure=error instanceof ChatAiError?error:new ChatAiError('AI_PROVIDER_FAILED');
    return {...result,answerSource:'RULES',adviceSource:'RULES',adviceStatus:'FALLBACK',modelVersion:null,
      aiError:{code:failure.code,httpStatus:failure.httpStatus,message:'Chưa thể tạo lời tư vấn bằng Gemini; đang hiển thị thông tin do backend xác định.'}};
  };
  const normalized=message.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/đ/g,'d');
  const codes=(message.match(/\b[a-z]{2,5}\d{2,4}[a-z]?\b/gi)??[]).map(code=>code.toUpperCase());
  const simulation=interpreted.includes('STUDY_SIMULATION')||(/(neu|gia su|mo phong)/.test(normalized)&&/(qua|dat|hoan thanh)/.test(normalized)&&!/(chua dat|khong dat)/.test(normalized));
  const impact=interpreted.includes('COURSE_IMPACT')||(/(anh huong|bi chan|tien quyet)/.test(normalized)&&codes.length>0);
  if(simulation||impact){
    const common={source:'ACADEMIC_RECORDS',isAiPrediction:false,recommendations:[],adviceSource:null,adviceStatus:null,aiError:null};
    if(!codes.length||(!simulation&&codes.length!==1))return finish({...common,status:'NEED_COURSE_SELECTION',topics:[simulation?'STUDY_SIMULATION':'COURSE_IMPACT'],
      answer:simulation?'Bạn hãy ghi rõ mã các môn muốn giả định đạt.':'Bạn hãy chọn một mã môn cụ thể để kiểm tra ảnh hưởng.',facts:null});
    const scenario=await courseScenario(simulation?{passedCourseCodes:codes}:{courseCode:codes[0]},actor,simulation?'SIMULATION':'IMPACT');
    return finish({...common,status:'ANSWERED',monitoringAvailable:simulation,topics:[simulation?'STUDY_SIMULATION':'COURSE_IMPACT'],facts:scenario,
      answer:'before' in scenario?`Nếu đạt các môn đã chọn, tín chỉ tích lũy dự kiến thay đổi từ ${scenario.before.earnedCredits} lên ${scenario.after.earnedCredits}; còn thiếu ${scenario.after.missingCredits} tín chỉ và còn ${scenario.after.failedCourseCount} môn nợ. Đây là kết quả giả định, không thay đổi điểm hoặc quyết định OJT chính thức.`:scenario.explanation});
  }
  const profile=await readiness(actor,true);
  const canonical:Partial<Record<ChatTopic,string>>={FAILED_COURSES:'môn nợ',CREDITS:'tín chỉ',ELIGIBILITY:'điều kiện OJT',GPA:'GPA',SEMESTER:'học kỳ',ACADEMIC_WARNING:'cảnh báo',ADVICE:'nên học lại môn nào'};
  const query=[message,...interpreted.map(t=>canonical[t]??'')].join(' ');
  const {wantsAdvice,...result}=academicAnswer(query,profile);
  const academic=profile.academic;
  const coursePlan=wantsAdvice&&academic?.earlyWarning?.available?profile.coursePlan:null;
  const priorityText=coursePlan?.status==='READY'?coursePlan.items.slice(0,5).map(r=>r.explanation).join('\n'):'';
  const greeting=(interpreted.length===1&&interpreted[0]==='GREETING')
    ||/^(hi|hello|hey|chao|xin chao|chao ban|alo)[\s!.?]*$/.test(normalized.trim());
  return finish({...result,status:greeting?'ANSWERED':result.status,topics:greeting?['GREETING']:result.topics,academicWarning:academic?.academicWarning??null,
    answer:greeting?'Chào bạn! Mình có thể hỗ trợ kiểm tra tín chỉ, môn nợ và kế hoạch học OJT của bạn.':[result.answer,priorityText].filter(Boolean).join('\n\n'),coursePlan,
    monitoringAvailable:!!academic?.earlyWarning?.available,
    source:'ACADEMIC_RECORDS',isAiPrediction:false,
    recommendations:[],adviceSource:null,adviceStatus:null,aiError:null});
}
