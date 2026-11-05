// Run only against a disposable local database bootstrapped from backend/DB.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('node:fs');
const path = require('node:path');

const target = process.env.STUDENT_TEST_DATABASE_URL;
if (!target) throw Error('Set STUDENT_TEST_DATABASE_URL to the disposable local student_flow_test database.');
const address = new URL(target);
if (address.hostname !== '127.0.0.1' || address.port !== '55439' || address.pathname !== '/student_flow_test') {
  throw Error('Integration tests refuse all targets except 127.0.0.1:55439/student_flow_test. Never use a deployed database.');
}
delete process.env.DATABASE_URL;
delete process.env.SUPABASE_DATABASE_URL;
process.env.LOCAL_DATABASE_URL = target;
process.env.DB_SSL = 'false';
process.env.JWT_SECRET = 'student-integration-isolated-local-only';
delete process.env.ROADMAP_SERVICE_URL;
const { pool } = require('../dist/config/database');
const app = require('../dist/app').default;

test('student flow uses real PostgreSQL schema, enforces ownership and leaves other roles unchanged', async t => {
  const logger = require('../dist/config/logger').logger;
  const logError = logger.error.bind(logger);
  t.mock.method(logger, 'error', error => {
    if (!error.statusCode || (error.statusCode >= 500 && error.errorCode !== 'AI_NOT_CONFIGURED')) logError(error);
  });
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await pool.end(); });
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const operations = [];
  const swagger = require('../dist/config/swagger').swaggerSpec;
  const studentOperations = Object.entries(swagger.paths).flatMap(([route, item]) =>
    ['get','post','put','patch','delete'].filter(method => item[method]?.['x-roles']?.includes('STUDENT'))
      .map(method => ({ route, method: method.toUpperCase(), pattern: new RegExp('^' + route.replace(/\{[^}]+\}/g, '[^/]+') + '$') })));
  const accounts = (await pool.query(`SELECT u."UserID" AS id,u."Username" AS username,u."Email" AS email,
    u."AuthVersion" AS version,r."RoleCode" AS role,s."StudentID" AS "studentId"
    FROM "Users" u JOIN "Roles" r USING("RoleID") LEFT JOIN "Students" s USING("UserID")
    WHERE u."Status"='ACTIVE' ORDER BY u."UserID"`)).rows;
  const student = accounts.find(account => account.studentId === 1);
  const intern = accounts.find(account => account.studentId === 2);
  const another = accounts.find(account => account.studentId === 3);
  assert.ok(student && intern && another, 'Reload backend/DB in the disposable test database.');
  const sign = account => jwt.sign({ userId: account.id, username: account.username, authVersion: account.version, roleCode: account.role }, process.env.JWT_SECRET, { expiresIn: '5m' });
  const request = async (path, token, options = {}) => {
    const response = await fetch(base + path, { ...options, headers: {
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    } });
    const body = response.headers.get('content-type')?.includes('application/json') ? await response.json() : await response.text();
    if (token && jwt.decode(token)?.roleCode === 'STUDENT') {
      const pathname = new URL(base + path).pathname;
      const operation = studentOperations.find(item => item.method === (options.method || 'GET') && item.pattern.test(pathname));
      if (operation) operations.push({ operation: operation.method + ' ' + operation.route, status: response.status });
    }
    return { status: response.status, body };
  };
  const expect = (result, code, label) => assert.equal(result.status, code, label + ': ' + JSON.stringify(result.body));
  const token = sign(student), internToken = sign(intern), otherToken = sign(another);
  const term = (await pool.query('SELECT "OJTSemesterID" AS id FROM "EligibleStudentHandoffItems" WHERE "StudentID"=$1 LIMIT 1', [student.studentId])).rows[0].id;

  await t.test('real login and auth/me return StudentID only for STUDENT', async () => {
    const password = 'student-isolated-integration-password';
    await pool.query('UPDATE "Users" SET "PasswordHash"=$2,"MustChangePassword"=false WHERE "UserID"=$1', [student.id, await bcrypt.hash(password, 4)]);
    const login = await request('/auth/login', null, { method: 'POST', body: JSON.stringify({ email: student.email, password }) });
    expect(login, 200, 'login');
    const me = await request('/auth/me', login.body.token);
    expect(me, 200, 'student identity');
    assert.equal(me.body.user.studentId, student.studentId);
    for (const role of ['ADMIN', 'ACADEMIC', 'OJT_COORD', 'ENTERPRISE']) {
      const result = await request('/auth/me', sign(accounts.find(account => account.role === role)));
      expect(result, 200, role + ' identity');
      assert.equal(Object.hasOwn(result.body.user, 'studentId'), false, 'Other role auth payload is unchanged');
    }
  });

  await t.test('profile, courses, curriculum, dashboard and opportunities follow current academic handoff', async () => {
    const profile = await request(`/students/${student.studentId}?include=academicProgress,courseResults,curriculum`, token);
    expect(profile, 200, 'own profile');
    assert.equal(typeof profile.body.data.academicProgress.credits.earned, 'number');
    assert.ok(Array.isArray(profile.body.data.courseResults.items));
    assert.ok(Array.isArray(profile.body.data.curriculum.courses));
    const exactFrontendProfile = await request(`/students/${student.studentId}?include=academicProgress,ojtRegistrations`, token);
    expect(exactFrontendProfile, 200, 'frontend getStudentProfile');
    assert.ok(Array.isArray(exactFrontendProfile.body.data.ojtRegistrations.items));
    const transcript = await request(`/students/${student.studentId}?include=courseResults&resultsPage=1&resultsLimit=100`, token);
    expect(transcript, 200, 'frontend getAllCourseResults');
    assert.ok(transcript.body.data.courseResults.items.every(item => Object.hasOwn(item, 'semesterTaken') && Object.hasOwn(item, 'gradePoints')));
    expect(await request(`/students/${student.studentId}`, otherToken), 403, 'foreign profile');
    const dashboard = await request(`/students/me/dashboard?ojtSemesterId=${term}`, token);
    expect(dashboard, 200, 'dashboard');
    assert.equal(dashboard.body.data.academic.admissionEligibility.source, 'FRONTEND_HANDOFF');
    assert.equal(dashboard.body.data.academic.admissionEligibility.status, 'ELIGIBLE');
    assert.equal(dashboard.body.data.academic.admissionEligibility.isStale, false);
    const windows = await request('/ojt-registration-windows', token);
    expect(windows, 200, 'registration windows');
    const window = windows.body.data.items.find(item => item.ojtSemesterId === term);
    assert.ok(window?.canSubmit, JSON.stringify(windows.body));
    const opportunities = await request(`/students/me/opportunities?windowId=${window.id}`, token);
    expect(opportunities, 200, 'opportunities');
    assert.equal(opportunities.body.data.canApply, true, JSON.stringify(opportunities.body));
    assert.equal(opportunities.body.data.admissionEligibility.source, 'FRONTEND_HANDOFF');
    expect(await request(`/students/me/roadmap-recommendations?ojtSemesterId=${term}`, token), 503, 'unconfigured AI stays explicit');
  });

  await t.test('upload CV and direct application work without manufacturing an official check', async () => {
    const pdf = new FormData();
    pdf.append('cv', new Blob(['%PDF-1.4\nstudent-local-fixture\n%%EOF'], { type: 'application/pdf' }), 'student-test.pdf');
    const cv = await request('/students/me/cv', token, { method: 'POST', body: pdf });
    expect(cv, 201, 'CV upload');
    expect(await request(`/students/${student.studentId}/cv?cvFileId=${cv.body.data.id}`, token), 200, 'CV read');
    expect(await request(`/students/${student.studentId}/cv?cvFileId=${cv.body.data.id}`, otherToken), 403, 'foreign CV');
    const windows = (await request('/ojt-registration-windows', token)).body.data.items;
    const window = windows.find(item => item.ojtSemesterId === term);
    const opportunities = (await request(`/students/me/opportunities?windowId=${window.id}`, token)).body.data;
    const position = opportunities.items.find(item => item.canApply);
    assert.ok(position, 'Need an open seeded position.');
    const registration = await request('/ojt-registrations', token, { method: 'POST', body: JSON.stringify({
      windowId: window.id, application: { contactPhone: '0900000000', contactEmail: student.email, note: 'Integration registration' },
    }) });
    expect(registration, 201, 'standalone OJT registration');
    const registrationReplay = await request('/ojt-registrations', token, { method: 'POST', body: JSON.stringify({
      windowId: window.id, application: { contactPhone: '0900000000', contactEmail: student.email, note: 'Integration registration' },
    }) });
    expect(registrationReplay, 201, 'registration replay');
    assert.equal(registrationReplay.body.data.id, registration.body.data.id);
    assert.equal(registrationReplay.body.data.replayed, true);
    const body = { windowId: window.id, postId: position.postId, positionId: position.id,
      coverLetter: 'Isolated integration application', application: { contactEmail: student.email, contactPhone: '0900000000', note: null } };
    const applied = await request('/job-applications', token, { method: 'POST', body: JSON.stringify(body) });
    expect(applied, 201, 'application');
    assert.equal(applied.body.data.studentId, student.studentId);
    assert.equal(applied.body.data.cvFileId, cv.body.data.id);
    assert.equal(applied.body.data.officialCheckId, null);
    const replay = await request('/job-applications', token, { method: 'POST', body: JSON.stringify(body) });
    expect(replay, 201, 'application replay');
    assert.equal(replay.body.data.replayed, true);
    assert.equal(replay.body.data.id, applied.body.data.id);
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM "StudentEnterpriseCoordination" WHERE "ApplicationID"=$1', [applied.body.data.id])).rows[0].n, 1);
    const applications = await request(`/job-applications?ojtSemesterId=${term}&page=1&limit=20`, token);
    expect(applications, 200, 'frontend applications');
    assert.ok(applications.body.data.items.some(item => item.id === applied.body.data.id));
    assert.ok(applications.body.data.items.every(item => item.studentId === student.studentId));
    const registrations = await request(`/ojt-registrations?ojtSemesterId=${term}&page=1&limit=20`, token);
    expect(registrations, 200, 'frontend registrations');
    assert.ok(registrations.body.data.items.some(item => item.id === registration.body.data.id));
    expect(await request('/job-applications', token, { method: 'POST', body: JSON.stringify({ ...body, studentId: another.studentId }) }), 400, 'spoofed student');
  });

  await t.test('stale academic handoffs disable registration and opportunities consistently', async () => {
    const before = (await pool.query('SELECT "CheckedAt" FROM "StudentOJTCalculatedResults" WHERE "StudentID"=$1', [another.studentId])).rows[0];
    await pool.query('UPDATE "StudentOJTCalculatedResults" SET "CheckedAt"=\'2000-01-01T00:00:00Z\' WHERE "StudentID"=$1', [another.studentId]);
    try {
      const windows = (await request('/ojt-registration-windows', otherToken)).body.data.items;
      const window = windows.find(item => item.ojtSemesterId === term);
      assert.equal(window.admissionEligibility.isStale, true);
      assert.ok(window.blockingReasons.includes('ELIGIBILITY_HANDOFF_STALE'));
      const opportunities = await request(`/students/me/opportunities?windowId=${window.id}`, otherToken);
      expect(opportunities, 200, 'stale opportunities');
      assert.equal(opportunities.body.data.canApply, false);
      assert.ok(opportunities.body.data.blockers.includes('ELIGIBILITY_HANDOFF_STALE'));
      const registration = await request('/ojt-registrations', otherToken, { method: 'POST', body: JSON.stringify({ windowId: window.id, application: { contactEmail: another.email } }) });
      expect(registration, 409, 'stale registration');
      assert.equal(registration.body.errorCode, 'ELIGIBILITY_HANDOFF_STALE');
    } finally {
      await pool.query('UPDATE "StudentOJTCalculatedResults" SET "CheckedAt"=$2 WHERE "StudentID"=$1', [another.studentId, before.CheckedAt]);
    }
  });

  await t.test('notifications and account profile use only the authenticated student', async () => {
    const notification = (await pool.query(`INSERT INTO "Notifications" ("UserID","Title","Content","IsRead","SentAt")
      VALUES($1,'Integration notification','Student-owned notification',false,now()) RETURNING "NotificationID"`, [student.id])).rows[0].NotificationID;
    const list = await request('/students/me/notifications?unread=true', token);
    expect(list, 200, 'notifications');
    assert.ok(list.body.data.items.some(item => item.id === notification));
    expect(await request(`/students/me/notifications/${notification}`, otherToken, { method: 'PATCH', body: JSON.stringify({ isRead: true }) }), 404, 'foreign notification');
    const read = await request(`/students/me/notifications/${notification}`, token, { method: 'PATCH', body: JSON.stringify({ isRead: true }) });
    expect(read, 200, 'mark read');
    assert.equal(read.body.data.isRead, true);
    const update = await request('/accounts/me/profile', token, { method: 'PATCH', body: JSON.stringify({ fullName: 'Student integration profile', phone: '0900000001' }) });
    expect(update, 200, 'own account update');
    assert.equal(update.body.account.full_name, 'Student integration profile');
    expect(await request('/accounts/me/profile', token, { method: 'PATCH', body: JSON.stringify({ roleCode: 'ADMIN' }) }), 400, 'role escalation');
    const results = await request(`/students/me/internships?ojtSemesterId=${term}`, token);
    expect(results, 200, 'published results');
    assert.ok(results.body.data.results.items.every(item => item.status === 'CONFIRMED'));
  });

  let taskId;
  await t.test('existing internship response and direct task API include submission metadata', async () => {
    const assignment = (await pool.query('SELECT "AssignmentID" AS id FROM "InternshipAssignments" WHERE "StudentID"=$1 ORDER BY "AssignmentID" LIMIT 1', [intern.studentId])).rows[0];
    await pool.query('UPDATE "InternshipAssignments" SET "StartDate"=current_date-5,"EndDate"=current_date+90,"Status"=\'ACTIVE\' WHERE "AssignmentID"=$1', [assignment.id]);
    taskId = (await pool.query(`INSERT INTO "InternshipTasks"("AssignmentID","TaskName","Description","AssignedDate","DueDate","Status")
      VALUES($1,'Isolated submission task','Integration task',current_date-1,current_date-1,'TODO') RETURNING "TaskID"`, [assignment.id])).rows[0].TaskID;
    const merged = await request(`/students/me/internships?ojtSemesterId=${term}`, internToken);
    expect(merged, 200, 'internship tasks');
    const task = merged.body.data.tasks.items.find(item => item.id === taskId);
    assert.equal(task.canSubmit, true);
    assert.equal(task.submissionCount, 0);
    assert.equal(task.latestSubmission, null);
    const direct = await request(`/students/me/tasks?ojtSemesterId=${term}`, internToken);
    expect(direct, 200, 'direct task alias');
    assert.deepEqual(direct.body.data, merged.body.data.tasks);
    expect(await request(`/students/me/tasks?ojtSemesterId=${term}&studentId=${intern.studentId}`, token), 400, 'foreign scope parameter');
  });

  await t.test('submission ownership, late marker, retries, history and closed tasks use real SQL', async () => {
    const path = `/students/me/tasks/${taskId}/submissions`;
    expect(await request(path, otherToken), 404, 'foreign history');
    expect(await request(path, otherToken, { method: 'POST', body: JSON.stringify({ content: 'forbidden' }) }), 404, 'foreign submission');
    for (const content of ['', ' '.repeat(3), 'x'.repeat(10001), 12]) {
      expect(await request(path, internToken, { method: 'POST', body: JSON.stringify({ content }) }), 400, 'invalid submission');
    }
    expect(await request(path, internToken, { method: 'POST', body: JSON.stringify({ content: 'text', status: 'DONE' }) }), 400, 'student cannot complete task');
    const body = JSON.stringify({ content: 'Work result https://example.test/submission' });
    const results = await Promise.all([1, 2].map(() => request(path, internToken, { method: 'POST', body })));
    for (const result of results) expect(result, 201, 'concurrent submission');
    assert.deepEqual(results.map(result => result.body.data.replayed).sort(), [false, true]);
    assert.equal(results[0].body.data.isLate, true);
    assert.equal(results[0].body.data.studentId, intern.studentId);
    const history = await request(path + '?page=1&limit=20', internToken);
    expect(history, 200, 'submission history');
    assert.equal(history.body.data.total, 1);
    const refreshed = (await request(`/students/me/tasks?ojtSemesterId=${term}`, internToken)).body.data.items.find(item => item.id === taskId);
    assert.equal(refreshed.submissionCount, 1);
    assert.equal(refreshed.latestSubmission.id, history.body.data.items[0].id);
    assert.equal((await pool.query('SELECT "Status" FROM "InternshipTasks" WHERE "TaskID"=$1', [taskId])).rows[0].Status, 'DONE');
    assert.equal((await pool.query('SELECT "PercentComplete" FROM "TaskProgressUpdates" WHERE "TaskID"=$1', [taskId])).rows[0].PercentComplete, 100);
    assert.equal(refreshed.canSubmit, false);
    assert.equal(refreshed.percentComplete, 100);
    await pool.query('UPDATE "InternshipTasks" SET "Status"=\'DONE\' WHERE "TaskID"=$1', [taskId]);
    expect(await request(path, internToken, { method: 'POST', body: JSON.stringify({ content: 'New result' }) }), 409, 'closed task');
    const replay = await request(path, internToken, { method: 'POST', body });
    expect(replay, 201, 'retry accepted result after closing');
    assert.equal(replay.body.data.replayed, true);
  });

  await t.test('new routes reject non-students and preserve password-change gate', async () => {
    for (const role of ['ADMIN', 'ACADEMIC', 'OJT_COORD', 'ENTERPRISE']) {
      const other = sign(accounts.find(account => account.role === role));
      expect(await request(`/students/me/tasks?ojtSemesterId=${term}`, other), 403, role + ' task access');
      expect(await request(`/students/me/tasks/${taskId}/submissions`, other), 403, role + ' submission access');
    }
    expect(await request(`/students/me/tasks?ojtSemesterId=${term}`, null), 401, 'anonymous');
    await pool.query('UPDATE "Users" SET "MustChangePassword"=true,"TemporaryPasswordExpiresAt"=now()+interval \'1 hour\' WHERE "UserID"=$1', [intern.id]);
    expect(await request(`/students/me/tasks/${taskId}/submissions`, internToken), 403, 'temporary password');
    await pool.query('UPDATE "Users" SET "MustChangePassword"=false WHERE "UserID"=$1', [intern.id]);
  });

  await t.test('configured roadmap provider returns real provider data and rejects invalid payloads', async () => {
    let invalid = false;
    let received;
    const provider = http.createServer(async (req, res) => {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      received = JSON.parse(Buffer.concat(chunks).toString());
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(invalid ? { modelVersion: 'local-integration', recommendations: [12] }
        : { modelVersion: 'local-integration', recommendations: ['Advice returned by the configured provider'] }));
    });
    await new Promise(resolve => provider.listen(0, '127.0.0.1', resolve));
    process.env.ROADMAP_SERVICE_URL = `http://127.0.0.1:${provider.address().port}/roadmap`;
    try {
      const result = await request(`/students/me/roadmap-recommendations?ojtSemesterId=${term}`, token);
      expect(result, 200, 'configured roadmap');
      assert.equal(result.body.data.modelVersion, 'local-integration');
      assert.equal(result.body.data.recommendations[0], 'Advice returned by the configured provider');
      assert.equal(received.academicSummary.studentId, student.studentId);
      invalid = true;
      expect(await request(`/students/me/roadmap-recommendations?ojtSemesterId=${term}`, token), 502, 'invalid AI response');
    } finally {
      delete process.env.ROADMAP_SERVICE_URL;
      provider.closeAllConnections();
      await new Promise(resolve => provider.close(resolve));
    }
  });

  await t.test('remaining STUDENT routes return bounded data or explicit missing-record errors', async () => {
    const semester = await request(`/ojt-semesters/${term}/students`, token);
    expect(semester, 200, 'student semester read');
    assert.ok(semester.body.data.items.every(item => item.studentId === student.studentId));
    const combos = await request('/combo-registration-windows?page=1&limit=20', token);
    expect(combos, 200, 'combo windows');
    assert.ok(Array.isArray(combos.body.data.items));
    // backend/DB does not seed a combo window; verify real route/DB behavior, not fake a successful submission.
    for (const action of ['preview','selections']) {
      const result = await request(`/combo-registration-windows/2147483647/${action}`, token, {
        method: 'POST', body: JSON.stringify({ comboId: 1, courseIds: [1], reason: 'Integration missing combo' }),
      });
      expect(result, 404, 'unavailable combo ' + action);
    }
    expect(await request(`/students/me/internships?ojtSemesterId=${term}&resultId=2147483647`, token), 404, 'nonexistent published result');
  });

  let academicConfirmationBlocked = false;
  await t.test('student published-result contract works, with the existing academic confirmation blocker reported', async () => {
    const assignment = (await pool.query('SELECT "AssignmentID" AS id FROM "InternshipAssignments" WHERE "StudentID"=$1 ORDER BY "AssignmentID" LIMIT 1', [intern.studentId])).rows[0];
    const enterprise = accounts.find(account => account.role === 'ENTERPRISE');
    const coordinator = accounts.find(account => account.role === 'OJT_COORD');
    const academic = accounts.find(account => account.role === 'ACADEMIC');
    // Advance this isolated fixture to the mapped OJT stage; keep all DB guards enabled.
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE "Students" SET "CurrentSemester"=6 WHERE "StudentID"=$1', [intern.studentId]);
      await client.query('UPDATE "StudentAcademicPlacements" SET "CurrentAcademicPeriodID"=(SELECT "AcademicPeriodID" FROM "OJTSemesters" WHERE "OJTSemesterID"=$2) WHERE "StudentID"=$1', [intern.studentId, term]);
      await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
    await pool.query('UPDATE "InternshipAssignments" SET "Status"=\'COMPLETED\' WHERE "AssignmentID"=$1', [assignment.id]);
    const evaluation = await request(`/enterprise/internships/${assignment.id}/evaluation`, sign(enterprise), {
      method: 'PUT', body: JSON.stringify({ completionScore: 8, attitudeScore: 8, skillScore: 8, overallScore: 8,
        comments: 'Isolated student result review', reason: 'Integration evaluation' }),
    });
    expect(evaluation, 200, 'existing enterprise evaluation');
    const transferred = await request('/ojt-results', sign(coordinator), { method: 'POST', body: JSON.stringify({
      assignmentId: assignment.id, reason: 'Integration result transfer', idempotencyKey: 'student-review-transfer',
    }) });
    expect(transferred, 201, 'existing QHDN transfer');
    const resultId = transferred.body.data.resultId;
    const pending = await request(`/students/me/internships?ojtSemesterId=${term}&resultId=${resultId}`, internToken);
    expect(pending, 404, 'unconfirmed result hidden');
    const confirmed = await request(`/ojt-results/${resultId}/confirm`, sign(academic), { method: 'POST', body: JSON.stringify({
      reason: 'Integration academic confirmation', idempotencyKey: 'student-review-confirm',
    }) });
    // Review finding: the pre-existing ACADEMIC write omits SemesterTaken/AcademicYearID.
    // Do not change another role's implementation. Record the actual blocker explicitly.
    expect(confirmed, 400, 'known existing academic confirmation constraint failure');
    assert.equal(confirmed.body.errorCode, 'INVALID_ACADEMIC_INPUT');
    academicConfirmationBlocked = true;
    console.log('KNOWN BLOCKER: POST /ojt-results/:id/confirm cannot write OJT202 grade; see docs/student-api-review.md.');
    // Build a valid confirmed read fixture in the disposable DB, with every constraint enabled.
    // This verifies the STUDENT read contract, not a successful end-to-end academic confirmation.
    const fixture = await pool.connect();
    try {
      await fixture.query('BEGIN');
      const mapping = (await fixture.query(`SELECT m.*,p."AcademicYearID" FROM "ProgramOJTGradeMappings" m
        JOIN "AcademicPeriods" p ON p."AcademicPeriodID"=m."AcademicPeriodID"
        WHERE m."OJTSemesterID"=$1 AND m."ProgramID"=(SELECT "ProgramID" FROM "Students" WHERE "StudentID"=$2)`, [term, intern.studentId])).rows[0];
      const band = [...mapping.GradeBands].sort((a, b) => b.minimumScore - a.minimumScore).find(item => 8 >= item.minimumScore);
      await fixture.query('UPDATE "OJTResults" SET "OfficialScore"=8,"Outcome"=$2,"Version"="Version"+1 WHERE "ResultID"=$1', [resultId, band.outcome]);
      const grade = (await fixture.query(`INSERT INTO "StudentCourseResults"
        ("StudentID","CourseID","AcademicPeriodID","AcademicYearID","SemesterTaken","AttemptNumber","Score","Grade","GradePoints","Status","OJTResultID","RecordedBy")
        VALUES($1,$2,$3,$4,6,1,8,$5,$6,$7,$8,$9) RETURNING "ResultID"`,
      [intern.studentId, mapping.CourseID, mapping.AcademicPeriodID, mapping.AcademicYearID, band.grade, band.gradePoints, band.outcome, resultId, academic.id])).rows[0];
      await fixture.query(`UPDATE "OJTResults" SET "Status"='CONFIRMED',"Version"="Version"+1,"ConfirmedBy"=$2,"ConfirmedAt"=now(),
        "ConfirmationReason"='Isolated STUDENT read-contract fixture; not API confirmation',"CourseResultID"=$3,"GradeMappingID"=$4,"GradeMappingSnapshot"=$5
        WHERE "ResultID"=$1`, [resultId, academic.id, grade.ResultID, mapping.MappingID, JSON.stringify(mapping)]);
      await fixture.query('COMMIT');
    } catch (error) { await fixture.query('ROLLBACK'); throw error; } finally { fixture.release(); }
    const published = await request(`/students/me/internships?ojtSemesterId=${term}&resultId=${resultId}`, internToken);
    expect(published, 200, 'frontend getOjtResult with actual published data');
    assert.equal(published.body.data.result.id, resultId);
    assert.equal(published.body.data.result.officialScore, 8);
    assert.equal(published.body.data.result.status, 'CONFIRMED');
    assert.equal(published.body.data.assignment.id, assignment.id);
    const list = await request(`/students/me/internships?ojtSemesterId=${term}&resultsPage=1&resultsLimit=20`, internToken);
    expect(list, 200, 'frontend getOjtResults');
    assert.ok(list.body.data.results.items.some(item => item.id === resultId));
    expect(await request(`/students/me/internships?resultId=${resultId}`, otherToken), 404, 'foreign published result');
    const grade = (await pool.query('SELECT "Score","Status" FROM "StudentCourseResults" WHERE "StudentID"=$1 AND "OJTResultID"=$2', [intern.studentId, resultId])).rows[0];
    assert.equal(Number(grade.Score), 8);
    assert.equal(grade.Status, 'PASSED');
  });

  await t.test('password change revokes the old student token and new credentials can log in', async () => {
    const newPassword = 'student-new-integration-password';
    const change = await request('/auth/change-password', token, { method: 'POST', body: JSON.stringify({
      currentPassword: 'student-isolated-integration-password', newPassword,
    }) });
    expect(change, 200, 'change password');
    expect(await request('/auth/me', token), 401, 'old token revoked');
    const login = await request('/auth/login', null, { method: 'POST', body: JSON.stringify({ email: student.email, password: newPassword }) });
    expect(login, 200, 'new login');
    expect(await request('/auth/me', login.body.token), 200, 'new token');
    expect(await request('/auth/logout', login.body.token, { method: 'POST' }), 200, 'logout');
  });

  await t.test('every documented STUDENT operation was exercised over HTTP', () => {
    const report = studentOperations.map(operation => {
      const key = operation.method + ' ' + operation.route;
      return { operation: key, statuses: [...new Set(operations.filter(item => item.operation === key).map(item => item.status))].sort() };
    });
    assert.deepEqual(report.filter(item => !item.statuses.length), [], 'Missing STUDENT API coverage');
    fs.mkdirSync(path.resolve(__dirname, '../.local'), { recursive: true });
    fs.writeFileSync(path.resolve(__dirname, '../.local/student-api-review.json'), JSON.stringify({
      database: 'isolated PostgreSQL loaded from backend/DB; not production',
      operationsCovered: report.length, operations: report,
      fullyReadyEndToEnd: false,
      knownBlockers: academicConfirmationBlocked ? ['ACADEMIC POST /ojt-results/{id}/confirm omits grade semester/year and fails DB constraints. Student read succeeds with a valid DB fixture.'] : [],
      limitations: ['Combo happy path needs an actual combo window/roster.', 'AI test uses a local provider fixture.', 'Production database has not been audited.'],
    }, null, 2));
    console.log(`${report.length}/${studentOperations.length} STUDENT operations exercised over HTTP; coverage report: .local/student-api-review.json`);
  });
});
