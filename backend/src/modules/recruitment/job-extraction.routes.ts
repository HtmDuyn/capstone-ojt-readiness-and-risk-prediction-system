import { Router, type RequestHandler } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorizeRoles } from '../../middleware/authorize';
import { invalid, positiveId } from '../students/student.validation';
import { getJobExtraction, queueJobExtraction } from './job-extraction.service';

const router = Router();
router.use(authenticate, authorizeRoles('ADMIN', 'OJT_COORD'));
const handle = (queue: boolean): RequestHandler => async (req, res, next) => {
  try {
    if (Object.keys(req.query).length) throw invalid('Endpoint không nhận query parameters.');
    if (queue && req.body !== undefined && (req.body === null || typeof req.body !== 'object'
      || Array.isArray(req.body) || Object.keys(req.body).length > 0)) {
      throw invalid('Gửi body rỗng {} hoặc không gửi body.');
    }
    const id = positiveId(req.params.postId, 'postId');
    const actor = { userId: req.user!.userId, roleCode: req.user!.roleCode ?? '' };
    const data = await (queue ? queueJobExtraction(id, actor) : getJobExtraction(id, actor));
    res.status(queue ? 202 : 200).json({ success: true, data });
  } catch (error) { next(error); }
};
router.get('/:postId', handle(false));
router.post('/:postId/analyze', handle(true));
export default router;
