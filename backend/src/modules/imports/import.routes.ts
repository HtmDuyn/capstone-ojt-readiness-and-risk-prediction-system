import { Router } from 'express';
import { archiveRecruitment } from '../../jobs/provisioning';
import { authenticate } from '../../middleware/authenticate';
import { authorizeRoles } from '../../middleware/authorize';
import { importAccounts } from './import.service';
import { query } from '../../config/database';
import { fail } from './import.validation';
const router = Router();
router.use(authenticate, authorizeRoles('ADMIN', 'ACADEMIC', 'OJT_COORD'));
for (const path of ['/preview', '/commit']) {
  router.post(path, async (req, res, next) => {
    try {
      const role = req.user!.roleCode;
      if (role !== 'ADMIN' && !((role === 'ACADEMIC' && req.body?.kind === 'STUDENT') || (role === 'OJT_COORD' && req.body?.kind === 'ENTERPRISE'))) throw fail('This role cannot import this account type.', 403, 'FORBIDDEN');
      res.json({ success: true, ...await importAccounts(req.body, req.user!.userId, path === '/preview') });
    } catch (error) { next(error); }
  });
}
router.get('/emails', authorizeRoles('ADMIN'), async (_req, res, next) => {
  try {
    const result = await query('SELECT "EmailID","UserID","Recipient","Status","Attempts","SentAt","ExpiresAt","LastError" FROM "EmailOutbox" ORDER BY "EmailID" DESC LIMIT 100');
    res.json({ success: true, emails: result.rows });
  } catch (error) { next(error); }
});
router.post('/emails/:emailId/retry', authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const id = Number(req.params.emailId);
    if (!Number.isSafeInteger(id) || id <= 0) throw fail('Invalid email ID.');
    const result = await query(`UPDATE "EmailOutbox" e SET "Status"='PENDING',"Attempts"=0,"NextAttemptAt"=now(),"LastError"=NULL
      WHERE e."EmailID"=$1 AND e."Status"='FAILED' AND e."ExpiresAt">now() AND e."EncryptedPayload" IS NOT NULL
      AND EXISTS (SELECT 1 FROM "Users" u WHERE u."UserID"=e."UserID" AND u."MustChangePassword" AND u."TemporaryPasswordExpiresAt">now() AND u."Status"='ACTIVE' AND lower(u."Email")=lower(e."Recipient")) RETURNING "EmailID"`, [id]);
    if (!result.rowCount) throw fail('Only unexpired failed emails can be retried.', 409, 'EMAIL_NOT_RETRYABLE');
    res.json({ success: true, emailId: id });
  } catch (error) { next(error); }
});
router.post('/archive', authorizeRoles('ADMIN', 'OJT_COORD'), async (_req, res, next) => {
  try { res.json({ success: true, archivedCount: await archiveRecruitment() }); }
  catch (error) { next(error); }
});
export default router;
