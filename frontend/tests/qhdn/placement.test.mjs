import test from 'node:test';
import assert from 'node:assert/strict';
import { placementStatus, placementStatuses, placementStatusLabels, placementStatusColors } from '../../src/utils/qhdnPlacement.ts';

test('student and QHDN applications awaiting a company decision share the waiting status', () => {
  const students = [
    { decision: 'PENDING', source: 'STUDENT_APPLICATION' },
    { decision: 'PENDING', source: 'QHDN_COORDINATION' },
    { decision: 'PENDING', source: 'QHDN_APPLICATION' },
    { decision: 'ACCEPTED' },
    { decision: 'REJECTED' },
    {},
  ];
  assert.equal(students.filter(student => placementStatus(student) === 'WAITING_RESPONSE').length, 3);
  assert.equal(students.filter(student => placementStatus(student) === 'APPLIED').length, 0);
  assert.equal(placementStatus(students[3]), 'ACCEPTED');
  assert.equal(placementStatus(students[4]), 'REJECTED');
  assert.equal(placementStatus(students[5]), 'NOT_APPLIED');
});

test('submitted registrations without a company decision remain separate from waiting responses', () => {
  for (const registrationStatus of ['SUBMITTED', 'APPROVED']) {
    const student = { registrationId: 12, registrationStatus };
    assert.equal(placementStatus(student), 'APPLIED');
    assert.equal(placementStatus({ ...student, decision: 'PENDING' }), 'WAITING_RESPONSE');
    assert.equal(placementStatus({ ...student, decision: 'ACCEPTED' }), 'ACCEPTED');
    assert.equal(placementStatus({ ...student, decision: 'REJECTED' }), 'REJECTED');
  }
  for (const registrationStatus of ['DRAFT', 'REJECTED', 'HANDED_OFF']) {
    assert.equal(placementStatus({ registrationId: 12, registrationStatus }), 'NOT_APPLIED');
  }
});

test('enterprise acceptance remains separate from actual receipt', () => {
  const student = { decision: 'ACCEPTED' };
  assert.equal(placementStatus(student), 'ACCEPTED');
  assert.equal(placementStatus({ ...student, receivedAt: '2026-11-10T01:00:00Z' }), 'RECEIVED');
});

test('students without a current application are not applied', () => {
  for (const decision of [undefined, null, 'SUPERSEDED', 'WITHDRAWN']) {
    assert.equal(placementStatus({ decision }), 'NOT_APPLIED');
  }
});

test('the filter offers six distinct business statuses with separate colors', () => {
  assert.deepEqual(placementStatuses.map(status => placementStatusLabels[status]), [
    'Doanh nghiệp từ chối', 'Doanh nghiệp đã nhận', 'Đã ứng tuyển', 'Chờ phản hồi DN', 'Chưa ứng tuyển', 'Thực nhận',
  ]);
  assert.equal(new Set(placementStatuses.map(status => placementStatusColors[status])).size, 6);
});
