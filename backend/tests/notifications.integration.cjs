const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');
const target = process.env.NOTIFICATIONS_TEST_DATABASE_URL;
if (!target) throw Error('Set NOTIFICATIONS_TEST_DATABASE_URL to the disposable notification_test database.');
const address = new URL(target);
if (address.hostname !== '127.0.0.1' || address.port !== '55441' || address.pathname !== '/notification_test')
  throw Error('Refusing a non-disposable database.');
delete process.env.DATABASE_URL; delete process.env.SUPABASE_DATABASE_URL;
process.env.LOCAL_DATABASE_URL = target; process.env.DB_SSL = 'false';
process.env.EMAIL_OUTBOX_KEY = 'ab'.repeat(32);
process.env.FRONTEND_LOGIN_URL = 'https://ojt.example.test/login';
process.env.MAIL_PROVIDER = 'mailjet';
process.env.MAILJET_API_KEY = 'test-api-key'; process.env.MAILJET_SECRET_KEY = 'test-secret-key';
process.env.MAIL_FROM_EMAIL = 'ojt@example.test';

test('account and deadline notifications persist atomically, deduplicate and retire stale email in PostgreSQL', async t => {
  const db = new Client({ connectionString: target }); await db.connect(); t.after(() => db.end());
  // Only the explicitly restricted, local disposable database is reset.
  await db.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public');
  await db.query(fs.readFileSync(path.join(__dirname, '../DB'), 'utf8'));
  const migration = fs.readFileSync(path.join(__dirname, '../migrations/20261120_system_notifications.sql'), 'utf8');
  const count = async table => Number((await db.query(`SELECT count(*) AS n FROM "${table}"`)).rows[0].n);
  const before = await count('Users');
  await db.query(migration); await db.query(migration);
  assert.equal(await count('Users'), before);
  const { pool } = require('../dist/config/database'); t.after(() => pool.end());
  const { createNewAccount } = require('../dist/modules/accounts/account.service');
  const { importAccounts } = require('../dist/modules/imports/import.service');
  const { saveWindow } = require('../dist/modules/recruitment/window.service');
  const { editWindowSchedule } = require('../dist/modules/recruitment/schedule.service');
  const { notifyRecruitmentSchedule, notifyRegistrationSchedule, queueDueDeadlineNotices } = require('../dist/modules/recruitment/notification.service');
  const { deliverEmails } = require('../dist/jobs/provisioning');
  const sent = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://api.mailjet.com/v3.1/send');
    const [message] = JSON.parse(options.body).Messages;
    const to = message.To[0].Email;
    sent.push({ to, text: message.TextPart });
    return Response.json({ Messages: [{ Status: 'success', To: [{ Email: to, MessageID: sent.length }] }] });
  });
  const users = (await db.query(`SELECT u."UserID",u."Email",u."RoleID",r."RoleCode" FROM "Users" u JOIN "Roles" r USING("RoleID")`)).rows;
  const staff = users.find(u => u.RoleCode === 'OJT_COORD');
  const admin = users.find(u => u.RoleCode === 'ADMIN');
  const enterprise = users.find(u => u.RoleCode === 'ENTERPRISE');

  await t.test('manual creation sends welcome email before returning, and encryption failures roll back the account', async () => {
    const input = { username: 'notification.staff', fullName: 'Test Staff', email: 'staff@example.test', password: 'Test-only-Password1', roleId: staff.RoleID };
    const account = await createNewAccount(input);
    const email = (await db.query('SELECT * FROM "EmailOutbox" WHERE "UserID"=$1', [account.id])).rows[0];
    assert.equal(email.Kind, 'SYSTEM_NOTIFICATION'); assert.equal(email.Status, 'SENT'); assert.equal(email.EncryptedPayload, null);
    assert.equal(account.emailDelivery.status, 'SENT');
    assert.ok(sent.find(message => message.to === input.email)?.text.includes(input.username));
    assert.equal((await db.query('SELECT count(*)::int AS n FROM "Notifications" WHERE "UserID"=$1', [account.id])).rows[0].n, 1);
    const key = process.env.EMAIL_OUTBOX_KEY; delete process.env.EMAIL_OUTBOX_KEY;
    try { await assert.rejects(createNewAccount({ ...input, username: 'rollback.staff', email: 'rollback@example.test' })); }
    finally { process.env.EMAIL_OUTBOX_KEY = key; }
    assert.equal((await db.query('SELECT count(*)::int AS n FROM "Users" WHERE "Username"=\'rollback.staff\'')).rows[0].n, 0);
  });
  await t.test('enterprise preview, commit and replay create exactly one welcome notice and credential email', async () => {
    const input = { kind: 'ENTERPRISE', idempotencyKey: 'notification-enterprise', rows: [{ name: 'Notification Company', email: 'company@example.test', fullName: 'Test HR' }] };
    const emails = await count('EmailOutbox');
    await importAccounts(input, staff.UserID, true); assert.equal(await count('EmailOutbox'), emails);
    const created = await importAccounts(input, staff.UserID); await importAccounts(input, staff.UserID);
    assert.equal(created.emailDelivery.status, 'SENT');
    assert.equal(sent.filter(message => message.to === 'company@example.test').length, 1);
    const email = (await db.query('SELECT * FROM "EmailOutbox" WHERE "Recipient"=\'company@example.test\'')).rows;
    assert.equal(email.length, 1); assert.equal(email[0].Kind, 'ACCOUNT');
    assert.equal((await db.query('SELECT count(*)::int AS n FROM "Notifications" WHERE "UserID"=$1', [email[0].UserID])).rows[0].n, 1);
  });
  await t.test('student import sends credentials once while later profile updates preserve the password', async () => {
    const source = (await db.query(`SELECT s."ProgramID",p.* FROM "Students" s JOIN "StudentAcademicPlacements" p USING("StudentID") ORDER BY s."StudentID" LIMIT 1`)).rows[0];
    const input = { kind: 'STUDENT', idempotencyKey: 'notification-student', rows: [{ code: 'NOTICE001', email: 'student-notice@example.test', fullName: 'Notice Student', academic: {
      programId: source.ProgramID, placement: { cohortId: source.CohortID, groupCode: source.GroupCode,
        entryAcademicPeriodId: source.EntryAcademicPeriodID, currentAcademicPeriodId: source.EntryAcademicPeriodID }, courseResults: [],
    } }] };
    const before = await count('EmailOutbox');
    await importAccounts(input, admin.UserID, true); assert.equal(await count('EmailOutbox'), before);
    await importAccounts(input, admin.UserID); await importAccounts(input, admin.UserID);
    const hash = (await db.query('SELECT "PasswordHash" FROM "Users" WHERE "Email"=\'student-notice@example.test\'')).rows[0].PasswordHash;
    const updated = await importAccounts({ ...input, idempotencyKey: 'notification-student-update' }, admin.UserID);
    assert.equal(updated.created, 0); assert.equal(updated.updated, 1);
    const email = (await db.query('SELECT * FROM "EmailOutbox" WHERE "Recipient"=\'student-notice@example.test\'')).rows;
    assert.equal(email.length, 1); assert.equal(email[0].Kind, 'ACCOUNT');
    assert.equal((await db.query('SELECT "PasswordHash" FROM "Users" WHERE "UserID"=$1', [email[0].UserID])).rows[0].PasswordHash, hash);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM "Notifications" WHERE "UserID"=$1', [email[0].UserID])).rows[0].n, 1);
  });

  let round;
  const schedule = { postingStartsAt: '2031-01-02T00:00:00Z', postingEndsAt: '2031-01-03T00:00:00Z', applicationStartsAt: '2031-01-03T00:00:00Z', applicationEndsAt: '2031-01-10T00:00:00Z', resultsStartsAt: '2031-01-04T00:00:00Z', resultsEndsAt: '2031-01-10T00:00:00Z' };
  await t.test('creating a schedule notifies enterprises and excludes students in other semesters', async () => {
    const year = (await db.query(`INSERT INTO "AcademicYears" ("YearCode","StartDate","EndDate","Status") VALUES ('NOTICE-2031','2031-01-01','2031-12-31','PLANNED') RETURNING "AcademicYearID"`)).rows[0].AcademicYearID;
    const period = (await db.query(`INSERT INTO "AcademicPeriods" ("AcademicYearID","PeriodCode","Name","Kind","StartDate","EndDate","Status") VALUES ($1,'NOTICE-2031-SEM','Notices','SEMESTER','2031-01-01','2031-06-30','PLANNED') RETURNING "AcademicPeriodID"`, [year])).rows[0].AcademicPeriodID;
    round = (await saveWindow({ academicPeriodId: period, name: 'Notice Round', startsAt: schedule.postingStartsAt, endsAt: schedule.resultsEndsAt, rounds: [{ name: 'Notice Round', ...schedule }] }, staff.UserID)).rounds[0];
    const notices = (await db.query(`SELECT n.*,r."RoleCode" FROM "Notifications" n JOIN "Users" u USING("UserID") JOIN "Roles" r USING("RoleID") WHERE n."RelatedEntityType"='RECRUITMENT_WINDOW' AND n."RelatedEntityID"=$1`, [round.id])).rows;
    assert.ok(notices.some(n => n.UserID === enterprise.UserID)); assert.ok(!notices.some(n => n.RoleCode === 'STUDENT'));
    const row = (await db.query('SELECT * FROM "RecruitmentWindows" WHERE "WindowID"=$1', [round.id])).rows[0];
    assert.equal(await notifyRecruitmentSchedule(db, row, 'Lịch tuyển dụng OJT mới: '), 0);
  });
  await t.test('editing deadlines queues a new schedule once and unchanged saves stay quiet', async () => {
    const edit = { ...schedule, name: 'Notice Round Updated', reason: 'Correct deadline', applicationEndsAt: '2031-01-09T00:00:00Z', resultsEndsAt: '2031-01-09T00:00:00Z' };
    const emails = await count('EmailOutbox');
    await editWindowSchedule(round.id, edit, staff.UserID); assert.ok(await count('EmailOutbox') > emails);
    const after = await count('EmailOutbox'); await editWindowSchedule(round.id, edit, staff.UserID);
    assert.equal(await count('EmailOutbox'), after);
    // Exercise the legacy registration recipient query against the real schema.
    const registration = (await db.query('SELECT * FROM "OJTRegistrationWindows" WHERE "RecruitmentRoundID"=$1', [round.id])).rows[0];
    assert.equal(await notifyRegistrationSchedule(db, registration, 'Lịch đăng ký: '), 0);
  });
  await t.test('academic advisory processing creates both the portal notice and encrypted email', async () => {
    const student = (await db.query(`SELECT s."StudentID",s."UserID",reg."OJTSemesterID" FROM "Students" s JOIN "OJTRegistrations" reg USING("StudentID") ORDER BY s."StudentID" LIMIT 1`)).rows[0];
    const run = (await db.query(`INSERT INTO "OJTAdvisoryRuns" ("Kind","IdempotencyKey","RequestHash","Request","CreatedBy")
      VALUES ('SUMMARY','notice-advisory','test',$1,$2) RETURNING "RunID"`, [JSON.stringify({ ojtSemesterId: student.OJTSemesterID }), admin.UserID])).rows[0];
    await db.query('INSERT INTO "OJTAdvisoryRunItems" ("RunID","StudentID") VALUES ($1,$2)', [run.RunID, student.StudentID]);
    const { processAdvisoryItem } = require('../dist/modules/student-portal/advisory.service');
    assert.equal(await processAdvisoryItem(), true);
    const item = (await db.query('SELECT * FROM "OJTAdvisoryRunItems" WHERE "RunID"=$1', [run.RunID])).rows[0];
    assert.equal(item.Status, 'COMPLETED'); assert.ok(item.NotificationID);
    assert.ok((await db.query(`SELECT 1 FROM "EmailOutbox" WHERE "UserID"=$1 AND "Kind"='SYSTEM_NOTIFICATION'`, [student.UserID])).rowCount);
    const after = await count('EmailOutbox'); assert.equal(await processAdvisoryItem(), false); assert.equal(await count('EmailOutbox'), after);
  });
  await t.test('worker sends current emails, cancels outdated deadlines and does not retry delivered mail', async () => {
    await deliverEmails();
    assert.ok(sent.some(message => message.to === 'company@example.test'));
    assert.ok(sent.some(message => message.to === 'student-notice@example.test'));
    assert.ok(sent.some(message => message.to === enterprise.Email && message.text.includes('Notice Round Updated')));
    assert.ok(!sent.some(message => message.text.includes('Đợt: Notice Round.')));
    assert.ok((await db.query(`SELECT 1 FROM "EmailOutbox" WHERE "Status"='CANCELLED' AND "Kind"='SYSTEM_NOTIFICATION'`)).rowCount);
    const delivered = sent.length; await deliverEmails(); assert.equal(sent.length, delivered);
    assert.equal((await db.query(`SELECT count(*)::int AS n FROM "EmailOutbox" WHERE "Status" IN ('SENT','CANCELLED') AND "EncryptedPayload" IS NOT NULL`)).rows[0].n, 0);
  });
  await t.test('deadline ticks are idempotent and continue to include registered students on the legacy round', async () => {
    await queueDueDeadlineNotices();
    const after = await count('Notifications'); await queueDueDeadlineNotices(); assert.equal(await count('Notifications'), after);
    const legacy = (await db.query(`SELECT * FROM "RecruitmentWindows" WHERE "CampaignID" IS NULL ORDER BY "WindowID" LIMIT 1`)).rows[0];
    if (legacy) {
      await notifyRecruitmentSchedule(db, legacy, 'Test audience: ', 'TEST_AUDIENCE', 'STUDENT', new Date('2031-01-01'));
      const notices = (await db.query(`SELECT n."UserID" FROM "Notifications" n WHERE n."RelatedEntityType"='RECRUITMENT_WINDOW' AND n."RelatedEntityID"=$1 AND n."Title" LIKE 'Test audience:%'`, [legacy.WindowID])).rows;
      assert.ok(notices.length > 0);
      assert.ok(notices.every(n => users.some(u => u.UserID === n.UserID && u.RoleCode === 'STUDENT')));
      const lockedId = notices[0].UserID;
      await db.query('UPDATE "Users" SET "Status"=\'LOCKED\' WHERE "UserID"=$1', [lockedId]);
      await notifyRecruitmentSchedule(db, legacy, 'Active audience: ', 'TEST_ACTIVE_AUDIENCE', 'STUDENT', new Date('2031-01-01'));
      assert.equal((await db.query(`SELECT count(*)::int AS n FROM "Notifications" WHERE "UserID"=$1 AND "Title" LIKE 'Active audience:%'`, [lockedId])).rows[0].n, 0);
    }
    assert.ok(admin.UserID);
  });
  await t.test('Mailjet authentication failure keeps the account and explains why delivery is pending', async child => {
    child.mock.method(console, 'error', () => {});
    child.mock.method(globalThis, 'fetch', async () => Response.json({ ErrorCode: 'mj-0015' }, { status: 401 }));
    const created = await createNewAccount({ username: 'smtp.failure.staff', fullName: 'SMTP Failure', email: 'smtp-failure@example.test', password: 'Test-only-Password2', roleId: staff.RoleID });
    assert.equal(created.emailDelivery.status, 'PENDING'); assert.equal(created.emailDelivery.sent, 0);
    assert.equal(created.emailDelivery.issue, 'AUTH');
    assert.equal((await db.query('SELECT count(*)::int AS n FROM "Users" WHERE "UserID"=$1', [created.id])).rows[0].n, 1);
    const email = (await db.query('SELECT * FROM "EmailOutbox" WHERE "UserID"=$1', [created.id])).rows[0];
    assert.equal(email.Status, 'PENDING'); assert.equal(email.Attempts, 0); assert.ok(email.EncryptedPayload);
    assert.equal(email.LastError, 'EAUTH_401');
  });
});
