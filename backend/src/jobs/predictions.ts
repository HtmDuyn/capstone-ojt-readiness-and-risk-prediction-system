import { processPredictionItem } from '../modules/admin/prediction.service';
import { logger } from '../config/logger';
export function startPredictionWorker() {
 let busy=false,stopped=false;
 const tick=async()=>{if(busy||stopped)return;busy=true;try{for(let i=0;i<5&&!stopped;i++)if(!await processPredictionItem())break;}catch(error){logger.error('Prediction worker failed.',error instanceof Error?error.message:'Unknown error');}finally{busy=false;}};
 const timer=setInterval(()=>{void tick();},5000);timer.unref();void tick();return ()=>{stopped=true;clearInterval(timer);};
}
