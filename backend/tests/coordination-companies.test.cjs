const {test}=require('node:test');
const assert=require('node:assert/strict');
const {coordinationCompanies}=require('../dist/modules/qhdn/placement-slots');
test('company list aggregates targets and actual receipts, without duplicate position rows',()=>{
 assert.deepEqual(coordinationCompanies([
  {companyId:1,companyName:'Company',capacity:3,actualCount:2},
  {companyId:1,companyName:'Company',capacity:2,actualCount:4},
  {companyId:2,companyName:'Other',capacity:5,actualCount:1},
 ]),[
  {id:1,name:'Company',capacity:5,actualCount:6,availableSlots:0},
  {id:2,name:'Other',capacity:5,actualCount:1,availableSlots:4},
 ]);
});
test('full, over-target and zero-target enterprises remain selectable',()=>{
 const companies=coordinationCompanies([
  {companyId:1,companyName:'Full',capacity:2,actualCount:2},
  {companyId:2,companyName:'Over',capacity:2,actualCount:4},
  {companyId:3,companyName:'Zero',capacity:null,actualCount:0},
 ]);
 assert.equal(companies.length,3);
 assert.ok(companies.every(company=>company.availableSlots===0));
});
test('company-level distinct student counts prevent double-counting across positions and include companies with no current targets',()=>{
 const companies=coordinationCompanies([
  {companyId:1,companyName:'Company',capacity:3,actualCount:3},
  {companyId:1,companyName:'Company',capacity:3,actualCount:3},
 ],[{id:1,name:'Company',actualCount:4},{id:2,name:'Historic',actualCount:2}]);
 assert.deepEqual(companies,[
  {id:1,name:'Company',capacity:6,actualCount:4,availableSlots:2},
  {id:2,name:'Historic',capacity:0,actualCount:2,availableSlots:0},
 ]);
});
