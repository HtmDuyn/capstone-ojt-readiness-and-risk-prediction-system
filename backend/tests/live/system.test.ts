import { afterAll, beforeAll, expect, test } from 'vitest';
import request from 'supertest';
import fs from 'node:fs';
import path from 'node:path';
import app from '../../src/app';
import { pool } from '../../src/config/database';
import { configureQaReadOnly } from '../../scripts/qa-readonly';
const register = require('../../../qa/register-case.cjs');
type Account = { role: string; email: string; password: string; frontendRole: string };
const credentialsPath = path.resolve('../qa/accounts.local.json');
const accounts: Account[] = fs.existsSync(credentialsPath) ? JSON.parse(fs.readFileSync(credentialsPath, 'utf8')) : [];
const roles = ['ADMIN', 'ACADEMIC', 'OJT_COORD', 'STUDENT', 'ENTERPRISE'];
const tokens = new Map<string, string>();
const identity = new Map<string, any>();
let databaseError = '';
const output = process.env.QA_RESULTS_DIR || path.resolve('../qa/results/manual');
configureQaReadOnly(pool);
function safeCode(error: any) { return String(error?.code || (/^[A-Z_]+$/.test(error?.message) ? error.message : 'DATABASE_UNAVAILABLE')).replace(/[^A-Z0-9_]/g, '').slice(0, 80); }
const observations: Record<string, unknown> = {};
function observe(id: string, result: unknown) {
  observations[id] = result;
  fs.mkdirSync(output, { recursive: true }); fs.writeFileSync(path.join(output, 'live-observations.json'), JSON.stringify(observations, null, 2));
}
async function api(role: string, method: string, url: string, body?: unknown) {
  let call = (request(app) as any)[method](url).timeout({ response: 30000, deadline: 40000 });
  if (tokens.has(role)) call = call.set('Authorization', 'Bearer ' + tokens.get(role));
  if (body !== undefined) call = call.send(body);
  return call;
}
beforeAll(async () => {
  try {
    if (!pool) throw Error('DATABASE_NOT_CONFIGURED');
    const value = await pool.query('SHOW default_transaction_read_only');
    if (value.rows[0].default_transaction_read_only !== 'on') throw Error('QA_READ_ONLY_REQUIRED');
  } catch (error) { databaseError = safeCode(error); observe('DB-PRECONDITION', { blocked: databaseError }); }
});
afterAll(async () => { await pool?.end(); });
const tc = register(test, { group: 'Authentication', source: 'backend/src/app.ts', level: 'API integration', precondition: 'Actual Express app and configured PostgreSQL; read-only DB sessions; no workers. Local credentials supplied separately.' });
tc({ id: 'LIVE-HEALTH', title: 'Backend health endpoint responds successfully', input: 'GET /', expected: '200 success true; backend running message.' }, async () => {
  const r = await request(app).get('/'); expect(r.status).toBe(200); expect(r.body.success).toBe(true); observe('LIVE-HEALTH', { httpStatus: r.status });
});
for (const role of roles) {
  const id = `LIVE-LOGIN-${role.replace('_', '-')}`;
  tc({ id, role, source: 'backend/src/modules/auth/auth.service.ts', title: `Live login for ${role}`, input: `POST /api/auth/login; email from accounts.local.json for ${role}; password omitted from evidence.`, expected: `200; signed token; roleCode ${role}; ACTIVE; private fields absent.` }, async (ctx: any) => {
    if (databaseError) ctx.skip(databaseError);
    const account = accounts.find(a => a.role === role); if (!account || account.password === 'REPLACE_LOCALLY') ctx.skip('LOCAL_ACCOUNT_NOT_CONFIGURED');
    const r = await request(app).post('/api/auth/login').send({ email: account!.email, password: account!.password }).timeout(30000);
    observe(id, { httpStatus: r.status, errorCode: r.body.errorCode ?? null, roleCode: r.body.user?.roleCode ?? null, mustChangePassword: r.body.mustChangePassword ?? null });
    expect(r.status).toBe(200); expect(r.body.success).toBe(true); expect(r.body.token).toEqual(expect.any(String));
    expect(r.body.user).toMatchObject({ roleCode: role, status: 'ACTIVE', email: account!.email });
    for (const key of ['password_hash', 'passwordHash', 'auth_version', 'authVersion']) expect(r.body.user).not.toHaveProperty(key);
    tokens.set(role, r.body.token); identity.set(role, r.body.user);
  });
}
for (const role of roles) tc({ id: `LIVE-ME-${role.replace('_', '-')}`, role, title: `Current user identity for ${role}`, input: 'GET /api/auth/me with actual login JWT.', expected: `200; same ID/email and role as login; no password hash.` }, async (ctx: any) => {
  if (!tokens.has(role)) ctx.skip('LOGIN_PRECONDITION_FAILED');
  const r = await api(role, 'get', '/api/auth/me'); observe(`LIVE-ME-${role.replace('_', '-')}`, { httpStatus: r.status, roleCode: r.body.user?.roleCode ?? null });
  expect(r.status).toBe(200); expect(r.body.user).toMatchObject({ id: identity.get(role).id, email: identity.get(role).email, roleCode: role }); expect(r.body.user).not.toHaveProperty('password_hash');
});

const endpoints = [
  { key: 'ADMIN', method: 'post', url: '/api/admin/dashboard', body: {}, allowed: ['ADMIN'] },
  { key: 'ACADEMIC', method: 'get', url: '/api/academic-years?limit=1', allowed: ['ADMIN', 'ACADEMIC'] },
  { key: 'COORD', method: 'get', url: '/api/companies?limit=1', allowed: ['ADMIN', 'OJT_COORD'] },
  { key: 'STUDENT', method: 'get', url: '/api/students/me/internships?include=identity', allowed: ['STUDENT'] },
  { key: 'ENTERPRISE', method: 'get', url: '/api/enterprise/profile', allowed: ['ENTERPRISE'] },
];
for (const role of roles) for (const endpoint of endpoints) {
  const allowed = endpoint.allowed.includes(role), id = `LIVE-ACCESS-${role.replace('_', '-')}-${endpoint.key}`;
  tc({ id, role, type: allowed ? 'N' : 'A', title: `${role} ${allowed ? 'reads' : 'is denied'} ${endpoint.key} API`, input: `${endpoint.method.toUpperCase()} ${endpoint.url}${'body' in endpoint ? '; body={}' : ''}`, expected: allowed ? '200; success true; response data exists.' : '403 FORBIDDEN; no protected data.' }, async (ctx: any) => {
    if (!tokens.has(role)) ctx.skip('LOGIN_PRECONDITION_FAILED');
    const r = await api(role, endpoint.method, endpoint.url, 'body' in endpoint ? endpoint.body : undefined);
    observe(id, { httpStatus: r.status, errorCode: r.body.errorCode ?? null, success: r.body.success });
    expect(r.status).toBe(allowed ? 200 : 403);
    if (allowed) { expect(r.body.success).toBe(true); if (endpoint.key !== 'ACADEMIC') expect(r.body).toHaveProperty('data'); }
    else { expect(r.body.errorCode).toBe('FORBIDDEN'); expect(r.body).not.toHaveProperty('data'); }
  });
}
for (const endpoint of endpoints) tc({ id: `LIVE-ANON-${endpoint.key}`, type: 'A', title: `Anonymous request cannot read ${endpoint.key} API`, input: `${endpoint.method.toUpperCase()} ${endpoint.url}; no Authorization.`, expected: '401 AUTH_REQUIRED.' }, async () => {
  const r = await api('', endpoint.method, endpoint.url, 'body' in endpoint ? endpoint.body : undefined); expect(r.status).toBe(401); expect(r.body.errorCode).toBe('AUTH_REQUIRED');
});
for (const [id, body, code] of [['LIVE-LOGIN-MISSING-EMAIL', { password: 'placeholder' }, 'MISSING_EMAIL'], ['LIVE-LOGIN-MISSING-PASSWORD', { email: 'invalid@example.test' }, 'MISSING_PASSWORD']] as const) tc({ id, type: 'A', title: `Login input validation ${code}`, input: id.includes('EMAIL') ? 'JSON body lacks email.' : 'JSON body lacks password.', expected: `400 ${code}; independent of DB.` }, async () => { const r = await request(app).post('/api/auth/login').send(body); expect(r.status).toBe(400); expect(r.body.errorCode).toBe(code); });
tc({ id: 'LIVE-LOGIN-CONTENT-TYPE', type: 'A', title: 'Login refuses form-encoded body', input: 'POST login application/x-www-form-urlencoded.', expected: '415 JSON_CONTENT_TYPE_REQUIRED.' }, async () => { const r = await request(app).post('/api/auth/login').type('form').send({ email: 'fixture@example.test', password: 'placeholder' }); expect(r.status).toBe(415); expect(r.body.errorCode).toBe('JSON_CONTENT_TYPE_REQUIRED'); });
tc({ id: 'LIVE-LOGIN-WRONG', type: 'A', title: 'Live account rejects wrong password with generic error', input: 'ADMIN email; deliberately wrong fixture password.', expected: '401 INVALID_CREDENTIALS.' }, async (ctx: any) => {
  if (databaseError) ctx.skip(databaseError); const account = accounts.find(a => a.role === 'ADMIN'); if (!account) ctx.skip('LOCAL_ACCOUNT_NOT_CONFIGURED');
  const r = await request(app).post('/api/auth/login').send({ email: account!.email, password: 'deliberately-wrong-fixture-000' }); expect(r.status).toBe(401); expect(r.body.errorCode).toBe('INVALID_CREDENTIALS');
});
tc({ id: 'LIVE-JWT-TAMPER', type: 'A', title: 'Tampered bearer token is rejected', input: 'GET auth/me with malformed JWT.', expected: '401 INVALID_TOKEN.' }, async () => { const r = await request(app).get('/api/auth/me').set('Authorization', 'Bearer invalid.jwt.signature'); expect(r.status).toBe(401); expect(r.body.errorCode).toBe('INVALID_TOKEN'); });
tc({ id: 'LIVE-NO-CACHE', title: 'Identity API disables caching', input: 'GET auth/me.', expected: 'Cache-Control contains no-store.' }, async () => { const r = await request(app).get('/api/auth/me'); expect(r.headers['cache-control']).toContain('no-store'); });

const database = register(test, { group: 'Academic & Curriculum', level: 'Database read-only', source: 'backend/DB', precondition: 'Existing PostgreSQL schema; SELECT only, read-only sessions. Full backend/DB reset is never executed.' });
database({ id: 'DB-READONLY', title: 'QA database sessions enforce read-only mode', input: 'SHOW default_transaction_read_only.', expected: 'on.' }, async (ctx: any) => {
  if (databaseError) ctx.skip(databaseError); const r = await pool!.query('SHOW default_transaction_read_only'); expect(r.rows[0].default_transaction_read_only).toBe('on'); observe('DB-READONLY', { readOnly: true });
});
database({ id: 'DB-SCHEMA', title: 'Required workflow tables exist in current database', input: 'Users,Roles,Students,Enterprises,AcademicYears,AcademicPeriods,TrainingPrograms,InternshipTasks,InternshipEvaluations,RecruitmentWindows.', expected: 'Every required table resolves via to_regclass.' }, async (ctx: any) => {
  if (databaseError) ctx.skip(databaseError);
  const tables = ['Users', 'Roles', 'Students', 'Enterprises', 'AcademicYears', 'AcademicPeriods', 'TrainingPrograms', 'InternshipTasks', 'InternshipEvaluations', 'RecruitmentWindows'];
  const r = await pool!.query('SELECT t AS name,to_regclass(format(\'public.%I\',t)) IS NOT NULL AS present FROM unnest($1::text[]) t', [tables]);
  observe('DB-SCHEMA', r.rows); expect(r.rows.filter(r => !r.present)).toEqual([]);
});
database({ id: 'DB-ROLES', group: 'Authentication', title: 'Database contains the five supported role codes', input: 'SELECT RoleCode FROM Roles.', expected: 'ADMIN,ACADEMIC,OJT_COORD,STUDENT,ENTERPRISE present.' }, async (ctx: any) => {
  if (databaseError) ctx.skip(databaseError); const r = await pool!.query('SELECT "RoleCode" AS code FROM "Roles"'); expect(r.rows.map(x => x.code)).toEqual(expect.arrayContaining(roles)); observe('DB-ROLES', { roleCodes: r.rows.map(x => x.code) });
});
database({ id: 'DB-ACCOUNT-UNIQUENESS', group: 'Authentication', title: 'Each supplied account maps to one active user and expected role', input: 'Five configured emails; inspect Users joined to Roles.', expected: 'Exactly one user per email, ACTIVE and matching expected role.' }, async (ctx: any) => {
  if (databaseError) ctx.skip(databaseError); if (accounts.length !== 5) ctx.skip('LOCAL_ACCOUNTS_NOT_CONFIGURED');
  const r = await pool!.query('SELECT lower(u."Email") AS email,u."Status" AS status,r."RoleCode" AS role FROM "Users" u JOIN "Roles" r ON r."RoleID"=u."RoleID" WHERE lower(u."Email")=ANY($1::text[])', [accounts.map(a => a.email.toLowerCase())]);
  observe('DB-ACCOUNT-UNIQUENESS', r.rows.map(({ role, status }) => ({ role, status })));
  for (const a of accounts) { const found = r.rows.filter(u => u.email === a.email.toLowerCase()); expect(found).toHaveLength(1); expect(found[0]).toMatchObject({ role: a.role, status: 'ACTIVE' }); }
});
