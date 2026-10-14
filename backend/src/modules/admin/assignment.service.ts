import { query } from '../../config/database';
import { academicTransaction, audit } from '../academic/academic.repository';
import { invalid, inputObject, positiveId, requiredText, optionalText, enumValue, pagination } from '../students/student.validation';
import { dateInput, dateRange } from '../academic/academic.schema';
import { pageSql, type Row } from './admin.repository';

const assignmentSelect=`SELECT a."AssignmentID" AS id,a."CoordinationID" AS "coordinationId",a."StudentID" AS "studentId",a."EnterpriseID" AS "companyId",a."PositionID" AS "positionId",p."OJTSemesterID" AS "ojtSemesterId",a."AcademicSupervisorID" AS "academicSupervisorId",a."EnterpriseSupervisorName" AS "enterpriseSupervisorName",a."StartDate" AS "startDate",a."EndDate" AS "endDate",a."Status" AS status FROM "InternshipAssignments" a JOIN "InternshipPositions" p ON p."PositionID"=a."PositionID"`;
export async function assignments(params:Row) {
 const p=pagination(params,['studentId','companyId','positionId','ojtSemesterId','status']),args:unknown[]=[],where:string[]=[];
 for(const [key,col]of Object.entries({studentId:'a."StudentID"',companyId:'a."EnterpriseID"',positionId:'a."PositionID"',ojtSemesterId:'p."OJTSemesterID"',status:'a."Status"'}))if(params[key]!==undefined){args.push(key==='status'?enumValue(params[key],['ASSIGNED','ACTIVE','COMPLETED','CANCELLED'],'status'):positiveId(params[key],key));where.push(`${col}=$${args.length}`);}
 return pageSql(assignmentSelect+(where.length?' WHERE '+where.join(' AND '):''),args,p);
}
export async function assignmentDetail(id:number) {const r=(await query(assignmentSelect+' WHERE a."AssignmentID"=$1',[id])).rows[0];if(!r)throw invalid('Assignment not found.',404);return r;}
export async function saveAssignment(body:unknown,actor:number,id?:number,statusOnly=false) {
 const b=inputObject(body,statusOnly?['status','reason']:id?['positionId','academicSupervisorId','enterpriseSupervisorName','startDate','endDate','reason']:['registrationId','positionId','academicSupervisorId','enterpriseSupervisorName','startDate','endDate']);
 if(id)requiredText(b.reason,'reason',2000);
 return academicTransaction(async c=>{
  const old=id?(await c.query('SELECT * FROM "InternshipAssignments" WHERE "AssignmentID"=$1 FOR UPDATE',[id])).rows[0]:null;
  if(id&&!old)throw invalid('Assignment not found.',404);
  const coord=old?(await c.query('SELECT * FROM "StudentEnterpriseCoordination" WHERE "CoordinationID"=$1 FOR UPDATE',[old.CoordinationID])).rows[0]:null;
  const registrationId=coord?.RegistrationID??positiveId(b.registrationId,'registrationId');
  const reg=(await c.query('SELECT * FROM "OJTRegistrations" WHERE "RegistrationID"=$1 FOR UPDATE',[registrationId])).rows[0];
  if(!reg)throw invalid('OJT registration not found.',404);
  const student=(await c.query('SELECT * FROM "Students" WHERE "StudentID"=$1 FOR UPDATE',[reg.StudentID])).rows[0];
  if(!student||student.DeletedAt||student.Status!=='ACTIVE')throw invalid('Student is inactive.',409);
  if(!old&&reg.Status!=='APPROVED')throw invalid('An approved OJT registration is required.',409,'REGISTRATION_NOT_APPROVED');
  if(old&&['COMPLETED','CANCELLED'].includes(old.Status))throw invalid('Completed or cancelled assignments are immutable.',409);
  if(old&&(!statusOnly||b.status==='CANCELLED')&&(await c.query('SELECT 1 FROM "OJTResults" WHERE "AssignmentID"=$1 UNION ALL SELECT 1 FROM "InternshipEvaluations" WHERE "AssignmentID"=$1 LIMIT 1',[id])).rowCount)throw invalid('An evaluated assignment cannot be edited or cancelled.',409);
  const positionId=positiveId(b.positionId??old?.PositionID,'positionId');
  // Lock both old and new positions in stable order; capacity updates are atomic.
  const locked=(await c.query('SELECT * FROM "InternshipPositions" WHERE "PositionID"=ANY($1::int[]) ORDER BY "PositionID" FOR UPDATE',[[...new Set([positionId,...(old?[old.PositionID]:[])])]])).rows;
  const pos=locked.find(p=>p.PositionID===positionId);
  const cancelling=statusOnly&&b.status==='CANCELLED';
  const allocating=!old||positionId!==old.PositionID;
  if(!pos||(!cancelling&&pos.DeletedAt)||(allocating&&pos.Status!=='OPEN')||pos.OJTSemesterID!==reg.OJTSemesterID)throw invalid('Position must belong to the registration semester and be open for new assignments.',409);
  const company=(await c.query('SELECT "Status","DeletedAt" FROM "Enterprises" WHERE "EnterpriseID"=$1 FOR UPDATE',[pos.EnterpriseID])).rows[0];
  if(!cancelling&&(!company||company.DeletedAt||(allocating&&company.Status!=='ACTIVE')))throw invalid('Company is inactive.',409);
  if((await c.query(`SELECT 1 FROM "InternshipAssignments" a JOIN "InternshipPositions" p ON p."PositionID"=a."PositionID" WHERE a."StudentID"=$1 AND p."OJTSemesterID"=$2 AND COALESCE(a."Status",'ACTIVE')<>'CANCELLED' AND ($3::int IS NULL OR a."AssignmentID"<>$3) LIMIT 1`,[reg.StudentID,reg.OJTSemesterID,id??null])).rowCount)throw invalid('Student already has an assignment in this semester.',409,'DUPLICATE_ASSIGNMENT');
  const used=(await c.query(`SELECT count(*)::int AS n FROM "InternshipAssignments" WHERE "PositionID"=$1 AND COALESCE("Status",'ACTIVE')<>'CANCELLED' AND ($2::int IS NULL OR "AssignmentID"<>$2)`,[positionId,id??null])).rows[0].n;
  if(!cancelling&&(pos.Capacity==null||used>=pos.Capacity))throw invalid('Position has no remaining capacity.',409,'POSITION_FULL');
  const status=statusOnly?enumValue(b.status,['ACTIVE','COMPLETED','CANCELLED'],'status'):old?.Status??'ASSIGNED';
  const transitions:Record<string,string[]>={ASSIGNED:['ACTIVE','CANCELLED'],ACTIVE:['COMPLETED','CANCELLED']};
  if(statusOnly&&!(transitions[old.Status]??[]).includes(status))throw invalid('Invalid assignment status transition.',409);
  const start=dateInput(b.startDate??(old?.StartDate instanceof Date?old.StartDate.toISOString().slice(0,10):old?.StartDate),'startDate'),end=dateInput(b.endDate??(old?.EndDate instanceof Date?old.EndDate.toISOString().slice(0,10):old?.EndDate),'endDate');dateRange(start,end);
  const supervisor=b.academicSupervisorId===null?null:b.academicSupervisorId===undefined?old?.AcademicSupervisorID??null:positiveId(b.academicSupervisorId,'academicSupervisorId');
  if(supervisor){const user=(await c.query(`SELECT 1 FROM "Users" u JOIN "Roles" r ON r."RoleID"=u."RoleID" WHERE u."UserID"=$1 AND u."Status"='ACTIVE' AND r."RoleCode"='ACADEMIC'`,[supervisor])).rowCount;if(!user)throw invalid('Academic supervisor must be an active ACADEMIC user.');}
  const supervisorName=optionalText(b.enterpriseSupervisorName===undefined?old?.EnterpriseSupervisorName:b.enterpriseSupervisorName,'enterpriseSupervisorName',100);
  let coordinationId=old?.CoordinationID;
  if(!old)coordinationId=(await c.query(`INSERT INTO "StudentEnterpriseCoordination" ("RegistrationID","EnterpriseID","PositionID","CoordinatedBy","OJTSemesterID","Decision","DecisionAt") VALUES ($1,$2,$3,$4,$5,'ACCEPTED',now()) RETURNING "CoordinationID"`,[registrationId,pos.EnterpriseID,positionId,actor,reg.OJTSemesterID])).rows[0].CoordinationID;
  else if(positionId!==old.PositionID)await c.query(`UPDATE "StudentEnterpriseCoordination" SET "EnterpriseID"=$2,"PositionID"=$3,"ApplicationID"=NULL,"CoordinatedBy"=$4,"CoordinatedAt"=now() WHERE "CoordinationID"=$1`,[coordinationId,pos.EnterpriseID,positionId,actor]);
  const values=[coordinationId,reg.StudentID,pos.EnterpriseID,positionId,supervisor,supervisorName,start,end,status];
  const row=(await c.query(id?`UPDATE "InternshipAssignments" SET "CoordinationID"=$1,"StudentID"=$2,"EnterpriseID"=$3,"PositionID"=$4,"AcademicSupervisorID"=$5,"EnterpriseSupervisorName"=$6,"StartDate"=$7,"EndDate"=$8,"Status"=$9 WHERE "AssignmentID"=$10 RETURNING *`:`INSERT INTO "InternshipAssignments" ("CoordinationID","StudentID","EnterpriseID","PositionID","AcademicSupervisorID","EnterpriseSupervisorName","StartDate","EndDate","Status") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,id?[...values,id]:values)).rows[0];
  for(const p of locked)await c.query(`UPDATE "InternshipPositions" p SET "RemainingSlots"=GREATEST(0,"Capacity"-(SELECT count(*)::int FROM "InternshipAssignments" a WHERE a."PositionID"=p."PositionID" AND COALESCE(a."Status",'ACTIVE')<>'CANCELLED')) WHERE "PositionID"=$1`,[p.PositionID]);
  await audit(c,actor,'InternshipAssignments',row.AssignmentID,id?'UPDATE':'CREATE',old,row,b.reason as string|undefined);
  return (await c.query(assignmentSelect+' WHERE a."AssignmentID"=$1',[row.AssignmentID])).rows[0];
 });
}
