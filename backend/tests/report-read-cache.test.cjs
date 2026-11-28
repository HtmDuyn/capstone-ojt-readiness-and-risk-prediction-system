const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const filename = path.resolve(__dirname, '../src/modules/academic-reporting/report-read-cache.ts');
const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exportsObject = {};
vm.runInNewContext(output, { exports: exportsObject, structuredClone, Map, JSON, Error });
const { cachedReportReader } = exportsObject;

test('shared report sources are read once and each scope gets independent rows', async () => {
  let calls = 0;
  const client = { query: async () => {
    calls++;
    return { rows: [{ date: new Date('2027-05-01'), nested: { credits: 3 } }], rowCount: 1 };
  } };
  const reader = cachedReportReader(client);
  const [first, second] = await Promise.all([
    reader.query('SELECT source WHERE id=ANY($1)', [[1, 2]]),
    reader.query('SELECT source WHERE id=ANY($1)', [[1, 2]]),
  ]);
  assert.equal(calls, 1);
  first.rows[0].nested.credits = 9;
  assert.equal(second.rows[0].nested.credits, 3);
  assert.equal(second.rows[0].date.toISOString(), '2027-05-01T00:00:00.000Z');
});

test('different OJT scopes and separate transactions do not share cached reads', async () => {
  let calls = 0;
  const client = { query: async () => ({ rows: [{ version: ++calls }] }) };
  const reader = cachedReportReader(client);
  await reader.query('SELECT rules WHERE semester=$1', [1]);
  await reader.query('SELECT rules WHERE semester=$1', [2]);
  await reader.query('SELECT confirmations WHERE semester=$1', [1]);
  await cachedReportReader(client).query('SELECT rules WHERE semester=$1', [1]);
  assert.equal(calls, 4);
});

test('report cache rejects writes without dispatching them', async () => {
  let calls = 0;
  const reader = cachedReportReader({ query: async () => { calls++; return { rows: [] }; } });
  await assert.rejects(reader.query('UPDATE source SET credits=3'), /SELECT queries only/);
  assert.equal(calls, 0);
});

const demandFile = path.resolve(__dirname, '../src/modules/academic-reporting/retake-class-proposals.ts');
const demandExports = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(demandFile, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: demandExports, Map, Set, Number, String, Error });

test('valid retake demand is counted without an OJT eligibility rule, once per student', () => {
  const rows = Array.from({ length: 18 }, (_, index) => ({
    studentId: index + 1, category: 'INSUFFICIENT_DATA', dataIssues: [],
    missingRequiredCourses: [{ courseId: 9, courseCode: 'COURSE9', courseName: 'Course', reason: 'RETAKE', needsEnrollment: true }],
  }));
  const result = demandExports.collectRetakeDemand([{ rows }, { rows }]);
  assert.equal(result.excludedStudentCount, 0);
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].failedStudentCount, 18);
  assert.equal(result.items[0].proposedClassCount, 1);
});

test('unreconciled course data, passed/new courses and ongoing retakes do not inflate demand', () => {
  const course = { courseId: 9, reason: 'RETAKE', needsEnrollment: true };
  const result = demandExports.collectRetakeDemand([{ rows: [
    { studentId: 1, dataIssues: ['ACTUAL_PATHWAY_NOT_CONFIGURED'], missingRequiredCourses: [course] },
    { studentId: 2, dataIssues: [], missingRequiredCourses: [{ ...course, needsEnrollment: false }] },
    { studentId: 3, dataIssues: [], missingRequiredCourses: [{ ...course, reason: 'NOT_COMPLETED' }] },
    { studentId: 4, dataIssues: [], missingRequiredCourses: [] },
  ] }]);
  assert.equal(result.excludedStudentCount, 1);
  assert.equal(result.items.length, 0);
});

test('class preparation thresholds and capacity remain unchanged', () => {
  for (const [students, classes, waiting] of [[17, 0, 17], [18, 1, 0], [22, 1, 0], [35, 1, 0], [52, 1, 17], [53, 2, 0]]) {
    const result = demandExports.planRetakeClasses(students);
    assert.equal(result.proposedClassCount, classes);
    assert.equal(result.waitingStudentCount, waiting);
  }
});
