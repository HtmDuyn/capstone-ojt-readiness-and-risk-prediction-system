// Exercise backend recruitment validation on PostgreSQL without the round trigger.
// Every fixture is rolled back; no notifications or real application rows change.
const assert=require('node:assert/strict');
require('dotenv').config({path:require('node:path').resolve(__dirname,'../.env'),quiet:true});
process.env.DB_POOL_MAX='1';
const {pool}=require('../dist/config/database');
async function main(){
 const c=await pool.connect();
 try{
  await c.query('BEGIN');await c.query("SET LOCAL lock_timeout='5s'");await c.query("SET LOCAL statement_timeout='15s'");
  await c.query("SELECT pg_advisory_xact_lock(hashtext('academic-calendar'))");
  assert.equal((await c.query('SELECT public."RecruitmentRoundPolicyVersion"() AS version')).rows[0].version,2);
  assert.equal((await c.query(`SELECT to_regclass('public."UQ_RecruitmentWindows_OpenPeriod"') AS old_index`)).rows[0].old_index,null);
  assert.equal((await c.query(`SELECT to_regprocedure('public."GuardRecruitmentRound"()') AS old_function`)).rows[0].old_function,null);
  assert.equal((await c.query(`SELECT count(*)::int AS n FROM pg_trigger WHERE tgrelid='public."RecruitmentWindows"'::regclass AND tgname='TR_RecruitmentRound'`)).rows[0].n,0);
  const actor=(await c.query(`SELECT u."UserID" FROM "Users" u JOIN "Roles" r USING("RoleID") WHERE u."Status"='ACTIVE' AND r."RoleCode"<>'OJT_COORD' ORDER BY u."UserID" LIMIT 1`)).rows[0].UserID;
  const id=2000000000+Math.floor(Math.random()*100000000),code='MULTI_'+Date.now();
  await c.query(`INSERT INTO "AcademicYears" ("AcademicYearID","YearCode","StartDate","EndDate","Status") OVERRIDING SYSTEM VALUE
   VALUES ($1,$2,current_date-30,current_date+90,'ACTIVE')`,[id,code]);
  await c.query(`INSERT INTO "AcademicPeriods" ("AcademicPeriodID","AcademicYearID","PeriodCode","Name","Kind","StartDate","EndDate","Status") OVERRIDING SYSTEM VALUE
   VALUES ($1,$1,$2,'Multi-round rollback fixture','SEMESTER',current_date-30,current_date+90,'ACTIVE')`,[id,code]);
  await c.query(`INSERT INTO "OJTSemesters" ("OJTSemesterID","AcademicYearID","AcademicPeriodID","SemesterCode","Name","StartDate","EndDate","Status") OVERRIDING SYSTEM VALUE
   VALUES ($1,$1,$1,$2,'Multi-round rollback fixture',current_date-30,current_date+90,'ACTIVE')`,[id,code]);
  await c.query(`INSERT INTO "RecruitmentCampaigns" ("CampaignID","OJTSemesterID","Name","CreatedBy","StartsAt","EndsAt","ScheduleVersion") OVERRIDING SYSTEM VALUE
   VALUES ($1,$1,'Multi-round rollback fixture',$2,(current_date-30)::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh',(current_date+91)::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh',3)`,[id,actor]);
  const base=+(await c.query('SELECT clock_timestamp() AS now')).rows[0].now;
  const hour=3600000;
  async function insert(number,start,end){
   const ps=new Date(start),pe=new Date(start+(end-start)/3),re=new Date(end);
   return c.query(`INSERT INTO "RecruitmentWindows" ("WindowID","AcademicPeriodID","OJTSemesterID","Name","CreatedBy","CampaignID","RoundNumber","StartsAt","EndsAt","PostingStartsAt","PostingEndsAt","ApplicationStartsAt","ApplicationEndsAt","ResultsStartsAt","ResultsEndsAt") OVERRIDING SYSTEM VALUE
    VALUES ($1,$2,$2,'Round rollback fixture',$3,$2,$4,$5,$7,$5,$6,$6,$7,$6,$7)`,[id+number,id,actor,number,ps,pe,re]);
  }
  // Existing current and scheduled rounds are fixture setup, not validation paths.
  await insert(1,base-3*hour,base+5*hour);
  await insert(2,base+5*hour,base+10*hour);
  await c.query(`UPDATE "RecruitmentWindows" SET "Status"='OPEN',"OpenedAt"=clock_timestamp() WHERE "WindowID"=ANY($1::int[])`,[[id+1,id+2]]);
  // Run the real service and its SQL inside nested savepoints, keeping the
  // surrounding rollback transaction. Actor is not QHDN: no notice is queued.
  const connect=pool.connect;
  pool.connect=async()=>({release(){},async query(sql,args){
   if(sql==='BEGIN'){
    await c.query('SAVEPOINT service_call');
    return c.query("SELECT set_config('app.qhdn_schedule_edit','off',true)");
   }
   if(sql==='COMMIT')return c.query('RELEASE SAVEPOINT service_call');
   if(sql==='ROLLBACK')return c.query('ROLLBACK TO SAVEPOINT service_call');
   try{return await c.query(sql,args);}catch(e){
    if(e.code==='23514')console.error('Fixture constraint:',e.constraint||e.message);
    throw e;
   }
  }});
  try{
   const {saveWindow}=require('../dist/modules/recruitment/window.service');
   const {editWindowSchedule,deleteDraftWindow}=require('../dist/modules/recruitment/schedule.service');
   const {extendWindow}=require('../dist/modules/recruitment/lifecycle.service');
   const iso=h=>new Date(base+h*hour).toISOString();
   const schedule={postingStartsAt:iso(10),postingEndsAt:iso(12),applicationStartsAt:iso(12),applicationEndsAt:iso(17),resultsStartsAt:iso(12),resultsEndsAt:iso(18)};
   const input={academicPeriodId:id,name:'Supplemental rollback fixture',supplemental:true,startsAt:iso(10),endsAt:iso(18),rounds:[{name:'Supplemental rollback fixture',...schedule}]};
   const saved=await saveWindow(input,actor);
   assert.equal(saved.id,id);assert.equal(saved.rounds[0].roundNumber,3);
   assert.equal((await c.query('SELECT count(*)::int AS n FROM "OJTRegistrationWindows" WHERE "RecruitmentRoundID"=$1',[saved.rounds[0].id])).rows[0].n,1);
   const opened=await saveWindow({status:'OPEN',reason:'Rollback opening check'},actor,saved.rounds[0].id);
   assert.equal(opened.status,'OPEN');assert.equal(opened.currentPhase,'SCHEDULED');assert.equal(opened.canPost,false);
   const openedAt=(await c.query('SELECT "OpenedAt" FROM "RecruitmentWindows" WHERE "WindowID"=$1',[opened.id])).rows[0].OpenedAt;
   assert.ok(openedAt instanceof Date);
   await saveWindow({name:'Renamed supplemental',reason:'Rollback rename'},actor,opened.id);
   assert.equal(+(await c.query('SELECT "OpenedAt" FROM "RecruitmentWindows" WHERE "WindowID"=$1',[opened.id])).rows[0].OpenedAt,+openedAt);
   await assert.rejects(()=>deleteDraftWindow(opened.id,{reason:'Cannot delete opened'},actor),{errorCode:'RECRUITMENT_DELETE_LOCKED'});
   await assert.rejects(()=>saveWindow(input,actor),{errorCode:'RECRUITMENT_WINDOW_CONFLICT'});
   await assert.rejects(()=>editWindowSchedule(saved.rounds[0].id,{...schedule,name:input.name,reason:'Rollback collision check',postingStartsAt:iso(9)},actor),{errorCode:'RECRUITMENT_WINDOW_CONFLICT'});
   await assert.rejects(()=>editWindowSchedule(saved.rounds[0].id,{...schedule,name:input.name,reason:'Rollback period bounds check',resultsEndsAt:iso(92*24)},actor),{field:'resultsEndsAt'});
   await assert.rejects(()=>extendWindow(id+1,{applicationEndsAt:iso(6),resultsEndsAt:iso(6)},actor),{errorCode:'RECRUITMENT_WINDOW_CONFLICT'});
   await assert.rejects(()=>saveWindow({...input,startsAt:iso(4),rounds:[{...input.rounds[0],postingStartsAt:iso(4)}]},actor),{errorCode:'RECRUITMENT_WINDOW_CONFLICT'});
   await assert.rejects(()=>saveWindow({...input,endsAt:iso(92*24),rounds:[{...input.rounds[0],resultsEndsAt:iso(92*24)}]},actor),{field:'resultsEndsAt'});
   const badPhases={...input.rounds[0],postingStartsAt:iso(20),postingEndsAt:iso(21),applicationStartsAt:iso(21),applicationEndsAt:iso(21),resultsStartsAt:iso(21),resultsEndsAt:iso(24)};
   await assert.rejects(()=>saveWindow({...input,startsAt:iso(20),endsAt:iso(24),rounds:[badPhases]},actor),{errorCode:'RECRUITMENT_PHASE_SCHEDULE_INVALID'});
   const correction={...input.rounds[0],postingStartsAt:iso(19),postingEndsAt:iso(20),applicationStartsAt:iso(20),applicationEndsAt:iso(22),resultsStartsAt:iso(20),resultsEndsAt:iso(24)};
   const corrected=await saveWindow({...input,startsAt:iso(19),endsAt:iso(24),rounds:[correction]},actor);
   assert.equal(corrected.rounds[0].roundNumber,4);
   console.log('PASS PostgreSQL without round trigger: backend controls adjacent multiple rounds, first opening date, immutable opening date, linked application windows, create/edit/extension collisions, period bounds and phase ordering.');
  }finally{pool.connect=connect;}
 }finally{await c.query('ROLLBACK');c.release();}
 console.log('All recruitment fixtures rolled back.');
}
main().catch(e=>{console.error('Recruitment PostgreSQL check failed:',e.code||e.message);process.exitCode=1;}).finally(()=>pool.end());
