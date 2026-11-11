import test from 'node:test';
import assert from 'node:assert/strict';
import { placementDashboardStats } from '../../src/utils/qhdnDashboard.ts';

test('dashboard counts all 11 students from coordination, including unregistered students and acceptances before actual receipt', () => {
  const decisions = [undefined, 'ACCEPTED', 'PENDING', 'PENDING', 'PENDING', 'ACCEPTED', 'ACCEPTED', 'REJECTED', 'REJECTED', 'REJECTED', 'PENDING'];
  const students = decisions.map((decision, index) => ({ id: index + 1, decision }));
  assert.deepEqual(placementDashboardStats(students), {
    handedOff: 11, assigned: 3, waiting: 4, rejected: 3, acceptanceRate: 27.3,
  });
});

test('received students and existing assignments remain accepted without double counting students', () => {
  assert.deepEqual(placementDashboardStats([
    { id: 1, decision: 'ACCEPTED', receivedAt: '2026-11-11T00:00:00Z', hasAssignment: true },
    { id: 1, decision: 'ACCEPTED', receivedAt: '2026-11-11T00:00:00Z', hasAssignment: true },
    { id: 2, hasAssignment: true },
    { id: 3, decision: 'PENDING' },
    { id: 4, decision: 'REJECTED' },
  ]), { handedOff: 4, assigned: 2, waiting: 1, rejected: 1, acceptanceRate: 50 });
});

test('an empty semester shows real zero counts and a finite acceptance rate', () => {
  assert.deepEqual(placementDashboardStats([]), {
    handedOff: 0, assigned: 0, waiting: 0, rejected: 0, acceptanceRate: 0,
  });
});

test('a later company decision replaces previous rejection in the refreshed roster', () => {
  const students = [{ id: 1, decision: 'REJECTED' }, { id: 2, decision: 'PENDING' }];
  assert.equal(placementDashboardStats(students).rejected, 1);
  students[0].decision = 'ACCEPTED';
  const updated = placementDashboardStats(students);
  assert.equal(updated.rejected, 0);
  assert.equal(updated.assigned, 1);
  assert.equal(updated.acceptanceRate, 50);
});
