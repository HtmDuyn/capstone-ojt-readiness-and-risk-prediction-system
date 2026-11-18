const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createCipheriv } = require('node:crypto');
const jwt = require('jsonwebtoken');
process.env.JWT_SECRET = 'enterprise-candidate-cv-test-only';
process.env.ENTERPRISE_RECRUITMENT_WORKER_ENABLED = 'false';
process.env.CV_STORAGE_KEY = Buffer.alloc(32, 7).toString('base64');
const app = require('../dist/app').default;
const auth = require('../dist/modules/auth/auth.repository');
const reads = require('../dist/modules/qhdn/read.repository');
const { logger } = require('../dist/config/logger');

test('enterprise can read only the CV attached to its candidate application', async t => {
  const pdf = Buffer.from('%PDF-1.4\nSubmitted CV\n%%EOF');
  const iv = Buffer.alloc(12, 1);
  const cipher = createCipheriv('aes-256-gcm', Buffer.alloc(32, 7), iv);
  const encrypted = Buffer.concat([iv, cipher.update(pdf), cipher.final(), cipher.getAuthTag()]);
  let role = 'ENTERPRISE', companyId = 10;
  const queries = [];
  t.mock.method(auth, 'findById', async () => ({ id: 42, username: 'enterprise-test', status: 'ACTIVE', role_code: role, auth_version: 0, must_change_password: false, enterpriseActive: role === 'ENTERPRISE' }));
  t.mock.method(reads, 'readTransaction', async work => work({ query: async (sql, args) => {
    queries.push({ sql, args });
    if (sql.includes('FROM "EnterpriseUsers"')) return { rows: [{ EnterpriseID: companyId }] };
    assert.deepEqual(args.length, 2);
    if (args[1] !== 10 || ![5, 6].includes(args[0])) return { rows: [] };
    return { rows: [{ FileName: 'CV sinh viên.pdf', Content: args[0] === 5 ? pdf : null, EncryptedContent: args[0] === 6 ? encrypted : null }] };
  } }));
  const logError = logger.error.bind(logger);
  t.mock.method(logger, 'error', error => { if (!error.statusCode || error.statusCode >= 500) logError(error); });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });
  const token = jwt.sign({ userId: 42, username: 'enterprise-test', authVersion: 0 }, process.env.JWT_SECRET);
  const get = (id, authenticated = true) => fetch(`http://127.0.0.1:${server.address().port}/api/enterprise/candidates/${id}/cv`, { headers: authenticated ? { Authorization: `Bearer ${token}` } : {} });

  await t.test('requires login and enterprise role before reading files', async () => {
    assert.equal((await get(5, false)).status, 401);
    for (role of ['STUDENT', 'OJT_COORD', 'ACADEMIC', 'ADMIN']) assert.equal((await get(5)).status, 403);
    assert.equal(queries.length, 0);
    role = 'ENTERPRISE';
    assert.equal((await get(0)).status, 400);
    assert.equal(queries.length, 0);
  });
  await t.test('returns the original PDF with private cache headers and Unicode filename', async () => {
    const response = await get(5);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'application/pdf');
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.match(response.headers.get('content-disposition'), /filename\*=UTF-8''CV%20sinh%20vi%C3%AAn.pdf/);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), pdf);
    const fileQuery = queries.at(-1);
    assert.deepEqual(fileQuery.args, [5, 10]);
    assert.match(fileQuery.sql, /co\."CoordinationID"=\$1 AND co\."EnterpriseID"=\$2/);
    assert.match(fileQuery.sql, /ja\."RegistrationID"=r\."RegistrationID" AND ja\."StudentID"=r\."StudentID" AND ja\."EnterpriseID"=co\."EnterpriseID"/);
    assert.match(fileQuery.sql, /cvfile\."CVFileID"=ja\."CVFileID" AND cvfile\."StudentID"=r\."StudentID"/);
  });
  await t.test('supports encrypted CVs submitted before StudentCVFiles', async () => {
    const response = await get(6);
    assert.equal(response.status, 200);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), pdf);
  });
  await t.test('foreign company, unknown candidate and no attachment do not expose a CV', async () => {
    companyId = 11;
    assert.equal((await get(5)).status, 404);
    companyId = 10;
    const response = await get(999);
    assert.equal(response.status, 404);
    assert.equal((await response.json()).errorCode, 'CV_NOT_FOUND');
  });
});
