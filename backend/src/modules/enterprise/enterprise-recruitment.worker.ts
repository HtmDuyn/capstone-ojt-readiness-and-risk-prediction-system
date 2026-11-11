import { pool } from '../../config/database';
import { logger } from '../../config/logger';
import { academicTransaction } from '../academic/academic.repository';

// Operates exclusively on posts explicitly submitted through the enterprise API.
export async function advanceEnterpriseRecruitment() {
  return academicTransaction(async c => {
    let carried=0;
    if((await c.query(`SELECT to_regprocedure('public."CarryForwardRecruitmentPosts"(integer)') IS NOT NULL AS ready`)).rows[0].ready){
      const windows=(await c.query(`SELECT "WindowID" FROM "RecruitmentWindows" WHERE "Status"='OPEN' AND "PostingStartsAt"<=clock_timestamp() AND "PostingEndsAt">clock_timestamp()`)).rows;
      for(const w of windows)carried+=Number((await c.query('SELECT public."CarryForwardRecruitmentPosts"($1) AS n',[w.WindowID])).rows[0].n);
    }
    const result = await c.query('SELECT public."AdvanceEnterpriseRecruitment"() AS continued');
    return Number(result.rows[0].continued)+carried;
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
