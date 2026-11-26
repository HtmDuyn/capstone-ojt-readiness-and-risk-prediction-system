const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
const now = new Date('2026-11-26T05:00:00Z');
function payload(periodId = 1) {
  return {
    academicPeriodId: periodId, name: 'OJT Fall 2026',
    startsAt: '2026-11-27T02:00:00Z', endsAt: '2026-12-20T10:00:00Z',
    rounds: [{ name: 'OJT Fall 2026',
      postingStartsAt: '2026-11-27T02:00:00Z', postingEndsAt: '2026-11-28T02:00:00Z',
      applicationStartsAt: '2026-11-28T02:00:00Z', applicationEndsAt: '2026-12-05T10:00:00Z',
      resultsStartsAt: '2026-11-28T02:00:00Z', resultsEndsAt: '2026-12-20T10:00:00Z',
    }],
  };
}

// Run the real service, schedule validation and academicTransaction. The pool
// below models the shared transaction lock and keeps all writes in memory.
function fixture({ status = 'ACTIVE', kind = 'SEMESTER', windows = [], campaigns = [] } = {}) {
  const state = { windows: [...windows], campaigns: [...campaigns], registrations: [], notifications: 0, commits: 0, rollbacks: 0, locks: 0 };
  let nextId = 100;
  let queue = Promise.resolve();
  const pool = { connect: async () => {
    const pending = { windows: [], campaigns: [], registrations: [], notifications: 0 };
    let unlock;
    const client = { pending, release() {}, async query(sql, args = []) {
      if (sql === 'BEGIN' || sql.startsWith('SET LOCAL')) return { rows: [] };
      if (sql.includes('pg_advisory_xact_lock')) {
        state.locks++;
        const previous = queue;
        queue = new Promise(resolve => { unlock = resolve; });
        await previous;
        return { rows: [] };
      }
      if (sql === 'COMMIT' || sql === 'ROLLBACK') {
        if (sql === 'COMMIT') {
          for (const key of ['windows', 'campaigns', 'registrations']) state[key].push(...pending[key]);
          state.notifications += pending.notifications;
          state.commits++;
        } else state.rollbacks++;
        unlock?.();
        return { rows: [] };
      }
      if (sql.includes('AS "hasRecruitment"')) return { rows: [{ hasRecruitment:
        state.windows.some(row => row.AcademicPeriodID === args[0] || row.OJTSemesterID === args[1]) ||
        state.campaigns.some(row => row.OJTSemesterID === args[1]),
      }] };
      if (sql === 'SELECT clock_timestamp() AS now') return { rows: [{ now }] };
      if (sql.startsWith('INSERT INTO "RecruitmentCampaigns"')) {
        const row = { CampaignID: nextId++, OJTSemesterID: args[0], Name: args[1], StartsAt: args[3], EndsAt: args[4] };
        pending.campaigns.push(row);
        return { rows: [row], rowCount: 1 };
      }
      if (sql.startsWith('SELECT 1 FROM "RecruitmentWindows"')) return { rows: [], rowCount: 0 };
      if (sql.includes('FROM "Users" u JOIN "Roles"')) return { rows: [{}], rowCount: 1 };
      if (sql.startsWith('INSERT INTO "RecruitmentWindows"')) {
        const row = { WindowID: nextId++, AcademicPeriodID: args[0], OJTSemesterID: args[1], Name: args[2],
          StartsAt: args[3], EndsAt: args[4], CampaignID: args[6], RoundNumber: args[7], Status: 'DRAFT' };
        pending.windows.push(row);
        return { rows: [row], rowCount: 1 };
      }
      if (sql.startsWith('INSERT INTO "OJTRegistrationWindows"')) {
        pending.registrations.push({ OJTSemesterID: args[0], RecruitmentRoundID: args[6] });
        return { rows: [], rowCount: 1 };
      }
      if (sql.startsWith('INSERT INTO "AuditLogs"')) return { rows: [], rowCount: 1 };
      throw new Error('Unexpected query: ' + sql);
    } };
    return client;
  } };
  const mocks = {
    'backend/src/config/database.ts': { pool },
    'backend/src/shared/list-context.ts': {},
    'backend/src/modules/academic-reporting/block-calendar.ts': {},
    'backend/src/modules/qhdn/read.repository.ts': {},
    'backend/src/modules/academic/workflow-policy.ts': {
      actualPeriod: async (_client, id) => ({ AcademicPeriodID: id, Kind: kind, CalendarStatus: status }),
      periodBounds: () => ({ end: new Date('2027-01-01T00:00:00Z') }),
    },
    'backend/src/modules/academic/ojt-semester-link.ts': { ensureOjtSemesterForPeriod: async (_client, id) => id + 10 },
    'backend/src/modules/recruitment/lifecycle.service.ts': { requireLifecycleSchema: async () => {} },
    'backend/src/modules/recruitment/round-policy.ts': {
      requireRecruitmentSchema: async () => {}, requireThreePhaseSchema: async () => {}, hasPhaseSchedule: () => false,
    },
    'backend/src/modules/recruitment/schedule.service.ts': { requireScheduleEditingSchema: async () => {} },
    'backend/src/modules/recruitment/notification.service.ts': {
      notifyRecruitmentCreated: async client => { client.pending.notifications++; },
    },
    'backend/src/modules/recruitment/recruitment.repository.ts': {
      windowRecord: async (client, id) => [...state.windows, ...client.pending.windows].find(row => row.WindowID === id),
      windowApi: row => ({ id: row.WindowID, roundNumber: row.RoundNumber, status: row.Status }),
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
  return { state, service: load('backend/src/modules/recruitment/window.service.ts'), load };
}

test('an ongoing regular semester creates one intake, one application window and its notice', async () => {
  const f = fixture();
  const saved = await f.service.saveWindow(payload(), 7);
  assert.equal(saved.rounds.length, 1);
  assert.equal(saved.rounds[0].roundNumber, 1);
  assert.equal(f.state.windows.length, 1);
  assert.equal(f.state.campaigns.length, 1);
  assert.equal(f.state.registrations.length, 1);
  assert.equal(f.state.notifications, 1);
});

for (const phase of ['DRAFT', 'OPEN', 'CLOSED', 'FINALIZED']) {
  test(`an existing ${phase} intake blocks a second intake, including supplemental requests`, async () => {
    const f = fixture({ windows: [{ WindowID: 1, AcademicPeriodID: 1, OJTSemesterID: 11,
      Status: phase === 'FINALIZED' ? 'CLOSED' : phase, ResultsFinalizedAt: phase === 'FINALIZED' ? now : null }] });
    for (const supplemental of [undefined, false, true]) {
      await assert.rejects(() => f.service.saveWindow({ ...payload(), ...(supplemental === undefined ? {} : { supplemental }) }, 7),
        { statusCode: 409, errorCode: 'RECRUITMENT_CAMPAIGN_EXISTS' });
    }
    assert.equal(f.state.windows.length, 1);
    assert.equal(f.state.campaigns.length, 0);
    assert.equal(f.state.notifications, 0);
  });
}

test('an existing campaign also locks creation if the round list is empty', async () => {
  const f = fixture({ campaigns: [{ CampaignID: 4, OJTSemesterID: 11 }] });
  await assert.rejects(() => f.service.saveWindow(payload(), 7), { errorCode: 'RECRUITMENT_CAMPAIGN_EXISTS' });
});

test('a duplicate bound to the same academic period is blocked even if its OJT link differs', async () => {
  const f = fixture({ windows: [{ AcademicPeriodID: 1, OJTSemesterID: 99 }] });
  await assert.rejects(() => f.service.saveWindow(payload(), 7), { errorCode: 'RECRUITMENT_CAMPAIGN_EXISTS' });
});

test('two simultaneous create requests commit exactly one intake', async () => {
  const f = fixture();
  const results = await Promise.allSettled([f.service.saveWindow(payload(), 7), f.service.saveWindow(payload(), 7)]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(results.find(result => result.status === 'rejected').reason.errorCode, 'RECRUITMENT_CAMPAIGN_EXISTS');
  assert.equal(f.state.windows.length, 1);
  assert.equal(f.state.notifications, 1);
  assert.equal(f.state.commits, 1);
  assert.equal(f.state.rollbacks, 1);
  assert.equal(f.state.locks, 2);
});

test('a different ongoing semester can create its own intake', async () => {
  const f = fixture();
  await f.service.saveWindow(payload(1), 7);
  await f.service.saveWindow(payload(2), 7);
  assert.deepEqual(f.state.windows.map(row => row.AcademicPeriodID), [1, 2]);
});

test('planned, closed and archived semesters and Block 3 cannot create an intake', async () => {
  for (const options of [{ status: 'PLANNED' }, { status: 'CLOSED' }, { status: 'ARCHIVED' }, { kind: 'BLOCK3' }]) {
    const f = fixture(options);
    await assert.rejects(() => f.service.saveWindow(payload(), 7), { errorCode: 'RECRUITMENT_PERIOD_NOT_ACTIVE' });
    assert.equal(f.state.windows.length, 0);
  }
});

test('one request cannot create zero or multiple rounds, and cannot request a supplemental round', async () => {
  const f = fixture();
  const b = payload();
  for (const rounds of [undefined, [], [b.rounds[0], b.rounds[0]]]) {
    await assert.rejects(() => f.service.saveWindow({ ...b, rounds }, 7), { errorCode: 'RECRUITMENT_SINGLE_ROUND_REQUIRED' });
  }
  await assert.rejects(() => f.service.saveWindow({ ...b, supplemental: true }, 7), { errorCode: 'RECRUITMENT_SUPPLEMENTAL_NOT_ALLOWED' });
  assert.equal(f.state.windows.length, 0);
  assert.equal(f.state.campaigns.length, 0);
});

test('a failed schedule does not reserve an intake or prevent a corrected request', async () => {
  const f = fixture();
  const bad = payload();
  bad.rounds[0].applicationEndsAt = bad.rounds[0].applicationStartsAt;
  await assert.rejects(() => f.service.saveWindow(bad, 7));
  await f.service.saveWindow(payload(), 7);
  assert.equal(f.state.windows.length, 1);
});

test('the published API schema permits exactly one round and only supplemental=false', () => {
  const spec = { paths: {} };
  fixture().load('backend/src/modules/recruitment/recruitment.openapi.ts').addRecruitmentOperations(spec);
  const schema = spec.paths['/api/recruitment/windows'].post.requestBody.content['application/json'].schema;
  assert.equal(schema.properties.rounds.minItems, 1);
  assert.equal(schema.properties.rounds.maxItems, 1);
  assert.deepEqual(schema.properties.supplemental.enum, [false]);
});
