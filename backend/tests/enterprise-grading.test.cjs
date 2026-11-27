const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
const criteria = [
  { key: 'criterion_1', label: 'Chuyên ngành', weight: 40 },
  { key: 'criterion_2', label: 'Kỹ năng mềm', weight: 30 },
  { key: 'criterion_3', label: 'Thái độ', weight: 30 },
];
const template = { TemplateID: 7, OJTSemesterID: 1, Name: 'Quy ước OJT', Version: 1, Criteria: criteria };
const actor = { userId: 1, roleCode: 'ENTERPRISE' };
const details = { criterion_1: 10, criterion_2: 5, criterion_3: 0 };

// Execute the real TS services and validation with isolated repository boundaries.
// No test opens a database connection or changes application data.
function fixture(issued = template) {
  const state = { issued, evaluations: new Map(), foreign: new Set(), transferred: new Set(), inactive: new Set(), commits: 0 };
  const client = { query: async (sql, args) => {
    if (sql.includes('FROM "OJTResults"')) return { rows: [], rowCount: Number(state.transferred.has(args[0])) };
    if (sql.includes('FROM "InternshipEvaluations"')) return { rows: state.evaluations.has(args[0]) ? [state.evaluations.get(args[0])] : [] };
    if (sql.includes('FROM "StudentEnterpriseCoordination"')) return { rows: [{ OJTSemesterID: args[0] }] };
    if (sql.includes('FROM "InternshipAssignments"')) return { rows: [{ OJTSemesterID: 1, EnterpriseID: state.foreign.has(args[0]) ? 2 : 1 }] };
    if (sql.includes('FROM "AssessmentTemplates"')) return { rows: state.issued ? [state.issued] : [] };
    throw new Error('Unexpected query: ' + sql);
  } };
  const mocks = {
    'backend/src/modules/academic/academic.repository.ts': { academicTransaction: async work => {
      const before = new Map(state.evaluations);
      try { const value = await work(client); state.commits++; return value; }
      catch (error) { state.evaluations = before; throw error; }
    } },
    'backend/src/modules/qhdn/catalog.service.ts': {
      record: async (c, resource, id) => ({ EnterpriseID: state.foreign.has(id) ? 2 : 1, CoordinationID: id, Status: state.inactive.has(id) ? 'CANCELLED' : 'ACTIVE' }),
      assertScope: async (c, user, enterpriseId) => { if (enterpriseId !== 1) throw Object.assign(new Error('Forbidden'), { errorCode: 'FORBIDDEN' }); },
      persist: async (c, resource, values) => {
        const row = { ...values, EvaluationID: values.AssignmentID };
        state.evaluations.set(values.AssignmentID, row);
        return row;
      },
      log: async () => {}, api: (resource, row) => row,
    },
  };
  const cache = new Map();
  function load(file) {
    file = file.replaceAll('\\', '/');
    if (mocks[file]) return mocks[file];
    if (cache.has(file)) return cache.get(file).exports;
    const mod = { exports: {} };
    cache.set(file, mod);
    const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const requireLocal = name => name.startsWith('.') ? load(path.join(path.dirname(file), name + '.ts')) : require(name);
    vm.runInThisContext('(function(require,module,exports){' + code + '\n})', { filename: file })(requireLocal, mod, mod.exports);
    return mod.exports;
  }
  const service = load('backend/src/modules/enterprise/bulk-evaluation.service.ts');
  const ui = load('frontend/src/utils/enterprise/enterpriseEvaluation.ts');
  const grading = load('backend/src/modules/academic/grading-criteria.service.ts');
  const item = (scoreDetails = details, extra = {}) => ({ assignmentId: 1, templateId: 7, scoreDetails, ...extra });
  const bulk = (items = [item()], status = 'SUBMITTED', user = actor) => service.bulkEvaluate({ items, status, confirmed: true, reason: 'Kiểm tra quy ước' }, user);
  return { state, service, ui, grading, client, item, bulk };
}

test('issued criteria determine the weighted total and round identically in the UI', async () => {
  const f = fixture();
  const saved = (await f.bulk()).items[0];
  assert.equal(saved.OverallScore, 5.5);
  assert.equal(saved.TemplateID, 7);
  assert.equal(saved.Status, 'SUBMITTED');
  assert.ok(saved.EvaluatedAt instanceof Date);
  assert.equal(saved.CompletionScore, null);
  assert.deepEqual(saved.ScoreDetails, details);
  assert.equal(f.ui.evaluationAverage({ criteria, scoreDetails: { criterion_1: '10', criterion_2: '5', criterion_3: '0' } }), 5.5);
});

test('arbitrary numbers of criteria and decimal weights replace the fixed three columns', async () => {
  const issued = { ...template, Criteria: [{ key: 'a', weight: 12.5 }, { key: 'b', weight: 12.5 }, { key: 'c', weight: 25 }, { key: 'd', weight: 50 }] };
  const f = fixture(issued);
  const scores = { a: 8.01, b: 0, c: 7, d: 10 };
  assert.equal((await f.bulk([f.item(scores)])).items[0].OverallScore, 7.75);
  const half = fixture({ ...template, Criteria: [{ key: 'a', weight: 50 }, { key: 'b', weight: 50 }] });
  assert.equal((await half.bulk([half.item({ a: 1, b: 1.01 })])).items[0].OverallScore, 1.01);
  assert.equal(half.ui.evaluationAverage({ criteria: half.state.issued.Criteria, scoreDetails: { a: '1', b: '1.01' } }), 1.01);
});

test('zero is a valid official score and a draft with missing scores has no total', async () => {
  const f = fixture();
  const partial = { ...details, criterion_2: null };
  const draft = (await f.bulk([f.item(partial)], 'DRAFT')).items[0];
  assert.equal(draft.OverallScore, null);
  assert.equal(draft.EvaluatedAt, null);
  assert.equal(f.ui.evaluationAverage({ criteria, scoreDetails: { criterion_1: '10', criterion_2: '', criterion_3: '0' } }), null);
  const zeros = { criterion_1: 0, criterion_2: 0, criterion_3: 0 };
  assert.equal((await f.bulk([f.item(zeros)])).items[0].OverallScore, 0);
});

test('missing publication or a stale template blocks draft and official writes', async () => {
  for (const status of ['DRAFT', 'SUBMITTED']) {
    const missing = fixture(null);
    await assert.rejects(() => missing.bulk([missing.item()], status), { errorCode: 'GRADING_CRITERIA_NOT_PUBLISHED' });
    const stale = fixture({ ...template, TemplateID: 8 });
    await assert.rejects(() => stale.bulk([stale.item()], status), { errorCode: 'GRADING_TEMPLATE_CHANGED' });
  }
});

test('legacy columns and client totals cannot bypass the academic convention', async () => {
  const f = fixture();
  await assert.rejects(() => f.bulk([{ assignmentId: 1, completionScore: 10, skillScore: 10, attitudeScore: 10 }]), { errorCode: 'GRADING_TEMPLATE_REQUIRED' });
  await assert.rejects(() => f.bulk([{ assignmentId: 1, templateId: 7, completionScore: 10 }]), { errorCode: 'CRITERIA_SCORES_REQUIRED' });
  const saved = await f.service.submitEvaluation(1, { templateId: 7, scoreDetails: details, overallScore: 10, completionScore: 10, reason: 'Gửi chính thức' }, actor);
  assert.equal(saved.OverallScore, 5.5);
  assert.equal(saved.CompletionScore, null);
});

test('keys must match exactly and official submission requires every score', async () => {
  for (const bad of [{ criterion_1: 10 }, { ...details, extra: 8 }, { criterion_1: 10, criterion_2: 5, wrong: 0 }]) {
    for (const status of ['DRAFT', 'SUBMITTED']) {
      const f = fixture();
      await assert.rejects(() => f.bulk([f.item(bad)], status), { errorCode: 'CRITERIA_SCORES_REQUIRED' });
    }
  }
  const f = fixture();
  await assert.rejects(() => f.bulk([f.item({ ...details, criterion_2: null })]), { errorCode: 'CRITERIA_SCORES_REQUIRED' });
});

test('invalid score values are rejected on both bulk and single endpoints', async () => {
  for (const bad of [-1, 10.01, 1.001, '8', NaN, Infinity]) {
    const f = fixture();
    const scoreDetails = { ...details, criterion_1: bad };
    await assert.rejects(() => f.bulk([f.item(scoreDetails)]));
    await assert.rejects(() => f.service.submitEvaluation(1, { templateId: 7, scoreDetails, reason: 'Gửi điểm' }, actor));
  }
});

test('an explicit null official payload never restores scores from an earlier draft', async () => {
  const f = fixture();
  await f.bulk([f.item()], 'DRAFT');
  await assert.rejects(() => f.bulk([f.item({ criterion_1: null, criterion_2: null, criterion_3: null })]), { errorCode: 'CRITERIA_SCORES_REQUIRED' });
  assert.equal(f.state.evaluations.get(1).Status, 'DRAFT');
});

test('official evaluations are immutable and retries ignore JSON property order', async () => {
  const f = fixture();
  await f.bulk();
  const replay = await f.bulk([f.item({ criterion_3: 0, criterion_2: 5, criterion_1: 10 })]);
  assert.equal(replay.items[0].replayed, true);
  await assert.rejects(() => f.bulk([f.item({ ...details, criterion_1: 9 })]), { errorCode: 'OJT_SCORE_FINALIZED' });
  await assert.rejects(() => f.bulk([f.item()], 'DRAFT'), { errorCode: 'OJT_SCORE_FINALIZED' });
});

test('role, ownership, assignment status, and transferred-result guards remain enforced', async () => {
  const f = fixture();
  await assert.rejects(() => f.bulk([f.item()], 'SUBMITTED', { ...actor, roleCode: 'ACADEMIC' }), { errorCode: 'FORBIDDEN' });
  f.state.foreign.add(1);
  await assert.rejects(() => f.bulk(), { errorCode: 'FORBIDDEN' });
  f.state.foreign.clear(); f.state.inactive.add(1);
  await assert.rejects(() => f.bulk(), { errorCode: 'ASSIGNMENT_NOT_ACTIVE' });
  f.state.inactive.clear(); f.state.transferred.add(1);
  await assert.rejects(() => f.bulk(), { errorCode: 'OJT_RESULT_CONFIRMED' });
});

test('a bad row rolls back the complete batch', async () => {
  const f = fixture();
  await assert.rejects(() => f.bulk([f.item(), f.item({ ...details, criterion_1: null }, { assignmentId: 2 })]), { errorCode: 'CRITERIA_SCORES_REQUIRED' });
  assert.equal(f.state.evaluations.size, 0);
  assert.equal(f.state.commits, 0);
});

test('bulk Apply edits the issued scoreDetails and preserves other criteria and the original row', () => {
  const f = fixture();
  const row = { criteria, scoreDetails: { criterion_1: '', criterion_2: '4', criterion_3: '0' } };
  const applied = f.ui.applyEvaluationScore(row, 'criterion_1', '8');
  assert.deepEqual(applied.scoreDetails, { criterion_1: '8', criterion_2: '4', criterion_3: '0' });
  assert.equal(row.scoreDetails.criterion_1, '');
  assert.deepEqual(f.ui.applyEvaluationScore(row, null, '9').scoreDetails, { criterion_1: '9', criterion_2: '9', criterion_3: '9' });
  assert.equal(f.ui.evaluationAverage({ criteria: [], scoreDetails: {} }), null);
});

test('the criteria endpoint enforces enterprise ownership and never invents default criteria', async () => {
  const f = fixture();
  const issued = await f.grading.getEnterpriseGradingCriteria({ assignmentId: 1 }, actor);
  assert.equal(issued.id, 7);
  assert.deepEqual(issued.criteria, criteria);
  f.state.foreign.add(1);
  await assert.rejects(() => f.grading.getEnterpriseGradingCriteria({ assignmentId: 1 }, actor), { errorCode: 'FORBIDDEN' });
  const missing = fixture(null);
  const empty = await missing.grading.activeCriteria(missing.client, 1);
  assert.equal(empty.id, null);
  assert.deepEqual(empty.criteria, []);
});
