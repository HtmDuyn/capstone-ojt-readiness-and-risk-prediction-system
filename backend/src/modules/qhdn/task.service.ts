import type { PoolClient } from 'pg';
import { readTransaction } from './read.repository';
import { academicTransaction, audit } from '../academic/academic.repository';
import { enrichListRows } from '../../shared/list-context';
import { enterpriseScope, assertScope } from './catalog.service';
import { inputObject, requiredText, optionalText, positiveId, invalid, pagination } from '../students/student.validation';
import { dateInput } from '../academic/academic.schema';
import { fingerprint } from '../eligibility/eligibility.service';
import type { Actor } from '../ojt-registration/window.service';

export async function assignTasks(body: unknown, actor: Actor) {
  if (actor.roleCode !== 'ENTERPRISE') throw invalid('Enterprise role required.',403);
  const b = inputObject(body,['assignmentIds','tasks','idempotencyKey']);
  const key = requiredText(b.idempotencyKey,'idempotencyKey',100);
  if (!Array.isArray(b.assignmentIds) || !b.assignmentIds.length || b.assignmentIds.length > 500) throw invalid('Select 1–500 assignments.');
  const ids = b.assignmentIds.map((id:unknown)=>positiveId(id,'assignmentId'));
  if (new Set(ids).size!==ids.length) throw invalid('Duplicate assignment IDs.');
  if (!Array.isArray(b.tasks) || !b.tasks.length || b.tasks.length>50 || b.tasks.length*ids.length>5000) throw invalid('Provide 1–50 tasks, at most 5000 assignments of tasks.');
  const tasks = b.tasks.map((raw:unknown)=>{
    const t=inputObject(raw,['name','description','dueDate']);
    return {name:requiredText(t.name,'name',200),description:optionalText(t.description,'description',10000),dueDate:dateInput(t.dueDate,'dueDate')};
  });
  const hash=fingerprint({ids,tasks});
  return academicTransaction(async c=>{
    const old=(await c.query(`SELECT "UserID","Detail"::jsonb->'after' AS data FROM "AuditLogs" WHERE "EntityType"='InternshipTaskBatch' AND "Detail"::jsonb->'after'->>'key'=$1 LIMIT 1`,[key])).rows[0];
    if(old){if(old.UserID!==actor.userId||old.data.hash!==hash)throw invalid('Idempotency key conflict.',409);return {...old.data.result,replayed:true};}
    const companyId=await enterpriseScope(c,actor);
    if(companyId===null)throw invalid('Enterprise role required.',403);
    const assignments=await c.query(`SELECT "AssignmentID","EnterpriseID","Status" FROM "InternshipAssignments" WHERE "AssignmentID"=ANY($1::int[]) FOR UPDATE`,[ids]);
    if(assignments.rows.length!==ids.length)throw invalid('Internship assignment not found.',404,'QHDN_RECORD_NOT_FOUND');
    for(const assignment of assignments.rows){
      if(assignment.EnterpriseID!==companyId)throw invalid('This internship belongs to another enterprise.',403,'FORBIDDEN');
      if(!['ASSIGNED','ACTIVE','IN_PROGRESS'].includes(String(assignment.Status).toUpperCase()))throw invalid('Tasks require an accepted, ongoing internship.',409);
    }
    const invalidDeadline=await c.query(`SELECT a."AssignmentID" AS "assignmentId"
      FROM "InternshipAssignments" a CROSS JOIN unnest($2::date[]) AS due_dates("dueDate")
      WHERE a."AssignmentID"=ANY($1::int[])
        AND (due_dates."dueDate" < (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
          OR NOT COALESCE(due_dates."dueDate" BETWEEN a."StartDate" AND a."EndDate",false))
      LIMIT 1`,[ids,tasks.map(task=>task.dueDate)]);
    if(invalidDeadline.rowCount)throw invalid('Task due date must be within the internship and not in the past.');
    const created=(await c.query(`INSERT INTO "InternshipTasks" ("AssignmentID","TaskName","Description","AssignedDate","DueDate","Status")
      SELECT selected."assignmentId",task."name",task."description",(now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date,task."dueDate",'TODO'
      FROM unnest($1::int[]) AS selected("assignmentId")
      CROSS JOIN unnest($2::text[],$3::text[],$4::date[]) AS task("name","description","dueDate")
      RETURNING "TaskID" AS id,"AssignmentID" AS "assignmentId"`,
      [ids,tasks.map(task=>task.name),tasks.map(task=>task.description),tasks.map(task=>task.dueDate)])).rows;
    const result={created:created.length,tasks:created};
    await audit(c,actor.userId,'InternshipTaskBatch',created[0].id,'ASSIGN_TASKS',null,{key,hash,result});
    return {...result,replayed:false};
  });
}

export async function listTasks(params:Record<string,unknown>, actor:Actor,existingClient?:PoolClient){
  const p=pagination(params,['assignmentId','companyId','studentId','positionId','ojtSemesterId']);
  if(p.offset>2147483647)throw invalid('Pagination exceeds allowed range.');
  const id=params.assignmentId===undefined?null:positiveId(params.assignmentId,'assignmentId');
  return (actor.roleCode==='STUDENT'?readTransaction:academicTransaction)(async c=>{
    const company=params.companyId===undefined?null:positiveId(params.companyId,'companyId');
    const studentId=params.studentId===undefined?null:positiveId(params.studentId,'studentId');
    if(actor.roleCode==='ENTERPRISE'){positiveId(params.companyId,'companyId');await assertScope(c,actor,company!);}
    else if(actor.roleCode==='STUDENT'){
      positiveId(params.studentId,'studentId');
      if(!(await c.query('SELECT 1 FROM "Students" WHERE "StudentID"=$1 AND "UserID"=$2',[studentId,actor.userId])).rows.length)throw invalid('Student scope denied.',403,'FORBIDDEN');
    }else await enterpriseScope(c,actor);
    const positionId=params.positionId===undefined?null:positiveId(params.positionId,'positionId');
    const semesterId=params.ojtSemesterId===undefined?null:positiveId(params.ojtSemesterId,'ojtSemesterId');
    const rows=await c.query(`WITH filtered AS (SELECT t."TaskID" AS id,t."AssignmentID" AS "assignmentId",t."TaskName" AS name,t."Description" AS description,t."AssignedDate" AS "assignedDate",t."DueDate" AS "dueDate",t."Status" AS status,
      a."StudentID" AS "studentId",a."EnterpriseID" AS "companyId",a."PositionID" AS "positionId",co."OJTSemesterID" AS "ojtSemesterId",
      jsonb_build_object('id',a."AssignmentID",'status',a."Status",'startDate',a."StartDate",'endDate',a."EndDate") AS assignment,
      (COALESCE(upper(a."Status"),'') IN ('ASSIGNED','ACTIVE','IN_PROGRESS') AND COALESCE(upper(t."Status"),'') NOT IN ('DONE','COMPLETED')) AS "canSubmit",
      (SELECT count(*)::int FROM "TaskProgressUpdates" submitted WHERE submitted."TaskID"=t."TaskID" AND submitted."UpdatedByStudentID"=a."StudentID" AND submitted."PercentComplete"=100) AS "submissionCount",
      (SELECT jsonb_build_object('id',submitted."UpdateID",'taskId',submitted."TaskID",'studentId',submitted."UpdatedByStudentID",'content',submitted."ProgressDescription",'submittedAt',submitted."UpdateDate" AT TIME ZONE 'UTC','isLate',COALESCE((submitted."UpdateDate" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')::date>t."DueDate",false))
        FROM "TaskProgressUpdates" submitted WHERE submitted."TaskID"=t."TaskID" AND submitted."UpdatedByStudentID"=a."StudentID" AND submitted."PercentComplete"=100 ORDER BY submitted."UpdateID" DESC LIMIT 1) AS "latestSubmission"
      FROM "InternshipTasks" t JOIN "InternshipAssignments" a ON a."AssignmentID"=t."AssignmentID" JOIN "Students" s ON s."StudentID"=a."StudentID"
      JOIN "StudentEnterpriseCoordination" co ON co."CoordinationID"=a."CoordinationID"
      WHERE ($1::int IS NULL OR a."AssignmentID"=$1) AND ($2::int IS NULL OR a."EnterpriseID"=$2) AND ($3::int IS NULL OR a."StudentID"=$3) AND ($4::int IS NULL OR a."PositionID"=$4) AND ($7::int IS NULL OR co."OJTSemesterID"=$7)
      ), paged AS (SELECT * FROM filtered ORDER BY id DESC LIMIT $5 OFFSET $6)
      SELECT (SELECT count(*)::int FROM filtered) AS total,COALESCE(jsonb_agg(to_jsonb(paged) ORDER BY id DESC) FILTER (WHERE id IS NOT NULL),'[]'::jsonb) AS items FROM paged`,[id,company,studentId,positionId,p.limit,p.offset,semesterId]);
    return {...rows.rows[0],items:await enrichListRows(c,rows.rows[0].items),page:p.page,limit:p.limit};
  },existingClient);
}
