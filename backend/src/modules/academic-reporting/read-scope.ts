import type { PoolClient } from 'pg';
import { enrichListRows } from '../../shared/list-context';
import { invalid } from '../students/student.validation';
import { filters, report, type Row } from './report.repository';

// Reads may span every OJT semester. Notification writes still require an explicit scope.
export async function readReports(client:PoolClient, params:Row, extra:string[] = []) {
  const requested = filters(params, extra, false);
  const semesters = (await client.query(`SELECT o."OJTSemesterID" AS "ojtSemesterId",
    COALESCE(w."BlockPeriodID",ad."AcademicPeriodID",rw."AcademicPeriodID",o."AcademicPeriodID") AS "academicPeriodId",
    COALESCE(w."ClosesAt",ad."AssessmentDeadline") AS "assessmentDeadline"
    FROM "OJTSemesters" o LEFT JOIN "OJTAssessmentWindows" w ON w."OJTSemesterID"=o."OJTSemesterID"
    LEFT JOIN LATERAL (SELECT * FROM "OJTAdvisorySchedules" s WHERE s."OJTSemesterID"=o."OJTSemesterID"
      ORDER BY s."SendAt" DESC,s."AcademicPeriodID" DESC LIMIT 1) ad ON true
    LEFT JOIN LATERAL (SELECT * FROM "OJTRegistrationWindows" r WHERE r."OJTSemesterID"=o."OJTSemesterID"
      ORDER BY r."WindowID" DESC LIMIT 1) rw ON true
    WHERE ($1::int IS NULL OR o."OJTSemesterID"=$1) ORDER BY o."OJTSemesterID" DESC`, [requested.ojtSemesterId ?? null])).rows;
  if (requested.ojtSemesterId && !semesters.length) throw invalid('OJT semester not found.',404,'OJT_SEMESTER_NOT_FOUND');
  const scopes = semesters.map(row => ({...requested,ojtSemesterId:row.ojtSemesterId,
    academicPeriodId:requested.academicPeriodId ?? row.academicPeriodId ?? null,
    assessmentDeadline:requested.assessmentDeadline ?? row.assessmentDeadline ?? null}));
  const data:Row[] = [];
  for (const scope of scopes) data.push(await report(client,scope));
  return { requested, scopes:await enrichListRows(client,scopes), data };
}
