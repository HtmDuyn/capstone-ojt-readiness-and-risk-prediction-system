import { academicAlertEmailIsCurrent } from '../modules/academic-reporting/notification.service';
import { notifyCompletedInternships } from '../modules/ojt-results/completion-notification.service';
import nodemailer from 'nodemailer';
import { pool, query } from '../config/database';
import { decryptEmail, emailKey } from '../modules/imports/email.crypto';

export async function deliverEmails() {
  // Retire secrets even if SMTP is unavailable.
  await query(`UPDATE "EmailOutbox" e SET "Status"='CANCELLED',"EncryptedPayload"=NULL,"LeaseUntil"=NULL
    WHERE e."EncryptedPayload" IS NOT NULL AND (e."ExpiresAt"<=now() OR EXISTS (
      SELECT 1 FROM "Users" u WHERE u."UserID"=e."UserID" AND (u."Status"<>'ACTIVE' OR lower(u."Email")<>lower(e."Recipient") OR (e."Kind"='ACCOUNT' AND (NOT u."MustChangePassword" OR u."TemporaryPasswordExpiresAt" IS NULL OR u."TemporaryPasswordExpiresAt"<=now()))))
      OR (e."Kind"='COMBO_REMINDER' AND EXISTS (SELECT 1 FROM "ComboReminderDeliveries" d JOIN "ComboRegistrationWindows" w ON w."WindowID"=d."WindowID" JOIN "ComboReminderBatches" b ON b."BatchID"=d."BatchID" WHERE d."EmailID"=e."EmailID" AND (w."Status"<>'OPEN' OR (b."Summary"->>'target'='MISSING' AND EXISTS (SELECT 1 FROM "StudentComboSelectionEvents" s WHERE s."WindowID"=d."WindowID" AND s."StudentID"=d."StudentID" AND s."EventType"='SUBMITTED'))))))`);
  if (!process.env.SMTP_HOST || !process.env.SMTP_FROM) return 0;
  emailKey();
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
    connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 30000,
  });
  let sent = 0;
  try {
    for (let i = 0; i < 20; i++) {
      const row = await query(`WITH candidate AS (
        SELECT "EmailID" FROM "EmailOutbox" WHERE "ExpiresAt">now() AND "Attempts"<5
        AND (("Status"='PENDING' AND "NextAttemptAt"<=now()) OR ("Status"='SENDING' AND "LeaseUntil"<now()))
        ORDER BY "EmailID" FOR UPDATE SKIP LOCKED LIMIT 1
      ) UPDATE "EmailOutbox" e SET "Status"='SENDING',"Attempts"="Attempts"+1,"LeaseUntil"=now()+interval '5 minutes'
        FROM candidate c WHERE e."EmailID"=c."EmailID" RETURNING e.*`);
      if (!row.rows.length) break;
      const e = row.rows[0];
      try {
        if (e.Kind === 'ACADEMIC_ALERT' && !(await academicAlertEmailIsCurrent(e.EmailID))) {
          await query(`UPDATE "EmailOutbox" SET "Status"='CANCELLED',"EncryptedPayload"=NULL,"LeaseUntil"=NULL WHERE "EmailID"=$1`,[e.EmailID]);
          continue;
        }
        const message = decryptEmail(e.EncryptedPayload);
        const delivery = await transport.sendMail({ from: process.env.SMTP_FROM, to: e.Recipient, ...message, messageId: `<ojt-${e.EmailID}@${new URL(process.env.FRONTEND_LOGIN_URL!).hostname}>` });
        if (!delivery.accepted.length) throw new Error('SMTP_REJECTED');
        await query('UPDATE "EmailOutbox" SET "Status"=\'SENT\',"SentAt"=now(),"EncryptedPayload"=NULL,"LeaseUntil"=NULL,"LastError"=NULL WHERE "EmailID"=$1 AND "Status"=\'SENDING\'', [e.EmailID]);
        sent++;
      } catch {
        // Never persist SMTP responses or email content: they may include credentials.
        await query(`UPDATE "EmailOutbox" SET "Status"=CASE WHEN "Attempts">=5 THEN 'FAILED' ELSE 'PENDING' END,
          "LeaseUntil"=NULL,"NextAttemptAt"=now()+interval '5 minutes',"LastError"='EMAIL_DELIVERY_FAILED' WHERE "EmailID"=$1 AND "Status"='SENDING'`, [e.EmailID]);
      }
    }
    await query(`UPDATE "EmailOutbox" SET "Status"='FAILED',"LeaseUntil"=NULL,"LastError"='DELIVERY_LEASE_EXPIRED' WHERE "Status"='SENDING' AND "LeaseUntil"<now() AND "Attempts">=5`);
  } finally { transport.close(); }
  return sent;
}

export function startProvisioningJobs() {
  let busy = false, stopped = false;
  const tick = async () => {
    if (busy || stopped) return;
    busy = true;
    try {
      // Deliver result notifications and account emails independently.
      for(const [name,job] of [['results',notifyCompletedInternships],['email',deliverEmails]] as const) {
        try { await job(); }
        catch (error: any) {
          // Log codes only: SMTP messages may contain recipient data or credentials.
          const category = /timeout exceeded when trying to connect|connection timeout/i.test(String(error?.message ?? ''))
            ? 'DB_CONNECTION_TIMEOUT'
            : String(error?.message ?? '').startsWith('EMAIL_OUTBOX_KEY must be') ? 'EMAIL_KEY_INVALID' : 'UNKNOWN';
          const code = String(error?.code ?? error?.errorCode ?? category).replace(/[^A-Za-z0-9_]/g, '').slice(0, 80);
          console.error(`Provisioning ${name} job failed. Code: ${code}.`,
            code === 'DB_CONNECTION_TIMEOUT' ? `Timed out acquiring a database connection. Pool total=${pool?.totalCount}, idle=${pool?.idleCount}, waiting=${pool?.waitingCount}.` :
            code === 'EMAIL_KEY_INVALID' ? 'EMAIL_OUTBOX_KEY must contain exactly 64 hexadecimal characters.' :
            code === '57014' ? 'Database statement timed out.' :
            code === 'XX000' ? 'Database/pooler error; check connection capacity.' :
            name === 'email' ? 'Check database and mail configuration.' : 'Check database connection, locks and schema.');
        }
      }
    }
    finally { busy = false; }
  };
  const timer = setInterval(() => void tick(), 60000);
  timer.unref();
  void tick();
  return () => { stopped = true; clearInterval(timer); };
}
