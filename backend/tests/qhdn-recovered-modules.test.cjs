const test = require('node:test');
const assert = require('node:assert/strict');
const { PGlite } = require('@electric-sql/pglite');
const load = require('./helpers/load-source.cjs');

test('recruitment reads filter by company/semester and retain period metadata without recruitment windows', async t => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    CREATE TABLE "Enterprises" ("EnterpriseID" int PRIMARY KEY,"Name" text);
    CREATE TABLE "AcademicPeriods" ("AcademicPeriodID" int PRIMARY KEY,"PeriodCode" text);
    CREATE TABLE "OJTSemesters" ("OJTSemesterID" int PRIMARY KEY,"AcademicPeriodID" int);
    CREATE TABLE "RecruitmentWindows" ("WindowID" int PRIMARY KEY,"AcademicPeriodID" int);
    CREATE TABLE "RecruitmentPosts" ("PostID" int PRIMARY KEY,"EnterpriseID" int,"OJTSemesterID" int,"WindowID" int,"Status" text,"DeadlineAt" timestamptz);
    CREATE TABLE "RecruitmentPostPositions" ("PostID" int,"PositionID" int);
    CREATE TABLE "InternshipPositions" ("PositionID" int,"RecruitmentCode" text,"Title" text,"Description" text,"Requirements" text,"Capacity" int,"Status" text,"Location" text,"WorkMode" text);
    CREATE TABLE "InternshipAssignments" ("PositionID" int,"Status" text);
    INSERT INTO "Enterprises" VALUES (1,'Fixture A'),(2,'Fixture B');
    INSERT INTO "AcademicPeriods" VALUES (11,'FALL'),(12,'SPRING');
    INSERT INTO "OJTSemesters" VALUES (1,11),(2,12);
    INSERT INTO "RecruitmentPosts" VALUES (1,1,1,NULL,'PUBLISHED',now()+interval '1 month'),(2,1,2,NULL,'PUBLISHED',now()+interval '1 month'),(3,2,1,NULL,'PUBLISHED',now()+interval '1 month');
  `);
  const c = { query: async (sql, args) => {
    const result = await db.query(sql, args);
    return { ...result, rowCount: result.affectedRows || result.rows.length };
  } };
  let own = null;
  const repository = load('src/modules/recruitment/recruitment.repository.ts', {
    '../qhdn/catalog.service': { enterpriseScope: async () => own },
  });
  const { listPosts } = load('src/modules/recruitment/post.service.ts', {
    '../../shared/list-context': { enrichListRows: async (_c, rows) => rows },
    '../academic/academic.repository': {},
    '../academic/workflow-policy': {},
    '../qhdn/catalog.service': { enterpriseScope: async () => own },
    '../qhdn/read.repository': { readTransaction: async work => work(c) },
    './recruitment.repository': repository,
  });
  const actor = { userId: 1, roleCode: 'OJT_COORD' };
  const result = await listPosts({ companyId: 1, ojtSemesterId: 1 }, actor);
  assert.equal(result.total, 1);
  assert.equal(result.items[0].id, 1);
  assert.equal(result.items[0].academicPeriodId, 11);
  assert.equal(result.items[0].periodCode, 'FALL');
  assert.equal(result.items[0].windowId, null);
  assert.equal((await listPosts({ academicPeriodId: 11 }, actor)).total, 2);
  own = 2;
  assert.equal((await listPosts({ companyId: 1, ojtSemesterId: 1 }, { userId: 2, roleCode: 'ENTERPRISE' })).total, 0);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM "RecruitmentWindows"')).rows[0].n, 0);
});
