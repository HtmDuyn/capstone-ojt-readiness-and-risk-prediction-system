// Build first: npm run build && node --test tests/study-periods.test.cjs
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const reads = require('../dist/modules/qhdn/read.repository');
const originalRead = reads.readTransaction;
let client;
reads.readTransaction = async work => work(client);
after(() => { reads.readTransaction = originalRead; });
const { studyOverview, studyPeriods } = require('../dist/modules/student-portal/study-period.service');
const { summaryWithClient } = require('../dist/modules/student-portal/academic.service');
const actor = () => ({ userId: 1, roleCode: 'STUDENT' });
function useCatalog() {
  const queries = [];
  client = { query: async (sql, args) => {
    queries.push({ sql, args });
    if (sql.startsWith('SELECT s.*')) return { rows: args.at(-1) === 1 ? [{ StudentID: 101, ProgramID: 1, CurrentSemester: 5, Status: 'ACTIVE', AccountStatus: 'ACTIVE' }] : [] };
    if (sql.startsWith('WITH owner')) return { rows: [{ id: 2, name: 'Fall 2026', isCurrent: true }, { id: 1, name: 'Spring 2026', isCurrent: false }] };
    throw new Error('A rejected study request must not read grades or calculate an assessment.');
  } };
  return queries;
}
test('period catalog resolves ownership from the authenticated account', async () => {
  const queries = useCatalog();
  const result = await studyPeriods({}, actor());
  assert.equal(result.currentAcademicPeriodId, 2);
  assert.deepEqual(queries[1].args, [101, 5]);
});
test('future or foreign periods are rejected before reading any academic source', async () => {
  const queries = useCatalog();
  await assert.rejects(() => studyOverview({ academicPeriodId: 999 }, actor()), { errorCode: 'STUDY_PERIOD_NOT_FOUND' });
  assert.equal(queries.length, 2);
});
test('only students with an active owned profile can read the study catalog', async () => {
  useCatalog();
  await assert.rejects(() => studyPeriods({}, { userId: 1, roleCode: 'ENTERPRISE' }), { errorCode: 'FORBIDDEN' });
  await assert.rejects(() => studyPeriods({}, { userId: 2, roleCode: 'STUDENT', studentId: 101 }), { errorCode: 'STUDENT_NOT_FOUND' });
});
test('legacy OJT filters, missing period IDs and additional selectors are rejected', async () => {
  useCatalog();
  await assert.rejects(() => studyPeriods({ ojtSemesterId: 1 }, actor()));
  await assert.rejects(() => studyOverview({}, actor()));
  await assert.rejects(() => studyOverview({ academicPeriodId: 1, studentId: 222 }, actor()));
  await assert.rejects(() => studyOverview({ academicPeriodId: 0 }, actor()));
  await assert.rejects(() => studyOverview({ view: 'current', academicPeriodId: 1 }, actor()));
  await assert.rejects(() => studyOverview({ view: 'past' }, actor()));
});

test('live overview uses latest grades and current stage even without an ongoing calendar term or OJT registration', async () => {
  const progressModule = require('../dist/modules/students/academic-progress');
  const planModule = require('../dist/modules/student-portal/course-plan.service');
  const originalSource = progressModule.loadAcademicProgress;
  const originalPlan = planModule.coursePlanWithClient;
  const rule = { RuleSetID: 1, ProgramID: 1, OJTSemesterID: null, MinCredits: 6, MaxUnpassedCourses: 2, Status: 'PUBLISHED' };
  const source = { studentId: 101, program: { ProgramID: 1, Status: 'PUBLISHED', TotalCredits: 6, PrerequisitesReviewed: true },
    courses: [1, 2].map(id => ({ ProgramCourseID: id, CourseID: id, CourseCode: 'C' + id, CourseName: 'Course', EntryKind: 'COURSE', Credits: 3, IsRequired: true, RecommendedSemester: id })),
    attempts: [{ id: 1, courseId: 1, courseCode: 'C1', status: 'FAILED', score: 4, periodStartDate: '2026-01-01', attemptNumber: 1 },
      { id: 2, courseId: 2, courseCode: 'C2', status: 'PASSED', score: 8, periodStartDate: '2026-01-01', attemptNumber: 1 }],
    aliases: [], options: [], policy: { GpaScale: 10 }, issues: [], gradeWeights: [] };
  let sourceReads = 0;
  progressModule.loadAcademicProgress = async (_c, studentId, _rule, cutoff) => {
    assert.equal(studentId, 101);
    assert.equal(cutoff, undefined, 'Current data must never use an old term end date.');
    sourceReads++;
    return source;
  };
  planModule.coursePlanWithClient = async (_c, studentId, context) => {
    assert.equal(studentId, 101);
    assert.equal(context.source, source);
    return { status: 'READY', items: [] };
  };
  client = { query: async sql => {
    if (sql.startsWith('SELECT s.*')) return { rows: [{ StudentID: 101, ProgramID: 1, CurrentSemester: 5, Status: 'ACTIVE', AccountStatus: 'ACTIVE' }] };
    if (sql.startsWith('SELECT COALESCE("StudentCurriculumSemester"')) return { rows: [{ semester: 5 }] };
    if (sql.startsWith('WITH owner')) return { rows: [{ id: 1, name: 'Summer 2026', isCurrent: false, endDate: '2026-08-31', curriculumSemester: 4 }] };
    if (sql.startsWith('SELECT COALESCE')) return { rows: [{ OJTSemesterID: null }] };
    if (sql.includes('FROM "OJTActiveRuleSets"')) return { rows: [rule] };
    if (sql.includes('FROM "ProgramPrerequisiteGroups"')) return { rows: [] };
    if (sql.startsWith('SELECT "FullName"')) return { rows: [{ FullName: 'Student' }] };
    throw new Error('Unexpected current-view read: ' + sql);
  } };
  try {
    const before = await studyOverview({ view: 'current' }, actor());
    assert.equal(before.period, null);
    assert.equal(before.historical, false);
    assert.equal(before.cutoff, null);
    assert.equal(before.currentSemester, 5);
    assert.equal(before.academic.academicProgress.credits.earned, 3);
    assert.equal(before.assessment.risk.level, 'HIGH');
    assert.equal(before.assessment.risk.evidence.currentSemester, 5);
    assert.equal(before.assessment.risk.evidence.failedCourseCount, 1);
    assert.equal(before.assessment.ojtSemesterId, null);
    source.attempts.push({ id: 3, courseId: 1, courseCode: 'C1', status: 'PASSED', score: 9, periodStartDate: '2026-11-01', attemptNumber: 2 });
    const after = await studyOverview({ view: 'current' }, actor());
    assert.equal(after.academic.academicProgress.credits.earned, 6);
    assert.equal(after.assessment.risk.level, 'LOW');
    assert.equal(after.assessment.risk.evidence.failedCourseCount, 0);
    assert.equal(sourceReads, 2, 'Each current read must use fresh academic records.');
  } finally {
    progressModule.loadAcademicProgress = originalSource;
    planModule.coursePlanWithClient = originalPlan;
  }
});
test('historic study views never publish risk or generate a personal roadmap', async () => {
  const progressModule = require('../dist/modules/students/academic-progress');
  const academicModule = require('../dist/modules/student-portal/academic.service');
  const planModule = require('../dist/modules/student-portal/course-plan.service');
  const originalSource = progressModule.loadAcademicProgress;
  const originalSummary = academicModule.summaryWithClient;
  const originalPlan = planModule.coursePlanWithClient;
  const source = { studentId: 101, program: undefined, courses: [], attempts: [], aliases: [], options: [], policy: undefined, issues: [], gradeWeights: [] };
  progressModule.loadAcademicProgress = async () => source;
  academicModule.summaryWithClient = async () => ({ academicWarning: { level: 'INSUFFICIENT_DATA', computedAt: '' }, earlyWarning: { available: false } });
  planModule.coursePlanWithClient = async () => { throw new Error('A past term must not generate a risk roadmap.'); };
  client = { query: async sql => {
    if (sql.startsWith('SELECT s.*')) return { rows: [{ StudentID: 101, ProgramID: 1, CurrentSemester: 5, Status: 'ACTIVE', AccountStatus: 'ACTIVE' }] };
    if (sql.startsWith('WITH owner')) return { rows: [{ id: 1, name: 'Spring 2026', isCurrent: false, endDate: '2026-04-30', curriculumSemester: 4 }] };
    if (sql.startsWith('SELECT to_char')) return { rows: [{ cutoff: '2026-04-30T23:59:59' }] };
    if (sql.startsWith('SELECT COALESCE')) return { rows: [{ OJTSemesterID: null }] };
    if (sql.includes('FROM "OJTActiveRuleSets"')) return { rows: [] };
    throw new Error('Unexpected historic-view read: ' + sql);
  } };
  try {
    const result = await studyOverview({ academicPeriodId: 1 }, actor());
    assert.equal(result.historical, true);
    assert.equal(result.assessment, null);
    assert.equal(result.academic.academicWarning, null);
    assert.equal(result.academic.earlyWarning, null);
  } finally {
    progressModule.loadAcademicProgress = originalSource;
    academicModule.summaryWithClient = originalSummary;
    planModule.coursePlanWithClient = originalPlan;
  }
});
test('academic warning uses the selected program stage and reference date, without requiring an OJT term', async () => {
  const rule = { RuleSetID: 1, ProgramID: 1, OJTSemesterID: null, MinCredits: 6, MaxUnpassedCourses: 2, Status: 'PUBLISHED' };
  const source = { studentId: 101, program: { ProgramID: 1, Status: 'PUBLISHED', TotalCredits: 6, PrerequisitesReviewed: true },
    courses: [1, 2].map(id => ({ ProgramCourseID: id, CourseID: id, CourseCode: 'C' + id, CourseName: 'Course', EntryKind: 'COURSE', Credits: 3, IsRequired: true, RecommendedSemester: id })),
    attempts: [{ id: 1, courseId: 1, courseCode: 'C1', status: 'FAILED', score: 4, periodStartDate: '2026-01-01', attemptNumber: 1 },
      { id: 2, courseId: 2, courseCode: 'C2', status: 'PASSED', score: 8, periodStartDate: '2026-01-01', attemptNumber: 1 }],
    aliases: [], options: [], policy: { GpaScale: 10 }, issues: [], gradeWeights: [] };
  const c = { query: async sql => {
    if (sql.includes('FROM "ProgramPrerequisiteGroups"')) return { rows: [] };
    if (sql.includes('FROM "OJTActiveRuleSets"')) return { rows: [rule] };
    throw new Error('Selected-period assessment must not read the current placement or require an OJT window.');
  } };
  const { evaluateEligibility } = require('../dist/modules/eligibility/eligibility.service');
  const { progressFromData } = require('../dist/modules/students/academic-progress');
  const current = evaluateEligibility({ student: { StudentID: 101, Status: 'ACTIVE', AccountStatus: 'ACTIVE' }, semester: { OJTSemesterID: null }, rule,
    progress: progressFromData(source), attempts: source.attempts, aliases: [] });
  const referenceDate = new Date('2026-04-30T16:59:59Z');
  const result = await summaryWithClient(c, 101, null, source, { current, official: null }, { source, studyPeriod: { curriculumSemester: 3, referenceDate } });
  assert.equal(result.currentSemester, 3);
  assert.equal(result.academicWarning.evidence.currentSemester, 3);
  assert.equal(result.academicWarning.computedAt, referenceDate.toISOString());
  assert.equal(result.academicWarning.level, 'MEDIUM');
  assert.equal(result.officialEligibility, null);
  assert.equal(result.ojtSemesterId, null);
});
