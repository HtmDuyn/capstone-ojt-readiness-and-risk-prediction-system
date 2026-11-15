import test from 'node:test';
import assert from 'node:assert/strict';
import { recruitmentPhases, validateRecruitmentPhases } from '../../src/utils/recruitmentSchedule.ts';

const schedule = {
  postingStartsAt:'2026-12-01T00:00:00+07:00', postingEndsAt:'2026-12-08T00:00:00+07:00',
  applicationStartsAt:'2026-12-08T00:00:00+07:00', applicationEndsAt:'2026-12-15T00:00:00+07:00',
  resultsStartsAt:'2026-12-08T00:00:00+07:00', resultsEndsAt:'2026-12-19T00:00:00+07:00',
};
test('three intervals allow review alongside applications and beyond their deadline', () => {
  assert.equal(recruitmentPhases.length, 3);
  assert.doesNotThrow(() => validateRecruitmentPhases(schedule));
});
test('invalid dates, posting overlap, delayed review and an insufficient response deadline are rejected', () => {
  for (const change of [
    { postingStartsAt:'' }, { postingEndsAt:schedule.postingStartsAt },
    { postingEndsAt:'2026-12-09T00:00:00+07:00' },
    { resultsStartsAt:'2026-12-07T00:00:00+07:00' }, { resultsStartsAt:schedule.resultsEndsAt }, { resultsEndsAt:'2026-12-14T00:00:00+07:00' },
  ]) assert.throws(() => validateRecruitmentPhases({ ...schedule,...change }));
});
test('response and application deadlines may be equal',()=>{
 assert.doesNotThrow(()=>validateRecruitmentPhases({...schedule,resultsEndsAt:schedule.applicationEndsAt}));
});
test('response start can be customized during or after the application interval',()=>{
 for(const resultsStartsAt of ['2026-12-10T00:00:00+07:00',schedule.applicationEndsAt,'2026-12-17T00:00:00+07:00'])
  assert.doesNotThrow(()=>validateRecruitmentPhases({...schedule,resultsStartsAt}));
});
