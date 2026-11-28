// Run the canonical full-build SQL through a direct PostgreSQL connection.
// This resets and recreates the application's tables; pass --confirm-reset explicitly.
const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');
const { Client } = require('pg');

dotenv.config({ path: path.join(__dirname, '../.env'), quiet: true });

function connectionSettings() {
  const directUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL || process.env.LOCAL_DATABASE_URL;
  const user = process.env.DB_USER ? encodeURIComponent(process.env.DB_USER) : '';
  const password = process.env.DB_PASSWORD ? encodeURIComponent(process.env.DB_PASSWORD) : '';
  const connectionString = directUrl || (user && password
    ? `postgresql://${user}:${password}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'ojt_db'}`
    : null);
  if (!connectionString) throw new Error('Database is not configured in backend/.env.');

  const usesSupabaseUrl = Boolean(process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL);
  const ssl = process.env.DB_SSL === 'true' || usesSupabaseUrl
    ? { rejectUnauthorized: false }
    : false;
  return { connectionString, ssl };
}

async function main() {
  if (!process.argv.includes('--confirm-reset')) {
    throw new Error('This full-build script deletes application-owned tables. Rerun with --confirm-reset to continue.');
  }

  const sqlPath = path.resolve(__dirname, '../../db/database');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  if (!sql.startsWith('-- Canonical database script: db/database.')) {
    throw new Error(`Unexpected SQL file: ${sqlPath}`);
  }
  if (!/^BEGIN;/m.test(sql) || !/^COMMIT;/m.test(sql)) {
    throw new Error('Expected db/database to contain an atomic BEGIN/COMMIT transaction.');
  }

  const { connectionString, ssl } = connectionSettings();
  const host = new URL(connectionString).hostname;
  if (!/(^|\.)supabase\.(co|com)$/i.test(host)) {
    throw new Error(`Configured host is not recognized as Supabase (${host}); refusing to reset another database.`);
  }

  const client = new Client({
    connectionString,
    ssl,
    connectionTimeoutMillis: 20_000,
    application_name: 'ojt-db-backend-fresh-build',
  });

  await client.connect();
  try {
    const target = await client.query('SELECT current_database() AS name, current_setting(\'server_version_num\') AS version');
    console.log(`Connected to Supabase PostgreSQL ${target.rows[0].version}; running db/database (${Buffer.byteLength(sql)} bytes).`);
    const results = await client.query(sql);
    console.log(`db/database completed successfully (${Array.isArray(results) ? results.length : 1} statement results).`);

    const summary = await client.query(`
      SELECT
        (SELECT count(*)::int FROM public."Students"
          WHERE "StudentCode" IN ('IS191621','SE191622','IS201641','SE201642')) AS "targetStudents",
        (SELECT count(*)::int FROM public."JobApplications" application
          JOIN public."Students" student ON student."StudentID"=application."StudentID"
          WHERE student."StudentCode" IN ('IS191621','SE191622','IS201641','SE201642')
            AND application."CVFileID" IS NOT NULL) AS "applicationsWithCV",
        (SELECT count(*)::int FROM public."RecruitmentPosts" post
          JOIN public."Enterprises" enterprise ON enterprise."EnterpriseID"=post."EnterpriseID"
          WHERE enterprise."EnterpriseCode"='FINBRIDGE'
            AND (post."SubmissionKey"='SEED-FALL2026-POST-SEED-JOB-FALL2026-FINBRIDGE'
              OR post."SubmissionKey" LIKE 'SEED-FALL2026-POST-SEED-JOB-FALL2026-FINBRIDGE-%')) AS "finBridgePosts"`);
    console.log(`Seed summary: ${JSON.stringify(summary.rows[0])}`);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  const code = error.code ? ` [${String(error.code).replace(/[^A-Za-z0-9_]/g, '')}]` : '';
  console.error(`db/database failed${code}: ${error.message || 'unknown error'}`);
  process.exitCode = 1;
});
