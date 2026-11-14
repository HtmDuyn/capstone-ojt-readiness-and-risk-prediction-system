import { apiRequest } from './studentService';
export interface JobMatch {
  rank:number; positionId:number; postId:number; title:string; company:{id:number;name:string};
  location:string|null; workMode:string|null; remainingSlots:number; deadlineAt:string|null;
  canApply:boolean; blockers:string[]; relevanceScore:number; matchedSkills:string[];
  requirementsNotEvidenced:string[]; reason:string; reviewNote:string;
}
export interface JobMatchingResult {
  status:'READY'|'NO_READY_POSITIONS'|'WINDOW_UNAVAILABLE'; windowId:number; cvFileId:number;
  analysisId:number; cvRevision:number; candidateCount:number; blockers:string[];
  matches:JobMatch[]; model?:string; generatedAt?:string; cached?:boolean; scoreMeaning:string;
}
export async function matchStudentJobs(windowId:number, signal:AbortSignal) {
  const response = await apiRequest<{data:JobMatchingResult}>('/students/me/job-matches',{
    method:'POST',data:{windowId,consent:true},signal,timeout:90000,
  });
  return response.data;
}
