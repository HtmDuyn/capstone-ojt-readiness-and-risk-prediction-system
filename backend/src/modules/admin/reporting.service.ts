import { readTransaction } from '../qhdn/read.repository';
import { invalid } from '../students/student.validation';

// Operational counts only. Eligibility decisions are stored by the batch checker.
export async function systemDashboard(params:Record<string,unknown>) {
 if(Object.keys(params).some(key=>key!=='section') || (params.section!==undefined&&!['all','summary'].includes(String(params.section))))throw invalid('Dashboard accepts only section=summary or all; prediction filters are no longer supported.');
 return readTransaction(async c=>{
  const summary=(await c.query(`SELECT (SELECT count(*)::int FROM "Users") AS accounts,(SELECT count(*)::int FROM "Users" WHERE "Status"='ACTIVE') AS "activeAccounts",(SELECT count(*)::int FROM "Students" WHERE "DeletedAt" IS NULL) AS students,(SELECT count(*)::int FROM "Enterprises" WHERE "DeletedAt" IS NULL) AS companies,(SELECT count(*)::int FROM "OJTSemesters") AS "ojtSemesters"`)).rows[0];
  return {summary:{scope:'ALL_SYSTEM',...summary}};
 });
}
