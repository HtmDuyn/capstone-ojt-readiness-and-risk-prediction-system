import { recruitmentAccessSql } from '../eligibility/recruitment-roster.repository';
import type { PoolClient } from 'pg';
import { academicTransaction, audit } from '../academic/academic.repository';
import { readTransaction } from './read.repository';
import { invalid, inputObject, positiveId, requiredText, enumValue } from '../students/student.validation';
import { requireStudentAdmission } from '../student-portal/admission.service';
import { assertOjtPathway } from '../academic/workflow-policy';
import { recordOjt202InProgress } from '../academic/ojt-course-enrollment';
import { staff, record } from './catalog.service';
import type { Actor, Row } from '../ojt-registration/window.service';
import { coordinationAvailability } from './placement.policy';
import { coordinationSlotsSql,coordinationCompanies } from './placement-slots';

export async function requirePlacementSchema(c:PoolClient){
 const ready=(await c.query(`SELECT to_regclass('public."OJTActualReceipts"') IS NOT NULL AS ready`)).rows[0].ready;
 if(!ready)throw invalid('Database chưa đồng bộ schema OJT placement. Script chuẩn nằm tại db/database; chạy script sẽ khởi tạo lại các bảng ứng dụng.',503,'PLACEMENT_MIGRATION_REQUIRED');
}
export async function placementContext(c:PoolClient,semesterId:number){
 return (await c.query(`SELECT count(*)::int AS "roundCount",max("EndsAt") AS "lastEndAt",
  count(*) FILTER(WHERE "EndsAt">clock_timestamp() OR "ResultsFinalizedAt" IS NULL)::int AS unfinished
  ,((count(*)>0 AND bool_and(COALESCE("ApplicationEndsAt","EndsAt")<=clock_timestamp()))
   OR (EXISTS(SELECT 1 FROM "OJTRegistrationWindows" rw WHERE rw."OJTSemesterID"=$1 AND rw."EndsAt"<=clock_timestamp())
    AND NOT EXISTS(SELECT 1 FROM "OJTRegistrationWindows" rw WHERE rw."OJTSemesterID"=$1 AND rw."EndsAt">clock_timestamp()))) AS "applicationDeadlinePassed"
  FROM "RecruitmentWindows" WHERE "OJTSemesterID"=$1 AND "CampaignID" IS NOT NULL`,[semesterId])).rows[0];
}
export async function placementBoard(params:Row,actor:Actor){
 staff(actor);const semesterId=positiveId(params.ojtSemesterId,'ojtSemesterId');
 return readTransaction(async c=>{
  await requirePlacementSchema(c);
  const context=await placementContext(c,semesterId);
  const items=(await c.query(`SELECT s."StudentID" AS id,s."StudentCode" AS "studentCode",u."FullName" AS "fullName",r."RegistrationID" AS "registrationId",r."Status" AS "registrationStatus",
   latest."CoordinationID" AS "coordinationId",latest."Decision" AS decision,latest."RejectReason" AS "rejectReason",
   (s."Status"='ACTIVE' AND u."Status"='ACTIVE') AS "isActive",
   EXISTS(SELECT 1 FROM "StudentEnterpriseCoordination" co JOIN "OJTRegistrations" reg USING("RegistrationID") WHERE reg."StudentID"=s."StudentID" AND co."OJTSemesterID"=$1 AND co."Decision"='ACCEPTED') AS "hasConfirmedPlace",
   (latest."Decision"='REJECTED' AND EXISTS(SELECT 1 FROM "ApplicationEvents" ev WHERE ev."ApplicationID"=latest."ApplicationID" AND ev."Action"='AUTO_REJECT_RESPONSE_DEADLINE')) AS "needsFollowUp",latest."Source" AS source,latest."PositionID" AS "positionId",
   p."Title" AS "positionTitle",latest."EnterpriseID" AS "companyId",e."Name" AS "companyName",receipt."ReceivedAt" AS "receivedAt",receipt."Reason" AS "receiptReason",receipt."ExceededCapacity" AS "exceededCapacity",(SELECT "FullName" FROM "Users" WHERE "UserID"=receipt."ReceivedBy") AS "receivedByName",
   EXISTS(SELECT 1 FROM "InternshipAssignments" a JOIN "StudentEnterpriseCoordination" ac ON ac."CoordinationID"=a."CoordinationID"
    WHERE a."StudentID"=s."StudentID" AND ac."OJTSemesterID"=$1 AND COALESCE(upper(a."Status"),'ASSIGNED') NOT IN ('CANCELLED','CANCELED')) AS "hasAssignment",
   COALESCE((SELECT jsonb_agg(jsonb_build_object('id',h."CoordinationID",'source',h."Source",'decision',h."Decision",'company',he."Name",'position',hp."Title",'at',h."CoordinatedAt",'reason',h."CoordinationReason",'decisionAt',h."DecisionAt",'rejectReason',h."RejectReason") ORDER BY h."CoordinationID" DESC)
    FROM "StudentEnterpriseCoordination" h JOIN "Enterprises" he ON he."EnterpriseID"=h."EnterpriseID" JOIN "InternshipPositions" hp ON hp."PositionID"=h."PositionID" WHERE h."RegistrationID"=r."RegistrationID"),'[]'::jsonb) AS history
   FROM "Students" s JOIN "Users" u USING("UserID")
   LEFT JOIN "OJTRegistrations" r ON r."StudentID"=s."StudentID" AND r."OJTSemesterID"=$1
   LEFT JOIN LATERAL(SELECT * FROM "StudentEnterpriseCoordination" co WHERE co."RegistrationID"=r."RegistrationID" ORDER BY co."CoordinationID" DESC LIMIT 1) latest ON true
   LEFT JOIN "InternshipPositions" p ON p."PositionID"=latest."PositionID" LEFT JOIN "Enterprises" e ON e."EnterpriseID"=latest."EnterpriseID"
   LEFT JOIN "OJTActualReceipts" receipt ON receipt."StudentID"=s."StudentID" AND receipt."OJTSemesterID"=$1
   WHERE s."DeletedAt" IS NULL AND EXISTS(SELECT 1 FROM (${recruitmentAccessSql}) hi WHERE hi."StudentID"=s."StudentID" AND hi."OJTSemesterID"=$1)
   ORDER BY s."StudentCode"`,[semesterId])).rows;
  const positions=(await c.query(`SELECT p."PositionID" AS id,p."Title" AS title,p."EnterpriseID" AS "companyId",e."Name" AS "companyName",p."Capacity" AS capacity,
   CASE WHEN p."Status"='ARCHIVED' THEN 0 ELSE ${coordinationSlotsSql} END AS "coordinationSlots",
   public."RecruitmentOccupiedSlots"(p."PositionID") AS "actualCount"
   FROM "InternshipPositions" p JOIN "Enterprises" e USING("EnterpriseID") WHERE p."OJTSemesterID"=$1 AND p."DeletedAt" IS NULL AND p."ArchivedAt" IS NULL AND e."Status"='ACTIVE' AND e."DeletedAt" IS NULL ORDER BY e."Name",p."Title"`,[semesterId])).rows;
  const confirmedCounts=(await c.query(`SELECT confirmed."EnterpriseID" AS id,e."Name" AS name,count(DISTINCT confirmed."StudentID")::int AS "actualCount" FROM (
   SELECT co."EnterpriseID",r."StudentID" FROM "StudentEnterpriseCoordination" co JOIN "OJTRegistrations" r USING("RegistrationID") WHERE co."OJTSemesterID"=$1 AND co."Decision"='ACCEPTED'
   UNION SELECT a."EnterpriseID",a."StudentID" FROM "InternshipAssignments" a JOIN "StudentEnterpriseCoordination" co USING("CoordinationID") WHERE co."OJTSemesterID"=$1 AND COALESCE(upper(a."Status"),'ASSIGNED') NOT IN ('CANCELLED','CANCELED')
   UNION SELECT co."EnterpriseID",receipt."StudentID" FROM "OJTActualReceipts" receipt JOIN "StudentEnterpriseCoordination" co USING("CoordinationID") WHERE receipt."OJTSemesterID"=$1
   ) confirmed JOIN "Enterprises" e USING("EnterpriseID") WHERE e."DeletedAt" IS NULL GROUP BY confirmed."EnterpriseID",e."Name"`,[semesterId])).rows;
  const students=items.map(student=>({...student,...coordinationAvailability(student,context)}));
  return {canCoordinate:students.some(student=>student.canCoordinate),summaryReady:context.roundCount>0&&context.unfinished===0,context,companies:coordinationCompanies(positions,confirmedCounts),positions,items:students};
 });
}
export async function supplementPlacement(body:unknown,actor:Actor){
 staff(actor);const b=inputObject(body,['studentId','ojtSemesterId','positionId','companyId','source','reason']);
 const studentId=positiveId(b.studentId,'studentId'),semesterId=positiveId(b.ojtSemesterId,'ojtSemesterId');
 if((b.companyId===undefined)===(b.positionId===undefined))throw invalid('Chọn một doanh nghiệp hoặc một vị trí tiếp nhận.');
 const companyId=b.companyId===undefined?null:positiveId(b.companyId,'companyId');
 let positionId=b.positionId===undefined?null:positiveId(b.positionId,'positionId');
 const source=enumValue(b.source,['QHDN_APPLICATION','QHDN_COORDINATION'],'source'),reason=requiredText(b.reason,'reason',2000);
 return academicTransaction(async c=>{
  await requirePlacementSchema(c);
  const s=(await c.query(`SELECT s.* FROM "Students" s JOIN "Users" u USING("UserID") WHERE s."StudentID"=$1 AND s."Status"='ACTIVE' AND u."Status"='ACTIVE' AND s."DeletedAt" IS NULL FOR UPDATE OF s`,[studentId])).rows[0];
  if(!s)throw invalid('Sinh viên không còn hoạt động.',409);
  const admission=await requireStudentAdmission(c,studentId,semesterId);await assertOjtPathway(c,studentId,semesterId);await recordOjt202InProgress(c,studentId,semesterId,actor.userId);
  if((await c.query(`SELECT 1 FROM "OJTActualReceipts" WHERE "StudentID"=$1 AND "OJTSemesterID"=$2 UNION ALL
    SELECT 1 FROM "InternshipAssignments" a JOIN "StudentEnterpriseCoordination" co USING("CoordinationID") WHERE a."StudentID"=$1 AND co."OJTSemesterID"=$2 AND COALESCE(upper(a."Status"),'ASSIGNED') NOT IN ('CANCELLED','CANCELED')
    UNION ALL SELECT 1 FROM "StudentEnterpriseCoordination" co JOIN "OJTRegistrations" reg USING("RegistrationID") WHERE reg."StudentID"=$1 AND co."OJTSemesterID"=$2 AND co."Decision"='ACCEPTED'`,[studentId,semesterId])).rowCount)throw invalid('Sinh viên đã có nơi thực tập trong kỳ này.',409,'ASSIGNMENT_EXISTS');
  let r=(await c.query('SELECT * FROM "OJTRegistrations" WHERE "StudentID"=$1 AND "OJTSemesterID"=$2 FOR UPDATE',[studentId,semesterId])).rows[0];
  if(!r)r=(await c.query(`INSERT INTO "OJTRegistrations" ("StudentID","OJTSemesterID","ProgramID","Application","Status","SubmittedBy") VALUES ($1,$2,$3,'{}','SUBMITTED',$4) RETURNING *`,[studentId,semesterId,s.ProgramID,actor.userId])).rows[0];
  const previous=(await c.query('SELECT * FROM "StudentEnterpriseCoordination" WHERE "RegistrationID"=$1 ORDER BY "CoordinationID" DESC LIMIT 1 FOR UPDATE',[r.RegistrationID])).rows[0];
  if(previous?.Decision==='ACCEPTED')throw invalid('Doanh nghiệp đã đồng ý nhận sinh viên. Không điều phối trùng.',409,'STUDENT_ALREADY_ACCEPTED');
  if(previous?.Decision==='PENDING'&&previous.Source.startsWith('QHDN_')){
   if((companyId!==null?previous.EnterpriseID===companyId:previous.PositionID===positionId)&&previous.Source===source&&previous.CoordinationReason===reason)return {...previous,replayed:true};
   throw invalid('Sinh viên đang chờ doanh nghiệp phản hồi điều phối trước.',409,'COORDINATION_PENDING');
  }
  const availability=coordinationAvailability({decision:previous?.Decision,source:previous?.Source,
   isFreshEligible:source==='QHDN_COORDINATION'&&admission.source==='SAVED_ELIGIBILITY'&&admission.status==='ELIGIBLE'&&!admission.isStale},await placementContext(c,semesterId));
  if(!availability.canCoordinate)throw invalid(availability.coordinationBlockedReason!,409,'COORDINATION_NOT_READY');
  if(companyId!==null){
   const available=(await c.query(`SELECT p."PositionID" AS id FROM "InternshipPositions" p JOIN "Enterprises" e USING("EnterpriseID")
    WHERE p."EnterpriseID"=$1 AND p."OJTSemesterID"=$2 AND p."DeletedAt" IS NULL AND p."ArchivedAt" IS NULL AND p."Status"<>'ARCHIVED'
     AND e."Status"='ACTIVE' AND e."DeletedAt" IS NULL
    ORDER BY ${coordinationSlotsSql} DESC,p."PositionID" LIMIT 1 FOR UPDATE OF p`,[companyId,semesterId])).rows[0];
   if(!available)throw invalid('Doanh nghiệp chưa có dữ liệu tiếp nhận khả dụng trong kỳ OJT này.',409,'COORDINATION_COMPANY_UNAVAILABLE');
   positionId=available.id;
  }
  const p=await record(c,'positions',positionId!),company=await record(c,'companies',p.EnterpriseID);
  if(p.OJTSemesterID!==semesterId||p.DeletedAt||p.ArchivedAt||company.Status!=='ACTIVE'||company.DeletedAt||p.Status==='ARCHIVED')throw invalid('Vị trí hoặc doanh nghiệp không phù hợp với kỳ OJT.',409);
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
