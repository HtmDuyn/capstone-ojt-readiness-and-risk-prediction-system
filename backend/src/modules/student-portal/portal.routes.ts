import { Router, type RequestHandler } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorizeRoles } from '../../middleware/authorize';
import { requireJsonBody } from '../../middleware/json-body';
import { inputObject, invalid, positiveId } from '../students/student.validation';
import { dashboard,internships } from './overview.service';
import { applyToPosition, studentOpportunities } from '../students/job-application.service';
import { notifications, readNotification } from './academic.service';
import { roadmap } from './cv.service';
import { ownTasks, submitTask, taskSubmissions } from './task-submission.service';

const router = Router();
const own = [authenticate, authorizeRoles('STUDENT')];
const read = own;
const handle = (work: (req: any) => Promise<unknown>, status = 200): RequestHandler => async (req, res, next) => {
  try { res.status(status).json({success: true, data: await work(req)}); } catch (error) { next(error); }
};
// These routes precede /students/:id; "me" is resolved from the authenticated account.
router.get('/students/me/roadmap-recommendations', ...read, handle(r => {
  inputObject(r.query, ['ojtSemesterId']);
  return roadmap(positiveId(r.query.ojtSemesterId, 'ojtSemesterId'), r.user);
}));
router.get('/students/me/notifications', ...read, handle(r => notifications(r.query, r.user)));
router.patch('/students/me/notifications/:id', ...own, requireJsonBody, handle(r => {
  const body = inputObject(r.body, ['isRead']);
  if (typeof body.isRead !== 'boolean') throw invalid('isRead must be boolean.');
  return readNotification(positiveId(r.params.id), r.user, body.isRead);
}));
router.get('/students/me/internships', ...read, handle(r => internships(r.query,r.user)));
router.get('/students/me/tasks', ...read, handle(r => ownTasks(r.query, r.user)));
router.get('/students/me/tasks/:id/submissions', ...read, handle(r => taskSubmissions(positiveId(r.params.id), r.query, r.user)));
router.post('/students/me/tasks/:id/submissions', ...own, requireJsonBody, handle(r => submitTask(positiveId(r.params.id), r.body, r.user), 201));
router.get('/students/me/opportunities', ...read, handle(r => studentOpportunities(r.query, r.user)));
router.get('/students/me/dashboard', ...read, handle(r => dashboard(r.query,r.user)));
router.post('/job-applications', ...own, requireJsonBody, handle(r => applyToPosition(r.body, r.user), 201));

export default router;
