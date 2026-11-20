import { query } from '../../config/database';
import { deliverEmails } from '../../jobs/provisioning';
import { scheduleAccountEmailDelivery } from '../../jobs/email-wakeup';

export type EmailDeliveryResult = {
  status: 'SENT' | 'PENDING' | 'PARTIAL' | 'FAILED' | 'UNKNOWN';
  total: number; sent: number; pending: number; failed: number; cancelled: number;
};

// Run only after the account transaction commits. SMTP failures must not turn a
// successfully created account into a failed creation response.
export async function deliverAccountEmailsNow(target: { batchId: string | number } | { userId: number }): Promise<EmailDeliveryResult> {
  let total = 0;
  try {
    const emails = 'batchId' in target
      ? await query<{ id: string }>(`SELECT e."EmailID"::text AS id FROM "EmailOutbox" e
          JOIN "AccountImportRows" r ON r."UserID"=e."UserID" AND r."Action"='CREATED'
          JOIN "AccountImportBatches" b ON b."BatchID"=r."BatchID"
          WHERE r."BatchID"=$1 AND e."Kind"='ACCOUNT' AND e."CreatedAt"=b."CreatedAt"`, [target.batchId])
      : await query<{ id: string }>(`SELECT "EmailID"::text AS id FROM "EmailOutbox"
          WHERE "UserID"=$1 AND "Kind"='SYSTEM_NOTIFICATION'`, [target.userId]);
    const emailIds = emails.rows.map(row => row.id);
    total = emailIds.length;
    if (!total) return { status: 'UNKNOWN', total: 0, sent: 0, pending: 0, failed: 0, cancelled: 0 };
    try {
      // Bound foreground work for bulk imports. The worker immediately handles
      // the remainder; a single-account creation waits for its SMTP result.
      await deliverEmails({ emailIds, maxMessages: 20, deadlineAt: Date.now() + 15000 });
    } catch (error) { logDeliveryError(error); }
    const rows = (await query<{ Status: string }>(`SELECT "Status" FROM "EmailOutbox" WHERE "EmailID"=ANY($1::bigint[])`, [emailIds])).rows;
    const result: EmailDeliveryResult = {
      status: 'PENDING', total, sent: 0, pending: 0, failed: 0, cancelled: 0,
    };
    for (const row of rows) {
      if (row.Status === 'SENT') result.sent++;
      else if (row.Status === 'FAILED') result.failed++;
      else if (row.Status === 'CANCELLED') result.cancelled++;
      else result.pending++;
    }
    result.status = rows.length !== total ? 'UNKNOWN' : result.sent === total ? 'SENT'
      : result.sent ? 'PARTIAL' : result.failed || result.cancelled ? 'FAILED' : 'PENDING';
    return result;
  } catch (error) {
    logDeliveryError(error);
    return { status: 'UNKNOWN', total, sent: 0, pending: 0, failed: 0, cancelled: 0 };
  } finally { scheduleAccountEmailDelivery(); }
}

function logDeliveryError(error: unknown) {
  const code = String((error as { code?: string })?.code ?? 'EMAIL_DELIVERY_UNAVAILABLE').replace(/[^A-Za-z0-9_]/g, '').slice(0, 80);
  console.error(`Immediate account email delivery unavailable. Code: ${code}.`);
}
