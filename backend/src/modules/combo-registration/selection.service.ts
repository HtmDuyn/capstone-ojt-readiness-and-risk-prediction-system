import type { PoolClient } from 'pg';
import { invalid } from './combo.validation';
import type { Row } from './combo.repository';

export async function assertRosterContext(client:PoolClient,r:Row) {
  const current=(await client.query(`SELECT s."ProgramID",s."Status",u."Status" AS "AccountStatus",p."CohortID",p."GroupCode",p."EntryAcademicPeriodID" FROM "Students" s JOIN "Users" u ON u."UserID"=s."UserID" JOIN "StudentAcademicPlacements" p ON p."StudentID"=s."StudentID" WHERE s."StudentID"=$1`,[r.studentId])).rows[0];
  if(!current || current.Status!=='ACTIVE' || current.AccountStatus!=='ACTIVE' || current.ProgramID!==r.programId || current.CohortID!==r.scopeSnapshot.cohortId || current.GroupCode!==r.scopeSnapshot.groupCode || current.EntryAcademicPeriodID!==r.scopeSnapshot.entryAcademicPeriodId)throw invalid(`Student ${r.studentId}'s academic placement/account changed after scope was frozen. Review the roster.`,409,'COMBO_ROSTER_CHANGED');
  const relative=(await client.query('SELECT "StudentCurriculumSemester"($1,$2) AS n',[r.studentId,r.scopeSnapshot.academicPeriodId])).rows[0].n;
  if(relative!==4)throw invalid('Academic calendar changed and this roster no longer targets specialized semester 4.',409,'COMBO_ROSTER_CHANGED');
}
