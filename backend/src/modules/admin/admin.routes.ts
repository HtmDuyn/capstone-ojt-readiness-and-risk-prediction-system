import { Router, type RequestHandler } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorizeRoles } from '../../middleware/authorize';
import { positiveId, invalid } from '../students/student.validation';
import { saveCompany } from './catalog.service';
import { auditLogs } from './monitoring.service';
import { systemDashboard } from './reporting.service';

const router=Router();
const admin=[authenticate,authorizeRoles('ADMIN')];
const handle=(work:(req:any)=>Promise<unknown>,status=200,message?:string):RequestHandler=>async(req,res,next)=>{
 try{const data=await work(req);if(status===204){res.status(204).end();return;}res.status(status).json({success:true,...(message?{message}:{}),data});}catch(error){next(error);}
};
router.post('/admin/dashboard',...admin,handle(r=>{
 if(!r.body||typeof r.body!=='object'||Array.isArray(r.body)||Object.keys(r.query).length)throw invalid('Provide dashboard filters in a JSON object body; query parameters are not accepted.');
 return systemDashboard(r.body);
}));
router.patch('/companies/:id',...admin,handle(r=>saveCompany(r.body,r.user.userId,positiveId(r.params.id))));
router.post('/admin/audit-logs/list',...admin,handle(r=>{if(!r.body||typeof r.body!=='object'||Array.isArray(r.body)||Object.keys(r.query).length)throw invalid('Provide audit log filters in a JSON object body; query parameters are not accepted.');return auditLogs(r.body);}));
export default router;
