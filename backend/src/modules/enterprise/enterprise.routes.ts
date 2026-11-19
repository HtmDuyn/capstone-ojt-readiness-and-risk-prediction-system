import { updateEnterpriseProfile } from './enterprise-profile.service';
import { Router, type RequestHandler } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorizeRoles } from '../../middleware/authorize';
import { positiveId } from '../students/student.validation';
import { enterpriseProfile, enterpriseCandidates, enterpriseCandidatePeriods, enterpriseInternships, enterpriseCandidateCV } from './enterprise.service';
import { decision, evaluate } from '../qhdn/workflow.service';
import { bulkAcceptance } from './bulk-acceptance.service';
import { bulkEvaluate } from './bulk-evaluation.service';
import { enterpriseWindows, enterprisePosts, saveEnterprisePost, deleteEnterprisePost } from './enterprise-recruitment.service';
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
router.get('/recruitment/deleted-posts',handle(req=>enterprisePosts(req.query,req.user,true)));
router.post('/recruitment/posts',handle(req=>saveEnterprisePost(req.body,req.user),201));
router.patch('/recruitment/posts/:id',handle(req=>saveEnterprisePost(req.body,req.user,positiveId(req.params.id))));
router.post('/recruitment/posts/:id/publish',handle(req=>saveEnterprisePost({status:'PUBLISHED'},req.user,positiveId(req.params.id))));
router.delete('/recruitment/posts/:id',handle(req=>deleteEnterprisePost(positiveId(req.params.id),req.user)));
router.post('/tasks/bulk',handle(req=>assignTasks(req.body,req.user)));
router.get('/candidate-periods',handle(req=>enterpriseCandidatePeriods(req.user)));
router.get('/candidates',handle(req=>enterpriseCandidates(req.query,req.user)));
router.get('/candidates/:id/cv', async (req,res,next) => {
  try {
    const file = await enterpriseCandidateCV(positiveId(req.params.id), { userId: req.user!.userId, roleCode: 'ENTERPRISE' });
    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Disposition',`inline; filename="cv.pdf"; filename*=UTF-8''${encodeURIComponent(file.FileName).replace(/'/g,'%27')}`);
    res.setHeader('Cache-Control','private, no-store');
    res.setHeader('X-Content-Type-Options','nosniff');
    res.send(file.Content);
  } catch (error) { next(error); }
});
router.post('/candidates/acceptance-preview',handle(req=>bulkAcceptance(req.body,req.user)));
router.post('/candidates/accept-bulk',handle(req=>bulkAcceptance(req.body,req.user,true)));
router.patch('/candidates/:id/decision',handle(req=>decision(positiveId(req.params.id),req.body,req.user)));
router.get('/internships',handle(req=>enterpriseInternships(req.query,req.user)));
router.post('/internships/evaluations/bulk',handle(req=>bulkEvaluate(req.body,req.user)));
router.put('/internships/:id/evaluation',handle(req=>evaluate(positiveId(req.params.id),req.body,req.user)));
export default router;
