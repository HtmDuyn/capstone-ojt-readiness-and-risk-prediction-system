const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const loadSource = require('./helpers/load-source.cjs');
const express = require('express');
const jwt = require('jsonwebtoken');

const root = path.resolve(__dirname, '..');

// Transpile only the modules under test in memory. Isolate DB/business dependencies
// explicitly: the repository currently has missing modules, and these permission
// regressions must neither load .env nor connect to a real database or send mail.

const roles = ['ADMIN', 'ACADEMIC', 'OJT_COORD', 'ENTERPRISE', 'STUDENT'];
const secret = 'isolated-qhdn-permission-regression-secret';
const users = roles.map((role, index) => ({
  id: index + 1, username: 'fixture_' + role, role_code: role, status: 'ACTIVE',
  auth_version: 0, must_change_password: false,
}));
const { authenticate } = loadSource('src/middleware/authenticate.ts', {
  '../config/auth': { authConfig: { jwtSecret: secret } },
  '../modules/auth/auth.repository': { findById: async id => users.find(user => user.id === id) },
});
const protectedOperations = [
  ['POST', '/api/ojt-registrations', 201],
  ['POST', '/api/ojt-coordinations/1/decision', 200],
  ['POST', '/api/assignments', 201],
  ['PATCH', '/api/assignments/1', 200],
  ['POST', '/api/imports/archive', 200],
  ['POST', '/api/ojt-registration-windows', 201],
  ['PATCH', '/api/ojt-registration-windows/1', 200],
];

function routerFixture() {
  const calls = [];
  const work = name => async (...args) => { calls.push({ name, args }); return { operation: name }; };
  const dependencies = { '../../middleware/authenticate': { authenticate } };
  const qhdn = loadSource('src/modules/qhdn/qhdn.routes.ts', {
    ...dependencies,
    './catalog.service': { list: work('catalog:list'), saveCompany: work('catalog:save') },
    './workflow.service': Object.fromEntries(['coordinate', 'decision', 'assign', 'updateAssignment'].map(name => [name, work(name)])),
    './registered-students.service': { registeredStudents: work('registered') },
    './eligible-students.service': { eligibleStudents: work('eligible') },
    './report.service': { dashboard: work('dashboard'), report: work('report'), reportQuery: () => ({ type: 'acceptance' }), reportCsv: () => '' },
  }).default;
  const registrations = loadSource('src/modules/ojt-registration/registration.routes.ts', {
    ...dependencies,
    '../students/registration-options.service': { studentWindows: work('studentWindows') },
    './window.service': { listWindows: async (...args) => ({ ...await work('listWindows')(...args), items: [] }), saveWindow: work('saveWindow') },
    './registration.service': { submit: work('submit'), listRegistrations: work('listRegistrations'), review: work('review') },
    '../qhdn/student-submission.service': { submitStudentDossier: work('submit') },
    './handoff.service': { handoffHistory: work('handoffs'), semesterStudents: work('semesterStudents') },
    '../qhdn/registration-settings.service': { saveRegistrationSettings: work('registrationSettings'), effectiveRegistrationStatus: value => value.status },
  }).default;
  const imports = loadSource('src/modules/imports/import.routes.ts', {
    ...dependencies,
    '../../jobs/provisioning': { archiveRecruitment: work('archiveRecruitment') },
    '../qhdn/enterprise-import.service': { importEnterprises: work('importAccounts') },
    '../qhdn/enterprise-import-input': { receiveEnterpriseImport: (_req, _res, next) => next() },
    '../../config/database': { query: () => { throw new Error('Unexpected database access'); } },
  }).default;
  const admin = loadSource('src/modules/admin/admin.routes.ts', {
    ...dependencies,
    './admin.repository': { csv: () => '' },
    './catalog.service': { saveCompany: work('admin:saveCompany'), softDelete: work('admin:delete') },
    './student-admin.service': { deleteStudent: work('admin:deleteStudent'), exportStudents: work('admin:export') },
    './assignment.service': { saveAssignment: work('admin:saveAssignment') },
    './monitoring.service': { auditLogs: work('admin:audit') },
    './reporting.service': { systemDashboard: work('admin:dashboard') },
  }).default;
  const app = express();
  app.use(express.json());
  // Same ordering as src/routes/index.ts; Admin's shared handlers run first.
  app.use('/api', admin, qhdn, registrations);
  app.use('/api/imports', imports);
  app.use((_req, res) => res.sendStatus(404));
  app.use((error, _req, res, _next) => res.status(error.statusCode || 500).json({ errorCode: error.errorCode }));
  return { app, calls };
}

test('HTTP permissions: deny QHDN writes and retain Admin, Student and QHDN reads', async t => {
  const { app, calls } = routerFixture();
  const server = await new Promise(resolve => { const value = app.listen(0, '127.0.0.1', () => resolve(value)); });
  t.after(() => new Promise(resolve => server.close(resolve)));
  const request = async (method, url, role) => {
    const headers = { 'Content-Type': 'application/json' };
    if (role) {
      const user = users.find(value => value.role_code === role);
      headers.Authorization = 'Bearer ' + jwt.sign({ userId: user.id, username: user.username, authVersion: 0 }, secret);
    }
    return fetch(`http://127.0.0.1:${server.address().port}${url}`, {
      method, headers, ...(method === 'GET' ? {} : { body: '{}' }),
    });
  };
  await t.test('retired write operations reject unauthenticated and QHDN requests before business handlers', async () => {
    for (const [method, url] of protectedOperations) {
      const before = calls.length;
      assert.equal((await request(method, url)).status, 401, url);
      const response = await request(method, url, 'OJT_COORD');
      assert.equal(response.status, 403, url);
      assert.equal((await response.json()).errorCode, 'FORBIDDEN');
      assert.equal(calls.length, before, 'Denied requests must not reach writes: ' + url);
    }
  });
  await t.test('Admin still reaches the legacy operations and original shared assignment handlers', async () => {
    for (const [method, url, status] of protectedOperations) {
      const before = calls.length;
      assert.equal((await request(method, url, 'ADMIN')).status, status, url);
      assert.equal(calls.length, before + 1, url);
      if (url.startsWith('/api/assignments')) assert.equal(calls.at(-1).name, 'admin:saveAssignment');
    }
    assert.equal(calls.filter(call => call.name === 'archiveRecruitment').length, 1);
  });
  await t.test('Student can still submit; Academic and Enterprise cannot use these staff write routes', async () => {
    for (const [method, url, status] of protectedOperations) {
      for (const role of ['ACADEMIC', 'ENTERPRISE', 'STUDENT']) {
        const allowed = role === 'STUDENT' && url === '/api/ojt-registrations';
        const before = calls.length;
        assert.equal((await request(method, url, role)).status, allowed ? status : 403, role + ': ' + url);
        assert.equal(calls.length, before + Number(allowed));
      }
    }
  });
  await t.test('QHDN retains reads, coordination, review, registration windows and enterprise imports', async () => {
    const retained = [
      ['GET', '/api/assignments', 200], ['GET', '/api/ojt-coordinations', 200],
      ['GET', '/api/positions', 200], ['GET', '/api/internship-evaluations', 200],
      ['GET', '/api/ojt-registration-windows', 200],
      ['GET', '/api/qhdn/eligible-students', 200], ['GET', '/api/qhdn/registered-students', 200],
      ['POST', '/api/ojt-coordinations', 201], ['POST', '/api/ojt-coordinations/1/reassign', 201],
      ['POST', '/api/ojt-registrations/1/review', 200], ['PATCH', '/api/companies/1', 200],
      ['PUT', '/api/qhdn/ojt-semesters/1/registration-settings', 200],
    ];
    for (const [method, url, status] of retained) assert.equal((await request(method, url, 'OJT_COORD')).status, status, url);
    const user = users.find(value => value.role_code === 'OJT_COORD');
    for (const action of ['preview', 'commit']) {
      const response = await fetch(`http://127.0.0.1:${server.address().port}/api/imports/${action}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + jwt.sign({ userId: user.id, username: user.username, authVersion: 0 }, secret) },
        body: JSON.stringify({ kind: 'ENTERPRISE' }),
      });
      assert.equal(response.status, 200);
      for (const role of ['ADMIN', 'ACADEMIC', 'ENTERPRISE', 'STUDENT']) {
        const deniedUser = users.find(value => value.role_code === role);
        const before = calls.length;
        assert.equal((await fetch(`http://127.0.0.1:${server.address().port}/api/imports/${action}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + jwt.sign({ userId: deniedUser.id, username: deniedUser.username, authVersion: 0 }, secret) },
          body: JSON.stringify({ kind: 'ENTERPRISE' }),
        })).status, 403);
        assert.equal(calls.length, before);
      }
    }
  });
  await t.test('retired QHDN roster reads reject QHDN while retaining the other roles', async () => {
    for(const [url, allowed] of [
      ['/api/ojt-registrations', ['ADMIN','STUDENT']],
      ['/api/ojt-semesters/1/students', ['ADMIN','ACADEMIC','STUDENT']],
    ]) for(const role of roles) {
      const before = calls.length;
      assert.equal((await request('GET',url,role)).status,allowed.includes(role)?200:403,role+': '+url);
      assert.equal(calls.length,before+Number(allowed.includes(role)));
    }
  });
  await t.test('only QHDN uses the merged endpoint; legacy recruitment actions reject QHDN', async () => {
    for (const role of ['ADMIN', 'ACADEMIC', 'ENTERPRISE', 'STUDENT']) assert.equal((await request('PUT', '/api/qhdn/ojt-semesters/1/registration-settings', role)).status, 403);
    for (const [method, url] of [['POST', '/api/recruitment/posts/1/review'], ['POST', '/api/recruitment/posts/1/close'], ['POST', '/api/recruitment/windows'], ['PATCH', '/api/recruitment/windows/1']]) {
      assert.equal((await request(method, url, 'OJT_COORD')).status, 403);
      assert.equal((await request(method, url, 'ADMIN')).status, 404, 'Admin passes through to the unchanged downstream recruitment router');
    }
  });
});

test('service guards reject only QHDN and delegate other roles to existing business checks', async t => {
  let transactions = 0;
  const reachedBusiness = new Error('Request reached the existing business transaction');
  const repository = { academicTransaction: async () => { transactions++; throw reachedBusiness; } };
  const registration = loadSource('src/modules/ojt-registration/registration.service.ts', {
    '../academic/workflow-policy': {}, '../qhdn/read.repository': {}, '../../shared/detail-pagination': {},
    '../../shared/list-context': {}, '../students/cv.service': { currentCVSql: () => 'NULL' },
    '../academic/academic.repository': repository, '../eligibility/eligibility.service': {}, './window.service': {},
  });
  const workflow = loadSource('src/modules/qhdn/workflow.service.ts', {
    '../ojt-registration/registration.service': {}, '../recruitment/recruitment.repository': {},
    '../academic/academic.repository': repository, '../eligibility/eligibility.service': {},
    './catalog.service': { staff: () => {} },
  });
  const recruitment = loadSource('src/modules/recruitment/recruitment.service.ts', {
    '../academic/academic.repository': repository,
    '../qhdn/qhdn.repository': { requireStaff: () => {}, reservedSeats: () => '0' },
    '../eligibility/eligibility.service': {}, '../student-portal/shared': {},
  });
  const actor = roleCode => ({ userId: 1, roleCode });
  const submitBody = { windowId: 1, studentId: 1 };
  const assignment = { coordinationId: 1, startDate: '2027-01-01', endDate: '2027-04-01', reason: 'Fixture' };
  const cases = [
    ['submit', role => registration.submit(submitBody, actor(role))],
    ['decision', role => workflow.decision(1, { decision: 'ACCEPTED', reason: 'Fixture' }, actor(role))],
    ['assign', role => workflow.assign(assignment, actor(role))],
    ['updateAssignment', role => workflow.updateAssignment(1, { status: 'ACTIVE', reason: 'Fixture' }, actor(role))],
    ['changeRecruitmentPost', role => recruitment.changePost(1, { reason: 'Fixture' }, actor(role), 'publish')],
  ];
  // Dependencies are isolated here: reaching the old transaction is not a grant
  // of HTTP access. The router matrix above still rejects unauthorized roles.
  for (const [name, invoke] of cases) await t.test(name, async () => {
    for (const role of roles) {
      const before = transactions;
      if (role !== 'OJT_COORD' && !(name === 'decision' && !['ADMIN','ENTERPRISE'].includes(role))) {
        await assert.rejects(invoke(role), error => error === reachedBusiness);
        assert.equal(transactions, before + 1);
      } else {
        await assert.rejects(invoke(role), error => error.statusCode === 403 && error.errorCode === 'FORBIDDEN');
        assert.equal(transactions, before);
      }
    }
  });
});

test('retired roster services reject QHDN before reading and preserve other actors', async () => {
  const reached = new Error('Existing read path reached');
  const registration = loadSource('src/modules/ojt-registration/registration.service.ts', {
    '../academic/workflow-policy': {}, '../qhdn/read.repository': { readTransaction: async () => { throw reached; } },
    '../../shared/detail-pagination': { detailPagination: () => ({ page: 1, limit: 20, offset: 0 }) }, '../../shared/list-context': {},
    '../students/cv.service': { currentCVSql: () => 'NULL' }, '../academic/academic.repository': {}, '../eligibility/eligibility.service': {}, './window.service': {},
  });
  const handoff = loadSource('src/modules/ojt-registration/handoff.service.ts', {
    '../academic/workflow-policy': {}, '../../shared/list-context': {}, '../students/cv.service': { currentCVSql: () => 'NULL' },
    '../academic/academic.repository': { academicTransaction: async () => { throw reached; } }, '../eligibility/eligibility.service': {}, './window.service': {},
  });
  await assert.rejects(registration.listRegistrations({}, { userId: 1, roleCode: 'OJT_COORD' }), e => e.statusCode === 403);
  await assert.rejects(handoff.semesterStudents(1, {}, { userId: 1, roleCode: 'OJT_COORD' }), e => e.statusCode === 403);
  for(const roleCode of ['ADMIN','STUDENT']) await assert.rejects(registration.listRegistrations({}, { userId: 1, roleCode }), e => e === reached);
  for(const roleCode of ['ADMIN','ACADEMIC','STUDENT']) await assert.rejects(handoff.semesterStudents(1, {}, { userId: 1, roleCode }), e => e === reached);
});

test('QHDN multipart imports use the actual upload middleware and normalize the file', async t => {
  const input = loadSource('src/modules/qhdn/enterprise-import-input.ts');
  const router = loadSource('src/modules/imports/import.routes.ts', {
    '../../middleware/authenticate': { authenticate },
    '../../jobs/provisioning': {}, '../../config/database': {},
    '../qhdn/enterprise-import-input': input,
    '../qhdn/enterprise-import.service': { importEnterprises: async (body, actor, preview, file) => {
      const normalized = await input.enterpriseImportInput(body, file);
      return { actor, preview, total: normalized.rows.length, positions: normalized.rows[0].positions.length, semesterId: normalized.semesterId };
    } },
  }).default;
  const app = express(); app.use('/api/imports', router);
  app.use((error, _req, res, _next) => res.status(error.statusCode || 500).json({ errorCode: error.errorCode }));
  const server = await new Promise(resolve => { const value = app.listen(0, '127.0.0.1', () => resolve(value)); });
  t.after(() => new Promise(resolve => server.close(resolve)));
  const user = users.find(value => value.role_code === 'OJT_COORD');
  const headers = { Authorization: 'Bearer ' + jwt.sign({ userId: user.id, username: user.username, authVersion: 0 }, secret) };
  const form = filename => {
    const value = new FormData();
    value.set('kind', 'ENTERPRISE'); value.set('ojtSemesterId', '1'); value.set('idempotencyKey', 'multipart-fixture');
    value.set('file', new Blob(['code,email,fullName,name,positionCode,title,description,requirements,capacity\nDN1,hr@fixture.test,HR,Company,DEV1,Developer,Description,Requirements,2']), filename);
    return value;
  };
  const url = `http://127.0.0.1:${server.address().port}/api/imports/preview`;
  const response = await fetch(url, { method: 'POST', headers, body: form('fixture.csv') });
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), { success: true, actor: user.id, preview: true, total: 1, positions: 1, semesterId: 1 });
  assert.equal((await fetch(url, { method: 'POST', headers, body: form('fixture.txt') })).status, 400);
});

test('Swagger preserves legacy operations for other roles and exposes only the merged QHDN settings', () => {
  const filename = 'src/config/swagger-role-groups.ts';
  // Supply a complete operation inventory to the real strict grouping function.
  // Expected permissions below are independent of that inventory.
  const inventory = new Set(fs.readFileSync(path.resolve(root, filename), 'utf8')
    .replace(/const retired = \[[\s\S]*?\];/, '')
    .match(/(?:GET|POST|PUT|PATCH|DELETE) \/api\/[\w/{}-]+/g));
  const spec = { paths: {} };
  for (const key of inventory) {
    const [method, url] = key.split(' ');
    (spec.paths[url] ??= {})[method.toLowerCase()] = {
      security: [{ bearerAuth: [] }], summary: key, parameters: [], responses: { 200: { description: 'Unchanged' } },
    };
  }
  const before = structuredClone(spec);
  loadSource(filename).groupSwaggerByRole(spec);
  const expected = [
    ['post', '/api/ojt-registrations', ['ADMIN', 'STUDENT'], ['Sinh viên']],
    ['post', '/api/ojt-coordinations/{id}/decision', ['ADMIN'], ['Admin']],
    ['post', '/api/assignments', ['ADMIN'], ['Admin']],
    ['patch', '/api/assignments/{id}', ['ADMIN'], ['Admin']],
    ['post', '/api/imports/archive', ['ADMIN'], ['Admin']],
    ['post', '/api/ojt-registration-windows', ['ADMIN'], ['Admin']],
    ['patch', '/api/ojt-registration-windows/{id}', ['ADMIN'], ['Admin']],
    ['post', '/api/recruitment/posts/{id}/review', ['ADMIN'], ['Admin']],
    ['post', '/api/recruitment/posts/{id}/close', ['ADMIN'], ['Admin']],
    ['post', '/api/recruitment/windows', ['ADMIN'], ['Admin']],
    ['patch', '/api/recruitment/windows/{id}', ['ADMIN'], ['Admin']],
    ['put', '/api/qhdn/ojt-semesters/{id}/registration-settings', ['OJT_COORD'], ['Phòng QHDN']],
    ['get', '/api/ojt-registrations', ['ADMIN','STUDENT'], ['Sinh viên']],
    ['get', '/api/ojt-semesters/{id}/students', ['ADMIN','ACADEMIC','STUDENT'], ['Phòng đào tạo','Sinh viên']],
  ];
  for (const [method, url, roles, tags] of expected) {
    const operation = spec.paths[url][method];
    assert.deepEqual(operation['x-roles'], roles);
    assert.deepEqual(operation.tags, tags);
    const { tags: _tags, 'x-roles': _roles, ...contract } = operation;
    assert.deepEqual(contract, before.paths[url][method], 'Preserve the API contract: ' + url);
  }
  for (const url of ['/api/assignments', '/api/ojt-coordinations', '/api/internship-evaluations', '/api/qhdn/registered-students']) {
    assert.ok(spec.paths[url].get['x-roles'].includes('OJT_COORD'));
    assert.ok(spec.paths[url].get.tags.includes('Phòng QHDN'));
  }
  assert.deepEqual(spec.paths['/api/enterprise/candidates/{id}/decision'].patch['x-roles'], ['ENTERPRISE']);
  assert.deepEqual(spec.paths['/api/ojt-results/{id}/confirm'].post['x-roles'], ['ADMIN', 'ACADEMIC']);
  assert.deepEqual(Object.keys(spec.paths), Object.keys(before.paths));

  const annotations = require('swagger-jsdoc')({
    definition: { openapi: '3.0.0', info: { title: 'Permission regression', version: '1' } },
    apis: ['src/modules/imports/import.openapi.ts', 'src/modules/ojt-registration/registration.openapi.ts', 'src/modules/qhdn/registration-settings.openapi.ts']
      .map(file => path.resolve(root, file)),
  });
  assert.equal(annotations.paths['/api/imports/archive'].post.responses[403].description, 'ADMIN required');
  assert.equal(annotations.paths['/api/ojt-registrations'].post.summary,
    'Student submits own application; ADMIN/ACADEMIC may submit on behalf');
  assert.ok(annotations.paths['/api/qhdn/ojt-semesters/{id}/registration-settings'].put);
});

test('restored recruitment router keeps legacy actions away from QHDN and retains Admin/Enterprise access', async t => {
  const work = async () => ({ fixture: true });
  const router = loadSource('src/modules/recruitment/recruitment.routes.ts', {
    '../../middleware/authenticate': { authenticate },
    './window.service': { listWindows: work, saveWindow: work },
    './post.service': { listPosts: work, updatePost: work, reviewPost: work },
  }).default;
  const app = express();
  app.use(express.json());
  app.use('/api/recruitment', router);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = 'http://127.0.0.1:' + server.address().port;
  const cases = [
    ['GET', '/windows', ['ADMIN', 'ENTERPRISE'], 200],
    ['POST', '/windows', ['ADMIN'], 201],
    ['PATCH', '/windows/1', ['ADMIN'], 200],
    ['GET', '/posts', ['ADMIN', 'ENTERPRISE', 'OJT_COORD'], 200],
    ['PATCH', '/posts/1', ['ADMIN', 'ENTERPRISE'], 200],
    ['POST', '/posts/1/review', ['ADMIN'], 200],
    ['POST', '/posts/1/close', ['ADMIN'], 200],
  ];
  for (const user of users) {
    const token = jwt.sign({ userId: user.id, username: user.username, authVersion: 0 }, secret);
    for (const [method, url, allowed, status] of cases) {
      const response = await fetch(base + '/api/recruitment' + url, {
        method, headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        ...(method === 'GET' ? {} : { body: '{}' }),
      });
      assert.equal(response.status, allowed.includes(user.role_code) ? status : 403, user.role_code + ' ' + method + ' ' + url);
    }
  }
});
