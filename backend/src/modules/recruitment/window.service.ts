import { enrichListRows } from '../../shared/list-context';
import type { PoolClient } from 'pg';
import { academicTransaction, audit } from '../academic/academic.repository';
import { ensureOjtSemesterForPeriod } from '../academic/ojt-semester-link';
import { actualPeriod, periodBounds } from '../academic/workflow-policy';
import { timestamp } from '../combo-registration/combo.validation';
import { inputObject,invalid,positiveId,requiredText,pagination,enumValue } from '../students/student.validation';
import { readTransaction } from '../qhdn/read.repository';
import { windowRecord,windowApi,type Actor,type Row } from './recruitment.repository';

export async function listWindows(params:Row,actor:Actor) {
 const p=pagination(params,['academicPeriodId','status']),args:unknown[]=[],where:string[]=[];
 if(params.academicPeriodId!==undefined){args.push(positiveId(params.academicPeriodId,'academicPeriodId'));where.push('w."AcademicPeriodID"=$'+args.length);}
 if(params.status!==undefined){args.push(enumValue(params.status,['DRAFT','OPEN','CLOSED'],'status'));where.push('w."Status"=$'+args.length);}
 if(actor.roleCode==='ENTERPRISE')where.push(`w."Status"='OPEN' AND w."EndsAt">clock_timestamp() AND ap."Status" NOT IN ('CLOSED','ARCHIVED')`);
 return readTransaction(async c=>{
  const from=`FROM "RecruitmentWindows" w JOIN "AcademicPeriods" ap ON ap."AcademicPeriodID"=w."AcademicPeriodID"${where.length?' WHERE '+where.join(' AND '):''}`;
  const total=(await c.query('SELECT count(*)::int AS n '+from,args)).rows[0].n;
  const rows=(await c.query(`SELECT w.*,ap."PeriodCode",ap."Name" AS "PeriodName",ap."Status" AS "PeriodStatus",clock_timestamp() AS "DatabaseNow" ${from} ORDER BY w."WindowID" DESC LIMIT $${args.length+1} OFFSET $${args.length+2}`,[...args,p.limit,p.offset])).rows;
  return {items:await enrichListRows(c,rows.map(windowApi)),total,page:p.page,limit:p.limit};
 });
}
async function saveWindowFields(body:unknown,actor:number,id:number|undefined,client:PoolClient) {
 const b=inputObject(body,['academicPeriodId','name','startsAt','endsAt','reason']);
 const c=client;
  const old=id?await windowRecord(c,id):null;
  if(old&&old.Status!=='DRAFT'&&Object.keys(b).some(k=>!['name','endsAt','reason'].includes(k)))throw invalid('After opening only the name and deadline can change.',409);
  const reason=requiredText(b.reason,'reason',2000);
  const periodId=positiveId(b.academicPeriodId??old?.AcademicPeriodID,'academicPeriodId'),period=await actualPeriod(c,periodId);
  if(period.Kind!=='SEMESTER'||['CLOSED','ARCHIVED'].includes(period.Status))throw invalid('Select a planned or active regular academic semester.',409);
  const name=requiredText(b.name??old?.Name,'name',150),start=timestamp(b.startsAt??old?.StartsAt?.toISOString(),'startsAt'),end=timestamp(b.endsAt??old?.EndsAt?.toISOString(),'endsAt');
  if(new Date(end)<=new Date(start)||new Date(end)>periodBounds(period).end)throw invalid('The intake deadline must follow the start and not exceed the academic semester end.');
  if(old&&old.Status==='OPEN'&&new Date(end)<=old.DatabaseNow)throw invalid('The open intake deadline must be in the future.',409);
  const semesterId=await ensureOjtSemesterForPeriod(c,periodId);
  const row=(await c.query(id?`UPDATE "RecruitmentWindows" SET "AcademicPeriodID"=$1,"OJTSemesterID"=$2,"Name"=$3,"StartsAt"=$4,"EndsAt"=$5,"UpdatedBy"=$6,"UpdatedAt"=now() WHERE "WindowID"=$7 RETURNING "WindowID"`:
   `INSERT INTO "RecruitmentWindows" ("AcademicPeriodID","OJTSemesterID","Name","StartsAt","EndsAt","CreatedBy") VALUES ($1,$2,$3,$4,$5,$6) RETURNING "WindowID"`,id?[periodId,semesterId,name,start,end,actor,id]:[periodId,semesterId,name,start,end,actor])).rows[0];
  const after=await windowRecord(c,row.WindowID);await audit(c,actor,'RecruitmentWindows',row.WindowID,id?'UPDATE':'CREATE',old,after,reason);return windowApi(after);

}
async function changeWindow(id:number,action:'open'|'close',body:unknown,actor:number,client:PoolClient) {
 const reason=requiredText(inputObject(body,['reason']).reason,'reason',2000);
 const c=client;
  const old=await windowRecord(c,id),status=action==='open'?'OPEN':'CLOSED';
  if(old.Status===status)return {...windowApi(old),replayed:true};
  if(action==='close'&&old.Status!=='OPEN')throw invalid('Only an open intake can be closed.',409);
  if(action==='open'){
   const period=await actualPeriod(c,old.AcademicPeriodID);
   if(period.Kind!=='SEMESTER'||['CLOSED','ARCHIVED'].includes(period.Status)||old.DatabaseNow>=new Date(old.EndsAt)||new Date(old.EndsAt)>periodBounds(period).end)
    throw invalid('The academic semester or intake deadline is unavailable.',409);
   if((await c.query(`SELECT 1 FROM "RecruitmentWindows" WHERE "AcademicPeriodID"=$1 AND "Status"='OPEN' AND "WindowID"<>$2`,[old.AcademicPeriodID,id])).rowCount)throw invalid('Close the other open intake for this semester first.',409,'RECRUITMENT_WINDOW_CONFLICT');
  }
  await c.query('UPDATE "RecruitmentWindows" SET "Status"=$2,"UpdatedBy"=$3,"UpdatedAt"=now() WHERE "WindowID"=$1',[id,status,actor]);
  const after=await windowRecord(c,id);await audit(c,actor,'RecruitmentWindows',id,action.toUpperCase(),old,after,reason);return windowApi(after);

}

export async function saveWindow(body:unknown,actor:number,id?:number) {
 const b=inputObject(body,["academicPeriodId","name","startsAt","endsAt","reason"].concat(id?['status']:[]));
 const {status,...fields}=b;
 const hasFields=Object.keys(fields).some(key=>key!=='reason');
 if(id&&!hasFields&&status===undefined)throw invalid('Provide a field or status to update.');
 const target=status===undefined?undefined:enumValue(status,['OPEN','CLOSED'],'status');
 return academicTransaction(async client=>{
  let result;
  if(!id||hasFields)result=await saveWindowFields(fields,actor,id,client);
  if(target!==undefined)result=await changeWindow(id!,target==='OPEN'?'open':'close',{reason:b.reason},actor,client);
  return result;
 });
}
