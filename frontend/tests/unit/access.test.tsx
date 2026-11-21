import React from 'react';
import { beforeEach, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PrivateRoute, GuestRoute } from '../../src/routers/PrivateRouter';
import { getDashboardByRole } from '../../src/hooks/shared/useRoleRedirect';
import { tokenExpiry, expireSession, expireBearerSession, SESSION_EXPIRED_EVENT } from '../../src/utils/shared/authSession';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const register = require('../../../qa/register-case.cjs');
const auth = vi.hoisted(() => ({ isAuthenticated: true, isLoading: false, user: { role: 'student' } as any }));
vi.mock('../../src/hooks/shared/useAuth', () => ({ useAuth: () => auth }));
beforeEach(() => { auth.isAuthenticated = true; auth.isLoading = false; auth.user = { role: 'student' }; });
const roles = ['admin', 'education', 'qhdn', 'student', 'enterprise'] as const;
const codes = ['ADMIN', 'ACADEMIC', 'OJT_COORD', 'STUDENT', 'ENTERPRISE'];
const tc = register(test, { group: 'Authentication', source: 'frontend/src/routers/PrivateRouter.tsx', level: 'Component', precondition: 'jsdom; actual React Router; useAuth fixture; no live API.' });
function renderGuard(allowed: any) {
  return render(<MemoryRouter initialEntries={['/protected']}><Routes>
    <Route element={<PrivateRoute allowedRoles={[allowed]} />}><Route path="/protected" element={<div>Protected content</div>} /></Route>
    <Route path="/login" element={<div>Login destination</div>} />
    {roles.map(role => <Route key={role} path={`/${role}/dashboard`} element={<div>{role} dashboard destination</div>} />)}
  </Routes></MemoryRouter>);
}
for (const [i, role] of roles.entries()) {
  tc({ id: `FE-DASHBOARD-${i + 1}`, role: codes[i], title: `Dashboard mapping for ${codes[i]}`, input: role, source: 'frontend/src/hooks/shared/useRoleRedirect.ts', expected: `/${role}/dashboard.` }, () => expect(getDashboardByRole(role)).toBe(`/${role}/dashboard`));
  for (const [j, allowed] of roles.entries()) tc({ id: `FE-GUARD-${i + 1}-${j + 1}`, role: codes[i], type: role === allowed ? 'N' : 'A', title: `${codes[i]} visits ${codes[j]} frontend route`, input: `Authenticated role=${role}; allowed=${allowed}.`, expected: role === allowed ? 'Protected content visible.' : `Redirect to own /${role}/dashboard; protected content absent.` }, () => {
    auth.user = { role }; renderGuard(allowed);
    if (role === allowed) expect(screen.getByText('Protected content')).toBeInTheDocument();
    else { expect(screen.queryByText('Protected content')).not.toBeInTheDocument(); expect(screen.getByText(`${role} dashboard destination`)).toBeInTheDocument(); }
  });
}
tc({ id: 'FE-GUARD-GUEST', type: 'A', title: 'Anonymous user is redirected to login', input: 'isAuthenticated false; no user.', expected: 'Login visible; protected content absent.' }, () => { auth.isAuthenticated = false; auth.user = null; renderGuard('admin'); expect(screen.getByText('Login destination')).toBeInTheDocument(); expect(screen.queryByText('Protected content')).not.toBeInTheDocument(); });
tc({ id: 'FE-GUARD-LOADING', title: 'Loading authentication does not expose protected content', input: 'isLoading true.', expected: 'Loading message; no protected content or redirect.' }, () => { auth.isLoading = true; renderGuard('student'); expect(screen.getByText('Đang xác thực tài khoản...')).toBeInTheDocument(); expect(screen.queryByText('Protected content')).not.toBeInTheDocument(); });
tc({ id: 'FE-GUEST-REDIRECT', title: 'Authenticated user cannot remain on guest login route', input: 'Logged in enterprise; GuestRoute /login.', expected: 'Redirect to enterprise dashboard.' }, () => {
  auth.user = { role: 'enterprise' };
  render(<MemoryRouter initialEntries={['/login']}><Routes><Route element={<GuestRoute />}><Route path="/login" element={<div>Login form</div>} /></Route><Route path="/enterprise/dashboard" element={<div>Enterprise destination</div>} /></Routes></MemoryRouter>);
  expect(screen.getByText('Enterprise destination')).toBeInTheDocument(); expect(screen.queryByText('Login form')).not.toBeInTheDocument();
});

const session = register(test, { group: 'Authentication', source: 'frontend/src/utils/shared/authSession.ts', level: 'Unit', precondition: 'jsdom localStorage; synthetic JWT payload; no API.' });
session({ id: 'FE-SESSION-EXPIRY', title: 'Read JWT expiration as milliseconds', input: 'Synthetic JWT exp=1700000000.', expected: '1700000000000.' }, () => expect(tokenExpiry(`x.${btoa(JSON.stringify({ exp: 1700000000 }))}.y`)).toBe(1700000000000));
for (const [i, value] of ['garbage', 'x.invalid.y', `x.${btoa(JSON.stringify({ exp: 'invalid' }))}.y`].entries()) session({ id: `FE-SESSION-BAD-${i + 1}`, type: 'A', title: `Malformed JWT expiry ${i + 1} does not crash`, input: value, expected: '0.' }, () => expect(tokenExpiry(value)).toBe(0));
session({ id: 'FE-SESSION-STALE', title: 'A rejected previous token cannot log out the current account', input: 'Storage current-token; rejected previous-token.', expected: 'Current token and profile remain; no expired event.' }, () => {
  localStorage.setItem('ojt_auth_token', 'current-token'); localStorage.setItem('ojt_auth_user', 'current-user');
  const event = vi.fn(); window.addEventListener(SESSION_EXPIRED_EVENT, event);
  try { expireSession('previous-token'); expect(localStorage.getItem('ojt_auth_token')).toBe('current-token'); expect(localStorage.getItem('ojt_auth_user')).toBe('current-user'); expect(event).not.toHaveBeenCalled(); } finally { window.removeEventListener(SESSION_EXPIRED_EVENT, event); }
});
session({ id: 'FE-SESSION-CLEAR', title: 'Rejected active bearer token clears local identity and raises one event', input: 'Storage current-token; Bearer current-token rejected.', expected: 'Token/user removed; session-expired event emitted once.' }, () => {
  localStorage.setItem('ojt_auth_token', 'current-token'); localStorage.setItem('ojt_auth_user', 'current-user');
  const event = vi.fn(); window.addEventListener(SESSION_EXPIRED_EVENT, event);
  try { expireBearerSession('Bearer current-token'); expect(localStorage.getItem('ojt_auth_token')).toBeNull(); expect(localStorage.getItem('ojt_auth_user')).toBeNull(); expect(event).toHaveBeenCalledOnce(); } finally { window.removeEventListener(SESSION_EXPIRED_EVENT, event); }
});
