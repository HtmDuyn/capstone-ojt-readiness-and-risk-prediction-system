// Read the additive admin section from the single centralized backend/DB schema.
require('dotenv').config({path:require('node:path').join(__dirname,'../.env')});
const fs=require('node:fs');
const {pool}=require('../dist/config/database');
(async()=>{
 if(!pool)throw new Error('Configure the backend database connection.');
 const c=await pool.connect();
 try{
  await c.query("SELECT pg_advisory_lock(hashtext('admin-api-migration'))");
  const result=await c.query('SELECT 1 FROM "SchemaMigrations" WHERE "Version"=$1',['20261008_admin_api']);
  if(result.rowCount){console.log('Admin API migration is already installed.');return;}
  const schema=fs.readFileSync(require('node:path').join(__dirname,'../DB'),'utf8');
  const marker='-- SECTION: Admin management APIs';
  const offset=schema.indexOf(marker);
  if(offset<0||schema.indexOf(marker,offset+marker.length)>=0)throw new Error('Expected one Admin management APIs section in backend/DB.');
  await c.query(schema.slice(offset));
  console.log('Admin API migration installed.');
 }catch(error){await c.query('ROLLBACK');throw error;}
 finally{await c.query("SELECT pg_advisory_unlock(hashtext('admin-api-migration'))");c.release();}
})().catch(error=>{console.error('Admin migration failed:',error.message);process.exitCode=1;}).finally(async()=>{await pool?.end();});
