// Resets only this explicitly named disposable database, never the deployed system.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const jwt=require('jsonwebtoken');
const {Client}=require('pg');
const target=process.env.ENTERPRISE_TEST_DATABASE_URL;
if(!target)throw Error('Set ENTERPRISE_TEST_DATABASE_URL.');
const address=new URL(target);
if(address.hostname!=='127.0.0.1'||address.port!=='55440'||address.pathname!=='/enterprise_recruitment_test')throw Error('Refusing a non-disposable database.');
delete process.env.DATABASE_URL;delete process.env.SUPABASE_DATABASE_URL;
process.env.LOCAL_DATABASE_URL=target;process.env.DB_SSL='false';
process.env.JWT_SECRET='enterprise-direct-publish-local-test';process.env.ENTERPRISE_RECRUITMENT_WORKER_ENABLED='false';

test('enterprise direct publishing and student-registration editing lock',async t=>{
 const db=new Client({connectionString:target});await db.connect();t.after(()=>db.end());
 await db.query(fs.readFileSync(path.join(__dirname,'../DB'),'utf8'));
 const {pool}=require('../dist/config/database');
 const app=require('../dist/app').default;
 const {advanceEnterpriseRecruitment}=require('../dist/modules/enterprise/enterprise-recruitment.worker');
 const logger=require('../dist/config/logger').logger,log=logger.error.bind(logger);
 t.mock.method(logger,'error',error=>{if(!error.statusCode||error.statusCode>=500)log(error);});
 const server=http.createServer(app);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await pool.end();});
 const base=`http://127.0.0.1:${server.address().port}/api`;
 const users=(await db.query(`SELECT u.*,r."RoleCode" FROM "Users" u JOIN "Roles" r USING("RoleID") WHERE u."Username" IN ('enterprise01','student01') OR r."RoleCode"='OJT_COORD' ORDER BY u."UserID"`)).rows;
 const ent=users.find(u=>u.Username==='enterprise01'),staff=users.find(u=>u.RoleCode==='OJT_COORD'),student=users.find(u=>u.Username==='student01');
 const token=u=>jwt.sign({userId:u.UserID,username:u.Username,authVersion:u.AuthVersion,roleCode:u.RoleCode},process.env.JWT_SECRET);
 const req=async(method,url,body,user=ent)=>{const r=await fetch(base+url,{method,headers:{Authorization:'Bearer '+token(user),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,body:await r.json()};};
 const expect=(r,status)=>{assert.equal(r.status,status,JSON.stringify(r.body));return r.body.data;};
 const w=(await db.query(`SELECT w.* FROM "RecruitmentWindows" w JOIN "OJTSemesters" s USING("OJTSemesterID") WHERE s."SemesterCode"='DEMO-OJT-S6' LIMIT 1`)).rows[0];
 const registration=(await db.query(`SELECT * FROM "OJTRegistrationWindows" WHERE "OJTSemesterID"=$1 ORDER BY "WindowID" LIMIT 1`,[w.OJTSemesterID])).rows[0];
 await db.query(`UPDATE "RecruitmentWindows" SET "StartsAt"=clock_timestamp()-interval '1 day',"EndsAt"=clock_timestamp()+interval '1 hour',"Status"='OPEN' WHERE "WindowID"=$1`,[w.WindowID]);
 await db.query(`UPDATE "OJTRegistrationWindows" SET "Status"='DRAFT' WHERE "OJTSemesterID"=$1`,[w.OJTSemesterID]);
 const position={title:'Backend intern',description:'Build REST APIs',requirements:'TypeScript, PostgreSQL',capacity:2,workMode:'HYBRID'};
 const body={windowId:w.WindowID,title:'Direct enterprise recruitment',content:'Internship opportunities',positions:[position]};
 const details=async id=>expect(await req('GET',`/enterprise/recruitment/posts?postId=${id}`),200).items[0];
 let created,second;

 await t.test('only enterprise can create; creation immediately publishes open positions without a review',async()=>{
  expect(await req('POST','/enterprise/recruitment/posts',body,staff),403);
  expect(await req('POST','/enterprise/recruitment/posts',body,student),403);
  created=expect(await req('POST','/enterprise/recruitment/posts',body),201);
  second=expect(await req('POST','/enterprise/recruitment/posts',{...body,title:'Second enterprise post',deadlineAt:'2099-01-01T00:00:00Z'}),201);
  assert.notEqual(created.id,second.id);assert.equal(created.status,'PUBLISHED');assert(created.publishedAt);
  assert.equal(created.positions[0].status,'OPEN');assert.equal(created.requiresReview,false);assert.equal(created.canEdit,true);
  assert.equal(created.deadlineAt,new Date(registration.EndsAt).toISOString());
  assert.equal(second.deadlineAt,created.deadlineAt);
  const raw=(await db.query(`SELECT "ReviewedBy","ReviewedAt","Status" FROM "RecruitmentPosts" WHERE "PostID"=$1`,[created.id])).rows[0];
  assert.equal(raw.Status,'PUBLISHED');assert.equal(raw.ReviewedBy,null);assert.equal(raw.ReviewedAt,null);
 });
 await t.test('unchanged student opportunity API sees the post immediately, with no QHDN publication call',async()=>{
  const data=expect(await req('GET',`/students/me/opportunities?windowId=${registration.WindowID}&limit=100`,undefined,student),200);
  assert(data.items.some(item=>item.postId===created.id));
  assert(data.items.some(item=>item.postId===second.id));
 });
 await t.test('creation without a planned student intake uses the existing semester end, not client input',async()=>{
  await db.query(`UPDATE "OJTRegistrationWindows" SET "Status"='CLOSED' WHERE "OJTSemesterID"=$1`,[w.OJTSemesterID]);
  const fallback=expect(await req('POST','/enterprise/recruitment/posts',{...body,title:'Before student intake configuration',deadlineAt:'2099-01-01T00:00:00Z'}),201);
  const end=(await db.query(`SELECT ("EndDate"+1)::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh' deadline FROM "AcademicPeriods" WHERE "AcademicPeriodID"=$1`,[w.AcademicPeriodID])).rows[0].deadline;
  assert.equal(fallback.deadlineAt,end.toISOString());assert.equal(fallback.status,'PUBLISHED');
  await db.query(`UPDATE "OJTRegistrationWindows" SET "Status"='DRAFT' WHERE "OJTSemesterID"=$1`,[w.OJTSemesterID]);
 });
 await t.test('one enterprise GET returns position details, posting deadline and editing capability',async()=>{
  const data=expect(await req('GET',`/enterprise/recruitment/posts?postId=${created.id}`),200);
  assert.equal(data.total,1);assert.equal(data.summary.totalCapacity,2);assert.equal(data.items[0].positions[0].requirements,position.requirements);
  assert.equal(data.items[0].deadlineManagedBy,'QHDN');assert(data.items[0].postingDeadlineAt);
  const window=expect(await req('GET','/enterprise/recruitment/windows'),200).items.find(item=>item.id===w.WindowID);
  assert.equal(window.canCreate,true);assert.equal(window.canEdit,true);assert.equal(window.studentRegistrationWindow,null);
 });
 await t.test('published edits stay published and cannot change QHDN-owned deadlines, including equal dates',async()=>{
  const deadline=(await db.query(`SELECT "EndsAt" FROM "RecruitmentWindows" WHERE "WindowID"=$1`,[w.WindowID])).rows[0].EndsAt;
  await db.query(`UPDATE "RecruitmentPosts" SET "DeadlineAt"=$2 WHERE "PostID"=$1`,[created.id,deadline]);
  const before=(await db.query(`SELECT "PublishedAt" FROM "RecruitmentPosts" WHERE "PostID"=$1`,[created.id])).rows[0];
  const edited=expect(await req('PATCH',`/enterprise/recruitment/posts/${created.id}`,{title:'Updated live title',deadlineAt:'1999-01-01T00:00:00Z'}),200);
  assert.equal(edited.status,'PUBLISHED');assert.equal(edited.title,'Updated live title');assert.equal(edited.deadlineAt,deadline.toISOString());
  assert.equal(edited.publishedAt,before.PublishedAt.toISOString());assert.equal(edited.requiresReview,false);
  const again=expect(await req('PATCH',`/enterprise/recruitment/posts/${created.id}`,{content:'Updated without a deadline field'}),200);
  assert.equal(again.deadlineAt,deadline.toISOString());assert.equal(again.status,'PUBLISHED');
  const visible=expect(await req('GET',`/students/me/opportunities?windowId=${registration.WindowID}&limit=100`,undefined,student),200);
  assert(visible.items.some(item=>item.postId===created.id));
 });
 await t.test('QHDN bulk registration opening locks existing edits, but creating a new post stays allowed',async()=>{
  expect(await req('PATCH',`/ojt-registration-windows/${registration.WindowID}`,{status:'OPEN',reason:'Open the bulk OJT intake'},staff),200);
  const before=(await db.query(`SELECT * FROM "RecruitmentPosts" WHERE "PostID"=$1`,[created.id])).rows[0];
  const blocked=await req('PATCH',`/enterprise/recruitment/posts/${created.id}`,{title:'Blocked during registration'});
  expect(blocked,409);assert.equal(blocked.body.errorCode,'RECRUITMENT_EDIT_LOCKED_BY_OJT_REGISTRATION');
  assert.deepEqual((await db.query(`SELECT * FROM "RecruitmentPosts" WHERE "PostID"=$1`,[created.id])).rows[0],before);
  const post=await details(created.id);assert.equal(post.canEdit,false);assert.equal(post.studentRegistrationWindow.id,registration.WindowID);
  const window=expect(await req('GET','/enterprise/recruitment/windows'),200).items.find(item=>item.id===w.WindowID);
  assert.equal(window.canCreate,true);assert.equal(window.canEdit,false);
  const added=expect(await req('POST','/enterprise/recruitment/posts',{...body,title:'Created while students register'}),201);
  assert.equal(added.status,'PUBLISHED');assert.equal(added.canEdit,false);
  expect(await req('PATCH',`/ojt-registration-windows/${registration.WindowID}`,{status:'CLOSED',reason:'Bulk intake finished'},staff),200);
  assert.equal(expect(await req('PATCH',`/enterprise/recruitment/posts/${created.id}`,{title:'Editing unlocked'}),200).status,'PUBLISHED');
 });
 await t.test('future, expired, draft and closed registration windows do not lock editing',async()=>{
  for(const fixture of [
   {status:'OPEN',start:'1 hour',end:'2 hours'},
   {status:'OPEN',start:'-2 hours',end:'-1 hour'},
   {status:'DRAFT',start:'-1 hour',end:'1 hour'},
   {status:'CLOSED',start:'-1 hour',end:'1 hour'},
  ]){
   await db.query(`UPDATE "OJTRegistrationWindows" SET "Status"=$2,"StartsAt"=clock_timestamp()+$3::interval,"EndsAt"=clock_timestamp()+$4::interval WHERE "WindowID"=$1`,[registration.WindowID,fixture.status,fixture.start,fixture.end]);
   assert.equal(expect(await req('PATCH',`/enterprise/recruitment/posts/${created.id}`,{title:'Allowed '+fixture.status+fixture.start}),200).canEdit,true);
  }
  await db.query(`UPDATE "OJTRegistrationWindows" SET "Status"='DRAFT',"StartsAt"=$2,"EndsAt"=$3 WHERE "WindowID"=$1`,[registration.WindowID,registration.StartsAt,registration.EndsAt]);
 });
 await t.test('a registration window for another semester does not lock this enterprise post',async()=>{
  const otherPeriod=(await db.query(`SELECT "AcademicPeriodID" id FROM "AcademicPeriods" WHERE "Kind"='SEMESTER' AND "AcademicPeriodID"<>$1 LIMIT 1`,[w.AcademicPeriodID])).rows[0];
  assert(otherPeriod);
  const otherSemester=await require('../dist/modules/academic/ojt-semester-link').ensureOjtSemesterForPeriod(db,otherPeriod.id);
  const other=(await db.query(`INSERT INTO "OJTRegistrationWindows" ("OJTSemesterID","Name","Scope","AcademicPeriodID","RequiredRelativeSemester","StartsAt","EndsAt","Status","CreatedBy") VALUES ($1,'Other semester bulk intake',$2,$3,6,clock_timestamp()-interval '1 hour',clock_timestamp()+interval '1 hour','OPEN',$4) RETURNING "WindowID" id`,[otherSemester,JSON.stringify(registration.Scope),otherPeriod.id,staff.UserID])).rows[0];
  expect(await req('PATCH',`/enterprise/recruitment/posts/${created.id}`,{title:'Other semester stays independent'}),200);
  await db.query(`UPDATE "OJTRegistrationWindows" SET "Status"='CLOSED' WHERE "WindowID"=$1`,[other.id]);
 });
 await t.test('QHDN posting deadline still blocks expired, closed or not-yet-started enterprise intakes',async()=>{
  await db.query(`UPDATE "RecruitmentWindows" SET "EndsAt"=clock_timestamp()-interval '1 second' WHERE "WindowID"=$1`,[w.WindowID]);
  const expired=await req('PATCH',`/enterprise/recruitment/posts/${created.id}`,{title:'Too late'});expect(expired,409);assert.equal(expired.body.errorCode,'RECRUITMENT_WINDOW_CLOSED');
  expect(await req('POST','/enterprise/recruitment/posts',body),409);
  await db.query(`UPDATE "RecruitmentWindows" SET "EndsAt"=clock_timestamp()+interval '1 hour',"Status"='CLOSED' WHERE "WindowID"=$1`,[w.WindowID]);
  expect(await req('PATCH',`/enterprise/recruitment/posts/${created.id}`,{title:'Intake closed'}),409);
  await db.query(`UPDATE "RecruitmentWindows" SET "Status"='OPEN',"StartsAt"=clock_timestamp()+interval '1 minute' WHERE "WindowID"=$1`,[w.WindowID]);
  expect(await req('PATCH',`/enterprise/recruitment/posts/${created.id}`,{title:'Not open yet'}),409);
  await db.query(`UPDATE "RecruitmentWindows" SET "StartsAt"=clock_timestamp()-interval '1 day' WHERE "WindowID"=$1`,[w.WindowID]);
 });
 await t.test('ownership is enforced and explicit QHDN closures cannot be reopened by editing',async()=>{
  const own=(await db.query(`SELECT "EnterpriseID" id FROM "EnterpriseUsers" WHERE "UserID"=$1`,[ent.UserID])).rows[0].id;
  const other=(await db.query(`INSERT INTO "Enterprises" ("EnterpriseCode","Name","Status") VALUES ('INTEGRATION-OTHER','Other company','ACTIVE') RETURNING "EnterpriseID" id`)).rows[0].id;
  await db.query(`UPDATE "EnterpriseUsers" SET "EnterpriseID"=$2 WHERE "UserID"=$1`,[ent.UserID,other]);
  expect(await req('PATCH',`/enterprise/recruitment/posts/${created.id}`,{title:'Steal'}),404);
  assert.equal(expect(await req('GET',`/enterprise/recruitment/posts?postId=${created.id}`),200).total,0);
  await db.query(`UPDATE "EnterpriseUsers" SET "EnterpriseID"=$2 WHERE "UserID"=$1`,[ent.UserID,own]);
  const closed=expect(await req('POST','/enterprise/recruitment/posts',{...body,title:'Explicit closure fixture'}),201);
  expect(await req('POST',`/recruitment/posts/${closed.id}/close`,{reason:'QHDN explicitly closed'},staff),200);
  const blocked=await req('PATCH',`/enterprise/recruitment/posts/${closed.id}`,{title:'Cannot reopen'});expect(blocked,409);assert.equal(blocked.body.errorCode,'RECRUITMENT_POST_LOCKED');
 });
 let acceptedCandidate,pendingCandidate;
 await t.test('student acceptance still consumes slots atomically without any publication review',async()=>{
  const candidates=(await db.query(`SELECT "CoordinationID" id,"ApplicationID" application_id FROM "StudentEnterpriseCoordination" WHERE "Decision"='PENDING' ORDER BY "CoordinationID" LIMIT 3`)).rows;
  for(const co of candidates){
   await db.query(`UPDATE "StudentEnterpriseCoordination" SET "PositionID"=$2,"ApplicationID"=NULL WHERE "CoordinationID"=$1`,[co.id,created.positions[0].id]);
   await db.query(`UPDATE "JobApplications" SET "PositionID"=$2,"PostID"=$3 WHERE "ApplicationID"=$1`,[co.application_id,created.positions[0].id,created.id]);
   await db.query(`UPDATE "StudentEnterpriseCoordination" SET "ApplicationID"=$2 WHERE "CoordinationID"=$1`,[co.id,co.application_id]);
  }
  const results=await Promise.all(candidates.map(co=>req('PATCH',`/enterprise/candidates/${co.id}/decision`,{decision:'ACCEPTED',reason:'Suitable candidate'})));
  assert.equal(results.filter(r=>r.status===200).length,2,JSON.stringify(results));assert.equal(results.filter(r=>r.status===409).length,1);
  acceptedCandidate=candidates[results.findIndex(r=>r.status===200)].id;pendingCandidate=candidates[results.findIndex(r=>r.status===409)].id;
  assert.equal((await details(created.id)).positions[0].remainingSlots,0);
 });
 await t.test('quota floor protects confirmed students; equal or larger capacity is allowed and failures roll back',async()=>{
  const before=(await db.query(`SELECT * FROM "RecruitmentPosts" WHERE "PostID"=$1`,[created.id])).rows[0];
  const update=(capacity,title)=>req('PATCH',`/enterprise/recruitment/posts/${created.id}`,{...(title?{title}:{}),positions:[{...position,id:created.positions[0].id,capacity}]});
  const below=await update(1,'Must roll back');expect(below,409);assert.equal(below.body.errorCode,'CAPACITY_BELOW_ACCEPTED');
  assert.deepEqual((await db.query(`SELECT * FROM "RecruitmentPosts" WHERE "PostID"=$1`,[created.id])).rows[0],before);
  assert.equal(expect(await update(4),200).positions[0].remainingSlots,2);
  assert.equal(expect(await update(3),200).positions[0].remainingSlots,1);
  const equal=expect(await update(2),200);assert.equal(equal.status,'PUBLISHED');assert.equal(equal.positions[0].remainingSlots,0);
  expect(await req('PATCH',`/enterprise/recruitment/posts/${created.id}`,{positions:[position]}),400);
 });
 await t.test('concurrent quota reduction and acceptance cannot exceed position capacity',async()=>{
  expect(await req('PATCH',`/enterprise/recruitment/posts/${created.id}`,{positions:[{...position,id:created.positions[0].id,capacity:3}]}),200);
  const results=await Promise.all([
   req('PATCH',`/enterprise/recruitment/posts/${created.id}`,{positions:[{...position,id:created.positions[0].id,capacity:2}]}),
   req('PATCH',`/enterprise/candidates/${pendingCandidate}/decision`,{decision:'ACCEPTED',reason:'Concurrent acceptance'}),
  ]);
  assert.equal(results.filter(r=>r.status===200).length,1,JSON.stringify(results));assert.equal(results.filter(r=>r.status===409).length,1);
  const slots=(await db.query(`SELECT p."Capacity" capacity,(SELECT count(*)::int FROM "InternshipAssignments" a WHERE a."PositionID"=p."PositionID" AND COALESCE(UPPER(a."Status"),'ASSIGNED') NOT IN ('CANCELLED','CANCELED')) confirmed FROM "InternshipPositions" p WHERE p."PositionID"=$1`,[created.positions[0].id])).rows[0];
  assert.equal(slots.capacity,slots.confirmed);
 });
 await t.test('opening bulk registration concurrently with editing serializes safely',async()=>{
  // Opening uses the untouched QHDN API and the same academic-calendar transaction lock.
  const results=await Promise.all([
   req('PATCH',`/ojt-registration-windows/${registration.WindowID}`,{status:'OPEN',reason:'Concurrent bulk opening'},staff),
   req('PATCH',`/enterprise/recruitment/posts/${created.id}`,{content:'Concurrent content update'}),
  ]);
  expect(results[0],200);assert([200,409].includes(results[1].status));
  const blocked=await req('PATCH',`/enterprise/recruitment/posts/${created.id}`,{content:'Must now be locked'});expect(blocked,409);assert.equal(blocked.body.errorCode,'RECRUITMENT_EDIT_LOCKED_BY_OJT_REGISTRATION');
  expect(await req('PATCH',`/ojt-registration-windows/${registration.WindowID}`,{status:'CLOSED',reason:'Finish concurrency fixture'},staff),200);
 });
 await t.test('next-round continuation works for directly published posts without changing QHDN imports',async()=>{
  // Keep one enterprise post eligible; the remainder are explicit staff closures.
  await db.query(`UPDATE "RecruitmentPosts" SET "Status"='CLOSED',"ReviewedAt"=clock_timestamp(),"ReviewedBy"=$2 WHERE "EnterpriseManaged" AND "PostID"<>$1`,[created.id,staff.UserID]);
  const imports=(await db.query(`SELECT * FROM "RecruitmentPosts" WHERE NOT "EnterpriseManaged" ORDER BY "PostID"`)).rows;
  await db.query(`UPDATE "RecruitmentWindows" SET "Status"='CLOSED',"EndsAt"=clock_timestamp()-interval '1 minute' WHERE "WindowID"=$1`,[w.WindowID]);
  const next=(await db.query(`INSERT INTO "RecruitmentWindows" ("AcademicPeriodID","OJTSemesterID","Name","StartsAt","EndsAt","Status","CreatedBy") VALUES ($1,$2,'Next enterprise intake',clock_timestamp()-interval '30 seconds',clock_timestamp()+interval '1 hour','OPEN',$3) RETURNING "WindowID" id`,[w.AcademicPeriodID,w.OJTSemesterID,staff.UserID])).rows[0];
  assert.equal(await advanceEnterpriseRecruitment(),0); // Full position cannot advance.
  await db.query(`UPDATE "InternshipAssignments" SET "Status"='CANCELLED' WHERE "CoordinationID"=$1`,[acceptedCandidate]);
  expect(await req('PATCH',`/ojt-registration-windows/${registration.WindowID}`,{status:'OPEN',reason:'Freeze automatic changes during student registration'},staff),200);
  assert.equal(await advanceEnterpriseRecruitment(),0);
  assert.equal((await details(created.id)).windowId,w.WindowID);
  expect(await req('PATCH',`/ojt-registration-windows/${registration.WindowID}`,{status:'CLOSED',reason:'Allow next-round continuation'},staff),200);
  assert.equal(await advanceEnterpriseRecruitment(),1);
  const continued=await details(created.id);assert.equal(continued.windowId,next.id);assert.equal(continued.status,'PUBLISHED');assert.equal(continued.positions[0].id,created.positions[0].id);assert.equal(continued.positions[0].remainingSlots,1);
  assert.equal(await advanceEnterpriseRecruitment(),0);
  assert.deepEqual((await db.query(`SELECT * FROM "RecruitmentPosts" WHERE NOT "EnterpriseManaged" ORDER BY "PostID"`)).rows,imports);
 });
 await t.test('no extra detail/submit/continue/offer routes or global assignment triggers were introduced',async()=>{
  for(const [method,url]of [['GET',`/enterprise/recruitment/posts/${created.id}`],['POST',`/enterprise/recruitment/posts/${created.id}/submit`],['POST',`/enterprise/recruitment/posts/${created.id}/continue`],['GET','/enterprise/recruitment/offers']]){
   const r=await fetch(base+url,{method,headers:{Authorization:'Bearer '+token(ent)}});assert.equal(r.status,404);
  }
  assert.equal((await db.query(`SELECT 1 FROM pg_trigger WHERE NOT tgisinternal AND tgname IN ('TR_EnterpriseCapacity','TR_EnterpriseAssignment')`)).rowCount,0);
 });
});
