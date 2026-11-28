const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { createHash } = require('node:crypto');

const root = path.resolve(__dirname, '..');
const actor = { userId: 11, roleCode: 'ENTERPRISE' };

function fixture(evaluationStatus = null) {
  const state = { tasks: [], audits: [], commits: 0, rollbacks: 0 };
  const assignments = new Map([
    [1, { AssignmentID: 1, EnterpriseID: 7, Status: 'ACTIVE', evaluationStatus }],
    [2, { AssignmentID: 2, EnterpriseID: 7, Status: 'ACTIVE', evaluationStatus: null }],
  ]);
  const client = { query: async (sql, args = []) => {
    if (sql.includes("'InternshipTaskBatch'")) return { rows: [] };
    if (sql.includes('AS "EvaluationFinalized"')) return {
      rows: args[0].filter(id => assignments.has(id)).map(id => ({
        ...assignments.get(id), EvaluationFinalized: assignments.get(id).evaluationStatus === 'SUBMITTED',
      })),
    };
    if (sql.startsWith('SELECT to_char(clock_timestamp()')) return { rows: [{ instant: '2026-11-28T12:00:00.000000' }] };
    if (sql.includes('CROSS JOIN unnest($2::timestamp[])')) return { rows: [], rowCount: 0 };
    if (sql.includes('SELECT count(*)=2 AS ready')) return { rows: [{ ready: true }] };
    if (sql.startsWith('INSERT INTO "InternshipTasks"')) {
      const rows = args[0].map((assignmentId, index) => ({ id: index + 1, assignmentId, assignedAt: args[4] }));
      state.tasks.push(...rows);
      return { rows };
    }
    throw new Error('Unexpected query: ' + sql);
  } };
  const mocks = {
    'modules/academic/academic.repository.ts': {
      academicTransaction: async work => {
        const before = { tasks: [...state.tasks], audits: [...state.audits] };
        try { const result = await work(client); state.commits++; return result; }
        catch (error) { Object.assign(state, before); state.rollbacks++; throw error; }
      },
      audit: async (...args) => state.audits.push(args),
    },
    'modules/qhdn/read.repository.ts': {},
    'modules/qhdn/catalog.service.ts': { enterpriseScope: async () => 7 },
    'modules/eligibility/eligibility.service.ts': {
      fingerprint: value => createHash('sha256').update(JSON.stringify(value)).digest('hex'),
    },
    'shared/list-context.ts': {},
    'modules/enterprise/enterprise-periods.ts': {},
  };
  const cache = new Map();
  function load(file) {
    file = file.replaceAll('\\', '/');
    if (mocks[file]) return mocks[file];
    if (cache.has(file)) return cache.get(file).exports;
    const mod = { exports: {} };
    cache.set(file, mod);
    const code = ts.transpileModule(fs.readFileSync(path.join(root, 'src', file), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const localRequire = name => name.startsWith('.') ? load(path.join(path.dirname(file), name + '.ts')) : require(name);
    vm.runInThisContext('(function(require,module,exports){' + code + '\n})', { filename: file })(localRequire, mod, mod.exports);
    return mod.exports;
  }
  const { assignTasks } = load('modules/qhdn/task.service.ts');
  const assign = ids => assignTasks({
    assignmentIds: ids, idempotencyKey: 'task-assignment-regression',
    tasks: [{ name: 'Complete the project', dueDate: '2026-12-01T17:00' }],
  }, actor);
  return { state, assignments, assign };
}

test('ongoing internships without finalized scores can receive tasks, including saved drafts', async () => {
  for (const status of [null, 'DRAFT']) {
    const f = fixture(status);
    assert.equal((await f.assign([1, 2])).created, 2);
    assert.equal(f.state.tasks.length, 2);
    assert.equal(f.state.commits, 1);
  }
});

test('submitted scores block task assignment even while the internship is ACTIVE', async () => {
  const f = fixture('SUBMITTED');
  await assert.rejects(() => f.assign([1]), { statusCode: 409, errorCode: 'OJT_SCORE_FINALIZED' });
  assert.equal(f.state.tasks.length, 0);
  assert.equal(f.state.audits.length, 0);
  assert.equal(f.state.rollbacks, 1);
});

test('a finalized student prevents partial task creation for a mixed batch', async () => {
  const f = fixture('SUBMITTED');
  await assert.rejects(() => f.assign([2, 1]), { errorCode: 'OJT_SCORE_FINALIZED' });
  assert.equal(f.state.tasks.length, 0);
  assert.equal(f.state.commits, 0);
});

test('ownership and active internship restrictions still apply', async () => {
  const foreign = fixture();
  foreign.assignments.get(1).EnterpriseID = 8;
  await assert.rejects(() => foreign.assign([1]), { statusCode: 403, errorCode: 'FORBIDDEN' });
  const completed = fixture();
  completed.assignments.get(1).Status = 'COMPLETED';
  await assert.rejects(() => completed.assign([1]), { statusCode: 409 });
  assert.equal(foreign.state.tasks.length + completed.state.tasks.length, 0);
});
