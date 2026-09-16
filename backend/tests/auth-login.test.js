const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const database = require('../src/config/database');
const app = require('../src/app');

const mockUser = {
  id: 1,
  username: 'student01',
  email: 'student01@demo.ojtrpa.edu.vn',
  full_name: 'Nguyen Van An',
  status: 'ACTIVE',
  password_hash: '$2b$10$XnKLAUIGK2RVuS8JH/tNFeYrgry69HggCtu5dR76PuTFk2XRCwu3y',
  role_code: 'STUDENT',
  role_name: 'Student'
};

test('POST /api/auth/login returns 200 with token for valid student credentials', async () => {
  database.query = async (sql, params) => {
    if (sql.includes('WHERE LOWER(u."Username") = LOWER')) {
      return { rows: [mockUser] };
    }
    return { rows: [] };
  };

  const server = app.listen(0);

  try {
    await new Promise((resolve) => server.once('listening', resolve));

    const port = server.address().port;
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'student01', password: 'student01' })
    });

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.ok(body.token);
    assert.ok(body.user);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('GET /api/auth/me returns 401 when token is missing', async () => {
  const server = app.listen(0);

  try {
    await new Promise((resolve) => server.once('listening', resolve));
    const port = server.address().port;

    const response = await fetch(`http://127.0.0.1:${port}/api/auth/me`);
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.success, false);
    assert.match(body.message, /authentication|required|token/i);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('GET /api/auth/me returns current user with valid token', async () => {
  database.query = async (sql, params) => {
    if (sql.includes('FROM "Users"')) {
      return { rows: [mockUser] };
    }
    return { rows: [] };
  };

  const server = app.listen(0);

  try {
    await new Promise((resolve) => server.once('listening', resolve));
    const port = server.address().port;
    const token = jwt.sign({ sub: mockUser.id, userId: mockUser.id }, 'ojt-dev-secret', { expiresIn: '7d' });

    const response = await fetch(`http://127.0.0.1:${port}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.user.id, mockUser.id);
    assert.equal(body.user.username, mockUser.username);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
