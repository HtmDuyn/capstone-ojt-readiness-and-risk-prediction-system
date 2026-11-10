const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const express = require('express');

// Isolated database doubles: no real accounts or data are changed.
process.env.JWT_SECRET = randomBytes(32).toString('hex');
const database = require('../dist/config/database');
const repository = require('../dist/modules/academic/academic.repository');
const authRepository = require('../dist/modules/auth/auth.repository');
const { loginUser } = require('../dist/modules/auth/auth.service');
const { authenticate } = require('../dist/middleware/authenticate');
const { errorHandler } = require('../dist/middleware/error-handler');
const router = require('../dist/modules/qhdn/qhdn.routes').default;

test('enterprise access lifecycle enforces authorization, revokes sessions and preserves data', async t => {
  const password = 'Enterprise-test-Password!';
  const hash = await bcrypt.hash(password, 4);
  let state = {
    company: { EnterpriseID: 1, EnterpriseCode: 'DN000001', Name: 'Test enterprise', Status: 'ACTIVE', DeletedAt: null },
    users: [
      { id: 42, username: 'coordinator', role_code: 'OJT_COORD', status: 'ACTIVE', auth_version: 0 },
      { id: 43, username: 'admin', role_code: 'ADMIN', status: 'ACTIVE', auth_version: 0 },
      { id: 44, username: 'student', role_code: 'STUDENT', status: 'ACTIVE', auth_version: 0 },
      { id: 100, username: 'enterprise_a', email: 'a@example.test', role_code: 'ENTERPRISE', status: 'ACTIVE', auth_version: 0, enterpriseId: 1, password_hash: hash },
      { id: 101, username: 'enterprise_b', email: 'b@example.test', role_code: 'ENTERPRISE', status: 'LOCKED', auth_version: 0, enterpriseId: 1, password_hash: hash },
    ],
    audits: [], placements: [{ id: 9, studentId: 5, companyId: 1 }],
  };
  let failAudit = false;
  const client = { async query(sql, args) {
    if (sql.startsWith('SELECT * FROM "Enterprises"')) return { rows: args[0] === 1 && !state.company.DeletedAt ? [{ ...state.company }] : [] };
    if (sql.startsWith('UPDATE "Enterprises"')) { state.company.Status = args[1]; return { rows: [{ ...state.company }] }; }
    if (sql.startsWith('UPDATE "Users"')) {
      const users = state.users.filter(user => user.enterpriseId === args[0] && user.role_code === 'ENTERPRISE');
      users.forEach(user => user.auth_version++);
      return { rows: users.map(user => ({ id: user.id })) };
    }
    if (sql.includes('INSERT INTO "AuditLogs"')) {
      if (failAudit) throw Error('Simulated audit failure');
      state.audits.push(args); return { rows: [] };
    }
    throw Error('Unexpected query: ' + sql);
  } };
  t.mock.method(repository, 'academicTransaction', async work => {
    const before = structuredClone(state);
    try { return await work(client); } catch (error) { state = before; throw error; }
  });
  const record = user => user ? { ...user, enterpriseActive: state.company.Status === 'ACTIVE' && !state.company.DeletedAt } : null;
  t.mock.method(authRepository, 'findById', async id => record(state.users.find(user => user.id === id)));
  t.mock.method(authRepository, 'findByEmail', async email => record(state.users.find(user => user.email === email)));
  t.mock.method(database, 'query', async sql => {
    assert.ok(sql.includes('LastLoginAt')); return { rows: [] };
  });
  const token = id => {
    const user = state.users.find(user => user.id === id);
    return jwt.sign({ userId: id, username: user.username, authVersion: user.auth_version }, process.env.JWT_SECRET);
  };
  const app = express();
  app.use(express.json());
  app.use('/api', router);
  app.get('/probe', authenticate, (req, res) => res.json({ success: true }));
  app.use(errorHandler);
  const server = await new Promise(resolve => { const server = app.listen(0, '127.0.0.1', () => resolve(server)); });
  t.after(async () => { await new Promise(resolve => server.close(resolve)); await database.pool?.end(); });
  const request = async (path, auth, body) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, {
      method: body ? 'PATCH' : 'GET', headers: { ...(auth ? { Authorization: 'Bearer ' + auth } : {}), 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, body: await response.json() };
  };
  const change = (status, auth = token(42), extra = {}) => request('/api/qhdn/companies/1/access', auth, { status, ...extra });
  const oldToken = token(100);
  const initial = structuredClone(state);

  await t.test('only QHDN and administrators may change access; invalid input cannot mutate data', async () => {
    assert.equal((await change('INACTIVE', '')).status, 401);
    assert.equal((await change('INACTIVE', token(44))).status, 403);
    assert.equal((await change('INACTIVE', token(100))).status, 403);
    assert.equal((await change('DELETED')).status, 400);
    assert.equal((await change('INACTIVE', token(42), { name: 'Illegal profile edit' })).status, 400);
    assert.deepEqual(state, initial);
  });
  await t.test('locking keeps company and placements but immediately denies existing sessions and login', async () => {
    const result = await change('INACTIVE');
    assert.equal(result.status, 200);
    assert.equal(result.body.data.affectedAccounts, 2);
    assert.equal(state.company.Status, 'INACTIVE');
    assert.equal(state.company.DeletedAt, null);
    assert.deepEqual(state.placements, initial.placements);
    assert.equal(state.users[3].status, 'ACTIVE');
    assert.equal(state.users[4].status, 'LOCKED');
    assert.equal(state.users[3].auth_version, 1);
    assert.equal(state.audits.length, 1);
    const probe = await request('/probe', oldToken);
    assert.equal(probe.status, 403);
    assert.equal(probe.body.errorCode, 'ACCOUNT_INACTIVE');
    await assert.rejects(loginUser('a@example.test', password), error => error.errorCode === 'ACCOUNT_INACTIVE');
    const replay = await change('INACTIVE');
    assert.equal(replay.body.data.replayed, true);
    assert.equal(state.users[3].auth_version, 1);
    assert.equal(state.audits.length, 1);
  });
  await t.test('unlock requires fresh login and preserves independently locked accounts', async () => {
    assert.equal((await change('ACTIVE', token(43))).status, 200);
    assert.equal(state.users[3].auth_version, 2);
    const probe = await request('/probe', oldToken);
    assert.equal(probe.status, 401);
    assert.equal(probe.body.errorCode, 'TOKEN_REVOKED');
    const login = await loginUser('a@example.test', password);
    assert.equal((await request('/probe', login.token)).status, 200);
    assert.equal(state.users[4].status, 'LOCKED');
    await assert.rejects(loginUser('b@example.test', password), error => error.errorCode === 'ACCOUNT_INACTIVE');
  });
  await t.test('missing/deleted companies cannot be restored; failed audit rolls back status and sessions', async () => {
    const before = structuredClone(state);
    assert.equal((await request('/api/qhdn/companies/999/access', token(42), { status: 'ACTIVE' })).status, 404);
    failAudit = true;
    assert.equal((await change('INACTIVE')).status, 500);
    assert.deepEqual(state, before);
    failAudit = false;
    state.company.DeletedAt = '2026-11-10';
    assert.equal((await change('ACTIVE')).status, 404);
    await assert.rejects(loginUser('a@example.test', password), error => error.errorCode === 'ACCOUNT_INACTIVE');
  });
});
