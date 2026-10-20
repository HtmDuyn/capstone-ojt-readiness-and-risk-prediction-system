import { officialEvaluationRelation } from '../ojt-results/official-evaluation';
import type { PoolClient } from 'pg';
import { readTransaction } from './read.repository';
import { invalid, positiveId, enumValue, pagination } from '../students/student.validation';
import type { Actor, Row } from '../ojt-registration/window.service';
import { staff } from './catalog.service';

export type ReportType='acceptance'|'internships'|'enterprise-feedback';
export type Filters={ojtSemesterId:number|null;companyId:number|null};
const reportTypes:ReportType[]=['acceptance','internships','enterprise-feedback'];
export function reportQuery(params:Row,kind:'dashboard'|'report'|'export'){
  const allowed=['ojtSemesterId','companyId',...(kind==='export'?['type','format']:kind==='report'?['type']:[])];
  const p=pagination(params,allowed);
  if(kind!=='report'&&(params.page!==undefined||params.limit!==undefined))throw invalid('Dashboard and export do not support pagination.');
  if(p.offset>2147483647)throw invalid('Pagination exceeds allowed range.');
  const filters:Filters={ojtSemesterId:params.ojtSemesterId===undefined?null:positiveId(params.ojtSemesterId,'ojtSemesterId'),companyId:params.companyId===undefined?null:positiveId(params.companyId,'companyId')};
  const type=kind!=='dashboard'?enumValue(params.type,reportTypes,'type') as ReportType:undefined;
  const format=kind==='export'?enumValue(params.format??'csv',['csv','json'],'format'):undefined;
  return {filters,...p,type,format};
}
async function validateScope(c:PoolClient,f:Filters){
  if(f.ojtSemesterId!==null&&!(await c.query('SELECT 1 FROM "OJTSemesters" WHERE "OJTSemesterID"=$1',[f.ojtSemesterId])).rowCount)throw invalid('OJT semester not found.',404,'OJT_SEMESTER_NOT_FOUND');
  if(f.companyId!==null&&!(await c.query('SELECT 1 FROM "Enterprises" WHERE "EnterpriseID"=$1',[f.companyId])).rowCount)throw invalid('Company not found.',404,'COMPANY_NOT_FOUND');
}
// Rank before filtering by company: reassigned students belong to their latest destination.
const coordinationCte=`WITH latest_coordination AS (
 SELECT DISTINCT ON (co."RegistrationID") co.* FROM "StudentEnterpriseCoordination" co
 JOIN "OJTRegistrations" r ON r."RegistrationID"=co."RegistrationID"
 WHERE ($1::int IS NULL OR r."OJTSemesterID"=$1)
 ORDER BY co."RegistrationID",co."CoordinationID" DESC
), scoped_coordinations AS (
 SELECT co.*,r."OJTSemesterID" AS semester_id,
 CASE WHEN UPPER(co."Decision") IN ('ACCEPTED','ACCEPT','APPROVED') THEN 'ACCEPTED'
 WHEN UPPER(co."Decision") IN ('REJECTED','REJECT') THEN 'REJECTED' ELSE 'PENDING' END AS decision
 FROM "StudentEnterpriseCoordination" co JOIN "OJTRegistrations" r ON r."RegistrationID"=co."RegistrationID"
 WHERE ($1::int IS NULL OR r."OJTSemesterID"=$1) AND ($2::int IS NULL OR co."EnterpriseID"=$2)
)`;
const assignmentCte=`WITH scoped_assignments AS (
 SELECT a.*,r."OJTSemesterID" AS semester_id,r."RegistrationID" AS registration_id,
 COALESCE(UPPER(a."Status"),'ASSIGNED') AS assignment_status
 FROM "InternshipAssignments" a JOIN "StudentEnterpriseCoordination" co ON co."CoordinationID"=a."CoordinationID"
 JOIN "OJTRegistrations" r ON r."RegistrationID"=co."RegistrationID"
 WHERE ($1::int IS NULL OR r."OJTSemesterID"=$1) AND ($2::int IS NULL OR a."EnterpriseID"=$2)
)`;
const acceptanceSql=`${coordinationCte}, latest_totals AS (
 SELECT co.semester_id,co."EnterpriseID" AS company_id,count(*)::int AS "currentStudents",
 count(*) FILTER (WHERE co.decision='PENDING')::int AS pending,
 count(*) FILTER (WHERE co.decision='ACCEPTED')::int AS accepted,
 count(*) FILTER (WHERE co.decision='REJECTED')::int AS rejected
 FROM scoped_coordinations co JOIN latest_coordination lc ON lc."CoordinationID"=co."CoordinationID"
 GROUP BY co.semester_id,co."EnterpriseID"
), attempt_totals AS (
 SELECT semester_id,"EnterpriseID" AS company_id,count(*)::int AS "coordinationAttempts",
 count(*) FILTER (WHERE decision='PENDING')::int AS "pendingAttempts",
 count(*) FILTER (WHERE decision='ACCEPTED')::int AS "acceptedAttempts",
 count(*) FILTER (WHERE decision='REJECTED')::int AS "rejectedAttempts"
 FROM scoped_coordinations GROUP BY semester_id,"EnterpriseID"
)
SELECT a.semester_id AS "ojtSemesterId",t."SemesterCode" AS "semesterCode",a.company_id AS "companyId",e."Name" AS "companyName",
 COALESCE(l."currentStudents",0)::int AS "currentStudents",COALESCE(l.pending,0)::int AS pending,
 COALESCE(l.accepted,0)::int AS accepted,COALESCE(l.rejected,0)::int AS rejected,
 CASE WHEN COALESCE(l.accepted,0)+COALESCE(l.rejected,0)=0 THEN NULL
 ELSE ROUND(100.0*l.accepted/(l.accepted+l.rejected),2)::float8 END AS "acceptanceRate",
 a."coordinationAttempts",a."pendingAttempts",a."acceptedAttempts",a."rejectedAttempts"
 FROM attempt_totals a LEFT JOIN latest_totals l USING(semester_id,company_id)
 JOIN "Enterprises" e ON e."EnterpriseID"=a.company_id JOIN "OJTSemesters" t ON t."OJTSemesterID"=a.semester_id`;
const internshipSql=`${assignmentCte}
SELECT a.semester_id AS "ojtSemesterId",t."SemesterCode" AS "semesterCode",a."EnterpriseID" AS "companyId",e."Name" AS "companyName",
 count(*)::int AS "totalAssignments",
 count(*) FILTER (WHERE a.assignment_status='ASSIGNED')::int AS assigned,
 count(*) FILTER (WHERE a.assignment_status IN ('ACTIVE','IN_PROGRESS'))::int AS active,
 count(*) FILTER (WHERE a.assignment_status='COMPLETED')::int AS completed,
 count(*) FILTER (WHERE a.assignment_status='FAILED')::int AS failed,
 count(*) FILTER (WHERE a.assignment_status IN ('CANCELLED','CANCELED'))::int AS cancelled,
 count(DISTINCT a."StudentID") FILTER (WHERE a.assignment_status NOT IN ('CANCELLED','CANCELED'))::int AS "assignedStudents",
 count(r."ResultID")::int AS "totalResults",
 count(r."ResultID") FILTER (WHERE r."Status"='PENDING_ACADEMIC_CONFIRMATION')::int AS "pendingResults",
 count(r."ResultID") FILTER (WHERE r."Status"='REVISION_REQUESTED')::int AS "revisionRequestedResults",
 count(r."ResultID") FILTER (WHERE r."Status"='CONFIRMED')::int AS "confirmedResults",
 count(r."ResultID") FILTER (WHERE r."Status"='CONFIRMED' AND r."Outcome"='PASSED')::int AS "passedResults",
 count(r."ResultID") FILTER (WHERE r."Status"='CONFIRMED' AND r."Outcome"='FAILED')::int AS "failedResults",
 ROUND(AVG(r."OfficialScore") FILTER (WHERE r."Status"='CONFIRMED'),2)::float8 AS "averageOfficialScore"
 FROM scoped_assignments a JOIN "Enterprises" e ON e."EnterpriseID"=a."EnterpriseID"
 JOIN "OJTSemesters" t ON t."OJTSemesterID"=a.semester_id LEFT JOIN ${officialEvaluationRelation} r ON r."AssignmentID"=a."AssignmentID"
 GROUP BY a.semester_id,t."SemesterCode",a."EnterpriseID",e."Name"`;
const feedbackSql=`${assignmentCte}
SELECT a.semester_id AS "ojtSemesterId",t."SemesterCode" AS "semesterCode",a."EnterpriseID" AS "companyId",e."Name" AS "companyName",
 count(*)::int AS "eligibleAssignments",count(v."EvaluationID")::int AS "evaluationCount",
 count(*) FILTER (WHERE v."EvaluationID" IS NULL)::int AS "missingEvaluations",
 ROUND(100.0*count(v."EvaluationID")/count(*),2)::float8 AS "evaluationCoverageRate",
 ROUND(AVG(v."CompletionScore"),2)::float8 AS "averageCompletionScore",
 ROUND(AVG(v."AttitudeScore"),2)::float8 AS "averageAttitudeScore",
 ROUND(AVG(v."SkillScore"),2)::float8 AS "averageSkillScore",
 ROUND(AVG(v."OverallScore"),2)::float8 AS "averageOverallScore",
 count(v."EvaluationID") FILTER (WHERE NULLIF(btrim(v."Comments"),'') IS NOT NULL)::int AS "commentsCount",
 count(v."EvaluationID") FILTER (WHERE role."RoleCode"='ENTERPRISE')::int AS "enterpriseSubmittedCount",
 count(v."EvaluationID") FILTER (WHERE role."RoleCode" IN ('ADMIN','OJT_COORD'))::int AS "staffEnteredCount",
 MAX(v."EvaluatedAt") AS "lastEvaluatedAt"
 FROM scoped_assignments a JOIN "Enterprises" e ON e."EnterpriseID"=a."EnterpriseID"
 JOIN "OJTSemesters" t ON t."OJTSemesterID"=a.semester_id
 LEFT JOIN "InternshipEvaluations" v ON v."AssignmentID"=a."AssignmentID" AND v."EvaluatedAt" IS NOT NULL AND v."OverallScore" IS NOT NULL
 LEFT JOIN "Users" u ON u."UserID"=v."EvaluatedBy" LEFT JOIN "Roles" role ON role."RoleID"=u."RoleID"
 WHERE a.assignment_status IN ('ACTIVE','IN_PROGRESS','COMPLETED','FAILED')
 GROUP BY a.semester_id,t."SemesterCode",a."EnterpriseID",e."Name"`;
const reportSql:Record<ReportType,string>={acceptance:acceptanceSql,internships:internshipSql,'enterprise-feedback':feedbackSql};
export async function report(type:ReportType,params:Row,actor:Actor,exportAll=false){
 staff(actor);
 const q=reportQuery(params,exportAll?'export':'report');
 return readTransaction(async c=>{
  await validateScope(c,q.filters);
  const args=[q.filters.ojtSemesterId,q.filters.companyId],sql=reportSql[type];
  // Materialize aggregation once for both the total and page; cap export payloads.
  const pageArgs=exportAll?[...args,10000,0]:[...args,q.limit,q.offset];
  const {total,items:rows}=(await c.query(`WITH report_data AS MATERIALIZED (${sql}), report_page AS (
    SELECT * FROM report_data ORDER BY "ojtSemesterId","companyId" LIMIT $3 OFFSET $4
  ) SELECT (SELECT count(*)::int FROM report_data) AS total,
    COALESCE(jsonb_agg(to_jsonb(report_page) ORDER BY "ojtSemesterId","companyId") FILTER (WHERE "companyId" IS NOT NULL),'[]'::jsonb) AS items
    FROM report_page`,pageArgs)).rows[0];
  if(exportAll&&total>10000)throw invalid('Export exceeds 10000 rows. Narrow the filters.',422,'QHDN_EXPORT_TOO_LARGE');
  if(type==='enterprise-feedback')for(const row of rows)if(row.lastEvaluatedAt!==null)row.lastEvaluatedAt=new Date(row.lastEvaluatedAt).toISOString();
  return {type,filters:q.filters,items:rows,total,...(exportAll?{}:{page:q.page,limit:q.limit})};
 });
}
export async function dashboard(params:Row,actor:Actor){
 staff(actor);const {filters:f}=reportQuery(params,'dashboard');
 return readTransaction(async c=>{
  await validateScope(c,f);const args=[f.ojtSemesterId,f.companyId];
  const partners=(await c.query(`SELECT count(*)::int AS total,count(*) FILTER (WHERE e."Status"='ACTIVE')::int AS active,count(*) FILTER (WHERE e."Status"='INACTIVE')::int AS inactive FROM "Enterprises" e WHERE ($2::int IS NULL OR e."EnterpriseID"=$2) AND ($1::int IS NULL OR EXISTS (SELECT 1 FROM "InternshipPositions" p WHERE p."EnterpriseID"=e."EnterpriseID" AND p."OJTSemesterID"=$1))`,args)).rows[0];
  const positions=(await c.query(`WITH scoped_positions AS (
   SELECT p.*,e."Status" AS company_status
   FROM "InternshipPositions" p JOIN "Enterprises" e ON e."EnterpriseID"=p."EnterpriseID"
   WHERE ($1::int IS NULL OR p."OJTSemesterID"=$1) AND ($2::int IS NULL OR p."EnterpriseID"=$2)
  ), occupancy AS (
   SELECT a."PositionID",count(*)::int AS used FROM "InternshipAssignments" a
   JOIN scoped_positions p ON p."PositionID"=a."PositionID"
   WHERE COALESCE(UPPER(a."Status"),'ASSIGNED') NOT IN ('CANCELLED','CANCELED') GROUP BY a."PositionID"
  ), positions AS (
   SELECT p.*,COALESCE(o.used,0) AS used FROM scoped_positions p LEFT JOIN occupancy o ON o."PositionID"=p."PositionID"
  ) SELECT count(*)::int AS total,count(*) FILTER (WHERE "Status"='OPEN' AND company_status='ACTIVE')::int AS open,
   COALESCE(sum(COALESCE("Capacity",0)),0)::float8 AS "totalCapacity",COALESCE(sum(used),0)::float8 AS "occupiedSlots",
   COALESCE(sum(GREATEST(0,COALESCE("Capacity",0)-used)),0)::float8 AS "remainingSlots",
   COALESCE(sum(GREATEST(0,COALESCE("Capacity",0)-used)) FILTER (WHERE "Status"='OPEN' AND company_status='ACTIVE'),0)::float8 AS "openRemainingSlots" FROM positions`,args)).rows[0];
  const students=(await c.query(`${coordinationCte}, latest_assignment AS (
   SELECT DISTINCT ON (co."RegistrationID") co."RegistrationID",a."AssignmentID",a."EnterpriseID"
   FROM "InternshipAssignments" a JOIN "StudentEnterpriseCoordination" co ON co."CoordinationID"=a."CoordinationID"
   WHERE ($1::int IS NULL OR co."OJTSemesterID"=$1) AND COALESCE(UPPER(a."Status"),'ASSIGNED') NOT IN ('CANCELLED','CANCELED')
   ORDER BY co."RegistrationID",a."AssignmentID" DESC
  ), handed_off AS (
   SELECT r."RegistrationID",lc."CoordinationID",lc."Decision",a."AssignmentID",
    CASE WHEN UPPER(lc."Decision") IN ('ACCEPTED','ACCEPT','APPROVED') THEN 'ACCEPTED' WHEN UPPER(lc."Decision") IN ('REJECTED','REJECT') THEN 'REJECTED' ELSE 'PENDING' END AS decision
   FROM "EligibleStudentHandoffItems" h JOIN "OJTRegistrations" r ON r."RegistrationID"=h."RegistrationID"
   LEFT JOIN latest_coordination lc ON lc."RegistrationID"=r."RegistrationID"
   LEFT JOIN latest_assignment a ON a."RegistrationID"=r."RegistrationID"
   WHERE ($1::int IS NULL OR r."OJTSemesterID"=$1) AND ($2::int IS NULL OR COALESCE(a."EnterpriseID",lc."EnterpriseID")=$2)
  ) SELECT count(*)::int AS "handedOff",count(*) FILTER (WHERE "AssignmentID" IS NULL)::int AS unallocated,
   count(*) FILTER (WHERE "CoordinationID" IS NULL AND "AssignmentID" IS NULL)::int AS "notCoordinated",
   count(*) FILTER (WHERE "CoordinationID" IS NOT NULL AND decision='PENDING' AND "AssignmentID" IS NULL)::int AS "waitingForEnterprise",
   count(*) FILTER (WHERE decision='REJECTED' AND "AssignmentID" IS NULL)::int AS "enterpriseRejected",
   count(*) FILTER (WHERE "CoordinationID" IS NOT NULL AND decision='ACCEPTED' AND "AssignmentID" IS NULL)::int AS "acceptedAwaitingAssignment",
   count(*) FILTER (WHERE "AssignmentID" IS NOT NULL)::int AS assigned FROM handed_off`,args)).rows[0];
  const totals=(await c.query(`SELECT COALESCE(sum("totalAssignments"),0)::int AS total,COALESCE(sum(assigned),0)::int AS assigned,COALESCE(sum(active),0)::int AS active,COALESCE(sum(completed),0)::int AS completed,COALESCE(sum(failed),0)::int AS failed,COALESCE(sum(cancelled),0)::int AS cancelled,COALESCE(sum("totalResults"),0)::int AS "totalResults",COALESCE(sum("pendingResults"),0)::int AS "pendingResults",COALESCE(sum("revisionRequestedResults"),0)::int AS "revisionRequestedResults",COALESCE(sum("confirmedResults"),0)::int AS "confirmedResults",COALESCE(sum("passedResults"),0)::int AS "passedResults",COALESCE(sum("failedResults"),0)::int AS "failedResults" FROM (${internshipSql}) report`,args)).rows[0];
  const {totalResults,pendingResults,revisionRequestedResults,confirmedResults,passedResults,failedResults,...assignments}=totals;
  return {filters:f,partners,positions,students,assignments,results:{total:totalResults,pending:pendingResults,revisionRequested:revisionRequestedResults,confirmed:confirmedResults,passed:passedResults,failed:failedResults}};
 });
}
export const reportColumns:Record<ReportType,string[]>={
 acceptance:['ojtSemesterId','semesterCode','companyId','companyName','currentStudents','pending','accepted','rejected','acceptanceRate','coordinationAttempts','pendingAttempts','acceptedAttempts','rejectedAttempts'],
 internships:['ojtSemesterId','semesterCode','companyId','companyName','totalAssignments','assigned','active','completed','failed','cancelled','assignedStudents','totalResults','pendingResults','revisionRequestedResults','confirmedResults','passedResults','failedResults','averageOfficialScore'],
 'enterprise-feedback':['ojtSemesterId','semesterCode','companyId','companyName','eligibleAssignments','evaluationCount','missingEvaluations','evaluationCoverageRate','averageCompletionScore','averageAttitudeScore','averageSkillScore','averageOverallScore','commentsCount','enterpriseSubmittedCount','staffEnteredCount','lastEvaluatedAt']
};
export function reportCsv(type:ReportType,items:Row[]){
 const cell=(value:unknown)=>{let s=value==null?'':value instanceof Date?value.toISOString():String(value);if(/^\s*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
 const cols=reportColumns[type];return '\uFEFF'+[cols.map(cell).join(','),...items.map(row=>cols.map(col=>cell(row[col])).join(','))].join('\r\n');
}
