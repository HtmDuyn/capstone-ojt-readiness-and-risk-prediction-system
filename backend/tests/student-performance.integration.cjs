const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');
const jwt = require('jsonwebtoken');

const target = process.env.STUDENT_PERFORMANCE_TEST_DATABASE_URL;
if (!target) throw Error('Set STUDENT_PERFORMANCE_TEST_DATABASE_URL.');
const url = new URL(target);
if (url.hostname !== '127.0.0.1' || url.port !== '55439' || url.pathname !== '/student_performance_test')
  throw Error('Only the disposable localhost student_performance_test database is allowed.');
delete process.env.DATABASE_URL;
delete process.env.SUPABASE_DATABASE_URL;
process.env.LOCAL_DATABASE_URL = target;
process.env.DB_SSL = 'false';
process.env.JWT_SECRET = 'student-performance-isolated-fixture-secret';
process.env.EMAIL_OUTBOX_KEY = '56'.repeat(32);
process.env.ENTERPRISE_RECRUITMENT_WORKER_ENABLED = 'false';

const stable = value => JSON.parse(JSON.stringify(value, (key, data) => ['computedAt','checkedAt'].includes(key) ? undefined : data));

test('Student partial reads reduce real SQL and response size without changing ownership, default responses or AI results', async t => {
  const db = new Client({ connectionString: target });
  await db.connect();
  t.after(() => db.end());
  await db.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public');
  await db.query(fs.readFileSync(path.join(__dirname, '../DB'), 'utf8'));
  const { pool } = require('../dist/config/database');
  t.after(() => pool.end());
  let statements = [];
  pool.on('connect', client => {
    const query = client.query.bind(client);
    client.query = (...args) => { statements.push(typeof args[0] === 'string' ? args[0] : args[0].text); return query(...args); };
  });
  const logger = require('../dist/config/logger').logger;
  const logError = logger.error.bind(logger);
  t.mock.method(logger, 'error', error => { if (!error.statusCode || error.statusCode >= 500) logError(error); });
  const assignment = (await db.query(`SELECT a."AssignmentID" id,a."StudentID" student_id,a."EnterpriseID" company_id,
    co."OJTSemesterID" semester_id,u."UserID" user_id,u."Username" username,u."AuthVersion" version
    FROM "InternshipAssignments" a JOIN "StudentEnterpriseCoordination" co USING("CoordinationID")
    JOIN "Students" s ON s."StudentID"=a."StudentID" JOIN "Users" u ON u."UserID"=s."UserID"
    WHERE a."StudentID"=2 LIMIT 1`)).rows[0];
  const users = (await db.query(`SELECT u."UserID" id,u."Username" username,u."AuthVersion" version,r."RoleCode" role
    FROM "Users" u JOIN "Roles" r USING("RoleID") WHERE u."Status"='ACTIVE'`)).rows;
  const enterprise = users.find(user => user.role === 'ENTERPRISE');
  const coordinator = users.find(user => user.role === 'OJT_COORD');
  const other = users.find(user => user.role === 'STUDENT' && user.id !== assignment.user_id);
  await db.query(`UPDATE "InternshipAssignments" SET "Status"='ACTIVE',"StartDate"=current_date-5,"EndDate"=current_date+30 WHERE "AssignmentID"=$1`, [assignment.id]);
  const { submitEvaluation } = require('../dist/modules/enterprise/bulk-evaluation.service');
  const evaluation = await submitEvaluation(assignment.id, { completionScore: 9, skillScore: 8, attitudeScore: 9,
    comments: 'Performance fixture', reason: 'Performance fixture' }, { userId: enterprise.id, roleCode: 'ENTERPRISE' });
  await require('../dist/modules/ojt-results/publish.service').publishResults({ ojtSemesterId: assignment.semester_id,
    evaluationIds: [evaluation.id], reason: 'Performance fixture' }, { userId: coordinator.id, roleCode: 'OJT_COORD' });
  const app = require('../dist/app').default;
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const sign = user => jwt.sign({ userId: user.user_id ?? user.id, username: user.username, authVersion: user.version }, process.env.JWT_SECRET);
  const get = async (route, user = assignment, options = {}) => {
    statements = [];
    const started = performance.now();
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api${route}`, {
      ...options, headers: { Authorization: 'Bearer ' + sign(user), ...options.headers },
    });
    const text = await response.text();
    const body = JSON.parse(text);
    return { status: response.status, data: body.data, body, bytes: Buffer.byteLength(text),
      queries: [...statements], milliseconds: Math.round((performance.now() - started) * 100) / 100 };
  };
  const ok = result => { assert.equal(result.status, 200, JSON.stringify(result.body)); return result.data; };
  const term = assignment.semester_id;
  const base = `/students/me/internships?ojtSemesterId=${term}`;
  const baseline = await get(base);
  ok(baseline);
  const riskRead = await get('/students/me/ojt-risk-assessment');
  const riskBefore = ok(riskRead);
  console.log(JSON.stringify({ riskAssessment: { queries: riskRead.queries.length, bytes: riskRead.bytes, milliseconds: riskRead.milliseconds } }));

  await t.test('tasks, results and identity skip unrelated SQL while preserving the default full response', async () => {
    const tasks = await get(`/students/me/tasks?ojtSemesterId=${term}`);
    assert.deepEqual(stable(ok(tasks)), stable(baseline.data.tasks));
    assert.ok(tasks.queries.every(sql => !sql.includes('"InternshipEvaluations"')));
    assert.ok(tasks.queries.length < baseline.queries.length);
    const results = await get(base + '&include=results');
    assert.deepEqual(stable(ok(results).results), stable(baseline.data.results));
    assert.ok(results.queries.every(sql => !sql.includes('"InternshipTasks"')));
    assert.ok(results.queries.length < baseline.queries.length);
    assert.equal(results.data.assignment, undefined);
    const detail = await get(base + '&include=results&resultId=' + evaluation.id);
    assert.equal(ok(detail).result.id, evaluation.id);
    assert.equal(detail.data.result.overallScore, 8.67);
    assert.equal(detail.data.results, undefined, 'Detail does not also read a result list');
    assert.ok(detail.queries.every(sql => !sql.includes('"InternshipTasks"')));
    const identity = await get('/students/me/internships?include=identity');
    assert.equal(ok(identity).studentId, assignment.student_id);
    assert.ok(identity.queries.every(sql => !sql.includes('"InternshipTasks"') && !sql.includes('"InternshipEvaluations"')));
    const selectedAssignment = await get(base + '&include=assignment');
    assert.deepEqual(stable(ok(selectedAssignment).assignment), stable(baseline.data.assignment));
    assert.ok(selectedAssignment.queries.every(sql => !sql.includes('"InternshipTasks"') && !sql.includes('"InternshipEvaluations"')));
    console.log(JSON.stringify({ internships: { queries: baseline.queries.length, bytes: baseline.bytes },
      tasks: { queries: tasks.queries.length, bytes: tasks.bytes }, results: { queries: results.queries.length, bytes: results.bytes },
      detail: { queries: detail.queries.length, bytes: detail.bytes }, identity: { queries: identity.queries.length, bytes: identity.bytes } }));
  });

  await t.test('dashboard overview preserves academic and admission values while reducing queries and payload', async () => {
    const full = await get(`/students/me/dashboard?ojtSemesterId=${term}`);
    const overview = await get(`/students/me/dashboard?ojtSemesterId=${term}&view=overview`);
    ok(full); ok(overview);
    const { supplementaryCourses, ...academic } = full.data.academic;
    assert.deepEqual(stable(overview.data.academic), stable(academic));
    assert.deepEqual(stable(overview.data.registrationWindows), stable(full.data.registrationWindows));
    assert.deepEqual(stable(overview.data.internship.assignment), stable(full.data.internship.assignment));
    assert.equal(overview.data.notifications.unreadCount, full.data.notifications.unreadCount);
    assert.deepEqual(overview.data.notifications.items, full.data.notifications.items.slice(0, 1));
    assert.equal(overview.data.comboWindows, undefined);
    assert.equal(overview.data.jobApplications, undefined);
    assert.ok(overview.queries.length < full.queries.length);
    assert.ok(overview.bytes < full.bytes);
    console.log(JSON.stringify({ dashboardFull: { queries: full.queries.length, bytes: full.bytes, milliseconds: full.milliseconds },
      dashboardOverview: { queries: overview.queries.length, bytes: overview.bytes, milliseconds: overview.milliseconds } }));
  });

  await t.test('summary preserves the visible overview values without computing hidden scenarios or duplicated catalogs', async () => {
    const overview = await get(`/students/me/dashboard?ojtSemesterId=${term}&view=overview`);
    const summary = await get(`/students/me/dashboard?ojtSemesterId=${term}&view=summary`);
    ok(overview); ok(summary);
    for (const field of ['studentId','academicProgress','earnedCredits','missingCredits','failedCourseCount',
      'gpa','gpaScale','issues','currentEligibility','officialEligibility','admissionEligibility','deadline'])
      assert.deepEqual(stable(summary.data.academic[field]), stable(overview.data.academic[field]), field);
    assert.deepEqual(stable(summary.data.internship), stable(overview.data.internship));
    assert.equal(summary.data.notifications, undefined);
    assert.equal(summary.data.registrationWindows, undefined);
    assert.equal(summary.data.academic.scenario, undefined);
    assert.ok(summary.queries.every(sql => !sql.includes('"OJTRegistrationWindows"') && !sql.includes('FROM "Notifications"')));
    assert.ok(summary.queries.length < overview.queries.length);
    assert.ok(summary.bytes < overview.bytes);
    console.log(JSON.stringify({ overview: { queries: overview.queries.length, bytes: overview.bytes },
      summary: { queries: summary.queries.length, bytes: summary.bytes, milliseconds: summary.milliseconds } }));
  });

  await t.test('catalog preserves exactly the visible student windows without reading admission or registration details', async () => {
    const full = await get('/ojt-registration-windows?limit=100');
    const catalog = await get('/ojt-registration-windows?view=catalog&limit=100');
    ok(full); ok(catalog);
    const fields = ['id','name','academicPeriodId','ojtSemesterId','period','semester','startsAt','endsAt','status'];
    assert.deepEqual(catalog.data.items, full.data.items.map(row => Object.fromEntries(fields.map(key => [key, row[key]]))));
    assert.equal(catalog.data.total, full.data.total);
    assert.ok(catalog.data.items.every(row => row.canSubmit === undefined && row.registration === undefined && row.Scope === undefined));
    assert.ok(catalog.queries.length < full.queries.length);
    assert.equal((await get('/ojt-registration-windows?view=invalid')).status, 400);
    console.log(JSON.stringify({ windowsFull: { queries: full.queries.length, bytes: full.bytes },
      windowsCatalog: { queries: catalog.queries.length, bytes: catalog.bytes } }));
  });

  await t.test('two student tokens can read only their own personal data, even with forged IDs and filters', async () => {
    const otherId = (await db.query('SELECT "StudentID" id FROM "Students" WHERE "UserID"=$1', [other.id])).rows[0].id;
    for (const [actor, id] of [[assignment, assignment.student_id], [other, otherId]]) {
      const me = await get('/auth/me', actor);
      assert.equal(me.body.user.studentId, id);
      const summary = ok(await get(`/students/me/dashboard?ojtSemesterId=${term}&view=summary`, actor));
      assert.equal(summary.academic.studentId, id);
      if (summary.internship.assignment) assert.equal(summary.internship.assignment.studentId, id);
      assert.equal(ok(await get('/students/me/ojt-risk-assessment', actor)).student.id, id);
      assert.ok(ok(await get('/job-applications', actor)).items.every(row => row.studentId === id));
      assert.ok(ok(await get('/ojt-registrations', actor)).items.every(row => row.studentId === id));
    }
    for (const include of ['ojtRegistrations','academicProgress','courseResults','curriculum']) {
      assert.equal((await get(`/students/${assignment.student_id}?include=${include}`, other)).status, 403);
      assert.equal((await get(`/students/${otherId}?include=${include}`)).status, 403);
    }
    assert.equal((await get(`/students/${assignment.student_id}/cv`, other)).status, 403);
    assert.equal((await get('/students')).status, 403);
    assert.equal(ok(await get(`/job-applications?studentId=${assignment.student_id}`, other)).total, 0);
    assert.equal(ok(await get(`/ojt-registrations?studentId=${assignment.student_id}`, other)).total, 0);
    assert.equal((await get(`/students/me/dashboard?ojtSemesterId=${term}&view=summary&studentId=${otherId}`)).status, 400);
    assert.equal((await get(`/students/me/ojt-risk-assessment?studentId=${otherId}`)).status, 400);
    const task = baseline.data.tasks.items[0];
    assert.ok(task, 'The fixture includes a task to check cross-student access');
    assert.equal((await get(`/students/me/tasks/${task.id}/submissions`, other)).status, 404);
    const ownNotification = (await db.query('SELECT "NotificationID" id FROM "Notifications" WHERE "UserID"=$1 LIMIT 1', [assignment.user_id])).rows[0];
    const otherNotifications = ok(await get('/students/me/notifications?limit=100', other));
    assert.ok(otherNotifications.items.every(row => row.id !== ownNotification.id));
    assert.equal((await get(`/students/me/notifications/${ownNotification.id}`, other,
      { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isRead: true }) })).status, 404);
  });

  await t.test('missing, forged, expired and revoked tokens cannot open the student overview', async () => {
    const route = `/students/me/dashboard?ojtSemesterId=${term}&view=summary`;
    for (const token of ['', 'Bearer invalid-token', 'Bearer ' + jwt.sign({ userId: assignment.user_id }, 'wrong-secret'),
      'Bearer ' + jwt.sign({ userId: assignment.user_id, username: assignment.username, authVersion: assignment.version, exp: 1 }, process.env.JWT_SECRET),
      'Bearer ' + jwt.sign({ userId: assignment.user_id, username: assignment.username, authVersion: assignment.version + 1 }, process.env.JWT_SECRET)])
      assert.equal((await get(route, assignment, { headers: { Authorization: token } })).status, 401);
    assert.equal((await get(route, coordinator)).status, 403);
  });

  await t.test('partial reads enforce the same student ownership, role and pagination checks', async () => {
    assert.equal((await get(base + '&include=results&resultId=' + evaluation.id, other)).status, 404);
    assert.equal((await get(base + '&include=assignment&assignmentId=' + assignment.id, other)).status, 404);
    for (const route of [base + '&include=tasks', `/students/me/dashboard?ojtSemesterId=${term}&view=overview`])
      assert.equal((await get(route, coordinator)).status, 403);
    assert.equal((await get(base + '&include=invalid')).status, 400);
    assert.equal((await get(base + '&include=tasks&tasksLimit=101')).status, 400);
    assert.equal((await get(`/students/me/dashboard?ojtSemesterId=${term}&view=invalid`)).status, 400);
    assert.equal((await get('/students/me/tasks?ojtSemesterId=2147483647')).status, 404);
    assert.equal(ok(await get(base + '&include=results', other)).results.items.some(row => row.id === evaluation.id), false);
  });

  await t.test('AI risk and roadmap data remain unchanged after normal Student reads', async () => {
    const riskAfter = ok(await get('/students/me/ojt-risk-assessment'));
    assert.deepEqual(stable(riskAfter), stable(riskBefore));
  });
});
