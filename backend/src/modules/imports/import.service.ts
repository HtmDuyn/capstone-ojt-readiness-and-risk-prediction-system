import { assessOjtStudents } from '../eligibility/automatic-assessment.service';
import { latestEffectiveOjtCondition } from '../eligibility/ojt-policy.service';
import { logger } from '../../config/logger';
import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { pool } from '../../config/database';
import { encryptEmail, emailKey } from './email.crypto';
import { fail, validateImport } from './import.validation';
import { assignEnterpriseCodes } from './enterprise-code';
import { saveHistory, recordRejected, safeRow } from '../students/academic-import.service';

import { importAcademicProfile } from '../students/complete-import.service';
import { audit } from '../academic/academic.repository';
import type { PoolClient } from 'pg';
import { deliverAccountEmailsNow } from './account-email-delivery.service';
import { accountEmail } from '../../shared/account-email';
import { frontendLoginUrl } from '../../config/frontend';
export type ImportCommitHook=(client:PoolClient,result:Record<string,any>)=>Promise<void>;

export async function importAccounts(body: unknown, actorId: number, preview = false,onCommit?:ImportCommitHook) {
  let result;
  try {
    result = await performAccountImport(body,actorId,preview,onCommit);
  }
  catch(error:any) {
    if (!preview && (body as any)?.kind==='STUDENT') {
      try { error.importBatchId=await recordRejected(body,actorId,'STUDENT',error); }
      catch { console.error('Could not persist rejected student import history.'); }
    }
    throw error;
  }
  if (!preview && result.created > 0) {
    const emailDelivery = await deliverAccountEmailsNow({ batchId: result.batchId });
    return { ...result, emailDelivery };
  }
  return result;
}
async function performAccountImport(body: unknown, actorId: number, preview = false,onCommit?:ImportCommitHook) {
  const input = validateImport(body);
  const payloadHash = createHash('sha256').update(JSON.stringify({ kind: input.kind, windowId: input.windowId, rows: input.rows })).digest('hex');
  if (!pool) throw fail('Database is not configured.', 503);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const actor=(await client.query('SELECT r."RoleCode" FROM "Users" u JOIN "Roles" r ON r."RoleID"=u."RoleID" WHERE u."UserID"=$1 AND u."Status"=\'ACTIVE\'',[actorId])).rows[0];
    if(!actor || !(input.kind==='ENTERPRISE'?actor.RoleCode==='OJT_COORD':['ADMIN','ACADEMIC'].includes(actor.RoleCode)))throw fail('This role cannot import the requested account type.',403,'FORBIDDEN');
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
    if (input.kind === 'ENTERPRISE') await assignEnterpriseCodes(client, input.rows);
    const plans: { row: typeof input.rows[number]; userId?: number; entityId?: number; previousCode?: string; action: string }[] = [];
    for (let i = 0; i < input.rows.length; i++) {
      const row = input.rows[i];
      if (input.kind === 'STUDENT') {
        // Email identifies the account; a changed student code must not provision it again.
        const identities = (await client.query(`SELECT s."StudentID" AS entity_id,s."StudentCode",s."DeletedAt",u."UserID",u."Email",r."RoleCode"
          FROM "Users" u JOIN "Roles" r ON r."RoleID"=u."RoleID" LEFT JOIN "Students" s ON s."UserID"=u."UserID"
          WHERE upper(s."StudentCode")=$1 OR lower(u."Email")=$2`, [row.code,row.email])).rows;
        if (new Set(identities.map(identity=>identity.UserID)).size > 1)
          throw fail(`Row ${i+1}: student code and email identify different accounts.`,409,'IDENTITY_CONFLICT');
        const match=identities[0];
        if (match && (match.RoleCode!=='STUDENT' || match.Email.toLowerCase()!==row.email || match.DeletedAt))
          throw fail(`Row ${i+1}: existing account is not a matching student identity.`,409,'IDENTITY_CONFLICT');
        if (!match && (await client.query('SELECT 1 FROM "Users" WHERE "Username"=$1',[`student_${row.code}`])).rowCount)
          throw fail(`Row ${i+1}: username already exists.`,409,'IDENTITY_CONFLICT');
        plans.push({row,userId:match?.UserID,entityId:match?.entity_id,previousCode:match?.StudentCode,action:match?'UPDATED':'CREATED'});
        continue;
      }
      const existing = await client.query('SELECT e."EnterpriseID" AS entity_id,e."EnterpriseCode",e."DeletedAt",e."Status" AS "EnterpriseStatus",u."UserID",u."Email",u."Status" AS "UserStatus",r."RoleCode" FROM "Enterprises" e LEFT JOIN "EnterpriseUsers" eu ON eu."EnterpriseID"=e."EnterpriseID" LEFT JOIN "Users" u ON u."UserID"=eu."UserID" LEFT JOIN "Roles" r ON r."RoleID"=u."RoleID" WHERE upper(e."EnterpriseCode")=$1 OR lower(u."Email")=$2 ORDER BY u."UserID"', [row.code,row.email]);
      if (input.kind === 'ENTERPRISE' && new Set(existing.rows.map(r=>r.entity_id)).size>1) throw fail(`Row ${i+1}: enterprise code and email identify different enterprises.`,409,'IDENTITY_CONFLICT');
      const match = existing.rows.find(r => r.Email?.toLowerCase() === row.email) ?? existing.rows[0];
      if (input.kind === 'ENTERPRISE' && match) {
        if (!match.UserID || match.RoleCode !== 'ENTERPRISE' || match.DeletedAt || match.EnterpriseStatus!=='ACTIVE' || match.UserStatus!=='ACTIVE') throw fail(`Row ${i + 1}: existing enterprise has no active enterprise account.`,409,'IDENTITY_CONFLICT');
        if (match.Email.toLowerCase()!==row.email) throw fail(`Row ${i+1}: enterprise code is already linked to another email.`,409,'IDENTITY_CONFLICT');
        throw fail(`Row ${i+1}: enterprise account already exists; existing profiles and credentials are preserved.`,409,'ENTERPRISE_ACCOUNT_EXISTS');
      }
      if (match?.UserID && (match.RoleCode !== input.kind || match.Email.toLowerCase() !== row.email)) throw fail(`Row ${i + 1}: account email/role does not match existing identity.`, 409, 'IDENTITY_CONFLICT');
      const email = await client.query('SELECT "UserID" FROM "Users" WHERE lower("Email")=$1', [row.email]);
      if (email.rows.length && email.rows[0].UserID !== match?.UserID) throw fail(`Row ${i + 1}: email belongs to another account.`, 409, 'IDENTITY_CONFLICT');
      const username = `${input.kind.toLowerCase()}_${row.code}`;
      if (!match?.UserID && (await client.query('SELECT 1 FROM "Users" WHERE "Username"=$1', [username])).rowCount) throw fail(`Row ${i + 1}: username already exists.`, 409);
      plans.push({ row, userId: match?.UserID, entityId: match?.entity_id, action: match?.UserID ? 'UPDATED' : 'CREATED' });
    }
    if(input.kind==='ENTERPRISE' && new Set(plans.map(p=>p.entityId??p.row.email)).size!==plans.length)throw fail('Each enterprise may appear only once per batch; combine its positions.',409,'IDENTITY_CONFLICT');
    const summary = { created: plans.filter(p => p.action === 'CREATED').length, updated: plans.filter(p => p.action === 'UPDATED').length, total: plans.length };
    if (preview && input.kind === 'ENTERPRISE') {
      await client.query('ROLLBACK');
      return { ...summary, preview: true, rows: plans.map((p, i) => ({ rowNumber: i + 1, code: p.row.code, action: p.action })) };
    }
    if (summary.created && !preview) {
      emailKey();
      frontendLoginUrl();
    }
    const batch = await client.query('INSERT INTO "AccountImportBatches" ("IdempotencyKey","PayloadHash","Kind","OJTSemesterID","ImportedBy","Summary","RecruitmentWindowID") VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING "BatchID"', [input.idempotencyKey, payloadHash, input.kind, input.semesterId ?? null, actorId, summary, input.windowId ?? null]);
    const batchId = batch.rows[0].BatchID;
    // Preview writes are rolled back. Reuse one valid hash instead of running
    // the expensive password KDF for every account that will not be kept.
    const previewPasswordHash = preview && plans.some(p => !p.userId) ? await bcrypt.hash(randomBytes(18).toString('base64url'), 12) : undefined;
    for (let i = 0; i < plans.length; i++) {
      const p = plans[i], row = p.row;
      if (!p.userId) {
        const password = preview ? '' : randomBytes(18).toString('base64url');
        const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
        const hash = previewPasswordHash ?? await bcrypt.hash(password, 12);
        const user = await client.query('INSERT INTO "Users" ("Username","Email","FullName","PasswordHash","RoleID","MustChangePassword","TemporaryPasswordExpiresAt") SELECT $1,$2,$3,$4,"RoleID",true,$5 FROM "Roles" WHERE "RoleCode"=$6 RETURNING "UserID"', [`${input.kind.toLowerCase()}_${row.code}`, row.email, row.fullName, hash, expiresAt, input.kind]);
        if (!user.rows.length) throw fail('Required role is missing.', 503);
        p.userId = user.rows[0].UserID;
        if (!preview) {
        const payload = encryptEmail(accountEmail({ fullName: row.fullName, email: row.email,
          username: `${input.kind.toLowerCase()}_${row.code}`, roleCode: input.kind, code: row.code,
          companyName: row.name, temporary: { password, expiresAt } }));
        await client.query('INSERT INTO "EmailOutbox" ("UserID","Recipient","EncryptedPayload","ExpiresAt") VALUES ($1,$2,$3,$4)', [p.userId, row.email, payload, expiresAt]);
        await client.query(`INSERT INTO "Notifications" ("UserID","Title","Content","Channel","RelatedEntityType","RelatedEntityID","SentAt")
          VALUES ($1,'Tài khoản hệ thống OJT đã được tạo',$2,'IN_APP','ACCOUNT_CREATED',$1,now())`,
          [p.userId, 'Thông tin đăng nhập đã được xếp hàng gửi đến email của bạn. Vui lòng đổi mật khẩu tạm sau khi đăng nhập.']);
        }
      }
      if (input.kind === 'STUDENT') {
        if (!p.entityId) p.entityId = (await client.query('INSERT INTO "Students" ("UserID","StudentCode","Status") VALUES ($1,$2,\'ACTIVE\') RETURNING "StudentID"', [p.userId, row.code])).rows[0].StudentID;
        else if (p.previousCode !== row.code) {
          await client.query('UPDATE "Students" SET "StudentCode"=$2 WHERE "StudentID"=$1',[p.entityId,row.code]);
          await audit(client,actorId,'Students',p.entityId,'IMPORT_UPDATE_CODE',{studentCode:p.previousCode},{studentCode:row.code},'Student import matched the existing email.');
        }
        await client.query('UPDATE "Users" SET "FullName"=$2,"UpdatedAt"=now() WHERE "UserID"=$1', [p.userId, row.fullName]);
        await importAcademicProfile(client,p.entityId!,row.academic,actorId);
      } else {
        if (!p.entityId) {
          const ent = await client.query('INSERT INTO "Enterprises" ("EnterpriseCode","Name","Address","ContactEmail","ContactPersonName","Status") VALUES ($1,$2,$3,$4,$5,\'ACTIVE\') RETURNING "EnterpriseID"', [row.code, row.name, row.address ?? null, row.email, row.fullName]);
          p.entityId = ent.rows[0].EnterpriseID;
        }
        // Provision only the enterprise identity; recruitment is managed by the enterprise.
        await client.query('INSERT INTO "EnterpriseUsers" ("UserID","EnterpriseID","PositionTitle") VALUES ($1,$2,\'HR\') ON CONFLICT ("UserID") DO NOTHING', [p.userId, p.entityId]);
      }
      await client.query('INSERT INTO "AccountImportRows" ("BatchID","RowNumber","SourceCode","UserID","Action") VALUES ($1,$2,$3,$4,$5)', [batchId, i + 1, row.code, p.userId, p.action]);
    }
    let academicImportId:string|undefined;
    // Deferred history/prerequisite triggers must run for previews as well as commits.
    // All profiles and attempts are present now, so file row order does not matter.
    if (input.kind === 'STUDENT') await client.query('SET CONSTRAINTS ALL IMMEDIATE');
    if (preview) {
      await client.query('ROLLBACK');
      return {...summary,preview:true,rows:plans.map((p,i)=>({rowNumber:i+1,code:p.row.code,action:p.action}))};
    }
    if (input.kind==='STUDENT') academicImportId=await saveHistory(client,{kind:'STUDENT',key:input.idempotencyKey,hash:payloadHash,status:'COMPLETED',summary,sourceAccountBatchId:batchId},actorId,plans.map(p=>({raw:safeRow(p.row,'STUDENT'),normalized:{userId:p.userId,action:p.action},status:'IMPORTED'})));
    const ojtAssessment = input.kind === 'STUDENT'
      ? await assessImportedStudents(client, plans.map(plan => plan.entityId!), actorId, batchId) : undefined;
    const completedSummary = ojtAssessment ? { ...summary, ojtAssessment } : summary;
    if (ojtAssessment) await client.query('UPDATE "AccountImportBatches" SET "Summary"=$2 WHERE "BatchID"=$1',
      [batchId, JSON.stringify(completedSummary)]);
    const result={ ...completedSummary, batchId, academicImportId, replayed: false };
    if(onCommit)await onCommit(client,result);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    if ((error as { code?: string }).code === '23505') throw fail('Duplicate account, import or recruitment code.', 409, 'IMPORT_CONFLICT');
    if ((error as { code?: string }).code === '23514') {
      if ((body as any)?.kind === 'ENTERPRISE') {
        if ((error as { constraint?: string }).constraint === 'AccountImportBatches_check')
          throw fail('Database chưa cập nhật luồng tạo tài khoản doanh nghiệp. Cần chạy khối ENTERPRISE ACCOUNT IMPORT V2 trong backend/DB.',503,'ENTERPRISE_ACCOUNT_MIGRATION_REQUIRED');
        throw fail('Thông tin tài khoản doanh nghiệp không đáp ứng ràng buộc dữ liệu.',422,'INVALID_ENTERPRISE_ACCOUNT');
      }
      throw fail((error as Error).message, 422, 'INVALID_STUDY_HISTORY');
    }
    throw error;
  } finally { client.release(); }
}

async function assessImportedStudents(client: PoolClient, studentIds: number[], actorId: number, batchId: string | number) {
  // The import has passed deferred validation. An assessment error must not
  // invalidate the imported transcript or roll back account provisioning.
  await client.query('SAVEPOINT import_ojt_assessment');
  try {
    const condition = await latestEffectiveOjtCondition(client);
    const checkedCount = condition
      ? await assessOjtStudents(client, { studentIds }, condition, actorId, `import-ojt:${batchId}`) : 0;
    const status = condition ? 'COMPLETED' : 'NO_EFFECTIVE_CONDITION';
    await client.query('RELEASE SAVEPOINT import_ojt_assessment');
    return { status, checkedCount };
  } catch (error) {
    await client.query('ROLLBACK TO SAVEPOINT import_ojt_assessment');
    await client.query('RELEASE SAVEPOINT import_ojt_assessment');
    const failure = error as { code?: string; errorCode?: string };
    logger.error('OJT assessment could not finish for the student import.', { batchId, code: failure?.code ?? failure?.errorCode });
    return { status: 'FAILED', checkedCount: 0 };
  }
}
