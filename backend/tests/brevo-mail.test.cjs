const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createMailTransport } = require('../dist/shared/mail-transport');

const config = { provider: 'brevo', apiKey: 'test-brevo-api-key', fromEmail: 'ojt@example.test', fromName: 'OJT' };
const message = { to: 'student@example.test', subject: 'OJT', text: 'Test message', html: '<p>Test message</p>', reference: '12' };

test('Brevo uses the API key and sends a Sandbox header only for verification', async t => {
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    requests.push({ url: String(url), headers: new Headers(options.headers), body: JSON.parse(options.body) });
    return Response.json({ messageId: '<test@example.test>' }, { status: 201 });
  });
  const transport = createMailTransport(config);
  await transport.send(message);
  await transport.verify();

  const [delivery, check] = requests;
  assert.equal(requests.length, 2);
  assert.equal(delivery.url, 'https://api.brevo.com/v3/smtp/email');
  assert.equal(delivery.headers.get('api-key'), config.apiKey);
  assert.deepEqual(delivery.body.sender, { email: config.fromEmail, name: config.fromName });
  assert.deepEqual(delivery.body.to, [{ email: message.to }]);
  assert.equal(delivery.body.textContent, message.text);
  assert.equal(delivery.body.htmlContent, message.html);
  assert.equal(delivery.body.headers, undefined);
  assert.deepEqual(check.body.headers, { 'X-Sib-Sandbox': 'drop' });
});

test('Brevo errors are safe to record and the SDK leaves retries to the outbox', async t => {
  for (const [status, expected] of [[401, 'EAUTH'], [403, 'BREVO_FORBIDDEN'], [429, 'BREVO_RATE_LIMIT'], [503, 'BREVO_UNAVAILABLE']]) {
    await t.test(expected, async child => {
      const fetch = child.mock.method(globalThis, 'fetch', async () =>
        Response.json({ message: 'Private provider response' }, { status }));
      await assert.rejects(createMailTransport(config).send(message), {
        code: expected, responseCode: status, message: expected,
      });
      assert.equal(fetch.mock.callCount(), 1);
    });
  }
});

test('Brevo success without a message ID is not accepted', async t => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({}, { status: 201 }));
  await assert.rejects(createMailTransport(config).send(message), { code: 'BREVO_INVALID_RESPONSE' });
});
