const { test } = require('node:test');
const assert = require('node:assert/strict');
const nodemailer = require('nodemailer');
delete process.env.DATABASE_URL; delete process.env.SUPABASE_DATABASE_URL;
process.env.LOCAL_DATABASE_URL = 'postgresql://postgres@127.0.0.1:1/unused';
process.env.EMAIL_OUTBOX_KEY = 'ab'.repeat(32);
process.env.SMTP_HOST = 'smtp.example.test'; process.env.SMTP_FROM = 'ojt@example.test';
process.env.FRONTEND_LOGIN_URL = 'https://ojt.example.test/login';
const { pool } = require('../dist/config/database');
const { encryptEmail } = require('../dist/modules/imports/email.crypto');
const { deliverAccountEmailsNow } = require('../dist/modules/imports/account-email-delivery.service');
const { registerEmailWakeup } = require('../dist/jobs/email-wakeup');

test('immediate creation email prioritizes its own message and reports actual SMTP status', async t => {
  t.after(() => pool.end());
  function outbox(child, status = 'PENDING') {
    const messages = ['1','2'].map(id => ({ EmailID: id, Status: 'PENDING', Attempts: 0, Kind: 'ACCOUNT', Recipient: `account${id}@example.test`,
      EncryptedPayload: encryptEmail({ subject: 'Test', text: 'Private test password', html: '<p>Test</p>' }) }));
    messages[1].Status = status;
    const scopes = [];
    child.mock.method(pool, 'query', async (sql, args = []) => {
      if (sql.startsWith('SELECT e."EmailID"') || sql.startsWith('SELECT "EmailID"')) return { rows: [{ id: '2' }] };
      if (sql.startsWith('WITH candidate AS')) {
        scopes.push(args[0]);
        const message = messages.find(row => args[0].includes(row.EmailID) && row.Status === 'PENDING' && !row.deferred);
        if (!message) return { rows: [] };
        message.Status = 'SENDING'; message.Attempts++;
        return { rows: [{ ...message }] };
      }
      if (sql.startsWith('SELECT "Status"')) return { rows: messages.filter(row => args[0].includes(row.EmailID)).map(row => ({ Status: row.Status })) };
      if (sql.startsWith('UPDATE "EmailOutbox" SET "Status"=\'SENT\'')) {
        const message = messages.find(row => row.EmailID === args[0]); message.Status = 'SENT'; message.EncryptedPayload = null;
      } else if (sql.includes('"LastError"=$2')) {
        const message = messages.find(row => row.EmailID === args[0]); message.Status = 'PENDING'; message.deferred = true;
        if (sql.includes('GREATEST')) message.Attempts--;
      }
      return { rows: [], rowCount: 0 };
    });
    return { messages, scopes };
  }
  await t.test('creation waits for SMTP acceptance, skips old backlog and replay never sends twice', async child => {
    const { messages, scopes } = outbox(child);
    let startSMTP, finishSMTP, resolved = false, sends = 0, wakeups = 0;
    const started = new Promise(resolve => { startSMTP = resolve; });
    const accepted = new Promise(resolve => { finishSMTP = resolve; });
    child.after(registerEmailWakeup(() => { wakeups++; }));
    child.mock.method(nodemailer, 'createTransport', () => ({ close() {}, async sendMail(message) {
      sends++; assert.equal(message.to, 'account2@example.test'); startSMTP(); await accepted; return { accepted: [message.to] };
    } }));
    const delivery = deliverAccountEmailsNow({ batchId: '44' }).then(result => { resolved = true; return result; });
    await started; assert.equal(resolved, false); assert.equal(messages[0].Status, 'PENDING');
    finishSMTP();
    assert.deepEqual(await delivery, { status: 'SENT', total: 1, sent: 1, pending: 0, failed: 0, cancelled: 0 });
    assert.ok(scopes.every(scope => scope.length === 1 && scope[0] === '2'));
    assert.equal(messages[1].EncryptedPayload, null);
    assert.equal((await deliverAccountEmailsNow({ batchId: '44' })).status, 'SENT');
    assert.equal(sends, 1); assert.equal(wakeups, 0);
  });
  await t.test('SMTP rejection preserves the committed account email for retry without claiming success', async child => {
    const { messages } = outbox(child);
    child.mock.method(console, 'error', () => {});
    child.mock.method(nodemailer, 'createTransport', () => ({ close() {}, async sendMail() { throw { code: 'EAUTH', responseCode: 535 }; } }));
    const result = await deliverAccountEmailsNow({ emailId: '2' });
    assert.equal(result.status, 'PENDING'); assert.equal(result.sent, 0); assert.equal(result.pending, 1);
    assert.equal(messages[1].Attempts, 0); assert.ok(messages[1].EncryptedPayload);
  });
  await t.test('a message leased by another worker is not duplicated or reported sent prematurely', async child => {
    outbox(child, 'SENDING');
    child.mock.method(nodemailer, 'createTransport', () => ({ close() {}, async sendMail() { assert.fail('A leased email must not be sent twice'); } }));
    const result = await deliverAccountEmailsNow({ emailId: '2' });
    assert.equal(result.status, 'PENDING'); assert.equal(result.sent, 0);
  });
  await t.test('database failures after commit return unknown delivery status and safe logs', async child => {
    const logs = [];
    child.mock.method(console, 'error', line => logs.push(line));
    child.mock.method(pool, 'query', async () => { throw Object.assign(new Error('Private credentials'), { code: 'ECONNRESET' }); });
    assert.equal((await deliverAccountEmailsNow({ emailId: '2' })).status, 'UNKNOWN');
    assert.ok(logs[0].includes('ECONNRESET')); assert.ok(!logs[0].includes('Private'));
  });
});
