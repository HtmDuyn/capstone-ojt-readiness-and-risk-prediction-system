import { apiRequest } from './studentService';
export interface CvEntry {evidence:{page:number;quote:string}|null;[key:string]:string|number|string[]|{page:number;quote:string}|null;}
export interface CvProfile {summary:string|null;skills:CvEntry[];projects:CvEntry[];experience:CvEntry[];languages:CvEntry[];education:CvEntry[];}
export interface CvAnalysis {id:number;cvFileId:number;status:'PROCESSING'|'NEEDS_REVIEW'|'CONFIRMED'|'FAILED';revision:number;schemaVersion:string;modelVersion:string;profile:CvProfile|null;error:{code:string;message:string}|null;canRetry:boolean;}
export interface MatchingProfile {cv:{id:number}|null;status:string;analysis:CvAnalysis|null;usableForMatching:boolean;
  officialAcademic:{programCode:string|null;major:string|null;gpa:number|null;gpaScale:number|null};discrepancies:string[];message:string;}
export const cvAnalysisApi={
 get:async(signal:AbortSignal)=>(await apiRequest<{data:MatchingProfile}>('/students/me/matching-profile',{signal})).data,
 analyze:async(cvFileId:number,signal:AbortSignal)=>(await apiRequest<{data:{analysis:CvAnalysis;replayed:boolean;reviewMessage?:string|null}}>('/students/me/cv/analyses',{
  method:'POST',data:{cvFileId,consent:true},signal,timeout:90000,
 })).data,
 save:async(analysisId:number,revision:number,profile:CvProfile,confirm:boolean,signal:AbortSignal)=>(await apiRequest<{data:{analysis:CvAnalysis}}>('/students/me/matching-profile',{
  method:'PATCH',data:{analysisId,revision,profile,confirm},signal,
 })).data,
};
