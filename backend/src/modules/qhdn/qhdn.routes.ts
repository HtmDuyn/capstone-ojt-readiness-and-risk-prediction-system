import { Router, type RequestHandler } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorizeRoles } from '../../middleware/authorize';
import { positiveId } from '../students/student.validation';
import { list, details, saveCompany, savePosition } from './catalog.service';
import { coordinate, decision, assign, updateAssignment, assignmentStatus, evaluate } from './workflow.service';

const router = Router();
const read = [authenticate,authorizeRoles('ADMIN','OJT_COORD','ENTERPRISE')];
const staff = [authenticate,authorizeRoles('ADMIN','OJT_COORD')];
const handle = (work: (req: any) => Promise<unknown>, status = 200): RequestHandler => async (req,res,next) => {
  try { res.status(status).json({success:true,data:await work(req)}); } catch (error) { next(error); }
};
for (const [path,resource] of [['companies','companies'],['positions','positions'],['ojt-coordinations','coordinations'],['assignments','assignments'],['internship-evaluations','evaluations']] as const) {
  router.get(`/${path}`,...read,handle(req=>list(resource,req.query,req.user)));
  router.get(`/${path}/:id`,...read,handle(req=>details(resource,positiveId(req.params.id),req.user)));
}
router.post('/companies',...staff,handle(req=>saveCompany(req.body,req.user),201));
router.patch('/companies/:id',...staff,handle(req=>saveCompany(req.body,req.user,positiveId(req.params.id))));
router.post('/positions',...staff,handle(req=>savePosition(req.body,req.user),201));
router.patch('/positions/:id',...staff,handle(req=>savePosition(req.body,req.user,positiveId(req.params.id))));
router.post('/ojt-coordinations',...staff,handle(req=>coordinate(req.body,req.user),201));
router.post('/ojt-coordinations/:id/decision',...read,handle(req=>decision(positiveId(req.params.id),req.body,req.user)));
router.post('/ojt-coordinations/:id/reassign',...staff,handle(req=>coordinate(req.body,req.user,positiveId(req.params.id)),201));
router.post('/assignments',...staff,handle(req=>assign(req.body,req.user),201));
router.patch('/assignments/:id',...staff,handle(req=>updateAssignment(positiveId(req.params.id),req.body,req.user)));
router.patch('/assignments/:id/status',...staff,handle(req=>assignmentStatus(positiveId(req.params.id),req.body,req.user)));
router.put('/assignments/:id/internship-evaluation',...read,handle(req=>evaluate(positiveId(req.params.id),req.body,req.user)));
export default router;
