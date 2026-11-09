const test = require('node:test');
const assert = require('node:assert/strict');
const { assessProgram } = require('../dist/modules/eligibility/ojt-policy-feasibility');
const { reviewOjtPolicy } = require('../dist/modules/eligibility/ojt-policy.service');

const course = (id, semester, credits = 15, extra = {}) => ({ id, courseId: id, courseCode: `C${id}`, semester, credits, isRequired: true, entryKind: 'COURSE', ...extra });
const base = () => ({ id: 1, code: 'P1', name: 'Chương trình thử', status: 'PUBLISHED',
  courses: [1,2,3,4,5].map(term => course(term, term)).concat(course(6, 6, 10, { courseCode: 'OJT202' }), course(7, 7, 10)),
  combos: [], prerequisites: [], equivalences: [] });

test('70 is feasible against 75 credits before OJT; OJT and later courses are excluded', () => {
  const result = assessProgram(base(), 70);
  assert.equal(result.status, 'VALID');
  assert.equal(result.ojtSemester, 6);
  assert.equal(result.minCredits, 75);
  assert.equal(result.maxCredits, 75);
});
test('the OJT term is read from the curriculum row, not assumed to be six', () => {
  const data = base();
  data.courses = data.courses.map(row => row.courseCode === 'OJT202' ? { ...row, semester: 7 } : row.semester === 7 ? { ...row, semester: 8 } : row);
  data.courses.push(course(11, 6, 2));
  const result = assessProgram(data, 77);
  assert.equal(result.ojtSemester, 7);
  assert.equal(result.minCredits, 77);
});
test('80 is blocked against 75 credits', () => {
  const result = assessProgram(base(), 80);
  assert.equal(result.status, 'INVALID');
  assert.equal(result.difference, -5);
});
test('a threshold at the exact achievable limit is warned but may be saved', () => {
  const row = assessProgram(base(), 75);
  assert.equal(row.status, 'WARNING');
  assert.equal(reviewOjtPolicy({ minCredits: 75, maxUnpassedCourses: 2 }, [row], 0).allowed, true);
});
test('alternative combo subjects fill one slot without multiplying credits', () => {
  const data = base();
  data.courses.push(course(8, 5, 3, { entryKind: 'COMBO_SLOT' }));
  data.combos = [{ id: 1, code: 'COM1', selectionGroup: 'SPECIALIZATION', coursesReviewed: true,
    courses: [{ courseId: 9, semester: 5, credits: 3, slotCourseIds: [8] }, { courseId: 10, semester: 5, credits: 3, slotCourseIds: [8] }],
    choiceGroups: [{ minCourses: 1, maxCourses: 1, courseIds: [9,10] }] }];
  assert.equal(assessProgram(data, 78).maxCredits, 78);
  assert.equal(assessProgram(data, 79).status, 'INVALID');
});
test('equivalent courses are not counted twice', () => {
  const data = base(); data.courses.push(course(9, 2)); data.equivalences = [{ sourceCourseId: 9, targetCourseId: 2 }];
  assert.equal(assessProgram(data, 75).maxCredits, 75);
});
test('missing OJT and incomplete combo data block publication', () => {
  const noOjt = base(); noOjt.courses = noOjt.courses.filter(row => row.courseCode !== 'OJT202');
  assert.equal(assessProgram(noOjt, 70).status, 'INSUFFICIENT_DATA');
  const incomplete = base(); incomplete.courses[0].credits = null;
  assert.equal(assessProgram(incomplete, 70).status, 'INSUFFICIENT_DATA');
});
test('a variable combo choice is not silently treated as fully achievable', () => {
  const data = base();
  data.courses.push(course(8, 5, 3, { entryKind: 'COMBO_SLOT' }));
  data.combos = [{ code: 'COM1', selectionGroup: 'SPECIALIZATION', coursesReviewed: true,
    courses: [{ courseId: 9, semester: 5, credits: 3, slotCourseIds: [8] }],
    choiceGroups: [{ code: 'G1', minCourses: 0, maxCourses: 1, courseIds: [9] }] }];
  assert.equal(assessProgram(data, 70).status, 'INSUFFICIENT_DATA');
});
test('more than five planned subjects in a pre-OJT term blocks publication', () => {
  const data = base();
  data.courses.push(...[10,11,12,13,14].map(id => course(id, 1, 1)));
  assert.equal(assessProgram(data, 70).status, 'INSUFFICIENT_DATA');
});
test('a shared policy is blocked if any program cannot meet it', () => {
  const first = assessProgram(base(), 70);
  const second = assessProgram({ ...base(), id: 2, code: 'P2', courses: base().courses.map(row => row.semester === 5 ? { ...row, credits: 8 } : row) }, 70);
  assert.equal(reviewOjtPolicy({ minCredits: 70, maxUnpassedCourses: 2 }, [first, second], 0).allowed, false);
});
test('failed-course cap is bounded by actual pre-OJT subjects', () => {
  const result = reviewOjtPolicy({ minCredits: 70, maxUnpassedCourses: 6 }, [assessProgram(base(), 70)], 0);
  assert.equal(result.allowed, false);
  assert.match(result.programs[0].reasons.join(' '), /5 học phần/);
});
test('a changed curriculum source invalidates an earlier review token', () => {
  const row = assessProgram(base(), 70);
  const values = { minCredits: 70, maxUnpassedCourses: 2 };
  assert.notEqual(reviewOjtPolicy(values, [{ ...row, sourceHash: 'a' }], 0).token,
    reviewOjtPolicy(values, [{ ...row, sourceHash: 'b' }], 0).token);
});
