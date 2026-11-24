import '../config/env';
import { closeDatabaseConnection } from '../config/database';
import { logger } from '../config/logger';
import { processDueOjtAssessment } from '../modules/eligibility/automatic-assessment.service';

async function run() {
  let completed = 0;
  try {
    while (await processDueOjtAssessment('wait')) completed++;
    logger.info('OJT assessment run finished.', { completed });
  } catch (error) {
    const failure = error as { code?: string; errorCode?: string };
    logger.error('OJT assessment run failed.', {
      completed,
      code: failure?.code ?? failure?.errorCode ?? 'UNKNOWN',
    });
    process.exitCode = 1;
  } finally {
    await closeDatabaseConnection();
  }
}

void run().catch(() => {
  logger.error('Could not close the OJT assessment database connection.');
  process.exitCode = 1;
});
