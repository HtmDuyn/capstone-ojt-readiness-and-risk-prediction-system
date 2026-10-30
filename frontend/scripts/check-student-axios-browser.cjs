// Run with Node 24+. Starts its own temporary Vite server on loopback.
// Uses Chrome/CDP and a local HTTP fixture; never contacts the project DB/API.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const { spawn } = require('node:child_process');

const chromePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const cacheRoot = path.resolve(__dirname, '../.cache');
const profileName = 'axios-browser-' + process.pid;
const profilePath = path.join(cacheRoot, profileName);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const records = [];
let fixture;
let browser;
let client;
let viteServer;

class CDP {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.sequence = 0;
    this.pending = new Map();
    this.listeners = new Map();
    this.ready = new Promise((resolve, reject) => {
      this.socket.addEventListener('open', resolve, { once: true });
      this.socket.addEventListener('error', () => reject(new Error('Cannot connect to Chrome CDP.')), { once: true });
    });
    this.socket.addEventListener('message', ({ data }) => {
      const message = JSON.parse(data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        clearTimeout(pending.timer);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result);
      } else {
        for (const listener of this.listeners.get(message.method) || []) listener(message.params);
      }
    });
    this.socket.addEventListener('close', () => {
      for (const pending of this.pending.values()) {
        clearTimeout(pending.timer);
        pending.reject(new Error('Chrome CDP connection closed.'));
      }
      this.pending.clear();
    });
  }
  on(method, listener) {
    const listeners = this.listeners.get(method) || [];
    listeners.push(listener);
    this.listeners.set(method, listeners);
  }
  async send(method, params = {}) {
    await this.ready;
    const id = ++this.sequence;
    const promise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error('Chrome CDP timed out: ' + method));
      }, 30000);
      this.pending.set(id, { resolve, reject, timer });
    });
    this.socket.send(JSON.stringify({ id, method, params }));
    return promise;
  }
}

async function findVite() {
  const { createServer } = await import('vite');
  viteServer = await createServer({ root: path.resolve(__dirname, '..'),
    server: { host: '127.0.0.1', port: 0, strictPort: false, open: false,
      watch: { ignored: ['**/.cache/**'] } } });
  await viteServer.listen();
  return 'http://127.0.0.1:' + viteServer.httpServer.address().port;
}

async function startFixture(vite) {
  fixture = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    // Serve Vite's transformed modules through the fixture origin. The managed
    // browser can use this one loopback origin without cross-origin dev-server access.
    if (['/src/', '/node_modules/', '/@vite/', '/@id/', '/@fs/'].some(prefix => url.pathname.startsWith(prefix))) {
      try {
        const response = await fetch(vite + req.url, { signal: AbortSignal.timeout(10000) });
        res.writeHead(response.status, { 'Content-Type': response.headers.get('content-type') || 'application/javascript' });
        res.end(Buffer.from(await response.arrayBuffer()));
      } catch {
        res.writeHead(502);res.end('Dev module unavailable');
      }
      return;
    }
    if (url.pathname === '/page') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<!doctype html><html><head><title>Axios transport check</title></head><body>Local transport fixture</body></html>');
      return;
    }
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks);
    const json = (value, status = 200) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(value));
    };
    const identityMode = req.headers['x-fixture-identity'] || 'current';
    if (url.pathname === '/api/auth/me') {
      const user={id:7,email:'fixture@example.test',roleCode:identityMode==='wrong-role'?'ENTERPRISE':'STUDENT',mustChangePassword:identityMode==='temporary'};
      if(identityMode==='current')user.studentId=19;
      if(identityMode==='unlinked')user.studentId=null;
      json({success:true,user});
    } else if (url.pathname === '/api/students/me/internships') {
      json({success:true,data:{studentId:identityMode==='invalid-link'?0:19}});
    } else if (url.pathname === '/api/students/19') {
      json({success:true,data:{id:19,userId:identityMode==='wrong-owner'?8:7,studentCode:'FIXTURE19'}});
    } else if (url.pathname === '/api/echo' || url.pathname === '/api/auth/login') {
      let data = null;
      if (body.length) data = JSON.parse(body.toString('utf8'));
      json({ success: true, data: { method: req.method, data, authorization: req.headers.authorization || null, contentType: req.headers['content-type'] || null } });
    } else if (url.pathname === '/api/multipart') {
      json({ success: true, data: { contentType: req.headers['content-type'] || '', hasFile: body.includes(Buffer.from('filename="example.pdf"')), hasContent: body.includes(Buffer.from('%PDF-fixture')) } });
    } else if (url.pathname === '/api/blob') {
      res.writeHead(200, { 'Content-Type': 'application/pdf' });
      res.end('%PDF-fixture\n%%EOF');
    } else if (url.pathname === '/api/error-code') {
      json({ success: false, errorCode: 'FIXTURE_CONFLICT', message: 'Fixture conflict' }, 409);
    } else if (url.pathname === '/api/semantic-error') {
      json({ success: false, errorCode: 'FIXTURE_RULE', message: 'Fixture rule' });
    } else if (url.pathname === '/api/invalid-json') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{invalid JSON');
    } else if (url.pathname === '/api/non-json') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Fixture text response');
    } else if (['/api/timeout', '/api/cancel', '/api/pre-cancel'].includes(url.pathname)) {
      const timer = setTimeout(() => json({ success: true, data: null }), 1000);
      res.on('close', () => clearTimeout(timer));
    } else {
      json({ success: false, errorCode: 'FIXTURE_NOT_FOUND' }, 404);
    }
  });
  await new Promise(resolve => fixture.listen(0, '127.0.0.1', resolve));
  return 'http://127.0.0.1:' + fixture.address().port;
}

async function startChrome() {
  await fs.mkdir(profilePath, { recursive: true });
  browser = spawn(chromePath, [
    '--headless=new', '--disable-gpu', '--disable-extensions', '--no-first-run',
    '--no-default-browser-check', '--disable-background-networking',
    '--remote-debugging-address=127.0.0.1', '--remote-debugging-port=0',
    '--user-data-dir=' + profilePath, 'about:blank',
  ], { windowsHide: true, stdio: 'ignore' });
  let startupError;
  browser.once('error', error => { startupError = error; });
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (startupError) throw startupError;
    if (browser.exitCode !== null) throw new Error('Chrome exited before CDP became ready.');
    try {
      const active = await fs.readFile(path.join(profilePath, 'DevToolsActivePort'), 'utf8');
      const port = Number(active.split(/\r?\n/)[0]);
      const targets = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
      const page = targets.find(target => target.type === 'page');
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(100);
  }
  throw new Error('Chrome CDP did not become ready within 15 seconds.');
}

async function main() {
  const vite = await findVite();
  const origin = await startFixture(vite);
  client = new CDP(await startChrome());
  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('Network.enable');
  await client.send('Log.enable');
  client.on('Log.entryAdded', ({ entry }) => {
    if (entry.level === 'error') console.error('Browser:', entry.text);
  });
  client.on('Network.loadingFailed', event => {
    if (event.blockedReason || event.corsErrorStatus) console.error('Network:', JSON.stringify({error:event.errorText,blockedReason:event.blockedReason,cors:event.corsErrorStatus}));
  });
  await client.send('Network.setBlockedURLs', { urls: ['*onrender.com*', '*supabase.com*', '*gmail.com*'] });
  client.on('Network.requestWillBeSent', event => {
    if (event.request.url.startsWith(origin + '/api/')) {
      const mode=Object.entries(event.request.headers).find(([name])=>name.toLowerCase()==='x-fixture-identity')?.[1];
      records.push({ path: new URL(event.request.url).pathname, method: event.request.method, type: event.type, mode });
    }
  });
  const loaded = new Promise(resolve => client.on('Page.loadEventFired', resolve));
  await client.send('Page.navigate', { url: origin + '/page' });
  await loaded;
  const expression = `
    (async () => {
      const { API, apiRequest, ApiError, isRequestCanceled } = await import(${JSON.stringify(origin + '/src/services/studentApi.ts')});
      const { API: sharedAPI } = await import(${JSON.stringify(origin + '/src/services/api.ts')});
      API.defaults.baseURL = ${JSON.stringify(origin + '/api')};
      localStorage.setItem('ojt_auth_token', 'fixture-session');
      const checks = [];
      const check = (name, passed) => { if (!passed) throw new Error('FAILED: ' + name); checks.push(name); };
      check('student Axios is a separate instance from the API used by other roles', API !== sharedAPI);
      const rejects = async work => { try { await work(); } catch (error) { return error; } throw new Error('Expected fixture request to fail.'); };
      check('shared API explicitly uses the Axios XHR adapter', API.defaults.adapter === 'xhr');
      let response = await apiRequest('/echo', { method: 'POST', data: { value: 7 } });
      check('JSON payload and stored bearer authentication', response.data.method === 'POST' && response.data.data.value === 7 && response.data.authorization === 'Bearer fixture-session' && response.data.contentType.includes('application/json'));
      response = await apiRequest('/echo', { headers: { Authorization: 'Bearer fixture-header' } });
      check('explicit Authorization header is preserved', response.data.authorization === 'Bearer fixture-header');
      response = await apiRequest('/echo', {}, 'fixture-override');
      check('explicit token override is preserved', response.data.authorization === 'Bearer fixture-override');
      response = await apiRequest('/echo', {}, null);
      check('explicit null token disables stored authentication', response.data.authorization === null);
      response = await apiRequest('/auth/login', { method: 'POST', data: { sample: true } });
      check('login excludes stored authentication', response.data.authorization === null);
      const form = new FormData();
      form.append('cv', new Blob(['%PDF-fixture'], { type: 'application/pdf' }), 'example.pdf');
      response = await apiRequest('/multipart', { method: 'POST', data: form });
      check('FormData uses a browser multipart boundary and preserves PDF content', response.data.contentType.startsWith('multipart/form-data; boundary=') && response.data.hasFile && response.data.hasContent);
      const blob = await API.get('/blob', { responseType: 'blob' });
      check('blob download keeps binary response', blob.data instanceof Blob && await blob.data.text() === '%PDF-fixture\\n%%EOF');
      let error = await rejects(() => apiRequest('/error-code'));
      check('backend HTTP error status, message and errorCode survive', error instanceof ApiError && error.status === 409 && error.code === 'FIXTURE_CONFLICT' && error.message === 'Fixture conflict');
      error = await rejects(() => apiRequest('/semantic-error'));
      check('success=false envelope is rejected', error instanceof ApiError && error.status === 200 && error.code === 'FIXTURE_RULE');
      error = await rejects(() => apiRequest('/invalid-json'));
      check('malformed JSON is rejected clearly', error instanceof ApiError && error.code === 'INVALID_API_RESPONSE');
      error = await rejects(() => apiRequest('/non-json'));
      check('non-JSON response is rejected clearly', error instanceof ApiError && error.code === 'INVALID_API_RESPONSE');
      error = await rejects(() => apiRequest('/timeout', { timeout: 40 }));
      check('timeout differs from cancellation', error instanceof ApiError && error.status === 0 && ['ECONNABORTED', 'ETIMEDOUT'].includes(error.code) && !isRequestCanceled(error));
      const controller = new AbortController();
      const canceled = apiRequest('/cancel', { signal: controller.signal });
      setTimeout(() => controller.abort(), 30);
      error = await rejects(() => canceled);
      check('AbortController keeps Axios cancellation identity', isRequestCanceled(error) && error.code === 'ERR_CANCELED' && !(error instanceof ApiError));
      const stopped = new AbortController(); stopped.abort();
      error = await rejects(() => apiRequest('/pre-cancel', { signal: stopped.signal }));
      check('already aborted signal rejects before dispatch', isRequestCanceled(error));
      const { getOwnStudent } = await import(${JSON.stringify(origin + '/src/services/studentService.ts')});
      const expected={id:'7',email:'fixture@example.test'};
      const mode=value=>{API.defaults.headers.common['X-Fixture-Identity']=value;};
      mode('current');
      let profile=await getOwnStudent(undefined,expected);
      check('current auth/me StudentID loads the correct owner profile directly',profile.id===19&&profile.userId===7);
      mode('legacy');
      profile=await getOwnStudent(undefined,expected);
      check('legacy auth/me without StudentID resolves the authenticated internships owner',profile.id===19&&profile.userId===7);
      mode('unlinked');
      error=await rejects(()=>getOwnStudent(undefined,expected));
      check('explicit null StudentID stays an unlinked-account error',error instanceof ApiError&&error.code==='STUDENT_NOT_LINKED');
      mode('wrong-owner');
      error=await rejects(()=>getOwnStudent(undefined,expected));
      check('fallback cannot expose a profile owned by another account',error instanceof ApiError&&error.status===401&&error.code==='SESSION_IDENTITY_CHANGED');
      mode('invalid-link');
      error=await rejects(()=>getOwnStudent(undefined,expected));
      check('invalid fallback ID is rejected before fetching a guessed profile',error instanceof ApiError&&error.code==='STUDENT_API_CONTRACT_MISMATCH');
      mode('temporary');
      error=await rejects(()=>getOwnStudent(undefined,expected));
      check('temporary-password accounts cannot bypass the password gate through fallback',error instanceof ApiError&&error.code==='PASSWORD_CHANGE_REQUIRED');
      mode('wrong-role');
      error=await rejects(()=>getOwnStudent(undefined,expected));
      check('a non-student role cannot use the fallback',error instanceof ApiError&&error.code==='SESSION_IDENTITY_CHANGED');
      delete API.defaults.headers.common['X-Fixture-Identity'];
      localStorage.removeItem('ojt_auth_token');
      return checks;
    })()
  `;
  const evaluated = await client.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (evaluated.exceptionDetails) throw new Error(evaluated.exceptionDetails.exception?.description || evaluated.exceptionDetails.text);
  for (const name of evaluated.result.value) console.log('PASS ' + name);
  await sleep(100);
  assert.equal(records.length, 26, 'Only dispatched transport and identity fixture requests should reach the network.');
  assert.ok(!records.some(record=>['current','unlinked','temporary','wrong-role'].includes(record.mode)&&record.path==='/api/students/me/internships'),'Only legacy responses may resolve the fallback owner.');
  assert.ok(records.every(record => record.type === 'XHR'), 'All browser API traffic must have CDP type XHR.');
  assert.ok(!records.some(record => record.path === '/api/pre-cancel'), 'Already aborted request must not reach the HTTP fixture.');
  console.log('PASS browser Network API request types: ' + records.length + ' XHR, 0 Fetch');
  console.log((evaluated.result.value.length + 1) + ' browser transport checks passed. No DB/Render requests were made.');
}

async function cleanup() {
  if (client) {
    await client.send('Browser.close').catch(() => {});
    client.socket.close();
  }
  if (browser && browser.exitCode === null) {
    await Promise.race([new Promise(resolve => browser.once('exit', resolve)), sleep(2000)]);
    if (browser.exitCode === null) browser.kill();
  }
  if (fixture) {
    fixture.closeAllConnections();
    await new Promise(resolve => fixture.close(resolve));
  }
  await viteServer?.close();
  // Delete only the unique Chrome profile this script created under frontend/.cache.
  if (path.dirname(path.resolve(profilePath)) !== cacheRoot || path.basename(profilePath) !== profileName) {
    throw new Error('Unexpected browser profile path; cleanup stopped.');
  }
  await fs.rm(profilePath, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}

main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(cleanup);
