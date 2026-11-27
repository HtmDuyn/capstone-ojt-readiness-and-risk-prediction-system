// Read-only PostgreSQL verification using CTE fixtures; no tables or rows change.
const assert=require('node:assert/strict');
require('dotenv').config({path:require('node:path').resolve(__dirname,'../.env'),quiet:true});
process.env.DB_POOL_MAX='1';
const {pool}=require('../dist/config/database');
const {studentOpportunitySql}=require('../dist/modules/students/student-opportunity.repository');

const cases=Array.from({length:20},(_,i)=>({id:500000001+i,semester:i===1?2:1,post_status:'PUBLISHED',expired:false,unlimited:false,
 position_status:'OPEN',company_status:'ACTIVE',post_archived:false,position_deleted:false,position_archived:false,company_deleted:false,
 round_status:'OPEN',future_round:false,ended_round:false,legacy:false,is_full:false,wrong_company:false,wrong_semester:false}));
Object.assign(cases[2],{post_status:'DRAFT'});Object.assign(cases[3],{post_status:'PENDING_REVIEW'});
Object.assign(cases[4],{post_status:'CLOSED'});Object.assign(cases[5],{expired:true});
Object.assign(cases[6],{position_status:'CLOSED'});Object.assign(cases[7],{company_status:'INACTIVE'});
Object.assign(cases[8],{post_archived:true});Object.assign(cases[9],{position_deleted:true});
Object.assign(cases[10],{position_archived:true});Object.assign(cases[11],{company_deleted:true});
Object.assign(cases[12],{round_status:'CLOSED'});Object.assign(cases[13],{future_round:true});
Object.assign(cases[14],{ended_round:true});Object.assign(cases[15],{legacy:true});
Object.assign(cases[16],{unlimited:true});Object.assign(cases[17],{is_full:true});
Object.assign(cases[18],{wrong_company:true});Object.assign(cases[19],{wrong_semester:true});
const ctes=`WITH fixtures AS (SELECT * FROM jsonb_to_recordset($4::jsonb) AS x(
 id int,semester int,post_status text,expired boolean,unlimited boolean,position_status text,company_status text,
 post_archived boolean,position_deleted boolean,position_archived boolean,company_deleted boolean,
 round_status text,future_round boolean,ended_round boolean,legacy boolean,is_full boolean,wrong_company boolean,wrong_semester boolean)),
 "InternshipPositions" AS (SELECT id AS "PositionID",semester AS "OJTSemesterID",id AS "EnterpriseID",
  'POS'::text AS "RecruitmentCode",'Intern'::text AS "Title",'Description'::text AS "Description",'Requirements'::text AS "Requirements",
  'Location'::text AS "Location",'ONSITE'::text AS "WorkMode",CASE WHEN is_full THEN 0 ELSE 2 END AS "Capacity",position_status AS "Status",
  CASE WHEN position_deleted THEN now() END AS "DeletedAt",CASE WHEN position_archived THEN now() END AS "ArchivedAt" FROM fixtures),
 "Enterprises" AS (SELECT id AS "EnterpriseID",'Company'::text AS "Name",'Address'::text AS "Address",company_status AS "Status",
  CASE WHEN company_deleted THEN now() END AS "DeletedAt" FROM fixtures),
 "RecruitmentPostPositions" AS (SELECT id AS "PositionID",id AS "PostID" FROM fixtures),
 "RecruitmentPosts" AS (SELECT id AS "PostID",id AS "WindowID",CASE WHEN wrong_company THEN id+1 ELSE id END AS "EnterpriseID",
  CASE WHEN wrong_semester THEN semester+1 ELSE semester END AS "OJTSemesterID",'Published post'::text AS "Title",'Content'::text AS "Content",
  'Benefits'::text AS "Benefits",'Instructions'::text AS "ApplicationInstructions",post_status AS "Status",now()-interval '1 hour' AS "PublishedAt",
  CASE WHEN post_archived THEN now() END AS "ArchivedAt",CASE WHEN unlimited THEN NULL::timestamptz WHEN expired THEN now()-interval '1 day' ELSE now()+interval '1 day' END AS "DeadlineAt" FROM fixtures),
 "RecruitmentWindows" AS (SELECT id AS "WindowID",CASE WHEN legacy THEN NULL::int ELSE 1 END AS "CampaignID",round_status AS "Status",
  CASE WHEN future_round THEN now()+interval '1 hour' ELSE now()-interval '1 day' END AS "StartsAt",
  CASE WHEN ended_round THEN now()-interval '1 hour' ELSE now()+interval '1 day' END AS "EndsAt" FROM fixtures),
 "JobApplications" AS (SELECT NULL::int AS "ApplicationID",NULL::int AS "RegistrationID",NULL::int AS "PositionID",NULL::int AS "PostID" WHERE false),
 "OJTRegistrations" AS (SELECT NULL::int AS "RegistrationID",NULL::int AS "StudentID" WHERE false) `;

(async()=>{
 const c=await pool.connect();try{
  await c.query('BEGIN READ ONLY');await c.query("SET LOCAL statement_timeout='15s'");
  const rows=(await c.query(ctes+studentOpportunitySql+' ORDER BY p."PositionID"',[null,999,null,JSON.stringify(cases)])).rows;
  assert.deepEqual(rows.map(row=>row.id),[500000001,500000002,500000016,500000017,500000018]);
  assert.equal(rows.at(-1).remainingSlots,0);
  console.log('PASS PostgreSQL: published current vacancies across semesters are visible; draft, pending, closed, expired, archived, deleted, inactive, future/closed rounds and mismatched company/semester are excluded.');
  const selected=(await c.query(ctes+studentOpportunitySql,[1,999,500000001,JSON.stringify(cases)])).rows;
  assert.deepEqual(selected.map(row=>row.id),[500000001]);
  const count=(await c.query(ctes+`SELECT count(*)::int AS total FROM (${studentOpportunitySql}) catalog`,[null,999,null,JSON.stringify(cases)])).rows[0].total;
  assert.equal(count,rows.length);console.log('PASS PostgreSQL: exact selected-round filter and catalog total match; no application data is created.');
 }finally{await c.query('ROLLBACK');c.release();}
})().catch(e=>{console.error('Student recruitment SQL check failed:',e.code||e.message);process.exitCode=1;}).finally(()=>pool.end());
