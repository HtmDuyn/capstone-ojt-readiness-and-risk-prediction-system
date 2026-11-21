import bcrypt from 'bcryptjs';
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import type { PoolClient } from 'pg';
import { authConfig } from '../../config/auth';
import { pool } from '../../config/database';
import { scheduleAccountEmailDelivery } from '../../jobs/provisioning';
import { encryptEmail } from '../imports/email.crypto';
import { invalid } from '../students/student.validation';
import { mailIsConfigured } from '../../config/mail';

function normalizeEmail(value: unknown) {
  const email = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw invalid('Vui lòng nhập email hợp lệ.');
  }
  return email;
}

function digestCode(userId: number, version: number, code: string) {
  return createHmac('sha256', authConfig.jwtSecret)
    .update(`password-reset:${userId}:${version}:${code}`)
    .digest();
}

async function withActiveAccount(email: string, work: (client: PoolClient, account: {
  UserID: number; AuthVersion: number; Email: string;
}) => Promise<boolean>) {
  if (!pool) throw invalid('Không thể đặt lại mật khẩu lúc này.', 503);
  const client = await pool.connect();
  let discard = false;
  try {
    await client.query('BEGIN');
    await client.query("SET LOCAL lock_timeout = '5s'");
    const { rows: [account] } = await client.query<{ UserID: number; AuthVersion: number; Email: string }>(
      `SELECT "UserID", "AuthVersion", "Email" FROM "Users"
       WHERE lower("Email")=$1 AND "Status"='ACTIVE' FOR UPDATE`, [email],
    );
    const result = account ? await work(client, account) : false;
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch { discard = true; }
    throw error;
  } finally {
    client.release(discard);
  }
}

async function cancelResetEmails(client: PoolClient, userId: number, includeTemporaryPassword = false) {
  await client.query(`UPDATE "EmailOutbox"
    SET "Status"='CANCELLED', "EncryptedPayload"=NULL, "LeaseUntil"=NULL
    WHERE "UserID"=$1 AND "Status"<>'SENT'
      AND ("Kind"='PASSWORD_RESET' OR ($2 AND "Kind"='ACCOUNT'))`, [userId, includeTemporaryPassword]);
}

export async function sendPasswordResetCode(value: unknown) {
  const email = normalizeEmail(value);
  if (!mailIsConfigured()
    || !/^https?:\/\//i.test(process.env.FRONTEND_LOGIN_URL ?? '')
    || !/^[a-f0-9]{64}$/i.test(process.env.EMAIL_OUTBOX_KEY ?? '')) {
    throw invalid('Dịch vụ gửi mã qua email hiện chưa khả dụng.', 503, 'RESET_NOT_CONFIGURED');
  }

  const queued = await withActiveAccount(email, async (client, account) => {
    const { rows: [previous] } = await client.query(`SELECT "Attempts", "AuthVersion", "Recipient",
      "ExpiresAt">clock_timestamp() AS active,
      "CreatedAt">clock_timestamp()-interval '60 seconds' AS recent
      FROM "PasswordResetCodes" WHERE "UserID"=$1`, [account.UserID]);
    const sameAccount = previous?.AuthVersion === account.AuthVersion && previous.Recipient === email;
    const attempts = sameAccount && previous.active ? previous.Attempts : 0;
    if (sameAccount && (previous.recent || attempts >= 5)) return false;

    const code = String(randomInt(1_000_000)).padStart(6, '0');
    const { rows: [reset] } = await client.query(`INSERT INTO "PasswordResetCodes"
      ("UserID", "CodeDigest", "Recipient", "AuthVersion", "Attempts", "CreatedAt", "ExpiresAt")
      VALUES ($1,$2,$3,$4,$5,clock_timestamp(),clock_timestamp()+interval '10 minutes')
      ON CONFLICT ("UserID") DO UPDATE SET "CodeDigest"=EXCLUDED."CodeDigest",
        "Recipient"=EXCLUDED."Recipient", "AuthVersion"=EXCLUDED."AuthVersion",
        "Attempts"=EXCLUDED."Attempts", "CreatedAt"=EXCLUDED."CreatedAt", "ExpiresAt"=EXCLUDED."ExpiresAt"
      RETURNING "ExpiresAt" AS "expiresAt"`,
      [account.UserID, digestCode(account.UserID, account.AuthVersion, code), email, account.AuthVersion, attempts]);

    await cancelResetEmails(client, account.UserID);
    await client.query(`INSERT INTO "EmailOutbox" ("UserID", "Recipient", "EncryptedPayload", "ExpiresAt", "Kind")
      VALUES ($1,$2,$3,$4,'PASSWORD_RESET')`, [account.UserID, account.Email, encryptEmail({
      subject: 'Mã đặt lại mật khẩu hệ thống OJT',
      text: `Mã đặt lại mật khẩu của bạn là ${code}. Mã có hiệu lực trong 10 phút và chỉ dùng được một lần.\nNếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.`,
    }), reset.expiresAt]);
    return true;
  });
  if (queued) scheduleAccountEmailDelivery();
}

export async function resetPasswordWithCode(value: unknown, code: unknown, password: unknown) {
  const email = normalizeEmail(value);
  if (typeof code !== 'string' || !(/^[0-9]{6}$/.test(code) || /^[A-Za-z0-9_-]{43}$/.test(code))) {
    throw invalid('Mã hoặc liên kết đặt lại mật khẩu không hợp lệ.');
  }
  if (typeof password !== 'string' || password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
    throw invalid('Mật khẩu mới phải có ít nhất 12 ký tự và tối đa 72 byte UTF-8.', 400, 'INVALID_PASSWORD');
  }

  const changed = await withActiveAccount(email, async (client, account) => {
    const { rows: [reset] } = await client.query<{ CodeDigest: Buffer }>(`SELECT "CodeDigest"
      FROM "PasswordResetCodes" WHERE "UserID"=$1 AND "AuthVersion"=$2 AND "Recipient"=$3
      AND "ExpiresAt">clock_timestamp() AND "Attempts"<5`, [account.UserID, account.AuthVersion, email]);
    if (!reset) return false;
    if (!timingSafeEqual(reset.CodeDigest, digestCode(account.UserID, account.AuthVersion, code))) {
      await client.query('UPDATE "PasswordResetCodes" SET "Attempts"="Attempts"+1 WHERE "UserID"=$1', [account.UserID]);
      return false;
    }

    await client.query(`UPDATE "Users" SET "PasswordHash"=$2, "MustChangePassword"=false,
      "TemporaryPasswordExpiresAt"=NULL, "PasswordChangedAt"=now(), "UpdatedAt"=now(), "AuthVersion"="AuthVersion"+1
      WHERE "UserID"=$1`, [account.UserID, await bcrypt.hash(password, 12)]);
    await client.query('DELETE FROM "PasswordResetCodes" WHERE "UserID"=$1', [account.UserID]);
    await cancelResetEmails(client, account.UserID, true);
    return true;
  });
  if (!changed) {
    throw invalid('Mã xác nhận không hợp lệ, đã hết hạn hoặc đã vượt quá số lần thử.', 400, 'INVALID_RESET_CODE');
  }
}
