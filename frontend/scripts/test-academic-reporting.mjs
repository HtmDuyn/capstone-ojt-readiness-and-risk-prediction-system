import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import { createServer as createHttpServer } from 'node:http';

const vite = await createServer({
  root: fileURLToPath(new URL('..', import.meta.url)),
  server: { middlewareMode: true }, appType: 'custom', logLevel: 'error',
});
try {
  const { parsePeriodStatistics, parseCohortProgress } = await vite.ssrLoadModule('/src/pages/education/EducationDashboard.tsx');
  // Same response shape as academic-reporting/report.service.ts. Students awaiting
  // confirmation or missing data must remain in the cohort percentage denominator.
  const response = { success: true, data: { statistics: { groupBy: 'cohort', groups: [
    { id: 1, name: 'K20', total: 10, eligible: 4, notEligible: 2, awaitingConfirmation: 3, insufficientData: 1 },
    { id: null, name: null, total: 2, eligible: 0, notEligible: 1, awaitingConfirmation: 1, insufficientData: 0 },
    { id: 2, name: 'K21', total: 0, eligible: 0, notEligible: 0, awaitingConfirmation: 0, insufficientData: 0 },
  ] } } };
  assert.deepEqual(parsePeriodStatistics(response), [
    { label: 'K20', eligible: 4, ineligible: 2 },
    { label: 'Chưa phân khóa', eligible: 0, ineligible: 1 },
    { label: 'K21', eligible: 0, ineligible: 0 },
  ]);
  assert.deepEqual(parseCohortProgress(response), [
    { label: 'K20', percent: 40 }, { label: 'Chưa phân khóa', percent: 0 },
  ]);
  assert.deepEqual(parsePeriodStatistics(null), []);
  assert.deepEqual(parseCohortProgress({ success: true, data: { statistics: { groups: [] } } }), []);
  console.log('PASS: backend cohort response, unknown cohort, zero total, missing/empty data');
  // Exercise the actual FE service over HTTP against the backend's request/response
  // contract. This fixture is separate from the read-only real-database smoke test.
  const requests = [];
  const http = createHttpServer((req, res) => {
    requests.push({ url: new URL(req.url, 'http://localhost'), auth: req.headers.authorization });
    if (req.url.startsWith('/api/academic/course-demand/export')) {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.end('studentId,courseCode\r\n1,PRF192\r\n');
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, data: {
        items: [{ courseId: 1, courseCode: 'PRF192', studentCount: 2, retakeCount: 1, inProgressCount: 0 }],
        total: 21, page: 2, limit: 20, studentsWithDataIssues: [{ studentId: 3 }],
        unresolvedAlternatives: [], computedAt: '2026-10-24T12:00:00Z',
      } }));
    }
  });
  await new Promise(resolve => http.listen(0, '127.0.0.1', resolve));
  try {
    globalThis.localStorage = { getItem: () => 'contract-test-token' };
    const { default: api } = await vite.ssrLoadModule('/src/service/api.ts');
    api.defaults.baseURL = `http://127.0.0.1:${http.address().port}/api`;
    const { academicReportingService: reports } = await vite.ssrLoadModule('/src/service/academicReporting.service.ts');
    const result = await reports.courseDemand({ academicPeriodId: 2, ojtSemesterId: 3, cohortId: 4 }, 2, false);
    assert.equal(result.total, 21);
    assert.equal(result.studentsWithDataIssues.length, 1);
    assert.deepEqual(Object.fromEntries(requests[0].url.searchParams), {
      academicPeriodId: '2', ojtSemesterId: '3', cohortId: '4', page: '2', limit: '20', includeInProgress: 'false',
    });
    assert.equal(requests[0].auth, 'Bearer contract-test-token');
    const csv = await reports.exportCourseDemand({ academicPeriodId: 2, ojtSemesterId: 3 }, true);
    assert.match(String(csv), /PRF192/);
    assert.equal(requests[1].url.pathname, '/api/academic/course-demand/export');
    assert.deepEqual(Object.fromEntries(requests[1].url.searchParams), {
      academicPeriodId: '2', ojtSemesterId: '3', includeInProgress: 'true', format: 'csv',
    });
    console.log('PASS: HTTP auth, scope, pagination, false/true flags, report metadata, CSV export');
  } finally {
    delete globalThis.localStorage;
    await new Promise(resolve => http.close(resolve));
  }
} finally {
  await vite.close();
}
