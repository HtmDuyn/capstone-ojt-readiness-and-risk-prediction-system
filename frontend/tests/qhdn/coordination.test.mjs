import test from 'node:test';
import assert from 'node:assert/strict';
import { canSelectForCoordination, coordinateBatch } from '../../src/utils/qhdnCoordination.ts';

test('bulk selection excludes blocked, accepted and already placed students', () => {
  assert.equal(canSelectForCoordination({ canCoordinate: true, decision: 'REJECTED' }), true);
  assert.equal(canSelectForCoordination({ canCoordinate: true }), true);
  for (const student of [
    {}, { canCoordinate: false },
    { canCoordinate: true, decision: 'ACCEPTED' },
    { canCoordinate: true, receivedAt: '2026-11-11T00:00:00Z' },
    { canCoordinate: true, hasAssignment: true },
  ]) assert.equal(canSelectForCoordination(student), false);
});

test('bulk coordination continues after a failure and retries only failed students', async () => {
  const students = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const sent = [], progress = [];
  const failure = new Error('Hồ sơ không còn đủ điều kiện');
  const result = await coordinateBatch(students, async student => {
    sent.push(student.id);
    if (student.id === 2) throw failure;
  }, completed => progress.push(completed));
  assert.deepEqual(sent, [1, 2, 3]);
  assert.deepEqual(progress, [1, 2, 3]);
  assert.deepEqual(result.succeeded.map(student => student.id), [1, 3]);
  assert.deepEqual(result.failed, [{ student: students[1], error: failure }]);
  await coordinateBatch(result.failed.map(item => item.student), async student => { sent.push(student.id); }, () => {});
  assert.deepEqual(sent, [1, 2, 3, 2]);
});

test('bulk coordination deduplicates students and awaits each request', async () => {
  let active = 0;
  const sent = [];
  const result = await coordinateBatch([{ id: 1 }, { id: 1 }, { id: 2 }], async student => {
    assert.equal(active, 0);
    active++;
    await Promise.resolve();
    sent.push(student.id);
    active--;
  }, () => {});
  assert.deepEqual(sent, [1, 2]);
  assert.equal(result.succeeded.length, 2);
  assert.deepEqual(result.failed, []);
});
