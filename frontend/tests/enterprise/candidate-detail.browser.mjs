import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { createServer } from 'vite';

// Optional real-browser check, no external test libraries or live accounts required.
// Run from frontend: node --test tests/student/ui-loading.browser.mjs
test('Candidate details cover the viewport and show submitted OJT data on desktop and mobile', { timeout: 45_000 }, async t => {
  const executable = process.env.STUDENT_TEST_CHROME || [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/chromium', '/usr/bin/google-chrome',
  ].find(existsSync);
  assert.ok(executable, 'Set STUDENT_TEST_CHROME to an installed Chromium browser');
  const vite = await createServer({ server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' });
  await vite.listen();
  mkdirSync('.tmp', { recursive: true });
  const profile = mkdtempSync(resolve('.tmp/candidate-detail-'));
  const browser = spawn(executable, ['--headless=new', '--disable-gpu', '--no-sandbox', '--disable-gpu-sandbox', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
  let browserErrors = '';
  browser.stderr.on('data', data => { browserErrors += data; });
  let ws;
  t.after(async () => {
    try { if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ id: 999999, method: 'Browser.close' })); } catch {}
    ws?.close();
    browser.kill();
    await vite.close();
  });
  const portFile = resolve(profile, 'DevToolsActivePort');
  for (let n = 0; !existsSync(portFile) && n < 200; n++) await delay(50);
  assert.ok(existsSync(portFile), 'Browser did not start its local debugging endpoint');
  const [port, browserPath] = readFileSync(portFile, 'utf8').trim().split(/\r?\n/);
  ws = new WebSocket(`ws://127.0.0.1:${port}${browserPath}`);
  await new Promise((yes, no) => { ws.addEventListener('open', yes, { once: true }); ws.addEventListener('error', () => no(Error(`Cannot connect to local browser: ${browserErrors}`)), { once: true }); });
  let id = 0;
  const waiting = new Map();
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id && waiting.has(message.id)) {
      const { yes, no, timer } = waiting.get(message.id);
      clearTimeout(timer);
      waiting.delete(message.id);
      message.error ? no(Error(JSON.stringify(message.error))) : yes(message.result);
    }
  });
  const command = (method, params = {}, sessionId) => new Promise((yes, no) => {
    const requestId = ++id;
    const timer = setTimeout(() => { waiting.delete(requestId); no(Error(`Browser command timed out: ${method}`)); }, 4_000);
    waiting.set(requestId, { yes, no, timer });
    ws.send(JSON.stringify({ id: requestId, method, params, sessionId }));
  });
  const { targetId } = await command('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await command('Target.attachToTarget', { targetId, flatten: true });
  for (const [width, height] of [[1440, 900], [390, 844], [320, 640]]) {
    await command('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false }, sessionId);
    await command('Page.navigate', { url: `http://127.0.0.1:${vite.httpServer.address().port}/tests/enterprise/candidate-detail.browser.html?width=${width}` }, sessionId);
    let result;
    for (let n = 0; n < 400; n++) {
      const reply = await command('Runtime.evaluate', { expression: 'window.__candidateUiDone ?? null', returnByValue: true }, sessionId);
      result = reply.result?.value;
      if (result) break;
      await delay(50);
    }
    assert.ok(result, 'Browser checks did not complete');
    assert.equal(result.error, undefined, JSON.stringify({ width, height, ...result }, null, 2));
    assert.equal(result.checks.length, 6);
    for (const check of result.checks) t.diagnostic(`${width}x${height}: ${check}`);
  }
});