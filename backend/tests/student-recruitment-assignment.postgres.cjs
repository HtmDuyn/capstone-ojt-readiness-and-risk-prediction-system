// Exercise the backend-owned queries using CTEs only; no real rows or views are changed.
const path=require('node:path'),assert=require('node:assert/strict');
require('dotenv').config({path:path.join(__dirname,'../.env'),quiet:true});
const {pool}=require('../dist/config/database');
const {recruitmentRoundForStudentSql,recruitmentRosterSql,recruitmentAccessSql}=require('../dist/modules/eligibility/recruitment-roster.repository');
const selector=recruitmentRoundForStudentSql.replaceAll('public.','');
(async()=>{const c=await pool.connect();try{
 await c.query('BEGIN READ ONLY');
 const student=(await c.query(`SELECT "StudentID" FROM "Students" WHERE "StudentCode"=$1 AND "DeletedAt" IS NULL`,['SE201643'])).rows[0];assert.ok(student);
 const term=(await c.query(`SELECT "OJTSemesterID","AcademicPeriodID" FROM "RecruitmentWindows" WHERE "Status"='OPEN' AND "EndsAt">statement_timestamp() ORDER BY "WindowID" LIMIT 1`)).rows[0];assert.ok(term);
 const sql=`WITH "RecruitmentWindows" AS (SELECT 9000001 AS "WindowID",'Test round'::text AS "Name",$7::int AS "OJTSemesterID",$8::int AS "AcademicPeriodID",
   $1::text AS "Status",$2::timestamptz AS "ResultsFinalizedAt",statement_timestamp()+interval '2 days' AS "EndsAt",
   statement_timestamp()+$3::int*interval '1 day' AS "ApplicationStartsAt",statement_timestamp()+$4::int*interval '1 day' AS "ApplicationEndsAt",statement_timestamp() AS "StartsAt"),
  "OJTRegistrationWindows" AS (SELECT 9000001 AS "RecruitmentRoundID",$9::text AS "Status",$5::jsonb AS "Scope")
  SELECT chosen."WindowID" AS id FROM "Students" s LEFT JOIN LATERAL (${selector}) chosen ON true WHERE s."StudentID"=$6`;
 const cases=[
  {name:'open',status:'OPEN',start:-1,end:1,scope:{},expected:9000001},
  {name:'opened before application starts',status:'OPEN',start:1,end:2,scope:{},expected:9000001},
  {name:'draft',status:'DRAFT',start:-1,end:1,scope:{},expected:null},
  {name:'closed',status:'CLOSED',start:-1,end:1,scope:{},expected:null},
  {name:'expired applications',status:'OPEN',start:-2,end:-1,scope:{},expected:null},
  {name:'finalized',status:'OPEN',start:-1,end:1,scope:{},finalized:new Date(),expected:null},
  {name:'wrong student scope',status:'OPEN',start:-1,end:1,scope:{studentIds:[0]},expected:null},
  {name:'wrong curriculum scope',status:'OPEN',start:-1,end:1,scope:{programIds:[0]},expected:null},
  {name:'wrong major scope',status:'OPEN',start:-1,end:1,scope:{majorIds:[0]},expected:null},
  {name:'wrong cohort scope',status:'OPEN',start:-1,end:1,scope:{cohortIds:[0]},expected:null},
  {name:'wrong group scope',status:'OPEN',start:-1,end:1,scope:{groupCodes:['NO_MATCH']},expected:null},
  {name:'matching student scope',status:'OPEN',start:-1,end:1,scope:{studentIds:[student.StudentID]},expected:9000001},
  {name:'application window closed',status:'OPEN',start:-1,end:1,scope:{},applicationStatus:'CLOSED',expected:null},
 ];
 for(const item of cases){const row=(await c.query(sql,[item.status,item.finalized??null,item.start,item.end,JSON.stringify(item.scope),student.StudentID,term.OJTSemesterID,term.AcademicPeriodID,item.applicationStatus??'OPEN'])).rows[0];assert.equal(row.id,item.expected,item.name);}

 // Test the full eligibility/assignment query, not a mock of the assignment service.
 const baseline=(await c.query(`SELECT to_jsonb(s) AS student,to_jsonb(saved) AS saved
   FROM public."Students" s JOIN public."StudentOJTCalculatedResults" saved USING("StudentID")
   WHERE s."StudentID"=$1`,[student.StudentID])).rows[0];assert.ok(baseline);
 const fullQuery=`WITH "Students" AS (
   SELECT (jsonb_populate_record(NULL::public."Students",$1::jsonb)).*
  ), "StudentOJTCalculatedResults" AS (
   SELECT (jsonb_populate_record(NULL::public."StudentOJTCalculatedResults",$2::jsonb)).*
  ) SELECT "OJTSemesterID","RoundID" FROM (${recruitmentRosterSql.replaceAll('public.','')}) roster
  WHERE "StudentID"=$3 AND "BatchID" IS NOT NULL`;
 const eligibilityCases=[
  {name:'eligible with no application',student:{},saved:{},expected:true},
  {name:'not eligible',student:{},saved:{Status:'NOT_ELIGIBLE'},expected:false},
  {name:'eligibility requires review',student:{},saved:{Status:'REVIEW_REQUIRED'},expected:false},
  {name:'stale eligibility',student:{},saved:{CheckedAt:'2000-01-01T00:00:00Z'},expected:false},
  {name:'curriculum changed',student:{},saved:{ProgramID:null},expected:false},
  {name:'inactive student',student:{Status:'INACTIVE'},saved:{},expected:false},
  {name:'deleted student',student:{DeletedAt:new Date().toISOString()},saved:{},expected:false},
 ];
 for(const item of eligibilityCases){
  const result=await c.query(fullQuery,[JSON.stringify({...baseline.student,...item.student}),JSON.stringify({...baseline.saved,...item.saved}),student.StudentID]);
  assert.equal(result.rowCount>0,item.expected,item.name);
  if(item.expected){assert.equal(result.rows[0].OJTSemesterID,term.OJTSemesterID);assert.ok(result.rows[0].RoundID);}
 }

 // A completed historical dossier stays accessible when the current eligible roster is empty.
 const historical=(await c.query(`SELECT a."StudentID",co."OJTSemesterID"
   FROM "InternshipAssignments" a JOIN "StudentEnterpriseCoordination" co USING("CoordinationID")
   JOIN "OJTRegistrations" r USING("RegistrationID")
   WHERE a."Status"='COMPLETED' AND co."Decision"='ACCEPTED' AND r."Status"='APPROVED' LIMIT 1`)).rows[0];assert.ok(historical);
 const history=(await c.query(`WITH "StudentOJTCalculatedResults" AS (
   SELECT * FROM public."StudentOJTCalculatedResults" WHERE false
  ) SELECT EXISTS(SELECT 1 FROM (${recruitmentAccessSql.replaceAll('public.','')}) access
    WHERE access."StudentID"=$1 AND access."OJTSemesterID"=$2) AS allowed`,[historical.StudentID,historical.OJTSemesterID])).rows[0];
 assert.equal(history.allowed,true,'historical access without current eligibility');
 await c.query('ROLLBACK');console.log(`PASS PostgreSQL: ${cases.length} round/scope cases, ${eligibilityCases.length} full eligibility cases and historical access; backend queries read base tables without the legacy roster/access views. No data changed.`);
 }catch(e){await c.query('ROLLBACK');console.error(e.code||e.message);process.exitCode=1;}finally{c.release();await pool.end();}})();
