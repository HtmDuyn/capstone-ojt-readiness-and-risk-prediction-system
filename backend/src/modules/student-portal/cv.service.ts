import { createDecipheriv } from 'node:crypto';
import { academicTransaction } from '../academic/academic.repository';
import { invalid, inputObject, requiredText } from '../students/student.validation';
import { publicPositionSelect } from '../recruitment/recruitment.service';
import { summaryWithClient } from './academic.service';
import { ownStudent, type Actor, type Row } from './shared';

function key() {const value=process.env.CV_STORAGE_KEY;const k=Buffer.from(value??'','base64');if(k.length!==32)throw invalid('Configure CV_STORAGE_KEY as a base64 32-byte key.',503,'CV_STORAGE_NOT_CONFIGURED');return k;}
export function decryptCv(value:Buffer) {const d=createDecipheriv('aes-256-gcm',key(),value.subarray(0,12));d.setAuthTag(value.subarray(value.length-16));return Buffer.concat([d.update(value.subarray(12,value.length-16)),d.final()]);}
function providerUrl(env:string) {let u:URL;try{u=new URL(process.env[env]??'');}catch{throw invalid(`Configure ${env} to enable this AI API.`,503,'AI_NOT_CONFIGURED');}if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw invalid('Invalid AI provider configuration.',503,'AI_NOT_CONFIGURED');return u;}
async function provider(url:URL,body:Row):Promise<Row> {
  try {
  let response:Response;try{response=await fetch(url,{method:'POST',redirect:'error',headers:{'Content-Type':'application/json',...(process.env.STUDENT_AI_API_KEY?{Authorization:`Bearer ${process.env.STUDENT_AI_API_KEY}`}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});}catch{throw invalid('AI provider is unavailable or timed out.',502,'AI_PROVIDER_FAILED');}
  if(!response.ok)throw invalid('AI provider failed.',502,'AI_PROVIDER_FAILED');const reader=response.body?.getReader();if(!reader)throw invalid('Empty AI response.',502);const chunks:Uint8Array[]=[];let size=0;for(;;){const v=await reader.read();if(v.done)break;size+=v.value.byteLength;if(size>1024*1024){await reader.cancel();throw invalid('AI response exceeds 1 MiB.',502);}chunks.push(v.value);}let result:Row;try{result=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw invalid('AI response is not valid JSON.',502);}return result;
  }catch(e:any){if(e.statusCode)throw e;throw invalid('AI provider is unavailable or returned an invalid response.',502,'AI_PROVIDER_FAILED');}
}
function aiInput(value:unknown,keys:string[]){try{return inputObject(value,keys);}catch{throw invalid('Invalid AI response fields.',502,'INVALID_AI_RESPONSE');}}
function aiText(value:unknown,field:string,max:number){try{return requiredText(value,field,max);}catch{throw invalid('Invalid AI response text.',502,'INVALID_AI_RESPONSE');}}
export async function roadmap(semesterId:number,actor:Actor) {
  const url=providerUrl('ROADMAP_SERVICE_URL');const input=await academicTransaction(async c=>summaryWithClient(c,(await ownStudent(c,actor)).StudentID,semesterId));const result=await provider(url,{academicSummary:input});const b=aiInput(result,['recommendations','modelVersion']);if(!Array.isArray(b.recommendations)||b.recommendations.length>50)throw invalid('Invalid roadmap response.',502);return {modelVersion:requiredText(b.modelVersion,'modelVersion',100),recommendations:b.recommendations.map(v=>aiText(v,'recommendation',2000)),isAiRecommendation:true};
}
export async function matching(semesterId:number,actor:Actor) {
  const url=providerUrl('MATCHING_SERVICE_URL'),input=await academicTransaction(async c=>{const s=await ownStudent(c,actor),cv=(await c.query('SELECT j."Result" FROM "CVAnalysisJobs" j JOIN "StudentCVVersions" v ON v."CVID"=j."CVID" WHERE j."StudentID"=$1 AND v."RetiredAt" IS NULL AND j."Status"=\'COMPLETED\' ORDER BY j."AnalysisID" DESC LIMIT 1',[s.StudentID])).rows[0];if(!cv)throw invalid('Analyse the current CV before matching.',409,'CV_ANALYSIS_REQUIRED');const positions=(await c.query(publicPositionSelect+' AND p."OJTSemesterID"=$1 ORDER BY p."PositionID" LIMIT 500',[semesterId])).rows;return {cv:cv.Result,positions};});
  const response=await provider(url,input),b=aiInput(response,['matches','modelVersion']);if(!Array.isArray(b.matches)||b.matches.length>100)throw invalid('Invalid matching response.',502);const seen=new Set<number>();const matches=b.matches.map(v=>{const m=aiInput(v,['positionId','score','reason']),id=m.positionId;if(typeof id!=='number'||!Number.isInteger(id)||id<=0)throw invalid('Invalid matching position ID.',502,'INVALID_AI_RESPONSE');if(seen.has(id)||!input.positions.some(p=>p.id===id)||typeof m.score!=='number'||!Number.isFinite(m.score)||m.score<0||m.score>100)throw invalid('Invalid matching candidate/score.',502);seen.add(id);return {positionId:id,score:m.score,reason:aiText(m.reason,'reason',2000)};});return {modelVersion:requiredText(b.modelVersion,'modelVersion',100),matches,isAiRecommendation:true};
}
