// Destructive only to the explicitly named disposable localhost database below.
const path = require('node:path');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const { Client } = require('pg');
async function main() {
  if (process.argv[2] && process.argv[2] !== '--tasks') throw Error('Usage: node scripts/test-student-flow.cjs [--tasks]');
  const target = process.env.STUDENT_TEST_DATABASE_URL;
  if (!target) throw Error('Set STUDENT_TEST_DATABASE_URL to the disposable local database.');
  const url = new URL(target);
  if (url.hostname !== '127.0.0.1' || url.port !== '55439' || url.pathname !== '/student_flow_test')
    throw Error('Refusing to reset a database other than 127.0.0.1:55439/student_flow_test.');
  const client = new Client({ connectionString: target, connectionTimeoutMillis: 10000 });
  await client.connect();
  try {
    console.log('Resetting disposable localhost student_flow_test using backend/DB.');
    await client.query(fs.readFileSync(path.resolve(__dirname, '../DB'), 'utf8'));
  } finally { await client.end(); }
  execFileSync(process.execPath, ['--test', process.argv[2] === '--tasks' ? 'tests/student-task.integration.cjs' : 'tests/student-flow.integration.cjs'], {
    cwd: path.resolve(__dirname, '..'), env: process.env, stdio: 'inherit',
  });
}
main().catch(error => { console.error(error.code || error.message); process.exitCode = 1; });
