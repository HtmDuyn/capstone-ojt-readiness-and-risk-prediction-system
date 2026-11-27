// Run with node --test; uses the monorepo's TypeScript compiler without a browser.
const {describe,it}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ts=require('../../backend/node_modules/typescript');
const root=path.resolve(__dirname,'../src');
const cache=new Map();
function load(file){
 if(cache.has(file))return cache.get(file).exports;
 const mod={exports:{}};cache.set(file,mod);
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const localRequire=name=>load(path.resolve(name.startsWith('@/')?root:path.dirname(file),name.startsWith('@/')?name.slice(2)+'.ts':name+'.ts'));
 vm.runInThisContext('(function(require,module,exports){'+code+'\n})',{filename:file})(localRequire,mod,mod.exports);return mod.exports;
}
const {newRecruitmentSchedule,parseScheduleDate,updateScheduleDraft,validateRecruitmentSchedule}=load(path.join(root,'utils/qhdn/qhdnRecruitmentSchedule.ts'));

const now=Date.parse('2026-11-27T09:15:23+07:00');
const semester={semesterStart:'2026-09-01',semesterEnd:'2026-12-31'};
const prior={id:1,name:'Đợt 1',startsAt:'2026-11-28T09:00:00+07:00',endsAt:'2026-12-10T09:00:00+07:00'};
describe('recruitment round scheduling',()=>{
 it('suggests valid future phases for the first round',()=>{
  const draft=newRecruitmentSchedule(now,semester);
  assert.deepEqual(validateRecruitmentSchedule(draft,{now,...semester}).errors,{});
  assert.ok(+parseScheduleDate(draft.postingStartsAt)>now);
  const start=+parseScheduleDate(draft.postingStartsAt);
  assert.ok(start-now>=3*60000&&start-now<4*60000);
  assert.equal(+parseScheduleDate(draft.applicationStartsAt)-start,30*60000);
  assert.equal(draft.resultsStartsAt,draft.applicationStartsAt);
 });
 it('starts supplemental Hạn 1 exactly when the last round ends',()=>{
  const options={...semester,rounds:[prior]};
  const draft=newRecruitmentSchedule(now,options);
  assert.equal(+parseScheduleDate(draft.postingStartsAt),Date.parse(prior.endsAt));
  assert.equal(+parseScheduleDate(draft.applicationStartsAt)-Date.parse(prior.endsAt),30*60000);
  assert.deepEqual(validateRecruitmentSchedule(draft,{now,...options}).errors,{});
 });
 it('uses the latest end across rounds regardless of list order or status',()=>{
  const draft=newRecruitmentSchedule(now,{...semester,rounds:[prior,{...prior,id:2,endsAt:'2026-12-15T10:00:00+07:00'},{...prior,id:3,endsAt:'2026-12-01T10:00:00+07:00'}]});
  assert.equal(+parseScheduleDate(draft.postingStartsAt),Date.parse('2026-12-15T10:00:00+07:00'));
 });
 it('compresses suggested phases near the semester end without exceeding it',()=>{
  const options={...semester,rounds:[{...prior,endsAt:'2026-12-31T22:00:00+07:00'}]};
  const draft=newRecruitmentSchedule(now,options);
  assert.deepEqual(validateRecruitmentSchedule(draft,{now,...options}).errors,{});
  assert.ok(+parseScheduleDate(draft.resultsEndsAt)<=Date.parse('2027-01-01T00:00:00+07:00'));
 });
 it('leaves fields empty when there is no time for another round',()=>{
  const draft=newRecruitmentSchedule(now,{...semester,rounds:[{...prior,endsAt:'2027-01-01T00:00:00+07:00'}]});
  assert.equal(draft.postingStartsAt,'');
  assert.equal(newRecruitmentSchedule(now,{...semester,rounds:[{...prior,endsAt:'2026-12-31T23:30:00+07:00'}]}).postingStartsAt,'');
 });
 it('keeps the 30-minute offset when only 31 minutes remain in the semester',()=>{
  const options={...semester,rounds:[{...prior,endsAt:'2026-12-31T23:29:00+07:00'}]};
  const draft=newRecruitmentSchedule(now,options);
  assert.equal(draft.applicationStartsAt,'31/12/2026 23:59');
  assert.deepEqual(validateRecruitmentSchedule(draft,{now,...options}).errors,{});
 });
 it('uses current time plus three minutes if previous rounds already ended',()=>{
  const draft=newRecruitmentSchedule(now,{...semester,rounds:[{...prior,endsAt:'2026-11-26T09:00:00+07:00'}]});
  assert.equal(draft.postingStartsAt,newRecruitmentSchedule(now,semester).postingStartsAt);
 });
 it('rejects partial overlaps and reservations containing other rounds',()=>{
  const draft=newRecruitmentSchedule(now,semester);
  assert.ok(validateRecruitmentSchedule(draft,{now,...semester,rounds:[prior]}).errors.postingStartsAt);
 });
 it('rejects both edges outside the selected semester',()=>{
  const draft=newRecruitmentSchedule(now,semester);
  assert.ok(validateRecruitmentSchedule(draft,{now,semesterStart:'2026-12-01'}).errors.postingStartsAt);
  assert.ok(validateRecruitmentSchedule(draft,{now,semesterEnd:'2026-11-28'}).errors.resultsEndsAt);
 });
 it('updates suggested response end and preserves manually changed deadlines',()=>{
  const draft=newRecruitmentSchedule(now,semester);
  const changed=updateScheduleDraft(draft,'applicationEndsAt','12/12/2026 09:00',new Set());
  assert.equal(changed.resultsEndsAt,'13/12/2026 09:00');
  assert.equal(updateScheduleDraft(draft,'applicationEndsAt','12/12/2026 09:00',new Set(['resultsEndsAt'])).resultsEndsAt,draft.resultsEndsAt);
 });
 it('allows Hạn 2 to overlap Hạn 1 and rejects equal or earlier starts and deadlines',()=>{
  const draft={...newRecruitmentSchedule(now,semester),postingStartsAt:'28/11/2026 08:00',postingEndsAt:'02/12/2026 08:00',applicationStartsAt:'29/11/2026 08:00',applicationEndsAt:'06/12/2026 08:00',resultsStartsAt:'29/11/2026 08:00',resultsEndsAt:'07/12/2026 08:00'};
  assert.deepEqual(validateRecruitmentSchedule(draft,{now,...semester}).errors,{});
  for(const [key,value] of [['applicationStartsAt','28/11/2026 08:00'],['applicationStartsAt','28/11/2026 07:00'],['applicationEndsAt','02/12/2026 08:00'],['applicationEndsAt','02/12/2026 07:00']]){
   assert.ok(validateRecruitmentSchedule({...draft,[key]:value},{now,...semester}).errors[key]);
  }
  assert.ok(validateRecruitmentSchedule({...draft,resultsStartsAt:'29/11/2026 07:00'},{now,...semester}).errors.resultsStartsAt);
  assert.ok(validateRecruitmentSchedule({...draft,resultsEndsAt:'06/12/2026 07:00'},{now,...semester}).errors.resultsEndsAt);
 });
 it('changing Hạn 1 end preserves Hạn 2 start and maintains valid suggested ends',()=>{
  const draft=newRecruitmentSchedule(now,semester);
  const changed=updateScheduleDraft(draft,'postingEndsAt','12/12/2026 09:00',new Set());
  assert.equal(changed.applicationStartsAt,draft.applicationStartsAt);
  assert.ok(+parseScheduleDate(changed.applicationEndsAt)>+parseScheduleDate(changed.postingEndsAt));
  assert.deepEqual(validateRecruitmentSchedule(changed,{now,...semester}).errors,{});
  const manual=updateScheduleDraft(draft,'postingEndsAt','12/12/2026 09:00',new Set(['applicationStartsAt','applicationEndsAt','resultsEndsAt']));
  assert.equal(manual.applicationEndsAt,draft.applicationEndsAt);assert.equal(manual.resultsEndsAt,draft.resultsEndsAt);
  assert.ok(validateRecruitmentSchedule(manual,{now,...semester}).errors.applicationEndsAt);
 });
 it('moves untouched dates with Hạn 1 start but preserves manually entered Hạn 2 dates',()=>{
  const draft=newRecruitmentSchedule(now,semester);
  const changed=updateScheduleDraft(draft,'postingStartsAt','28/11/2026 23:50',new Set(['postingStartsAt']));
  assert.equal(changed.applicationStartsAt,'29/11/2026 00:20');
  assert.equal(changed.resultsStartsAt,changed.applicationStartsAt);
  assert.deepEqual(validateRecruitmentSchedule(changed,{now,...semester}).errors,{});
  const manual=updateScheduleDraft(draft,'postingStartsAt','28/11/2026 23:50',new Set(['postingEndsAt','applicationStartsAt','applicationEndsAt','resultsStartsAt','resultsEndsAt']));
  for(const key of ['postingEndsAt','applicationStartsAt','applicationEndsAt','resultsStartsAt','resultsEndsAt'])assert.equal(manual[key],draft[key]);
 });
});
