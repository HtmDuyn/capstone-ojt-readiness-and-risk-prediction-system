import type { PoolClient } from 'pg';
import { academicError } from './academic.schema';

// Caller holds the academic-calendar transaction lock. Preserve existing IDs and history.
export async function ensureOjtSemesterForPeriod(c: PoolClient, periodId: number): Promise<number> {
 const period=(await c.query('SELECT * FROM "AcademicPeriods" WHERE "AcademicPeriodID"=$1',[periodId])).rows[0];
 if (!period || period.Kind!=='SEMESTER') throw academicError('Select an existing regular academic semester.',422,'ACADEMIC_SEMESTER_REQUIRED');
 const existing=(await c.query('SELECT "OJTSemesterID" FROM "OJTSemesters" WHERE "AcademicPeriodID"=$1',[periodId])).rows[0];
 if (existing) return existing.OJTSemesterID;
 return (await c.query(`INSERT INTO "OJTSemesters" ("AcademicYearID","SemesterCode","Name","AcademicPeriodID","StartDate","EndDate","Status")
 SELECT "AcademicYearID",'OJT-AP-'||"AcademicPeriodID",left("Name",100),"AcademicPeriodID","StartDate","EndDate",'PLANNED'
 FROM "AcademicPeriods" WHERE "AcademicPeriodID"=$1 RETURNING "OJTSemesterID"`,[periodId])).rows[0].OJTSemesterID;
}
