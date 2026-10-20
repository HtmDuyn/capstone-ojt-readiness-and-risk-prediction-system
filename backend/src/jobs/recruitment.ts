import { expireRecruitment } from '../modules/recruitment/post.service';
import { logger } from '../config/logger';
export function startRecruitmentWorker() {
 let busy=false;
 const tick=async()=>{if(busy)return;busy=true;try{await expireRecruitment();}catch(error){logger.error('Recruitment expiry failed.',error instanceof Error?error.message:'Unknown error');}finally{busy=false;}};
 const timer=setInterval(()=>void tick(),60000);timer.unref();void tick();
 return ()=>clearInterval(timer);
}
