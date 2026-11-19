import { Router,type RequestHandler } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorizeRoles } from '../../middleware/authorize';
import { positiveId,enumValue } from '../students/student.validation';
import { list,resultCsv } from './result.service';
import { publishResults } from './publish.service';
import { scheduleAccountEmailDelivery } from '../../jobs/provisioning';
const router=Router();
const read=[authenticate,authorizeRoles('ADMIN','OJT_COORD','ACADEMIC')];
const handle=(work:(req:any)=>Promise<unknown>,status=200):RequestHandler=>async(req,res,next)=>{
  try{res.status(status).json({success:true,data:await work(req)});}catch(error){next(error);}
};
router.post('/ojt-results/publish',authenticate,authorizeRoles('ADMIN','OJT_COORD'),handle(async req=>{
  const result=await publishResults(req.body,req.user);
  if(result.queuedEmails)scheduleAccountEmailDelivery();
  return result;
},202));
router.get('/ojt-results',...read,handle(req=>list(req.query,undefined,false,undefined,undefined,req.user.roleCode==='ACADEMIC')));
router.get('/ojt-semesters/:id/results/export',...read,async(req,res,next)=>{
  try{
    const format=enumValue(req.query.format??'csv',['csv','json','pdf'],'format');
    const data=await list(req.query,positiveId(req.params.id),true,undefined,undefined,req.user!.roleCode==='ACADEMIC');
    if(format==='json'){res.json({success:true,data});return;}
    if (format === 'pdf') {
      const { resultPdf } = await import('./result.pdf.js');
      const semesterId = positiveId(req.params.id);
      const pdf = await resultPdf(data.items, semesterId);
      res.setHeader('Content-Disposition', `attachment; filename="ojt-results-${semesterId}.pdf"`);
      res.type('application/pdf').send(pdf);
      return;
    }
    res.setHeader('Content-Disposition',`attachment; filename="ojt-results-${positiveId(req.params.id)}.csv"`);
    res.type('text/csv; charset=utf-8').send(resultCsv(data.items));
  }catch(error){next(error);}
});
export default router;
