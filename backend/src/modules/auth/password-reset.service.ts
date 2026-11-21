import { createHmac, randomBytes } from 'node:crypto';
import { academicTransaction, audit } from '../academic/academic.repository';
import { invalid } from '../students/student.validation';
import { encryptEmail } from '../imports/email.crypto';
import { wakeEmailAfterCommit } from '../../jobs/email-wakeup';
import { mailIsConfigured } from '../../config/mail';
import { frontendLoginUrl } from '../../config/frontend';
import { authConfig } from '../../config/auth';

export async function requestPasswordReset(userId: number, actor: number) {
  if (!mailIsConfigured() || !/^[a-f0-9]{64}$/i.test(process.env.EMAIL_OUTBOX_KEY ?? ''))
    throw invalid('Dịch vụ gửi email đặt lại mật khẩu chưa khả dụng.', 503, 'RESET_NOT_CONFIGURED');
  const loginUrl = frontendLoginUrl();
  return academicTransaction(async client => {
    const account = (await client.query(`SELECT "UserID", "Email", "FullName", "Status", "AuthVersion"
      FROM "Users" WHERE "UserID"=$1 FOR UPDATE`, [userId])).rows[0];
    if (!account) throw invalid('Không tìm thấy tài khoản.', 404);
    if (account.Status !== 'ACTIVE') throw invalid('Chỉ có thể đặt lại mật khẩu cho tài khoản đang hoạt động.', 409);
    const previous = (await client.query(`SELECT "CreatedAt">clock_timestamp()-interval '60 seconds' AS recent
      FROM "PasswordResetCodes" WHERE "UserID"=$1`, [userId])).rows[0];
    if (previous?.recent) throw invalid('Vui lòng đợi 60 giây trước khi gửi lại email.', 429, 'RESET_RATE_LIMITED');
    const token = randomBytes(32).toString('base64url');
    const digest = createHmac('sha256', authConfig.jwtSecret)
      .update(`password-reset:${userId}:${account.AuthVersion}:${token}`).digest();
    const link = new URL(loginUrl);
    link.searchParams.set('resetEmail', account.Email);
    link.searchParams.set('resetToken', token);
    const payload = encryptEmail({
      subject: 'Đặt lại mật khẩu hệ thống OJT',
      text: `Xin chào ${account.FullName},\nMở liên kết sau để đặt mật khẩu mới: ${link.toString()}\nLiên kết có hiệu lực trong 10 phút và chỉ dùng được một lần.\nNếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.`,
    });
    const reset = (await client.query(`INSERT INTO "PasswordResetCodes"
      ("UserID", "CodeDigest", "Recipient", "AuthVersion", "Attempts", "CreatedAt", "ExpiresAt")
      VALUES ($1,$2,$3,$4,0,clock_timestamp(),clock_timestamp()+interval '10 minutes')
      ON CONFLICT ("UserID") DO UPDATE SET "CodeDigest"=EXCLUDED."CodeDigest",
        "Recipient"=EXCLUDED."Recipient", "AuthVersion"=EXCLUDED."AuthVersion",
        "Attempts"=0, "CreatedAt"=EXCLUDED."CreatedAt", "ExpiresAt"=EXCLUDED."ExpiresAt"
      RETURNING "ExpiresAt"`, [userId, digest, account.Email, account.AuthVersion])).rows[0];
    await client.query(`UPDATE "EmailOutbox" SET "Status"='CANCELLED', "EncryptedPayload"=NULL, "LeaseUntil"=NULL
      WHERE "UserID"=$1 AND "Status"<>'SENT' AND "Kind"='PASSWORD_RESET'`, [userId]);
    const email = (await client.query(`INSERT INTO "EmailOutbox"
      ("UserID", "Recipient", "EncryptedPayload", "ExpiresAt", "Kind")
      VALUES ($1,$2,$3,$4,'PASSWORD_RESET') RETURNING "EmailID"`,
      [userId, account.Email, payload, reset.ExpiresAt])).rows[0];
    await audit(client, actor, 'Users', userId, 'REQUEST_PASSWORD_RESET', null, { emailId: email.EmailID, expiresAt: reset.ExpiresAt });
    return { userId, emailId: email.EmailID, status: 'QUEUED', expiresAt: reset.ExpiresAt };
  }).then(wakeEmailAfterCommit);
}
