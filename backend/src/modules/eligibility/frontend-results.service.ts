import type { PoolClient } from 'pg';
import { latestEffectiveOjtCondition } from './ojt-policy.service';
import { createHash } from 'node:crypto';
import { academicTransaction, audit } from '../academic/academic.repository';
import { inputObject, invalid, positiveId, requiredText, enumValue, pagination, score } from '../students/student.validation';

type Status = 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'REVIEW_REQUIRED';
export interface OjtEligibilityResult {
  studentId: number; status: Status; earnedCredits: number | null; unpassedCourseCount: number;
  reasons: string[]; academicIssues: string[]; checkedAt: string;
}
function messages(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.length > 100) throw invalid(`${field} must be an array of at most 100 messages.`);
  return value.map(item => requiredText(item, field, 1000));
}
export function parseOjtEligibilityResults(body: unknown) {
  const input = inputObject(body, ['idempotencyKey', 'source', 'rule', 'results']);
  const idempotencyKey = requiredText(input.idempotencyKey, 'idempotencyKey', 100);
  if (input.source !== 'BACKEND') throw invalid('source must be BACKEND.');
  const rule = inputObject(input.rule, ['version', 'minCredits', 'maxUnpassedCourses', 'thresholdId', 'conditionId', 'issuingDocument', 'defaultRule']);
  if (rule.defaultRule !== undefined && typeof rule.defaultRule !== 'boolean') throw invalid('defaultRule must be a boolean.');
  const thresholdId = rule.thresholdId === undefined ? undefined : positiveId(rule.thresholdId, 'thresholdId');
  const conditionId = rule.conditionId === undefined ? undefined : positiveId(rule.conditionId, 'conditionId');
  const defaultRule = rule.defaultRule === true;
  if (conditionId === undefined && thresholdId === undefined && rule.maxUnpassedCourses === undefined && !defaultRule)
    throw invalid('Hãy chọn một mức tín chỉ đã tạo trước khi lưu kết quả xét OJT.');
  if (typeof rule.version !== 'number' || !Number.isSafeInteger(rule.version) || rule.version < 0 ||
      typeof rule.minCredits !== 'number' || !Number.isFinite(rule.minCredits) || rule.minCredits < 0 ||
      (rule.maxUnpassedCourses !== undefined && (typeof rule.maxUnpassedCourses !== 'number' || !Number.isSafeInteger(rule.maxUnpassedCourses) || rule.maxUnpassedCourses < 0)))
    throw invalid('Invalid OJT policy snapshot.');
  if (defaultRule && (conditionId !== undefined || thresholdId !== undefined || rule.version !== 0 || rule.minCredits !== 70 || rule.maxUnpassedCourses !== undefined))
    throw invalid('The default OJT rule must be exactly 70 credits and cannot reference a published condition.');
  if (!Array.isArray(input.results) || !input.results.length || input.results.length > 10000) throw invalid('Provide 1 to 10000 results.');
  const seen = new Set<number>();
  const results = input.results.map((raw, index): OjtEligibilityResult => {
    const row = inputObject(raw, ['studentId', 'status', 'earnedCredits', 'unpassedCourseCount', 'reasons', 'academicIssues', 'checkedAt']);
    const studentId = positiveId(row.studentId, 'studentId');
    if (seen.has(studentId)) throw invalid(`Duplicate studentId at result ${index + 1}.`);
    seen.add(studentId);
    const status = enumValue(row.status, ['ELIGIBLE', 'NOT_ELIGIBLE', 'REVIEW_REQUIRED'], 'status') as Status;
    if (row.earnedCredits === undefined) throw invalid('earnedCredits is required (number or null).');
    const earnedCredits = score(row.earnedCredits, 10000, 'earnedCredits');
    if (typeof row.unpassedCourseCount !== 'number' || !Number.isInteger(row.unpassedCourseCount) || row.unpassedCourseCount < 0 || row.unpassedCourseCount > 10000) throw invalid('unpassedCourseCount must be an integer between 0 and 10000.');
    const reasons = messages(row.reasons, 'reasons'), academicIssues = messages(row.academicIssues, 'academicIssues');
    // Validate the credit rule here. The OJT202 completion gate is checked against
    // authoritative course history inside the save transaction below.
    if (status === 'REVIEW_REQUIRED') {
      if (!academicIssues.length) throw invalid('REVIEW_REQUIRED requires academicIssues.');
    } else {
      if (earnedCredits === null || academicIssues.length) throw invalid('A conclusive result needs credits and no academicIssues.');
      if (status === 'ELIGIBLE' && !(earnedCredits >= (rule.minCredits as number) && (rule.maxUnpassedCourses === undefined || row.unpassedCourseCount <= (rule.maxUnpassedCourses as number)))) throw invalid('status does not match the supplied credits and unpassed course count.');
    }
    const rawTime = requiredText(row.checkedAt, 'checkedAt', 40);
    const checkedAt = new Date(rawTime);
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(rawTime) || !Number.isFinite(checkedAt.getTime()) || new Date(rawTime.slice(0,10)).toISOString().slice(0,10) !== rawTime.slice(0,10) || checkedAt.getTime() > Date.now() + 5 * 60_000) throw invalid('checkedAt must be a valid ISO timestamp, not in the future.');
    return { studentId, status, earnedCredits, unpassedCourseCount: row.unpassedCourseCount, reasons, academicIssues, checkedAt: checkedAt.toISOString() };
  }).sort((a, b) => a.studentId - b.studentId);
  const requestHash = createHash('sha256').update(JSON.stringify({ source: input.source, rule, results })).digest('hex');
  return { idempotencyKey, source: 'BACKEND' as const, results, requestHash, rule, thresholdId, conditionId, defaultRule };
}

async function recruitmentRosterSummary(client: PoolClient, batchId: number) {
  const row = (await client.query(`SELECT count(*)::int AS "eligibleCount",
    count(*) FILTER (WHERE "RoundID" IS NOT NULL)::int AS "assignedCount",
    count(*) FILTER (WHERE "RoundID" IS NULL)::int AS "waitingCount"
    FROM "OJTRecruitmentRoster" WHERE "BatchID"=$1`, [batchId])).rows[0];
  return row;
}

export async function saveOjtEligibilityResults(
  body: unknown,
  actorId: number,
  existingClient: PoolClient,
  assessmentSource: 'AUTOMATIC' | 'IMPORT' | 'MANUAL',
) {
  const input = parseOjtEligibilityResults(body);
  return academicTransaction(async client => {
    const policy = (await client.query('SELECT "Version","MinCredits","MaxUnpassedCourses" FROM "OJTConditionPolicies" ORDER BY "Version" DESC LIMIT 1')).rows[0];
    const defaults = policy ? { version: policy.Version, minCredits: Number(policy.MinCredits), maxUnpassedCourses: policy.MaxUnpassedCourses } : { version: 0, minCredits: 70, maxUnpassedCourses: 2 };
    const condition = input.conditionId === undefined ? undefined : (await client.query(`SELECT "ConditionID","Version","MinCredits","IssuingDocument",
      "EffectiveFrom"<=(statement_timestamp() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS "IsEffective"
      FROM "OJTConditions" WHERE "ConditionID"=$1`,[input.conditionId])).rows[0];
    if (input.conditionId !== undefined && !condition) throw invalid('Điều kiện xét đã chọn không tồn tại. Hãy tải lại danh sách điều kiện.',409,'OJT_CONDITION_NOT_FOUND');
    if (condition && !condition.IsEffective) throw invalid('Điều kiện xét đã chọn chưa đến ngày áp dụng.',409,'OJT_CONDITION_NOT_EFFECTIVE');
    const threshold = input.thresholdId === undefined ? undefined : (await client.query(
      'SELECT "MinCredits" FROM "OJTCreditThresholds" WHERE "ThresholdID"=$1', [input.thresholdId])).rows[0];
    if (input.thresholdId !== undefined && !threshold)
      throw invalid('Mức tín chỉ đã chọn không tồn tại.', 409, 'OJT_THRESHOLD_NOT_FOUND');
    const active: Record<string, any> = condition ? { version: condition.Version, minCredits: Number(condition.MinCredits), conditionId: condition.ConditionID, issuingDocument: condition.IssuingDocument }
      : input.defaultRule ? { version: 0, minCredits: 70, defaultRule: true }
      : threshold ? { ...defaults, minCredits: Number(threshold.MinCredits), thresholdId: input.thresholdId } : defaults;
    if (input.rule.version !== active.version || input.rule.minCredits !== active.minCredits || (condition && (input.rule.issuingDocument !== condition.IssuingDocument || input.rule.conditionId !== condition.ConditionID)) || (!condition && input.rule.maxUnpassedCourses !== undefined && input.rule.maxUnpassedCourses !== defaults.maxUnpassedCourses))
      throw invalid('OJT policy changed. Recalculate before saving.', 409, 'OJT_POLICY_CHANGED');
    const actor = (await client.query(`SELECT r."RoleCode" FROM "Users" u JOIN "Roles" r USING("RoleID") WHERE u."UserID"=$1 AND u."Status"='ACTIVE' FOR SHARE OF u`, [actorId])).rows[0];
    if (!actor || !['ADMIN', 'ACADEMIC'].includes(actor.RoleCode)) throw invalid('Academic access required.', 403, 'FORBIDDEN');
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`frontend-ojt-results:${actorId}:${input.idempotencyKey}`]);
    const existing = (await client.query('SELECT * FROM "OJTEligibilityResultBatches" WHERE "SavedBy"=$1 AND "IdempotencyKey"=$2', [actorId, input.idempotencyKey])).rows[0];
    if (existing) {
      if (existing.RequestHash !== input.requestHash) throw invalid('This idempotency key belongs to different results.', 409, 'IDEMPOTENCY_CONFLICT');
      return { batchId: existing.BatchID, savedCount: existing.SavedCount,
        ...await recruitmentRosterSummary(client, existing.BatchID), replayed: true };
    }
    const latest = await latestEffectiveOjtCondition(client);
    if (latest && condition?.ConditionID !== latest.ConditionID)
      throw invalid('Điều kiện OJT đang áp dụng đã thay đổi. Vui lòng xét lại.', 409, 'OJT_POLICY_CHANGED');
    const ids = input.results.map(result => result.studentId);
    const students = (await client.query(`SELECT s."StudentID",s."ProgramID",s."Status",u."Status" AS "AccountStatus",
      EXISTS (SELECT 1 FROM "StudentCourseResults" grade JOIN "Courses" course USING ("CourseID")
        WHERE grade."StudentID"=s."StudentID" AND upper(btrim(course."CourseCode"))='OJT202' AND grade."Status"='PASSED') AS "HasPassedOjt202",
      (SELECT max(COALESCE(h."UpdatedAt",h."CreatedAt")) FROM "StudentCourseResults" h WHERE h."StudentID"=s."StudentID") AS "HistoryUpdatedAt"
      FROM "Students" s JOIN "Users" u ON u."UserID"=s."UserID"
      WHERE s."StudentID"=ANY($1::int[]) AND s."DeletedAt" IS NULL ORDER BY s."StudentID" FOR UPDATE OF s FOR SHARE OF u`, [ids])).rows;
    if (students.length !== ids.length) throw invalid('One or more students do not exist or have been deleted.', 409, 'RESULT_STUDENT_NOT_FOUND');
    if (students.some(row => row.Status !== 'ACTIVE' || row.AccountStatus !== 'ACTIVE')) throw invalid('All students and their accounts must be active.', 409, 'RESULT_STUDENT_INACTIVE');
    const inputTimes = new Map(input.results.map(row => [row.studentId, new Date(row.checkedAt).getTime()]));
    if (students.some(row => row.HistoryUpdatedAt && new Date(row.HistoryUpdatedAt).getTime() > inputTimes.get(row.StudentID)!)) throw invalid('Course history changed after calculation. Recalculate before saving.', 409, 'ELIGIBILITY_RESULT_STALE');
    const current = (await client.query(`SELECT saved."StudentID",saved."CheckedAt",saved."Status",
      ${calculatedEligibilitySql('s')} AS result,
      EXISTS (SELECT 1 FROM "StudentCourseResults" grade JOIN "Courses" course USING ("CourseID")
        WHERE grade."StudentID"=s."StudentID" AND upper(btrim(course."CourseCode"))='OJT202' AND grade."Status"='PASSED') AS "HasPassedOjt202"
      FROM "StudentOJTCalculatedResults" saved JOIN "Students" s USING ("StudentID") WHERE saved."StudentID"=ANY($1::int[])`, [ids])).rows;
    const previous = new Map(current.map(row => [row.StudentID, new Date(row.CheckedAt).getTime()]));
    if (input.results.some(row => (previous.get(row.studentId) ?? 0) > new Date(row.checkedAt).getTime())) throw invalid('Newer results already exist. Recalculate before saving.', 409, 'ELIGIBILITY_RESULT_STALE');
    const batch = (await client.query(`INSERT INTO "OJTEligibilityResultBatches" ("IdempotencyKey","RequestHash","SavedBy","SavedCount","Results") VALUES ($1,$2,$3,$4,$5) RETURNING "BatchID","SavedAt"`,
      [input.idempotencyKey, input.requestHash, actorId, ids.length, JSON.stringify(input.results)])).rows[0];
    const studentById = new Map(students.map(row => [row.StudentID, row]));
    const programs = new Map(students.map(row => [row.StudentID, row.ProgramID]));
    // One set-based upsert; no recalculation or per-student write round trips.
    const { maxUnpassedCourses, ...creditRule } = active;
    const savedRule = condition ? { id: condition.ConditionID, conditionId: condition.ConditionID, version: condition.Version, minCredits: Number(condition.MinCredits), issuingDocument: condition.IssuingDocument }
      : input.defaultRule ? { version: 0, minCredits: 70, defaultRule: true, ruleSource: 'SYSTEM_DEFAULT' }
      : input.rule.maxUnpassedCourses === undefined ? creditRule : { ...creditRule, maxUnpassedCourses };
    const records = input.results.map(result => {
      const student = studentById.get(result.studentId)!;
      const meetsCondition = result.earnedCredits !== null && result.earnedCredits >= active.minCredits
        && (active.maxUnpassedCourses === undefined || result.unpassedCourseCount <= active.maxUnpassedCourses);
      const status = result.academicIssues.length ? 'REVIEW_REQUIRED'
        : meetsCondition && !student.HasPassedOjt202 ? 'ELIGIBLE' : 'NOT_ELIGIBLE';
      if (result.status !== status && !student.HasPassedOjt202)
        throw invalid('OJT eligibility changed while the results were calculated. Recalculate before saving.', 409, 'ELIGIBILITY_STATUS_CHANGED');
      const reasons = student.HasPassedOjt202
        ? [...new Set([...result.reasons, 'Đã đạt môn OJT202 nên không còn thuộc danh sách xét đợt OJT.'])]
        : result.reasons;
      return { ...result, status, reasons, source: input.source, policyVersion: active.version, rule: savedRule, programId: programs.get(result.studentId) ?? null };
    });
    await client.query(`INSERT INTO "StudentOJTCalculatedResults" ("StudentID","BatchID","ProgramID","Status","Result","CheckedAt","SavedAt","SavedBy","ConditionID")
      SELECT (item->>'studentId')::int,$2,(item->>'programId')::int,item->>'status',item-'programId',(item->>'checkedAt')::timestamptz,$3,$4,$5
      FROM jsonb_array_elements($1::jsonb) item
      ON CONFLICT ("StudentID") DO UPDATE SET "BatchID"=EXCLUDED."BatchID","ProgramID"=EXCLUDED."ProgramID","Status"=EXCLUDED."Status",
        "Result"=EXCLUDED."Result","CheckedAt"=EXCLUDED."CheckedAt","SavedAt"=EXCLUDED."SavedAt","SavedBy"=EXCLUDED."SavedBy","ConditionID"=EXCLUDED."ConditionID"`,
      [JSON.stringify(records), batch.BatchID, batch.SavedAt, actorId, condition?.ConditionID ?? null]);
    await audit(client, actorId, 'OJTEligibilityResultBatches', batch.BatchID, `SAVE_${assessmentSource}_ELIGIBILITY`, null, { savedCount: ids.length, studentIds: ids });
    return { batchId: batch.BatchID, savedCount: ids.length,
      ...await recruitmentRosterSummary(client, batch.BatchID), replayed: false };
  }, existingClient);
}

export const calculatedEligibilitySql = (studentAlias = 's') => `(SELECT result."Result" || jsonb_build_object('source',COALESCE(result."Result"->>'source','FRONTEND'),'batchId',result."BatchID",'savedAt',result."SavedAt",'savedBy',result."SavedBy",
      'conditionId',result."ConditionID",
  'isStale',result."ProgramID" IS DISTINCT FROM ${studentAlias}."ProgramID"
    OR CASE WHEN result."ConditionID" IS NOT NULL THEN
      result."ConditionID" IS DISTINCT FROM (result."Result"->'rule'->>'conditionId')::int
      OR result."ConditionID" IS DISTINCT FROM (SELECT condition."ConditionID" FROM "OJTConditions" condition
        WHERE condition."EffectiveFrom"<=(statement_timestamp() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
        ORDER BY condition."EffectiveFrom" DESC, condition."Version" DESC LIMIT 1)
      ELSE CASE WHEN COALESCE(result."Result"->'rule'->'defaultRule','false'::jsonb)='true'::jsonb THEN EXISTS (
        SELECT 1 FROM "OJTConditions" condition
        WHERE condition."EffectiveFrom"<=(statement_timestamp() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
      ) ELSE COALESCE((result."Result"->>'policyVersion')::int,0)<>COALESCE((SELECT max(p."Version") FROM "OJTConditionPolicies" p),0) END END
    OR ${studentAlias}."Status"<>'ACTIVE'
    OR EXISTS(SELECT 1 FROM "StudentAcademicPlacements" placement WHERE placement."StudentID"=${studentAlias}."StudentID" AND placement."UpdatedAt">result."CheckedAt")
    OR EXISTS(SELECT 1 FROM "StudentCourseResults" history WHERE history."StudentID"=${studentAlias}."StudentID" AND COALESCE(history."UpdatedAt",history."CreatedAt")>result."CheckedAt"
      AND (history."SourceReference" IS DISTINCT FROM 'AUTO_OJT_ENROLLMENT' OR history."Status" IS DISTINCT FROM 'IN_PROGRESS'))
    OR EXISTS(SELECT 1 FROM "StudentCourseResults" grade JOIN "Courses" course USING ("CourseID")
      WHERE grade."StudentID"=${studentAlias}."StudentID" AND upper(btrim(course."CourseCode"))='OJT202' AND grade."Status"='PASSED'
        AND NOT (result."Status"='NOT_ELIGIBLE' AND COALESCE(result."Result"->'reasons','[]'::jsonb)
          @> '["Đã đạt môn OJT202 nên không còn thuộc danh sách xét đợt OJT."]'::jsonb)))
  FROM "StudentOJTCalculatedResults" result WHERE result."StudentID"=${studentAlias}."StudentID")`;

export async function listOjtEligibilityResults(params: Record<string, unknown>) {
  const p = pagination(params, ['studentId', 'status']);
  const studentId = params.studentId === undefined ? null : positiveId(params.studentId, 'studentId');
  const status = params.status === undefined ? null : enumValue(params.status, ['ELIGIBLE', 'NOT_ELIGIBLE', 'REVIEW_REQUIRED'], 'status');
  return academicTransaction(async client => {
    const where = `WHERE s."DeletedAt" IS NULL AND ($1::int IS NULL OR s."StudentID"=$1) AND ($2::text IS NULL OR r."Status"=$2)`;
    const args = [studentId, status];
    const total = (await client.query(`SELECT count(*)::int AS total FROM "StudentOJTCalculatedResults" r JOIN "Students" s USING("StudentID") ${where}`, args)).rows[0].total;
    const rows = (await client.query(`SELECT ${calculatedEligibilitySql()} AS result,u."FullName" AS "fullName",s."StudentCode" AS "studentCode"
      FROM "StudentOJTCalculatedResults" r JOIN "Students" s USING("StudentID") JOIN "Users" u ON u."UserID"=s."UserID" ${where}
      ORDER BY r."SavedAt" DESC,s."StudentID" LIMIT $3 OFFSET $4`, [...args, p.limit, p.offset])).rows;
    return { items: rows.map(row => ({ ...row.result, fullName: row.fullName, studentCode: row.studentCode })), total, page: p.page, limit: p.limit };
  });
}
