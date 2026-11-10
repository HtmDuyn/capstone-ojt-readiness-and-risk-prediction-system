import type { PoolClient } from 'pg';
import { academicTransaction, audit } from '../academic/academic.repository';
import { readTransaction } from './read.repository';
import { invalid, inputObject, positiveId, requiredText, enumValue } from '../students/student.validation';
import { requireStudentAdmission } from '../student-portal/admission.service';
import { assertOjtSemesterSix } from '../academic/workflow-policy';
import { staff, record, refreshSlots } from './catalog.service';
import type { Actor, Row } from '../ojt-registration/window.service';

export async function requirePlacementSchema(c:PoolClient){
 const ready=(await c.query(`SELECT to_regclass('public."OJTActualReceipts"') IS NOT NULL AS ready`)).rows[0].ready;
 if(!ready)throw invalid('Chạy riêng khối OJT PLACEMENT AND ACTUAL RECEIPT V1 trong backend/DB để cập nhật chức năng điều phối.',503,'PLACEMENT_MIGRATION_REQUIRED');
}
export async function placementContext(c:PoolClient,semesterId:number){
 return (await c.query(`SELECT count(*)::int AS "roundCount",max("EndsAt") AS "lastEndAt",
  count(*) FILTER(WHERE "EndsAt">clock_timestamp() OR "ResultsFinalizedAt" IS NULL)::int AS unfinished
  FROM "RecruitmentWindows" WHERE "OJTSemesterID"=$1 AND "CampaignID" IS NOT NULL`,[semesterId])).rows[0];
}
async function afterRecruitment(c:PoolClient,semesterId:number){
 const context=await placementContext(c,semesterId);
 if(!context.roundCount||context.unfinished)throw invalid('Chỉ điều phối sau khi đợt tuyển dụng cuối cùng kết thúc và QHDN đã chốt tổng hợp các đợt.',409,'RECRUITMENT_NOT_FINISHED');
}
export async function placementBoard(params:Row,actor:Actor){
 staff(actor);const semesterId=positiveId(params.ojtSemesterId,'ojtSemesterId');
 return readTransaction(async c=>{
  await requirePlacementSchema(c);
  const context=await placementContext(c,semesterId);
  const items=(await c.query(`SELECT s."StudentID" AS id,s."StudentCode" AS "studentCode",u."FullName" AS "fullName",r."RegistrationID" AS "registrationId",r."Status" AS "registrationStatus",
   latest."CoordinationID" AS "coordinationId",latest."Decision" AS decision,latest."Source" AS source,latest."PositionID" AS "positionId",
   p."Title" AS "positionTitle",e."Name" AS "companyName",receipt."ReceivedAt" AS "receivedAt",receipt."Reason" AS "receiptReason",receipt."ExceededCapacity" AS "exceededCapacity",(SELECT "FullName" FROM "Users" WHERE "UserID"=receipt."ReceivedBy") AS "receivedByName",
   EXISTS(SELECT 1 FROM "InternshipAssignments" a JOIN "StudentEnterpriseCoordination" ac ON ac."CoordinationID"=a."CoordinationID"
    WHERE a."StudentID"=s."StudentID" AND ac."OJTSemesterID"=$1 AND COALESCE(upper(a."Status"),'ASSIGNED') NOT IN ('CANCELLED','CANCELED')) AS "hasAssignment",
   COALESCE((SELECT jsonb_agg(jsonb_build_object('id',h."CoordinationID",'source',h."Source",'decision',h."Decision",'company',he."Name",'position',hp."Title",'at',h."CoordinatedAt",'reason',h."CoordinationReason",'decisionAt',h."DecisionAt",'rejectReason',h."RejectReason") ORDER BY h."CoordinationID" DESC)
    FROM "StudentEnterpriseCoordination" h JOIN "Enterprises" he ON he."EnterpriseID"=h."EnterpriseID" JOIN "InternshipPositions" hp ON hp."PositionID"=h."PositionID" WHERE h."RegistrationID"=r."RegistrationID"),'[]'::jsonb) AS history
   FROM "Students" s JOIN "Users" u USING("UserID")
   LEFT JOIN "OJTRegistrations" r ON r."StudentID"=s."StudentID" AND r."OJTSemesterID"=$1
   LEFT JOIN LATERAL(SELECT * FROM "StudentEnterpriseCoordination" co WHERE co."RegistrationID"=r."RegistrationID" ORDER BY co."CoordinationID" DESC LIMIT 1) latest ON true
   LEFT JOIN "InternshipPositions" p ON p."PositionID"=latest."PositionID" LEFT JOIN "Enterprises" e ON e."EnterpriseID"=latest."EnterpriseID"
   LEFT JOIN "OJTActualReceipts" receipt ON receipt."StudentID"=s."StudentID" AND receipt."OJTSemesterID"=$1
   WHERE s."DeletedAt" IS NULL AND EXISTS(SELECT 1 FROM "EligibleStudentHandoffItems" hi WHERE hi."StudentID"=s."StudentID" AND hi."OJTSemesterID"=$1)
   ORDER BY s."StudentCode"`,[semesterId])).rows;
  const positions=(await c.query(`SELECT p."PositionID" AS id,p."Title" AS title,e."Name" AS "companyName",p."Capacity" AS capacity,
   (SELECT count(*)::int FROM "OJTActualReceipts" receipt JOIN "StudentEnterpriseCoordination" co USING("CoordinationID") WHERE co."PositionID"=p."PositionID") AS "actualCount"
   FROM "InternshipPositions" p JOIN "Enterprises" e USING("EnterpriseID") WHERE p."OJTSemesterID"=$1 AND p."DeletedAt" IS NULL AND p."ArchivedAt" IS NULL AND e."Status"='ACTIVE' AND e."DeletedAt" IS NULL ORDER BY e."Name",p."Title"`,[semesterId])).rows;
  return {canCoordinate:context.roundCount>0&&context.unfinished===0,context,positions,items};
 });
}
export async function supplementPlacement(body:unknown,actor:Actor){
 staff(actor);const b=inputObject(body,['studentId','ojtSemesterId','positionId','source','reason']);
 const studentId=positiveId(b.studentId,'studentId'),semesterId=positiveId(b.ojtSemesterId,'ojtSemesterId'),positionId=positiveId(b.positionId,'positionId');
 const source=enumValue(b.source,['QHDN_APPLICATION','QHDN_COORDINATION'],'source'),reason=requiredText(b.reason,'reason',2000);
 return academicTransaction(async c=>{
  await requirePlacementSchema(c);await afterRecruitment(c,semesterId);
  const s=(await c.query(`SELECT s.* FROM "Students" s JOIN "Users" u USING("UserID") WHERE s."StudentID"=$1 AND s."Status"='ACTIVE' AND u."Status"='ACTIVE' AND s."DeletedAt" IS NULL FOR UPDATE OF s`,[studentId])).rows[0];
  if(!s)throw invalid('Sinh viên không còn hoạt động.',409);
  await requireStudentAdmission(c,studentId,semesterId);await assertOjtSemesterSix(c,studentId,semesterId);
  if((await c.query(`SELECT 1 FROM "OJTActualReceipts" WHERE "StudentID"=$1 AND "OJTSemesterID"=$2 UNION ALL
    SELECT 1 FROM "InternshipAssignments" a JOIN "StudentEnterpriseCoordination" co USING("CoordinationID") WHERE a."StudentID"=$1 AND co."OJTSemesterID"=$2 AND COALESCE(upper(a."Status"),'ASSIGNED') NOT IN ('CANCELLED','CANCELED')`,[studentId,semesterId])).rowCount)throw invalid('Sinh viên đã có nơi thực tập trong kỳ này.',409,'ASSIGNMENT_EXISTS');
  const p=await record(c,'positions',positionId),company=await record(c,'companies',p.EnterpriseID);
  if(p.OJTSemesterID!==semesterId||p.DeletedAt||p.ArchivedAt||company.Status!=='ACTIVE'||company.DeletedAt||p.Status==='ARCHIVED')throw invalid('Vị trí hoặc doanh nghiệp không phù hợp với kỳ OJT.',409);
  let r=(await c.query('SELECT * FROM "OJTRegistrations" WHERE "StudentID"=$1 AND "OJTSemesterID"=$2 FOR UPDATE',[studentId,semesterId])).rows[0];
  if(!r)r=(await c.query(`INSERT INTO "OJTRegistrations" ("StudentID","OJTSemesterID","ProgramID","Application","Status","SubmittedBy") VALUES ($1,$2,$3,'{}','SUBMITTED',$4) RETURNING *`,[studentId,semesterId,s.ProgramID,actor.userId])).rows[0];
  const previous=(await c.query('SELECT * FROM "StudentEnterpriseCoordination" WHERE "RegistrationID"=$1 ORDER BY "CoordinationID" DESC LIMIT 1 FOR UPDATE',[r.RegistrationID])).rows[0];
  if(previous?.Decision==='ACCEPTED')throw invalid('Doanh nghiệp đã đồng ý nhận sinh viên. Không điều phối trùng.',409,'STUDENT_ALREADY_ACCEPTED');
  if(previous?.Decision==='PENDING'&&previous.Source.startsWith('QHDN_')){
   if(previous.PositionID===positionId&&previous.Source===source&&previous.CoordinationReason===reason)return {...previous,replayed:true};
   throw invalid('Sinh viên đang chờ doanh nghiệp phản hồi điều phối trước.',409,'COORDINATION_PENDING');
  }
  if(previous?.Decision==='PENDING'){
   await c.query(`UPDATE "StudentEnterpriseCoordination" SET "Decision"='SUPERSEDED',"DecisionAt"=now() WHERE "CoordinationID"=$1`,[previous.CoordinationID]);
   if(previous.ApplicationID)await c.query(`UPDATE "JobApplications" SET "Status"='WITHDRAWN',"ReviewNote"=$2,"ReviewedBy"=$3,"UpdatedAt"=now() WHERE "ApplicationID"=$1`,[previous.ApplicationID,reason,actor.userId]);
   await audit(c,actor.userId,'StudentEnterpriseCoordination',previous.CoordinationID,'SUPERSEDE_FOR_COORDINATION',previous,{reason},reason);
  }
  const row=(await c.query(`INSERT INTO "StudentEnterpriseCoordination" ("RegistrationID","OJTSemesterID","EnterpriseID","PositionID","CoordinatedBy","Decision","PreviousCoordinationID","Source","CoordinationReason")
   VALUES ($1,$2,$3,$4,$5,'PENDING',$6,$7,$8) RETURNING *`,[r.RegistrationID,semesterId,p.EnterpriseID,positionId,actor.userId,previous?.CoordinationID??null,source,reason])).rows[0];
  await audit(c,actor.userId,'StudentEnterpriseCoordination',row.CoordinationID,'QHDN_SUPPLEMENT',null,row,reason);
  return row;
 });
}
export async function recordActualReceipt(id:number,body:unknown,actor:Actor){
 staff(actor);const b=inputObject(body,['reason']),reason=requiredText(b.reason,'reason',2000);
 return academicTransaction(async c=>{
  await requirePlacementSchema(c);
  const co=await record(c,'coordinations',id),r=(await c.query('SELECT * FROM "OJTRegistrations" WHERE "RegistrationID"=$1 FOR UPDATE',[co.RegistrationID])).rows[0];
  const prior=(await c.query('SELECT * FROM "OJTActualReceipts" WHERE "StudentID"=$1 AND "OJTSemesterID"=$2',[r.StudentID,r.OJTSemesterID])).rows[0];
  if(prior){if(prior.CoordinationID===id)return {...prior,replayed:true};throw invalid('Sinh viên đã được ghi nhận thực nhận trong kỳ này.',409,'ACTUAL_RECEIPT_EXISTS');}
  if(co.Decision!=='ACCEPTED')throw invalid('Chỉ ghi nhận thực nhận sau khi doanh nghiệp đồng ý nhận.',409,'ENTERPRISE_ACCEPTANCE_REQUIRED');
  if((await c.query('SELECT 1 FROM "StudentEnterpriseCoordination" WHERE "RegistrationID"=$1 AND "CoordinationID">$2',[r.RegistrationID,id])).rowCount)throw invalid('Chỉ ghi nhận kết quả điều phối mới nhất.',409);
  await requireStudentAdmission(c,r.StudentID,r.OJTSemesterID);
  const p=await record(c,'positions',co.PositionID),company=await record(c,'companies',co.EnterpriseID);
  if(company.Status!=='ACTIVE'||p.DeletedAt||p.ArchivedAt)throw invalid('Doanh nghiệp hoặc vị trí không còn khả dụng.',409);
  let assignment=(await c.query(`SELECT a.* FROM "InternshipAssignments" a JOIN "StudentEnterpriseCoordination" old USING("CoordinationID")
   WHERE a."StudentID"=$1 AND old."OJTSemesterID"=$2 AND COALESCE(upper(a."Status"),'ASSIGNED') NOT IN ('CANCELLED','CANCELED') FOR UPDATE OF a`,[r.StudentID,r.OJTSemesterID])).rows[0];
  if(assignment&&assignment.CoordinationID!==id)throw invalid('Sinh viên đã có phân công khác trong kỳ này.',409,'ASSIGNMENT_EXISTS');
  if(!assignment)assignment=(await c.query(`INSERT INTO "InternshipAssignments" ("CoordinationID","StudentID","EnterpriseID","PositionID","StartDate","EndDate","Status")
   SELECT $1,$2,$3,$4,"StartDate","EndDate",'ASSIGNED' FROM "OJTSemesters" WHERE "OJTSemesterID"=$5 RETURNING *`,[id,r.StudentID,co.EnterpriseID,co.PositionID,r.OJTSemesterID])).rows[0];
  const count=(await c.query(`SELECT count(*)::int AS n FROM "OJTActualReceipts" receipt JOIN "StudentEnterpriseCoordination" c USING("CoordinationID") WHERE c."PositionID"=$1`,[p.PositionID])).rows[0].n;
  const row=(await c.query(`INSERT INTO "OJTActualReceipts" ("StudentID","OJTSemesterID","CoordinationID","AssignmentID","ReceivedBy","Reason","OriginalCapacity","ExceededCapacity")
   VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,[r.StudentID,r.OJTSemesterID,id,assignment.AssignmentID,actor.userId,reason,p.Capacity,count>=Number(p.Capacity??0)])).rows[0];
  await refreshSlots(c,p.PositionID);await audit(c,actor.userId,'OJTActualReceipts',id,'CONFIRM_ACTUAL_RECEIPT',null,row,reason);
  return row;
 });
}
