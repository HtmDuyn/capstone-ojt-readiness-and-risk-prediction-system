import test from 'node:test';
import assert from 'node:assert/strict';
import { createStudentReads } from '../../src/services/studentReads.ts';

test('concurrent readers share one request, but completed data is never cached', async () => {
  const pool = createStudentReads();
  let finish, calls = 0;
  const load = () => { calls++; return new Promise(resolve => { finish = resolve; }); };
  const first = pool.read('student-a', '/tasks?page=1', load);
  const second = pool.read('student-a', '/tasks?page=1', load);
  await Promise.resolve();
  assert.equal(calls, 1);
  finish({ version: 1 });
  assert.deepEqual(await Promise.all([first, second]), [{ version: 1 }, { version: 1 }]);
  assert.deepEqual(await pool.read('student-a', '/tasks?page=1', async () => ({ version: 2 })), { version: 2 });
});

test('one screen cancelling does not cancel another screen; leaving the last screen stops the request', async () => {
  const pool = createStudentReads();
  let finish, transportSignal;
  const load = signal => { transportSignal = signal; return new Promise(resolve => { finish = resolve; }); };
  const firstScreen = new AbortController(), secondScreen = new AbortController();
  const first = pool.read('student-a', 'tasks', load, firstScreen.signal);
  const second = pool.read('student-a', 'tasks', load, secondScreen.signal);
  await Promise.resolve();
  firstScreen.abort();
  await assert.rejects(first, { name: 'AbortError' });
  assert.equal(transportSignal.aborted, false);
  finish([1, 2]);
  assert.deepEqual(await second, [1, 2]);

  const lastScreen = new AbortController();
  const last = pool.read('student-a', 'tasks', load, lastScreen.signal);
  await Promise.resolve();
  lastScreen.abort();
  await assert.rejects(last, { name: 'AbortError' });
  assert.equal(transportSignal.aborted, true);
  assert.deepEqual(await pool.read('student-a', 'tasks', async () => ['fresh']), ['fresh']);
});

test('account changes abort old reads, including reads detached by a successful mutation', async () => {
  const pool = createStudentReads();
  const old = pool.read('student-a', 'profile', () => new Promise(() => {}));
  pool.invalidate();
  const newAccount = pool.read('student-b', 'profile', async () => ({ studentId: 2 }));
  await assert.rejects(old, { name: 'AbortError' });
  assert.deepEqual(await newAccount, { studentId: 2 });
});

test('a successful mutation prevents new readers joining an older GET; errors remain retryable', async () => {
  const pool = createStudentReads();
  let finish;
  const old = pool.read('student-a', 'tasks', () => new Promise(resolve => { finish = resolve; }));
  await Promise.resolve();
  pool.invalidate();
  assert.deepEqual(await pool.read('student-a', 'tasks', async () => ['after-submit']), ['after-submit']);
  finish(['before-submit']);
  assert.deepEqual(await old, ['before-submit']);
  await assert.rejects(pool.read('student-a', 'tasks', async () => { throw new Error('HTTP 500'); }), /HTTP 500/);
  assert.deepEqual(await pool.read('student-a', 'tasks', async () => []), []);
});

test('an already cancelled screen never dispatches a request', () => {
  const pool = createStudentReads(), screen = new AbortController();
  screen.abort();
  let calls = 0;
  assert.throws(() => pool.read('student-a', 'tasks', async () => { calls++; }, screen.signal), { name: 'AbortError' });
  assert.equal(calls, 0);
});
