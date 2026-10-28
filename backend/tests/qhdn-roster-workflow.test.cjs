const assert = require('node:assert/strict');
const test = require('node:test');
const { PGlite } = require('@electric-sql/pglite');
const load = require('./helpers/load-source.cjs');

test('QHDN separates handoff and dossier progress; student submits a company selection atomically', async t => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    CREATE TABLE "Users"("UserID" int PRIMARY KEY,"FullName" text,"Email" text,"Phone" text,"Status" text);
    CREATE TABLE "Students"("StudentID" int PRIMARY KEY,"UserID" int,"StudentCode" text,"ProgramID" int,"Status" text,"DeletedAt" timestamptz);
    CREATE TABLE "TrainingPrograms"("ProgramID" int PRIMARY KEY,"ProgramCode" text,"ProgramName" text,"SpecializationID" int,"Status" text);
    CREATE TABLE "Cohorts"("CohortID" int PRIMARY KEY,"Name" text);
    CREATE TABLE "StudentAcademicPlacements"("StudentID" int PRIMARY KEY,"CohortID" int,"GroupCode" text,"EntryAcademicPeriodID" int);
    CREATE TABLE "AcademicPeriods"("AcademicPeriodID" int PRIMARY KEY,"PeriodCode" text,"Name" text,"Kind" text,"StartDate" date,"EndDate" date);
    CREATE TABLE "OJTSemesters"("OJTSemesterID" int PRIMARY KEY,"SemesterCode" text,"Name" text,"AcademicPeriodID" int,"AcademicYearID" int,"StartDate" date,"EndDate" date,"Status" text);
    CREATE TABLE "OJTRegistrationWindows"("WindowID" int PRIMARY KEY,"OJTSemesterID" int,"AcademicPeriodID" int,"RequiredRelativeSemester" int,"Name" text,"Scope" jsonb,"Status" text,"StartsAt" timestamptz,"EndsAt" timestamptz);
    CREATE TABLE "EligibleStudentHandoffs"("HandoffID" int PRIMARY KEY,"OJTSemesterID" int,"RecipientRole" text,"CreatedAt" timestamptz DEFAULT now(),"CreatedBy" int,"Reason" text);
    CREATE TABLE "EligibleStudentHandoffItems"("HandoffID" int,"StudentID" int,"OJTSemesterID" int,"CheckID" int);
    CREATE TABLE "EligibilityChecks"("CheckID" int PRIMARY KEY,"StudentID" int,"OJTSemesterID" int,"Status" text,"CheckedAt" timestamptz DEFAULT now(),"RuleSetID" int,"Result" jsonb DEFAULT '{}');
    CREATE TABLE "EligibilityConfirmations"("CheckID" int PRIMARY KEY,"ConfirmedBy" int,"ConfirmedAt" timestamptz DEFAULT now());
    CREATE TABLE "OJTRegistrations"("RegistrationID" serial PRIMARY KEY,"StudentID" int,"OJTSemesterID" int,"WindowID" int,"ProgramID" int,"Status" text,"Application" jsonb DEFAULT '{}',"SubmittedBy" int,"RegisteredAt" timestamptz DEFAULT now(),"UpdatedAt" timestamptz,"PathwaySnapshot" jsonb,"ReviewCheckID" int,"ReviewedBy" int,"ReviewedAt" timestamptz,"ReviewReason" text,UNIQUE("StudentID","OJTSemesterID"));
    CREATE TABLE "OJTRegistrationEvents"("RegistrationID" int,"Action" text,"Snapshot" jsonb,"CreatedBy" int,"Reason" text,"IdempotencyKey" text,"RequestHash" text);
    CREATE TABLE "AuditLogs"("UserID" int,"Action" text,"EntityType" text,"EntityID" int,"Detail" text);
    CREATE TABLE "Enterprises"("EnterpriseID" int PRIMARY KEY,"Name" text,"Address" text,"ContactEmail" text,"Status" text,"DeletedAt" timestamptz);
    CREATE TABLE "InternshipPositions"("PositionID" int PRIMARY KEY,"EnterpriseID" int,"OJTSemesterID" int,"RecruitmentCode" text,"Title" text,"Description" text,"Requirements" text,"Location" text,"WorkMode" text,"Capacity" int,"Status" text,"ArchivedAt" timestamptz);
    CREATE TABLE "RecruitmentPosts"("PostID" int PRIMARY KEY,"EnterpriseID" int,"OJTSemesterID" int,"Title" text,"Status" text,"DeadlineAt" timestamptz,"ArchivedAt" timestamptz);
    CREATE TABLE "RecruitmentPostPositions"("PostID" int,"PositionID" int,"EnterpriseID" int,"OJTSemesterID" int);
    CREATE TABLE "AccountImportBatches"("Kind" text,"OJTSemesterID" int);
    CREATE TABLE "StudentCVFiles"("CVFileID" int PRIMARY KEY);
    CREATE TABLE "JobApplications"("ApplicationID" serial PRIMARY KEY,"RegistrationID" int REFERENCES "OJTRegistrations","StudentID" int,"OJTSemesterID" int,"PostID" int,"PositionID" int,"EnterpriseID" int,"CVFileID" int,"OfficialCheckID" int,"CoverLetter" text,"ReviewNote" text,"Status" text DEFAULT 'SUBMITTED',"AppliedAt" timestamptz DEFAULT now(),"UpdatedAt" timestamptz,UNIQUE("RegistrationID","PostID","PositionID"));
    CREATE TABLE "StudentEnterpriseCoordination"("CoordinationID" int PRIMARY KEY,"RegistrationID" int,"ApplicationID" int,"EnterpriseID" int,"PositionID" int,"Decision" text,"RejectReason" text,"CoordinatedAt" timestamptz DEFAULT now());
    CREATE TABLE "InternshipAssignments"("AssignmentID" int PRIMARY KEY,"CoordinationID" int UNIQUE,"PositionID" int,"Status" text);
    ALTER TABLE "EligibleStudentHandoffItems" ADD COLUMN "Snapshot" jsonb DEFAULT '{}';
    ALTER TABLE "OJTRegistrationEvents" ADD COLUMN "EventID" serial PRIMARY KEY, ADD COLUMN "CreatedAt" timestamptz DEFAULT now();
    ALTER TABLE "StudentEnterpriseCoordination" ADD COLUMN "OJTSemesterID" int DEFAULT 1, ADD COLUMN "DecisionAt" timestamptz, ADD COLUMN "CoordinatedBy" int, ADD COLUMN "PreviousCoordinationID" int;
    ALTER TABLE "InternshipAssignments" ADD COLUMN "StudentID" int, ADD COLUMN "EnterpriseID" int, ADD COLUMN "StartDate" date, ADD COLUMN "EndDate" date, ADD COLUMN "EnterpriseSupervisorName" text, ADD COLUMN "AcademicSupervisorID" int;
    INSERT INTO "TrainingPrograms" VALUES(1,'IT','Information Technology',1,'PUBLISHED');
    INSERT INTO "Cohorts" VALUES(1,'Cohort');
    INSERT INTO "Users" SELECT n,'Student '||n,'sv'||n||'@fixture.test',NULL,'ACTIVE' FROM generate_series(1,7) n;
    INSERT INTO "Students" SELECT n,n,'SV'||n,1,'ACTIVE',NULL FROM generate_series(1,7) n;
    INSERT INTO "StudentAcademicPlacements" SELECT n,1,'A',1 FROM generate_series(1,7) n;
    INSERT INTO "AcademicPeriods" SELECT n,'TERM'||n,'Term '||n,'SEMESTER',current_date-1,current_date+90 FROM generate_series(1,2) n;
    INSERT INTO "OJTSemesters" SELECT n,'OJT'||n,'OJT '||n,n,1,current_date-1,current_date+90,'PLANNED' FROM generate_series(1,2) n;
    INSERT INTO "OJTRegistrationWindows" VALUES(1,1,1,6,'Registration','{}','OPEN',now()-interval '1 day',now()+interval '30 days');
    INSERT INTO "EligibleStudentHandoffs"("HandoffID","OJTSemesterID","RecipientRole","CreatedBy") VALUES(1,1,'OJT_COORD',10),(2,1,'OJT_COORD',10),(3,2,'OJT_COORD',10);
    INSERT INTO "EligibleStudentHandoffItems" VALUES(1,1,1,1),(1,2,1,2),(1,3,1,3),(2,6,1,6),(2,7,1,7),(3,5,2,5);
    INSERT INTO "EligibilityChecks"("CheckID","StudentID","OJTSemesterID","Status") SELECT n,n,CASE WHEN n=5 THEN 2 ELSE 1 END,'ELIGIBLE' FROM generate_series(1,7) n;
    INSERT INTO "EligibilityConfirmations"("CheckID","ConfirmedBy") SELECT n,10 FROM generate_series(1,7) n;
    INSERT INTO "OJTRegistrations"("RegistrationID","StudentID","OJTSemesterID","WindowID","ProgramID","Status") VALUES(20,2,1,1,1,'SUBMITTED'),(30,3,1,1,1,'APPROVED'),(60,6,1,1,1,'REJECTED'),(70,7,1,1,1,'HANDED_OFF');
    INSERT INTO "Enterprises" VALUES(1,'Company',NULL,'hr@fixture.test','ACTIVE',NULL);
    INSERT INTO "InternshipPositions" VALUES(1,1,1,'DEV','Developer','Description','Requirements',NULL,NULL,2,'OPEN',NULL),(2,1,2,'DEV','Other semester','Description','Requirements',NULL,NULL,2,'OPEN',NULL);
    INSERT INTO "RecruitmentPosts" VALUES(1,1,1,'Post','PUBLISHED',now()+interval '30 days',NULL),(2,1,2,'Other semester','PUBLISHED',now()+interval '30 days',NULL);
    INSERT INTO "RecruitmentPostPositions" VALUES(1,1,1,1),(2,2,1,2);
    INSERT INTO "JobApplications"("RegistrationID","StudentID","OJTSemesterID","PostID","PositionID","EnterpriseID") VALUES(30,3,1,1,1,1);
  `);
  const query = async (sql, args) => { const result = await db.query(sql, args); return { ...result, rowCount: result.affectedRows || result.rows.length }; };
  const pool = { connect: async () => ({ query, release() {} }) };
  const repository = load('src/modules/academic/academic.repository.ts', { '../../config/database': { pool }, '../../shared/list-context': {} });
  const readRepository = load('src/modules/qhdn/read.repository.ts', { '../../config/database': { pool } });
  const windows = load('src/modules/ojt-registration/window.service.ts', { '../academic/academic.repository': repository, '../../shared/list-context': {} });
  const ready = load('src/modules/qhdn/recruitment-readiness.ts');
  const registrations = load('src/modules/ojt-registration/registration.service.ts', {
    '../academic/academic.repository': repository, '../qhdn/read.repository': readRepository, './window.service': windows,
    '../academic/workflow-policy': { assertOjtSemesterSix: async () => ({ relativeSemester: 6 }) }, '../../shared/detail-pagination': {}, '../../shared/list-context': {},
    '../students/cv.service': { currentCVSql: () => 'NULL' }, '../eligibility/eligibility.service': { fingerprint: value => JSON.stringify(value, Object.keys(value).sort()), officialEligibilityWithClient: async () => ({ checkId: 1, status: 'ELIGIBLE', isStale: false }) },
  });
  const applications = load('src/modules/students/job-application.service.ts', {
    '../academic/academic.repository': repository, '../qhdn/read.repository': readRepository,
    '../qhdn/catalog.service': { occupied: async (c, id) => Number((await c.query('SELECT count(*) n FROM "InternshipAssignments" WHERE "PositionID"=$1', [id])).rows[0].n) },
    '../ojt-registration/registration.service': registrations, '../ojt-registration/window.service': windows,
    './cv.service': { currentCV: async () => null, cvMetadataSql: () => "'{}'::jsonb" }, '../eligibility/eligibility.service': {}, '../../shared/list-context': {},
  });
  const submit = load('src/modules/qhdn/student-submission.service.ts', {
    '../academic/academic.repository': repository, '../ojt-registration/registration.service': registrations, '../students/job-application.service': applications,
  }).submitStudentDossier;
  const eligibilityReads = [];
  const detailService = load('src/modules/qhdn/registration-progress-detail.service.ts', {
    '../eligibility/eligibility.service': { officialEligibilityWithClient: async (_c, studentId, semesterId, options) => { eligibilityReads.push({ studentId, semesterId, options }); return { status: 'ELIGIBLE', isStale: false }; } },
  });
  const progress = load('src/modules/qhdn/registration-progress.service.ts', { './read.repository': readRepository, '../ojt-registration/registration.service': registrations, './registration-progress-detail.service': detailService }).registrationProgress;
  const eligible = load('src/modules/qhdn/eligible-students.service.ts', { './read.repository': readRepository }).eligibleStudents;
  const options = load('src/modules/students/registration-options.service.ts', {
    '../qhdn/read.repository': readRepository, '../curriculum/curriculum.repository': {}, '../combo-registration/combo.repository': {}, '../combo-registration/selection.service': {},
  }).studentWindows;
  const coord = { userId: 10, roleCode: 'OJT_COORD' }, student = { userId: 1, roleCode: 'STUDENT' };
  const body = { windowId: 1, postId: 1, positionId: 1, application: { note: 'My dossier' } };
  const count = async table => Number((await query(`SELECT count(*) n FROM "${table}"`)).rows[0].n);

  await t.test('handoff and progress include both batches, pending submissions, and no unhanded students', async () => {
    const handed = await eligible({ ojtSemesterId: 1 }, coord), dossiers = await progress({ ojtSemesterId: 1 }, coord);
    assert.equal(handed.total, 5); assert.equal(dossiers.total, 5);
    assert.equal(dossiers.items.find(s => s.studentId === 1).status, 'NOT_REGISTERED');
    assert.deepEqual(dossiers.items.find(s => s.studentId === 1).registrations, []);
    assert.equal(dossiers.items.find(s => s.studentId === 2).status, 'SUBMITTED');
    assert.equal(dossiers.items.find(s => s.studentId === 3).status, 'APPROVED');
    assert.equal(dossiers.items.find(s => s.studentId === 3).canSendToEnterprise, true);
    assert.equal(dossiers.items.find(s => s.studentId === 6).status, 'REJECTED');
    assert.equal(dossiers.items.find(s => s.studentId === 7).status, 'LEGACY_REVIEW_REQUIRED');
    assert.ok(!dossiers.items.some(s => [4,5].includes(s.studentId)));
    assert.equal((await progress({ ojtSemesterId: 1, status: 'NOT_REGISTERED' }, coord)).total, 1);
    assert.equal((await progress({ ojtSemesterId: 1, status: 'APPROVED', limit: 1 }, coord)).items[0].studentId, 3);
    assert.equal((await progress({ ojtSemesterId: 1, handoffStatus: 'NOT_HANDED_OFF' }, coord)).total, 0);
    assert.equal(await count('OJTRegistrations'), 4);
    await assert.rejects(progress({}, coord), /ojtSemesterId/);
    await assert.rejects(progress({ ojtSemesterId: 1 }, student), e => e.statusCode === 403);
  });
  await t.test('no imported recruitment blocks student submission and advertises the same blocker', async () => {
    assert.equal(await ready.hasSemesterRecruitment({ query }, 1), false);
    await assert.rejects(submit(body, student), e => e.errorCode === 'RECRUITMENT_NOT_READY');
    const screen = await options('ojt', { ojtSemesterId: 1 }, student);
    assert.equal(screen.items[0].canSubmit, false);
    assert.ok(screen.items[0].blockingReasons.includes('RECRUITMENT_NOT_READY'));
    assert.equal(await count('OJTRegistrations'), 4);
    assert.equal(await count('JobApplications'), 1);
    await query('INSERT INTO "AccountImportBatches" VALUES(\'ENTERPRISE\',1)');
    assert.equal(await ready.hasSemesterRecruitment({ query }, 1), true);
    assert.equal(await ready.hasSemesterRecruitment({ query }, 2), false);
    assert.equal((await options('ojt', { ojtSemesterId: 1 }, student)).items[0].canSubmit, true);
  });
  await t.test('HTTP exposes the two roster APIs and validates the real atomic submission handler', async () => {
    const express = require('express'), app = express();
    const authenticate = (req, res, next) => {
      if (!req.headers['x-fixture-role']) return res.sendStatus(401);
      req.user = { userId: 1, roleCode: req.headers['x-fixture-role'] }; next();
    };
    const never = () => { throw new Error('Unexpected unrelated handler'); };
    const deps = { '../../middleware/authenticate': { authenticate } };
    const router = load('src/modules/qhdn/qhdn.routes.ts', {
      ...deps, './registered-students.service': { registeredStudents: progress }, './eligible-students.service': { eligibleStudents: eligible },
      './report.service': {}, './catalog.service': {}, './workflow.service': {},
    }).default;
    const registrationRouter = load('src/modules/ojt-registration/registration.routes.ts', {
      ...deps, '../students/registration-options.service': { studentWindows: options }, './window.service': windows,
      './registration.service': registrations, '../qhdn/student-submission.service': { submitStudentDossier: submit },
      './handoff.service': {}, '../qhdn/registration-settings.service': { saveRegistrationSettings: never },
    }).default;
    app.use(express.json()); app.use('/api', router, registrationRouter);
    app.use((error, _req, res, _next) => res.status(error.statusCode ?? 500).json({ errorCode: error.errorCode, message: error.message }));
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    try {
      const url = `http://127.0.0.1:${server.address().port}/api`;
      const get = (path, role = 'OJT_COORD') => fetch(url + path, { headers: { 'x-fixture-role': role } });
      const handed = await get('/qhdn/eligible-students?ojtSemesterId=1');
      assert.equal(handed.status, 200); assert.equal((await handed.json()).data.total, 5);
      const pending = await get('/qhdn/registered-students?ojtSemesterId=1&status=NOT_REGISTERED');
      assert.equal(pending.status, 200); assert.equal((await pending.json()).data.total, 1);
      assert.equal((await get('/qhdn/registered-students?ojtSemesterId=1', 'STUDENT')).status, 403);
      assert.equal((await get('/ojt-registrations')).status, 403);
      assert.equal((await get('/ojt-semesters/1/students')).status, 403);
      const submitResponse = await fetch(url + '/ojt-registrations', { method: 'POST', headers: { 'x-fixture-role': 'STUDENT', 'content-type': 'application/json' }, body: JSON.stringify({ ...body, postId: 2, positionId: 2 }) });
      assert.equal(submitResponse.status, 409); assert.equal((await submitResponse.json()).errorCode, 'POSITION_SEMESTER_MISMATCH');
      assert.equal(await count('OJTRegistrations'), 4);
    } finally { await new Promise(resolve => server.close(resolve)); }
  });
  await t.test('invalid company selection rolls back registration, events and audits', async () => {
    const before = await count('AuditLogs');
    await assert.rejects(submit({ ...body, postId: 2, positionId: 2 }, student), e => e.errorCode === 'POSITION_SEMESTER_MISMATCH');
    assert.equal(await count('OJTRegistrations'), 4);
    assert.equal(await count('JobApplications'), 1);
    assert.equal(await count('OJTRegistrationEvents'), 0);
    assert.equal(await count('AuditLogs'), before);
    await assert.rejects(submit({ windowId: 1 }, student), /postId/);
    await assert.rejects(submit(body, { userId: 4, roleCode: 'STUDENT' }), e => e.errorCode === 'ELIGIBLE_HANDOFF_REQUIRED');
  });
  await t.test('one submission creates both records, is replayable, and appears in QHDN dossier progress', async () => {
    const result = await submit(body, student);
    assert.equal(result.status, 'SUBMITTED'); assert.equal(result.jobApplication.positionId, 1);
    assert.equal(result.jobApplication.companyId, 1);
    assert.equal((await submit(body, student)).replayed, true);
    await assert.rejects(submit({ ...body, postId: 2, positionId: 2 }, student), e => e.errorCode === 'OJT_SUBMISSION_CONFLICT');
    assert.equal(await count('OJTRegistrations'), 5); assert.equal(await count('JobApplications'), 2);
    const item = (await progress({ ojtSemesterId: 1, studentId: 1 }, coord)).items[0];
    assert.equal(item.status, 'SUBMITTED'); assert.equal(item.applications[0].company.name, 'Company');
    assert.equal(item.workflowStatus, 'AWAITING_REVIEW'); assert.equal(item.canSendToEnterprise, false);
    assert.equal((await eligible({ ojtSemesterId: 1 }, coord)).total, 5);
  });
  await t.test('rejected dossier and application resubmit together without duplicating identities', async () => {
    const old = (await query('SELECT "RegistrationID","ApplicationID" FROM "JobApplications" WHERE "StudentID"=1')).rows[0];
    await query('UPDATE "OJTRegistrations" SET "Status"=\'REJECTED\' WHERE "RegistrationID"=$1', [old.RegistrationID]);
    await query('UPDATE "JobApplications" SET "Status"=\'REJECTED\' WHERE "ApplicationID"=$1', [old.ApplicationID]);
    const result = await submit({ ...body, coverLetter: 'Updated application' }, student);
    assert.equal(result.id, old.RegistrationID); assert.equal(result.status, 'SUBMITTED');
    assert.equal(result.jobApplication.id, old.ApplicationID); assert.equal(result.jobApplication.status, 'SUBMITTED');
    assert.equal(await count('OJTRegistrations'), 5); assert.equal(await count('JobApplications'), 2);
  });
  await t.test('latest enterprise decisions drive coordination states without changing dossier approval', async () => {
    await query('INSERT INTO "StudentEnterpriseCoordination"("CoordinationID","RegistrationID","EnterpriseID","PositionID","Decision") VALUES(1,30,1,1,\'PENDING\')');
    let item = (await progress({ ojtSemesterId: 1, studentId: 3 }, coord)).items[0];
    assert.equal(item.status, 'APPROVED'); assert.equal(item.workflowStatus, 'SENT_TO_ENTERPRISE');
    await query('UPDATE "StudentEnterpriseCoordination" SET "Decision"=\'REJECTED\',"RejectReason"=\'No capacity\' WHERE "CoordinationID"=1');
    item = (await progress({ ojtSemesterId: 1, coordinationStatus: 'REJECTED' }, coord)).items[0];
    assert.equal(item.canReassign, true); assert.equal(item.workflowStatus, 'NEEDS_REASSIGNMENT');
    await query('INSERT INTO "StudentEnterpriseCoordination"("CoordinationID","RegistrationID","EnterpriseID","PositionID","Decision") VALUES(2,30,1,1,\'ACCEPTED\')');
    const list = await progress({ ojtSemesterId: 1 }, coord);
    assert.equal(list.total, 5); assert.equal(list.items.filter(s => s.studentId === 3).length, 1);
    item = list.items.find(s => s.studentId === 3);
    assert.equal(item.workflowStatus, 'ENTERPRISE_ACCEPTED'); assert.equal(item.canReassign, false);
  });
  await t.test('closed, expired and full positions block submission; Admin retains on-behalf contract', async () => {
    await query('UPDATE "RecruitmentPosts" SET "DeadlineAt"=now()-interval \'1 second\' WHERE "PostID"=1');
    assert.equal(await ready.hasSemesterRecruitment({ query }, 1), false);
    await query('UPDATE "RecruitmentPosts" SET "DeadlineAt"=now()+interval \'1 day\',"Status"=\'CLOSED\' WHERE "PostID"=1');
    assert.equal(await ready.hasSemesterRecruitment({ query }, 1), false);
    await query('UPDATE "RecruitmentPosts" SET "Status"=\'PUBLISHED\' WHERE "PostID"=1');
    await query('INSERT INTO "InternshipAssignments" VALUES(1,1,1,\'ACTIVE\'),(2,2,1,\'ACTIVE\')');
    assert.equal(await ready.hasSemesterRecruitment({ query }, 1), false);
    await assert.rejects(submit({ ...body, application: {} }, { userId: 2, roleCode: 'STUDENT' }), e => e.errorCode === 'RECRUITMENT_NOT_READY');
    const admin = await submit({ windowId: 1, studentId: 6 }, { userId: 10, roleCode: 'ADMIN' });
    assert.equal(admin.status, 'SUBMITTED'); assert.equal(admin.jobApplication, undefined);
  });
  await t.test('selected-student detail retains histories and supervisors with independent pages and no writes', async () => {
    await query(`INSERT INTO "Users" VALUES(10,'Academic Advisor','advisor@fixture.test','0900000000','ACTIVE')`);
    await query(`UPDATE "StudentEnterpriseCoordination" SET "CoordinatedBy"=10,"DecisionAt"=now(),"PreviousCoordinationID"=CASE WHEN "CoordinationID"=2 THEN 1 ELSE NULL END WHERE "RegistrationID"=30`);
    await query(`UPDATE "InternshipAssignments" SET "StudentID"=3,"EnterpriseID"=1,"StartDate"=current_date,"EndDate"=current_date+90,"EnterpriseSupervisorName"='HR Supervisor',"AcademicSupervisorID"=10,"Status"=CASE WHEN "AssignmentID"=1 THEN 'CANCELLED' ELSE 'ACTIVE' END`);
    await query(`UPDATE "EligibleStudentHandoffItems" SET "Snapshot"='{"studentId":3,"atHandoff":true}' WHERE "StudentID"=3 AND "OJTSemesterID"=1`);
    await query(`INSERT INTO "OJTRegistrationEvents"("RegistrationID","Action","Snapshot","CreatedBy","Reason") VALUES(30,'SUBMITTED','{}',3,'Student submitted'),(30,'APPROVED','{}',10,'Approved dossier')`);
    const before = await Promise.all(['Users','OJTRegistrations','JobApplications','OJTRegistrationEvents','StudentEnterpriseCoordination','InternshipAssignments'].map(count));
    const params = { ojtSemesterId: 1, studentId: 3, historyLimit: 1, coordinationLimit: 1, assignmentLimit: 1 };
    const first = (await progress(params, coord)).items[0];
    assert.equal(first.history.length, 1); assert.equal(first.history[0].action, 'APPROVED');
    assert.equal(first.history[0].createdByUser.fullName, 'Academic Advisor');
    assert.deepEqual(first.historyPagination, { total: 2, page: 1, limit: 1 });
    assert.equal(first.coordination.id, 2); assert.equal(first.coordinationHistory[0].id, 2);
    assert.equal(first.coordinationHistory[0].previousCoordinationId, 1);
    assert.equal(first.coordinationHistory[0].company.name, 'Company');
    assert.equal(first.coordinationPagination.total, 2);
    assert.equal(first.assignment.id, 2); assert.equal(first.assignments[0].id, 2);
    assert.equal(first.assignment.enterpriseSupervisorName, 'HR Supervisor');
    assert.equal(first.assignment.academicSupervisor.fullName, 'Academic Advisor');
    assert.equal(first.assignments[0].academicSupervisor.email, 'advisor@fixture.test');
    assert.equal(first.assignmentsPagination.total, 2);
    assert.equal(first.window.id, 1); assert.equal(first.workflowStatus, 'IN_PROGRESS');
    assert.deepEqual(first.handoffSnapshot, { studentId: 3, atHandoff: true });
    assert.equal(first.handoff.createdByUser.fullName, 'Academic Advisor');
    assert.equal(first.officialEligibility.status, 'ELIGIBLE');
    assert.equal(eligibilityReads.at(-1).options.lockSource, false);
    const second = (await progress({ ...params, historyPage: 2, coordinationPage: 2, assignmentPage: 2 }, coord)).items[0];
    assert.equal(second.history[0].action, 'SUBMITTED'); assert.equal(second.coordinationHistory[0].id, 1);
    assert.equal(second.assignments[0].id, 1); assert.equal(second.coordination.id, 2); assert.equal(second.assignment.id, 2);
    const selected = (await progress({ ojtSemesterId: 1, registrationId: 30 }, coord)).items[0];
    assert.equal(selected.studentId, 3); assert.equal(selected.history.length, 2);
    assert.equal((await progress({ ojtSemesterId: 1, enterpriseId: 1, assignmentStatus: 'ACTIVE' }, coord)).total, 1);
    const unsubmitted = (await progress({ ojtSemesterId: 2, studentId: 5 }, coord)).items[0];
    assert.equal(unsubmitted.registration, null); assert.deepEqual(unsubmitted.history, []);
    assert.deepEqual(unsubmitted.coordinationHistory, []); assert.deepEqual(unsubmitted.assignments, []);
    assert.equal(unsubmitted.historyPagination.total, 0); assert.equal(unsubmitted.handoff.id, 3);
    const reads = eligibilityReads.length;
    for(const filters of [{ studentId: 4 },{ studentId: 3, registrationId: 20 },{ studentId: 5 }]) {
      assert.equal((await progress({ ojtSemesterId: 1, ...filters }, coord)).items.length, 0);
    }
    assert.equal(eligibilityReads.length, reads);
    for(const filters of [{ historyPage: 1 },{ studentId: 3, historyPage: 0 },{ studentId: 3, coordinationLimit: 101 },{ studentId: 3, assignmentPage: 2147483647, assignmentLimit: 100 }]) {
      await assert.rejects(progress({ ojtSemesterId: 1, ...filters }, coord), e => e.statusCode === 400);
    }
    assert.deepEqual(await Promise.all(['Users','OJTRegistrations','JobApplications','OJTRegistrationEvents','StudentEnterpriseCoordination','InternshipAssignments'].map(count)), before);
  });
});

test('Swagger exposes the two roster purposes and the atomic Student contract while retaining Admin input', () => {
  const oldInput = { type: 'object', additionalProperties: false, required: ['windowId'], properties: { windowId: { type: 'integer' }, studentId: { type: 'integer' }, application: { type: 'object' } } };
  const spec = { paths: {
    '/api/ojt-registrations': { post: { requestBody: { content: { 'application/json': { schema: oldInput } } } } },
    '/api/qhdn/registered-students': { get: { parameters: [{ in: 'query', name: 'ojtSemesterId', required: false }] } },
    '/api/qhdn/eligible-students': { get: {} },
  } };
  load('src/config/swagger-qhdn-dossiers.ts').describeQhdnDossiers(spec);
  const variants = spec.paths['/api/ojt-registrations'].post.requestBody.content['application/json'].schema.oneOf;
  const { description, ...admin } = variants[0];
  assert.deepEqual(admin, oldInput);
  assert.deepEqual(variants[1].required, ['windowId', 'postId', 'positionId']);
  assert.equal(spec.paths['/api/qhdn/registered-students'].get.parameters.find(p => p.name === 'ojtSemesterId').required, false);
  assert.match(spec.paths['/api/qhdn/registered-students'].get.description, /NOT_REGISTERED/);
  for(const name of ['historyPage','historyLimit','coordinationPage','coordinationLimit','assignmentPage','assignmentLimit']) {
    assert.ok(spec.paths['/api/qhdn/registered-students'].get.parameters.some(p => p.name === name && p.required === false));
  }
  const fields = spec.paths['/api/qhdn/registered-students'].get.responses['200'].content['application/json'].schema.properties.data.properties.items.items.properties;
  for(const name of ['history','historyPagination','coordinationHistory','coordinationPagination','assignments','assignmentsPagination','officialEligibility','handoffSnapshot']) assert.ok(fields[name]);
  assert.equal(Object.keys(spec.paths).length, 3);
});

test('QHDN forwards an approved student application; Admin fallback and rejection-based reassignment remain available', async () => {
  let selectedApplication = null, approved = true;
  const saved = [];
  const previous = { CoordinationID: 10, RegistrationID: 1, PositionID: 1, Decision: 'REJECTED' };
  const client = { query: async sql => ({ rows: sql.startsWith('SELECT "CoordinationID"') ? [{ CoordinationID: 10 }]
    : sql.startsWith('SELECT * FROM "JobApplications"') ? (selectedApplication ? [selectedApplication] : [])
    : sql.includes('FROM "EligibleStudentHandoffItems"') ? [{ found: 1 }] : [],
    rowCount: sql.includes('FROM "EligibleStudentHandoffItems"') ? 1 : 0 }) };
  const workflow = load('src/modules/qhdn/workflow.service.ts', {
    '../academic/academic.repository': { academicTransaction: work => work(client) },
    '../ojt-registration/registration.service': { registrationRecord: async () => ({ RegistrationID: 1, StudentID: 1, OJTSemesterID: 1, Status: approved ? 'APPROVED' : 'SUBMITTED' }), eligibleOfficial: async () => {} },
    '../recruitment/recruitment.repository': { assertPublishedPosition: async () => {} },
    '../eligibility/eligibility.service': { fingerprint: () => 'fixture-hash' },
    './catalog.service': { staff: () => {},
      record: async (_c, type, id) => type === 'coordinations' ? previous : type === 'positions' ? { PositionID: id, EnterpriseID: 1, OJTSemesterID: 1, Status: 'OPEN', Capacity: 5 } : { Status: 'ACTIVE' },
      occupied: async () => 0, persist: async (_c, _type, row) => { saved.push(row); return row; }, api: (_type, row) => row, log: async () => {},
    },
  });
  const body = { registrationId: 1, positionId: 1, reason: 'Send dossier', idempotencyKey: 'forward' };
  const coord = { userId: 10, roleCode: 'OJT_COORD' };
  await assert.rejects(workflow.coordinate(body, coord), e => e.errorCode === 'APPLICATION_REQUIRED');
  assert.equal(saved.length, 0);
  await workflow.coordinate(body, { userId: 11, roleCode: 'ADMIN' });
  assert.equal(saved[0].ApplicationID, null);
  selectedApplication = { ApplicationID: 3 };
  const sent = await workflow.coordinate({ ...body, applicationId: 3 }, coord);
  assert.equal(sent.ApplicationID, 3); assert.equal(sent.Decision, 'PENDING');
  approved = false;
  await assert.rejects(workflow.coordinate(body, coord), e => e.errorCode === 'REGISTRATION_NOT_HANDED_OFF');
  approved = true; selectedApplication = null;
  const reassigned = await workflow.coordinate({ positionId: 2, reason: 'Enterprise declined', idempotencyKey: 'reassign' }, coord, 10);
  assert.equal(reassigned.PreviousCoordinationID, 10); assert.equal(reassigned.PositionID, 2); assert.equal(reassigned.Decision, 'PENDING');
});
