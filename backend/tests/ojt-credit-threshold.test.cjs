const assert = require('node:assert/strict');
const { test } = require('node:test');
const repository = require('../dist/modules/academic/academic.repository');
const { saveFrontendResults } = require('../dist/modules/eligibility/frontend-results.service');
const { createCreditThreshold } = require('../dist/modules/eligibility/credit-threshold.service');

test('creating a credit threshold rejects an existing value and invalid precision', async t => {
  const stored = new Set();
  t.mock.method(repository, 'academicTransaction', work => work({
    async query(sql, args) {
      if (!sql.includes('INSERT INTO "OJTCreditThresholds"')) return { rows: [] };
      const [minCredits] = args;
      if (stored.has(minCredits)) return { rows: [] };
      stored.add(minCredits);
      return { rows: [{ id: stored.size, minCredits }] };
    },
  }));
  assert.deepEqual(await createCreditThreshold({ minCredits: 75 }, 7), { id: 1, minCredits: 75 });
  await assert.rejects(createCreditThreshold({ minCredits: 75.00 }, 7), { errorCode: 'OJT_THRESHOLD_EXISTS' });
  await assert.rejects(createCreditThreshold({ minCredits: 75.001 }, 7));
});

test('saves eligibility under the selected threshold and rejects a mismatched threshold', async t => {
  let saved;
  t.mock.method(repository, 'academicTransaction', work => work({
    async query(sql, args) {
      if (sql.includes('FROM "OJTConditionPolicies"')) return { rows: [{ Version: 3, MinCredits: '70', MaxUnpassedCourses: 2 }] };
      if (sql.includes('FROM "OJTCreditThresholds"')) return { rows: args[0] === 5 ? [{ MinCredits: '75' }] : [] };
      if (sql.includes('FROM "Users"')) return { rows: [{ RoleCode: 'ACADEMIC' }] };
      if (sql.includes('FROM "Students" s')) return { rows: [{ StudentID: 1, ProgramID: 2, Status: 'ACTIVE', AccountStatus: 'ACTIVE' }] };
      if (sql.startsWith('INSERT INTO "OJTEligibilityResultBatches"')) return { rows: [{ BatchID: 10, SavedAt: new Date() }] };
      if (sql.startsWith('INSERT INTO "StudentOJTCalculatedResults"')) saved = JSON.parse(args[0])[0];
      return { rows: [] };
    },
  }));

  const payload = {
    idempotencyKey: 'threshold-test',
    source: 'FRONTEND',
    rule: { version: 3, thresholdId: 5, minCredits: 75 },
    results: [{ studentId: 1, status: 'ELIGIBLE', earnedCredits: 75, unpassedCourseCount: 3,
      reasons: [], academicIssues: [], checkedAt: new Date().toISOString() }],
  };
  assert.equal((await saveFrontendResults(payload, 7)).savedCount, 1);
  assert.equal(saved.status, 'ELIGIBLE');
  assert.deepEqual(saved.rule, payload.rule);

  await assert.rejects(saveFrontendResults({ ...payload, rule: { ...payload.rule, minCredits: 70 } }, 7),
    { errorCode: 'OJT_POLICY_CHANGED' });
  await assert.rejects(saveFrontendResults({ ...payload, rule: { ...payload.rule, thresholdId: 99 } }, 7),
    { errorCode: 'OJT_THRESHOLD_NOT_FOUND' });
});
