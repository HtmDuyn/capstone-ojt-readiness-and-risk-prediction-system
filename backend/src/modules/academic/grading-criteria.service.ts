import type { PoolClient } from 'pg';
import { academicTransaction } from './academic.repository';
import { inputObject, invalid, positiveId, requiredText, score } from '../students/student.validation';
import { assertScope } from '../qhdn/catalog.service';

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
    if (!/^[A-Za-z0-9_-]{1,40}$/.test(key)) throw invalid('Mã tiêu chí chỉ được chứa chữ, số, dấu gạch ngang và gạch dưới.');
    return { key, label, weight };
  });
  if (new Set(items.map(item => item.key)).size !== items.length) throw invalid('Mã tiêu chí không được trùng nhau.');
  if (Math.round(items.reduce((sum, item) => sum + item.weight, 0) * 100) !== 10000) throw invalid('Tổng tỷ lệ các tiêu chí phải bằng đúng 100%.');
  return items;
}
export function validateCriteriaPayload(value: unknown): Record<string,number|null> {
  if(!value||typeof value!=='object'||Array.isArray(value))throw invalid('scoreDetails must be an object.');
  return Object.fromEntries(Object.entries(value as Row).map(([key,raw])=>{
    if(!/^[A-Za-z0-9_-]{1,40}$/.test(key))throw invalid('Invalid scoreDetails key.');
    return [key,score(raw,10,`scoreDetails.${key}`)];
  }));
}
const api = (r: Row) => ({ id:r.TemplateID as number, ojtSemesterId:r.OJTSemesterID as number|null, effectiveFrom:r.EffectiveFrom, effectiveAt:r.PublishedAt??null, name:r.Name as string, criteria:r.Criteria as Criterion[], version:r.Version as number, status:r.Status, createdBy:r.CreatedBy, createdAt:r.CreatedAt });
export async function getGradingCriteria(params: Row) {
  for(const key of Object.keys(params))if(!['ojtSemesterId','page','limit'].includes(key))throw invalid(`Unknown query parameter: ${key}.`);
  const semesterId = params.ojtSemesterId === undefined ? null : positiveId(params.ojtSemesterId, 'ojtSemesterId');
  return academicTransaction(async c => {
    if (semesterId && !(await c.query('SELECT 1 FROM "OJTSemesters" WHERE "OJTSemesterID"=$1', [semesterId])).rowCount) throw invalid('OJT semester not found.',404);
  const rows = (await c.query(`SELECT t.* FROM "AssessmentTemplates" t WHERE ($1::int IS NULL OR t."OJTSemesterID" IS NULL OR t."OJTSemesterID"=$1) ORDER BY t."PublishedAt" DESC NULLS LAST,t."TemplateID" DESC`, [semesterId])).rows;
    const semesters = (await c.query(`SELECT o."OJTSemesterID" AS id,o."SemesterCode" AS code,o."Name" AS name,o."StartDate" AS "startDate",o."EndDate" AS "endDate",o."Status" AS status FROM "OJTSemesters" o ORDER BY o."StartDate",o."OJTSemesterID"`)).rows;
    const current = (await c.query(`SELECT o."OJTSemesterID" FROM "OJTSemesters" o WHERE o."StartDate"<=(statement_timestamp() AT TIME ZONE 'Asia/Saigon')::date AND (o."EndDate" IS NULL OR o."EndDate">=(statement_timestamp() AT TIME ZONE 'Asia/Saigon')::date) ORDER BY o."StartDate" DESC LIMIT 1`)).rows[0]?.OJTSemesterID ?? null;
    return { items: rows.map(api), semesters, currentOjtSemesterId: current };
  });
}
export async function getEnterpriseGradingCriteria(params: Row, actor: { userId:number; roleCode:string }) {
  for(const key of Object.keys(params))if(key!=='assignmentId')throw invalid(`Unknown query parameter: ${key}.`);
  const assignmentId = positiveId(params.assignmentId, 'assignmentId');
  return academicTransaction(async c => {
    const assignment = (await c.query(`SELECT co."OJTSemesterID",a."EnterpriseID" FROM "InternshipAssignments" a JOIN "StudentEnterpriseCoordination" co USING("CoordinationID") WHERE a."AssignmentID"=$1`, [assignmentId])).rows[0];
    if (!assignment) throw invalid('Internship assignment not found.',404);
    await assertScope(c, actor, assignment.EnterpriseID);
    return activeCriteria(c, assignment.OJTSemesterID);
  });
}
// The same effective-date selection is used by the roster and every score write.
// semesterSql is a trusted SQL expression supplied only by server code.
export function gradingCriteriaSelection(semesterSql: string) {
  return `SELECT chosen.* FROM (
    SELECT global_template.*,1 AS "GlobalPriority",global_template."PublishedAt" AS "SelectionTime"
      FROM "AssessmentTemplates" global_template
      WHERE global_template."OJTSemesterID" IS NULL AND global_template."Status"='PUBLISHED'
        AND global_template."PublishedAt"<=statement_timestamp()
    UNION ALL
    SELECT legacy.*,0 AS "GlobalPriority",COALESCE(legacy."EffectiveFrom",source."StartDate")::timestamptz AS "SelectionTime"
      FROM "AssessmentTemplates" legacy
      JOIN "OJTSemesters" source ON source."OJTSemesterID"=legacy."OJTSemesterID"
      JOIN "OJTSemesters" target ON target."OJTSemesterID"=${semesterSql}
      WHERE legacy."OJTSemesterID" IS NOT NULL AND legacy."Status"='PUBLISHED'
        AND COALESCE(legacy."EffectiveFrom",source."StartDate")<=CASE
          WHEN target."StartDate"<=(statement_timestamp() AT TIME ZONE 'Asia/Saigon')::date
            AND (target."EndDate" IS NULL OR target."EndDate">=(statement_timestamp() AT TIME ZONE 'Asia/Saigon')::date)
          THEN (statement_timestamp() AT TIME ZONE 'Asia/Saigon')::date
          ELSE target."StartDate"
        END
        AND NOT EXISTS (SELECT 1 FROM "AssessmentTemplates" active_global
          WHERE active_global."OJTSemesterID" IS NULL AND active_global."Status"='PUBLISHED'
            AND active_global."PublishedAt"<=statement_timestamp())
  ) chosen
  ORDER BY chosen."GlobalPriority" DESC,chosen."SelectionTime" DESC,chosen."Version" DESC,chosen."TemplateID" DESC
  LIMIT 1`;
}
export async function activeCriteria(c: PoolClient, semesterId: number) {
  const row = (await c.query(gradingCriteriaSelection('$1'), [semesterId])).rows[0];
  return row ? api(row) : { id:null, ojtSemesterId:semesterId, name:'Chưa có quy ước chấm điểm do Phòng Đào tạo ban hành', criteria:[] as Criterion[] };
}
export async function saveGradingCriteria(body: unknown, actor: {userId:number;roleCode:string}) {
  if(!['ACADEMIC','ADMIN'].includes(actor.roleCode))throw invalid('Only Academic Affairs may manage grading criteria.',403,'FORBIDDEN');
  const b = inputObject(body,['name','criteria','reason']);
  const name = requiredText(b.name,'name',150), reason = requiredText(b.reason,'reason',2000), criteria = validateCriteria(b.criteria);
  return academicTransaction(async c => {
    await c.query('SELECT pg_advisory_xact_lock(hashtext(\'ojt-grading-criteria\'))');
    const latest=(await c.query(`SELECT * FROM "AssessmentTemplates" WHERE "OJTSemesterID" IS NULL ORDER BY "Version" DESC LIMIT 1`,[])).rows[0];
    const version=(latest?.Version ?? 0)+1;
    const row=(await c.query(`INSERT INTO "AssessmentTemplates" ("Code","Version","Name","Criteria","Status","CreatedBy","PublishedAt","OJTSemesterID","EffectiveFrom","Reason") VALUES ('OJT-GLOBAL',$1,$2,$3,'PUBLISHED',$4,clock_timestamp(),NULL,NULL,$5) RETURNING *`,[version,name,JSON.stringify(criteria),actor.userId,reason])).rows[0];
    await c.query(`INSERT INTO "AuditLogs" ("UserID","Action","EntityType","EntityID","Detail") VALUES ($1,'SET_OJT_GRADING_CRITERIA','AssessmentTemplates',$2,$3)`,[actor.userId,row.TemplateID,reason]);
    return api(row);
  });
}
