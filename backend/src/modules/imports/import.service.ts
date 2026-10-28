import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { pool } from '../../config/database';
import { encryptEmail, emailKey } from './email.crypto';
import { fail, validateImport } from './import.validation';
import { saveHistory, recordRejected, safeRow } from '../students/academic-import.service';
import { importAcademicProfile } from '../students/complete-import.service';
import type { PoolClient } from 'pg';
import { importEnterprises } from '../qhdn/enterprise-import.service';
export type ImportCommitHook=(client:PoolClient,result:Record<string,any>)=>Promise<void>;

export async function importAccounts(body: unknown, actorId: number, preview = false,onCommit?:ImportCommitHook) {
  // Keep all ENTERPRISE entry points on the same semester-based contract.
  if ((body as any)?.kind === 'ENTERPRISE') {
    return importEnterprises(body, actorId, preview);
  }
  try { return await performAccountImport(body,actorId,preview,onCommit); }
  catch(error:any) {
    if (!preview && (body as any)?.kind==='STUDENT') {
      try { error.importBatchId=await recordRejected(body,actorId,'STUDENT',error); }
      catch { console.error('Could not persist rejected student import history.'); }
    }
    throw error;
  }
}
async function performAccountImport(body: unknown, actorId: number, preview = false,onCommit?:ImportCommitHook) {
  const input = validateImport(body);
  const payloadHash = createHash('sha256').update(JSON.stringify({ kind: input.kind, rows: input.rows })).digest('hex');
  if (!pool) throw fail('Database is not configured.', 503);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const actor=(await client.query('SELECT r."RoleCode" FROM "Users" u JOIN "Roles" r ON r."RoleID"=u."RoleID" WHERE u."UserID"=$1 AND u."Status"=\'ACTIVE\'',[actorId])).rows[0];
    if(!actor || !['ADMIN','ACADEMIC'].includes(actor.RoleCode))throw fail('This role cannot import the requested account type.',403,'FORBIDDEN');
    await client.query("SELECT pg_advisory_xact_lock(hashtext('academic-calendar'))");
    // Serialize identity checks and recruitment writes, including repeated batches in one intake.
    await client.query("SELECT pg_advisory_xact_lock(hashtext('account-provisioning'))");
    const old = await client.query('SELECT * FROM "AccountImportBatches" WHERE "IdempotencyKey"=$1', [input.idempotencyKey]);
    if (old.rows.length) {
      if (old.rows[0].PayloadHash !== payloadHash || old.rows[0].ImportedBy !== actorId) throw fail('Idempotency key already used for a different import.', 409);
      const academicImportId=input.kind==='STUDENT' ? (await client.query('SELECT "BatchID" FROM "AcademicImportBatches" WHERE "SourceAccountBatchID"=$1',[old.rows[0].BatchID])).rows[0]?.BatchID : undefined;
      const result={ ...old.rows[0].Summary, batchId: old.rows[0].BatchID, academicImportId, replayed: true };
      if(onCommit&&!preview){await onCommit(client,result);await client.query('COMMIT');}else await client.query('ROLLBACK');
      return result;
    }
    const plans: { row: typeof input.rows[number]; userId?: number; entityId?: number; action: string }[] = [];
    for (let i = 0; i < input.rows.length; i++) {
      const row = input.rows[i];
      const existing = await client.query('SELECT s."StudentID" AS entity_id,u."UserID",u."Email",r."RoleCode" FROM "Students" s JOIN "Users" u ON u."UserID"=s."UserID" JOIN "Roles" r ON r."RoleID"=u."RoleID" WHERE upper(s."StudentCode")=$1', [row.code]);
      const match = existing.rows.find(r => r.Email?.toLowerCase() === row.email) ?? existing.rows[0];
      if (match?.UserID && (match.RoleCode !== input.kind || match.Email.toLowerCase() !== row.email)) throw fail(`Row ${i + 1}: account email/role does not match existing identity.`, 409, 'IDENTITY_CONFLICT');
      const email = await client.query('SELECT "UserID" FROM "Users" WHERE lower("Email")=$1', [row.email]);
      if (email.rows.length && email.rows[0].UserID !== match?.UserID) throw fail(`Row ${i + 1}: email belongs to another account.`, 409, 'IDENTITY_CONFLICT');
      const username = `${input.kind.toLowerCase()}_${row.code}`;
      if (!match?.UserID && (await client.query('SELECT 1 FROM "Users" WHERE "Username"=$1', [username])).rowCount) throw fail(`Row ${i + 1}: username already exists.`, 409);
      plans.push({ row, userId: match?.UserID, entityId: match?.entity_id, action: match?.UserID ? 'UPDATED' : 'CREATED' });
    }
    const summary = { created: plans.filter(p => p.action === 'CREATED').length, updated: plans.filter(p => p.action === 'UPDATED').length, total: plans.length };
    if (summary.created && !preview) {
      emailKey();
      const url = new URL(process.env.FRONTEND_LOGIN_URL ?? '');
      if (!['http:', 'https:'].includes(url.protocol)) throw fail('Configure FRONTEND_LOGIN_URL.', 503);
    }
    const batch = await client.query('INSERT INTO "AccountImportBatches" ("IdempotencyKey","PayloadHash","Kind","OJTSemesterID","ImportedBy","Summary","RecruitmentWindowID") VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING "BatchID"', [input.idempotencyKey, payloadHash, input.kind, input.semesterId ?? null, actorId, summary, null]);
    const batchId = batch.rows[0].BatchID;
    for (let i = 0; i < plans.length; i++) {
      const p = plans[i], row = p.row;
      if (!p.userId) {
        const password = randomBytes(18).toString('base64url');
        const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
        const hash = await bcrypt.hash(password, 12);
        const user = await client.query('INSERT INTO "Users" ("Username","Email","FullName","PasswordHash","RoleID","MustChangePassword","TemporaryPasswordExpiresAt") SELECT $1,$2,$3,$4,"RoleID",true,$5 FROM "Roles" WHERE "RoleCode"=$6 RETURNING "UserID"', [`${input.kind.toLowerCase()}_${row.code}`, row.email, row.fullName, hash, expiresAt, input.kind]);
        if (!user.rows.length) throw fail('Required role is missing.', 503);
        p.userId = user.rows[0].UserID;
        if (!preview) {
        const payload = encryptEmail({ subject: 'Tài khoản hệ thống OJT', text: `Xin chào ${row.fullName},\nEmail đăng nhập: ${row.email}\nTên tài khoản: ${input.kind.toLowerCase()}_${row.code}\nMật khẩu tạm: ${password}\nĐăng nhập: ${process.env.FRONTEND_LOGIN_URL}\nMật khẩu tạm hết hạn: ${expiresAt.toISOString()}. Bạn phải đổi mật khẩu sau khi đăng nhập.` });
        await client.query('INSERT INTO "EmailOutbox" ("UserID","Recipient","EncryptedPayload","ExpiresAt") VALUES ($1,$2,$3,$4)', [p.userId, row.email, payload, expiresAt]);
        }
      }
      if (input.kind === 'STUDENT') {
        if (!p.entityId) p.entityId = (await client.query('INSERT INTO "Students" ("UserID","StudentCode","Status") VALUES ($1,$2,\'ACTIVE\') RETURNING "StudentID"', [p.userId, row.code])).rows[0].StudentID;
        else await client.query('UPDATE "Users" SET "FullName"=$2,"UpdatedAt"=now() WHERE "UserID"=$1', [p.userId, row.fullName]);
        await importAcademicProfile(client,p.entityId!,row.academic,actorId);
      }
      await client.query('INSERT INTO "AccountImportRows" ("BatchID","RowNumber","SourceCode","UserID","Action") VALUES ($1,$2,$3,$4,$5)', [batchId, i + 1, row.code, p.userId, p.action]);
    }
    let academicImportId:string|undefined;
    if (preview) {
      await client.query('ROLLBACK');
      return {...summary,preview:true,rows:plans.map((p,i)=>({rowNumber:i+1,code:p.row.code,action:p.action}))};
    }
    if (input.kind==='STUDENT') academicImportId=await saveHistory(client,{kind:'STUDENT',key:input.idempotencyKey,hash:payloadHash,status:'COMPLETED',summary,sourceAccountBatchId:batchId},actorId,plans.map(p=>({raw:safeRow(p.row,'STUDENT'),normalized:{userId:p.userId,action:p.action},status:'IMPORTED'})));
    const result={ ...summary, batchId, academicImportId, replayed: false };
    if(onCommit)await onCommit(client,result);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    if ((error as { code?: string }).code === '23505') throw fail('Duplicate account, import or recruitment code.', 409, 'IMPORT_CONFLICT');
    throw error;
  } finally { client.release(); }
}
