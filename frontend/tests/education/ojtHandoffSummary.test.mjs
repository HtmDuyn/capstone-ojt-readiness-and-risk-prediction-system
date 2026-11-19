import assert from 'node:assert/strict';
import test from 'node:test';
import { summarizeOjtHandoff } from '../../src/utils/education/educationOjtCheckQueue.ts';

test('saved eligible result waits until the backend handoff appears', () => {
  const saved = { 1: { status: 'ELIGIBLE', isStale: false }, 2: { status: 'NOT_ELIGIBLE' } };
  assert.deepEqual(summarizeOjtHandoff([1, 2, 3], saved, new Set()), { eligible: 1, handedOff: 0, waiting: 1 });
  assert.deepEqual(summarizeOjtHandoff([1, 2, 3], saved, new Set([1])), { eligible: 1, handedOff: 1, waiting: 0 });
});

test('stale saved results and empty rosters do not become waiting handoffs', () => {
  assert.deepEqual(summarizeOjtHandoff([1], { 1: { status: 'ELIGIBLE', isStale: true } }, new Set()), { eligible: 0, handedOff: 0, waiting: 0 });
  assert.deepEqual(summarizeOjtHandoff([], {}, new Set()), { eligible: 0, handedOff: 0, waiting: 0 });
});
