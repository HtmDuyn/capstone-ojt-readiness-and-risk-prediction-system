// Read-only audit. Never runs the bootstrap or writes application data.
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
require('dotenv').config({ path: path.join(__dirname, '../src/.env'), quiet: true });
const { pool } = require('../dist/config/database');

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN READ ONLY');
    const accounts = (await client.query(`SELECT u."UserID" AS "userId",u."Username" AS username,
      u."Status" AS "accountStatus",s."StudentID" AS "studentId",s."StudentCode" AS code,
      s."Status" AS "studentStatus",s."DeletedAt" AS "deletedAt",s."ProgramID" AS "programId",
      p."CohortID" AS "cohortId",p."GroupCode" AS "groupCode"
      FROM "Users" u JOIN "Roles" r ON r."RoleID"=u."RoleID"
      LEFT JOIN "Students" s ON s."UserID"=u."UserID"
      LEFT JOIN "StudentAcademicPlacements" p ON p."StudentID"=s."StudentID"
      WHERE r."RoleCode"='STUDENT' ORDER BY u."Username"`)).rows;
    const foreignKeys = (await client.query(`WITH RECURSIVE related(oid) AS (
      SELECT '"Students"'::regclass::oid UNION
      SELECT c.conrelid FROM pg_constraint c JOIN related r ON r.oid=c.confrelid WHERE c.contype='f'
    ) SELECT c.conrelid::regclass::text AS "table",c.confrelid::regclass::text AS "parentTable",
      c.conname AS constraint,pg_get_constraintdef(c.oid) AS definition,c.convalidated AS validated,
      ARRAY(SELECT attname::text FROM unnest(c.conkey) WITH ORDINALITY key(attnum,n)
        JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=key.attnum ORDER BY n) AS columns,
      ARRAY(SELECT attname::text FROM unnest(c.confkey) WITH ORDINALITY key(attnum,n)
        JOIN pg_attribute a ON a.attrelid=c.confrelid AND a.attnum=key.attnum ORDER BY n) AS "parentColumns"
      FROM pg_constraint c WHERE c.contype='f' AND (c.conrelid IN (SELECT oid FROM related)
      OR c.conrelid='"Users"'::regclass) ORDER BY c.conrelid::regclass::text,c.conname`)).rows;
    const quote=name=>'"'+name.replaceAll('"','""')+'"';
    const orphanQueries=foreignKeys.map((fk,index)=>`SELECT ${index} AS id,count(*)::int AS count FROM ${fk.table} child
      WHERE ${fk.columns.map(col=>'child.'+quote(col)+' IS NOT NULL').join(' AND ')}
      AND NOT EXISTS(SELECT 1 FROM ${fk.parentTable} parent WHERE ${fk.columns.map((col,n)=>'parent.'+quote(fk.parentColumns[n])+'=child.'+quote(col)).join(' AND ')})`);
    const orphans=(await client.query(orphanQueries.join(' UNION ALL '))).rows.filter(row=>row.count>0);
    const counts = {};
    for (const name of ['StudentCourseResults','StudentAcademicPlacements','StudentComboSelections',
      'EligibilityChecks','EligibilityConfirmations','EligibleStudentHandoffItems','OJTRegistrations',
      'OJTRegistrationWindows','ComboRegistrationWindows','JobApplications','StudentEnterpriseCoordination',
      'InternshipAssignments','InternshipTasks','InternshipEvaluations','OJTResults','Notifications','StudentCVFiles','StudentOJTCalculatedResults']) {
      counts[name] = (await client.query(`SELECT count(*)::int AS n FROM "${name}"`)).rows[0].n;
    }
    await client.query('ROLLBACK');
    const report={accounts,foreignKeys,counts,orphans:orphans.map(row=>({...foreignKeys[row.id],count:row.count}))};
    const fs=require('node:fs');const dir=path.join(__dirname,'../.local');fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,'student-db-audit.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify({studentAccounts:accounts.length,unlinkedAccounts:accounts.filter(row=>!row.studentId).length,
      student01:accounts.find(row=>row.username==='student01'),foreignKeys:foreignKeys.length,
      unvalidatedForeignKeys:foreignKeys.filter(row=>!row.validated).length,orphans:report.orphans,counts},null,2));
  } finally { client.release(); }

}
main().catch(error => { console.error(error.code || '', error.message); process.exitCode = 1; })
  .finally(() => pool?.end());
