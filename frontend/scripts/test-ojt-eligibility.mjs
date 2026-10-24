import assert from 'node:assert/strict';
import { createServer as createHttpServer } from 'node:http';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';

const requests = [];
let rejectBatch = false;
const http = createHttpServer(async (req, res) => {
  let text = '';
  for await (const chunk of req) text += chunk;
  requests.push({ path: req.url, method: req.method, body: text ? JSON.parse(text) : null, auth: req.headers.authorization });
  res.setHeader('Content-Type', 'application/json');
  if (rejectBatch && req.url === '/api/eligibility-check-runs') {
    res.statusCode = 409;
    res.end(JSON.stringify({ success: false, errorCode: 'OJT_ASSESSMENT_NOT_OPEN', message: 'Official assessment is not open.' }));
    return;
  }
  const current = { studentId: 1, ojtSemesterId: 2, status: 'ELIGIBLE', earnedCredits: 70, unpassedCourseCount: 2, reasons: [], academicIssues: [], unpassedCourses: [], missingCredits: 0 };
  const data = req.url.includes('/eligibility?')
    ? { current, latest: null, official: { ...current, checkId: 9, isStale: true } }
    : req.url === '/api/eligibility-check-runs'
      ? { runId: 1, total: 1, eligible: 1, notEligible: 0, reviewRequired: 0, items: [{ ...current, studentCode: 'SE001', fullName: 'Nguyễn An', checkId: 10, confirmedAt: '2026-10-24T12:00:00Z' }] }
      : { Status: 'DRAFT', BlockPeriodID: 3 };
  res.end(JSON.stringify({ success: true, data }));
});
await new Promise(resolve => http.listen(0, '127.0.0.1', resolve));
process.env.VITE_API_URL = `http://127.0.0.1:${http.address().port}`;
globalThis.localStorage = { getItem: () => 'test-academic-token' };
const vite = await createServer({ root: fileURLToPath(new URL('..', import.meta.url)), server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { ojtEligibilityService: service, OjtEligibilityApiError, eligibilityStatusLabel, filterEligibilityResults } = await vite.ssrLoadModule('/src/service/ojtEligibility.service.ts');
  const preview = await service.getStudentEligibility(1, 2);
  assert.equal(preview.current.earnedCredits, 70);
  assert.equal(preview.official.isStale, true);
  assert.equal(preview.latest, null);
  assert.equal(requests[0].path, '/api/students/1/eligibility?ojtSemesterId=2');
  const payload = { ojtSemesterId: 2, programIds: [4], idempotencyKey: 'retry-the-same-request' };
  const batch = await service.checkBatch(payload);
  assert.equal(batch.items[0].confirmedAt, '2026-10-24T12:00:00Z');
  assert.equal(batch.items[0].studentCode, 'SE001');
  assert.equal(batch.items[0].fullName, 'Nguyễn An');
  const rows = [
    batch.items[0],
    { ...batch.items[0], studentId: 2, checkId: 11, studentCode: 'SE002', fullName: 'Trần Bình', status: 'NOT_ELIGIBLE' },
    { ...batch.items[0], studentId: 3, checkId: 12, studentCode: 'SE003', fullName: 'Lê Chi', status: 'REVIEW_REQUIRED', confirmedAt: null },
  ];
  assert.equal(filterEligibilityResults(rows, 'ALL', '').length, 3);
  assert.deepEqual(filterEligibilityResults(rows, 'ELIGIBLE', '').map(r => r.studentCode), ['SE001']);
  assert.deepEqual(filterEligibilityResults(rows, 'NOT_ELIGIBLE', '').map(r => r.studentCode), ['SE002']);
  assert.deepEqual(filterEligibilityResults(rows, 'REVIEW_REQUIRED', '').map(r => r.studentCode), ['SE003']);
  assert.equal(filterEligibilityResults(rows, 'NOT_ELIGIBLE', '  bình  ').length, 1);
  assert.equal(filterEligibilityResults(rows, 'ELIGIBLE', 'se002').length, 0);
  assert.equal(filterEligibilityResults(rows, 'ALL', 'se003').length, 1);
  assert.deepEqual(filterEligibilityResults([], 'ALL', ''), []);
  console.log('PASS: student identity, eligibility filters, review excluded from ineligible, combined search, empty results');
  assert.deepEqual(requests[1].body, payload);
  assert.equal(requests[1].method, 'POST');
  assert.equal(requests[1].auth, 'Bearer test-academic-token');
  assert.equal(eligibilityStatusLabel('REVIEW_REQUIRED'), 'Cần đối soát');
  const config = { blockPeriodId: 3, opensAt: '2026-10-24T12:00:00Z', closesAt: '2026-10-25T12:00:00Z', reason: 'Hoàn tất điểm Block 3' };
  await service.saveAssessment(2, config);
  assert.equal(requests[2].method, 'PUT');
  assert.deepEqual(requests[2].body, config);
  await service.openAssessment(2, 'Đã chốt điểm');
  assert.equal(requests[3].path, '/api/ojt-semesters/2/assessment-window/open');
  assert.deepEqual(requests[3].body, { reason: 'Đã chốt điểm', resultsFinalized: true });
  rejectBatch = true;
  await assert.rejects(service.checkBatch(payload), e => e instanceof OjtEligibilityApiError && e.status === 409 && e.errorCode === 'OJT_ASSESSMENT_NOT_OPEN');
  assert.deepEqual(requests[4].body, payload);
  console.log('PASS: preview vs stale official, batch scope/idempotency/auth, assessment PUT/open, structured 409 errors');
} finally {
  await vite.close();
  await new Promise(resolve => http.close(resolve));
  delete globalThis.localStorage;
}
