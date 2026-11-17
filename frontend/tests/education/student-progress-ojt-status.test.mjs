import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import path from 'node:path';
import test from 'node:test';

const source = readFileSync(path.resolve('src/utils/savedOjtEligibility.ts'), 'utf8');
const compiled = stripTypeScriptTypes(source.replace(/^import type .*;\r?\n/gm, ''));
const { savedOjtProgressLabel } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

test('trạng thái tiến độ dùng kết quả OJT đã lưu và nhận diện kết quả cũ', () => {
  for (const [status, expected] of [
    ['ELIGIBLE', 'Đủ điều kiện'],
    ['NOT_ELIGIBLE', 'Chưa đủ điều kiện'],
    ['REVIEW_REQUIRED', 'Cần đối soát'],
  ]) assert.equal(savedOjtProgressLabel({ status, isStale: false }), expected);
  assert.equal(savedOjtProgressLabel(undefined), 'Chưa có kết quả');
  assert.equal(savedOjtProgressLabel({ status: 'NOT_ELIGIBLE', isStale: true }), 'Cần xét lại');
});
