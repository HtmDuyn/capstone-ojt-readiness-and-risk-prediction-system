import { academicTransaction, audit } from '../academic/academic.repository';
import { enterpriseScope, assertScope, record } from './catalog.service';
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
    for (const id of ids) {
      const a=await record(c,'assignments',id);await assertScope(c,actor,a.EnterpriseID);
      if(!['ASSIGNED','ACTIVE','IN_PROGRESS'].includes(String(a.Status).toUpperCase()))throw invalid('Tasks require an accepted, ongoing internship.',409);
      for(const t of tasks){
        const valid=(await c.query(`SELECT $1::date >= (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AND $1::date BETWEEN "StartDate" AND "EndDate" AS valid FROM "InternshipAssignments" WHERE "AssignmentID"=$2`,[t.dueDate,id])).rows[0];
        if(!valid?.valid)throw invalid('Task due date must be within the internship and not in the past.');
      }
    }
    const created=[];
    for(const id of ids)for(const t of tasks)created.push((await c.query(`INSERT INTO "InternshipTasks" ("AssignmentID","TaskName","Description","AssignedDate","DueDate","Status") VALUES ($1,$2,$3,(now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date,$4,'TODO') RETURNING "TaskID" AS id,"AssignmentID" AS "assignmentId"`,[id,t.name,t.description,t.dueDate])).rows[0]);
    const result={created:created.length,tasks:created};
    await audit(c,actor.userId,'InternshipTaskBatch',created[0].id,'ASSIGN_TASKS',null,{key,hash,result});
    return {...result,replayed:false};
  });
}

export async function listTasks(params:Record<string,unknown>, actor:Actor){
  const p=pagination(params,['assignmentId']);
  if(p.offset>2147483647)throw invalid('Pagination exceeds allowed range.');
  const id=params.assignmentId===undefined?null:positiveId(params.assignmentId,'assignmentId');
  return academicTransaction(async c=>{
    const company=actor.roleCode==='STUDENT'?null:await enterpriseScope(c,actor);
    const rows=await c.query(`WITH filtered AS (SELECT t."TaskID" AS id,t."AssignmentID" AS "assignmentId",t."TaskName" AS name,t."Description" AS description,t."DueDate" AS "dueDate",t."Status" AS status
      FROM "InternshipTasks" t JOIN "InternshipAssignments" a ON a."AssignmentID"=t."AssignmentID" JOIN "Students" s ON s."StudentID"=a."StudentID"
      WHERE ($1::int IS NULL OR a."AssignmentID"=$1) AND ($2::int IS NULL OR a."EnterpriseID"=$2) AND ($3::text<>'STUDENT' OR s."UserID"=$4)
      ), paged AS (SELECT * FROM filtered ORDER BY id DESC LIMIT $5 OFFSET $6)
      SELECT (SELECT count(*)::int FROM filtered) AS total,COALESCE(jsonb_agg(to_jsonb(paged) ORDER BY id DESC) FILTER (WHERE id IS NOT NULL),'[]'::jsonb) AS items FROM paged`,[id,company,actor.roleCode,actor.userId,p.limit,p.offset]);
    return {...rows.rows[0],page:p.page,limit:p.limit};
  });
}
