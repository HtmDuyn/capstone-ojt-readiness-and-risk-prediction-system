// Resets only this explicitly named disposable local database. No external mail or workers.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');
const target = process.env.RECRUITMENT_PHASES_TEST_DATABASE_URL;
if (!target) throw new Error('Set RECRUITMENT_PHASES_TEST_DATABASE_URL.');
const address = new URL(target);
if (address.hostname !== '127.0.0.1' || address.port !== '55441' || address.pathname !== '/qhdn_phases_test')
  throw new Error('Refusing a non-disposable database.');
delete process.env.DATABASE_URL;
delete process.env.SUPABASE_DATABASE_URL;
process.env.LOCAL_DATABASE_URL = target;
process.env.DB_SSL = 'false';

test('three-phase creation, application-window synchronization and automatic deadline rejection', async t => {
  const db = new Client({ connectionString: target });
  await db.connect(); t.after(() => db.end());
  const sql = fs.readFileSync(path.join(__dirname, '../DB'), 'utf8');
  await db.query(sql);
  // Reapplying just the additive migration must preserve all existing applications.
  const migration = sql.slice(sql.lastIndexOf('-- BEGIN OJT RECRUITMENT THREE PHASES V3'));
  await db.query(migration);
  const { pool } = require('../dist/config/database'); t.after(() => pool.end());
  const { saveWindow, listWindows, finalizeWindow } = require('../dist/modules/recruitment/window.service');
  const { saveEnterprisePost } = require('../dist/modules/enterprise/enterprise-recruitment.service');
  const { assertPostPhase } = require('../dist/modules/recruitment/round-policy');
  const { placementBoard } = require('../dist/modules/qhdn/placement.service');
  const { enterpriseCandidates } = require('../dist/modules/enterprise/enterprise.service');
  const { studentOpportunities } = require('../dist/modules/students/job-application.service');
  const staff = (await db.query(`SELECT "UserID" AS id FROM "Users" WHERE "Username"='ojt.coord01'`)).rows[0].id;
  const enterprise = (await db.query(`SELECT "UserID" AS id FROM "Users" WHERE "Username"='enterprise01'`)).rows[0].id;
  const period = (await db.query(`SELECT "AcademicPeriodID" AS id FROM "AcademicPeriods" p WHERE "Kind"='SEMESTER' AND "Status"='PLANNED'
    AND NOT EXISTS(SELECT 1 FROM "OJTSemesters" o WHERE o."AcademicPeriodID"=p."AcademicPeriodID") ORDER BY "StartDate" DESC LIMIT 1`)).rows[0];
  const base = Date.now(); const at = ms => new Date(base + ms).toISOString();
  const body = { academicPeriodId: period.id, name:'Three-phase campaign', startsAt:at(1500),endsAt:at(10000),reason:'Integration test',rounds:[{
    name:'First',postingStartsAt:at(1500),postingEndsAt:at(4500),applicationStartsAt:at(4500),applicationEndsAt:at(7000),resultsStartsAt:at(4500),resultsEndsAt:at(10000),
  }] };
  const campaign = await saveWindow(body, staff); const round = campaign.rounds[0];
  const registration = (await db.query('SELECT * FROM "OJTRegistrationWindows" WHERE "RecruitmentRoundID"=$1', [round.id])).rows[0];
  assert.equal(+registration.StartsAt, +new Date(body.rounds[0].applicationStartsAt));
  assert.equal(+registration.EndsAt, +new Date(body.rounds[0].applicationEndsAt));
  await saveWindow({status:'OPEN',reason:'Open scheduled round'},staff,round.id);
  const waitUntil = async ms => new Promise(resolve => setTimeout(resolve, Math.max(0,base+ms-Date.now())));
  await waitUntil(1600);
  const post = await saveEnterprisePost({windowId:round.id,title:'Test vacancy',content:'Test content',positions:[{
    title:'Intern',description:'Test',requirements:'SQL',capacity:1,
  }]},{userId:enterprise,roleCode:'ENTERPRISE'});
  assert.equal(+new Date(post.deadlineAt), +registration.EndsAt);
  await assert.rejects(assertPostPhase(db,post.id,'APPLICATION'),e=>e.errorCode==='RECRUITMENT_PHASE_CLOSED');
  await waitUntil(4600);
  await assertPostPhase(db,post.id,'APPLICATION'); await assertPostPhase(db,post.id,'RESULTS');
  await assert.rejects(saveEnterprisePost({title:'Late change'},{userId:enterprise,roleCode:'ENTERPRISE'},post.id),e=>e.errorCode==='RECRUITMENT_PHASE_CLOSED');
  await waitUntil(7100);
  await assert.rejects(assertPostPhase(db,post.id,'APPLICATION'));
  await assertPostPhase(db,post.id,'RESULTS');
  assert.equal((await listWindows({academicPeriodId:period.id})).items[0].currentPhase,'RESULTS');

  // Attach synthetic application states to a historical round in the seeded OJT semester.
  const source = (await db.query(`SELECT a.* FROM "JobApplications" a WHERE a."Status"='SUBMITTED' ORDER BY a."ApplicationID" LIMIT 1`)).rows[0];
  assert.ok(source,'Seed must provide a pending application fixture');
  const student=(await db.query('SELECT "UserID" FROM "Students" WHERE "StudentID"=$1',[source.StudentID])).rows[0];
  const originalWindow=(await db.query('SELECT "WindowID" FROM "OJTRegistrations" WHERE "RegistrationID"=$1',[source.RegistrationID])).rows[0].WindowID;
  assert.ok(Array.isArray((await studentOpportunities({windowId:originalWindow},{userId:student.UserID,roleCode:'STUDENT'})).items));
  const term = (await db.query('SELECT * FROM "OJTSemesters" WHERE "OJTSemesterID"=$1',[source.OJTSemesterID])).rows[0];
  const expiredCampaign = (await db.query(`INSERT INTO "RecruitmentCampaigns" ("OJTSemesterID","Name","CreatedBy","StartsAt","EndsAt","ScheduleVersion")
    VALUES($1,'Expired campaign',$2,now()-interval '61 days',now()-interval '29 days',3) RETURNING "CampaignID"`,[term.OJTSemesterID,staff])).rows[0].CampaignID;
  const expiredRound = (await db.query(`INSERT INTO "RecruitmentWindows" ("AcademicPeriodID","OJTSemesterID","CampaignID","RoundNumber","Name","StartsAt","EndsAt","PostingStartsAt","PostingEndsAt","ApplicationStartsAt","ApplicationEndsAt","ResultsStartsAt","ResultsEndsAt","CreatedBy")
    VALUES($1,$2,$3,1,'Expired',now()-interval '60 days',now()-interval '30 days',now()-interval '60 days',now()-interval '50 days',now()-interval '50 days',now()-interval '40 days',now()-interval '50 days',now()-interval '30 days',$4) RETURNING "WindowID"`,[term.AcademicPeriodID,term.OJTSemesterID,expiredCampaign,staff])).rows[0].WindowID;
  const ids = [];
  for (const status of ['SUBMITTED','REVIEWING','INTERVIEW','OFFERED','ACCEPTED','REJECTED','WITHDRAWN']) {
    const postId=(await db.query(`INSERT INTO "RecruitmentPosts" ("EnterpriseID","OJTSemesterID","WindowID","Title","Content","Status","CreatedBy") VALUES($1,$2,$3,$4,'Test','CLOSED',$5) RETURNING "PostID"`,[source.EnterpriseID,source.OJTSemesterID,expiredRound,status,enterprise])).rows[0].PostID;
    await db.query(`INSERT INTO "RecruitmentPostPositions" ("PostID","PositionID","EnterpriseID","OJTSemesterID") VALUES($1,$2,$3,$4)`,[postId,source.PositionID,source.EnterpriseID,source.OJTSemesterID]);
    const app=(await db.query(`INSERT INTO "JobApplications" ("RegistrationID","StudentID","OJTSemesterID","PostID","PositionID","EnterpriseID","Status") VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING "ApplicationID"`,[source.RegistrationID,source.StudentID,source.OJTSemesterID,postId,source.PositionID,source.EnterpriseID,status])).rows[0].ApplicationID;
    ids.push({id:app,status});
    if(status==='SUBMITTED')await db.query(`INSERT INTO "StudentEnterpriseCoordination" ("RegistrationID","EnterpriseID","PositionID","CoordinatedBy","OJTSemesterID","Decision","ApplicationID") VALUES($1,$2,$3,$4,$5,'PENDING',$6)`,[source.RegistrationID,source.EnterpriseID,source.PositionID,staff,source.OJTSemesterID,app]);
  }
  assert.equal((await db.query('SELECT public."ExpireRecruitmentResponses"() AS n')).rows[0].n,4);
  assert.equal((await db.query('SELECT public."ExpireRecruitmentResponses"() AS n')).rows[0].n,0);
  const rows=(await db.query('SELECT "ApplicationID","Status" FROM "JobApplications" WHERE "ApplicationID"=ANY($1::int[])',[ids.map(a=>a.id)])).rows;
  for(const item of ids)assert.equal(rows.find(a=>a.ApplicationID===item.id).Status,['ACCEPTED','REJECTED','WITHDRAWN'].includes(item.status)?item.status:'REJECTED');
  assert.equal((await db.query('SELECT "Decision" FROM "StudentEnterpriseCoordination" WHERE "ApplicationID"=$1',[ids[0].id])).rows[0].Decision,'REJECTED');
  assert.equal((await db.query(`SELECT count(*)::int n FROM "ApplicationEvents" WHERE "Action"='AUTO_REJECT_RESPONSE_DEADLINE'`)).rows[0].n,4);
  const board=await placementBoard({ojtSemesterId:term.OJTSemesterID},{userId:staff,roleCode:'OJT_COORD'});
  assert.equal(board.items.find(s=>s.id===source.StudentID).needsFollowUp,true);
  const candidates=await enterpriseCandidates({ojtSemesterId:term.OJTSemesterID},{userId:enterprise,roleCode:'ENTERPRISE'});
  assert.equal(candidates.items.find(c=>c.applicationId===ids[0].id).canRespond,false);
  await waitUntil(10100);
  await assert.rejects(assertPostPhase(db,post.id,'RESULTS'));
  const summary=await finalizeWindow(round.id,{reason:'Completed'},staff);
  assert.equal(summary.status,'CLOSED');
  // Invalid ordering must also be rejected by database guards, bypassing HTTP validation.
  await assert.rejects(db.query(`INSERT INTO "RecruitmentWindows" ("AcademicPeriodID","OJTSemesterID","CampaignID","RoundNumber","Name","StartsAt","EndsAt","CreatedBy") VALUES($1,$2,$3,2,'Missing phases',$4,$5,$6)`,[period.id,round.ojtSemesterId,campaign.id,at(1500),at(10000),staff]),e=>e.code==='23514');
});
