import { logger } from '../config/logger';
import { processDueOjtAssessment } from '../modules/eligibility/automatic-assessment.service';
import { processEligibilityRunItems } from '../modules/eligibility/eligibility-run.service';

export function startEligibilityWorker() {
  let busy = false;
  let stopped = false;
  const tick = async () => {
    if (busy || stopped) return;
    busy = true;
    try {
      await processEligibilityRunItems(10);
    } catch (error) {
      logger.error('Eligibility worker failed; pending items will retry.', error instanceof Error ? error.message : 'Unknown error');
    }
    try {
      if (!stopped) await processDueOjtAssessment();
    } catch (error) {
      if ((error as { code?: string })?.code !== '55P03')
        logger.error('Automatic OJT assessment failed; the milestone will retry.', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      busy = false;
    }
  };
  const timer = setInterval(() => void tick(), 5000);
  timer.unref();
  void tick();
  return () => {
    stopped = true;
    clearInterval(timer);
  };
}
