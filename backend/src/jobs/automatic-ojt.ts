import { createDatabaseListener } from '../config/database';
import { logger } from '../config/logger';
import { nextOjtAssessment, processDueOjtAssessment } from '../modules/eligibility/automatic-assessment.service';

const scheduleChannel = 'ojt_assessment_schedule';
const retryDelay = 30_000;
const maxTimerDelay = 2_147_483_647;

export function startAutomaticOjtScheduler() {
  let stopped = false;
  let refreshing = false;
  let dirty = false;
  let alarm: NodeJS.Timeout | undefined;
  let reconnect: NodeJS.Timeout | undefined;
  let listener: ReturnType<typeof createDatabaseListener> = null;

  function arm(delay: number) {
    if (stopped) return;
    clearTimeout(alarm);
    alarm = setTimeout(() => void refresh(), Math.min(Math.max(0, delay), maxTimerDelay));
    alarm.unref();
  }

  function scheduleChanged() {
    if (stopped) return;
    if (refreshing) dirty = true;
    else arm(0);
  }

  async function refresh() {
    refreshing = true;
    try {
      const next = await nextOjtAssessment();
      if (stopped || !next) return;
      const delay = next.dueAt - Date.now();
      if (delay > 0) {
        arm(delay);
        return;
      }
      // Recheck the saved schedule under the shared academic calendar lock.
      const completed = await processDueOjtAssessment();
      arm(completed ? 0 : retryDelay);
    } catch (error) {
      const code = (error as { code?: string })?.code;
      if (code !== '55P03') logger.error('Automatic OJT assessment will retry.', { code });
      arm(retryDelay);
    } finally {
      refreshing = false;
      if (dirty) {
        dirty = false;
        scheduleChanged();
      }
    }
  }

  async function subscribe() {
    if (stopped) return;
    const client = createDatabaseListener();
    if (!client) return;
    listener = client;
    const disconnected = () => {
      if (stopped || listener !== client) return;
      listener = null;
      void client.end().catch(() => {});
      logger.warn('OJT schedule listener disconnected; it will reconnect and reload the saved schedule.');
      reconnect = setTimeout(() => void subscribe(), retryDelay);
      reconnect.unref();
    };
    client.on('error', disconnected);
    client.on('end', disconnected);
    client.on('notification', message => {
      if (message.channel === scheduleChannel) scheduleChanged();
    });
    try {
      await client.connect();
      await client.query(`LISTEN ${scheduleChannel}`);
      scheduleChanged();
    } catch {
      disconnected();
    }
  }

  // Read immediately even if the listener is still connecting, then reread
  // after LISTEN succeeds to cover changes committed during startup.
  scheduleChanged();
  void subscribe();
  return () => {
    stopped = true;
    clearTimeout(alarm);
    clearTimeout(reconnect);
    void listener?.end().catch(() => {});
  };
}
