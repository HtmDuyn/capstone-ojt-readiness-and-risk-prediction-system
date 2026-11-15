import test from 'node:test';
import assert from 'node:assert/strict';
import { courseDemandOverview } from '../../src/utils/courseDemandOverview.ts';

const row = (id, courseId, code, count, studentIds) => ({ id, courseId, code, count, studentIds, name: code, periodName: null, ojtSemesterName: null });

test('đếm học phần và cặp sinh viên duy nhất qua nhiều kỳ, không gộp theo mã', () => {
  const result = courseDemandOverview([
    row('a', 1, 'ENW493c', 2, [10, 11]),
    row('b', 1, 'ENW493c', 2, [11, 12]),
    row('c', 2, 'ENW493c', 1, [10]),
  ]);
  assert.equal(result.courseCount, 2);
  assert.equal(result.demandCount, 4);
});

test('top tối đa 5 dòng và sắp theo số sinh viên giảm dần', () => {
  const result = courseDemandOverview(Array.from({ length: 7 }, (_, i) => row(String(i), i + 1, `C${i}`, i + 1, [i])));
  assert.deepEqual(result.top.map(item => item.count), [7, 6, 5, 4, 3]);
  assert.equal(courseDemandOverview([row('a', 1, 'A', 1, [1])]).top.length, 1);
});

test('không suy đoán chỉ số khi API thiếu danh sách sinh viên', () => {
  const result = courseDemandOverview([row('a', 1, 'A', 30, null)]);
  assert.equal(result.courseCount, 1);
  assert.equal(result.demandCount, null);
  assert.deepEqual(courseDemandOverview([]).top, []);
});
