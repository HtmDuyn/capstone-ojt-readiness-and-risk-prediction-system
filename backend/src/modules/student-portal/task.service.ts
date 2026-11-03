import type { PoolClient } from 'pg';
import { pool } from '../../config/database';
import { audit } from '../academic/academic.repository';
import { readTransaction } from '../qhdn/read.repository';
import { inputObject, invalid, pagination, positiveId, requiredText } from '../students/student.validation';
import { ownStudent, type Actor, type Row } from './shared';

// Student submission, completion and audit are committed atomically; no enterprise approval step.
const localDay = `(clock_timestamp() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date`;
const canSubmitSql = `COALESCE(UPPER(t."Status") IN ('TODO','PENDING','IN_PROGRESS')
  AND UPPER(a."Status") IN ('ASSIGNED','ACTIVE','IN_PROGRESS')
  AND (a."StartDate" IS NULL OR a."StartDate"<=${localDay})
  AND (a."EndDate" IS NULL OR a."EndDate">=${localDay}),false)`;
const submissionSelect = `SELECT u."UpdateID" AS id,u."TaskID" AS "taskId",u."UpdatedByStudentID" AS "studentId",
  COALESCE(u."ProgressDescription",'') AS content,
  u."PercentComplete" AS "percentComplete",
  u."UpdateDate" AT TIME ZONE 'Asia/Ho_Chi_Minh' AS "submittedAt",
  COALESCE(u."UpdateDate">=(submitted_task."DueDate"+1)::timestamp,false) AS "isLate"
  FROM "TaskProgressUpdates" u JOIN "InternshipTasks" submitted_task ON submitted_task."TaskID"=u."TaskID"`;

async function taskRecord(client: PoolClient, taskId: number, studentId: number, lock = false) {
  const task = (await client.query(`SELECT t."TaskID" AS id,t."AssignmentID" AS "assignmentId",
    ${canSubmitSql} AS "canSubmit"
    FROM "InternshipTasks" t JOIN "InternshipAssignments" a ON a."AssignmentID"=t."AssignmentID"
    WHERE t."TaskID"=$1 AND a."StudentID"=$2
    ${lock ? 'FOR UPDATE OF t FOR SHARE OF a' : ''}`, [taskId, studentId])).rows[0];
  if (!task) throw invalid('Task not found.', 404, 'TASK_NOT_FOUND');
  return task;
}

export async function enrichStudentTasks(client: PoolClient, items: Row[], studentId: number) {
  if (!items.length) return items;
  const rows = (await client.query(`SELECT t."TaskID" AS id,${canSubmitSql} AS "canSubmit",
    CASE WHEN UPPER(t."Status") IN ('DONE','COMPLETED') THEN 100 ELSE COALESCE(
      (SELECT u."PercentComplete" FROM "TaskProgressUpdates" u
       WHERE u."TaskID"=t."TaskID" AND u."UpdatedByStudentID"=$2 ORDER BY u."UpdateID" DESC LIMIT 1),0) END AS "percentComplete",
    (SELECT count(*)::int FROM "TaskProgressUpdates" u WHERE u."TaskID"=t."TaskID" AND u."UpdatedByStudentID"=$2) AS "submissionCount",
    (SELECT to_jsonb(latest) FROM (${submissionSelect}
      WHERE u."TaskID"=t."TaskID" AND u."UpdatedByStudentID"=$2 ORDER BY u."UpdateID" DESC LIMIT 1) latest) AS "latestSubmission"
    FROM "InternshipTasks" t JOIN "InternshipAssignments" a ON a."AssignmentID"=t."AssignmentID"
    WHERE t."TaskID"=ANY($1::int[]) AND a."StudentID"=$2`, [items.map(item => item.id), studentId])).rows;
  const metadata = new Map(rows.map(row => [row.id, row]));
  return items.map(item => {
    const values = metadata.get(item.id);
    if (!values) throw invalid('Student task ownership changed. Reload the list.', 409, 'TASK_SCOPE_CHANGED');
    return { ...item, ...values };
  });
}

export async function studentTaskProgress(client: PoolClient, assignmentId: number | null, studentId: number) {
  return (await client.query(`SELECT
    count(*) FILTER (WHERE COALESCE(UPPER(t."Status"),'') NOT IN ('CANCELLED','CANCELED'))::int AS "totalTasks",
    count(*) FILTER (WHERE UPPER(t."Status") IN ('DONE','COMPLETED'))::int AS "completedTasks",
    count(*) FILTER (WHERE UPPER(t."Status") IN ('CANCELLED','CANCELED'))::int AS "cancelledTasks",
    COALESCE(round(100.0 * count(*) FILTER (WHERE UPPER(t."Status") IN ('DONE','COMPLETED')) /
      NULLIF(count(*) FILTER (WHERE COALESCE(UPPER(t."Status"),'') NOT IN ('CANCELLED','CANCELED')),0),2),0)::float8 AS "percentComplete"
    FROM "InternshipTasks" t JOIN "InternshipAssignments" a ON a."AssignmentID"=t."AssignmentID"
    WHERE a."AssignmentID"=$1 AND a."StudentID"=$2`, [assignmentId, studentId])).rows[0];
}

export async function taskSubmissions(taskId: number, params: Row, actor: Actor) {
  const p = pagination(params, []);
  if (p.offset > 2147483647) throw invalid('Pagination exceeds allowed range.');
  return readTransaction(async client => {
    const student = await ownStudent(client, actor);
    await taskRecord(client, taskId, student.StudentID);
    const args = [taskId, student.StudentID];
    const total = (await client.query(`SELECT count(*)::int AS total FROM "TaskProgressUpdates"
      WHERE "TaskID"=$1 AND "UpdatedByStudentID"=$2`, args)).rows[0].total;
    const items = (await client.query(`${submissionSelect}
      WHERE u."TaskID"=$1 AND u."UpdatedByStudentID"=$2
      ORDER BY u."UpdateID" DESC LIMIT $3 OFFSET $4`, [...args, p.limit, p.offset])).rows;
    return { items, total, page: p.page, limit: p.limit };
  });
}

export async function submitTask(taskId: number, body: unknown, actor: Actor) {
  if (actor.roleCode !== 'STUDENT') throw invalid('Student access required.', 403, 'FORBIDDEN');
  const input = inputObject(body, ['content']);
  const content = requiredText(input.content, 'content', 10000);
  if (!pool) throw invalid('Database is not configured.', 503, 'DATABASE_UNAVAILABLE');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Lock the account/profile before the task: a concurrent deactivation cannot race the write.
    const student = (await client.query(`SELECT s."StudentID" FROM "Students" s JOIN "Users" u ON u."UserID"=s."UserID"
      WHERE s."UserID"=$1 AND s."DeletedAt" IS NULL AND s."Status"='ACTIVE' AND u."Status"='ACTIVE'
      FOR SHARE OF s,u`, [actor.userId])).rows[0];
    if (!student) throw invalid('Active student profile required.', 403, 'STUDENT_INACTIVE');
    const task = await taskRecord(client, positiveId(taskId, 'taskId'), student.StudentID, true);
    const previous = (await client.query(`${submissionSelect}
      WHERE u."TaskID"=$1 AND u."UpdatedByStudentID"=$2 ORDER BY u."UpdateID" DESC LIMIT 1`, [taskId, student.StudentID])).rows[0];
    // Retry the latest identical content without creating a duplicate, even if the task closed meanwhile.
    if (previous?.content === content && (!task.canSubmit || previous.percentComplete === 100)) {
      await client.query('COMMIT');
      return { ...previous, replayed: true };
    }
    if (!task.canSubmit) throw invalid('This task no longer accepts submissions.', 409, 'TASK_SUBMISSION_CLOSED');
    const inserted = (await client.query(`INSERT INTO "TaskProgressUpdates"
      ("TaskID","UpdatedByStudentID","UpdateDate","ProgressDescription","PercentComplete")
      VALUES ($1,$2,clock_timestamp() AT TIME ZONE 'Asia/Ho_Chi_Minh',$3,100) RETURNING "UpdateID"`, [taskId, student.StudentID, content])).rows[0];
    await client.query('UPDATE "InternshipTasks" SET "Status"=\'DONE\' WHERE "TaskID"=$1', [taskId]);
    const result = (await client.query(`${submissionSelect} WHERE u."UpdateID"=$1`, [inserted.UpdateID])).rows[0];
    await audit(client, actor.userId, 'TaskProgressUpdates', result.id, 'SUBMIT_TASK', null,
      { taskId, studentId: student.StudentID, isLate: result.isLate, taskStatus: 'DONE', percentComplete: 100 });
    await client.query('COMMIT');
    return { ...result, replayed: false };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}
