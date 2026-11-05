import { apiRequest } from './api';
export interface AcademicWarning {
  level:'LOW'|'MEDIUM'|'HIGH'|'INSUFFICIENT_DATA';label:string;policyVersion:string;
  reasons:{code:string;message:string}[];actions:string[];limitations:string[];
  evidence:{currentSemester:number|null;earnedCredits:number|null;missingCredits:number|null;failedCourseCount:number;
    assessmentDeadline:string|null;daysUntilAssessment:number|null};
}
export interface Advice {status:string;source:string;explanation:string;recommendations:string[];fallbackReason:string|null;}
export interface CourseItem {
  courseId:number;courseCode:string;name:string;action:string;priority:number;explanation:string;canPlan:boolean;
  prerequisites:{satisfied:boolean;remainingRequired:number;courses:{courseCode:string;passed:boolean}[]}[];
}
export interface CourseAdvice {status:string;message?:string;coursePlan:{status:string;message:string;items:CourseItem[]}|null;advice:Advice|null;}
export interface Impact {explanation:string;message:string;dependentCourses:{courseCode:string;unlocksAfterPassing:boolean}[];indirectCourses:{courseCode:string}[];}
export interface Simulation {before:{earnedCredits:number;missingCredits:number;failedCourseCount:number};after:{earnedCredits:number;missingCredits:number;failedCourseCount:number};message:string;prerequisiteWarnings:{courseCode:string;message:string}[];}
export interface ChatAnswer {answer:string;recommendations:string[];adviceStatus:string|null;}
async function get<T>(path:string,signal:AbortSignal){return (await apiRequest<{data:T}>(path,{signal})).data;}
async function post<T>(path:string,body:unknown,signal:AbortSignal){return (await apiRequest<{data:T}>(path,{method:'POST',body:JSON.stringify(body),signal})).data;}
export const studentAcademic={
  warning:(signal:AbortSignal)=>get<AcademicWarning>('/students/me/academic-warning',signal),
  readiness:(signal:AbortSignal)=>get<{ojtSemesterId:number|null;academic:{academicWarning:AcademicWarning;earlyWarning:{available:boolean}}|null}>('/students/me/ojt-readiness',signal),
  advice:(ojtSemesterId:number,signal:AbortSignal)=>post<Advice>('/students/me/ojt-advice',{ojtSemesterId},signal),
  courses:(signal:AbortSignal)=>post<CourseAdvice>('/students/me/course-advice',{},signal),
  impact:(courseCode:string,signal:AbortSignal)=>post<Impact>('/students/me/course-impact',{courseCode},signal),
  simulate:(passedCourseCodes:string[],signal:AbortSignal)=>post<Simulation>('/students/me/study-simulation',{passedCourseCodes},signal),
  chat:(message:string,signal:AbortSignal)=>post<ChatAnswer>('/students/me/academic-chat',{message},signal),
};
