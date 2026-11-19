import assert from 'node:assert/strict';
import test from 'node:test';
import { ojtSourceEndpoints, partitionOjtLoad } from '../../src/utils/education/ojtEligibilityLoad.ts';

const keys = Object.keys(ojtSourceEndpoints);
for (const failedKey of keys) {
  test(`keeps four successful OJT sources when ${failedKey} returns HTTP 500`, () => {
    const settled = keys.map(key => key === failedKey
      ? { status: 'rejected', reason: { response: { status: 500, data: { errorCode: 'TEST_500', message: 'Backend failed' } } } }
      : { status: 'fulfilled', value: [key] });
    const { values, issues } = partitionOjtLoad(keys, settled);
    assert.equal(Object.keys(values).length, keys.length - 1);
    assert.deepEqual(values[failedKey], undefined);
    for (const key of keys.filter(key => key !== failedKey)) assert.deepEqual(values[key], [key]);
    assert.deepEqual(issues[failedKey], {
      endpoint: ojtSourceEndpoints[failedKey], status: 500, errorCode: 'TEST_500', message: 'Backend failed',
    });
  });
}
