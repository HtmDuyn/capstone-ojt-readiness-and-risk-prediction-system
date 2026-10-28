import { Router, type RequestHandler } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorizeRoles } from '../../middleware/authorize';
import { positiveId } from '../students/student.validation';
import { enterpriseProfile, enterpriseCandidates, enterpriseInternships, enterpriseCandidateCV } from './enterprise.service';
import { decision, evaluate } from './workflow.service';
import { assignTasks } from './task.service';

const router = Router();
router.use(authenticate, authorizeRoles('ENTERPRISE'));
const handle = (work: (req: any) => Promise<unknown>): RequestHandler => async (req,res,next) => {
  try { res.json({success:true,data:await work(req)}); } catch(error) { next(error); }
};
router.get('/profile',handle(req=>enterpriseProfile(req.user)));
router.post('/tasks/bulk',handle(req=>assignTasks(req.body,req.user)));
router.get('/candidates',handle(req=>enterpriseCandidates(req.query,req.user)));
router.get('/candidates/:id/cv',async(req,res,next)=>{try{
  const file=await enterpriseCandidateCV(positiveId(req.params.id),{userId:req.user!.userId,roleCode:'ENTERPRISE'});
  res.setHeader('Content-Disposition',`attachment; filename="cv.pdf"; filename*=UTF-8''${encodeURIComponent(file.FileName).replace(/'/g,'%27')}`);
  res.setHeader('Cache-Control','private, no-store');res.setHeader('X-Content-Type-Options','nosniff');res.type(file.MimeType).send(file.Content);
}catch(error){next(error);}});
router.patch('/candidates/:id/decision',handle(req=>decision(positiveId(req.params.id),req.body,req.user)));
router.get('/internships',handle(req=>enterpriseInternships(req.query,req.user)));
router.put('/internships/:id/evaluation',handle(req=>evaluate(positiveId(req.params.id),req.body,req.user)));
export default router;
