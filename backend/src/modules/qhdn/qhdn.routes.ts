import { dashboard, report, reportQuery, reportCsv } from './report.service';
import { Router, type RequestHandler } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorizeRoles } from '../../middleware/authorize';
import { positiveId } from '../students/student.validation';
import { list, details, saveCompany } from './catalog.service';
import { coordinate, decision, assign, updateAssignment, assignmentStatus, evaluate } from './workflow.service';
const router=Router();
const staff=[authenticate,authorizeRoles('ADMIN','OJT_COORD')];
const handle=(work:(req:any)=>Promise<unknown>,status=200):RequestHandler=>async(req,res,next)=>{try{res.status(status).json({success:true,data:await work(req)});}catch(error){next(error);}};
for(const [path,resource] of [['companies','companies'],['positions','positions'],['ojt-coordinations','coordinations'],['assignments','assignments'],['internship-evaluations','evaluations']] as const){
  router.get(`/${path}`,...staff,handle(req=>list(resource,req.query,req.user)));
  if(resource==='coordinations'||resource==='evaluations')router.get(`/${path}/:id`,...staff,handle(req=>details(resource,positiveId(req.params.id),req.user)));
}
router.post('/companies',...staff,handle(req=>saveCompany(req.body,req.user),201));
router.patch('/companies/:id',...staff,handle(req=>saveCompany(req.body,req.user,positiveId(req.params.id))));
router.post('/ojt-coordinations',...staff,handle(req=>coordinate(req.body,req.user),201));
router.post('/ojt-coordinations/:id/decision',...staff,handle(req=>decision(positiveId(req.params.id),req.body,req.user)));
router.post('/ojt-coordinations/:id/reassign',...staff,handle(req=>coordinate(req.body,req.user,positiveId(req.params.id)),201));
router.post('/assignments',...staff,handle(req=>assign(req.body,req.user),201));
router.patch('/assignments/:id',...staff,handle(req=>updateAssignment(positiveId(req.params.id),req.body,req.user)));
router.patch('/assignments/:id/status',...staff,handle(req=>assignmentStatus(positiveId(req.params.id),req.body,req.user)));
router.put('/assignments/:id/internship-evaluation',...staff,handle(req=>evaluate(positiveId(req.params.id),req.body,req.user)));
router.get('/qhdn/dashboard',...staff,handle(req=>dashboard(req.query,req.user)));
for(const type of ['acceptance','internships','enterprise-feedback'] as const){
  router.get('/qhdn/reports/'+type,...staff,handle(req=>report(type,req.query,req.user)));
}
router.get('/qhdn/reports/export',...staff,async(req,res,next)=>{
  try{
    const {type,format}=reportQuery(req.query,'export');
    const data=await report(type!,req.query,{userId:req.user!.userId,roleCode:req.user!.roleCode!},true);
    if(format==='json'){res.json({success:true,data});return;}
    res.setHeader('Content-Disposition',`attachment; filename="qhdn-${type}-report.csv"`);
    res.type('text/csv; charset=utf-8').send(reportCsv(type!,data.items));
  }catch(error){next(error);}
});
export default router;
