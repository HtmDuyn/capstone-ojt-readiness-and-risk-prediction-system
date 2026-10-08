import { processEligibilityRunItems } from '../modules/eligibility/eligibility-run.service';
import { logger } from '../config/logger';
export function startEligibilityWorker() {
 let busy=false,stopped=false;
 const tick=async()=>{if(busy||stopped)return;busy=true;try{await processEligibilityRunItems(10);}catch(error){logger.error('Eligibility worker failed; pending items will retry.',error instanceof Error?error.message:'Unknown error');}finally{busy=false;}};
 const timer=setInterval(()=>{void tick();},5000);timer.unref();void tick();return ()=>{stopped=true;clearInterval(timer);};
}
