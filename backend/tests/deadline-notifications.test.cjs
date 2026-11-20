const { test } = require('node:test');
const assert = require('node:assert/strict');
const { noticeFingerprint } = require('../dist/shared/notification.service');

const row = {
  WindowID: 1, Name: 'Round', Status: 'OPEN',
  PostingStartsAt: '2031-01-01T00:00:00Z', PostingEndsAt: '2031-01-03T00:00:00Z',
  ApplicationStartsAt: '2031-01-03T00:00:00Z', ApplicationEndsAt: '2031-01-06T00:00:00Z',
  ResultsStartsAt: '2031-01-04T00:00:00Z', ResultsEndsAt: '2031-01-07T00:00:00Z',
};
test('schedule fingerprints survive date serialization but change with deadlines, state or scope', () => {
  assert.equal(noticeFingerprint(row), noticeFingerprint({ ...row, PostingEndsAt: new Date(row.PostingEndsAt) }));
  for (const patch of [{ Status: 'CLOSED' }, { Name: 'Changed' }, { ApplicationEndsAt: '2031-01-07T00:00:00Z' }, { Scope: { studentIds: [10] } }])
    assert.notEqual(noticeFingerprint(row), noticeFingerprint({ ...row, ...patch }));
});
