// Build first, then: node tests/study-periods.postgres.cjs
// Only read-only SQL and VALUES fixtures are used; no application rows are changed.
const assert = require('node:assert/strict');
const { Client } = require('pg');
require('dotenv').config({ path: require('node:path').resolve(__dirname, '../.env'), quiet: true });
const { databaseConfig, pool } = require('../dist/config/database');
const { studyPeriodsWithClient } = require('../dist/modules/student-portal/study-period.service');
const { loadAcademicProgress, calculateProgress } = require('../dist/modules/students/academic-progress');
const { evaluateEligibility } = require('../dist/modules/eligibility/eligibility.service');
const sid = 2147483000;

async function main() {
  let catalogSql;
  await studyPeriodsWithClient({ query: async sql => { catalogSql = sql; return { rows: [] }; } }, { StudentID: sid, CurrentSemester: 4 });
  let resultSql, curriculumSql, curriculumArgs;
  const fixtureClient = { query: async (sql, args) => {
    if (sql.startsWith('WITH curriculum')) {
      curriculumSql = sql; curriculumArgs = args;
      return { rows: [{ program: {}, policy: {}, courses: [], aliases: [], options: [], invalidGroups: [], gradeWeights: [] }] };
    }
    if (sql.startsWith('SELECT EXISTS')) return { rows: [{ missing: false }] };
    resultSql = sql;
    return { rows: [] };
  } };
  await loadAcademicProgress(fixtureClient, sid, undefined, '2026-04-30T23:59:59');
  assert.match(resultSql, /p\."StartDate"<=\$2::timestamp/);
  assert.match(curriculumSql, /"ConfirmedAt" AT TIME ZONE/);
  const client = new Client({ connectionString: databaseConfig.url, ssl: databaseConfig.ssl, connectionTimeoutMillis: 5000, statement_timeout: 10000 });
  try {
    await client.connect(); await client.query('BEGIN READ ONLY');
    const periods = `WITH "Students"("StudentID") AS (VALUES (${sid})),
      "StudentAcademicPlacements"("StudentID","CohortID","GroupCode","CurrentAcademicPeriodID") AS (VALUES (${sid},999,'A',2)),
      "AcademicPeriods"("AcademicPeriodID","ParentPeriodID","Kind","StartDate","EndDate","Name","PeriodCode") AS (
        VALUES (1,NULL::int,'SEMESTER',CURRENT_DATE-400,CURRENT_DATE-300,'Đã học','OLD'),
          (2,NULL,'SEMESTER',CURRENT_DATE-10,CURRENT_DATE+20,'Đang học','CURRENT'),
          (3,NULL,'SEMESTER',CURRENT_DATE+100,CURRENT_DATE+200,'Tương lai','FUTURE'),
          (4,NULL,'SEMESTER',CURRENT_DATE-800,CURRENT_DATE-700,'Khóa khác','FOREIGN'),
          (5,1,'BLOCK3',CURRENT_DATE-350,CURRENT_DATE-340,'Block 3','BLOCK')
      ), "CohortCurriculumPeriods"("CohortID","GroupCode","AcademicPeriodID","CurriculumSemester") AS (
        VALUES (999,'A',1,3),(999,'A',2,4),(999,'A',3,5),(998,'B',4,1)
      ), "StudentCourseResults"("StudentID","AcademicPeriodID","SemesterTaken") AS (
        VALUES (${sid},5,3),(${sid},2,4),(1234,4,1)
      ), owner AS (`;
    const catalog = await client.query(catalogSql.replace('WITH owner AS (', periods), [sid, 4]);
    assert.deepEqual(catalog.rows.map(row => row.id), [2, 1]);
    assert.equal(catalog.rows[0].isCurrent, true);
    assert.equal(catalog.rows[1].isCurrent, false);
    assert.equal(catalog.rows[1].curriculumSemester, 3);
    console.log('PASS: only the owner\'s past/current semesters appear; future, foreign-cohort and standalone block entries are excluded.');

    const results = `WITH "AcademicPeriods"("AcademicPeriodID","PeriodCode","Name","Kind","StartDate") AS (
        VALUES (1,'SPRING','Spring 2026','SEMESTER',DATE '2026-01-01'),(2,'FALL','Fall 2026','SEMESTER',DATE '2026-09-01')
      ), "Courses"("CourseID","CourseCode","CourseName") AS (VALUES (1,'A','Môn A'),(2,'B','Môn B')),
      "StudentCourseResults"("ResultID","StudentID","CourseID","AcademicPeriodID","AcademicYearID","SemesterTaken","AttemptNumber","Score","GradePoints","Grade","Status","SourceReference","OJTResultID","RecordedBy","CreatedAt","UpdatedAt") AS (
        VALUES (1,${sid},1,1,1,1,1,4::numeric,NULL::numeric,NULL::text,'FAILED',NULL::text,NULL::int,NULL::int,now(),now()),
          (2,${sid},2,1,1,1,1,8,NULL,NULL,'PASSED',NULL,NULL,NULL,now(),now()),
          (3,${sid},1,2,1,3,2,10,NULL,NULL,'PASSED',NULL,NULL,NULL,now(),now()),
          (4,1234,1,1,1,1,1,10,NULL,NULL,'PASSED',NULL,NULL,NULL,now(),now())
      ) `;
    const past = (await client.query(results + resultSql, [sid, '2026-04-30T23:59:59'])).rows;
    const later = (await client.query(results + resultSql, [sid, '2026-12-31T23:59:59'])).rows;
    assert.deepEqual(past.map(row => row.id).sort(), [1, 2]);
    assert.deepEqual(later.map(row => row.id).sort(), [1, 2, 3]);
    const program = { ProgramID: 1, Status: 'PUBLISHED', TotalCredits: 6 };
    const courses = [1, 2].map(id => ({ ProgramCourseID: id, CourseID: id, CourseCode: String(id), CourseName: 'Course', EntryKind: 'COURSE', Credits: 3, IsRequired: true }));
    const calculate = attempts => calculateProgress(program, courses, attempts, [], [], { GpaScale: 10 });
    const pastProgress = calculate(past), laterProgress = calculate(later);
    assert.equal(pastProgress.credits.earned, 3); assert.equal(pastProgress.gpa, 6);
    assert.equal(laterProgress.credits.earned, 6); assert.equal(laterProgress.gpa, 9);
    const eligibility = (attempts, progress) => evaluateEligibility({ student: { StudentID: sid, Status: 'ACTIVE', AccountStatus: 'ACTIVE' }, semester: { OJTSemesterID: null }, rule: { MinCredits: 6, MaxUnpassedCourses: 0 }, progress, attempts, aliases: [] });
    assert.equal(eligibility(past, pastProgress).unpassedCourseCount, 1);
    assert.equal(eligibility(later, laterProgress).unpassedCourseCount, 0);
    console.log('PASS: future retakes do not alter earlier GPA, earned credits or course debt; cumulative progress updates at the selected semester.');
    await client.query('EXPLAIN (FORMAT JSON) ' + curriculumSql, curriculumArgs);
    console.log('PASS: curriculum selection cutoff compiles against the configured PostgreSQL schema.');
    await client.query('ROLLBACK');
  } finally { await client.end(); await pool?.end(); }
}
main().catch(error => {
  console.error('Study-period check failed:', error.code ?? error.name);
  if (!error.code || ['42703', '42P01', '42601'].includes(error.code)) console.error(error.message);
  process.exitCode = 1;
});
