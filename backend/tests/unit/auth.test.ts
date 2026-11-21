import { beforeEach, expect, test, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findByEmail, findById } from '../../src/modules/auth/auth.repository';
import { loginUser, verifyPassword, publicAuthUser, getUserById, changePassword } from '../../src/modules/auth/auth.service';
import { authenticate } from '../../src/middleware/authenticate';
import { authorizeRoles } from '../../src/middleware/authorize';
import { query } from '../../src/config/database';
import type { AuthUserRecord, RoleCode } from '../../src/modules/auth/auth.types';
const register = require('../../../qa/register-case.cjs');
vi.mock('../../src/modules/auth/auth.repository', () => ({ findByEmail: vi.fn(), findById: vi.fn() }));
const roles: RoleCode[] = ['ADMIN', 'ACADEMIC', 'OJT_COORD', 'STUDENT', 'ENTERPRISE'];
const password = 'fixture-password-123';
const hash = bcrypt.hashSync(password, 4);
const user = (role: RoleCode = 'STUDENT', extra = {}): AuthUserRecord => ({
  id: 7, username: 'fixture', email: 'fixture@example.test', full_name: 'Fixture Student',
  status: 'ACTIVE', password_hash: hash, must_change_password: false,
  temporary_password_expires_at: null, auth_version: 2, role_code: role, role_name: role,
  studentId: 11, enterpriseId: null, enterpriseActive: true, ...extra,
});
const tc = register(test, { group: 'Authentication', source: 'backend/src/modules/auth/auth.service.ts' });
beforeEach(() => { vi.clearAllMocks(); vi.mocked(findByEmail).mockResolvedValue(user()); vi.mocked(findById).mockResolvedValue(user()); });

for (const [i, role] of roles.entries()) {
  tc({ id: `AUTH-LOGIN-${i + 1}`, role, title: `Login returns a valid signed token for ${role}`, input: 'Active fixture; matching bcrypt password.', expected: 'JWT signature verifies; subject, authVersion and role match; no password hash in response.' }, async () => {
    vi.mocked(findByEmail).mockResolvedValue(user(role));
    const result = await loginUser('  FIXTURE@EXAMPLE.TEST ', password);
    expect(findByEmail).toHaveBeenCalledWith('fixture@example.test');
    expect(jwt.verify(result.token, process.env.JWT_SECRET!)).toMatchObject({ userId: 7, roleCode: role, authVersion: 2, sub: '7' });
    expect(result.user).not.toHaveProperty('password_hash'); expect(result.user).not.toHaveProperty('auth_version');
    expect(result.user.roleCode).toBe(role);
  });
}
for (const [id, email, pass, code] of [
  ['AUTH-EMPTY-EMAIL', '', password, 'MISSING_EMAIL'],
  ['AUTH-EMPTY-PASSWORD', 'a@example.test', '', 'MISSING_PASSWORD'],
  ['AUTH-OBJECT-EMAIL', {}, password, 'MISSING_EMAIL'],
] as const) tc({ id, type: 'A', title: `Reject ${code}: ${id}`, input: JSON.stringify({ email, password: pass ? '<fixture>' : '' }), expected: `HTTP 400 / ${code}; repository not queried.` }, async () => {
  await expect(loginUser(email, pass)).rejects.toMatchObject({ statusCode: 400, errorCode: code });
  expect(findByEmail).not.toHaveBeenCalled();
});
tc({ id: 'AUTH-UNKNOWN', type: 'A', title: 'Unknown email gives generic invalid credentials', input: 'Email absent from repository.', expected: '401 INVALID_CREDENTIALS.' }, async () => {
  vi.mocked(findByEmail).mockResolvedValue(null);
  await expect(loginUser('absent@example.test', password)).rejects.toMatchObject({ statusCode: 401, errorCode: 'INVALID_CREDENTIALS' });
});
tc({ id: 'AUTH-WRONG', type: 'A', title: 'Incorrect password gives generic invalid credentials', input: 'Existing account, wrong fixture password.', expected: '401 INVALID_CREDENTIALS.' }, async () => {
  await expect(loginUser('fixture@example.test', 'wrong')).rejects.toMatchObject({ statusCode: 401, errorCode: 'INVALID_CREDENTIALS' });
});
for (const [id, role, extra] of [
  ['AUTH-LOCKED', 'STUDENT', { status: 'INACTIVE' }],
  ['AUTH-ENTERPRISE-INACTIVE', 'ENTERPRISE', { enterpriseActive: false }],
  ['AUTH-TEMP-EXPIRED', 'STUDENT', { must_change_password: true, temporary_password_expires_at: new Date(0) }],
] as const) tc({ id, type: 'A', role, title: `Reject ${id}`, input: JSON.stringify(extra), expected: id.includes('TEMP') ? '403 TEMPORARY_PASSWORD_EXPIRED.' : '403 ACCOUNT_INACTIVE.' }, async () => {
  vi.mocked(findByEmail).mockResolvedValue(user(role, extra));
  await expect(loginUser('fixture@example.test', password)).rejects.toMatchObject({ statusCode: 403, errorCode: id.includes('TEMP') ? 'TEMPORARY_PASSWORD_EXPIRED' : 'ACCOUNT_INACTIVE' });
});
tc({ id: 'AUTH-PUBLIC-STUDENT', title: 'Student projection includes studentId and excludes private fields', input: 'Student fixture including hash and auth version.', expected: 'studentId=11; no password_hash, auth_version, enterpriseId.' }, () => {
  const value = publicAuthUser(user()); expect(value.studentId).toBe(11);
  for (const key of ['password_hash', 'auth_version', 'enterpriseId']) expect(value).not.toHaveProperty(key);
});
tc({ id: 'AUTH-PUBLIC-STAFF', title: 'Staff projection omits studentId', input: 'ADMIN fixture.', expected: 'No studentId or password_hash property.' }, () => {
  expect(publicAuthUser(user('ADMIN'))).not.toHaveProperty('studentId');
});
for (const [i, input] of ['', 'bad-hash', hash].entries()) tc({ id: `AUTH-VERIFY-${i + 1}`, type: input === hash ? 'N' : 'A', title: `Password verification handles hash input ${i + 1}`, input: input === hash ? 'Valid matching bcrypt hash.' : 'Empty or malformed stored hash.', expected: `Returns ${input === hash}.` }, async () => {
  expect(await verifyPassword(password, input)).toBe(input === hash);
});
for (const [i, id] of [0, -1, 1.5, 'bad', null].entries()) tc({ id: `AUTH-ID-${i + 1}`, type: 'A', title: `Invalid user ID ${String(id)} avoids DB query`, input: JSON.stringify(id), expected: 'null; findById not called.' }, async () => {
  expect(await getUserById(id)).toBeNull(); expect(findById).not.toHaveBeenCalled();
});
tc({ id: 'AUTH-ID-VALID', title: 'Positive user ID queries repository', input: '7', expected: 'Record ID 7.' }, async () => {
  expect(await getUserById(7)).toMatchObject({ id: 7 }); expect(findById).toHaveBeenCalledWith(7);
});
for (const [i, value] of ['short', 'x'.repeat(73), 'á'.repeat(37)].entries()) tc({ id: `AUTH-PASSWORD-LIMIT-${i + 1}`, type: 'B', title: `Reject password outside length/UTF-8 limits ${i + 1}`, input: `${value.length} characters; ${Buffer.byteLength(value)} UTF-8 bytes.`, expected: '400 INVALID_PASSWORD; no update.' }, async () => {
  await expect(changePassword(7, password, value)).rejects.toMatchObject({ errorCode: 'INVALID_PASSWORD' }); expect(query).not.toHaveBeenCalled();
});
tc({ id: 'AUTH-PASSWORD-SAME', type: 'A', title: 'Reject unchanged password', input: 'Current and new fixture passwords equal.', expected: 'PASSWORD_UNCHANGED; no DB write.' }, async () => {
  await expect(changePassword(7, password, password)).rejects.toMatchObject({ errorCode: 'PASSWORD_UNCHANGED' }); expect(query).not.toHaveBeenCalled();
});
tc({ id: 'AUTH-PASSWORD-CHANGE', title: 'Password change stores a bcrypt hash and invalidates previous auth version', input: 'Correct current password and a valid new password.', expected: 'One atomic update; hash matches new password; AuthVersion increment and temporary flag reset in SQL.' }, async () => {
  vi.mocked(query).mockResolvedValue({ rows: [{ UserID: 7 }], rowCount: 1 } as any);
  await changePassword(7, password, 'new-fixture-password-789');
  const [sql, args] = vi.mocked(query).mock.calls[0];
  expect(await bcrypt.compare('new-fixture-password-789', args![1] as string)).toBe(true);
  expect(sql).toContain('"AuthVersion"="AuthVersion"+1'); expect(sql).toContain('"MustChangePassword"=false');
});

const gate = register(test, { group: 'Authentication', source: 'backend/src/middleware/authorize.ts', expected: 'Only allowed role invokes next(); others return 403 FORBIDDEN.', input: 'Authenticated fixture and a single allowed role.' });
for (const [i, role] of roles.entries()) for (const [j, allowed] of roles.entries()) gate({ id: `RBAC-${i + 1}-${j + 1}`, role, type: role === allowed ? 'N' : 'A', title: `${role} ${role === allowed ? 'can' : 'cannot'} access ${allowed} resource` }, () => {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() }, next = vi.fn();
  authorizeRoles(allowed)({ user: { roleCode: role } } as any, res as any, next);
  if (role === allowed) expect(next).toHaveBeenCalledOnce(); else { expect(next).not.toHaveBeenCalled(); expect(res.status).toHaveBeenCalledWith(403); expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ errorCode: 'FORBIDDEN' })); }
});
gate({ id: 'RBAC-ANONYMOUS', type: 'A', title: 'Anonymous request is rejected before authorization', input: 'No req.user.', expected: '401 AUTH_REQUIRED.' }, () => {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() }, next = vi.fn();
  authorizeRoles('ADMIN')({} as any, res as any, next); expect(res.status).toHaveBeenCalledWith(401); expect(next).not.toHaveBeenCalled();
});

const middleware = register(test, { group: 'Authentication', source: 'backend/src/middleware/authenticate.ts' });
const signed = (extra = {}, options = {}) => jwt.sign({ userId: 7, username: 'fixture', roleCode: 'ADMIN', authVersion: 2, ...extra }, process.env.JWT_SECRET!, options);
const runMiddleware = async (authorization: string | undefined, extra = {}) => {
  const req = { headers: { authorization }, method: 'GET', originalUrl: '/api/students/me/dashboard', ...extra } as any;
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() }, next = vi.fn();
  await authenticate(req, res as any, next); return { req, res, next };
};
for (const [id, header, code] of [
  ['JWT-MISSING', undefined, 'AUTH_REQUIRED'], ['JWT-EMPTY', 'Bearer ', 'AUTH_REQUIRED'],
  ['JWT-BAD', 'Bearer garbage', 'INVALID_TOKEN'], ['JWT-EXPIRED', `Bearer ${signed({}, { expiresIn: -1 })}`, 'TOKEN_EXPIRED'],
  ['JWT-IDENTITY', `Bearer ${signed({ username: 'previous-user' })}`, 'TOKEN_REVOKED'],
  ['JWT-VERSION', `Bearer ${signed({ authVersion: 1 })}`, 'TOKEN_REVOKED'],
] as const) middleware({ id, type: 'A', title: `Authentication rejects ${id}`, input: id, expected: `401 ${code}; handler not called.` }, async () => {
  const { res, next } = await runMiddleware(header); expect(res.status).toHaveBeenCalledWith(401);
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ errorCode: code })); expect(next).not.toHaveBeenCalled();
});
middleware({ id: 'JWT-DB-ROLE', title: 'Current database role overrides role embedded in JWT', input: 'JWT ADMIN; current fixture STUDENT.', expected: 'req.user.roleCode STUDENT; next called once.' }, async () => {
  const { req, next } = await runMiddleware(`Bearer ${signed()}`); expect(req.user.roleCode).toBe('STUDENT'); expect(next).toHaveBeenCalledOnce();
});
for (const [id, extra, code] of [
  ['JWT-DELETED', null, 'USER_NOT_FOUND'], ['JWT-INACTIVE', { status: 'INACTIVE' }, 'ACCOUNT_INACTIVE'],
  ['JWT-TEMP-EXPIRED', { must_change_password: true, temporary_password_expires_at: new Date(0) }, 'TEMPORARY_PASSWORD_EXPIRED'],
  ['JWT-TEMP-RESTRICTED', { must_change_password: true, temporary_password_expires_at: new Date('2099-01-01T00:00:00Z') }, 'PASSWORD_CHANGE_REQUIRED'],
] as const) middleware({ id, type: 'A', title: `Authentication enforces ${id}`, input: JSON.stringify(extra), expected: `${code}; protected handler not called.` }, async () => {
  vi.mocked(findById).mockResolvedValue(extra === null ? null : user('STUDENT', extra));
  const { res, next } = await runMiddleware(`Bearer ${signed()}`);
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ errorCode: code })); expect(next).not.toHaveBeenCalled();
});
middleware({ id: 'JWT-TEMP-ME', title: 'Temporary-password account may read its identity before changing password', input: 'Unexpired temporary password; GET /api/auth/me.', expected: 'next called, user set.' }, async () => {
  vi.mocked(findById).mockResolvedValue(user('STUDENT', { must_change_password: true, temporary_password_expires_at: new Date(Date.now() + 86400000) }));
  const { next } = await runMiddleware(`Bearer ${signed()}`, { originalUrl: '/api/auth/me' }); expect(next).toHaveBeenCalledOnce();
});
