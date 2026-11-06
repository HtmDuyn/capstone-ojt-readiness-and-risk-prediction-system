import { apiRequest } from './api';
export interface RiskAssessment {
  status:'ASSESSED'|'INSUFFICIENT_DATA';
  student:{id:number;fullName:string;studentCode:string;currentSemester:number|null};
  risk:{level:'LOW'|'MEDIUM'|'HIGH'|'INSUFFICIENT_DATA';label:string;computedAt:string;
    reasons:{code:string;message:string}[];limitations:string[];
    evidence:{earnedCredits:number|null;missingCredits:number|null;failedCourseCount:number;assessmentDeadline:string|null}};
  roadmap:{status:'READY'|'NOT_AVAILABLE'|'DATA_INCOMPLETE';targetSemester:number;objective:string;message:string;actions:string[];limitations:string[];
    items:{courseId:number;courseCode:string|null;name:string|null;recommendedSemester:number;priority:number;action:string;stage:string;
      canPlan:boolean;explanation:string;isAlternative:boolean;
      prerequisites:{satisfied:boolean;remainingRequired:number;courses:{courseId:number;courseCode:string|null;passed:boolean}[]}[];}[]};
}
export async function getOjtRiskAssessment(signal:AbortSignal):Promise<RiskAssessment>{
  return (await apiRequest<{data:RiskAssessment}>('/students/me/ojt-risk-assessment',{signal})).data;
}
