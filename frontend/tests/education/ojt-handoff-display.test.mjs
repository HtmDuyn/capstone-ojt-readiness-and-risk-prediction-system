import test from 'node:test';
import assert from 'node:assert/strict';
import { handoffDisplayById } from '../../src/utils/educationOjtHandoffDisplay.ts';

test('numbers handoffs by ascending database ID within each OJT semester', () => {
  const history = [
    { id: 12, ojtSemesterId: 2, semester: { id: 2, name: 'Spring 2027', code: 'SP27' } },
    { id: 11, ojtSemesterId: 1, semester: { id: 1, name: 'Fall 2026', code: 'FA26' } },
    { id: 14, ojtSemesterId: 2, semester: { id: 2, name: 'Spring 2027', code: 'SP27' } },
    { id: 10, ojtSemesterId: 1, semester: { id: 1, name: 'Fall 2026', code: 'FA26' } },
    { id: 13, ojtSemesterId: 1, semester: { id: 1, name: 'Fall 2026', code: 'FA26' } },
  ];
  const display = handoffDisplayById(history);
  assert.deepEqual([...history.map(h => [h.id, display.get(h.id)])], [
    [12, { semesterName: 'Spring 2027', roundNumber: 1 }],
    [11, { semesterName: 'Fall 2026', roundNumber: 2 }],
    [14, { semesterName: 'Spring 2027', roundNumber: 2 }],
    [10, { semesterName: 'Fall 2026', roundNumber: 1 }],
    [13, { semesterName: 'Fall 2026', roundNumber: 3 }],
  ]);
  assert.deepEqual(history.map(h => h.id), [12, 11, 14, 10, 13]);
});

test('does not replace a missing semester name with a database ID', () => {
  const display = handoffDisplayById([{ id: 21, ojtSemesterId: 9, semester: null }]);
  assert.equal(display.get(21)?.semesterName, '—');
  assert.equal(display.get(21)?.roundNumber, 1);
});
