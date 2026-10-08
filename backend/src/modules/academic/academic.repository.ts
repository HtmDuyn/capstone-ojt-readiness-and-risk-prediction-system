import { pool, query } from '../../config/database';
import type { PoolClient } from 'pg';
import { academicError, pageInput, positiveId, statusInput } from './academic.schema';

export const resources = {
  'academic-years': { table: 'AcademicYears', id: 'AcademicYearID', code: 'YearCode', fields: { yearCode: 'YearCode', startDate: 'StartDate', endDate: 'EndDate', status: 'Status' } },
  'academic-periods': { table: 'AcademicPeriods', id: 'AcademicPeriodID', code: 'PeriodCode', fields: { academicYearId: 'AcademicYearID', periodCode: 'PeriodCode', name: 'Name', kind: 'Kind', parentPeriodId: 'ParentPeriodID', startDate: 'StartDate', endDate: 'EndDate', status: 'Status' } },
  'ojt-semesters': { table: 'OJTSemesters', id: 'OJTSemesterID', code: 'SemesterCode', fields: { academicYearId: 'AcademicYearID', semesterCode: 'SemesterCode', name: 'Name', academicPeriodId: 'AcademicPeriodID', startDate: 'StartDate', endDate: 'EndDate', regStartDate: 'RegStartDate', regEndDate: 'RegEndDate', status: 'Status' } },
  cohorts: { table: 'Cohorts', id: 'CohortID', code: 'CohortCode', fields: { cohortCode: 'CohortCode', name: 'Name', enrollmentYear: 'EnrollmentYear', status: 'Status' } },
} as const;
export type Resource = keyof typeof resources;
export type AcademicRecord = Record<string, any>;

export function asApi(resource: Resource, row: AcademicRecord): AcademicRecord {
  const config = resources[resource];
  const value: AcademicRecord = { id: row[config.id] };
  for (const [key, column] of Object.entries(config.fields)) {
    const field = row[column];
    // PostgreSQL dates are local-midnight Date objects; format using local components, not UTC conversion.
    value[key] = field instanceof Date ? `${field.getFullYear()}-${String(field.getMonth()+1).padStart(2,'0')}-${String(field.getDate()).padStart(2,'0')}` : field;
  }
  if (resource === 'cohorts') value.groups = row.groups ?? [];
  return value;
}
export async function findRecord(client: PoolClient, resource: Resource, id: number) {
  const c = resources[resource];
  const result = await client.query(`SELECT * FROM "${c.table}" WHERE "${c.id}"=$1 FOR UPDATE`, [id]);
  if (!result.rows[0]) throw academicError(`${resource} record not found.`, 404, 'ACADEMIC_RECORD_NOT_FOUND');
  const row = asApi(resource, result.rows[0]);
  if (resource === 'cohorts') row.groups = (await client.query('SELECT "GroupCode" AS "groupCode","EntryAcademicPeriodID" AS "entryAcademicPeriodId" FROM "CohortGroups" WHERE "CohortID"=$1 ORDER BY "GroupCode"', [id])).rows;
  return row;
}

export async function listRecords(resource: Resource, params: Record<string, unknown>) {
  const c = resources[resource], p = pageInput(params);
  const allowed = ['page','limit','search','status', ...(resource === 'academic-periods' ? ['academicYearId','kind'] : resource === 'ojt-semesters' ? ['academicYearId'] : [])];
  for (const key of Object.keys(params)) if (!allowed.includes(key)) throw academicError(`Unknown query parameter: ${key}.`);
  const args: unknown[] = [];
  const conditions: string[] = [];
  if (p.search) { args.push(`%${p.search}%`); conditions.push(`(t."${c.code}" ILIKE $${args.length}${resource === 'academic-years' ? '' : ` OR t."Name" ILIKE $${args.length}`})`); }
  if (p.status) { args.push(statusInput(p.status)); conditions.push(`t."Status"=$${args.length}`); }
  if (params.academicYearId !== undefined) { args.push(positiveId(params.academicYearId, 'academicYearId')); conditions.push(`t."AcademicYearID"=$${args.length}`); }
  if (params.kind !== undefined) {
    if (!['SEMESTER','BLOCK3'].includes(params.kind as string)) throw academicError('kind must be SEMESTER or BLOCK3.');
    args.push(params.kind); conditions.push(`t."Kind"=$${args.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  // Use one statement so total and page share the same database snapshot, including an empty page.
  const grouped = resource === 'cohorts' ? `, COALESCE((SELECT jsonb_agg(jsonb_build_object('groupCode',g."GroupCode",'entryAcademicPeriodId',g."EntryAcademicPeriodID") ORDER BY g."GroupCode") FROM "CohortGroups" g WHERE g."CohortID"=t."CohortID"),'[]'::jsonb) AS groups` : '';
  const result = await query(`WITH filtered AS (SELECT t.* ${grouped} FROM "${c.table}" t ${where}), page AS (
    SELECT * FROM filtered ORDER BY "${c.id}" DESC LIMIT $${args.length+1} OFFSET $${args.length+2}
  ) SELECT (SELECT count(*)::int FROM filtered) AS total, COALESCE(jsonb_agg(to_jsonb(page) ORDER BY page."${c.id}" DESC) FILTER (WHERE page."${c.id}" IS NOT NULL),'[]'::jsonb) AS items FROM page`, [...args, p.limit, p.offset]);
  return { items: result.rows[0].items.map((r: AcademicRecord) => asApi(resource, r)), page: p.page, limit: p.limit, total: result.rows[0].total };
}

export async function academicTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  if (!pool) throw academicError('Database is not configured.', 503, 'DATABASE_UNAVAILABLE');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(hashtext('academic-calendar'))");
    const value = await work(client);
    await client.query('COMMIT');
    return value;
  } catch (error) {
    await client.query('ROLLBACK');
    const code = (error as { code?: string }).code;
    if (code === '23505') throw academicError('Academic code or group already exists.', 409, 'ACADEMIC_DUPLICATE');
    if (code === '23503') throw academicError('Referenced data is missing or the change conflicts with existing academic history.', 409, 'ACADEMIC_REFERENCE_CONFLICT');
    if (code === '23514') throw academicError('Academic data violates a database constraint.');
    throw error;
  } finally { client.release(); }
}
export async function audit(client: PoolClient, actorId: number, resource: string, id: number, action: string, before: unknown, after: unknown, reason?: string) {
  await client.query('INSERT INTO "AuditLogs" ("UserID","Action","EntityType","EntityID","Detail") VALUES ($1,$2,$3,$4,$5)', [actorId, action, resource, id, JSON.stringify({ before, after, reason })]);
}
