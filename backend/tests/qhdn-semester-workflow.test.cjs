const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ExcelJS = require('exceljs');
const { PGlite } = require('@electric-sql/pglite');
const loadSource = require('./helpers/load-source.cjs');

test('QHDN semester settings and publish-on-import use existing tables atomically', async t => {
  const db = new PGlite();
  t.after(() => db.close());
  // Isolated fixture only. Never execute the reset script or connect to the user's DB.
  await db.exec(`
    CREATE TABLE "Roles"("RoleID" serial PRIMARY KEY,"RoleCode" text UNIQUE);
    CREATE TABLE "Users"("UserID" serial PRIMARY KEY,"Username" text UNIQUE,"Email" text UNIQUE,"FullName" text,"Phone" text,"PasswordHash" text,"RoleID" int REFERENCES "Roles","Status" text DEFAULT 'ACTIVE',"MustChangePassword" bool DEFAULT false,"TemporaryPasswordExpiresAt" timestamptz);
    CREATE TABLE "AcademicPeriods"("AcademicPeriodID" int PRIMARY KEY,"Kind" text,"PeriodCode" text,"Name" text,"StartDate" date,"EndDate" date);
    CREATE TABLE "OJTSemesters"("OJTSemesterID" int PRIMARY KEY,"AcademicPeriodID" int REFERENCES "AcademicPeriods","AcademicYearID" int,"SemesterCode" text,"Name" text,"Status" text,"RegEndDate" date,"StartDate" date,"EndDate" date);
    CREATE TABLE "TrainingPrograms"("ProgramID" int PRIMARY KEY,"ProgramCode" text,"ProgramName" text,"SpecializationID" int,"Status" text);
    CREATE TABLE "Students"("StudentID" int PRIMARY KEY,"UserID" int REFERENCES "Users","StudentCode" text,"ProgramID" int REFERENCES "TrainingPrograms","Status" text,"DeletedAt" timestamptz);
    CREATE TABLE "StudentAcademicPlacements"("StudentID" int PRIMARY KEY,"CohortID" int,"GroupCode" text);
    CREATE TABLE "OJTRegistrationWindows"("WindowID" serial PRIMARY KEY,"OJTSemesterID" int REFERENCES "OJTSemesters","AcademicPeriodID" int REFERENCES "AcademicPeriods","RequiredRelativeSemester" int CHECK("RequiredRelativeSemester"=6),"Name" varchar(150),"Scope" jsonb NOT NULL CHECK(jsonb_typeof("Scope")='object'),"StartsAt" timestamptz NOT NULL,"EndsAt" timestamptz NOT NULL CHECK("EndsAt">"StartsAt"),"Status" text DEFAULT 'DRAFT' CHECK("Status" IN('DRAFT','OPEN','CLOSED')),"CreatedBy" int REFERENCES "Users","CreatedAt" timestamptz DEFAULT now(),"UpdatedAt" timestamptz DEFAULT now(),"OpenedBy" int,"OpenedAt" timestamptz,"ClosedBy" int,"ClosedAt" timestamptz,UNIQUE("WindowID","OJTSemesterID"));
    CREATE TABLE "EligibleStudentHandoffs"("HandoffID" serial PRIMARY KEY,"CreatedAt" timestamptz DEFAULT now(),"CreatedBy" int);
    CREATE TABLE "EligibleStudentHandoffItems"("HandoffID" int,"StudentID" int,"OJTSemesterID" int,"CheckID" int);
    CREATE TABLE "OJTRegistrations"("RegistrationID" serial PRIMARY KEY,"StudentID" int,"OJTSemesterID" int,"WindowID" int,"ProgramID" int,"Application" jsonb,"Status" text,"SubmittedBy" int,"RegisteredAt" timestamptz DEFAULT now(),"UpdatedAt" timestamptz DEFAULT now(),"ReviewCheckID" int,"ReviewedBy" int,"ReviewedAt" timestamptz,"ReviewReason" text,"PathwaySnapshot" jsonb,UNIQUE("StudentID","OJTSemesterID"),FOREIGN KEY("WindowID","OJTSemesterID") REFERENCES "OJTRegistrationWindows"("WindowID","OJTSemesterID"));
    CREATE TABLE "OJTRegistrationEvents"("EventID" serial PRIMARY KEY,"RegistrationID" int,"Action" text,"Snapshot" jsonb,"CreatedBy" int,"Reason" text,"IdempotencyKey" text,"RequestHash" text);
    CREATE TABLE "StudentEnterpriseCoordination"("RegistrationID" int);
    CREATE TABLE "AuditLogs"("LogID" serial PRIMARY KEY,"UserID" int,"Action" text,"EntityType" text,"EntityID" int,"Detail" text);
    CREATE TABLE "RecruitmentWindows"("WindowID" serial PRIMARY KEY);
    CREATE TABLE "Enterprises"("EnterpriseID" serial PRIMARY KEY,"EnterpriseCode" text UNIQUE,"Name" text,"Address" text,"ContactEmail" text,"ContactPersonName" text,"Status" text,"DeletedAt" timestamptz);
    CREATE TABLE "EnterpriseUsers"("UserID" int UNIQUE REFERENCES "Users","EnterpriseID" int REFERENCES "Enterprises","PositionTitle" text);
    CREATE TABLE "InternshipPositions"("PositionID" serial PRIMARY KEY,"EnterpriseID" int REFERENCES "Enterprises","OJTSemesterID" int REFERENCES "OJTSemesters","RecruitmentCode" text,"Title" text,"Description" text,"Requirements" text,"Capacity" int,"RemainingSlots" int,"Status" text,"ArchivedAt" timestamptz,UNIQUE("EnterpriseID","OJTSemesterID","RecruitmentCode"),UNIQUE("PositionID","EnterpriseID","OJTSemesterID"));
    CREATE TABLE "RecruitmentPosts"("PostID" serial PRIMARY KEY,"EnterpriseID" int REFERENCES "Enterprises","OJTSemesterID" int REFERENCES "OJTSemesters","WindowID" int REFERENCES "RecruitmentWindows","Title" text,"Content" text,"Status" text,"CreatedBy" int REFERENCES "Users","PublishedAt" timestamptz,"DeadlineAt" timestamptz,"ReviewedBy" int,"ReviewedAt" timestamptz,CHECK("Status"<>'PUBLISHED' OR "PublishedAt" IS NOT NULL),CHECK("DeadlineAt" IS NULL OR "PublishedAt" IS NULL OR "DeadlineAt">="PublishedAt"),UNIQUE("PostID","EnterpriseID","OJTSemesterID"));
    CREATE TABLE "RecruitmentPostPositions"("PostID" int,"PositionID" int,"EnterpriseID" int,"OJTSemesterID" int,PRIMARY KEY("PostID","PositionID"),FOREIGN KEY("PostID","EnterpriseID","OJTSemesterID") REFERENCES "RecruitmentPosts"("PostID","EnterpriseID","OJTSemesterID"),FOREIGN KEY("PositionID","EnterpriseID","OJTSemesterID") REFERENCES "InternshipPositions"("PositionID","EnterpriseID","OJTSemesterID"));
    CREATE TABLE "AccountImportBatches"("BatchID" serial PRIMARY KEY,"IdempotencyKey" text UNIQUE,"PayloadHash" text,"Kind" text,"OJTSemesterID" int REFERENCES "OJTSemesters","ImportedBy" int,"Summary" jsonb,"RecruitmentWindowID" int REFERENCES "RecruitmentWindows");
    CREATE TABLE "AccountImportRows"("BatchID" int REFERENCES "AccountImportBatches","RowNumber" int,"SourceCode" text,"UserID" int,"Action" text);
    CREATE TABLE "EmailOutbox"("EmailID" serial PRIMARY KEY,"UserID" int REFERENCES "Users","Recipient" text,"EncryptedPayload" text,"ExpiresAt" timestamptz);
    ALTER TABLE "RecruitmentPosts" ADD COLUMN "RetentionSemesterID" int REFERENCES "OJTSemesters", ADD COLUMN "ArchivedAt" timestamptz, ADD COLUMN "UpdatedAt" timestamptz;
    ALTER TABLE "AccountImportBatches" ADD COLUMN "CreatedAt" timestamptz NOT NULL DEFAULT now();
    CREATE UNIQUE INDEX "UQ_EnterpriseImport_Semester" ON "AccountImportBatches"("OJTSemesterID") WHERE "Kind"='ENTERPRISE';
    CREATE TABLE "OJTMatchingProfiles"("PositionID" int REFERENCES "InternshipPositions","OJTSemesterID" int,"Status" text,"UpdatedAt" timestamptz);
    CREATE TABLE "RecruitmentArchiveRuns"("ArchivedCount" int);
    CREATE TABLE "InternshipAssignments"("AssignmentID" int PRIMARY KEY,"PositionID" int REFERENCES "InternshipPositions");
    CREATE TABLE "InternshipEvaluations"("AssignmentID" int REFERENCES "InternshipAssignments","OverallScore" numeric);
    CREATE TABLE "OJTResults"("AssignmentID" int REFERENCES "InternshipAssignments","OfficialScore" numeric);
    INSERT INTO "Roles"("RoleCode") VALUES('OJT_COORD'),('ADMIN'),('STUDENT'),('ENTERPRISE'),('ACADEMIC');
    INSERT INTO "Users"("Username","Email","FullName","RoleID") VALUES('coord','coord@fixture.test','Coord',1),('admin','admin@fixture.test','Admin',2),('student','student@fixture.test','Student',3);
    INSERT INTO "TrainingPrograms" VALUES(1,'IS','IS',1,'PUBLISHED');
    INSERT INTO "Students" VALUES(1,3,'SV1',1,'ACTIVE',NULL);
    INSERT INTO "StudentAcademicPlacements" VALUES(1,1,'A');
    INSERT INTO "AcademicPeriods" SELECT n,'SEMESTER','TERM'||n,'Term '||n,current_date-1,current_date+90 FROM generate_series(1,4) n;
    INSERT INTO "OJTSemesters" SELECT n,n,1,'OJT'||n,'OJT '||n,'PLANNED',current_date+30,current_date,current_date+90 FROM generate_series(1,4) n;
    INSERT INTO "EligibleStudentHandoffs"("CreatedBy") VALUES(2);
    INSERT INTO "EligibleStudentHandoffItems" VALUES(1,1,1,1);
  `);
  const resetScript = fs.readFileSync(path.resolve(__dirname, '../DB'), 'utf8');
  const fixedGuard = resetScript.match(/CREATE OR REPLACE FUNCTION "GuardFixedOJTSemester6"\(\) RETURNS trigger[\s\S]*?END \$fixed\$;/)[0];
  await db.exec(fixedGuard + '\nCREATE TRIGGER "TR_FixedOJT_Window" BEFORE INSERT OR UPDATE ON "OJTRegistrationWindows" FOR EACH ROW EXECUTE FUNCTION "GuardFixedOJTSemester6"();');
  let injectFailure = false;
  const query = async (sql, args) => {
    if (injectFailure && sql.includes('INSERT INTO "InternshipPositions"') && args[3] === 'FAIL_FIXTURE') throw new Error('Injected persistence failure');
    const result = await db.query(sql, args);
    return { ...result, rowCount: result.affectedRows || result.rows.length };
  };
  let queue = Promise.resolve();
  const pool = { connect: async () => {
    const prior = queue; let release;
    queue = new Promise(resolve => { release = resolve; }); await prior;
    return { query, release };
  } };
  const repository = loadSource('src/modules/academic/academic.repository.ts', {
    '../../config/database': { pool, query }, '../../shared/list-context': { enrichListRows: async (_client, rows) => rows },
  });
  const windows = loadSource('src/modules/ojt-registration/window.service.ts', {
    '../academic/academic.repository': repository, '../../shared/list-context': { enrichListRows: async (_client, rows) => rows },
  });
  const settings = loadSource('src/modules/qhdn/registration-settings.service.ts', {
    '../academic/academic.repository': repository, '../ojt-registration/window.service': windows,
  }).saveRegistrationSettings;
  const effectiveStatus = loadSource('src/modules/qhdn/registration-settings.service.ts', {
    '../academic/academic.repository': repository, '../ojt-registration/window.service': windows,
  }).effectiveRegistrationStatus;
  const registrations = loadSource('src/modules/ojt-registration/registration.service.ts', {
    '../academic/academic.repository': repository, './window.service': windows,
    '../academic/workflow-policy': { assertOjtSemesterSix: async () => ({ relativeSemester: 6 }) },
    '../qhdn/read.repository': {}, '../../shared/detail-pagination': {}, '../../shared/list-context': {},
    '../students/cv.service': { currentCVSql: () => 'NULL' }, '../eligibility/eligibility.service': {},
    '../qhdn/recruitment-readiness': { hasSemesterRecruitment: async () => true },
  });
  const importer = loadSource('src/modules/qhdn/enterprise-import.service.ts', { '../../config/database': { pool } }).importEnterprises;
  const coord = { userId: 1, roleCode: 'OJT_COORD' }, student = { userId: 3, roleCode: 'STUDENT' };
  const startsAt = new Date(Date.now() - 3600000).toISOString(), endsAt = new Date(Date.now() + 3600000).toISOString();
  const count = async table => (await query(`SELECT count(*)::int AS n FROM "${table}"`)).rows[0].n;
  let window;

  await t.test('all effective statuses are derived without changing stored statuses', () => {
    const now = new Date(), past = new Date(now.getTime() - 1000).toISOString(), future = new Date(now.getTime() + 1000).toISOString();
    assert.equal(effectiveStatus({ status: 'DRAFT' }, now), 'DRAFT');
    assert.equal(effectiveStatus({ status: 'CLOSED' }, now), 'CLOSED');
    assert.equal(effectiveStatus({ status: 'OPEN', startsAt: future, endsAt: future }, now), 'SCHEDULED');
    assert.equal(effectiveStatus({ status: 'OPEN', startsAt: past, endsAt: future }, now), 'OPEN');
    assert.equal(effectiveStatus({ status: 'OPEN', startsAt: past, endsAt: past }, now), 'EXPIRED');
  });

  await t.test('merged settings require QHDN and handoff, create once, and submit no student registrations', async () => {
    for (const roleCode of ['ADMIN', 'ACADEMIC', 'ENTERPRISE', 'STUDENT']) await assert.rejects(settings(1, { startsAt, endsAt, reason: 'Fixture' }, { userId: 2, roleCode }), error => error.statusCode === 403);
    await assert.rejects(settings(4, { startsAt, endsAt, reason: 'Fixture' }, coord), error => error.errorCode === 'HANDOFF_ROSTER_EMPTY');
    assert.equal(await count('OJTRegistrationWindows'), 0);
    const results = await Promise.all([settings(1, { startsAt, endsAt, reason: 'Open' }, coord), settings(1, { startsAt, endsAt, reason: 'Open again' }, coord)]);
    window = results[0];
    assert.equal(results[1].id, window.id);
    assert.equal(results[1].replayed, true);
    assert.equal(await count('OJTRegistrationWindows'), 1);
    assert.equal(await count('OJTRegistrations'), 0);
    assert.equal(window.status, 'OPEN'); assert.equal(window.effectiveStatus, 'OPEN');
  });
  await t.test('Student still submits only while registration is open; close, extension and reopen retain its ID', async () => {
    await settings(1, { status: 'CLOSED', reason: 'Close' }, coord);
    await assert.rejects(registrations.submit({ windowId: window.id }, student), error => error.errorCode === 'OJT_REGISTRATION_WINDOW_UNAVAILABLE');
    const reopened = await settings(1, { status: 'OPEN', endsAt: new Date(Date.now() + 7200000).toISOString(), reason: 'Reopen and extend' }, coord);
    assert.equal(reopened.id, window.id);
    assert.ok(reopened.openedAt); assert.ok(reopened.closedAt);
    const submitted = await registrations.submit({ windowId: window.id }, student);
    assert.equal(submitted.studentId, 1); assert.equal(submitted.status, 'SUBMITTED');
    await assert.rejects(registrations.submit({ windowId: window.id, studentId: 2 }, student), error => error.statusCode === 403);
    assert.equal(await count('OJTRegistrations'), 1);
    await assert.rejects(settings(1, { startsAt: new Date(Date.now() - 7200000).toISOString(), reason: 'Change start' }, coord), error => error.errorCode === 'REGISTRATION_WINDOW_SCOPE_LOCKED');
    await assert.rejects(settings(1, { endsAt, reason: 'Shorten' }, coord), error => error.errorCode === 'REGISTRATION_DEADLINE_NOT_EXTENDED');
    await assert.rejects(settings(1, { status: 'DRAFT', reason: 'Reset' }, coord), error => error.errorCode === 'REGISTRATION_WINDOW_SCOPE_LOCKED');
  });
  await t.test('draft/scheduled/expired input and ambiguous legacy windows are handled without rewriting history', async () => {
    const futureStart = new Date(Date.now() + 3600000).toISOString(), futureEnd = new Date(Date.now() + 10800000).toISOString();
    const draft = await settings(2, { startsAt: futureStart, endsAt: futureEnd, status: 'DRAFT', reason: 'Save' }, coord);
    await query('INSERT INTO "EligibleStudentHandoffItems" VALUES(1,1,2,1)');
    const scheduled = await settings(2, { status: 'OPEN', reason: 'Schedule' }, coord);
    assert.equal(scheduled.id, draft.id); assert.equal(scheduled.effectiveStatus, 'SCHEDULED');
    await assert.rejects(registrations.submit({ windowId: draft.id }, student), error => error.errorCode === 'OJT_REGISTRATION_WINDOW_UNAVAILABLE');
    await assert.rejects(settings(4, { startsAt, endsAt: new Date(Date.now() - 1000).toISOString(), reason: 'Expired' }, coord), error => error.errorCode === 'REGISTRATION_WINDOW_EXPIRED');
    await query(`INSERT INTO "OJTRegistrationWindows"("OJTSemesterID","AcademicPeriodID","RequiredRelativeSemester","Name","Scope","StartsAt","EndsAt","CreatedBy") VALUES(2,2,6,'Legacy','{}',$1,$2,2)`, [startsAt, endsAt]);
    await assert.rejects(settings(2, { status: 'CLOSED', reason: 'Ambiguous' }, coord), error => error.errorCode === 'REGISTRATION_SETTINGS_AMBIGUOUS');
    assert.equal(await count('OJTRegistrationWindows'), 3);
  });

  const row = { code: 'DN1', email: 'enterprise@fixture.test', fullName: 'HR', name: 'Enterprise', positions: [{ code: 'DEV', title: 'Intern', description: 'Description', requirements: 'Requirements', capacity: 3 }] };
  const payload = (key, semester = 3, rows = [row]) => ({ kind: 'ENTERPRISE', ojtSemesterId: semester, idempotencyKey: key, rows });
  const oldKey = process.env.EMAIL_OUTBOX_KEY, oldUrl = process.env.FRONTEND_LOGIN_URL;
  process.env.EMAIL_OUTBOX_KEY = 'ab'.repeat(32); process.env.FRONTEND_LOGIN_URL = 'https://fixture.test/login';
  t.after(() => { if (oldKey === undefined) delete process.env.EMAIL_OUTBOX_KEY; else process.env.EMAIL_OUTBOX_KEY = oldKey; if (oldUrl === undefined) delete process.env.FRONTEND_LOGIN_URL; else process.env.FRONTEND_LOGIN_URL = oldUrl; });
  await t.test('preview writes nothing; commit publishes positions and posts without recruitment windows', async () => {
    const before = await count('Users');
    const preview = await importer(payload('import-1'), 1, true);
    assert.equal(preview.positionCount, 1); assert.equal(await count('Users'), before);
    assert.equal(await count('AccountImportBatches'), 0); assert.equal(await count('EmailOutbox'), 0);
    const committed = await importer(payload('import-1'), 1);
    assert.equal(committed.publicationStatus, 'PUBLISHED');
    assert.equal(committed.retentionMonths, 5);
    const expiry = (await query(`SELECT (("CreatedAt" AT TIME ZONE 'Asia/Ho_Chi_Minh')+interval '5 months') AT TIME ZONE 'Asia/Ho_Chi_Minh' AS expiry FROM "AccountImportBatches"`)).rows[0].expiry;
    assert.equal(committed.expiresAt, new Date(expiry).toISOString());
    assert.equal(committed.rows[0].accountStatus, 'CREATED');
    assert.equal(committed.rows[0].positions[0].capacity, 3);
    assert.ok(committed.rows[0].positions[0].positionId);
    assert.equal((await query('SELECT "Status" FROM "InternshipPositions"')).rows[0].Status, 'OPEN');
    const post = (await query('SELECT * FROM "RecruitmentPosts"')).rows[0];
    assert.equal(post.Status, 'PUBLISHED'); assert.ok(post.PublishedAt); assert.equal(post.WindowID, null); assert.equal(post.OJTSemesterID, 3);
    assert.equal(await count('RecruitmentWindows'), 0);
    assert.equal((await query('SELECT "RecruitmentWindowID" FROM "AccountImportBatches"')).rows[0].RecruitmentWindowID, null);
    assert.equal(await count('EmailOutbox'), 1);
  });
  await t.test('replay, semester-scoped identity, duplicate codes and unauthorized actors preserve existing accounts', async () => {
    const before = await count('Users'), password = (await query(`SELECT "PasswordHash" FROM "Users" WHERE "Email"=$1`, [row.email])).rows[0].PasswordHash;
    assert.equal((await importer(payload('import-1'), 1)).replayed, true);
    assert.equal(await count('InternshipPositions'), 1);
    await assert.rejects(importer(payload('import-1', 1), 1), error => error.errorCode === 'IDEMPOTENCY_CONFLICT');
    await assert.rejects(importer(payload('duplicate'), 1), error => error.errorCode === 'RECRUITMENT_CODE_EXISTS');
    await assert.rejects(importer(payload('different-position', 3, [{ ...row, positions: [{ ...row.positions[0], code: 'OTHER' }] }]), 1), error => error.errorCode === 'SEMESTER_ALREADY_IMPORTED');
    await assert.rejects(importer(payload('admin'), 2), error => error.statusCode === 403);
    const next = await importer(payload('next-semester', 1), 1);
    assert.equal(next.rows[0].accountStatus, 'REUSED');
    assert.equal(next.rows[0].recruitmentStatus, 'POSITIONS_ADDED');
    assert.equal(await count('Users'), before); assert.equal(await count('EmailOutbox'), 1);
    assert.equal((await query(`SELECT "PasswordHash" FROM "Users" WHERE "Email"=$1`, [row.email])).rows[0].PasswordHash, password);
    assert.equal(await count('InternshipPositions'), 2);
  });
  await t.test('a failure after partial writes rolls back the entire import', async () => {
    const before = await count('InternshipPositions'), batches = await count('AccountImportBatches');
    injectFailure = true;
    try {
      await assert.rejects(importer(payload('rollback', 4, [{ ...row, positions: [{ ...row.positions[0], code: 'OK2' }, { ...row.positions[0], code: 'BAD2', title: 'FAIL_FIXTURE' }] }]), 1), /Injected persistence failure/);
    } finally { injectFailure = false; }
    assert.equal(await count('InternshipPositions'), before); assert.equal(await count('AccountImportBatches'), batches);
  });
  await t.test('registration extension follows QHDN import deadlines but preserves Admin edits and closures', async () => {
    const post = (await query('SELECT * FROM "RecruitmentPosts" WHERE "OJTSemesterID"=1')).rows[0];
    const expired = new Date(Date.now() - 1000).toISOString();
    await query('UPDATE "RecruitmentPosts" SET "Status"=\'CLOSED\',"DeadlineAt"=$2::timestamptz,"PublishedAt"=$2::timestamptz-interval \'1 hour\',"ReviewedAt"=$2::timestamptz-interval \'1 hour\' WHERE "PostID"=$1', [post.PostID, expired]);
    await query(`UPDATE "AccountImportBatches" SET "Summary"=jsonb_set("Summary",'{deadlineAt}',to_jsonb($1::timestamptz)) WHERE "OJTSemesterID"=1`, [expired]);
    const extendedEnd = new Date(Date.now() + 18000000).toISOString();
    await settings(1, { endsAt: extendedEnd, status: 'OPEN', reason: 'Extend recruitment' }, coord);
    const reopenedPost = (await query('SELECT * FROM "RecruitmentPosts" WHERE "PostID"=$1', [post.PostID])).rows[0];
    assert.equal(reopenedPost.Status, 'PUBLISHED'); assert.equal(new Date(reopenedPost.DeadlineAt).toISOString(), extendedEnd);
    await query('UPDATE "RecruitmentPosts" SET "Status"=\'CLOSED\',"ReviewedBy"=2 WHERE "PostID"=$1', [post.PostID]);
    await query('INSERT INTO "AuditLogs"("UserID","Action","EntityType","EntityID","Detail") VALUES(2,\'CLOSE\',\'RecruitmentPosts\',$1,\'{}\')', [post.PostID]);
    await settings(1, { endsAt: new Date(Date.now() + 21600000).toISOString(), status: 'OPEN', reason: 'Respect Admin close' }, coord);
    const adminClosedPost = (await query('SELECT * FROM "RecruitmentPosts" WHERE "PostID"=$1', [post.PostID])).rows[0];
    assert.equal(adminClosedPost.Status, 'CLOSED'); assert.equal(new Date(adminClosedPost.DeadlineAt).toISOString(), extendedEnd);
  });
  await t.test('semester deadlines and extensions cannot exceed the five-month import lifetime', async () => {
    await query('INSERT INTO "EligibleStudentHandoffItems" VALUES(1,1,3,1)');
    const farFuture = new Date(Date.now() + 366 * 86400000).toISOString();
    await settings(3, { startsAt, endsAt: farFuture, reason: 'Long registration' }, coord);
    const batch = (await query('SELECT "Summary" FROM "AccountImportBatches" WHERE "OJTSemesterID"=3')).rows[0].Summary;
    const post = (await query('SELECT "DeadlineAt" FROM "RecruitmentPosts" WHERE "OJTSemesterID"=3')).rows[0];
    assert.equal(new Date(post.DeadlineAt).toISOString(), batch.expiresAt);
    await query('UPDATE "OJTSemesters" SET "RegEndDate"=current_date+365 WHERE "OJTSemesterID"=4');
    const preview = await importer(payload('long-preview', 4), 1, true);
    assert.equal(preview.deadlineAt, preview.expiresAt);
    assert.equal(await count('AccountImportBatches'), 2);
  });
  await t.test('five-month archive preserves accounts, evaluations, official scores and legacy retention', async () => {
    const archive = loadSource('src/jobs/provisioning.ts', {
      '../config/database': { pool, query },
      '../modules/academic-reporting/notification.service': {}, '../modules/ojt-results/completion-notification.service': {},
    }).archiveRecruitment;
    const users = await count('Users');
    const positions = (await query('SELECT * FROM "InternshipPositions" ORDER BY "OJTSemesterID"')).rows;
    const old = positions[0], fresh = positions[1];
    await query('INSERT INTO "InternshipAssignments" VALUES(1,$1)', [old.PositionID]);
    await query('INSERT INTO "InternshipEvaluations" VALUES(1,8.5)');
    await query('INSERT INTO "OJTResults" VALUES(1,8.5)');
    // The legacy policy would expire both imported posts early; only the older
    // import may archive under the new policy, irrespective of semester dates.
    await query('UPDATE "OJTSemesters" SET "EndDate"=current_date-1 WHERE "OJTSemesterID"=4');
    await query('UPDATE "RecruitmentPosts" SET "RetentionSemesterID"=4');
    await query(`UPDATE "AccountImportBatches" SET "CreatedAt"=now()-interval '6 months' WHERE "OJTSemesterID"=1`);
    const legacy = (await query(`INSERT INTO "RecruitmentPosts"("EnterpriseID","OJTSemesterID","Title","Status","RetentionSemesterID") VALUES($1,3,'Legacy','CLOSED',4) RETURNING "PostID"`, [old.EnterpriseID])).rows[0].PostID;
    await query('INSERT INTO "OJTMatchingProfiles" VALUES($1,3,\'ACTIVE\',NULL)', [fresh.PositionID]);
    assert.equal(await archive(), 2);
    const statuses = (await query('SELECT "PositionID","Status" FROM "InternshipPositions"')).rows;
    assert.equal(statuses.find(p => p.PositionID === old.PositionID).Status, 'ARCHIVED');
    assert.equal(statuses.find(p => p.PositionID === fresh.PositionID).Status, 'OPEN');
    assert.equal((await query('SELECT "Status" FROM "RecruitmentPosts" WHERE "PostID"=$1', [legacy])).rows[0].Status, 'ARCHIVED');
    assert.equal((await query('SELECT "Status" FROM "OJTMatchingProfiles"')).rows[0].Status, 'ACTIVE');
    assert.equal(await count('Users'), users);
    assert.equal(Number((await query('SELECT "OverallScore" FROM "InternshipEvaluations"')).rows[0].OverallScore), 8.5);
    assert.equal(Number((await query('SELECT "OfficialScore" FROM "OJTResults"')).rows[0].OfficialScore), 8.5);
    const replay = await importer(payload('next-semester', 1), 1);
    assert.equal(replay.publicationStatus, 'ARCHIVED');
    assert.equal(replay.rows[0].positions[0].status, 'ARCHIVED');
    assert.equal(await archive(), 0);
  });
});

test('QHDN Excel/CSV normalization groups positions and rejects mismatched semester and duplicate position codes', async () => {
  const { enterpriseImportInput } = loadSource('src/modules/qhdn/enterprise-import-input.ts');
  const workbook = new ExcelJS.Workbook(), sheet = workbook.addWorksheet('EnterpriseImport');
  sheet.addRow(['code', 'email', 'fullName', 'name', 'address', 'positionCode', 'title', 'description', 'requirements', 'capacity', 'dataNotes']);
  sheet.addRow(['DN1', 'hr@fixture.test', 'HR', 'Company', '', 'DEV1', 'Developer', 'Description', 'Requirements', 2, 'Ignored source note']);
  sheet.addRow(['DN1', 'hr@fixture.test', 'HR', 'Company', '', 'QA1', 'Tester', 'Description', 'Requirements', 4, 'Ignored source note']);
  const body = { kind: 'ENTERPRISE', ojtSemesterId: '1', idempotencyKey: 'spreadsheet' };
  const input = await enterpriseImportInput(body, { originalname: 'fixture.xlsx', buffer: Buffer.from(await workbook.xlsx.writeBuffer()) });
  assert.equal(input.rows.length, 1); assert.equal(input.rows[0].positions.length, 2); assert.equal(input.rows[0].address, undefined);
  const csv = await workbook.csv.writeBuffer();
  assert.equal((await enterpriseImportInput(body, { originalname: 'fixture.csv', buffer: Buffer.from(csv) })).rows[0].positions[1].capacity, 4);
  await assert.rejects(enterpriseImportInput({ ...body, semesterId: 2, rows: [] }), /Conflicting semester/);
  await assert.rejects(enterpriseImportInput({ ...body, windowId: 1, rows: [] }), /windowId/);
  const base = { code: 'DN1', email: 'hr@fixture.test', fullName: 'HR', name: 'Company', positionCode: 'DEV', title: 'Developer', description: 'Description', requirements: 'Requirements', capacity: 2 };
  await assert.rejects(enterpriseImportInput({ ...body, rows: [base, base] }), /Duplicate position code/);
  const normalized = await enterpriseImportInput({ ...body, rows: [
    { ...base, address: null, sourceUrl: 'https://unused.invalid', notes: 'ignored' },
    { ...base, positionCode: 'QA', address: '  Address  ', capacity: '4' },
  ] });
  assert.equal(normalized.rows[0].address, 'Address');
  assert.equal(normalized.rows[0].positions[1].capacity, 4);
  assert.equal(normalized.rows[0].sourceUrl, undefined);
  const nested = await enterpriseImportInput({ ...body, rows: [{ ...base, address: ' ', positions: [{ code: ' dev ', title: ' Title ', description: ' Description ', requirements: ' Requirements ', capacity: '2' }] }] });
  assert.deepEqual(nested.rows[0].positions[0], { code: 'DEV', title: 'Title', description: 'Description', requirements: 'Requirements', capacity: 2 });
  await assert.rejects(enterpriseImportInput({ ...body, rows: [{ ...base, requirements: null }] }), /requirements/);
});

test('QHDN import documentation does not modify academic/student import contracts', () => {
  const spec = { paths: {
    '/api/imports/preview': { post: {} }, '/api/imports/commit': { post: {} },
    '/api/student-imports': { post: { 'x-roles': ['ADMIN', 'ACADEMIC'], requestBody: { marker: 'keep' } } },
  } };
  const original = structuredClone(spec.paths['/api/student-imports']);
  loadSource('src/config/swagger-qhdn-import.ts').describeQhdnImport(spec);
  assert.deepEqual(spec.paths['/api/student-imports'], original);
  assert.deepEqual(spec.paths['/api/imports/commit'].post['x-roles'], ['OJT_COORD']);
  assert.ok(spec.paths['/api/imports/preview'].post.requestBody.content['multipart/form-data']);
  const response = spec.paths['/api/imports/commit'].post.responses['200'].content['application/json'].schema;
  assert.deepEqual(response.properties.retentionMonths.enum, [5]);
  assert.deepEqual(response.properties.rows.items.properties.accountStatus.enum, ['CREATED', 'REUSED']);
});
