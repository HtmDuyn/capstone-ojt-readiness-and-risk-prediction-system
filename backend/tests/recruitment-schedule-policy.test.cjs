const {test}=require('node:test');
const assert=require('node:assert/strict');
const {editedSchedule,schedulePermissions,scheduleColumns}=require('../dist/modules/recruitment/schedule-policy');
const w={CampaignID:1,Status:'DRAFT',Kind:'SEMESTER',AcademicPeriodID:1,LinkedPeriodID:1,PeriodStatus:'PLANNED',OpenedAt:null,
 DatabaseNow:'2026-12-01T00:00:00Z',StartsAt:'2026-12-02T00:00:00Z',EndsAt:'2026-12-10T00:00:00Z',
 PostingStartsAt:'2026-12-02T00:00:00Z',PostingEndsAt:'2026-12-03T00:00:00Z',
 ApplicationStartsAt:'2026-12-03T00:00:00Z',ApplicationEndsAt:'2026-12-10T00:00:00Z',
 ResultsStartsAt:'2026-12-03T00:00:00Z',ResultsEndsAt:'2026-12-10T00:00:00Z'};
const input=(row,patch={})=>({...Object.fromEntries(Object.entries(scheduleColumns).map(([key,col])=>[key,row[col]])),...patch});
test('opened in advance remains fully editable until the scheduled start, but cannot be deleted',()=>{
 const scheduled={...w,Status:'OPEN',OpenedAt:w.DatabaseNow};
 assert.equal(schedulePermissions(scheduled).canEditSchedule,true);
 assert.equal(schedulePermissions(scheduled).canDelete,false);
 assert.equal(schedulePermissions(scheduled).editableScheduleFields.length,6);
 assert.doesNotThrow(()=>editedSchedule(scheduled,input(scheduled,{postingStartsAt:'2026-12-01T12:00:00Z',resultsStartsAt:'2026-12-04T00:00:00Z'})));
 assert.throws(()=>editedSchedule(scheduled,input(scheduled,{postingStartsAt:scheduled.DatabaseNow})));
});
test('draft allows complete rescheduling and deletion; historical opening always prevents deletion',()=>{
 assert.equal(schedulePermissions(w).canDelete,true);
 assert.equal(schedulePermissions(w).editableScheduleFields.length,6);
 const after=editedSchedule(w,input(w,{postingStartsAt:'2026-12-01T01:00:00Z'}));
 assert.equal(+new Date(after.StartsAt),+new Date('2026-12-01T01:00:00Z'));
 for(const patch of [{Status:'OPEN'},{Status:'CLOSED'},{OpenedAt:w.DatabaseNow},{ResultsFinalizedAt:w.DatabaseNow}])assert.equal(schedulePermissions({...w,...patch}).canDelete,false);
 assert.throws(()=>editedSchedule(w,input(w,{postingStartsAt:w.DatabaseNow})));
});
test('open round may shorten or extend future deadlines, but cannot move started boundaries or reopen expired phases',()=>{
 const posting={...w,Status:'OPEN',OpenedAt:w.DatabaseNow,DatabaseNow:'2026-12-02T12:00:00Z'};
 assert.ok(!schedulePermissions(posting).editableScheduleFields.includes('postingStartsAt'));
 assert.doesNotThrow(()=>editedSchedule(posting,input(posting,{postingEndsAt:'2026-12-02T18:00:00Z'})));
 assert.throws(()=>editedSchedule(posting,input(posting,{postingStartsAt:'2026-12-02T13:00:00Z'})));
 assert.throws(()=>editedSchedule(posting,input(posting,{postingEndsAt:posting.DatabaseNow})));
 const applying={...posting,DatabaseNow:'2026-12-03T12:00:00Z'};
 assert.throws(()=>editedSchedule(applying,input(applying,{postingEndsAt:'2026-12-04T00:00:00Z'})));
 assert.doesNotThrow(()=>editedSchedule(applying,input(applying,{applicationEndsAt:'2026-12-09T00:00:00Z'})));
 const ended={...applying,DatabaseNow:w.EndsAt};
 assert.equal(schedulePermissions(ended).canEditSchedule,false);
 assert.throws(()=>editedSchedule(ended,input(ended,{resultsEndsAt:'2026-12-11T00:00:00Z'})));
});
test('response deadline may equal applications but cannot precede it; closed or unavailable rounds stay locked',()=>{
 assert.doesNotThrow(()=>editedSchedule(w,input(w)));
 assert.throws(()=>editedSchedule(w,input(w,{resultsEndsAt:'2026-12-09T00:00:00Z'})));
 for(const patch of [{Status:'CLOSED'},{PeriodStatus:'CLOSED'},{LinkedPeriodID:2},{ResultsFinalizedAt:w.DatabaseNow}])assert.throws(()=>editedSchedule({...w,...patch},input(w)));
});
test('response start is independently editable until it begins',()=>{
 assert.doesNotThrow(()=>editedSchedule(w,input(w,{resultsStartsAt:'2026-12-05T00:00:00Z'})));
 assert.throws(()=>editedSchedule(w,input(w,{resultsStartsAt:'2026-12-02T00:00:00Z'})));
 assert.throws(()=>editedSchedule(w,input(w,{resultsStartsAt:w.ResultsEndsAt})));
 const open={...w,Status:'OPEN',OpenedAt:w.DatabaseNow,DatabaseNow:'2026-12-04T00:00:00Z',ResultsStartsAt:'2026-12-05T00:00:00Z'};
 assert.doesNotThrow(()=>editedSchedule(open,input(open,{resultsStartsAt:'2026-12-06T00:00:00Z'})));
 assert.throws(()=>editedSchedule({...open,DatabaseNow:open.ResultsStartsAt},input(open,{resultsStartsAt:'2026-12-06T00:00:00Z'})));
});
