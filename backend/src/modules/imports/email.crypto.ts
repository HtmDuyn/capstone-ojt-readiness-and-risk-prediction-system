import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
export function emailKey(): Buffer {
  const value = process.env.EMAIL_OUTBOX_KEY ?? '';
  if (!/^[a-f0-9]{64}$/i.test(value)) throw new Error('EMAIL_OUTBOX_KEY must be a 32-byte hexadecimal key.');
  return Buffer.from(value, 'hex');
}
export function encryptEmail(value: object): string {
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', emailKey(), iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map(b => b.toString('base64')).join('.');
}
export function decryptEmail(value: string): { subject: string; text: string } {
  const [iv, tag, data] = value.split('.').map(s => Buffer.from(s, 'base64'));
  const cipher = createDecipheriv('aes-256-gcm', emailKey(), iv);
  cipher.setAuthTag(tag);
  return JSON.parse(Buffer.concat([cipher.update(data), cipher.final()]).toString('utf8'));
}
