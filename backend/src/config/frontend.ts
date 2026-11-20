export const PRODUCTION_FRONTEND_ORIGIN = 'https://capstone-ojt-readiness-and-risk-pre.vercel.app';
export const PRODUCTION_LOGIN_URL = `${PRODUCTION_FRONTEND_ORIGIN}/login`;

// Email recipients need a public URL even when accounts are imported locally.
export function frontendLoginUrl(configured = process.env.FRONTEND_LOGIN_URL): string {
  if (!configured?.trim()) return PRODUCTION_LOGIN_URL;
  let url: URL;
  try { url = new URL(configured.trim()); }
  catch { throw Object.assign(new Error('FRONTEND_LOGIN_URL must be an absolute HTTP/HTTPS URL.'), { code: 'FRONTEND_LOGIN_URL_INVALID' }); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password)
    throw Object.assign(new Error('FRONTEND_LOGIN_URL must be an absolute HTTP/HTTPS URL without credentials.'), { code: 'FRONTEND_LOGIN_URL_INVALID' });
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') || /^127\./.test(host) || ['[::1]', '0.0.0.0'].includes(host))
    return PRODUCTION_LOGIN_URL;
  if (url.pathname === '/') url.pathname = '/login';
  return url.toString();
}
