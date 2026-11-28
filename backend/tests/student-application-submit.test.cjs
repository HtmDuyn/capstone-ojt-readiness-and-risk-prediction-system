// Real submission service and policy, with all database writes isolated in memory.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'..'),now=new Date('2026-11-28T10:00:00Z');
const actor={userId:11,studentId:10,roleCode:'STUDENT'};
function fixture({decision='REJECTED',graded=false,passed=false,eligible=true,stale=false,expired=false,full=false,noCv=false,tooEarly=false,scope={}}={}){
 const old={ApplicationID:1,RegistrationID:1,StudentID:10,OJTSemesterID:99,PostID:31,PositionID:21,Status:decision==='REJECTED'?'REJECTED':decision==='ACCEPTED'?'ACCEPTED':'SUBMITTED',ApplicationSnapshot:{original:true},CoverLetter:'Old application'};
 const state={applications:[old],coordinations:[{CoordinationID:1,RegistrationID:1,ApplicationID:1,PositionID:21,Decision:decision,OJTSemesterID:99}],audits:[],commits:0};
 let registration={RegistrationID:1,StudentID:10,ProgramID:1,OJTSemesterID:99,WindowID:8,Status:'SUBMITTED',Application:{}};
 let queue=Promise.resolve();
 const c={query:async(sql,args=[])=>{
  if(sql.startsWith('SELECT s.*,u."Email"'))return {rows:[{StudentID:10,ProgramID:1,Email:'student@example.com',Phone:'0900000000'}]};
  if(sql.startsWith('SELECT "StudentID" FROM "Students"'))return {rows:[{StudentID:10}]};
  if(sql.startsWith('SELECT * FROM "OJTRegistrationWindows"'))return {rows:[{WindowID:8,RecruitmentRoundID:7,OJTSemesterID:99,Scope:scope,Status:'OPEN',StartsAt:new Date(+now-1000),EndsAt:expired?now:new Date(+now+3600000)}]};
  if(sql==='SELECT clock_timestamp() AS now')return {rows:[{now}]};
  if(sql.startsWith('SELECT s."ProgramID",t."SpecializationID"'))return {rows:[{ProgramID:1,SpecializationID:1,CohortID:1,GroupCode:'A'}]};
  if(sql.startsWith('SELECT p.*,post."EnterpriseID"'))return {rows:[{PositionID:args[0],EnterpriseID:7,PostEnterpriseID:7,PostWindowID:7,OJTSemesterID:99,PostStatus:'PUBLISHED',DeadlineAt:new Date(+now+3600000),Status:'OPEN',CompanyStatus:'ACTIVE',Capacity:full?0:3}]};
  if(sql.startsWith('SELECT "RegistrationID" FROM "OJTRegistrations"'))return {rows:[{RegistrationID:1}]};
  if(sql.startsWith('SELECT * FROM "StudentEnterpriseCoordination"'))return {rows:[state.coordinations.at(-1)]};
  if(sql.includes('AS "hasPassedOjt"'))return {rows:[{hasPassedOjt:passed,hasOjtScore:graded}]};
  if(sql.includes('AS "hasAcceptedApplication"'))return {rows:[{hasAcceptedApplication:state.coordinations.some(x=>x.Decision==='ACCEPTED'),hasAssignment:false,hasPendingApplication:state.applications.some(x=>x.Status!=='REJECTED')||state.coordinations.some(x=>x.Decision!=='REJECTED')}]};
  if(sql.startsWith('UPDATE "OJTRegistrations"')){registration={...registration,WindowID:args[1],Status:'SUBMITTED',Application:JSON.parse(args[2])};return {rows:[]};}
  if(sql.startsWith('SELECT 1 FROM "InternshipAssignments"'))return {rows:[],rowCount:0};
  if(sql.startsWith('SELECT * FROM "JobApplications"'))return {rows:state.applications.filter(x=>x.PostID===args[1]&&x.PositionID===args[2]).slice(-1)};
  if(sql.startsWith('SELECT "ApplicationID" FROM "JobApplications"'))return {rows:state.applications.filter(x=>x.RegistrationID===args[0]&&x.PostID===args[1]&&x.PositionID===args[2]).slice(0,1)};
  if(sql.startsWith('INSERT INTO "JobApplications"')){
   const row={ApplicationID:state.applications.length+1,RegistrationID:args[0],StudentID:args[1],OJTSemesterID:args[2],PostID:args[3],PositionID:args[4],EnterpriseID:args[5],CVFileID:args[6],CoverLetter:args[8],Status:'SUBMITTED'};
   assert.equal(state.applications.some(x=>x.Status!=='REJECTED'),false);state.applications.push(row);return {rows:[row]};
  }
  if(sql.startsWith('UPDATE "JobApplications"')){
   const row=state.applications.find(x=>x.ApplicationID===args[0]);
   row[sql.includes('"CertificateLinks"')?'CertificateLinks':'ApplicationSnapshot']=JSON.parse(args[1]);return {rows:[]};
  }
  if(sql.startsWith('INSERT INTO "StudentEnterpriseCoordination"')){
   const row={CoordinationID:state.coordinations.length+1,RegistrationID:args[0],PositionID:args[2],ApplicationID:args[4],OJTSemesterID:args[5],PreviousCoordinationID:args[6],Decision:'PENDING'};state.coordinations.push(row);return {rows:[row]};
  }
  if(sql.startsWith('SELECT a."ApplicationID"')){
   const row=state.applications.find(x=>x.ApplicationID===args[0]);return {rows:row?[{id:row.ApplicationID,postId:row.PostID,positionId:row.PositionID,status:row.Status,coverLetter:row.CoverLetter,certificates:row.CertificateLinks||[]}]:[]};
  }
  throw Error('Unexpected query: '+sql);
 }};
 const mocks={
  'modules/academic/academic.repository.ts':{academicTransaction:async work=>{
   const before=queue;let release;queue=new Promise(r=>release=r);await before;
   const snapshot=structuredClone(state),oldRegistration=structuredClone(registration);
   try{const result=await work(c);state.commits++;return result;}catch(e){Object.assign(state,snapshot);registration=oldRegistration;throw e;}finally{release();}
  },audit:async(...args)=>state.audits.push([null,...args.slice(1)])},
  'modules/qhdn/read.repository.ts':{},'shared/list-context.ts':{},
  'modules/qhdn/catalog.service.ts':{occupied:async()=>0},
  'modules/ojt-registration/registration.service.ts':{registrationRecord:async()=>registration,registrationApi:x=>x,event:async()=>{}},
  'modules/students/cv.service.ts':{currentCV:async()=>noCv?null:{id:3},cvMetadataSql:()=>"'{}'::jsonb"},
  'modules/students/certificate.service.ts':{validateCertificateLinks:x=>x||[]},
  'modules/eligibility/eligibility.service.ts':{},
  'modules/student-portal/admission.service.ts':{studentAdmission:async()=>eligible?{status:'ELIGIBLE',isStale:stale,source:'SAVED_ELIGIBILITY',checkId:null}:null},
  'modules/academic/workflow-policy.ts':{assertOjtPathway:async()=>{if(tooEarly)throw Object.assign(Error('Too early'),{statusCode:409,errorCode:'OJT_MINIMUM_SEMESTER_REQUIRED'});return {relativeSemester:6};}},
  'modules/academic/ojt-course-enrollment.ts':{recordOjt202InProgress:async()=>{}},
  'modules/recruitment/round-policy.ts':{assertPostPhase:async()=>{},assertRoundPhase:()=>{}},
  'modules/recruitment/lifecycle.service.ts':{requireLifecycleSchema:async()=>{}},
 };
 const cache=new Map();function load(file){file=file.replaceAll('\\','/');if(mocks[file])return mocks[file];if(cache.has(file))return cache.get(file).exports;
  const mod={exports:{}};cache.set(file,mod);
  const code=ts.transpileModule(fs.readFileSync(path.join(root,'src',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInThisContext('(function(require,module,exports){'+code+'\n})',{filename:file})(name=>name.startsWith('.')?load(path.join(path.dirname(file),name+'.ts')):require(name),mod,mod.exports);return mod.exports;
 }
 const service=load('modules/students/job-application.service.ts');
 const apply=(positionId=21,extra={})=>service.applyToPosition({windowId:8,postId:31,positionId,coverLetter:'New application',application:{contactEmail:'student@example.com',contactPhone:'0900000000'},...extra},actor);
 return {state,apply};
}
test('rejection unlocks another position in the same post and company, while the old position stays blocked',async()=>{
 const f=fixture(),old=structuredClone(f.state.applications[0]);
 await assert.rejects(f.apply(),{errorCode:'APPLICATION_POSITION_ALREADY_SUBMITTED'});
 assert.equal(f.state.applications.length,1);assert.equal(f.state.audits.length,0);
 const result=await f.apply(22);
 assert.equal(result.id,2);assert.equal(result.replayed,false);assert.deepEqual(f.state.applications[0],old);
 assert.equal(f.state.applications[1].PostID,31);assert.equal(f.state.applications[1].PositionID,22);assert.equal(f.state.applications[1].EnterpriseID,7);
 assert.equal(f.state.coordinations[1].PreviousCoordinationID,1);assert.equal(f.state.coordinations[1].Decision,'PENDING');
 assert.equal(f.state.audits.find(x=>x[2]==='JobApplications')[4],'APPLY');
 assert.equal((await f.apply(22)).replayed,true);assert.equal(f.state.applications.length,2);
 await assert.rejects(f.apply(22,{postId:33}),{errorCode:'APPLICATION_ALREADY_IN_PROCESS'});
});
test('a rejected student may choose a different post, and two simultaneous submissions cannot both commit',async()=>{
 const f=fixture();const results=await Promise.allSettled([f.apply(22,{postId:32}),f.apply(23,{postId:33})]);
 assert.equal(results.filter(x=>x.status==='fulfilled').length,1);
 assert.equal(results.find(x=>x.status==='rejected').reason.errorCode,'APPLICATION_ALREADY_IN_PROCESS');
 assert.equal(f.state.applications.filter(x=>x.Status!=='REJECTED').length,1);
});
test('pending and accepted applications block another post before any submission is written',async()=>{
 for(const [decision,code] of [['PENDING','APPLICATION_ALREADY_IN_PROCESS'],['ACCEPTED','STUDENT_ALREADY_CONFIRMED']]){
  const f=fixture({decision});await assert.rejects(f.apply(22),{errorCode:code});assert.equal(f.state.applications.length,1);assert.equal(f.state.commits,0);
 }
});
test('scores, passing, eligibility, pathway, deadline, capacity, scope and CV are rechecked on submit',async()=>{
 for(const [config,code] of [[{graded:true},'OJT_ALREADY_GRADED'],[{passed:true},'OJT202_ALREADY_PASSED'],[{eligible:false},'ELIGIBLE_HANDOFF_REQUIRED'],[{stale:true},'ELIGIBILITY_HANDOFF_STALE'],[{tooEarly:true},'OJT_MINIMUM_SEMESTER_REQUIRED'],[{expired:true},'OJT_REGISTRATION_WINDOW_UNAVAILABLE'],[{full:true},'POSITION_FULL'],[{scope:{studentIds:[999]}},'REGISTRATION_OUT_OF_SCOPE'],[{noCv:true},'CV_REQUIRED']]){
  const f=fixture(config);await assert.rejects(f.apply(21,{postId:32}),{errorCode:code});assert.equal(f.state.applications.length,1);assert.equal(f.state.audits.length,0);
 }
});
test('legacy registration-only requests must still validate their linked application window',async()=>{
 const f=fixture({expired:true});await assert.rejects(f.apply(21,{windowId:undefined,registrationId:1}),{errorCode:'OJT_REGISTRATION_WINDOW_UNAVAILABLE'});
});
