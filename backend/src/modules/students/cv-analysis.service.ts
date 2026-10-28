import type { PoolClient } from 'pg';
import { createHash } from 'node:crypto';
import { academicTransaction } from '../academic/academic.repository';
import { readTransaction } from '../qhdn/read.repository';
import { ownStudent, type Actor, type Row } from '../student-portal/shared';
import { providerUrl, provider, parsedCv } from '../student-portal/cv.service';
import { inputObject, positiveId, invalid } from './student.validation';

function analysisInput(value:unknown):Row{
  if(value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===0)return {};
  return inputObject(value,['cvFileId']);
}

// New uploads remain in StudentCVFiles, including PDFs up to 10 MiB. Analysis
// events/results use the existing audit history so no legacy 5 MiB CV copy,
// extra storage key or database migration is required.
async function selectedCV(c:PoolClient,actor:Actor,cvFileId?:number){
  const s=await ownStudent(c,actor);
  const file=(await c.query('SELECT * FROM "StudentCVFiles" WHERE "StudentID"=$1 AND ($2::int IS NULL OR "CVFileID"=$2) ORDER BY "CVFileID" DESC LIMIT 1',[s.StudentID,cvFileId??null])).rows[0];
  if(!file)throw invalid('Upload a CV first, or select a CV belonging to your account.',404,'CV_NOT_FOUND');
  return file;
}
async function latestAnalysis(c:PoolClient,cvFileId:number){
  return (await c.query(`SELECT "LogID", "Detail"::jsonb->'after' AS data,"ActionAt", "ActionAt">LOCALTIMESTAMP-interval '60 seconds' AS recent FROM "AuditLogs" WHERE "EntityType"='StudentCVFiles' AND "EntityID"=$1 AND "Action" IN ('CV_ANALYSIS_STARTED','CV_ANALYSIS_COMPLETED','CV_ANALYSIS_FAILED') ORDER BY "LogID" DESC LIMIT 1`,[cvFileId])).rows[0];
}
async function analysisEvent(c:PoolClient,file:Row,actor:Actor,action:string,data:Row){
  return (await c.query('INSERT INTO "AuditLogs" ("UserID","Action","EntityType","EntityID","Detail") VALUES ($1,$2,\'StudentCVFiles\',$3,$4) RETURNING "LogID","ActionAt"',[actor.userId,action,file.CVFileID,JSON.stringify({after:{cvFileId:file.CVFileID,sha256:file.Sha256,...data}})])).rows[0];
}
export async function analyseStudentCV(body:unknown,actor:Actor){
  if(actor.roleCode!=='STUDENT')throw invalid('Student role required.',403,'FORBIDDEN');
  const b=analysisInput(body),id=b.cvFileId===undefined?undefined:positiveId(b.cvFileId,'cvFileId');
  const url=providerUrl('CV_ANALYSIS_SERVICE_URL');
  const providerHash=createHash('sha256').update(url.href).digest('hex');
  const job=await academicTransaction(async c=>{
    const file=await selectedCV(c,actor,id),previous=await latestAnalysis(c,file.CVFileID);
    if(previous?.data?.status==='COMPLETED'&&previous.data.providerHash===providerHash)return {file,cached:previous.data};
    if(previous?.data?.status==='RUNNING'&&previous.recent)throw invalid('This CV is already being analysed.',409,'CV_ANALYSIS_RUNNING');
    const event=await analysisEvent(c,file,actor,'CV_ANALYSIS_STARTED',{status:'RUNNING',providerHash});
    return {file,id:event.LogID};
  });
  if(job.cached){const {providerHash:_providerHash,...cached}=job.cached;return {...cached,replayed:true};}
  try{
    const raw=await provider(url,{cvFileId:job.file.CVFileID,fileName:job.file.FileName,mimeType:job.file.MimeType,contentBase64:Buffer.from(job.file.Content).toString('base64')});
    let result:Row;try{result=parsedCv(raw);}catch{throw invalid('The AI provider returned an invalid CV analysis.',502,'INVALID_AI_RESPONSE');}
    const data={id:job.id,cvFileId:job.file.CVFileID,sha256:job.file.Sha256,status:'COMPLETED',providerHash,result};
    await academicTransaction(c=>analysisEvent(c,job.file,actor,'CV_ANALYSIS_COMPLETED',data));
    const {providerHash:_providerHash,...response}=data;
    return {...response,replayed:false};
  }catch(error:any){
    await academicTransaction(c=>analysisEvent(c,job.file,actor,'CV_ANALYSIS_FAILED',{id:job.id,status:'FAILED',errorCode:error.errorCode??'AI_PROVIDER_FAILED'}));
    throw error;
  }
}
export async function studentCVAnalysis(params:Row,actor:Actor){
  if(actor.roleCode!=='STUDENT')throw invalid('Student role required.',403,'FORBIDDEN');
  const b=analysisInput(params),id=b.cvFileId===undefined?undefined:positiveId(b.cvFileId,'cvFileId');
  return readTransaction(async c=>{
    const file=await selectedCV(c,actor,id),latest=await latestAnalysis(c,file.CVFileID);
    if(!latest)return {id:null,cvFileId:file.CVFileID,status:'NOT_ANALYSED',result:null};
    const {providerHash:_providerHash,...data}=latest.data;
    if(data.status==='RUNNING'&&!latest.recent)return {...data,status:'FAILED',errorCode:'ANALYSIS_INTERRUPTED'};
    return data;
  });
}
