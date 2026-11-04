import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateOjtAdvice, type AdviceSnapshot } from '../src/modules/student-portal/ojt-advice';

const snapshot:AdviceSnapshot={currentSemester:2,earnedCredits:15,missingCredits:55,failedCourseCount:0,
  currentEligibility:{status:'NOT_ELIGIBLE'},earlyWarning:{available:true,message:'Tiến độ hiện tại',recommendations:['Tiếp tục học theo lộ trình.']}};
const config={enabled:'true',apiKey:'test-key',model:'gemini-test'};
const reply=(actions:string[])=>new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({actions})}]}}]}));

test('unavailable, disabled and unconfigured requests never call Gemini',async()=>{
  const noCall:typeof fetch=async()=>{assert.fail('must not call provider');};
  assert.equal((await generateOjtAdvice({...snapshot,earlyWarning:{...snapshot.earlyWarning,available:false}},config,noCall)).status,'NOT_AVAILABLE');
  assert.equal((await generateOjtAdvice(snapshot,{},noCall)).fallbackReason,'AI_DISABLED');
  assert.equal((await generateOjtAdvice(snapshot,{enabled:'true'},noCall)).fallbackReason,'AI_NOT_CONFIGURED');
});

test('request contains only academic facts and validated actions become controlled wording',async()=>{
  const mock:typeof fetch=async(url,options)=>{
    assert.ok(String(url).startsWith('https://generativelanguage.googleapis.com/'));
    assert.equal((options?.headers as Record<string,string>)['x-goog-api-key'],'test-key');
    const payload=JSON.parse(String(options?.body));
    const input=JSON.parse(payload.contents[0].parts[0].text);
    assert.equal(input.academic.earnedCredits,15);
    assert.equal(input.academic.studentId,undefined);
    assert.equal(input.allowedActions.includes('PLAN_RETAKES'),false);
    return reply(['FOLLOW_PATHWAY','CHECK_DEADLINE']);
  };
  const result=await generateOjtAdvice(snapshot,config,mock);
  assert.equal(result.status,'READY');assert.equal(result.riskScore,null);
  assert.equal(result.academic.currentEligibilityStatus,'NOT_ELIGIBLE');
  assert.equal(result.recommendations.length,2);
});

test('invented, duplicate and irrelevant actions fall back',async()=>{
  for(const actions of [['HIGH_RISK'],['PLAN_RETAKES'],['CHECK_DEADLINE','CHECK_DEADLINE'],[]]) {
    const result=await generateOjtAdvice(snapshot,config,async()=>reply(actions));
    assert.equal(result.status,'FALLBACK');
    assert.deepEqual(result.recommendations,snapshot.earlyWarning.recommendations);
  }
});

test('HTTP failure, timeout and invalid JSON fall back without exposing provider errors',async()=>{
  const providers:typeof fetch[]=[async()=>new Response('secret provider error',{status:429}),
    async()=>{throw new Error('secret timeout');},async()=>new Response('not JSON')];
  for(const provider of providers)assert.equal((await generateOjtAdvice(snapshot,config,provider)).status,'FALLBACK');
});

test('classifies HTTP errors and never exposes raw provider body',async()=>{
  for(const [status,code] of [[400,'AI_INVALID_REQUEST'],[401,'AI_AUTH_FAILED'],[403,'AI_AUTH_FAILED'],[404,'AI_MODEL_NOT_FOUND'],[429,'AI_RATE_LIMITED'],[503,'AI_PROVIDER_UNAVAILABLE'],[504,'AI_TIMEOUT']] as const){
    const result=await generateOjtAdvice(snapshot,config,async()=>new Response('secret-key-project',{status}));
    assert.equal(result.fallbackReason,code);
    assert.equal(result.aiError?.httpStatus,status);
    assert.equal(JSON.stringify(result).includes('secret-key-project'),false);
  }
});

test('distinguishes timeout, network, invalid JSON and token exhaustion',async()=>{
  const cases:[typeof fetch,string][]=[
    [async()=>{throw new DOMException('hidden','TimeoutError');},'AI_TIMEOUT'],
    [async()=>{throw new TypeError('hidden');},'AI_NETWORK_ERROR'],
    [async()=>new Response('not-json'),'INVALID_AI_RESPONSE'],
    [async()=>new Response(JSON.stringify({candidates:[{finishReason:'MAX_TOKENS'}]})),'AI_OUTPUT_TRUNCATED'],
    [async()=>new Response(JSON.stringify({promptFeedback:{blockReason:'SAFETY'}})),'AI_CONTENT_BLOCKED'],
  ];
  for(const [provider,code] of cases){
    const result=await generateOjtAdvice(snapshot,config,provider);
    assert.equal(result.fallbackReason,code);assert.equal(result.aiError?.timeoutMs,45000);
    assert.ok(result.aiError!.elapsedMs>=0);
  }
});
