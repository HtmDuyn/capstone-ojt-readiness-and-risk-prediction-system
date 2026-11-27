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
    startsAt: '2026-11-27T02:00:00Z', endsAt: '2026-12-06T10:00:00Z',
    rounds: [{ name: 'OJT Fall 2026',
      postingStartsAt: '2026-11-27T02:00:00Z', postingEndsAt: '2026-11-28T02:00:00Z',
      applicationStartsAt: '2026-11-28T02:00:00Z', applicationEndsAt: '2026-12-05T10:00:00Z',
      resultsStartsAt: '2026-11-28T02:00:00Z', resultsEndsAt: '2026-12-06T10:00:00Z',
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
          for (const key of ['windows', 'campaigns', 'registrations']) { for (const row of pending[key]) { const id=key==='windows'?'WindowID':key==='campaigns'?'CampaignID':'RecruitmentRoundID'; const index=state[key].findIndex(old=>old[id]===row[id]); if(index<0)state[key].push(row);else state[key][index]=row; } }
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
      const allRows=key=>[...state[key].filter(row=>!pending[key].some(p=>p[key==='windows'?'WindowID':'CampaignID']===row[key==='windows'?'WindowID':'CampaignID'])),...pending[key]];
      if(sql.includes(' AS ready'))return {rows:[{ready:true}]};
      if(sql.includes('set_config'))return {rows:[]};
      if(sql.startsWith('SELECT "WindowID","Name","StartsAt","EndsAt"'))return {rows:allRows('windows').filter(w=>(w.AcademicPeriodID===args[0]||w.OJTSemesterID===args[1])&&w.WindowID!==args[4]&&new Date(w.StartsAt)<args[3]&&new Date(w.EndsAt)>args[2]).slice(0,1)};
      if(sql.startsWith('SELECT * FROM "RecruitmentCampaigns"'))return {rows:allRows('campaigns').filter(c=>c.OJTSemesterID===args[0])};
      if(sql.startsWith('UPDATE "RecruitmentCampaigns"')) {
        const row={...allRows('campaigns').find(c=>c.CampaignID===args[0])};
        row.StartsAt=new Date(Math.min(+new Date(row.StartsAt),+args[1]));row.EndsAt=new Date(Math.max(+new Date(row.EndsAt),+args[2]));
        pending.campaigns.push(row);return {rows:[row]};
      }
      if(sql.startsWith('SELECT COALESCE(max("RoundNumber")'))return {rows:[{nextRound:Math.max(0,...allRows('windows').filter(w=>w.CampaignID===args[0]).map(w=>w.RoundNumber))+1}]};
      if(sql.startsWith('UPDATE "RecruitmentWindows"')) {
        const row={...allRows('windows').find(w=>w.WindowID===args[0]),Name:args[1],Status:args[2]};
        if(args[2]==='OPEN')row.OpenedAt??=now;
        pending.windows.push(row);return {rows:[row]};
      }
      if(sql.startsWith('UPDATE "OJTRegistrationWindows"'))return {rows:[]};
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
          StartsAt: args[3], EndsAt: args[4], CampaignID: args[6], RoundNumber: args[7], PostingStartsAt:args[8],PostingEndsAt:args[9],ApplicationStartsAt:args[10],ApplicationEndsAt:args[11],ResultsStartsAt:args[12],ResultsEndsAt:args[13],Status: 'DRAFT' };
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
      periodBounds: () => ({ start:new Date('2026-09-01T00:00:00+07:00'),end: new Date('2027-01-01T00:00:00+07:00') }),
    },
    'backend/src/modules/academic/ojt-semester-link.ts': { ensureOjtSemesterForPeriod: async (_client, id) => id + 10 },
    'backend/src/modules/recruitment/lifecycle.service.ts': { requireLifecycleSchema: async () => {} },
    'backend/src/modules/recruitment/schedule.service.ts': { requireScheduleEditingSchema: async () => {} },
    'backend/src/modules/recruitment/notification.service.ts': {
      notifyRecruitmentCreated: async client => { client.pending.notifications++; },
    },
    'backend/src/modules/recruitment/recruitment.repository.ts': {
      windowRecord: async (client, id) => ({...[...state.windows, ...client.pending.windows].findLast(row => row.WindowID === id),Kind:kind,CalendarStatus:status,LinkedPeriodID:1,DatabaseNow:now}),
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

function shifted(days, periodId=1) {
 const b=payload(periodId);
 for(const key of ['startsAt','endsAt'])b[key]=new Date(Date.parse(b[key])+days*86400000).toISOString();
 for(const key of Object.keys(b.rounds[0]).filter(k=>k!=='name'))b.rounds[0][key]=new Date(Date.parse(b.rounds[0][key])+days*86400000).toISOString();
 return b;
}
test('first round creates one campaign, application window and notification',async()=>{
 const f=fixture(),saved=await f.service.saveWindow(payload(),7);
 assert.equal(saved.rounds[0].roundNumber,1);assert.equal(f.state.campaigns.length,1);
 assert.equal(f.state.registrations.length,1);assert.equal(f.state.notifications,1);
});
for(const status of ['DRAFT','OPEN','CLOSED','FINALIZED'])test(`a disjoint supplemental round follows ${status} without waiting for finalization`,async()=>{
 const f=fixture();await f.service.saveWindow(payload(),7);
 Object.assign(f.state.windows[0],{Status:status==='FINALIZED'?'CLOSED':status,ResultsFinalizedAt:status==='FINALIZED'?now:null});
 const b=shifted(24);b.supplemental=true;
 const saved=await f.service.saveWindow(b,7);
 assert.equal(saved.rounds[0].roundNumber,2);assert.equal(f.state.windows.length,2);
 assert.equal(f.state.campaigns.length,1);assert.equal(f.state.registrations.length,2);
 assert.equal(+f.state.campaigns[0].EndsAt,Date.parse(b.endsAt));
});
test('adjacent half-open rounds are accepted at the exact previous end',async()=>{
 const f=fixture();await f.service.saveWindow(payload(),7);
 const b=shifted((Date.parse(payload().endsAt)-Date.parse(payload().startsAt))/86400000);
 await f.service.saveWindow(b,7);assert.equal(f.state.windows.length,2);
});
for(const days of [0,1,-0.25,5])test(`overlapping reservation (${days} days) is rejected without partial writes`,async()=>{
 const f=fixture();await f.service.saveWindow(payload(),7);
 await assert.rejects(()=>f.service.saveWindow(shifted(days),7),{statusCode:409,errorCode:'RECRUITMENT_WINDOW_CONFLICT'});
 assert.equal(f.state.windows.length,1);assert.equal(f.state.notifications,1);
});
test('concurrent overlapping requests serialize and commit only one round',async()=>{
 const f=fixture(),results=await Promise.allSettled([f.service.saveWindow(payload(),7),f.service.saveWindow(payload(),7)]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 assert.equal(results.find(r=>r.status==='rejected').reason.errorCode,'RECRUITMENT_WINDOW_CONFLICT');
 assert.equal(f.state.windows.length,1);assert.equal(f.state.commits,1);assert.equal(f.state.rollbacks,1);
});
test('concurrent disjoint requests reuse campaign with consecutive numbers',async()=>{
 const f=fixture();await Promise.all([f.service.saveWindow(payload(),7),f.service.saveWindow(shifted(24),7)]);
 assert.deepEqual(f.state.windows.map(w=>w.RoundNumber),[1,2]);assert.equal(f.state.campaigns.length,1);
});
test('a non-overlapping earlier gap can be filled after a later reservation',async()=>{
 const f=fixture();await f.service.saveWindow(shifted(24),7);await f.service.saveWindow(payload(),7);
 assert.equal(f.state.windows.length,2);assert.equal(+f.state.campaigns[0].StartsAt,Date.parse(payload().startsAt));
});
test('existing empty campaign is reused',async()=>{
 const b=payload(),f=fixture({campaigns:[{CampaignID:4,OJTSemesterID:11,Name:'Semester',StartsAt:new Date(b.startsAt),EndsAt:new Date(b.endsAt)}]});
 const saved=await f.service.saveWindow(b,7);assert.equal(saved.id,4);assert.equal(f.state.campaigns.length,1);
});
test('an open unfinished previous round does not block opening a scheduled supplemental round',async()=>{
 const f=fixture();await f.service.saveWindow(payload(),7);f.state.windows[0].Status='OPEN';
 const second=await f.service.saveWindow(shifted(24),7);
 const saved=await f.service.saveWindow({status:'OPEN',reason:'Schedule supplemental'},7,second.rounds[0].id);
 assert.equal(saved.status,'OPEN');assert.deepEqual(f.state.windows.map(w=>w.Status),['OPEN','OPEN']);
 const policy=f.load('backend/src/modules/recruitment/round-policy.ts');
 const w={...f.state.windows[1],Kind:'SEMESTER',LinkedPeriodID:1,CalendarStatus:'ACTIVE',DatabaseNow:now,PreviousRoundPending:true};
 assert.equal(policy.currentRoundPhase(w),'SCHEDULED');
 for(const action of ['POSTING','APPLICATION','RESULTS'])assert.equal(policy.phaseIsOpen(w,action),false);
 assert.equal(policy.roundActions({...w,Status:'DRAFT'}).canOpen,true);
});
test('period bounds reject both a start before semester and an end beyond its last day',async()=>{
 const f=fixture(),policy=f.load('backend/src/modules/recruitment/round-schedule.policy.ts');
 assert.throws(()=>policy.assertRoundWithinSemester({},new Date('2026-08-31T23:59:59+07:00'),new Date('2026-09-03T00:00:00+07:00')),{field:'postingStartsAt'});
 await assert.rejects(()=>f.service.saveWindow(shifted(30),7),{field:'resultsEndsAt'});
 assert.doesNotThrow(()=>policy.assertRoundWithinSemester({},new Date('2026-12-30T00:00:00+07:00'),new Date('2027-01-01T00:00:00+07:00')));
});
test('different semesters can reserve the same time',async()=>{
 const f=fixture();await f.service.saveWindow(payload(1),7);await f.service.saveWindow(payload(2),7);assert.equal(f.state.campaigns.length,2);
});
test('planned, closed, archived semesters and Block 3 are unavailable',async()=>{
 for(const options of [{status:'PLANNED'},{status:'CLOSED'},{status:'ARCHIVED'},{kind:'BLOCK3'}])await assert.rejects(()=>fixture(options).service.saveWindow(payload(),7),{errorCode:'RECRUITMENT_PERIOD_NOT_ACTIVE'});
});
test('one request creates one round while supplemental=true is supported',async()=>{
 const f=fixture(),b=payload();
 for(const rounds of [undefined,[],[b.rounds[0],b.rounds[0]]])await assert.rejects(()=>f.service.saveWindow({...b,rounds},7),{errorCode:'RECRUITMENT_SINGLE_ROUND_REQUIRED'});
 await f.service.saveWindow({...b,supplemental:true},7);assert.equal(f.state.windows.length,1);
});
test('API schema documents optional supplemental rounds',()=>{
 const spec={paths:{}};fixture().load('backend/src/modules/recruitment/recruitment.openapi.ts').addRecruitmentOperations(spec);
 const schema=spec.paths['/api/recruitment/windows'].post.requestBody.content['application/json'].schema;
 assert.equal(schema.properties.rounds.maxItems,1);assert.equal(schema.properties.supplemental.enum,undefined);
});

test('round opening date and immutable fields are controlled by backend input',async()=>{
 const f=fixture(),saved=await f.service.saveWindow(payload(),7),id=saved.rounds[0].id;
 await f.service.saveWindow({status:'OPEN',reason:'First opening'},7,id);
 assert.equal(f.state.windows[0].OpenedAt,now);
 await f.service.saveWindow({name:'Renamed round',reason:'Rename'},7,id);
 assert.equal(f.state.windows[0].OpenedAt,now);
 for(const body of [{status:'DRAFT'},{OpenedAt:'2026-11-01'},{CampaignID:99},{academicPeriodId:2}]) {
  await assert.rejects(()=>f.service.saveWindow({...body,reason:'Invalid mutation'},7,id));
 }
});
test('backend active-period check rejects schedule mutations outside an active regular semester',()=>{
 const policy=fixture().load('backend/src/modules/recruitment/round-schedule.policy.ts');
 for(const period of [{Kind:'BLOCK3',CalendarStatus:'ACTIVE'},...['PLANNED','CLOSED','ARCHIVED'].map(CalendarStatus=>({Kind:'SEMESTER',CalendarStatus}))]) {
  assert.throws(()=>policy.assertRecruitmentPeriodActive(period),{errorCode:'RECRUITMENT_PERIOD_NOT_ACTIVE'});
 }
 assert.doesNotThrow(()=>policy.assertRecruitmentPeriodActive({Kind:'SEMESTER',CalendarStatus:'ACTIVE'}));
});
test('backend protects finalized schedules and already elapsed phase boundaries',()=>{
 const f=fixture(),policy=f.load('backend/src/modules/recruitment/schedule-policy.ts'),b=payload(),r=b.rounds[0];
 const row={CampaignID:1,AcademicPeriodID:1,LinkedPeriodID:1,Kind:'SEMESTER',PeriodStatus:'ACTIVE',Status:'OPEN',OpenedAt:now,DatabaseNow:new Date(r.applicationStartsAt),StartsAt:r.postingStartsAt,EndsAt:r.resultsEndsAt};
 for(const [key,column] of Object.entries(policy.scheduleColumns))row[column]=r[key];
 assert.throws(()=>policy.editedSchedule({...row,ResultsFinalizedAt:now},r),{errorCode:'RECRUITMENT_SCHEDULE_LOCKED'});
 assert.throws(()=>policy.editedSchedule(row,{...r,postingStartsAt:new Date(+new Date(row.DatabaseNow)+3600000).toISOString()}),{errorCode:'RECRUITMENT_SCHEDULE_LOCKED'});
});

test('create accepts application intake during posting and enforces strict start/end ordering',async()=>{
 const b=payload();b.rounds[0].applicationStartsAt='2026-11-27T12:00:00Z';
 await fixture().service.saveWindow(b,7);
 for(const [key,value] of [
  ['applicationStartsAt',b.rounds[0].postingStartsAt],
  ['applicationStartsAt','2026-11-27T01:00:00Z'],
  ['applicationEndsAt',b.rounds[0].postingEndsAt],
  ['applicationEndsAt','2026-11-28T01:00:00Z'],
 ]){
  const invalid={...b,rounds:[{...b.rounds[0],[key]:value}]};
  await assert.rejects(()=>fixture().service.saveWindow(invalid,7),{field:key,errorCode:'RECRUITMENT_PHASE_SCHEDULE_INVALID'});
 }
});

function activePhaseRow(schedule,clock='2026-11-28T12:00:00Z'){
 const row={CampaignID:1,AcademicPeriodID:1,LinkedPeriodID:1,Kind:'SEMESTER',PeriodStatus:'ACTIVE',Status:'OPEN',OpenedAt:now,DatabaseNow:new Date(clock),StartsAt:schedule.postingStartsAt,EndsAt:schedule.resultsEndsAt};
 const columns=fixture().load('backend/src/modules/recruitment/schedule-policy.ts').scheduleColumns;
 for(const [key,column] of Object.entries(columns))row[column]=schedule[key];
 return row;
}
test('posting and applications have independent open/close boundaries, with unchanged review rules',()=>{
 const policy=fixture().load('backend/src/modules/recruitment/round-policy.ts');
 const schedule={...payload().rounds[0],postingEndsAt:'2026-11-30T02:00:00Z'};
 const row=activePhaseRow(schedule);
 assert.equal(policy.phaseIsOpen(row,'POSTING'),true);assert.equal(policy.phaseIsOpen(row,'APPLICATION'),true);
 assert.equal(policy.phaseIsOpen(row,'RESULTS'),true);assert.equal(policy.currentRoundPhase(row),'POSTING_AND_APPLICATION_AND_RESULTS');
 assert.equal(policy.currentRoundPhase({...row,ResultsStartsAt:'2026-12-01T00:00:00Z'}),'POSTING_AND_APPLICATION');
 const postingEnded={...row,DatabaseNow:new Date(row.PostingEndsAt)};
 assert.equal(policy.phaseIsOpen(postingEnded,'POSTING'),false);assert.equal(policy.phaseIsOpen(postingEnded,'APPLICATION'),true);
 assert.equal(policy.currentRoundPhase(postingEnded),'APPLICATION_AND_RESULTS');
 const applicationsEnded={...row,DatabaseNow:new Date(row.ApplicationEndsAt)};
 assert.equal(policy.phaseIsOpen(applicationsEnded,'APPLICATION'),false);assert.equal(policy.phaseIsOpen(applicationsEnded,'RESULTS'),true);
});
test('schedule editing and extension accept overlap, but Hạn 1 must still end strictly before Hạn 2',()=>{
 const f=fixture(),schedulePolicy=f.load('backend/src/modules/recruitment/schedule-policy.ts'),extension=f.load('backend/src/modules/recruitment/extension-policy.ts');
 const schedule={...payload().rounds[0],postingEndsAt:'2026-11-30T02:00:00Z'};
 const before=activePhaseRow(schedule);
 assert.doesNotThrow(()=>schedulePolicy.editedSchedule(before,{...schedule,postingEndsAt:'2026-12-01T02:00:00Z'}));
 assert.equal(+extension.extendedSchedule(before,{postingEndsAt:'2026-12-01T02:00:00Z'}).PostingEndsAt,Date.parse('2026-12-01T02:00:00Z'));
 for(const postingEndsAt of [schedule.applicationEndsAt,'2026-12-05T11:00:00Z']){
  assert.throws(()=>extension.extendedSchedule(before,{postingEndsAt}),{field:'postingEndsAt'});
  assert.throws(()=>schedulePolicy.editedSchedule(before,{...schedule,postingEndsAt}),{field:'applicationEndsAt'});
 }
 assert.throws(()=>extension.extendedSchedule(before,{applicationEndsAt:'2026-12-07T10:00:00Z'}),{field:'applicationEndsAt'});
 assert.doesNotThrow(()=>extension.extendedSchedule(before,{applicationEndsAt:'2026-12-07T10:00:00Z',resultsEndsAt:'2026-12-08T10:00:00Z'}));
});
test('Hạn 3 can start with applications and must continue through their deadline',()=>{
 const f=fixture(),b=payload();
 assert.doesNotThrow(()=>f.service.validateCampaignSchedule(b));
 for(const patch of [{resultsStartsAt:'2026-11-28T01:00:00Z'},{resultsEndsAt:'2026-12-05T09:00:00Z'}]){
  assert.throws(()=>f.service.validateCampaignSchedule({...b,rounds:[{...b.rounds[0],...patch}]}),{errorCode:'RECRUITMENT_PHASE_SCHEDULE_INVALID'});
 }
 assert.doesNotThrow(()=>f.service.validateCampaignSchedule({...b,rounds:[{...b.rounds[0],resultsEndsAt:b.rounds[0].applicationEndsAt}]}));
});

