import { enrichListRows } from '../../shared/list-context';
import { list as listOfficialResults } from '../ojt-results/result.service';
import type { PoolClient } from 'pg';
import { academicTransaction } from '../academic/academic.repository';
import { academicProgressWithClient } from '../students/academic-progress';
import { prospectiveEligibility, officialEligibilityWithClient } from '../eligibility/eligibility.service';
import { detail as curriculumDetail } from '../curriculum/curriculum.repository';



import { invalid, positiveId, pagination } from '../students/student.validation';
import { ownStudent, page, publicEligibility, type Row, type Actor } from './shared';

export async function summaryWithClient(c:PoolClient,studentId:number,semesterId:number) {
  const progress=await academicProgressWithClient(c,studentId);
  const current=await prospectiveEligibility(c,studentId,semesterId,progress),official=await officialEligibilityWithClient(c,studentId,semesterId);
  const results=(await c.query('SELECT "CourseID","Status" FROM "StudentCourseResults" WHERE "StudentID"=$1',[studentId])).rows;
  const outstanding=progress.requirements.filter((r:Row)=>!r.completed).map((r:Row)=>({...r,learningStatus:current.unpassedCourses.some((u:Row)=>r.choices.includes(u.courseId))?'FAILED':results.some(a=>r.choices.includes(a.CourseID)&&a.Status==='IN_PROGRESS')?'IN_PROGRESS':'NOT_STUDIED'}));
  // Requirements are unique curriculum slots; a scenario never counts a retake twice.
  const scenarioProgress=progress.credits.completeConfiguration?await academicProgressWithClient(c,studentId,undefined,true):null;
  const potential=scenarioProgress?.credits.completeConfiguration?Math.max(0,scenarioProgress.credits.earned-current.earnedCredits):null;
  const deadline=(await c.query('SELECT "ClosesAt" AS "assessmentDeadline","AssessmentAcademicPeriodID" AS "assessmentAcademicPeriodId" FROM "OJTAssessmentWindows" WHERE "OJTSemesterID"=$1',[semesterId])).rows[0]??null;
  return {studentId,ojtSemesterId:semesterId,earnedCredits:current.earnedCredits,missingCredits:current.missingCredits,failedCourseCount:current.unpassedCourseCount,failedCourses:current.unpassedCourses,outstandingCourses:outstanding,inProgressCredits:potential,currentEligibility:publicEligibility(current),officialEligibility:publicEligibility(official),scenario:{assumption:'ALL_CURRENT_COURSES_PASSED',potentialCredits:potential===null?null:current.earnedCredits+potential,isAiPrediction:false},gpa:progress.gpa,gpaScale:progress.gpaScale,issues:progress.issues,deadline,computedAt:progress.computedAt};
}
export async function summary(params:Row,actor:Actor) {
  pagination(params,['ojtSemesterId']);return academicTransaction(async c=>summaryWithClient(c,(await ownStudent(c,actor)).StudentID,positiveId(params.ojtSemesterId,'ojtSemesterId')));
}
export async function supplementary(params:Row,actor:Actor) {
  pagination(params,['ojtSemesterId']);return academicTransaction(async c=>{
    const s=await ownStudent(c,actor),data=await summaryWithClient(c,s.StudentID,positiveId(params.ojtSemesterId,'ojtSemesterId'));
    const prerequisites=(await c.query('SELECT pc."CourseID" AS "courseId",g."MinimumPassed" AS "minimumPassed",COALESCE(jsonb_agg(m."CourseID") FILTER(WHERE m."CourseID" IS NOT NULL),\'[]\'::jsonb) AS "courseIds" FROM "ProgramPrerequisiteGroups" g JOIN "ProgramCourses" pc ON pc."ProgramCourseID"=g."ProgramCourseID" LEFT JOIN "ProgramPrerequisiteMembers" m ON m."GroupID"=g."GroupID" WHERE g."ProgramID"=$1 GROUP BY pc."CourseID",g."GroupID"',[s.ProgramID])).rows;
    const displayPrerequisites=await enrichListRows(c,prerequisites);
    return {studentId:s.StudentID,missingCredits:data.missingCredits,items:await enrichListRows(c,data.outstandingCourses.filter((r:Row)=>r.learningStatus!=='IN_PROGRESS').map((r:Row)=>({requirementId:r.id,courseId:r.courseId,courseCode:r.courseCode,name:r.name,choices:r.choices,credits:r.credits,reason:r.learningStatus==='FAILED'?'RETAKE':'UNCOMPLETED_REQUIREMENT',prerequisites:displayPrerequisites.filter(p=>r.choices.includes(p.courseId)),availability:'NOT_MANAGED',isAiRecommendation:false}))),issues:data.issues};
  });
}
export async function curriculum(actor:Actor) {
  return academicTransaction(async c=>{const s=await ownStudent(c,actor),data=await curriculumDetail(c,s.ProgramID);if(data.status!=='PUBLISHED')throw invalid('Curriculum is not published.',409,'CURRICULUM_NOT_PUBLISHED');return {id:data.id,code:data.code,name:data.name,version:data.version,courses:data.courses,prerequisites:data.prerequisites,combos:data.combos,equivalences:data.equivalences.map((e:Row)=>({sourceCourseId:e.sourceCourseId,targetCourseId:e.targetCourseId}))};});
}
export async function notifications(params:Row,actor:Actor) {
  if(params.unread!==undefined&&!['true','false'].includes(params.unread))throw invalid('unread must be true or false.');
  return academicTransaction(async c=>{await ownStudent(c,actor);const list=await page(c,'SELECT "NotificationID" AS id,"Title" AS title,"Content" AS content,"SentAt" AS "sentAt","IsRead" AS "isRead" FROM "Notifications" WHERE "UserID"=$1 AND ($2::boolean IS NULL OR COALESCE("IsRead",false)=NOT $2)',[actor.userId,params.unread===undefined?null:params.unread==='true'],params,['unread']);return {...list,unreadCount:(await c.query('SELECT count(*)::int AS n FROM "Notifications" WHERE "UserID"=$1 AND COALESCE("IsRead",false)=false',[actor.userId])).rows[0].n};});
}
export async function readNotification(id:number,actor:Actor,isRead:boolean) {return academicTransaction(async c=>{await ownStudent(c,actor);const r=(await c.query('UPDATE "Notifications" SET "IsRead"=$3 WHERE "NotificationID"=$1 AND "UserID"=$2 RETURNING "NotificationID" AS id,"IsRead" AS "isRead"',[id,actor.userId,isRead])).rows[0];if(!r)throw invalid('Notification not found.',404);return r;});}
export async function currentAssignment(params:Row,actor:Actor) {
  pagination(params,['ojtSemesterId']);return academicTransaction(async c=>{const s=await ownStudent(c,actor);return (await c.query('SELECT a."AssignmentID" AS id,a."EnterpriseID" AS "enterpriseId",e."Name" AS "enterpriseName",a."PositionID" AS "positionId",p."Title" AS title,p."OJTSemesterID" AS "ojtSemesterId",a."EnterpriseSupervisorName" AS "enterpriseSupervisorName",a."StartDate" AS "startDate",a."EndDate" AS "endDate",a."Status" AS status FROM "InternshipAssignments" a JOIN "InternshipPositions" p ON p."PositionID"=a."PositionID" JOIN "Enterprises" e ON e."EnterpriseID"=a."EnterpriseID" WHERE a."StudentID"=$1 AND COALESCE(UPPER(a."Status"),\'\') NOT IN (\'CANCELLED\',\'CANCELED\') AND ($2::int IS NULL OR p."OJTSemesterID"=$2) ORDER BY a."AssignmentID" DESC LIMIT 1',[s.StudentID,params.ojtSemesterId===undefined?null:positiveId(params.ojtSemesterId,'ojtSemesterId')])).rows[0]??null;});
}
export async function publishedResults(params:Row,actor:Actor,id?:number) {
  const data=await listOfficialResults({...params,...(id?{resultId:id}:{})},undefined,false,actor.userId);
  if(id&&!data.items.length)throw invalid('Published result not found.',404);
  return id?data.items[0]:data;
}
