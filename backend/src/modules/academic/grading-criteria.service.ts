import type { PoolClient } from 'pg';
import { academicTransaction } from './academic.repository';
import { inputObject, invalid, positiveId, requiredText, score } from '../students/student.validation';

type Criterion = { key: string; label: string; weight: number };
type Row = Record<string, any>;
function validateCriteria(value: unknown): Criterion[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 20) throw invalid('Cần từ 1 đến 20 tiêu chí chấm điểm.');
  const items = value.map((raw, index) => {
    const item = inputObject(raw, ['key', 'label', 'weight']);
    const label = requiredText(item.label, `criteria[${index}].label`, 120);
    const weight = score(item.weight, 100, `criteria[${index}].weight`);
    if (weight === null || weight <= 0) throw invalid('Tỷ lệ mỗi tiêu chí phải lớn hơn 0 và không quá 100.');
    const key = item.key === undefined ? `criterion_${index + 1}` : requiredText(item.key, `criteria[${index}].key`, 40);
    return { key, label, weight };
  });
  if (new Set(items.map(item => item.key)).size !== items.length) throw invalid('Mã tiêu chí không được trùng nhau.');
  if (Math.round(items.reduce((sum, item) => sum + item.weight, 0) * 100) !== 10000) throw invalid('Tổng tỷ lệ các tiêu chí phải bằng đúng 100%.');
  return items;
}
export function validateCriteriaPayload(value: unknown): Record<string,number|null> {
  if(!value||typeof value!=='object'||Array.isArray(value))throw invalid('scoreDetails must be an object.');
  const details:Record<string,number|null>={};
  for(const [key,raw] of Object.entries(value as Row)){if(!/^[A-Za-z0-9_-]{1,40}$/.test(key))throw invalid('Invalid scoreDetails key.');details[key]=score(raw,10,`scoreDetails.${key}`);}
  return details;
}
const api = (r: Row) => ({ id:r.TemplateID, ojtSemesterId:r.OJTSemesterID, effectiveFrom:r.EffectiveFrom, name:r.Name, criteria:r.Criteria, version:r.Version, status:r.Status, createdBy:r.CreatedBy, createdAt:r.CreatedAt });
export async function getGradingCriteria(params: Row) {
  for(const key of Object.keys(params))if(!['ojtSemesterId','page','limit'].includes(key))throw invalid(`Unknown query parameter: ${key}.`);
  const semesterId = params.ojtSemesterId === undefined ? null : positiveId(params.ojtSemesterId, 'ojtSemesterId');
  return academicTransaction(async c => {
    if (semesterId && !(await c.query('SELECT 1 FROM "OJTSemesters" WHERE "OJTSemesterID"=$1', [semesterId])).rowCount) throw invalid('OJT semester not found.',404);
  const rows = (await c.query(`SELECT t.* FROM "AssessmentTemplates" t WHERE t."OJTSemesterID" IS NOT NULL AND ($1::int IS NULL OR t."OJTSemesterID"=$1) ORDER BY t."OJTSemesterID",t."EffectiveFrom" DESC,t."Version" DESC`, [semesterId])).rows;
    const semesters = (await c.query(`SELECT o."OJTSemesterID" AS id,o."SemesterCode" AS code,o."Name" AS name,o."StartDate" AS "startDate",o."EndDate" AS "endDate",o."Status" AS status FROM "OJTSemesters" o ORDER BY o."StartDate",o."OJTSemesterID"`)).rows;
    const current = (await c.query(`SELECT o."OJTSemesterID" FROM "OJTSemesters" o WHERE o."StartDate"<=CURRENT_DATE AND (o."EndDate" IS NULL OR o."EndDate">=CURRENT_DATE) ORDER BY o."StartDate" DESC LIMIT 1`)).rows[0]?.OJTSemesterID ?? null;
    return { items: rows.map(api), semesters, currentOjtSemesterId: current };
  });
}
export async function getEnterpriseGradingCriteria(params: Row, _actor: { userId:number }) {
  for(const key of Object.keys(params))if(key!=='assignmentId')throw invalid(`Unknown query parameter: ${key}.`);
  const assignmentId = positiveId(params.assignmentId, 'assignmentId');
  return academicTransaction(async c => {
    const assignment = (await c.query(`SELECT co."OJTSemesterID" FROM "InternshipAssignments" a JOIN "StudentEnterpriseCoordination" co USING("CoordinationID") WHERE a."AssignmentID"=$1`, [assignmentId])).rows[0];
    if (!assignment) throw invalid('Internship assignment not found.',404);
    return activeCriteria(c, assignment.OJTSemesterID);
  });
}
export async function activeCriteria(c: PoolClient, semesterId: number) {
  const row = (await c.query(`SELECT * FROM "AssessmentTemplates" WHERE "OJTSemesterID"=$1 AND "Status"='PUBLISHED' ORDER BY "EffectiveFrom" DESC,"Version" DESC LIMIT 1`, [semesterId])).rows[0];
  return row ? api(row) : { id:null, ojtSemesterId:semesterId, name:'Bộ tiêu chí mặc định', criteria:[
    {key:'completionScore',label:'Kỹ năng chuyên ngành',weight:33.34}, {key:'skillScore',label:'Kỹ năng mềm',weight:33.33}, {key:'attitudeScore',label:'Thái độ',weight:33.33},
  ] };
}
export async function saveGradingCriteria(body: unknown, actor: {userId:number;roleCode:string}) {
  if(!['ACADEMIC','ADMIN'].includes(actor.roleCode))throw invalid('Only Academic Affairs may manage grading criteria.',403,'FORBIDDEN');
  const b = inputObject(body,['ojtSemesterId','name','criteria','reason']);
  const semesterId = positiveId(b.ojtSemesterId,'ojtSemesterId'), name = requiredText(b.name,'name',150), reason = requiredText(b.reason,'reason',2000), criteria = validateCriteria(b.criteria);
  return academicTransaction(async c => {
    await c.query('SELECT pg_advisory_xact_lock(hashtext(\'ojt-grading-criteria\'))');
    const semester=(await c.query('SELECT * FROM "OJTSemesters" WHERE "OJTSemesterID"=$1 FOR UPDATE',[semesterId])).rows[0];
    if(!semester)throw invalid('OJT semester not found.',404);
    const today=(await c.query("SELECT (now() AT TIME ZONE 'Asia/Saigon')::date AS today")).rows[0].today;
    const start=semester.StartDate instanceof Date?semester.StartDate.toISOString().slice(0,10):String(semester.StartDate).slice(0,10);
    const todayText=today instanceof Date?today.toISOString().slice(0,10):String(today).slice(0,10);
    if(start<=todayText)throw invalid('Không thể áp dụng hoặc sửa tiêu chí cho kỳ OJT đang diễn ra hoặc đã bắt đầu.',409,'OJT_GRADING_SEMESTER_STARTED');
    const latest=(await c.query(`SELECT * FROM "AssessmentTemplates" WHERE "OJTSemesterID"=$1 ORDER BY "Version" DESC LIMIT 1`,[semesterId])).rows[0];
    const version=(latest?.Version ?? 0)+1;
    const row=(await c.query(`INSERT INTO "AssessmentTemplates" ("Code","Version","Name","Criteria","Status","CreatedBy","PublishedAt","OJTSemesterID","EffectiveFrom","Reason") VALUES ($1,$2,$3,$4,'PUBLISHED',$5,now(),$6,$7,$8) RETURNING *`,[`OJT-${semesterId}`,version,name,JSON.stringify(criteria),actor.userId,semesterId,semester.StartDate,reason])).rows[0];
    await c.query(`INSERT INTO "AuditLogs" ("UserID","Action","EntityType","EntityID","Detail") VALUES ($1,'SET_OJT_GRADING_CRITERIA','AssessmentTemplates',$2,$3)`,[actor.userId,row.TemplateID,reason]);
    return api(row);
  });
}
