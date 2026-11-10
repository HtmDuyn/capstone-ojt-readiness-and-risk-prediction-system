const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

// All database and SMTP operations below are simulated. No accounts or emails
// are created outside this isolated test process.
delete process.env.DATABASE_URL;
delete process.env.SUPABASE_DATABASE_URL;
process.env.LOCAL_DATABASE_URL = 'postgresql://postgres@127.0.0.1:1/unused';
process.env.DB_SSL = 'false';
process.env.EMAIL_OUTBOX_KEY = randomBytes(32).toString('hex');
process.env.FRONTEND_LOGIN_URL = 'https://ojt.example.test/login';
process.env.SMTP_HOST = 'smtp.example.test';
process.env.SMTP_FROM = 'ojt@example.test';
const { pool } = require('../dist/config/database');
const { importAccounts } = require('../dist/modules/imports/import.service');
const { decryptEmail } = require('../dist/modules/imports/email.crypto');
const { deliverEmails } = require('../dist/jobs/provisioning');
const { assignEnterpriseCodes } = require('../dist/modules/imports/enterprise-code');
const { validateImport } = require('../dist/modules/imports/import.validation');

test('bulk enterprise import provisions accounts and delivers encrypted outbox messages', async t => {
  let state = { batches: [], users: [], enterprises: [], memberships: [], rows: [], emails: [] };
  let transaction;
  let existingAccount = null;
  let allocationReads = 0;
  const client = { release() {}, async query(sql, args = []) {
    if (sql === 'BEGIN') { transaction = structuredClone(state); return { rows: [] }; }
    if (sql === 'ROLLBACK') { transaction = undefined; return { rows: [] }; }
    if (sql === 'COMMIT') { state = transaction; transaction = undefined; return { rows: [] }; }
    if (sql.startsWith('SELECT r."RoleCode"')) return { rows: [{ RoleCode: 'OJT_COORD' }] };
    if (sql.includes('pg_advisory_xact_lock')) return { rows: [] };
    if (sql.startsWith('SELECT * FROM "AccountImportBatches"')) return { rows: transaction.batches.filter(batch => batch.IdempotencyKey === args[0]) };
    if (sql.startsWith('SELECT COALESCE(max(reserved.number),0)::text AS value')) {
      allocationReads++;
      const numbers = [...transaction.enterprises.map(enterprise => enterprise.code.match(/^DN(\d+)$/i)?.[1]), ...transaction.users.map(user => user.username.match(/^enterprise_DN(\d+)$/i)?.[1])].filter(Boolean).map(BigInt);
      return { rows: [{ value: numbers.reduce((max, value) => value > max ? value : max, 0n).toString() }] };
    }
    if (sql.startsWith('SELECT e."EnterpriseID"')) return { rows: existingAccount ? [existingAccount] : [] };
    if (sql.startsWith('SELECT "UserID" FROM "Users"') || sql.startsWith('SELECT 1 FROM "Users"')) return { rows: [], rowCount: 0 };
    if (sql.startsWith('INSERT INTO "AccountImportBatches"')) {
      const batch = { BatchID: transaction.batches.length + 1, IdempotencyKey: args[0], PayloadHash: args[1], ImportedBy: args[4], Summary: args[5] };
      transaction.batches.push(batch); return { rows: [{ BatchID: batch.BatchID }] };
    }
    if (sql.startsWith('INSERT INTO "Users"')) {
      const user = { id: transaction.users.length + 100, username: args[0], email: args[1], fullName: args[2], hash: args[3], expiresAt: args[4], role: args[5] };
      transaction.users.push(user); return { rows: [{ UserID: user.id }] };
    }
    if (sql.startsWith('INSERT INTO "EmailOutbox"')) {
      transaction.emails.push({ EmailID: transaction.emails.length + 1, UserID: args[0], Recipient: args[1], EncryptedPayload: args[2], ExpiresAt: args[3], Status: 'PENDING', Kind: 'ACCOUNT', Attempts: 0 });
      return { rows: [] };
    }
    if (sql.startsWith('INSERT INTO "Enterprises"')) {
      const enterprise = { id: transaction.enterprises.length + 500, code: args[0], name: args[1], email: args[3] };
      transaction.enterprises.push(enterprise); return { rows: [{ EnterpriseID: enterprise.id }] };
    }
    if (sql.startsWith('INSERT INTO "EnterpriseUsers"')) { transaction.memberships.push(args); return { rows: [] }; }
    if (sql.startsWith('INSERT INTO "AccountImportRows"')) { transaction.rows.push(args); return { rows: [] }; }
    throw Error('Unexpected import database operation');
  } };
  t.mock.method(pool, 'connect', async () => client);
  t.after(() => pool.end());
  const body = { kind: 'ENTERPRISE', idempotencyKey: 'test-enterprise-import-batch', rows: [
    { name: 'Công ty A', fullName: 'Nguyễn An', email: 'HR_A@example.test' },
    { name: 'Công ty B', fullName: 'Trần Bình', email: 'HR_B@example.test' },
  ] };

  await t.test('preview validates the whole batch without creating users or queued emails', async () => {
    const preview = await importAccounts(body, 42, true);
    assert.equal(preview.preview, true);
    assert.equal(preview.created, 2);
    assert.equal(preview.total, 2);
    assert.equal(state.users.length, 0);
    assert.equal(state.emails.length, 0);
    assert.deepEqual(preview.rows.map(row => row.code), ['DN000001', 'DN000002']);
  });
  await t.test('commit creates two enterprise identities with unique temporary credentials and one email each', async () => {
    const result = await importAccounts(body, 42);
    assert.equal(result.created, 2);
    assert.equal(result.replayed, false);
    assert.equal(state.users.length, 2);
    assert.equal(state.enterprises.length, 2);
    assert.equal(state.memberships.length, 2);
    assert.equal(state.emails.length, 2);
    assert.deepEqual(state.enterprises.map(enterprise => enterprise.code), ['DN000001', 'DN000002']);
    assert.deepEqual(state.users.map(user => user.username), ['enterprise_DN000001', 'enterprise_DN000002']);
    const passwords = [];
    for (const email of state.emails) {
      const user = state.users.find(user => user.id === email.UserID);
      const content = decryptEmail(email.EncryptedPayload);
      const password = content.text.match(/Mật khẩu tạm: (\S+)/)[1];
      passwords.push(password);
      assert.equal(email.Recipient, user.email);
      assert.equal(email.Recipient, email.Recipient.toLowerCase());
      assert.equal(user.role, 'ENTERPRISE');
      assert.equal(await bcrypt.compare(password, user.hash), true);
      assert.ok(new Date(user.expiresAt) > new Date());
      assert.ok(content.text.includes(process.env.FRONTEND_LOGIN_URL));
      assert.ok(content.text.includes('đổi mật khẩu'));
      assert.ok(content.text.includes('Mã doanh nghiệp: ' + user.username.slice('enterprise_'.length)));
      assert.ok(!email.EncryptedPayload.includes(password));
    }
    assert.equal(new Set(passwords).size, 2);
    assert.equal(Object.hasOwn(result, 'password'), false);
  });
  await t.test('retrying an identical import does not create duplicate accounts or emails', async () => {
    const reads = allocationReads;
    assert.equal((await importAccounts(body, 42)).replayed, true);
    assert.equal(allocationReads, reads);
    assert.equal(state.users.length, 2);
    assert.equal(state.emails.length, 2);
  });
  await t.test('enterprise codes are optional while student codes remain mandatory', () => {
    const normalized = validateImport(body);
    assert.deepEqual(normalized.rows.map(row => row.code), ['', '']);
    assert.equal(validateImport({ ...body, rows: [{ ...body.rows[0], code: ' ' }] }).rows[0].code, '');
    assert.equal(validateImport({ ...body, rows: [{ ...body.rows[0], code: 'legacy_01' }] }).rows[0].code, 'LEGACY_01');
    assert.throws(() => validateImport({ kind: 'STUDENT', idempotencyKey: 'student-missing-code', rows: [{ email: 'student@example.test', fullName: 'Student', academic: {} }] }), /code is required/);
  });
  await t.test('generated codes skip occupied numbers and explicit codes in the same import', async () => {
    const rows = [{ code: 'DN000010' }, { code: '' }, { code: '' }];
    const query = async () => ({ rows: [{ value: '9' }] });
    await assignEnterpriseCodes({ query }, rows);
    assert.deepEqual(rows.map(row => row.code), ['DN000010', 'DN000011', 'DN000012']);
    const large = [{ code: '' }];
    await assignEnterpriseCodes({ query: async () => ({ rows: [{ value: '999999' }] }) }, large);
    assert.equal(large[0].code, 'DN1000000');
    await assert.rejects(assignEnterpriseCodes({ query: async () => ({ rows: [{ value: '999999999999999999' }] }) }, [{ code: '' }]), error => error.errorCode === 'ENTERPRISE_CODE_EXHAUSTED');
  });
  await t.test('existing enterprise accounts cause the batch to fail without changing credentials', async () => {
    existingAccount = { entity_id: 500, UserID: 100, Email: 'hr_a@example.test', RoleCode: 'ENTERPRISE', DeletedAt: null, EnterpriseStatus: 'ACTIVE', UserStatus: 'ACTIVE' };
    await assert.rejects(importAccounts({ ...body, idempotencyKey: 'existing-account-test' }, 42), error => error.errorCode === 'ENTERPRISE_ACCOUNT_EXISTS');
    existingAccount = null;
    assert.equal(state.users.length, 2);
    assert.equal(state.emails.length, 2);
  });
  await t.test('the mail worker sends each recipient their credentials and retires the encrypted payload', async () => {
    const sent = [];
    let closed = false;
    t.mock.method(nodemailer, 'createTransport', () => ({ async sendMail(message) { sent.push(message); return { accepted: [message.to] }; }, close() { closed = true; } }));
    t.mock.method(pool, 'query', async (sql, args = []) => {
      if (sql.startsWith('WITH candidate AS')) {
        const email = state.emails.find(email => email.Status === 'PENDING');
        if (!email) return { rows: [] };
        email.Status = 'SENDING'; email.Attempts++;
        return { rows: [{ ...email }] };
      }
      if (sql.startsWith('UPDATE "EmailOutbox" SET "Status"=\'SENT\'')) {
        const email = state.emails.find(email => email.EmailID === args[0]);
        email.Status = 'SENT'; email.EncryptedPayload = null;
        return { rows: [] };
      }
      if (sql.startsWith('UPDATE "EmailOutbox"')) return { rows: [] };
      throw Error('Unexpected email worker database operation');
    });
    assert.equal(await deliverEmails(), 2);
    assert.deepEqual(sent.map(message => message.to), ['hr_a@example.test', 'hr_b@example.test']);
    assert.ok(sent.every(message => message.text.includes('Mật khẩu tạm:') && message.from === 'ojt@example.test'));
    assert.ok(state.emails.every(email => email.Status === 'SENT' && email.EncryptedPayload === null));
    assert.equal(closed, true);
  });
});
