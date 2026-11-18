import test from 'node:test';
import assert from 'node:assert/strict';
import { createStudentSnapshots } from '../../src/services/studentSnapshots.ts';

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
