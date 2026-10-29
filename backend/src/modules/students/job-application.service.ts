import { enrichListRows } from '../../shared/list-context';
import type { PoolClient } from 'pg';
import { academicTransaction, audit } from '../academic/academic.repository';
import { readTransaction } from '../qhdn/read.repository';
import { occupied } from '../qhdn/catalog.service';
import { registrationRecord, registrationApi, event, parseRegistrationApplication } from '../ojt-registration/registration.service';
import { currentCV, cvMetadataSql } from './cv.service';
import { admissionEligibilityWithClient, requireAdmissionEligibility } from '../eligibility/admission.service';
import { assertOjtSemesterSix } from '../academic/workflow-policy';
import { invalid, inputObject, positiveId, optionalText, pagination, enumValue } from './student.validation';
import type { Actor, Row } from '../ojt-registration/window.service';

export async function ownStudent(c:PoolClient,actor:Actor) {
  if(actor.roleCode!=='STUDENT')throw invalid('Chức năng dành cho sinh viên.',403,'FORBIDDEN');
  const s=(await c.query(`SELECT s.*,u."Email",u."Phone" FROM "Students" s JOIN "Users" u ON u."UserID"=s."UserID" WHERE ${actor.studentId!=null?'s."StudentID"=$1 AND s."UserID"=$2':'s."UserID"=$1'} AND s."DeletedAt" IS NULL AND s."Status"='ACTIVE' AND u."Status"='ACTIVE'`,actor.studentId!=null?[actor.studentId,actor.userId]:[actor.userId])).rows[0];
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

export async function applyToPosition(body:unknown,actor:Actor,existingClient?:PoolClient) {
  const b=inputObject(body,['registrationId','windowId','postId','positionId','coverLetter','application']);
  const requestedRegistrationId=b.registrationId===undefined?null:positiveId(b.registrationId,'registrationId');
  const windowId=b.windowId===undefined?null:positiveId(b.windowId,'windowId');
  if(requestedRegistrationId===null&&windowId===null)throw invalid('windowId is required for a direct OJT application.',400,'OJT_REGISTRATION_WINDOW_REQUIRED');
  const postId=positiveId(b.postId,'postId'),positionId=positiveId(b.positionId,'positionId'),letter=optionalText(b.coverLetter,'coverLetter',5000);
  const form=parseRegistrationApplication(b.application);
  return academicTransaction(async c=>{
    const s=await ownStudent(c,actor);
    const applicationForm={
      contactPhone:form.contactPhone??s.Phone??null,
      contactEmail:form.contactEmail??s.Email??null,
      note:form.note??null,
    };
    const selectedWindowId=windowId??undefined;
    const w=selectedWindowId
      ? (await c.query('SELECT * FROM "OJTRegistrationWindows" WHERE "WindowID"=$1 FOR UPDATE',[selectedWindowId])).rows[0]
      : null;
    if(selectedWindowId&&!w)throw invalid('Registration window not found.',404,'REGISTRATION_WINDOW_NOT_FOUND');
    let r:Row|null=null;
    const requestedRegistration=requestedRegistrationId
      ? await registrationRecord(c,requestedRegistrationId)
      : null;
    if(requestedRegistration&&requestedRegistration.StudentID!==s.StudentID)throw invalid('Chỉ được ứng tuyển bằng hồ sơ của mình.',403,'FORBIDDEN');
    if(w&&requestedRegistration&&requestedRegistration.OJTSemesterID!==w.OJTSemesterID)throw invalid('Registration and selected OJT semester do not match.',409,'REGISTRATION_SEMESTER_MISMATCH');

    const semesterId=w?.OJTSemesterID??requestedRegistration?.OJTSemesterID;
    if(!semesterId)throw invalid('OJT semester is required.',400,'OJT_SEMESTER_REQUIRED');
    if(w){
      const now=(await c.query('SELECT clock_timestamp() AS now')).rows[0].now;
      if(w.Status!=='OPEN'||now<new Date(w.StartsAt)||now>=new Date(w.EndsAt))throw invalid('Đợt đăng ký sinh viên đã đóng hoặc ngoài thời hạn.',409,'OJT_REGISTRATION_WINDOW_UNAVAILABLE');
      const studentScope=(await c.query(`SELECT s."ProgramID",t."SpecializationID",p."CohortID",p."GroupCode"
        FROM "Students" s LEFT JOIN "TrainingPrograms" t ON t."ProgramID"=s."ProgramID"
        LEFT JOIN "StudentAcademicPlacements" p ON p."StudentID"=s."StudentID"
        WHERE s."StudentID"=$1`,[s.StudentID])).rows[0];
      for(const [key,value] of [['programIds',studentScope.ProgramID],['majorIds',studentScope.SpecializationID],['cohortIds',studentScope.CohortID],['groupCodes',studentScope.GroupCode],['studentIds',s.StudentID]] as const){
        if(w.Scope?.[key]&&!w.Scope[key].includes(value))throw invalid('Student is outside the registration window scope.',403,'REGISTRATION_OUT_OF_SCOPE');
      }
    }

    const p=(await c.query(`SELECT p.*,post."EnterpriseID" AS "PostEnterpriseID",post."Status" AS "PostStatus",post."DeadlineAt",e."Status" AS "CompanyStatus" FROM "InternshipPositions" p JOIN "RecruitmentPostPositions" pp ON pp."PositionID"=p."PositionID" JOIN "RecruitmentPosts" post ON post."PostID"=pp."PostID" JOIN "Enterprises" e ON e."EnterpriseID"=p."EnterpriseID" WHERE p."PositionID"=$1 AND post."PostID"=$2 FOR UPDATE OF p,post,e`,[positionId,postId])).rows[0];
    if(!p)throw invalid('Vị trí không thuộc tin tuyển dụng.',404,'POSITION_NOT_FOUND');
    if(p.OJTSemesterID!==semesterId||p.EnterpriseID!==p.PostEnterpriseID)throw invalid('Vị trí không khớp kỳ OJT/doanh nghiệp.',409,'POSITION_SEMESTER_MISMATCH');
    const now=(await c.query('SELECT clock_timestamp() AS now')).rows[0].now;
    if(p.PostStatus!=='PUBLISHED'||(p.DeadlineAt&&now>=new Date(p.DeadlineAt)))throw invalid('Tin chưa công bố hoặc đã hết hạn.',409,'RECRUITMENT_NOT_PUBLISHED');
    if(p.Status!=='OPEN'||p.CompanyStatus!=='ACTIVE')throw invalid('Vị trí/doanh nghiệp không nhận ứng tuyển.',409,'POSITION_NOT_OPEN');
    if(p.Capacity==null||await occupied(c,positionId)>=p.Capacity)throw invalid('Vị trí đã hết chỉ tiêu.',409,'POSITION_FULL');

    const existingRegistrationId=requestedRegistration?.RegistrationID??(await c.query(
      `SELECT "RegistrationID" FROM "OJTRegistrations" WHERE "StudentID"=$1 AND "OJTSemesterID"=$2 FOR UPDATE`,
      [s.StudentID,semesterId],
    )).rows[0]?.RegistrationID;
    r=existingRegistrationId?await registrationRecord(c,existingRegistrationId):null;
    if(r&&r.OJTSemesterID!==semesterId)throw invalid('Registration and selected OJT semester do not match.',409,'REGISTRATION_SEMESTER_MISMATCH');
    if(r&&!['SUBMITTED','APPROVED','HANDED_OFF','REJECTED'].includes(r.Status))throw invalid('Hồ sơ đăng ký OJT không hợp lệ.',409,'REGISTRATION_NOT_ACTIVE');
    const latestCoordination=r?(await c.query(`SELECT * FROM "StudentEnterpriseCoordination"
      WHERE "RegistrationID"=$1 ORDER BY "CoordinationID" DESC LIMIT 1 FOR UPDATE`,[r.RegistrationID])).rows[0]??null:null;
    if(latestCoordination&&latestCoordination.Decision!=='REJECTED'){
      const currentApplication=latestCoordination.PositionID===positionId&&latestCoordination.ApplicationID
        ? (await c.query(applicationSelect+' WHERE a."ApplicationID"=$1',[latestCoordination.ApplicationID])).rows[0]
        : null;
      const currentForm=r?.Application??{};
      if(currentApplication?.coverLetter===letter&&(!w||r?.WindowID===w.WindowID)
        &&currentForm.contactPhone===applicationForm.contactPhone
        &&currentForm.contactEmail===applicationForm.contactEmail
        &&currentForm.note===applicationForm.note)return {...currentApplication,replayed:true};
      throw invalid('Đơn đăng ký đang được doanh nghiệp xử lý hoặc đã được tiếp nhận.',409,'APPLICATION_ALREADY_IN_PROCESS');
    }
    if(!(await c.query('SELECT 1 FROM "EligibleStudentHandoffItems" WHERE "StudentID"=$1 AND "OJTSemesterID"=$2',[s.StudentID,semesterId])).rowCount)throw invalid('Academic handoff required.',403,'ELIGIBLE_HANDOFF_REQUIRED');
    const pathway={...await assertOjtSemesterSix(c,s.StudentID,semesterId),admissionSource:'ACADEMIC_HANDOFF'};
    const eligibility=await requireAdmissionEligibility(c,s.StudentID,semesterId);
    if(!r){
      const row=(await c.query(`INSERT INTO "OJTRegistrations"
        ("StudentID","OJTSemesterID","WindowID","ProgramID","Application","Status","SubmittedBy","RegisteredAt","PathwaySnapshot")
        VALUES ($1,$2,$3,$4,$5,'SUBMITTED',$6,now(),$7) RETURNING "RegistrationID"`,
      [s.StudentID,semesterId,w?.WindowID??null,s.ProgramID,JSON.stringify(applicationForm),actor.userId,JSON.stringify({academicPeriodId:w?.AcademicPeriodID??null,requiredRelativeSemester:w?.RequiredRelativeSemester??6,...pathway})])).rows[0];
      r=await registrationRecord(c,row.RegistrationID);
      await event(c,r,actor.userId,'SUBMITTED');
      await audit(c,actor.userId,'OJTRegistrations',r.RegistrationID,'SUBMIT',null,registrationApi(r));
    }else{
      if(r.ProgramID!==s.ProgramID)throw invalid('Curriculum changed; refresh the OJT registration before applying.',409,'REGISTRATION_PROGRAM_CHANGED');
      if(w){
        const beforeRegistration=registrationApi(r);
        await c.query(`UPDATE "OJTRegistrations" SET "WindowID"=$2,"Status"='SUBMITTED',"Application"=$3,"SubmittedBy"=$4,"RegisteredAt"=now(),"UpdatedAt"=now(),"ReviewCheckID"=NULL,"ReviewedBy"=NULL,"ReviewedAt"=NULL,"ReviewReason"=NULL WHERE "RegistrationID"=$1`,[
          r.RegistrationID,w.WindowID,JSON.stringify(applicationForm),actor.userId]);
        r=await registrationRecord(c,r.RegistrationID);
        await event(c,r,actor.userId,'SUBMITTED');
        await audit(c,actor.userId,'OJTRegistrations',r.RegistrationID,'DIRECT_APPLICATION',beforeRegistration,registrationApi(r));
      }
    }
    if((await c.query(`SELECT 1 FROM "InternshipAssignments" a JOIN "StudentEnterpriseCoordination" co ON co."CoordinationID"=a."CoordinationID" WHERE co."RegistrationID"=$1 AND COALESCE(UPPER(a."Status"),'ASSIGNED') NOT IN ('CANCELLED','CANCELED')`,[r.RegistrationID])).rowCount)throw invalid('Đã có phân công thực tập.',409,'ASSIGNMENT_EXISTS');
    const existingApplication=(await c.query(`SELECT * FROM "JobApplications" WHERE "RegistrationID"=$1 AND "PostID"=$2 AND "PositionID"=$3 ORDER BY "ApplicationID" DESC LIMIT 1 FOR UPDATE`,[r.RegistrationID,postId,positionId])).rows[0]??null;
    const cv=await currentCV(c,s.StudentID);
    let applicationId:number;
    if(existingApplication){
      applicationId=existingApplication.ApplicationID;
      await c.query(`UPDATE "JobApplications" SET "Status"='SUBMITTED',"CoverLetter"=$2,"CVFileID"=$3,"OfficialCheckID"=$4,"UpdatedAt"=now(),"ReviewedBy"=NULL,"ReviewNote"=NULL WHERE "ApplicationID"=$1`,[applicationId,letter,cv?.id??null,eligibility.checkId]);
    }else{
      applicationId=(await c.query(`INSERT INTO "JobApplications" ("RegistrationID","StudentID","OJTSemesterID","PostID","PositionID","EnterpriseID","CVFileID","OfficialCheckID","CoverLetter")
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING "ApplicationID"`,
      [r.RegistrationID,s.StudentID,semesterId,postId,positionId,p.EnterpriseID,cv?.id??null,eligibility.checkId,letter])).rows[0].ApplicationID;
    }
    const coordination=(await c.query(`INSERT INTO "StudentEnterpriseCoordination"
      ("RegistrationID","EnterpriseID","PositionID","CoordinatedBy","Decision","ApplicationID","OJTSemesterID","PreviousCoordinationID")
      VALUES ($1,$2,$3,$4,'PENDING',$5,$6,$7) RETURNING "CoordinationID"`,
    [r.RegistrationID,p.EnterpriseID,positionId,actor.userId,applicationId,semesterId,latestCoordination?.CoordinationID??null])).rows[0];
    const out=(await c.query(applicationSelect+' WHERE a."ApplicationID"=$1',[applicationId])).rows[0];
    await audit(c,actor.userId,'JobApplications',applicationId,existingApplication?'RESUBMIT':'APPLY',existingApplication,out);
    await audit(c,actor.userId,'StudentEnterpriseCoordination',coordination.CoordinationID,'DIRECT_APPLICATION',null,{
      id:coordination.CoordinationID,registrationId:r.RegistrationID,applicationId,enterpriseId:p.EnterpriseID,positionId,decision:'PENDING',
    });
    return {...out,replayed:false};
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
  const p=pagination(params,['windowId']),windowId=positiveId(params.windowId,'windowId');
  if(p.offset>2147483647)throw invalid('Pagination exceeds allowed range.');
  return readTransaction(async c=>{
    const s=await ownStudent(c,actor);
    const w=(await c.query(`SELECT w.*,clock_timestamp() AS "Now" FROM "OJTRegistrationWindows" w WHERE w."WindowID"=$1`,[windowId])).rows[0];
    if(!w)throw invalid('Registration window not found.',404,'REGISTRATION_WINDOW_NOT_FOUND');
    const semesterId=w.OJTSemesterID;
    const admission=await admissionEligibilityWithClient(c,s.StudentID,semesterId);
    const r=(await c.query(`SELECT * FROM "OJTRegistrations" WHERE "StudentID"=$1 AND "OJTSemesterID"=$2`,[s.StudentID,semesterId])).rows[0]??null;
    const studentScope=(await c.query(`SELECT t."SpecializationID",p."CohortID",p."GroupCode"
      FROM "Students" s LEFT JOIN "TrainingPrograms" t ON t."ProgramID"=s."ProgramID"
      LEFT JOIN "StudentAcademicPlacements" p ON p."StudentID"=s."StudentID"
      WHERE s."StudentID"=$1`,[s.StudentID])).rows[0];
    const blockers:string[]=[];
    if(!(await c.query('SELECT 1 FROM "EligibleStudentHandoffItems" WHERE "StudentID"=$1 AND "OJTSemesterID"=$2',[s.StudentID,semesterId])).rowCount)blockers.push('ELIGIBLE_HANDOFF_REQUIRED');
    if(!admission||admission.status!=='ELIGIBLE'||admission.isStale)blockers.push(admission?.isStale?'ELIGIBILITY_HANDOFF_STALE':'CONFIRMED_ELIGIBILITY_REQUIRED');
    if(r&&r.ProgramID!==s.ProgramID)blockers.push('REGISTRATION_PROGRAM_CHANGED');
    if(w.Status!=='OPEN'||w.Now<new Date(w.StartsAt)||w.Now>=new Date(w.EndsAt))blockers.push('OJT_REGISTRATION_WINDOW_UNAVAILABLE');
    for(const [key,value] of [['programIds',s.ProgramID],['majorIds',studentScope.SpecializationID],['cohortIds',studentScope.CohortID],['groupCodes',studentScope.GroupCode],['studentIds',s.StudentID]] as const){
      if(w.Scope?.[key]&&!w.Scope[key].includes(value))blockers.push('REGISTRATION_OUT_OF_SCOPE');
    }
    const latestCoordination=r?(await c.query(`SELECT "Decision" FROM "StudentEnterpriseCoordination" WHERE "RegistrationID"=$1 ORDER BY "CoordinationID" DESC LIMIT 1`,[r.RegistrationID])).rows[0]:null;
    if(latestCoordination&&latestCoordination.Decision!=='REJECTED')blockers.push('APPLICATION_ALREADY_IN_PROCESS');
    const hasAssignment=r&&(await c.query(`SELECT 1 FROM "InternshipAssignments" a JOIN "StudentEnterpriseCoordination" co ON co."CoordinationID"=a."CoordinationID" WHERE co."RegistrationID"=$1 AND COALESCE(UPPER(a."Status"),'ASSIGNED') NOT IN ('CANCELLED','CANCELED')`,[r.RegistrationID])).rowCount;
    if(hasAssignment)blockers.push('ASSIGNMENT_EXISTS');
    const sql=`SELECT p."PositionID" AS id,p."OJTSemesterID" AS "ojtSemesterId",post."PostID" AS "postId",p."RecruitmentCode" AS code,p."Title" AS title,p."Description" AS description,p."Requirements" AS requirements,p."Location" AS location,p."WorkMode" AS "workMode",p."Capacity" AS capacity,GREATEST(0,p."Capacity"-(SELECT count(*) FROM "InternshipAssignments" a WHERE a."PositionID"=p."PositionID" AND COALESCE(UPPER(a."Status"),'ASSIGNED') NOT IN ('CANCELLED','CANCELED'))) AS "remainingSlots",jsonb_build_object('id',e."EnterpriseID",'name',e."Name",'code',e."EnterpriseCode",'address',e."Address",'industry',e."Industry",'contactPersonName',e."ContactPersonName",'contactEmail',e."ContactEmail",'contactPhone',e."ContactPhone") AS company,jsonb_build_object('id',post."PostID",'title',post."Title",'deadlineAt',post."DeadlineAt",'content',post."Content",'benefits',post."Benefits",'applicationInstructions',post."ApplicationInstructions") AS post,(SELECT app."ApplicationID" FROM "JobApplications" app JOIN "OJTRegistrations" reg ON reg."RegistrationID"=app."RegistrationID" WHERE reg."StudentID"=$2 AND app."PositionID"=p."PositionID" AND app."PostID"=post."PostID" ORDER BY app."ApplicationID" DESC LIMIT 1) AS "applicationId" FROM "InternshipPositions" p JOIN "Enterprises" e ON e."EnterpriseID"=p."EnterpriseID" JOIN "RecruitmentPostPositions" pp ON pp."PositionID"=p."PositionID" JOIN "RecruitmentPosts" post ON post."PostID"=pp."PostID" WHERE p."OJTSemesterID"=$1 AND p."Status"='OPEN' AND p."DeletedAt" IS NULL AND p."ArchivedAt" IS NULL AND e."Status"='ACTIVE' AND e."DeletedAt" IS NULL AND post."Status"='PUBLISHED' AND post."ArchivedAt" IS NULL AND post."PublishedAt"<=clock_timestamp() AND (post."DeadlineAt" IS NULL OR post."DeadlineAt">clock_timestamp())`;
    const total=(await c.query(`SELECT count(*)::int AS n FROM (${sql}) x`,[semesterId,s.StudentID])).rows[0].n;
    const rows=(await c.query(sql+' ORDER BY p."PositionID",post."PostID" LIMIT $3 OFFSET $4',[semesterId,s.StudentID,p.limit,p.offset])).rows;
    const items=rows.map(pos=>{const reasons=[...blockers,...(Number(pos.remainingSlots)<=0?['POSITION_FULL']:[])];return {...pos,remainingSlots:Number(pos.remainingSlots),canApply:!reasons.length,blockers:reasons};});
    return {items:await enrichListRows(c,items),total,page:p.page,limit:p.limit,registrationId:r?.RegistrationID??null,windowId,ojtSemesterId:semesterId,officialEligibility:admission?.source==='OFFICIAL_CHECK'?admission:null,admissionEligibility:admission,canApply:!blockers.length,blockers};
  });
}
