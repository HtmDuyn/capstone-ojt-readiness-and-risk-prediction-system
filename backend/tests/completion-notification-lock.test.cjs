const { test } = require('node:test');
const assert = require('node:assert/strict');
delete process.env.DATABASE_URL;
delete process.env.SUPABASE_DATABASE_URL;
process.env.LOCAL_DATABASE_URL = 'postgresql://postgres@127.0.0.1:1/unused';
const { pool } = require('../dist/config/database');
const { notifyCompletedInternships } = require('../dist/modules/ojt-results/completion-notification.service');

test('result worker yields to imports and retries after the calendar lock is released', async t => {
  let acquired = false;
  let released = 0;
  const statements = [];
  t.mock.method(pool, 'connect', async () => ({
    release() { released++; },
    async query(sql) {
      statements.push(sql);
      if (sql.includes('pg_try_advisory_xact_lock')) return { rows: [{ acquired }] };
      if (sql.includes('FROM "InternshipEvaluations" ev')) return { rows: [] };
      if (['BEGIN', 'ROLLBACK', 'COMMIT'].includes(sql) || sql.startsWith('SET LOCAL')) return { rows: [] };
      throw new Error('Unexpected database operation');
    },
  }));
  t.after(() => pool.end());
  assert.equal(await notifyCompletedInternships(), 0);
  assert.ok(statements.includes('ROLLBACK'));
  assert.ok(!statements.some(sql => sql.includes('FROM "InternshipEvaluations" ev')));
  acquired = true;
  assert.equal(await notifyCompletedInternships(), 0);
  assert.ok(statements.includes('COMMIT'));
  assert.equal(released, 2);
});
