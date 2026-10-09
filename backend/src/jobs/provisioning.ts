import { academicAlertEmailIsCurrent } from '../modules/academic-reporting/notification.service';
import nodemailer from 'nodemailer';
import { pool, query } from '../config/database';
import { decryptEmail, emailKey } from '../modules/imports/email.crypto';

export async function archiveRecruitment() {
  if (!pool) throw new Error('Database is not configured.');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(hashtext('recruitment-archive'))");
    // Backfill retention for older/manual posts from the next chronological semester.
    await client.query(`UPDATE "RecruitmentPosts" p SET "RetentionSemesterID"=(
      SELECT n."OJTSemesterID" FROM "OJTSemesters" n JOIN "OJTSemesters" s ON s."OJTSemesterID"=p."OJTSemesterID"
      WHERE n."StartDate">s."StartDate" ORDER BY n."StartDate",n."OJTSemesterID" LIMIT 1
    ) WHERE p."RetentionSemesterID" IS NULL`);
    await client.query(`UPDATE "RecruitmentPosts" SET "Status"='CLOSED',"UpdatedAt"=now()
      WHERE "Status"='PUBLISHED' AND "DeadlineAt"<=now()`);
    const posts = await client.query(`UPDATE "RecruitmentPosts" p SET "Status"='ARCHIVED',"ArchivedAt"=now(),"UpdatedAt"=now()
      FROM "OJTSemesters" s WHERE s."OJTSemesterID"=p."RetentionSemesterID"
      AND s."EndDate" < (now() AT TIME ZONE 'Asia/Bangkok')::date AND p."Status"<>'ARCHIVED'
      RETURNING p."PostID"`);
    await client.query(`UPDATE "InternshipPositions" pos SET "Status"='ARCHIVED',"ArchivedAt"=now()
      WHERE pos."ArchivedAt" IS NULL AND EXISTS (SELECT 1 FROM "RecruitmentPostPositions" pp JOIN "RecruitmentPosts" p ON p."PostID"=pp."PostID" WHERE pp."PositionID"=pos."PositionID" AND p."Status"='ARCHIVED')
      AND NOT EXISTS (SELECT 1 FROM "RecruitmentPostPositions" pp JOIN "RecruitmentPosts" p ON p."PostID"=pp."PostID" WHERE pp."PositionID"=pos."PositionID" AND p."Status"<>'ARCHIVED')`);
    await client.query(`UPDATE "OJTMatchingProfiles" m SET "Status"='ARCHIVED',"UpdatedAt"=now()
      WHERE m."Status"<>'ARCHIVED' AND (
        EXISTS (SELECT 1 FROM "InternshipPositions" p WHERE p."PositionID"=m."PositionID" AND p."ArchivedAt" IS NOT NULL)
        OR EXISTS (SELECT 1 FROM "OJTSemesters" n WHERE n."OJTSemesterID"=(SELECT n2."OJTSemesterID" FROM "OJTSemesters" n2 JOIN "OJTSemesters" s ON s."OJTSemesterID"=m."OJTSemesterID" WHERE n2."StartDate">s."StartDate" ORDER BY n2."StartDate",n2."OJTSemesterID" LIMIT 1) AND n."EndDate"<(now() AT TIME ZONE 'Asia/Bangkok')::date))`);
    if (posts.rowCount) await client.query('INSERT INTO "RecruitmentArchiveRuns" ("ArchivedCount") VALUES ($1)', [posts.rowCount]);
    await client.query('COMMIT');
    return posts.rowCount ?? 0;
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}

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
    try { await archiveRecruitment(); await deliverEmails(); }
    catch { console.error('Provisioning job failed; check database migration and SMTP configuration.'); }
    finally { busy = false; }
  };
  const timer = setInterval(() => void tick(), 60000);
  timer.unref();
  void tick();
  return () => { stopped = true; clearInterval(timer); };
}
