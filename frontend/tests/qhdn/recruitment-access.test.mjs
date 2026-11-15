import test from 'node:test';
import assert from 'node:assert/strict';
import { recruitmentScheduleAccess } from '../../src/utils/qhdnRecruitmentSchedule.ts';

const round={status:'OPEN',serverNow:'2026-11-16T00:00:00Z',startsAt:'2028-11-11T07:40:00Z',endsAt:'2028-11-13T13:00:00Z',
 postingStartsAt:'2028-11-11T07:40:00Z',postingEndsAt:'2028-11-11T12:40:00Z',applicationStartsAt:'2028-11-12T07:40:00Z',applicationEndsAt:'2028-11-12T12:40:00Z',resultsStartsAt:'2028-11-12T07:40:00Z',resultsEndsAt:'2028-11-13T13:00:00Z'};
test('future rounds expose edit action and all fields, including when older API responses omit action hints',()=>{
 for(const status of ['DRAFT','OPEN']){
  const access=recruitmentScheduleAccess({...round,status});
  assert.equal(access.canEditSchedule,true);
  assert.equal(access.editableScheduleFields.length,6);
 }
});
test('server restrictions, unavailable periods, closed rounds and finalized results stay locked',()=>{
 assert.equal(recruitmentScheduleAccess({...round,canEditSchedule:false}).canEditSchedule,false);
 assert.equal(recruitmentScheduleAccess(round,false).canEditSchedule,false);
 assert.equal(recruitmentScheduleAccess({...round,status:'CLOSED'}).canEditSchedule,false);
 assert.equal(recruitmentScheduleAccess({...round,resultsFinalizedAt:round.serverNow}).canEditSchedule,false);
 assert.equal(recruitmentScheduleAccess({...round,serverNow:round.endsAt}).canEditSchedule,false);
});
test('editing an active round keeps past boundaries locked',()=>{
 const access=recruitmentScheduleAccess({...round,serverNow:'2028-11-11T08:00:00Z'});
 assert.equal(access.canEditSchedule,true);
 assert.ok(!access.editableScheduleFields.includes('postingStartsAt'));
 assert.ok(access.editableScheduleFields.includes('postingEndsAt'));
});
