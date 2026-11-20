import { academicAlertEmailIsCurrent } from '../modules/academic-reporting/notification.service';
import nodemailer from 'nodemailer';
import { pool, query } from '../config/database';
import { decryptEmail, emailKey } from '../modules/imports/email.crypto';
import { queueDueDeadlineNotices, scheduleEmailIsCurrent } from '../modules/recruitment/notification.service';
import { registerEmailWakeup } from './email-wakeup';
import { frontendLoginUrl } from '../config/frontend';
export { scheduleAccountEmailDelivery } from './email-wakeup';

export async function deliverEmails(options: { emailIds?: string[]; maxMessages?: number; deadlineAt?: number } = {}) {
  // Retire secrets even if SMTP is unavailable.
  await query(`UPDATE "EmailOutbox" e SET "Status"='CANCELLED',"EncryptedPayload"=NULL,"LeaseUntil"=NULL
    WHERE e."EncryptedPayload" IS NOT NULL AND (e."ExpiresAt"<=now() OR EXISTS (
      SELECT 1 FROM "Users" u WHERE u."UserID"=e."UserID" AND (u."Status"<>'ACTIVE' OR lower(u."Email")<>lower(e."Recipient") OR (e."Kind"='ACCOUNT' AND (NOT u."MustChangePassword" OR u."TemporaryPasswordExpiresAt" IS NULL OR u."TemporaryPasswordExpiresAt"<=now()))))
      OR (e."Kind"='COMBO_REMINDER' AND EXISTS (SELECT 1 FROM "ComboReminderDeliveries" d JOIN "ComboRegistrationWindows" w ON w."WindowID"=d."WindowID" JOIN "ComboReminderBatches" b ON b."BatchID"=d."BatchID" WHERE d."EmailID"=e."EmailID" AND (w."Status"<>'OPEN' OR (b."Summary"->>'target'='MISSING' AND EXISTS (SELECT 1 FROM "StudentComboSelectionEvents" s WHERE s."WindowID"=d."WindowID" AND s."StudentID"=d."StudentID" AND s."EventType"='SUBMITTED'))))))`);
  if (!process.env.SMTP_HOST || !process.env.SMTP_FROM) {
    console.error('Email delivery disabled: configure SMTP_HOST and SMTP_FROM. Queued messages remain pending.');
    return 0;
  }
  emailKey();
  // Validate shared configuration before claiming mail or consuming retry attempts.
  const loginUrl = new URL(frontendLoginUrl());
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
    connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 30000,
  });
  let sent = 0;
  try {
    for (let i = 0; i < (options.maxMessages ?? 20); i++) {
      if (options.deadlineAt !== undefined && Date.now() >= options.deadlineAt) break;
      const row = await query(`WITH candidate AS (
        SELECT "EmailID" FROM "EmailOutbox" WHERE "ExpiresAt">now() AND "Attempts"<5
        AND ($1::bigint[] IS NULL OR "EmailID"=ANY($1::bigint[]))
        AND (("Status"='PENDING' AND "NextAttemptAt"<=now()) OR ("Status"='SENDING' AND "LeaseUntil"<now()))
        ORDER BY "EmailID" FOR UPDATE SKIP LOCKED LIMIT 1
      ) UPDATE "EmailOutbox" e SET "Status"='SENDING',"Attempts"="Attempts"+1,"LeaseUntil"=now()+interval '5 minutes'
        FROM candidate c WHERE e."EmailID"=c."EmailID" RETURNING e.*`, [options.emailIds ?? null]);
      if (!row.rows.length) break;
      const e = row.rows[0];
      try {
        if (e.Kind === 'ACADEMIC_ALERT' && !(await academicAlertEmailIsCurrent(e.EmailID))) {
          await query(`UPDATE "EmailOutbox" SET "Status"='CANCELLED',"EncryptedPayload"=NULL,"LeaseUntil"=NULL WHERE "EmailID"=$1`,[e.EmailID]);
          continue;
        }
        const message = decryptEmail(e.EncryptedPayload);
        if (message.guard && !(await scheduleEmailIsCurrent(message.guard))) {
          await query(`UPDATE "EmailOutbox" SET "Status"='CANCELLED',"EncryptedPayload"=NULL,"LeaseUntil"=NULL WHERE "EmailID"=$1`, [e.EmailID]);
          continue;
        }
        const delivery = await transport.sendMail({ from: process.env.SMTP_FROM, to: e.Recipient,
          subject: message.subject, text: message.text, html: message.html,
          messageId: `<ojt-${e.EmailID}@${loginUrl.hostname}>` });
        if (!delivery.accepted.length) throw new Error('SMTP_REJECTED');
        await query('UPDATE "EmailOutbox" SET "Status"=\'SENT\',"SentAt"=now(),"EncryptedPayload"=NULL,"LeaseUntil"=NULL,"LastError"=NULL WHERE "EmailID"=$1 AND "Status"=\'SENDING\'', [e.EmailID]);
        sent++;
      } catch (error: any) {
        // Never persist SMTP responses or email content: they may include credentials.
        const knownCodes = ['EAUTH', 'ECONNECTION', 'ETIMEDOUT', 'ESOCKET', 'ETLS', 'EENVELOPE', 'EMESSAGE', 'EDNS'];
        const errorCode = knownCodes.includes(error?.code) ? error.code : 'EMAIL_DELIVERY_FAILED';
        const responseCode = Number.isInteger(error?.responseCode) && error.responseCode >= 400 && error.responseCode <= 599
          ? error.responseCode : undefined;
        const lastError = responseCode ? `${errorCode}_${responseCode}` : errorCode;
        // Authentication is shared by every recipient. Pause this batch without
        // exhausting delivery attempts while an operator repairs SMTP credentials.
        if (errorCode === 'EAUTH') {
          await query(`UPDATE "EmailOutbox" SET "Status"='PENDING',"Attempts"=GREATEST("Attempts"-1,0),
            "LeaseUntil"=NULL,"NextAttemptAt"=now()+interval '5 minutes',"LastError"=$2 WHERE "EmailID"=$1 AND "Status"='SENDING'`, [e.EmailID, lastError]);
          console.error(`Email delivery failed. EmailID=${e.EmailID}, code=${lastError}. Check SMTP_USER and SMTP_PASSWORD; Gmail requires an app password. Batch paused.`);
          break;
        }
        await query(`UPDATE "EmailOutbox" SET "Status"=CASE WHEN "Attempts">=5 THEN 'FAILED' ELSE 'PENDING' END,
          "LeaseUntil"=NULL,"NextAttemptAt"=now()+interval '5 minutes',"LastError"=$2 WHERE "EmailID"=$1 AND "Status"='SENDING'`, [e.EmailID, lastError]);
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
      // Deliver result notifications and account emails independently.
      for(const [name,job] of [['deadline',queueDueDeadlineNotices],['email',deliverEmails]] as const) {
        try {
          const delivered = await job();
          // Drain large imports in consecutive batches instead of waiting a
          // full minute between every 20 messages.
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
