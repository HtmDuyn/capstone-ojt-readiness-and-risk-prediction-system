import type { PoolClient } from 'pg';
import { createHash } from 'node:crypto';
import { academicTransaction, audit } from '../academic/academic.repository';
import { inputObject, invalid } from '../students/student.validation';
import { assessPublishedPrograms, type ProgramFeasibility } from './ojt-policy-feasibility';

export async function latestEffectiveOjtCondition(client: PoolClient) {
  return (await client.query(`SELECT * FROM "OJTConditions"
    WHERE "EffectiveFrom"<=(statement_timestamp() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
    ORDER BY "EffectiveFrom" DESC, "Version" DESC LIMIT 1`)).rows[0] ?? null;
}

export async function listOjtConditions() {
  return academicTransaction(async client => {
    const rows = (await client.query(`SELECT c.*,to_char(c."EffectiveFrom",'YYYY-MM-DD') AS "EffectiveDate",
      c."EffectiveFrom"<=(statement_timestamp() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS "IsEffective",u."FullName" AS "CreatedByName" FROM "OJTConditions" c LEFT JOIN "Users" u ON u."UserID"=c."CreatedBy" ORDER BY c."Version" DESC`)).rows;
    return rows.map(conditionApi);
  });
}
const conditionApi = (row: Record<string, any>) => ({ id: row.ConditionID, version: row.Version, minCredits: Number(row.MinCredits), issuingDocument: row.IssuingDocument, effectiveFrom: row.EffectiveDate, isEffective: row.IsEffective, createdAt: row.CreatedAt, createdBy: row.CreatedBy, createdByName: row.CreatedByName ?? null });
export async function createOjtCondition(body: unknown, actorId: number) {
  const value = inputObject(body, ['minCredits', 'issuingDocument', 'effectiveFrom']);
  if (typeof value.minCredits !== 'number' || !Number.isFinite(value.minCredits) || value.minCredits < 0 || value.minCredits > 9999.99 || Math.abs(Math.round(value.minCredits * 100) - value.minCredits * 100) > 1e-8) throw invalid('Tín chỉ phải là số không âm, tối đa hai chữ số thập phân.');
  const issuingDocument = value.issuingDocument;
  if (typeof issuingDocument !== 'string' || !issuingDocument.trim() || issuingDocument.length > 10000) throw invalid('Văn bản ban hành không được để trống và tối đa 10.000 ký tự.');
  const effectiveFrom = value.effectiveFrom;
  if (typeof effectiveFrom !== 'string' || !/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(effectiveFrom))
    throw invalid('Ngày bắt đầu áp dụng phải có định dạng YYYY-MM-DD.');
  const date = new Date(effectiveFrom);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== effectiveFrom)
    throw invalid('Ngày bắt đầu áp dụng không hợp lệ.');
  return academicTransaction(async client => {
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', ['ojt-condition-version']);
    const current = (await client.query('SELECT COALESCE(max("Version"),0)::int AS version FROM "OJTConditions"')).rows[0].version;
    const row = (await client.query(`INSERT INTO "OJTConditions" ("Version","MinCredits","IssuingDocument","CreatedBy","EffectiveFrom")
      SELECT $1,$2,$3,$4,$5::date WHERE $5::date > (clock_timestamp() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
      RETURNING *,to_char("EffectiveFrom",'YYYY-MM-DD') AS "EffectiveDate",false AS "IsEffective"`,
      [current + 1, value.minCredits, issuingDocument.trim(), actorId, effectiveFrom])).rows[0];
    if (!row) throw invalid('Ngày bắt đầu áp dụng phải sau ngày hiện tại.');
    await audit(client, actorId, 'OJTConditions', row.ConditionID, 'CREATE', null, conditionApi(row));
    const actor = (await client.query('SELECT "FullName" FROM "Users" WHERE "UserID"=$1',[actorId])).rows[0];
    return conditionApi({...row,CreatedByName:actor?.FullName});
  });
}

type PolicyInput = { minCredits: number; maxUnpassedCourses: number };
function parseValues(body: unknown): PolicyInput {
  const value = inputObject(body, ['minCredits', 'maxUnpassedCourses']);
  if (typeof value.minCredits !== 'number' || !Number.isFinite(value.minCredits) || value.minCredits < 0 || Math.abs(Math.round(value.minCredits * 100) - value.minCredits * 100) > 1e-8 || value.minCredits > 9999.99)
    throw invalid('Tín chỉ tối thiểu phải là số không âm, tối đa hai chữ số thập phân.');
  if (typeof value.maxUnpassedCourses !== 'number' || !Number.isSafeInteger(value.maxUnpassedCourses) || value.maxUnpassedCourses < 0)
    throw invalid('Số môn chưa đạt tối đa phải là số nguyên không âm.');
  return { minCredits: value.minCredits, maxUnpassedCourses: value.maxUnpassedCourses };
}
export function reviewOjtPolicy(values: PolicyInput, rows: ProgramFeasibility[], currentVersion: number) {
  const programs = rows.map(row => {
    const reasons = [...row.reasons];
    if (row.preOjtCourseCount !== null && values.maxUnpassedCourses > row.preOjtCourseCount)
      reasons.push(`Giới hạn ${values.maxUnpassedCourses} môn chưa đạt lớn hơn ${row.preOjtCourseCount} học phần trước OJT.`);
    return { ...row, status: reasons.length > row.reasons.length ? 'INVALID' as const : row.status, reasons };
  });
  const allowed = programs.length > 0 && programs.every(row => row.status === 'VALID' || row.status === 'WARNING');
  const token = createHash('sha256').update(JSON.stringify({ values, currentVersion, programs: programs.map(({sourceHash, programId}) => ({sourceHash, programId})) })).digest('hex');
  return { values, currentVersion, allowed, token, programs };
}
const policyApi = (row: Record<string, any>) => ({ id: row.PolicyID, version: row.Version,
  minCredits: Number(row.MinCredits), maxUnpassedCourses: row.MaxUnpassedCourses,
  updatedAt: row.CreatedAt, effectiveAt: row.EffectiveAt, updatedBy: row.CreatedBy, updatedByName: row.UpdatedByName ?? null });
export async function currentOjtPolicy() {
  return academicTransaction(async client => {
    const row = (await client.query('SELECT p.*,u."FullName" AS "UpdatedByName" FROM "OJTConditionPolicies" p LEFT JOIN "Users" u ON u."UserID"=p."CreatedBy" ORDER BY p."Version" DESC LIMIT 1')).rows[0];
    return row ? policyApi(row) : { id: null, version: 0, minCredits: 70, maxUnpassedCourses: 2, updatedAt: null, effectiveAt: null, updatedBy: null, updatedByName: null };
  });
}
export async function previewOjtPolicy(body: unknown) {
  const values = parseValues(body);
  return academicTransaction(async client => {
    const row = (await client.query('SELECT "Version" FROM "OJTConditionPolicies" ORDER BY "Version" DESC LIMIT 1')).rows[0];
    return reviewOjtPolicy(values, await assessPublishedPrograms(client, values.minCredits), row?.Version ?? 0);
  });
}
export async function publishOjtPolicy(body: unknown, actorId: number) {
  const value = inputObject(body, ['minCredits', 'maxUnpassedCourses', 'token']);
  const values = parseValues({ minCredits: value.minCredits, maxUnpassedCourses: value.maxUnpassedCourses });
  if (typeof value.token !== 'string' || !/^[a-f0-9]{64}$/.test(value.token)) throw invalid('Cần kiểm tra điều kiện trước khi lưu.');
  return academicTransaction(async client => {
    const current = (await client.query('SELECT * FROM "OJTConditionPolicies" ORDER BY "Version" DESC LIMIT 1')).rows[0];
    const result = reviewOjtPolicy(values, await assessPublishedPrograms(client, values.minCredits), current?.Version ?? 0);
    if (result.token !== value.token) throw invalid('Dữ liệu chương trình hoặc điều kiện đã thay đổi. Hãy kiểm tra lại.', 409, 'OJT_POLICY_PREVIEW_STALE');
    if (!result.allowed) throw invalid('Có khung chương trình chưa đáp ứng điều kiện. Không thể lưu.', 409, 'OJT_POLICY_INVALID');
    const policy = (await client.query(`INSERT INTO "OJTConditionPolicies" ("Version","MinCredits","MaxUnpassedCourses","SourceHash","CreatedBy") VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [result.currentVersion + 1, values.minCredits, values.maxUnpassedCourses, result.token, actorId])).rows[0];
    for (const program of result.programs) {
      const rule = (await client.query(`INSERT INTO "OJTRuleSets" ("ProgramID","Version","Name","MinCredits","MaxUnpassedCourses","Status","CreatedBy","PublishedBy","PublishedAt")
        SELECT $1,COALESCE(max("Version"),0)+1,$2,$3,$4,'PUBLISHED',$5,$5,clock_timestamp() FROM "OJTRuleSets" WHERE "ProgramID"=$1 AND "OJTSemesterID" IS NULL RETURNING "RuleSetID"`,
        [program.programId, `Điều kiện OJT chung phiên bản ${policy.Version}`, values.minCredits, values.maxUnpassedCourses, actorId])).rows[0];
      await client.query(`INSERT INTO "OJTActiveRuleSets" ("ProgramID","ScopeSemesterID","RuleSetID") VALUES ($1,0,$2)
        ON CONFLICT ("ProgramID","ScopeSemesterID") DO UPDATE SET "RuleSetID"=EXCLUDED."RuleSetID"`, [program.programId, rule.RuleSetID]);
    }
    // The managed policy has one shared scope; preserve old rule versions as
    // history but remove their semester-specific active overrides.
    await client.query('DELETE FROM "OJTActiveRuleSets" WHERE "ScopeSemesterID"<>0');
    await audit(client, actorId, 'OJTConditionPolicies', policy.PolicyID, 'PUBLISH', current ? policyApi(current) : null, policyApi(policy));
    const actor = (await client.query('SELECT "FullName" FROM "Users" WHERE "UserID"=$1', [actorId])).rows[0];
    return policyApi({ ...policy, UpdatedByName: actor?.FullName });
  });
}
