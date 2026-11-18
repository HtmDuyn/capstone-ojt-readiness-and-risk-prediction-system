const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');

const target = process.env.STUDENT_RISK_TEST_DATABASE_URL;
if (!target) throw Error('Set STUDENT_RISK_TEST_DATABASE_URL.');
const url = new URL(target);
if (url.hostname !== '127.0.0.1' || url.port !== '55439' || url.pathname !== '/student_risk_performance_test')
  throw Error('Only disposable localhost:55439/student_risk_performance_test may be reset.');
delete process.env.DATABASE_URL;
delete process.env.SUPABASE_DATABASE_URL;
process.env.LOCAL_DATABASE_URL = target;
process.env.DB_SSL = 'false';

test('assessment query reuse preserves the complete original warning and roadmap', async t => {
  const c = new Client({ connectionString: target });
  await c.connect();
  t.after(() => c.end());
  await c.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public');
  await c.query(fs.readFileSync(path.join(__dirname, '../DB'), 'utf8'));
  // Compare even computedAt exactly; only the clock is fixed, not any calculation.
  t.mock.timers.enable({ apis: ['Date'], now: Date.parse('2026-11-18T05:00:00Z') });
  const { pool } = require('../dist/config/database');
  t.after(() => pool.end());
  const { studentProfile } = require('../dist/modules/students/student-profile.service');
  const { ownStudent } = require('../dist/modules/student-portal/shared');
  const { coursePlanWithClient, loadCoursePlanData } = require('../dist/modules/student-portal/course-plan.service');
  const { loadAcademicProgress } = require('../dist/modules/students/academic-progress');
  const { assessOjtRisk, buildRiskAndRoadmap } = require('../dist/modules/student-portal/ojt-risk.service');
  const students = (await c.query('SELECT "StudentID" id,"UserID" user_id,"ProgramID" program_id FROM "Students" WHERE "Status"=\'ACTIVE\' ORDER BY "StudentID"')).rows;
  const actor = id => ({ studentId: id, userId: students.find(s => s.id === id).user_id, roleCode: 'STUDENT' });
  let queries = [];
  const query = c.query.bind(c);
  c.query = (...args) => { queries.push({ sql: args[0], args: args[1] }); return query(...args); };
  async function measure(work) {
    queries = [];
    const result = await work();
    return { result, queries: [...queries] };
  }
  // Keep the previous orchestration as an independent baseline. Default profile
  // and course-plan calls still serve other callers without the optimization context.
  async function legacy(identity) {
    const student = await ownStudent(c, identity);
    const profile = await studentProfile(student.StudentID, { include: 'academic,academicProgress' }, identity, c);
    const canPlan = profile.academic?.earlyWarning?.available && profile.academic?.academicWarning?.level !== 'INSUFFICIENT_DATA';
    return buildRiskAndRoadmap(profile, canPlan ? await coursePlanWithClient(c, student.StudentID) : null);
  }
  async function compare(id) {
    const before = await measure(() => legacy(actor(id)));
    const after = await measure(() => assessOjtRisk(actor(id), c));
    assert.deepEqual(after.result, before.result, `Entire response changed for student ${id}`);
    assert.ok(after.queries.length < before.queries.length, 'Assessment should issue fewer SQL statements');
    const sourceReads = after.queries.filter(q => q.sql === 'SELECT * FROM "Students" WHERE "StudentID"=$1');
    assert.equal(sourceReads.length, 1, 'Academic progress must be loaded once per assessment');
    const prerequisites = after.queries.filter(q => q.sql.includes('AS "requirementId"') && q.sql.includes('FROM "ProgramPrerequisiteGroups"'));
    assert.ok(prerequisites.length <= 1, 'Warning and roadmap must share prerequisite groups');
    assert.ok(after.queries.every(q => !q.sql.includes('AS "courseIds" FROM "ProgramPrerequisiteGroups" g JOIN "ProgramCourses"')), 'No supplementary-course picker query in assessment');
    return { before, after };
  }
  async function fixture(work, check) {
    await c.query('BEGIN ISOLATION LEVEL REPEATABLE READ');
    try { await work(); await check(); } finally { await c.query('ROLLBACK'); }
  }

  await t.test('all seeded students retain risk levels, evidence, actions and ordered course plans', async () => {
    const levels = new Set();
    const measurements = [];
    await fixture(async () => {}, async () => {
      for (const student of students) {
        const { before, after } = await compare(student.id);
        levels.add(after.result.risk.level);
        measurements.push({ studentId: student.id, level: after.result.risk.level, roadmap: after.result.roadmap.status,
          before: before.queries.length, after: after.queries.length });
      }
    });
    assert.ok(levels.has('LOW') && levels.has('HIGH'));
    console.log(JSON.stringify({ seededAssessments: measurements }));
  });

  const resultId = (await c.query(`SELECT r."ResultID" id FROM "StudentCourseResults" r
    JOIN "ProgramCourses" pc ON pc."CourseID"=r."CourseID" AND pc."ProgramID"=$1
    WHERE r."StudentID"=1 AND r."Status"='PASSED' AND pc."Credits"=3 AND pc."RecommendedSemester"<=5
    ORDER BY r."ResultID" LIMIT 1`, [students[0].program_id])).rows[0].id;

  await t.test('a recoverable credit shortfall retains MEDIUM risk and the same roadmap', async () => {
    await fixture(async () => {
      await c.query('UPDATE "StudentCourseResults" SET "Status"=\'IN_PROGRESS\',"Score"=NULL,"GradePoints"=NULL WHERE "ResultID"=$1', [resultId]);
      await c.query('UPDATE "OJTAssessmentWindows" SET "ClosesAt"=\'2026-11-25 00:00:00+07\'');
    }, async () => {
      const { after } = await compare(1);
      assert.equal(after.result.risk.level, 'MEDIUM');
      assert.equal(after.result.roadmap.status, 'READY');
    });
  });

  await t.test('expired deadlines retain HIGH risk, reason codes and evidence', async () => {
    await fixture(async () => {
      await c.query('UPDATE "StudentCourseResults" SET "Status"=\'IN_PROGRESS\',"Score"=NULL,"GradePoints"=NULL WHERE "ResultID"=$1', [resultId]);
      await c.query('UPDATE "OJTAssessmentWindows" SET "OpensAt"=\'2026-10-01\',"ClosesAt"=\'2026-11-01\'');
    }, async () => {
      const { after } = await compare(1);
      assert.equal(after.result.risk.level, 'HIGH');
      assert.ok(after.result.risk.reasons.some(r => r.code === 'ASSESSMENT_DEADLINE_PASSED'));
    });
  });

  await t.test('unreviewed prerequisites still block a READY roadmap', async () => {
    await fixture(async () => {
      await c.query('UPDATE "TrainingPrograms" SET "PrerequisitesReviewed"=false WHERE "ProgramID"=$1', [students[0].program_id]);
    }, async () => {
      const { after } = await compare(1);
      assert.equal(after.result.roadmap.status, 'DATA_INCOMPLETE');
      assert.deepEqual(after.result.roadmap.items, []);
    });
  });

  await t.test('missing grading configuration still returns insufficient data without course recommendations', async () => {
    await fixture(async () => {
      await c.query('DELETE FROM "AcademicGradingPolicies" WHERE "ProgramID"=$1', [students[0].program_id]);
    }, async () => {
      const { after } = await compare(1);
      assert.equal(after.result.risk.level, 'INSUFFICIENT_DATA');
      assert.equal(after.result.roadmap.status, 'NOT_AVAILABLE');
    });
  });

  await t.test('no earned credits retain the monitoring gate', async () => {
    await fixture(async () => {
      await c.query('UPDATE "StudentCourseResults" SET "Status"=\'WITHDRAWN\',"Score"=NULL,"GradePoints"=NULL WHERE "StudentID"=1');
    }, async () => {
      const { after } = await compare(1);
      assert.equal(after.result.risk.level, 'INSUFFICIENT_DATA');
      assert.ok(after.result.risk.evidence.monitoringGateReasons.includes('NO_EARNED_CREDITS'));
    });
  });

  await t.test('reads are fresh after grade changes; no request context survives into the next assessment', async () => {
    await fixture(async () => {}, async () => {
      const initial = await assessOjtRisk(actor(1), c);
      await c.query('UPDATE "StudentCourseResults" SET "Status"=\'IN_PROGRESS\',"Score"=NULL,"GradePoints"=NULL WHERE "ResultID"=$1', [resultId]);
      const { after } = await compare(1);
      assert.notEqual(after.result.risk.evidence.earnedCredits, initial.risk.evidence.earnedCredits);
    });
  });

  await t.test('a context belonging to another student cannot supply the course plan source', async () => {
    await fixture(async () => {}, async () => {
      const source = await loadAcademicProgress(c, 1);
      const before = await loadCoursePlanData(c, 2);
      const after = await loadCoursePlanData(c, 2, { source, prerequisiteGroups: [] });
      assert.deepEqual(after, before);
      assert.equal(after.data.studentId, 2);
    });
  });
});
