import type { PoolClient } from 'pg';
import { createHash } from 'node:crypto';
import { encryptEmail } from '../modules/imports/email.crypto';
import type { EmailContent } from './account-email';

export type NoticeGuard = { table: 'RecruitmentWindows' | 'OJTRegistrationWindows'; id: number; fingerprint: string };
type Notice = {
  title: string; text: string; entityType: string; entityId: number; eventKey: string;
  expiresAt: Date; guard?: NoticeGuard; emailContent?: EmailContent;
};
type Recipient = { userId: number; email?: string | null };
export function noticeFingerprint(row: Record<string, any>) {
  const fields = ['Name', 'Status', 'StartsAt', 'EndsAt', 'PostingStartsAt', 'PostingEndsAt',
    'ApplicationStartsAt', 'ApplicationEndsAt', 'ResultsStartsAt', 'ResultsEndsAt', 'Scope', 'OJTSemesterID'];
  return createHash('sha256').update(JSON.stringify(fields.map(key => {
    const value = row[key];
    return value == null ? null : key.endsWith('At') ? new Date(value).toISOString() : value;
  }))).digest('hex');
}

export async function queueNotices(client: PoolClient, recipients: Recipient[], notice: Notice) {
  if (!recipients.length) return [];
  const eventKeys = recipients.map(({ userId }) =>
    createHash('sha256').update(`${userId}:${notice.eventKey}`).digest('hex'));
  const { rows } = await client.query<{ UserID: number; NotificationID: number }>(`INSERT INTO "Notifications"
    ("UserID","Title","Content","Channel","RelatedEntityType","RelatedEntityID","SentAt","EventKey")
    SELECT recipient.id,$2,$3,'IN_APP',$4,$5,now(),recipient.key
    FROM unnest($1::int[], $6::text[]) AS recipient(id,key)
    ON CONFLICT ("EventKey") DO NOTHING RETURNING "UserID","NotificationID"`,
    [recipients.map(recipient => recipient.userId), notice.title.slice(0, 200), notice.text,
      notice.entityType, notice.entityId, eventKeys]);
  const emailByUser = new Map(recipients.map(({ userId, email }) => [userId, email?.trim().toLowerCase()]));
  const deliveries = rows.flatMap(({ UserID }) => {
    const email = emailByUser.get(UserID);
    return email ? [{ userId: UserID, email }] : [];
  });
  if (deliveries.length) {
    const content = notice.emailContent ?? { subject: notice.title, text: notice.text };
    const payload = encryptEmail({ ...content, guard: notice.guard });
    await client.query(`INSERT INTO "EmailOutbox" ("UserID","Recipient","EncryptedPayload","ExpiresAt","Kind")
      SELECT delivery.id,delivery.email,$3,$4,'SYSTEM_NOTIFICATION'
      FROM unnest($1::int[], $2::text[]) AS delivery(id,email)`,
      [deliveries.map(d => d.userId), deliveries.map(d => d.email), payload, notice.expiresAt]);
  }
  return rows;
}

export async function queueNotice(client: PoolClient, input: Notice & Recipient) {
  const [notice] = await queueNotices(client, [input], input);
  return notice?.NotificationID ?? null;
}
