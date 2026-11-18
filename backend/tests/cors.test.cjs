const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');
const { createCorsMiddleware } = require('../dist/config/cors');

const productionOrigin = 'https://capstone-ojt-readiness-and-risk-pre.vercel.app';

function request(server, method, origin, requestedHeaders) {
  const headers = {};
  if (origin) headers.Origin = origin;
  if (method === 'OPTIONS') {
    headers['Access-Control-Request-Method'] = 'POST';
    headers['Access-Control-Request-Headers'] = requestedHeaders;
  }
  return new Promise((resolve, reject) => {
    const req = http.request({
      host: '127.0.0.1', port: server.address().port,
      path: '/api/auth/login', method, headers,
    }, res => {
      res.resume();
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers }));
    });
    req.on('error', reject);
    req.end();
  });
}

test('Vercel login CORS works with a copied localhost-only configuration', async t => {
  const app = express();
  app.use(createCorsMiddleware('http://localhost:5173'));
  // Authentication failures must also be readable by the browser.
  app.post('/api/auth/login', (_req, res) => res.status(401).json({ success: false }));
  const server = await new Promise(resolve => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  t.after(() => new Promise(resolve => server.close(resolve)));

  for (const origin of [productionOrigin, 'http://localhost:5173']) {
    const preflight = await request(server, 'OPTIONS', origin, 'content-type,authorization,cache-control,pragma');
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers['access-control-allow-origin'], origin);
    assert.equal(preflight.headers['access-control-allow-credentials'], 'true');
    assert.match(preflight.headers['access-control-allow-methods'], /POST/);
    assert.equal(preflight.headers['access-control-allow-headers'], 'content-type,authorization,cache-control,pragma');
    const login = await request(server, 'POST', origin);
    assert.equal(login.status, 401);
    assert.equal(login.headers['access-control-allow-origin'], origin);
  }

  for (const origin of ['https://unrelated.vercel.app', `${productionOrigin}.attacker.test`, 'null']) {
    const response = await request(server, 'OPTIONS', origin, 'content-type');
    assert.equal(response.headers['access-control-allow-origin'], undefined);
  }
  assert.equal((await request(server, 'POST')).status, 401);
});

test('custom origins tolerate whitespace and trailing slashes without allowing arbitrary origins', async t => {
  const app = express();
  app.use(createCorsMiddleware(' https://ojt.example.test/ , , http://localhost:5173/ '));
  const server = await new Promise(resolve => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  t.after(() => new Promise(resolve => server.close(resolve)));
  for (const origin of [productionOrigin, 'https://ojt.example.test', 'http://localhost:5173']) {
    const response = await request(server, 'OPTIONS', origin, 'content-type');
    assert.equal(response.headers['access-control-allow-origin'], origin);
  }
  const rejected = await request(server, 'OPTIONS', 'https://unrelated.example.test', 'content-type');
  assert.equal(rejected.headers['access-control-allow-origin'], undefined);
});

test('an empty CORS_ORIGIN uses the known production and local origins', async t => {
  const app = express();
  app.use(createCorsMiddleware(''));
  const server = await new Promise(resolve => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  t.after(() => new Promise(resolve => server.close(resolve)));
  for (const origin of [productionOrigin, 'http://localhost:5173']) {
    assert.equal((await request(server, 'OPTIONS', origin, 'content-type')).headers['access-control-allow-origin'], origin);
  }
  assert.equal((await request(server, 'OPTIONS', 'https://unrelated.vercel.app', 'content-type')).headers['access-control-allow-origin'], undefined);
});
