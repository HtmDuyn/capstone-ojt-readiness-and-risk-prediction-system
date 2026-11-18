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
    if (specifier === '@/config/api') return { url: 'data:text/javascript,export const API_BASE_URL="https://student.test/api";', shortCircuit: true };
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
  assert.match(calls[0].url, /^\/students\/me\/tasks\?.*page=2/);
  assert.ok(calls[1].url.includes('include=results'));
  assert.ok(calls[2].url.includes('resultId=5'));
  assert.ok(calls[3].url.includes('view=overview'));
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
