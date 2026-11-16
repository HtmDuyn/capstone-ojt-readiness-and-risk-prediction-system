import { clearEducationReadCache } from './educationReadCache';

export const SESSION_EXPIRED_EVENT = 'ojt:session-expired';
export function tokenExpiry(token: string): number {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(payload));
    return typeof exp === 'number' && Number.isFinite(exp) ? exp * 1000 : 0;
  } catch { return 0; }
}
export function expireSession(rejectedToken: string | null) {
  // An old request must never sign out a newly authenticated account.
  if (!rejectedToken || localStorage.getItem('ojt_auth_token') !== rejectedToken) return;
  localStorage.removeItem('ojt_auth_token');
  localStorage.removeItem('ojt_auth_user');
  clearEducationReadCache();
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}
export function expireBearerSession(authorization: unknown) {
  if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) expireSession(authorization.slice(7).trim());
}
