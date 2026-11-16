import { expireRecruitment } from '../modules/recruitment/post.service';
import { logger } from '../config/logger';
export function startRecruitmentWorker() {
 let busy=false;
 const tick=async()=>{if(busy)return;busy=true;try{await expireRecruitment();}catch(error){
  const code=String((error as {code?:string})?.code??'UNKNOWN').replace(/[^A-Za-z0-9_]/g,'').slice(0,80);
  logger.error('Recruitment expiry failed.',{code},['ENOTFOUND','EAI_AGAIN'].includes(code)?'Cannot resolve the database hostname. Check DB_HOST or the connection URL and network DNS. The job will retry on its next scheduled run.':'Check database connection and recruitment schema.');
 }finally{busy=false;}};
 const timer=setInterval(()=>void tick(),60000);timer.unref();void tick();
 return ()=>clearInterval(timer);
}
