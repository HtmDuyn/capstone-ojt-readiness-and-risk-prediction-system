const {test}=require('node:test');const assert=require('node:assert/strict');
const {coordinationAvailability}=require('../dist/modules/qhdn/placement.policy');
const ongoing={roundCount:1,unfinished:1},complete={roundCount:1,unfinished:0};
test('enterprise rejection can be coordinated immediately, without an ended or finalized round',()=>{
 for(const source of ['STUDENT_APPLICATION','QHDN_COORDINATION','QHDN_APPLICATION']){
  assert.equal(coordinationAvailability({decision:'REJECTED',source},ongoing).canCoordinate,true);
  assert.equal(coordinationAvailability({decision:'REJECTED',source},complete).canCoordinate,true);
 }
});
test('confirmed placement, inactive students and pending QHDN coordination remain locked',()=>{
 for(const state of [{decision:'ACCEPTED'},{decision:'REJECTED',hasAssignment:true},{decision:'REJECTED',hasConfirmedPlace:true},{decision:'REJECTED',receivedAt:'2026-11-11'},{decision:'REJECTED',isActive:false},{decision:'PENDING',source:'QHDN_COORDINATION'}]){
  for(const context of [ongoing,complete]){
   const result=coordinationAvailability(state,context);assert.equal(result.canCoordinate,false);assert.ok(result.coordinationBlockedReason);
  }
 }
});
test('do not interrupt applications awaiting enterprise review; final summaries still enable other unplaced students',()=>{
 assert.equal(coordinationAvailability({decision:'PENDING',source:'STUDENT_APPLICATION'},ongoing).canCoordinate,false);
 assert.equal(coordinationAvailability({},ongoing).canCoordinate,false);
 assert.equal(coordinationAvailability({},complete).canCoordinate,true);
 assert.equal(coordinationAvailability({decision:'PENDING',source:'STUDENT_APPLICATION'},complete).canCoordinate,true);
 assert.equal(coordinationAvailability({},{roundCount:0,unfinished:0}).canCoordinate,false);
});
