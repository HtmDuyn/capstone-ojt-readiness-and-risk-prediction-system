import test from 'node:test';
import assert from 'node:assert/strict';
import { emptySchedule,updateScheduleDraft,parseScheduleDate } from '../../src/utils/qhdnRecruitmentSchedule.ts';

test('posting deadline suggests seven application days, crossing month and year boundaries',()=>{
 const draft=updateScheduleDraft(emptySchedule,'postingEndsAt','28/12/2026 08:30',new Set());
 assert.equal(draft.applicationStartsAt,'28/12/2026 08:30');
 assert.equal(draft.applicationEndsAt,'04/01/2027 08:30');
 assert.equal(draft.resultsStartsAt,draft.applicationStartsAt);
 assert.equal(draft.resultsEndsAt,draft.applicationEndsAt);
});
test('manual deadlines survive suggestions; response start follows application start',()=>{
 let draft=updateScheduleDraft(emptySchedule,'postingEndsAt','01/12/2026 08:30',new Set());
 draft={...draft,applicationEndsAt:'12/12/2026 17:00',resultsEndsAt:'15/12/2026 17:00'};
 const manual=new Set(['applicationStartsAt','applicationEndsAt','resultsEndsAt']);
 draft=updateScheduleDraft(draft,'applicationStartsAt','03/12/2026 09:00',manual);
 draft=updateScheduleDraft(draft,'postingEndsAt','02/12/2026 09:00',manual);
 assert.equal(draft.applicationStartsAt,'03/12/2026 09:00');
 assert.equal(draft.resultsStartsAt,draft.applicationStartsAt);
 assert.equal(draft.applicationEndsAt,'12/12/2026 17:00');
 assert.equal(draft.resultsEndsAt,'15/12/2026 17:00');
});
test('invalid partial input does not generate dates and impossible calendar dates are rejected',()=>{
 assert.deepEqual(updateScheduleDraft(emptySchedule,'postingEndsAt','31/02/2026 10:00',new Set()),{...emptySchedule,postingEndsAt:'31/02/2026 10:00'});
 assert.equal(parseScheduleDate('29/02/2027 10:00'),null);
 assert.ok(parseScheduleDate('29/02/2028 10:00'));
});
test('manually entered response start survives changes to both posting deadline and application start',()=>{
 let draft=updateScheduleDraft(emptySchedule,'postingEndsAt','01/12/2026 08:30',new Set());
 const manual=new Set(['resultsStartsAt']);
 draft=updateScheduleDraft(draft,'resultsStartsAt','05/12/2026 10:00',manual);
 draft=updateScheduleDraft(draft,'postingEndsAt','02/12/2026 08:30',manual);
 draft=updateScheduleDraft(draft,'applicationStartsAt','03/12/2026 08:30',manual);
 assert.equal(draft.resultsStartsAt,'05/12/2026 10:00');
 assert.equal(draft.applicationStartsAt,'03/12/2026 08:30');
});
