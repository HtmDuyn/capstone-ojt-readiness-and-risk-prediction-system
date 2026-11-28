import type { PoolClient } from 'pg';
import { readTransaction } from './read.repository';
import { academicTransaction, audit } from '../academic/academic.repository';
import { enrichListRows } from '../../shared/list-context';
import { enterpriseScope, assertScope } from './catalog.service';
import { inputObject, requiredText, optionalText, positiveId, invalid, pagination } from '../students/student.validation';
import { dateInput } from '../academic/academic.schema';
import { fingerprint } from '../eligibility/eligibility.service';
import type { Actor } from '../ojt-registration/window.service';
import { enterpriseSemesterStatusSql, visibleEnterpriseSemester } from '../enterprise/enterprise-periods';

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
    const dueDate = requiredText(t.dueDate,'dueDate',16);
    dateInput(dueDate.slice(0,10),'dueDate');
    if (dueDate.length !== 10 && !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/.test(dueDate))
      throw invalid('Hạn nộp phải có ngày và giờ hợp lệ theo giờ Việt Nam.');
    return {name:requiredText(t.name,'name',200),description:optionalText(t.description,'description',10000),dueDate};
  });
  const hash=fingerprint({ids,tasks});
  return academicTransaction(async c=>{
    const old=(await c.query(`SELECT "UserID","Detail"::jsonb->'after' AS data FROM "AuditLogs" WHERE "EntityType"='InternshipTaskBatch' AND "Detail"::jsonb->'after'->>'key'=$1 LIMIT 1`,[key])).rows[0];
    if(old){if(old.UserID!==actor.userId||old.data.hash!==hash)throw invalid('Idempotency key conflict.',409);return {...old.data.result,replayed:true};}
    const companyId=await enterpriseScope(c,actor);
    if(companyId===null)throw invalid('Enterprise role required.',403);
    const assignments=await c.query(`SELECT a."AssignmentID",a."EnterpriseID",a."Status",
      EXISTS(SELECT 1 FROM "InternshipEvaluations" ev WHERE ev."AssignmentID"=a."AssignmentID" AND ev."Status"='SUBMITTED') AS "EvaluationFinalized"
      FROM "InternshipAssignments" a WHERE a."AssignmentID"=ANY($1::int[]) FOR UPDATE OF a`,[ids]);
    if(assignments.rows.length!==ids.length)throw invalid('Internship assignment not found.',404,'QHDN_RECORD_NOT_FOUND');
    for(const assignment of assignments.rows){
      if(assignment.EnterpriseID!==companyId)throw invalid('This internship belongs to another enterprise.',403,'FORBIDDEN');
      if(assignment.EvaluationFinalized)throw invalid('Sinh viên đã chốt điểm, không thể giao thêm nhiệm vụ.',409,'OJT_SCORE_FINALIZED');
      if(!['ASSIGNED','ACTIVE','IN_PROGRESS'].includes(String(assignment.Status).toUpperCase()))throw invalid('Tasks require an accepted, ongoing internship.',409);
    }
    const deadlines=tasks.map(task=>task.dueDate.length===10 ? task.dueDate+'T23:59:59.999999' : task.dueDate);
    const assignedAt=(await c.query(`SELECT to_char(clock_timestamp() AT TIME ZONE 'Asia/Ho_Chi_Minh','YYYY-MM-DD"T"HH24:MI:SS.US') AS instant`)).rows[0].instant;
    const invalidDeadline=await c.query(`SELECT a."AssignmentID" AS "assignmentId"
      FROM "InternshipAssignments" a CROSS JOIN unnest($2::timestamp[]) AS due_dates("dueDate")
      WHERE a."AssignmentID"=ANY($1::int[])
        AND (due_dates."dueDate" <= $3::timestamp
          OR NOT COALESCE(due_dates."dueDate"::date <= a."EndDate",false))
      LIMIT 1`,[ids,deadlines,assignedAt]);
    if(invalidDeadline.rowCount)throw invalid('Hạn nộp phải sau thời điểm giao và không vượt ngày kết thúc thực tập của các sinh viên đã chọn.');
    const {rows:[schema]}=await c.query(`SELECT count(*)=2 AS ready FROM pg_attribute
      WHERE attrelid='"InternshipTasks"'::regclass AND attname IN ('AssignedAt','DueAt') AND NOT attisdropped`);
    if(!schema.ready)throw invalid('Cần cập nhật cơ sở dữ liệu internship_task_times_v1 để giao nhiệm vụ theo giờ.',503,'TASK_TIME_MIGRATION_REQUIRED');
    const created=(await c.query(`INSERT INTO "InternshipTasks" ("AssignmentID","TaskName","Description","AssignedDate","DueDate","Status","AssignedAt","DueAt")
      SELECT selected."assignmentId",task."name",task."description",$5::timestamp::date,task."dueDate"::date,'TODO',$5::timestamp,task."dueDate"
      FROM unnest($1::int[]) AS selected("assignmentId")
      CROSS JOIN unnest($2::text[],$3::text[],$4::timestamp[]) AS task("name","description","dueDate")
      RETURNING "TaskID" AS id,"AssignmentID" AS "assignmentId",to_char("AssignedAt",'YYYY-MM-DD"T"HH24:MI:SS.US') AS "assignedAt"`,
      [ids,tasks.map(task=>task.name),tasks.map(task=>task.description),deadlines,assignedAt])).rows;
    const result={created:created.length,tasks:created};
    await audit(c,actor.userId,'InternshipTaskBatch',created[0].id,'ASSIGN_TASKS',null,{key,hash,result});
    return {...result,replayed:false};
  });
}

const hasTaskHistory = `(EXISTS (SELECT 1 FROM "TaskProgressUpdates" u WHERE u."TaskID"=t."TaskID")
  OR EXISTS (SELECT 1 FROM "OJTAlertEvaluations" e WHERE e."TaskID"=t."TaskID"))`;

export async function deleteUnusedTask(taskId:number, actor:Actor) {
  if(actor.roleCode!=='ENTERPRISE') throw invalid('Enterprise role required.',403);
  return academicTransaction(async c=>{
    const company=await enterpriseScope(c,actor);
    // Student submissions lock this same task before adding an update.
    const row=(await c.query(`SELECT t.* FROM "InternshipTasks" t JOIN "InternshipAssignments" a USING("AssignmentID")
      WHERE t."TaskID"=$1 AND a."EnterpriseID"=$2 FOR UPDATE OF t`,[taskId,company])).rows[0];
    if(!row) throw invalid('Không tìm thấy nhiệm vụ.',404);
    const activity=await c.query(`SELECT 1 FROM "InternshipTasks" t WHERE t."TaskID"=$1 AND ${hasTaskHistory}`,[taskId]);
    if(activity.rowCount) throw invalid('Nhiệm vụ đã có hoạt động, không thể xóa.',409);
    await c.query('DELETE FROM "InternshipTasks" WHERE "TaskID"=$1',[taskId]);
    await audit(c,actor.userId,'InternshipTasks',taskId,'DELETE_UNUSED_TASK',row,null);
    return {id:taskId};
  });
}

const enterpriseTaskStatus = `CASE
        WHEN EXISTS (SELECT 1 FROM "TaskProgressUpdates" u WHERE u."TaskID"=t."TaskID" AND u."UpdatedByStudentID"=a."StudentID"
          AND u."PercentComplete"=100 AND COALESCE(u."UpdateDate"<=(to_jsonb(t)->>'DueAt')::timestamp,u."UpdateDate"<(t."DueDate"+1)::timestamp,true)) THEN 'DONE'
        WHEN COALESCE((to_jsonb(t)->>'DueAt')::timestamp,(t."DueDate"+1)::timestamp-interval '1 microsecond') < (now() AT TIME ZONE 'Asia/Ho_Chi_Minh') THEN 'OVERDUE' ELSE 'TODO' END`;

export async function dashboardTasks(actor: Actor) {
  return readTransaction(async c => {
    const companyId = await enterpriseScope(c, actor);
    const {rows: [summary]} = await c.query(`WITH tasks AS (
      SELECT t."TaskID" AS id, t."TaskName" AS name, a."StudentID", t."DueDate" AS "dueDate",
        to_jsonb(t)->>'DueAt' AS "dueAt", upper(t."Status") AS status,
        ${enterpriseTaskStatus} AS "enterpriseStatus",
        t."DueDate" <= (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date + 7 AS upcoming
      FROM "InternshipTasks" t JOIN "InternshipAssignments" a USING ("AssignmentID")
      JOIN "StudentEnterpriseCoordination" co USING ("CoordinationID")
      WHERE a."EnterpriseID"=$1 AND ${visibleEnterpriseSemester('co."OJTSemesterID"')}
    ), attention AS (
      SELECT id,name,"dueAt","dueDate","enterpriseStatus",u."FullName" AS "fullName"
      FROM tasks JOIN "Students" s USING ("StudentID") JOIN "Users" u USING ("UserID")
      WHERE upcoming AND "enterpriseStatus"<>'DONE'
      ORDER BY coalesce("dueAt"::timestamp,"dueDate"::timestamp),id DESC LIMIT 3
    )
    SELECT count(*)::int AS total,
      count(*) FILTER (WHERE "enterpriseStatus"='DONE')::int AS completed,
      count(*) FILTER (WHERE status='IN_PROGRESS')::int AS "inProgress",
      count(*) FILTER (WHERE "enterpriseStatus"<>'DONE' AND status IS DISTINCT FROM 'IN_PROGRESS')::int AS todo,
      count(*) FILTER (WHERE "enterpriseStatus"='OVERDUE' AND "dueDate" IS NOT NULL)::int AS overdue,
      count(*) FILTER (WHERE upcoming AND "enterpriseStatus"='TODO')::int AS "dueSoon",
      (SELECT coalesce(jsonb_agg(to_jsonb(attention) ORDER BY coalesce("dueAt"::timestamp,"dueDate"::timestamp),id DESC),'[]') FROM attention) AS attention
    FROM tasks`, [companyId]);
    return summary;
  });
}

export async function listTasks(params:Record<string,unknown>, actor:Actor,existingClient?:PoolClient){
  const p=pagination(params,['assignmentId','companyId','studentId','positionId','ojtSemesterId']);
  if(p.offset>2147483647)throw invalid('Pagination exceeds allowed range.');
  const id=params.assignmentId===undefined?null:positiveId(params.assignmentId,'assignmentId');
  return readTransaction(async c=>{
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
      to_jsonb(t)->>'AssignedAt' AS "assignedAt",to_jsonb(t)->>'DueAt' AS "dueAt",
      ${actor.roleCode==='ENTERPRISE' ? `${enterpriseTaskStatus} AS "enterpriseStatus",
        NOT ${hasTaskHistory} AS "canDelete",` : ''}
      a."StudentID" AS "studentId",a."EnterpriseID" AS "companyId",a."PositionID" AS "positionId",co."OJTSemesterID" AS "ojtSemesterId",
      (${enterpriseSemesterStatusSql('period','term')}) AS "periodStatus",
      jsonb_build_object('id',a."AssignmentID",'status',a."Status",'startDate',a."StartDate",'endDate',a."EndDate") AS assignment
      FROM "InternshipTasks" t JOIN "InternshipAssignments" a ON a."AssignmentID"=t."AssignmentID" JOIN "Students" s ON s."StudentID"=a."StudentID"
      JOIN "StudentEnterpriseCoordination" co ON co."CoordinationID"=a."CoordinationID"
      JOIN "OJTSemesters" term ON term."OJTSemesterID"=co."OJTSemesterID"
      LEFT JOIN "AcademicPeriods" period ON period."AcademicPeriodID"=term."AcademicPeriodID"
      WHERE ($1::int IS NULL OR a."AssignmentID"=$1) AND ($2::int IS NULL OR a."EnterpriseID"=$2) AND ($3::int IS NULL OR a."StudentID"=$3) AND ($4::int IS NULL OR a."PositionID"=$4) AND ($7::int IS NULL OR co."OJTSemesterID"=$7)
      ${actor.roleCode==='ENTERPRISE' ? `AND ${visibleEnterpriseSemester('co."OJTSemesterID"')}` : ''}
      ), paged AS (SELECT * FROM filtered ORDER BY id DESC LIMIT $5 OFFSET $6)
      SELECT (SELECT count(*)::int FROM filtered) AS total,COALESCE(jsonb_agg(to_jsonb(paged) ORDER BY id DESC) FILTER (WHERE id IS NOT NULL),'[]'::jsonb) AS items FROM paged`,[id,company,studentId,positionId,p.limit,p.offset,semesterId]);
    return {...rows.rows[0],items:await enrichListRows(c,rows.rows[0].items),page:p.page,limit:p.limit};
  },existingClient);
}
