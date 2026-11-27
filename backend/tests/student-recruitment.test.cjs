// Build first: npm run build && npm run test:student-recruitment
const {test,after}=require('node:test'),assert=require('node:assert/strict');
const reads=require('../dist/modules/qhdn/read.repository');
const contexts=require('../dist/shared/list-context');
const eligibility=require('../dist/modules/eligibility/eligibility.service');
const admissions=require('../dist/modules/student-portal/admission.service');
const original={read:reads.readTransaction,enrich:contexts.enrichListRows,official:eligibility.officialEligibilityWithClient,admission:admissions.studentAdmission};
let client,admission,officialReads;
reads.readTransaction=work=>work(client);
contexts.enrichListRows=async(c,items)=>items;
eligibility.officialEligibilityWithClient=async()=>{officialReads++;return null;};
admissions.studentAdmission=async()=>admission;
after(()=>{reads.readTransaction=original.read;contexts.enrichListRows=original.enrich;eligibility.officialEligibilityWithClient=original.official;admissions.studentAdmission=original.admission;});
const {studentOpportunities}=require('../dist/modules/students/job-application.service');
const actor={userId:11,roleCode:'STUDENT'};

function fixture({inactive=false,window=true,scope={},slots=2,admitted=false}={}){
 officialReads=0;admission=admitted?{source:'SAVED_ELIGIBILITY',roundId:7,status:'ELIGIBLE',isStale:false}:null;
 const queries=[],now=new Date();
 client={query:async(sql,args=[])=>{
  queries.push({sql,args});
  if(sql.startsWith('SELECT s.*,u."Email"'))return {rows:inactive?[]:[{StudentID:10,ProgramID:1}],rowCount:inactive?0:1};
  if(sql.startsWith('SELECT w.*,clock_timestamp()'))return {rows:window?[{WindowID:8,OJTSemesterID:99,RecruitmentRoundID:7,Scope:scope,Status:'OPEN',Now:now,StartsAt:new Date(+now-3600000),EndsAt:new Date(+now+3600000)}]:[]};
  if(sql.startsWith('SELECT * FROM "OJTRegistrations"'))return {rows:[]};
  if(sql.startsWith('SELECT t."SpecializationID"'))return {rows:[{SpecializationID:1,CohortID:1,GroupCode:'A'}]};
  if(sql.startsWith('SELECT count(*)::int AS n FROM'))return {rows:[{n:1}]};
  if(sql.startsWith('SELECT\n  p."PositionID"'))return {rows:[{id:21,postId:31,remainingSlots:slots,title:'Thực tập sinh',company:{id:1,name:'Doanh nghiệp'},post:{title:'Tin đã công bố'}}]};
  if(sql.startsWith('SELECT 1 FROM "StudentEnterpriseCoordination"'))return {rows:[],rowCount:0};
  throw Error('Unexpected query: '+sql);
 }};return queries;
}
test('an active student without an OJT semester, eligibility or roster can browse published vacancies',async()=>{
 const queries=fixture();const result=await studentOpportunities({},actor);
 assert.equal(result.items.length,1);assert.equal(result.windowId,null);assert.equal(result.canApply,false);
 assert.deepEqual(result.items[0].blockers,['REGISTRATION_WINDOW_REQUIRED']);assert.equal(result.items[0].canApply,false);
 assert.equal(officialReads,0);assert.equal(queries.length,3);
 assert.deepEqual(queries[1].args,[null,10,null]);
});
test('catalog pagination is bounded and does not fall back to the student historical semester',async()=>{
 const queries=fixture();const result=await studentOpportunities({page:2,limit:20},actor);
 assert.equal(result.page,2);assert.deepEqual(queries.at(-1).args,[null,10,null,20,20]);
 await assert.rejects(studentOpportunities({page:2147483647,limit:100},actor));
});
test('catalog browsing never grants application permission, including vacancies with no remaining slots',async()=>{
 fixture({slots:0,admitted:true});const result=await studentOpportunities({},actor);
 assert.equal(result.items[0].remainingSlots,0);assert.equal(result.items[0].canApply,false);
 assert.deepEqual(result.items[0].blockers,['REGISTRATION_WINDOW_REQUIRED','POSITION_FULL']);
});
test('selecting a round preserves admission checks and filters the exact semester and recruitment round',async()=>{
 const queries=fixture();const result=await studentOpportunities({windowId:8},actor);
 assert.equal(result.canApply,false);assert.ok(result.items[0].blockers.includes('ELIGIBLE_HANDOFF_REQUIRED'));
 assert.equal(officialReads,1);assert.deepEqual(queries.at(-1).args,[99,10,7,20,0]);
});
test('eligible assigned students can apply only inside their round and permitted scope',async()=>{
 fixture({admitted:true});assert.equal((await studentOpportunities({windowId:8},actor)).items[0].canApply,true);
 fixture({admitted:true,scope:{programIds:[2]}});
 const denied=await studentOpportunities({windowId:8},actor);
 assert.equal(denied.items[0].canApply,false);assert.ok(denied.blockers.includes('REGISTRATION_OUT_OF_SCOPE'));
});
test('inactive accounts, nonstudents, unknown selectors and invalid round IDs are rejected',async()=>{
 fixture({inactive:true});await assert.rejects(studentOpportunities({},actor),{statusCode:403});
 fixture();await assert.rejects(studentOpportunities({},{userId:1,roleCode:'ENTERPRISE'}),{statusCode:403});
 await assert.rejects(studentOpportunities({studentId:999},actor));
 for(const windowId of [0,'bad',null])await assert.rejects(studentOpportunities({windowId},actor));
 fixture({window:false});await assert.rejects(studentOpportunities({windowId:8},actor),{errorCode:'REGISTRATION_WINDOW_NOT_FOUND'});
});
