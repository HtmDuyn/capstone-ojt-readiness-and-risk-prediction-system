const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'..'),now=new Date('2026-11-28T10:00:00Z');
function fixture(pending=false){
 const window=(id,start,end)=>({WindowID:id,RecruitmentRoundID:id,OJTSemesterID:99,Name:'Đợt '+id,Status:'OPEN',StartsAt:new Date(start),EndsAt:new Date(end),AcademicPeriodID:1,checkedAt:now,totalRows:4,semester:{id:99,name:'Fall 2026'},period:{id:1,name:'Fall 2026'}});
 const windows=[window(8,+now-1000,+now+3600000),window(9,+now+1000,+now+3600000),window(10,+now-3600000,+now),window(11,+now-1000,+now+3600000)];
 const c={query:async sql=>{
  if(sql.startsWith('SELECT s.*,u."FullName"'))return {rows:[{StudentID:10,ProgramID:1,ProgramStatus:'PUBLISHED',Status:'ACTIVE'}]};
  if(sql.startsWith('SELECT count(*) OVER()'))return {rows:windows};
  throw Error('Unexpected query '+sql);
 }};
 const mocks={
  'modules/qhdn/read.repository.ts':{readTransaction:work=>work(c)},
  'modules/curriculum/curriculum.repository.ts':{},'modules/combo-registration/combo.validation.ts':{},'modules/combo-registration/combo.repository.ts':{},'modules/combo-registration/selection.service.ts':{},
  'modules/eligibility/frontend-results.service.ts':{calculatedEligibilitySql:()=>"'{}'::jsonb",latestOjt202PassedSql:()=>"false"},
  'modules/students/ojt-application-policy.ts':{
   applicationAcademicEligibility:async()=>({admission:{source:'SAVED_ELIGIBILITY',status:'ELIGIBLE'},blockers:[]}),
   applicationProgressBlockers:async()=>pending?['APPLICATION_ALREADY_IN_PROCESS']:[],
   applicationRoundBlockers:async(_c,id)=>id===11?['RECRUITMENT_PHASE_CLOSED']:[],
   applicationBlockerMessages:{APPLICATION_ALREADY_IN_PROCESS:'Đang chờ doanh nghiệp xác nhận'},
  },
 };
 const cache=new Map();function load(file){file=file.replaceAll('\\','/');if(mocks[file])return mocks[file];if(cache.has(file))return cache.get(file).exports;
  const mod={exports:{}};cache.set(file,mod);const code=ts.transpileModule(fs.readFileSync(path.join(root,'src',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInThisContext('(function(require,module,exports){'+code+'\n})',{filename:file})(name=>name.startsWith('.')?load(path.join(path.dirname(file),name+'.ts')):require(name),mod,mod.exports);return mod.exports;
 }
 return ()=>load('modules/students/registration-options.service.ts').studentWindows('ojt',{status:'OPEN'},{userId:11,studentId:10,roleCode:'STUDENT'});
}
test('an eligible student sees the actual open round; future, expired and finalized rounds never claim to receive applications',async()=>{
 const data=await fixture()();
 assert.deepEqual(data.items.map(w=>[w.id,w.isApplicationOpen,w.applicationStatus,w.canSubmit]),[[8,true,'OPEN',true],[9,false,'UPCOMING',false],[10,false,'CLOSED',false],[11,false,'CLOSED',false]]);
 assert.equal(data.items[0].semester.name,'Fall 2026');
});
test('a pending application disables submission while the active round still displays as receiving applications',async()=>{
 const data=await fixture(true)();const current=data.items[0];
 assert.equal(current.isApplicationOpen,true);assert.equal(current.applicationStatus,'OPEN');assert.equal(current.canSubmit,false);
 assert.ok(current.blockingReasons.includes('APPLICATION_ALREADY_IN_PROCESS'));
});
