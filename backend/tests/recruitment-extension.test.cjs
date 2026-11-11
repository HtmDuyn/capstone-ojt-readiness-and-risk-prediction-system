const { test }=require('node:test');const assert=require('node:assert/strict');
const {extendedSchedule}=require('../dist/modules/recruitment/extension-policy');
const w={CampaignID:1,Status:'OPEN',DatabaseNow:'2026-11-11T09:00:00Z',StartsAt:'2026-11-11T08:00:00Z',EndsAt:'2026-11-11T14:00:00Z',
 PostingStartsAt:'2026-11-11T08:00:00Z',PostingEndsAt:'2026-11-11T10:00:00Z',ApplicationStartsAt:'2026-11-11T11:00:00Z',ApplicationEndsAt:'2026-11-11T13:00:00Z',ResultsStartsAt:'2026-11-11T11:00:00Z',ResultsEndsAt:'2026-11-11T14:00:00Z'};
test('only extend an active interval, preserve fixed starts and reject invalid ordering',()=>{
 assert.equal(+extendedSchedule(w,{postingEndsAt:'2026-11-11T10:30:00Z'}).PostingEndsAt,+new Date('2026-11-11T10:30:00Z'));
 for(const input of [{postingEndsAt:'2026-11-11T09:30:00Z'},{postingEndsAt:'2026-11-11T11:01:00Z'},{applicationEndsAt:'2026-11-11T13:30:00Z'},{}])assert.throws(()=>extendedSchedule(w,input));
 assert.throws(()=>extendedSchedule({...w,Status:'CLOSED'},{postingEndsAt:'2026-11-11T10:30:00Z'}));
});
test('concurrent application/response extensions are atomic and never reopen closed applications',()=>{
 const active={...w,DatabaseNow:'2026-11-11T12:00:00Z'};
 const after=extendedSchedule(active,{applicationEndsAt:'2026-11-11T15:00:00Z',resultsEndsAt:'2026-11-11T16:00:00Z'});
 assert.equal(after.ApplicationStartsAt,w.ApplicationStartsAt);assert.equal(+after.EndsAt,+new Date('2026-11-11T16:00:00Z'));
 assert.throws(()=>extendedSchedule(active,{applicationEndsAt:'2026-11-11T14:00:00Z'}));
 const closed={...w,DatabaseNow:w.ApplicationEndsAt};
 assert.throws(()=>extendedSchedule(closed,{applicationEndsAt:'2026-11-11T13:30:00Z'}),e=>e.errorCode==='RECRUITMENT_EXTENSION_CLOSED');
 assert.doesNotThrow(()=>extendedSchedule(closed,{resultsEndsAt:'2026-11-11T15:00:00Z'}));
});
