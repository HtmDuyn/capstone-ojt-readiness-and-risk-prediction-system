import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateLocalOjtEligibility } from '../../src/utils/localOjtEligibility.ts';
import { createCurriculumWorkbookTools } from '../../src/utils/curriculumImportWorkbook.ts';
import * as XLSX from 'xlsx';

const profile = (earned = 70, completeConfiguration = true, requirements = []) => ({ academicProgress: { credits: { earned, completeConfiguration }, requirements } });
const failed = (...ids) => ids.map(courseId => ({ courseId, status: 'FAILED' }));
const rule = { version: 1, minCredits: 70, maxUnpassedCourses: 2 };

test('accepts the exact credit and failed-course boundaries', () => {
  const result = calculateLocalOjtEligibility(1, profile(), failed(1, 2), rule);
  assert.equal(result.status, 'ELIGIBLE');
  assert.equal(result.unpassedCourseCount, rule.maxUnpassedCourses);
  assert.deepEqual(result.reasons, []);
});
test('rejects insufficient credits and excess outstanding courses', () => {
  const result = calculateLocalOjtEligibility(1, profile(69.5), failed(1, 2, 3), rule);
  assert.equal(result.status, 'NOT_ELIGIBLE');
  assert.equal(result.reasons.length, 2);
});
test('counts repeated failed attempts for a course once', () => {
  assert.equal(calculateLocalOjtEligibility(1, profile(), failed(1, 1, 2), rule).unpassedCourseCount, 2);
});
test('passed and recognized retakes clear previous failures', () => {
  const attempts = [...failed(1, 2, 3), { courseId: 1, status: 'PASSED' }, { courseId: 2, status: 'RECOGNIZED' }];
  assert.equal(calculateLocalOjtEligibility(1, profile(), attempts, rule).unpassedCourseCount, 1);
});
test('completed equivalent course requirements clear failures', () => {
  const requirements = [{ completed: true, kind: 'COURSE', credits: 3, choices: [1, 2] }];
  assert.equal(calculateLocalOjtEligibility(1, profile(70, true, requirements), failed(1, 2, 3), rule).unpassedCourseCount, 1);
});
test('incomplete curriculum configuration requires review', () => {
  assert.equal(calculateLocalOjtEligibility(1, profile(90, false), [], rule).status, 'REVIEW_REQUIRED');
});
test('missing or invalid credit totals require review', () => {
  for (const earned of [NaN, Infinity, -1, null]) {
    assert.equal(calculateLocalOjtEligibility(1, profile(earned), [], rule).status, 'REVIEW_REQUIRED');
  }
  assert.equal(calculateLocalOjtEligibility(1, {}, [], rule).status, 'REVIEW_REQUIRED');
});
test('calculation preserves input and records student and timestamp', () => {
  const input = profile(); const attempts = failed(1); const snapshot = structuredClone({ input, attempts });
  const result = calculateLocalOjtEligibility(42, input, attempts, rule);
  assert.equal(result.studentId, 42);
  assert.ok(Number.isFinite(Date.parse(result.checkedAt)));
  assert.deepEqual({ input, attempts }, snapshot);
});
test('uses the active policy instead of fixed thresholds', () => {
  assert.equal(calculateLocalOjtEligibility(1, profile(69), failed(1), { version: 2, minCredits: 68, maxUnpassedCourses: 1 }).status, 'ELIGIBLE');
  assert.equal(calculateLocalOjtEligibility(1, profile(69), failed(1, 2), { version: 2, minCredits: 68, maxUnpassedCourses: 1 }).status, 'NOT_ELIGIBLE');
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
