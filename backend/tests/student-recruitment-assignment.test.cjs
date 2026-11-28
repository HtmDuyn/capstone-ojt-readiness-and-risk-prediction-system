const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
const assignment={ojtSemesterId:15,semesterName:'Fall 2026',roundId:15,roundName:'Đợt 1 - Fall 2026',registrationWindowId:29,status:'OPEN'};
function fixture({assigned=assignment,historical=null}={}){
 const queries=[];
 const c={query:async(sql,args)=>{
  queries.push({sql,args});
  if(sql.startsWith('SELECT profile'))return {rows:[{id:10,userId:11,programId:1,cv:null}]};
  if(sql.startsWith('SELECT 1 FROM "OJTSemesters"'))return {rows:[{exists:1}],rowCount:1};
  if(sql.startsWith('SELECT count(*)::int AS n FROM "OJTRegistrations"'))return {rows:[{n:historical?1:0}]};
  if(sql.startsWith('SELECT r."RegistrationID"'))return {rows:historical?[{id:1,ojtSemesterId:historical,application:{}}]:[]};
  if(sql.startsWith('SELECT "OJTSemesterID" FROM "OJTSemesters"'))return {rows:[{OJTSemesterID:16}]};
  throw Error('Unexpected query '+sql);
 }};
 const mocks={
  'modules/qhdn/read.repository.ts':{readTransaction:work=>work(c)},
  'modules/students/student.service.ts':{studentSelect:'SELECT profile',resultSelect:''},
  'modules/students/recruitment-assignment.service.ts':{studentRecruitmentAssignment:async()=>assigned},
  'modules/student-portal/academic.service.ts':{},'modules/ojt-results/official-evaluation.ts':{officialEvaluationRelation:'"OJTResults"'},
  'modules/students/academic-progress.ts':{},'modules/eligibility/eligibility.service.ts':{},'shared/list-context.ts':{enrichListRows:async(_c,items)=>items},
 };
 const cache=new Map();function load(file){file=file.replaceAll('\\','/');if(mocks[file])return mocks[file];if(cache.has(file))return cache.get(file).exports;
  const mod={exports:{}};cache.set(file,mod);const code=ts.transpileModule(fs.readFileSync(path.join(root,'src',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInThisContext('(function(require,module,exports){'+code+'\n})',{filename:file})(name=>name.startsWith('.')?load(path.join(path.dirname(file),name+'.ts')):require(name),mod,mod.exports);return mod.exports;
 }
 return {queries,profile:params=>load('modules/students/student-profile.service.ts').studentProfile(10,{include:'ojtRegistrations,recruitmentAssignment',...params},{userId:11,studentId:10,roleCode:'STUDENT'})};
}
test('a qualified student without any application uses the assigned QHDN semester instead of the next pathway semester',async()=>{
 const f=fixture();const profile=await f.profile();assert.equal(profile.ojtSemesterId,15);assert.deepEqual(profile.recruitmentAssignment,assignment);
 assert.equal(profile.ojtRegistrations.items.length,0);assert.equal(f.queries.some(q=>q.sql.includes('DefaultOJTAcademicPeriod')),false);
});
test('current assigned recruitment takes precedence over historical registration, while explicit historical filters remain available',async()=>{
 const f=fixture({historical:7});assert.equal((await f.profile()).ojtSemesterId,15);
 assert.equal((await f.profile({ojtSemesterId:7})).ojtSemesterId,7);
});
test('without an assigned round, historical registration and pathway fallback remain unchanged',async()=>{
 assert.equal((await fixture({assigned:null,historical:7}).profile()).ojtSemesterId,7);
 assert.equal((await fixture({assigned:null}).profile()).ojtSemesterId,16);
});
