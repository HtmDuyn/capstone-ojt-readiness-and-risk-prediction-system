import { Router, type Request } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorizeRoles } from '../../middleware/authorize';
import { invalid, positiveId } from '../students/student.validation';
import { taskSubmissions } from './task.service';
import { readTaskAttachment } from './task-attachment.service';

const router = Router();
const actor = (req: Request) => ({ userId: req.user!.userId, roleCode: req.user!.roleCode! });
const readers = [authenticate, authorizeRoles('STUDENT','ENTERPRISE','OJT_COORD','ADMIN')];
router.get('/internship-tasks/:id/submissions', ...readers, async (req, res, next) => {
  try { res.json({ success: true, data: await taskSubmissions(positiveId(req.params.id), req.query, actor(req)) }); }
  catch (error) { next(error); }
});
router.get('/task-submissions/:id/file', ...readers, async (req, res, next) => {
  try {
    if (Object.keys(req.query).length) throw invalid('API tải file không nhận query.');
    const file = await readTaskAttachment(positiveId(req.params.id), actor(req));
    res.setHeader('Content-Type', file.MimeType);
    res.setHeader('Content-Disposition', `attachment; filename="task-submission"; filename*=UTF-8''${encodeURIComponent(file.FileName).replace(/'/g, '%27')}`);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.send(file.Content);
  } catch (error) { next(error); }
});
export default router;
