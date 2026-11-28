// Only CTE fixtures and temporary application rows; no production data writes.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
require('dotenv').config({path:path.join(__dirname,'../.env'),quiet:true});
const {pool}=require('../dist/config/database');
const source=fs.readFileSync(path.join(__dirname,'../src/modules/students/ojt-application-policy.ts'),'utf8');
const sql=source.match(/c\.query\(`(SELECT[\s\S]*?)`, \[studentId\]/)[1];
const ctes=`WITH fixture AS (SELECT * FROM jsonb_to_recordset($2::jsonb) AS f(id int,score numeric,status text,official numeric,outcome text,enterprise numeric,details jsonb)),
 "Courses" AS (SELECT 1 AS "CourseID",'OJT202'::text AS "CourseCode"),
 "StudentCourseResults" AS (SELECT id AS "StudentID",1 AS "CourseID",score AS "Score",status AS "Status" FROM fixture),
 "OJTResults" AS (SELECT id AS "StudentID",official AS "OfficialScore",outcome AS "Outcome" FROM fixture),
 "InternshipAssignments" AS (SELECT id AS "AssignmentID",id AS "StudentID" FROM fixture),
 "InternshipEvaluations" AS (SELECT id AS "AssignmentID",enterprise AS "OverallScore",NULL::numeric AS "CompletionScore",NULL::numeric AS "SkillScore",NULL::numeric AS "AttitudeScore",details AS "ScoreDetails" FROM fixture) `;
const cases=[{id:1,status:'IN_PROGRESS',graded:false,passed:false},{id:2,score:0,status:'FAILED',graded:true,passed:false},
 {id:3,status:'PASSED',graded:false,passed:true},{id:4,official:0,graded:true,passed:false},{id:5,enterprise:8.5,graded:true,passed:false},
 {id:6,details:{completion:0,attitude:null},graded:true,passed:false},{id:7,details:{completion:null},graded:false,passed:false},{id:8,outcome:'PASSED',graded:false,passed:true}];
(async()=>{const c=await pool.connect();try{
 await c.query('BEGIN READ ONLY');
 for(const item of cases){const row=(await c.query(ctes+sql,[item.id,JSON.stringify(cases)])).rows[0];assert.equal(row.hasOjtScore,item.graded);assert.equal(row.hasPassedOjt,item.passed);}
 const opportunitySql=require('../dist/modules/students/student-opportunity.repository').studentOpportunitySql;
 const previousPostSql=opportunitySql.match(/\((SELECT app\."ApplicationID"[\s\S]*?)\) AS "applicationId"/)[1];
 const previous=(await c.query(`WITH "JobApplications" AS (
   SELECT 1 AS "ApplicationID",1 AS "RegistrationID",31 AS "PostID",21 AS "PositionID"),
   "OJTRegistrations" AS (SELECT 1 AS "RegistrationID",10 AS "StudentID")
   SELECT p."PositionID" AS position,post."PostID" AS post,(${previousPostSql}) AS previous
   FROM (VALUES(21),(22)) p("PositionID") CROSS JOIN (VALUES(31),(32)) post("PostID")
   WHERE $1::int IS NULL ORDER BY post."PostID",p."PositionID"`,[null,10])).rows;
 assert.deepEqual(previous,[{position:21,post:31,previous:1},{position:22,post:31,previous:null},{position:21,post:32,previous:null},{position:22,post:32,previous:null}]);
 const index=(await c.query(`SELECT pg_get_indexdef(indexrelid) AS definition FROM pg_index WHERE indexrelid='public."UQ_JobApplications_ActiveRegistration"'::regclass AND indisvalid AND indisunique`)).rows[0];assert.ok(index);
 assert.equal((await c.query(`SELECT 1 FROM pg_constraint WHERE conrelid='public."JobApplications"'::regclass AND conname='JobApplications_RegistrationID_PostID_PositionID_key'`)).rowCount,0);
 await c.query('ROLLBACK');await c.query('BEGIN');
 await c.query(`CREATE TEMP TABLE "JobApplications" ("ApplicationID" int,"RegistrationID" int,"PostID" int,"PositionID" int,"Status" text,"ApplicationSnapshot" jsonb) ON COMMIT DROP`);
 await c.query(index.definition.replace('public."JobApplications"','pg_temp."JobApplications"'));
 await c.query(`INSERT INTO pg_temp."JobApplications" VALUES (1,1,31,21,'REJECTED','{"original":true}'),(2,1,32,21,'SUBMITTED','{"new":true}')`);
 await c.query('SAVEPOINT duplicate');
 await assert.rejects(c.query(`INSERT INTO pg_temp."JobApplications" VALUES (3,1,32,22,'SUBMITTED','{}')`),{code:'23505'});
 await c.query('ROLLBACK TO SAVEPOINT duplicate');
 assert.deepEqual((await c.query(`SELECT "ApplicationSnapshot" AS snapshot FROM pg_temp."JobApplications" WHERE "ApplicationID"=1`)).rows[0].snapshot,{original:true});
 await c.query(`UPDATE pg_temp."JobApplications" SET "Status"='REJECTED' WHERE "ApplicationID"=2`);
 await c.query(`INSERT INTO pg_temp."JobApplications" VALUES (3,1,33,21,'SUBMITTED','{"newPost":true}')`);
 assert.equal((await c.query(`SELECT count(*)::int AS n FROM pg_temp."JobApplications"`)).rows[0].n,3);
 await c.query('ROLLBACK');console.log('PASS PostgreSQL: score/pass gates including zero and criterion scores; a new post keeps rejected history; a second active application is rejected. No production data changed.');
 }catch(e){await c.query('ROLLBACK');console.error(e.code||e.message);process.exitCode=1;}finally{c.release();await pool.end();}})();
