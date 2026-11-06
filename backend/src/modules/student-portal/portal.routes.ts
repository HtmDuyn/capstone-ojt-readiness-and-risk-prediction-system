import { Router, type RequestHandler } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorizeRoles } from '../../middleware/authorize';
import { requireJsonBody } from '../../middleware/json-body';
import { inputObject, invalid, positiveId } from '../students/student.validation';
import { dashboard,internships } from './overview.service';
import { applyToPosition, studentOpportunities } from '../students/job-application.service';
import { notifications, readNotification } from './academic.service';
import { roadmap } from './cv.service';
import { ojtAdvice } from './ojt-advice.service';
import { readiness,studentAcademicWarning } from './readiness.service';
import { academicChat } from './academic-chat.service';
import { courseAdvice } from './ojt-advice.service';
import { courseScenario } from './course-scenario.service';
import { analyzeCurrentCv,matchingProfile,updateMatchingProfile } from './cv-extraction.service';
import { taskSubmissions, submitTask } from './task.service';

const router = Router();
const own = [authenticate, authorizeRoles('STUDENT')];
const read = own;
const handle = (work: (req: any) => Promise<unknown>, status = 200): RequestHandler => async (req, res, next) => {
  try { res.status(status).json({success: true, data: await work(req)}); } catch (error) { next(error); }
};
// These routes precede /students/:id; "me" is resolved from the authenticated account.
router.post('/students/me/cv/analyses', ...own, requireJsonBody, handle(r => analyzeCurrentCv(r.body,r.user)));
router.get('/students/me/matching-profile', ...read, handle(r => {
  if(Object.keys(r.query).length)throw invalid('This endpoint does not accept query parameters.');
  return matchingProfile(r.user);
}));
router.patch('/students/me/matching-profile', ...own, requireJsonBody, handle(r => updateMatchingProfile(r.body,r.user)));
router.get('/students/me/academic-warning', ...read, handle(r => {
  if(Object.keys(r.query).length)throw invalid('This endpoint does not accept query parameters.');
  return studentAcademicWarning(r.user);
}));
router.post('/students/me/course-impact', ...own, requireJsonBody, handle(r => courseScenario(r.body,r.user,'IMPACT')));
router.post('/students/me/study-simulation', ...own, requireJsonBody, handle(r => courseScenario(r.body,r.user,'SIMULATION')));
router.post('/students/me/course-advice', ...own, requireJsonBody, handle(r => {
  if(Object.keys(r.body).length)throw invalid('Send an empty JSON object; course advice uses your academic records.');
  return courseAdvice(r.user);
}));
router.post('/students/me/academic-chat', ...own, requireJsonBody, handle(r => academicChat(r.body,r.user)));
router.get('/students/me/ojt-readiness', ...read, handle(r => {
  if(Object.keys(r.query).length)throw invalid('This endpoint does not accept query parameters.');
  return readiness(r.user);
}));
router.post('/students/me/ojt-advice', ...own, requireJsonBody, handle(r => {
  if(Object.keys(r.query).length)throw invalid('This endpoint does not accept query parameters. Send ojtSemesterId in the JSON body.');
  const body=inputObject(r.body,['ojtSemesterId']);
  return ojtAdvice(positiveId(body.ojtSemesterId,'ojtSemesterId'),r.user);
}));
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
router.get('/students/me/tasks', ...read, handle(async r => {
  const query = r.query;
  for (const key of Object.keys(query)) if (!['ojtSemesterId','page','limit'].includes(key)) throw invalid('Unknown task parameter: ' + key);
  return (await internships({ ojtSemesterId: positiveId(query.ojtSemesterId, 'ojtSemesterId'),
    tasksPage: query.page, tasksLimit: query.limit }, r.user)).tasks;
}));
router.get('/students/me/tasks/:id/submissions', ...read, handle(r => taskSubmissions(positiveId(r.params.id, 'taskId'), r.query, r.user)));
router.post('/students/me/tasks/:id/submissions', ...own, requireJsonBody, handle(r => {
  if (Object.keys(r.query).length) throw invalid('Send submission fields in the JSON body.');
  return submitTask(positiveId(r.params.id, 'taskId'), r.body, r.user);
}, 201));
router.get('/students/me/opportunities', ...read, handle(r => studentOpportunities(r.query, r.user)));
router.get('/students/me/dashboard', ...read, handle(r => dashboard(r.query,r.user)));
router.post('/job-applications', ...own, requireJsonBody, handle(r => applyToPosition(r.body, r.user), 201));

export default router;
