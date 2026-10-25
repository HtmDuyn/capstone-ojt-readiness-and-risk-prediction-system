import { enrichListRows } from '../../shared/list-context';
import { pool, query } from '../../config/database';
import type { PoolClient } from 'pg';
import { academicError, pageInput, positiveId, statusInput } from './academic.schema';

export const resources = {
  'academic-years': { table: 'AcademicYears', id: 'AcademicYearID', code: 'YearCode', fields: { yearCode: 'YearCode', startDate: 'StartDate', endDate: 'EndDate', status: 'Status' } },
  'academic-periods': { table: 'AcademicPeriods', id: 'AcademicPeriodID', code: 'PeriodCode', fields: { academicYearId: 'AcademicYearID', periodCode: 'PeriodCode', name: 'Name', kind: 'Kind', parentPeriodId: 'ParentPeriodID', startDate: 'StartDate', endDate: 'EndDate', status: 'Status' } },
  cohorts: { table: 'Cohorts', id: 'CohortID', code: 'CohortCode', fields: { cohortCode: 'CohortCode', name: 'Name', enrollmentYear: 'EnrollmentYear', status: 'Status' } },
} as const;
export type Resource = keyof typeof resources;
export type AcademicRecord = Record<string, any>;

const periodOjt = `, (SELECT jsonb_build_object('id',o."OJTSemesterID",'academicPeriodId',o."AcademicPeriodID",'academicYearId',o."AcademicYearID",'semesterCode',o."SemesterCode",'name',o."Name",'startDate',o."StartDate",'endDate',o."EndDate",'regStartDate',o."RegStartDate",'regEndDate',o."RegEndDate",'status',o."Status") FROM "OJTSemesters" o WHERE o."AcademicPeriodID"=t."AcademicPeriodID") AS ojt`;

export function asApi(resource: Resource, row: AcademicRecord): AcademicRecord {
  const config = resources[resource];
  const value: AcademicRecord = { id: row[config.id] };
  for (const [key, column] of Object.entries(config.fields)) {
    const field = row[column];
    // PostgreSQL dates are local-midnight Date objects; format using local components, not UTC conversion.
    value[key] = field instanceof Date ? `${field.getFullYear()}-${String(field.getMonth()+1).padStart(2,'0')}-${String(field.getDate()).padStart(2,'0')}` : field;
  }
  if (resource === 'cohorts') value.groups = row.groups ?? [];
  if (resource === 'academic-years') value.periods = row.periods ?? [];
  if (resource === 'academic-periods') { value.ojt = row.ojt ?? null; value.ojtSemesterId = row.ojt?.id ?? null; }
  if(resource==='academic-periods'&&row.comboPhaseSchedules!==undefined){value.comboPhaseSchedules=row.comboPhaseSchedules;value.advisorySchedule=row.advisorySchedule;}
  return value;
}
export async function findRecord(client: PoolClient, resource: Resource, id: number) {
  const c = resources[resource];
  const result = await client.query(`SELECT t.* ${resource === 'academic-periods' ? periodOjt : ''} FROM "${c.table}" t WHERE t."${c.id}"=$1 FOR UPDATE OF t`, [id]);
  if (!result.rows[0]) throw academicError(`${resource} record not found.`, 404, 'ACADEMIC_RECORD_NOT_FOUND');
  const row = asApi(resource, result.rows[0]);
  if(resource==='academic-years')row.periods=(await client.query(`SELECT p."AcademicPeriodID" AS id,p."PeriodCode" AS "periodCode",p."Name" AS name,p."Kind" AS kind,
    p."ParentPeriodID" AS "parentPeriodId",to_char(p."StartDate",'YYYY-MM-DD') AS "startDate",to_char(p."EndDate",'YYYY-MM-DD') AS "endDate",p."Status" AS status,o."OJTSemesterID" AS "ojtSemesterId"
    FROM "AcademicPeriods" p LEFT JOIN "OJTSemesters" o ON o."AcademicPeriodID"=p."AcademicPeriodID" WHERE p."AcademicYearID"=$1 ORDER BY p."StartDate",p."AcademicPeriodID"`,[id])).rows;
  if (resource === 'cohorts') row.groups = (await client.query('SELECT g."GroupCode" AS "groupCode",g."EntryAcademicPeriodID" AS "entryAcademicPeriodId",COALESCE((SELECT jsonb_agg(jsonb_build_object(\'semester\',m."CurriculumSemester",\'academicPeriodId\',m."AcademicPeriodID") ORDER BY m."CurriculumSemester") FROM "CohortCurriculumPeriods" m WHERE m."CohortID"=g."CohortID" AND m."GroupCode"=g."GroupCode"),\'[]\'::jsonb) AS "curriculumPeriods" FROM "CohortGroups" g WHERE g."CohortID"=$1 ORDER BY g."GroupCode"', [id])).rows;
  return row;
}

export async function listRecords(resource: Resource, params: Record<string, unknown>,includeWorkflow=true) {
  const c = resources[resource], p = pageInput(params);
  const allCalendarRecords = Object.keys(params).length === 0;
  const allowed = ['page','limit','search','status', ...(resource === 'academic-periods' ? ['academicYearId','kind','academicPeriodId'] : [])];
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
  if (params.academicPeriodId !== undefined) { args.push(positiveId(params.academicPeriodId,"academicPeriodId")); conditions.push(`t."AcademicPeriodID"=$${args.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  // Use one statement so total and page share the same database snapshot, including an empty page.
  const grouped = resource === 'cohorts' ? `, COALESCE((SELECT jsonb_agg(jsonb_build_object('groupCode',g."GroupCode",'entryAcademicPeriodId',g."EntryAcademicPeriodID",'curriculumPeriods',COALESCE((SELECT jsonb_agg(jsonb_build_object('semester',m."CurriculumSemester",'academicPeriodId',m."AcademicPeriodID") ORDER BY m."CurriculumSemester") FROM "CohortCurriculumPeriods" m WHERE m."CohortID"=g."CohortID" AND m."GroupCode"=g."GroupCode"),'[]'::jsonb)) ORDER BY g."GroupCode") FROM "CohortGroups" g WHERE g."CohortID"=t."CohortID"),'[]'::jsonb) AS groups` : resource === 'academic-periods' ? periodOjt : `,
    COALESCE((SELECT jsonb_agg(jsonb_build_object('id',p."AcademicPeriodID",'periodCode',p."PeriodCode",'name',p."Name",'kind',p."Kind",
      'parentPeriodId',p."ParentPeriodID",'startDate',p."StartDate",'endDate',p."EndDate",'status',p."Status",'ojtSemesterId',o."OJTSemesterID") ORDER BY p."StartDate",p."AcademicPeriodID")
      FROM "AcademicPeriods" p LEFT JOIN "OJTSemesters" o ON o."AcademicPeriodID"=p."AcademicPeriodID" WHERE p."AcademicYearID"=t."AcademicYearID"),'[]'::jsonb) AS periods`;
  const workflow=resource==='academic-periods'&&includeWorkflow?`,
    COALESCE((SELECT jsonb_agg(jsonb_build_object('phase',s."Phase",'startsAt',s."StartsAt",'endsAt',s."EndsAt",'reason',s."Reason",'confirmedBy',s."ConfirmedBy",'confirmedAt',s."ConfirmedAt") ORDER BY s."Phase")
      FROM "ComboPhaseSchedules" s WHERE s."AcademicPeriodID"=t."AcademicPeriodID"),'[]'::jsonb) AS "comboPhaseSchedules",
    (SELECT jsonb_build_object('ojtSemesterId',a."OJTSemesterID",'sendAt',a."SendAt",'assessmentDeadline',a."AssessmentDeadline",'scope',a."Scope",'enabled',a."Enabled",'version',a."Version",'updatedBy',a."UpdatedBy",'updatedAt',a."UpdatedAt")
      FROM "OJTAdvisorySchedules" a WHERE a."AcademicPeriodID"=t."AcademicPeriodID") AS "advisorySchedule"`:'';
  const result = await query(`WITH filtered AS (SELECT t.* ${grouped} ${workflow} FROM "${c.table}" t ${where}), page AS (
    SELECT * FROM filtered ORDER BY "${c.id}" DESC ${allCalendarRecords ? '' : `LIMIT $${args.length+1} OFFSET $${args.length+2}`}
  ) SELECT (SELECT count(*)::int FROM filtered) AS total, COALESCE(jsonb_agg(to_jsonb(page) ORDER BY page."${c.id}" DESC) FILTER (WHERE page."${c.id}" IS NOT NULL),'[]'::jsonb) AS items FROM page`, allCalendarRecords ? args : [...args, p.limit, p.offset]);
  return { items: await enrichListRows({query},result.rows[0].items.map((r: AcademicRecord) => asApi(resource, r))), page: p.page, limit: allCalendarRecords ? Math.max(1,result.rows[0].total) : p.limit, total: result.rows[0].total };
}

export async function academicTransaction<T>(work: (client: PoolClient) => Promise<T>, existingClient?:PoolClient): Promise<T> {
  if(existingClient)return work(existingClient);
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
