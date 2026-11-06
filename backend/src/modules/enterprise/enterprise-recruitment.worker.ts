import { pool } from '../../config/database';
import { logger } from '../../config/logger';
import { academicTransaction } from '../academic/academic.repository';

// Operates exclusively on posts explicitly submitted through the enterprise API.
export async function advanceEnterpriseRecruitment() {
  return academicTransaction(async c => {
    const result = await c.query('SELECT public."AdvanceEnterpriseRecruitment"() AS continued');
    return result.rows[0].continued as number;
  });
}

let stopWorker: (() => void) | undefined;
export function startEnterpriseRecruitmentWorker() {
  if (stopWorker) return stopWorker;
  if (!pool || process.env.ENTERPRISE_RECRUITMENT_WORKER_ENABLED === 'false') return () => {};
  let busy = false;
  const timer = setInterval(async () => {
    if (busy) return;
    busy = true;
    try { await advanceEnterpriseRecruitment(); }
    catch (error) { logger.error('Enterprise recruitment continuation failed.',error instanceof Error ? error.message : 'Unknown error'); }
    finally { busy = false; }
  },60000);
  timer.unref();
  const stop = () => {
    if (stopWorker !== stop) return;
    clearInterval(timer);
    process.removeListener('SIGTERM',stop);
    process.removeListener('SIGINT',stop);
    process.removeListener('beforeExit',stop);
    stopWorker = undefined;
  };
  process.once('SIGTERM',stop);
  process.once('SIGINT',stop);
  process.once('beforeExit',stop);
  stopWorker = stop;
  return stop;
}
