require('dotenv').config({path:require('node:path').join(__dirname,'../.env'),quiet:true});
const fs=require('node:fs');
const path=require('node:path');
const {pool}=require('../dist/config/database');
(async()=>{
 if(!pool)throw Error('Configure the backend database connection.');
 const source=fs.readFileSync(path.join(__dirname,'../DB'),'utf8');
 const start=source.indexOf('-- BEGIN INCREMENTAL UPDATE: 20261023_academic_rest_resources');
 const end=source.indexOf('-- END INCREMENTAL UPDATE: 20261023_academic_rest_resources',start);
 if(start<0||end<start)throw Error('Academic REST migration boundaries are missing.');
 const c=await pool.connect();
 try{await c.query(source.slice(start,end));console.log('Academic REST migration installed; existing data preserved.');}
 catch(error){await c.query('ROLLBACK');throw error;}finally{c.release();}
})().catch(error=>{console.error(error.message);process.exitCode=1;}).finally(()=>pool?.end());
