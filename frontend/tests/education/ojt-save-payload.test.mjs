import test from 'node:test';
import assert from 'node:assert/strict';
import { localOjtSavePayload } from '../../src/utils/localOjtSavePayload.ts';

const checkedAt = new Date().toISOString();
const makeResult = (studentId, status, earnedCredits, academicIssues = []) => ({
  studentId, status, earnedCredits, unpassedCourseCount: 0,
  reasons: status === 'ELIGIBLE' ? [] : ['Còn thiếu 31 tín chỉ so với mức 70.'],
  academicIssues, checkedAt,
});

test('sends all 31 results including REVIEW_REQUIRED with the current rule version', () => {
  const results = [
    ...Array.from({ length: 22 }, (_, index) => makeResult(index + 100, 'ELIGIBLE', 70)),
    ...Array.from({ length: 8 }, (_, index) => makeResult(index + 200, 'NOT_ELIGIBLE', 39)),
    makeResult(32, 'REVIEW_REQUIRED', 39, ['Chưa đủ dữ liệu tín chỉ hoặc cấu hình chương trình để kết luận.']),
  ];
  for (const version of [0, 3]) {
    const payload = localOjtSavePayload(results, 'test-key', { version, minCredits: 70 });
    assert.deepEqual(payload.rule, { version, minCredits: 70 });
    assert.equal(payload.results.length, 31);
    assert.equal(payload.results.filter(result => result.status === 'REVIEW_REQUIRED').length, 1);
    assert.equal(payload.results[0].studentId, 32);
    assert.equal(payload.results.find(result => result.studentId === 32).academicIssues.length, 1);
  }
});

test('saves a selected credit threshold with the results', () => {
  const rule = { version: 3, thresholdId: 5, minCredits: 75 };
  const payload = localOjtSavePayload([makeResult(1, 'ELIGIBLE', 75)], 'threshold-test', rule);
  assert.deepEqual(payload.rule, rule);
});
