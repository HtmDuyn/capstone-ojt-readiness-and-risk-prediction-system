import { logger } from '../config/logger';
import { startAutomaticOjtScheduler } from './automatic-ojt';
import { processEligibilityRunItems } from '../modules/eligibility/eligibility-run.service';

export function startEligibilityWorker() {
  let stopped = false;
  let retry: NodeJS.Timeout | undefined;

  // New batch requests finish in their request transaction. The worker only
  // needs to drain batches left pending by older deployments.
  async function drainLegacyRuns() {
    try {
      while (!stopped && await processEligibilityRunItems(10) === 10) {
        // Continue until the queue is empty or shutdown is requested.
      }
    } catch (error) {
      if (stopped) return;
      logger.error('Eligibility worker failed; pending items will retry.', error instanceof Error ? error.message : 'Unknown error');
      retry = setTimeout(() => void drainLegacyRuns(), 30_000);
      retry.unref();
    }
  }

  const stopScheduler = process.env.OJT_ASSESSMENT_TIMER_ENABLED === 'true' ? startAutomaticOjtScheduler() : null;
  void drainLegacyRuns();
  return () => {
    stopped = true;
    clearTimeout(retry);
    stopScheduler?.();
  };
}
