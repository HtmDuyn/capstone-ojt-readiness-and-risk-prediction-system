import { enrichListRows } from '../../shared/list-context';
import type { PoolClient } from 'pg';
import { academicTransaction, audit } from '../academic/academic.repository';
import { readTransaction } from '../qhdn/read.repository';
import { occupied } from '../qhdn/catalog.service';
import { registrationRecord, eligibleOfficial } from '../ojt-registration/registration.service';
import { windowRecord } from '../ojt-registration/window.service';
import { currentCV, cvMetadataSql } from './cv.service';
import { officialEligibilityWithClient } from '../eligibility/eligibility.service';
import { inScope } from '../student-portal/shared';
import { hasSemesterRecruitment } from '../qhdn/recruitment-readiness';
import { invalid, inputObject, positiveId, optionalText, pagination, enumValue } from './student.validation';
import type { Actor, Row } from '../ojt-registration/window.service';

export async function ownStudent(c:PoolClient,actor:Actor) {
  if(actor.roleCode!=='STUDENT')throw invalid('Chức năng dành cho sinh viên.',403,'FORBIDDEN');
  const s=(await c.query(`SELECT s.*,placement."CohortID",placement."GroupCode",program."SpecializationID" FROM "Students" s JOIN "Users" u ON u."UserID"=s."UserID" LEFT JOIN "StudentAcademicPlacements" placement ON placement."StudentID"=s."StudentID" LEFT JOIN "TrainingPrograms" program ON program."ProgramID"=s."ProgramID" WHERE ${actor.studentId!=null?'s."StudentID"=$1 AND s."UserID"=$2':'s."UserID"=$1'} AND s."DeletedAt" IS NULL AND s."Status"='ACTIVE' AND u."Status"='ACTIVE'`,actor.studentId!=null?[actor.studentId,actor.userId]:[actor.userId])).rows[0];
  if(!s)throw invalid('Không có hồ sơ sinh viên đang hoạt động.',403,'STUDENT_INACTIVE');return s;
}

const applicationSelect=`SELECT a."ApplicationID" AS id,a."RegistrationID" AS "registrationId",a."StudentID" AS "studentId",s."StudentCode" AS "studentCode",u."FullName" AS "fullName",
 a."OJTSemesterID" AS "ojtSemesterId",a."PostID" AS "postId",a."PositionID" AS "positionId",a."EnterpriseID" AS "companyId",a."CVFileID" AS "cvFileId",a."OfficialCheckID" AS "officialCheckId",a."CoverLetter" AS "coverLetter",a."Status" AS status,a."AppliedAt" AS "appliedAt",a."UpdatedAt" AS "updatedAt",a."ReviewNote" AS "reviewNote",
 jsonb_build_object('id',e."EnterpriseID",'name',e."Name",'address',e."Address",'contactEmail',e."ContactEmail") AS company,
 jsonb_build_object('id',p."PositionID",'code',p."RecruitmentCode",'title',p."Title",'requirements',p."Requirements",'description',p."Description",'status',p."Status",'capacity',p."Capacity",'remainingSlots',GREATEST(0,p."Capacity"-(SELECT count(*) FROM "InternshipAssignments" slot WHERE slot."PositionID"=p."PositionID" AND COALESCE(UPPER(slot."Status"),'ASSIGNED') NOT IN ('CANCELLED','CANCELED')))) AS position,
 jsonb_build_object('id',post."PostID",'title',post."Title",'deadlineAt',post."DeadlineAt",'status',post."Status") AS post,
 CASE WHEN cv."CVFileID" IS NULL THEN NULL ELSE ${cvMetadataSql('cv')} END AS cv,
 r."Status" AS "registrationStatus",EXISTS(SELECT 1 FROM "EligibleStudentHandoffItems" h WHERE h."StudentID"=r."StudentID" AND h."OJTSemesterID"=r."OJTSemesterID") AS "handedOff",
 (SELECT jsonb_build_object('id',co."CoordinationID",'decision',co."Decision",'rejectReason',co."RejectReason",'coordinatedAt',co."CoordinatedAt",'assignmentId',ass."AssignmentID",'assignmentStatus',ass."Status") FROM "StudentEnterpriseCoordination" co LEFT JOIN "InternshipAssignments" ass ON ass."CoordinationID"=co."CoordinationID" WHERE co."ApplicationID"=a."ApplicationID" ORDER BY co."CoordinationID" DESC LIMIT 1) AS coordination
 FROM "JobApplications" a JOIN "OJTRegistrations" r ON r."RegistrationID"=a."RegistrationID" JOIN "Students" s ON s."StudentID"=a."StudentID" JOIN "Users" u ON u."UserID"=s."UserID" JOIN "InternshipPositions" p ON p."PositionID"=a."PositionID" JOIN "Enterprises" e ON e."EnterpriseID"=a."EnterpriseID" JOIN "RecruitmentPosts" post ON post."PostID"=a."PostID" LEFT JOIN "StudentCVFiles" cv ON cv."CVFileID"=a."CVFileID"`;

export async function applyToPosition(body:unknown,actor:Actor,existingClient?:PoolClient,resubmitTerminated=false) {
  const b=inputObject(body,['registrationId','postId','positionId','coverLetter']);
  const registrationId=positiveId(b.registrationId,'registrationId'),postId=positiveId(b.postId,'postId'),positionId=positiveId(b.positionId,'positionId'),letter=optionalText(b.coverLetter,'coverLetter',5000);
  return academicTransaction(async c=>{
    const s=await ownStudent(c,actor),r=await registrationRecord(c,registrationId);
    if(r.StudentID!==s.StudentID)throw invalid('Chỉ được ứng tuyển bằng hồ sơ của mình.',403,'FORBIDDEN');
    if(!['SUBMITTED','APPROVED','HANDED_OFF'].includes(r.Status))throw invalid('Hồ sơ đăng ký OJT không hợp lệ.',409,'REGISTRATION_NOT_ACTIVE');
    if(!r.HandoffID)throw invalid('Academic handoff required.',403,'ELIGIBLE_HANDOFF_REQUIRED');
    const check=await eligibleOfficial(c,r);
    if(!r.WindowID)throw invalid('Hồ sơ chưa có đợt đăng ký.',409,'REGISTRATION_WINDOW_REQUIRED');
    const w=await windowRecord(c,r.WindowID),now=(await c.query('SELECT clock_timestamp() AS now')).rows[0].now;
    if(w.Status!=='OPEN'||now<new Date(w.StartsAt)||now>=new Date(w.EndsAt))throw invalid('Đợt đăng ký sinh viên đã đóng hoặc ngoài thời hạn.',409,'OJT_REGISTRATION_WINDOW_UNAVAILABLE');
    const p=(await c.query(`SELECT p.*,post."EnterpriseID" AS "PostEnterpriseID",post."Status" AS "PostStatus",post."DeadlineAt",e."Status" AS "CompanyStatus" FROM "InternshipPositions" p JOIN "RecruitmentPostPositions" pp ON pp."PositionID"=p."PositionID" JOIN "RecruitmentPosts" post ON post."PostID"=pp."PostID" JOIN "Enterprises" e ON e."EnterpriseID"=p."EnterpriseID" WHERE p."PositionID"=$1 AND post."PostID"=$2 FOR UPDATE OF p,post,e`,[positionId,postId])).rows[0];
    if(!p)throw invalid('Vị trí không thuộc tin tuyển dụng.',404,'POSITION_NOT_FOUND');
    if(p.OJTSemesterID!==r.OJTSemesterID||p.EnterpriseID!==p.PostEnterpriseID)throw invalid('Vị trí không khớp kỳ OJT/doanh nghiệp.',409,'POSITION_SEMESTER_MISMATCH');
    if(p.PostStatus!=='PUBLISHED'||(p.DeadlineAt&&now>=new Date(p.DeadlineAt)))throw invalid('Tin chưa công bố hoặc đã hết hạn.',409,'RECRUITMENT_NOT_PUBLISHED');
    if(p.Status!=='OPEN'||p.CompanyStatus!=='ACTIVE')throw invalid('Vị trí/doanh nghiệp không nhận ứng tuyển.',409,'POSITION_NOT_OPEN');
    if(p.Capacity==null||await occupied(c,positionId)>=p.Capacity)throw invalid('Vị trí đã hết chỉ tiêu.',409,'POSITION_FULL');
    const existing=(await c.query('SELECT "ApplicationID","CoverLetter","Status" FROM "JobApplications" WHERE "RegistrationID"=$1 AND "PostID"=$2 AND "PositionID"=$3',[registrationId,postId,positionId])).rows[0];
    if(existing&&resubmitTerminated&&['REJECTED','WITHDRAWN'].includes(existing.Status)){
      if((await c.query(`SELECT 1 FROM "InternshipAssignments" a JOIN "StudentEnterpriseCoordination" co ON co."CoordinationID"=a."CoordinationID" WHERE co."RegistrationID"=$1 AND COALESCE(UPPER(a."Status"),'ASSIGNED') NOT IN ('CANCELLED','CANCELED')`,[registrationId])).rowCount)throw invalid('Đã có phân công thực tập.',409,'ASSIGNMENT_EXISTS');
      const cv=await currentCV(c,s.StudentID);
      await c.query(`UPDATE "JobApplications" SET "Status"='SUBMITTED',"CoverLetter"=$2,"CVFileID"=$3,"OfficialCheckID"=$4,"ReviewNote"=NULL,"AppliedAt"=now(),"UpdatedAt"=now() WHERE "ApplicationID"=$1`,[existing.ApplicationID,letter,cv?.id??null,check.checkId]);
      const out=(await c.query(applicationSelect+' WHERE a."ApplicationID"=$1',[existing.ApplicationID])).rows[0];
      await audit(c,actor.userId,'JobApplications',existing.ApplicationID,'RESUBMIT',existing,out);return {...out,replayed:false};
    }
    if(existing){if(existing.CoverLetter!==letter)throw invalid('Đã ứng tuyển vị trí này.',409,'APPLICATION_EXISTS');return {...(await c.query(applicationSelect+' WHERE a."ApplicationID"=$1',[existing.ApplicationID])).rows[0],replayed:true};}
    if((await c.query(`SELECT 1 FROM "InternshipAssignments" a JOIN "StudentEnterpriseCoordination" co ON co."CoordinationID"=a."CoordinationID" WHERE co."RegistrationID"=$1 AND COALESCE(UPPER(a."Status"),'ASSIGNED') NOT IN ('CANCELLED','CANCELED')`,[registrationId])).rowCount)throw invalid('Đã có phân công thực tập.',409,'ASSIGNMENT_EXISTS');
    const cv=await currentCV(c,s.StudentID);
    const id=(await c.query(`INSERT INTO "JobApplications" ("RegistrationID","StudentID","OJTSemesterID","PostID","PositionID","EnterpriseID","CVFileID","OfficialCheckID","CoverLetter") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING "ApplicationID"`,[registrationId,s.StudentID,r.OJTSemesterID,postId,positionId,p.EnterpriseID,cv?.id??null,check.checkId,letter])).rows[0].ApplicationID;
    const out=(await c.query(applicationSelect+' WHERE a."ApplicationID"=$1',[id])).rows[0];await audit(c,actor.userId,'JobApplications',id,'APPLY',null,out);return {...out,replayed:false};
  },existingClient);
}

export async function listApplications(params:Row,actor:Actor,existingClient?:PoolClient) {
  const p=pagination(params,['applicationId','studentId','registrationId','ojtSemesterId','companyId','positionId','status']);
  if(p.offset>2147483647)throw invalid('Pagination exceeds allowed range.');
  return readTransaction(async c=>{
    if(!['ADMIN','OJT_COORD','STUDENT'].includes(actor.roleCode))throw invalid('Không có quyền xem ứng tuyển.',403,'FORBIDDEN');
    const args:unknown[]=[],where:string[]=[];const add=(col:string,v:unknown)=>{args.push(v);where.push(col+'=$'+args.length);};
    if(actor.roleCode==='STUDENT')add('a."StudentID"',(await ownStudent(c,actor)).StudentID);
    for(const [key,col]of Object.entries({applicationId:'ApplicationID',studentId:'StudentID',registrationId:'RegistrationID',ojtSemesterId:'OJTSemesterID',companyId:'EnterpriseID',positionId:'PositionID'}))if(params[key]!==undefined)add(`a."${col}"`,positiveId(params[key],key));
    if(params.status!==undefined)add('a."Status"',enumValue(params.status,['SUBMITTED','REVIEWING','INTERVIEW','OFFERED','ACCEPTED','REJECTED','WITHDRAWN'],'status'));
    const sql=applicationSelect+(where.length?' WHERE '+where.join(' AND '):'');
    const total=(await c.query(`SELECT count(*)::int AS n FROM (${sql}) x`,args)).rows[0].n;
    const items=(await c.query(sql+` ORDER BY a."ApplicationID" DESC LIMIT $${args.length+1} OFFSET $${args.length+2}`,[...args,p.limit,p.offset])).rows;
    return {items:await enrichListRows(c,items),total,page:p.page,limit:p.limit};
  },existingClient);
}

export async function studentOpportunities(params:Row,actor:Actor) {
  const p=pagination(params,['ojtSemesterId','windowId']),semesterId=positiveId(params.ojtSemesterId,'ojtSemesterId');
  if(p.offset>2147483647)throw invalid('Pagination exceeds allowed range.');
  return readTransaction(async c=>{
    const s=await ownStudent(c,actor),official=await officialEligibilityWithClient(c,s.StudentID,semesterId,{lockSource:false});
    const r=(await c.query(`SELECT r.*,w."Status" AS "WindowStatus",w."StartsAt",w."EndsAt",clock_timestamp() AS now FROM "OJTRegistrations" r LEFT JOIN "OJTRegistrationWindows" w ON w."WindowID"=r."WindowID" WHERE r."StudentID"=$1 AND r."OJTSemesterID"=$2`,[s.StudentID,semesterId])).rows[0];
    const selectedWindowId=params.windowId===undefined?r?.WindowID??null:positiveId(params.windowId,'windowId');
    const windows=(await c.query('SELECT w.*,clock_timestamp() AS "DatabaseNow" FROM "OJTRegistrationWindows" w WHERE w."OJTSemesterID"=$1 AND ($2::int IS NULL OR w."WindowID"=$2) ORDER BY w."WindowID" DESC',[semesterId,selectedWindowId])).rows;
    const window=windows.find(w=>w.Status==='OPEN'&&new Date(w.DatabaseNow)>=new Date(w.StartsAt)&&new Date(w.DatabaseNow)<new Date(w.EndsAt)&&inScope(w.Scope??{},s));
    const blockers:string[]=[];
    if(!(await c.query('SELECT 1 FROM "EligibleStudentHandoffItems" WHERE "StudentID"=$1 AND "OJTSemesterID"=$2',[s.StudentID,semesterId])).rowCount)blockers.push('ELIGIBLE_HANDOFF_REQUIRED');
    if(!official||official.status!=='ELIGIBLE'||official.isStale)blockers.push(official?.isStale?'ELIGIBILITY_CHECK_STALE':'CONFIRMED_ELIGIBILITY_REQUIRED');
    if(r&&!['SUBMITTED','APPROVED','REJECTED'].includes(r.Status))blockers.push('REGISTRATION_NOT_ACTIVE');
    if(r&&r.ProgramID!==s.ProgramID)blockers.push('REGISTRATION_PROGRAM_CHANGED');
    if(!window)blockers.push('OJT_REGISTRATION_WINDOW_UNAVAILABLE');
    if(r&&['SUBMITTED','APPROVED'].includes(r.Status)&&window&&window.WindowID!==r.WindowID)blockers.push('REGISTRATION_WINDOW_MISMATCH');
    if(!await hasSemesterRecruitment(c,semesterId))blockers.push('RECRUITMENT_NOT_READY');
    if(r?.Status==='REJECTED'&&(await c.query('SELECT 1 FROM "StudentEnterpriseCoordination" WHERE "RegistrationID"=$1',[r.RegistrationID])).rowCount)blockers.push('REGISTRATION_IN_COORDINATION');
    const hasAssignment=r&&(await c.query(`SELECT 1 FROM "InternshipAssignments" a JOIN "StudentEnterpriseCoordination" co ON co."CoordinationID"=a."CoordinationID" WHERE co."RegistrationID"=$1 AND COALESCE(UPPER(a."Status"),'ASSIGNED') NOT IN ('CANCELLED','CANCELED')`,[r.RegistrationID])).rowCount;
    if(hasAssignment)blockers.push('ASSIGNMENT_EXISTS');
    const sql=`SELECT p."PositionID" AS id,p."OJTSemesterID" AS "ojtSemesterId",p."RecruitmentCode" AS code,p."Title" AS title,p."Description" AS description,p."Requirements" AS requirements,p."Location" AS location,p."WorkMode" AS "workMode",p."Capacity" AS capacity,GREATEST(0,p."Capacity"-(SELECT count(*) FROM "InternshipAssignments" a WHERE a."PositionID"=p."PositionID" AND COALESCE(UPPER(a."Status"),'ASSIGNED') NOT IN ('CANCELLED','CANCELED'))) AS "remainingSlots",jsonb_build_object('id',e."EnterpriseID",'name',e."Name",'address',e."Address") AS company,jsonb_build_object('id',post."PostID",'title',post."Title",'deadlineAt',post."DeadlineAt",'content',post."Content",'benefits',post."Benefits") AS post,(SELECT app."ApplicationID" FROM "JobApplications" app JOIN "OJTRegistrations" reg ON reg."RegistrationID"=app."RegistrationID" WHERE reg."StudentID"=$2 AND app."PositionID"=p."PositionID" AND app."PostID"=post."PostID") AS "applicationId" FROM "InternshipPositions" p JOIN "Enterprises" e ON e."EnterpriseID"=p."EnterpriseID" JOIN "RecruitmentPostPositions" pp ON pp."PositionID"=p."PositionID" JOIN "RecruitmentPosts" post ON post."PostID"=pp."PostID" WHERE p."OJTSemesterID"=$1 AND p."Status"='OPEN' AND e."Status"='ACTIVE' AND post."Status"='PUBLISHED' AND (post."DeadlineAt" IS NULL OR post."DeadlineAt">clock_timestamp())`;
    const total=(await c.query(`SELECT count(*)::int AS n FROM (${sql}) x`,[semesterId,s.StudentID])).rows[0].n;
    const rows=(await c.query(sql+' ORDER BY p."PositionID",post."PostID" LIMIT $3 OFFSET $4',[semesterId,s.StudentID,p.limit,p.offset])).rows;
    const items=rows.map(pos=>{const reasons=[...blockers,...(Number(pos.remainingSlots)<=0?['POSITION_FULL']:[]),...(pos.applicationId&&r?.Status!=='REJECTED'?['APPLICATION_EXISTS']:[])];return {...pos,windowId:window?.WindowID??null,remainingSlots:Number(pos.remainingSlots),canApply:!reasons.length,blockers:reasons};});
    return {items:await enrichListRows(c,items),total,page:p.page,limit:p.limit,windowId:window?.WindowID??null,registrationId:r?.RegistrationID??null,submissionEndpoint:r&&r.Status!=='REJECTED'?'/api/job-applications':'/api/ojt-registrations',officialEligibility:official,canApply:!blockers.length,blockers};
  });
}
