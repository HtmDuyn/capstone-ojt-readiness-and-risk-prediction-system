import test from 'node:test';
import assert from 'node:assert/strict';
import { createStudentSnapshots } from '../../src/utils/student/studentSnapshots.ts';

test('UI snapshots expire, preserve null results, and bound memory usage', () => {
  let clock = 0;
  const cache = createStudentSnapshots({ ttlMs: 100, maxEntries: 2, now: () => clock });
  const ticket = cache.scope('student-a');
  cache.write(ticket, 'profile', { name: 'A' });
  cache.write(ticket, 'curriculum', null);
  assert.deepEqual(cache.read(ticket, 'curriculum'), { data: null });
  cache.write(ticket, 'dashboard', { credits: 10 });
  assert.equal(cache.read(ticket, 'profile'), undefined);
  assert.deepEqual(cache.read(ticket, 'dashboard'), { data: { credits: 10 } });
  clock = 100;
  assert.equal(cache.read(ticket, 'dashboard'), undefined);
});

test('session changes and logout never expose or restore another student snapshot', () => {
  const cache = createStudentSnapshots();
  const old = cache.scope('student-a');
  cache.write(old, 'risk', { studentId: 1 });
  const next = cache.scope('student-b');
  assert.equal(cache.read(next, 'risk'), undefined);
  cache.write(old, 'risk', { studentId: 1 });
  assert.equal(cache.read(next, 'risk'), undefined);
  cache.write(next, 'risk', { studentId: 2 });
  const loggedOut = cache.scope(null);
  assert.equal(cache.read(loggedOut, 'risk'), undefined);
  assert.equal(cache.read(cache.scope('student-a'), 'risk'), undefined);
});

test('a mutation invalidates snapshots and rejects late writes from older requests', () => {
  const cache = createStudentSnapshots();
  const before = cache.scope('student-a');
  cache.write(before, 'applications', ['old']);
  cache.invalidate();
  const after = cache.scope('student-a');
  assert.equal(cache.read(after, 'applications'), undefined);
  cache.write(before, 'applications', ['late-old']);
  assert.equal(cache.read(after, 'applications'), undefined);
  cache.write(after, 'applications', ['new']);
  assert.deepEqual(cache.read(after, 'applications'), { data: ['new'] });
});

test('tab snapshots survive a reload without extending their original expiry', () => {
  let saved = null, clock = 0;
  const storage = { read: () => saved, write: value => { saved = value; }, clear: () => { saved = null; } };
  const first = createStudentSnapshots({ ttlMs: 100, now: () => clock });
  const ticket = first.scope('a');
  first.restore(ticket, storage);
  first.write(ticket, 'risk', { level: 'LOW' });
  assert.ok(saved);
  clock = 90;
  const reloaded = createStudentSnapshots({ ttlMs: 100, now: () => clock });
  const next = reloaded.scope('a');
  reloaded.restore(next, storage);
  assert.deepEqual(reloaded.read(next, 'risk'), { data: { level: 'LOW' } });
  clock = 100;
  assert.equal(reloaded.read(next, 'risk'), undefined);
});

test('writes and logout clear tab storage; late requests cannot repopulate it', () => {
  let saved = null;
  const storage = { read: () => saved, write: value => { saved = value; }, clear: () => { saved = null; } };
  const cache = createStudentSnapshots();
  const old = cache.scope('a');
  cache.restore(old, storage);
  cache.write(old, 'risk', 1);
  cache.invalidate();
  assert.equal(saved, null);
  cache.write(old, 'risk', 'late');
  assert.equal(saved, null);
  cache.write(cache.scope('a'), 'risk', 2);
  assert.ok(saved);
  cache.scope(null);
  assert.equal(saved, null);
});

test('disabled/corrupt storage does not break memory snapshots or overwrite fresher responses', () => {
  const cache = createStudentSnapshots();
  const ticket = cache.scope('a');
  assert.doesNotThrow(() => cache.restore(ticket, { read() { throw Error('Denied'); }, write() { throw Error('Quota'); }, clear() {} }));
  cache.write(ticket, 'risk', 1);
  assert.deepEqual(cache.read(ticket, 'risk'), { data: 1 });
  const next = createStudentSnapshots();
  const current = next.scope('a');
  next.write(current, 'risk', 2);
  next.restore(current, { read: () => JSON.stringify({ version: 1, entries: [{ key: 'risk', data: 1, expiresAt: Date.now() + 1000 }] }), write() {}, clear() {} });
  assert.deepEqual(next.read(current, 'risk'), { data: 2 });
  const corrupted = createStudentSnapshots();
  assert.doesNotThrow(() => corrupted.restore(corrupted.scope('a'), { read: () => '{bad-json', write() {}, clear() {} }));
});

test('a delayed restore from an old session never attaches its storage to a new account', () => {
  const cache = createStudentSnapshots();
  const old = cache.scope('a');
  const next = cache.scope('b');
  let writes = 0;
  cache.restore(old, { read: () => null, write() { writes++; }, clear() {} });
  cache.write(next, 'risk', 'b');
  assert.equal(writes, 0);
});
