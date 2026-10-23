import multer from 'multer';
import { parseImportSheet } from './import-sheet.service';
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
      const input = await parseImportSheet(req.body, req.file);
      res.json({success: true, ...await importAccounts(input, req.user!.userId, path === '/preview')});
    } catch (error) { next(error); }
  });
}
router.post('/emails/resend', authorizeRoles('ADMIN'), async (req, res, next) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => key !== 'email') || Object.keys(req.query).length) throw fail('Provide only email in a JSON object body.');
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw fail('A valid email is required.');
    const result = await query(`UPDATE "EmailOutbox" e SET "Status"='PENDING',"Attempts"=0,"NextAttemptAt"=now(),"LastError"=NULL
      WHERE e."EmailID"=(SELECT latest."EmailID" FROM "EmailOutbox" latest WHERE lower(latest."Recipient")=$1 AND latest."Kind"='ACCOUNT' ORDER BY latest."EmailID" DESC LIMIT 1)
      AND e."Status"='FAILED' AND e."ExpiresAt">now() AND e."EncryptedPayload" IS NOT NULL
      AND EXISTS (SELECT 1 FROM "Users" u WHERE u."UserID"=e."UserID" AND u."MustChangePassword" AND u."TemporaryPasswordExpiresAt">now() AND u."Status"='ACTIVE' AND lower(u."Email")=lower(e."Recipient")) RETURNING "EmailID"`, [email]);
    if (!result.rowCount) throw fail('Only unexpired failed emails can be retried.', 409, 'EMAIL_NOT_RETRYABLE');
    res.json({ success: true, emailId: result.rows[0].EmailID, email });
  } catch (error) { next(error); }
});
router.post('/archive', authorizeRoles('ADMIN', 'OJT_COORD'), async (_req, res, next) => {
  try { res.json({ success: true, archivedCount: await archiveRecruitment() }); }
  catch (error) { next(error); }
});
export default router;
