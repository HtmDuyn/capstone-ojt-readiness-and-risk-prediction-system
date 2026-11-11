// Full-reset audit against a disposable local database only; never use a deployed URL.
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const {Client}=require('pg');
const target=process.env.DB_BOOTSTRAP_TEST_DATABASE_URL;if(!target)throw Error('Set DB_BOOTSTRAP_TEST_DATABASE_URL.');
const u=new URL(target);if(u.hostname!=='127.0.0.1'||u.port!=='55441'||u.pathname!=='ojt_bootstrap_audit'&&u.pathname!=='/ojt_bootstrap_audit')throw Error('Refusing a non-disposable database.');
test('whole DB bootstrap supports fresh/repeated runs, grants and protected external dependencies',async t=>{
 const db=new Client({connectionString:target});await db.connect();t.after(()=>db.end());
 const sql=fs.readFileSync(path.join(__dirname,'../DB'),'utf8');
 const relations=[...new Set([...sql.matchAll(/CREATE (?:OR REPLACE )?(?:TABLE|VIEW|MATERIALIZED VIEW)(?: IF NOT EXISTS)?\s+(?:public\.)?"([^"]+)"/g)].map(m=>m[1]))];
 for(const role of ['anon','authenticated','service_role'])if(!(await db.query('SELECT 1 FROM pg_roles WHERE rolname=$1',[role])).rowCount)await db.query(`CREATE ROLE "${role}" NOLOGIN ${role==='service_role'?'BYPASSRLS':''}`);
 await db.query(`CREATE SCHEMA IF NOT EXISTS auth; CREATE TABLE IF NOT EXISTS auth._bootstrap_audit_sentinel (id integer PRIMARY KEY); INSERT INTO auth._bootstrap_audit_sentinel VALUES(1) ON CONFLICT DO NOTHING;
  CREATE TABLE IF NOT EXISTS public._bootstrap_unrelated (id integer PRIMARY KEY); INSERT INTO public._bootstrap_unrelated VALUES(1) ON CONFLICT DO NOTHING`);
 for(let run=0;run<2;run++){
  await db.query(sql);
  assert.equal((await db.query('SELECT count(*)::int n FROM "Students"')).rows[0].n,20);
  assert.equal((await db.query('SELECT count(*)::int n FROM auth._bootstrap_audit_sentinel')).rows[0].n,1);
  assert.equal((await db.query('SELECT count(*)::int n FROM public._bootstrap_unrelated')).rows[0].n,1);
  const unprotected=(await db.query(`SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p') AND c.relname=ANY($1::text[]) AND NOT c.relrowsecurity`,[relations])).rows;
  assert.deepEqual(unprotected,[],'Application tables require RLS');
  for(const role of ['anon','authenticated']){
   await db.query(`SET ROLE "${role}"`);
   await assert.rejects(db.query('SELECT * FROM public."Students" LIMIT 1'),e=>e.code==='42501');
   await db.query('RESET ROLE');
  }
  await db.query('SET ROLE service_role');
  assert.equal((await db.query('SELECT count(*)::int n FROM public."Students"')).rows[0].n,20);
  await db.query('SELECT public."RecruitmentOccupiedSlots"("PositionID") FROM public."InternshipPositions" LIMIT 1');
  await db.query('RESET ROLE');
 }
 await db.query(`CREATE TABLE public._bootstrap_external_child (id integer PRIMARY KEY,user_id integer REFERENCES public."Users"("UserID")); INSERT INTO public._bootstrap_external_child VALUES(1,1)`);
 await assert.rejects(db.query(sql),e=>e.code==='P0001'&&/protected|external/i.test(e.message),'Reset must reject unrelated public tables that depend on application tables');
 await db.query('ROLLBACK');
 assert.equal((await db.query('SELECT count(*)::int n FROM public._bootstrap_external_child')).rows[0].n,1);
 assert.equal((await db.query('SELECT count(*)::int n FROM public."Students"')).rows[0].n,20);
 await db.query('DROP TABLE public._bootstrap_external_child');
 await db.query(`CREATE TABLE auth._bootstrap_external_child (user_id integer REFERENCES public."Users"("UserID"))`);
 await assert.rejects(db.query(sql),e=>e.code==='P0001');await db.query('ROLLBACK');
 await db.query('DROP TABLE auth._bootstrap_external_child');
 const counts=(await db.query(`SELECT (SELECT count(*) FROM "Students") AS students,(SELECT count(*) FROM "StudentCourseResults") AS grades,(SELECT count(*) FROM "RecruitmentWindows") AS demo_rounds,(SELECT count(*) FROM "JobApplications") AS demo_applications`)).rows[0];
 console.log('Bootstrap audit counts:',JSON.stringify(counts));
});
