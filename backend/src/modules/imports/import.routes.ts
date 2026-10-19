import multer from 'multer';
import { parseCompanySheet, importCompanies } from '../recruitment/company-import.service';
import { Router } from 'express';
import { archiveRecruitment } from '../../jobs/provisioning';
import { authenticate } from '../../middleware/authenticate';
import { authorizeRoles } from '../../middleware/authorize';
import { importAccounts } from './import.service';
import { query } from '../../config/database';
import { fail } from './import.validation';
const router = Router();
router.use(authenticate, authorizeRoles('ADMIN', 'ACADEMIC', 'OJT_COORD'));
const sheetUpload = multer({storage: multer.memoryStorage(), limits: {fileSize: 8 * 1024 * 1024, files: 1, fields: 12}});
for (const path of ['/preview', '/commit']) {
  router.post(path, sheetUpload.single('file'), async (req, res, next) => {
    try {
      const role = req.user!.roleCode;
      const kind = req.body?.kind;
      if (!((['ADMIN', 'ACADEMIC'].includes(role!) && kind === 'STUDENT') ||
        (role === 'OJT_COORD' && kind === 'ENTERPRISE'))) {
        throw fail('Only QHDN can import enterprises; academic staff import students.', 403, 'FORBIDDEN');
      }
      if (kind === 'ENTERPRISE') {
        let input;
        try {
          input = await parseCompanySheet(req.body, req.file);
        } catch (error: any) {
          if (error.statusCode) throw error;
          throw fail('Invalid sheet or column mapping.', 400, 'INVALID_SHEET');
        }
        const data = await importCompanies(
          input,
          {...req.user!, roleCode: req.user!.roleCode!},
          path === '/preview'
        );
        res.status(data.rejectedBatch ? 422 : 200).json({success: !data.rejectedBatch, ...data});
      } else {
        res.json({success: true, ...await importAccounts(req.body, req.user!.userId, path === '/preview')});
      }
    } catch (error) { next(error); }
  });
}
router.get('/emails', authorizeRoles('ADMIN'), async (_req, res, next) => {
  try {
    const result = await query(`SELECT e."EmailID",e."UserID",e."Recipient",e."Status",e."Attempts",e."SentAt",e."ExpiresAt",e."LastError",count(*) OVER()::int AS "totalCount",
      CASE WHEN u."UserID" IS NULL THEN NULL ELSE jsonb_build_object('id',u."UserID",'fullName',u."FullName",'email',u."Email") END AS "user",
      COALESCE(e."Status"='FAILED' AND e."ExpiresAt">now() AND e."EncryptedPayload" IS NOT NULL AND u."MustChangePassword" AND u."TemporaryPasswordExpiresAt">now() AND u."Status"='ACTIVE' AND lower(u."Email")=lower(e."Recipient"),false) AS "canRetry"
      FROM "EmailOutbox" e LEFT JOIN "Users" u ON u."UserID"=e."UserID" ORDER BY e."EmailID" DESC LIMIT 100`);
    const total=Number(result.rows[0]?.totalCount??0);
    res.json({ success: true, emails: result.rows.map(({totalCount,...row})=>row),total,limit:100,hasMore:total>100 });
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
