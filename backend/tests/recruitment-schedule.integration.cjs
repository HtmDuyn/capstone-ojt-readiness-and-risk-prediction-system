const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {Client}=require('pg');
const target=process.env.RECRUITMENT_SCHEDULE_TEST_DATABASE_URL;
if(!target)throw Error('Set RECRUITMENT_SCHEDULE_TEST_DATABASE_URL.');
const address=new URL(target);
if(address.hostname!=='127.0.0.1'||address.port!=='55441'||address.pathname!=='/qhdn_schedule_test')throw Error('Refusing a non-disposable database.');
delete process.env.DATABASE_URL;delete process.env.SUPABASE_DATABASE_URL;
process.env.LOCAL_DATABASE_URL=target;process.env.DB_SSL='false';
process.env.JWT_SECRET='qhdn-schedule-disposable-test-only';

test('QHDN schedule editing, deletion, synchronization and opening history are enforced in PostgreSQL',async t=>{
 const db=new Client({connectionString:target});await db.connect();t.after(()=>db.end());
 // This database name and loopback port are explicitly restricted above.
 await db.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public');
 const sql=fs.readFileSync(path.join(__dirname,'../DB'),'utf8');await db.query(sql);
 const {pool}=require('../dist/config/database');t.after(()=>pool.end());
 const {saveWindow,listWindows}=require('../dist/modules/recruitment/window.service');
 const {editWindowSchedule,deleteDraftWindow}=require('../dist/modules/recruitment/schedule.service');
 const express=require('express'),jwt=require('jsonwebtoken');
 const app=express();app.use(express.json());app.use('/api/recruitment',require('../dist/modules/recruitment/recruitment.routes').default);
 app.use((error,req,res,next)=>res.status(error.statusCode||error.status||500).json({message:error.message,errorCode:error.errorCode}));
 const server=await new Promise(resolve=>{const listener=app.listen(0,'127.0.0.1',()=>resolve(listener));});
 t.after(()=>new Promise(resolve=>server.close(resolve)));
 const url='http://127.0.0.1:'+server.address().port+'/api/recruitment/windows/1';
 const accounts=(await db.query(`SELECT u."UserID",u."Username",u."AuthVersion",r."RoleCode" FROM "Users" u JOIN "Roles" r USING("RoleID") WHERE r."RoleCode" IN ('ADMIN','ACADEMIC','ENTERPRISE','STUDENT','OJT_COORD') AND u."Status"='ACTIVE' AND NOT u."MustChangePassword"`)).rows;
 for(const role of ['ADMIN','ACADEMIC','ENTERPRISE','STUDENT']){
  const account=accounts.find(a=>a.RoleCode===role);assert.ok(account);
  const token=jwt.sign({userId:account.UserID,username:account.Username,authVersion:account.AuthVersion},process.env.JWT_SECRET);
  for(const [method,endpoint] of [['PATCH',url+'/schedule'],['DELETE',url]]){
   const response=await fetch(endpoint,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:'{}'});
   assert.equal(response.status,403,role+' cannot use QHDN schedule actions');
  }
 }
 const actor=(await db.query(`SELECT "UserID" FROM "Users" WHERE "Username"='ojt.coord01'`)).rows[0].UserID;
 const year=(await db.query(`INSERT INTO "AcademicYears" ("YearCode","StartDate","EndDate","Status") VALUES ('SCHEDULE-2031','2031-01-01','2031-12-31','PLANNED') RETURNING "AcademicYearID"`)).rows[0].AcademicYearID;
 const period=(await db.query(`INSERT INTO "AcademicPeriods" ("AcademicYearID","PeriodCode","Name","Kind","StartDate","EndDate","Status") VALUES ($1,'SCHEDULE-2031-SEM','Schedule test','SEMESTER','2031-01-01','2031-06-30','PLANNED') RETURNING "AcademicPeriodID"`,[year])).rows[0].AcademicPeriodID;
 const schedule={postingStartsAt:'2031-01-02T00:00:00Z',postingEndsAt:'2031-01-03T00:00:00Z',applicationStartsAt:'2031-01-03T00:00:00Z',applicationEndsAt:'2031-01-10T00:00:00Z',resultsStartsAt:'2031-01-04T00:00:00Z',resultsEndsAt:'2031-01-10T00:00:00Z'};
 const body={academicPeriodId:period,name:'Original',startsAt:schedule.postingStartsAt,endsAt:schedule.resultsEndsAt,rounds:[{name:'Original',...schedule}]};
 const first=(await saveWindow(body,actor)).rounds[0];
 await deleteDraftWindow(first.id,{reason:'Correct a draft'},actor);
 assert.equal((await listWindows({academicPeriodId:period})).campaigns.length,0);
 const round=(await saveWindow(body,actor)).rounds[0];
 const edit={...schedule,name:'Updated',reason:'Correct dates',postingStartsAt:'2031-01-01T12:00:00Z',resultsStartsAt:'2031-01-05T00:00:00Z',applicationEndsAt:'2031-01-09T00:00:00Z',resultsEndsAt:'2031-01-09T00:00:00Z'};
 await editWindowSchedule(round.id,edit,actor);
 assert.equal(+(await db.query('SELECT "ResultsStartsAt" FROM "RecruitmentWindows" WHERE "WindowID"=$1',[round.id])).rows[0].ResultsStartsAt,+new Date(edit.resultsStartsAt));
 const linked=(await db.query('SELECT * FROM "OJTRegistrationWindows" WHERE "RecruitmentRoundID"=$1',[round.id])).rows[0];
 assert.equal(linked.Name,'Updated');assert.equal(+linked.EndsAt,+new Date(edit.applicationEndsAt));
 const campaign=(await listWindows({academicPeriodId:period})).campaigns[0];
 assert.equal(+new Date(campaign.startsAt),+new Date(edit.postingStartsAt));
 assert.equal(+new Date(campaign.endsAt),+new Date(edit.resultsEndsAt));
 await saveWindow({status:'OPEN',reason:'Open in advance'},actor,round.id);
 const opened=(await db.query('SELECT "OpenedAt" FROM "RecruitmentWindows" WHERE "WindowID"=$1',[round.id])).rows[0].OpenedAt;
 assert.ok(opened);
 await assert.rejects(deleteDraftWindow(round.id,{reason:'Cannot delete opened'},actor),e=>e.errorCode==='RECRUITMENT_DELETE_LOCKED');
 await assert.rejects(db.query('DELETE FROM "RecruitmentWindows" WHERE "WindowID"=$1',[round.id]),e=>e.code==='23514');
 await assert.rejects(db.query('UPDATE "RecruitmentWindows" SET "Status"=\'DRAFT\' WHERE "WindowID"=$1',[round.id]),e=>e.code==='23514');
 await assert.rejects(db.query('UPDATE "RecruitmentWindows" SET "OpenedAt"=NULL WHERE "WindowID"=$1',[round.id]),e=>e.code==='23514');
 const later={...edit,applicationEndsAt:'2031-01-11T00:00:00Z',resultsEndsAt:'2031-01-11T00:00:00Z'};
 await editWindowSchedule(round.id,later,actor);
 assert.ok((await db.query(`SELECT 1 FROM "Notifications" WHERE "RelatedEntityID"=$1 AND "RelatedEntityType"='RECRUITMENT_WINDOW'`,[round.id])).rowCount);
 await saveWindow({status:'CLOSED',reason:'Close'},actor,round.id);
 await assert.rejects(editWindowSchedule(round.id,later,actor),e=>e.errorCode==='RECRUITMENT_SCHEDULE_LOCKED');
 await assert.rejects(deleteDraftWindow(round.id,{reason:'Closed still has history'},actor),e=>e.errorCode==='RECRUITMENT_DELETE_LOCKED');
 // Reapplying the additive block preserves the first opening marker.
 await db.query(sql.slice(sql.lastIndexOf('-- BEGIN OJT QHDN SCHEDULE EDITING V5')));
 assert.equal(+(await db.query('SELECT "OpenedAt" FROM "RecruitmentWindows" WHERE "WindowID"=$1',[round.id])).rows[0].OpenedAt,+opened);
});
