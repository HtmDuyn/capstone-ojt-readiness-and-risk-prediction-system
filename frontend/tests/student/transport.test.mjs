import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import axios from 'axios';

const sourceRoot = fileURLToPath(new URL('../../src/', import.meta.url));
// Load the actual Student services, replacing only Vite's build-time base URL.
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === '@/services/api') return { url: 'data:text/javascript,export const API_BASE_URL="https://student.test/api";', shortCircuit: true };
    if (specifier.startsWith('@/')) return { url: pathToFileURL(resolve(sourceRoot, specifier.slice(2) + '.ts')).href, shortCircuit: true };
    if (specifier.startsWith('.') && context.parentURL?.startsWith(pathToFileURL(sourceRoot).href)) {
      const url = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(url)) return { url: url.href, shortCircuit: true };
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith(pathToFileURL(sourceRoot).href) && url.endsWith('.ts')) return {
      format: 'module', shortCircuit: true,
      source: stripTypeScriptTypes(readFileSync(new URL(url), 'utf8'), { mode: 'transform', sourceUrl: url }),
    };
    return next(url, context);
  },
});

const stored = new Map();
globalThis.localStorage = { getItem: key => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value), removeItem: key => stored.delete(key) };
globalThis.window = new EventTarget();
globalThis.fetch = () => { throw new Error('Student requests must never call fetch'); };
const student = await import('../../src/services/studentService.ts');
const { studentSnapshots, initializeStudentSnapshots } = await import('../../src/services/studentSnapshots.ts');
const { getOjtRiskAssessment } = await import('../../src/services/studentOjtRisk.service.ts');
const { cvAnalysisApi } = await import('../../src/services/studentCvAnalysis.service.ts');
const { matchStudentJobs } = await import('../../src/services/studentJobMatching.service.ts');
assert.equal(student.API.defaults.adapter, 'xhr');

test('Student data requests use Axios, bearer auth and only the required API sections', async () => {
  stored.set('ojt_auth_token', 'student-session');
  const calls = [];
  student.API.defaults.adapter = async config => {
    calls.push(config);
    const data = config.url.includes('/tasks?') ? { items: [], total: 0, page: 1, limit: 20 }
      : config.url.includes('include=results') ? { results: { items: [] }, result: { id: 5 } }
      : {};
    return { data: { success: true, data }, status: 200, statusText: 'OK', headers: {}, config };
  };
  await student.getAssignedTasks(1, 2);
  await student.getOjtResults(1, 1);
  await student.getOjtResult(5, 1);
  await student.getStudentDashboardOverview(1);
  await student.getStudentDashboardSummary(1);
  assert.match(calls[0].url, /^\/students\/me\/tasks\?.*page=2/);
  assert.ok(calls[1].url.includes('include=results'));
  assert.ok(calls[2].url.includes('resultId=5'));
  assert.ok(calls[3].url.includes('view=overview'));
  assert.ok(calls[4].url.includes('view=summary'));
  assert.ok(calls.every(config => config.headers.get('Authorization') === 'Bearer student-session'));
});

test('AI services preserve endpoints, consent, cancellation, timeouts and response data through Axios', async () => {
  const calls = [], payload = { unchanged: true, risk: { level: 'MEDIUM' } };
  student.API.defaults.adapter = async config => {
    calls.push(config);
    return { data: { success: true, data: payload }, status: 200, statusText: 'OK', headers: {}, config };
  };
  const controller = new AbortController();
  assert.deepEqual(await getOjtRiskAssessment(controller.signal), payload);
  assert.deepEqual(await cvAnalysisApi.analyze(7, controller.signal), payload);
  assert.deepEqual(await matchStudentJobs(4, controller.signal), payload);
  assert.equal(calls[0].url, '/students/me/ojt-risk-assessment');
  assert.equal(calls[0].method, 'get');
  assert.equal(calls[0].timeout, 0, 'Preserve the risk request lifetime previously controlled by its AbortSignal');
  assert.equal(calls[0].signal, controller.signal);
  assert.equal(calls[1].url, '/students/me/cv/analyses');
  assert.deepEqual(JSON.parse(calls[1].data), { cvFileId: 7, consent: true });
  assert.equal(calls[1].timeout, 90000);
  assert.equal(calls[2].url, '/students/me/job-matches');
  assert.deepEqual(JSON.parse(calls[2].data), { windowId: 4, consent: true });
  assert.equal(calls[2].timeout, 90000);
});

test('HTTP failures and expired sessions are handled without signing out a newer account', async () => {
  stored.set('ojt_auth_token', 'old-session');
  student.API.defaults.adapter = async config => {
    stored.set('ojt_auth_token', 'new-session');
    throw new axios.AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined,
      { status: 401, data: { message: 'Expired', errorCode: 'TOKEN_EXPIRED' }, headers: {}, config });
  };
  await assert.rejects(student.apiRequest('/auth/me'), error => error instanceof student.ApiError && error.status === 401 && error.code === 'TOKEN_EXPIRED');
  assert.equal(stored.get('ojt_auth_token'), 'new-session');
  student.API.defaults.adapter = async config => { throw new axios.AxiosError('Timeout', 'ECONNABORTED', config); };
  await assert.rejects(student.apiRequest('/auth/me'), error => error instanceof student.ApiError && error.status === 0 && error.code === 'ECONNABORTED');
});

test('portal identity opens without academic computation and retains identity/password guards', async () => {
  stored.set('ojt_auth_token', 'identity-session');
  const user = { id: 7, studentId: 2, email: 'student@test.test', roleCode: 'STUDENT' };
  const identity = { id: 2, userId: 7, ojtRegistrations: { items: [], total: 0 } };
  const calls = [];
  let responseProfile = identity;
  student.API.defaults.adapter = async config => {
    calls.push(config.url);
    return { data: config.url === '/auth/me' ? { success: true, user }
      : { success: true, data: config.url.includes('include=academicProgress') ? { academicProgress: { gpa: 3 } } : responseProfile },
      status: 200, statusText: 'OK', headers: {}, config };
  };
  assert.deepEqual(await student.getOwnStudentIdentity(undefined, { id: '7', email: user.email }), identity);
  assert.equal(calls[0], '/auth/me');
  assert.equal(calls[1], '/students/2?include=ojtRegistrations&ojtLimit=100');
  assert.deepEqual(await student.getStudentAcademicProgress(2), { gpa: 3 });
  responseProfile = { ...identity, userId: 8 };
  await assert.rejects(student.getOwnStudentIdentity(), { code: 'SESSION_IDENTITY_CHANGED' });
  user.mustChangePassword = true;
  const before = calls.length;
  await assert.rejects(student.getOwnStudentIdentity(), { code: 'PASSWORD_CHANGE_REQUIRED' });
  assert.equal(calls.length, before + 1, 'No profile request before the password change');
  user.mustChangePassword = false;
  await assert.rejects(student.getOwnStudentIdentity(undefined, { id: '9', email: user.email }), { code: 'SESSION_IDENTITY_CHANGED' });
});

test('transcript publishes early pages without losing later courses needed for local filtering', async () => {
  let release;
  const second = new Promise(resolve => { release = resolve; });
  student.API.defaults.adapter = async config => {
    const page = Number(new URL(config.url, 'https://student.test').searchParams.get('resultsPage'));
    if (page === 2) await second;
    return { data: { success: true, data: { courseResults: { items: [{ id: page }], total: 2 } } },
      status: 200, statusText: 'OK', headers: {}, config };
  };
  let notify;
  const published = new Promise(resolve => { notify = resolve; });
  const rows = [];
  const result = student.getAllCourseResults(2, undefined, data => { rows.push(data); notify(); });
  await published;
  assert.deepEqual(rows, [[{ id: 1 }]], 'First page is usable while the second is pending');
  release();
  assert.deepEqual(await result, [{ id: 1 }, { id: 2 }]);
  assert.deepEqual(rows[0], [{ id: 1 }], 'Published pages are immutable snapshots');
});

test('successful Axios writes invalidate UI snapshots, while failed writes remain retryable', async () => {
  const token = stored.get('ojt_auth_token');
  let ticket = studentSnapshots.scope(token);
  studentSnapshots.write(ticket, 'profile', { name: 'Before' });
  student.API.defaults.adapter = async config => ({ data: { success: true, data: {} }, status: 200, statusText: 'OK', headers: {}, config });
  await student.studentPost('/job-applications', {});
  ticket = studentSnapshots.scope(token);
  assert.equal(studentSnapshots.read(ticket, 'profile'), undefined);
  studentSnapshots.write(ticket, 'profile', { name: 'After' });
  student.API.defaults.adapter = async config => { throw new axios.AxiosError('Conflict', 'ERR_BAD_REQUEST', config, undefined,
    { status: 409, data: { message: 'Already submitted' }, headers: {}, config }); };
  await assert.rejects(student.studentPost('/job-applications', {}), { status: 409 });
  assert.deepEqual(studentSnapshots.read(ticket, 'profile'), { data: { name: 'After' } });
});

test('a cached profile opens only after server identity verification, while its fresh response is still pending', async () => {
  stored.set('ojt_auth_token', 'cached-profile-session');
  const user = { id: 7, studentId: 2, email: 'student@test.test', roleCode: 'STUDENT' };
  const cached = { id: 2, userId: 7, email: user.email, fullName: 'Cached', ojtRegistrations: { items: [], total: 0 } };
  studentSnapshots.write(studentSnapshots.scope('cached-profile-session'), 'portal-profile:2', cached);
  let verify, refresh, announce;
  const auth = new Promise(resolve => { verify = resolve; });
  const profile = new Promise(resolve => { refresh = resolve; });
  const displayed = new Promise(resolve => { announce = resolve; });
  let published = 0, finished = false;
  student.API.defaults.adapter = async config => ({
    data: config.url === '/auth/me' ? { success: true, user: await auth } : { success: true, data: await profile },
    status: 200, statusText: 'OK', headers: {}, config,
  });
  const result = student.getOwnStudentIdentity(undefined, { id: '7', email: user.email }, data => { published++; announce(data); }).then(data => { finished = true; return data; });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(published, 0, 'No personal cache is exposed before auth/me completes');
  verify(user);
  assert.deepEqual(await displayed, cached);
  assert.equal(finished, false, 'Cached UI need not wait for the profile refresh');
  refresh({ ...cached, fullName: 'Fresh' });
  assert.equal((await result).fullName, 'Fresh');

  studentSnapshots.write(studentSnapshots.scope('cached-profile-session'), 'portal-profile:2', { ...cached, userId: 8 });
  published = 0;
  await student.getOwnStudentIdentity(undefined, undefined, () => published++);
  assert.equal(published, 0, 'A mismatched cached owner is discarded');
});

test('tab cache keys hash the token and mutations erase persisted snapshots', async () => {
  const tab = new Map();
  window.sessionStorage = { getItem: key => tab.get(key) ?? null, setItem: (key, value) => tab.set(key, value), removeItem: key => tab.delete(key) };
  stored.set('ojt_auth_token', 'private-tab-token');
  await initializeStudentSnapshots('private-tab-token');
  studentSnapshots.write(studentSnapshots.scope('private-tab-token'), 'risk', { level: 'LOW' });
  assert.equal(tab.size, 1);
  const [key, value] = [...tab][0];
  assert.match(key, /^ojt:student-ui:v1:[a-f0-9]{64}$/);
  assert.ok(!key.includes('private-tab-token') && !value.includes('private-tab-token'));
  student.API.defaults.adapter = async config => ({ data: { success: true, data: {} }, status: 200, statusText: 'OK', headers: {}, config });
  await student.studentPost('/job-applications', {});
  assert.equal(tab.size, 0);
  delete window.sessionStorage;
});
