const { test } = require('node:test');
const assert = require('node:assert/strict');
delete process.env.DATABASE_URL; delete process.env.SUPABASE_DATABASE_URL;
process.env.LOCAL_DATABASE_URL = 'postgresql://postgres@127.0.0.1:1/unused';
process.env.EMAIL_OUTBOX_KEY = 'ab'.repeat(32);
process.env.SMTP_HOST = 'smtp.example.test'; process.env.SMTP_FROM = 'ojt@example.test';
process.env.MAIL_PROVIDER = 'smtp';
process.env.FRONTEND_LOGIN_URL = 'https://ojt.example.test/login';
const { pool } = require('../dist/config/database');
const deadlines = require('../dist/modules/recruitment/notification.service');
const { startProvisioningJobs } = require('../dist/jobs/provisioning');
const { scheduleAccountEmailDelivery } = require('../dist/jobs/email-wakeup');
const nodemailer = require('nodemailer');

test('deadline failures do not block email and wakeups during delivery are replayed without overlap', async t => {
  t.after(() => pool.end());
  const logs = [];
  t.mock.method(console, 'error', (...args) => logs.push(args));
  let releaseFirst;
  const firstPass = new Promise(resolve => { releaseFirst = resolve; });
  let calls = 0, active = 0, maximum = 0, retired = 0;
  t.mock.method(deadlines, 'queueDueDeadlineNotices', async () => {
    calls++; active++; maximum = Math.max(maximum, active);
    try {
      if (calls === 1) await firstPass;
      throw Object.assign(new Error('Private database details'), { code: '42703' });
    } finally { active--; }
  });
  t.mock.method(nodemailer, 'createTransport', () => ({ close() {}, async sendMail() { throw Error('No messages should be sent'); } }));
  t.mock.method(pool, 'query', async sql => {
    if (sql.startsWith('UPDATE "EmailOutbox" e')) retired++;
    return { rows: [], rowCount: 0 };
  });
  const stop = startProvisioningJobs(); t.after(stop);
  scheduleAccountEmailDelivery(); scheduleAccountEmailDelivery();
  releaseFirst();
  // Flush asynchronous passes without waiting for the 60-second periodic timer.
  for (let i = 0; i < 10 && retired < 2; i++) await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 2); assert.equal(retired, 2); assert.equal(maximum, 1);
  assert.ok(!JSON.stringify(logs).includes('Private database details'));
  stop(); scheduleAccountEmailDelivery();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 2);
});
