// Reset only an explicitly named disposable local database, never deployed data.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const jwt = require('jsonwebtoken');
const { Client } = require('pg');
const target = process.env.ENTERPRISE_TEST_DATABASE_URL;
if (!target) throw Error('Set ENTERPRISE_TEST_DATABASE_URL.');
const address = new URL(target);
if (address.hostname !== '127.0.0.1' || !['55440', '55442'].includes(address.port)
  || address.pathname !== '/enterprise_recruitment_test') throw Error('Refusing a non-disposable database.');
delete process.env.DATABASE_URL;
delete process.env.SUPABASE_DATABASE_URL;
process.env.LOCAL_DATABASE_URL = target;
process.env.DB_SSL = 'false';
process.env.JWT_SECRET = 'enterprise-posting-local-test';
process.env.ENTERPRISE_RECRUITMENT_WORKER_ENABLED = 'false';

test('enterprise drafts and Published soft deletion with a separate deleted list', async t => {
  const db = new Client({ connectionString: target });
  await db.connect(); t.after(() => db.end());
  await db.query(fs.readFileSync(path.join(__dirname, '../DB'), 'utf8'));
  const { pool } = require('../dist/config/database');
  const app = require('../dist/app').default;
  const logger = require('../dist/config/logger').logger, logError = logger.error.bind(logger);
  t.mock.method(logger, 'error', error => { if (!error.statusCode || error.statusCode >= 500) logError(error); });
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await pool.end(); });
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const users = (await db.query(`SELECT u.*, r."RoleCode" FROM "Users" u JOIN "Roles" r USING("RoleID")`)).rows;
  const ent = users.find(u => u.Username === 'enterprise01');
  const staff = users.find(u => u.RoleCode === 'OJT_COORD');
  const student = users.find(u => u.Username === 'student01');
  const token = u => jwt.sign({ userId: u.UserID, username: u.Username, authVersion: u.AuthVersion, roleCode: u.RoleCode }, process.env.JWT_SECRET);
  const req = async (method, url, body, user = ent) => {
    const r = await fetch(base + url, { method, headers: { Authorization: 'Bearer ' + token(user), ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: r.status, body: await r.json() };
  };
  const expect = (r, status) => { assert.equal(r.status, status, JSON.stringify(r.body)); return r.body.data; };
  const own = (await db.query('SELECT "EnterpriseID" id FROM "EnterpriseUsers" WHERE "UserID"=$1', [ent.UserID])).rows[0].id;
  const seed = (await db.query(`SELECT w.* FROM "RecruitmentWindows" w JOIN "OJTSemesters" s USING("OJTSemesterID") WHERE s."SemesterCode"='DEMO-OJT-S6' LIMIT 1`)).rows[0];
  await db.query(`UPDATE "RecruitmentWindows" SET "Status"='CLOSED' WHERE "OJTSemesterID"=$1 AND "Status"='OPEN'`, [seed.OJTSemesterID]);
  const w = (await db.query(`INSERT INTO "RecruitmentWindows" ("AcademicPeriodID","OJTSemesterID","Name","StartsAt","EndsAt","Status","CreatedBy") VALUES ($1,$2,'Enterprise posting fixture',clock_timestamp()-interval '1 day',clock_timestamp()+interval '10 seconds','OPEN',$3) RETURNING *`, [seed.AcademicPeriodID, seed.OJTSemesterID, staff.UserID])).rows[0];
  const registration = (await db.query('SELECT * FROM "OJTRegistrationWindows" WHERE "OJTSemesterID"=$1 ORDER BY "WindowID" LIMIT 1', [w.OJTSemesterID])).rows[0];
  await db.query(`UPDATE "OJTRegistrationWindows" SET "Status"='DRAFT' WHERE "OJTSemesterID"=$1`, [w.OJTSemesterID]);
  const position = { title: 'Backend intern', description: 'Build REST APIs', requirements: 'TypeScript, PostgreSQL', capacity: 2, workMode: 'HYBRID' };
  const body = { windowId: w.WindowID, title: 'Enterprise draft', content: 'Internship opportunities', positions: [position] };
  const details = async id => expect(await req('GET', `/enterprise/recruitment/posts?postId=${id}`), 200).items[0];
  const deletedDetails = async id => expect(await req('GET', `/enterprise/recruitment/deleted-posts?postId=${id}`), 200).items[0];
  const visible = async id => expect(await req('GET', `/students/me/opportunities?windowId=${registration.WindowID}&limit=100`, undefined, student), 200).items.some(p => p.postId === id);
  let draft, published, removed;

  await t.test('enterprise-only creation defaults to an invisible editable draft', async () => {
    expect(await req('POST', '/enterprise/recruitment/posts', body, staff), 403);
    expect(await req('POST', '/enterprise/recruitment/posts', body, student), 403);
    draft = expect(await req('POST', '/enterprise/recruitment/posts', body), 201);
    assert.equal(draft.status, 'DRAFT'); assert.equal(draft.publishedAt, null);
    assert.equal(draft.canEdit, true); assert.equal(draft.canDelete, true); assert.equal(draft.canPublish, true);
    assert.equal('canClose' in draft, false);
    assert.equal(draft.positions[0].status, 'CLOSED'); assert.equal(await visible(draft.id), false);
  });

  await t.test('draft edits preserve state, position IDs and QHDN deadlines', async () => {
    draft = expect(await req('PATCH', `/enterprise/recruitment/posts/${draft.id}`, {
      title: 'Updated draft', deadlineAt: '2099-01-01T00:00:00Z', positions: [{ ...position, id: draft.positions[0].id, capacity: 3 }],
    }), 200);
    assert.equal(draft.status, 'DRAFT'); assert.equal(draft.title, 'Updated draft');
    assert.equal(draft.positions[0].capacity, 3); assert.equal(draft.deadlineAt, new Date(registration.EndsAt).toISOString());
    assert.equal(await visible(draft.id), false);
  });

  await t.test('student registration prevents publication but existing drafts can still be edited and saved', async () => {
    const removable = expect(await req('POST', '/enterprise/recruitment/posts', { ...body, title: 'Delete during student selection' }), 201);
    await db.query(`UPDATE "OJTRegistrationWindows" SET "Status"='OPEN',"StartsAt"=clock_timestamp()-interval '1 hour',"EndsAt"=clock_timestamp()+interval '1 hour' WHERE "WindowID"=$1`, [registration.WindowID]);
    try {
      const post = await details(draft.id);
      assert.equal(post.canEdit, true); assert.equal(post.editLockCode, null);
      assert.equal(post.canPublish, false); assert.equal(post.canDelete, true);
      expect(await req('DELETE', `/enterprise/recruitment/posts/${removable.id}`), 200);
      assert.equal(await details(removable.id), undefined);
      const rejected = await req('POST', `/enterprise/recruitment/posts/${draft.id}/publish`);
      expect(rejected, 409); assert.equal(rejected.body.errorCode, 'RECRUITMENT_EDIT_LOCKED_BY_OJT_REGISTRATION');
      const saved = expect(await req('PATCH', `/enterprise/recruitment/posts/${draft.id}`, { content: 'Private edit during student selection' }), 200);
      assert.equal(saved.status, 'DRAFT'); assert.equal(saved.content, 'Private edit during student selection');
      assert.equal(await visible(saved.id), false);
    } finally {
      await db.query(`UPDATE "OJTRegistrationWindows" SET "Status"='DRAFT',"StartsAt"=$2,"EndsAt"=$3 WHERE "WindowID"=$1`, [registration.WindowID, registration.StartsAt, registration.EndsAt]);
    }
  });

  await t.test('draft deletion hides it and prevents retry resurrection', async () => {
    const input = { ...body, idempotencyKey: 'deleted-draft' };
    const post = expect(await req('POST', '/enterprise/recruitment/posts', input), 201);
    const replay = expect(await req('POST', '/enterprise/recruitment/posts', input), 201);
    assert.equal(replay.id, post.id); assert.equal(replay.replayed, true);
    expect(await req('DELETE', `/enterprise/recruitment/posts/${post.id}`), 200);
    assert.equal(await details(post.id), undefined);
    expect(await req('POST', '/enterprise/recruitment/posts', input), 404);
    expect(await req('POST', `/enterprise/recruitment/posts/${post.id}/publish`), 404);
    assert.equal((await db.query('SELECT count(*)::int n FROM "RecruitmentPosts" WHERE "SubmissionKey" IS NOT NULL')).rows[0].n, 1);
  });

  await t.test('publishing immediately shows students the post, prevents edits and permits deletion in Hạn 1', async () => {
    published = expect(await req('POST', `/enterprise/recruitment/posts/${draft.id}/publish`), 200);
    assert.equal(published.status, 'PUBLISHED'); assert.ok(published.publishedAt); assert.equal(published.positions[0].status, 'OPEN');
    assert.equal(published.canEdit, false); assert.equal(published.canDelete, true); assert.equal(published.canPublish, false);
    assert.equal(await visible(published.id), true);
    const before = (await db.query('SELECT * FROM "RecruitmentPosts" WHERE "PostID"=$1', [published.id])).rows[0];
    for (const payload of [{ title: 'Cannot change' }, { status: 'DRAFT' }, { status: 'PUBLISHED' }, { positions: [{ ...position, id: published.positions[0].id, capacity: 10 }] }]) {
      expect(await req('PATCH', `/enterprise/recruitment/posts/${published.id}`, payload), 409);
    }
    expect(await req('POST', `/enterprise/recruitment/posts/${published.id}/publish`), 409);
    assert.deepEqual((await db.query('SELECT * FROM "RecruitmentPosts" WHERE "PostID"=$1', [published.id])).rows[0], before);
  });

  await t.test('direct publish and atomic save-and-publish are both supported', async () => {
    const direct = expect(await req('POST', '/enterprise/recruitment/posts', { ...body, title: 'Direct publish', status: 'PUBLISHED' }), 201);
    assert.equal(direct.status, 'PUBLISHED'); assert.equal(direct.canEdit, false); assert.equal(await visible(direct.id), true);
    const saved = expect(await req('POST', '/enterprise/recruitment/posts', { ...body, title: 'Save then publish' }), 201);
    const result = expect(await req('PATCH', `/enterprise/recruitment/posts/${saved.id}`, { title: 'Final content', status: 'PUBLISHED' }), 200);
    assert.equal(result.title, 'Final content'); assert.equal(result.status, 'PUBLISHED');
    expect(await req('POST', '/enterprise/recruitment/posts', { ...body, status: 'CLOSED' }), 400);
  });

  await t.test('every active system enterprise may create without assignments or an invitation', async () => {
    const other = (await db.query(`INSERT INTO "Enterprises" ("EnterpriseCode","Name","Status") VALUES ('POSTING-NEW','New enterprise','ACTIVE') RETURNING "EnterpriseID" id`)).rows[0].id;
    await db.query('UPDATE "EnterpriseUsers" SET "EnterpriseID"=$2 WHERE "UserID"=$1', [ent.UserID, other]);
    try {
      const post = expect(await req('POST', '/enterprise/recruitment/posts', { ...body, status: 'PUBLISHED' }), 201);
      assert.equal(post.companyId, other);
      assert.equal(expect(await req('GET', '/enterprise/recruitment/deleted-posts'), 200).total, 0);
      for (const [method, suffix, payload] of [['PATCH', '', { title: 'Steal' }], ['DELETE', '', undefined], ['POST', '/publish', undefined], ['POST', '/close', undefined]]) {
        expect(await req(method, `/enterprise/recruitment/posts/${published.id}${suffix}`, payload), 404);
      }
      await db.query('UPDATE "Enterprises" SET "DeletedAt"=now() WHERE "EnterpriseID"=$1', [other]);
      expect(await req('POST', '/enterprise/recruitment/posts', body), 403);
      expect(await req('GET', '/enterprise/recruitment/posts'), 403);
    } finally { await db.query('UPDATE "EnterpriseUsers" SET "EnterpriseID"=$2 WHERE "UserID"=$1', [ent.UserID, own]); }
  });

  await t.test('Published soft deletion hides the post and preserves content for the owner-only deleted page', async () => {
    expect(await req('DELETE', `/enterprise/recruitment/posts/${published.id}`), 200);
    assert.equal(await details(published.id), undefined);
    assert.equal(await visible(published.id), false);
    removed = await deletedDetails(published.id);
    assert.equal(removed.status, 'ARCHIVED'); assert.equal(removed.deleted, true); assert.ok(removed.deletedAt);
    assert.equal(removed.title, published.title); assert.equal(removed.content, published.content);
    assert.equal(removed.positions[0].id, published.positions[0].id);
    assert.equal(removed.publishedAt, published.publishedAt);
    for (const key of ['canEdit', 'canDelete', 'canPublish']) assert.equal(removed[key], false);
    expect(await req('GET', '/enterprise/recruitment/deleted-posts', undefined, staff), 403);
    expect(await req('GET', '/enterprise/recruitment/deleted-posts', undefined, student), 403);
    expect(await req('PATCH', `/enterprise/recruitment/posts/${removed.id}`, { status: 'PUBLISHED' }), 404);
    expect(await req('POST', `/enterprise/recruitment/posts/${removed.id}/publish`), 404);
    expect(await req('DELETE', `/enterprise/recruitment/posts/${removed.id}`), 404);
    const raw = (await db.query('SELECT * FROM "RecruitmentPosts" WHERE "PostID"=$1', [removed.id])).rows[0];
    assert.equal(raw.Status, 'ARCHIVED'); assert.ok(raw.ArchivedAt); assert.ok(raw.PublishedAt);
  });

  await t.test('concurrent publish and edit serialize without changing published content', async () => {
    const post = expect(await req('POST', '/enterprise/recruitment/posts', body), 201);
    const results = await Promise.all([
      req('POST', `/enterprise/recruitment/posts/${post.id}/publish`),
      req('PATCH', `/enterprise/recruitment/posts/${post.id}`, { title: 'Concurrent draft edit' }),
    ]);
    expect(results[0], 200); assert.ok([200, 409].includes(results[1].status));
    const final = await details(post.id); assert.equal(final.status, 'PUBLISHED'); assert.equal(final.canEdit, false);
    expect(await req('PATCH', `/enterprise/recruitment/posts/${post.id}`, { title: 'After publication' }), 409);
  });

  await t.test('concurrent publication/deletion never restores a soft-deleted post', async () => {
    const post = expect(await req('POST', '/enterprise/recruitment/posts', body), 201);
    const [publish, deletion] = await Promise.all([
      req('POST', `/enterprise/recruitment/posts/${post.id}/publish`),
      req('DELETE', `/enterprise/recruitment/posts/${post.id}`),
    ]);
    assert.ok([200, 404].includes(publish.status)); expect(deletion, 200);
    assert.equal(await details(post.id), undefined); assert.equal((await deletedDetails(post.id)).deleted, true);
  });

  await t.test('soft deletion retains existing application and assignment history', async () => {
    const source = (await db.query(`SELECT p.* FROM "RecruitmentPosts" p WHERE p."EnterpriseID"=$1 AND p."Status"='PUBLISHED' AND p."ArchivedAt" IS NULL AND EXISTS(SELECT 1 FROM "JobApplications" a WHERE a."PostID"=p."PostID") LIMIT 1`, [own])).rows[0];
    assert.ok(source);
    await db.query('UPDATE "RecruitmentPosts" SET "WindowID"=$2 WHERE "PostID"=$1', [source.PostID, w.WindowID]);
    const applications = (await db.query('SELECT * FROM "JobApplications" WHERE "PostID"=$1 ORDER BY "ApplicationID"', [source.PostID])).rows;
    const assignments = (await db.query('SELECT * FROM "InternshipAssignments" ORDER BY "AssignmentID"')).rows;
    expect(await req('DELETE', `/enterprise/recruitment/posts/${source.PostID}`), 200);
    assert.deepEqual((await db.query('SELECT * FROM "JobApplications" WHERE "PostID"=$1 ORDER BY "ApplicationID"', [source.PostID])).rows, applications);
    assert.deepEqual((await db.query('SELECT * FROM "InternshipAssignments" ORDER BY "AssignmentID"')).rows, assignments);
    assert.ok((await deletedDetails(source.PostID)).deletedAt);
  });

  await t.test('legacy continuation does not revive a soft-deleted post', async () => {
    const before = (await db.query('SELECT * FROM "RecruitmentPosts" WHERE "PostID"=$1', [removed.id])).rows[0];
    await new Promise(resolve => setTimeout(resolve, Math.max(0, +w.EndsAt + 20 - Date.now())));
    await db.query(`UPDATE "RecruitmentWindows" SET "Status"='CLOSED' WHERE "WindowID"=$1`, [w.WindowID]);
    const next = (await db.query(`INSERT INTO "RecruitmentWindows" ("AcademicPeriodID","OJTSemesterID","Name","StartsAt","EndsAt","Status","CreatedBy") VALUES ($1,$2,'Next enterprise posting',clock_timestamp()-interval '30 seconds',clock_timestamp()+interval '1 hour','OPEN',$3) RETURNING "WindowID" id`, [w.AcademicPeriodID, w.OJTSemesterID, staff.UserID])).rows[0];
    await require('../dist/modules/enterprise/enterprise-recruitment.worker').advanceEnterpriseRecruitment();
    assert.deepEqual((await db.query('SELECT * FROM "RecruitmentPosts" WHERE "PostID"=$1', [removed.id])).rows[0], before);
    await db.query(`UPDATE "RecruitmentWindows" SET "Status"='CLOSED' WHERE "WindowID"=$1`, [next.id]);
  });

  await t.test('Hạn 2 permits private draft edits but rejects publication and other posting mutations', async () => {
    // Use QHDN's existing schedule API to create a future campaign, then let the
    // database clock cross its boundaries. No phase policy or triggers are changed.
    const { saveWindow } = require('../dist/modules/recruitment/window.service');
    const period = (await db.query(`SELECT p."AcademicPeriodID" id FROM "AcademicPeriods" p WHERE "Kind"='SEMESTER' AND "Status"='PLANNED' AND NOT EXISTS(SELECT 1 FROM "OJTSemesters" o WHERE o."AcademicPeriodID"=p."AcademicPeriodID") ORDER BY "StartDate" DESC LIMIT 1`)).rows[0];
    const baseTime = Date.now(), at = ms => new Date(baseTime + ms).toISOString();
    const campaign = await saveWindow({ academicPeriodId: period.id, name: 'Enterprise phase boundaries', startsAt: at(1000), endsAt: at(60000), rounds: [{ name: 'First', postingStartsAt: at(1000), postingEndsAt: at(7000), applicationStartsAt: at(7000), applicationEndsAt: at(50000), resultsStartsAt: at(7000), resultsEndsAt: at(60000) }] }, staff.UserID);
    const round = campaign.rounds[0];
    await saveWindow({ status: 'OPEN', reason: 'Open Hạn 1' }, staff.UserID, round.id);
    const postBody = { ...body, windowId: round.id };
    assert.equal(expect(await req('POST', '/enterprise/recruitment/posts', postBody), 201).status, 'DRAFT');
    await new Promise(resolve => setTimeout(resolve, Math.max(0, baseTime + 1100 - Date.now())));
    const saved = expect(await req('POST', '/enterprise/recruitment/posts', postBody), 201);
    const live = expect(await req('POST', '/enterprise/recruitment/posts', { ...postBody, status: 'PUBLISHED' }), 201);
    const closedNow = expect(await req('POST', '/enterprise/recruitment/posts', { ...postBody, status: 'PUBLISHED' }), 201);
    expect(await req('DELETE', `/enterprise/recruitment/posts/${closedNow.id}`), 200);
    const reg = (await db.query('SELECT "WindowID" FROM "OJTRegistrationWindows" WHERE "RecruitmentRoundID"=$1', [round.id])).rows[0];
    const inPhase1 = expect(await req('GET', `/students/me/opportunities?windowId=${reg.WindowID}&limit=100`, undefined, student), 200);
    assert.ok(inPhase1.items.some(p => p.postId === live.id));
    assert.ok(inPhase1.items.every(p => ![saved.id, closedNow.id].includes(p.postId)));
    assert.ok(inPhase1.items.every(p => !p.canApply));
    const before = (await db.query('SELECT * FROM "RecruitmentPosts" WHERE "PostID"=ANY($1::int[]) ORDER BY "PostID"', [[saved.id, live.id]])).rows;
    await new Promise(resolve => setTimeout(resolve, Math.max(0, baseTime + 7100 - Date.now())));
    const lateDraft = expect(await req('POST', '/enterprise/recruitment/posts', postBody), 201);
    assert.equal(lateDraft.status, 'DRAFT');
    for (const [method, url, payload] of [
      ['POST', '/enterprise/recruitment/posts', { ...postBody, status: 'PUBLISHED' }],
      ['PATCH', `/enterprise/recruitment/posts/${saved.id}`, { status: 'PUBLISHED' }],
      ['POST', `/enterprise/recruitment/posts/${saved.id}/publish`],
      ['DELETE', `/enterprise/recruitment/posts/${live.id}`],
    ]) {
      const response = await req(method, url, payload); expect(response, 409);
      assert.equal(response.body.errorCode, 'RECRUITMENT_PHASE_CLOSED');
    }
    assert.deepEqual((await db.query('SELECT * FROM "RecruitmentPosts" WHERE "PostID"=ANY($1::int[]) ORDER BY "PostID"', [[saved.id, live.id]])).rows, before);
    for (const id of [saved.id, live.id]) {
      const post = await details(id);
      assert.equal(post.canEdit, id === saved.id);
      assert.equal(post.canDelete, id === saved.id);
      assert.equal(post.canPublish, false);
    }
    const editedDraft = expect(await req('PATCH', `/enterprise/recruitment/posts/${saved.id}`, { title: 'Private edit after Hạn 1', status: 'DRAFT' }), 200);
    assert.equal(editedDraft.status, 'DRAFT'); assert.equal(editedDraft.publishedAt, null);
    assert.equal(editedDraft.title, 'Private edit after Hạn 1');
    const inPhase2 = expect(await req('GET', `/students/me/opportunities?windowId=${reg.WindowID}&limit=100`, undefined, student), 200);
    assert.ok(inPhase2.items.some(p => p.postId === live.id));
    assert.ok(inPhase2.items.every(p => ![saved.id, closedNow.id].includes(p.postId)));
    const { assertPostPhase } = require('../dist/modules/recruitment/round-policy');
    await assertPostPhase(db, live.id, 'APPLICATION');
    for (const post of [saved, closedNow]) {
      const application = await req('POST', '/job-applications', { windowId: reg.WindowID, postId: post.id, positionId: post.positions[0].id }, student);
      expect(application, 409); assert.equal(application.body.errorCode, 'RECRUITMENT_NOT_PUBLISHED');
    }
    expect(await req('DELETE', `/enterprise/recruitment/posts/${saved.id}`), 200);
    assert.equal(await details(saved.id), undefined);
    expect(await req('DELETE', `/enterprise/recruitment/posts/${closedNow.id}`), 404);
    assert.equal((await deletedDetails(closedNow.id)).deleted, true);
  });

  await t.test('only application expiry counts as expired before and after the expiry worker runs', async () => {
    const insert = async (title, status, deadline, updated) => (await db.query(`INSERT INTO "RecruitmentPosts"
      ("EnterpriseID","OJTSemesterID","WindowID","Title","Content","CreatedBy","Status","PublishedAt","DeadlineAt","UpdatedAt")
      VALUES ($1,$2,$3,$4,'fixture',$5,$6,now()-interval '4 days',now()+$7::interval,now()+$8::interval) RETURNING "PostID"`,
      [own,w.OJTSemesterID,w.WindowID,title,ent.UserID,status,deadline,updated])).rows[0].PostID;
    const expired = await insert('Expired by deadline','PUBLISHED','-1 day','-4 days');
    const early = await insert('Closed early','CLOSED','1 day','-1 day');
    const historical = await insert('Closed before a past deadline','CLOSED','-1 day','-2 days');
    const open = await insert('Past posting but still taking applications','PUBLISHED','1 day','-1 day');
    const expiredFilter = async id => expect(await req('GET', `/enterprise/recruitment/posts?postId=${id}&status=CLOSED`), 200);

    for (const id of [early,historical]) {
      assert.equal(await details(id), undefined);
      assert.equal(await deletedDetails(id), undefined);
      const list = await expiredFilter(id);
      assert.equal(list.total, 0); assert.equal(list.summary.totalPosts, 0);
    }
    assert.equal((await details(open)).status, 'PUBLISHED');
    assert.equal((await expiredFilter(expired)).items[0].status, 'CLOSED');
    await require('../dist/modules/recruitment/post.service').expireRecruitment();
    assert.equal((await db.query('SELECT "Status" FROM "RecruitmentPosts" WHERE "PostID"=$1',[expired])).rows[0].Status, 'CLOSED');
    assert.equal((await expiredFilter(expired)).items[0].status, 'CLOSED');
    assert.equal((await expiredFilter(open)).total, 0);
  });

  await t.test('QHDN review remains available and new routes belong only to ENTERPRISE', async () => {
    const spec = require('../dist/config/swagger').swaggerSpec;
    assert.ok(spec.paths['/api/recruitment/posts/{id}/review'].post);
    for (const [url, method] of [['/api/enterprise/recruitment/posts/{id}/publish', 'post'], ['/api/enterprise/recruitment/deleted-posts', 'get'], ['/api/enterprise/recruitment/posts/{id}', 'delete']]) {
      assert.deepEqual(spec.paths[url][method]['x-roles'], ['ENTERPRISE']);
    }
    assert.equal(spec.paths['/api/enterprise/recruitment/posts/{id}/close'], undefined);
    expect(await req('POST', `/enterprise/recruitment/posts/${published.id}/close`), 404);
  });
});
