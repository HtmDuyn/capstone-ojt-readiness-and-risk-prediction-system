// Verifies the selected transport without delivering email.
require('../dist/config/env');
const { mailConfig } = require('../dist/config/mail');
const { emailKey } = require('../dist/modules/imports/email.crypto');
const { createMailTransport } = require('../dist/shared/mail-transport');
let provider;
(async () => {
  const config = mailConfig();
  provider = config.provider;
  emailKey();
  let login;
  try { login = new URL(process.env.FRONTEND_LOGIN_URL || ''); } catch { /* Report only a safe code below. */ }
  if (!login || !['https:', 'http:'].includes(login.protocol))
    throw Object.assign(new Error(), { code: 'FRONTEND_LOGIN_URL_INVALID' });
  console.log('Mail transport:', provider);
  const transport = createMailTransport(config);
  try {
    await transport.verify();
    console.log(provider === 'brevo' ? 'Brevo Sandbox verification OK. No email sent.' : 'SMTP verification OK. No email sent.');
  } finally { transport.close(); }
})().catch(error => {
  const code = String(error.code || 'MAIL_CHECK_FAILED').replace(/[^A-Za-z0-9_]/g, '').slice(0,80);
  const status = Number.isInteger(error.responseCode) && error.responseCode >= 400 && error.responseCode <= 599
    ? `_${error.responseCode}` : '';
  console.error(`Mail configuration check failed. Code: ${code}${status}.`);
  if (provider === 'brevo' && (code === 'EAUTH' || code === 'BREVO_FORBIDDEN'))
    console.error('Brevo denied the request. Check BREVO_API_KEY and transactional email permissions.');
  else if (code === 'EAUTH')
    console.error('SMTP rejected authentication. Check SMTP_USER and SMTP_PASSWORD.');
  process.exitCode = 1;
});
