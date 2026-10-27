import type { PoolClient } from 'pg';
import { academicTransaction } from '../academic/academic.repository';
import { invalid, positiveId, enumValue } from '../students/student.validation';
import { requireStaff, reservedSeats, enterpriseScope } from '../qhdn/qhdn.repository';
import { ownStudent, page, type Row, type Actor } from '../student-portal/shared';

const postSelect='SELECT p."PostID" AS id,p."EnterpriseID" AS "enterpriseId",p."OJTSemesterID" AS "ojtSemesterId",p."Title" AS title,p."Content" AS content,p."Benefits" AS benefits,p."ApplicationInstructions" AS "applicationInstructions",p."Status" AS status,p."PublishedAt" AS "publishedAt",p."DeadlineAt" AS "deadlineAt",COALESCE((SELECT jsonb_agg(pp."PositionID" ORDER BY pp."PositionID") FROM "RecruitmentPostPositions" pp WHERE pp."PostID"=p."PostID"),\'[]\'::jsonb) AS "positionIds" FROM "RecruitmentPosts" p';
export async function posts(params:Row,actor:Actor,id?:number) {
  requireStaff(actor);return academicTransaction(async c=>{const data=await page(c,postSelect+' WHERE ($1::int IS NULL OR p."PostID"=$1) AND ($2::int IS NULL OR p."EnterpriseID"=$2) AND ($3::int IS NULL OR p."OJTSemesterID"=$3) AND ($4::text IS NULL OR p."Status"=$4)',[id??null,params.enterpriseId===undefined?null:positiveId(params.enterpriseId,'enterpriseId'),params.ojtSemesterId===undefined?null:positiveId(params.ojtSemesterId,'ojtSemesterId'),params.status===undefined?null:enumValue(params.status,['DRAFT','PENDING_REVIEW','PUBLISHED','CLOSED','ARCHIVED'],'status')],params,['enterpriseId','ojtSemesterId','status']);if(id&&!data.items.length)throw invalid('Recruitment publication not found.',404);return id?data.items[0]:data;});
}
export const publicPositionSelect=`SELECT p."PositionID" AS id,p."EnterpriseID" AS "enterpriseId",e."Name" AS "enterpriseName",p."OJTSemesterID" AS "ojtSemesterId",p."Title" AS title,p."Description" AS description,p."Requirements" AS requirements,p."Capacity" AS capacity,GREATEST(0,p."Capacity"-${reservedSeats('p')}) AS "remainingSlots",post."PostID" AS "postId",post."DeadlineAt" AS "deadlineAt",post."Benefits" AS benefits,post."ApplicationInstructions" AS "applicationInstructions"
 FROM "InternshipPositions" p JOIN "Enterprises" e ON e."EnterpriseID"=p."EnterpriseID"
 JOIN LATERAL (SELECT rp.* FROM "RecruitmentPostPositions" pp JOIN "RecruitmentPosts" rp ON rp."PostID"=pp."PostID" WHERE pp."PositionID"=p."PositionID" AND rp."Status"='PUBLISHED' AND rp."ArchivedAt" IS NULL AND rp."DeadlineAt">clock_timestamp() ORDER BY rp."PostID" DESC LIMIT 1) post ON true
 WHERE p."Status"='OPEN' AND p."DeletedAt" IS NULL AND p."ArchivedAt" IS NULL AND e."Status"='ACTIVE' AND e."DeletedAt" IS NULL`;
export async function applicationEvent(c:PoolClient,id:number,action:string,actor:number,snapshot:Row,reason?:string) {await c.query('INSERT INTO "ApplicationEvents" ("ApplicationID","Action","ActorID","Snapshot","Reason") VALUES ($1,$2,$3,$4,$5)',[id,action,actor,JSON.stringify(snapshot),reason??null]);}
export const applicationSelect=`SELECT a."ApplicationID" AS id,a."RegistrationID" AS "registrationId",a."OJTSemesterID" AS "ojtSemesterId",a."PostID" AS "postId",a."PositionID" AS "positionId",a."Status" AS status,a."AppliedAt" AS "appliedAt",a."UpdatedAt" AS "updatedAt",a."CVID" AS "cvId",a."CoverLetter" AS "coverLetter",a."PositionSnapshot" AS position,r."StudentID" AS "studentId",s."StudentCode" AS "studentCode",u."FullName" AS "fullName",p."EnterpriseID" AS "enterpriseId"
 FROM "JobApplications" a JOIN "OJTRegistrations" r ON r."RegistrationID"=a."RegistrationID" JOIN "Students" s ON s."StudentID"=r."StudentID" JOIN "Users" u ON u."UserID"=s."UserID" JOIN "InternshipPositions" p ON p."PositionID"=a."PositionID"`;
export async function applicationScope(c:PoolClient,actor:Actor) {
  if(actor.roleCode==='ADMIN')return {sql:'$1::int IS NULL',value:null};
  if(actor.roleCode==='STUDENT')return {sql:'r."StudentID"=$1',value:(await ownStudent(c,actor)).StudentID};
  const scope=await enterpriseScope(c,actor);
  return scope===null?{sql:'EXISTS(SELECT 1 FROM "EligibleStudentHandoffItems" h WHERE h."StudentID"=r."StudentID" AND h."OJTSemesterID"=r."OJTSemesterID") AND $1::int IS NULL',value:null}:{sql:'p."EnterpriseID"=$1 AND EXISTS(SELECT 1 FROM "StudentEnterpriseCoordination" co JOIN "OJTRegistrations" hr ON hr."RegistrationID"=co."RegistrationID" JOIN "EligibleStudentHandoffItems" h ON h."StudentID"=hr."StudentID" AND h."OJTSemesterID"=hr."OJTSemesterID" WHERE co."ApplicationID"=a."ApplicationID" AND co."EnterpriseID"=$1)',value:scope};
}
