import test from 'node:test';
import assert from 'node:assert/strict';
import { savedOjtDisplayStatus } from '../../src/utils/educationOjtReason.ts';

test('the monitoring view uses only a saved result for eligibility status', () => {
  assert.equal(savedOjtDisplayStatus(), 'PENDING');
  assert.equal(savedOjtDisplayStatus(undefined, 'inactive'), 'PENDING');
  assert.equal(savedOjtDisplayStatus({ status: 'ELIGIBLE', isStale: false }, ''), 'ELIGIBLE');
  assert.equal(savedOjtDisplayStatus({ status: 'NOT_ELIGIBLE', isStale: false }, ''), 'NOT_ELIGIBLE');
  assert.equal(savedOjtDisplayStatus({ status: 'REVIEW_REQUIRED', isStale: false }, ''), 'REVIEW_REQUIRED');
  assert.equal(savedOjtDisplayStatus({ status: 'ELIGIBLE', isStale: true }, ''), 'STALE');
});
