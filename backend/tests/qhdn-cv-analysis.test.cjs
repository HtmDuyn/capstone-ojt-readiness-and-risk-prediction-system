const assert = require('node:assert/strict');
const test = require('node:test');
const http = require('node:http');
const fixture = require('./helpers/full-backend-fixture.cjs');

test('canonical CV upload/analysis uses current files, protects ownership and works before handoff', async t => {
  const f = await fixture();
  t.after(f.close);
  const another = (await f.query('SELECT u."UserID" AS id,u."Username" AS username,u."AuthVersion" AS version FROM "Students" s JOIN "Users" u USING("UserID") WHERE s."StudentID"=2')).rows[0];
  f.principals.push({ ...another, role: 'OTHER_STUDENT' });
  const upload = async bytes => {
    const form = new FormData(); form.append('cv', new Blob([bytes], { type: 'application/pdf' }), 'test.pdf');
    const r = await f.request('STUDENT', 'POST', '/api/students/me/cv', form);
    assert.equal(r.status, 201, JSON.stringify(r.body));
    return r.body.data.id;
  };
  const bytes = Buffer.from('%PDF-1.4\nCanonical fixture CV\n%%EOF');
  const cvFileId = await upload(bytes);
  await t.test('no AI provider returns 503 without blocking upload or creating a false success', async () => {
    assert.equal((await f.request('STUDENT', 'GET', '/api/students/me/cv-analysis')).body.data.status, 'NOT_ANALYSED');
    const r = await f.request('STUDENT', 'POST', '/api/students/me/cv-analysis', { cvFileId });
    assert.equal(r.status, 503); assert.equal(r.body.errorCode, 'AI_NOT_CONFIGURED');
    assert.equal((await f.query('SELECT count(*)::int AS n FROM "OJTRegistrations"')).rows[0].n, 0);
    assert.equal((await f.query('SELECT count(*)::int AS n FROM "StudentCVVersions"')).rows[0].n, 0);
  });
  let mode = 'valid', calls = 0, lastRequest;
  const provider = http.createServer(async (req, res) => {
    const chunks = []; for await (const chunk of req) chunks.push(chunk);
    lastRequest = JSON.parse(Buffer.concat(chunks).toString()); calls++;
    res.setHeader('Content-Type', 'application/json');
    if (mode === 'error') { res.statusCode = 500; res.end('{}'); return; }
    res.end(JSON.stringify(mode === 'invalid' ? { summary: 'Missing arrays' } : { summary: 'Fixture analysis', skills: ['Node.js'], education: [], experience: [], languages: [], modelVersion: 'fixture-v1' }));
  });
  await new Promise(resolve => provider.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => provider.close(resolve)));
  process.env.CV_ANALYSIS_SERVICE_URL = 'http://127.0.0.1:' + provider.address().port;
  delete process.env.STUDENT_AI_API_KEY;
  await t.test('configured mock provider receives the exact new PDF and result/replay are available to student', async () => {
    const r = await f.request('STUDENT', 'POST', '/api/students/me/cv-analysis', { cvFileId });
    assert.equal(r.status, 200, JSON.stringify(r.body)); assert.equal(r.body.data.status, 'COMPLETED');
    assert.equal(lastRequest.cvFileId, cvFileId); assert.deepEqual(Buffer.from(lastRequest.contentBase64, 'base64'), bytes);
    assert.equal(r.body.data.providerHash, undefined);
    const read = await f.request('STUDENT', 'GET', '/api/students/me/cv-analysis?cvFileId=' + cvFileId);
    assert.deepEqual(read.body.data.result.skills, ['Node.js']);
    const replay = await f.request('STUDENT', 'POST', '/api/students/me/cv-analysis', { cvFileId });
    assert.equal(replay.body.data.replayed, true); assert.equal(replay.body.data.providerHash, undefined); assert.equal(calls, 1);
  });
  await t.test('other student/staff cannot inspect or analyse this CV', async () => {
    assert.equal((await f.request('OTHER_STUDENT', 'GET', '/api/students/me/cv-analysis?cvFileId=' + cvFileId)).status, 404);
    assert.equal((await f.request('OTHER_STUDENT', 'POST', '/api/students/me/cv-analysis', { cvFileId })).status, 404);
    assert.equal((await f.request('OJT_COORD', 'POST', '/api/students/me/cv-analysis', { cvFileId })).status, 403);
    assert.equal(calls, 1);
  });
  await t.test('an in-flight analysis is detected using the database clock and an abandoned run can retry',async()=>{
    const nextId=await upload(Buffer.from('%PDF-1.4\nIn-flight fixture\n%%EOF'));
    await f.query('INSERT INTO "AuditLogs" ("UserID","Action","EntityType","EntityID","Detail") SELECT "UserID",\'CV_ANALYSIS_STARTED\',\'StudentCVFiles\',$1,$2 FROM "Students" WHERE "StudentID"=1',[nextId,JSON.stringify({after:{id:123,cvFileId:nextId,status:'RUNNING'}})]);
    const blocked=await f.request('STUDENT','POST','/api/students/me/cv-analysis',{cvFileId:nextId});
    assert.equal(blocked.status,409);assert.equal(blocked.body.errorCode,'CV_ANALYSIS_RUNNING');
    await f.query('UPDATE "AuditLogs" SET "ActionAt"=LOCALTIMESTAMP-interval \'2 minutes\' WHERE "EntityType"=\'StudentCVFiles\' AND "EntityID"=$1 AND "Action"=\'CV_ANALYSIS_STARTED\'',[nextId]);
    assert.equal((await f.request('STUDENT','GET','/api/students/me/cv-analysis?cvFileId='+nextId)).body.data.errorCode,'ANALYSIS_INTERRUPTED');
    assert.equal((await f.request('STUDENT','POST','/api/students/me/cv-analysis',{cvFileId:nextId})).status,200);
  });
  await t.test('large canonical PDF is analysed without a legacy 5 MiB limit; provider failures remain retryable', async () => {
    const large = Buffer.alloc(5 * 1024 * 1024 + 128, 32); Buffer.from('%PDF-1.4\n').copy(large); Buffer.from('\n%%EOF').copy(large, large.length - 6);
    const largeId = await upload(large);
    mode = 'error';
    const failed = await f.request('STUDENT', 'POST', '/api/students/me/cv-analysis', { cvFileId: largeId });
    assert.equal(failed.status, 502); assert.equal(failed.body.errorCode, 'AI_PROVIDER_FAILED');
    assert.equal((await f.request('STUDENT', 'GET', '/api/students/me/cv-analysis')).body.data.status, 'FAILED');
    mode = 'invalid';
    const invalid = await f.request('STUDENT', 'POST', '/api/students/me/cv-analysis', { cvFileId: largeId });
    assert.equal(invalid.status, 502); assert.equal(invalid.body.errorCode, 'INVALID_AI_RESPONSE');
    mode = 'valid';
    const retried = await f.request('STUDENT', 'POST', '/api/students/me/cv-analysis', { cvFileId: largeId });
    assert.equal(retried.status, 200); assert.equal(lastRequest.cvFileId, largeId);
    assert.deepEqual(Buffer.from(lastRequest.contentBase64, 'base64'), large);
    assert.equal((await f.query('SELECT count(*)::int AS n FROM "StudentCVVersions"')).rows[0].n, 0);
  });
});
