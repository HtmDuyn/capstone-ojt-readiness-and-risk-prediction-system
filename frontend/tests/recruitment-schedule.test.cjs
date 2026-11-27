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
 });
 it('starts supplemental Hạn 1 exactly when the last round ends',()=>{
  const options={...semester,rounds:[prior]};
  const draft=newRecruitmentSchedule(now,options);
  assert.equal(+parseScheduleDate(draft.postingStartsAt),Date.parse(prior.endsAt));
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
});
