import test from 'node:test';
import assert from 'node:assert/strict';
import { clearEducationReadCache, educationRead } from '../../src/services/educationReadCache.ts';

globalThis.localStorage = { getItem: () => 'test-session' };

test('hủy người chờ cũ không hủy dữ liệu cho request mới', async () => {
  clearEducationReadCache();
  let finish;
  let calls = 0;
  const load = () => { calls++; return new Promise(resolve => { finish = resolve; }); };
  const old = new AbortController();
  const first = educationRead('alert-pages', load, old.signal);
  const second = educationRead('alert-pages', load, new AbortController().signal);
  await Promise.resolve();
  old.abort();
  finish([{ studentId: 1 }]);
  await assert.rejects(first, error => error.name === 'AbortError');
  assert.deepEqual(await second, [{ studentId: 1 }]);
  assert.equal(calls, 1);
});

test('lỗi API thật được trả về và lần tải sau có thể thử lại', async () => {
  clearEducationReadCache();
  await assert.rejects(educationRead('demand-pages', async () => { throw new Error('HTTP 500'); }), /HTTP 500/);
  assert.deepEqual(await educationRead('demand-pages', async () => [1, 2]), [1, 2]);
});
