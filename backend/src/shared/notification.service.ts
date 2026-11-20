import type { PoolClient } from 'pg';
import { createHash } from 'node:crypto';
import { encryptEmail } from '../modules/imports/email.crypto';
import type { EmailContent } from './account-email';

export type NoticeGuard = { table: 'RecruitmentWindows' | 'OJTRegistrationWindows'; id: number; fingerprint: string };
export function noticeFingerprint(row: Record<string, any>) {
  const fields = ['Name', 'Status', 'StartsAt', 'EndsAt', 'PostingStartsAt', 'PostingEndsAt',
    'ApplicationStartsAt', 'ApplicationEndsAt', 'ResultsStartsAt', 'ResultsEndsAt', 'Scope', 'OJTSemesterID'];
  return createHash('sha256').update(JSON.stringify(fields.map(key => {
    const value = row[key];
    return value == null ? null : key.endsWith('At') ? new Date(value).toISOString() : value;
  }))).digest('hex');
}

export async function queueNotice(client: PoolClient, input: {
  userId: number; email?: string | null; title: string; text: string;
  entityType: string; entityId: number; eventKey: string; expiresAt: Date;
  guard?: NoticeGuard;
  emailContent?: EmailContent;
}) {
  const eventKey = createHash('sha256').update(`${input.userId}:${input.eventKey}`).digest('hex');
  const notice = await client.query(`INSERT INTO "Notifications"
    ("UserID","Title","Content","Channel","RelatedEntityType","RelatedEntityID","SentAt","EventKey")
    VALUES ($1,$2,$3,'IN_APP',$4,$5,now(),$6)
    ON CONFLICT ("EventKey") DO NOTHING RETURNING "NotificationID"`,
    [input.userId, input.title.slice(0, 200), input.text, input.entityType, input.entityId, eventKey]);
  if (!notice.rowCount) return null;
  if (input.email?.trim()) await client.query(`INSERT INTO "EmailOutbox"
    ("UserID","Recipient","EncryptedPayload","ExpiresAt","Kind") VALUES ($1,$2,$3,$4,'SYSTEM_NOTIFICATION')`,
    [input.userId, input.email.trim().toLowerCase(), encryptEmail({ ...(input.emailContent ?? { subject: input.title, text: input.text }), guard: input.guard }), input.expiresAt]);
  return notice.rows[0].NotificationID as number;
}
