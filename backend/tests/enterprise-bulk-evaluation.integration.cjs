const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');
const jwt = require('jsonwebtoken');

const target = process.env.ENTERPRISE_EVALUATION_TEST_DATABASE_URL;
if (!target) throw Error('Set ENTERPRISE_EVALUATION_TEST_DATABASE_URL.');
const url = new URL(target);
if (url.hostname !== '127.0.0.1' || url.port !== '55441' || url.pathname !== '/enterprise_evaluation_test')
  throw Error('Only the disposable localhost enterprise_evaluation_test database is allowed.');
delete process.env.DATABASE_URL;
delete process.env.SUPABASE_DATABASE_URL;
process.env.LOCAL_DATABASE_URL = target;
process.env.DB_SSL = 'false';
process.env.JWT_SECRET = 'isolated-enterprise-evaluation-fixture-secret';
process.env.ENTERPRISE_RECRUITMENT_WORKER_ENABLED = 'false';
process.env.EMAIL_OUTBOX_KEY = '12'.repeat(32);

test('bulk grading persists editable drafts, atomically submits three-criterion averages and exposes only final scores to QHDN', async t => {
  const logger = require('../dist/config/logger').logger;
  const logError = logger.error.bind(logger);
  t.mock.method(logger, 'error', error => { if (!error.statusCode || error.statusCode >= 500) logError(error); });
  const db = new Client({ connectionString: target });
  await db.connect();
  t.after(() => db.end());
  await db.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public');
  await db.query(fs.readFileSync(path.join(__dirname, '../DB'), 'utf8'));
  const { pool } = require('../dist/config/database');
  t.after(() => pool.end());
  const users = (await db.query('SELECT "UserID","Username","AuthVersion" FROM "Users"')).rows;
  const companyUser = users.find(user => user.Username === 'enterprise01');
  const staffUser = users.find(user => user.Username === 'ojt.coord01');
  const academicUser = users.find(user => user.Username === 'academic01');
  const membership = (await db.query('SELECT "EnterpriseID" FROM "EnterpriseUsers" WHERE "UserID"=$1', [companyUser.UserID])).rows[0];
  const companyId = membership.EnterpriseID;
  const assignments = (await db.query(`SELECT a.*,co."OJTSemesterID" FROM "InternshipAssignments" a
    JOIN "StudentEnterpriseCoordination" co USING("CoordinationID") WHERE a."EnterpriseID"=$1 ORDER BY a."AssignmentID"`, [companyId])).rows;
  assert.ok(assignments.length >= 3);
  const [first, second, inactive] = assignments;
  const ids = [first.AssignmentID, second.AssignmentID];
  const semester = first.OJTSemesterID;
  const studentFor = async id => {
    const userId = (await db.query('SELECT "UserID" FROM "Students" WHERE "StudentID"=$1', [id])).rows[0].UserID;
    return users.find(user => user.UserID === userId);
  };
  const studentUser = await studentFor(first.StudentID);
  const secondStudentUser = await studentFor(second.StudentID);
  await db.query('UPDATE "InternshipAssignments" SET "Status"=\'ACTIVE\' WHERE "AssignmentID"=ANY($1::int[])', [ids]);
  await db.query('UPDATE "InternshipAssignments" SET "Status"=\'ASSIGNED\' WHERE "AssignmentID"=$1', [inactive.AssignmentID]);

  const app = require('../dist/app').default;
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const token = user => jwt.sign({ userId: user.UserID, username: user.Username, authVersion: user.AuthVersion }, process.env.JWT_SECRET);
  const request = async (route, user = companyUser, method = 'GET', body) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api${route}`, {
      method, headers: { Authorization: 'Bearer ' + token(user), 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, body: await response.json() };
  };
  const expect = (result, status) => { assert.equal(result.status, status, JSON.stringify(result.body)); return result.body.data; };
  const item = (id, completionScore = 9, skillScore = 8, attitudeScore = 9) => ({ assignmentId: id, completionScore, skillScore, attitudeScore, comments: null });
  const draft = items => ({ items, status: 'DRAFT', reason: 'Integration draft' });
  const final = items => ({ items, status: 'SUBMITTED', confirmed: true, reason: 'Integration confirmed submission' });
  const bulk = body => request('/enterprise/internships/evaluations/bulk', companyUser, 'POST', body);
  const saved = async () => (await db.query('SELECT * FROM "InternshipEvaluations" WHERE "AssignmentID"=ANY($1::int[]) ORDER BY "AssignmentID"', [ids])).rows;
  const auditCount = async () => (await db.query('SELECT count(*)::int AS n FROM "AuditLogs" WHERE "EntityType"=\'InternshipEvaluations\'')).rows[0].n;
  const qhdnResults = () => request(`/ojt-results?ojtSemesterId=${semester}&includeUntransferred=true`, staffUser);

  await t.test('permissions and input validation prevent invalid writes', async () => {
    expect(await request('/enterprise/internships/evaluations/bulk', staffUser, 'POST', draft([item(ids[0])])), 403);
    if (studentUser) expect(await request('/enterprise/internships/evaluations/bulk', studentUser, 'POST', draft([item(ids[0])])), 403);
    for (const body of [draft([]), draft([item(ids[0]), item(ids[0])]), draft([item(ids[0], -1)]),
      draft([item(ids[0], 8.123)]), draft([item(ids[0], 11)]), draft([item(ids[0], '8')]),
      draft(Array.from({ length: 301 }, (_, index) => item(index + 1))),
      { ...final([item(ids[0])]), confirmed: false }, final([item(ids[0], 8, null)])]) expect(await bulk(body), 400);
    assert.equal((await saved()).length, 0);
  });

  await t.test('incomplete drafts survive reload and stay out of QHDN results, evaluations and reports', async () => {
    const result = expect(await bulk(draft([item(ids[0], 6, null, null), item(ids[1], 0, 8, 9)])), 200);
    assert.equal(result.saved, 2);
    const stored = await saved();
    assert.equal(stored[0].OverallScore, null);
    assert.equal(Number(stored[1].OverallScore), 5.67);
    assert.ok(stored.every(row => row.Status === 'DRAFT' && row.EvaluatedAt === null));
    const reloaded = expect(await request(`/enterprise/internships?ojtSemesterId=${semester}`), 200);
    assert.equal(Number(reloaded.items.find(row => row.id === ids[0]).evaluation.completionScore), 6);
    assert.equal(reloaded.items.find(row => row.id === ids[0]).evaluationLocked, false);
    assert.equal(expect(await qhdnResults(), 200).items.some(row => ids.includes(row.assignmentId)), false);
    assert.equal(expect(await request(`/internship-evaluations?companyId=${companyId}`, staffUser), 200).items.length, 0);
    const staffAssignments = expect(await request(`/assignments?companyId=${companyId}`, staffUser), 200);
    assert.ok(staffAssignments.items.filter(row => ids.includes(row.id)).every(row => row.evaluation === null));
    const feedback = expect(await request(`/qhdn/reports?type=enterprise-feedback&ojtSemesterId=${semester}&companyId=${companyId}`, staffUser), 200);
    assert.ok(feedback.items.every(row => row.evaluationCount === 0));
    expect(await bulk(draft([item(ids[0], 7, 6, 8)])), 200);
    assert.equal(Number((await saved())[0].OverallScore), 7);
  });

  await t.test('a later invalid assignment or foreign company rolls back the entire batch and audits', async () => {
    const before = await saved(), audits = await auditCount();
    expect(await bulk(draft([item(ids[0], 1, 1, 1), item(inactive.AssignmentID)])), 409);
    assert.deepEqual(await saved(), before);
    assert.equal(await auditCount(), audits);
    const foreign = (await db.query('INSERT INTO "Enterprises" ("EnterpriseCode","Name","Status") VALUES (\'EVAL-FOREIGN\',\'Foreign evaluation fixture\',\'ACTIVE\') RETURNING "EnterpriseID"')).rows[0].EnterpriseID;
    await db.query('UPDATE "EnterpriseUsers" SET "EnterpriseID"=$1 WHERE "UserID"=$2', [foreign, companyUser.UserID]);
    expect(await bulk(draft([item(ids[0])])), 403);
    await db.query('UPDATE "EnterpriseUsers" SET "EnterpriseID"=$1 WHERE "UserID"=$2', [companyId, companyUser.UserID]);
    assert.deepEqual(await saved(), before);
  });

  const officialItems = [item(ids[0]), item(ids[1], 0, 0, 0)];
  await t.test('confirmation submits averages, publishes to QHDN immediately and locks all selected rows', async () => {
    const submitted = expect(await bulk(final(officialItems)), 200);
    assert.equal(submitted.items[0].overallScore, 8.67);
    assert.equal(submitted.items[1].overallScore, 0);
    const results = expect(await qhdnResults(), 200).items.filter(row => ids.includes(row.assignmentId));
    assert.equal(results.length, 2);
    assert.equal(results.find(row => row.assignmentId === ids[0]).overallScore, 8.67);
    assert.equal(results.find(row => row.assignmentId === ids[1]).overallScore, 0);
    assert.ok(results.every(row => row.status === 'SUBMITTED' && row.resultId === null));
    assert.equal(expect(await request(`/internship-evaluations?companyId=${companyId}`, staffUser), 200).items.length, 2);
    const reloaded = expect(await request(`/enterprise/internships?ojtSemesterId=${semester}`), 200);
    assert.ok(reloaded.items.filter(row => ids.includes(row.id)).every(row => row.evaluationLocked));
    const stored = await saved();
    assert.ok(stored.every(row => row.EvaluatedAt && row.Status === 'SUBMITTED'));
    assert.equal((await db.query('SELECT count(*)::int AS n FROM "OJTResults" WHERE "AssignmentID"=ANY($1::int[])', [ids])).rows[0].n, 0);
    const count = await auditCount();
    assert.ok(expect(await bulk(final(officialItems)), 200).items.every(row => row.replayed));
    assert.equal(await auditCount(), count);
    expect(await bulk(final([item(ids[0], 10, 10, 10)])), 409);
    expect(await bulk(draft(officialItems)), 409);
    expect(await request(`/enterprise/internships/${ids[0]}/evaluation`, companyUser, 'PUT', {
      completionScore: 10, skillScore: 10, attitudeScore: 10, overallScore: 10, comments: null, reason: 'Attempt to bypass final lock',
    }), 409);
    assert.deepEqual(await saved(), stored);
  });

  await t.test('legacy single-student endpoint also calculates averages on the server', async () => {
    await db.query('UPDATE "InternshipAssignments" SET "Status"=\'ACTIVE\' WHERE "AssignmentID"=$1', [inactive.AssignmentID]);
    const result = expect(await request(`/enterprise/internships/${inactive.AssignmentID}/evaluation`, companyUser, 'PUT', {
      completionScore: 2, skillScore: 3, attitudeScore: 4, overallScore: 10, comments: null, reason: 'Server average check',
    }), 200);
    assert.equal(result.overallScore, 3);
  });

  const studentResults = user => request(`/students/me/internships?ojtSemesterId=${semester}`, user);
  const publish = evaluationIds => request('/ojt-results/publish', staffUser, 'POST', {
    ojtSemesterId: semester, evaluationIds, reason: 'QHDN direct publication integration',
  });
  const evaluationIds = (await saved()).map(row => row.EvaluationID);
  const academicResults = (extra = '') => request(`/ojt-results?ojtSemesterId=${semester}${extra}`, academicUser);
  const publicationCount = async () => (await db.query(`SELECT count(*)::int AS n FROM "Notifications"
    WHERE "RelatedEntityType"='OJT_RESULT_PUBLISHED' AND "RelatedEntityID"=ANY($1::int[])`, [evaluationIds])).rows[0].n;
  const outboxCount = async () => (await db.query(`SELECT count(*)::int AS n FROM "EmailOutbox" WHERE "Kind"='OJT_RESULT'`)).rows[0].n;
  const gradeCount = async () => (await db.query('SELECT count(*)::int AS n FROM "StudentCourseResults"')).rows[0].n;
  const beforeGrades = await gradeCount();

  await t.test('unpublished scores stay hidden from students and Education; obsolete transfer/confirmation routes are removed', async () => {
    assert.ok(academicUser && studentUser && secondStudentUser);
    assert.equal(expect(await studentResults(studentUser), 200).results.total, 0);
    expect(await request(`/students/me/internships?ojtSemesterId=${semester}&resultId=${evaluationIds[0]}`, studentUser), 404);
    assert.equal(expect(await academicResults(), 200).total, 0);
    assert.equal(expect(await academicResults('&includeUntransferred=true'), 200).total, 0);
    for (const user of [studentUser, companyUser, academicUser])
      expect(await request('/ojt-results/publish', user, 'POST', { ojtSemesterId: semester, reason: 'Unauthorized' }), 403);
    expect(await request('/ojt-results', staffUser, 'POST', { assignmentId: ids[0], reason: 'Obsolete transfer', idempotencyKey: 'old' }), 404);
    expect(await request(`/ojt-results/${evaluationIds[0]}/confirm`, academicUser, 'POST', { reason: 'Obsolete confirmation', idempotencyKey: 'old' }), 404);
    const dashboard = expect(await request(`/qhdn/dashboard?ojtSemesterId=${semester}&companyId=${companyId}`, staffUser), 200);
    assert.equal(dashboard.results.published, 0);
    assert.equal(dashboard.results.unpublished, 3);
  });

  await t.test('publication validates the whole selection and rolls back notifications and queued emails after a later failure', async () => {
    expect(await publish([evaluationIds[0], 2147483647]), 409);
    expect(await publish([evaluationIds[0], evaluationIds[0]]), 400);
    assert.equal(await publicationCount(), 0);
    await db.query(`CREATE FUNCTION evaluation_publication_failure() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN IF NEW."UserID"=${secondStudentUser.UserID} THEN RAISE EXCEPTION 'Injected publication failure' USING ERRCODE='23514'; END IF; RETURN NEW; END $$;
      CREATE TRIGGER evaluation_publication_failure BEFORE INSERT ON "EmailOutbox" FOR EACH ROW EXECUTE FUNCTION evaluation_publication_failure()`);
    expect(await publish(evaluationIds), 400);
    assert.equal(await publicationCount(), 0);
    assert.equal(await outboxCount(), 0);
    assert.equal(expect(await academicResults(), 200).total, 0);
    await db.query('DROP TRIGGER evaluation_publication_failure ON "EmailOutbox"; DROP FUNCTION evaluation_publication_failure()');
  });

  await t.test('publishing one evaluation immediately makes scores visible to its student and the unchanged Education read contract', async () => {
    const result = expect(await publish([evaluationIds[0]]), 202);
    assert.equal(result.published, 1);
    const own = expect(await studentResults(studentUser), 200).results.items;
    assert.equal(own.length, 1);
    assert.equal(own[0].id, evaluationIds[0]);
    assert.equal(own[0].overallScore, 8.67);
    assert.equal(own[0].status, 'PUBLISHED');
    assert.ok(own[0].publishedAt);
    assert.equal(expect(await studentResults(secondStudentUser), 200).results.total, 0);
    expect(await request(`/students/me/internships?resultId=${evaluationIds[0]}`, secondStudentUser), 404);
    const academic = expect(await academicResults(), 200).items;
    assert.equal(academic.length, 1);
    assert.equal(academic[0].officialScore, 8.67);
    assert.equal(academic[0].status, 'CONFIRMED', 'Existing Education UI has no pending confirmation action for a published score');
    assert.ok(academic[0].confirmedAt);
    assert.equal(expect(await academicResults('&status=CONFIRMED'), 200).total, 1);
    assert.equal(expect(await academicResults('&status=PENDING_ACADEMIC_CONFIRMATION'), 200).total, 0);
    assert.equal(expect(await academicResults('&status=REVISION_REQUESTED'), 200).total, 0);
    const profile = expect(await request(`/students/${first.StudentID}?include=ojtRegistrations&ojtSemesterId=${semester}`, studentUser), 200);
    assert.equal(Number(profile.ojtRegistrations.items[0].evaluation.overallScore), 8.67);
    assert.equal(await gradeCount(), beforeGrades, 'Publishing scores does not rewrite academic course grades');
    assert.equal((await db.query('SELECT count(*)::int AS n FROM "OJTResults" WHERE "AssignmentID"=ANY($1::int[])', [ids])).rows[0].n, 0);
  });

  await t.test('concurrent publication retries expose zero scores once to students and Education without duplicate notifications/emails', async () => {
    const responses = await Promise.all([publish(evaluationIds), publish(evaluationIds)]);
    const summaries = responses.map(response => expect(response, 202));
    assert.equal(summaries.reduce((sum, result) => sum + result.published, 0), 1);
    assert.equal(await publicationCount(), 2);
    assert.equal(await outboxCount(), 2);
    const own = expect(await studentResults(secondStudentUser), 200).results.items;
    assert.equal(own.length, 1);
    assert.equal(own[0].overallScore, 0);
    assert.equal(own[0].status, 'PUBLISHED');
    const academic = expect(await academicResults('&status=CONFIRMED'), 200).items;
    assert.equal(academic.length, 2);
    assert.equal(academic.find(row => row.evaluationId === evaluationIds[1]).officialScore, 0);
    assert.equal(expect(await qhdnResults(), 200).items.filter(row => row.publishedToStudent).length, 2);
    const dashboard = expect(await request(`/qhdn/dashboard?ojtSemesterId=${semester}&companyId=${companyId}`, staffUser), 200);
    assert.deepEqual(dashboard.results, { total: 3, published: 2, unpublished: 1 });
  });
});
