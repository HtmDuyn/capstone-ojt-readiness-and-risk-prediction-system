// Read-only diagnostics. Use npm run check:mail to verify the provider separately.
require('../dist/config/env');
const { pool } = require('../dist/config/database');
const { emailKey } = require('../dist/modules/imports/email.crypto');
async function main() {
  const provider = process.env.MAIL_PROVIDER?.trim().toLowerCase() || 'smtp';
  console.log('Mail provider:', provider);
  for (const key of provider === 'mailjet'
    ? ['MAILJET_API_KEY','MAILJET_SECRET_KEY','MAIL_FROM_EMAIL','FRONTEND_LOGIN_URL']
    : ['SMTP_HOST','SMTP_FROM','FRONTEND_LOGIN_URL'])
    console.log(`${key}: ${process.env[key]?.trim() ? 'configured' : 'missing'}`);
  try { emailKey(); console.log('EMAIL_OUTBOX_KEY: valid'); }
  catch { console.log('EMAIL_OUTBOX_KEY: missing or invalid'); process.exitCode = 1; }
  for (const key of ['PROVISIONING_JOBS_ENABLED','ADVISORY_WORKER_ENABLED'])
    console.log(`${key}: ${process.env[key] === 'false' ? 'disabled' : 'enabled (default)'}`);
  if (!pool) throw Object.assign(new Error(), { code: 'DATABASE_NOT_CONFIGURED' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN READ ONLY');
    await client.query("SET LOCAL statement_timeout='15s'");
    const queries = {
      migration: `SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Notifications' AND column_name='EventKey') AS event_key_ready,
        (SELECT pg_get_constraintdef(oid) LIKE '%SYSTEM_NOTIFICATION%' FROM pg_constraint WHERE conrelid='public."EmailOutbox"'::regclass AND conname='EmailOutbox_Kind_check') AS email_kind_ready`,
      outbox: `SELECT "Kind","Status",count(*)::int AS total,max("CreatedAt") AS latest,array_agg(DISTINCT "LastError") FILTER(WHERE "LastError" IS NOT NULL) AS errors FROM "EmailOutbox" GROUP BY "Kind","Status"`,
      notifications: `SELECT "RelatedEntityType",count(*)::int AS total,max("SentAt") AS latest FROM "Notifications" GROUP BY "RelatedEntityType"`,
    };
    for (const [name, sql] of Object.entries(queries)) {
      const rows = (await client.query(sql)).rows;
      console.log(`${name}: ${JSON.stringify(rows)}`);
      if (name === 'migration' && (!rows[0]?.event_key_ready || !rows[0]?.email_kind_ready)) process.exitCode = 1;
    }
    await client.query('ROLLBACK');
  } finally { client.release(); }
}
main().catch(error => {
  const code = String(error.code || 'DIAGNOSTIC_FAILED').replace(/[^A-Za-z0-9_]/g, '').slice(0,80);
  console.error(`Notification diagnostic failed. Code: ${code}.`);
  process.exitCode = 1;
}).finally(() => pool?.end());
