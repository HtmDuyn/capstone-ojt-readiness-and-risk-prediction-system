import { createHash } from 'node:crypto';
import type { PoolClient } from 'pg';
import { academicTransaction,audit } from '../academic/academic.repository';
import { enterpriseScope } from '../qhdn/catalog.service';
import { decision } from '../qhdn/workflow.service';
import { ids } from '../combo-registration/combo.validation';
import { inputObject,invalid,requiredText } from '../students/student.validation';
import { assertPostPhase } from '../recruitment/round-policy';
import type { Actor } from '../ojt-registration/window.service';

async function preview(c:PoolClient,candidateIds:number[],companyId:number,actor:Actor){
 const candidates=(await c.query(`SELECT co.*,r."StudentID" FROM "StudentEnterpriseCoordination" co JOIN "OJTRegistrations" r USING("RegistrationID")
  WHERE co."CoordinationID"=ANY($1::int[]) AND co."EnterpriseID"=$2 ORDER BY co."CoordinationID" FOR UPDATE OF co`,[candidateIds,companyId])).rows;
 if(candidates.length!==candidateIds.length)throw invalid('Hồ sơ không tồn tại hoặc không thuộc doanh nghiệp.',404,'CANDIDATE_NOT_FOUND');
 const seen=new Set<string>();
 for(const candidate of candidates){
  if(candidate.Decision!=='PENDING'||(await c.query('SELECT 1 FROM "StudentEnterpriseCoordination" WHERE "RegistrationID"=$1 AND "CoordinationID">$2',[candidate.RegistrationID,candidate.CoordinationID])).rowCount)
   throw invalid('Chỉ nhận hồ sơ mới nhất đang chờ duyệt. Vui lòng tải lại danh sách.',409,'CANDIDATE_NOT_PENDING');
  const key=candidate.OJTSemesterID+':'+candidate.StudentID;
  if(seen.has(key))throw invalid('Một sinh viên chỉ được nhận một lần trong cùng kỳ.',409);
  seen.add(key);
  if(candidate.ApplicationID){const application=(await c.query('SELECT "PostID" FROM "JobApplications" WHERE "ApplicationID"=$1',[candidate.ApplicationID])).rows[0];if(application)await assertPostPhase(c,application.PostID,'RESULTS');}
 }
 const semesterIds=[...new Set(candidates.map(candidate=>candidate.OJTSemesterID))].sort((a,b)=>a-b);
 const semesters=[];
 for(const semesterId of semesterIds){
  const row=(await c.query(`SELECT term."Name" AS name,
   (SELECT COALESCE(sum(p."Capacity"),0)::int FROM "InternshipPositions" p WHERE p."EnterpriseID"=$1 AND p."OJTSemesterID"=$2 AND p."DeletedAt" IS NULL AND p."ArchivedAt" IS NULL) AS capacity,
   (SELECT count(DISTINCT placed.student)::int FROM (
    SELECT r."StudentID" AS student FROM "StudentEnterpriseCoordination" co JOIN "OJTRegistrations" r USING("RegistrationID") WHERE co."EnterpriseID"=$1 AND co."OJTSemesterID"=$2 AND co."Decision"='ACCEPTED'
    UNION SELECT a."StudentID" FROM "InternshipAssignments" a JOIN "StudentEnterpriseCoordination" co USING("CoordinationID") WHERE a."EnterpriseID"=$1 AND co."OJTSemesterID"=$2 AND COALESCE(upper(a."Status"),'ASSIGNED') NOT IN ('CANCELLED','CANCELED')
    UNION SELECT receipt."StudentID" FROM "OJTActualReceipts" receipt JOIN "StudentEnterpriseCoordination" co USING("CoordinationID") WHERE co."EnterpriseID"=$1 AND receipt."OJTSemesterID"=$2
   ) placed) AS "currentCount" FROM "OJTSemesters" term WHERE term."OJTSemesterID"=$2`,[companyId,semesterId])).rows[0];
  const selectedCount=candidates.filter(candidate=>candidate.OJTSemesterID===semesterId).length;
  const afterCount=row.currentCount+selectedCount;
  semesters.push({ojtSemesterId:semesterId,...row,selectedCount,afterCount,excessCount:Math.max(0,afterCount-row.capacity)});
 }
 const confirmationToken=createHash('sha256').update(JSON.stringify({actor:actor.userId,companyId,candidateIds,semesters})).digest('hex');
 return {candidateIds,semesters,totalSelected:candidateIds.length,overCapacity:semesters.some(item=>item.excessCount>0),confirmationToken};
}

export async function bulkAcceptance(body:unknown,actor:Actor,commit=false){
 if(actor.roleCode!=='ENTERPRISE')throw invalid('Chức năng dành cho doanh nghiệp.',403,'FORBIDDEN');
 const b=inputObject(body,commit?['candidateIds','confirmationToken','allowOverCapacity','reason']:['candidateIds']);
 const candidateIds=ids(b.candidateIds,'candidateIds',200);
 if(!candidateIds.length)throw invalid('Chọn ít nhất một sinh viên.');
 const token=commit?requiredText(b.confirmationToken,'confirmationToken',64):null;
 const reason=commit?requiredText(b.reason,'reason',2000):null;
 if(commit&&typeof b.allowOverCapacity!=='boolean')throw invalid('allowOverCapacity phải là boolean.');
 return academicTransaction(async c=>{
  const companyId=(await enterpriseScope(c,actor))!;
  if(commit){
   const prior=(await c.query(`SELECT "Detail"::jsonb->'after' AS result FROM "AuditLogs" WHERE "UserID"=$1 AND "Action"='ENTERPRISE_BULK_ACCEPT' AND "EntityID"=$2 AND "Detail"::jsonb->'after'->>'confirmationToken'=$3 ORDER BY "LogID" DESC LIMIT 1`,[actor.userId,companyId,token])).rows[0];
   if(prior){if(JSON.stringify(prior.result.candidateIds)!==JSON.stringify(candidateIds))throw invalid('Danh sách không khớp lần xác nhận.',409);return {...prior.result,replayed:true};}
  }
  const result=await preview(c,candidateIds,companyId,actor);
  if(!commit)return result;
  if(token!==result.confirmationToken)throw invalid('Chỉ tiêu hoặc số sinh viên đã nhận đã thay đổi. Hãy kiểm tra và xác nhận lại.',409,'BULK_ACCEPTANCE_CHANGED');
  if(result.overCapacity&&!b.allowOverCapacity)throw invalid('Cần xác nhận đồng ý nhận vượt chỉ tiêu.',409,'BULK_OVER_CAPACITY_CONFIRMATION_REQUIRED');
  if(!(await c.query(`SELECT EXISTS(SELECT 1 FROM "SchemaMigrations" WHERE "Version"='20261116_enterprise_bulk_acceptance') AS ready`)).rows[0].ready)
   throw invalid('Cập nhật khối OJT ENTERPRISE BULK ACCEPTANCE V7 trong backend/DB trước khi nhận hàng loạt.',503,'BULK_ACCEPTANCE_MIGRATION_REQUIRED');
  await c.query(`SELECT set_config('app.enterprise_bulk_company_id',$1,true)`,[String(companyId)]);
  for(const candidateId of candidateIds)await decision(candidateId,{decision:'ACCEPTED',reason},actor,c,true);
  const response={...result,acceptedCount:candidateIds.length};
  await audit(c,actor.userId,'Enterprises',companyId,'ENTERPRISE_BULK_ACCEPT',null,response,reason!);
  return response;
 });
}
