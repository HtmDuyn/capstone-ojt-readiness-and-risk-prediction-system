import { enrichListRows } from '../../shared/list-context';
import type { PoolClient } from 'pg';
import { query } from '../../config/database';
import { invalid, pagination, positiveId, requiredText } from '../students/student.validation';

export type Row = Record<string, any>;
export interface Catalog { table: string; id: string; fields: Record<string,string>; search: string[]; filters: Record<string,string>; softDelete?: boolean }
export const catalogs = {
 companies: {table:'Enterprises',id:'EnterpriseID',fields:{id:'EnterpriseID',code:'EnterpriseCode',name:'Name',address:'Address',industry:'Industry',contactPersonName:'ContactPersonName',contactPhone:'ContactPhone',contactEmail:'ContactEmail',status:'Status',createdAt:'CreatedAt'},search:['EnterpriseCode','Name'],filters:{status:'Status'},softDelete:true},
 positions: {table:'InternshipPositions',id:'PositionID',fields:{id:'PositionID',companyId:'EnterpriseID',ojtSemesterId:'OJTSemesterID',recruitmentCode:'RecruitmentCode',title:'Title',description:'Description',requirements:'Requirements',capacity:'Capacity',remainingSlots:'RemainingSlots',status:'Status',location:'Location',workMode:'WorkMode'},search:['Title','RecruitmentCode'],filters:{companyId:'EnterpriseID',ojtSemesterId:'OJTSemesterID',status:'Status'},softDelete:true},
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
export async function pageSql(sql:string,args:unknown[],p:{page:number;limit:number;offset:number},run:typeof query=query):Promise<{total:number;items:Row[];page:number;limit:number}> {
 const row=(await run(`WITH filtered AS (${sql}), paged AS (SELECT * FROM filtered ORDER BY id DESC LIMIT $${args.length+1} OFFSET $${args.length+2}) SELECT (SELECT count(*)::int FROM filtered) AS total,COALESCE(jsonb_agg(to_jsonb(paged) ORDER BY id DESC) FILTER(WHERE id IS NOT NULL),'[]'::jsonb) AS items FROM paged`,[...args,p.limit,p.offset])).rows[0];
 return {total:row.total,items:await enrichListRows({query:run},row.items),page:p.page,limit:p.limit};
}
export async function listCatalog(config:Catalog,params:Row) {
 const p=pagination(params,['search',...Object.keys(config.filters)]),args:unknown[]=[],where=config.softDelete?['t."DeletedAt" IS NULL']:[];
 if(p.offset>2147483647)throw invalid('Pagination exceeds allowed range.');
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
