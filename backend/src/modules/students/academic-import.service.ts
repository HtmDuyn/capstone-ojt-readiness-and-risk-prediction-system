import { readTransaction } from '../qhdn/read.repository';
import { detailPagination } from '../../shared/detail-pagination';
import { enrichListRows } from '../../shared/list-context';
import type { PoolClient } from 'pg';
import { academicTransaction } from '../academic/academic.repository';
import { invalid, pagination, batchId, enumValue } from './student.validation';

const fields=['studentCode','courseCode','academicPeriodId','attemptNumber','status','score','grade','gradePoints','sourceReference'];
export function safeRow(row: unknown, kind='COURSE_RESULT') {
  if (!row || typeof row!=='object' || Array.isArray(row)) return { invalidRow:true };
  const allowed=kind==='STUDENT'?['code','email','fullName']:kind==='CURRICULUM'?['code','name','version','majorId','totalCredits','effectiveYear','gpaScale']:fields;
  return Object.fromEntries(Object.entries(row).filter(([k])=>allowed.includes(k)));
}
export async function saveHistory(client: PoolClient, input: {kind:string; key?:string|null; hash?:string|null; sourceName?:string|null; status:string; summary:unknown; sourceAccountBatchId?:string|null; curriculumId?:number}, actorId:number, rows: {raw:unknown; normalized?:unknown; status:string; errors?:unknown[]; resultId?:number}[]) {
  const id=(await client.query(`INSERT INTO "AcademicImportBatches" ("Kind","IdempotencyKey","PayloadHash","SourceName","ImportedBy","Status","Summary","SourceAccountBatchID","CurriculumID") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING "BatchID"`,[input.kind,input.key??null,input.hash??null,input.sourceName??null,actorId,input.status,JSON.stringify(input.summary),input.sourceAccountBatchId??null,input.curriculumId??null])).rows[0].BatchID as string;
  for (let i=0;i<rows.length;i++) { const r=rows[i]; await client.query(`INSERT INTO "AcademicImportRows" ("BatchID","RowNumber","RawData","NormalizedData","Status","Errors","ResultID") VALUES ($1,$2,$3,$4,$5,$6,$7)`,[id,i+1,JSON.stringify(r.raw),r.normalized?JSON.stringify(r.normalized):null,r.status,JSON.stringify(r.errors??[]),r.resultId??null]); }
  return id;
}
export async function recordRejected(body: any,actorId:number,kind:string,error:any,rows?:any[]) {
  // Error history never stores arbitrary user fields or temporary passwords.
  const rawRows=kind==='CURRICULUM'?[body?.curriculum]:Array.isArray(body?.rows)?body.rows.slice(0,1000):[];
  return academicTransaction(client=>saveHistory(client,{kind,key:typeof body?.idempotencyKey==='string'?body.idempotencyKey.slice(0,100):null,status:error.statusCode>=500?'FAILED':'REJECTED',summary:{message:error.statusCode>=500?'Import failed.':error.message,errorCode:error.errorCode??'IMPORT_REJECTED'}},actorId,rawRows.map((r:unknown,i:number)=>({raw:safeRow(r,kind),status:'REJECTED',errors:rows?.[i]?.errors?.length?rows[i].errors:[{code:'BATCH_REJECTED',message:error.statusCode>=500?'Import failed.':error.message}]}))));
}
export async function importHistory(params:Record<string,unknown>) {
 const p=pagination(params,['importId','kind','status','rowsPage','rowsLimit']);if(p.offset>2147483647)throw invalid('Pagination exceeds the allowed range.');
 const id=params.importId===undefined?undefined:batchId(params.importId),rp=detailPagination(params,'importId','rows');
 const args:unknown[]=[],filters:string[]=[];
 for(const key of ['kind','status'])if(params[key]!==undefined){args.push(enumValue(params[key],key==='kind'?['STUDENT','COURSE_RESULT','CURRICULUM']:['COMPLETED','REJECTED','FAILED'],key));filters.push(`"${key==='kind'?'Kind':'Status'}"=$${args.length}`);}
 if(id!==undefined){args.push(id);filters.push('"BatchID"=$'+args.length+'::bigint');}
 return readTransaction(async c=>{
  const row=(await c.query(`WITH filtered AS (SELECT "BatchID" AS id,"Kind" AS kind,"SourceName" AS "sourceName","ImportedBy" AS "importedBy","Status" AS status,"Summary" AS summary,"CreatedAt" AS "createdAt","SourceAccountBatchID" AS "sourceAccountBatchId" FROM "AcademicImportBatches" ${filters.length?'WHERE '+filters.join(' AND '):''}),paged AS (SELECT * FROM filtered ORDER BY id DESC LIMIT $${args.length+1} OFFSET $${args.length+2}) SELECT (SELECT count(*)::int FROM filtered) AS total,COALESCE(jsonb_agg(to_jsonb(paged)||jsonb_build_object('id',paged.id::text,'sourceAccountBatchId',paged."sourceAccountBatchId"::text) ORDER BY id DESC) FILTER (WHERE id IS NOT NULL),'[]'::jsonb) AS items FROM paged`,[...args,p.limit,p.offset])).rows[0];
  const items=await enrichListRows(c,row.items);
  if(id!==undefined)for(const item of items){
   const total=(await c.query('SELECT count(*)::int AS total FROM "AcademicImportRows" WHERE "BatchID"=$1',[item.id])).rows[0].total;
   item.rows=(await c.query(`SELECT "RowNumber" AS "rowNumber","RawData" AS "rawData","NormalizedData" AS "normalizedData","Status" AS status,"Errors" AS errors,"ResultID" AS "resultId" FROM "AcademicImportRows" WHERE "BatchID"=$1 ORDER BY "RowNumber" LIMIT $2 OFFSET $3`,[item.id,rp.limit,rp.offset])).rows;
   item.rowsPagination={total,page:rp.page,limit:rp.limit};
  }
  return {...row,items,page:p.page,limit:p.limit};
 });
}
