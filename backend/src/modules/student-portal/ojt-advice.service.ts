import { academicTransaction } from '../academic/academic.repository';
import { summaryWithClient } from './academic.service';
import { ownStudent, type Actor } from './shared';
import { generateOjtAdvice } from './ojt-advice';

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
