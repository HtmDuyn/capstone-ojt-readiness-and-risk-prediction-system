const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const jwt = require('jsonwebtoken');
const target = process.env.STUDENT_TEST_DATABASE_URL;
if (!target) throw Error('STUDENT_TEST_DATABASE_URL is required.');
const url = new URL(target);
if (url.hostname !== '127.0.0.1' || url.port !== '55439' || url.pathname !== '/student_flow_test')
  throw Error('Only the disposable local student_flow_test database is allowed.');
delete process.env.DATABASE_URL;
delete process.env.SUPABASE_DATABASE_URL;
process.env.LOCAL_DATABASE_URL = target;
process.env.DB_SSL = 'false';
process.env.JWT_SECRET = 'student-task-isolated-integration-secret';
const { pool } = require('../dist/config/database');
const app = require('../dist/app').default;

test('student task listing, progress metadata and submissions', async t => {
  const logger = require('../dist/config/logger').logger;
  const log = logger.error.bind(logger);
  t.mock.method(logger, 'error', error => { if (!error.statusCode || error.statusCode >= 500) log(error); });
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await pool.end(); });
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const actor = (await pool.query(`SELECT s."StudentID" id,s."UserID" user_id,u."Username" username,u."AuthVersion" version,
    a."AssignmentID" assignment_id,co."OJTSemesterID" term_id
    FROM "Students" s JOIN "Users" u USING("UserID") JOIN "InternshipAssignments" a USING("StudentID")
    JOIN "StudentEnterpriseCoordination" co USING("CoordinationID") WHERE s."StudentID"=2 LIMIT 1`)).rows[0];
  const token = jwt.sign({ userId: actor.user_id, username: actor.username, authVersion: actor.version, roleCode: 'STUDENT' }, process.env.JWT_SECRET);
  await pool.query(`UPDATE "InternshipAssignments" SET "StartDate"=current_date-5,"EndDate"=current_date+30,"Status"='ACTIVE' WHERE "AssignmentID"=$1`, [actor.assignment_id]);
  const createTask = async name => (await pool.query(`INSERT INTO "InternshipTasks"
    ("AssignmentID","TaskName","AssignedDate","DueDate","Status") VALUES($1,$2,current_date,current_date,'TODO') RETURNING "TaskID"`, [actor.assignment_id, name])).rows[0].TaskID;
  const taskA = await createTask('Task A'), taskB = await createTask('Task B'), taskEmpty = await createTask('Task without submission');
  const post = (id, content) => request(`/students/me/tasks/${id}/submissions`, { method: 'POST', body: JSON.stringify({ content }) });
  const request = async (route, options = {}) => {
    const response = await fetch(base + route, { ...options, headers: { Authorization: 'Bearer ' + token,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers } });
    return { status: response.status, body: await response.json() };
  };
  const expect = (result, status) => assert.equal(result.status, status, JSON.stringify(result.body));
  const listing = async () => {
    const result = await request(`/students/me/tasks?ojtSemesterId=${actor.term_id}&limit=100`);
    expect(result, 200);
    return result.body.data;
  };

  await t.test('latest submission is isolated per task, including tasks without submissions', async () => {
    const before = (await listing()).progress;
    expect(await post(taskA, 'Only task A content'), 201);
    expect(await post(taskB, 'Only task B content'), 201);
    const data = await listing();
    const a = data.items.find(item => item.id === taskA), b = data.items.find(item => item.id === taskB);
    const empty = data.items.find(item => item.id === taskEmpty);
    assert.equal(a.latestSubmission.taskId, taskA);
    assert.equal(a.latestSubmission.content, 'Only task A content');
    assert.equal(b.latestSubmission.taskId, taskB);
    assert.equal(b.latestSubmission.content, 'Only task B content');
    assert.equal(empty.submissionCount, 0);
    assert.equal(empty.latestSubmission, null);
    assert.equal(a.status, 'DONE');
    assert.equal(a.percentComplete, 100);
    assert.equal(a.canSubmit, false);
    assert.equal(b.status, 'DONE');
    assert.equal(empty.percentComplete, 0);
    assert.equal(data.progress.completedTasks, before.completedTasks + 2);
    assert.equal(data.progress.totalTasks, before.totalTasks);
    assert.ok(data.progress.percentComplete > before.percentComplete);
  });

  await t.test('completed task rejects a new version and identical retries do not increase progress', async () => {
    const before = (await listing()).progress;
    expect(await post(taskA, 'Task A revision 2'), 409);
    const replay = await post(taskA, '  Only task A content  ');
    expect(replay, 201);
    assert.equal(replay.body.data.replayed, true);
    const page1 = await request(`/students/me/tasks/${taskA}/submissions?page=1&limit=1`);
    const page2 = await request(`/students/me/tasks/${taskA}/submissions?page=2&limit=1`);
    expect(page1, 200); expect(page2, 200);
    assert.equal(page1.body.data.total, 1);
    assert.equal(page1.body.data.items[0].content, 'Only task A content');
    assert.equal(page1.body.data.items[0].percentComplete, 100);
    assert.deepEqual(page2.body.data.items, []);
    const a = (await listing()).items.find(item => item.id === taskA);
    assert.equal(a.submissionCount, 1);
    assert.equal(a.latestSubmission.id, page1.body.data.items[0].id);
    assert.deepEqual((await listing()).progress, before);
  });

  await t.test('task due date is inclusive in Vietnam time and missing deadline is not marked late', async () => {
    for (const [offset, expectedLate] of [[0,false],[-1,true],[1,false]]) {
      const task = await createTask('Deadline case ' + offset);
      await pool.query('UPDATE "InternshipTasks" SET "DueDate"=current_date+$2::int WHERE "TaskID"=$1', [task, offset]);
      const result = await post(task, `Deadline case ${offset}`);
      expect(result, 201);
      assert.equal(result.body.data.isLate, expectedLate);
      assert.ok(Number.isFinite(Date.parse(result.body.data.submittedAt)));
      assert.equal(result.body.data.percentComplete, 100);
      assert.equal((await pool.query('SELECT "Status" FROM "InternshipTasks" WHERE "TaskID"=$1', [task])).rows[0].Status, 'DONE');
    }
    const noDeadline = await createTask('No deadline');
    await pool.query('UPDATE "InternshipTasks" SET "DueDate"=NULL WHERE "TaskID"=$1', [noDeadline]);
    const result = await post(noDeadline, 'No deadline case');
    expect(result, 201);
    assert.equal(result.body.data.isLate, false);
  });

  await t.test('all closed or unsupported task states block new content and metadata agrees with POST', async () => {
    for (const status of ['DONE','COMPLETED','CANCELLED',null]) {
      await pool.query('UPDATE "InternshipTasks" SET "Status"=$2 WHERE "TaskID"=$1', [taskEmpty, status]);
      assert.equal((await listing()).items.find(item => item.id === taskEmpty).canSubmit, false);
      const result = await post(taskEmpty, 'Should not be saved for ' + status);
      expect(result, 409);
      assert.equal(result.body.errorCode, 'TASK_SUBMISSION_CLOSED');
    }
    assert.equal((await pool.query('SELECT count(*)::int n FROM "TaskProgressUpdates" WHERE "TaskID"=$1', [taskEmpty])).rows[0].n, 0);
    await pool.query('UPDATE "InternshipTasks" SET "Status"=\'TODO\' WHERE "TaskID"=$1', [taskEmpty]);
  });

  await t.test('open task states allow submissions through the final internship day', async () => {
    await pool.query('UPDATE "InternshipAssignments" SET "StartDate"=current_date-5,"EndDate"=current_date WHERE "AssignmentID"=$1', [actor.assignment_id]);
    for (const status of ['TODO','PENDING','IN_PROGRESS']) {
      await pool.query('UPDATE "InternshipTasks" SET "Status"=$2 WHERE "TaskID"=$1', [taskB, status]);
      assert.equal((await listing()).items.find(item => item.id === taskB).canSubmit, true);
      expect(await post(taskB, 'Allowed state ' + status), 201);
    }
    await pool.query('UPDATE "InternshipAssignments" SET "EndDate"=current_date+30 WHERE "AssignmentID"=$1', [actor.assignment_id]);
  });

  await t.test('future, expired and cancelled assignments reject submissions; history remains readable', async () => {
    for (const [start, end, state] of [[1,30,'ACTIVE'],[-30,-1,'ACTIVE'],[-5,30,'CANCELLED'],[-5,30,'COMPLETED']]) {
      await pool.query('UPDATE "InternshipAssignments" SET "StartDate"=current_date+$2::int,"EndDate"=current_date+$3::int,"Status"=$4 WHERE "AssignmentID"=$1', [actor.assignment_id, start, end, state]);
      expect(await post(taskA, `Blocked assignment ${start}/${end}/${state}`), 409);
      expect(await request(`/students/me/tasks/${taskA}/submissions`), 200);
    }
    await pool.query('UPDATE "InternshipAssignments" SET "StartDate"=current_date-5,"EndDate"=current_date+30,"Status"=\'ACTIVE\' WHERE "AssignmentID"=$1', [actor.assignment_id]);
  });

  await t.test('concurrent submissions complete the task exactly once at 100 percent', async () => {
    const responses = await Promise.all([1,2,3,4].map(() => post(taskEmpty, 'One concurrent submission')));
    responses.forEach(result => expect(result, 201));
    assert.equal(responses.filter(result => !result.body.data.replayed).length, 1);
    assert.equal((await pool.query('SELECT count(*)::int n FROM "TaskProgressUpdates" WHERE "TaskID"=$1', [taskEmpty])).rows[0].n, 1);
    assert.equal((await pool.query('SELECT "Status" FROM "InternshipTasks" WHERE "TaskID"=$1', [taskEmpty])).rows[0].Status, 'DONE');
    assert.equal((await pool.query('SELECT "PercentComplete" FROM "TaskProgressUpdates" WHERE "TaskID"=$1', [taskEmpty])).rows[0].PercentComplete, 100);
  });

  await t.test('invalid task ids, pagination and unsupported progress changes are rejected', async () => {
    for (const suffix of ['?page=0','?limit=101','?studentId=2','?page=2147483647&limit=100']) {
      expect(await request(`/students/me/tasks/${taskA}/submissions${suffix}`), 400);
    }
    expect(await request('/students/me/tasks/nope/submissions'), 400);
    expect(await request(`/students/me/tasks/${taskA}/submissions?content=wrong`, { method: 'POST', body: JSON.stringify({ content: 'Wrong query' }) }), 400);
    expect(await request(`/students/me/tasks/${taskA}/submissions`, { method: 'POST', body: JSON.stringify({ content: 'Do not set progress', percentComplete: 100 }) }), 400);
  });

  await t.test('an audit failure rolls back the submission and retry can persist it normally', async subtest => {
    const task = await createTask('Transactional audit failure');
    const repository = require('../dist/modules/academic/academic.repository');
    const failure = subtest.mock.method(repository, 'audit', async () => {
      throw Object.assign(new Error('Deliberate isolated audit failure'), { statusCode: 500, errorCode: 'TEST_AUDIT_FAILURE' });
    });
    try {
      const result = await post(task, 'Atomic submission');
      expect(result, 500);
      assert.equal(result.body.errorCode, 'TEST_AUDIT_FAILURE');
      assert.equal((await pool.query('SELECT count(*)::int n FROM "TaskProgressUpdates" WHERE "TaskID"=$1', [task])).rows[0].n, 0);
      assert.equal((await pool.query('SELECT "Status" FROM "InternshipTasks" WHERE "TaskID"=$1', [task])).rows[0].Status, 'TODO');
    } finally { failure.mock.restore(); }
    const retry = await post(task, 'Atomic submission');
    expect(retry, 201);
    assert.equal(retry.body.data.replayed, false);
    assert.equal(retry.body.data.percentComplete, 100);
    assert.equal((await pool.query('SELECT "Status" FROM "InternshipTasks" WHERE "TaskID"=$1', [task])).rows[0].Status, 'DONE');
  });

  await t.test('legacy unfinished submission can be submitted under the new automatic-completion rule', async () => {
    const task = await createTask('Legacy unfinished task');
    await pool.query(`INSERT INTO "TaskProgressUpdates"("TaskID","UpdatedByStudentID","ProgressDescription","PercentComplete")
      VALUES($1,$2,'Legacy content',NULL)`, [task, actor.id]);
    const submitted = await post(task, 'Legacy content');
    expect(submitted, 201);
    assert.equal(submitted.body.data.replayed, false);
    assert.equal(submitted.body.data.percentComplete, 100);
    const item = (await listing()).items.find(row => row.id === task);
    assert.equal(item.status, 'DONE');
    assert.equal(item.submissionCount, 2);
  });

  await t.test('overall progress covers every page and excludes cancelled tasks', async () => {
    const cancelled = await createTask('Cancelled task excluded from progress');
    await pool.query('UPDATE "InternshipTasks" SET "Status"=\'CANCELLED\' WHERE "TaskID"=$1', [cancelled]);
    const first = await request(`/students/me/tasks?ojtSemesterId=${actor.term_id}&page=1&limit=1`);
    const second = await request(`/students/me/tasks?ojtSemesterId=${actor.term_id}&page=2&limit=1`);
    expect(first, 200); expect(second, 200);
    assert.deepEqual(first.body.data.progress, second.body.data.progress);
    assert.ok(first.body.data.progress.totalTasks > first.body.data.items.length);
    const totals = (await pool.query(`SELECT count(*) FILTER (WHERE "Status" NOT IN ('CANCELLED','CANCELED'))::int total,
      count(*) FILTER (WHERE "Status" IN ('DONE','COMPLETED'))::int completed FROM "InternshipTasks" WHERE "AssignmentID"=$1`, [actor.assignment_id])).rows[0];
    assert.equal(first.body.data.progress.totalTasks, totals.total);
    assert.equal(first.body.data.progress.completedTasks, totals.completed);
    assert.equal(first.body.data.progress.percentComplete, Math.round(totals.completed / totals.total * 10000) / 100);
    assert.ok(first.body.data.progress.cancelledTasks >= 1);
  });
});
