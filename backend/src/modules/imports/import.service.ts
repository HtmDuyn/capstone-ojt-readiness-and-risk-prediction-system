import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { pool } from '../../config/database';
import { encryptEmail, emailKey } from './email.crypto';
import { fail, validateImport } from './import.validation';
import { saveHistory, recordRejected, safeRow } from '../students/academic-import.service';
import { windowRecord, assertOpen } from '../recruitment/recruitment.repository';
import { importAcademicProfile } from '../students/complete-import.service';
import { audit } from '../academic/academic.repository';
import type { PoolClient } from 'pg';
export type ImportCommitHook=(client:PoolClient,result:Record<string,any>)=>Promise<void>;

export async function importAccounts(body: unknown, actorId: number, preview = false,onCommit?:ImportCommitHook) {
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
    let recruitmentDeadline: Date | undefined;
    if (input.kind === 'ENTERPRISE') {
      const window = await windowRecord(client, input.windowId!); assertOpen(window);
      input.semesterId = window.OJTSemesterID;
      recruitmentDeadline = window.EndsAt;
    }
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
        const conflict=await client.query('SELECT 1 FROM "InternshipPositions" WHERE "EnterpriseID"=$1 AND "OJTSemesterID"=$2 AND "RecruitmentCode"=ANY($3::text[])',[match.entity_id,input.semesterId,row.positions!.map(p=>p.code)]);
        if(conflict.rowCount)throw fail('A recruitment position code already exists; supply a new position code. Existing posts are preserved.',409,'RECRUITMENT_CODE_EXISTS');
        plans.push({row,userId:match.UserID,entityId:match.entity_id,action:'UPDATED'});
        continue;
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
      const url = new URL(process.env.FRONTEND_LOGIN_URL ?? '');
      if (!['http:', 'https:'].includes(url.protocol)) throw fail('Configure FRONTEND_LOGIN_URL.', 503);
    }
    const batch = await client.query('INSERT INTO "AccountImportBatches" ("IdempotencyKey","PayloadHash","Kind","OJTSemesterID","ImportedBy","Summary","RecruitmentWindowID") VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING "BatchID"', [input.idempotencyKey, payloadHash, input.kind, input.semesterId ?? null, actorId, summary, input.windowId ?? null]);
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
        // Existing enterprises retain account and contact data; only this semester's recruitment is added.
        await client.query('INSERT INTO "EnterpriseUsers" ("UserID","EnterpriseID","PositionTitle") VALUES ($1,$2,\'HR\') ON CONFLICT ("UserID") DO NOTHING', [p.userId, p.entityId]);
        for (const position of row.positions!) {
          const pos = await client.query('INSERT INTO "InternshipPositions" ("EnterpriseID","OJTSemesterID","RecruitmentCode","Title","Description","Requirements","Capacity","RemainingSlots","Status") VALUES ($1,$2,$3,$4,$5,$6,$7,$7,\'CLOSED\') RETURNING "PositionID"', [p.entityId, input.semesterId, position.code, position.title, position.description, position.requirements, position.capacity]);
          const post = await client.query('INSERT INTO "RecruitmentPosts" ("EnterpriseID","OJTSemesterID","Title","Content","Status","CreatedBy","WindowID","DeadlineAt") VALUES ($1,$2,$3,$4,\'PENDING_REVIEW\',$5,$6,$7) RETURNING "PostID"', [p.entityId, input.semesterId, position.title, position.description, actorId, input.windowId, recruitmentDeadline]);
          await client.query('INSERT INTO "RecruitmentPostPositions" ("PostID","PositionID","EnterpriseID","OJTSemesterID") VALUES ($1,$2,$3,$4)', [post.rows[0].PostID, pos.rows[0].PositionID, p.entityId, input.semesterId]);
        }
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
    const result={ ...summary, batchId, academicImportId, replayed: false };
    if(onCommit)await onCommit(client,result);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    if ((error as { code?: string }).code === '23505') throw fail('Duplicate account, import or recruitment code.', 409, 'IMPORT_CONFLICT');
    if ((error as { code?: string }).code === '23514') throw fail((error as Error).message, 422, 'INVALID_STUDY_HISTORY');
    throw error;
  } finally { client.release(); }
}
