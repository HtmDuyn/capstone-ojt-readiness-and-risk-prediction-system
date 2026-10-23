import { Router, type RequestHandler } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorizeRoles } from '../../middleware/authorize';
import { positiveId, inputObject, invalid } from '../students/student.validation';
import { csv } from './admin.repository';
import { saveCompany, softDelete } from './catalog.service';
import { deleteStudent, exportStudents } from './student-admin.service';
import { saveAssignment } from './assignment.service';
import { auditLogs } from './monitoring.service';
import { systemDashboard } from './reporting.service';

const router=Router();
const admin=[authenticate,authorizeRoles('ADMIN')];
const useAdminHandlerOnShared: RequestHandler = (req,_res,next) => {
  if (req.user?.roleCode === 'ADMIN') return next();
  return next('route');
};
const adminForShared = [
  authenticate,
  useAdminHandlerOnShared,
  authorizeRoles('ADMIN')
];

const handle=(work:(req:any)=>Promise<unknown>,status=200,message?:string):RequestHandler=>async(req,res,next)=>{
 try{const data=await work(req);if(status===204){res.status(204).end();return;}res.status(status).json({success:true,...(message?{message}:{}),data});}catch(error){next(error);}
};
const deletionId=(req:any,field:string)=>{
 if(Object.keys(req.query).length)throw invalid('Provide '+field+' in the JSON body, not query parameters.');
 return positiveId(inputObject(req.body,[field])[field],field);
};
router.post('/admin/dashboard',...admin,handle(r=>{
 if(!r.body||typeof r.body!=='object'||Array.isArray(r.body)||Object.keys(r.query).length)throw invalid('Provide dashboard filters in a JSON object body; query parameters are not accepted.');
 return systemDashboard(r.body);
}));
// Must be mounted before existing /students/:id.
router.post('/students/export',...admin,async(req,res,next)=>{try{if(!req.body||typeof req.body!=='object'||Array.isArray(req.body)||Object.keys(req.query).length)throw invalid('Provide export filters in a JSON object body; query parameters are not accepted.');const rows=await exportStudents(req.body);res.attachment('students.csv').type('text/csv; charset=utf-8').send(csv(rows,['id','studentCode','fullName','email','programId','cohortId','groupCode','className','status']));}catch(error){next(error);}});
router.delete('/students',...admin,handle(r=>deleteStudent(deletionId(r,'studentId'),r.user.userId),200,'Xóa hồ sơ sinh viên thành công.'));
router.patch('/companies/:id',...adminForShared,handle(r=>saveCompany(r.body,r.user.userId,positiveId(r.params.id))));
router.delete('/companies',...admin,handle(r=>softDelete('companies',deletionId(r,'companyId'),r.user.userId),200,'Xóa doanh nghiệp thành công.'));
router.delete('/positions',...admin,handle(r=>softDelete('positions',deletionId(r,'positionId'),r.user.userId),200,'Xóa vị trí thực tập thành công.'));
router.post('/assignments',...adminForShared,handle(r=>saveAssignment(r.body,r.user.userId),201));
router.patch('/assignments/:id',...adminForShared,handle(r=>saveAssignment(r.body,r.user.userId,positiveId(r.params.id))));
router.post('/admin/audit-logs/list',...admin,handle(r=>{if(!r.body||typeof r.body!=='object'||Array.isArray(r.body)||Object.keys(r.query).length)throw invalid('Provide audit log filters in a JSON object body; query parameters are not accepted.');return auditLogs(r.body);}));
export default router;
