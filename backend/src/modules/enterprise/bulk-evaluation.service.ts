import type { PoolClient } from 'pg';
import { academicTransaction } from '../academic/academic.repository';
import { api, record, assertScope, persist, log } from '../qhdn/catalog.service';
import { invalid, inputObject, positiveId, requiredText, optionalText, enumValue, score } from '../students/student.validation';
import type { Actor, Row } from '../ojt-registration/window.service';
import { activeCriteria, validateCriteriaPayload } from '../academic/grading-criteria.service';

type EvaluationStatus = 'DRAFT' | 'SUBMITTED';
const scoreKeys = ['completionScore', 'skillScore', 'attitudeScore'] as const;

function valuesFor(body: unknown, _status: EvaluationStatus) {
  // Keep the existing field names: completionScore = chuyên ngành, skillScore = kỹ năng mềm.
  const b = inputObject(body, ['completionScore', 'skillScore', 'attitudeScore', 'overallScore', 'comments','scoreDetails']);
  const values: Row = {};
  if(b.scoreDetails!==undefined) {
    if(!b.scoreDetails||typeof b.scoreDetails!=='object'||Array.isArray(b.scoreDetails))throw invalid('scoreDetails must be an object.');
    const details:Row={};
    for(const [key,value] of Object.entries(b.scoreDetails as Row))details[key]=score(value,10,`scoreDetails.${key}`);
    values.ScoreDetails=details;
  }
  const scores = scoreKeys.map(key => score(b[key], 10, key));
  scores.forEach((value,index)=>{values[scoreKeys[index][0].toUpperCase()+scoreKeys[index].slice(1)]=value;});
  values.OverallScore = scores.some(value => value === null) ? null : Math.round((scores.reduce<number>((sum,value)=>sum+value!,0)/3)*100)/100;
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
  const grading = await activeCriteria(c, (await c.query(`SELECT "OJTSemesterID" FROM "StudentEnterpriseCoordination" WHERE "CoordinationID"=$1`, [assignment.CoordinationID])).rows[0].OJTSemesterID);
  if (!values.ScoreDetails && !grading.id) values.ScoreDetails={completionScore:values.CompletionScore,skillScore:values.SkillScore,attitudeScore:values.AttitudeScore};
  if (values.ScoreDetails && grading.id) {
    const details = values.ScoreDetails as Record<string, number|null>;
    if(before?.TemplateID===grading.id&&before.ScoreDetails) {
      const oldDetails=before.ScoreDetails as Record<string,number|null>;
      if(status==='SUBMITTED'&&Object.entries(details).every(([key,value])=>value==null&&oldDetails[key]!=null))values.ScoreDetails=oldDetails;
    }
    const finalDetails=values.ScoreDetails as Record<string,number|null>;
    if (Object.keys(finalDetails).length !== grading.criteria.length || (status==='SUBMITTED'&&grading.criteria.some((item: {key:string}) => finalDetails[item.key] == null))) throw invalid('Vui lòng nhập điểm cho tất cả tiêu chí chấm.',400,'CRITERIA_SCORES_REQUIRED');
    if(status==='DRAFT'&&grading.criteria.some((item: {key:string})=>finalDetails[item.key]===undefined))throw invalid('Điểm nháp không khớp bộ tiêu chí của kỳ OJT.',400,'CRITERIA_SCORES_REQUIRED');
    const weighted = grading.criteria.reduce((sum: number, item: {key:string;weight:number}) => sum + (finalDetails[item.key]==null?0:Number(finalDetails[item.key])) * item.weight / 100, 0);
    values.OverallScore = grading.id ? Math.round(weighted * 100) / 100 : (values.OverallScore);
    values.TemplateID = grading.id;
  }
  if (before?.Status === 'SUBMITTED') {
    // An identical retry after a lost response is safe; changed official scores are rejected.
    const same = status === 'SUBMITTED' && Object.entries(values).every(([key, value]) =>
      key.endsWith('Score') ? before[key] != null && Number(before[key]) === value : JSON.stringify(before[key] ?? null) === JSON.stringify(value ?? null));
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
    const { assignmentId, ...scores } = inputObject(item, ['assignmentId', ...scoreKeys, 'comments','scoreDetails']);
    const normalized=valuesFor(scores, status);
    if(scores.scoreDetails!==undefined) normalized.ScoreDetails=validateCriteriaPayload(scores.scoreDetails);
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
  const { reason, ...scores } = inputObject(body, [...scoreKeys, 'overallScore', 'comments', 'reason','scoreDetails']);
  const explanation = requiredText(reason, 'reason', 2000);
  const values = valuesFor(scores, 'SUBMITTED');
  return academicTransaction(c => save(c, id, values, 'SUBMITTED', explanation, actor));
}
