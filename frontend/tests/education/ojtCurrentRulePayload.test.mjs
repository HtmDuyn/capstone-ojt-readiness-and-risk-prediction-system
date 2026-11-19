import assert from 'node:assert/strict';
import test from 'node:test';
import { localOjtSavePayload } from '../../src/utils/education/localOjtSavePayload.ts';

test('current policy snapshot uses backend values when no custom threshold is selected', () => {
  const rule = { version: 3, minCredits: 70, maxUnpassedCourses: 2 };
  const payload = localOjtSavePayload([{ studentId: 1, status: 'ELIGIBLE', earnedCredits: 71, unpassedCourseCount: 1, reasons: [], academicIssues: [], checkedAt: '2026-11-19T00:00:00.000Z' }], 'key', rule);
  assert.deepEqual(payload.rule, rule);
});

test('a backend supplied threshold id remains in the snapshot', () => {
  const payload = localOjtSavePayload([], 'key', { version: 3, minCredits: 70, maxUnpassedCourses: 2, thresholdId: 9 });
  assert.deepEqual(payload.rule, { version: 3, minCredits: 70, thresholdId: 9 });
});
