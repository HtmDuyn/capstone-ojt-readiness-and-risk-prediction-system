import type { PoolClient } from 'pg';
import { academicTransaction } from '../academic/academic.repository';
import { api, record, assertScope, persist, log } from '../qhdn/catalog.service';
import { invalid, inputObject, positiveId, requiredText, optionalText, enumValue, score } from '../students/student.validation';
import type { Actor, Row } from '../ojt-registration/window.service';
import { activeCriteria, validateCriteriaPayload } from '../academic/grading-criteria.service';

type EvaluationStatus = 'DRAFT' | 'SUBMITTED';
const scoreKeys = ['completionScore', 'skillScore', 'attitudeScore'] as const;

function valuesFor(body: unknown) {
  const b = inputObject(body, [...scoreKeys, 'overallScore', 'comments', 'scoreDetails', 'templateId']);
  if (b.templateId == null) throw invalid('Vui lòng tải bộ tiêu chí do Phòng Đào tạo ban hành trước khi chấm điểm.', 400, 'GRADING_TEMPLATE_REQUIRED');
  if (b.scoreDetails === undefined) throw invalid('Vui lòng nhập điểm theo các tiêu chí do Phòng Đào tạo ban hành.', 400, 'CRITERIA_SCORES_REQUIRED');
  // Legacy fields remain accepted for compatibility, but cannot set scores or the total.
  for (const key of [...scoreKeys, 'overallScore']) if (b[key] !== undefined) score(b[key], 10, key);
  return {
    TemplateID: positiveId(b.templateId, 'templateId'),
    ScoreDetails: validateCriteriaPayload(b.scoreDetails),
    Comments: optionalText(b.comments, 'comments', 5000),
  };
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
    const oldDetails = before.ScoreDetails as Record<string, number | null> | null;
    const details = values.ScoreDetails as Record<string, number | null>;
    const same = status === 'SUBMITTED' && before.TemplateID === values.TemplateID
      && (before.Comments ?? null) === values.Comments && oldDetails != null
      && Object.keys(details).length === Object.keys(oldDetails).length
      && Object.entries(details).every(([key, value]) => Object.hasOwn(oldDetails, key) && oldDetails[key] === value);
    if (same) return { ...api('evaluations', before), replayed: true };
    throw invalid('Điểm đã gửi QHDN không thể chỉnh sửa trực tiếp.', 409, 'OJT_SCORE_FINALIZED');
  }
  const grading = await activeCriteria(c, (await c.query(`SELECT "OJTSemesterID" FROM "StudentEnterpriseCoordination" WHERE "CoordinationID"=$1`, [assignment.CoordinationID])).rows[0].OJTSemesterID);
  if (!grading.id || !grading.criteria.length)
    throw invalid('Phòng Đào tạo chưa ban hành quy ước chấm điểm áp dụng cho kỳ OJT này.', 409, 'GRADING_CRITERIA_NOT_PUBLISHED');
  if (values.TemplateID !== grading.id)
    throw invalid('Bộ tiêu chí chấm điểm đã thay đổi. Vui lòng tải lại danh sách và nhập điểm theo quy ước mới.', 409, 'GRADING_TEMPLATE_CHANGED');
  const details = values.ScoreDetails as Record<string, number | null>;
  if (Object.keys(details).length !== grading.criteria.length || grading.criteria.some(item => !Object.hasOwn(details, item.key)))
    throw invalid('Các cột điểm phải khớp chính xác bộ tiêu chí do Phòng Đào tạo ban hành.', 400, 'CRITERIA_SCORES_REQUIRED');
  const complete = grading.criteria.every(item => details[item.key] !== null);
  if (status === 'SUBMITTED' && !complete)
    throw invalid('Vui lòng nhập đủ điểm cho tất cả tiêu chí trước khi gửi chính thức.', 400, 'CRITERIA_SCORES_REQUIRED');
  // Integer hundredths keep rounding identical to the UI, including half-cent totals.
  values.OverallScore = complete ? Math.round(grading.criteria.reduce((sum, item) =>
    sum + Math.round(details[item.key]! * 100) * Math.round(item.weight * 100), 0) / 10000) / 100 : null;
  values.ScoreDetails = Object.fromEntries(grading.criteria.map(item => [item.key, details[item.key]]));
  // Populate historical report columns only when the issued template explicitly uses those keys.
  for (const key of scoreKeys) values[key[0].toUpperCase() + key.slice(1)] = Object.hasOwn(details, key) ? details[key] : null;
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
    const { assignmentId, ...scores } = inputObject(item, ['assignmentId', ...scoreKeys, 'comments', 'scoreDetails', 'templateId']);
    const normalized=valuesFor(scores);
    return { id: positiveId(assignmentId, 'assignmentId'), values: normalized };
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
  const { reason, ...scores } = inputObject(body, [...scoreKeys, 'overallScore', 'comments', 'reason', 'scoreDetails', 'templateId']);
  const explanation = requiredText(reason, 'reason', 2000);
  const values = valuesFor(scores);
  return academicTransaction(c => save(c, id, values, 'SUBMITTED', explanation, actor));
}
