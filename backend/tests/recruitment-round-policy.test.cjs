const { test } = require('node:test');
const assert = require('node:assert/strict');
const { currentRoundPhase, roundActions, assertRoundPhase } = require('../dist/modules/recruitment/round-policy');
const { validateCampaignSchedule } = require('../dist/modules/recruitment/window.service');

const round = {
  CampaignID: 1, Status: 'DRAFT', Kind: 'SEMESTER', AcademicPeriodID: 1, LinkedPeriodID: 1,
  PeriodStatus: 'PLANNED', DatabaseNow: new Date('2026-11-11T08:00:00Z'),
  StartsAt: new Date('2026-11-11T09:00:00Z'), EndsAt: new Date('2026-11-11T10:00:00Z'),
  PreviousRoundPending: false,
};
test('first round can be opened in advance but recruitment waits for its start', () => {
  assert.equal(roundActions(round).canOpen, true);
  const opened = { ...round, Status: 'OPEN' };
  assert.equal(currentRoundPhase(opened), 'SCHEDULED');
  assert.throws(() => assertRoundPhase(opened, 'POSTING'));
  const started = { ...opened, DatabaseNow: round.StartsAt };
  assert.equal(currentRoundPhase(started), 'OPEN');
  assert.doesNotThrow(() => assertRoundPhase(started, 'APPLICATION'));
});
test('expired, closed, finalized, unavailable and blocked rounds cannot be opened', () => {
  for (const change of [
    { DatabaseNow: round.EndsAt }, { Status: 'CLOSED' }, { Status: 'OPEN' },
    { ResultsFinalizedAt: round.DatabaseNow }, { PeriodStatus: 'CLOSED' },
    { PeriodStatus: 'ARCHIVED' }, { Kind: 'BLOCK' }, { LinkedPeriodID: 2 },
    { PreviousRoundPending: true },
  ]) {
    const actions = roundActions({ ...round, ...change });
    assert.equal(actions.canOpen, false, JSON.stringify(change));
    assert.ok(actions.openBlockedReason);
  }
  assert.equal(currentRoundPhase({ ...round, Status: 'CLOSED' }), 'CLOSED');
});
test('end time is exclusive for applications and inclusive for finalization', () => {
  const ended = { ...round, Status: 'OPEN', DatabaseNow: round.EndsAt };
  assert.equal(currentRoundPhase(ended), 'ENDED');
  assert.throws(() => assertRoundPhase(ended, 'APPLICATION'));
  assert.equal(roundActions(round).canFinalize, false);
  assert.equal(roundActions(ended).canFinalize, true);
  assert.equal(roundActions({ ...ended, ResultsFinalizedAt: round.EndsAt }).canFinalize, false);
});
test('campaign children must be ordered, non-overlapping and inside the parent', () => {
  const child = { name: 'First', postingStartsAt: '2026-11-11T08:00:00Z', postingEndsAt: '2026-11-11T09:00:00Z',
    applicationStartsAt: '2026-11-11T09:00:00Z', applicationEndsAt: '2026-11-11T11:00:00Z',
    resultsStartsAt: '2026-11-11T09:00:00Z', resultsEndsAt: '2026-11-11T12:00:00Z' };
  const body = { startsAt: child.postingStartsAt, endsAt: child.resultsEndsAt, rounds: [child] };
  assert.equal(validateCampaignSchedule(body).rounds.length, 1);
  for (const change of [
    { postingEndsAt: '2026-11-11T09:01:00Z' }, { resultsEndsAt: '2026-11-11T12:01:00Z' },
    { resultsEndsAt: child.applicationEndsAt }, { resultsStartsAt: child.applicationEndsAt },
  ]) assert.throws(() => validateCampaignSchedule({ ...body, rounds: [{ ...child, ...change }] }));
  assert.throws(() => validateCampaignSchedule({ ...body, rounds: [child, child] }));
});

test('posting, concurrent applications/reviews, review-only and deadline boundaries', () => {
  const phased = { ...round, Status: 'OPEN', StartsAt: '2026-11-11T08:00:00Z', EndsAt: '2026-11-11T12:00:00Z',
    PostingStartsAt: '2026-11-11T08:00:00Z', PostingEndsAt: '2026-11-11T09:00:00Z',
    ApplicationStartsAt: '2026-11-11T09:00:00Z', ApplicationEndsAt: '2026-11-11T11:00:00Z',
    ResultsStartsAt: '2026-11-11T09:00:00Z', ResultsEndsAt: '2026-11-11T12:00:00Z' };
  const cases = [
    ['08:00:00', 'POSTING', ['POSTING']],
    ['09:00:00', 'APPLICATION_AND_RESULTS', ['APPLICATION','RESULTS']],
    ['10:59:59', 'APPLICATION_AND_RESULTS', ['APPLICATION','RESULTS']],
    ['11:00:00', 'RESULTS', ['RESULTS']],
    ['12:00:00', 'ENDED', []],
  ];
  for (const [time, phase, allowed] of cases) {
    const w = { ...phased, DatabaseNow: new Date('2026-11-11T'+time+'Z') };
    assert.equal(currentRoundPhase(w), phase);
    for (const action of ['POSTING','APPLICATION','RESULTS']) {
      if (allowed.includes(action)) assert.doesNotThrow(() => assertRoundPhase(w, action));
      else assert.throws(() => assertRoundPhase(w, action), error => error.errorCode === 'RECRUITMENT_PHASE_CLOSED');
    }
  }
});
