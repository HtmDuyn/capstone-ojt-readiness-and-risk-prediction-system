import { academicAlertEmailIsCurrent } from '../modules/academic-reporting/notification.service';
import { mailConfig } from '../config/mail';
import { createMailTransport } from '../shared/mail-transport';
import { pool, query } from '../config/database';
import { logger } from '../config/logger';
import { decryptEmail, emailKey } from '../modules/imports/email.crypto';
import { queueDueDeadlineNotices, scheduleEmailIsCurrent } from '../modules/recruitment/notification.service';
import { registerEmailWakeup } from './email-wakeup';
export { scheduleAccountEmailDelivery } from './email-wakeup';

export async function deliverEmails(options: { emailIds?: string[]; maxMessages?: number; deadlineAt?: number } = {}) {
  // Retire secrets even if SMTP is unavailable.
  await query(`UPDATE "EmailOutbox" e SET "Status"='CANCELLED',"EncryptedPayload"=NULL,"LeaseUntil"=NULL
    WHERE e."EncryptedPayload" IS NOT NULL AND (e."ExpiresAt"<=now() OR EXISTS (
      SELECT 1 FROM "Users" u WHERE u."UserID"=e."UserID" AND (u."Status"<>'ACTIVE' OR lower(u."Email")<>lower(e."Recipient") OR (e."Kind"='ACCOUNT' AND (NOT u."MustChangePassword" OR u."TemporaryPasswordExpiresAt" IS NULL OR u."TemporaryPasswordExpiresAt"<=now()))))
      OR (e."Kind"='COMBO_REMINDER' AND EXISTS (SELECT 1 FROM "ComboReminderDeliveries" d JOIN "ComboRegistrationWindows" w ON w."WindowID"=d."WindowID" JOIN "ComboReminderBatches" b ON b."BatchID"=d."BatchID" WHERE d."EmailID"=e."EmailID" AND (w."Status"<>'OPEN' OR (b."Summary"->>'target'='MISSING' AND EXISTS (SELECT 1 FROM "StudentComboSelectionEvents" s WHERE s."WindowID"=d."WindowID" AND s."StudentID"=d."StudentID" AND s."EventType"='SUBMITTED'))))))`);
  let config;
  try { config = mailConfig(); }
  catch (error) {
    const code = String((error as {code?: string})?.code ?? 'MAIL_NOT_CONFIGURED').replace(/[^A-Za-z0-9_]/g, '').slice(0,80);
    console.error(`Email delivery is not configured. Code: ${code}. Pending email is retained.`);
    return 0;
  }
  emailKey();
  const transport = createMailTransport(config);
  let sent = 0;
  const attemptedIds: string[] = [];
  try {
    for (let i = 0; i < (options.maxMessages ?? 20); i++) {
      if (options.deadlineAt !== undefined && Date.now() >= options.deadlineAt) break;
      const row = await query(`WITH candidate AS (
        SELECT "EmailID" FROM "EmailOutbox" WHERE "ExpiresAt">now() AND "Attempts"<5
        AND ($1::bigint[] IS NULL OR "EmailID"=ANY($1::bigint[]))
        AND NOT ("EmailID"=ANY($2::bigint[]))
        AND (("Status"='PENDING' AND ("NextAttemptAt"<=now() OR "LastError" IS NOT NULL))
          OR ("Status"='SENDING' AND "LeaseUntil"<now()))
        ORDER BY "EmailID" FOR UPDATE SKIP LOCKED LIMIT 1
      ) UPDATE "EmailOutbox" e SET "Status"='SENDING',"Attempts"="Attempts"+1,"LeaseUntil"=now()+interval '5 minutes'
        FROM candidate c WHERE e."EmailID"=c."EmailID" RETURNING e.*`, [options.emailIds ?? null, attemptedIds]);
      if (!row.rows.length) break;
      const e = row.rows[0];
      attemptedIds.push(String(e.EmailID));
      try {
        if (e.Kind === 'ACADEMIC_ALERT' && !(await academicAlertEmailIsCurrent(e.EmailID))) {
          await query(`UPDATE "EmailOutbox" SET "Status"='CANCELLED',"EncryptedPayload"=NULL,"LeaseUntil"=NULL WHERE "EmailID"=$1`,[e.EmailID]);
          continue;
        }
        const message = decryptEmail(e.EncryptedPayload);
        if (message.guard && !(await scheduleEmailIsCurrent(message.guard))) {
          await query(`UPDATE "EmailOutbox" SET "Status"='CANCELLED',"EncryptedPayload"=NULL,"LeaseUntil"=NULL WHERE "EmailID"=$1 AND "Status"='SENDING'`, [e.EmailID]);
          continue;
        }
        await transport.send({ to: e.Recipient, subject: message.subject, text: message.text, html: message.html, reference: String(e.EmailID) });
        logger.info('Email accepted by provider.', {
          emailId: String(e.EmailID),
          provider: config.provider,
          runtime: process.env.RENDER === 'true' ? 'render' : 'non-render',
          pid: process.pid,
        });
        await query('UPDATE "EmailOutbox" SET "Status"=\'SENT\',"SentAt"=now(),"EncryptedPayload"=NULL,"LeaseUntil"=NULL,"LastError"=NULL WHERE "EmailID"=$1 AND "Status"=\'SENDING\'', [e.EmailID]);
        sent++;
      } catch (error: any) {
        // Never persist provider responses or email content: they may include credentials.
        const knownCodes = ['EAUTH', 'ECONNECTION', 'ETIMEDOUT', 'ESOCKET', 'ETLS', 'EENVELOPE',
          'EMESSAGE', 'EDNS', 'EMAIL_REJECTED', 'BREVO_FORBIDDEN', 'BREVO_RATE_LIMIT',
          'BREVO_UNAVAILABLE', 'BREVO_REJECTED', 'BREVO_INVALID_RESPONSE'];
        const errorCode = knownCodes.includes(error?.code) ? error.code : 'EMAIL_DELIVERY_FAILED';
        const responseCode = Number.isInteger(error?.responseCode) && error.responseCode >= 400 && error.responseCode <= 599
          ? error.responseCode : undefined;
        const lastError = responseCode ? `${errorCode}_${responseCode}` : errorCode;
        // Provider authentication, permissions and rate limits affect all recipients.
        // End this pass without exhausting attempts. The next pass can retry immediately.
        if (['EAUTH', 'BREVO_FORBIDDEN', 'BREVO_RATE_LIMIT'].includes(errorCode)) {
          await query(`UPDATE "EmailOutbox" SET "Status"='PENDING',"Attempts"=GREATEST("Attempts"-1,0),
            "LeaseUntil"=NULL,"NextAttemptAt"=now(),"LastError"=$2 WHERE "EmailID"=$1 AND "Status"='SENDING'`, [e.EmailID, lastError]);
          if (lastError !== e.LastError) {
            const guidance = errorCode === 'BREVO_RATE_LIMIT' ? 'Brevo rate limit reached.'
              : config.provider === 'brevo' ? 'Check the Brevo API key and transactional email permissions.'
                : 'Check SMTP authentication.';
            console.error(`Email delivery failed. EmailID=${e.EmailID}, provider=${config.provider}, code=${lastError}. ${guidance} Will retry on the next email worker run.`);
          }
          break;
        }
        await query(`UPDATE "EmailOutbox" SET "Status"=CASE WHEN "Attempts">=5 THEN 'FAILED' ELSE 'PENDING' END,
          "LeaseUntil"=NULL,"NextAttemptAt"=now(),"LastError"=$2 WHERE "EmailID"=$1 AND "Status"='SENDING'`, [e.EmailID, lastError]);
        console.error(`Email delivery failed. EmailID=${e.EmailID}, code=${lastError}.`);
      }
    }
    await query(`UPDATE "EmailOutbox" SET "Status"='FAILED',"LeaseUntil"=NULL,"LastError"='DELIVERY_LEASE_EXPIRED' WHERE "Status"='SENDING' AND "LeaseUntil"<now() AND "Attempts">=5`);
  } finally { transport.close(); }
  return sent;
}

export function startProvisioningJobs() {
  let busy = false, stopped = false;
  let requested = false;
  const tick = async () => {
    if (busy || stopped) return;
    busy = true;
    try {
      for(const [name,job] of [['deadline',queueDueDeadlineNotices],['email',deliverEmails]] as const) {
        try {
          const delivered = await job();
          if (name === 'email' && delivered >= 20) requested = true;
        }
        catch (error: any) {
          // Log codes only: SMTP messages may contain recipient data or credentials.
          const category = /timeout exceeded when trying to connect|connection timeout/i.test(String(error?.message ?? ''))
            ? 'DB_CONNECTION_TIMEOUT'
            : String(error?.message ?? '').startsWith('EMAIL_OUTBOX_KEY must be') ? 'EMAIL_KEY_INVALID' : 'UNKNOWN';
          const code = String(error?.code ?? error?.errorCode ?? category).replace(/[^A-Za-z0-9_]/g, '').slice(0, 80);
          console.error(`Provisioning ${name} job failed. Code: ${code}.`,
            code === 'DB_CONNECTION_TIMEOUT' ? `Timed out acquiring a database connection. Pool total=${pool?.totalCount}, idle=${pool?.idleCount}, waiting=${pool?.waitingCount}.` :
            code === 'EMAIL_KEY_INVALID' ? 'EMAIL_OUTBOX_KEY must contain exactly 64 hexadecimal characters.' :
            ['ENOTFOUND','EAI_AGAIN'].includes(code) ? 'Cannot resolve the database hostname. Check DB_HOST or the connection URL and network DNS. The job will retry on its next scheduled run.' :
            code === '57014' ? 'Database statement timed out.' :
            code === 'XX000' ? 'Database/pooler error; check connection capacity.' :
            name === 'email' ? 'Check database and mail configuration.' : 'Check database connection, locks and schema.');
        }
      }
    }
    finally {
      busy = false;
      if (requested && !stopped) {
        requested = false;
        void tick();
      }
    }
  };
  const wake = () => {
    if (busy) requested = true;
    else void tick();
  };
  const unregister = registerEmailWakeup(wake);
  const timer = setInterval(() => void tick(), 60000);
  timer.unref();
  void tick();
  return () => {
    stopped = true;
    clearInterval(timer);
    unregister();
  };
}
