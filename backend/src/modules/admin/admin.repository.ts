import type { PoolClient } from 'pg';
import { query } from '../../config/database';
import { invalid, pagination, positiveId, requiredText, enumValue } from '../students/student.validation';
import { dateInput } from '../academic/academic.schema';

export type Row = Record<string, any>;
export interface Catalog { table: string; id: string; fields: Record<string,string>; search: string[]; filters: Record<string,string>; softDelete?: boolean }
export const catalogs = {
 companies: {table:'Enterprises',id:'EnterpriseID',fields:{id:'EnterpriseID',code:'EnterpriseCode',name:'Name',address:'Address',industry:'Industry',contactPersonName:'ContactPersonName',contactPhone:'ContactPhone',contactEmail:'ContactEmail',status:'Status',createdAt:'CreatedAt'},search:['EnterpriseCode','Name'],filters:{status:'Status'},softDelete:true},
 positions: {table:'InternshipPositions',id:'PositionID',fields:{id:'PositionID',companyId:'EnterpriseID',ojtSemesterId:'OJTSemesterID',recruitmentCode:'RecruitmentCode',title:'Title',description:'Description',requirements:'Requirements',capacity:'Capacity',remainingSlots:'RemainingSlots',status:'Status',location:'Location',workMode:'WorkMode'},search:['Title','RecruitmentCode'],filters:{companyId:'EnterpriseID',ojtSemesterId:'OJTSemesterID',status:'Status'},softDelete:true},
 templates: {table:'AssessmentTemplates',id:'TemplateID',fields:{id:'TemplateID',code:'Code',version:'Version',name:'Name',criteria:'Criteria',status:'Status',createdAt:'CreatedAt',publishedAt:'PublishedAt'},search:['Code','Name'],filters:{status:'Status'}},
 models: {table:'PredictionModels',id:'ModelID',fields:{id:'ModelID',code:'Code',version:'Version',name:'Name',status:'Status',metrics:'Metrics',featureSchema:'FeatureSchema',createdAt:'CreatedAt'},search:['Code','Name'],filters:{status:'Status'}}
} satisfies Record<string,Catalog>;
export function selectColumns(config:Catalog, alias='t') {return Object.entries(config.fields).map(([key,col])=>`${alias}."${col}" AS "${key}"`).join(',');}
export function apiRow(config:Catalog,row:Row) {return Object.fromEntries(Object.entries(config.fields).map(([key,col])=>[key,row[col]]));}
export async function record(c:PoolClient, config:Catalog,id:number, includeDeleted=false) {
 const row=(await c.query(`SELECT * FROM "${config.table}" WHERE "${config.id}"=$1${config.softDelete&&!includeDeleted?' AND "DeletedAt" IS NULL':''} FOR UPDATE`,[id])).rows[0];
 if(!row)throw invalid('Record not found.',404,'NOT_FOUND');return row;
}
export async function detail(config:Catalog,id:number) {
 const row=(await query(`SELECT ${selectColumns(config)} FROM "${config.table}" t WHERE t."${config.id}"=$1${config.softDelete?' AND t."DeletedAt" IS NULL':''}`,[id])).rows[0];
 if(!row)throw invalid('Record not found.',404,'NOT_FOUND');return row;
}
export async function pageSql(sql:string,args:unknown[],p:{page:number;limit:number;offset:number}):Promise<{total:number;items:Row[];page:number;limit:number}> {
 const row=(await query(`WITH filtered AS (${sql}), paged AS (SELECT * FROM filtered ORDER BY id DESC LIMIT $${args.length+1} OFFSET $${args.length+2}) SELECT (SELECT count(*)::int FROM filtered) AS total,COALESCE(jsonb_agg(to_jsonb(paged) ORDER BY id DESC) FILTER(WHERE id IS NOT NULL),'[]'::jsonb) AS items FROM paged`,[...args,p.limit,p.offset])).rows[0];
 return {total:row.total,items:row.items,page:p.page,limit:p.limit};
}
export async function listCatalog(config:Catalog,params:Row) {
 const p=pagination(params,['search',...Object.keys(config.filters)]),args:unknown[]=[],where=config.softDelete?['t."DeletedAt" IS NULL']:[];
 if(params.search!==undefined){args.push('%'+requiredText(params.search,'search',100)+'%');where.push('('+config.search.map(col=>`t."${col}" ILIKE $${args.length}`).join(' OR ')+')');}
 for(const [key,col]of Object.entries(config.filters))if(params[key]!==undefined){args.push(key.endsWith('Id')?positiveId(params[key],key):requiredText(params[key],key,30));where.push(`t."${col}"=$${args.length}`);}
 return pageSql(`SELECT ${selectColumns(config)} FROM "${config.table}" t${where.length?' WHERE '+where.join(' AND '):''}`,args,p);
}
export async function write(c:PoolClient,config:Catalog,values:Row,id?:number) {
 const entries=Object.entries(values),columns=entries.map(([key])=>`"${key}"`),args=entries.map(([,value])=>value);
 const sql=id?`UPDATE "${config.table}" SET ${columns.map((col,i)=>`${col}=$${i+1}`).join(',')} WHERE "${config.id}"=$${args.length+1}`:`INSERT INTO "${config.table}" (${columns.join(',')}) VALUES (${args.map((_,i)=>'$'+(i+1)).join(',')})`;
 return (await c.query(sql+' RETURNING *',id?[...args,id]:args)).rows[0];
}
export function csv(rows:Row[],keys:string[]) {
 const cell=(v:unknown)=>{let s=v==null?'':typeof v==='object'?JSON.stringify(v):String(v);if(/^[\s]*[=+\-@]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
 return '\uFEFF'+[keys.map(cell).join(','),...rows.map(row=>keys.map(key=>cell(row[key])).join(','))].join('\r\n')+'\r\n';
}
export function predictionFilters(params:Row,extra:string[]=[]) {
 const page=pagination(params,['ojtSemesterId','studentId','modelId','riskLevel','readinessLevel','from','to',...extra]);
 const args:unknown[]=[],where:string[]=[];
 for(const [key,col]of Object.entries({ojtSemesterId:'j."OJTSemesterID"',studentId:'p."StudentID"',modelId:'j."ModelID"',riskLevel:'p."RiskLevel"',readinessLevel:'p."ReadinessLevel"'}))if(params[key]!==undefined){args.push(key.endsWith('Id')?positiveId(params[key],key):enumValue(params[key],['LOW','MEDIUM','HIGH'],key));where.push(`${col}=$${args.length}`);}
 for(const key of ['from','to'])if(params[key]!==undefined){const value=requiredText(params[key],key,30);if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/.test(value)||!Number.isFinite(Date.parse(value)))throw invalid(`${key} must be an ISO UTC timestamp.`);dateInput(value.slice(0,10),key);args.push(value);where.push(`p."CreatedAt"${key==='from'?'>=':'<='}$${args.length}`);}
 if(params.from&&params.to&&Date.parse(params.from)>Date.parse(params.to))throw invalid('from must not exceed to.');
 return {args,where,page};
}
export const predictionSelect=`SELECT p."PredictionID" AS id,p."StudentID" AS "studentId",s."StudentCode" AS "studentCode",u."FullName" AS "fullName",p."JobID" AS "jobId",j."OJTSemesterID" AS "ojtSemesterId",j."ModelID" AS "modelId",p."ReadinessScore"::float8 AS "readinessScore",p."ReadinessLevel" AS "readinessLevel",p."RiskScore"::float8 AS "riskScore",p."RiskLevel" AS "riskLevel",p."Factors" AS factors,p."ModelSnapshot" AS "modelSnapshot",p."CreatedAt" AS "createdAt" FROM "Predictions" p JOIN "PredictionJobs" j ON j."JobID"=p."JobID" JOIN "Students" s ON s."StudentID"=p."StudentID" JOIN "Users" u ON u."UserID"=s."UserID"`;
