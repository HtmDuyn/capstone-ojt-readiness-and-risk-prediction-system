// Resets only the explicitly named disposable localhost database.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const jwt = require('jsonwebtoken');
const {Client} = require('pg');
const target = process.env.ENTERPRISE_TEST_DATABASE_URL;
if (!target) throw Error('Set ENTERPRISE_TEST_DATABASE_URL.');
const address = new URL(target);
if (address.hostname!=='127.0.0.1'||address.port!=='55440'||address.pathname!=='/enterprise_recruitment_test') throw Error('Refusing a non-disposable database.');
delete process.env.DATABASE_URL;
delete process.env.SUPABASE_DATABASE_URL;
process.env.LOCAL_DATABASE_URL=target;
process.env.DB_SSL='false';
process.env.JWT_SECRET='enterprise-local-integration-secret';
process.env.ENTERPRISE_RECRUITMENT_WORKER_ENABLED='false';

test('enterprise-only recruitment workflow',async t=>{
 const db=new Client({connectionString:target});
 await db.connect();t.after(()=>db.end());
 await db.query(fs.readFileSync(path.join(__dirname,'../DB'),'utf8'));
 const {pool}=require('../dist/config/database');
 const app=require('../dist/app').default;
 const {advanceEnterpriseRecruitment}=require('../dist/modules/enterprise/enterprise-recruitment.worker');
 const logger=require('../dist/config/logger').logger,log=logger.error.bind(logger);
 t.mock.method(logger,'error',error=>{if(!error.statusCode||error.statusCode>=500)log(error);});
 const server=http.createServer(app);
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await pool.end();});
 const base=`http://127.0.0.1:${server.address().port}/api`;
 const users=(await db.query(`SELECT u.*,r."RoleCode" FROM "Users" u JOIN "Roles" r USING("RoleID") WHERE u."Username" IN ('enterprise01','student01') OR r."RoleCode"='OJT_COORD' ORDER BY u."UserID"`)).rows;
 const ent=users.find(u=>u.Username==='enterprise01'),staff=users.find(u=>u.RoleCode==='OJT_COORD'),student=users.find(u=>u.Username==='student01');
 const token=u=>jwt.sign({userId:u.UserID,username:u.Username,authVersion:u.AuthVersion,roleCode:u.RoleCode},process.env.JWT_SECRET);
 const req=async(method,url,body,user=ent)=>{
  const r=await fetch(base+url,{method,headers:{Authorization:'Bearer '+token(user),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
  return {status:r.status,body:await r.json()};
 };
 const expect=(r,status)=>{assert.equal(r.status,status,JSON.stringify(r.body));return r.body.data;};
 const w=(await db.query(`SELECT w.* FROM "RecruitmentWindows" w JOIN "OJTSemesters" s USING("OJTSemesterID") WHERE s."SemesterCode"='DEMO-OJT-S6' LIMIT 1`)).rows[0];
 const hours=n=>new Date(Date.now()+n*3600000).toISOString();
 await db.query(`UPDATE "RecruitmentWindows" SET "StartsAt"=clock_timestamp()-interval '1 day',"EndsAt"=clock_timestamp()+interval '1 hour',"Status"='OPEN' WHERE "WindowID"=$1`,[w.WindowID]);
 const position={title:'Backend intern',description:'Build APIs',requirements:'TypeScript, PostgreSQL',capacity:2,workMode:'HYBRID'};
 const body={windowId:w.WindowID,title:'Enterprise test post',content:'Internships',deadlineAt:hours(24),positions:[position]};
 let created,second;
 await t.test('creation automatically submits multiple posts; only enterprise has access',async()=>{
  expect(await req('POST','/enterprise/recruitment/posts',body,student),403);
  expect(await req('POST','/enterprise/recruitment/posts',body,staff),403);
  created=expect(await req('POST','/enterprise/recruitment/posts',body),201);
  second=expect(await req('POST','/enterprise/recruitment/posts',{...body,title:'Second post'}),201);
  assert.notEqual(created.id,second.id);assert.equal(created.status,'PENDING_REVIEW');
  assert.equal(created.positions[0].status,'CLOSED');
  const queue=expect(await req('GET',`/recruitment/posts?companyId=${created.companyId}&status=PENDING_REVIEW`,undefined,staff),200);
  assert(queue.items.some(post=>post.id===created.id));
  assert.equal((await db.query(`SELECT "EnterpriseManaged" FROM "RecruitmentPosts" WHERE "PostID"=$1`,[created.id])).rows[0].EnterpriseManaged,true);
 });
 await t.test('one GET returns all position details, filters and totals',async()=>{
  expect(await req('GET','/enterprise/recruitment/windows'),200);
  const data=expect(await req('GET',`/enterprise/recruitment/posts?postId=${created.id}`),200);
  assert.equal(data.total,1);assert.equal(data.items[0].content,body.content);
  assert.equal(data.items[0].positions[0].requirements,position.requirements);
  assert.equal(data.summary.totalPositions,1);assert.equal(data.summary.totalCapacity,2);
  assert.equal(data.summary.remainingSlots,2);
  const filtered=expect(await req('GET',`/enterprise/recruitment/posts?positionId=${created.positions[0].id}`),200);
  assert.equal(filtered.items[0].id,created.id);
 });
 await t.test('obsolete detail, submit, continue and offers routes are removed',async()=>{
  for(const [method,url]of [['GET',`/enterprise/recruitment/posts/${created.id}`],['POST',`/enterprise/recruitment/posts/${created.id}/submit`],['POST',`/enterprise/recruitment/posts/${created.id}/continue`],['GET','/enterprise/recruitment/offers']]) {
   const r=await fetch(base+url,{method,headers:{Authorization:'Bearer '+token(ent)}});assert.equal(r.status,404);
  }
 });
 await t.test('published posts remain editable within the intake and return to QHDN review',async()=>{
  assert.equal(expect(await req('PATCH',`/enterprise/recruitment/posts/${created.id}`,{title:'Updated title'}),200).status,'PENDING_REVIEW');
  expect(await req('POST','/enterprise/recruitment/posts',{...body,companyId:999}),400);
  await db.query(`UPDATE "RecruitmentWindows" SET "EndsAt"=clock_timestamp()-interval '1 second' WHERE "WindowID"=$1`,[w.WindowID]);
  expect(await req('PATCH',`/enterprise/recruitment/posts/${created.id}`,{title:'Too late'}),409);
  await db.query(`UPDATE "RecruitmentWindows" SET "EndsAt"=clock_timestamp()+interval '1 hour' WHERE "WindowID"=$1`,[w.WindowID]);
  const result=expect(await req('POST',`/recruitment/posts/${created.id}/review`,{decision:'PUBLISH',reason:'Valid post'},staff),200);
  assert.equal(result.status,'PUBLISHED');
  const edited=expect(await req('PATCH',`/enterprise/recruitment/posts/${created.id}`,{title:'After publication'}),200);
  assert.equal(edited.title,'After publication');assert.equal(edited.status,'PENDING_REVIEW');
  assert.equal(edited.reviewedAt,null);
  expect(await req('POST',`/recruitment/posts/${created.id}/review`,{decision:'PUBLISH',reason:'Reviewed updated content'},staff),200);
 });
 await t.test('published edits are blocked after the intake expires or closes, and before it starts',async()=>{
  const before=(await db.query(`SELECT * FROM "RecruitmentPosts" WHERE "PostID"=$1`,[created.id])).rows[0];
  await db.query(`UPDATE "RecruitmentWindows" SET "EndsAt"=clock_timestamp()-interval '1 second' WHERE "WindowID"=$1`,[w.WindowID]);
  const expired=await req('PATCH',`/enterprise/recruitment/posts/${created.id}`,{title:'Expired edit'});
  expect(expired,409);assert.equal(expired.body.errorCode,'RECRUITMENT_WINDOW_CLOSED');
  await db.query(`UPDATE "RecruitmentWindows" SET "EndsAt"=clock_timestamp()+interval '1 hour',"Status"='CLOSED' WHERE "WindowID"=$1`,[w.WindowID]);
  expect(await req('PATCH',`/enterprise/recruitment/posts/${created.id}`,{title:'Closed intake edit'}),409);
  await db.query(`UPDATE "RecruitmentWindows" SET "Status"='OPEN',"StartsAt"=clock_timestamp()+interval '1 minute' WHERE "WindowID"=$1`,[w.WindowID]);
  expect(await req('PATCH',`/enterprise/recruitment/posts/${created.id}`,{title:'Early edit'}),409);
  await db.query(`UPDATE "RecruitmentWindows" SET "StartsAt"=clock_timestamp()-interval '1 day' WHERE "WindowID"=$1`,[w.WindowID]);
  assert.deepEqual((await db.query(`SELECT * FROM "RecruitmentPosts" WHERE "PostID"=$1`,[created.id])).rows[0],before);
 });
 await t.test('QHDN closed and archived posts cannot be reopened by enterprise editing',async()=>{
  const closed=expect(await req('POST','/enterprise/recruitment/posts',{...body,title:'Closed post fixture'}),201);
  expect(await req('POST',`/recruitment/posts/${closed.id}/close`,{reason:'QHDN explicitly closed'},staff),200);
  const result=await req('PATCH',`/enterprise/recruitment/posts/${closed.id}`,{title:'Cannot reopen'});
  expect(result,409);assert.equal(result.body.errorCode,'RECRUITMENT_POST_LOCKED');
  await db.query(`UPDATE "RecruitmentPosts" SET "Status"='ARCHIVED' WHERE "PostID"=$1`,[closed.id]);
  expect(await req('PATCH',`/enterprise/recruitment/posts/${closed.id}`,{title:'Cannot edit archive'}),409);
 });
 await t.test('ownership prevents reading and editing another company',async()=>{
  const own=(await db.query(`SELECT "EnterpriseID" id FROM "EnterpriseUsers" WHERE "UserID"=$1`,[ent.UserID])).rows[0].id;
  const other=(await db.query(`INSERT INTO "Enterprises" ("EnterpriseCode","Name","Status") VALUES ('INTEGRATION-OTHER','Other','ACTIVE') RETURNING "EnterpriseID" id`)).rows[0].id;
  await db.query(`UPDATE "EnterpriseUsers" SET "EnterpriseID"=$2 WHERE "UserID"=$1`,[ent.UserID,other]);
  assert.equal(expect(await req('GET',`/enterprise/recruitment/posts?postId=${created.id}`),200).total,0);
  expect(await req('PATCH',`/enterprise/recruitment/posts/${created.id}`,{title:'Steal'}),404);
  await db.query(`UPDATE "EnterpriseUsers" SET "EnterpriseID"=$2 WHERE "UserID"=$1`,[ent.UserID,own]);
 });
 let acceptedCandidate,pendingCandidate;
 await t.test('acceptance immediately creates assignments, reduces slots and prevents concurrent overbooking',async()=>{
  const candidates=(await db.query(`SELECT "CoordinationID" id,"ApplicationID" application_id FROM "StudentEnterpriseCoordination" WHERE "Decision"='PENDING' ORDER BY "CoordinationID" LIMIT 3`)).rows;
  for(const co of candidates) {
   await db.query(`UPDATE "StudentEnterpriseCoordination" SET "PositionID"=$2,"ApplicationID"=NULL WHERE "CoordinationID"=$1`,[co.id,created.positions[0].id]);
   await db.query(`UPDATE "JobApplications" SET "PositionID"=$2,"PostID"=$3 WHERE "ApplicationID"=$1`,[co.application_id,created.positions[0].id,created.id]);
   await db.query(`UPDATE "StudentEnterpriseCoordination" SET "ApplicationID"=$2 WHERE "CoordinationID"=$1`,[co.id,co.application_id]);
  }
  const results=await Promise.all(candidates.map(co=>req('PATCH',`/enterprise/candidates/${co.id}/decision`,{decision:'ACCEPTED',reason:'Suitable'})));
  assert.equal(results.filter(r=>r.status===200).length,2,JSON.stringify(results));
  assert.equal(results.filter(r=>r.status===409).length,1);
  acceptedCandidate=candidates[results.findIndex(r=>r.status===200)].id;
  pendingCandidate=candidates[results.findIndex(r=>r.status===409)].id;
  const list=expect(await req('GET',`/enterprise/recruitment/posts?postId=${created.id}`),200);
  assert.equal(list.items[0].positions[0].remainingSlots,0);assert.equal(list.summary.acceptedStudents,2);
  assert.equal((await db.query(`SELECT count(*)::int n FROM "InternshipAssignments" WHERE "PositionID"=$1`,[created.positions[0].id])).rows[0].n,2);
  expect(await req('PATCH',`/enterprise/candidates/${acceptedCandidate}/decision`,{decision:'ACCEPTED',reason:'Suitable'}),200);
 });
 await t.test('capacity below confirmed students is rejected and the whole published edit rolls back',async()=>{
  const before=(await db.query(`SELECT * FROM "RecruitmentPosts" WHERE "PostID"=$1`,[created.id])).rows[0];
  const originalPosition=(await db.query(`SELECT * FROM "InternshipPositions" WHERE "PositionID"=$1`,[created.positions[0].id])).rows[0];
  const result=await req('PATCH',`/enterprise/recruitment/posts/${created.id}`,{title:'Must roll back',positions:[{...position,id:created.positions[0].id,capacity:1}]});
  expect(result,409);assert.equal(result.body.errorCode,'CAPACITY_BELOW_ACCEPTED');
  assert.deepEqual((await db.query(`SELECT * FROM "RecruitmentPosts" WHERE "PostID"=$1`,[created.id])).rows[0],before);
  assert.deepEqual((await db.query(`SELECT * FROM "InternshipPositions" WHERE "PositionID"=$1`,[created.positions[0].id])).rows[0],originalPosition);
  expect(await req('PATCH',`/enterprise/recruitment/posts/${created.id}`,{positions:[position]}),400);
  assert.equal((await db.query(`SELECT count(*)::int n FROM "InternshipAssignments" WHERE "PositionID"=$1`,[created.positions[0].id])).rows[0].n,2);
 });
 await t.test('capacity can increase or decrease to the confirmed count without changing placements',async()=>{
  const update=capacity=>req('PATCH',`/enterprise/recruitment/posts/${created.id}`,{positions:[{...position,id:created.positions[0].id,capacity}]});
  const increased=expect(await update(4),200);
  assert.equal(increased.status,'PENDING_REVIEW');assert.equal(increased.positions[0].remainingSlots,2);
  const above=expect(await update(3),200);
  assert.equal(above.positions[0].remainingSlots,1);
  const equal=expect(await update(2),200);
  assert.equal(equal.positions[0].capacity,2);assert.equal(equal.positions[0].remainingSlots,0);
  assert.equal((await db.query(`SELECT count(*)::int n FROM "InternshipAssignments" WHERE "PositionID"=$1 AND "Status"='ASSIGNED'`,[created.positions[0].id])).rows[0].n,2);
  expect(await req('POST',`/recruitment/posts/${created.id}/review`,{decision:'PUBLISH',reason:'Capacity update approved'},staff),200);
 });
 await t.test('concurrent acceptance and quota reduction never leave capacity below confirmed count',async()=>{
  expect(await req('PATCH',`/enterprise/recruitment/posts/${created.id}`,{positions:[{...position,id:created.positions[0].id,capacity:3}]}),200);
  expect(await req('POST',`/recruitment/posts/${created.id}/review`,{decision:'PUBLISH',reason:'One available seat'},staff),200);
  const results=await Promise.all([
   req('PATCH',`/enterprise/recruitment/posts/${created.id}`,{positions:[{...position,id:created.positions[0].id,capacity:2}]}),
   req('PATCH',`/enterprise/candidates/${pendingCandidate}/decision`,{decision:'ACCEPTED',reason:'Concurrent acceptance'}),
  ]);
  assert.equal(results.filter(r=>r.status===200).length,1,JSON.stringify(results));
  assert.equal(results.filter(r=>r.status===409).length,1,JSON.stringify(results));
  const slots=(await db.query(`SELECT p."Capacity" AS capacity,(SELECT count(*)::int FROM "InternshipAssignments" a WHERE a."PositionID"=p."PositionID" AND COALESCE(UPPER(a."Status"),'ASSIGNED') NOT IN ('CANCELLED','CANCELED')) AS confirmed FROM "InternshipPositions" p WHERE p."PositionID"=$1`,[created.positions[0].id])).rows[0];
  assert.equal(slots.capacity,slots.confirmed);
  const current=(await db.query(`SELECT "Status" FROM "RecruitmentPosts" WHERE "PostID"=$1`,[created.id])).rows[0];
  if(current.Status==='PENDING_REVIEW')expect(await req('POST',`/recruitment/posts/${created.id}/review`,{decision:'PUBLISH',reason:'Concurrent test post approved'},staff),200);
 });
 let next;
 await t.test('automatic continuation skips full/pending posts and leaves QHDN imported posts unchanged',async()=>{
  const imported=(await db.query(`SELECT "PostID" FROM "RecruitmentPosts" WHERE NOT "EnterpriseManaged" ORDER BY "PostID"`)).rows.map(r=>r.PostID);
  const before=(await db.query(`SELECT * FROM "RecruitmentPosts" WHERE "PostID"=ANY($1::int[]) ORDER BY "PostID"`,[imported])).rows;
  await db.query(`UPDATE "RecruitmentWindows" SET "Status"='CLOSED',"EndsAt"=clock_timestamp()-interval '1 minute' WHERE "WindowID"=$1`,[w.WindowID]);
  next=(await db.query(`INSERT INTO "RecruitmentWindows" ("AcademicPeriodID","OJTSemesterID","Name","StartsAt","EndsAt","Status","CreatedBy") VALUES ($1,$2,'Next round',clock_timestamp()-interval '30 seconds',clock_timestamp()+interval '1 hour','OPEN',$3) RETURNING "WindowID" id`,[w.AcademicPeriodID,w.OJTSemesterID,staff.UserID])).rows[0];
  assert.equal(await advanceEnterpriseRecruitment(),0);
  assert.deepEqual((await db.query(`SELECT * FROM "RecruitmentPosts" WHERE "PostID"=ANY($1::int[]) ORDER BY "PostID"`,[imported])).rows,before);
  assert.equal((await db.query(`SELECT "WindowID" FROM "RecruitmentPosts" WHERE "PostID"=$1`,[created.id])).rows[0].WindowID,w.WindowID);
  assert.equal((await db.query(`SELECT "WindowID" FROM "RecruitmentPosts" WHERE "PostID"=$1`,[second.id])).rows[0].WindowID,w.WindowID);
 });
 await t.test('remaining capacity automatically carries the same approved post and position to the next round',async()=>{
  expect(await req('POST',`/recruitment/posts/${second.id}/review`,{decision:'REJECT',reason:'Rejected by QHDN'},staff),200);
  await db.query(`UPDATE "InternshipAssignments" SET "Status"='CANCELLED' WHERE "CoordinationID"=$1`,[acceptedCandidate]);
  await db.query(`UPDATE "RecruitmentPosts" SET "DeadlineAt"=clock_timestamp()+interval '1 millisecond' WHERE "PostID"=$1`,[created.id]);
  await db.query('SELECT pg_sleep(0.01)');
  await require('../dist/modules/recruitment/post.service').expireRecruitment();
  assert.equal((await db.query(`SELECT "Status" FROM "RecruitmentPosts" WHERE "PostID"=$1`,[created.id])).rows[0].Status,'CLOSED');
  assert.equal(await advanceEnterpriseRecruitment(),1);
  const data=expect(await req('GET',`/enterprise/recruitment/posts?postId=${created.id}`),200).items[0];
  assert.equal(data.id,created.id);assert.equal(data.positions[0].id,created.positions[0].id);
  assert.equal(data.windowId,next.id);assert.equal(data.status,'PUBLISHED');assert.equal(data.positions[0].remainingSlots,1);
  assert.equal((await db.query(`SELECT "Status" FROM "RecruitmentPosts" WHERE "PostID"=$1`,[second.id])).rows[0].Status,'REJECTED');
  assert.equal(await advanceEnterpriseRecruitment(),0);
  // QHDN's explicit close must stay closed when another round opens.
  expect(await req('POST',`/recruitment/posts/${created.id}/close`,{reason:'Staff closed this post'},staff),200);
  await db.query(`UPDATE "RecruitmentWindows" SET "Status"='CLOSED',"EndsAt"=clock_timestamp()-interval '10 seconds' WHERE "WindowID"=$1`,[next.id]);
  await db.query(`INSERT INTO "RecruitmentWindows" ("AcademicPeriodID","OJTSemesterID","Name","StartsAt","EndsAt","Status","CreatedBy") VALUES ($1,$2,'Third round',clock_timestamp()-interval '5 seconds',clock_timestamp()+interval '1 hour','OPEN',$3)`,[w.AcademicPeriodID,w.OJTSemesterID,staff.UserID]);
  assert.equal(await advanceEnterpriseRecruitment(),0);
  assert.equal((await db.query(`SELECT "Status" FROM "RecruitmentPosts" WHERE "PostID"=$1`,[created.id])).rows[0].Status,'CLOSED');
 });
 await t.test('no offer tables or new global capacity/assignment triggers remain',async()=>{
  const triggers=(await db.query(`SELECT tgname FROM pg_trigger WHERE NOT tgisinternal AND tgname IN ('TR_EnterpriseCapacity','TR_EnterpriseAssignment','TR_EnterpriseOfferContext')`)).rows;
  assert.equal(triggers.length,0);
  assert.equal((await db.query(`SELECT to_regclass('public."EnterpriseRecruitmentOffers"') AS offers`)).rows[0].offers,null);
 });
});
