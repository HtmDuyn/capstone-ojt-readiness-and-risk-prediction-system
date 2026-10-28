// Run after `npm run build`. Credentials stay in environment/process memory.
// This runner never starts background workers or invokes business write APIs.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

process.env.PGOPTIONS = '-c default_transaction_read_only=on -c statement_timeout=15000';
for (const name of ['PROVISIONING_JOBS_ENABLED', 'RECRUITMENT_WORKER_ENABLED', 'ADVISORY_WORKER_ENABLED', 'ELIGIBILITY_WORKER_ENABLED']) {
  process.env[name] = 'false';
}
require('../dist/config/env.js');

const report = { timestamp: new Date().toISOString(), environment: 'local', databaseReadOnly: false, businessWrites: 0, checks: [], skipped: [] };
let pool;
let server;
let token = process.env.QHDN_TEST_TOKEN;
let base;

async function get(url, expected = 200, inspect, authenticated = true) {
  const check = { method: 'GET', path: url, authenticated, expected };
  try {
    const response = await fetch(base + url, {
      headers: authenticated ? { Authorization: 'Bearer ' + token } : {},
      redirect: 'error', signal: AbortSignal.timeout(30000),
    });
    check.status = response.status;
    const contentType = response.headers.get('content-type') || '';
    let body;
    if (contentType.includes('json')) {
      body = await response.json();
      check.errorCode = body.errorCode;
      check.total = body.data?.total ?? body.total;
      const items = body.data?.items ?? body.items;
      if (Array.isArray(items)) check.returned = items.length;
    } else {
      check.contentType = contentType;
      check.bytes = (await response.arrayBuffer()).byteLength;
      check.attachment = !!response.headers.get('content-disposition');
    }
    assert.equal(response.status, expected, 'Unexpected HTTP status');
    if (expected === 200 && body && url !== '/api-docs/openapi.json') assert.equal(body.success, true);
    if (inspect) inspect(body, check);
    check.passed = true;
    return body;
  } catch (error) {
    check.passed = false;
    check.failure = error.code || error.name;
  } finally {
    report.checks.push(check);
    if (process.env.QHDN_TEST_QUIET !== 'true') console.log(JSON.stringify(check));
  }
}

async function main() {
  if (!token && (!process.env.QHDN_TEST_EMAIL || !process.env.QHDN_TEST_PASSWORD)) {
    throw new Error('Set QHDN_TEST_EMAIL and QHDN_TEST_PASSWORD, or QHDN_TEST_TOKEN.');
  }
  pool = require('../dist/config/database.js').pool;
  if (!pool) throw new Error('Database is not configured.');
  // Supabase poolers may ignore startup PGOPTIONS. Set and verify this on
  // every new connection before pg-pool makes it available to any handler.
  pool.options.onConnect = async client => {
    await client.query('SET SESSION default_transaction_read_only = on');
    const { rows: [state] } = await client.query("SELECT current_setting('default_transaction_read_only') AS read_only");
    assert.equal(state.read_only, 'on', 'Read-only session setup failed');
  };
  const { rows: [settings] } = await pool.query("SELECT current_setting('default_transaction_read_only') AS read_only");
  assert.equal(settings.read_only, 'on', 'Refusing to test against a writable DB connection');
  report.databaseReadOnly = true;
  const { rows: [semester] } = await pool.query('SELECT "OJTSemesterID" AS id FROM "OJTSemesters" ORDER BY "OJTSemesterID" DESC LIMIT 1');
  if (!semester) throw new Error('No existing OJT semester. No fixture will be created in the shared DB.');
  const { rows: [company] } = await pool.query('SELECT "EnterpriseID" AS id FROM "Enterprises" WHERE "DeletedAt" IS NULL ORDER BY "EnterpriseID" LIMIT 1');
  const app = require('../dist/app.js').default;
  server = await new Promise((resolve, reject) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
    listener.on('error', reject);
  });
  base = 'http://127.0.0.1:' + server.address().port;
  report.baseUrl = base;
  if (!token) {
    const response = await fetch(base + '/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: process.env.QHDN_TEST_EMAIL, password: process.env.QHDN_TEST_PASSWORD }),
      signal: AbortSignal.timeout(30000),
    });
    const auth = await response.json();
    assert.equal(response.status, 200, 'QHDN login failed');
    assert.equal(typeof auth.token, 'string');
    token = auth.token;
    report.loginStatus = response.status;
  }
  const identity = await get('/api/auth/me', 200, body => assert.equal(body.user?.roleCode, 'OJT_COORD'));
  if (identity?.user?.roleCode !== 'OJT_COORD') throw new Error('Expected a QHDN account.');
  await get('/', 200);
  await get('/api-docs/openapi.json', 200, spec => {
    const hidden = ['POST /api/ojt-registrations', 'POST /api/ojt-coordinations/{id}/decision', 'POST /api/assignments', 'PATCH /api/assignments/{id}', 'POST /api/imports/archive', 'POST /api/ojt-registration-windows', 'PATCH /api/ojt-registration-windows/{id}', 'GET /api/recruitment/windows', 'POST /api/recruitment/windows', 'PATCH /api/recruitment/windows/{id}'];
    for (const entry of hidden) {
      const [method, url] = entry.split(' ');
      const op = spec.paths[url]?.[method.toLowerCase()];
      assert.ok(!op?.['x-roles']?.includes('OJT_COORD'), entry + ' still allows QHDN in Swagger');
      assert.ok(!op?.tags?.includes('Phòng QHDN'), entry + ' still appears in QHDN Swagger');
    }
    assert.deepEqual(spec.paths['/api/qhdn/ojt-semesters/{id}/registration-settings'].put['x-roles'], ['OJT_COORD']);
  });
  const id = semester.id;
  const term = 'ojtSemesterId=' + id;
  const cases = [
    '/api/academic-periods?kind=SEMESTER&limit=100',
    '/api/companies?limit=1', '/api/positions?' + term + '&limit=1',
    '/api/ojt-registration-windows?' + term + '&limit=1',
    '/api/ojt-semesters/' + id + '/eligible-student-handoffs?limit=1',
    '/api/qhdn/eligible-students?' + term + '&limit=1',
    '/api/qhdn/registered-students?' + term + '&limit=1',
    ...['NOT_REGISTERED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'LEGACY_REVIEW_REQUIRED'].map(status => '/api/qhdn/registered-students?' + term + '&status=' + status),
    '/api/qhdn/registered-students?' + term + '&coordinationStatus=NOT_COORDINATED&assignmentStatus=UNASSIGNED',
    '/api/ojt-coordinations?' + term + '&limit=1', '/api/assignments?' + term + '&limit=1',
    '/api/internship-evaluations?' + term + '&limit=1', '/api/qhdn/dashboard?' + term,
    '/api/ojt-results?' + term + '&limit=1', '/api/job-applications?' + term + '&limit=1', '/api/internship-tasks?limit=1',
    ...['acceptance', 'internships', 'enterprise-feedback'].flatMap(type => [
      '/api/qhdn/reports?' + term + '&type=' + type + '&limit=1',
      '/api/qhdn/reports/export?' + term + '&type=' + type + '&format=csv',
      '/api/qhdn/reports/export?' + term + '&type=' + type + '&format=json',
    ]),
    ...['json', 'csv', 'pdf'].map(format => '/api/ojt-semesters/' + id + '/results/export?format=' + format),
  ];
  if (company) cases.push('/api/recruitment/posts?companyId=' + company.id + '&' + term + '&limit=1');
  for (const url of cases) await get(url, 200, (body, check) => {
    if (url.startsWith('/api/ojt-registration-windows')) {
      const items = body.data?.items ?? [];
      for (const item of items) assert.ok(['DRAFT', 'SCHEDULED', 'OPEN', 'EXPIRED', 'CLOSED'].includes(item.effectiveStatus));
    }
    if (check.contentType) { assert.ok(check.bytes > 0); assert.equal(check.attachment, true); }
  });
  for (const url of ['/api/ojt-registrations?limit=1', '/api/ojt-semesters/' + id + '/students?limit=1', '/api/recruitment/windows?limit=1']) await get(url, 403);
  for (const url of [
    '/api/qhdn/eligible-students', '/api/qhdn/registered-students',
    '/api/qhdn/registered-students?' + term + '&status=INVALID',
    '/api/qhdn/registered-students?' + term + '&historyPage=1',
    '/api/qhdn/eligible-students?' + term + '&limit=101',
    '/api/qhdn/reports?' + term + '&type=INVALID',
    '/api/qhdn/reports/export?' + term + '&type=acceptance&format=INVALID',
  ]) await get(url, 400);
  for (const url of ['/api/qhdn/eligible-students?' + term, '/api/qhdn/registered-students?' + term, '/api/companies']) await get(url, 401, undefined, false);
  report.skipped.push('Business write APIs: shared production database.', 'CV download and non-empty dossier/history responses: require a real handed-off student.');
}

main().catch(error => {
  report.fatal = { code: error.code || error.name, message: error.message };
  process.exitCode = 1;
}).finally(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  if (pool) await pool.end();
  report.passed = report.checks.filter(check => check.passed).length;
  report.failed = report.checks.filter(check => !check.passed).length;
  if (report.failed) process.exitCode = 1;
  const output = path.resolve(__dirname, '../.local/qhdn-local-readonly-report.json');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ report: output, passed: report.passed, failed: report.failed, fatal: !!report.fatal, databaseReadOnly: report.databaseReadOnly, businessWrites: report.businessWrites }));
});
