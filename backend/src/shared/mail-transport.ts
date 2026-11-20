import nodemailer from 'nodemailer';
import type { MailConfig } from '../config/mail';
import { frontendLoginUrl } from '../config/frontend';

export type MailMessage = { to: string; subject: string; text: string; html?: string; reference: string };
export type MailTransport = { send(message: MailMessage): Promise<void>; verify(): Promise<void>; close(): void };
export function createMailTransport(config: MailConfig): MailTransport {
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
