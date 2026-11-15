import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizePlacementCompanies } from '../../src/utils/qhdnCompanySummary.ts';

const positions=[{id:1,companyName:'TechViet',capacity:2},{id:2,companyName:'TechViet',capacity:3}];
const items=[1,2,3].map(id=>({id,companyName:'TechViet',decision:'ACCEPTED'}));
test('legacy API without companies still shows the three accepted students and the full company target',()=>{
 const [company]=summarizePlacementCompanies({positions,items});
 assert.equal(company.name,'TechViet');assert.equal(company.capacity,5);assert.equal(company.actualCount,3);assert.equal(company.availableSlots,2);
});
test('empty company summary does not hide accepted students; count does not depend on current UI search or filters',()=>{
 assert.equal(summarizePlacementCompanies({companies:[],positions,items})[0].actualCount,3);
 assert.equal(summarizePlacementCompanies({companies:[],positions:[],items})[0].actualCount,3);
});
test('stale zero count is corrected and accepted, assigned and historical receipts are not counted twice',()=>{
 const [company]=summarizePlacementCompanies({companies:[{id:9,name:'TechViet',capacity:2,actualCount:0}],positions:[],items:[...items,{...items[0],hasAssignment:true,receivedAt:'2026-11-16'}]});
 assert.equal(company.actualCount,3);assert.equal(company.capacity,2);assert.equal(company.availableSlots,0);
});
test('duplicate position rows do not inflate targets and mixed responses resolve the real company id',()=>{
 const [company]=summarizePlacementCompanies({positions:[...positions,positions[0]],items:items.map(item=>({...item,companyId:9}))});
 assert.equal(company.id,9);assert.equal(company.capacity,5);assert.equal(company.actualCount,3);
});
test('pending and rejected referrals never increase accepted headcount',()=>{
 const [company]=summarizePlacementCompanies({positions,items:[{id:1,companyName:'TechViet',decision:'REJECTED'},{id:2,companyName:'TechViet',decision:'PENDING'}]});
 assert.equal(company.actualCount,0);
});
