import { readTransaction } from '../qhdn/read.repository';
import { invalid } from '../students/student.validation';

// Operational counts only. Eligibility decisions are stored by the batch checker.
export async function systemDashboard(params:Record<string,unknown>) {
 if(Object.keys(params).some(key=>key!=='section') || (params.section!==undefined&&!['all','summary'].includes(String(params.section))))throw invalid('Dashboard accepts only section=summary or all; prediction filters are no longer supported.');
 return readTransaction(async c=>{
  const summary = (await c.query(`
    WITH account_counts AS (
      SELECT r."RoleCode" AS "roleCode", u."Status" AS status, count(*)::int AS count
      FROM "Users" u LEFT JOIN "Roles" r ON r."RoleID" = u."RoleID"
      GROUP BY r."RoleCode", u."Status"
    )
    SELECT COALESCE(sum(count), 0)::int AS accounts,
           COALESCE(sum(count) FILTER (WHERE status = 'ACTIVE'), 0)::int AS "activeAccounts",
           COALESCE(jsonb_agg(to_jsonb(account_counts)), '[]'::jsonb) AS "accountBreakdown",
           (SELECT count(*)::int FROM "Users" WHERE "CreatedAt">=clock_timestamp()-interval '30 days') AS "newAccounts30",
           (SELECT count(*)::int FROM "Students" WHERE "DeletedAt" IS NULL) AS students,
           (SELECT count(*)::int FROM "Enterprises" WHERE "DeletedAt" IS NULL) AS companies,
           (SELECT count(*)::int FROM "OJTSemesters") AS "ojtSemesters"
    FROM account_counts
  `)).rows[0];
  return {summary:{scope:'ALL_SYSTEM',...summary}};
 });
}
