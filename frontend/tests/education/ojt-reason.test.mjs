import test from 'node:test';
import assert from 'node:assert/strict';
import { educationOjtDisplayStatus, educationOjtReason } from '../../src/utils/educationOjtReason.ts';

const result = (status, reasons = [], academicIssues = [], isStale = false) => ({ status, reasons, academicIssues, isStale });

test('shows the seven OJT reason cases from the actual result fields', () => {
  assert.equal(educationOjtReason(result('ELIGIBLE')), 'Đáp ứng yêu cầu xét OJT.');
  assert.equal(educationOjtReason(result('NOT_ELIGIBLE', ['Còn thiếu 5 tín chỉ so với mức 70.'])), 'Còn thiếu 5 tín chỉ so với mức 70.');
  assert.equal(educationOjtReason(result('NOT_ELIGIBLE', ['Còn 3 môn chưa đạt, vượt giới hạn 2 môn.'])), 'Còn 3 môn chưa đạt, vượt giới hạn 2 môn.');
  assert.equal(educationOjtReason(result('REVIEW_REQUIRED', [], ['Chưa đủ dữ liệu tín chỉ hoặc cấu hình chương trình để kết luận.'])), 'Chưa đủ dữ liệu tín chỉ hoặc cấu hình chương trình để kết luận.');
  assert.equal(educationOjtReason(), 'Chưa thực hiện xét điều kiện OJT.');
  assert.equal(educationOjtReason(undefined, 'Bảng điểm chưa tải đầy đủ; chưa thể xét điều kiện.'), 'Bảng điểm chưa tải đầy đủ; chưa thể xét điều kiện.');
  assert.equal(educationOjtReason(result('ELIGIBLE', [], [], true)), 'Dữ liệu học tập đã thay đổi sau lần xét gần nhất.');
});

test('prioritizes current failure, stale result and inactive status over old reasons', () => {
  const old = result('NOT_ELIGIBLE', ['Còn thiếu 5 tín chỉ.'], [], true);
  assert.equal(educationOjtReason(old, 'Không tải được đầy đủ bảng điểm.', 'Sinh viên không hoạt động.'), 'Không tải được đầy đủ bảng điểm.');
  assert.equal(educationOjtReason(old, undefined, 'Sinh viên không hoạt động.'), 'Dữ liệu học tập đã thay đổi sau lần xét gần nhất.');
  assert.equal(educationOjtReason(result('ELIGIBLE'), undefined, 'Sinh viên không hoạt động.'), 'Sinh viên không hoạt động.');
  assert.equal(educationOjtReason(undefined, 'Network Error'), 'Không thể tải hoặc xét dữ liệu sinh viên. Vui lòng thử lại.');
});

test('partitions every student into exactly one displayed status', () => {
  const cases = [
    [result('ELIGIBLE'), undefined, undefined, 'ELIGIBLE'],
    [result('NOT_ELIGIBLE'), undefined, undefined, 'NOT_ELIGIBLE'],
    [result('REVIEW_REQUIRED'), undefined, undefined, 'REVIEW_REQUIRED'],
    [undefined, undefined, undefined, 'PENDING'],
    [undefined, 'Không tải được đầy đủ bảng điểm.', undefined, 'ERROR'],
    [result('ELIGIBLE', [], [], true), undefined, undefined, 'STALE'],
    [undefined, undefined, 'Sinh viên không hoạt động.', 'INACTIVE'],
  ];
  for (const [eligibility, failure, inactive, expected] of cases) {
    assert.equal(educationOjtDisplayStatus(eligibility, failure, inactive), expected);
  }
  assert.equal(educationOjtDisplayStatus(result('ELIGIBLE', [], [], true), 'Lỗi tải dữ liệu', 'Không hoạt động'), 'ERROR');
  assert.equal(educationOjtDisplayStatus(result('ELIGIBLE', [], [], true), undefined, 'Không hoạt động'), 'STALE');
});
