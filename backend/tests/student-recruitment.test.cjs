// Build first: npm run build && npm run test:student-recruitment
const {test,after}=require('node:test'),assert=require('node:assert/strict');
const reads=require('../dist/modules/qhdn/read.repository');
const contexts=require('../dist/shared/list-context');
const eligibility=require('../dist/modules/eligibility/eligibility.service');
const admissions=require('../dist/modules/student-portal/admission.service');
const workflow=require('../dist/modules/academic/workflow-policy');
const original={read:reads.readTransaction,enrich:contexts.enrichListRows,official:eligibility.officialEligibilityWithClient,admission:admissions.studentAdmission,pathway:workflow.assertOjtPathway};
let client,admission,officialReads,pathwayBlocked;
reads.readTransaction=work=>work(client);
contexts.enrichListRows=async(c,items)=>items;
eligibility.officialEligibilityWithClient=async()=>{officialReads++;return null;};
admissions.studentAdmission=async()=>admission;
workflow.assertOjtPathway=async()=>{if(pathwayBlocked)throw Object.assign(Error('Too early'),{statusCode:409,errorCode:'OJT_MINIMUM_SEMESTER_REQUIRED'});return {relativeSemester:6};};
after(()=>{reads.readTransaction=original.read;contexts.enrichListRows=original.enrich;eligibility.officialEligibilityWithClient=original.official;admissions.studentAdmission=original.admission;workflow.assertOjtPathway=original.pathway;});
const {studentOpportunities}=require('../dist/modules/students/job-application.service');
const actor={userId:11,roleCode:'STUDENT'};

function fixture({inactive=false,window=true,scope={},slots=2,admitted=false,graded=false,passed=false,pending=false,accepted=false,assigned=false,expired=false,finalized=false,tooEarly=false,stale=false,previousPost=false}={}){
 pathwayBlocked=tooEarly;
 officialReads=0;admission=admitted?{source:'SAVED_ELIGIBILITY',roundId:7,status:'ELIGIBLE',isStale:false}:null;
 if(admission&&stale)admission.isStale=true;
 const queries=[],now=new Date();
 client={query:async(sql,args=[])=>{
  queries.push({sql,args});
  if(sql.includes('AS "hasPassedOjt"'))return {rows:[{hasPassedOjt:passed,hasOjtScore:graded}]};
  if(sql.includes('AS "hasAcceptedApplication"'))return {rows:[{hasAcceptedApplication:accepted,hasAssignment:assigned,hasPendingApplication:pending}]};
  if(sql.startsWith('SELECT w.*,ap."Kind"'))return {rows:[{CampaignID:1,Status:'OPEN',ResultsFinalizedAt:finalized?now:null,PeriodStatus:'ACTIVE',Kind:'SEMESTER',AcademicPeriodID:1,LinkedPeriodID:1,DatabaseNow:now,PostingStartsAt:new Date(+now-3600000),PostingEndsAt:new Date(+now+3600000),ApplicationStartsAt:new Date(+now-3600000),ApplicationEndsAt:new Date(+now+3600000),ResultsStartsAt:new Date(+now-3600000),ResultsEndsAt:new Date(+now+3600000)}]};
  if(sql.startsWith('SELECT s.*,u."Email"'))return {rows:inactive?[]:[{StudentID:10,ProgramID:1}],rowCount:inactive?0:1};
  if(sql.startsWith('SELECT w.*,clock_timestamp()'))return {rows:window?[{WindowID:8,OJTSemesterID:99,RecruitmentRoundID:7,Scope:scope,Status:'OPEN',Now:now,StartsAt:new Date(+now-3600000),EndsAt:expired?now:new Date(+now+3600000)}]:[]};
  if(sql.startsWith('SELECT * FROM "OJTRegistrations"'))return {rows:[]};
  if(sql.startsWith('SELECT t."SpecializationID"'))return {rows:[{SpecializationID:1,CohortID:1,GroupCode:'A'}]};
  if(sql.startsWith('SELECT count(*)::int AS n FROM'))return {rows:[{n:1}]};
  if(sql.startsWith('SELECT\n  p."PositionID"'))return {rows:[{id:21,postId:31,applicationId:previousPost?1:null,remainingSlots:slots,title:'Thực tập sinh',company:{id:1,name:'Doanh nghiệp'},post:{title:'Tin đã công bố'}}]};
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

test('button permission blocks any OJT score, passing OJT, stale eligibility and an invalid pathway',async()=>{
 for(const [config,code] of [[{graded:true},'OJT_ALREADY_GRADED'],[{passed:true},'OJT202_ALREADY_PASSED'],[{stale:true},'ELIGIBILITY_HANDOFF_STALE'],[{tooEarly:true},'OJT_MINIMUM_SEMESTER_REQUIRED']]){
  fixture({admitted:true,...config});const result=await studentOpportunities({windowId:8},actor);
  assert.equal(result.items[0].canApply,false);assert.ok(result.items[0].blockers.includes(code));
 }
});

test('one pending or accepted application blocks every position; only rejected history releases the button',async()=>{
 for(const [config,code] of [[{pending:true},'APPLICATION_ALREADY_IN_PROCESS'],[{accepted:true},'STUDENT_ALREADY_CONFIRMED'],[{assigned:true},'ASSIGNMENT_EXISTS']]){
  fixture({admitted:true,...config});const result=await studentOpportunities({windowId:8},actor);
  assert.equal(result.items[0].canApply,false);assert.ok(result.items[0].blockers.includes(code));
 }
 fixture({admitted:true});assert.equal((await studentOpportunities({windowId:8},actor)).items[0].canApply,true);
});

test('the application end is exclusive and a finalized round cannot enable the button',async()=>{
 fixture({admitted:true,expired:true});assert.ok((await studentOpportunities({windowId:8},actor)).blockers.includes('OJT_REGISTRATION_WINDOW_UNAVAILABLE'));
 fixture({admitted:true,finalized:true});assert.ok((await studentOpportunities({windowId:8},actor)).blockers.includes('RECRUITMENT_PHASE_CLOSED'));
 fixture({admitted:true,slots:0});assert.equal((await studentOpportunities({windowId:8},actor)).items[0].canApply,false);
});

test('a previously submitted position stays disabled after rejection, while an unseen position can be applied to',async()=>{
 fixture({admitted:true,previousPost:true});const old=await studentOpportunities({windowId:8},actor);
 assert.equal(old.canApply,false);assert.equal(old.items[0].canApply,false);
 assert.ok(old.items[0].blockers.includes('APPLICATION_POSITION_ALREADY_SUBMITTED'));
 fixture({admitted:true});assert.equal((await studentOpportunities({windowId:8},actor)).items[0].canApply,true);
});
