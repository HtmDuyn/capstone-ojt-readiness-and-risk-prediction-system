import { BrevoClient, BrevoError, BrevoTimeoutError } from '@getbrevo/brevo';
import nodemailer from 'nodemailer';
import type { MailConfig } from '../config/mail';
import { frontendLoginUrl } from '../config/frontend';

export type MailMessage = { to: string; subject: string; text: string; html?: string; reference: string };
export type MailTransport = { send(message: MailMessage): Promise<void>; verify(): Promise<void>; close(): void };
export function createMailTransport(config: MailConfig): MailTransport {
  if (config.provider === 'brevo') return createBrevoTransport(config);

  const smtp = nodemailer.createTransport({ host: config.host, port: config.port, secure: config.secure,
    auth: config.user ? { user: config.user, pass: config.password } : undefined,
    connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 30000 });
  return {
    async send(message) {
      const hostname = new URL(frontendLoginUrl()).hostname;
      const delivery = await smtp.sendMail({ from: config.from, to: message.to, subject: message.subject,
        text: message.text, html: message.html, messageId: `<ojt-${message.reference}@${hostname}>` });
      if (!delivery.accepted.length) throw Object.assign(new Error('EMAIL_REJECTED'), { code: 'EMAIL_REJECTED' });
    },
    async verify() { await smtp.verify(); },
    close() { smtp.close(); },
  };
}

function createBrevoTransport(config: Extract<MailConfig, { provider: 'brevo' }>): MailTransport {
  const client = new BrevoClient({
    apiKey: config.apiKey,
    timeoutInSeconds: 15,
    // The outbox controls retries. The SDK must not repeat a send on its own.
    maxRetries: 0,
    logging: { silent: true },
    fetch: (input, init) => fetch(input, { ...init, redirect: 'error' }),
  });

  async function send(message: MailMessage, sandbox = false) {
    try {
      const result = await client.transactionalEmails.sendTransacEmail({
        sender: { email: config.fromEmail, name: config.fromName },
        to: [{ email: message.to }],
        subject: message.subject,
        textContent: message.text,
        htmlContent: message.html,
        ...(sandbox ? { headers: { 'X-Sib-Sandbox': 'drop' } } : {}),
      });
      if (typeof result?.messageId === 'string' && result.messageId.trim()) return;
    } catch (error) {
      // SDK errors may contain request data. Only expose the status and a known code.
      const status = error instanceof BrevoError ? error.statusCode : undefined;
      const code = error instanceof BrevoTimeoutError ? 'ETIMEDOUT'
        : status === 401 ? 'EAUTH'
        : status === 403 ? 'BREVO_FORBIDDEN'
        : status === 429 ? 'BREVO_RATE_LIMIT'
        : status !== undefined && status >= 500 ? 'BREVO_UNAVAILABLE'
        : status !== undefined ? 'BREVO_REJECTED' : 'ECONNECTION';
      throw Object.assign(new Error(code), { code, responseCode: status });
    }
    throw Object.assign(new Error('BREVO_INVALID_RESPONSE'), { code: 'BREVO_INVALID_RESPONSE' });
  }

  return {
    send,
    verify: () => send({
      to: config.fromEmail,
      subject: 'OJT - Kiểm tra cấu hình Brevo',
      text: 'Kiểm tra cấu hình dịch vụ gửi email.',
      reference: 'configuration-check',
    }, true),
    close() {},
  };
}
