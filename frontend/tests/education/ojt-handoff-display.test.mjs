import test from 'node:test';
import assert from 'node:assert/strict';
import { filterHandoffHistory, handoffDisplayById, matchingHandoffStudentIds } from '../../src/utils/educationOjtHandoffDisplay.ts';

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

test('filters actual handoff members, reason, semester and per-semester round together', () => {
  const history = [
    { id: 10, ojtSemesterId: 1, studentIds: [5], reason: 'Bàn giao lần đầu' },
    { id: 11, ojtSemesterId: 1, studentIds: [6], reason: 'Bổ sung hồ sơ' },
    { id: 12, ojtSemesterId: 2, studentIds: [5], reason: 'Đợt khác' },
  ];
  const students = new Map([[5, { studentCode: 'SE250005', fullName: 'Nguyễn Văn An' }], [6, { studentCode: 'SE250006', fullName: 'Trần Thị Bình' }]]);
  assert.deepEqual(filterHandoffHistory(history, students, 'nguyen van an', '1', '1').map(h => h.id), [10]);
  assert.deepEqual(filterHandoffHistory(history, students, 'SE250006', '1', '2').map(h => h.id), [11]);
  assert.deepEqual(filterHandoffHistory(history, students, 'Bổ sung', '1', '').map(h => h.id), [11]);
  assert.deepEqual(filterHandoffHistory(history, students, 'SE250006', '2', '').map(h => h.id), []);
  assert.deepEqual([...matchingHandoffStudentIds(history[0], students, 'Nguyễn')], [5]);
  assert.deepEqual(filterHandoffHistory(history, new Map(), 'SE250005', '', '').map(h => h.id), []);
});
