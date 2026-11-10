import { academicTransaction, audit } from '../academic/academic.repository';
import { invalid, inputObject, enumValue, positiveId } from '../students/student.validation';
import { api, staff } from './catalog.service';
import type { Actor } from '../ojt-registration/window.service';

export async function setCompanyAccess(id: number, body: unknown, actor: Actor) {
  staff(actor);
  const companyId = positiveId(id, 'companyId');
  const input = inputObject(body, ['status']);
  const status = enumValue(input.status, ['ACTIVE', 'INACTIVE'], 'status');
  return academicTransaction(async client => {
    const before = (await client.query('SELECT * FROM "Enterprises" WHERE "EnterpriseID"=$1 AND "DeletedAt" IS NULL FOR UPDATE', [companyId])).rows[0];
    if (!before) throw invalid('Không tìm thấy doanh nghiệp.', 404, 'COMPANY_NOT_FOUND');
    if (before.Status === status) return { ...api('companies', before), affectedAccounts: 0, replayed: true };
    const after = (await client.query('UPDATE "Enterprises" SET "Status"=$2 WHERE "EnterpriseID"=$1 RETURNING *', [companyId, status])).rows[0];
    // Keep each user's own ACTIVE / LOCKED / INACTIVE state intact. Company
    // access is checked during login and on every authenticated request.
    // Revoke sessions on either transition so unlocking cannot revive old JWTs.
    const accounts = (await client.query(`UPDATE "Users" u SET "AuthVersion"="AuthVersion"+1,"UpdatedAt"=now()
      WHERE EXISTS (SELECT 1 FROM "EnterpriseUsers" membership WHERE membership."UserID"=u."UserID" AND membership."EnterpriseID"=$1)
        AND EXISTS (SELECT 1 FROM "Roles" role WHERE role."RoleID"=u."RoleID" AND role."RoleCode"='ENTERPRISE')
      RETURNING u."UserID" AS id`, [companyId])).rows;
    await audit(client, actor.userId, 'Enterprises', companyId, status === 'INACTIVE' ? 'DISABLE_ENTERPRISE_ACCESS' : 'ENABLE_ENTERPRISE_ACCESS',
      api('companies', before), { ...api('companies', after), accountIds: accounts.map(account => account.id), actorRole: actor.roleCode });
    return { ...api('companies', after), affectedAccounts: accounts.length };
  });
}
