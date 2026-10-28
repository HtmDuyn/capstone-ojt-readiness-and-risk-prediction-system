import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { pool } from '../../config/database';
import { encryptEmail, emailKey } from '../imports/email.crypto';
import { fail } from '../imports/import.validation';
import { enterpriseImportInput } from './enterprise-import-input';

// Dedicated QHDN path: academic/student import services retain their contracts.
export async function importEnterprises(body: unknown, actorId: number, preview = false, file?: Express.Multer.File) {
  const input = await enterpriseImportInput(body, file);
  const payloadHash = createHash('sha256').update(JSON.stringify({ kind: input.kind, ojtSemesterId: input.semesterId, rows: input.rows })).digest('hex');
  if (!pool) throw fail('Database is not configured.', 503);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const actor = (await client.query(`SELECT r."RoleCode" FROM "Users" u JOIN "Roles" r ON r."RoleID"=u."RoleID" WHERE u."UserID"=$1 AND u."Status"='ACTIVE'`, [actorId])).rows[0];
    if (actor?.RoleCode !== 'OJT_COORD') throw fail('Only QHDN can import enterprises.', 403, 'FORBIDDEN');
    await client.query("SELECT pg_advisory_xact_lock(hashtext('academic-calendar'))");
    await client.query("SELECT pg_advisory_xact_lock(hashtext('account-provisioning'))");
    const old = (await client.query('SELECT * FROM "AccountImportBatches" WHERE "IdempotencyKey"=$1', [input.idempotencyKey])).rows[0];
    if (old) {
      if (old.PayloadHash !== payloadHash || old.ImportedBy !== actorId) throw fail('Idempotency key belongs to a different request.', 409, 'IDEMPOTENCY_CONFLICT');
      const posts = (await client.query('SELECT "Status" FROM "RecruitmentPosts" WHERE "PostID"=ANY($1::int[])', [old.Summary.postIds ?? []])).rows;
      const positionIds = (old.Summary.rows ?? []).flatMap((row: any) => (row.positions ?? []).map((position: any) => position.positionId));
      const positions = (await client.query('SELECT "PositionID","Status" FROM "InternshipPositions" WHERE "PositionID"=ANY($1::int[])', [positionIds])).rows;
      const states = [...new Set(posts.map(post => post.Status))];
      const rows = old.Summary.rows?.map((row: any) => {
        const current = row.positions.map((position: any) => ({ ...position, status: positions.find(value => value.PositionID === position.positionId)?.Status ?? position.status }));
        const statuses = [...new Set(current.map((position: any) => position.status))];
        return { ...row, positions: current, positionStatus: statuses.length === 1 ? statuses[0] : 'MIXED' };
      });
      await client.query('ROLLBACK');
      return { ...old.Summary, ...(rows ? { rows } : {}), ...(states.length ? { publicationStatus: states.length === 1 ? states[0] : 'MIXED' } : {}), batchId: old.BatchID, replayed: true, ...(preview ? { preview: true } : {}) };
    }
    const term = (await client.query(`SELECT t.*,p."Kind",now() AS now,
      ((now() AT TIME ZONE 'Asia/Ho_Chi_Minh')+interval '5 months') AT TIME ZONE 'Asia/Ho_Chi_Minh' AS "expiresAt",
      COALESCE((SELECT max(w."EndsAt") FROM "OJTRegistrationWindows" w WHERE w."OJTSemesterID"=t."OJTSemesterID"),
        ((COALESCE(t."RegEndDate",t."EndDate")+1)::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh')) AS deadline
      FROM "OJTSemesters" t JOIN "AcademicPeriods" p ON p."AcademicPeriodID"=t."AcademicPeriodID" WHERE t."OJTSemesterID"=$1 FOR UPDATE OF t`, [input.semesterId])).rows[0];
    if (!term) throw fail('The selected OJT semester does not exist or has no linked academic period.', 404, 'OJT_SEMESTER_NOT_FOUND');
    if (term.Kind !== 'SEMESTER' || ['CLOSED', 'CANCELLED', 'ARCHIVED'].includes(String(term.Status).toUpperCase())) throw fail('The selected semester cannot receive recruitment data.', 409, 'OJT_SEMESTER_CLOSED');
    if (!term.deadline || new Date(term.deadline) <= new Date(term.now)) throw fail('Configure a future registration or semester deadline before importing.', 409, 'RECRUITMENT_DEADLINE_REQUIRED');
    const deadlineAt = new Date(Math.min(new Date(term.deadline).getTime(), new Date(term.expiresAt).getTime())).toISOString();
    const plans: { row: typeof input.rows[number]; userId?: number; enterpriseId?: number; action: string }[] = [];
    for (const row of input.rows) {
      const existing = (await client.query(`SELECT e."EnterpriseID",e."EnterpriseCode",e."DeletedAt",e."Status" AS "EnterpriseStatus",u."UserID",u."Email",u."Status" AS "UserStatus",r."RoleCode"
        FROM "Enterprises" e LEFT JOIN "EnterpriseUsers" eu ON eu."EnterpriseID"=e."EnterpriseID" LEFT JOIN "Users" u ON u."UserID"=eu."UserID" LEFT JOIN "Roles" r ON r."RoleID"=u."RoleID"
        WHERE upper(e."EnterpriseCode")=$1 OR lower(u."Email")=$2 ORDER BY u."UserID"`, [row.code, row.email])).rows;
      if (new Set(existing.map(value => value.EnterpriseID)).size > 1) throw fail('Enterprise code and email identify different enterprises.', 409, 'IDENTITY_CONFLICT');
      const match = existing.find(value => value.Email?.toLowerCase() === row.email) ?? existing[0];
      if (match && (!match.UserID || match.RoleCode !== 'ENTERPRISE' || match.DeletedAt || match.EnterpriseStatus !== 'ACTIVE' || match.UserStatus !== 'ACTIVE' || match.Email.toLowerCase() !== row.email || match.EnterpriseCode.toUpperCase() !== row.code)) throw fail('Existing enterprise identity is inactive or conflicts with the supplied code/email.', 409, 'IDENTITY_CONFLICT');
      if (match && (await client.query('SELECT 1 FROM "InternshipPositions" WHERE "EnterpriseID"=$1 AND "OJTSemesterID"=$2 AND "RecruitmentCode"=ANY($3::text[])', [match.EnterpriseID, input.semesterId, row.positions!.map(position => position.code)])).rowCount) throw fail('A position code already exists for this enterprise and semester.', 409, 'RECRUITMENT_CODE_EXISTS');
      if ((await client.query('SELECT 1 FROM "Users" WHERE lower("Email")=$1 AND ($2::int IS NULL OR "UserID"<>$2)', [row.email, match?.UserID ?? null])).rowCount) throw fail('Email belongs to another account.', 409, 'IDENTITY_CONFLICT');
      if (!match && (await client.query('SELECT 1 FROM "Users" WHERE "Username"=$1', [`enterprise_${row.code}`])).rowCount) throw fail('Enterprise username already exists.', 409, 'IDENTITY_CONFLICT');
      plans.push({ row, userId: match?.UserID, enterpriseId: match?.EnterpriseID, action: match ? 'UPDATED' : 'CREATED' });
    }
    if (new Set(plans.map(plan => plan.enterpriseId ?? plan.row.email)).size !== plans.length) throw fail('Combine all positions of an enterprise into one identity.', 409, 'IDENTITY_CONFLICT');
    // The existing DB has one ENTERPRISE account batch per semester. Preserve it.
    if ((await client.query('SELECT 1 FROM "AccountImportBatches" WHERE "Kind"=\'ENTERPRISE\' AND "OJTSemesterID"=$1', [input.semesterId])).rowCount) throw fail('This semester already has an enterprise import. Replay its original key or select another semester.', 409, 'SEMESTER_ALREADY_IMPORTED');
    const rows = plans.map((plan, index) => ({ rowNumber: index + 1, code: plan.row.code, action: plan.action,
      accountStatus: plan.userId ? 'REUSED' : 'CREATED', recruitmentStatus: 'POSITIONS_ADDED', positionStatus: 'OPEN',
      positionCount: plan.row.positions!.length, enterpriseId: plan.enterpriseId ?? null,
      positions: plan.row.positions!.map(position => ({ code: position.code, capacity: position.capacity, status: 'OPEN', positionId: null as number | null })),
    }));
    const summary = { created: plans.filter(plan => plan.action === 'CREATED').length, updated: plans.filter(plan => plan.action === 'UPDATED').length,
      total: plans.length, positionCount: input.rows.reduce((sum, row) => sum + row.positions!.length, 0), ojtSemesterId: input.semesterId,
      importedAt: new Date(term.now).toISOString(), expiresAt: new Date(term.expiresAt).toISOString(), retentionMonths: 5,
      deadlineAt, publicationStatus: 'PUBLISHED', publicationSource: 'QHDN_SEMESTER_IMPORT', postIds: [] as number[], rows };
    if (preview) {
      await client.query('ROLLBACK');
      return { ...summary, preview: true };
    }
    if (summary.created) {
      emailKey();
      let url: URL;
      try { url = new URL(process.env.FRONTEND_LOGIN_URL ?? ''); } catch { throw fail('Configure FRONTEND_LOGIN_URL.', 503); }
      if (!['https:', 'http:'].includes(url.protocol)) throw fail('Configure FRONTEND_LOGIN_URL.', 503);
    }
    const batchId = (await client.query(`INSERT INTO "AccountImportBatches" ("IdempotencyKey","PayloadHash","Kind","OJTSemesterID","ImportedBy","Summary")
      VALUES ($1,$2,'ENTERPRISE',$3,$4,$5) RETURNING "BatchID"`, [input.idempotencyKey, payloadHash, input.semesterId, actorId, summary])).rows[0].BatchID;
    for (const [index, plan] of plans.entries()) {
      const row = plan.row;
      if (!plan.userId) {
        const password = randomBytes(18).toString('base64url');
        const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
        const user = (await client.query(`INSERT INTO "Users" ("Username","Email","FullName","PasswordHash","RoleID","Status","MustChangePassword","TemporaryPasswordExpiresAt")
          SELECT $1,$2,$3,$4,"RoleID",'ACTIVE',true,$5 FROM "Roles" WHERE "RoleCode"='ENTERPRISE' RETURNING "UserID"`,
        [`enterprise_${row.code}`, row.email, row.fullName, await bcrypt.hash(password, 12), expiresAt])).rows[0];
        if (!user) throw fail('Enterprise role is not configured.', 503);
        plan.userId = user.UserID;
        plan.enterpriseId = (await client.query(`INSERT INTO "Enterprises" ("EnterpriseCode","Name","Address","ContactEmail","ContactPersonName","Status")
          VALUES ($1,$2,$3,$4,$5,'ACTIVE') RETURNING "EnterpriseID"`, [row.code, row.name, row.address ?? null, row.email, row.fullName])).rows[0].EnterpriseID;
        await client.query(`INSERT INTO "EnterpriseUsers" ("UserID","EnterpriseID","PositionTitle") VALUES ($1,$2,'HR')`, [plan.userId, plan.enterpriseId]);
        await client.query(`INSERT INTO "EmailOutbox" ("UserID","Recipient","EncryptedPayload","ExpiresAt") VALUES ($1,$2,$3,$4)`,
        [plan.userId, row.email, encryptEmail({ subject: 'Tài khoản hệ thống OJT', text: `Xin chào ${row.fullName},\nEmail đăng nhập: ${row.email}\nMật khẩu tạm: ${password}\nĐăng nhập: ${process.env.FRONTEND_LOGIN_URL}\nMật khẩu tạm hết hạn: ${expiresAt.toISOString()}. Bạn phải đổi mật khẩu sau khi đăng nhập.` }), expiresAt]);
      }
      for (const position of row.positions!) {
        const positionId = (await client.query(`INSERT INTO "InternshipPositions" ("EnterpriseID","OJTSemesterID","RecruitmentCode","Title","Description","Requirements","Capacity","RemainingSlots","Status")
          VALUES ($1,$2,$3,$4,$5,$6,$7,$7,'OPEN') RETURNING "PositionID"`, [plan.enterpriseId, input.semesterId, position.code, position.title, position.description, position.requirements, position.capacity])).rows[0].PositionID;
        const postId = (await client.query(`INSERT INTO "RecruitmentPosts" ("EnterpriseID","OJTSemesterID","Title","Content","Status","CreatedBy","PublishedAt","DeadlineAt","ReviewedBy","ReviewedAt")
          VALUES ($1,$2,$3,$4,'PUBLISHED',$5,now(),$6,$5,now()) RETURNING "PostID"`, [plan.enterpriseId, input.semesterId, position.title, position.description, actorId, deadlineAt])).rows[0].PostID;
        rows[index].positions.find(value => value.code === position.code)!.positionId = positionId;
        summary.postIds.push(postId);
        await client.query('INSERT INTO "RecruitmentPostPositions" ("PostID","PositionID","EnterpriseID","OJTSemesterID") VALUES ($1,$2,$3,$4)', [postId, positionId, plan.enterpriseId, input.semesterId]);
      }
      rows[index].enterpriseId = plan.enterpriseId ?? null;
      await client.query('INSERT INTO "AccountImportRows" ("BatchID","RowNumber","SourceCode","UserID","Action") VALUES ($1,$2,$3,$4,$5)', [batchId, index + 1, row.code, plan.userId, plan.action]);
    }
    await client.query('UPDATE "AccountImportBatches" SET "Summary"=$2 WHERE "BatchID"=$1', [batchId, summary]);
    await client.query('INSERT INTO "AuditLogs" ("UserID","Action","EntityType","EntityID","Detail") VALUES ($1,$2,$3,$4,$5)', [actorId, 'IMPORT_AND_PUBLISH', 'AccountImportBatches', batchId, JSON.stringify({ after: summary })]);
    await client.query('COMMIT');
    return { ...summary, batchId, replayed: false };
  } catch (error) {
    await client.query('ROLLBACK');
    if ((error as { code?: string }).code === '23505') throw fail('Duplicate enterprise, position or import key.', 409, 'IMPORT_CONFLICT');
    throw error;
  } finally { client.release(); }
}
