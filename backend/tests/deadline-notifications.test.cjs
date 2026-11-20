const { test } = require('node:test');
const assert = require('node:assert/strict');
const { dueRecruitmentNotices } = require('../dist/modules/recruitment/notification.service');
const { noticeFingerprint } = require('../dist/shared/notification.service');

const row = {
  WindowID: 1, Name: 'Round', Status: 'OPEN',
  PostingStartsAt: '2031-01-01T00:00:00Z', PostingEndsAt: '2031-01-03T00:00:00Z',
  ApplicationStartsAt: '2031-01-03T00:00:00Z', ApplicationEndsAt: '2031-01-06T00:00:00Z',
  ResultsStartsAt: '2031-01-04T00:00:00Z', ResultsEndsAt: '2031-01-07T00:00:00Z',
};
test('deadline notices respect phase start/end, 24-hour threshold and recipient roles', () => {
  const due = time => dueRecruitmentNotices(row, new Date(time));
  assert.deepEqual(due('2030-12-31T23:59:59Z'), []);
  assert.deepEqual(due('2031-01-01T00:00:00Z').map(n => n.event), ['POSTING_OPEN']);
  const posting = due('2031-01-02T00:00:00Z');
  assert.deepEqual(posting.map(n => n.event), ['POSTING_OPEN', 'POSTING_REMINDER']);
  assert.ok(posting.every(n => n.audience === 'ENTERPRISE'));
  assert.deepEqual(due('2031-01-03T00:00:00Z').map(n => [n.event,n.audience]), [['APPLICATION_OPEN','STUDENT']]);
  assert.deepEqual(due('2031-01-06T00:00:00Z').map(n => [n.event,n.audience]), [['RESULTS_OPEN','ENTERPRISE'],['RESULTS_REMINDER','ENTERPRISE']]);
  assert.deepEqual(due('2031-01-07T00:00:00Z'), []);
  for (const patch of [{ Status: 'DRAFT' }, { Status: 'CLOSED' }, { ResultsFinalizedAt: new Date() }])
    assert.deepEqual(dueRecruitmentNotices({ ...row, ...patch }, new Date('2031-01-05')), []);
});
test('schedule fingerprints survive date serialization but change with deadlines, state or scope', () => {
  assert.equal(noticeFingerprint(row), noticeFingerprint({ ...row, PostingEndsAt: new Date(row.PostingEndsAt) }));
  for (const patch of [{ Status: 'CLOSED' }, { Name: 'Changed' }, { ApplicationEndsAt: '2031-01-07T00:00:00Z' }, { Scope: { studentIds: [10] } }])
    assert.notEqual(noticeFingerprint(row), noticeFingerprint({ ...row, ...patch }));
});
