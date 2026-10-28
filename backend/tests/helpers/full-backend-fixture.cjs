const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');
const jwt = require('jsonwebtoken');

// This fixture loads the complete project schema/seed into WASM PostgreSQL.
// Both env loading and the pg module are replaced BEFORE importing the app:
// production credentials, database connections and workers are never loaded.
module.exports = async function fullBackendFixture() {
  const root = path.resolve(__dirname, '../..');
  const db = new PGlite();
  await db.exec(fs.readFileSync(path.join(root, 'DB'), 'utf8'));
  const query = async (sql, args) => {
    if (sql.includes('pg_advisory_xact_lock')) return { rows: [], rowCount: 0 };
    const result = await db.query(sql, args);
    return { ...result, rowCount: result.affectedRows || result.rows.length };
  };
  // A single PostgreSQL connection requires a checkout mutex. This also gives
  // the same serialization as the backend's academic-calendar advisory lock.
  let queue = Promise.resolve();
  const pool = {
    connect: async () => {
      const previous = queue;
      let release;
      queue = new Promise(resolve => { release = resolve; });
      await previous;
      return { query, release };
    },
    query: async (sql, args) => {
      const c = await pool.connect();
      try { return await c.query(sql, args); } finally { c.release(); }
    },
  };
  process.env.JWT_SECRET = 'fixture-only-full-ojt-flow-key';
  process.env.EMAIL_OUTBOX_KEY = Buffer.alloc(32, 7).toString('base64');
  process.env.FRONTEND_LOGIN_URL = 'https://fixture.test/login';
  delete process.env.CV_ANALYSIS_SERVICE_URL;
  delete process.env.STUDENT_AI_API_KEY;
  const envPath = require.resolve(path.join(root, 'dist/config/env.js'));
  const dbPath = require.resolve(path.join(root, 'dist/config/database.js'));
  require.cache[envPath] = { id: envPath, filename: envPath, loaded: true, exports: {} };
  require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { query: pool.query, pool } };
  const app = require(path.join(root, 'dist/app.js')).default;
  const server = await new Promise(resolve => { const value = app.listen(0, '127.0.0.1', () => resolve(value)); });
  const base = 'http://127.0.0.1:' + server.address().port;
  const principals = (await query('SELECT u."UserID" AS id,u."Username" AS username,u."AuthVersion" AS version,r."RoleCode" AS role FROM "Users" u JOIN "Roles" r USING("RoleID") ORDER BY u."UserID"')).rows;
  const token = role => {
    const user = principals.find(u => u.role === role);
    return jwt.sign({ userId: user.id, username: user.username, authVersion: user.version }, process.env.JWT_SECRET);
  };
  const request = async (role, method, url, body) => {
    const headers = { Authorization: 'Bearer ' + token(role) };
    const options = { method, headers };
    if (body instanceof FormData) options.body = body;
    else if (body !== undefined) { headers['Content-Type'] = 'application/json'; options.body = JSON.stringify(body); }
    const response = await fetch(base + url, options);
    return { status: response.status, body: response.headers.get('content-type')?.includes('json') ? await response.json() : Buffer.from(await response.arrayBuffer()) };
  };
  const service = name => require(path.join(root, 'dist', name));
  const close = async () => { await new Promise(resolve => server.close(resolve)); await db.close(); };
  return { db, query, pool, app, request, service, principals, close };
};
