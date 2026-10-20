import { query } from '../../config/database';
import { academicTransaction, audit } from '../academic/academic.repository';
import { invalid, inputObject, positiveId, requiredText, optionalText, enumValue, pagination } from '../students/student.validation';
import { dateInput } from '../academic/academic.schema';
import { pageSql, type Row } from './admin.repository';
import { readTransaction } from '../qhdn/read.repository';

const alertSelect=`SELECT a."AlertID" AS id,a."PredictionID" AS "predictionId",p."StudentID" AS "studentId",s."StudentCode" AS "studentCode",u."FullName" AS "fullName",j."OJTSemesterID" AS "ojtSemesterId",p."RiskLevel" AS "riskLevel",p."RiskScore"::float8 AS "riskScore",a."Status" AS status,a."ResolutionNote" AS "resolutionNote",a."CreatedAt" AS "createdAt",a."UpdatedAt" AS "updatedAt",a."UpdatedBy" AS "updatedBy" FROM "RiskAlerts" a JOIN "Predictions" p ON p."PredictionID"=a."PredictionID" JOIN "PredictionJobs" j ON j."JobID"=p."JobID" JOIN "Students" s ON s."StudentID"=p."StudentID" JOIN "Users" u ON u."UserID"=s."UserID"`;
export async function alerts(params:Row) {
 const p=pagination(params,['alertId','studentId','ojtSemesterId','status','interventionPage','interventionLimit']),args:unknown[]=[],where:string[]=[];
 const ip=pagination({page:params.interventionPage,limit:params.interventionLimit},[]);
 if(p.offset>2147483647||ip.offset>2147483647)throw invalid('Pagination exceeds allowed range.');
 if(params.alertId===undefined&&(params.interventionPage!==undefined||params.interventionLimit!==undefined))throw invalid('Select alertId before paging its interventions.');
 for(const [key,col]of Object.entries({alertId:'a."AlertID"',studentId:'p."StudentID"',ojtSemesterId:'j."OJTSemesterID"',status:'a."Status"'}))if(params[key]!==undefined){args.push(key==='status'?enumValue(params[key],['OPEN','ACKNOWLEDGED','RESOLVED','DISMISSED'],'status'):positiveId(params[key],key));where.push(`${col}=$${args.length}`);}
 return readTransaction(async c=>{
   const run=c.query.bind(c) as typeof query;
   const data=await pageSql(alertSelect+(where.length?' WHERE '+where.join(' AND '):''),args,p,run);
   if(params.alertId!==undefined)for(const item of data.items)item.interventions=await pageSql(interventionSelect+' WHERE i."AlertID"=$1',[item.id],ip,run);
   return data;
 });
}
export async function changeAlert(id:number,body:unknown,actor:number) {
 const b=inputObject(body,['status','reason']),status=enumValue(b.status,['ACKNOWLEDGED','RESOLVED','DISMISSED'],'status'),reason=requiredText(b.reason,'reason',2000);
 return academicTransaction(async c=>{
  const old=(await c.query('SELECT * FROM "RiskAlerts" WHERE "AlertID"=$1 FOR UPDATE',[id])).rows[0];if(!old)throw invalid('Alert not found.',404);
  if(!['OPEN','ACKNOWLEDGED'].includes(old.Status)||old.Status===status)throw invalid('Invalid alert status transition.',409);
  if(['RESOLVED','DISMISSED'].includes(status)&&(await c.query(`SELECT 1 FROM "StudentInterventions" WHERE "AlertID"=$1 AND "Status" IN ('PLANNED','IN_PROGRESS') LIMIT 1`,[id])).rowCount)throw invalid('Complete or cancel outstanding interventions first.',409,'OPEN_INTERVENTIONS');
  const row=(await c.query('UPDATE "RiskAlerts" SET "Status"=$2,"ResolutionNote"=$3,"UpdatedBy"=$4,"UpdatedAt"=now() WHERE "AlertID"=$1 RETURNING *',[id,status,reason,actor])).rows[0];
  await audit(c,actor,'RiskAlerts',id,'CHANGE_STATUS',old,row,reason);return (await c.query(alertSelect+' WHERE a."AlertID"=$1',[id])).rows[0];
 });
}
const interventionSelect=`SELECT i."InterventionID" AS id,i."AlertID" AS "alertId",p."StudentID" AS "studentId",i."Description" AS description,i."AssignedTo" AS "assignedTo",i."DueDate" AS "dueDate",i."Status" AS status,i."Outcome" AS outcome,i."CreatedBy" AS "createdBy",i."CreatedAt" AS "createdAt",i."UpdatedAt" AS "updatedAt" FROM "StudentInterventions" i JOIN "RiskAlerts" a ON a."AlertID"=i."AlertID" JOIN "Predictions" p ON p."PredictionID"=a."PredictionID"`;
export async function interventions(studentId:number,params:Row) {const p=pagination(params,['status']),args:unknown[]=[studentId];let where=' WHERE p."StudentID"=$1';if(params.status!==undefined){args.push(enumValue(params.status,['PLANNED','IN_PROGRESS','COMPLETED','CANCELLED'],'status'));where+=' AND i."Status"=$2';}return pageSql(interventionSelect+where,args,p);}
export async function saveIntervention(alertId:number|null,body:unknown,actor:number,id?:number) {
 const b=inputObject(body,id?['description','assignedTo','dueDate','status','outcome','reason']:['description','assignedTo','dueDate']);
 if(id)requiredText(b.reason,'reason',2000);
 return academicTransaction(async c=>{
  const old=id?(await c.query('SELECT * FROM "StudentInterventions" WHERE "InterventionID"=$1 FOR UPDATE',[id])).rows[0]:null;
  if(id&&!old)throw invalid('Intervention not found.',404);
  const target=old?.AlertID??alertId;
  const alert=(await c.query('SELECT * FROM "RiskAlerts" WHERE "AlertID"=$1 FOR UPDATE',[target])).rows[0];if(!alert)throw invalid('Alert not found.',404);
  if(!['OPEN','ACKNOWLEDGED'].includes(alert.Status))throw invalid('Closed alerts cannot be edited.',409);
  if(old&&['COMPLETED','CANCELLED'].includes(old.Status))throw invalid('Completed or cancelled interventions are immutable.',409);
  const assignedTo=positiveId(b.assignedTo??old?.AssignedTo,'assignedTo');
  if(!(await c.query(`SELECT 1 FROM "Users" u JOIN "Roles" r ON r."RoleID"=u."RoleID" WHERE u."UserID"=$1 AND u."Status"='ACTIVE' AND r."RoleCode" IN ('ADMIN','ACADEMIC','OJT_COORD')`,[assignedTo])).rowCount)throw invalid('Assigned user must be active staff.');
  const status=b.status===undefined?old?.Status??'PLANNED':enumValue(b.status,['PLANNED','IN_PROGRESS','COMPLETED','CANCELLED'],'status');
  const outcome=optionalText(b.outcome===undefined?old?.Outcome:b.outcome,'outcome',10000);
  if(status==='COMPLETED'&&!outcome)throw invalid('Completed interventions require an outcome.');
  const due=b.dueDate===undefined?old?.DueDate??null:b.dueDate===null?null:dateInput(b.dueDate,'dueDate');
  const values=[target,requiredText(b.description??old?.Description,'description',10000),assignedTo,due,status,outcome];
  const row=(await c.query(id?`UPDATE "StudentInterventions" SET "AlertID"=$1,"Description"=$2,"AssignedTo"=$3,"DueDate"=$4,"Status"=$5,"Outcome"=$6,"UpdatedAt"=now() WHERE "InterventionID"=$7 RETURNING *`:`INSERT INTO "StudentInterventions" ("AlertID","Description","AssignedTo","DueDate","Status","Outcome","CreatedBy") VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,[...values,id??actor])).rows[0];
  await audit(c,actor,'StudentInterventions',row.InterventionID,id?'UPDATE':'CREATE',old,row,b.reason as string|undefined);return (await c.query(interventionSelect+' WHERE i."InterventionID"=$1',[row.InterventionID])).rows[0];
 });
}
export function redact(value:any):any {
 if(Array.isArray(value))return value.map(redact);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,/password|token|secret|encrypted|authorization/i.test(k)?'[REDACTED]':redact(v)]));
 return value;
}
export async function auditLogs(params:Row) {
 const p=pagination(params,['userId','entityType','entityId','action']),args:unknown[]=[],where:string[]=[];
 for(const [key,col]of Object.entries({userId:'UserID',entityType:'EntityType',entityId:'EntityID',action:'Action'}))if(params[key]!==undefined){args.push(key.endsWith('Id')?positiveId(params[key],key):requiredText(params[key],key,100));where.push(`"${col}"=$${args.length}`);}
 const page=await pageSql(`SELECT "LogID" AS id,"UserID" AS "userId","EntityType" AS "entityType","EntityID" AS "entityId","Action" AS action,"Detail" AS detail,"ActionAt" AS "createdAt" FROM "AuditLogs"${where.length?' WHERE '+where.join(' AND '):''}`,args,p);
 return {...page,items:page.items.map((r:Row)=>{let d=r.detail;if(typeof d==='string'){try{d=JSON.parse(d);}catch{d='[UNSTRUCTURED DETAIL OMITTED]';}}return {...r,detail:redact(d)};})};
}
