// Update application constraints only; never reset or rewrite existing records.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
require('dotenv').config({path:path.join(__dirname,'../.env'),quiet:true});
const {pool}=require('../dist/config/database');
async function main(){
 if(!pool)throw Error('Database is not configured.');
 const source=fs.readFileSync(path.join(__dirname,'../../db/database'),'utf8');
 const start='-- BEGIN STUDENT APPLICATION RESUBMISSION',end='-- END STUDENT APPLICATION RESUBMISSION';
 assert.equal(source.split(start).length,2);assert.equal(source.split(end).length,2);
 const block=source.split(start)[1].split(end)[0];
 if(!block.trim()||/\b(DELETE|TRUNCATE|UPDATE)\b|DROP\s+(TABLE|SCHEMA|DATABASE)/i.test(block))throw Error('Invalid constraint migration.');
 const c=await pool.connect();try{
  await c.query('BEGIN');await c.query("SET LOCAL lock_timeout='5s'");await c.query("SET LOCAL statement_timeout='30s'");
  const duplicate=(await c.query(`SELECT 1 FROM "JobApplications" WHERE "Status"<>'REJECTED'
    GROUP BY "RegistrationID" HAVING count(*)>1 LIMIT 1`)).rows[0];
  if(duplicate)throw Error('DUPLICATE_ACTIVE_APPLICATIONS');
  await c.query(block);
  const index=(await c.query(`SELECT indisvalid,indisunique FROM pg_index
    WHERE indexrelid='public."UQ_JobApplications_ActiveRegistration"'::regclass`)).rows[0];
  assert.ok(index?.indisvalid&&index?.indisunique);
  await c.query('COMMIT');console.log('Student application constraints updated; existing applications and rejection history preserved.');
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}
main().catch(e=>{console.error('Student application migration failed:',e.code||'MIGRATION_FAILED');process.exitCode=1;}).finally(()=>pool?.end());
