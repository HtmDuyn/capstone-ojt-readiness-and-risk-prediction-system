import nodemailer from 'nodemailer';
import { mailConfig, type MailConfig } from '../config/mail';
import { frontendLoginUrl } from '../config/frontend';

export type MailMessage = { to: string; subject: string; text: string; html?: string; reference: string };
export type MailTransport = { send(message: MailMessage): Promise<void>; verify(): Promise<void>; close(): void };
const mailjetEndpoint = 'https://api.mailjet.com/v3.1/send';

export function createMailTransport(config: MailConfig = mailConfig()): MailTransport {
  if (config.provider === 'mailjet') return {
    send: message => mailjetRequest(config, message, false),
    verify: () => mailjetRequest(config, {
      to: config.fromEmail, subject: 'OJT - Kiểm tra cấu hình Mailjet',
      text: 'Kiểm tra cấu hình ở Sandbox Mode. Không gửi email.', reference: 'configuration-check',
    }, true),
    close() {},
  };
  const smtp = nodemailer.createTransport({ host: config.host, port: config.port, secure: config.secure,
    auth: config.user ? { user: config.user, pass: config.password } : undefined,
    connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 30000 });
  return {
    async send(message) {
      const hostname = new URL(frontendLoginUrl()).hostname;
      const delivery = await smtp.sendMail({ from: config.from, to: message.to, subject: message.subject,
        text: message.text, html: message.html, messageId: `<ojt-${message.reference}@${hostname}>` });
      if (!delivery.accepted.length) throw deliveryError('EMAIL_REJECTED');
    },
    async verify() { await smtp.verify(); },
    close() { smtp.close(); },
  };
}

async function mailjetRequest(config: Extract<MailConfig, { provider: 'mailjet' }>, message: MailMessage, sandbox: boolean) {
  let response: Response;
  try {
    response = await fetch(mailjetEndpoint, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(30000),
      headers: { 'Content-Type': 'application/json', Accept: 'application/json',
        Authorization: 'Basic ' + Buffer.from(`${config.apiKey}:${config.secretKey}`).toString('base64') },
      body: JSON.stringify({ ...(sandbox ? { SandboxMode: true } : {}), Messages: [{
        From: { Email: config.fromEmail, Name: config.fromName }, To: [{ Email: message.to }],
        Subject: message.subject, TextPart: message.text, ...(message.html ? { HTMLPart: message.html } : {}),
        CustomID: `ojt-${message.reference}`,
      }] }),
    });
  } catch (error) {
    // Provider/network exceptions can contain credentials or message content.
    const name = (error as { name?: string })?.name;
    throw deliveryError(['AbortError', 'TimeoutError'].includes(name ?? '') ? 'ETIMEDOUT' : 'ECONNECTION');
  }
  let body: any;
  try { body = await response.json(); }
  catch {
    if (!response.ok) throw mailjetError(response.status);
    throw deliveryError('MAILJET_INVALID_RESPONSE');
  }
  const result = Array.isArray(body?.Messages) && body.Messages.length === 1 ? body.Messages[0] : undefined;
  if (!response.ok || result?.Status === 'error') {
    const error = result?.Errors?.[0] ?? body;
    throw mailjetError(response.ok ? Number(error?.StatusCode) || 400 : response.status, error?.ErrorCode);
  }
  const recipient = Array.isArray(result?.To) ? result.To.find((entry: any) =>
    typeof entry?.Email === 'string' && entry.Email.toLowerCase() === message.to.toLowerCase()) : undefined;
  const accepted = typeof recipient?.MessageUUID === 'string' && !!recipient.MessageUUID
    || typeof recipient?.MessageID === 'number' && recipient.MessageID > 0
    || typeof recipient?.MessageID === 'string' && /^[1-9]\d*$/.test(recipient.MessageID);
  if (result?.Status !== 'success' || !recipient || (!sandbox && !accepted))
    throw deliveryError('MAILJET_INVALID_RESPONSE');
}

function mailjetError(status: number, providerCode?: unknown) {
  const code = status === 401 ? 'EAUTH'
    : status === 403 && ['send-0007', 'send-0008'].includes(String(providerCode)) ? 'MAILJET_SENDER_NOT_VERIFIED'
    : status === 403 ? 'MAILJET_FORBIDDEN'
    : status === 429 ? 'MAILJET_RATE_LIMIT'
    : status >= 500 ? 'MAILJET_UNAVAILABLE' : 'MAILJET_REJECTED';
  return deliveryError(code, status);
}

function deliveryError(code: string, responseCode?: number) {
  return Object.assign(new Error(code), { code, ...(responseCode ? { responseCode } : {}) });
}
