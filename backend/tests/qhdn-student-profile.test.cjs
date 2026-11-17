const { test } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
process.env.JWT_SECRET = 'qhdn-student-profile-test-only';
const app = require('../dist/app').default;
const auth = require('../dist/modules/auth/auth.repository');
const reads = require('../dist/modules/qhdn/read.repository');
const { logger } = require('../dist/config/logger');

test('QHDN student dossier route authentication and semester scope', async t => {
  const profile = {
    id: 1, studentCode: 'SE25001', fullName: 'Student One', email: 'student@example.test',
    majorName: 'Software Engineering', programName: 'SE Program', cohortName: 'K25',
    cv: { id: 12, studentId: 1, fileName: 'current.pdf' },
    submittedCv: { id: 8, studentId: 1, fileName: 'submitted.pdf' },
  };
  let role = 'OJT_COORD';
  const queries = [];
  t.mock.method(auth, 'findById', async () => ({ id: 42, username: 'qhdn-test', status: 'ACTIVE', role_code: role, auth_version: 0, must_change_password: false }));
  t.mock.method(reads, 'readTransaction', async work => work({ query: async (sql, args) => {
    queries.push({ sql, args });
    return { rows: args[0] === 1 && args[1] === 7 ? [profile] : [] };
  } }));
  const logError = logger.error.bind(logger);
  t.mock.method(logger, 'error', error => { if (!error.statusCode || error.statusCode >= 500) logError(error); });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });
  const token = jwt.sign({ userId: 42, username: 'qhdn-test', authVersion: 0 }, process.env.JWT_SECRET);
  const get = async (path, authenticated = true) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api${path}`, { headers: authenticated ? { Authorization: `Bearer ${token}` } : {} });
    return { status: response.status, body: await response.json() };
  };

  await t.test('authentication and staff role are required before reading data', async () => {
    assert.equal((await get('/qhdn/students/1?ojtSemesterId=7', false)).status, 401);
    for (role of ['STUDENT', 'ENTERPRISE', 'ACADEMIC']) assert.equal((await get('/qhdn/students/1?ojtSemesterId=7')).status, 403);
    assert.equal(queries.length, 0);
  });
  await t.test('QHDN and Admin can read program details and distinct current/submitted CV metadata', async () => {
    for (role of ['OJT_COORD', 'ADMIN']) {
      const response = await get('/qhdn/students/1?ojtSemesterId=7');
      assert.equal(response.status, 200);
      assert.deepEqual(response.body, { success: true, data: profile });
    }
    assert.deepEqual(queries[0].args, [1, 7]);
    // Keep the handoff filter inside the database query rather than exposing
    // the general student profile API to QHDN.
    assert.match(queries[0].sql, /EXISTS \(SELECT 1 FROM "EligibleStudentHandoffItems" handoff\s+WHERE handoff\."StudentID"=s\."StudentID" AND handoff\."OJTSemesterID"=\$2\)/);
    role = 'OJT_COORD';
    assert.equal((await get('/students/1')).status, 403);
  });
  await t.test('missing semester, invalid identifiers and unsupported parameters fail before querying', async () => {
    const count = queries.length;
    for (const path of ['/qhdn/students/1', '/qhdn/students/0?ojtSemesterId=7', '/qhdn/students/1?ojtSemesterId=0', '/qhdn/students/1?ojtSemesterId=7&include=all']) {
      assert.equal((await get(path)).status, 400, path);
    }
    assert.equal(queries.length, count);
  });
  await t.test('a missing student or a student outside the selected semester returns no profile', async () => {
    for (const path of ['/qhdn/students/2?ojtSemesterId=7', '/qhdn/students/1?ojtSemesterId=8']) {
      const response = await get(path);
      assert.equal(response.status, 404);
      assert.equal(response.body.errorCode, 'STUDENT_NOT_FOUND');
      assert.equal(response.body.data, undefined);
    }
  });
});
