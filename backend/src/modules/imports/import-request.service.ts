import { createHash } from 'node:crypto';
import { academicTransaction,audit } from '../academic/academic.repository';
import { inputObject,positiveId,requiredText,pagination,invalid } from '../students/student.validation';
import { importAccounts,type ImportCommitHook } from './import.service';
import { importCurriculum } from '../curriculum/curriculum-import.service';
import { validateImport } from './import.validation';
import { enrichListRows } from '../../shared/list-context';
import type { Actor,Row } from '../student-portal/shared';
export type ImportKind='STUDENT'|'CURRICULUM';

const view=(r:Row,detail=false)=>({id:r.ImportID,kind:r.Kind,status:r.Status,idempotencyKey:r.IdempotencyKey,
  preview:r.Preview,result:r.Result,createdBy:r.CreatedBy,createdAt:r.CreatedAt,committedAt:r.CommittedAt,
  accountImportId:r.AccountBatchID==null?null:String(r.AccountBatchID),academicImportId:r.AcademicBatchID==null?null:String(r.AcademicBatchID),
  ...(detail?{input:r.Payload}:{})});
function staff(actor:Actor){if(!['ADMIN','ACADEMIC'].includes(actor.roleCode))throw invalid('Academic import access required.',403,'FORBIDDEN');}
export async function importRequests(kind:ImportKind,params:Row,actor:Actor,id?:number){
  staff(actor);const p=pagination(params,[]);
  return academicTransaction(async c=>{
    const filter='WHERE "Kind"=$1 AND ($2::int IS NULL OR "ImportID"=$2)';
    const total=(await c.query(`SELECT count(*)::int n FROM "AcademicImportRequests" ${filter}`,[kind,id??null])).rows[0].n;
    if(id&&!total)throw invalid('Import request not found.',404,'IMPORT_REQUEST_NOT_FOUND');
    const rows=(await c.query(`SELECT * FROM "AcademicImportRequests" ${filter} ORDER BY "ImportID" DESC LIMIT $3 OFFSET $4`,[kind,id??null,id?1:p.limit,id?0:p.offset])).rows;
    const items=await enrichListRows(c,rows.map(r=>view(r,!!id)));
    if(!id)return {items,total,page:p.page,limit:p.limit};
    const result=items[0];
    if(kind==='STUDENT'&&result.accountImportId){
      result.students=(await c.query(`SELECT r."RowNumber" AS "rowNumber",r."SourceCode" AS "studentCode",r."UserID" AS "userId",s."StudentID" AS "studentId",r."Action" AS action,
        u."FullName" AS "fullName",u."Email" AS email,u."Status" AS "accountStatus",u."MustChangePassword" AS "mustChangePassword",u."TemporaryPasswordExpiresAt" AS "temporaryPasswordExpiresAt",
        mail."EmailID"::text AS "emailId",CASE WHEN r."Action"='CREATED' THEN COALESCE(mail."Status",'NOT_QUEUED') ELSE 'NOT_QUEUED' END AS "emailStatus",mail."SentAt" AS "emailSentAt"
        FROM "AccountImportRows" r JOIN "Users" u ON u."UserID"=r."UserID" LEFT JOIN "Students" s ON s."UserID"=r."UserID"
        LEFT JOIN LATERAL (SELECT e."EmailID",e."Status",e."SentAt" FROM "EmailOutbox" e WHERE e."UserID"=r."UserID" AND e."Kind"='ACCOUNT' AND r."Action"='CREATED' ORDER BY e."EmailID" DESC LIMIT 1) mail ON true
        WHERE r."BatchID"=$1 ORDER BY r."RowNumber"`,[result.accountImportId])).rows;
    }
    return result;
  });
}
export async function createImportRequest(kind:ImportKind,body:unknown,actor:Actor){
  staff(actor);
  const b=inputObject(body,kind==='STUDENT'?['idempotencyKey','rows']:['idempotencyKey','sourceName','curriculum','courses','prerequisites','combos','equivalences']);
  const key=requiredText(b.idempotencyKey,'idempotencyKey',100);
  const payload:Row=kind==='STUDENT'?validateImport({...b,kind:'STUDENT'}):b;
  const hash=createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  const existing=await academicTransaction(async c=>(await c.query('SELECT * FROM "AcademicImportRequests" WHERE "Kind"=$1 AND "CreatedBy"=$2 AND "IdempotencyKey"=$3',[kind,actor.userId,key])).rows[0]);
  if(existing){if(existing.RequestHash!==hash)throw invalid('Import key belongs to different data.',409,'IDEMPOTENCY_CONFLICT');return {...view(existing,true),replayed:true};}
  const previewPayload={...payload,idempotencyKey:'rest-preview-'+hash.slice(0,64)};
  const preview=kind==='STUDENT'?await importAccounts(previewPayload,actor.userId,true):await importCurriculum(previewPayload,actor.userId,true);
  if((preview as Row).canCommit===false)throw Object.assign(invalid('Curriculum import validation failed.',422,'CURRICULUM_IMPORT_INVALID'),{issues:(preview as Row).errors});
  return academicTransaction(async c=>{
    await c.query(`INSERT INTO "AcademicImportRequests"("Kind","IdempotencyKey","RequestHash","Payload","Preview","CreatedBy") VALUES($1,$2,$3,$4,$5,$6)
      ON CONFLICT("Kind","CreatedBy","IdempotencyKey") DO NOTHING`,[kind,key,hash,JSON.stringify(payload),JSON.stringify(preview),actor.userId]);
    const row=(await c.query('SELECT * FROM "AcademicImportRequests" WHERE "Kind"=$1 AND "CreatedBy"=$2 AND "IdempotencyKey"=$3',[kind,actor.userId,key])).rows[0];
    if(row.RequestHash!==hash)throw invalid('Import key belongs to different data.',409,'IDEMPOTENCY_CONFLICT');
    await audit(c,actor.userId,'AcademicImportRequests',row.ImportID,'VALIDATE_IMPORT',null,{kind,total:(preview as Row).total??null});
    return view(row,true);
  });
}
export async function commitImportRequest(kind:ImportKind,body:unknown,actor:Actor){
  staff(actor);const b=inputObject(body,['id','status']);const id=positiveId(b.id);
  if(b.status!=='COMMITTED')throw invalid('Set status to COMMITTED to apply a validated import.');
  const row=await academicTransaction(async c=>(await c.query('SELECT * FROM "AcademicImportRequests" WHERE "ImportID"=$1 AND "Kind"=$2',[id,kind])).rows[0]);
  if(!row)throw invalid('Import request not found.',404,'IMPORT_REQUEST_NOT_FOUND');
  if(row.CreatedBy!==actor.userId)throw invalid('Only the staff member who validated this import can commit it.',403,'IMPORT_OWNER_REQUIRED');
  if(row.Status==='COMMITTED')return {...await importRequests(kind,{},actor,id),replayed:true};
  const onCommit:ImportCommitHook=async(c,result)=>{
    await c.query(`UPDATE "AcademicImportRequests" SET "Status"='COMMITTED',"Result"=$2,"CommittedAt"=clock_timestamp(),
      "AccountBatchID"=$3,"AcademicBatchID"=$4 WHERE "ImportID"=$1`,[id,JSON.stringify(result),kind==='STUDENT'?result.batchId:null,kind==='STUDENT'?result.academicImportId:result.batchId]);
    await audit(c,actor.userId,'AcademicImportRequests',id,'COMMIT_IMPORT',{status:'VALIDATED'},{status:'COMMITTED',result});
  };
  const payload={...row.Payload,idempotencyKey:'rest-'+kind.toLowerCase()+'-import-'+id};
  const result=kind==='STUDENT'?await importAccounts(payload,actor.userId,false,onCommit):await importCurriculum(payload,actor.userId,false,onCommit);
  return {...await importRequests(kind,{},actor,id),replayed:result.replayed};
}

// Preserve the existing ADMIN-only retry policy; scope the target to this import batch.
export async function retryStudentImportEmail(id:number,body:unknown,actor:Actor){
  if(actor.roleCode!=='ADMIN')throw invalid('Only ADMIN can retry account emails.',403,'FORBIDDEN');
  const b=inputObject(body,['email']),email=requiredText(b.email,'email',100).toLowerCase();
  return academicTransaction(async c=>{
    const allowed=(await c.query(`SELECT 1 FROM "AcademicImportRequests" i JOIN "AccountImportRows" r ON r."BatchID"=i."AccountBatchID"
      JOIN "Users" u ON u."UserID"=r."UserID" WHERE i."ImportID"=$1 AND i."Kind"='STUDENT' AND i."Status"='COMMITTED' AND lower(u."Email")=$2 AND r."Action"='CREATED'`,[id,email])).rowCount;
    if(!allowed)throw invalid('No newly created account with this email belongs to the committed import.',404,'IMPORT_ACCOUNT_NOT_FOUND');
    const result=await c.query(`UPDATE "EmailOutbox" e SET "Status"='PENDING',"Attempts"=0,"NextAttemptAt"=now(),"LastError"=NULL
      WHERE e."EmailID"=(SELECT latest."EmailID" FROM "EmailOutbox" latest WHERE lower(latest."Recipient")=$1 AND latest."Kind"='ACCOUNT' ORDER BY latest."EmailID" DESC LIMIT 1)
      AND e."Status"='FAILED' AND e."ExpiresAt">now() AND e."EncryptedPayload" IS NOT NULL
      AND EXISTS(SELECT 1 FROM "Users" u WHERE u."UserID"=e."UserID" AND u."MustChangePassword" AND u."TemporaryPasswordExpiresAt">now() AND u."Status"='ACTIVE' AND lower(u."Email")=lower(e."Recipient")) RETURNING "EmailID"::text AS id`,[email]);
    if(!result.rowCount)throw invalid('Only unexpired failed account emails can be retried.',409,'EMAIL_NOT_RETRYABLE');
    await audit(c,actor.userId,'AcademicImportRequests',id,'RETRY_ACCOUNT_EMAIL',null,{email,emailId:result.rows[0].id});
    return {id:result.rows[0].id,email,status:'PENDING',studentImportId:id};
  });
}
