import test from 'node:test';
import assert from 'node:assert/strict';
import { handoffsByStudent, matchesHandoffFilter, selectAutoCheckTargets, selectFullCheckTargets, selectPendingSaveResults } from '../../src/utils/educationOjtCheckQueue.ts';

const targets = Array.from({ length: 7 }, (_, index) => ({ student: { id: index + 1 }, reason: index === 6 ? 'Không hoạt động' : '' }));
const saved = {
  2: { status: 'ELIGIBLE', isStale: false },
  3: { status: 'NOT_ELIGIBLE', isStale: true },
  4: { status: 'REVIEW_REQUIRED', isStale: false },
  5: { status: 'ELIGIBLE', isStale: false },
  6: { status: 'ELIGIBLE', isStale: true },
};
const history = [{ id: 23, ojtSemesterId: 7, studentIds: [5, 6], studentCount: 2 }];

test('selects only new and stale unhanded students for automatic checking', () => {
  const handed = handoffsByStudent(history);
  assert.deepEqual([...handed.keys()], [5, 6]);
  assert.deepEqual(selectAutoCheckTargets(targets, saved, {}, new Set(handed.keys())).map(t => t.student.id), [1, 3]);
  assert.deepEqual(selectFullCheckTargets(targets, new Set(handed.keys())).map(t => t.student.id), [1, 2, 3, 4]);
  assert.deepEqual(selectAutoCheckTargets(targets, saved, { 1: { studentId: 1 } }, new Set(handed.keys())).map(t => t.student.id), [3]);
});

test('keeps saved results outside the pending save payload', () => {
  const pending = { 1: { studentId: 1, status: 'ELIGIBLE' }, 3: { studentId: 3, status: 'NOT_ELIGIBLE' } };
  assert.deepEqual(selectPendingSaveResults(pending).map(r => r.studentId), [1, 3]);
  assert.equal(saved[2].status, 'ELIGIBLE');
  assert.equal(selectPendingSaveResults(pending).some(r => r.studentId === 5), false);
});

test('filters handoff status from actual handoff items', () => {
  const handed = new Set(handoffsByStudent(history).keys());
  assert.equal(matchesHandoffFilter(5, 'HANDED_OFF', handed), true);
  assert.equal(matchesHandoffFilter(1, 'HANDED_OFF', handed), false);
  assert.equal(matchesHandoffFilter(1, 'NOT_HANDED_OFF', handed), true);
  assert.equal(matchesHandoffFilter(5, 'NOT_HANDED_OFF', handed), false);
  assert.equal(matchesHandoffFilter(5, 'ALL', handed), true);
});
