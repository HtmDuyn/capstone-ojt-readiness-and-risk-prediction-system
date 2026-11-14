import { processJobExtraction } from '../modules/recruitment/job-extraction.service';
import { logger } from '../config/logger';

export function startRecruitmentExtractionWorker() {
  if (process.env.RECRUITMENT_CLAUDE_ENABLED !== 'true') return () => {};
  let busy = false, stopped = false;
  const tick = async () => {
    if (busy || stopped) return;
    busy = true;
    try {
      const result = await processJobExtraction();
      if (result?.errorCode) logger.error('Recruitment extraction failed.', { postId: result.postId, code: result.errorCode });
    } catch (error: any) {
      // Never log provider bodies, recruitment content or API keys.
      logger.error('Recruitment extraction worker failed.', {
        code: String(error.errorCode ?? error.code ?? 'JOB_WORKER_FAILED').replace(/[^A-Za-z0-9_]/g, '').slice(0, 80),
      });
    } finally { busy = false; }
  };
  const timer = setInterval(() => void tick(), 15000);
  timer.unref();
  void tick();
  return () => { stopped = true; clearInterval(timer); };
}
