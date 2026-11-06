import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateLocalOjtEligibility, LOCAL_OJT_RULE } from '../../src/utils/localOjtEligibility.ts';
import { createCurriculumWorkbookTools } from '../../src/utils/curriculumImportWorkbook.ts';
import * as XLSX from 'xlsx';

const profile = (earned = 70, completeConfiguration = true, requirements = []) => ({ academicProgress: { credits: { earned, completeConfiguration }, requirements } });
const failed = (...ids) => ids.map(courseId => ({ courseId, status: 'FAILED' }));

test('accepts the exact credit and failed-course boundaries', () => {
  const result = calculateLocalOjtEligibility(1, profile(), failed(1, 2));
  assert.equal(result.status, 'ELIGIBLE');
  assert.equal(result.unpassedCourseCount, LOCAL_OJT_RULE.maxUnpassedCourses);
  assert.deepEqual(result.reasons, []);
});
test('rejects insufficient credits and excess outstanding courses', () => {
  const result = calculateLocalOjtEligibility(1, profile(69.5), failed(1, 2, 3));
  assert.equal(result.status, 'NOT_ELIGIBLE');
  assert.equal(result.reasons.length, 2);
});
test('counts repeated failed attempts for a course once', () => {
  assert.equal(calculateLocalOjtEligibility(1, profile(), failed(1, 1, 2)).unpassedCourseCount, 2);
});
test('passed and recognized retakes clear previous failures', () => {
  const attempts = [...failed(1, 2, 3), { courseId: 1, status: 'PASSED' }, { courseId: 2, status: 'RECOGNIZED' }];
  assert.equal(calculateLocalOjtEligibility(1, profile(), attempts).unpassedCourseCount, 1);
});
test('completed equivalent course requirements clear failures', () => {
  const requirements = [{ completed: true, kind: 'COURSE', credits: 3, choices: [1, 2] }];
  assert.equal(calculateLocalOjtEligibility(1, profile(70, true, requirements), failed(1, 2, 3)).unpassedCourseCount, 1);
});
test('incomplete curriculum configuration requires review', () => {
  assert.equal(calculateLocalOjtEligibility(1, profile(90, false), []).status, 'REVIEW_REQUIRED');
});
test('missing or invalid credit totals require review', () => {
  for (const earned of [NaN, Infinity, -1, null]) {
    assert.equal(calculateLocalOjtEligibility(1, profile(earned), []).status, 'REVIEW_REQUIRED');
  }
  assert.equal(calculateLocalOjtEligibility(1, {}, []).status, 'REVIEW_REQUIRED');
});
test('calculation preserves input and records student and timestamp', () => {
  const input = profile(); const attempts = failed(1); const snapshot = structuredClone({ input, attempts });
  const result = calculateLocalOjtEligibility(42, input, attempts);
  assert.equal(result.studentId, 42);
  assert.ok(Number.isFinite(Date.parse(result.checkedAt)));
  assert.deepEqual({ input, attempts }, snapshot);
});
test('workbook parser rejects missing required sheets before API lookup', async () => {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['code'], ['TEST']]), '01_Curriculum');
  const file = new File([XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })], 'test.xlsx');
  let called = false;
  const { parseWorkbook } = createCurriculumWorkbookTools([], null, null, async () => { called = true; return new Map(); });
  await assert.rejects(parseWorkbook(file), /02_Courses/);
  assert.equal(called, false);
});
