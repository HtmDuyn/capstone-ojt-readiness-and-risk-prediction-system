import test from 'node:test';
import assert from 'node:assert/strict';
import { paginateItems, pageNumbers, selectPage } from '../../src/utils/qhdnPagination.ts';

test('11 students split into ten rows and a final row numbered 11', () => {
  const students = Array.from({ length: 11 }, (_, index) => ({ id: index + 1 }));
  const first = paginateItems(students, 1, 10);
  const second = paginateItems(students, 2, 10);
  assert.equal(first.items.length, 10);
  assert.deepEqual(second.items, [{ id: 11 }]);
  assert.equal(second.offset + 1, 11);
  assert.equal(second.pages, 2);
  assert.deepEqual([...first.items, ...second.items], students);
});

test('filtering down or receiving fewer records clamps the page and empty lists remain on page one', () => {
  const filtered = paginateItems([1, 2, 3], 5, 10);
  assert.equal(filtered.page, 1);
  assert.deepEqual(filtered.items, [1, 2, 3]);
  assert.deepEqual(paginateItems([], 8, 20), { page: 1, pages: 1, offset: 0, items: [] });
});

test('all supported page sizes cover the full list without losing records', () => {
  const rows = Array.from({ length: 103 }, (_, index) => index);
  for (const size of [10, 20, 50]) {
    const pages = Math.ceil(rows.length / size);
    const result = Array.from({ length: pages }, (_, index) => paginateItems(rows, index + 1, size).items).flat();
    assert.deepEqual(result, rows);
  }
});

test('selecting and clearing the visible page preserves choices from other pages without mutating prior state', () => {
  const prior = new Set([1, 11]);
  const selected = selectPage(prior, [11, 12, 13], true);
  assert.deepEqual([...selected], [1, 11, 12, 13]);
  assert.deepEqual([...selectPage(selected, [11, 12, 13], false)], [1]);
  assert.deepEqual([...prior], [1, 11]);
});

test('numbered navigation exposes the first, last and neighbouring pages without duplicates', () => {
  assert.deepEqual(pageNumbers(1, 1), [1]);
  assert.deepEqual(pageNumbers(2, 3), [1, 2, 3]);
  assert.deepEqual(pageNumbers(5, 10), [1, 'ellipsis', 4, 5, 6, 'ellipsis', 10]);
  assert.deepEqual(pageNumbers(10, 10), [1, 'ellipsis', 9, 10]);
});
