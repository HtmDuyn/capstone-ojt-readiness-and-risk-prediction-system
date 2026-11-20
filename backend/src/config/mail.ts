export type MailConfig = {
  host: string; port: number; secure: boolean; from: string;
  user?: string; password?: string;
};

export function mailConfig(): MailConfig {
  const host = process.env.SMTP_HOST?.trim(), from = process.env.SMTP_FROM?.trim();
  if (!host || !from) throw configError('SMTP_NOT_CONFIGURED', 'Configure SMTP_HOST and SMTP_FROM.');
  const port = Number(process.env.SMTP_PORT || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw configError('SMTP_PORT_INVALID', 'Configure a valid SMTP_PORT.');
  return { host, from, port, secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || undefined, password: process.env.SMTP_PASSWORD || undefined };
}

export function mailIsConfigured(): boolean {
  try { mailConfig(); return true; } catch { return false; }
}

function configError(code: string, message: string) {
  return Object.assign(new Error(message), { code, statusCode: 503 });
}
