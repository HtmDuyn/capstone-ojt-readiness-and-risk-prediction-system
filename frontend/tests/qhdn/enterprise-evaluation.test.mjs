import test from 'node:test';
import assert from 'node:assert/strict';
import { applyEvaluationScore, evaluationAverage, parseEvaluationScore, taskScoreSuggestion } from '../../src/utils/enterpriseEvaluation.ts';

test('average uses exactly the three criteria, preserves zero, rounds to two decimals and waits for complete scores', () => {
  assert.equal(evaluationAverage({ completionScore: '9', skillScore: '8', attitudeScore: '9' }), 8.67);
  assert.equal(evaluationAverage({ completionScore: '7', skillScore: '7', attitudeScore: '8' }), 7.33);
  assert.equal(evaluationAverage({ completionScore: '0', skillScore: '0', attitudeScore: '0' }), 0);
  assert.equal(evaluationAverage({ completionScore: '6', skillScore: '', attitudeScore: '8' }), null);
  for (const value of [' ', 'NaN', 'Infinity', '-1', '11', '8.123']) assert.equal(parseEvaluationScore(value), null);
  assert.equal(parseEvaluationScore('9.25'), 9.25);
});

test('task suggestion is based on completed task ratio; no task does not imply a zero score', () => {
  assert.equal(taskScoreSuggestion(9, 10), 9);
  assert.equal(taskScoreSuggestion(2, 3), 6.67);
  assert.equal(taskScoreSuggestion(0, 10), 0);
  assert.equal(taskScoreSuggestion(10, 10), 10);
  assert.equal(taskScoreSuggestion(0, 0), null);
});

test('targeted bulk scoring keeps other criteria and task suggestion intact; all criteria may be explicitly overridden', () => {
  const row = { completionScore: '9', skillScore: '', attitudeScore: '', suggestion: 9 };
  const soft = applyEvaluationScore(row, 'skillScore', '8');
  const attitude = applyEvaluationScore(soft, 'attitudeScore', '7');
  assert.deepEqual(attitude, { completionScore: '9', skillScore: '8', attitudeScore: '7', suggestion: 9 });
  assert.equal(evaluationAverage(attitude), 8);
  assert.deepEqual(applyEvaluationScore(row, 'all', '0'), { completionScore: '0', skillScore: '0', attitudeScore: '0', suggestion: 9 });
  assert.equal(row.completionScore, '9');
});
