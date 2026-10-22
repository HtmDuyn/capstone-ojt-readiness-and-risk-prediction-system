import { updateEnterpriseProfile } from './enterprise-profile.service';
import { Router, type RequestHandler } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorizeRoles } from '../../middleware/authorize';
import { positiveId } from '../students/student.validation';
import { enterpriseProfile, enterpriseCandidates, enterpriseInternships } from './enterprise.service';
import { decision, evaluate } from './workflow.service';
import { assignTasks } from './task.service';

const router = Router();
router.use(authenticate, authorizeRoles('ENTERPRISE'));
const handle = (work: (req: any) => Promise<unknown>): RequestHandler => async (req,res,next) => {
  try { res.json({success:true,data:await work(req)}); } catch(error) { next(error); }
};
router.get('/profile',handle(req=>enterpriseProfile(req.user)));
router.patch('/profile',handle(req=>updateEnterpriseProfile(req.body,req.user)));
router.post('/tasks/bulk',handle(req=>assignTasks(req.body,req.user)));
router.get('/candidates',handle(req=>enterpriseCandidates(req.query,req.user)));
router.patch('/candidates/:id/decision',handle(req=>decision(positiveId(req.params.id),req.body,req.user)));
router.get('/internships',handle(req=>enterpriseInternships(req.query,req.user)));
router.put('/internships/:id/evaluation',handle(req=>evaluate(positiveId(req.params.id),req.body,req.user)));
export default router;
