import { createHash } from 'node:crypto';
import type { PoolClient } from 'pg';
import { query } from '../../config/database';
import { academicTransaction, audit } from '../academic/academic.repository';
import { invalid, inputObject, requiredText, optionalText, positiveId, resultValues, pagination, batchId, enumValue } from './student.validation';
import { resultPeriod } from './student.service';

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
export async function courseResultImport(body:unknown,actorId:number,preview:boolean) {
  let plans:any[]=[];
  try {
    const input=inputObject(body,['idempotencyKey','sourceName','rows']);
    const key=requiredText(input.idempotencyKey,'idempotencyKey',100), sourceName=optionalText(input.sourceName,'sourceName',150);
    if (!Array.isArray(input.rows) || !input.rows.length || input.rows.length>1000) throw invalid('rows must contain 1 to 1000 results.');
    const hash=createHash('sha256').update(JSON.stringify({sourceName,rows:input.rows})).digest('hex');
    const result=await academicTransaction(async client=>{
      if (!preview) {
        const old=(await client.query('SELECT * FROM "AcademicImportBatches" WHERE "Kind"=\'COURSE_RESULT\' AND "IdempotencyKey"=$1 AND "Status"=\'COMPLETED\'',[key])).rows[0];
        if (old) {
          if (old.PayloadHash!==hash || old.ImportedBy!==actorId) throw invalid('Idempotency key is already used for another payload or actor.',409,'IMPORT_CONFLICT');
          return {...old.Summary,batchId:old.BatchID,replayed:true};
        }
      }
      const seen=new Set<string>();
      for (const raw of input.rows as unknown[]) {
        const plan:any={raw:safeRow(raw),errors:[],status:'REJECTED'};
        plans.push(plan);
        try {
          const row=inputObject(raw,fields), values=resultValues(row);
          const studentCode=requiredText(row.studentCode,'studentCode',20).toUpperCase(),courseCode=requiredText(row.courseCode,'courseCode',20).toUpperCase();
          const periodId=positiveId(row.academicPeriodId,'academicPeriodId'),attempt=positiveId(row.attemptNumber??1,'attemptNumber');
          if (attempt>100) throw invalid('attemptNumber must not exceed 100.');
          const student=(await client.query('SELECT "StudentID" FROM "Students" WHERE upper("StudentCode")=$1',[studentCode])).rows[0];
          const course=(await client.query('SELECT "CourseID" FROM "Courses" WHERE upper("CourseCode")=$1',[courseCode])).rows[0];
          if (!student || !course) throw invalid('Unknown studentCode or courseCode.');
          const period=await resultPeriod(client,student.StudentID,periodId);
          const identity=[student.StudentID,course.CourseID,periodId,attempt].join(':');
          if (seen.has(identity)) throw invalid('Duplicate student/course/period/attempt in this payload.');
          seen.add(identity);
          plan.normalized={studentId:student.StudentID,courseId:course.CourseID,studentCode,courseCode,academicPeriodId:periodId,attemptNumber:attempt,...values,...period};
          const old=(await client.query(`SELECT * FROM "StudentCourseResults" WHERE "StudentID"=$1 AND "CourseID"=$2 AND "AcademicPeriodID"=$3 AND "AttemptNumber"=$4`,[student.StudentID,course.CourseID,periodId,attempt])).rows[0];
          if (old) {
            const oldValue={status:old.Status,score:old.Score===null?null:Number(old.Score),gradePoints:old.GradePoints===null?null:Number(old.GradePoints),grade:old.Grade,sourceReference:old.SourceReference};
            if (JSON.stringify(oldValue)!==JSON.stringify(values)) throw invalid('Existing result differs. Correct it through PATCH /api/course-results/:id with a reason.',409,'RESULT_CONFLICT');
            plan.status='UNCHANGED';plan.resultId=old.ResultID;
          } else plan.status='IMPORTED';
        } catch (error:any) { if (!error.statusCode) throw error;plan.errors.push({code:error.errorCode??'INVALID_ROW',message:error.message}); }
      }
      const rejected=plans.filter(p=>p.errors.length).length;
      const summary={total:plans.length,imported:plans.filter(p=>p.status==='IMPORTED').length,unchanged:plans.filter(p=>p.status==='UNCHANGED').length,rejected,canCommit:rejected===0};
      if (preview) return {...summary,rows:plans.map((p,i)=>({rowNumber:i+1,...p})),preview:true};
      if (rejected) {
        const id=await saveHistory(client,{kind:'COURSE_RESULT',key,hash,sourceName,status:'REJECTED',summary:{...summary,imported:0,unchanged:0}},actorId,plans.map(p=>({...p,status:'REJECTED',errors:p.errors.length?p.errors:[{code:'BATCH_REJECTED',message:'No rows were imported because another row was invalid.'}]})));
        return {...summary,imported:0,unchanged:0,batchId:id,rows:plans.map((p,i)=>({rowNumber:i+1,errors:p.errors})),rejectedBatch:true};
      }
      for (const p of plans) if (p.status==='IMPORTED') {
        const n=p.normalized;
        const row=(await client.query(`INSERT INTO "StudentCourseResults" ("StudentID","CourseID","AcademicPeriodID","AttemptNumber","Status","Score","GradePoints","Grade","SourceReference","AcademicYearID","SemesterTaken","RecordedBy") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,[n.studentId,n.courseId,n.academicPeriodId,n.attemptNumber,n.status,n.score,n.gradePoints,n.grade,n.sourceReference,n.academicYearId,n.semesterTaken,actorId])).rows[0];
        p.resultId=row.ResultID;
        await audit(client,actorId,'StudentCourseResults',row.ResultID,'IMPORT_RESULT',null,row);
      }
      const id=await saveHistory(client,{kind:'COURSE_RESULT',key,hash,sourceName,status:'COMPLETED',summary},actorId,plans);
      return {...summary,batchId:id,replayed:false};
    });
    return result;
  } catch (error:any) {
    if (!preview) { try { error.importBatchId=await recordRejected(body,actorId,'COURSE_RESULT',error,plans); } catch { console.error('Could not persist rejected academic import history.'); } }
    throw error;
  }
}
export async function importHistory(params:Record<string,unknown>) {
  const p=pagination(params,['kind','status']),args:unknown[]=[],filters:string[]=[];
  for (const key of ['kind','status']) if (params[key]!==undefined) {args.push(enumValue(params[key],key==='kind'?['STUDENT','COURSE_RESULT','CURRICULUM']:['COMPLETED','REJECTED','FAILED'],key));filters.push(`"${key==='kind'?'Kind':'Status'}"=$${args.length}`);}
  const row=(await query(`WITH filtered AS (SELECT "BatchID" AS id,"Kind" AS kind,"SourceName" AS "sourceName","ImportedBy" AS "importedBy","Status" AS status,"Summary" AS summary,"CreatedAt" AS "createdAt","SourceAccountBatchID" AS "sourceAccountBatchId" FROM "AcademicImportBatches" ${filters.length?'WHERE '+filters.join(' AND '):''}),paged AS (SELECT * FROM filtered ORDER BY id DESC LIMIT $${args.length+1} OFFSET $${args.length+2}) SELECT (SELECT count(*)::int FROM filtered) AS total,COALESCE(jsonb_agg(to_jsonb(paged) ORDER BY id DESC) FILTER (WHERE id IS NOT NULL),'[]'::jsonb) AS items FROM paged`,[...args,p.limit,p.offset])).rows[0];
  return {...row,page:p.page,limit:p.limit};
}
export async function importDetails(value:unknown,params:Record<string,unknown>) {
  const id=batchId(value),p=pagination(params,[]);
  const batch=(await query(`SELECT "BatchID" AS id,"Kind" AS kind,"Status" AS status,"Summary" AS summary,"SourceName" AS "sourceName","ImportedBy" AS "importedBy","CreatedAt" AS "createdAt","SourceAccountBatchID" AS "sourceAccountBatchId" FROM "AcademicImportBatches" WHERE "BatchID"=$1`,[id])).rows[0];
  if (!batch) throw invalid('Import batch not found.',404,'IMPORT_NOT_FOUND');
  const rows=(await query(`SELECT "RowNumber" AS "rowNumber","RawData" AS "rawData","NormalizedData" AS "normalizedData","Status" AS status,"Errors" AS errors,"ResultID" AS "resultId" FROM "AcademicImportRows" WHERE "BatchID"=$1 ORDER BY "RowNumber" LIMIT $2 OFFSET $3`,[id,p.limit,p.offset])).rows;
  const total=(await query('SELECT count(*)::int AS total FROM "AcademicImportRows" WHERE "BatchID"=$1',[id])).rows[0].total;
  return {...batch,rows,page:p.page,limit:p.limit,total};
}
