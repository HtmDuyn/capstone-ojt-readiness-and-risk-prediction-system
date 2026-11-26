import { pool } from '../../config/database';
import { loadAcademicProgress, progressFromData } from './academic-progress';
import { invalid, positiveId } from './student.validation';

type ProgressSummary = {
  studentId: number;
  gpa: number | null;
  gpaScale: number | null;
  gpaCredits: number | null;
  earnedCredits: number | null;
  totalCredits: number | null;
  ojtEligibleCredits: number | null;
  computedAt: string;
};

function positiveNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function refreshStudentSummary(studentId: number): Promise<ProgressSummary> {
  if (!pool) throw invalid('Database is not configured.', 503, 'DATABASE_UNAVAILABLE');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const cache = (await client.query<{ isDirty: boolean; cacheProgramId: number | null; programId: number | null }>(
      `SELECT cache."IsDirty" AS "isDirty",cache."ProgramID" AS "cacheProgramId",s."ProgramID" AS "programId"
       FROM "StudentAcademicProgressCache" cache JOIN "Students" s USING ("StudentID")
       WHERE cache."StudentID"=$1 FOR UPDATE OF cache`,
      [studentId],
    )).rows[0];
    if (!cache) throw invalid('Student not found.', 404, 'STUDENT_NOT_FOUND');

    if (!cache.isDirty && cache.cacheProgramId === cache.programId) {
      const saved = (await client.query<{
        gpa: string | number | null;
        gpaScale: number | null;
        gpaCredits: string | number | null;
        earnedCredits: string | number | null;
        totalCredits: string | number | null;
        ojtEligibleCredits: string | number | null;
        computedAt: Date;
      }>(`SELECT "Gpa" AS gpa,"GpaScale" AS "gpaScale","GpaCredits" AS "gpaCredits",
            "EarnedCredits" AS "earnedCredits","TotalCredits" AS "totalCredits",
            "OjtEligibleCredits" AS "ojtEligibleCredits","ComputedAt" AS "computedAt"
         FROM "StudentAcademicProgressCache" WHERE "StudentID"=$1`, [studentId])).rows[0];
      await client.query('COMMIT');
      return {
        studentId, gpa: positiveNumber(saved.gpa), gpaScale: saved.gpaScale,
        gpaCredits: positiveNumber(saved.gpaCredits), earnedCredits: positiveNumber(saved.earnedCredits),
        totalCredits: positiveNumber(saved.totalCredits),
        ojtEligibleCredits: positiveNumber(saved.ojtEligibleCredits),
        computedAt: new Date(saved.computedAt).toISOString(),
      };
    }

    const data = await loadAcademicProgress(client, studentId);
    const progress = progressFromData(data);
    const row = (await client.query<{ computedAt: Date }>(
      `UPDATE "StudentAcademicProgressCache" SET "ProgramID"=$2,"Gpa"=$3,"GpaScale"=$4,
         "GpaCredits"=$5,"EarnedCredits"=$6,"TotalCredits"=$7,"OjtEligibleCredits"=$8,"Issues"=$9::jsonb,
         "IsDirty"=false,"ComputedAt"=clock_timestamp(),"UpdatedAt"=clock_timestamp()
       WHERE "StudentID"=$1 RETURNING "ComputedAt" AS "computedAt"`,
      [studentId, data.program?.ProgramID ?? null, progress.gpa, progress.gpaScale,
        progress.gpaCredits, progress.credits.earned, progress.credits.total,
        progress.credits.historyOjtEarned ?? progress.credits.ojtEarned ?? progress.credits.earned ?? 0,
        JSON.stringify(progress.issues ?? [])],
    )).rows[0];
    await client.query('COMMIT');
    return {
      studentId, gpa: positiveNumber(progress.gpa), gpaScale: positiveNumber(progress.gpaScale),
      gpaCredits: positiveNumber(progress.gpaCredits), earnedCredits: positiveNumber(progress.credits.earned),
      totalCredits: positiveNumber(progress.credits.total),
      ojtEligibleCredits: positiveNumber(progress.credits.historyOjtEarned ?? progress.credits.ojtEarned ?? progress.credits.earned ?? 0),
      computedAt: new Date(row.computedAt).toISOString(),
    };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function getAcademicProgressSummaries(rawIds: unknown): Promise<{ items: ProgressSummary[] }> {
  if (typeof rawIds !== 'string' || !rawIds.trim()) throw invalid('ids is required.');
  const parts = rawIds.split(',');
  if (parts.length > 100) throw invalid('Request no more than 100 student summaries at a time.');
  const ids = [...new Set(parts.map(value => positiveId(value.trim(), 'ids')))];
  const items = await Promise.all(ids.map(refreshStudentSummary));
  return { items };
}
