import { updateEnterpriseProfile } from './enterprise-profile.service';
import { Router, type RequestHandler } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorizeRoles } from '../../middleware/authorize';
import { positiveId } from '../students/student.validation';
import { enterpriseProfile, enterpriseCandidates, enterpriseCandidatePeriods, enterpriseInternships } from './enterprise.service';
import { decision, evaluate } from '../qhdn/workflow.service';
import { enterpriseWindows, enterprisePosts, saveEnterprisePost } from './enterprise-recruitment.service';
import { startEnterpriseRecruitmentWorker } from './enterprise-recruitment.worker';
import { assignTasks } from '../qhdn/task.service';

const router = Router();
startEnterpriseRecruitmentWorker();
router.use(authenticate, authorizeRoles('ENTERPRISE'));
const handle = (work: (req: any) => Promise<unknown>, status = 200): RequestHandler => async (req,res,next) => {
  try { res.status(status).json({success:true,data:await work(req)}); } catch(error) { next(error); }
};
router.get('/profile',handle(req=>enterpriseProfile(req.user)));
router.patch('/profile',handle(req=>updateEnterpriseProfile(req.body,req.user)));
router.get('/recruitment/windows',handle(req=>enterpriseWindows(req.query,req.user)));
router.get('/recruitment/posts',handle(req=>enterprisePosts(req.query,req.user)));
router.post('/recruitment/posts',handle(req=>saveEnterprisePost(req.body,req.user),201));
router.patch('/recruitment/posts/:id',handle(req=>saveEnterprisePost(req.body,req.user,positiveId(req.params.id))));
router.post('/tasks/bulk',handle(req=>assignTasks(req.body,req.user)));
router.get('/candidate-periods',handle(req=>enterpriseCandidatePeriods(req.user)));
router.get('/candidates',handle(req=>enterpriseCandidates(req.query,req.user)));
router.patch('/candidates/:id/decision',handle(req=>decision(positiveId(req.params.id),req.body,req.user)));
router.get('/internships',handle(req=>enterpriseInternships(req.query,req.user)));
router.put('/internships/:id/evaluation',handle(req=>evaluate(positiveId(req.params.id),req.body,req.user)));
export default router;
