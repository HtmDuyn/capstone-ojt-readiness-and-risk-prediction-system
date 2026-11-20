export type MailConfig = {
  provider: 'mailjet'; apiKey: string; secretKey: string; fromEmail: string; fromName: string;
} | {
  provider: 'smtp'; host: string; port: number; secure: boolean; from: string;
  user?: string; password?: string;
};

export function mailConfig(): MailConfig {
  const provider = process.env.MAIL_PROVIDER?.trim().toLowerCase() || 'smtp';
  if (provider === 'mailjet') {
    const apiKey = process.env.MAILJET_API_KEY?.trim();
    const secretKey = process.env.MAILJET_SECRET_KEY?.trim();
    const fromEmail = process.env.MAIL_FROM_EMAIL?.trim();
    const fromName = process.env.MAIL_FROM_NAME?.trim() || 'Hệ thống OJT';
    if (!apiKey || !secretKey || !fromEmail) throw configError('MAILJET_NOT_CONFIGURED',
      'Configure MAILJET_API_KEY, MAILJET_SECRET_KEY and MAIL_FROM_EMAIL.');
    if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(fromEmail) || /[\r\n]/.test(fromName))
      throw configError('MAIL_SENDER_INVALID', 'Configure a valid Mailjet sender email and name.');
    return { provider, apiKey, secretKey, fromEmail, fromName };
  }
  if (provider !== 'smtp') throw configError('MAIL_PROVIDER_INVALID', 'MAIL_PROVIDER must be mailjet or smtp.');
  const host = process.env.SMTP_HOST?.trim(), from = process.env.SMTP_FROM?.trim();
  if (!host || !from) throw configError('SMTP_NOT_CONFIGURED', 'Configure SMTP_HOST and SMTP_FROM.');
  const port = Number(process.env.SMTP_PORT || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw configError('SMTP_PORT_INVALID', 'Configure a valid SMTP_PORT.');
  return { provider, host, from, port, secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || undefined, password: process.env.SMTP_PASSWORD || undefined };
}

export function mailIsConfigured(): boolean {
  try { mailConfig(); return true; } catch { return false; }
}

function configError(code: string, message: string) {
  return Object.assign(new Error(message), { code, statusCode: 503 });
}
