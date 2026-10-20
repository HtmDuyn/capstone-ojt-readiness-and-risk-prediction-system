// Read the additive student portal section from the single centralized backend/DB schema.
require('dotenv').config({path:require('node:path').join(__dirname,'../.env')});
const fs=require('node:fs');
const {pool}=require('../dist/config/database');
(async()=>{
 if(!pool)throw new Error('Configure the backend database connection.');
 const c=await pool.connect();
 try{
  await c.query("SELECT pg_advisory_lock(hashtext('student-portal-migration'))");
  const result=await c.query('SELECT 1 FROM "SchemaMigrations" WHERE "Version"=$1',['20261013_student_portal']);
  if(result.rowCount){console.log('Student portal API migration is already installed.');return;}
  const schema=fs.readFileSync(require('node:path').join(__dirname,'../DB'),'utf8');
  const marker='-- SECTION: Semester 5 student portal APIs';
  const offset=schema.indexOf(marker);
  if(offset<0||schema.indexOf(marker,offset+marker.length)>=0)throw new Error('Expected one Semester 5 student portal APIs section in backend/DB.');
  const end=schema.indexOf('-- SECTION:',offset+marker.length);
  await c.query(schema.slice(offset,end<0?undefined:end));
  console.log('Student portal API migration installed.');
 }catch(error){await c.query('ROLLBACK');throw error;}
 finally{await c.query("SELECT pg_advisory_unlock(hashtext('student-portal-migration'))");c.release();}
})().catch(error=>{console.error('Student portal migration failed:',error.message);process.exitCode=1;}).finally(async()=>{await pool?.end();});
