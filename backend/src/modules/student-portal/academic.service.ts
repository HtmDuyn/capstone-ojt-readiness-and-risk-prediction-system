import { enrichListRows } from '../../shared/list-context';
import type { PoolClient } from 'pg';
import { academicTransaction } from '../academic/academic.repository';
import { loadAcademicProgress,progressFromData,type AcademicProgressData } from '../students/academic-progress';
import { readTransaction } from '../qhdn/read.repository';
import { eligibility } from '../eligibility/eligibility.service';
import { admissionEligibilityWithClient } from '../eligibility/admission.service';
import { detail as curriculumDetail } from '../curriculum/curriculum.repository';



import { invalid, positiveId, pagination } from '../students/student.validation';
import { ownStudent, page, publicEligibility, type Row, type Actor } from './shared';

export async function summaryWithClient(c:PoolClient,studentId:number,semesterId:number,loaded?:AcademicProgressData,eligibilityData?:Row) {
  const source=loaded??await loadAcademicProgress(c,studentId);
  const progress=progressFromData(source);
  const decision=eligibilityData??await eligibility(studentId,{ojtSemesterId:semesterId},c,progress,source);
  const current=decision.current,official=decision.official;
  const results=source.attempts;
  const outstanding=progress.requirements.filter((r:Row)=>!r.completed).map((r:Row)=>({...r,learningStatus:current.unpassedCourses.some((u:Row)=>r.choices.includes(u.courseId))?'FAILED':results.some(a=>r.choices.includes(a.courseId)&&a.status==='IN_PROGRESS')?'IN_PROGRESS':'NOT_STUDIED'}));
  // Requirements are unique curriculum slots; a scenario never counts a retake twice.
  const scenarioProgress=progress.credits.completeConfiguration?progressFromData(source,true):null;
  const potential=scenarioProgress?.credits.completeConfiguration?Math.max(0,scenarioProgress.credits.earned-current.earnedCredits):null;
  const deadline=(await c.query('SELECT "ClosesAt" AS "assessmentDeadline","AssessmentAcademicPeriodID" AS "assessmentAcademicPeriodId" FROM "OJTAssessmentWindows" WHERE "OJTSemesterID"=$1',[semesterId])).rows[0]??null;
  const [data]=await enrichListRows(c,[{studentId,programId:progress.program?.id,ojtSemesterId:semesterId,earnedCredits:current.earnedCredits,missingCredits:current.missingCredits,failedCourseCount:current.unpassedCourseCount,failedCourses:current.unpassedCourses,outstandingCourses:outstanding,inProgressCredits:potential,currentEligibility:publicEligibility(current),officialEligibility:publicEligibility(official),academicProgress:progress,scenario:{assumption:'ALL_CURRENT_COURSES_PASSED',potentialCredits:potential===null?null:current.earnedCredits+potential,isAiPrediction:false},gpa:progress.gpa,gpaScale:progress.gpaScale,issues:progress.issues,deadline,computedAt:progress.computedAt}]);
  return {...data,admissionEligibility:await admissionEligibilityWithClient(c,studentId,semesterId),failedCourses:await enrichListRows(c,current.unpassedCourses),outstandingCourses:await enrichListRows(c,outstanding)};
}
export async function supplementaryWithClient(c:PoolClient,studentId:number,programId:number,data:Row) {
    const prerequisites=(await c.query('SELECT pc."CourseID" AS "courseId",g."MinimumPassed" AS "minimumPassed",COALESCE(jsonb_agg(m."CourseID") FILTER(WHERE m."CourseID" IS NOT NULL),\'[]\'::jsonb) AS "courseIds" FROM "ProgramPrerequisiteGroups" g JOIN "ProgramCourses" pc ON pc."ProgramCourseID"=g."ProgramCourseID" LEFT JOIN "ProgramPrerequisiteMembers" m ON m."GroupID"=g."GroupID" WHERE g."ProgramID"=$1 GROUP BY pc."CourseID",g."GroupID"',[programId])).rows;
    const displayPrerequisites=await enrichListRows(c,prerequisites);
    return {studentId,missingCredits:data.missingCredits,items:await enrichListRows(c,data.outstandingCourses.filter((r:Row)=>r.learningStatus!=='IN_PROGRESS').map((r:Row)=>({requirementId:r.id,courseId:r.courseId,courseCode:r.courseCode,name:r.name,choices:r.choices,credits:r.credits,reason:r.learningStatus==='FAILED'?'RETAKE':'UNCOMPLETED_REQUIREMENT',prerequisites:displayPrerequisites.filter(p=>r.choices.includes(p.courseId)),availability:'NOT_MANAGED',isAiRecommendation:false}))),issues:data.issues};
}
export async function curriculumWithClient(c:PoolClient,studentId:number,programId:number) {
  const data=await curriculumDetail(c,programId);
  if(data.status!=='PUBLISHED')throw invalid('Curriculum is not published.',409,'CURRICULUM_NOT_PUBLISHED');
  return (await enrichListRows(c,[{...data,studentId}]))[0];
}
export async function notifications(params:Row,actor:Actor,existingClient?:PoolClient) {
  if(params.unread!==undefined&&!['true','false'].includes(params.unread))throw invalid('unread must be true or false.');
  return readTransaction(async c=>{await ownStudent(c,actor);const list=await page(c,'SELECT "NotificationID" AS id,"Title" AS title,"Content" AS content,"SentAt" AS "sentAt","IsRead" AS "isRead","Channel" AS channel,"TemplateID" AS "templateId","RelatedEntityType" AS "relatedEntityType","RelatedEntityID" AS "relatedEntityId" FROM "Notifications" WHERE "UserID"=$1 AND ($2::boolean IS NULL OR COALESCE("IsRead",false)=NOT $2)',[actor.userId,params.unread===undefined?null:params.unread==='true'],params,['unread']);return {...list,unreadCount:(await c.query('SELECT count(*)::int AS n FROM "Notifications" WHERE "UserID"=$1 AND COALESCE("IsRead",false)=false',[actor.userId])).rows[0].n};},existingClient);
}
export async function readNotification(id:number,actor:Actor,isRead:boolean,existingClient?:PoolClient) {return academicTransaction(async c=>{await ownStudent(c,actor);const r=(await c.query('UPDATE "Notifications" SET "IsRead"=$3 WHERE "NotificationID"=$1 AND "UserID"=$2 RETURNING "NotificationID" AS id,"Title" AS title,"Content" AS content,"SentAt" AS "sentAt","IsRead" AS "isRead","Channel" AS channel,"TemplateID" AS "templateId","RelatedEntityType" AS "relatedEntityType","RelatedEntityID" AS "relatedEntityId"',[id,actor.userId,isRead])).rows[0];if(!r)throw invalid('Notification not found.',404);return {...r,unreadCount:(await c.query('SELECT count(*)::int AS n FROM "Notifications" WHERE "UserID"=$1 AND COALESCE("IsRead",false)=false',[actor.userId])).rows[0].n};},existingClient);}
export async function currentAssignment(params:Row,actor:Actor,existingClient?:PoolClient) {
  pagination(params,['ojtSemesterId','assignmentId']);
  return readTransaction(async c=>{
    const s=await ownStudent(c,actor);
    const row=(await c.query(`SELECT a."AssignmentID" AS id,a."StudentID" AS "studentId",a."EnterpriseID" AS "enterpriseId",
      e."Name" AS "enterpriseName",a."PositionID" AS "positionId",p."Title" AS title,p."OJTSemesterID" AS "ojtSemesterId",
      a."CoordinationID" AS "coordinationId",co."RegistrationID" AS "registrationId",
      jsonb_build_object('id',registration."RegistrationID",'studentId',registration."StudentID",'ojtSemesterId',registration."OJTSemesterID",'windowId',registration."WindowID",'status',registration."Status",'registeredAt',registration."RegisteredAt",'application',registration."Application"-'cvUrl') AS registration,
      a."EnterpriseSupervisorName" AS "enterpriseSupervisorName",a."AcademicSupervisorID" AS "academicSupervisorId",
      CASE WHEN supervisor."UserID" IS NULL THEN NULL ELSE jsonb_build_object('id',supervisor."UserID",'fullName',supervisor."FullName",'email',supervisor."Email",'phone',supervisor."Phone") END AS "academicSupervisor",
      to_char(a."StartDate",'YYYY-MM-DD') AS "startDate",to_char(a."EndDate",'YYYY-MM-DD') AS "endDate",a."Status" AS status
      FROM "InternshipAssignments" a JOIN "InternshipPositions" p ON p."PositionID"=a."PositionID"
      JOIN "Enterprises" e ON e."EnterpriseID"=a."EnterpriseID"
      JOIN "StudentEnterpriseCoordination" co ON co."CoordinationID"=a."CoordinationID"
      JOIN "OJTRegistrations" registration ON registration."RegistrationID"=co."RegistrationID"
      LEFT JOIN "Users" supervisor ON supervisor."UserID"=a."AcademicSupervisorID"
      WHERE a."StudentID"=$1 AND ($3::int IS NOT NULL OR COALESCE(UPPER(a."Status"),'') NOT IN ('CANCELLED','CANCELED'))
      AND ($2::int IS NULL OR p."OJTSemesterID"=$2) AND ($3::int IS NULL OR a."AssignmentID"=$3) ORDER BY a."AssignmentID" DESC LIMIT 1`,
      [s.StudentID,params.ojtSemesterId===undefined?null:positiveId(params.ojtSemesterId,'ojtSemesterId'),params.assignmentId===undefined?null:positiveId(params.assignmentId,'assignmentId')])).rows[0];
    return row?(await enrichListRows(c,[row]))[0]:null;
  },existingClient);
}
