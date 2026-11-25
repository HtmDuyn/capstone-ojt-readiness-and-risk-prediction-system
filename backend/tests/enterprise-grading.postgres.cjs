// Optional read-only integration check: node tests/enterprise-grading.postgres.cjs
// Build first. Uses only VALUES fixtures and EXPLAIN; never changes application data.
require('dotenv').config({ path: require('node:path').resolve(__dirname, '../.env'), quiet: true });
const { Client } = require('pg');
const assert = require('node:assert/strict');
const { databaseConfig, pool } = require('../dist/config/database');
const { gradingCriteriaSelection } = require('../dist/modules/academic/grading-criteria.service');

async function main() {
  const client = new Client({ connectionString: databaseConfig.url, ssl: databaseConfig.ssl, connectionTimeoutMillis: 5000, statement_timeout: 10000 });
  try {
    await client.connect();
    await client.query('BEGIN READ ONLY');
    const fixtures = `WITH "OJTSemesters"("OJTSemesterID","StartDate") AS (
      VALUES (1,DATE '2026-01-01'),(2,DATE '2026-05-01'),(3,DATE '2026-09-01'),(4,DATE '2025-09-01')
    ), "AssessmentTemplates"("TemplateID","OJTSemesterID","EffectiveFrom","Version","Status") AS (
      VALUES (7,1,DATE '2026-01-01',1,'PUBLISHED'),(8,3,DATE '2026-09-01',1,'PUBLISHED'),
        (9,2,DATE '2026-05-01',1,'DRAFT'),(10,1,DATE '2026-01-01',2,'PUBLISHED'),
        (11,2,DATE '2026-05-01',2,'SUPERSEDED')
    ) `;
    for (const [semester, expected] of [[1, 10], [2, 10], [3, 8], [4, null]]) {
      const result = await client.query(fixtures + gradingCriteriaSelection('$1'), [semester]);
      assert.equal(result.rows[0]?.TemplateID ?? null, expected);
    }
    console.log('PASS: PostgreSQL resolves effective dates, inheritance, latest versions, future exclusions and publication status.');
    const plan = await client.query(`EXPLAIN (FORMAT JSON) SELECT a."AssignmentID",tmpl."Criteria"
      FROM "InternshipAssignments" a JOIN "StudentEnterpriseCoordination" co USING("CoordinationID")
      JOIN "OJTRegistrations" r USING("RegistrationID")
      LEFT JOIN "InternshipEvaluations" v ON v."AssignmentID"=a."AssignmentID"
      LEFT JOIN LATERAL (${gradingCriteriaSelection('r."OJTSemesterID"')}) applicable_template ON true
      LEFT JOIN "AssessmentTemplates" tmpl ON tmpl."TemplateID"=CASE WHEN v."Status"='SUBMITTED' THEN v."TemplateID" ELSE applicable_template."TemplateID" END`);
    assert.ok(plan.rows.length);
    console.log('PASS: roster template join validates against configured PostgreSQL schema.');
    await client.query('ROLLBACK');
  } finally {
    await client.end();
    await pool?.end();
  }
}
main().catch(error => {
  console.error('Read-only SQL check failed:', error.code ?? error.name);
  if (error.code === '42703' || error.code === '42P01') console.error(error.message);
  process.exitCode = 1;
});
