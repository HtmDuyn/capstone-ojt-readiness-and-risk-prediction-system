const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const ts = require('typescript');
const { PGlite } = require('@electric-sql/pglite');

// Compile source in memory; no dist files, tsx daemon, .env or production DB.
require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(
  fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } },
).outputText, file);
for (const key of ['DATABASE_URL', 'SUPABASE_DATABASE_URL', 'LOCAL_DATABASE_URL', 'DB_USER', 'DB_PASSWORD']) delete process.env[key];
process.env.JWT_SECRET = 'qhdn-eligible-students-isolated-test-secret';

test('QHDN received eligible roster: database, HTTP access and Swagger', async t => {
  const db = new PGlite();
  t.after(() => db.close());
  // Isolated fixture for the tables this API reads. Do not execute the user's
  // reset/demo script or depend on its unrelated catalog and seed changes.
  await db.exec(`
    CREATE TABLE "Roles" ("RoleID" serial PRIMARY KEY,"RoleCode" text UNIQUE,"RoleName" text);
    CREATE TABLE "Users" ("UserID" serial PRIMARY KEY,"Username" text UNIQUE,"Email" text UNIQUE,
      "FullName" text,"PasswordHash" text,"Phone" text,"RoleID" int REFERENCES "Roles",
      "Status" text DEFAULT 'ACTIVE',"MustChangePassword" boolean DEFAULT false,
      "TemporaryPasswordExpiresAt" timestamptz,"AuthVersion" int DEFAULT 0);
    CREATE TABLE "AcademicYears" ("AcademicYearID" serial PRIMARY KEY);
    CREATE TABLE "OJTSemesters" ("OJTSemesterID" serial PRIMARY KEY,"AcademicYearID" int REFERENCES "AcademicYears",
      "AcademicPeriodID" int,"SemesterCode" text UNIQUE,"Name" text,"StartDate" date,"EndDate" date,"Status" text);
    CREATE TABLE "TrainingPrograms" ("ProgramID" serial PRIMARY KEY,"ProgramCode" text,"ProgramName" text);
    CREATE TABLE "Cohorts" ("CohortID" serial PRIMARY KEY,"Name" text);
    CREATE TABLE "Students" ("StudentID" serial PRIMARY KEY,"UserID" int UNIQUE REFERENCES "Users",
      "StudentCode" text UNIQUE,"ProgramID" int REFERENCES "TrainingPrograms","Status" text,"DeletedAt" timestamptz);
    CREATE TABLE "StudentAcademicPlacements" ("StudentID" int PRIMARY KEY REFERENCES "Students",
      "CohortID" int REFERENCES "Cohorts","GroupCode" text,"EntryAcademicPeriodID" int,
      "CurrentAcademicPeriodID" int,"UpdatedBy" int REFERENCES "Users");
    CREATE TABLE "EligibilityChecks" ("CheckID" serial PRIMARY KEY,"StudentID" int REFERENCES "Students",
      "OJTSemesterID" int REFERENCES "OJTSemesters","RuleSetID" int,"Source" text,"Status" text,
      "SourceHash" text,"InputSnapshot" jsonb,"Result" jsonb,"CheckedBy" int REFERENCES "Users",
      "CheckedAt" timestamptz DEFAULT now(),UNIQUE("CheckID","StudentID","OJTSemesterID"));
    CREATE TABLE "EligibilityConfirmations" ("CheckID" int PRIMARY KEY REFERENCES "EligibilityChecks",
      "ConfirmedBy" int REFERENCES "Users","ConfirmedAt" timestamptz DEFAULT now(),"Reason" text);
    CREATE TABLE "EligibleStudentHandoffs" ("HandoffID" serial PRIMARY KEY,
      "OJTSemesterID" int REFERENCES "OJTSemesters","IdempotencyKey" text UNIQUE,"RequestHash" text,
      "RegistrationIDs" jsonb,"Reason" text,"CreatedBy" int REFERENCES "Users",
      "CreatedAt" timestamptz DEFAULT now(),"RecipientRole" text DEFAULT 'OJT_COORD',
      UNIQUE("HandoffID","OJTSemesterID"));
    CREATE TABLE "EligibleStudentHandoffItems" ("HandoffID" int,"OJTSemesterID" int,
      "StudentID" int,"CheckID" int,"Snapshot" jsonb,PRIMARY KEY("HandoffID","StudentID"),
      FOREIGN KEY("HandoffID","OJTSemesterID") REFERENCES "EligibleStudentHandoffs"("HandoffID","OJTSemesterID"),
      FOREIGN KEY("CheckID","StudentID","OJTSemesterID") REFERENCES "EligibilityChecks"("CheckID","StudentID","OJTSemesterID"));
    CREATE TABLE "OJTRegistrations" ("RegistrationID" serial PRIMARY KEY,"StudentID" int REFERENCES "Students",
      "OJTSemesterID" int REFERENCES "OJTSemesters","Status" text,"WindowID" int,
      "RegisteredAt" timestamptz DEFAULT now(),UNIQUE("StudentID","OJTSemesterID"));
    CREATE TABLE "EnterpriseUsers" ("UserID" int REFERENCES "Users","EnterpriseID" int);
    INSERT INTO "Roles" ("RoleCode","RoleName") VALUES ('ADMIN','Admin'),('ACADEMIC','Academic'),
      ('OJT_COORD','QHDN'),('ENTERPRISE','Enterprise'),('STUDENT','Student');
    INSERT INTO "Users" ("Username","Email","FullName","RoleID","Status")
      SELECT 'fixture_academic','academic@fixture.test','Fixture Academic',"RoleID",'ACTIVE' FROM "Roles" WHERE "RoleCode"='ACADEMIC';
    INSERT INTO "AcademicYears" DEFAULT VALUES;
    INSERT INTO "TrainingPrograms" ("ProgramCode","ProgramName") VALUES ('IS-FIXTURE','Information Systems');
    INSERT INTO "Cohorts" ("Name") VALUES ('Fixture Cohort');
  `);
  const query = async (sql, args) => {
    const result = await db.query(sql, args);
    return { ...result, rowCount: result.affectedRows || result.rows.length };
  };
  const config = require('../src/config/database.ts');
  config.pool = { connect: async () => ({ query, release() {} }) };
  config.query = query;
  const { eligibleStudents } = require('../src/modules/qhdn/eligible-students.service.ts');
  const staff = (await query(`SELECT u."UserID" FROM "Users" u JOIN "Roles" r ON r."RoleID"=u."RoleID"
    WHERE r."RoleCode"='ACADEMIC' AND u."Status"='ACTIVE' ORDER BY u."UserID" LIMIT 1`)).rows[0].UserID;
  const createUser = async (code, role) => (await query(`INSERT INTO "Users"
    ("Username","Email","FullName","PasswordHash","RoleID","Status")
    SELECT $1,$2,$1,'unused-test-password',"RoleID",'ACTIVE' FROM "Roles" WHERE "RoleCode"=$3 RETURNING "UserID"`,
  [code, code.toLowerCase() + '@fixture.test', role])).rows[0].UserID;
  const coordId = await createUser('REVIEW_COORD', 'OJT_COORD');
  const actor = { userId: coordId, roleCode: 'OJT_COORD' };
  const term = async code => (await query(`INSERT INTO "OJTSemesters"
    ("AcademicYearID","SemesterCode","Name","StartDate","EndDate","Status")
    SELECT "AcademicYearID",$1,$1,'2027-01-01','2027-04-30','PLANNED' FROM "AcademicYears"
    ORDER BY "AcademicYearID" LIMIT 1 RETURNING "OJTSemesterID"`, [code])).rows[0].OJTSemesterID;
  const semesterId = await term('REVIEW-RECEIVED');
  const otherSemesterId = await term('REVIEW-OTHER');
  const emptySemesterId = await term('REVIEW-EMPTY');
  const placement = { CohortID: 1, GroupCode: 'A', EntryAcademicPeriodID: 1, CurrentAcademicPeriodID: 5 };
  const programId = (await query('SELECT "ProgramID" FROM "TrainingPrograms" ORDER BY "ProgramID" LIMIT 1')).rows[0].ProgramID;
  const makeStudent = async (code, options = {}) => {
    const userId = await createUser(code, 'STUDENT');
    const studentId = (await query(`INSERT INTO "Students" ("UserID","StudentCode","ProgramID","Status")
      VALUES ($1,$2,$3,'ACTIVE') RETURNING "StudentID"`, [userId, code, programId])).rows[0].StudentID;
    await query(`INSERT INTO "StudentAcademicPlacements" ("StudentID","CohortID","GroupCode",
      "EntryAcademicPeriodID","CurrentAcademicPeriodID","UpdatedBy") VALUES($1,$2,$3,$4,$5,$6)`,
    [studentId, placement.CohortID, placement.GroupCode, placement.EntryAcademicPeriodID, placement.CurrentAcademicPeriodID, staff]);
    const sid = options.semesterId ?? semesterId;
    const checkId = (await query(`INSERT INTO "EligibilityChecks"
      ("StudentID","OJTSemesterID","Source","Status","SourceHash","InputSnapshot","Result","CheckedBy")
      VALUES($1,$2,'MANUAL','ELIGIBLE','fixture','{}',$3,$4) RETURNING "CheckID"`,
    [studentId, sid, JSON.stringify({ status: 'ELIGIBLE', earnedCredits: 72, missingCredits: 0, unpassedCourseCount: 1 }), staff])).rows[0].CheckID;
    if (!options.unconfirmed) await query(`INSERT INTO "EligibilityConfirmations" ("CheckID","ConfirmedBy","Reason") VALUES($1,$2,'Fixture confirmation')`, [checkId, staff]);
    let handoffId = null;
    if (options.handoff) {
      handoffId = (await query(`INSERT INTO "EligibleStudentHandoffs"
        ("OJTSemesterID","IdempotencyKey","RequestHash","RegistrationIDs","Reason","CreatedBy")
        VALUES($1,$2,'fixture','[]','Fixture academic handoff',$3) RETURNING "HandoffID"`, [sid, code, staff])).rows[0].HandoffID;
      await query(`INSERT INTO "EligibleStudentHandoffItems" ("HandoffID","OJTSemesterID","StudentID","CheckID","Snapshot")
        VALUES($1,$2,$3,$4,'{}')`, [handoffId, sid, studentId, checkId]);
    }
    if (options.registered) await query(`INSERT INTO "OJTRegistrations" ("StudentID","OJTSemesterID","Status") VALUES($1,$2,$3)`, [studentId, sid, typeof options.registered === 'string' ? options.registered : 'SUBMITTED']);
    if (options.deleted) await query('UPDATE "Students" SET "DeletedAt"=now() WHERE "StudentID"=$1', [studentId]);
    return { studentId, userId, checkId, handoffId };
  };
  await makeStudent('REVIEW_NOT_SENT');
  await makeStudent('REVIEW_UNCONFIRMED', { unconfirmed: true });
  await makeStudent('REVIEW_LEGACY_ONLY', { registered: 'HANDED_OFF' });
  const first = await makeStudent('REVIEW_RECEIVED_A', { handoff: true });
  const second = await makeStudent('REVIEW_RECEIVED_B', { handoff: true, registered: true });
  await makeStudent('REVIEW_OTHER_TERM', { handoff: true, semesterId: otherSemesterId });
  await makeStudent('REVIEW_DELETED', { handoff: true, deleted: true });
  const params = { ojtSemesterId: String(semesterId) };

  await t.test('received roster includes unregistered students and excludes unsent/other-term/deleted students', async () => {
    const data = await eligibleStudents(params, actor);
    assert.equal(data.total, 2);
    assert.deepEqual(new Set(data.items.map(x => x.studentId)), new Set([first.studentId, second.studentId]));
    const item = data.items.find(x => x.studentId === first.studentId);
    assert.equal(item.registration, null);
    assert.equal(item.registrationStatus, 'NOT_REGISTERED');
    assert.equal(item.handoff.id, first.handoffId);
    assert.equal(item.handoff.createdBy, staff);
    assert.equal(item.eligibilityAtHandoff.checkId, first.checkId);
    assert.equal(item.eligibilityAtHandoff.validity, 'AT_HANDOFF');
    assert.equal(item.eligibilityAtHandoff.earnedCredits, 72);
    assert.equal(data.semester.id, semesterId);
    assert.equal(data.semester.startDate, '2027-01-01');
    assert.equal(data.semester.endDate, '2027-04-30');
    assert.equal((await eligibleStudents(params, { ...actor, roleCode: 'ADMIN' })).total, 2);
  });
  await t.test('filters apply before total and pagination, including empty pages', async () => {
    const filtered = await eligibleStudents({ ...params, registrationStatus: 'NOT_REGISTERED', search: 'received_a' }, actor);
    assert.equal(filtered.total, 1);
    assert.equal(filtered.items[0].studentId, first.studentId);
    const scoped = await eligibleStudents({ ...params, programId: String(programId), cohortId: String(placement.CohortID), groupCode: placement.GroupCode }, actor);
    assert.equal(scoped.total, 2);
    assert.equal((await eligibleStudents({ ...params, handoffId: String(first.handoffId) }, actor)).total, 1);
    const a = await eligibleStudents({ ...params, limit: '1', page: '1' }, actor);
    const b = await eligibleStudents({ ...params, limit: '1', page: '2' }, actor);
    assert.equal(a.total, 2);
    assert.notEqual(a.items[0].studentId, b.items[0].studentId);
    const empty = await eligibleStudents({ ...params, limit: '1', page: '3' }, actor);
    assert.equal(empty.total, 2);
    assert.deepEqual(empty.items, []);
    assert.equal((await eligibleStudents({ ojtSemesterId: emptySemesterId }, actor)).total, 0);
    assert.equal((await eligibleStudents({ ...params, search: "' OR 1=1 --" }, actor)).total, 0);
  });
  await t.test('invalid inputs, roles and unknown semesters are rejected', async () => {
    for (const roleCode of ['STUDENT', 'ACADEMIC', 'ENTERPRISE']) await assert.rejects(
      eligibleStudents(params, { ...actor, roleCode }), e => e.statusCode === 403);
    for (const q of [{}, { ojtSemesterId: '0' }, { ...params, limit: '101' },
      { ...params, page: '2147483647' }, { ...params, groupCode: 'E' },
      { ...params, registrationStatus: 'HANDED_OFF' }, { ...params, unexpected: '1' }]) {
      await assert.rejects(eligibleStudents(q, actor), e => e.statusCode === 400);
    }
    await assert.rejects(eligibleStudents({ ojtSemesterId: '2147483647' }, actor), e => e.errorCode === 'OJT_SEMESTER_NOT_FOUND');
  });
  await t.test('the roster retains the original confirmed handoff check after reassessment', async () => {
    const check = (await query(`INSERT INTO "EligibilityChecks"
      ("StudentID","OJTSemesterID","Source","Status","SourceHash","InputSnapshot","Result","CheckedBy")
      VALUES($1,$2,'MANUAL','NOT_ELIGIBLE','changed','{}','{}',$3) RETURNING "CheckID"`, [first.studentId, semesterId, staff])).rows[0];
    await query(`INSERT INTO "EligibilityConfirmations" ("CheckID","ConfirmedBy","Reason") VALUES($1,$2,'Fixture reassessment')`, [check.CheckID, staff]);
    const item = (await eligibleStudents({ ...params, studentId: String(first.studentId) }, actor)).items[0];
    assert.equal(item.eligibilityAtHandoff.checkId, first.checkId);
    assert.equal(item.eligibilityAtHandoff.validity, 'AT_HANDOFF');
  });
  await t.test('HTTP route enforces bearer authentication and QHDN role', async () => {
    const express = require('express');
    const jwt = require('jsonwebtoken');
    const app = express();
    app.use('/api', require('../src/modules/qhdn/qhdn.routes.ts').default);
    app.use((error, _req, res, _next) => res.status(error.statusCode || 500).json({ errorCode: error.errorCode }));
    const server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
    try {
      const url = `http://127.0.0.1:${server.address().port}/api/qhdn/eligible-students?ojtSemesterId=${semesterId}`;
      assert.equal((await fetch(url)).status, 401);
      const headers = userId => ({ Authorization: 'Bearer ' + jwt.sign({ userId, authVersion: 0 }, process.env.JWT_SECRET) });
      assert.equal((await fetch(url, { headers: headers(first.userId) })).status, 403);
      const response = await fetch(url, { headers: headers(coordId) });
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.equal(body.success, true);
      assert.equal(body.data.total, 2);
    } finally { await new Promise(resolve => server.close(resolve)); }
  });
  await t.test('legacy duplicate handoffs cannot duplicate a student or select an old handoff by filter', async () => {
    const newer = (await query(`INSERT INTO "EligibleStudentHandoffs"
      ("OJTSemesterID","IdempotencyKey","RequestHash","RegistrationIDs","Reason","CreatedBy")
      VALUES($1,'fixture-newer','fixture','[]','Legacy duplicate fixture',$2) RETURNING "HandoffID"`, [semesterId, staff])).rows[0].HandoffID;
    await query(`INSERT INTO "EligibleStudentHandoffItems" ("HandoffID","OJTSemesterID","StudentID","CheckID","Snapshot")
      VALUES($1,$2,$3,$4,'{}')`, [newer, semesterId, first.studentId, first.checkId]);
    const roster = await eligibleStudents(params, actor);
    assert.equal(roster.total, 2);
    assert.equal(roster.items.filter(x => x.studentId === first.studentId).length, 1);
    assert.equal(roster.items.find(x => x.studentId === first.studentId).handoff.id, newer);
    assert.equal((await eligibleStudents({ ...params, handoffId: String(first.handoffId) }, actor)).total, 0);
  });
  await t.test('generated Swagger exposes the GET under Phòng QHDN with query and response schemas', () => {
    const spec = require('../src/config/swagger.ts').swaggerSpec;
    const operation = spec.paths['/api/qhdn/eligible-students'].get;
    assert.deepEqual(operation['x-roles'], ['ADMIN', 'OJT_COORD']);
    assert.deepEqual(operation.tags, ['Phòng QHDN']);
    assert.equal(operation.requestBody, undefined);
    assert.equal(operation.parameters.find(x => x.name === 'ojtSemesterId').required, true);
    assert.equal(operation.responses[200].content['application/json'].schema.properties.data.properties.items.items.properties.eligibilityAtHandoff.properties.validity.enum[0], 'AT_HANDOFF');
  });
});
