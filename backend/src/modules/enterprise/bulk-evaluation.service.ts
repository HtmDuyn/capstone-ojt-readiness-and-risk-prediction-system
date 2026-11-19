import type { PoolClient } from 'pg';
import { academicTransaction } from '../academic/academic.repository';
import { api, record, assertScope, persist, log } from '../qhdn/catalog.service';
import { invalid, inputObject, positiveId, requiredText, optionalText, enumValue, score } from '../students/student.validation';
import type { Actor, Row } from '../ojt-registration/window.service';

type EvaluationStatus = 'DRAFT' | 'SUBMITTED';
const scoreKeys = ['completionScore', 'skillScore', 'attitudeScore'] as const;

function valuesFor(body: unknown, status: EvaluationStatus) {
  // Keep the existing field names: completionScore = chuyên ngành, skillScore = kỹ năng mềm.
  const b = inputObject(body, ['completionScore', 'skillScore', 'attitudeScore', 'overallScore', 'comments']);
  const values: Row = {};
  const scores = scoreKeys.map(key => {
    const value = score(b[key], 10, key);
    if (value === null && status === 'SUBMITTED') throw invalid('Vui lòng nhập đủ 3 tiêu chí trước khi gửi điểm.');
    values[key[0].toUpperCase() + key.slice(1)] = value;
    return value;
  });
  values.OverallScore = scores.some(value => value === null) ? null
    : Math.round((scores.reduce<number>((sum, value) => sum + value!, 0) / 3) * 100) / 100;
  values.Comments = optionalText(b.comments, 'comments', 5000);
  return values;
}

async function save(c: PoolClient, id: number, values: Row, status: EvaluationStatus, reason: string, actor: Actor) {
  const assignment = await record(c, 'assignments', id);
  await assertScope(c, actor, assignment.EnterpriseID);
  if (!['ASSIGNED','ACTIVE', 'IN_PROGRESS', 'COMPLETED'].includes(String(assignment.Status).toUpperCase()))
    throw invalid('Chỉ có thể chấm điểm sinh viên đang thực tập hoặc đã hoàn thành.', 409, 'ASSIGNMENT_NOT_ACTIVE');
  if ((await c.query('SELECT 1 FROM "OJTResults" WHERE "AssignmentID"=$1', [id])).rowCount)
    throw invalid('Điểm đã chuyển giao không thể chỉnh sửa.', 409, 'OJT_RESULT_CONFIRMED');
  const before = (await c.query('SELECT * FROM "InternshipEvaluations" WHERE "AssignmentID"=$1 FOR UPDATE', [id])).rows[0] ?? null;
  if (before?.Status === 'SUBMITTED') {
    // An identical retry after a lost response is safe; changed official scores are rejected.
    const same = status === 'SUBMITTED' && Object.entries(values).every(([key, value]) =>
      key.endsWith('Score') ? before[key] != null && Number(before[key]) === value : (before[key] ?? null) === value);
    if (same) return { ...api('evaluations', before), replayed: true };
    throw invalid('Điểm đã gửi QHDN không thể chỉnh sửa trực tiếp.', 409, 'OJT_SCORE_FINALIZED');
  }
  const after = await persist(c, 'evaluations', {
    ...values, AssignmentID: id, EvaluatedBy: actor.userId,
    EvaluatedAt: status === 'SUBMITTED' ? new Date() : null, Status: status,
  }, before?.EvaluationID);
  await log(c, 'evaluations', before, after, actor,
    status === 'DRAFT' ? 'SAVE_EVALUATION_DRAFT' : 'SUBMIT_EVALUATION', reason);
  return api('evaluations', after);
}

export async function bulkEvaluate(body: unknown, actor: Actor) {
  if (actor.roleCode !== 'ENTERPRISE') throw invalid('Chỉ doanh nghiệp được chấm điểm.', 403, 'FORBIDDEN');
  const b = inputObject(body, ['items', 'status', 'confirmed', 'reason']);
  const status = enumValue(b.status, ['DRAFT', 'SUBMITTED'], 'status') as EvaluationStatus;
  const reason = requiredText(b.reason, 'reason', 2000);
  if (status === 'SUBMITTED' && b.confirmed !== true)
    throw invalid('Vui lòng xác nhận gửi điểm chính thức.', 400, 'EVALUATION_CONFIRMATION_REQUIRED');
  if (!Array.isArray(b.items) || b.items.length < 1 || b.items.length > 300)
    throw invalid('Mỗi lần lưu cần chọn từ 1 đến 300 sinh viên.');
  const items = b.items.map(item => {
    const { assignmentId, ...scores } = inputObject(item, ['assignmentId', ...scoreKeys, 'comments']);
    return { id: positiveId(assignmentId, 'assignmentId'), values: valuesFor(scores, status) };
  });
  if (new Set(items.map(item => item.id)).size !== items.length) throw invalid('Danh sách sinh viên bị trùng.');
  // All selected rows commit together. Ownership, finalization or validation failure rolls back the batch.
  return academicTransaction(async c => {
    const saved = [];
    for (const item of items.sort((a, b) => a.id - b.id))
      saved.push(await save(c, item.id, item.values, status, reason, actor));
    return { items: saved, saved: saved.length, status };
  });
}

export async function submitEvaluation(id: number, body: unknown, actor: Actor) {
  if (actor.roleCode !== 'ENTERPRISE') throw invalid('Only the enterprise may submit official OJT scores.', 403, 'FORBIDDEN');
  const { reason, ...scores } = inputObject(body, [...scoreKeys, 'overallScore', 'comments', 'reason']);
  const explanation = requiredText(reason, 'reason', 2000);
  const values = valuesFor(scores, 'SUBMITTED');
  return academicTransaction(c => save(c, id, values, 'SUBMITTED', explanation, actor));
}
