const assert = require('node:assert/strict');
const test = require('node:test');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const loadSource = require('./helpers/load-source.cjs');

test('legacy enterprise entry delegates to the semester importer without the student validator', async () => {
  const calls = [];
  const service = loadSource('src/modules/imports/import.service.ts', {
    '../../config/database': {}, '../students/academic-import.service': {}, '../students/complete-import.service': {},
    '../qhdn/enterprise-import.service': { importEnterprises: async (...args) => { calls.push(args); return { delegated: true }; } },
  });
  const body = { kind: 'ENTERPRISE', ojtSemesterId: 7, rows: [] };
  assert.deepEqual(await service.importAccounts(body, 10, true), { delegated: true });
  assert.deepEqual(calls, [[body, 10, true]]);
});

test('student preview, commit and commit-hook replay preserve the original SQL, hash and result', async () => {
  const original = execFileSync('git', ['show', 'HEAD:backend/src/modules/imports/import.service.ts'], {
    cwd: path.resolve(__dirname, '../..'), encoding: 'utf8',
  });
  async function run(source, preview, replay = false) {
    const calls = [];
    const query = async (sql, args) => {
      calls.push([sql, args]);
      let rows = [];
      if (sql.startsWith('SELECT r."RoleCode"')) rows = [{ RoleCode: 'ACADEMIC' }];
      if (sql.startsWith('SELECT * FROM "AccountImportBatches"') && replay) rows = [{ BatchID: 20, PayloadHash: require('node:crypto').createHash('sha256').update(JSON.stringify({ kind: 'STUDENT', rows: [{ code: 'SV1', email: 'sv@fixture.test', fullName: 'Student' }] })).digest('hex'), ImportedBy: 1, Summary: { created: 0, updated: 1, total: 1 } }];
      if (sql.startsWith('SELECT "BatchID" FROM "AcademicImportBatches"')) rows = [{ BatchID: 'history' }];
      if (sql.startsWith('SELECT s."StudentID"')) rows = [{ entity_id: 2, UserID: 3, Email: 'sv@fixture.test', RoleCode: 'STUDENT' }];
      if (sql.startsWith('SELECT "UserID" FROM "Users"')) rows = [{ UserID: 3 }];
      if (sql.startsWith('INSERT INTO "AccountImportBatches"')) rows = [{ BatchID: 20 }];
      return { rows, rowCount: rows.length };
    };
    const service = loadSource('src/modules/imports/import.service.ts', {
      '../../config/database': { pool: { connect: async () => ({ query, release: () => calls.push(['release']) }) } },
      '../students/academic-import.service': { saveHistory: async (...args) => { calls.push(['history', ...args.slice(1)]); return 'history'; }, recordRejected: async () => assert.fail('No rejection expected'), safeRow: row => row },
      '../students/complete-import.service': { importAcademicProfile: async (_client, ...args) => calls.push(['profile', ...args]) },
      '../recruitment/recruitment.repository': {},
      '../qhdn/enterprise-import.service': { importEnterprises: async () => assert.fail('Student import must stay separate') },
    }, source);
    const result = await service.importAccounts({ kind: 'STUDENT', idempotencyKey: 'student-fixture', rows: [{ code: 'SV1', email: 'sv@fixture.test', fullName: 'Student' }] }, 1, preview,
      async (_client, value) => calls.push(['hook', value]));
    return { result, calls };
  }
  for (const [preview, replay] of [[true, false], [false, false], [false, true]]) {
    assert.deepEqual(await run(undefined, preview, replay), await run(original, preview, replay));
  }
});
