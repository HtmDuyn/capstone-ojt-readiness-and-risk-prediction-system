// Read-only diagnostics. Build the backend first; never print credentials or URLs.
const fs=require('node:fs');const path=require('node:path');
if(!fs.existsSync(path.join(__dirname,'../dist/config/database.js'))){console.error('Run npm run build before npm run check:db.');process.exit(1);}
require('../dist/config/env');
const {Client}=require('pg');
const {databaseConfig,pool}=require('../dist/config/database');

async function main(){
 if(!databaseConfig.url)throw Error('Database is not configured.');
 const endpoint=new URL(databaseConfig.url);
 const source=process.env.DATABASE_URL?'DATABASE_URL':process.env.SUPABASE_DATABASE_URL?'SUPABASE_DATABASE_URL':process.env.LOCAL_DATABASE_URL?'LOCAL_DATABASE_URL':'DB_HOST/DB_PORT/DB_NAME';
 console.log(`Configuration: ${source}. Host: ${endpoint.hostname}. Port: ${endpoint.port||'5432'}.`);
 let failures=0;
 for(let attempt=1;attempt<=3;attempt++){
  const client=new Client({connectionString:databaseConfig.url,ssl:databaseConfig.ssl,connectionTimeoutMillis:5000,statement_timeout:5000});
  try{await client.connect();await client.query('SELECT 1');console.log(`Connection ${attempt}/3: OK.`);}
  catch(error){
   failures++;
   const code=String(error.code||'CONNECTION_FAILED').replace(/[^A-Za-z0-9_]/g,'').slice(0,80);
   console.error(`Connection ${attempt}/3: ${code}.`);
   if(['ENOTFOUND','EAI_AGAIN'].includes(code))console.error('DNS lookup failed. Verify the host in Supabase Connect and check DNS/network access.');
  }finally{await client.end().catch(()=>{});}
 }
 process.exitCode=failures?1:0;
}
main().catch(()=>{console.error('Invalid database configuration. Check the configured connection URL; credentials are hidden.');process.exitCode=1;}).finally(()=>pool?.end());
