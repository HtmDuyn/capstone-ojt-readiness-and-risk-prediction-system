const { test } = require('node:test');
const assert = require('node:assert/strict');
delete process.env.DATABASE_URL;
delete process.env.SUPABASE_DATABASE_URL;
process.env.LOCAL_DATABASE_URL = 'postgresql://postgres@127.0.0.1:1/unused';
const { pool } = require('../dist/config/database');
const { expireRecruitment } = require('../dist/modules/recruitment/post.service');
const { advanceEnterpriseRecruitment } = require('../dist/modules/enterprise/enterprise-recruitment.worker');

test('recruitment workers yield on contention, retry, and surface other errors', async t => {
  t.after(() => pool.end());
  for (const worker of [expireRecruitment, advanceEnterpriseRecruitment]) {
    await t.test(worker.name, async child => {
      let acquired = false;
      let failure;
      let released = 0;
      const statements = [];
      child.mock.method(pool, 'connect', async () => ({
        release() { released++; },
        async query(sql) {
          statements.push(sql);
          if (sql.includes('pg_try_advisory_xact_lock')) return { rows: [{ acquired }] };
          if (['BEGIN', 'ROLLBACK', 'COMMIT'].includes(sql) || sql.startsWith('SET LOCAL')) return { rows: [] };
          if (failure) throw failure;
          // No recruitment schema/windows ready, and no enterprise transitions due.
          return { rows: [{ ready: false, continued: 0 }], rowCount: 0 };
        },
      }));
      assert.equal(await worker(), 0);
      assert.ok(statements.includes('ROLLBACK'));
      assert.ok(!statements.some(sql => sql.startsWith('UPDATE')));
      acquired = true;
      assert.equal(await worker(), 0);
      assert.ok(statements.includes('COMMIT'));
      failure = Object.assign(new Error('row lock timeout'), { code: '55P03' });
      assert.equal(await worker(), 0);
      failure = Object.assign(new Error('missing schema'), { code: '42P01' });
      await assert.rejects(worker(), { code: '42P01' });
      assert.equal(released, 4);
    });
  }
});
