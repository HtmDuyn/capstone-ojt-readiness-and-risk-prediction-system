import type { PoolClient } from 'pg';
import { academicTransaction, audit } from '../academic/academic.repository';
import { readTransaction } from '../qhdn/read.repository';
import { enterpriseScope } from '../qhdn/qhdn.repository';
import { listTasks } from '../qhdn/task.service';
import { inputObject, invalid, pagination, requiredText } from '../students/student.validation';
import { ownStudent, type Actor, type Row } from './shared';

const ongoing = ['ASSIGNED', 'ACTIVE', 'IN_PROGRESS'];
const submissionSelect = `SELECT u."UpdateID" AS id,u."TaskID" AS "taskId",u."UpdatedByStudentID" AS "studentId",
  u."ProgressDescription" AS content,(u."UpdateDate" AT TIME ZONE 'UTC') AS "submittedAt",
  COALESCE((u."UpdateDate" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')::date>t."DueDate",false) AS "isLate"
  FROM "TaskProgressUpdates" u JOIN "InternshipTasks" t ON t."TaskID"=u."TaskID"`;

async function scopedTask(c: PoolClient, id: number, actor: Actor, lock = false) {
  let owner: number;
  let column: string;
  if (actor.roleCode === 'STUDENT') {
    owner = (await ownStudent(c, actor)).StudentID;
    column = 'StudentID';
  } else if (actor.roleCode === 'ENTERPRISE') {
    owner = (await enterpriseScope(c, actor))!;
    column = 'EnterpriseID';
  } else throw invalid('Không có quyền truy cập bài nộp.', 403, 'FORBIDDEN');
  const task = (await c.query(`SELECT t.*,a."StudentID",a."EnterpriseID",a."Status" AS "InternshipStatus"
    FROM "InternshipTasks" t JOIN "InternshipAssignments" a ON a."AssignmentID"=t."AssignmentID"
    WHERE t."TaskID"=$1 AND a."${column}"=$2 ${lock ? 'FOR UPDATE OF a,t' : ''}`, [id, owner])).rows[0];
  if (!task) throw invalid('Không tìm thấy nhiệm vụ được phép truy cập.', 404, 'TASK_NOT_FOUND');
  return task;
}

export async function ownTasks(params: Row, actor: Actor) {
  pagination(params, ['ojtSemesterId']);
  return readTransaction(async c => {
    const student = await ownStudent(c, actor);
    return listTasks({ ...params, studentId: student.StudentID }, actor, c);
  });
}

export async function submitTask(id: number, body: unknown, actor: Actor, existingClient?: PoolClient) {
  if (actor.roleCode !== 'STUDENT') throw invalid('Chỉ sinh viên được nộp nhiệm vụ.', 403, 'FORBIDDEN');
  const b = inputObject(body, ['content']);
  const content = requiredText(b.content, 'content', 10000);
  return academicTransaction(async c => {
    const task = await scopedTask(c, id, actor, true);
    if (!ongoing.includes(String(task.InternshipStatus).toUpperCase()))
      throw invalid('Đợt thực tập đã kết thúc hoặc đã hủy, không thể nộp nhiệm vụ.', 409, 'INTERNSHIP_NOT_ONGOING');
    if (['DONE', 'COMPLETED'].includes(String(task.Status).toUpperCase()))
      throw invalid('Doanh nghiệp đã xác nhận hoàn thành nhiệm vụ. Liên hệ doanh nghiệp nếu cần nộp lại.', 409, 'TASK_COMPLETED');
    const previous = (await c.query(submissionSelect + ` WHERE u."TaskID"=$1 AND u."UpdatedByStudentID"=$2
      AND u."PercentComplete"=100 ORDER BY u."UpdateID" DESC LIMIT 1`, [id, task.StudentID])).rows[0];
    if (previous?.content === content) return { ...previous, replayed: true };
    const update = (await c.query(`INSERT INTO "TaskProgressUpdates" ("TaskID","UpdatedByStudentID","ProgressDescription","PercentComplete","UpdateDate")
      VALUES ($1,$2,$3,100,now() AT TIME ZONE 'UTC') RETURNING "UpdateID"`, [id, task.StudentID, content])).rows[0];
    const submission = (await c.query(submissionSelect + ' WHERE u."UpdateID"=$1', [update.UpdateID])).rows[0];
    await audit(c, actor.userId, 'TaskProgressUpdates', submission.id, 'SUBMIT_TASK', null, submission);
    return { ...submission, replayed: false };
  }, existingClient);
}

export async function taskSubmissions(id: number, params: Row, actor: Actor, existingClient?: PoolClient) {
  const p = pagination(params, []);
  if (p.offset > 2147483647) throw invalid('Pagination exceeds allowed range.');
  return readTransaction(async c => {
    const task = await scopedTask(c, id, actor);
    const args = [id, task.StudentID];
    const filter = ' WHERE u."TaskID"=$1 AND u."UpdatedByStudentID"=$2 AND u."PercentComplete"=100';
    const total = (await c.query('SELECT count(*)::int AS n FROM "TaskProgressUpdates" u' + filter, args)).rows[0].n;
    const items = (await c.query(submissionSelect + filter + ' ORDER BY u."UpdateID" DESC LIMIT $3 OFFSET $4', [...args, p.limit, p.offset])).rows;
    return { taskId: id, items, total, page: p.page, limit: p.limit };
  }, existingClient);
}

export async function updateTaskStatus(id: number, body: unknown, actor: Actor) {
  if (actor.roleCode !== 'ENTERPRISE') throw invalid('Chỉ doanh nghiệp được xác nhận trạng thái nhiệm vụ.', 403, 'FORBIDDEN');
  const b = inputObject(body, ['status']);
  if (typeof b.status !== 'string' || !['TODO', 'IN_PROGRESS', 'DONE'].includes(b.status)) throw invalid('status must be TODO, IN_PROGRESS or DONE.');
  return academicTransaction(async c => {
    const task = await scopedTask(c, id, actor, true);
    if (!ongoing.includes(String(task.InternshipStatus).toUpperCase())) throw invalid('Đợt thực tập đã kết thúc hoặc đã hủy.', 409, 'INTERNSHIP_NOT_ONGOING');
    await c.query('UPDATE "InternshipTasks" SET "Status"=$2 WHERE "TaskID"=$1', [id, b.status]);
    await audit(c, actor.userId, 'InternshipTasks', id, 'TASK_STATUS', { status: task.Status }, { status: b.status });
    return { id, status: b.status };
  });
}
