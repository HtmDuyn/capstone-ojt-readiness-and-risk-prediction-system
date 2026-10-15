import ExcelJS from 'exceljs';
import { Readable } from 'node:stream';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { academicTransaction, audit } from '../academic/academic.repository';
import { validateImport } from '../imports/import.validation';
import { emailKey, encryptEmail } from '../imports/email.crypto';
import { fingerprint } from '../eligibility/eligibility.service';
import { invalid, inputObject, positiveId, optionalText, enumValue } from '../students/student.validation';
import { requireStaff, reservedSeats, syncSlots } from '../qhdn/qhdn.repository';
import { page, type Row, type Actor } from '../student-portal/shared';

export async function parseCompanySheet(body:Row,file?:Express.Multer.File) {
  if(!file)return body;
  if(body.kind!=='ENTERPRISE')throw invalid('Sheet upload is supported for ENTERPRISE imports.');
  const mapping=typeof body.mapping==='string'?JSON.parse(body.mapping):body.mapping;
  const workbook=new ExcelJS.Workbook();let worksheet:ExcelJS.Worksheet;
  if(/\.csv$/i.test(file.originalname))worksheet=await workbook.csv.read(Readable.from(file.buffer));
  else if(/\.xlsx$/i.test(file.originalname)){await workbook.xlsx.load(file.buffer as any);worksheet=workbook.worksheets[0];}
  else throw invalid('Import file must be .xlsx or .csv.');
  if(!worksheet||worksheet.rowCount<2||worksheet.rowCount>5001||worksheet.columnCount>100)throw invalid('Sheet must contain a header and at most 5000 rows / 100 columns.');
  const headers=worksheet.getRow(1).values as any[], index=new Map<string,number>();headers.forEach((h,i)=>{if(h!=null)index.set(String(h).trim(),i);});
  const fields=['code','name','email','fullName','address','positionCode','title','description','requirements','capacity'];
  if(mapping)inputObject(mapping,fields);
  const groups=new Map<string,Row>(),origins=new Map<string,number[]>();
  for(let n=2;n<=worksheet.rowCount;n++){
    const r=worksheet.getRow(n);if(!r.hasValues)continue;const v:Row={};for(const key of fields){const col=index.get(mapping?.[key]??key);v[key]=col?r.getCell(col).text.trim():undefined;}
    const key=String(v.code??'').toUpperCase();origins.set(key,[...(origins.get(key)??[]),n]);const position={code:v.positionCode,title:v.title,description:v.description,requirements:v.requirements,capacity:Number(v.capacity)};
    const old=groups.get(key);if(old){if(old.email!==v.email||old.name!==v.name||old.fullName!==v.fullName)throw invalid(`Sheet row ${n}: inconsistent enterprise identity.`);old.positions.push(position);}else groups.set(key,{code:v.code,name:v.name,email:v.email,fullName:v.fullName,...(v.address?{address:v.address}:{}),positions:[position]});
  }
  return {...body,semesterId:Number(body.semesterId),mapping:{...(mapping??{}),_sourceRows:[...origins.values()]},sourceName:file.originalname,rows:[...groups.values()]};
}
export async function importCompanies(body:unknown,actor:Actor,preview:boolean) {
  requireStaff(actor);const b=inputObject(body,['kind','semesterId','rows','idempotencyKey','sourceName','mapping','mode']);
  const semesterId=positiveId(b.semesterId,'semesterId'),key=typeof b.idempotencyKey==='string'?b.idempotencyKey.trim():'';if(!key||key.length>100)throw invalid('idempotencyKey is required, maximum 100 characters.');
  const sourceName=optionalText(b.sourceName,'sourceName',200),mode=enumValue(b.mode??'UPSERT',['UPSERT','CREATE_ONLY'],'mode');
  if(!Array.isArray(b.rows)||!b.rows.length||b.rows.length>500)throw invalid('Import 1–500 enterprises.');
  const inputTotal=b.rows.length;
  const rows:Row[]=[],errors:Row[]=[],codes=new Set<string>(),emails=new Set<string>();
  for(let i=0;i<b.rows.length;i++){try{const r=validateImport({kind:'ENTERPRISE',semesterId,rows:[b.rows[i]],idempotencyKey:key}).rows[0];if(codes.has(r.code)||emails.has(r.email))throw invalid('Duplicate enterprise code/email.');codes.add(r.code);emails.add(r.email);rows.push({...r,rowNumber:i+1});}catch(e:any){errors.push({rowNumber:i+1,code:'INVALID_ROW',message:e.message});}}
  const hash=fingerprint({semesterId,mode,rows:b.rows});
  const sheetRows=(n:number)=>Array.isArray((b.mapping as Row)?._sourceRows?.[n-1])?(b.mapping as Row)._sourceRows[n-1]:undefined;
  for(const e of errors)if(sheetRows(e.rowNumber))e.sheetRows=sheetRows(e.rowNumber);
  return academicTransaction(async c=>{
    await c.query("SELECT pg_advisory_xact_lock(hashtext('account-provisioning'))");
    const prior=(await c.query('SELECT * FROM "CompanyImportBatches" WHERE "IdempotencyKey"=$1 AND "Status"=\'COMPLETED\'',[key])).rows[0];if(prior){if(prior.RequestHash!==hash||prior.CreatedBy!==actor.userId)throw invalid('Idempotency conflict.',409,'IDEMPOTENCY_CONFLICT');return {...prior.Summary,batchId:prior.BatchID,replayed:true};}
    const term=(await c.query('SELECT * FROM "OJTSemesters" WHERE "OJTSemesterID"=$1',[semesterId])).rows[0];if(!term)throw invalid('OJT semester not found.',404);
    const plans:Row[]=[];
    for(const r of rows){try{
      const existing=(await c.query('SELECT * FROM "Enterprises" WHERE upper("EnterpriseCode")=$1 FOR UPDATE',[r.code])).rows[0];if(existing?.DeletedAt)throw invalid('Enterprise is soft-deleted; restore it before importing.');if(existing&&mode==='CREATE_ONLY')throw invalid('Enterprise already exists.');
      const user=(await c.query('SELECT u."UserID",u."Email",role."RoleCode",eu."EnterpriseID" FROM "Users" u JOIN "Roles" role ON role."RoleID"=u."RoleID" LEFT JOIN "EnterpriseUsers" eu ON eu."UserID"=u."UserID" WHERE lower(u."Email")=$1',[r.email])).rows[0];
      if(user&&(user.RoleCode!=='ENTERPRISE'||user.EnterpriseID!==existing?.EnterpriseID))throw invalid('Email is linked to another account/enterprise.');
      if(!user&&(await c.query('SELECT 1 FROM "Users" WHERE "Username"=$1',['enterprise_'+r.code])).rowCount)throw invalid('The enterprise login identity conflicts; contact Admin.');
      const positions:Row[]=[];for(const p of r.positions){const old=existing?(await c.query('SELECT p.*,'+reservedSeats('p')+' AS used FROM "InternshipPositions" p WHERE p."EnterpriseID"=$1 AND p."OJTSemesterID"=$2 AND "RecruitmentCode"=$3 FOR UPDATE',[existing.EnterpriseID,semesterId,p.code])).rows[0]:null;
        if(old&&(old.DeletedAt||old.ArchivedAt||mode==='CREATE_ONLY'))throw invalid('Position exists or is archived/deleted.');if(old&&old.used>p.capacity)throw invalid('Capacity is below already reserved/assigned seats.');positions.push({...p,old});}
      plans.push({row:r,existing,user,positions});
    }catch(e:any){if(!e.statusCode)throw e;errors.push({rowNumber:r.rowNumber,code:e.errorCode??'IMPORT_CONFLICT',message:e.message});}}
    for(const e of errors)if(sheetRows(e.rowNumber))e.sheetRows=sheetRows(e.rowNumber);
    const summary={total:inputTotal,created:plans.filter(p=>!p.existing).length,updated:plans.filter(p=>p.existing).length,errors,canCommit:errors.length===0};
    if(preview)return {...summary,preview:true,rows:plans.map(p=>({rowNumber:p.row.rowNumber,sheetRows:sheetRows(p.row.rowNumber),code:p.row.code,action:p.existing?'UPDATED':'CREATED'}))};
    const batch=(await c.query('INSERT INTO "CompanyImportBatches" ("OJTSemesterID","IdempotencyKey","RequestHash","SourceName","Mapping","Status","Summary","CreatedBy") VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING "BatchID"',[semesterId,key,hash,sourceName,JSON.stringify(b.mapping??{}),errors.length?'REJECTED':'COMPLETED',JSON.stringify(summary),actor.userId])).rows[0];
    if(errors.length){for(let i=0;i<inputTotal;i++){const rowErrors=errors.filter(e=>e.rowNumber===i+1),source=(b.rows as Row[])[i];await c.query('INSERT INTO "CompanyImportRows" ("BatchID","RowNumber","SourceCode","Action","Errors") VALUES ($1,$2,$3,$4,$5)',[batch.BatchID,i+1,typeof source?.code==='string'?source.code.slice(0,20):null,rowErrors.length?'REJECTED':'NOT_IMPORTED',JSON.stringify(rowErrors)]);}return {...summary,batchId:batch.BatchID,rejectedBatch:true};}
    if(plans.some(p=>!p.user)){try{emailKey();}catch{throw invalid('Configure EMAIL_OUTBOX_KEY before provisioning enterprise accounts.',503,'EMAIL_NOT_CONFIGURED');}let url:URL;try{url=new URL(process.env.FRONTEND_LOGIN_URL??'');}catch{throw invalid('Configure FRONTEND_LOGIN_URL.',503);}if(!['https:','http:'].includes(url.protocol))throw invalid('Invalid login URL.',503);}
    const retention=(await c.query('SELECT "OJTSemesterID" FROM "OJTSemesters" WHERE "StartDate">$1 ORDER BY "StartDate" LIMIT 1',[term.StartDate])).rows[0]?.OJTSemesterID??null;
    for(const plan of plans){const r=plan.row;const ent=plan.existing?(await c.query('UPDATE "Enterprises" SET "Name"=$2,"Address"=$3,"ContactEmail"=$4,"ContactPersonName"=$5 WHERE "EnterpriseID"=$1 RETURNING *',[plan.existing.EnterpriseID,r.name,r.address??null,r.email,r.fullName])).rows[0]:(await c.query('INSERT INTO "Enterprises" ("EnterpriseCode","Name","Address","ContactEmail","ContactPersonName","Status") VALUES ($1,$2,$3,$4,$5,\'ACTIVE\') RETURNING *',[r.code,r.name,r.address??null,r.email,r.fullName])).rows[0];
      if(!plan.user){const password=randomBytes(18).toString('base64url'),expires=new Date(Date.now()+72*3600000),hash=await bcrypt.hash(password,12);const u=(await c.query('INSERT INTO "Users" ("Username","Email","FullName","PasswordHash","RoleID","MustChangePassword","TemporaryPasswordExpiresAt") SELECT $1,$2,$3,$4,"RoleID",true,$5 FROM "Roles" WHERE "RoleCode"=\'ENTERPRISE\' RETURNING "UserID"',['enterprise_'+r.code,r.email,r.fullName,hash,expires])).rows[0];if(!u)throw invalid('Enterprise role is not configured.',503);await c.query('INSERT INTO "EnterpriseUsers" ("UserID","EnterpriseID","PositionTitle") VALUES ($1,$2,\'HR\')',[u.UserID,ent.EnterpriseID]);await c.query('INSERT INTO "EmailOutbox" ("UserID","Recipient","EncryptedPayload","ExpiresAt") VALUES ($1,$2,$3,$4)',[u.UserID,r.email,encryptEmail({subject:'Tài khoản OJT',text:`Đăng nhập: ${process.env.FRONTEND_LOGIN_URL}\nEmail: ${r.email}\nMật khẩu tạm: ${password}\nHãy đổi mật khẩu sau đăng nhập.`}),expires]);}
      const positionIds=[];
      for(const p of plan.positions){const changed=!p.old||p.old.Title!==p.title||p.old.Description!==p.description||p.old.Requirements!==p.requirements;
        const pos=p.old?(await c.query('UPDATE "InternshipPositions" SET "Title"=$2,"Description"=$3,"Requirements"=$4,"Capacity"=$5 WHERE "PositionID"=$1 RETURNING *',[p.old.PositionID,p.title,p.description,p.requirements,p.capacity])).rows[0]:(await c.query('INSERT INTO "InternshipPositions" ("EnterpriseID","OJTSemesterID","RecruitmentCode","Title","Description","Requirements","Capacity","RemainingSlots","Status") VALUES ($1,$2,$3,$4,$5,$6,$7,$7,\'OPEN\') RETURNING *',[ent.EnterpriseID,semesterId,p.code,p.title,p.description,p.requirements,p.capacity])).rows[0];positionIds.push(pos.PositionID);await syncSlots(c,pos.PositionID);await audit(c,actor.userId,'InternshipPositions',pos.PositionID,'IMPORT',p.old??null,pos,sourceName??undefined);
        const post=(await c.query('SELECT p.* FROM "RecruitmentPostPositions" pp JOIN "RecruitmentPosts" p ON p."PostID"=pp."PostID" WHERE pp."PositionID"=$1 AND p."ArchivedAt" IS NULL ORDER BY p."PostID" DESC LIMIT 1',[pos.PositionID])).rows[0];
        if(post&&changed)await c.query('UPDATE "RecruitmentPosts" SET "Title"=$2,"Content"=$3,"Status"=\'PENDING_REVIEW\',"UpdatedAt"=now() WHERE "PostID"=$1',[post.PostID,p.title,p.description]);
        else if(!post){const rp=(await c.query('INSERT INTO "RecruitmentPosts" ("EnterpriseID","OJTSemesterID","Title","Content","Status","CreatedBy","RetentionSemesterID") VALUES ($1,$2,$3,$4,\'PENDING_REVIEW\',$5,$6) RETURNING "PostID"',[ent.EnterpriseID,semesterId,p.title,p.description,actor.userId,retention])).rows[0];await c.query('INSERT INTO "RecruitmentPostPositions" ("PostID","PositionID","EnterpriseID","OJTSemesterID") VALUES ($1,$2,$3,$4)',[rp.PostID,pos.PositionID,ent.EnterpriseID,semesterId]);}
      }
      await c.query('INSERT INTO "CompanyImportRows" ("BatchID","RowNumber","EnterpriseID","SourceCode","Action","PositionIDs") VALUES ($1,$2,$3,$4,$5,$6)',[batch.BatchID,r.rowNumber,ent.EnterpriseID,r.code,plan.existing?'UPDATED':'CREATED',JSON.stringify(positionIds)]);await audit(c,actor.userId,'Enterprises',ent.EnterpriseID,'IMPORT',plan.existing??null,ent,sourceName??undefined);
    }return {...summary,batchId:batch.BatchID,replayed:false};
  });
}
export async function companyImports(params:Row,actor:Actor,id?:number) {
  requireStaff(actor);return academicTransaction(async c=>{const data=await page(c,'SELECT "BatchID" AS id,"OJTSemesterID" AS "ojtSemesterId","SourceName" AS "sourceName","Status" AS status,"Summary" AS summary,"Mapping" AS mapping,"CreatedAt" AS "createdAt" FROM "CompanyImportBatches" WHERE ($1::int IS NULL OR "BatchID"=$1) AND ($2::int IS NULL OR "OJTSemesterID"=$2)',[id??null,params.ojtSemesterId===undefined?null:positiveId(params.ojtSemesterId,'ojtSemesterId')],params,['ojtSemesterId']);if(id){if(!data.items.length)throw invalid('Company import not found.',404);return {...data.items[0],rows:(await c.query('SELECT "RowNumber" AS "rowNumber","EnterpriseID" AS "enterpriseId","SourceCode" AS code,"Action" AS action,"Errors" AS errors,"PositionIDs" AS "positionIds" FROM "CompanyImportRows" WHERE "BatchID"=$1 ORDER BY "RowNumber"',[id])).rows};}return data;});
}
