import { resultPdf } from './result.pdf';
import { Router,type RequestHandler } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorizeRoles } from '../../middleware/authorize';
import { positiveId,enumValue } from '../students/student.validation';
import { list,change,transfer,resultCsv } from './result.service';
const router=Router();
const academic=[authenticate,authorizeRoles('ADMIN','ACADEMIC')];
const read=[authenticate,authorizeRoles('ADMIN','ACADEMIC','OJT_COORD')];
const coord=[authenticate,authorizeRoles('ADMIN','OJT_COORD')];
const handle=(work:(req:any)=>Promise<unknown>,status=200):RequestHandler=>async(req,res,next)=>{
  try{res.status(status).json({success:true,data:await work(req)});}catch(error){next(error);}
};
router.get('/ojt-results',...read,handle(req=>list(req.query)));
router.post('/ojt-results',...coord,handle(req=>transfer(req.body,req.user.userId),201));
router.post('/ojt-results/:id/transfer',...coord,handle(req=>transfer(req.body,req.user.userId,positiveId(req.params.id))));
router.post('/ojt-results/:id/revision-requests',...academic,handle(req=>change(positiveId(req.params.id),req.body,req.user.userId,'REVISION_REQUESTED'),201));
router.patch('/ojt-results/:id',...academic,handle(req=>change(positiveId(req.params.id),req.body,req.user.userId,'UPDATED')));
router.post('/ojt-results/:id/confirm',...academic,handle(req=>change(positiveId(req.params.id),req.body,req.user.userId,'CONFIRMED')));
router.get('/ojt-semesters/:id/results/export',...read,async(req,res,next)=>{
  try{
    const format=enumValue(req.query.format??'csv',['csv','json','pdf'],'format');
    const data=await list(req.query,positiveId(req.params.id),true);
    if(format==='json'){res.json({success:true,data});return;}
    if(format==='pdf'){const pdf=await resultPdf(data.items,positiveId(req.params.id));res.setHeader('Content-Disposition',`attachment; filename="ojt-results-${positiveId(req.params.id)}.pdf"`);res.type('application/pdf').send(pdf);return;}
    res.setHeader('Content-Disposition',`attachment; filename="ojt-results-${positiveId(req.params.id)}.csv"`);
    res.type('text/csv; charset=utf-8').send(resultCsv(data.items));
  }catch(error){next(error);}
});
export default router;
