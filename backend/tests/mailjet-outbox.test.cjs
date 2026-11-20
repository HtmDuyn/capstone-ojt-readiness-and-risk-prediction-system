const { test } = require('node:test');
const assert = require('node:assert/strict');
delete process.env.DATABASE_URL; delete process.env.SUPABASE_DATABASE_URL;
process.env.LOCAL_DATABASE_URL = 'postgresql://postgres@127.0.0.1:1/unused';
process.env.MAIL_PROVIDER = 'mailjet'; process.env.MAILJET_API_KEY = 'test-api-key'; process.env.MAILJET_SECRET_KEY = 'test-secret-key';
process.env.MAIL_FROM_EMAIL = 'hg2922004@gmail.com'; process.env.MAIL_FROM_NAME = 'Hệ thống OJT';
process.env.EMAIL_OUTBOX_KEY = 'ab'.repeat(32); process.env.FRONTEND_LOGIN_URL = 'https://ojt.example.test/login';
process.env.JWT_SECRET = 'mailjet-tests-only'; delete process.env.SMTP_HOST; delete process.env.SMTP_FROM;
const { pool } = require('../dist/config/database');
const { encryptEmail } = require('../dist/modules/imports/email.crypto');
const { deliverEmails } = require('../dist/jobs/provisioning');
const { sendPasswordResetCode } = require('../dist/modules/auth/self-password-reset.service');

test('Mailjet outbox and password-reset flows use API configuration and preserve delivery state', async t => {
  t.after(() => pool.end());
  function database(child) {
    let claimed = false;
    const state = { claims: 0, status: 'PENDING', payload: encryptEmail({ subject: 'Account', text: 'Private temporary password', html: '<p>Account</p>' }), failure: null };
    child.mock.method(pool, 'query', async (sql, args = []) => {
      if (sql.startsWith('WITH candidate AS')) {
        state.claims++;
        if (claimed) return { rows: [] };
        claimed = true;
        return { rows: [{ EmailID: '99', Kind: 'ACCOUNT', Recipient: 'student@example.test', EncryptedPayload: state.payload }] };
      }
      if (sql.startsWith('UPDATE "EmailOutbox" SET "Status"=\'SENT\'')) { state.status = 'SENT'; state.payload = null; }
      if (sql.includes('"LastError"=$2')) state.failure = { sql, args };
      return { rows: [] };
    });
    return state;
  }
  await t.test('accepted API message is marked SENT and its encrypted payload is retired', async child => {
    const state = database(child);
    child.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ Messages: [{ Status: 'success', To: [{ Email: 'student@example.test', MessageID: 123 }] }] })));
    assert.equal(await deliverEmails(), 1); assert.equal(state.status, 'SENT'); assert.equal(state.payload, null);
  });
  for (const [status, errorCode, expected] of [[401,'mj-0015','EAUTH_401'],[403,'send-0008','MAILJET_SENDER_NOT_VERIFIED_403'],[429,'rate-limit','MAILJET_RATE_LIMIT_429']]) {
    await t.test(expected + ' pauses the batch without exhausting attempts or exposing credentials', async child => {
      const state = database(child), logs = [];
      child.mock.method(console, 'error', line => logs.push(line));
      child.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ ErrorCode: errorCode, ErrorMessage: 'Private temporary password and key' }), { status }));
      assert.equal(await deliverEmails(), 0); assert.equal(state.claims, 1); assert.ok(state.payload);
      assert.deepEqual(state.failure.args, ['99', expected]); assert.ok(state.failure.sql.includes('GREATEST("Attempts"-1,0)'));
      assert.ok(!JSON.stringify(logs).includes('Private')); assert.ok(!JSON.stringify(logs).includes(process.env.MAILJET_SECRET_KEY));
    });
  }
  await t.test('missing Mailjet keys do not claim pending messages', async child => {
    const state = database(child), previous = process.env.MAILJET_SECRET_KEY;
    process.env.MAILJET_SECRET_KEY = ''; child.after(() => { process.env.MAILJET_SECRET_KEY = previous; });
    child.mock.method(console, 'error', () => {});
    child.mock.method(globalThis, 'fetch', async () => { assert.fail('No network request without credentials'); });
    assert.equal(await deliverEmails(), 0); assert.equal(state.claims, 0); assert.ok(state.payload);
  });
  await t.test('forgot-password accepts Mailjet configuration without any SMTP variables', async child => {
    let connected = false;
    child.mock.method(pool, 'connect', async () => ({ release() {}, async query() { connected = true; return { rows: [] }; } }));
    await sendPasswordResetCode('student@example.test'); assert.equal(connected, true);
  });
});
