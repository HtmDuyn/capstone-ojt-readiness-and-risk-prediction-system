import { academicTransaction } from '../academic/academic.repository';
import { summaryWithClient } from './academic.service';
import { ownStudent, type Actor } from './shared';
import { generateOjtAdvice } from './ojt-advice';
import { readiness } from './readiness.service';

export async function courseAdvice(actor:Actor) {
  const profile=await readiness(actor,true),academic=profile.academic;
  if(!academic?.earlyWarning?.available)return {status:'NOT_AVAILABLE',message:academic?.earlyWarning?.message??'Chưa đủ dữ liệu học vụ hoặc kỳ OJT.',coursePlan:null,advice:null};
  if(profile.coursePlan?.status!=='READY')return {status:'DATA_INCOMPLETE',coursePlan:profile.coursePlan,advice:null,prioritySource:'CURRICULUM_RULES',isAiPrediction:false};
  const advice=await generateOjtAdvice({...academic,currentEligibility:{status:academic.currentEligibility?.status??'REVIEW_REQUIRED'}},
    {enabled:process.env.OJT_GEMINI_ENABLED,apiKey:process.env.GEMINI_API_KEY,model:process.env.GEMINI_MODEL});
  return {status:profile.coursePlan?.status==='READY'?'READY':'DATA_INCOMPLETE',coursePlan:profile.coursePlan,advice,
    prioritySource:'CURRICULUM_RULES',isAiPrediction:false};
}

export async function ojtAdvice(semesterId:number,actor:Actor) {
  const snapshot=await academicTransaction(async c=>{
    const student=await ownStudent(c,actor);
    return summaryWithClient(c,student.StudentID,semesterId);
  });
  // External requests run after releasing the database transaction.
  return generateOjtAdvice({...snapshot,currentEligibility:{status:String((snapshot.currentEligibility as Record<string,unknown>|null)?.status??'REVIEW_REQUIRED')}},{
    enabled:process.env.OJT_GEMINI_ENABLED,apiKey:process.env.GEMINI_API_KEY,model:process.env.GEMINI_MODEL,
  });
}
