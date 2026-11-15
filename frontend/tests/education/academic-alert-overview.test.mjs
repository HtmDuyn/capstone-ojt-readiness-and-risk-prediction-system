import test from 'node:test';
import assert from 'node:assert/strict';
import { academicAlertOverview } from '../../src/utils/academicAlertOverview.ts';

test('đếm từng loại cảnh báo và sinh viên duy nhất qua các trang', () => {
  const result = academicAlertOverview([
    { studentId: 1, ojtSemesterId: 2, academicPeriodId: 4, alertTypes: ['CREDIT_SHORTFALL', 'MISSING_REQUIRED_COURSES'] },
    { studentId: 1, ojtSemesterId: 2, academicPeriodId: 4, alertTypes: ['CREDIT_SHORTFALL'] },
    { studentId: 2, ojtSemesterId: 2, academicPeriodId: 4, alertTypes: ['CREDIT_SHORTFALL'] },
  ]);
  assert.equal(result.total, 3);
  assert.equal(result.studentCount, 2);
  assert.deepEqual(result.groups.map(group => group.count), [2, 1]);
});

test('cùng sinh viên ở kỳ OJT khác được tính theo phạm vi, nhưng chỉ một sinh viên', () => {
  const result = academicAlertOverview([
    { studentId: 1, ojtSemesterId: 2, alertTypes: ['CREDIT_SHORTFALL'] },
    { studentId: 1, ojtSemesterId: 3, alertTypes: ['CREDIT_SHORTFALL'] },
  ]);
  assert.equal(result.total, 2);
  assert.equal(result.studentCount, 1);
  assert.equal(academicAlertOverview([]).total, 0);
});
