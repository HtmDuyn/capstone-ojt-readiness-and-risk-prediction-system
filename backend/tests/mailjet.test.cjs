const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mailConfig, mailIsConfigured } = require('../dist/config/mail');
const { createMailTransport } = require('../dist/shared/mail-transport');
const config = { provider: 'mailjet', apiKey: 'test-api-key', secretKey: 'test-secret-key', fromEmail: 'hg2922004@gmail.com', fromName: 'Hệ thống OJT' };
const message = { to: 'student@example.test', subject: 'Tài khoản OJT', text: 'Private temporary password', html: '<p>Welcome</p>', reference: '42' };
const accepted = (to = message.to) => ({ Messages: [{ Status: 'success', To: [{ Email: to, MessageID: 123, MessageUUID: 'message-123' }] }] });
const response = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function configure(t, patch = {}) {
  const values = { MAIL_PROVIDER: 'mailjet', MAILJET_API_KEY: config.apiKey, MAILJET_SECRET_KEY: config.secretKey,
    MAIL_FROM_EMAIL: config.fromEmail, MAIL_FROM_NAME: config.fromName, SMTP_HOST: undefined, SMTP_FROM: undefined, ...patch };
  const previous = Object.fromEntries(Object.keys(values).map(key => [key, process.env[key]]));
  for (const [key, value] of Object.entries(values)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  t.after(() => { for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } });
}

test('Mailjet configuration works without SMTP and never silently falls back to Gmail', t => {
  configure(t);
  assert.deepEqual(mailConfig(), config); assert.equal(mailIsConfigured(), true);
  process.env.MAILJET_SECRET_KEY = '';
  assert.equal(mailIsConfigured(), false);
  assert.throws(() => mailConfig(), { code: 'MAILJET_NOT_CONFIGURED' });
  process.env.MAILJET_SECRET_KEY = config.secretKey;
  process.env.MAIL_FROM_EMAIL = 'invalid sender';
  assert.throws(() => mailConfig(), { code: 'MAIL_SENDER_INVALID' });
  process.env.MAIL_PROVIDER = 'unknown';
  assert.throws(() => mailConfig(), { code: 'MAIL_PROVIDER_INVALID' });
});

test('Mailjet sends one recipient per HTTPS request, authenticates with key pair and preserves HTML', async t => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, options, payload: JSON.parse(options.body) });
    return response(accepted(JSON.parse(options.body).Messages[0].To[0].Email));
  });
  const transport = createMailTransport(config);
  await transport.send(message); await transport.send({ ...message, to: 'enterprise@example.test', reference: '43' }); transport.close();
  assert.equal(calls.length, 2);
  for (const call of calls) {
    assert.equal(call.url, 'https://api.mailjet.com/v3.1/send'); assert.equal(call.options.redirect, 'error');
    assert.equal(call.options.headers.Authorization, 'Basic ' + Buffer.from(`${config.apiKey}:${config.secretKey}`).toString('base64'));
    assert.equal(call.payload.Messages.length, 1); assert.equal(call.payload.Messages[0].To.length, 1);
    assert.deepEqual(call.payload.Messages[0].From, { Email: config.fromEmail, Name: config.fromName });
    assert.equal(call.payload.Messages[0].HTMLPart, message.html); assert.equal(call.payload.Messages[0].TextPart, message.text);
    assert.equal(call.payload.SandboxMode, undefined); assert.equal(call.payload.Messages[0].Headers, undefined);
    assert.ok(call.options.signal instanceof AbortSignal);
  }
  assert.equal(calls[0].payload.Messages[0].CustomID, 'ojt-42');
});

test('Mailjet configuration check uses SandboxMode and cannot accidentally count as a real send', async t => {
  let payload;
  t.mock.method(globalThis, 'fetch', async (_, options) => {
    payload = JSON.parse(options.body);
    return response({ Messages: [{ Status: 'success', To: [{ Email: payload.Messages[0].To[0].Email, MessageID: 0, MessageUUID: '' }] }] });
  });
  const transport = createMailTransport(config);
  await transport.verify();
  assert.equal(payload.SandboxMode, true); assert.equal(payload.Messages[0].To[0].Email, config.fromEmail);
  await assert.rejects(transport.send(message), { code: 'MAILJET_INVALID_RESPONSE' });
});

test('Mailjet HTTP and per-message failures expose only safe codes', async t => {
  const failures = [
    [401, { ErrorCode: 'mj-0015', ErrorMessage: 'Private key' }, 'EAUTH'],
    [403, { ErrorCode: 'send-0008', ErrorMessage: 'Private sender' }, 'MAILJET_SENDER_NOT_VERIFIED'],
    [403, {}, 'MAILJET_FORBIDDEN'], [429, {}, 'MAILJET_RATE_LIMIT'], [503, {}, 'MAILJET_UNAVAILABLE'], [400, {}, 'MAILJET_REJECTED'],
    [200, { Messages: [{ Status: 'error', Errors: [{ StatusCode: 403, ErrorCode: 'send-0007', ErrorMessage: message.text }] }] }, 'MAILJET_SENDER_NOT_VERIFIED'],
  ];
  for (const [status, body, code] of failures) await t.test(code + status, async child => {
    child.mock.method(globalThis, 'fetch', async () => response(body, status));
    await assert.rejects(createMailTransport(config).send(message), error => {
      assert.equal(error.code, code); assert.ok(!error.message.includes('Private')); assert.ok(!error.message.includes(config.secretKey)); return true;
    });
  });
});

test('Mailjet malformed responses, wrong recipients and network errors never count as acceptance', async t => {
  for (const body of [{}, { Messages: [] }, accepted('another@example.test'), { Messages: [{ Status: 'success', To: [{ Email: message.to }] }] }]) {
    const stub = t.mock.method(globalThis, 'fetch', async () => response(body));
    await assert.rejects(createMailTransport(config).send(message), { code: 'MAILJET_INVALID_RESPONSE' }); stub.mock.restore();
  }
  let stub = t.mock.method(globalThis, 'fetch', async () => new Response('not-json', { status: 200 }));
  await assert.rejects(createMailTransport(config).send(message), { code: 'MAILJET_INVALID_RESPONSE' }); stub.mock.restore();
  stub = t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('Private key and message content'); });
  await assert.rejects(createMailTransport(config).send(message), { code: 'ECONNECTION' }); stub.mock.restore();
  t.mock.method(globalThis, 'fetch', async () => { throw Object.assign(new Error('Private response'), { name: 'TimeoutError' }); });
  await assert.rejects(createMailTransport(config).send(message), { code: 'ETIMEDOUT' });
});
